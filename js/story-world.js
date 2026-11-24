/* 세계 그림책 — StoryWeaver(storyweaver.org.in) CC BY 4.0 원문을 한국어로 번역해 수록
   · Supabase public.stories 에 같은 id(sw01~sw03)가 있으면 그쪽이 우선입니다.
   · 이미지는 StoryWeaver 원본 URL(https)을 그대로 불러오고, 실패하면 이모지 그림으로 돌아갑니다.
   · 출처·저작자 표시는 각 장면의 attribution 에 들어 있습니다. */
(function () {
  'use strict';
  var BOOKS = [
    {
      id: "sw01", sort: 51, cat: "세계 그림책", age: "3~5세",
      titleKo: "빨간 우비", titleEn: "The Red Raincoat", emoji: "🌧️",
      bg: "linear-gradient(158deg,#eaf3fb 0%,#d7e7f6 55%,#c3d9ef 100%)",
      cover: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/4565/size6/748905bc4d8b1f3b47335c6a42175c78.jpg",
      credit: { title: "The Red Raincoat", author: "Kiran Kasturia", illustrator: "Zainab Tambawalla", translator: "",
                publisher: "Pratham Books", year: 2015, license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
                source: "https://storyweaver.org.in/en/stories/369-the-red-raincoat", modified: "영어 원문을 한국어로 번역해 수록(삽화는 원본 그대로)" },
      pages: [
        { page: 2, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/4566/size6/f7b99013fe950d82797980bb311b1f21.jpg",
          art: "Boy holding a red raincoat and lady talking",
          en: "On Sunday, Manu’s parents got him a red raincoat. “Ma, may I wear it now?” asked Manu. “No, my dear, the rains are near, but just now the sky is clear,” said Ma.",
          ko: "일요일, 마누의 엄마 아빠가 빨간 우비를 사 주셨어요. “엄마, 지금 입어 봐도 돼요?” 마누가 물었어요. “아니란다. 비가 곧 온단다. 지금은 하늘이 맑구나.” 엄마가 말했어요." },
        { page: 3, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/4567/size6/7e2a12330ed1592b38671c8e828f2da2.jpg",
          art: "Boy and lady looking out of the window",
          en: "Monday was bright and sunny. “WILL it rain today, Mummy?” asked Manu. “No Manu, not today. If you wear your raincoat, you will look quite funny!” said Ma.",
          ko: "월요일은 햇살이 환했어요. “엄마, 오늘은 비가 와요?” 마누가 물었어요. “아니야, 마누. 오늘은 안 와. 우비를 입으면 아주 우스워 보일걸?” 엄마가 웃으며 말했어요." },
        { page: 4, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/4568/size6/6307adabee20b8399316a92eefbc18bf.jpg",
          art: "Boy sitting on the stairs of a house with a red raincoat",
          en: "On Tuesday, the sky was blue. “Ma, WHEN will my wish come true?” asked Manu. “Not today, my dear, there is just one white cloud in the sky!” said Ma.",
          ko: "화요일, 하늘은 파랗기만 했어요. “엄마, 내 소원은 언제 이뤄져요?” 마누가 물었어요. “오늘은 아니란다. 하늘에 흰 구름이 딱 하나 있구나!” 엄마가 말했어요." },
        { page: 5, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/4569/size6/f01f672df1b86412b3fe579a438275f1.jpg",
          art: "Boy wearing a red raincoat and sun shining through the window",
          en: "Wednesday was hot. “Ma, WHY doesn’t it rain?” asked Manu. “Son, I think it will rain very soon. Maybe even before it is noon,” said Ma.",
          ko: "수요일은 무더웠어요. “엄마, 왜 비가 안 와요?” 마누가 물었어요. “얘야, 곧 올 것 같구나. 점심 먹기 전에 올지도 모르겠다.” 엄마가 말했어요." },
        { page: 6, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/4570/size6/b5dfd65031a919242817fe3c40e1e99e.jpg",
          art: "Boy holding a red raincoat and looking at the sky",
          en: "On Thursday Manu went on a picnic. “Ma, WHAT if it rains? Shall I take the raincoat with me?” asked Manu. “No my dear, it will not rain today. The little white clouds are too high in the sky,” said Ma.",
          ko: "목요일, 마누는 소풍을 갔어요. “엄마, 비가 오면 어떡해요? 우비 가져갈까요?” 마누가 물었어요. “아니란다. 오늘은 비가 안 와. 작은 흰 구름이 하늘 아주 높이 있단다.” 엄마가 말했어요." },
        { page: 7, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/4571/size6/fd0d16172cabf56c4dae9e901beb9ed5.jpg",
          art: "Boy with red raincoat and peacock looking at cloudy sky",
          en: "Friday was cloudy. “Ma, will it rain today?” asked Manu loudly. “It might, my dear. There are some dark clouds low down in the sky,” said Ma.",
          ko: "금요일은 하늘이 흐렸어요. “엄마, 오늘은 비가 와요?” 마누가 큰 소리로 물었어요. “올지도 모르겠구나. 하늘 낮은 곳에 먹구름이 끼었구나.” 엄마가 말했어요." },
        { page: 8, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/4572/size6/62061ae8ad0aa545b4be6e0fde115128.jpg",
          art: "Boy, snail and frog enjoying the rain",
          en: "Saturday began with a bang! Badaboom! “Ma, is that thunder I hear? Will it rain very soon?” asked Manu.",
          ko: "토요일은 쾅! 하고 시작됐어요. 우르릉 쾅쾅! “엄마, 저게 천둥 소리예요? 곧 비가 와요?” 마누가 물었어요." },
        { page: 9, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/4573/size6/794aa14345a2a3859d25cc4de8c14f86.jpg",
          art: "Boy and frog enjoying the rain",
          en: "And then at last, it started raining! “Oh, it’s raining, it’s raining,” sang Manu, running out.",
          ko: "그러다 드디어 비가 내리기 시작했어요! “비 온다, 비 온다!” 마누는 노래하며 밖으로 달려 나갔어요." },
        { page: 10, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/4574/size6/baa4efbce56aa6ee579793586fe65228.jpg",
          art: "Boy playing in the rain and lady watching",
          en: "“But Manu,” called Ma, running after him, “you forgot your raincoat!”",
          ko: "“그런데 마누야!” 엄마가 뒤쫓아 뛰며 불렀어요. “우비를 두고 가잖니!”" }
      ]
    },
    {
      id: "sw02", sort: 52, cat: "세계 그림책", age: "0~2세",
      titleKo: "뚱뚱한 왕과 마른 강아지", titleEn: "Fat King Thin Dog", emoji: "🐕",
      bg: "linear-gradient(158deg,#fff6e6 0%,#ffe8c8 55%,#ffd9ae 100%)",
      cover: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/13829/size6/3e9adaf4a99d553e2e6970914dddbed1.jpg",
      credit: { title: "Fat King Thin Dog", author: "Parismita", illustrator: "Parismita", translator: "",
                publisher: "Pratham Books", year: 2007, license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
                source: "https://storyweaver.org.in/en/stories/7-fat-king-thin-dog", modified: "영어 원문을 한국어로 번역해 수록(삽화는 원본 그대로)" },
      pages: [
        { page: 2, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/13830/size6/6ad78cf23d14d33df72e59a67d67a609.jpg",
          art: "Fat King",
          en: "This is a fat king.",
          ko: "아주 뚱뚱한 왕님이 있었어요." },
        { page: 3, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/13831/size6/3891e1ce8df2d2d38e3b415bec5dafa2.jpg",
          art: "Fat King walking with a thin dog",
          en: "The fat king has a thin dog. The fat king and his thin dog go for a walk.",
          ko: "뚱뚱한 왕님에게는 마른 강아지가 한 마리 있었어요. 왕님과 마른 강아지는 산책을 나섰어요." },
        { page: 4, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/13832/size6/96b59af0238e9a733a1d6ab8e2bfc83c.jpg",
          art: "Dog chasing a bird",
          en: "The dog sees a bird. The dog runs after the bird.",
          ko: "강아지가 새를 보았어요. 강아지가 새를 쫓아 달렸어요." },
        { page: 5, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/13833/size6/277124b88975e02c6e3a0052ad109da1.jpg",
          art: "King chasing a dog",
          en: "The king runs after the dog.",
          ko: "왕님도 강아지를 쫓아 달렸어요." },
        { page: 6, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/13834/size6/2be803a02cd4196cfde68a6df3a4d690.jpg",
          art: "Tired king running after a dog",
          en: "They run and run. They run and run for many days.",
          ko: "둘은 달리고 또 달렸어요. 여러 날을 내내 달렸어요." },
        { page: 7, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/13835/size6/a95b6b33c564971fee5fd6ab6131012e.jpg",
          art: "King catching a dog",
          en: "The king catches the dog.",
          ko: "마침내 왕님이 강아지를 잡았어요." },
        { page: 8, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/13836/size6/a39b3220e6cc4ed1332efe72ae2e35e0.jpg",
          art: "Thin King and dog",
          en: "Now the fat king is thin.",
          ko: "그런데 이제, 뚱뚱하던 왕님이 날씬해졌어요!" }
      ]
    },
    {
      id: "sw03", sort: 53, cat: "세계 그림책", age: "3~5세",
      titleKo: "웃어 봐요!", titleEn: "Smile Please!", emoji: "🦌",
      bg: "linear-gradient(158deg,#f0fbe6 0%,#dcf3ca 55%,#c9eab2 100%)",
      cover: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/13/size6/c81a20631b55954d6c40abc4d666a32d.jpg",
      credit: { title: "Smile Please!", author: "Sanjiv Jaiswal 'Sanjay'", illustrator: "Ajit Narayan", translator: "Manisha Chaudhry",
                publisher: "Pratham Books", year: 2007, license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
                source: "https://storyweaver.org.in/en/stories/2-smile-please", modified: "영어 원문을 한국어로 번역해 수록(삽화는 원본 그대로)" },
      pages: [
        { page: 2, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/14/size6/faa10856c7c9b841685389bc1904a89b.jpg",
          art: "Fawn running",
          en: "A fawn was racing in the forest.",
          ko: "아기 사슴이 숲에서 힘껏 달리고 있었어요." },
        { page: 3, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/15/size6/536bf872a08ea48e3feec9063b7541fc.jpg",
          art: "Fawn and rabbit running",
          en: "He was ahead of the rabbit.",
          ko: "토끼보다 앞서 갔어요." },
        { page: 4, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/16/size6/3881ed85209ed203262e37a1a9237419.jpg",
          art: "Fawn and elephant running",
          en: "He was ahead of the elephant.",
          ko: "코끼리보다도 앞서 갔어요." },
        { page: 5, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/17/size6/c5a5a22c02fbb31c649a73f27e8966eb.jpg",
          art: "Fawn leaping across stream",
          en: "He leapt and cleared the stream.",
          ko: "폴짝 뛰어 시냇물을 건넜어요." },
        { page: 6, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/18/size6/afee5a4da085394d44070fd330c4d178.jpg",
          art: "Fawn rushing past a wall",
          en: "He ran past the crumbling wall.",
          ko: "허물어지는 담장 곁을 지나 달렸어요." },
        { page: 7, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/19/size6/14b4db70d06071c4e9c843e2bac3c296.jpg",
          art: "Fawn falling",
          en: "There was a large boulder on the grassy plain. He stumbled and fell down.",
          ko: "풀밭에 커다란 돌이 있었어요. 아기 사슴은 그만 걸려 넘어졌어요." },
        { page: 8, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/20/size6/37361c6a3d23feb30eaf9dd9e66e4fa0.jpg",
          art: "Fawn crying",
          en: "He burst into tears.",
          ko: "아기 사슴은 와르르 울음을 터뜨렸어요." },
        { page: 9, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/21/size6/c6dd7e9100c59475dfff669aea42043c.jpg",
          art: "Monkey massaging fawn's legs",
          en: "The monkey massaged his leg. Tears flowed from the fawn's eyes.",
          ko: "원숭이가 다리를 주물러 주었어요. 그래도 아기 사슴 눈에서는 눈물이 흘렀어요." },
        { page: 10, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/22/size6/b7c5a2321034eefd58064417dbed109c.jpg",
          art: "Bear picking fawn up",
          en: "Brother Bear picked him up. The fawn didn't stop crying.",
          ko: "곰 아저씨가 아기 사슴을 번쩍 들어 올렸어요. 그래도 아기 사슴은 울음을 멈추지 않았어요." },
        { page: 11, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/23/size6/4b9d3c5ef3ff7f193bbc57ee9873948a.jpg",
          art: "Mother and young fawn",
          en: "His mother came. She said, “Look, we’ll beat up this bad boulder!”",
          ko: "엄마가 왔어요. “이 나쁜 돌멩이, 엄마가 한 대 쳐 줄까?” 엄마가 말했어요." },
        { page: 12, img: "https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/24/size6/fa745053851dd15865fd30a47599ad37.jpg",
          art: "Mother and fawn laughing",
          en: "The fawn said, “Oh, don’t do that or he will also start crying.” His mother laughed. So did the fawn.",
          ko: "아기 사슴이 말했어요. “아이, 그러지 마요. 돌멩이도 울어 버리면 어떡해요.” 엄마가 웃었어요. 아기 사슴도 따라 웃었어요." }
      ]
    }
  ];

  /* Supabase stories 행과 같은 모양으로 펼칩니다. */
  window.STORY_WORLD = BOOKS.map(function (b) {
    return {
      id: b.id,
      sort_order: b.sort,
      category: b.cat,
      age_group: b.age,
      title_ko: b.titleKo,
      title_en: b.titleEn,
      cover_emoji: b.emoji,
      scenes: b.pages.map(function (p, i) {
        var credit = {
          title: b.credit.title, author: b.credit.author, illustrator: b.credit.illustrator,
          publisher: b.credit.publisher, year: b.credit.year, license: b.credit.license,
          license_url: b.credit.licenseUrl,
          illustration: p.art + ', by ' + b.credit.illustrator,
          source: b.credit.source, source_page: p.page, modified: b.credit.modified
        };
        if (b.credit.translator) credit.translator = b.credit.translator;
        var scene = { ko: p.ko, en: p.en, img: p.img, bg: b.bg, art: [], attribution: credit };
        if (i === 0) scene.cover = b.cover;
        return scene;
      })
    };
  });
})();
