import { User, UserRole, Lesson, StudentProfile, StudentSchool } from './types';

export const CURRENT_DATE = new Date('2025-12-14T10:00:00'); // Simulated "Now"

export const INITIAL_STUDENT_CONTEXT: StudentProfile = {
  id: 's1',
  name: '山田 花子',
  grade: '小6',
  targetSchool: '洛南高等学校附属中学校', 
  subjects: ['算数', '国語', '理科', '社会'],
  notes: '専願女子。2025年過去問完了。次は2024→2023→2022を解く予定。'
};

export const MOCK_USERS: User[] = [
  { id: 't1', name: '佐藤 先生', role: UserRole.TUTOR, email: 'tutor@manabee.com' },
  { id: 's1', name: '山田 花子', role: UserRole.STUDENT, email: 'student@manabee.com' },
  { id: 'g1', name: '山田 母', role: UserRole.GUARDIAN, email: 'mom@manabee.com' },
];

// Initial Seed Data
export const MOCK_SCHOOLS: StudentSchool[] = [
  {
    id: 'sc1',
    studentId: 's1',
    name: '洛南高等学校附属中学校',
    priority: 1,
    status: 'considering',
    subjects: ['4科', '専願女子'],
    memo: '第一志望。算数の図形問題がカギ。過去問は2025完了。次は2024→2022へ。',
    sourceUrl: 'https://www.rakunan-h.ed.jp/',
    events: [
      { id: 'e1', type: 'application_start', title: '出願開始', date: '2025-12-20T09:00:00', isAllDay: true },
      { id: 'e2', type: 'application_end', title: '出願締切', date: '2026-01-05T17:00:00', isAllDay: false },
      { id: 'e3', type: 'exam', title: '入試本番', date: '2026-01-17T08:30:00', isAllDay: true },
      { id: 'e4', type: 'result', title: '合格発表', date: '2026-01-19T15:00:00', isAllDay: false },
    ]
  },
  {
    id: 'sc2',
    studentId: 's1',
    name: '大谷中学校',
    priority: 2,
    status: 'considering',
    subjects: ['医進'],
    memo: '併願校として検討中。',
    events: [
      { id: 'e5', type: 'application_end', title: '出願締切', date: '2026-01-06T17:00:00', isAllDay: false },
      { id: 'e6', type: 'exam', title: 'A日程入試', date: '2026-01-18T08:30:00', isAllDay: true },
    ]
  }
];

export const MOCK_LESSON: Lesson = {
  id: 'l1',
  studentId: 's1',
  scheduledAt: '2025-12-14T16:00:00',
  durationMinutes: 120,
  status: 'completed',
  hourlyRate: 5000,
  transcript: `
    佐藤先生: はい、こんにちは。今日は前回の続きで、洛南の2024年の算数、大問3の図形問題からやっていきましょう。
    花子: はい、お願いします。この立体の切断がちょっと苦手で...
    佐藤先生: なるほど。切断の基本は「同一平面上の点を結ぶ」ことと「平行な面には平行な線が入る」ことだね。まずはこの見取り図に点を打ってみよう。
    (20分経過)
    花子: あ、そっか！ここで相似を使えば比が出るんですね。答えは12cmですか？
    佐藤先生: 正解！よく気づいたね。その調子。次は国語の記述問題。
    佐藤先生: 「筆者の心情」を問う問題だけど、花子ちゃんはどう書いた？
    花子: 「悲しかった」と書きました。
    佐藤先生: うーん、惜しい。単に悲しいだけじゃなくて、前の段落に「故郷を失った喪失感」ってあるよね。そこを盛り込むともっと点数が伸びるよ。
    佐藤先生: ということで、今日のまとめ。算数は立体の切断、補助線の引き方が良くなった。国語は心情記述で「根拠」を本文から探す癖をつけよう。
    佐藤先生: 次回の宿題は、2024年の理科の残りと、今日の算数の類題プリント2枚ね。
  `,
  aiSummary: {
    lesson_goal: "洛南2024年算数（立体図形）の克服と、国語記述力の向上",
    what_we_did: ["2024年算数 大問3（立体切断）", "国語 随筆文の心情記述"],
    what_went_well: ["立体の切断で相似比を見つけるのが早くなった"],
    issues: ["国語の記述で、本文の根拠拾いが少し浅い"],
    next_actions: ["算数類題プリントで切断パターンの定着", "理科過去問を進める"],
    parent_message: "本日は過去問演習を行いました。算数の図形問題への食いつきが非常に良くなっています。国語はもう少し記述の深堀りが必要ですが、着実に力はついています。",
    quiz_focus: ["立体切断の原則", "心情記述の要素"]
  },
  aiHomework: {
    items: [
      { title: "2024年 理科 過去問", due_days_from_now: 3, type: "practice", estimated_minutes: 50, isCompleted: false },
      { title: "算数 類題プリントNo.4", due_days_from_now: 2, type: "review", estimated_minutes: 30, isCompleted: true }
    ]
  },
  aiQuiz: {
    questions: [
      {
        type: "mcq",
        q: "立体の切断において、最も基本的なルールはどれ？",
        choices: ["全ての点を結ぶ", "同一平面上の点を結ぶ", "中心を通る線を引く", "一番長い対角線を引く"],
        answer: "同一平面上の点を結ぶ",
        explain: "切断面を作るには、同じ面にある点同士を直線で結ぶのが第一歩です。"
      },
      {
        type: "short",
        q: "国語の心情記述において、自分の言葉だけでなく何を使うべきか？",
        answer: "本文の根拠",
        explain: "主観だけでなく、本文中にある表現（根拠）を引用・要約して盛り込むことで点数が安定します。"
      }
    ]
  },
  reflections: {
    tutor: "集中力が続いていて良い。算数のひらめきが増えている。",
    student: "図形が見えるようになってきて楽しい。国語はもっと練習したい。",
    guardian: "家でも図形の問題を楽しそうに解いていました。"
  },
  tags: ["過去問", "算数", "国語"]
};

// Colors associated with roles for UI hints
export const ROLE_COLORS = {
  [UserRole.TUTOR]: 'indigo',
  [UserRole.STUDENT]: 'blue',
  [UserRole.GUARDIAN]: 'teal',
};