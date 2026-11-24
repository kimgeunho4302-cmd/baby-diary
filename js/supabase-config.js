/* 우리 아기 육아일기 — Supabase 연결 설정
   동화 50권은 Supabase 의 public.stories 표에서 읽어 옵니다.
   아래 두 값은 공개(anon/publishable) 키라서 앱에 들어 있어도 안전합니다.
   · URL     : Supabase 프로젝트 주소
   · anonKey : 공개 키 (sb_publishable_... 또는 anon public JWT)
   비밀 키(service_role / sb_secret_...)는 절대 넣지 마세요. */
window.BABY_DIARY_SUPABASE = {
  url: 'https://sbsvsnxittwjhoksukod.supabase.co',
  anonKey: 'sb_publishable_9Dvoqayhu5QgQg2mbOuu8A_uRPPDo0p'
};
