/* 아기 정보용 정적 데이터: 별자리 · 탄생석 · 띠 · 월별 탄생화 · 일기 태그/기분 */

var CONSTELLATIONS = [
  { name: '염소자리', symbol: '♑', start: [12, 22], end: [1, 19], note: '묵묵히 목표를 향해 걷는, 책임감이 큰 아이' },
  { name: '물병자리', symbol: '♒', start: [1, 20], end: [2, 18], note: '엉뚱한 상상과 호기심이 가득한 아이' },
  { name: '물고기자리', symbol: '♓', start: [2, 19], end: [3, 20], note: '마음이 여리고 공감이 깊은 아이' },
  { name: '양자리', symbol: '♈', start: [3, 21], end: [4, 19], note: '용감하고 앞장서는 에너지가 넘치는 아이' },
  { name: '황소자리', symbol: '♉', start: [4, 20], end: [5, 20], note: '느긋하고 정이 많으며 감각이 좋은 아이' },
  { name: '쌍둥이자리', symbol: '♊', start: [5, 21], end: [6, 21], note: '말과 웃음이 재미있는 사교적인 아이' },
  { name: '게자리', symbol: '♋', start: [6, 22], end: [7, 22], note: '가족을 아끼고 포근한 정이 많은 아이' },
  { name: '사자자리', symbol: '♌', start: [7, 23], end: [8, 22], note: '당당하고 따뜻하며 칭찬을 좋아하는 아이' },
  { name: '처녀자리', symbol: '♍', start: [8, 23], end: [9, 22], note: '섬세하고 관찰이 빠른 아이' },
  { name: '천칭자리', symbol: '♎', start: [9, 23], end: [10, 22], note: '균형과 배려를 좋아하는 다정한 아이' },
  { name: '전갈자리', symbol: '♏', start: [10, 23], end: [11, 22], note: '한 가지에 깊이 빠지는 몰입형 아이' },
  { name: '사수자리', symbol: '♐', start: [11, 23], end: [12, 21], note: '밖으로 나가기를 좋아하는 자유로운 아이' }
];

var BIRTHSTONES = {
  1: { name: '석류석', en: 'Garnet', color: '#9E2B3E', meaning: '진실·우정·충실' },
  2: { name: '자수정', en: 'Amethyst', color: '#8E6BB5', meaning: '평화·성실·마음의 안정' },
  3: { name: '아쿠아마린', en: 'Aquamarine', color: '#6FC3D0', meaning: '용기·총명·젊음' },
  4: { name: '다이아몬드', en: 'Diamond', color: '#BFD8E8', meaning: '영원한 사랑·순결' },
  5: { name: '에메랄드', en: 'Emerald', color: '#3F9C6A', meaning: '행복·행운·희망' },
  6: { name: '진주', en: 'Pearl', color: '#EFE3D6', meaning: '순수·건강·부귀' },
  7: { name: '루비', en: 'Ruby', color: '#C9384E', meaning: '열정·사랑·생명력' },
  8: { name: '페리도트', en: 'Peridot', color: '#9BBE4A', meaning: '화합·부부애·행운' },
  9: { name: '사파이어', en: 'Sapphire', color: '#3B5BA9', meaning: '성실·지혜·진실' },
  10: { name: '오팔 · 투어멀린', en: 'Opal / Tourmaline', color: '#D9A6B8', meaning: '희망·평온·인내' },
  11: { name: '토파즈', en: 'Topaz', color: '#E0A44A', meaning: '희망·우정·풍요' },
  12: { name: '터키석', en: 'Turquoise', color: '#4FB8B0', meaning: '성공·행운·건강' }
};

var MONTH_FLOWERS = {
  1: { name: '카네이션', meaning: '사랑, 매력, 특별함, 어머니의 사랑' },
  2: { name: '제비꽃 (또는 아이리스)', meaning: '신의, 지혜, 희망, 진실한 사랑' },
  3: { name: '수선화', meaning: '봄, 부활, 새로운 시작, 가정의 행복' },
  4: { name: '스위트피', meaning: '사랑, 젊음, 순결, 기쁨, 감사' },
  5: { name: '은방울꽃', meaning: '순결, 행복의 반환, 섬세함, 감사' },
  6: { name: '장미', meaning: '사랑, 열정, 감사, 아름다움 (색에 따라 다름)' },
  7: { name: '델피늄', meaning: '우직함, 열정, 청순한 마음' },
  8: { name: '글라디올러스', meaning: '의지의 힘, 명예, 기억, 위로' },
  9: { name: '아스터 (또는 물망초)', meaning: '인내, 우아함, 기억, 깊은 사랑' },
  10: { name: '금잔화', meaning: '맹렬함, 우아함, 헌신, 조화' },
  11: { name: '국화', meaning: '연민, 우정, 기쁨, 고결' },
  12: { name: '포인세티아', meaning: '축복, 성공, 특별함, 용기, 희망' }
};

/* 12지신: (연도 - 4) % 12 순서 */
var ZODIAC_ANIMALS = [
  { name: '쥐', emoji: '🐭', hanja: '子', note: '영리하고 재치 있는' },
  { name: '소', emoji: '🐮', hanja: '丑', note: '우직하고 성실한' },
  { name: '호랑이', emoji: '🐯', hanja: '寅', note: '씩씩하고 용감한' },
  { name: '토끼', emoji: '🐰', hanja: '卯', note: '온화하고 섬세한' },
  { name: '용', emoji: '🐲', hanja: '辰', note: '기상천외하고 큰 뜻을 품은' },
  { name: '뱀', emoji: '🐍', hanja: '巳', note: '지혜롭고 신중한' },
  { name: '말', emoji: '🐴', hanja: '午', note: '활발하고 자유로운' },
  { name: '양', emoji: '🐑', hanja: '未', note: '따뜻하고 배려 깊은' },
  { name: '원숭이', emoji: '🐵', hanja: '申', note: '재주 많고 호기심 많은' },
  { name: '닭', emoji: '🐔', hanja: '酉', note: '부지런하고 꼼꼼한' },
  { name: '개', emoji: '🐶', hanja: '戌', note: '의리 있고 정직한' },
  { name: '돼지', emoji: '🐷', hanja: '亥', note: '복 많고 넉넉한' }
];

var GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
var JI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

/* 60갑자 이름: 2026년은 병오년 */
function ganjiOfYear(year) {
  const g = ((year - 4) % 10 + 10) % 10;
  const j = ((year - 4) % 12 + 12) % 12;
  return GAN[g] + JI[j] + '년';
}

var MOODS = {
  happy: { emoji: '😊', label: '방긋방긋' },
  sleepy: { emoji: '😴', label: '쿨쿨 잠' },
  cry: { emoji: '😢', label: '칭얼칭얼' },
  feed: { emoji: '🍼', label: '맛있게 수유' },
  play: { emoji: '🧸', label: '신나게 놀이' },
  special: { emoji: '🎉', label: '특별한 날' }
};

var TAGS = ['첫웃음', '첫뒤집기', '첫이유식', '예방접종', '병원', '외출', '목욕', '밤샘', '사진찍기', '할머니·할아버지'];
