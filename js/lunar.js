(function (global) {
  'use strict';

  /*
   * 한국천문연구원(KARI) 음양력 자료 기반 음력 데이터 (1900 ~ 2050)
   * 각 값은 한 해의 음력 월 정보를 담는다.
   *   0x8000 ~ 0x10 : 1월 ~ 12월의 크기 (비트가 1이면 30일, 0이면 29일)
   *   0x000F        : 윤달이 있는 달 (0이면 윤달 없음)
   *   0x10000       : 윤달의 크기 (1이면 30일, 0이면 29일)
   * 값은 KARI 음양력 데이터에서 생성했으며, 1900-01-31 ~ 2050-12-31 전 날짜를
   * KARI 변환 결과와 대조해 검증했다.
   */
  const LUNAR_INFO = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x0da95,0x0b550,0x056a0,0x0ada2,0x095d0,0x04bb7,
    0x049b0,0x0a4b0,0x0b4b5,0x06a90,0x0ad40,0x0bb54,0x02b60,0x095b0,0x05372,0x04970,
    0x06566,0x0e4a0,0x0ea50,0x16a95,0x05b50,0x02b60,0x18ae3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b690,0x056d0,0x125b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0d557,
    0x0b4a0,0x0b550,0x15555,0x04db0,0x025b0,0x18573,0x052b0,0x0a9b8,0x06950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05270,0x07263,0x0d950,0x06b57,0x056a0,
    0x09ad0,0x04dd5,0x04ae0,0x0a4e0,0x0d4d4,0x0d250,0x0d598,0x0b540,0x0d6a0,0x195a6,
    0x095b0,0x049b0,0x0a9b4,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0b756,0x02b60,0x095b0,
    0x04b75,0x04970,0x064b0,0x074a3,0x0ea50,0x06d98,0x05ad0,0x02b60,0x096e5,0x092e0,
    0x0c960,0x0e954,0x0d4a0,0x0da50,0x07552,0x056c0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x1b4a3,0x0b550,0x055d9,0x04ba0,0x0a5b0,0x05575,0x052b0,0x0a950,
    0x0b954,0x06aa0,0x0ad50,0x06b52,0x04b60,0x0a6e6,0x0a570,0x05270,0x06a65,0x0d930,
    0x05aa0,0x0b6a3,0x096d0,0x04afb,0x04ae0,0x0a4d0,0x1d0d6,0x0d250,0x0d520,0x0dd45,
    0x0b6a0,0x096d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0b250,0x1b255,0x06d40,0x0ada0,
    0x18b63
  ];

  const MIN_YEAR = 1900;
  const MAX_YEAR = 2050;
  const BASE_UTC = Date.UTC(1900, 0, 31); // 음력 1900년 1월 1일
  const MAX_SOLAR_UTC = Date.UTC(2050, 11, 31); // KARI 자료가 있는 마지막 양력 날짜
  const DAY = 86400000;

  function leapMonth(y) { return LUNAR_INFO[y - MIN_YEAR] & 0xf; }
  function leapDays(y) {
    if (!leapMonth(y)) return 0;
    return (LUNAR_INFO[y - MIN_YEAR] & 0x10000) ? 30 : 29;
  }
  function monthDays(y, m) {
    return (LUNAR_INFO[y - MIN_YEAR] & (0x10000 >> m)) ? 30 : 29;
  }
  function yearDays(y) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      if (LUNAR_INFO[y - MIN_YEAR] & i) sum += 1;
    }
    return sum + leapDays(y);
  }

  /** 양력 -> 음력. 범위를 벗어나면 null */
  function solarToLunar(y, m, d) {
    const utc = Date.UTC(y, m - 1, d);
    if (utc < BASE_UTC || utc > MAX_SOLAR_UTC) return null;
    let off = Math.round((utc - BASE_UTC) / DAY);
    let ly = MIN_YEAR;
    while (ly <= MAX_YEAR) {
      const yd = yearDays(ly);
      if (off < yd) break;
      off -= yd;
      ly += 1;
    }
    if (ly > MAX_YEAR) return null;
    const lm = leapMonth(ly);
    let mm = 1;
    while (mm <= 12) {
      const md = monthDays(ly, mm);
      if (off < md) return { y: ly, m: mm, d: off + 1, leap: false };
      off -= md;
      if (lm === mm) {
        const ld = leapDays(ly);
        if (off < ld) return { y: ly, m: mm, d: off + 1, leap: true };
        off -= ld;
      }
      mm += 1;
    }
    return null;
  }

  /** 음력 -> 양력. 범위를 벗어나거나 없는 날짜면 null */
  function lunarToSolar(y, m, d, leap) {
    if (y < MIN_YEAR || y > MAX_YEAR || m < 1 || m > 12 || d < 1) return null;
    if (leap && leapMonth(y) !== m) return null;
    let off = 0;
    for (let yy = MIN_YEAR; yy < y; yy += 1) off += yearDays(yy);
    const lm = leapMonth(y);
    for (let mm = 1; mm < m; mm += 1) {
      off += monthDays(y, mm);
      if (lm === mm) off += leapDays(y);
    }
    if (leap) off += monthDays(y, m);
    const md = leap ? leapDays(y) : monthDays(y, m);
    if (d > md) return null;
    off += d - 1;
    const utc = BASE_UTC + off * DAY;
    if (utc > MAX_SOLAR_UTC) return null;
    const date = new Date(utc);
    return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
  }

  function hasLeapMonth(y, m) { return leapMonth(y) === m; }

  global.LunarCal = {
    MIN_YEAR: MIN_YEAR,
    MAX_YEAR: MAX_YEAR,
    MIN_SOLAR: { y: 1900, m: 1, d: 31 },
    MAX_SOLAR: { y: 2050, m: 12, d: 31 },
    leapMonth: leapMonth,
    hasLeapMonth: hasLeapMonth,
    monthDays: monthDays,
    solarToLunar: solarToLunar,
    lunarToSolar: lunarToSolar
  };
})(window);
