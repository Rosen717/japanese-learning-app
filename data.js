export const VOCAB = [
  {
    id: 'n5-001',
    ja: '学生',
    kana: 'がくせい',
    romaji: 'gakusei',
    zh: '学生',
    part: '名词',
    jlpt: 'N5',
    sentenceJa: 'わたしは日本語学校の学生です。',
    sentenceZh: '我是日语学校的学生。'
  },
  {
    id: 'n5-002',
    ja: '先生',
    kana: 'せんせい',
    romaji: 'sensei',
    zh: '老师',
    part: '名词',
    jlpt: 'N5',
    sentenceJa: '田中先生はとても親切です。',
    sentenceZh: '田中老师非常亲切。'
  },
  {
    id: 'n5-003',
    ja: '会社',
    kana: 'かいしゃ',
    romaji: 'kaisha',
    zh: '公司',
    part: '名词',
    jlpt: 'N5',
    sentenceJa: 'あの会社で働いています。',
    sentenceZh: '我在那家公司工作。'
  },
  {
    id: 'n5-004',
    ja: '行く',
    kana: 'いく',
    romaji: 'iku',
    zh: '去',
    part: '动词',
    jlpt: 'N5',
    sentenceJa: 'あした東京へ行きます。',
    sentenceZh: '明天去东京。'
  },
  {
    id: 'n5-005',
    ja: '食べる',
    kana: 'たべる',
    romaji: 'taberu',
    zh: '吃',
    part: '动词',
    jlpt: 'N5',
    sentenceJa: '毎朝パンを食べます。',
    sentenceZh: '每天早上吃面包。'
  },
  {
    id: 'n5-006',
    ja: '飲む',
    kana: 'のむ',
    romaji: 'nomu',
    zh: '喝',
    part: '动词',
    jlpt: 'N5',
    sentenceJa: 'コーヒーを飲みません。',
    sentenceZh: '我不喝咖啡。'
  },
  {
    id: 'n5-007',
    ja: '今日',
    kana: 'きょう',
    romaji: 'kyou',
    zh: '今天',
    part: '名词',
    jlpt: 'N5',
    sentenceJa: '今日はいい天気ですね。',
    sentenceZh: '今天天气很好呢。'
  },
  {
    id: 'n5-008',
    ja: '明日',
    kana: 'あした',
    romaji: 'ashita',
    zh: '明天',
    part: '名词',
    jlpt: 'N5',
    sentenceJa: '明日は休みです。',
    sentenceZh: '明天休息。'
  },
  {
    id: 'n5-009',
    ja: '友達',
    kana: 'ともだち',
    romaji: 'tomodachi',
    zh: '朋友',
    part: '名词',
    jlpt: 'N5',
    sentenceJa: '友達と映画を見ます。',
    sentenceZh: '和朋友看电影。'
  },
  {
    id: 'n5-010',
    ja: '駅',
    kana: 'えき',
    romaji: 'eki',
    zh: '车站',
    part: '名词',
    jlpt: 'N5',
    sentenceJa: '駅はここから近いです。',
    sentenceZh: '车站离这里很近。'
  },
  {
    id: 'n5-011',
    ja: '日本語',
    kana: 'にほんご',
    romaji: 'nihongo',
    zh: '日语',
    part: '名词',
    jlpt: 'N5',
    sentenceJa: '日本語を毎日勉強します。',
    sentenceZh: '每天学习日语。'
  },
  {
    id: 'n5-012',
    ja: '勉強する',
    kana: 'べんきょうする',
    romaji: 'benkyou suru',
    zh: '学习',
    part: '动词',
    jlpt: 'N5',
    sentenceJa: '図書館で勉強します。',
    sentenceZh: '在图书馆学习。'
  }
];

export const GRAMMAR = [
  { id: 'g-n5-01', level: 'N5', pattern: '〜です', meaning: '判断句礼貌形式', exampleJa: 'これは本です。', exampleZh: '这是书。', note: '名词后接です。' },
  { id: 'g-n5-02', level: 'N5', pattern: '〜ます', meaning: '动词礼貌现在/将来', exampleJa: '毎日日本語を勉強します。', exampleZh: '每天学习日语。', note: '动词ます形。' },
  { id: 'g-n5-03', level: 'N5', pattern: '〜ません', meaning: '动词礼貌否定', exampleJa: '肉を食べません。', exampleZh: '不吃肉。', note: 'ます形否定。' },
  { id: 'g-n5-04', level: 'N5', pattern: '〜ました', meaning: '动词礼貌过去', exampleJa: '昨日映画を見ました。', exampleZh: '昨天看了电影。', note: '过去完成。' },
  { id: 'g-n5-05', level: 'N5', pattern: '〜たい', meaning: '想要做某事', exampleJa: '日本へ行きたいです。', exampleZh: '想去日本。', note: '接动词ます去ます。' },
  { id: 'g-n5-06', level: 'N5', pattern: '〜てください', meaning: '请做…', exampleJa: 'ここに名前を書いてください。', exampleZh: '请在这里写名字。', note: 'て形+ください。' },

  { id: 'g-n4-01', level: 'N4', pattern: '〜と思う', meaning: '我觉得…', exampleJa: 'これは便利だと思います。', exampleZh: '我觉得这个很方便。', note: '普通形+と思う。' },
  { id: 'g-n4-02', level: 'N4', pattern: '〜かもしれない', meaning: '也许…', exampleJa: '明日は雨かもしれません。', exampleZh: '明天也许会下雨。', note: '普通形接续。' },
  { id: 'g-n4-03', level: 'N4', pattern: '〜ように', meaning: '为了…/希望…', exampleJa: '日本語が話せるようになりたい。', exampleZh: '想变得会说日语。', note: '变化目标表达。' },
  { id: 'g-n4-04', level: 'N4', pattern: '〜ながら', meaning: '一边…一边…', exampleJa: '音楽を聞きながら勉強します。', exampleZh: '一边听音乐一边学习。', note: '同一主体。' },
  { id: 'g-n4-05', level: 'N4', pattern: '〜てしまう', meaning: '做完了/不小心…', exampleJa: '宿題を忘れてしまいました。', exampleZh: '不小心忘了作业。', note: '遗憾或完成。' },
  { id: 'g-n4-06', level: 'N4', pattern: '〜ば', meaning: '如果…就…', exampleJa: '時間があれば行きます。', exampleZh: '如果有时间就去。', note: '条件句之一。' },

  { id: 'g-n3-01', level: 'N3', pattern: '〜わけではない', meaning: '并非…', exampleJa: '嫌いなわけではない。', exampleZh: '并不是讨厌。', note: '部分否定。' },
  { id: 'g-n3-02', level: 'N3', pattern: '〜ことになる', meaning: '决定/结果变成…', exampleJa: '来月転勤することになりました。', exampleZh: '决定下月调职。', note: '外部决定。' },
  { id: 'g-n3-03', level: 'N3', pattern: '〜ようになる', meaning: '变得会…', exampleJa: '日本語が読めるようになった。', exampleZh: '变得会读日语了。', note: '能力状态变化。' },
  { id: 'g-n3-04', level: 'N3', pattern: '〜に違いない', meaning: '一定…', exampleJa: '彼はもう知っているに違いない。', exampleZh: '他一定已经知道了。', note: '强推测。' },
  { id: 'g-n3-05', level: 'N3', pattern: '〜おかげで', meaning: '多亏…', exampleJa: '先生のおかげで合格した。', exampleZh: '多亏老师才合格。', note: '积极原因。' },
  { id: 'g-n3-06', level: 'N3', pattern: '〜せいで', meaning: '都是因为…', exampleJa: '雨のせいで遅れた。', exampleZh: '因为下雨迟到了。', note: '消极原因。' },

  { id: 'g-n2-01', level: 'N2', pattern: '〜にすぎない', meaning: '只不过是…', exampleJa: 'それはうわさにすぎない。', exampleZh: '那只不过是传闻。', note: '轻视/限定。' },
  { id: 'g-n2-02', level: 'N2', pattern: '〜わけにはいかない', meaning: '不能…', exampleJa: '約束したからやめるわけにはいかない。', exampleZh: '答应了所以不能放弃。', note: '社会/道德限制。' },
  { id: 'g-n2-03', level: 'N2', pattern: '〜かねない', meaning: '有可能（坏事）', exampleJa: 'その言い方は誤解を招きかねない。', exampleZh: '那种说法可能引起误解。', note: '负面可能。' },
  { id: 'g-n2-04', level: 'N2', pattern: '〜ことか', meaning: '多么…啊', exampleJa: 'どんなにうれしかったことか。', exampleZh: '那是多么开心啊。', note: '感叹句型。' },
  { id: 'g-n2-05', level: 'N2', pattern: '〜ものの', meaning: '虽然…但是…', exampleJa: '買ったものの、使っていない。', exampleZh: '虽然买了但没用。', note: '书面转折。' },
  { id: 'g-n2-06', level: 'N2', pattern: '〜にほかならない', meaning: '正是…', exampleJa: '成功は努力の結果にほかならない。', exampleZh: '成功正是努力的结果。', note: '强断定。' },

  { id: 'g-n1-01', level: 'N1', pattern: '〜ざるを得ない', meaning: '不得不…', exampleJa: 'そう言わざるを得ない。', exampleZh: '不得不这么说。', note: '书面强制。' },
  { id: 'g-n1-02', level: 'N1', pattern: '〜にたえない', meaning: '不堪…/令人…', exampleJa: 'その行為は軽蔑にたえない。', exampleZh: '那种行为令人鄙视。', note: '固定搭配多见书面。' },
  { id: 'g-n1-03', level: 'N1', pattern: '〜を余儀なくされる', meaning: '被迫…', exampleJa: '計画の変更を余儀なくされた。', exampleZh: '被迫更改计划。', note: '被动、书面。' },
  { id: 'g-n1-04', level: 'N1', pattern: '〜なしに', meaning: '不…就…', exampleJa: '努力なしに成功はない。', exampleZh: '不努力就没有成功。', note: '书面表达。' },
  { id: 'g-n1-05', level: 'N1', pattern: '〜に即して', meaning: '根据…', exampleJa: '規則に即して判断する。', exampleZh: '根据规则判断。', note: '客观依据。' },
  { id: 'g-n1-06', level: 'N1', pattern: '〜を禁じ得ない', meaning: '不禁…', exampleJa: 'その話を聞いて涙を禁じ得なかった。', exampleZh: '听到那事不禁流泪。', note: '强烈感情书面语。' }
];
