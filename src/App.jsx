import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import {
  Home,
  Bot,
  ClipboardCheck,
  BookOpen,
  FlaskConical,
  Target,
  BarChart3,
  Settings,
  Users,
  Play,
  CheckCircle2,
  MapPin,
  RotateCcw,
  Star,
  ChevronRight,
  AlertTriangle,
  Compass,
  Sparkles,
} from "lucide-react";

const firebaseEnv = {};

function getFirebaseEnvValue(key, fallback) {
  const raw = firebaseEnv?.[key];
  if (typeof raw !== "string") return fallback;
  const cleaned = raw.trim().replace(/^['"]|['"]$/g, "");
  if (!cleaned || cleaned.includes("YOUR_") || cleaned === "undefined" || cleaned === "null") return fallback;
  if (key === "VITE_FIREBASE_API_KEY" && !cleaned.startsWith("AIza")) return fallback;
  return cleaned;
}

const firebaseConfig = {
  apiKey: getFirebaseEnvValue("VITE_FIREBASE_API_KEY", "AIzaSyBuBLXE3_HgVJAr8K_cNGQeUEZcTAd97UI"),
  authDomain: getFirebaseEnvValue("VITE_FIREBASE_AUTH_DOMAIN", "graphexplorer-25600.firebaseapp.com"),
  projectId: getFirebaseEnvValue("VITE_FIREBASE_PROJECT_ID", "graphexplorer-25600"),
  storageBucket: getFirebaseEnvValue("VITE_FIREBASE_STORAGE_BUCKET", "graphexplorer-25600.firebasestorage.app"),
  messagingSenderId: getFirebaseEnvValue("VITE_FIREBASE_MESSAGING_SENDER_ID", "417537430325"),
  appId: getFirebaseEnvValue("VITE_FIREBASE_APP_ID", "1:417537430325:web:d2f6cc4885b624314f727c"),
  measurementId: getFirebaseEnvValue("VITE_FIREBASE_MEASUREMENT_ID", "G-7SB0VGR0VE"),
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.startsWith("AIza") &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);
const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;
const googleProvider = firebaseApp ? new GoogleAuthProvider() : null;
if (googleProvider) {
  googleProvider.setCustomParameters({
    prompt: "select_account",
  });
}

const db = firebaseApp ? getFirestore(firebaseApp) : null;

const ADMIN_EMAILS = [
  "feeljoa777@gmail.com",
  "feeljoa77@naver.com",
].map((email) => email.toLowerCase());

function getResolvedRole(email, savedRole = "student") {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (normalizedEmail && ADMIN_EMAILS.includes(normalizedEmail)) return "admin";
  if (savedRole === "admin") return "admin";
  return "student";
}


const navItems = [
  { id: "home", labelKey: "home", icon: Home },
  { id: "ai", labelKey: "ai", icon: Bot },
  { id: "ready", labelKey: "ready", icon: ClipboardCheck },
  { id: "concept", labelKey: "concept", icon: BookOpen },
  { id: "explore", labelKey: "explore", icon: FlaskConical },
  { id: "game", labelKey: "game", icon: Star },
  { id: "assessment", labelKey: "assessment", icon: Target },
  { id: "growth", labelKey: "growth", icon: BarChart3 },
];

const adminNavItem = { id: "admin", labelKey: "admin", icon: Users };

const languageOptions = [
  { code: "ko", label: "한국어", nativeLabel: "한국어" },
  { code: "en", label: "영어", nativeLabel: "English" },
  { code: "zh", label: "중국어", nativeLabel: "中文" },
  { code: "ja", label: "일본어", nativeLabel: "日本語" },
];

const uiText = {
  ko: {
    home: "홈",
    ai: "AI 그래프 해석",
    ready: "학습준비",
    concept: "개념학습",
    explore: "탐구활동",
    game: "게임존",
    assessment: "형성평가",
    growth: "성장기록",
    admin: "관리자",
    settings: "설정",
    flow: "준비-개념학습-탐구활동-평가 흐름으로 함수 학습을 안내합니다.",
    logout: "로그아웃",
    endGuest: "체험 종료",
    guestMode: "체험 모드",
    languageSettings: "언어 설정",
    languageDesc: "다문화 학생이 주요 메뉴와 학습 흐름을 익숙한 언어로 확인할 수 있도록 설정합니다.",
    currentLanguage: "현재 언어",
    applyNotice: "선택한 언어는 이 기기 브라우저에 저장됩니다.",
    translationScope: "현재는 메뉴, 헤더, 설정 화면의 핵심 안내 문구에 우선 적용됩니다. 개념 설명 전체 번역은 이후 단계에서 확장할 수 있습니다.",
  },
  en: {
    home: "Home",
    ai: "AI Graph Analysis",
    ready: "Readiness",
    concept: "Concepts",
    explore: "Explore",
    game: "Game Zone",
    assessment: "Quiz",
    growth: "Progress",
    admin: "Admin",
    settings: "Settings",
    flow: "Guides function learning through Readiness → Concepts → Exploration → Assessment.",
    logout: "Log out",
    endGuest: "End trial",
    guestMode: "Trial mode",
    languageSettings: "Language Settings",
    languageDesc: "Choose a familiar language so multilingual students can navigate the learning flow more easily.",
    currentLanguage: "Current language",
    applyNotice: "The selected language is saved in this browser.",
    translationScope: "Currently applied to key menus, header text, and settings guidance. Full lesson translation can be expanded later.",
  },
  zh: {
    home: "首页",
    ai: "AI 图像解读",
    ready: "学习准备",
    concept: "概念学习",
    explore: "探究活动",
    game: "游戏区",
    assessment: "形成性评价",
    growth: "成长记录",
    admin: "管理员",
    settings: "设置",
    flow: "按照 准备 → 概念学习 → 探究活动 → 评价 的流程学习函数。",
    logout: "退出登录",
    endGuest: "结束体验",
    guestMode: "体验模式",
    languageSettings: "语言设置",
    languageDesc: "让多文化学生用熟悉的语言确认主要菜单和学习流程。",
    currentLanguage: "当前语言",
    applyNotice: "所选语言会保存在此浏览器中。",
    translationScope: "目前优先应用于菜单、页眉和设置说明。完整概念说明翻译可在下一阶段扩展。",
  },
  ja: {
    home: "ホーム",
    ai: "AIグラフ解析",
    ready: "学習準備",
    concept: "概念学習",
    explore: "探究活動",
    game: "ゲームゾーン",
    assessment: "形成評価",
    growth: "成長記録",
    admin: "管理者",
    settings: "設定",
    flow: "準備 → 概念学習 → 探究活動 → 評価 の流れで関数学習を案内します。",
    logout: "ログアウト",
    endGuest: "体験終了",
    guestMode: "体験モード",
    languageSettings: "言語設定",
    languageDesc: "多文化の生徒が慣れた言語で主なメニューと学習の流れを確認できます。",
    currentLanguage: "現在の言語",
    applyNotice: "選択した言語はこのブラウザに保存されます。",
    translationScope: "現在はメニュー、ヘッダー、設定案内の主要文言に優先適用されます。概念説明全体の翻訳は今後拡張できます。",
  },
};

function getUiText(language, key) {
  return uiText[language]?.[key] || uiText.ko[key] || key;
}

const translationDictionary = {
  en: {
    "그래프탐험대": "Graph Explorers",
    "AI 기반 함수 그래프 학습 플래너": "AI-based Function Graph Learning Planner",
    "로그인 상태를 확인하는 중입니다.": "Checking login status.",
    "이름/닉네임": "Name / Nickname",
    "이메일": "Email",
    "비밀번호": "Password",
    "학년": "Grade",
    "선택": "Select",
    "중1": "Grade 7",
    "중2": "Grade 8",
    "중3": "Grade 9",
    "중1과 같은 방식으로 10문항을 한 문제씩 풀고 성장기록에 반영합니다.": "Solve 10 questions one by one, and the results are reflected in the progress record.",
    "회원가입": "Sign up",
    "비밀번호 찾기": "Find password",
    "이메일로 로그인": "Log in with email",
    "Google로 로그인": "Log in with Google",
    "비회원으로 둘러보기": "Browse as guest",
    "비회원은 포인트와 성장기록이 저장되지 않습니다.": "Guest mode does not save points or progress records.",
    "Firebase 회원가입": "Firebase Sign-up",
    "처리 중...": "Processing...",
    "로그인으로": "Back to login",
    "학생 이름": "Student name",
    "비회원 체험": "Guest trial",
    "관리자는 Google 로그인 후 Firestore에서 role이 admin인 계정만 관리 메뉴가 표시됩니다.": "After Google login, only accounts with role set to admin in Firestore can access the admin menu.",
    "홈": "Home",
    "AI 그래프 해석": "AI Graph Analysis",
    "학습준비": "Readiness",
    "개념학습": "Concept Learning",
    "탐구활동": "Exploration",
    "게임존": "Game Zone",
    "형성평가": "Formative Assessment",
    "성장기록": "Growth Record",
    "설정": "Settings",
    "언어 설정": "Language Settings",
    "언어 지원 안내": "Language Support Guide",
    "현재 언어": "Current language",
    "선택됨": "Selected",
    "이 언어로 보기": "Use this language",
    "선택한 언어는 이 기기 브라우저에 저장됩니다.": "The selected language is saved in this browser.",
    "다문화 학생이 주요 메뉴와 학습 흐름을 익숙한 언어로 확인할 수 있도록 설정합니다.": "This setting helps multilingual students view key menus and the learning flow in a familiar language.",
    "현재는 메뉴, 헤더, 설정 화면의 핵심 안내 문구에 우선 적용됩니다. 개념 설명 전체 번역은 이후 단계에서 확장할 수 있습니다.": "Translation is applied to menus, headers, settings, learning cards, readiness checks, concept learning, assessments, and growth records by a manual dictionary.",
    "추천 추가 언어": "Recommended additional languages",
    "러시아어": "Russian",
    "몽골어": "Mongolian",
    "태국어": "Thai",
    "필리핀어/타갈로그어": "Filipino / Tagalog",
    "다문화 학생 지원 관점에서 추가하면 좋습니다.": "would be useful for supporting multilingual students.",
    "준비-개념학습-탐구활동-평가 흐름으로 함수 학습을 안내합니다.": "Guides function learning through Readiness → Concepts → Exploration → Assessment.",
    "체험 모드": "Guest Mode",
    "체험 종료": "End trial",
    "로그아웃": "Log out",
    "좌표에서 시작하는 그래프 탐험대": "Graph Explorers Starting from Coordinates",
    "일차함수 그래프 탐험대": "Linear Function Graph Explorers",
    "이차함수 그래프 탐험대": "Quadratic Function Graph Explorers",
    "순서쌍 · 좌표 · 그래프 기초 · 정비례 · 반비례": "Ordered Pairs · Coordinates · Graph Basics · Direct Proportion · Inverse Proportion",
    "함수의 뜻 · 일차함수 · 기울기 · y절편 · 그래프 해석": "Meaning of Function · Linear Function · Slope · y-intercept · Graph Interpretation",
    "이차함수 · 포물선 · 꼭짓점 · 축 · 그래프 변환": "Quadratic Function · Parabola · Vertex · Axis · Graph Transformations",
    "탐험 포인트": "Explorer Points",
    "게임과 학습 활동을 하며 모은 포인트입니다.": "Points earned through games and learning activities.",
    "사전 진단으로 오늘의 출발점을 확인해요.": "Check today’s starting point with a pre-diagnosis.",
    "순서쌍, 좌표평면, 정비례, 반비례를 익혀요.": "Learn ordered pairs, coordinate planes, direct proportion, and inverse proportion.",
    "AI 그래프 해석실": "AI Graph Analysis Lab",
    "함수식을 입력하고 AI처럼 그래프 특징을 확인해요.": "Enter a function expression and check graph features like AI.",
    "좌표 미션과 표 → 그래프 활동을 해요.": "Try coordinate missions and table-to-graph activities.",
    "퀴즈와 미니게임으로 배운 내용을 확인해요.": "Review what you learned with quizzes and mini-games.",
    "개념별 10문항으로 이해 정도를 점검해요.": "Check understanding with 10 questions for each concept.",
    "형성평가 결과와 맞춤 추천 문제를 확인해요.": "Check assessment results and personalized recommended questions.",
    "진단 시작": "Start diagnosis",
    "개념 익히기": "Learn concepts",
    "해석실 열기": "Open analysis lab",
    "탐구하기": "Explore",
    "게임 시작": "Start game",
    "평가 시작": "Start assessment",
    "기록 보기": "View record",
    "열기": "Open",
    "학습 미션을 완료하면 포인트가 올라가요.": "Complete learning missions to earn points.",
    "미션 완료": "Mission complete",
    "미션 대기": "Mission pending",
    "학습준비: 사전 진단": "Learning Readiness: Pre-Diagnosis",
    "좌표, 사분면, 정비례·반비례의 기초 이해를 빠르게 확인하고 맞춤 출발점을 추천합니다.": "Quickly check basic understanding of coordinates, quadrants, direct and inverse proportion, then get a personalized starting point.",
    "준비 진단": "Readiness Check",
    "진단": "Check",
    "오늘의 추천 출발점": "Today’s Recommended Starting Point",
    "진단 결과 기준": "Diagnosis Criteria",
    "진단 결과 확인": "Check diagnosis result",
    "추천 학습으로 이동": "Go to recommended learning",
    "바로 형성평가 보기": "Go to formative assessment",
    "네 문항에 답하면 오늘의 출발 학습을 추천합니다.": "Answer four questions to receive today’s recommended starting point.",
    "기초 준비가 잘 되어 있습니다.": "Your basic readiness is strong.",
    "개념학습에서 부족한 부분 확인": "Review weak parts in concept learning",
    "탐구활동 또는 그래프 해석실로 이동": "Go to exploration or graph analysis lab",
    "순서쌍과 좌표부터 차근차근 학습": "Start step by step from ordered pairs and coordinates",
    "정답입니다.": "Correct.",
    "정답입니다!": "Correct!",
    "다시 확인해 보세요.": "Check again.",
    "정답": "Answer",
    "좌표 읽기": "Reading Coordinates",
    "사분면 구분": "Identifying Quadrants",
    "정비례 판단": "Identifying Direct Proportion",
    "반비례 판단": "Identifying Inverse Proportion",
    "함수의 뜻": "Meaning of Function",
    "기울기 판단": "Identifying Slope",
    "y절편 판단": "Identifying y-intercept",
    "그래프 모양": "Graph Shape",
    "이차함수 모양": "Quadratic Graph Shape",
    "그래프 방향": "Graph Direction",
    "꼭짓점 판단": "Identifying Vertex",
    "축의 방정식": "Equation of Axis",
    "개념을 차근차근 익혀요!": "Learn concepts step by step!",
    "상황, 표, 식, 그래프를 연결하면서 함수 개념을 익힙니다.": "Learn function concepts by connecting situations, tables, equations, and graphs.",
    "표상 연결 중심": "Representation Connection",
    "학습하기": "Learn",
    "개념 목록으로": "Back to concept list",
    "개념학습 완료": "Concept learning complete",
    "완료됨": "Completed",
    "핵심 생각": "Big Idea",
    "생각해보기": "Think About It",
    "꼭 확인할 점": "Key Points",
    "표상 연결": "Representation Links",
    "상황 → 표 → 식 → 그래프를 연결합니다.": "Connect situation → table → equation → graph.",
    "사분면 빠르게 확인하기": "Quick Quadrant Check",
    "좌표축 위의 점은 사분면에 속하지 않아요.": "A point on an axis does not belong to any quadrant.",
    "예": "Example",
    "예시": "Example",
    "정비례": "Direct Proportion",
    "반비례": "Inverse Proportion",
    "순서쌍과 좌표": "Ordered Pairs and Coordinates",
    "좌표평면": "Coordinate Plane",
    "일차함수": "Linear Function",
    "이차함수": "Quadratic Function",
    "포물선": "Parabola",
    "꼭짓점": "Vertex",
    "원점": "Origin",
    "사분면": "Quadrant",
    "기울기": "Slope",
    "절편": "Intercept",
    "함수식을 입력하세요.": "Enter a function expression.",
    "정비례 예시": "Direct proportion example",
    "반비례 예시": "Inverse proportion example",
    "일차함수 예시": "Linear function example",
    "이차함수 예시": "Quadratic function example",
    "이차함수 표준형": "Quadratic vertex form",
    "AI 그래프 해석 시작": "Start AI Graph Analysis",
    "식 입력 → 교과서형 그래프 확인 → 개념 해석 순서로 학습합니다.": "Learn by entering an equation, checking the textbook-style graph, and interpreting the concept.",
    "그래프에서 확인할 점": "What to Check on the Graph",
    "개념 해석": "Concept Interpretation",
    "한 문제 더 풀기": "Try One More Question",
    "정답 보기": "Show answer",
    "정답 숨기기": "Hide answer",
    "함수식을 입력하면 그래프가 나타납니다.": "Enter a function expression to display the graph.",
    "그래프": "Graph",
    "좌표를 찍는 데서 끝나지 않고, 표의 값을 그래프로 연결하며 함수의 모양을 탐험합니다.": "Go beyond plotting points by connecting table values to graphs and exploring function shapes.",
    "좌표 미션": "Coordinate Mission",
    "표 → 그래프": "Table → Graph",
    "그래프 도전": "Graph Challenge",
    "탐구 완료": "Exploration complete",
    "탐험 점 찍기": "Plot exploration point",
    "초기화": "Reset",
    "좌표 입력": "Coordinate Input",
    "랜덤 미션": "Random Mission",
    "그래프 그리기": "Draw Graph",
    "그래프 완성하기": "Complete Graph",
    "랜덤 함수식": "Random Function",
    "정비례 표": "Direct Proportion Table",
    "반비례 표": "Inverse Proportion Table",
    "정비례 표 완성하기": "Complete Direct Proportion Table",
    "반비례 표 완성하기": "Complete Inverse Proportion Table",
    "게임 선택": "Choose Game",
    "좌표 두더지": "Coordinate Mole",
    "정비례 매칭": "Direct Proportion Matching",
    "반비례 수사대": "Inverse Proportion Detectives",
    "일상 속 비례 판별": "Daily-Life Proportion Judge",
    "형성평가 풀러가기": "Go to assessment",
    "형성평가 / 성장기록": "Assessment / Growth Record",
    "형성평가 점수를 바탕으로 약한 개념을 분석하고 문제은행에서 맞춤 문제를 추천합니다.": "Based on assessment scores, weak concepts are analyzed and personalized questions are recommended from the question bank.",
    "총점": "Total score",
    "미응시": "Not attempted",
    "풀이 완료 문항": "Solved questions",
    "아직 형성평가를 풀지 않았어요.": "You have not completed the assessment yet.",
    "개념별 형성평가 기록": "Assessment Records by Concept",
    "문제은행 기반 AI형 맞춤 추천": "Question Bank-Based AI-Style Recommendation",
    "먼저 형성평가를 풀면 약한 개념을 분석해 추천 문제를 제공합니다.": "Complete the formative assessment first to receive recommendations based on weak concepts.",
    "우선 복습 추천": "Priority Review Recommendation",
    "정답률": "Accuracy",
    "추천 난이도": "Recommended Level",
    "추천 문제 접기": "Close recommended questions",
    "AI 맞춤 문제 추천 받기": "Get AI-style recommended questions",
    "추천 문제 세트": "Recommended Question Set",
    "맞춤 개념학습으로 이동": "Go to personalized concept learning",
    "문항 이동": "Move to Question",
    "현재 점수": "Current score",
    "문제": "Question",
    "결과 보기": "View result",
    "다음": "Next",
    "이전": "Previous",
    "다시 풀기": "Try again",
    "미션 완료 확인": "Confirm mission completion",
    "포인트 지급 완료": "Points awarded",
    "평가 완료": "Assessment complete",
    "핵심 문항으로 이해 정도를 점검해요.": "Check understanding with key questions.",
    "학습 흐름과 다음 학습을 확인해요.": "Check your learning flow and next steps.",
    "슬라이더를 조정하며 식과 그래프가 변하는 형태를 한눈에 관찰하세요.": "Adjust the sliders to observe how the equation and graph change.",
    "실시간 함수식": "Live Function Expression",
    "기울기 / 폭 a": "Slope / Width a",
    "y절편 b": "y-intercept b",
    "좌우 이동 p": "Horizontal shift p",
    "위아래 이동 q": "Vertical shift q",
    "일차함수 그래프 탐구 시뮬레이터": "Linear Function Graph Exploration Simulator",
    "이차함수 그래프 탐구 시뮬레이터": "Quadratic Function Graph Exploration Simulator",
    "전체 탐험 포인트와 연동되지 않음": "Not linked to overall explorer points",
    "게임 전용 점수": "Game-only score",
    "이름/닉네임을 입력해주세요.": "Please enter a name or nickname.",
    "이메일과 비밀번호를 입력해주세요.": "Please enter email and password.",
    "학년을 선택해주세요.": "Please select a grade.",
    "비밀번호를 입력하세요": "Enter your password",
    "6자 이상": "At least 6 characters",
    "예) 김지우": "e.g., Alex Kim",
    "답 입력": "Enter answer"
  },
  zh: {
    "그래프탐험대": "图形探险队", "AI 기반 함수 그래프 학습 플래너": "AI 函数图像学习规划器", "로그인 상태를 확인하는 중입니다.": "正在确认登录状态。", "이름/닉네임": "姓名/昵称", "이메일": "电子邮件", "비밀번호": "密码", "학년": "年级", "선택": "选择", "중1": "初一", "중2": "初二", "중3": "初三", "회원가입": "注册", "비밀번호 찾기": "找回密码", "이메일로 로그인": "用电子邮件登录", "Google로 로그인": "用 Google 登录", "비회원으로 둘러보기": "游客浏览", "비회원은 포인트와 성장기록이 저장되지 않습니다.": "游客模式不会保存积分和成长记录。", "Firebase 회원가입": "Firebase 注册", "처리 중...": "处理中...", "로그인으로": "返回登录", "학생 이름": "学生姓名", "비회원 체험": "游客体验", "홈": "首页", "AI 그래프 해석": "AI 图像解析", "학습준비": "学习准备", "개념학습": "概念学习", "탐구활동": "探究活动", "게임존": "游戏区", "형성평가": "形成性评价", "성장기록": "成长记录", "설정": "设置", "언어 설정": "语言设置", "언어 지원 안내": "语言支持说明", "현재 언어": "当前语言", "선택됨": "已选择", "이 언어로 보기": "使用此语言", "체험 모드": "体验模式", "체험 종료": "结束体验", "로그아웃": "退出登录", "좌표에서 시작하는 그래프 탐험대": "从坐标开始的图形探险队", "일차함수 그래프 탐험대": "一次函数图形探险队", "이차함수 그래프 탐험대": "二次函数图形探险队", "탐험 포인트": "探险积分", "진단 시작": "开始诊断", "개념 익히기": "学习概念", "해석실 열기": "打开解析室", "탐구하기": "开始探究", "게임 시작": "开始游戏", "평가 시작": "开始评价", "기록 보기": "查看记录", "열기": "打开", "미션 완료": "任务完成", "미션 대기": "等待任务", "학습준비: 사전 진단": "学习准备：预诊断", "오늘의 추천 출발점": "今日推荐起点", "진단 결과 기준": "诊断结果标准", "진단 결과 확인": "查看诊断结果", "추천 학습으로 이동": "前往推荐学习", "바로 형성평가 보기": "直接查看形成性评价", "정답입니다.": "正确。", "정답입니다!": "正确！", "다시 확인해 보세요.": "请再确认。", "정답": "答案", "핵심 생각": "核心想法", "생각해보기": "思考一下", "꼭 확인할 점": "必须确认的要点", "표상 연결": "表征连接", "예": "例", "예시": "示例", "정비례": "正比例", "반비례": "反比例", "순서쌍과 좌표": "有序数对与坐标", "좌표평면": "坐标平面", "일차함수": "一次函数", "이차함수": "二次函数", "포물선": "抛物线", "꼭짓점": "顶点", "원점": "原点", "사분면": "象限", "기울기": "斜率", "절편": "截距", "함수식을 입력하세요.": "请输入函数式。", "AI 그래프 해석 시작": "开始 AI 图像解析", "그래프에서 확인할 점": "图像中要确认的内容", "개념 해석": "概念解析", "한 문제 더 풀기": "再做一题", "정답 보기": "查看答案", "정답 숨기기": "隐藏答案", "그래프": "图像", "좌표 미션": "坐标任务", "표 → 그래프": "表 → 图像", "그래프 도전": "图像挑战", "탐구 완료": "探究完成", "탐험 점 찍기": "标出探险点", "초기화": "重置", "좌표 입력": "输入坐标", "랜덤 미션": "随机任务", "그래프 그리기": "绘制图像", "그래프 완성하기": "完成图像", "랜덤 함수식": "随机函数式", "게임 선택": "选择游戏", "형성평가 풀러가기": "去做形成性评价", "형성평가 / 성장기록": "形成性评价 / 成长记录", "총점": "总分", "미응시": "未作答", "풀이 완료 문항": "已完成题目", "문제은행 기반 AI형 맞춤 추천": "基于题库的 AI 式个性化推荐", "우선 복습 추천": "优先复习推荐", "정답률": "正确率", "추천 난이도": "推荐难度", "추천 문제 세트": "推荐题组", "문항 이동": "题目移动", "현재 점수": "当前分数", "문제": "问题", "결과 보기": "查看结果", "다음": "下一题", "이전": "上一题", "다시 풀기": "重新作答", "실시간 함수식": "实时函数式", "전체 탐험 포인트와 연동되지 않음": "不与总探险积分联动", "게임 전용 점수": "游戏专用分数", "답 입력": "输入答案" },
  ja: {
    "그래프탐험대": "グラフ探検隊", "AI 기반 함수 그래프 학습 플래너": "AIベース関数グラフ学習プランナー", "로그인 상태를 확인하는 중입니다.": "ログイン状態を確認しています。", "이름/닉네임": "名前/ニックネーム", "이메일": "メール", "비밀번호": "パスワード", "학년": "学年", "선택": "選択", "중1": "中1", "중2": "中2", "중3": "中3", "회원가입": "新規登録", "비밀번호 찾기": "パスワード再設定", "이메일로 로그인": "メールでログイン", "Google로 로그인": "Googleでログイン", "비회원으로 둘러보기": "ゲストで見る", "비회원은 포인트와 성장기록이 저장되지 않습니다.": "ゲストモードではポイントと成長記録は保存されません。", "Firebase 회원가입": "Firebase登録", "처리 중...": "処理中...", "로그인으로": "ログインへ戻る", "학생 이름": "生徒名", "비회원 체험": "ゲスト体験", "홈": "ホーム", "AI 그래프 해석": "AIグラフ解析", "학습준비": "学習準備", "개념학습": "概念学習", "탐구활동": "探究活動", "게임존": "ゲームゾーン", "형성평가": "形成評価", "성장기록": "成長記録", "설정": "設定", "언어 설정": "言語設定", "언어 지원 안내": "言語サポート案内", "현재 언어": "現在の言語", "선택됨": "選択済み", "이 언어로 보기": "この言語で表示", "체험 모드": "体験モード", "체험 종료": "体験終了", "로그아웃": "ログアウト", "탐험 포인트": "探検ポイント", "진단 시작": "診断開始", "개념 익히기": "概念を学ぶ", "해석실 열기": "解析室を開く", "탐구하기": "探究する", "게임 시작": "ゲーム開始", "평가 시작": "評価開始", "기록 보기": "記録を見る", "열기": "開く", "미션 완료": "ミッション完了", "미션 대기": "ミッション待機", "학습준비: 사전 진단": "学習準備：事前診断", "오늘의 추천 출발점": "今日のおすすめ出発点", "진단 결과 기준": "診断結果の基準", "진단 결과 확인": "診断結果を確認", "추천 학습으로 이동": "おすすめ学習へ", "바로 형성평가 보기": "形成評価へ", "정답입니다.": "正解です。", "정답입니다!": "正解です！", "다시 확인해 보세요.": "もう一度確認しましょう。", "정답": "正解", "핵심 생각": "重要な考え", "생각해보기": "考えてみよう", "꼭 확인할 점": "確認ポイント", "표상 연결": "表現のつながり", "예": "例", "예시": "例", "정비례": "正比例", "반비례": "反比例", "순서쌍과 좌표": "順序対と座標", "좌표평면": "座標平面", "일차함수": "一次関数", "이차함수": "二次関数", "포물선": "放物線", "꼭짓점": "頂点", "원점": "原点", "사분면": "象限", "기울기": "傾き", "절편": "切片", "함수식을 입력하세요.": "関数式を入力してください。", "AI 그래프 해석 시작": "AIグラフ解析開始", "그래프에서 확인할 점": "グラフで確認する点", "개념 해석": "概念解釈", "한 문제 더 풀기": "もう一問", "정답 보기": "正解を見る", "정답 숨기기": "正解を隠す", "그래프": "グラフ", "좌표 미션": "座標ミッション", "표 → 그래프": "表 → グラフ", "그래프 도전": "グラフチャレンジ", "탐구 완료": "探究完了", "탐험 점 찍기": "探検点を打つ", "초기화": "リセット", "좌표 입력": "座標入力", "랜덤 미션": "ランダムミッション", "그래프 그리기": "グラフを描く", "그래프 완성하기": "グラフ完成", "랜덤 함수식": "ランダム関数式", "게임 선택": "ゲーム選択", "형성평가 풀러가기": "形成評価へ", "형성평가 / 성장기록": "形成評価 / 成長記録", "총점": "合計", "미응시": "未受験", "풀이 완료 문항": "解答済み問題", "문제은행 기반 AI형 맞춤 추천": "問題バンク型AIおすすめ", "우선 복습 추천": "優先復習", "정답률": "正答率", "추천 난이도": "おすすめ難易度", "추천 문제 세트": "おすすめ問題セット", "문항 이동": "問題移動", "현재 점수": "現在の点数", "문제": "問題", "결과 보기": "結果を見る", "다음": "次へ", "이전": "前へ", "다시 풀기": "もう一度", "실시간 함수식": "リアルタイム関数式", "전체 탐험 포인트와 연동되지 않음": "総探検ポイントとは連動しません", "게임 전용 점수": "ゲーム専用点数", "답 입력": "答えを入力" },
};

const reverseTranslationDictionary = (() => {
  const acc = {};

  Object.entries(translationDictionary).forEach(([, dict]) => {
    Object.entries(dict).forEach(([ko, translated]) => {
      if (typeof translated === "string" && translated.trim()) acc[translated] = ko;
    });
  });

  Object.entries(uiText).forEach(([languageCode, dict]) => {
    if (languageCode === "ko") return;
    Object.entries(dict).forEach(([key, translated]) => {
      const korean = uiText.ko?.[key];
      if (korean && typeof translated === "string" && translated.trim()) acc[translated] = korean;
    });
  });

  acc["按照 准备 → 개념학습 → 탐구활동 → 评价 的流程学习函数。"] = "준비-개념학습-탐구활동-평가 흐름으로 함수 학습을 안내합니다.";
  acc["按照 准备 → 개념학습 → 탐구활동 → 평가 的流程学习函数。"] = "준비-개념학습-탐구활동-평가 흐름으로 함수 학습을 안내합니다.";
  acc["按照 准备 → 概念学习 → 探究活动 → 评价 的流程学习函数。"] = "준비-개념학습-탐구활동-평가 흐름으로 함수 학습을 안내합니다.";
  acc["準備 → 개념학습 → 탐구활동 → 評価 の流れで関数学習を案内します。"] = "준비-개념학습-탐구활동-평가 흐름으로 함수 학습을 안내합니다.";

  return acc;
})();

function normalizeToKoreanText(text) {
  if (!text) return text;
  let result = text;
  Object.keys(reverseTranslationDictionary).sort((a, b) => b.length - a.length).forEach((translated) => {
    result = result.split(translated).join(reverseTranslationDictionary[translated]);
  });
  return result;
}

function manualTranslateText(text, language) {
  const koreanText = normalizeToKoreanText(text);
  if (language === "ko") return koreanText;
  const dict = translationDictionary[language];
  if (!dict || !koreanText) return koreanText;
  let result = koreanText;
  Object.keys(dict).sort((a, b) => b.length - a.length).forEach((key) => {
    result = result.split(key).join(dict[key]);
  });
  return result;
}

function applyManualTranslation(language) {
  if (typeof document === "undefined") return;

  const root = document.body;
  if (!root) return;

  const skipTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"]);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || skipTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("svg")) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    const currentText = node.nodeValue;
    const koreanText = normalizeToKoreanText(currentText);
    const nextText = language === "ko" ? koreanText : manualTranslateText(koreanText, language);

    if (node.nodeValue !== nextText) {
      node.nodeValue = nextText;
    }
  });

  document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((element) => {
    const currentPlaceholder = element.getAttribute("placeholder") || "";
    const koreanPlaceholder = normalizeToKoreanText(currentPlaceholder);
    const nextPlaceholder = language === "ko" ? koreanPlaceholder : manualTranslateText(koreanPlaceholder, language);

    if (element.getAttribute("placeholder") !== nextPlaceholder) {
      element.setAttribute("placeholder", nextPlaceholder);
    }
  });
}

const conceptCards = [
  { id: "orderedPair", title: "순서쌍과 좌표", desc: "순서쌍 (x, y)의 의미를 익혀요.", visual: "(x, y)" },
  { id: "plane", title: "좌표평면", desc: "x축, y축, 사분면을 익혀요.", visual: "axes" },
  { id: "direct", title: "정비례", desc: "y = ax의 관계를 알아봐요.", visual: "y = ax" },
  { id: "inverse", title: "반비례", desc: "y = a/x의 관계를 알아봐요.", visual: "y = a/x" },
];

const conceptLessons = {
  orderedPair: {
    title: "순서쌍과 좌표",
    subtitle: "점의 위치를 두 수의 짝으로 나타내기",
    expression: "(x, y)",
    bigIdea: "순서쌍은 좌표평면 위 한 점의 위치를 나타내는 약속입니다. 첫 번째 수는 x좌표, 두 번째 수는 y좌표입니다.",
    representation: [
      { label: "상황", value: "오른쪽 3칸, 위 2칸" },
      { label: "표", value: "x = 3, y = 2" },
      { label: "기호", value: "(3, 2)" },
      { label: "그래프", value: "좌표평면 위 점 A" },
    ],
    points: ["좌표는 항상 (x좌표, y좌표) 순서로 씁니다.", "x좌표는 가로 방향, y좌표는 세로 방향입니다.", "좌표 읽기는 그래프 해석의 출발점입니다."],
    prompt: "점 A(3, 2)를 설명할 때, x좌표와 y좌표가 각각 무엇을 뜻하는지 말해보세요.",
  },
  plane: {
    title: "좌표평면",
    subtitle: "x축과 y축, 원점, 사분면으로 위치 읽기",
    expression: "x축 · y축 · 원점 · 사분면",
    bigIdea: "좌표평면은 x축과 y축이 원점 O에서 수직으로 만나는 평면입니다. 두 좌표축은 좌표평면을 네 부분으로 나누며, 이 네 부분을 사분면이라고 합니다.",
    representation: [
      { label: "상황", value: "가로·세로 방향으로 위치 찾기" },
      { label: "표", value: "A: x=2, y=1" },
      { label: "기호", value: "A(2, 1)" },
      { label: "그래프", value: "제1사분면의 점" },
    ],
    quadrants: [
      { name: "제1사분면", sign: "(+, +)", example: "B(4, 3)", color: "bg-blue-50 text-blue-800" },
      { name: "제2사분면", sign: "(-, +)", example: "D(-2, 2)", color: "bg-purple-50 text-purple-800" },
      { name: "제3사분면", sign: "(-, -)", example: "A(-3, -1)", color: "bg-rose-50 text-rose-800" },
      { name: "제4사분면", sign: "(+, -)", example: "C(2, -1)", color: "bg-green-50 text-green-800" },
    ],
    points: ["가로축은 x축, 세로축은 y축입니다.", "원점의 좌표는 (0, 0)입니다.", "좌표축 위의 점은 어느 사분면에도 속하지 않습니다."],
    prompt: "점 P(-4, 2)는 제몇 사분면에 있을까요?",
  },
  direct: {
    title: "정비례",
    subtitle: "x의 값이 2배, 3배, 4배, …로 변함에 따라 y의 값도 똑같이 2배, 3배, 4배, …로 변하는 관계",
    expression: "y = ax",
    bigIdea: "두 변수 x, y에 대하여 x의 값이 2배, 3배, 4배, …로 변함에 따라 y의 값도 똑같이 2배, 3배, 4배, …로 변하는 관계를 정비례라고 합니다. 정비례 관계는 y=ax(a≠0) 꼴의 식으로 나타낼 수 있고, 그래프는 원점을 지나는 직선입니다.",
    points: ["정비례 관계에서는 y÷x의 값이 일정합니다.", "그래프는 반드시 원점 (0, 0)을 지납니다.", "직선이라고 해서 모두 정비례인 것은 아닙니다."],
  },
  inverse: {
    title: "반비례",
    subtitle: "x의 값이 2배, 3배, 4배, …로 변함에 따라 y의 값은 1/2배, 1/3배, 1/4배, …로 변하는 관계",
    expression: "y = a/x",
    bigIdea: "두 변수 x, y에 대하여 x의 값이 2배, 3배, 4배, …로 변함에 따라 y의 값이 1/2배, 1/3배, 1/4배, …로 변하는 관계를 반비례라고 합니다. 반비례 관계는 y=a/x(a≠0) 꼴의 식으로 나타낼 수 있고, xy의 값이 일정합니다.",
    points: ["반비례 관계에서는 xy의 값이 일정합니다.", "그래프는 좌표축에 가까워지지만 닿지 않습니다.", "감소하는 관계가 모두 반비례인 것은 아닙니다."],
  },
};

const assessmentSets = {
  coordinate: {
    title: "순서쌍과 좌표",
    color: "blue",
    questions: [
      { q: "순서쌍 (3, -2)에서 x좌표는 무엇인가요?", choices: ["3", "-2", "(3, -2)", "2"], answer: "3", explain: "순서쌍은 항상 (x좌표, y좌표) 순서입니다." },
      { q: "순서쌍 (-4, 5)에서 y좌표는 무엇인가요?", choices: ["-4", "4", "5", "-5"], answer: "5", explain: "두 번째 수가 y좌표입니다." },
      { q: "점 A(2, 3)은 어느 사분면에 있나요?", choices: ["제1사분면", "제2사분면", "제3사분면", "제4사분면"], answer: "제1사분면", explain: "x>0, y>0이면 제1사분면입니다." },
      { q: "점 B(-2, 4)는 어느 사분면에 있나요?", choices: ["제1사분면", "제2사분면", "제3사분면", "제4사분면"], answer: "제2사분면", explain: "x<0, y>0이면 제2사분면입니다." },
      { q: "점 C(-3, -1)는 어느 사분면에 있나요?", choices: ["제1사분면", "제2사분면", "제3사분면", "제4사분면"], answer: "제3사분면", explain: "x<0, y<0이면 제3사분면입니다." },
      { q: "점 D(5, -2)는 어느 사분면에 있나요?", choices: ["제1사분면", "제2사분면", "제3사분면", "제4사분면"], answer: "제4사분면", explain: "x>0, y<0이면 제4사분면입니다." },
      { q: "원점 O의 좌표는 무엇인가요?", choices: ["(1, 1)", "(0, 0)", "(0, 1)", "(1, 0)"], answer: "(0, 0)", explain: "x축과 y축이 만나는 점이 원점입니다." },
      { q: "점 (0, 4)는 어느 곳에 있나요?", choices: ["x축 위", "y축 위", "제1사분면", "제2사분면"], answer: "y축 위", explain: "x좌표가 0인 점은 y축 위에 있습니다." },
      { q: "점 (-3, 0)는 어느 곳에 있나요?", choices: ["x축 위", "y축 위", "제2사분면", "제3사분면"], answer: "x축 위", explain: "y좌표가 0인 점은 x축 위에 있습니다." },
      { q: "좌표축 위의 점에 대한 설명으로 맞는 것은?", choices: ["항상 제1사분면이다", "어느 사분면에도 속하지 않는다", "항상 제2사분면이다", "항상 제3사분면이다"], answer: "어느 사분면에도 속하지 않는다", explain: "좌표축 위의 점은 사분면에 포함하지 않습니다." },
    ],
  },
  direct: {
    title: "정비례",
    color: "emerald",
    questions: [
      { q: "정비례 관계를 나타내는 식은?", choices: ["y = ax", "y = a/x", "y = ax + b", "xy = x + y"], answer: "y = ax", explain: "정비례는 y=ax(a≠0) 꼴입니다." },
      { q: "y = 3x에서 x=2일 때 y는?", choices: ["5", "6", "8", "9"], answer: "6", explain: "y=3×2=6입니다." },
      { q: "y = -2x에서 x=3일 때 y는?", choices: ["6", "-6", "1", "-1"], answer: "-6", explain: "y=-2×3=-6입니다." },
      { q: "정비례 y=ax의 그래프는 반드시 어느 점을 지나나요?", choices: ["(1, 0)", "(0, 1)", "(0, 0)", "(1, 1)"], answer: "(0, 0)", explain: "정비례 그래프는 항상 원점을 지납니다." },
      { q: "y = 4x에서 y÷x의 값은?", choices: ["1", "2", "4", "x"], answer: "4", explain: "정비례에서는 y÷x=a로 일정합니다." },
      { q: "표 x: 1,2,3 / y: 5,10,15는 어떤 관계인가요?", choices: ["정비례", "반비례", "관계 없음", "이차함수"], answer: "정비례", explain: "y÷x가 모두 5로 일정합니다." },
      { q: "정비례 그래프가 원점을 지나지 않는다면?", choices: ["항상 정비례", "정비례가 아니다", "항상 반비례", "판단할 수 없음"], answer: "정비례가 아니다", explain: "정비례 그래프는 반드시 원점을 지납니다." },
      { q: "y = -3x의 그래프는 어느 사분면을 지나나요?", choices: ["제1,3사분면", "제2,4사분면", "제1,2사분면", "제3,4사분면"], answer: "제2,4사분면", explain: "a<0이면 제2사분면과 제4사분면을 지납니다." },
      { q: "y = 2x의 그래프와 y = 4x의 그래프 중 더 가파른 것은?", choices: ["y=2x", "y=4x", "같다", "알 수 없다"], answer: "y=4x", explain: "|a|가 클수록 더 가파릅니다." },
      { q: "정비례 관계를 판단할 때 가장 중요한 값은?", choices: ["x+y", "x-y", "y÷x", "x÷y+1"], answer: "y÷x", explain: "정비례에서는 y÷x가 일정합니다." },
    ],
  },
  inverse: {
    title: "반비례",
    color: "violet",
    questions: [
      { q: "반비례 관계를 나타내는 식은?", choices: ["y = ax", "y = a/x", "y = ax + b", "y = x + a"], answer: "y = a/x", explain: "반비례는 y=a/x(a≠0) 꼴입니다." },
      { q: "y = 12/x에서 x=3일 때 y는?", choices: ["3", "4", "6", "9"], answer: "4", explain: "y=12÷3=4입니다." },
      { q: "y = 10/x에서 x=2일 때 xy의 값은?", choices: ["2", "5", "10", "20"], answer: "10", explain: "반비례에서는 xy=a로 일정합니다." },
      { q: "표 x: 1,2,4 / y: 12,6,3은 어떤 관계인가요?", choices: ["정비례", "반비례", "일차함수", "관계 없음"], answer: "반비례", explain: "xy가 모두 12로 일정합니다." },
      { q: "반비례 그래프는 좌표축과 어떻게 되나요?", choices: ["항상 만난다", "가까워지지만 만나지 않는다", "반드시 원점을 지난다", "직선이다"], answer: "가까워지지만 만나지 않는다", explain: "반비례 그래프는 좌표축에 가까워지지만 닿지 않습니다." },
      { q: "y = 6/x의 그래프는 어느 사분면에 나타나나요?", choices: ["제1,3사분면", "제2,4사분면", "제1,2사분면", "제3,4사분면"], answer: "제1,3사분면", explain: "a>0이면 제1사분면과 제3사분면에 나타납니다." },
      { q: "y = -8/x의 그래프는 어느 사분면에 나타나나요?", choices: ["제1,3사분면", "제2,4사분면", "제1,4사분면", "제2,3사분면"], answer: "제2,4사분면", explain: "a<0이면 제2사분면과 제4사분면에 나타납니다." },
      { q: "감소하는 관계는 모두 반비례인가요?", choices: ["항상 그렇다", "아니다", "정비례이다", "좌표축 위에 있다"], answer: "아니다", explain: "반비례는 단순 감소가 아니라 xy가 일정해야 합니다." },
      { q: "반비례 y=a/x에서 x=0을 사용할 수 있나요?", choices: ["가능하다", "불가능하다", "항상 y=0이다", "항상 a=0이다"], answer: "불가능하다", explain: "0으로 나눌 수 없으므로 x=0은 사용할 수 없습니다." },
      { q: "반비례 관계를 판단할 때 가장 중요한 값은?", choices: ["y÷x", "x+y", "xy", "x-y"], answer: "xy", explain: "반비례에서는 xy가 일정합니다." },
    ],
  },
};

const recommendationBank = {
  coordinate: [
    { id: "co_basic_01", difficulty: "basic", skill: "x좌표와 y좌표 구분", q: "점 P(-5, 2)에서 x좌표와 y좌표를 바르게 말한 것은?", choices: ["x=2, y=-5", "x=-5, y=2", "x=-2, y=5", "x=5, y=-2"], answer: "x=-5, y=2", explain: "순서쌍은 항상 (x좌표, y좌표) 순서로 읽습니다." },
    { id: "co_basic_02", difficulty: "basic", skill: "좌표축 위의 점", q: "점 (0, -3)은 어디에 있나요?", choices: ["x축 위", "y축 위", "제3사분면", "제4사분면"], answer: "y축 위", explain: "x좌표가 0이면 y축 위의 점입니다." },
    { id: "co_standard_01", difficulty: "standard", skill: "사분면 판별", q: "x좌표가 음수이고 y좌표가 양수인 점은 어느 사분면에 있나요?", choices: ["제1사분면", "제2사분면", "제3사분면", "제4사분면"], answer: "제2사분면", explain: "(-, +)는 제2사분면입니다." },
    { id: "co_standard_02", difficulty: "standard", skill: "좌표축과 사분면 구별", q: "점 (4, 0)에 대한 설명으로 맞는 것은?", choices: ["제1사분면에 있다", "제4사분면에 있다", "x축 위에 있다", "y축 위에 있다"], answer: "x축 위에 있다", explain: "y좌표가 0이면 x축 위에 있습니다. 좌표축 위의 점은 사분면에 속하지 않습니다." },
    { id: "co_challenge_01", difficulty: "challenge", skill: "조건 만족 좌표", q: "제3사분면에 있으면서 x좌표가 -2인 점은?", choices: ["(-2, 3)", "(-2, -4)", "(2, -4)", "(2, 4)"], answer: "(-2, -4)", explain: "제3사분면은 x<0, y<0인 점입니다." },
  ],
  direct: [
    { id: "di_basic_01", difficulty: "basic", skill: "정비례 식 구분", q: "다음 중 정비례 관계를 나타내는 식은?", choices: ["y=3x", "y=3/x", "y=x+3", "y=x²"], answer: "y=3x", explain: "정비례는 y=ax(a≠0) 꼴입니다." },
    { id: "di_basic_02", difficulty: "basic", skill: "대입 계산", q: "y=5x에서 x=-2일 때 y는?", choices: ["-10", "10", "-7", "3"], answer: "-10", explain: "y=5×(-2)=-10입니다." },
    { id: "di_standard_01", difficulty: "standard", skill: "y÷x 일정성", q: "표 x: 2, 4, 6 / y: 6, 12, 18에서 y÷x의 값은?", choices: ["2", "3", "4", "6"], answer: "3", explain: "6÷2=3, 12÷4=3, 18÷6=3으로 일정합니다." },
    { id: "di_standard_02", difficulty: "standard", skill: "그래프 특징", q: "정비례 그래프에 대한 설명으로 옳은 것은?", choices: ["항상 원점을 지난다", "항상 y축과 평행하다", "항상 곡선이다", "항상 x축과 만나지 않는다"], answer: "항상 원점을 지난다", explain: "정비례 y=ax의 그래프는 원점 (0,0)을 지나는 직선입니다." },
    { id: "di_challenge_01", difficulty: "challenge", skill: "기울기 비교", q: "y=-4x와 y=-2x 중 더 가파른 그래프는?", choices: ["y=-4x", "y=-2x", "같다", "판단할 수 없다"], answer: "y=-4x", explain: "|a|가 클수록 정비례 그래프는 더 가파릅니다." },
  ],
  inverse: [
    { id: "in_basic_01", difficulty: "basic", skill: "반비례 식 구분", q: "다음 중 반비례 관계를 나타내는 식은?", choices: ["y=4x", "y=4/x", "y=x+4", "y=x-4"], answer: "y=4/x", explain: "반비례는 y=a/x(a≠0) 꼴입니다." },
    { id: "in_basic_02", difficulty: "basic", skill: "대입 계산", q: "y=12/x에서 x=-3일 때 y는?", choices: ["-4", "4", "-9", "15"], answer: "-4", explain: "y=12÷(-3)=-4입니다." },
    { id: "in_standard_01", difficulty: "standard", skill: "xy 일정성", q: "표 x: 1, 2, 4 / y: 8, 4, 2에서 xy의 값은?", choices: ["4", "6", "8", "16"], answer: "8", explain: "1×8=8, 2×4=8, 4×2=8로 일정합니다." },
    { id: "in_standard_02", difficulty: "standard", skill: "그래프 특징", q: "반비례 그래프에 대한 설명으로 옳은 것은?", choices: ["반드시 원점을 지난다", "좌표축에 가까워지지만 닿지 않는다", "항상 직선이다", "x=0에서 값이 정해진다"], answer: "좌표축에 가까워지지만 닿지 않는다", explain: "반비례 그래프는 좌표축에 가까워지지만 좌표축과 만나지 않습니다." },
    { id: "in_challenge_01", difficulty: "challenge", skill: "사분면 판단", q: "y=-6/x의 그래프가 나타나는 사분면은?", choices: ["제1,3사분면", "제2,4사분면", "제1,4사분면", "제2,3사분면"], answer: "제2,4사분면", explain: "a<0인 반비례 그래프는 제2사분면과 제4사분면에 나타납니다." },
  ],
};

function cleanExpression(input) {
  return (input || "").toLowerCase().replaceAll(" ", "").replaceAll("*", "").replaceAll("²", "^2").replaceAll("−", "-");
}

function parseMathNumber(raw) {
  const text = String(raw ?? "").trim().replaceAll(" ", "").replaceAll("−", "-");
  if (text === "" || text === "+" || text === "-" || text === "." || text === "-." || text === "/") return NaN;
  if (text.includes("/")) {
    const parts = text.split("/");
    if (parts.length !== 2) return NaN;
    const numerator = Number(parts[0]);
    const denominator = Number(parts[1]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return NaN;
    return numerator / denominator;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : NaN;
}

function normalizeMathInput(raw, options = {}) {
  const { allowFraction = true } = options;
  let cleaned = String(raw ?? "").replaceAll(" ", "").replaceAll("−", "-");
  cleaned = cleaned.replace(allowFraction ? /[^0-9.\-/]/g : /[^0-9.\-]/g, "");
  cleaned = cleaned.replace(/(?!^)-/g, "");
  const slashParts = cleaned.split("/");
  if (slashParts.length > 2) cleaned = `${slashParts[0]}/${slashParts.slice(1).join("")}`;
  cleaned = cleaned
    .split("/")
    .map((part) => {
      const dotParts = part.split(".");
      return dotParts.length > 2 ? `${dotParts[0]}.${dotParts.slice(1).join("")}` : part;
    })
    .join("/");
  return cleaned;
}

function coefficientFromText(text, defaultValue = 1) {
  if (text === "" || text === "+") return defaultValue;
  if (text === "-") return -defaultValue;
  const value = parseMathNumber(text);
  return Number.isFinite(value) ? value : 0;
}

function formatValue(value) {
  if (!Number.isFinite(value)) return "없음";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function stripUnitPrefix(text = "") {
  const value = String(text).replaceAll("~4.", "~").trim();
  return value.startsWith("4.") ? value.slice(2).trim() : value;
}

function formatSignedValue(value) {
  if (!Number.isFinite(value)) return "+0";
  return value >= 0 ? `+${formatValue(value)}` : formatValue(value);
}

function formatQuadraticStandard(a, b, c) {
  const aText = a === 1 ? "x²" : a === -1 ? "-x²" : `${formatValue(a)}x²`;
  const bText = b === 0 ? "" : b === 1 ? "+x" : b === -1 ? "-x" : `${formatSignedValue(b)}x`;
  const cText = c === 0 ? "" : formatSignedValue(c);
  return `y = ${aText}${bText}${cText}`;
}

function formatQuadraticVertex(a, p, q) {
  const aText = a === 1 ? "" : a === -1 ? "-" : formatValue(a);
  const pText = p === 0 ? "x" : p > 0 ? `x-${formatValue(p)}` : `x+${formatValue(Math.abs(p))}`;
  const qText = q === 0 ? "" : formatSignedValue(q);
  return `y = ${aText}(${pText})²${qText}`;
}

function parseMiddleSchoolFunction(input) {
  let expression = cleanExpression(input);
  if (!expression || expression === "y=") return { error: "함수식을 입력해주세요. 예: y=2x, y=1/x" };
  if (!expression.startsWith("y=")) expression = "y=" + expression;
  const right = expression.slice(2);

  // 반비례: y = a/x, y = -a/x, y = x^-1, y = 1/x 형태 지원
  if (right.includes("/x") || right === "x^-1" || right === "1/x" || right === "-1/x") {
    let aText = right.replace("/x", "");
    if (right === "x^-1") aText = "1";
    const a = coefficientFromText(aText, 1);
    if (!Number.isFinite(a) || a === 0) return { error: "반비례는 y=1/x, y=4/x, y=-3/x처럼 입력해주세요. a는 0이 아니어야 합니다." };
    return { type: "inverse", expression, a };
  }

  // 이차함수 표준형: y = a(x-p)^2 + q
  if (right.includes("(x") && right.includes(")^2")) {
    const openIndex = right.indexOf("(x");
    const closeIndex = right.indexOf(")^2", openIndex);
    const aText = right.slice(0, openIndex);
    const innerText = right.slice(openIndex + 2, closeIndex);
    const qText = right.slice(closeIndex + 3);
    const a = coefficientFromText(aText, 1);
    const p = innerText === "" ? 0 : -parseMathNumber(innerText);
    const q = parseMathNumber(qText || 0);
    const b = -2 * a * p;
    const c = a * p * p + q;
    if (!Number.isFinite(a) || !Number.isFinite(p) || !Number.isFinite(q) || a === 0) return { error: "이차함수 표준형은 y=(x-2)^2+3, y=2(x+1)^2-4처럼 입력해주세요." };
    return { type: "quadratic", expression, a, b, c, p, q, quadraticForm: "vertex" };
  }

  // 이차함수 일반형: y = ax^2 + bx + c
  if (right.includes("x^2")) {
    const [aText, restText = ""] = right.split("x^2");
    const a = coefficientFromText(aText, 1);
    let b = 0;
    let c = 0;
    if (restText.includes("x")) {
      const xIndex = restText.indexOf("x");
      b = coefficientFromText(restText.slice(0, xIndex), 1);
      c = parseMathNumber(restText.slice(xIndex + 1) || 0);
    } else {
      c = parseMathNumber(restText || 0);
    }
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || a === 0) return { error: "이차함수는 y=x^2-4x+3 또는 y=(x-2)^2+3처럼 입력해주세요." };
    const p = -b / (2 * a);
    const q = c - (b * b) / (4 * a);
    return { type: "quadratic", expression, a, b, c, p, q, quadraticForm: "general" };
  }

  // 정비례/일차함수: y = ax + b
  if (right.includes("x")) {
    const xIndex = right.indexOf("x");
    const a = coefficientFromText(right.slice(0, xIndex), 1);
    const b = parseMathNumber(right.slice(xIndex + 1) || 0);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return { error: "일차함수는 y=2x+1, 정비례는 y=2x처럼 입력해주세요." };
    return { type: b === 0 ? "direct" : "linear", expression, a, b };
  }

  return { error: "현재는 정비례 y=ax, 반비례 y=a/x, 일차함수, 이차함수를 지원해요." };
}

function functionValue(parsed, x) {
  if (parsed.type === "direct" || parsed.type === "linear") return parsed.a * x + (parsed.b || 0);
  if (parsed.type === "inverse") return x === 0 ? NaN : parsed.a / x;
  return parsed.a * x * x + parsed.b * x + parsed.c;
}

function analyzeMiddleSchoolFunction(parsed) {
  if (!parsed || parsed.error || !parsed.expression) return null;
  const title = parsed.expression.replace("y=", "y = ").replaceAll("^2", "²");
  if (parsed.type === "direct") {
    return {
      title,
      summary: parsed.a > 0 ? "정비례 함수입니다. 그래프는 원점을 지나며 제1사분면과 제3사분면을 지납니다." : "정비례 함수입니다. 그래프는 원점을 지나며 제2사분면과 제4사분면을 지납니다.",
      features: [["함수 종류", "정비례"], ["식의 꼴", "y = ax"], ["a의 값", formatValue(parsed.a)], ["그래프", "원점을 지나는 직선"]],
      question: "이 함수에서 y÷x의 값은 얼마인가요?",
      answer: formatValue(parsed.a),
    };
  }
  if (parsed.type === "inverse") {
    return {
      title,
      summary: parsed.a > 0 ? "반비례 함수입니다. 그래프는 제1사분면과 제3사분면에 나타납니다." : "반비례 함수입니다. 그래프는 제2사분면과 제4사분면에 나타납니다.",
      features: [["함수 종류", "반비례"], ["식의 꼴", "y = a/x"], ["a의 값", formatValue(parsed.a)], ["일정한 값", `xy = ${formatValue(parsed.a)}`]],
      question: "이 함수에서 xy의 값은 얼마인가요?",
      answer: formatValue(parsed.a),
    };
  }
  if (parsed.type === "linear") {
    const xIntercept = parsed.a === 0 ? null : -parsed.b / parsed.a;
    return {
      title,
      summary: parsed.a > 0 ? "오른쪽 위로 올라가는 일차함수입니다." : parsed.a < 0 ? "오른쪽 아래로 내려가는 일차함수입니다." : "x축과 평행한 일차함수입니다.",
      features: [["함수 종류", "일차함수"], ["기울기", formatValue(parsed.a)], ["y절편", formatValue(parsed.b)], ["x절편", xIntercept === null ? "없음" : formatValue(xIntercept)]],
      question: "이 함수의 y절편은 얼마인가요?",
      answer: formatValue(parsed.b),
    };
  }
  const vertexX = Number.isFinite(parsed.p) ? parsed.p : -parsed.b / (2 * parsed.a);
  const vertexY = Number.isFinite(parsed.q) ? parsed.q : functionValue(parsed, vertexX);
  return {
    title,
    summary: parsed.a > 0 ? "아래로 볼록한 이차함수이며 최솟값을 가집니다." : "위로 볼록한 이차함수이며 최댓값을 가집니다.",
    features: [["함수 종류", "이차함수"], ["일반형", formatQuadraticStandard(parsed.a, parsed.b, parsed.c)], ["표준형", formatQuadraticVertex(parsed.a, vertexX, vertexY)], ["꼭짓점", `(${formatValue(vertexX)}, ${formatValue(vertexY)})`], ["축의 방정식", `x = ${formatValue(vertexX)}`], [parsed.a > 0 ? "최솟값" : "최댓값", formatValue(vertexY)]],
    question: "이 함수의 꼭짓점 좌표는 무엇인가요?",
    answer: `(${formatValue(vertexX)}, ${formatValue(vertexY)})`,
  };
}

function dedupePoints(points) {
  const result = [];
  points.forEach((p) => {
    const exists = result.some((q) => Math.abs(q.x - p.x) < 1e-6 && Math.abs(q.y - p.y) < 1e-6);
    if (!exists) result.push(p);
  });
  return result;
}

function getClippedDirectSegment(a, xMin = -5, xMax = 5, yMin = -5, yMax = 5) {
  if (a === 0) return null;
  const candidates = [
    { x: xMin, y: a * xMin },
    { x: xMax, y: a * xMax },
    { x: yMin / a, y: yMin },
    { x: yMax / a, y: yMax },
  ].filter((p) => p.x >= xMin - 1e-6 && p.x <= xMax + 1e-6 && p.y >= yMin - 1e-6 && p.y <= yMax + 1e-6);
  const unique = dedupePoints(candidates);
  if (unique.length < 2) return null;
  unique.sort((p1, p2) => (p1.x === p2.x ? p1.y - p2.y : p1.x - p2.x));
  return [unique[0], unique[unique.length - 1]];
}

function buildInverseSegments(a, xMin = -5, xMax = 5, yMin = -5, yMax = 5, step = 0.025) {
  if (a === 0) return [];
  const ranges = [[xMin, -0.1], [0.1, xMax]];
  const segments = [];
  ranges.forEach(([start, end]) => {
    let current = [];
    for (let x = start; x <= end; x += step) {
      const y = a / x;
      const visible = Number.isFinite(y) && y >= yMin && y <= yMax;
      if (visible) current.push({ x, y });
      else if (current.length > 0) {
        segments.push(current);
        current = [];
      }
    }
    if (current.length > 0) segments.push(current);
  });
  return segments;
}

function getAssessmentSummary(answers = {}) {
  const units = Object.entries(assessmentSets).map(([key, set]) => {
    const unitAnswers = answers[key] || {};
    const correct = set.questions.reduce((sum, question, index) => sum + (unitAnswers[index] === question.answer ? 1 : 0), 0);
    const solved = set.questions.reduce((sum, _question, index) => sum + (unitAnswers[index] ? 1 : 0), 0);
    return {
      key,
      title: set.title,
      correct,
      solved,
      total: set.questions.length,
      percent: Math.round((correct / set.questions.length) * 100),
    };
  });

  const totalCorrect = units.reduce((sum, unit) => sum + unit.correct, 0);
  const totalSolved = units.reduce((sum, unit) => sum + unit.solved, 0);
  const totalQuestions = units.reduce((sum, unit) => sum + unit.total, 0);
  const averagePercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const attemptedUnits = units.filter((unit) => unit.solved > 0);
  const weakest = (attemptedUnits.length > 0 ? attemptedUnits : units).sort((a, b) => a.percent - b.percent)[0];

  return { units, totalCorrect, totalSolved, totalQuestions, averagePercent, weakest };
}

function getRecommendationLevel(percent) {
  if (percent <= 50) return "basic";
  if (percent < 80) return "standard";
  return "challenge";
}

function getRecommendedQuestions(summary) {
  if (!summary || summary.totalSolved === 0) return [];
  const targetUnit = summary.weakest?.key || "coordinate";
  const targetPercent = summary.weakest?.percent ?? 0;
  const targetLevel = getRecommendationLevel(targetPercent);
  const bank = recommendationBank[targetUnit] || [];
  const priority = bank.filter((item) => item.difficulty === targetLevel);
  const support = bank.filter((item) => item.difficulty !== targetLevel);
  return [...priority, ...support].slice(0, 5).map((item, index) => ({ ...item, order: index + 1, unit: targetUnit, unitTitle: summary.weakest.title }));
}

const misconceptionCatalog = {
  coordinateOrder: { title: "좌표 순서 혼동", desc: "순서쌍 (x, y)에서 x좌표와 y좌표의 순서를 바꾸어 생각하는 경향이 있습니다.", route: "순서쌍과 좌표 개념학습 → 좌표 미션" },
  quadrantSign: { title: "사분면 부호 혼동", desc: "각 사분면의 x좌표, y좌표 부호를 안정적으로 연결하지 못하고 있습니다.", route: "좌표평면 개념학습 → 사전 진단 재도전" },
  axisPoint: { title: "좌표축 위의 점 오개념", desc: "좌표축 위의 점을 사분면에 포함한다고 생각할 가능성이 있습니다.", route: "좌표평면 개념학습 → 좌표축 점 찍기" },
  directOrigin: { title: "정비례-일차함수 혼동", desc: "직선이면 모두 정비례라고 판단하거나, 원점을 지나는 조건을 놓치고 있습니다.", route: "정비례 개념학습 → 표 → 그래프 탐구" },
  directRatio: { title: "정비례 일정값 혼동", desc: "정비례에서 일정한 값이 y÷x라는 점을 xy 또는 x+y와 혼동하고 있습니다.", route: "정비례 표 완성하기 → 정비례 매칭 게임" },
  inverseProduct: { title: "반비례 일정값 혼동", desc: "반비례에서 일정한 값이 xy라는 점을 y÷x와 혼동하고 있습니다.", route: "반비례 개념학습 → 반비례 수사대" },
  inverseAxis: { title: "반비례 그래프 축 오개념", desc: "반비례 그래프가 좌표축에 가까워지지만 만나지 않는다는 특징을 더 확인해야 합니다.", route: "반비례 그래프 조작 → AI 그래프 해석" },
  slopeIntercept: { title: "기울기-y절편 혼동", desc: "y=ax+b에서 a와 b의 역할을 혼동하고 있습니다.", route: "중2 기울기·절편 개념학습 → 일차함수 시뮬레이터" },
  lineEquation: { title: "일차함수 식 세우기 미숙", desc: "기울기, 한 점, 두 점을 이용해 y=ax+b를 세우는 과정이 더 필요합니다.", route: "중2 일차함수의 식 구하기 → 그래프 해석실" },
  quadraticDirection: { title: "이차함수 방향 오개념", desc: "a의 부호와 포물선이 열리는 방향을 혼동하고 있습니다.", route: "중3 y=ax² 개념학습 → 포물선 마스터" },
  vertexAxis: { title: "꼭짓점-축 혼동", desc: "표준형 y=a(x-p)²+q에서 꼭짓점 (p,q)와 축 x=p를 구분하는 연습이 필요합니다.", route: "중3 표준형 개념학습 → 이차함수 시뮬레이터" },
  shiftSign: { title: "평행이동 부호 혼동", desc: "(x-p)² 안의 부호와 실제 좌우 이동 방향을 반대로 해석할 가능성이 있습니다.", route: "중3 y=a(x-p)² 개념학습 → p 슬라이더 조작" },
};

function getMiddle1Misconceptions(answers = {}) {
  const results = [];
  const add = (key, evidence) => results.push({ key, evidence, ...misconceptionCatalog[key] });
  const coordinate = answers.coordinate || {};
  const direct = answers.direct || {};
  const inverse = answers.inverse || {};
  if (coordinate[0] && coordinate[0] !== assessmentSets.coordinate.questions[0].answer) add("coordinateOrder", "순서쌍의 첫 번째 값과 두 번째 값을 구분하는 문항에서 오답이 있었습니다.");
  if ([2, 3, 4, 5].some((i) => coordinate[i] && coordinate[i] !== assessmentSets.coordinate.questions[i].answer)) add("quadrantSign", "사분면 판별 문항에서 오답이 있었습니다.");
  if ([7, 8, 9].some((i) => coordinate[i] && coordinate[i] !== assessmentSets.coordinate.questions[i].answer)) add("axisPoint", "좌표축 위의 점을 해석하는 문항에서 오답이 있었습니다.");
  if ([0, 3, 6].some((i) => direct[i] && direct[i] !== assessmentSets.direct.questions[i].answer)) add("directOrigin", "정비례의 식과 원점 통과 조건을 묻는 문항에서 오답이 있었습니다.");
  if ([4, 5, 9].some((i) => direct[i] && direct[i] !== assessmentSets.direct.questions[i].answer)) add("directRatio", "정비례의 일정한 값 y÷x를 묻는 문항에서 오답이 있었습니다.");
  if ([0, 2, 3, 9].some((i) => inverse[i] && inverse[i] !== assessmentSets.inverse.questions[i].answer)) add("inverseProduct", "반비례의 식과 일정한 값 xy를 묻는 문항에서 오답이 있었습니다.");
  if ([4, 8].some((i) => inverse[i] && inverse[i] !== assessmentSets.inverse.questions[i].answer)) add("inverseAxis", "반비례 그래프의 좌표축 관계를 묻는 문항에서 오답이 있었습니다.");
  return results.filter((item, index, arr) => arr.findIndex((other) => other.key === item.key) === index).slice(0, 4);
}

function getGradeMisconceptions(grade, data, answers = {}) {
  const wrongTexts = data.assessment.map((q, i) => answers[i] && answers[i] !== q.answer ? q.q + " " + q.explain : "").join(" ");
  const results = [];
  const add = (key, evidence) => results.push({ key, evidence, ...misconceptionCatalog[key] });
  if (grade === "middle2") {
    if (/기울기|y절편|절편|b/.test(wrongTexts)) add("slopeIntercept", "기울기 또는 y절편 관련 문항에서 오답이 있었습니다.");
    if (/두 점|식은|평행|그래프/.test(wrongTexts)) add("lineEquation", "그래프 조건에서 식을 세우거나 성질을 해석하는 문항에서 오답이 있었습니다.");
  }
  if (grade === "middle3") {
    if (/a>0|아래로 볼록|위로 볼록|폭/.test(wrongTexts)) add("quadraticDirection", "a의 부호, 방향, 폭을 해석하는 문항에서 오답이 있었습니다.");
    if (/꼭짓점|축의 방정식|최댓값|최솟값/.test(wrongTexts)) add("vertexAxis", "꼭짓점, 축의 방정식, 최댓값·최솟값 문항에서 오답이 있었습니다.");
    if (/왼쪽|오른쪽|평행이동|x\+2/.test(wrongTexts)) add("shiftSign", "좌우 평행이동 방향을 해석하는 문항에서 오답이 있었습니다.");
  }
  return results.filter((item, index, arr) => arr.findIndex((other) => other.key === item.key) === index).slice(0, 4);
}

function getPrescriptionSteps({ gradeLabel = "중1", weakestTitle = "좌표와 그래프", misconceptionTitle = "기초 개념 확인", route = "개념학습" }) {
  return [
    { step: "1단계", title: "개념 복습", desc: `${gradeLabel} ${weakestTitle}에서 ${misconceptionTitle}을 다시 확인합니다.`, action: "개념학습" },
    { step: "2단계", title: "그래프 조작", desc: "슬라이더나 좌표평면에서 직접 값을 바꾸며 그래프 변화를 관찰합니다.", action: "탐구활동" },
    { step: "3단계", title: "맞춤 문제", desc: "오답 유형과 연결된 추천 문제 세트를 3문항 이상 다시 풉니다.", action: "성장기록" },
    { step: "4단계", title: "자기 설명", desc: `오늘 확인한 내용을 한 문장으로 설명합니다. 추천 경로: ${route}`, action: "설명 기록" },
  ];
}

export default function App() {
  const [active, setActive] = useState("home");
  const [authUser, setAuthUser] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem("functionExplorerLanguage") || "ko");
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [studentProfile, setStudentProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("functionExplorerStudentProfile") || "{}");
    } catch {
      return {};
    }
  });
  const [grade, setGrade] = useState("middle1");
  const getProgressStorageKey = (uid, suffix) => "functionExplorer:" + (uid || "guest") + ":" + suffix;
  const [expPoints, setExpPoints] = useState(0);
  const [missionCompleted, setMissionCompleted] = useState({});
  const studentName = guestMode ? "비회원 체험" : studentProfile.name || authUser?.displayName || localStorage.getItem("functionExplorerStudentName") || "학생 이름";
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [points, setPoints] = useState([{ x: 2, y: 1 }]);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [gradeAssessmentAnswers, setGradeAssessmentAnswers] = useState({});
  const [graphReflections, setGraphReflections] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("functionExplorerGraphReflections") || "{}");
    } catch {
      return {};
    }
  });
  const activeTitle = useMemo(() => getUiText(language, navItems.find((item) => item.id === active)?.labelKey || active), [active, language]);

  useEffect(() => {
    localStorage.setItem("functionExplorerLanguage", language);
  }, [language]);

  useEffect(() => {
    const run = () => applyManualTranslation(language);
    const frame = requestAnimationFrame(run);
    const observer = new MutationObserver(() => requestAnimationFrame(run));
    if (typeof document !== "undefined" && document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [language, active, grade]);
  const saveGraphReflection = (scope, text) => {
    const key = `${grade}:${scope}`;
    const trimmed = String(text || "").trim();
    const next = {
      ...graphReflections,
      [key]: {
        text: trimmed,
        feedback: makeGraphExplanationFeedback(trimmed, grade),
        updatedAt: new Date().toISOString(),
      },
    };
    setGraphReflections(next);
    if (!guestMode) localStorage.setItem("functionExplorerGraphReflections", JSON.stringify(next));
  };
  const awardPoints = (amount) => {
    if (guestMode) return;
    setExpPoints((prev) => {
      const next = prev + amount;
      localStorage.setItem(getProgressStorageKey(authUser?.uid, "points"), String(next));
      localStorage.removeItem("functionExplorerPoints");
      return next;
    });
  };
  const completeMission = (missionId, points = 20) => {
    const key = `${grade}:${missionId}`;
    if (missionCompleted[key]) return false;
    const nextCompleted = { ...missionCompleted, [key]: true };
    setMissionCompleted(nextCompleted);
    if (!guestMode) {
      localStorage.setItem(getProgressStorageKey(authUser?.uid, "missionCompleted"), JSON.stringify(nextCompleted));
      localStorage.removeItem("functionExplorerMissionCompleted");
      awardPoints(points);
    }
    return true;
  };
  const isMissionComplete = (missionId) => !!missionCompleted[`${grade}:${missionId}`];

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthLoading(false);
      if (!user || !db) return;
      const userRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(userRef);
      const baseProfile = {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || "학생 이름",
        role: getResolvedRole(user.email, "student"),
      };
      if (snapshot.exists()) {
        const saved = snapshot.data();
        const nextProfile = {
          ...baseProfile,
          ...saved.profile,
          role: getResolvedRole(user.email, saved.profile?.role || baseProfile.role),
        };
        setStudentProfile(nextProfile);
        localStorage.setItem("functionExplorerStudentProfile", JSON.stringify(nextProfile));
        const savedProgress = saved.progress || {};
        const nextGrade = savedProgress.currentGrade || nextProfile.grade || "middle1";
        const nextPoints = typeof savedProgress.points === "number" ? savedProgress.points : 0;
        const nextMissionCompleted = savedProgress.missionCompleted || {};
        const nextGraphReflections = savedProgress.graphReflections || {};
        setGrade(nextGrade);
        setExpPoints(nextPoints);
        setMissionCompleted(nextMissionCompleted);
        setGraphReflections(nextGraphReflections);
        localStorage.setItem(getProgressStorageKey(user.uid, "points"), String(nextPoints));
        localStorage.setItem(getProgressStorageKey(user.uid, "missionCompleted"), JSON.stringify(nextMissionCompleted));
        localStorage.setItem(getProgressStorageKey(user.uid, "graphReflections"), JSON.stringify(nextGraphReflections));
        localStorage.removeItem("functionExplorerPoints");
        localStorage.removeItem("functionExplorerMissionCompleted");
        localStorage.removeItem("functionExplorerGraphReflections");
        if (saved.assessments) {
          setAssessmentAnswers(saved.assessments.middle1 || {});
          setGradeAssessmentAnswers({ middle2: saved.assessments.middle2 || {}, middle3: saved.assessments.middle3 || {} });
        }
      } else {
        setStudentProfile(baseProfile);
        setGrade(baseProfile.grade || "middle1");
        setExpPoints(0);
        setMissionCompleted({});
        setGraphReflections({});
        localStorage.setItem("functionExplorerStudentProfile", JSON.stringify(baseProfile));
        localStorage.setItem(getProgressStorageKey(user.uid, "points"), "0");
        localStorage.setItem(getProgressStorageKey(user.uid, "missionCompleted"), JSON.stringify({}));
        localStorage.setItem(getProgressStorageKey(user.uid, "graphReflections"), JSON.stringify({}));
        localStorage.removeItem("functionExplorerPoints");
        localStorage.removeItem("functionExplorerMissionCompleted");
        localStorage.removeItem("functionExplorerGraphReflections");
        await setDoc(userRef, {
          profile: baseProfile,
          progress: {
            currentGrade: baseProfile.grade || "middle1",
            points: 0,
            missionCompleted: {},
            graphReflections: {},
            updatedAt: serverTimestamp(),
          },
          assessments: { middle1: {}, middle2: {}, middle3: {} },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (guestMode || !authUser || !db) return;
    const saveTimer = setTimeout(() => {
      setDoc(doc(db, "users", authUser.uid), {
        profile: {
          ...studentProfile,
          uid: authUser.uid,
          email: authUser.email || "",
          name: studentName,
          role: getResolvedRole(authUser.email, studentProfile.role),
        },
        progress: {
          currentGrade: grade,
          points: expPoints,
          missionCompleted,
          graphReflections,
          updatedAt: serverTimestamp(),
        },
        assessments: {
          middle1: assessmentAnswers,
          middle2: gradeAssessmentAnswers.middle2 || {},
          middle3: gradeAssessmentAnswers.middle3 || {},
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [authUser, grade, expPoints, missionCompleted, assessmentAnswers, gradeAssessmentAnswers, graphReflections, studentName, studentProfile.role]);

  const handleLoginSuccess = (profile) => {
    setGuestMode(false);
    const cleanProfile = { ...(profile || {}) };
    const shouldResetProgress = !!cleanProfile.__resetProgress;
    delete cleanProfile.__resetProgress;
    setStudentProfile(cleanProfile);
    localStorage.setItem("functionExplorerStudentProfile", JSON.stringify(cleanProfile));
    if (cleanProfile?.name) localStorage.setItem("functionExplorerStudentName", cleanProfile.name);
    if (shouldResetProgress) {
      setExpPoints(0);
      setMissionCompleted({});
      setAssessmentAnswers({});
      setGradeAssessmentAnswers({});
      setGraphReflections({});
      localStorage.setItem(getProgressStorageKey(cleanProfile.uid, "points"), "0");
      localStorage.setItem(getProgressStorageKey(cleanProfile.uid, "missionCompleted"), JSON.stringify({}));
      localStorage.setItem(getProgressStorageKey(cleanProfile.uid, "graphReflections"), JSON.stringify({}));
      localStorage.removeItem("functionExplorerPoints");
      localStorage.removeItem("functionExplorerMissionCompleted");
      localStorage.removeItem("functionExplorerGraphReflections");
    }
  };

  const handleGuestLogin = () => {
    setGuestMode(true);
    setAuthUser(null);
    setStudentProfile({ name: "비회원 체험", role: "guest" });
    setExpPoints(0);
    setMissionCompleted({});
    setAssessmentAnswers({});
    setGradeAssessmentAnswers({});
  };

  const handleLogout = async () => {
    if (auth && authUser) await signOut(auth);
    setGuestMode(false);
    setAuthUser(null);
    setStudentProfile({});
  };

  const addPoint = () => setPoints((prev) => [...prev, { x: Number(x), y: Number(y) }]);
  const resetPoints = () => {
    setX(0);
    setY(0);
    setPoints([]);
  };

  if (authLoading) {
    return (
      <div className="grid h-screen place-items-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-slate-800">
        <div className="rounded-[2rem] border border-blue-100 bg-white px-8 py-6 text-center shadow-sm">
          <div className="text-4xl">📚</div>
          <div className="mt-3 text-xl font-black text-blue-950">로그인 상태를 확인하는 중입니다.</div>
        </div>
      </div>
    );
  }

  if (!authUser && !guestMode) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} onGuestLogin={handleGuestLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1500px] gap-3 p-3">
        <Sidebar active={active} setActive={setActive} studentName={studentName} language={language} isAdmin={studentProfile.role === "admin"} />
        <main className="flex min-h-screen min-w-0 flex-1 flex-col gap-3">
          <Header activeTitle={activeTitle} setActive={setActive} expPoints={expPoints} grade={grade} setGrade={setGrade} studentName={studentName} onLogout={handleLogout} isGuest={guestMode} language={language} />
          <motion.section className="min-h-0 flex-1 overflow-y-auto" key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {active === "home" && (grade === "middle1" ? <HomeScreen setActive={setActive} expPoints={expPoints} isMissionComplete={isMissionComplete} /> : <GradeExtensionHome grade={grade} setActive={setActive} expPoints={expPoints} isMissionComplete={isMissionComplete} />)}
            {active === "ai" && <FunctionGraphAssistant />}
            {active === "ready" && (grade === "middle1" ? <ReadyScreen setActive={setActive} completeMission={completeMission} isMissionComplete={isMissionComplete} /> : <GradeExtensionReady grade={grade} setActive={setActive} completeMission={completeMission} isMissionComplete={isMissionComplete} />)}
            {active === "concept" && (grade === "middle1" ? <ConceptScreen selectedConcept={selectedConcept} setSelectedConcept={setSelectedConcept} completeMission={completeMission} isMissionComplete={isMissionComplete} /> : <GradeExtensionConcept grade={grade} completeMission={completeMission} isMissionComplete={isMissionComplete} />)}
            {active === "explore" && (grade === "middle1" ? <ExploreScreen x={x} y={y} setX={setX} setY={setY} points={points} addPoint={addPoint} resetPoints={resetPoints} awardPoints={awardPoints} completeMission={completeMission} isMissionComplete={isMissionComplete} reflection={graphReflections[`${grade}:explore`]} onSaveReflection={(text) => saveGraphReflection("explore", text)} /> : <GradeExtensionExplore grade={grade} awardPoints={awardPoints} completeMission={completeMission} isMissionComplete={isMissionComplete} reflection={graphReflections[`${grade}:explore`]} onSaveReflection={(text) => saveGraphReflection("explore", text)} />)}
            {active === "game" && (grade === "middle1" ? <GameScreen awardPoints={awardPoints} expPoints={expPoints} /> : <GradeExtensionGame grade={grade} awardPoints={awardPoints} expPoints={expPoints} />)}
            {active === "assessment" && (grade === "middle1" ? <AssessmentScreen answers={assessmentAnswers} setAnswers={setAssessmentAnswers} completeMission={completeMission} isMissionComplete={isMissionComplete} /> : <GradeExtensionAssessment grade={grade} answers={gradeAssessmentAnswers[grade] || {}} setAnswers={(next) => setGradeAssessmentAnswers((prev) => ({ ...prev, [grade]: typeof next === "function" ? next(prev[grade] || {}) : next }))} completeMission={completeMission} isMissionComplete={isMissionComplete} />)}
            {active === "growth" && (grade === "middle1" ? <GrowthScreen setActive={setActive} answers={assessmentAnswers} reflections={graphReflections} /> : <GradeExtensionGrowth grade={grade} setActive={setActive} answers={gradeAssessmentAnswers[grade] || {}} reflections={graphReflections} />)}
            {active === "settings" && <SettingsScreen language={language} setLanguage={setLanguage} />}
            {active === "admin" && studentProfile.role === "admin" && <AdminScreen />}
          </motion.section>
        </main>
      </div>
    </div>
  );
}

function AuthScreen({ onLoginSuccess, onGuestLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [message, setMessage] = useState(isFirebaseConfigured ? "" : "Firebase 설정값을 입력해야 실제 로그인이 작동합니다.");
  const [loading, setLoading] = useState(false);

  const saveProfile = async (user, extra = {}) => {
    if (!user) return;

    const shouldResetProgress = !!extra.resetProgress;
    let existingProfile = {};

    if (db) {
      const userRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        existingProfile = snapshot.data()?.profile || {};
      }
    }

    const keepOrNew = (newValue, oldValue, fallback = "") => {
      if (
        newValue !== undefined &&
        newValue !== null &&
        String(newValue).trim() !== ""
      ) {
        return newValue;
      }

      if (oldValue !== undefined && oldValue !== null) {
        return oldValue;
      }

      return fallback;
    };

    const profile = {
      ...existingProfile,
      uid: user.uid,
      email: user.email || email || existingProfile.email || "",
      name: keepOrNew(
        extra.name || user.displayName || name,
        existingProfile.name,
        "학생 이름"
      ),
      grade: keepOrNew(extra.grade || selectedGrade, existingProfile.grade, ""),
      className: keepOrNew(
        extra.className || className,
        existingProfile.className,
        ""
      ),
      studentNumber: keepOrNew(
        extra.studentNumber || studentNumber,
        existingProfile.studentNumber,
        ""
      ),
      role: getResolvedRole(user.email || existingProfile.email, existingProfile.role),
    };

    localStorage.setItem("functionExplorerStudentProfile", JSON.stringify(profile));
    localStorage.setItem("functionExplorerStudentName", profile.name);

    if (shouldResetProgress) {
      localStorage.setItem("functionExplorer:" + user.uid + ":points", "0");
      localStorage.setItem("functionExplorer:" + user.uid + ":missionCompleted", JSON.stringify({}));
      localStorage.setItem("functionExplorer:" + user.uid + ":graphReflections", JSON.stringify({}));
      localStorage.removeItem("functionExplorerPoints");
      localStorage.removeItem("functionExplorerMissionCompleted");
      localStorage.removeItem("functionExplorerGraphReflections");
    }

    if (db) {
      const payload = {
        profile,
        updatedAt: serverTimestamp(),
      };

      if (shouldResetProgress) {
        payload.createdAt = serverTimestamp();
        payload.progress = {
          currentGrade: profile.grade || "middle1",
          points: 0,
          missionCompleted: {},
          graphReflections: {},
          updatedAt: serverTimestamp(),
        };
        payload.assessments = {
          middle1: {},
          middle2: {},
          middle3: {},
        };
      }

      await setDoc(doc(db, "users", user.uid), payload, { merge: true });
    }

    onLoginSuccess({ ...profile, __resetProgress: shouldResetProgress });
  };

  const handleEmailAuth = async () => {
    if (!isFirebaseConfigured || !auth) {
      setMessage("Firebase 설정값을 먼저 입력해주세요. src/App.jsx 상단의 firebaseConfig 또는 .env 파일을 확인하세요.");
      return;
    }
    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setMessage("회원가입 시 이름/닉네임을 입력해주세요.");
      return;
    }
    if (mode === "signup" && !selectedGrade) {
      setMessage("회원가입 시 학년을 선택해주세요.");
      return;
    }
    if (mode === "signup" && (!className.trim() || !studentNumber.trim())) {
      setMessage("회원가입 시 반과 번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const credential = mode === "signup"
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
      await saveProfile(credential.user, { resetProgress: mode === "signup" });
    } catch (error) {
      setMessage(error?.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setMessage("Firebase 설정값을 먼저 입력해주세요. Google 로그인은 Firebase Auth 설정 후 사용할 수 있습니다.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await signOut(auth).catch(() => {});
      const credential = await signInWithPopup(auth, googleProvider);
      await saveProfile(credential.user, { name: credential.user.displayName || "학생 이름" });
    } catch (error) {
      if (error?.code === "auth/popup-blocked" || error?.code === "auth/cancelled-popup-request") {
        setMessage("팝업이 차단되어 redirect 방식으로 Google 로그인을 다시 시도합니다. 화면이 이동하면 계속 진행하세요.");
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          setMessage(redirectError?.message || "Google redirect 로그인 중 오류가 발생했습니다.");
        }
      } else {
        setMessage(error?.message || "Google 로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!isFirebaseConfigured || !auth) {
      setMessage("Firebase 설정값을 먼저 입력해주세요.");
      return;
    }
    if (!email) {
      setMessage("비밀번호를 재설정할 이메일을 입력해주세요.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("비밀번호 재설정 메일을 보냈습니다. 이메일함을 확인해주세요.");
    } catch (error) {
      setMessage(error?.message || "비밀번호 재설정 메일 발송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 px-5 py-8 text-slate-800">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2.2rem] border border-purple-100 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.10)] backdrop-blur md:p-9 lg:p-12">
          <div className="pointer-events-none absolute right-8 top-8 hidden h-52 w-72 opacity-40 md:block">
            <svg viewBox="0 0 320 220" className="h-full w-full">
              <defs>
                <linearGradient id="loginGraphGradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              {Array.from({ length: 9 }).map((_, index) => (
                <line key={`v-${index}`} x1={20 + index * 32} y1="18" x2={index * 32 - 38} y2="198" stroke="#c4b5fd" strokeWidth="1" opacity="0.45" />
              ))}
              {Array.from({ length: 7 }).map((_, index) => (
                <line key={`h-${index}`} x1="18" y1={35 + index * 25} x2="292" y2={index * 25 - 4} stroke="#c4b5fd" strokeWidth="1" opacity="0.45" />
              ))}
              <path d="M65 145 C105 145, 105 55, 150 55 C195 55, 185 160, 242 160" fill="none" stroke="url(#loginGraphGradient)" strokeWidth="5" strokeLinecap="round" />
              <text x="206" y="60" fill="#a78bfa" fontSize="15" fontWeight="800">f(x)</text>
              <text x="280" y="150" fill="#a78bfa" fontSize="14" fontWeight="800">x</text>
              <text x="97" y="28" fill="#a78bfa" fontSize="14" fontWeight="800">y</text>
              <rect x="226" y="72" width="54" height="54" fill="none" stroke="#c4b5fd" strokeWidth="2" opacity="0.55" />
              <path d="M226 72 L248 54 L302 54 L280 72 M280 72 L302 54 L302 108 L280 126 M226 126 L248 108 L302 108" fill="none" stroke="#c4b5fd" strokeWidth="2" opacity="0.55" />
            </svg>
          </div>

          <div className="relative text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-50 text-5xl shadow-sm">
              📚
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-blue-950 md:text-5xl">
              그래프탐험대
            </h1>
            <p className="mt-3 text-lg font-bold text-slate-500">
              AI 기반 함수 그래프 학습 플래너
            </p>
          </div>

          {mode === "signup" && (
            <button
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              className="mt-7 rounded-2xl border border-purple-200 bg-white px-4 py-2 text-sm font-black text-purple-700 hover:bg-purple-50"
            >
              ← 로그인으로
            </button>
          )}

          <div className="relative mt-9 grid gap-8 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="space-y-4">
              {mode === "signup" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-600">이름/닉네임</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-purple-100 bg-blue-50/70 px-5 py-4 font-bold outline-none focus:border-purple-400" placeholder="예) 김지우" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-600">반</label>
                      <input value={className} onChange={(e) => setClassName(e.target.value)} className="w-full rounded-2xl border border-purple-100 bg-blue-50/70 px-5 py-4 font-bold outline-none focus:border-purple-400" placeholder="예) 5반" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-600">번호</label>
                      <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value.replace(/[^0-9]/g, ""))} className="w-full rounded-2xl border border-purple-100 bg-blue-50/70 px-5 py-4 font-bold outline-none focus:border-purple-400" placeholder="예) 12" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-600">학년</label>
                    <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="w-full rounded-2xl border border-purple-100 bg-blue-50/70 px-5 py-4 font-bold text-slate-700 outline-none focus:border-purple-400">
                      <option value="">선택</option>
                      <option value="middle1">중1</option>
                      <option value="middle2">중2</option>
                      <option value="middle3">중3</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="mb-2 block text-sm font-black text-slate-600">이메일</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-2xl border border-purple-100 bg-blue-50/70 px-5 py-4 font-bold outline-none focus:border-purple-400" placeholder="email@example.com" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-600">비밀번호</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-2xl border border-purple-100 bg-blue-50/70 px-5 py-4 font-bold outline-none focus:border-purple-400" placeholder={mode === "signup" ? "6자 이상" : "비밀번호를 입력하세요"} />
              </div>

              <button onClick={handleEmailAuth} disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-purple-700 to-fuchsia-500 px-5 py-4 text-lg font-black text-white shadow-lg shadow-purple-100 disabled:opacity-50">
                {loading ? "처리 중..." : mode === "signup" ? "Firebase 회원가입" : "이메일로 로그인"}
              </button>
            </div>

            <div className="hidden h-full items-center justify-center md:flex">
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center">
                <div className="w-px flex-1 bg-purple-100" />
                <span className="my-3 text-sm font-bold text-slate-400">또는</span>
                <div className="w-px flex-1 bg-purple-100" />
              </div>
            </div>

            {mode === "login" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 md:hidden">
                  <div className="h-px flex-1 bg-purple-100" />
                  또는
                  <div className="h-px flex-1 bg-purple-100" />
                </div>

                <button onClick={handleGoogleLogin} disabled={loading} className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-black text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
                  🔐 Google로 로그인
                </button>

                <button onClick={onGuestLogin} disabled={loading} className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-lg font-black text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-50">
                  👀 비회원으로 둘러보기
                </button>

                <p className="text-center text-sm font-bold leading-relaxed text-slate-500">
                  비회원은 포인트와 성장기록이 저장되지 않습니다.
                </p>
              </div>
            )}

            {mode !== "login" && (
              <div className="hidden rounded-[2rem] bg-gradient-to-br from-purple-50 to-blue-50 p-6 md:block">
                <h3 className="text-lg font-black text-blue-950">회원가입 안내</h3>
                <p className="mt-3 text-sm font-bold leading-relaxed text-slate-600">
                  이름, 학년, 반, 번호는 관리자 화면에서 학생별 학습 기록을 확인할 때 사용됩니다.
                </p>
              </div>
            )}
          </div>

          {message && (
            <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-relaxed text-amber-800">
              {message}
            </div>
          )}

          {mode === "login" && (
            <div className="relative mt-8 border-t border-purple-100 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => { setMode("signup"); setMessage(""); }} className="rounded-2xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-black text-purple-700 hover:bg-purple-50">
                    회원가입
                  </button>
                  <button onClick={handlePasswordReset} className="rounded-2xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-black text-purple-700 hover:bg-purple-50">
                    비밀번호 찾기
                  </button>
                </div>
                <p className="max-w-xl text-right text-sm font-bold leading-relaxed text-slate-500">
                  관리자는 Google 로그인 후 Firestore에서 role이 admin인 계정만 관리자 메뉴가 표시됩니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ active, setActive, studentName = "학생 이름", language = "ko", isAdmin = false }) {
  const visibleNavItems = isAdmin ? [...navItems, adminNavItem] : navItems;
  return (
    <aside className="hidden w-48 shrink-0 rounded-[2rem] border border-blue-200 bg-gradient-to-b from-blue-50 via-white to-indigo-50 p-4 shadow-md lg:block">
      <button onClick={() => setActive("home")} className="mb-7 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-blue-50">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200"><Compass className="h-6 w-6" /></div>
        <div><div className="font-extrabold text-blue-900">{studentName}</div></div>
      </button>
      <nav className="space-y-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return <button key={item.id} onClick={() => setActive(item.id)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"}`}><Icon className="h-5 w-5 shrink-0" /><span className="whitespace-nowrap">{getUiText(language, item.labelKey)}</span></button>;
        })}
      </nav>
      <div className="my-7 h-px bg-blue-100" />
      <button onClick={() => setActive("settings")} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition ${active === "settings" ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-600 hover:bg-slate-50"}`}><Settings className="h-5 w-5" />{getUiText(language, "settings")}</button>
    </aside>
  );
}

function Header({ activeTitle, setActive, expPoints = 0, grade = "middle1", setGrade, studentName = "학생 이름", onLogout, isGuest = false, language = "ko" }) {
  const gradeLabels = { middle1: "중1", middle2: "중2", middle3: "중3" };
  const gradeTheme = {
    middle1: { title: "좌표에서 시작하는 그래프 탐험대", units: "순서쌍 · 좌표 · 그래프 기초 · 정비례 · 반비례" },
    middle2: { title: "일차함수 그래프 탐험대", units: "함수의 뜻 · 일차함수 · 기울기 · y절편 · 그래프 해석" },
    middle3: { title: "이차함수 그래프 탐험대", units: "이차함수 · 포물선 · 꼭짓점 · 축 · 그래프 변환" },
  };
  const currentTheme = gradeTheme[grade] || gradeTheme.middle1;
  return (
    <header className="shrink-0 rounded-[1.5rem] border border-blue-200 bg-gradient-to-r from-white via-blue-50 to-indigo-50 px-5 py-3 shadow-md">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-sm font-bold text-blue-600">{currentTheme.units}</div>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight text-blue-950">{currentTheme.title}</h1>
          <p className="mt-1 text-xs text-slate-500">{getUiText(language, "flow")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-blue-50 p-2">
          <div className="rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-900 shadow-sm">🙂 {studentName}</div>
          <div className="rounded-xl bg-white px-4 py-2 text-base font-black text-amber-700 shadow-sm">{isGuest ? getUiText(language, "guestMode") : `⭐ ${expPoints}P`}</div>
          {Object.entries(gradeLabels).map(([key, label], idx) => <button key={key} onClick={() => { setGrade(key); setActive("home"); }} className={`rounded-xl px-6 py-2 text-base font-black transition ${grade === key ? "bg-blue-600 text-white shadow-md shadow-blue-200" : idx === 1 ? "text-green-700 hover:bg-white" : "text-purple-700 hover:bg-white"}`}>{label}</button>)}
          <button onClick={onLogout} className="rounded-xl border border-rose-100 bg-white px-4 py-2 text-sm font-black text-rose-600 hover:bg-rose-50">{isGuest ? getUiText(language, "endGuest") : getUiText(language, "logout")}</button>
        </div>
      </div>
    </header>
  );
}

function AdminScreen() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadStudents = async () => {
    if (!db) {
      setMessage("Firebase 설정이 연결되어야 관리자 데이터를 불러올 수 있습니다.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const snapshot = await getDocs(query(collection(db, "users"), orderBy("updatedAt", "desc")));
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      setStudents(list.filter((item) => item.profile?.role !== "admin"));
      setMessage(`학생 기록 ${list.filter((item) => item.profile?.role !== "admin").length}명을 불러왔습니다.`);
    } catch (error) {
      setMessage(error?.message || "학생 기록을 불러오지 못했습니다. Firestore 규칙과 관리자 role을 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const rows = students.map((student) => {
    const profile = student.profile || {};
    const progress = student.progress || {};
    const assessments = student.assessments || {};
    const middle1 = getAssessmentSummary(assessments.middle1 || {});
    const middle2Answers = assessments.middle2 || {};
    const middle3Answers = assessments.middle3 || {};
    const middle2Data = gradeExtensionData.middle2;
    const middle3Data = gradeExtensionData.middle3;
    const middle2Solved = middle2Data.assessment.reduce((sum, _q, index) => sum + (middle2Answers[index] ? 1 : 0), 0);
    const middle2Correct = middle2Data.assessment.reduce((sum, q, index) => sum + (middle2Answers[index] === q.answer ? 1 : 0), 0);
    const middle3Solved = middle3Data.assessment.reduce((sum, _q, index) => sum + (middle3Answers[index] ? 1 : 0), 0);
    const middle3Correct = middle3Data.assessment.reduce((sum, q, index) => sum + (middle3Answers[index] === q.answer ? 1 : 0), 0);
    const currentGrade = progress.currentGrade || profile.grade || "middle1";
    const gradeScore = currentGrade === "middle3" ? { solved: middle3Solved, correct: middle3Correct, total: 10 } : currentGrade === "middle2" ? { solved: middle2Solved, correct: middle2Correct, total: 10 } : { solved: middle1.totalSolved, correct: middle1.totalCorrect, total: middle1.totalQuestions };
    const percent = gradeScore.total ? Math.round((gradeScore.correct / gradeScore.total) * 100) : 0;
    const reflectionCount = Object.values(progress.graphReflections || {}).filter((item) => item?.text).length;
    return { student, profile, progress, currentGrade, gradeScore, percent, reflectionCount };
  });

  const totalStudents = rows.length;
  const activeStudents = rows.filter((row) => row.gradeScore.solved > 0 || row.reflectionCount > 0 || (row.progress.points || 0) > 0).length;
  const avgPercent = totalStudents ? Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / totalStudents) : 0;
  const avgPoints = totalStudents ? Math.round(rows.reduce((sum, row) => sum + (row.progress.points || 0), 0) / totalStudents) : 0;

  const downloadCsv = () => {
    const header = ["이름", "학년", "반", "번호", "이메일", "현재학년탭", "풀이문항", "정답", "정답률", "포인트", "설명기록"];
    const body = rows.map((row) => [
      row.profile.name || "",
      row.profile.grade || "",
      row.profile.className || "",
      row.profile.studentNumber || "",
      row.profile.email || "",
      row.currentGrade,
      row.gradeScore.solved,
      row.gradeScore.correct,
      `${row.percent}%`,
      row.progress.points || 0,
      row.reflectionCount,
    ]);
    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `graph-explorer-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full overflow-hidden p-5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-black text-blue-950">관리자 모드</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">100명 내외 수업 운영을 위해 학생별 접속, 포인트, 형성평가, 설명 글쓰기 기록을 한 화면에서 확인합니다.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadStudents} disabled={loading} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 disabled:opacity-50">{loading ? "불러오는 중..." : "새로고침"}</button>
          <button onClick={downloadCsv} disabled={!rows.length} className="rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm disabled:opacity-40">CSV 다운로드</button>
        </div>
      </div>

      <div className="grid h-[calc(100%-86px)] min-h-0 gap-4 xl:grid-cols-[330px_1fr]">
        <div className="space-y-3 overflow-hidden rounded-[1.7rem] border border-blue-100 bg-blue-50/70 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><div className="text-xs font-black text-slate-500">전체 학생</div><div className="mt-1 text-3xl font-black text-blue-700">{totalStudents}</div></div>
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><div className="text-xs font-black text-slate-500">활동 학생</div><div className="mt-1 text-3xl font-black text-emerald-700">{activeStudents}</div></div>
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><div className="text-xs font-black text-slate-500">평균 정답률</div><div className="mt-1 text-3xl font-black text-purple-700">{avgPercent}%</div></div>
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><div className="text-xs font-black text-slate-500">평균 포인트</div><div className="mt-1 text-3xl font-black text-amber-700">{avgPoints}P</div></div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-sm font-bold leading-relaxed text-slate-700 shadow-sm">
            <div className="font-black text-blue-950">운영 팁</div>
            <div className="mt-2">• 학생은 회원가입 때 학년·반·번호·이름을 입력합니다.</div>
            <div>• 비회원은 심사용 체험에만 사용하고, 학생 활동 기록은 저장하지 않습니다.</div>
            <div>• 수업 후 CSV를 내려받아 연구대회 분석 자료로 활용할 수 있습니다.</div>
          </div>
          {message && <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-relaxed text-amber-800">{message}</div>}
        </div>

        <div className="min-h-0 overflow-auto rounded-[1.7rem] border border-blue-100 bg-white p-4">
          <table className="w-full min-w-[850px] border-collapse text-sm">
            <thead>
              <tr className="bg-blue-50 text-left text-xs font-black text-blue-900">
                <th className="rounded-l-xl px-3 py-3">학생</th>
                <th className="px-3 py-3">학년/반/번호</th>
                <th className="px-3 py-3">현재 학습</th>
                <th className="px-3 py-3">형성평가</th>
                <th className="px-3 py-3">정답률</th>
                <th className="px-3 py-3">포인트</th>
                <th className="rounded-r-xl px-3 py-3">설명 기록</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.student.id} className="border-b border-slate-100 font-bold text-slate-700 hover:bg-slate-50">
                  <td className="px-3 py-3"><div className="font-black text-slate-900">{row.profile.name || "이름 없음"}</div><div className="text-xs text-slate-400">{row.profile.email}</div></td>
                  <td className="px-3 py-3">{row.profile.grade || "-"} / {row.profile.className || "-"} / {row.profile.studentNumber || "-"}</td>
                  <td className="px-3 py-3">{row.currentGrade}</td>
                  <td className="px-3 py-3">{row.gradeScore.correct}/{row.gradeScore.total} · 풀이 {row.gradeScore.solved}</td>
                  <td className="px-3 py-3"><span className={`rounded-full px-3 py-1 text-xs font-black ${row.percent >= 80 ? "bg-green-50 text-green-700" : row.percent >= 50 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>{row.percent}%</span></td>
                  <td className="px-3 py-3">{row.progress.points || 0}P</td>
                  <td className="px-3 py-3">{row.reflectionCount}개</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan="7" className="px-3 py-10 text-center text-sm font-bold text-slate-400">아직 저장된 학생 기록이 없거나 관리자 권한이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

function SettingsScreen({ language, setLanguage }) {
  const selectedOption = languageOptions.find((item) => item.code === language) || languageOptions[0];
  return (
    <Card className="h-full overflow-hidden p-6">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-black text-blue-950">{getUiText(language, "languageSettings")}</h2>
          <p className="mt-1 text-sm font-bold leading-relaxed text-slate-500">{getUiText(language, "languageDesc")}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 px-5 py-3 text-sm font-black text-blue-700">
          {getUiText(language, "currentLanguage")}: {selectedOption.nativeLabel}
        </div>
      </div>

      <div className="grid h-[calc(100%-92px)] min-h-0 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-3">
          {languageOptions.map((option) => {
            const selected = language === option.code;
            return (
              <button
                key={option.code}
                onClick={() => setLanguage(option.code)}
                className={`rounded-[1.7rem] border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${selected ? "border-blue-500 bg-blue-600 text-white" : "border-blue-200 bg-gradient-to-br from-white to-blue-50 text-slate-800 hover:border-blue-300"}`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black ${selected ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}>
                  {option.code.toUpperCase()}
                </div>
                <div className="text-xl font-black">{option.nativeLabel}</div>
                <div className={`mt-1 text-sm font-bold ${selected ? "text-blue-50" : "text-slate-500"}`}>{option.label}</div>
                <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-black ${selected ? "bg-white/20 text-white" : "bg-white text-blue-700"}`}>
                  {selected ? "✓ 선택됨" : "이 언어로 보기"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="min-h-0 overflow-hidden rounded-[1.7rem] border border-purple-100 bg-purple-50/70 p-5">
          <h3 className="text-xl font-black text-purple-950">언어 지원 안내</h3>
          <div className="mt-4 space-y-3 text-sm font-bold leading-relaxed text-slate-700">
            <div className="rounded-2xl bg-white px-4 py-3">{getUiText(language, "applyNotice")}</div>
            <div className="rounded-2xl bg-white px-4 py-3">{getUiText(language, "translationScope")}</div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
              추천 추가 언어: 러시아어, 몽골어, 태국어, 필리핀어/타갈로그어도 다문화 학생 지원 관점에서 추가하면 좋습니다.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MissionStatusBadge({ done }) {
  return <div className={`rounded-2xl px-4 py-2 text-sm font-black ${done ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-500"}`}>{done ? "✅ 미션 완료" : "미션 대기"}</div>;
}

function HomeScreen({ setActive, expPoints = 0, isMissionComplete }) {
  const homeTiles = [
    {
      type: "points",
      title: "탐험 포인트",
      desc: "게임과 학습 활동을 하며 모은 포인트입니다.",
      icon: Star,
      color: "orange",
      value: `${expPoints}P`,
    },
    {
      title: "학습준비",
      desc: "사전 진단으로 오늘의 출발점을 확인해요.",
      icon: ClipboardCheck,
      color: "blue",
      action: "진단 시작",
      target: "ready",
      mission: "ready",
    },
    {
      title: "개념학습",
      desc: "순서쌍, 좌표평면, 정비례, 반비례를 익혀요.",
      icon: BookOpen,
      color: "green",
      action: "개념 익히기",
      target: "concept",
      mission: "concept",
    },
    {
      title: "AI 그래프 해석실",
      desc: "함수식을 입력하고 AI처럼 그래프 특징을 확인해요.",
      icon: Bot,
      color: "purple",
      action: "해석실 열기",
      target: "ai",
    },
    {
      title: "탐구활동",
      desc: "좌표 미션과 표 → 그래프 활동을 해요.",
      icon: FlaskConical,
      color: "purple",
      action: "탐구하기",
      target: "explore",
      mission: "explore",
    },
    {
      title: "게임존",
      desc: "퀴즈와 미니게임으로 배운 내용을 확인해요.",
      icon: Star,
      color: "orange",
      action: "게임 시작",
      target: "game",
    },
    {
      title: "형성평가",
      desc: "개념별 10문항으로 이해 정도를 점검해요.",
      icon: Target,
      color: "orange",
      action: "평가 시작",
      target: "assessment",
      mission: "assessment",
    },
    {
      title: "성장기록",
      desc: "형성평가 결과와 맞춤 추천 문제를 확인해요.",
      icon: BarChart3,
      color: "blue",
      action: "기록 보기",
      target: "growth",
    },
  ];

  return (
    <div className="grid h-full grid-cols-4 grid-rows-2 gap-3 overflow-hidden">
      {homeTiles.map((tile) => {
        const Icon = tile.icon;
        const isPointTile = tile.type === "points";
        return (
          <Card key={tile.title} className={`p-5 ${isPointTile ? "bg-amber-50/90" : ""}`}>
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <IconBadge icon={Icon} color={tile.color} />
                <h3 className="mt-4 text-xl font-black text-blue-950">{tile.title}</h3>
                {isPointTile ? (
                  <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-3xl font-black text-amber-700 shadow-sm">⭐ {tile.value}</div>
                ) : null}
                <p className="mt-3 text-sm font-bold leading-relaxed text-slate-600">{tile.desc}</p>
              </div>
              {isPointTile ? (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-amber-700">학습 미션을 완료하면 포인트가 올라가요.</div>
              ) : (
                <div className="space-y-2">
                  {tile.mission && <MissionStatusBadge done={isMissionComplete(tile.mission)} />}
                  <button onClick={() => setActive(tile.target)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-base font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700">
                    {tile.action} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function FunctionGraphAssistant() {
  const [input, setInput] = useState("y=");
  const [parsed, setParsed] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const analysis = analyzeMiddleSchoolFunction(parsed);
  const runAnalyze = () => {
    setParsed(parseMiddleSchoolFunction(input));
    setShowAnswer(false);
  };

  const sampleGroups = [
    { label: "정비례 예시", value: "y=2x" },
    { label: "반비례 예시", value: "y=4/x" },
    { label: "일차함수 예시", value: "y=-x+3" },
    { label: "이차함수 예시", value: "y=x^2-4x+3" },
    { label: "이차함수 표준형", value: "y=(x-2)^2+3" },
  ];

  return (
    <Card className="h-full overflow-hidden p-5">
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <IconBadge icon={Bot} color="blue" />
            <div>
              <h2 className="text-2xl font-black text-blue-950">AI 그래프 해석실</h2>
              <p className="text-sm text-slate-500">식 입력 → 교과서형 그래프 확인 → 개념 해석 순서로 학습합니다.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">정비례 · 반비례 · 일차함수 · 이차함수</div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[380px_1fr]">
          <div className="flex min-h-0 flex-col gap-4 overflow-hidden rounded-[1.7rem] border border-blue-100 bg-blue-50/60 p-5">
            <div>
              <label className="mb-2 block text-base font-black text-blue-950">함수식을 입력하세요.</label>
              <div className="relative">
                <input
                  value={input}
                  onChange={(event) => {
                    const value = event.target.value.replaceAll(" ", "");
                    setInput(value.startsWith("y=") ? value : `y=${value.replace(/^y=?/i, "")}`);
                  }}
                  onKeyDown={(event) => event.key === "Enter" && runAnalyze()}
                  className="w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-xl font-black text-blue-950 outline-none focus:border-blue-400"
                  placeholder="y="
                />
                {input === "y=" && (
                  <span className="pointer-events-none absolute left-[54px] top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    (예) 3x
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              {sampleGroups.map((sample) => (
                <button
                  key={sample.value}
                  onClick={() => {
                    setInput(sample.value);
                    setParsed(parseMiddleSchoolFunction(sample.value));
                    setShowAnswer(false);
                  }}
                  className="rounded-2xl border border-white bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="text-xs font-black text-slate-500">{sample.label}</div>
                  <div className="mt-1 text-lg font-black text-blue-800">{sample.value}</div>
                </button>
              ))}
            </div>

            <button onClick={runAnalyze} className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700">
              <Sparkles className="h-5 w-5" /> AI 그래프 해석 시작
            </button>

            {parsed?.error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{parsed.error}</div>}
          </div>

          <div className="grid min-h-0 grid-rows-[1fr_auto] gap-4 overflow-hidden">
            <FunctionGraphCanvas parsed={parsed} analysis={analysis} />
            {analysis && <AnalysisCard analysis={analysis} showAnswer={showAnswer} setShowAnswer={setShowAnswer} />}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AnalysisCard({ analysis, showAnswer, setShowAnswer }) {
  return (
    <div className="shrink-0 rounded-[1.5rem] border border-blue-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-lg font-black text-blue-950">그래프에서 확인할 점</h4>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">개념 해석</div>
      </div>
      <div className="grid gap-3 xl:grid-cols-[1.2fr_1.6fr_1.1fr]">
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-relaxed text-slate-700">{analysis.summary}</p>
        <div className="grid grid-cols-2 gap-2">
          {analysis.features.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="text-xs font-bold text-slate-500">{label}</div>
              <div className="mt-1 text-sm font-black text-slate-800">{value}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-amber-50 p-3 text-sm">
          <div className="font-black text-amber-900">한 문제 더 풀기</div>
          <div className="mt-1 text-slate-700">{analysis.question}</div>
          <button onClick={() => setShowAnswer(!showAnswer)} className="mt-2 rounded-xl bg-white px-3 py-2 font-black text-amber-700">
            {showAnswer ? "정답 숨기기" : "정답 보기"}
          </button>
          {showAnswer && <div className="mt-2 font-bold text-slate-700">정답: {analysis.answer}</div>}
        </div>
      </div>
    </div>
  );
}

function FunctionGraphCanvas({ parsed, analysis }) {
  if (!analysis || !parsed || parsed.error) {
    return <div className="rounded-[1.5rem] border border-blue-100 bg-white p-8 text-center text-slate-500">함수식을 입력하면 그래프가 나타납니다.</div>;
  }

  const size = 460;
  const padding = 38;
  const min = -5;
  const max = 5;
  const plotSize = size - padding * 2;

  // 교과서·문제집에서 보는 일반적인 좌표평면 형태:
  // x축, y축 모두 -5~5로 고정하고, 가로·세로 1칸 길이를 같게 표시합니다.
  const toSvgX = (value) => padding + ((value - min) / (max - min)) * plotSize;
  const toSvgY = (value) => padding + plotSize - ((value - min) / (max - min)) * plotSize;

  const graphXs = Array.from({ length: 1001 }, (_, index) => min + ((max - min) * index) / 1000);
  const visiblePoints = graphXs
    .map((xValue) => ({ x: xValue, y: functionValue(parsed, xValue) }))
    .filter((point) => Number.isFinite(point.y));

  const pathData = visiblePoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${toSvgX(point.x)} ${toSvgY(point.y)}`)
    .join(" ");

  const inverseSegments = parsed.type === "inverse" ? buildInverseSegments(parsed.a, min, max, min, max, 0.02) : [];
  const inversePathData = inverseSegments.map((segment) =>
    segment.map((point, index) => `${index === 0 ? "M" : "L"} ${toSvgX(point.x)} ${toSvgY(point.y)}`).join(" ")
  );

  let vertex = null;
  if (parsed.type === "quadratic") {
    const vx = Number.isFinite(parsed.p) ? parsed.p : -parsed.b / (2 * parsed.a);
    const vy = Number.isFinite(parsed.q) ? parsed.q : functionValue(parsed, vx);
    if (Number.isFinite(vx) && Number.isFinite(vy) && vx >= min && vx <= max && vy >= min && vy <= max) {
      vertex = { x: vx, y: vy };
    }
  }

  const ticks = Array.from({ length: 21 }, (_, index) => -5 + index * 0.5);

  return (
    <div className="h-full overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white p-4">
      <div className="mb-2 text-lg font-black text-blue-950">그래프: {analysis.title}</div>
      <div className="flex h-[calc(100%-36px)] items-center justify-center rounded-2xl bg-slate-50 p-2">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full max-h-full w-auto rounded-2xl bg-white">
          <defs>
            <clipPath id="ai-graph-clip">
              <rect x={padding} y={padding} width={plotSize} height={plotSize} />
            </clipPath>
          </defs>

          {ticks.map((tick) => {
            const fixedTick = Number(tick.toFixed(2));
            const isAxis = Math.abs(fixedTick) < 1e-9;
            const isMajor = Number.isInteger(fixedTick);
            return (
              <g key={`grid-${fixedTick}`}>
                <line
                  x1={toSvgX(fixedTick)}
                  y1={padding}
                  x2={toSvgX(fixedTick)}
                  y2={padding + plotSize}
                  stroke={isAxis ? "#334155" : isMajor ? "#cbd5e1" : "#e2e8f0"}
                  strokeWidth={isAxis ? "1.8" : isMajor ? "1" : "0.6"}
                />
                <line
                  x1={padding}
                  y1={toSvgY(fixedTick)}
                  x2={padding + plotSize}
                  y2={toSvgY(fixedTick)}
                  stroke={isAxis ? "#334155" : isMajor ? "#cbd5e1" : "#e2e8f0"}
                  strokeWidth={isAxis ? "1.8" : isMajor ? "1" : "0.6"}
                />
                {isMajor && fixedTick !== 0 && (
                  <>
                    <text x={toSvgX(fixedTick) - 5} y={toSvgY(0) + 17} fontSize="10" fill="#475569">{fixedTick}</text>
                    <text x={toSvgX(0) + 8} y={toSvgY(fixedTick) + 4} fontSize="10" fill="#475569">{fixedTick}</text>
                  </>
                )}
              </g>
            );
          })}

          <line x1={padding} y1={toSvgY(0)} x2={padding + plotSize + 8} y2={toSvgY(0)} stroke="#334155" strokeWidth="2" />
          <polygon points={`${padding + plotSize + 14},${toSvgY(0)} ${padding + plotSize + 5},${toSvgY(0) - 5} ${padding + plotSize + 5},${toSvgY(0) + 5}`} fill="#334155" />
          <line x1={toSvgX(0)} y1={padding + plotSize} x2={toSvgX(0)} y2={padding - 8} stroke="#334155" strokeWidth="2" />
          <polygon points={`${toSvgX(0)},${padding - 14} ${toSvgX(0) - 5},${padding - 5} ${toSvgX(0) + 5},${padding - 5}`} fill="#334155" />

          {parsed.type === "inverse" ? (
            inversePathData.map((path, index) => (
              <path key={index} d={path} clipPath="url(#ai-graph-clip)" fill="none" stroke="#2563eb" strokeWidth="3" />
            ))
          ) : (
            <path d={pathData} clipPath="url(#ai-graph-clip)" fill="none" stroke="#2563eb" strokeWidth="3" />
          )}

          {vertex && (
            <g>
              <circle cx={toSvgX(vertex.x)} cy={toSvgY(vertex.y)} r="5" fill="#f97316" />
              <text x={toSvgX(vertex.x) + 8} y={toSvgY(vertex.y) - 8} fontSize="11" fill="#ea580c" fontWeight="800">
                꼭짓점 ({formatValue(vertex.x)}, {formatValue(vertex.y)})
              </text>
            </g>
          )}

          <text x={padding + plotSize + 16} y={toSvgY(0) + 5} fontSize="14" fill="#334155" fontWeight="700">x</text>
          <text x={toSvgX(0) + 10} y={padding - 20} fontSize="14" fill="#334155" fontWeight="700">y</text>
          <text x={toSvgX(0) + 5} y={toSvgY(0) - 6} fontSize="10" fill="#475569">0</text>
        </svg>
      </div>
    </div>
  );
}

function ReadyScreen({ setActive, completeMission, isMissionComplete }) {
  const readinessQuestions = [
    {
      id: "coordinate",
      title: "좌표 읽기",
      q: "점 A(-3, 2)에서 x좌표와 y좌표를 바르게 말한 것은?",
      choices: ["x=2, y=-3", "x=-3, y=2", "x=3, y=-2", "x=-2, y=3"],
      answer: "x=-3, y=2",
      feedback: "순서쌍은 항상 (x좌표, y좌표) 순서로 읽습니다.",
      recommend: "순서쌍과 좌표부터 다시 확인해 보세요.",
    },
    {
      id: "quadrant",
      title: "사분면 구분",
      q: "x좌표가 음수이고 y좌표가 양수인 점은 어느 사분면에 있나요?",
      choices: ["제1사분면", "제2사분면", "제3사분면", "제4사분면"],
      answer: "제2사분면",
      feedback: "제2사분면의 부호는 (-, +)입니다.",
      recommend: "좌표평면과 사분면 내용을 먼저 학습해 보세요.",
    },
    {
      id: "relation",
      title: "정비례 판단",
      q: "정비례 관계에서 항상 일정한 값은 무엇인가요?",
      choices: ["x+y", "x-y", "y÷x", "xy"],
      answer: "y÷x",
      feedback: "정비례에서는 y÷x가 일정합니다.",
      recommend: "정비례의 식과 그래프를 개념학습에서 다시 확인해 보세요.",
    },
    {
      id: "inverseRelation",
      title: "반비례 판단",
      q: "반비례 관계에서 항상 일정한 값은 무엇인가요?",
      choices: ["x+y", "x-y", "y÷x", "xy"],
      answer: "xy",
      feedback: "반비례에서는 xy의 값이 일정합니다.",
      recommend: "정비례와 반비례의 차이를 탐구활동에서 비교해 보세요.",
    },
  ];

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const score = readinessQuestions.reduce((sum, item) => sum + (answers[item.id] === item.answer ? 1 : 0), 0);
  const firstWrong = readinessQuestions.find((item) => answers[item.id] && answers[item.id] !== item.answer);
  const allAnswered = readinessQuestions.every((item) => answers[item.id]);

  const recommendation = !submitted
    ? "네 문항에 답하면 오늘의 출발 학습을 추천합니다."
    : score === 4
      ? "기초 준비가 잘 되어 있습니다. 그래프 탐험대에서 표 → 그래프 연결 활동으로 바로 시작해도 좋습니다."
      : firstWrong?.recommend || "기초 개념을 확인한 뒤 개념학습으로 이동해 보세요.";

  return (
    <Card className="h-full overflow-hidden p-5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-black text-blue-950">학습준비: 사전 진단</h2>
          <p className="mt-1 text-sm text-slate-500">좌표, 사분면, 정비례·반비례의 기초 이해를 빠르게 확인하고 맞춤 출발점을 추천합니다.</p>
        </div>
        <div className="rounded-2xl bg-blue-50 px-5 py-3 text-sm font-black text-blue-700">
          준비 진단 {submitted ? `${score}/4` : "0/4"}
        </div>
      </div>

      <div className="grid h-[calc(100%-84px)] min-h-0 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-3 overflow-hidden">
          {readinessQuestions.map((item, index) => {
            const selected = answers[item.id];
            const isCorrect = selected === item.answer;
            return (
              <div key={item.id} className="rounded-[1.7rem] border border-blue-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">진단 {index + 1}</div>
                  <div className="text-xs font-black text-slate-500">{item.title}</div>
                </div>
                <h3 className="min-h-[58px] text-base font-black leading-snug text-blue-950">{item.q}</h3>
                <div className="mt-4 space-y-2">
                  {item.choices.map((choice) => (
                    <button
                      key={choice}
                      onClick={() => {
                        setAnswers((prev) => ({ ...prev, [item.id]: choice }));
                        setSubmitted(false);
                      }}
                      className={`w-full rounded-2xl border px-3 py-2 text-left text-sm font-bold transition ${
                        selected === choice ? "border-blue-500 bg-blue-600 text-white" : "border-blue-100 bg-slate-50 text-slate-700 hover:bg-blue-50"
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
                {submitted && selected && (
                  <div className={`mt-3 rounded-2xl px-3 py-2 text-xs font-bold ${isCorrect ? "bg-green-50 text-green-800" : "bg-rose-50 text-rose-800"}`}>
                    {isCorrect ? "정답입니다. " : `정답: ${item.answer}. `}{item.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-3 overflow-hidden rounded-[1.7rem] border border-blue-100 bg-blue-50/60 p-4">
          <div className="rounded-2xl bg-white p-4">
            <h3 className="text-xl font-black text-blue-950">오늘의 추천 출발점</h3>
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold leading-relaxed text-slate-700">
              {recommendation}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <h3 className="font-black text-blue-950">진단 결과 기준</h3>
            <div className="mt-3 space-y-2 text-sm font-bold text-slate-700">
              <div>• 4개 정답: 탐구활동 또는 그래프 해석실로 이동</div>
              <div>• 2~3개 정답: 개념학습에서 부족한 부분 확인</div>
              <div>• 0개 정답: 순서쌍과 좌표부터 차근차근 학습</div>
            </div>
          </div>

          <button
            onClick={() => {
              setSubmitted(true);
              completeMission("ready", 20);
            }}
            disabled={!allAnswered}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-base font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-40"
          >
            <CheckCircle2 className="h-5 w-5" /> 진단 결과 확인
          </button>

          {submitted && (
            <div className="grid gap-2">
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">✅ 학습준비 미션 완료 · +20P</div>
              <button onClick={() => setActive(score === 4 ? "explore" : "concept")} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white shadow-lg shadow-emerald-100">
                추천 학습으로 이동 <ChevronRight className="h-5 w-5" />
              </button>
              <button onClick={() => setActive("assessment")} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 py-3 font-black text-blue-700">
                바로 형성평가 보기
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ConceptScreen({ selectedConcept, setSelectedConcept, completeMission, isMissionComplete }) {
  const lesson = selectedConcept ? conceptLessons[selectedConcept] : null;
  const [directA, setDirectA] = useState(2);
  const [inverseA, setInverseA] = useState(4);
  if (!lesson) {
    return <Card className="h-full p-5"><div className="mb-4 flex items-end justify-between"><div><h2 className="text-2xl font-black text-blue-950">개념을 차근차근 익혀요!</h2><p className="mt-1 text-sm text-slate-500">상황, 표, 식, 그래프를 연결하면서 함수 개념을 익힙니다.</p></div><div className="rounded-2xl bg-purple-50 px-4 py-2 text-sm font-black text-purple-700">표상 연결 중심</div></div><div className="grid h-[calc(100%-82px)] gap-4 grid-cols-2 grid-rows-2">{conceptCards.map((card) => <button key={card.id} onClick={() => setSelectedConcept(card.id)} className="group rounded-[1.7rem] border border-blue-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"><div className="mx-auto flex h-24 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-black text-blue-700">{card.visual === "axes" ? <AxesMini /> : <span>{card.visual}</span>}</div><h3 className="mt-3 text-lg font-black text-blue-950">{card.title}</h3><p className="mt-1 min-h-[32px] text-sm text-slate-500">{card.desc}</p><div className="mt-3 inline-flex rounded-xl bg-blue-600 px-5 py-2 font-black text-white group-hover:bg-blue-700">학습하기</div></button>)}</div></Card>;
  }
  return <Card className="h-full overflow-hidden p-5"><div className="mb-3 flex items-start justify-between gap-3"><div><button onClick={() => setSelectedConcept(null)} className="mb-2 rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-50">← 개념 목록으로</button><h2 className="text-2xl font-black text-blue-950">{lesson.title}</h2><p className="mt-1 text-sm text-slate-500">{lesson.subtitle}</p></div><div className="flex items-center gap-2"><MissionStatusBadge done={isMissionComplete("concept")} /><button onClick={() => completeMission("concept", 20)} disabled={isMissionComplete("concept")} className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-green-100 disabled:bg-green-100 disabled:text-green-700">{isMissionComplete("concept") ? "완료됨" : "개념학습 완료 +20P"}</button><div className="rounded-[1.5rem] bg-blue-50 px-5 py-3 text-center text-xl font-black text-blue-700">{lesson.expression}</div></div></div><div className="h-[calc(100%-95px)] overflow-hidden">{selectedConcept === "direct" ? <DirectProportionExplorer a={directA} setA={setDirectA} /> : selectedConcept === "inverse" ? <InverseProportionExplorer a={inverseA} setA={setInverseA} /> : <ConceptLessonBody lesson={lesson} />}</div></Card>;
}

function ConceptLessonBody({ lesson }) {
  if (lesson.quadrants) {
    return (
      <div className="grid h-full gap-3 overflow-hidden xl:grid-cols-[0.9fr_1.15fr_0.95fr]">
        <div className="space-y-3 overflow-hidden">
          <div className="rounded-[1.4rem] border border-blue-100 bg-blue-50/50 p-4">
            <h3 className="text-lg font-black text-blue-950">핵심 생각</h3>
            <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700">{lesson.bigIdea}</p>
          </div>
          <div className="rounded-[1.4rem] border border-amber-100 bg-amber-50 p-4">
            <h3 className="text-lg font-black text-amber-900">생각해보기</h3>
            <p className="mt-2 text-sm font-bold text-slate-700">{lesson.prompt}</p>
          </div>
        </div>
        <QuadrantCards quadrants={lesson.quadrants} compact />
        <div className="space-y-3 overflow-hidden">
          <CheckPoints points={lesson.points} compact />
          <RepresentationCards representation={lesson.representation} compact />
        </div>
      </div>
    );
  }

  return <div className="grid h-full gap-3 overflow-hidden xl:grid-cols-[0.95fr_1.05fr]"><div className="space-y-3 overflow-hidden"><div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-4"><h3 className="text-lg font-black text-blue-950">핵심 생각</h3><p className="mt-2 text-sm font-bold leading-relaxed text-slate-700">{lesson.bigIdea}</p></div><CheckPoints points={lesson.points} compact /></div><div className="space-y-3 overflow-hidden"><RepresentationCards representation={lesson.representation} compact /><div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-4"><h3 className="text-lg font-black text-amber-900">생각해보기</h3><p className="mt-2 text-sm font-bold text-slate-700">{lesson.prompt}</p></div></div></div>;
}

function QuadrantCards({ quadrants, compact = false }) {
  return <div className={`rounded-[1.4rem] border border-blue-100 bg-white ${compact ? "p-4" : "p-5"}`}><h3 className={`${compact ? "text-lg" : "text-xl"} font-black text-blue-950`}>사분면 빠르게 확인하기</h3><div className={`${compact ? "mt-3" : "mt-4"} grid grid-cols-2 gap-2`}>{quadrants.map((q) => <div key={q.name} className={`rounded-2xl ${compact ? "p-3" : "p-4"} ${q.color}`}><div className="text-sm font-black">{q.name}</div><div className={`${compact ? "mt-0.5 text-xl" : "mt-1 text-2xl"} font-black`}>{q.sign}</div><div className="mt-1 text-xs font-bold">예: {q.example}</div></div>)}</div><div className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">좌표축 위의 점은 사분면에 속하지 않아요. 예: (3, 0), (0, -2)</div></div>;
}

function CheckPoints({ points, compact = false }) {
  return <div className={`rounded-[1.4rem] border border-blue-100 bg-white ${compact ? "p-4" : "p-5"}`}><h3 className={`${compact ? "text-lg" : "text-xl"} font-black text-blue-950`}>꼭 확인할 점</h3><div className={`${compact ? "mt-3 space-y-2" : "mt-4 space-y-3"}`}>{points.map((point) => <div key={point} className={`flex gap-2 rounded-2xl bg-slate-50 ${compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"} font-bold text-slate-700`}><CheckCircle2 className={`${compact ? "h-4 w-4" : "h-5 w-5"} mt-0.5 shrink-0 text-green-600`} /><span>{point}</span></div>)}</div></div>;
}

function RepresentationCards({ representation, compact = false }) {
  return <div className={`rounded-[1.4rem] border border-purple-100 bg-purple-50/50 ${compact ? "p-4" : "p-5"}`}><h3 className={`${compact ? "text-lg" : "text-xl"} font-black text-purple-950`}>표상 연결</h3><p className="mt-1 text-xs font-bold text-slate-600">상황 → 표 → 식 → 그래프를 연결합니다.</p><div className={`${compact ? "mt-3 grid-cols-2 gap-2" : "mt-4 md:grid-cols-4 gap-3"} grid`}>{representation.map((item, index) => <div key={item.label} className={`rounded-2xl bg-white ${compact ? "p-3" : "p-4"} shadow-sm`}><div className="mb-1 flex items-center gap-2 text-xs font-black text-purple-700"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100">{index + 1}</span>{item.label}</div><div className="text-xs font-bold leading-relaxed text-slate-700">{item.value}</div></div>)}</div></div>;
}

function DirectProportionExplorer({ a, setA }) {
  const xs = [-4, -3, -2, -1, 1, 2, 3, 4];
  const width = 360;
  const height = 360;
  const padding = 10;
  const min = -5;
  const max = 5;
  const plotSize = Math.min(width - padding * 2, height - padding * 2);
  const plotLeft = (width - plotSize) / 2;
  const plotTop = (height - plotSize) / 2;
  const toSvgX = (value) => plotLeft + ((value - min) / (max - min)) * plotSize;
  const toSvgY = (value) => plotTop + plotSize - ((value - min) / (max - min)) * plotSize;
  const segment = getClippedDirectSegment(a, min, max, min, max);

  return (
    <div className="h-full overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-emerald-950">정비례 그래프 조작하기</h3>
          <p className="text-xs font-bold text-slate-600">a값을 움직이며 y = ax 그래프의 모양을 관찰해요.</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-2 text-xl font-black text-emerald-700">a = {a}</div>
      </div>

      <SliderBox value={a} setValue={setA} min={-4} max={4} color="emerald" />

      <div className="mt-2 grid h-[calc(100%-106px)] min-h-0 gap-3 xl:grid-cols-[0.9fr_1.35fr]">
        <div className="space-y-2 overflow-hidden">
          <div className="rounded-2xl bg-white p-2 text-center">
            <div className="text-2xl font-black text-emerald-700">y = {a}x</div>
            <div className="mt-1 text-xs font-bold text-slate-600">
              {a > 0 ? "제1사분면과 제3사분면을 지나요." : a < 0 ? "제2사분면과 제4사분면을 지나요." : "a=0이면 y=ax(a≠0)의 정비례 조건에서 제외됩니다."}
            </div>
          </div>
          <DirectTable xs={xs} a={a} />
          <DirectCheckPoints />
        </div>

        <div className="min-h-0 overflow-hidden rounded-2xl bg-white p-1">
          <DirectGraph plotSize={plotSize} plotLeft={plotLeft} plotTop={plotTop} width={width} height={height} segment={segment} toSvgX={toSvgX} toSvgY={toSvgY} />
        </div>
      </div>
    </div>
  );
}

function DirectGraph({ plotSize, plotLeft, plotTop, width, height, segment, toSvgX, toSvgY }) {
  const ticks = Array.from({ length: 21 }, (_, index) => -5 + index * 0.5);
  return (
    <div className="flex h-full min-h-0 items-center justify-center rounded-2xl bg-white p-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full rounded-xl bg-slate-50">
        <defs>
          <clipPath id="direct-clip">
            <rect x={plotLeft} y={plotTop} width={plotSize} height={plotSize} />
          </clipPath>
        </defs>
        {ticks.map((n) => (
          <g key={`direct-grid-${n}`}>
            <line x1={toSvgX(n)} y1={plotTop} x2={toSvgX(n)} y2={plotTop + plotSize} stroke={Math.abs(n) < 1e-9 ? "#94a3b8" : "#e5e7eb"} strokeWidth={Math.abs(n) < 1e-9 ? 1.5 : 1} />
            <line x1={plotLeft} y1={toSvgY(n)} x2={plotLeft + plotSize} y2={toSvgY(n)} stroke={Math.abs(n) < 1e-9 ? "#94a3b8" : "#e5e7eb"} strokeWidth={Math.abs(n) < 1e-9 ? 1.5 : 1} />
            {Number.isInteger(n) && n !== 0 && (
              <>
                <text x={toSvgX(n) - 5} y={toSvgY(0) + 16} fontSize="10" fill="#64748b">{n}</text>
                <text x={toSvgX(0) + 8} y={toSvgY(n) + 4} fontSize="10" fill="#64748b">{n}</text>
              </>
            )}
          </g>
        ))}
        <line x1={plotLeft} y1={toSvgY(0)} x2={plotLeft + plotSize} y2={toSvgY(0)} stroke="#475569" strokeWidth="1.5" />
        <line x1={toSvgX(0)} y1={plotTop} x2={toSvgX(0)} y2={plotTop + plotSize} stroke="#475569" strokeWidth="1.5" />
        {segment && (
          <line clipPath="url(#direct-clip)" x1={toSvgX(segment[0].x)} y1={toSvgY(segment[0].y)} x2={toSvgX(segment[1].x)} y2={toSvgY(segment[1].y)} stroke="#4f46e5" strokeWidth="3" />
        )}
        <circle cx={toSvgX(0)} cy={toSvgY(0)} r="5" fill="#059669" />
        <text x={toSvgX(0) + 8} y={toSvgY(0) - 8} fontSize="12" fill="#059669" fontWeight="800">원점</text>
        <text x={plotLeft + plotSize - 12} y={toSvgY(0) - 8} fontSize="13" fill="#334155">x</text>
        <text x={toSvgX(0) + 8} y={plotTop + 14} fontSize="13" fill="#334155">y</text>
      </svg>
    </div>
  );
}

function DirectCheckPoints() {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
      <h4 className="text-base font-black text-emerald-900">꼭 확인할 점</h4>
      <div className="mt-2 space-y-1.5 text-xs font-bold text-slate-700">
        <div>• 정비례는 <span className="text-emerald-700">y = ax (a ≠ 0)</span> 꼴입니다.</div>
        <div>• <span className="text-emerald-700">y÷x</span>의 값이 항상 일정합니다.</div>
        <div>• 그래프는 반드시 <span className="text-emerald-700">원점 (0, 0)</span>을 지납니다.</div>
        <div>• a가 양수이면 제1, 3사분면 / 음수이면 제2, 4사분면을 지납니다.</div>
        <div>• |a|가 클수록 그래프는 더 가파릅니다.</div>
      </div>
    </div>
  );
}

function InverseProportionExplorer({ a, setA }) {
  const xs = [-4, -2, -1, 1, 2, 4];
  const width = 360;
  const height = 360;
  const padding = 10;
  const min = -5;
  const max = 5;
  const plotSize = Math.min(width - padding * 2, height - padding * 2);
  const plotLeft = (width - plotSize) / 2;
  const plotTop = (height - plotSize) / 2;
  const toSvgX = (value) => plotLeft + ((value - min) / (max - min)) * plotSize;
  const toSvgY = (value) => plotTop + plotSize - ((value - min) / (max - min)) * plotSize;
  const segments = buildInverseSegments(a, min, max, min, max, 0.02);

  return (
    <div className="h-full overflow-hidden rounded-[1.5rem] border border-violet-100 bg-violet-50/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-violet-950">반비례 그래프 조작하기</h3>
          <p className="text-xs font-bold text-slate-600">a값을 움직이며 y = a/x 그래프의 모양을 관찰해요.</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-2 text-xl font-black text-violet-700">a = {a}</div>
      </div>

      <SliderBox value={a} setValue={setA} min={-8} max={8} color="violet" />

      <div className="mt-2 grid h-[calc(100%-106px)] min-h-0 gap-3 xl:grid-cols-[0.9fr_1.35fr]">
        <div className="space-y-2 overflow-hidden">
          <div className="rounded-2xl bg-white p-2 text-center">
            <div className="text-2xl font-black text-violet-700">y = {a}/x</div>
            <div className="mt-1 text-xs font-bold text-slate-600">
              {a > 0 ? "제1사분면과 제3사분면에 나타나요." : a < 0 ? "제2사분면과 제4사분면에 나타나요." : "a=0이면 y=a/x(a≠0)의 반비례 조건에서 제외됩니다."}
            </div>
          </div>
          <InverseTable xs={xs} a={a} />
          <InverseCheckPoints />
        </div>

        <div className="min-h-0 overflow-hidden rounded-2xl bg-white p-1">
          <InverseGraph plotSize={plotSize} plotLeft={plotLeft} plotTop={plotTop} width={width} height={height} segments={segments} toSvgX={toSvgX} toSvgY={toSvgY} />
        </div>
      </div>
    </div>
  );
}

function SliderBox({ value, setValue, min, max, color }) {
  const accent = color === "violet" ? "accent-violet-600" : "accent-emerald-600";
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <label className={`shrink-0 text-sm font-black ${color === "violet" ? "text-violet-900" : "text-emerald-900"}`}>a 값 조절</label>
        <div className="w-full max-w-[320px]">
          <input type="range" min={min} max={max} step="1" value={value} onChange={(event) => setValue(Number(event.target.value))} className={`w-full ${accent}`} />
          <div className="mt-1 flex justify-between text-xs font-bold text-slate-500">
            <span>{min}</span><span>{Math.round(min / 2)}</span><span>0</span><span>{Math.round(max / 2)}</span><span>{max}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InverseGraph({ plotSize, plotLeft, plotTop, width, height, segments, toSvgX, toSvgY }) {
  const ticks = Array.from({ length: 21 }, (_, index) => -5 + index * 0.5);
  const pathFromSegment = (segment) => segment.map((point, index) => `${index === 0 ? "M" : "L"} ${toSvgX(point.x)} ${toSvgY(point.y)}`).join(" ");
  return (
    <div className="flex h-full min-h-0 items-center justify-center rounded-2xl bg-white p-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full rounded-xl bg-slate-50">
        <defs>
          <clipPath id="inverse-clip">
            <rect x={plotLeft} y={plotTop} width={plotSize} height={plotSize} />
          </clipPath>
        </defs>
        {ticks.map((n) => (
          <g key={`inverse-grid-${n}`}>
            <line x1={toSvgX(n)} y1={plotTop} x2={toSvgX(n)} y2={plotTop + plotSize} stroke={Math.abs(n) < 1e-9 ? "#94a3b8" : "#e5e7eb"} strokeWidth={Math.abs(n) < 1e-9 ? 1.5 : 1} />
            <line x1={plotLeft} y1={toSvgY(n)} x2={plotLeft + plotSize} y2={toSvgY(n)} stroke={Math.abs(n) < 1e-9 ? "#94a3b8" : "#e5e7eb"} strokeWidth={Math.abs(n) < 1e-9 ? 1.5 : 1} />
            {Number.isInteger(n) && n !== 0 && (
              <>
                <text x={toSvgX(n) - 5} y={toSvgY(0) + 16} fontSize="10" fill="#64748b">{n}</text>
                <text x={toSvgX(0) + 8} y={toSvgY(n) + 4} fontSize="10" fill="#64748b">{n}</text>
              </>
            )}
          </g>
        ))}
        <line x1={plotLeft} y1={toSvgY(0)} x2={plotLeft + plotSize} y2={toSvgY(0)} stroke="#475569" strokeWidth="1.5" />
        <line x1={toSvgX(0)} y1={plotTop} x2={toSvgX(0)} y2={plotTop + plotSize} stroke="#475569" strokeWidth="1.5" />
        {segments.map((segment, index) => <path key={index} clipPath="url(#inverse-clip)" d={pathFromSegment(segment)} fill="none" stroke="#7c3aed" strokeWidth="3" />)}
        <text x={plotLeft + plotSize - 12} y={toSvgY(0) - 8} fontSize="13" fill="#334155">x</text>
        <text x={toSvgX(0) + 8} y={plotTop + 14} fontSize="13" fill="#334155">y</text>
      </svg>
    </div>
  );
}

function InverseCheckPoints() {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-3">
      <h4 className="text-base font-black text-violet-900">꼭 확인할 점</h4>
      <div className="mt-2 space-y-1.5 text-xs font-bold text-slate-700">
        <div>• 반비례는 <span className="text-violet-700">y = a/x (a ≠ 0)</span> 꼴입니다.</div>
        <div>• <span className="text-violet-700">xy</span>의 값이 항상 일정합니다.</div>
        <div>• a가 양수이면 제1, 3사분면 / 음수이면 제2, 4사분면에 나타납니다.</div>
        <div>• 그래프는 <span className="text-violet-700">x축과 y축에 가까워지지만 닿지 않습니다.</span></div>
        <div>• |a|가 클수록 그래프가 좌표축에서 더 멀리 벌어집니다.</div>
      </div>
    </div>
  );
}

function DirectTable({ xs, a }) {
  return <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white"><table className="w-full text-center text-sm"><tbody><tr className="bg-emerald-50 font-black text-emerald-900"><td className="px-2 py-2">x</td>{xs.map((xValue) => <td key={`x-${xValue}`} className="px-2 py-2">{xValue}</td>)}</tr><tr className="font-bold text-slate-700"><td className="bg-emerald-50 px-2 py-2 font-black text-emerald-900">y</td>{xs.map((xValue) => <td key={`y-${xValue}`} className="px-2 py-2">{a * xValue}</td>)}</tr><tr className="font-bold text-slate-500"><td className="bg-emerald-50 px-2 py-2 font-black text-emerald-900">y÷x</td>{xs.map((xValue) => <td key={`r-${xValue}`} className="px-2 py-2">{xValue === 0 ? "—" : a}</td>)}</tr></tbody></table></div>;
}

function InverseTable({ xs, a }) {
  return <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white"><table className="w-full text-center text-sm"><tbody><tr className="bg-violet-50 font-black text-violet-900"><td className="px-2 py-2">x</td>{xs.map((xValue) => <td key={`ix-${xValue}`} className="px-2 py-2">{xValue}</td>)}</tr><tr className="font-bold text-slate-700"><td className="bg-violet-50 px-2 py-2 font-black text-violet-900">y</td>{xs.map((xValue) => <td key={`iy-${xValue}`} className="px-2 py-2">{a === 0 ? "—" : formatValue(a / xValue)}</td>)}</tr><tr className="font-bold text-slate-500"><td className="bg-violet-50 px-2 py-2 font-black text-violet-900">xy</td>{xs.map((xValue) => <td key={`ir-${xValue}`} className="px-2 py-2">{a === 0 ? "—" : a}</td>)}</tr></tbody></table></div>;
}

function ExploreScreen({ completeMission, isMissionComplete, reflection, onSaveReflection }) {
  const [mode, setMode] = useState("mission");
  const [x, setX] = useState(2);
  const [y, setY] = useState(3);
  const [plottedPoints, setPlottedPoints] = useState([{ x: 2, y: 3, label: "A" }]);
  const [feedback, setFeedback] = useState("미션에 맞는 점을 찍어 그래프 탐험을 시작해 보세요.");
  const [tableType, setTableType] = useState("direct");
  const [missionIndex, setMissionIndex] = useState(0);
  const [tableA, setTableA] = useState(2);
  const [tableInputs, setTableInputs] = useState({});
  const [showTableLine, setShowTableLine] = useState(false);
  const [challenge, setChallenge] = useState({ type: "direct", a: 2 });
  const [showChallengeGraph, setShowChallengeGraph] = useState(false);

  const makeRandomA = (type) => {
    const values = type === "inverse" ? [-8, -6, -4, -3, -2, 2, 3, 4, 6, 8] : [-4, -3, -2, 2, 3, 4];
    return values[Math.floor(Math.random() * values.length)];
  };

  const makeRandomChallenge = () => {
    const type = Math.random() < 0.5 ? "direct" : "inverse";
    return { type, a: makeRandomA(type) };
  };

  const missionBank = [
    { title: "미션: 제1사분면에 점을 찍어라!", description: "x좌표와 y좌표가 모두 양수인 점을 찾아 좌표평면에 표시하세요.", check: (point) => point.x > 0 && point.y > 0, success: "성공! 제1사분면은 x좌표와 y좌표가 모두 양수인 영역입니다.", hint: "제1사분면의 부호는 (+, +)입니다." },
    { title: "미션: 제2사분면에 점을 찍어라!", description: "x좌표는 음수, y좌표는 양수인 점을 찾아 좌표평면에 표시하세요.", check: (point) => point.x < 0 && point.y > 0, success: "성공! 제2사분면은 x좌표가 음수, y좌표가 양수인 영역입니다.", hint: "제2사분면의 부호는 (-, +)입니다." },
    { title: "미션: 제3사분면에 점을 찍어라!", description: "x좌표와 y좌표가 모두 음수인 점을 찾아 좌표평면에 표시하세요.", check: (point) => point.x < 0 && point.y < 0, success: "성공! 제3사분면은 x좌표와 y좌표가 모두 음수인 영역입니다.", hint: "제3사분면의 부호는 (-, -)입니다." },
    { title: "미션: 제4사분면에 점을 찍어라!", description: "x좌표는 양수, y좌표는 음수인 점을 찾아 좌표평면에 표시하세요.", check: (point) => point.x > 0 && point.y < 0, success: "성공! 제4사분면은 x좌표가 양수, y좌표가 음수인 영역입니다.", hint: "제4사분면의 부호는 (+, -)입니다." },
    { title: "미션: x축 위의 점을 찍어라!", description: "y좌표가 0인 점을 찾아 좌표평면에 표시하세요.", check: (point) => point.y === 0, success: "성공! y좌표가 0이면 x축 위의 점입니다.", hint: "x축 위의 점은 (x, 0) 꼴입니다." },
    { title: "미션: y축 위의 점을 찍어라!", description: "x좌표가 0인 점을 찾아 좌표평면에 표시하세요.", check: (point) => point.x === 0, success: "성공! x좌표가 0이면 y축 위의 점입니다.", hint: "y축 위의 점은 (0, y) 꼴입니다." },
    { title: "미션: 원점에 점을 찍어라!", description: "x좌표와 y좌표가 모두 0인 점을 찾아 좌표평면에 표시하세요.", check: (point) => point.x === 0 && point.y === 0, success: "성공! 원점의 좌표는 (0, 0)입니다.", hint: "원점은 x축과 y축이 만나는 점입니다." },
  ];

  const mission = missionBank[missionIndex];
  const xValues = tableType === "direct" ? [-2, -1, 0, 1, 2] : [-4, -2, -1, 1, 2, 4];
  const expression = tableType === "direct" ? `y = ${tableA}x` : `y = ${tableA}/x`;
  const relation = tableType === "direct" ? `y÷x = ${tableA}` : `xy = ${tableA}`;
  const expectedY = (xValue) => tableType === "direct" ? tableA * xValue : tableA / xValue;
  const tablePoints = xValues
    .map((xValue, index) => {
      const raw = tableInputs[String(xValue)];
      if (raw === undefined || raw === "" || raw === "-" || raw === "/" || raw.endsWith("/")) return null;
      const yValue = parseMathNumber(raw);
      if (!Number.isFinite(yValue)) return null;
      return { x: xValue, y: yValue, label: String.fromCharCode(65 + index) };
    })
    .filter(Boolean);

  const changeMission = () => {
    setMissionIndex((prev) => {
      let next = Math.floor(Math.random() * missionBank.length);
      while (next === prev && missionBank.length > 1) {
        next = Math.floor(Math.random() * missionBank.length);
      }
      const nextMission = missionBank[next];
      setFeedback(`새 미션이 나왔어요. ${nextMission.hint}`);
      return next;
    });
    setPlottedPoints([]);
  };

  const resetTable = (type = tableType) => {
    let nextA = makeRandomA(type);
    while (nextA === tableA) {
      nextA = makeRandomA(type);
    }
    setTableType(type);
    setTableA(nextA);
    setTableInputs({});
    setShowTableLine(false);
    setFeedback(type === "direct" ? `새 정비례식 y = ${nextA}x가 나왔어요. 표의 빈칸을 채워 보세요.` : `새 반비례식 y = ${nextA}/x가 나왔어요. 표의 빈칸을 채워 보세요.`);
  };

  const loadTable = () => {
    setMode("table");
    resetTable(tableType);
  };

  const updateTableInput = (xValue, value) => {
    const cleaned = normalizeMathInput(value);
    setTableInputs((prev) => ({ ...prev, [String(xValue)]: cleaned }));
    setShowTableLine(false);
    const yValue = parseMathNumber(cleaned);
    if (cleaned !== "" && cleaned !== "-" && Number.isFinite(yValue)) {
      setFeedback(`점 (${xValue}, ${formatValue(yValue)})이 좌표평면에 표시되었어요. 나머지 빈칸도 채워 보세요.`);
    }
  };

  const drawTableGraph = () => {
    if (tablePoints.length < 2) {
      setFeedback("그래프를 그리려면 표에 점을 2개 이상 입력해야 해요.");
      return;
    }
    setShowTableLine(true);
    const correctCount = tablePoints.reduce((sum, point) => sum + (Math.abs(point.y - expectedY(point.x)) < 0.001 ? 1 : 0), 0);
    setFeedback(`그래프를 연결했어요. 입력한 ${tablePoints.length}개 점 중 식에 맞는 점은 ${correctCount}개입니다.`);
  };

  const addPoint = () => {
    const nextPoint = { x: Number(x), y: Number(y), label: String.fromCharCode(65 + plottedPoints.length) };
    setPlottedPoints((prev) => [...prev, nextPoint]);
    if (mode === "mission") {
      setFeedback(mission.check(nextPoint) ? mission.success : `아직 미션 성공이 아니에요. ${mission.hint}`);
    } else if (mode === "challenge") {
      const correctPoint = { ...nextPoint, correct: isChallengeCorrect(nextPoint) };
      setPlottedPoints((prev) => [...prev.slice(0, -1), correctPoint]);
      setShowChallengeGraph(false);
      setFeedback(correctPoint.correct ? `정답 점입니다. (${correctPoint.x}, ${correctPoint.y})는 ${challengeExpression} 위의 점이에요.` : `아직 조건에 맞지 않아요. ${challenge.type === "direct" ? "y=ax에 대입해서 y값을 확인하세요." : "xy의 값이 일정한지 확인하세요."}`);
    } else {
      setFeedback(`점 (${nextPoint.x}, ${nextPoint.y})을 찍었습니다. 여러 점을 연결하면 그래프의 모양을 볼 수 있어요.`);
    }
  };

  const reset = () => {
    setPlottedPoints([]);
    setFeedback("좌표를 선택하고 점을 찍어 보세요.");
  };

  const challengeExpression = challenge.type === "direct" ? `y = ${challenge.a}x` : `y = ${challenge.a}/x`;
  const challengeRelation = challenge.type === "direct" ? `y÷x = ${challenge.a}` : `xy = ${challenge.a}`;
  const isChallengeCorrect = (point) => {
    if (challenge.type === "direct") return Math.abs(point.y - challenge.a * point.x) < 0.001;
    return point.x !== 0 && Math.abs(point.y - challenge.a / point.x) < 0.001;
  };
  const correctChallengeCount = plottedPoints.filter((point) => point.correct).length;
  const startChallenge = () => {
    let next = makeRandomChallenge();
    while (next.type === challenge.type && next.a === challenge.a) {
      next = makeRandomChallenge();
    }
    setChallenge(next);
    setPlottedPoints([]);
    setShowChallengeGraph(false);
    setFeedback(`${next.type === "direct" ? "정비례" : "반비례"} 조건 미션이 나왔어요. ${next.type === "direct" ? `y = ${next.a}x` : `y = ${next.a}/x`}를 만족하는 점 3개를 찾아보세요.`);
  };
  const drawChallengeGraph = () => {
    if (correctChallengeCount < 3) {
      setFeedback("조건을 만족하는 점을 3개 이상 찾으면 그래프를 완성할 수 있어요.");
      return;
    }
    setShowChallengeGraph(true);
    setFeedback("좋아요. 조건을 만족하는 점들이 모여 함수 그래프가 되는 것을 확인해 보세요.");
  };

  const pointsToShow = mode === "table" ? tablePoints : plottedPoints;

  return (
    <Card className="h-full overflow-hidden p-5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-black text-blue-950">그래프 탐험대</h2>
          <p className="mt-1 text-sm text-slate-500">좌표를 찍는 데서 끝나지 않고, 표의 값을 그래프로 연결하며 함수의 모양을 탐험합니다.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MissionStatusBadge done={isMissionComplete("explore")} />
          <button onClick={() => { setMode("mission"); changeMission(); }} className={`rounded-2xl px-4 py-3 text-sm font-black ${mode === "mission" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-800 hover:bg-white"}`}>좌표 미션</button>
          <button onClick={loadTable} className={`rounded-2xl px-4 py-3 text-sm font-black ${mode === "table" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-800 hover:bg-white"}`}>표 → 그래프</button>
          <button onClick={() => { setMode("challenge"); startChallenge(); }} className={`rounded-2xl px-4 py-3 text-sm font-black ${mode === "challenge" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-white"}`}>그래프 도전</button>
          <button onClick={() => completeMission("explore", 20)} disabled={isMissionComplete("explore")} className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-green-100 disabled:bg-green-100 disabled:text-green-700">{isMissionComplete("explore") ? "탐구 완료" : "탐구 완료 +20P"}</button>
        </div>
      </div>

      <div className="grid h-[calc(100%-86px)] min-h-0 gap-4 xl:grid-cols-[1fr_380px]">
        <div className="rounded-[1.7rem] border border-blue-100 bg-white p-4 shadow-sm">
          <ExplorationPlane
            points={pointsToShow}
            mode={mode}
            tableType={mode === "challenge" ? challenge.type : tableType}
            drawLine={(mode === "table" && showTableLine) || (mode === "challenge" && showChallengeGraph)}
            tableA={mode === "challenge" ? challenge.a : tableA}
          />
        </div>

        <div className="space-y-3 overflow-hidden rounded-[1.7rem] border border-blue-100 bg-blue-50/50 p-4">
          {mode === "mission" && (
            <div className="rounded-2xl bg-white p-4">
              <h3 className="text-lg font-black text-blue-950">{mission.title}</h3>
              <p className="mt-2 text-sm font-bold text-slate-600">{mission.description}</p>
              <div className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-700">힌트: {mission.hint}</div>
              <button type="button" onClick={changeMission} className="mt-3 w-full rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-50">랜덤 미션 바꾸기</button>
            </div>
          )}

          {mode === "table" && (
            <div className="rounded-2xl bg-white p-4">
              <div className="mb-3 flex gap-2">
                <button onClick={() => resetTable("direct")} className={`flex-1 rounded-xl px-3 py-2 text-sm font-black ${tableType === "direct" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>정비례 표</button>
                <button onClick={() => resetTable("inverse")} className={`flex-1 rounded-xl px-3 py-2 text-sm font-black ${tableType === "inverse" ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-700"}`}>반비례 표</button>
              </div>
              <h3 className="text-lg font-black text-blue-950">{tableType === "direct" ? "정비례 표 완성하기" : "반비례 표 완성하기"}</h3>
              <div className={`mt-2 text-2xl font-black ${tableType === "direct" ? "text-emerald-700" : "text-violet-700"}`}>{expression}</div>
              <div className="mt-1 text-sm font-bold text-slate-600">관계 확인: {relation}</div>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-center text-xs">
                  <tbody>
                    <tr className="bg-slate-50 font-black text-slate-700"><td className="py-2">x</td>{xValues.map((xValue) => <td key={`tx-${xValue}`}>{xValue}</td>)}</tr>
                    <tr className="font-bold text-slate-700"><td className="bg-slate-50 py-2 font-black">y</td>{xValues.map((xValue) => <td key={`ty-${xValue}`}><input value={tableInputs[String(xValue)] || ""} onChange={(event) => updateTableInput(xValue, event.target.value)} className="w-12 rounded-lg border border-blue-100 bg-white px-1 py-1 text-center font-black outline-none focus:border-blue-400" placeholder="?" /></td>)}</tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={drawTableGraph} className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-purple-100">그래프 그리기</button>
                <button type="button" onClick={() => resetTable(tableType)} className="rounded-2xl border border-purple-200 bg-white px-4 py-3 text-sm font-black text-purple-700">랜덤 함수식</button>
              </div>
              <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">빈칸에 숫자를 입력하면 좌표평면에 점이 바로 찍힙니다.</div>
            </div>
          )}

          {mode === "challenge" && (
            <div className="rounded-2xl bg-white p-4">
              <h3 className="text-lg font-black text-emerald-950">함수 조건 탐험 미션</h3>
              <div className="mt-2 rounded-2xl bg-emerald-50 px-4 py-3 text-center">
                <div className="text-2xl font-black text-emerald-700">{challengeExpression}</div>
                <div className="mt-1 text-sm font-bold text-slate-600">조건 확인: {challengeRelation}</div>
              </div>
              <div className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                <div>1. 함수식을 만족하는 점을 3개 이상 찾아 찍어보세요.</div>
                <div>2. 맞는 점은 초록색, 틀린 점은 빨간색으로 표시됩니다.</div>
                <div>3. 조건을 만족하는 점이 3개 이상이면 그래프를 완성할 수 있어요.</div>
              </div>
              <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
                정답 점 {correctChallengeCount}개 / 3개
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={drawChallengeGraph} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100">그래프 완성하기</button>
                <button type="button" onClick={startChallenge} className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700">랜덤 미션</button>
              </div>
            </div>
          )}

          {mode !== "table" && (
            <div className="rounded-2xl bg-white p-4">
              <h3 className="text-lg font-black text-blue-950">좌표 입력</h3>
              <NumberControl label="x" value={x} setValue={setX} />
              <div className="mt-3" />
              <NumberControl label="y" value={y} setValue={setY} />
              <button onClick={addPoint} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-base font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"><MapPin className="h-5 w-5" /> 탐험 점 찍기</button>
              <button onClick={reset} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 py-3 font-black text-blue-700 transition hover:bg-blue-50"><RotateCcw className="h-4 w-4" /> 초기화</button>
            </div>
          )}

          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{feedback}</div>
          <GraphExplanationBox grade="middle1" reflection={reflection} onSave={onSaveReflection} />
        </div>
      </div>
    </Card>
  );
}

function ExplorationPlane({ points, mode, tableType, drawLine = false, tableA = 2 }) {
  const size = 520;
  const pointValues = points.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)]);
  const dynamicExtent = Math.max(5, ...pointValues, Math.abs(tableA));
  const extent = Math.min(20, Math.ceil(dynamicExtent));
  const min = -extent;
  const max = extent;
  const toPx = (value) => ((value - min) / (max - min)) * size;
  const toPy = (value) => size - ((value - min) / (max - min)) * size;
  const validPoints = points.filter((p) => p.x >= min && p.x <= max && p.y >= min && p.y <= max).sort((a, b) => a.x - b.x);
  const directSegment = tableType === "direct" ? getClippedDirectSegment(tableA, min, max, min, max) : null;
  const inverseSegments = tableType === "inverse" ? buildInverseSegments(tableA, min, max, min, max, 0.025) : [];
  const pathFromPoints = (targetPoints) => targetPoints.map((p, index) => `${index === 0 ? "M" : "L"} ${toPx(p.x)} ${toPy(p.y)}`).join(" ");
  const tickStep = extent > 5 ? 1 : 0.5;
  const ticks = Array.from({ length: Math.floor((max - min) / tickStep) + 1 }, (_, index) => min + index * tickStep);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full max-h-[560px] w-full rounded-2xl bg-slate-50">
      <defs>
        <clipPath id="explore-clip"><rect x="0" y="0" width={size} height={size} /></clipPath>
      </defs>
      {ticks.map((n) => {
        const fixed = Number(n.toFixed(2));
        const isAxis = Math.abs(fixed) < 1e-9;
        const isMajor = Number.isInteger(fixed);
        return (
          <g key={fixed}>
            <line x1={toPx(fixed)} y1="0" x2={toPx(fixed)} y2={size} stroke={isAxis ? "#64748b" : isMajor ? "#d1d5db" : "#e5e7eb"} strokeWidth={isAxis ? "2" : "1"} />
            <line x1="0" y1={toPy(fixed)} x2={size} y2={toPy(fixed)} stroke={isAxis ? "#64748b" : isMajor ? "#d1d5db" : "#e5e7eb"} strokeWidth={isAxis ? "2" : "1"} />
            {isMajor && fixed !== 0 && <text x={toPx(fixed) - 5} y={toPy(0) + 17} fontSize="12" fill="#64748b">{fixed}</text>}
            {isMajor && fixed !== 0 && <text x={toPx(0) + 8} y={toPy(fixed) + 4} fontSize="12" fill="#64748b">{fixed}</text>}
          </g>
        );
      })}
      <text x={size - 18} y={toPy(0) - 8} fontSize="16" fill="#334155">x</text>
      <text x={toPx(0) + 8} y="18" fontSize="16" fill="#334155">y</text>
      {drawLine && tableType === "direct" && directSegment && (
        <line clipPath="url(#explore-clip)" x1={toPx(directSegment[0].x)} y1={toPy(directSegment[0].y)} x2={toPx(directSegment[1].x)} y2={toPy(directSegment[1].y)} stroke="#059669" strokeWidth="3" />
      )}
      {drawLine && tableType === "inverse" && inverseSegments.map((segment, index) => (
        <path key={index} clipPath="url(#explore-clip)" d={pathFromPoints(segment)} fill="none" stroke="#7c3aed" strokeWidth="3" />
      ))}
      {validPoints.map((point) => (
        <g key={`${point.label}-${point.x}-${point.y}`}>
          <circle cx={toPx(point.x)} cy={toPy(point.y)} r="8" fill={mode === "challenge" ? (point.correct ? "#059669" : "#dc2626") : mode === "table" && tableType === "inverse" ? "#7c3aed" : "#2563eb"} />
          <text x={toPx(point.x) + 10} y={toPy(point.y) - 10} fontSize="14" fill="#1e3a8a" fontWeight="800">{point.label}({point.x}, {formatValue(point.y)})</text>
        </g>
      ))}
    </svg>
  );
}

function GameScreen({ awardPoints, expPoints }) {
  const [gameMode, setGameMode] = useState(null);
  const games = [
    {
      id: "mole",
      title: "좌표 두더지",
      desc: "목표 순서쌍을 보고 알맞은 좌표의 두더지를 잡아요.",
      icon: "🔨",
    },
    {
      id: "matching",
      title: "정비례 매칭",
      desc: "정비례 그래프와 성질에 맞는 수식 카드를 연결해요.",
      icon: "📈",
    },
    {
      id: "inverseDetective",
      title: "반비례 수사대",
      desc: "반비례 단서 보드에 알맞은 식 카드를 찾아 수사를 완료해요.",
      icon: "🕵️‍♂️",
    },
    {
      id: "dailyJudge",
      title: "일상 속 비례 판별",
      desc: "생활 속 상황이 정비례인지, 반비례인지, 둘 다 아닌지 판별해요.",
      icon: "🧩",
    },
  ];

  if (!gameMode) {
    return (
      <Card className="h-full overflow-hidden p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-black text-blue-950">게임존</h2>
            <p className="mt-1 text-sm text-slate-500">원하는 게임을 선택해 배운 내용을 확인하고 탐험 포인트를 모아보세요.</p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-5 py-3 text-lg font-black text-amber-700">⭐ {expPoints}P</div>
        </div>
        <div className="grid h-[calc(100%-84px)] min-h-0 grid-cols-2 grid-rows-2 gap-4">
          {games.map((game) => (
            <button key={game.id} onClick={() => setGameMode(game.id)} className="group rounded-[2rem] border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
              <div className="flex h-full flex-col justify-between gap-4">
                <div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-blue-50 text-3xl transition group-hover:scale-105">{game.icon}</div>
                  <h3 className="mt-4 text-xl font-black text-blue-950">{game.title}</h3>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600">{game.desc}</p>
                </div>
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-100">
                  게임 시작 <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid h-full grid-rows-[46px_1fr] gap-2 overflow-hidden rounded-[2rem] border border-blue-100 bg-white/90 p-2 shadow-sm">
      <div className="flex items-center justify-end rounded-[1.25rem] bg-blue-50/70 px-3">
        <button onClick={() => setGameMode(null)} className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-xs font-black text-blue-700 shadow-sm hover:bg-blue-50">
          ← 게임 선택
        </button>
      </div>
      <div className="min-h-0 overflow-hidden rounded-[1.5rem]">
        {gameMode === "mole" ? (
          <CoordinateMoleGame awardPoints={awardPoints} />
        ) : gameMode === "matching" ? (
          <DirectProportionMatchingGame awardPoints={awardPoints} />
        ) : gameMode === "inverseDetective" ? (
          <InverseDetectiveGame awardPoints={awardPoints} />
        ) : (
          <EverydayRatioJudgeGame />
        )}
      </div>
    </div>
  );
}

function CoordinateMoleGame({ awardPoints }) {
  const highScoreKey = "coord_mole_highscores";
  const [screen, setScreen] = useState("lobby");
  const [difficulty, setDifficulty] = useState(1);
  const [highScores, setHighScores] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(highScoreKey) || "{}");
    } catch {
      return { 1: 0, 2: 0, 3: 0 };
    }
  });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [stageCorrectCount, setStageCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [target, setTarget] = useState({ x: 0, y: 0, text: "(0, 0)", label: "타격할 좌표 목표" });
  const [activeMoles, setActiveMoles] = useState([]);
  const [message, setMessage] = useState("가장 빠르게 정답 두더지를 찾아 터치하세요!");
  const [hammer, setHammer] = useState(null);
  const [floaters, setFloaters] = useState([]);
  const [shake, setShake] = useState(false);
  const [transition, setTransition] = useState(null);

  const roundTimeLimit = 10000;
  const maxLives = 3;
  const positions = [-2, -1, 0, 1, 2];

  const saveHighScores = (nextScores) => {
    setHighScores(nextScores);
    localStorage.setItem(highScoreKey, JSON.stringify(nextScores));
  };

  const selectDifficulty = (level) => {
    setDifficulty(level);
    setMessage(level === 1 ? "1단계는 좌표 라벨을 보며 연습합니다." : level === 2 ? "2단계는 모든 사분면에서 좌표를 찾습니다." : "3단계는 대칭과 평행이동 문제를 해결합니다.");
  };

  const randomCoord = () => Math.floor(Math.random() * 5) - 2;

  const makeTarget = (level) => {
    if (level === 1) {
      const x = Math.floor(Math.random() * 3);
      const y = Math.floor(Math.random() * 3);
      return { x, y, text: `(${x}, ${y})`, label: "★ 기초 모드: 정직한 좌표 타격 ★" };
    }
    if (level === 2) {
      const x = randomCoord();
      const y = randomCoord();
      return { x, y, text: `(${x}, ${y})`, label: "■ 보통 모드: 신속 정확히 공간 격자 해독! ■" };
    }

    const qTypes = ["x-sym", "y-sym", "origin-sym", "trans"];
    const type = qTypes[Math.floor(Math.random() * qTypes.length)];
    let startX = randomCoord();
    let startY = randomCoord();
    if (type === "x-sym") {
      while (startY === 0) startY = randomCoord();
      return { x: startX, y: -startY, text: `점 (${startX}, ${startY})을 x축에 대칭이동한 점`, label: "🔥 심화 모드: x축 대칭 순간포착! 🔥" };
    }
    if (type === "y-sym") {
      while (startX === 0) startX = randomCoord();
      return { x: -startX, y: startY, text: `점 (${startX}, ${startY})을 y축에 대칭이동한 점`, label: "🔥 심화 모드: y축 대칭 순간포착! 🔥" };
    }
    if (type === "origin-sym") {
      while (startX === 0 && startY === 0) {
        startX = randomCoord();
        startY = randomCoord();
      }
      return { x: -startX, y: -startY, text: `점 (${startX}, ${startY})을 원점에 대칭이동한 점`, label: "🔥 심화 모드: 원점 대칭 순간포착! 🔥" };
    }

    const directions = [
      { name: "오른쪽", dx: 1, dy: 0 },
      { name: "왼쪽", dx: -1, dy: 0 },
      { name: "위쪽", dx: 0, dy: 1 },
      { name: "아래쪽", dx: 0, dy: -1 },
    ];
    const move = directions[Math.floor(Math.random() * directions.length)];
    const dist = Math.floor(Math.random() * 2) + 1;
    while (startX + move.dx * dist > 2 || startX + move.dx * dist < -2 || startY + move.dy * dist > 2 || startY + move.dy * dist < -2) {
      startX = randomCoord();
      startY = randomCoord();
    }
    return { x: startX + move.dx * dist, y: startY + move.dy * dist, text: `(${startX}, ${startY})에서 ${move.name}으로 ${dist}칸 이동한 점`, label: "🔥 심화 모드: 평행이동 순간포착! 🔥" };
  };

  const makeMoles = (targetPoint, level) => {
    const result = [{ x: targetPoint.x, y: targetPoint.y, correct: true }];
    const distractorCount = level === 1 ? 1 : level === 2 ? 2 : 3;
    let attempts = 0;
    while (result.length < distractorCount + 1 && attempts < 100) {
      attempts += 1;
      const x = randomCoord();
      const y = randomCoord();
      if (level === 1 && (x < 0 || y < 0)) continue;
      if (result.some((mole) => mole.x === x && mole.y === y)) continue;
      result.push({ x, y, correct: false });
    }
    return result.sort(() => Math.random() - 0.5);
  };

  const generateNextRound = (level = difficulty) => {
    const nextTarget = makeTarget(level);
    setTarget(nextTarget);
    setActiveMoles(makeMoles(nextTarget, level));
    setTimeLeft(100);
  };

  const startGame = () => {
    setScore(0);
    setLives(maxLives);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setStageCorrectCount(0);
    setMessage("가장 빠르게 정답 두더지를 찾아 터치하세요!");
    setScreen("play");
    generateNextRound(difficulty);
  };

  const endGame = (allClear = false) => {
    setScreen("over");
    if (score > (highScores[difficulty] || 0)) {
      saveHighScores({ ...highScores, [difficulty]: score });
    }
    setMessage(allClear ? "전설의 좌표 마스터! 3단계를 모두 통과했어요." : "좌표 평면 두더지 소탕 임무 완료!");
  };

  React.useEffect(() => {
    if (screen !== "play") return undefined;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setLives((life) => {
            const nextLife = life - 1;
            if (nextLife <= 0) setTimeout(() => endGame(false), 0);
            return nextLife;
          });
          setCombo(0);
          setIncorrectCount((count) => count + 1);
          setMessage(`시간 초과! 정답은 (${target.x}, ${target.y})였어요.`);
          setTimeout(() => setScreen((current) => {
            if (current === "play") generateNextRound();
            return current;
          }), 900);
          return 100;
        }
        return next;
      });
    }, roundTimeLimit / 100);
    return () => clearInterval(interval);
  }, [screen, target.x, target.y, difficulty]);

  const showHammer = (x, y) => {
    setHammer({ x, y, id: Date.now() });
    setTimeout(() => setHammer(null), 220);
  };

  const addFloater = (x, y, text, positive) => {
    const id = Date.now() + Math.random();
    setFloaters((prev) => [...prev, { id, x, y, text, positive }]);
    setTimeout(() => setFloaters((prev) => prev.filter((item) => item.id !== id)), 850);
  };

  const handleWrong = (x, y, text = "-50") => {
    setCombo(0);
    setIncorrectCount((count) => count + 1);
    setLives((life) => {
      const nextLife = life - 1;
      if (nextLife <= 0) setTimeout(() => endGame(false), 0);
      return nextLife;
    });
    setScore((prev) => Math.max(0, prev - 50));
    addFloater(x, y, text, false);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    setMessage(`비정답: (${x}, ${y})`);
    setTimeout(() => setScreen((current) => {
      if (current === "play") generateNextRound();
      return current;
    }), 450);
  };

  const hitMole = (mole) => {
    if (screen !== "play") return;
    showHammer(mole.x, mole.y);
    if (!mole.correct) {
      handleWrong(mole.x, mole.y, "-50");
      return;
    }

    const nextCombo = combo + 1;
    const multiplier = nextCombo >= 8 ? 2 : nextCombo >= 5 ? 1.5 : nextCombo >= 3 ? 1.2 : 1;
    const gained = Math.round(100 * multiplier);
    setScore((prev) => prev + gained);
    setCombo(nextCombo);
    setMaxCombo((prev) => Math.max(prev, nextCombo));
    setCorrectCount((count) => count + 1);
    setStageCorrectCount((count) => count + 1);
    awardPoints(Math.max(10, Math.round(gained / 10)));
    addFloater(mole.x, mole.y, `+${gained}`, true);
    setMessage(nextCombo >= 3 ? `${nextCombo} COMBO! 정답 좌표를 빠르게 찾고 있어요.` : `정답! (${mole.x}, ${mole.y})`);

    setStageCorrectCount((count) => {
      const nextStageCount = count + 1;
      if (nextStageCount >= 20) {
        if (difficulty < 3) {
          const nextLevel = difficulty + 1;
          setTransition({ prev: difficulty, next: nextLevel });
          setDifficulty(nextLevel);
          setTimeout(() => {
            setTransition(null);
            setStageCorrectCount(0);
            generateNextRound(nextLevel);
          }, 1500);
        } else {
          setTimeout(() => endGame(true), 850);
        }
        return nextStageCount;
      }
      setTimeout(() => generateNextRound(), 450);
      return nextStageCount;
    });
  };

  const quitGame = () => {
    setScreen("lobby");
    setMessage("게임을 다시 시작할 준비가 되었어요.");
  };

  const progressWidth = `${timeLeft}%`;
  const hearts = Array.from({ length: maxLives }, (_, index) => index < lives);
  const badge = score >= 2000 ? "🏆 좌표계의 지배자 (Master)" : score >= 1200 ? "🥇 플래티넘 수학 영재" : score >= 600 ? "🥈 실버 우수 수강생" : "🥉 새내기 좌표 수습생";

  return (
    <div className="grid h-full place-items-center overflow-hidden rounded-[1.7rem] bg-slate-900 p-2 text-white">
      <style>{`
        .arcade-font { font-family: 'Lilita One', 'Noto Sans KR', sans-serif; }
        .grid-paper { background-size: 20% 20%; background-image: linear-gradient(to right, rgba(147,197,253,.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(147,197,253,.2) 1px, transparent 1px); }
        @keyframes moleFloatUp { 0% { transform: translateY(0) scale(.8); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-40px) scale(1.08); opacity: 0; } }
        @keyframes moleShake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
        @keyframes hammerSwing { 0% { transform: translate(-50%, -50%) rotate(0deg); } 30% { transform: translate(-50%, -50%) rotate(-45deg); } 60% { transform: translate(-50%, -50%) rotate(15deg); } 100% { transform: translate(-50%, -50%) rotate(0deg); } }
        .float-up { animation: moleFloatUp .8s ease-out forwards; }
        .shake-animation { animation: moleShake .4s ease-in-out; }
        .hammer-hit { animation: hammerSwing .2s ease-out; }
      `}</style>
      <div className="relative flex h-full min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-3xl border-4 border-indigo-500 bg-slate-800 shadow-2xl">
        {screen === "lobby" && (
          <div className="flex h-full min-h-0 flex-col items-center justify-between overflow-auto p-6 text-center">
            <div>
              <div className="mt-2 mb-2 flex items-center justify-center space-x-2">
                <span className="text-4xl">🔨</span>
                <h1 className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-3xl font-extrabold tracking-wide text-transparent arcade-font sm:text-4xl">좌표 평면 두더지잡기</h1>
                <span className="text-4xl">🔨</span>
              </div>
              <p className="px-2 text-sm text-slate-300 sm:text-base">중1 수학 '순서쌍과 좌표' 단원 마스터 액티비티!<br />목표 순서쌍에 딱 알맞은 좌표의 두더지를 뽕망치로 때려잡으세요!</p>
            </div>
            <div className="my-4 w-full rounded-2xl border border-slate-600/50 bg-slate-700/50 p-4 text-xs sm:text-sm">
              <h3 className="mb-2 flex items-center justify-center font-bold text-indigo-300"><span className="mr-1">💡</span> 좌표 평면 요약 가이드</h3>
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="rounded border border-indigo-500/20 bg-slate-800/80 p-2"><span className="font-bold text-amber-300">제1사분면:</span> (+, +) 우측 상단</div>
                <div className="rounded border border-indigo-500/20 bg-slate-800/80 p-2"><span className="font-bold text-amber-300">제2사분면:</span> (-, +) 좌측 상단</div>
                <div className="rounded border border-indigo-500/20 bg-slate-800/80 p-2"><span className="font-bold text-amber-300">제3사분면:</span> (-, -) 좌측 하단</div>
                <div className="rounded border border-indigo-500/20 bg-slate-800/80 p-2"><span className="font-bold text-amber-300">제4사분면:</span> (+, -) 우측 하단</div>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">※ x축 위는 y좌표가 0, y축 위는 x좌표가 0입니다.</p>
            </div>
            <div className="w-full space-y-3">
              <label className="block text-sm font-bold text-slate-300">난이도를 선택하세요</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[1, 2, 3].map((level) => {
                  const tone = level === 1 ? "emerald" : level === 2 ? "amber" : "rose";
                  const active = difficulty === level;
                  return (
                    <button key={level} onClick={() => selectDifficulty(level)} className={`rounded-xl border-2 px-2 py-3 font-bold transition-all active:scale-95 ${active ? `scale-[1.03] border-${tone}-500 bg-${tone}-500/20 text-${tone}-400 shadow-md ring-2 ring-${tone}-500/50` : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"}`}>
                      <div className="text-xs">{level}단계</div>
                      <div className="text-sm">{level === 1 ? "기초 (초급)" : level === 2 ? "보통 (중급)" : "대칭 (심화)"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="w-full pt-4">
              <div className="mb-2 text-xs text-indigo-300">최고 기록: <span className="text-sm font-bold text-white">{highScores[difficulty] || 0}</span>점</div>
              <button onClick={startGame} className="flex w-full transform items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-4 text-xl font-extrabold text-white shadow-lg transition-all hover:scale-[1.02] hover:from-indigo-600 hover:to-purple-700 active:scale-95"><span>🎮</span><span>수학 게임 시작!</span></button>
            </div>
          </div>
        )}

        {screen === "play" && (
          <div className="relative flex h-full min-h-0 flex-col justify-between p-4">
            <div className="mb-2 flex items-center justify-between rounded-2xl border border-slate-600 bg-slate-700/80 p-3 shadow">
              <div className="flex items-center space-x-1">{hearts.map((alive, index) => <span key={index} className={`text-xl transition-all duration-300 ${alive ? "scale-100 animate-pulse text-rose-500" : "scale-90 text-slate-600 opacity-40"}`}>❤️</span>)}</div>
              <div className="mx-4 flex-1"><div className="h-3 w-full overflow-hidden rounded-full border border-slate-600 bg-slate-800"><div className={`${timeLeft < 30 ? "animate-pulse bg-gradient-to-r from-rose-500 to-amber-500" : "bg-gradient-to-r from-emerald-400 to-amber-400"} h-full transition-all duration-100 ease-linear`} style={{ width: progressWidth }} /></div></div>
              <div className="text-right"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</div><div className="text-lg font-black text-amber-300 arcade-font">{score}</div></div>
            </div>
            <div className="relative mb-3 overflow-hidden rounded-2xl border-2 border-indigo-400 bg-slate-900 p-3 text-center shadow-inner">
              <div className="mb-1 flex items-center justify-between px-1 text-xs font-bold"><span className="text-indigo-400">{target.label}</span><span className="rounded-full bg-indigo-900/50 px-2 py-0.5 text-[10px] text-indigo-300">단계 진행도: {stageCorrectCount} / 20</span></div>
              <div className="text-2xl font-extrabold tracking-wide text-amber-300 sm:text-3xl">{target.text}</div>
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-rose-400 bg-rose-500 px-2 py-1 text-xs font-black uppercase text-white transition-all ${combo >= 3 ? "scale-100 opacity-100 animate-bounce" : "scale-75 opacity-0"}`}>{combo} COMBO</div>
            </div>
            <CoordinateMoleBoardOriginal moles={activeMoles} difficulty={difficulty} onHit={hitMole} hammer={hammer} floaters={floaters} shake={shake} />
            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-400"><div className="flex items-center space-x-1"><span className="text-amber-400">💡</span><span>{message}</span></div><button onClick={quitGame} className="font-bold text-rose-400 hover:text-rose-300 active:scale-95">게임 포기</button></div>
            {transition && <div className="absolute inset-0 z-50 flex animate-bounce flex-col items-center justify-center bg-slate-900/90 p-4 text-center"><div className="mb-3 text-5xl">⭐</div><h3 className="text-2xl font-black tracking-widest text-amber-300 arcade-font">{transition.prev}단계 대성공!</h3><p className="mt-1 text-sm text-slate-300">훌륭합니다! 다음 {transition.next}단계로 자동 진입합니다.</p><p className="mt-2 text-xs font-bold text-indigo-400">도전 난이도가 상승하고 제한 시간이 초기화됩니다!</p></div>}
          </div>
        )}

        {screen === "over" && (
          <div className="flex h-full min-h-0 flex-col items-center justify-between overflow-auto p-6 text-center">
            <div className="w-full"><div className="my-4 text-5xl">🎉</div><h2 className="text-3xl font-black tracking-wider text-rose-400 arcade-font">게임 종료!</h2><p className="mt-1 text-sm text-slate-400">좌표 평면 두더지 소탕 임무 완료</p><div className="my-6 inline-block rotate-[-2deg] rounded-2xl border-2 border-white bg-gradient-to-r from-amber-500 to-amber-300 px-6 py-3 text-xl font-black text-slate-950 shadow-lg">{badge}</div><div className="mx-auto max-w-sm space-y-3 rounded-2xl border border-slate-600 bg-slate-700/60 p-4"><ResultRow label="최종 획득 점수" value={score.toLocaleString()} color="text-amber-300" /><hr className="border-slate-600" /><ResultRow label="정답 두더지 처단" value={`${correctCount}번 성공`} color="text-emerald-400" /><ResultRow label="오답/망치 헛스윙" value={`${incorrectCount}번 실패`} color="text-rose-400" /><ResultRow label="최대 콤보 기록" value={`${maxCombo} Combo`} color="text-indigo-300" /></div></div>
            <div className="w-full space-y-3 pt-6"><button onClick={startGame} className="w-full transform rounded-2xl bg-emerald-500 py-4 text-lg font-extrabold text-white shadow transition-all hover:bg-emerald-600 active:scale-95">다시 한판 더!</button><button onClick={() => setScreen("lobby")} className="w-full transform rounded-2xl bg-slate-700 py-3 font-bold text-slate-300 transition-all hover:bg-slate-600 active:scale-95">메인 화면으로</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

function CoordinateMoleBoardOriginal({ moles, difficulty, onHit, hammer, floaters, shake }) {
  const positions = [10, 30, 50, 70, 90];
  const values = [-2, -1, 0, 1, 2];
  const percentX = (x) => positions[x + 2];
  const percentY = (y) => positions[2 - y];
  const moleAt = (x, y) => moles.find((mole) => mole.x === x && mole.y === y);
  return (
    <div className={`grid-paper relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl border-4 border-slate-700 bg-blue-50/5 shadow-lg ${shake ? "shake-animation" : ""}`}>
      {positions.map((pos) => <div key={`v-${pos}`} className={`absolute top-0 bottom-0 z-10 ${pos === 50 ? "w-[4px] bg-slate-100" : "w-[1px] bg-indigo-500/20"}`} style={{ left: `${pos}%` }} />)}
      {positions.map((pos) => <div key={`h-${pos}`} className={`absolute left-0 right-0 z-10 ${pos === 50 ? "h-[4px] bg-slate-100" : "h-[1px] bg-indigo-500/20"}`} style={{ top: `${pos}%` }} />)}
      <div className="absolute right-1 top-[50%] z-10 h-0 w-0 -translate-y-[6px] border-y-[6px] border-l-[10px] border-y-transparent border-l-slate-100" />
      <div className="absolute right-2 top-[42%] z-20 text-[10px] font-black text-slate-100 arcade-font">x</div>
      <div className="absolute top-1 left-[50%] z-10 h-0 w-0 -translate-x-[6px] border-x-[6px] border-b-[10px] border-x-transparent border-b-slate-100" />
      <div className="absolute top-3 left-[53%] z-20 text-[10px] font-black text-slate-100 arcade-font">y</div>
      {positions.map((pos, index) => pos !== 50 && <div key={`tx-${pos}`} className="absolute top-[52%] z-20 -translate-x-1/2 rounded bg-slate-900/60 px-1 text-[9px] font-bold text-indigo-200" style={{ left: `${pos}%` }}>{values[index]}</div>)}
      {positions.map((pos, index) => pos !== 50 && <div key={`ty-${pos}`} className="absolute left-[44%] z-20 -translate-x-full -translate-y-1/2 rounded bg-slate-900/60 px-1 text-[9px] font-bold text-indigo-200" style={{ top: `${pos}%` }}>{values[4 - index]}</div>)}
      <div className="absolute top-[51%] left-[45%] z-20 text-[9px] font-bold text-slate-300">O</div>
      {values.flatMap((x) => values.map((y) => {
        const mole = moleAt(x, y);
        return (
          <button key={`${x}-${y}`} onClick={() => mole ? onHit(mole) : null} className="group absolute z-30 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center" style={{ left: `${percentX(x)}%`, top: `${percentY(y)}%` }}>
            <div className="absolute bottom-0.5 h-3 w-9 rounded-full border border-amber-900/40 bg-amber-950/70 shadow-inner transition-colors group-hover:bg-amber-950/90" />
            <div className="pointer-events-none absolute bottom-1 flex h-10 w-10 items-end justify-center overflow-hidden rounded-t-full">
              <div className={`mole-bounce flex h-8 w-8 origin-bottom items-end transition-all duration-300 ${mole ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}><MoleSvg /></div>
            </div>
            {difficulty === 1 && <div className="pointer-events-none absolute -bottom-3 scale-90 whitespace-nowrap rounded bg-slate-900/40 px-0.5 text-[8px] font-bold text-slate-400">({x},{y})</div>}
          </button>
        );
      }))}
      {hammer && <div className="pointer-events-none absolute z-50 h-16 w-16 -translate-x-1/2 -translate-y-1/2 hammer-hit" style={{ left: `${percentX(hammer.x)}%`, top: `${percentY(hammer.y)}%` }}><HammerSvg /></div>}
      {floaters.map((item) => <div key={item.id} className={`pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-[20px] text-lg font-extrabold drop-shadow-md float-up sm:text-xl ${item.positive ? "text-emerald-400 arcade-font" : "text-rose-400"}`} style={{ left: `${percentX(item.x)}%`, top: `${percentY(item.y)}%` }}>{item.text}</div>)}
    </div>
  );
}

function MoleSvg() {
  return <svg viewBox="0 0 100 100" className="h-full w-full"><ellipse cx="50" cy="65" rx="40" ry="35" fill="#8B5A2B" stroke="#4a2a14" strokeWidth="3"/><circle cx="28" cy="65" r="7" fill="#F87171" opacity="0.4"/><circle cx="72" cy="65" r="7" fill="#F87171" opacity="0.4"/><ellipse cx="50" cy="72" rx="20" ry="14" fill="#FFD1A9"/><ellipse cx="50" cy="67" rx="8" ry="5" fill="#FF8A8A"/><circle cx="48" cy="65" r="2" fill="#FFFFFF"/><path d="M 44,74 Q 50,77 56,74" stroke="#4a2a14" strokeWidth="2" fill="none"/><circle cx="32" cy="48" r="7" fill="#1E293B"/><circle cx="30" cy="45" r="2.5" fill="#FFFFFF"/><circle cx="68" cy="48" r="7" fill="#1E293B"/><circle cx="66" cy="45" r="2.5" fill="#FFFFFF"/><path d="M 22,35 Q 50,14 78,35" fill="#FBBF24" stroke="#D97706" strokeWidth="3"/><rect x="42" y="16" width="16" height="6" fill="#F59E0B"/><text x="50" y="31" fontSize="14" fontWeight="900" fill="#92400E" textAnchor="middle">+</text></svg>;
}

function HammerSvg() {
  return <svg viewBox="0 0 100 100" className="h-full w-full"><rect x="42" y="45" width="16" height="50" rx="4" fill="#8B5A2B" stroke="#4A2F15" strokeWidth="3"/><rect x="15" y="15" width="70" height="30" rx="8" fill="#EF4444" stroke="#B91C1C" strokeWidth="4"/><rect x="25" y="15" width="50" height="30" rx="2" fill="#F87171"/><ellipse cx="15" cy="30" rx="6" ry="15" fill="#EF4444" stroke="#B91C1C" strokeWidth="4"/><ellipse cx="85" cy="30" rx="6" ry="15" fill="#EF4444" stroke="#B91C1C" strokeWidth="4"/></svg>;
}

function ResultRow({ label, value, color }) {
  return <div className="flex items-center justify-between text-sm"><span className="text-slate-300">{label}</span><span className={`font-bold ${color}`}>{value}</span></div>;
}

function DirectProportionMatchingGame({ awardPoints }) {
  const initialSlots = [
    { id: 1, title: "x가 1 늘면 y는 2 준다", correctCardId: 1, graphConfig: { slope: -2, lineColor: "#ef4444", minX: -10, maxX: 10, minY: -10, maxY: 10, points: [{ x: 1, y: -2, color: "#ef4444" }] }, currentCardId: null },
    { id: 2, title: "점 (-1, 3)을 지난다", correctCardId: 2, graphConfig: { slope: -3, lineColor: "#3b82f6", minX: -4, maxX: 4, minY: -4, maxY: 4, points: [{ x: -1, y: 3, color: "#3b82f6" }] }, currentCardId: null },
    { id: 3, title: "정비례 그래프의 모양", correctCardId: 3, graphConfig: { slope: 1, lineColor: "#3b82f6", minX: -10, maxX: 10, minY: -10, maxY: 10 }, currentCardId: null },
    { id: 4, title: "점 (1, 2)를 지난다", correctCardId: 4, graphConfig: { slope: 2, lineColor: "#ef4444", minX: -4, maxX: 4, minY: -4, maxY: 4, points: [{ x: 1, y: 2, color: "#ef4444" }] }, currentCardId: null },
    { id: 5, title: "점 (1, -4)를 지난다", correctCardId: 5, graphConfig: { slope: -4, lineColor: "#ef4444", minX: -4, maxX: 4, minY: -4, maxY: 4, points: [{ x: 1, y: -4, color: "#ef4444" }] }, currentCardId: null },
    { id: 6, title: "점 (1, -1)을 지난다", correctCardId: 6, graphConfig: { slope: -1, lineColor: "#3b82f6", minX: -4, maxX: 4, minY: -4, maxY: 4, points: [{ x: 1, y: -1, color: "#3b82f6" }] }, currentCardId: null },
    { id: 7, title: "두 축이 만나는 점", correctCardId: 7, graphConfig: { minX: -5, maxX: 5, minY: -5, maxY: 5, points: [{ x: 0, y: 0, color: "#ef4444" }] }, currentCardId: null },
    { id: 8, title: "x가 2 늘면 y는 6 는다", correctCardId: 8, graphConfig: { slope: 3, lineColor: "#3b82f6", minX: -8, maxX: 8, minY: -8, maxY: 8, points: [{ x: 2, y: 6, color: "#3b82f6" }] }, currentCardId: null },
  ];
  const initialCards = [
    { id: 1, text: "비례상수 a = -2" },
    { id: 2, text: "y = -3x" },
    { id: 3, text: "원점을 지나는 직선" },
    { id: 4, text: "y = 2x" },
    { id: 5, text: "비례상수 a = -4" },
    { id: 6, text: "y = -x" },
    { id: 7, text: "원점 (0,0)" },
    { id: 8, text: "비례상수 a = 3" },
    { id: 9, text: "비례상수 a = 4" },
    { id: 10, text: "y = 1/2x" },
  ];
  const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
  const [slots, setSlots] = useState(initialSlots);
  const [cards, setCards] = useState(() => shuffle(initialCards));
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const filledCount = slots.filter((slot) => slot.currentCardId !== null).length;
  const unusedCards = cards.filter((card) => !slots.some((slot) => slot.currentCardId === card.id));

  const placeCard = (cardId, slotId) => {
    if (submitted) return;
    setSlots((prev) => prev.map((slot) => ({ ...slot, currentCardId: slot.id === slotId ? cardId : slot.currentCardId === cardId ? null : slot.currentCardId })));
    setSelectedCardId(null);
  };
  const removeCard = (slotId) => {
    if (submitted) return;
    setSlots((prev) => prev.map((slot) => slot.id === slotId ? { ...slot, currentCardId: null } : slot));
  };
  const resetGame = () => {
    setSlots(initialSlots);
    setCards(shuffle(initialCards));
    setSelectedCardId(null);
    setSubmitted(false);
    setResult(null);
  };
  const checkAnswers = () => {
    if (slots.some((slot) => slot.currentCardId === null)) {
      setResult({ type: "warning", score: null, title: "💡 미완성 알림", desc: "아직 다 채우지 않은 슬롯이 있습니다. 모든 칸에 카드를 매칭한 뒤 채점해 주세요." });
      return;
    }
    const correct = slots.reduce((sum, slot) => sum + (slot.currentCardId === slot.correctCardId ? 1 : 0), 0);
    setSubmitted(true);
    if (correct === 8) awardPoints(80);
    else if (correct >= 5) awardPoints(30);
    setResult({ type: correct === 8 ? "success" : "retry", score: correct, title: correct === 8 ? "🎉 대단합니다! 만점입니다!" : "아쉬워요! 다시 검토해보세요.", desc: correct === 8 ? "정비례의 성질과 그래프를 완벽히 매칭했어요. 탐험 포인트 80P 획득!" : `맞춘 개수: ${correct}개 / 틀린 개수: ${8 - correct}개. 정답은 초록색, 오답은 빨간색으로 표시됩니다.` });
  };
  const speakText = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const speechText = text.replace(/x/g, "엑스").replace(/y/g, "와이").replace(/-/g, "마이너스 ");
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = "ko-KR";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="math-grid relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.7rem] border border-[#EADCC9] bg-[#fcf9f5] text-gray-800">
      <style>{`
        .math-grid { background-color:#fcf9f5; background-image: linear-gradient(to right, rgba(139,126,116,.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(139,126,116,.08) 1px, transparent 1px); background-size:20px 20px; }
        @keyframes pulse-border { 0%, 100% { border-color:#8b5cf6; box-shadow:0 0 0 0 rgba(139,92,246,.4); } 50% { border-color:#a78bfa; box-shadow:0 0 0 6px rgba(139,92,246,.2); } }
        .drag-over { animation:pulse-border 1.5s infinite; background-color:rgba(245,243,255,.9)!important; }
      `}</style>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-[#8B7E74] px-5 py-3 text-[#FDFBF7] shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#FAF6F0] p-2 text-[#8B7E74]"><BarChart3 className="h-6 w-6" /></div>
          <div><h3 className="text-xl font-bold tracking-tight">정비례 그래프 매칭 게임</h3><p className="text-xs text-[#EADCC9]">성질과 그래프에 알맞은 수식 카드를 짝지어 보세요!</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGuide(true)} className="rounded-lg bg-[#A2958B] p-2 text-white transition hover:bg-[#B6A99F]">?</button>
          <button onClick={resetGame} className="rounded-lg bg-[#A2958B] px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-[#B6A99F]">처음부터</button>
          <button onClick={checkAnswers} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:bg-indigo-700">제출 및 채점</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        <div className="flex shrink-0 flex-col justify-between gap-3 rounded-xl border border-[#EADCC9] bg-[#FAF6F0] p-4 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-500" /></span><span><strong className="text-indigo-600">조작 방법:</strong> 카드를 클릭한 후 빈 칸을 클릭하거나, 카드를 드래그해서 놓으세요.</span></div>
          <div className="self-end rounded-lg border border-[#EADCC9] bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm md:self-auto">진행도: <span className="text-indigo-600">{filledCount} / 8</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {slots.map((slot) => {
            const card = cards.find((item) => item.id === slot.currentCardId);
            const isCorrect = submitted && slot.currentCardId === slot.correctCardId;
            const isWrong = submitted && slot.currentCardId !== null && slot.currentCardId !== slot.correctCardId;
            return (
              <div key={slot.id} className="flex flex-col items-center gap-2.5 rounded-2xl border border-[#EADCC9] bg-[#FAF6F0] p-3 shadow-sm transition-all">
                <div className="flex w-full items-center justify-between gap-1"><span className="text-xs font-bold leading-tight text-gray-700">{slot.title}</span><button onClick={() => speakText(slot.title)} className="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600">🔊</button></div>
                <DirectMatchGraph config={slot.graphConfig} />
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => placeCard(Number(event.dataTransfer.getData("text/plain")), slot.id)}
                  onClick={() => card ? removeCard(slot.id) : selectedCardId && placeCard(selectedCardId, slot.id)}
                  className={`flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border-2 transition-all ${card ? "border-solid border-indigo-200 bg-white shadow-sm" : "border-dashed border-gray-300 hover:border-indigo-400 hover:bg-white/50"} ${isCorrect ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-100" : ""} ${isWrong ? "border-rose-500 bg-rose-50/60 ring-2 ring-rose-100" : ""}`}
                >
                  {card ? <div className="relative flex h-full w-full items-center justify-center px-3 py-2 text-center text-sm font-semibold text-gray-800"><span>{card.text}</span>{!submitted ? <button onClick={(event) => { event.stopPropagation(); removeCard(slot.id); }} className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white shadow-md">×</button> : <span className={`absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white shadow-md ${isCorrect ? "bg-emerald-500" : "bg-rose-500"}`}>{isCorrect ? "✓" : "✗"}</span>}</div> : <div className="flex flex-col items-center justify-center py-4 text-center text-xs text-gray-400"><span className="text-lg">＋</span>카드를 여기에 배치</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto flex shrink-0 flex-col gap-4 rounded-2xl border border-[#EADCC9] bg-[#FAF6F0] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EADCC9] pb-3"><h3 className="text-md flex items-center gap-1.5 font-bold text-[#8B7E74]">정비례 수식 & 성질 카드 보관함</h3><span className="text-xs text-gray-500">알맞은 위치로 이동시키세요</span></div>
          <div className="flex flex-wrap justify-center gap-3 py-1">
            {unusedCards.length === 0 ? <div className="py-4 text-sm text-gray-400">모든 카드가 배치되었습니다. 제출 및 채점을 눌러주세요.</div> : unusedCards.map((card) => (
              <button
                key={card.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", String(card.id))}
                onClick={() => !submitted && setSelectedCardId(selectedCardId === card.id ? null : card.id)}
                className={`flex cursor-pointer select-none items-center justify-center rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition-all ${selectedCardId === card.id ? "scale-[1.03] border-indigo-400 shadow-lg ring-4 ring-indigo-500" : "border-gray-200 hover:border-indigo-300 hover:shadow-md"}`}
              >
                {card.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showGuide && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-2xl border border-[#EADCC9] bg-white p-6 shadow-2xl"><div className="mb-4 flex items-start justify-between"><h4 className="text-lg font-bold text-gray-900">💡 게임 도움말 및 안내</h4><button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600">×</button></div><div className="space-y-3 text-sm leading-relaxed text-gray-600"><p><strong>1. 매칭 방법:</strong> 하단 카드를 드래그해서 상단 빈 칸에 내려놓거나, 카드를 터치한 뒤 넣을 칸을 터치하세요.</p><p><strong>2. 읽어주기:</strong> 문제 설명 옆 스피커를 누르면 문장을 한국어 음성으로 읽어줍니다.</p><p><strong>3. 채점:</strong> 제출 및 채점을 누르면 정답은 초록색, 오답은 빨간색으로 표시됩니다.</p></div><button onClick={() => setShowGuide(false)} className="mt-6 w-full rounded-xl bg-[#8B7E74] py-2.5 font-medium text-white transition hover:bg-[#7a6e65]">확인했습니다</button></div></div>}
      {result && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-3xl border-4 border-indigo-100 bg-white p-8 text-center shadow-2xl"><div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-4xl">{result.type === "success" ? "🏆" : result.type === "warning" ? "💡" : "⚠️"}</div><h3 className={`mb-2 text-2xl font-bold ${result.type === "success" ? "text-emerald-600" : "text-[#8B7E74]"}`}>{result.title}</h3>{result.score !== null && <p className="mb-2 text-lg font-semibold text-indigo-600">점수: {result.score} / 8</p>}<p className="mb-6 text-sm text-gray-600">{result.desc}</p><div className="flex gap-3"><button onClick={() => setResult(null)} className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200">확인</button><button onClick={resetGame} className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700">다시 도전</button></div></div></div>}
    </div>
  );
}

function DirectMatchGraph({ config }) {
  const width = 120;
  const height = 120;
  const padding = 12;
  const minX = config.minX ?? -5;
  const maxX = config.maxX ?? 5;
  const minY = config.minY ?? -5;
  const maxY = config.maxY ?? 5;
  const scaleX = (width - 2 * padding) / (maxX - minX);
  const scaleY = (height - 2 * padding) / (maxY - minY);
  const toX = (x) => width / 2 + x * scaleX;
  const toY = (y) => height / 2 - y * scaleY;
  const line = config.slope !== undefined ? getClippedDirectSegment(config.slope, minX, maxX, minY, maxY) : null;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="rounded-lg border border-gray-100 bg-white shadow-inner">
      {Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i).map((y) => y !== 0 && <line key={`gy-${y}`} x1={padding} y1={toY(y)} x2={width - padding} y2={toY(y)} stroke="#f1f1f1" strokeWidth="1" />)}
      {Array.from({ length: maxX - minX + 1 }, (_, i) => minX + i).map((x) => x !== 0 && <line key={`gx-${x}`} x1={toX(x)} y1={padding} x2={toX(x)} y2={height - padding} stroke="#f1f1f1" strokeWidth="1" />)}
      <line x1={padding - 3} y1={height / 2} x2={width - padding + 3} y2={height / 2} stroke="#a3a3a3" strokeWidth="1.5" />
      <line x1={width / 2} y1={padding - 3} x2={width / 2} y2={height - padding + 3} stroke="#a3a3a3" strokeWidth="1.5" />
      <text x={toX(minX)} y={height / 2 + 10} fontSize="7" textAnchor="middle" fill="#9ca3af">{minX}</text>
      <text x={toX(maxX)} y={height / 2 + 10} fontSize="7" textAnchor="middle" fill="#9ca3af">{maxX}</text>
      <text x={width / 2 - 5} y={toY(minY) + 3} fontSize="7" textAnchor="end" fill="#9ca3af">{maxY}</text>
      <text x={width / 2 - 5} y={toY(maxY) + 3} fontSize="7" textAnchor="end" fill="#9ca3af">{minY}</text>
      {line && <line x1={toX(line[0].x)} y1={toY(line[0].y)} x2={toX(line[1].x)} y2={toY(line[1].y)} stroke={config.lineColor || "#3b82f6"} strokeWidth="2" strokeLinecap="round" />}
      {config.points?.map((point, index) => <g key={index}><circle cx={toX(point.x)} cy={toY(point.y)} r="3" fill={point.color || "#ef4444"} /><circle cx={toX(point.x)} cy={toY(point.y)} r="5" fill="none" stroke={point.color || "#ef4444"} strokeWidth="0.8" opacity="0.6" /></g>)}
    </svg>
  );
}

function InverseDetectiveGame({ awardPoints }) {
  const makeEquation = (n, negative = false) => `y = ${negative ? "-" : ""}${n}/x`;
  const deck = [
    { id: "eq-1", text: makeEquation(4, true), targetText: "점 (1, -4), 원점 대칭", matchId: 1 },
    { id: "eq-2", text: makeEquation(12), targetText: "점 (2, 6), 1·3사분면", matchId: 2 },
    { id: "eq-3", text: makeEquation(5), targetText: "점 (1, 5), 원점 대칭", matchId: 3 },
    { id: "eq-4", text: makeEquation(8), targetText: "점 (4, 2), xy = 8", matchId: 4 },
    { id: "eq-5", text: makeEquation(10, true), targetText: "점 (-5, 2), xy = -10", matchId: 5 },
    { id: "eq-6", text: makeEquation(6, true), targetText: "점 (2, -3), 2·4사분면", matchId: 6 },
    { id: "eq-7", text: makeEquation(9, true), targetText: "점 (-3, 3), 축에 닿지 않음", matchId: 7 },
    { id: "eq-8", text: makeEquation(3), targetText: "점 (3, 1), 축에 닿지 않음", matchId: 8 },
  ];
  const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
  const [targets, setTargets] = useState(() => deck.map((item) => ({ ...item, currentCardId: null, status: null })));
  const [cards, setCards] = useState(() => shuffle(deck));
  const [selectedId, setSelectedId] = useState(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const [message, setMessage] = useState("식 카드를 선택한 뒤 알맞은 단서 보드를 클릭하거나 드래그하세요.");
  const unusedCards = cards.filter((card) => !targets.some((target) => target.currentCardId === card.id));

  const resetGame = () => {
    setTargets(deck.map((item) => ({ ...item, currentCardId: null, status: null })));
    setCards(shuffle(deck));
    setSelectedId(null);
    setMatchedCount(0);
    setShowVictory(false);
    setMessage("새로운 사건이 시작되었습니다. 반비례 식 카드를 수사해 보세요.");
  };

  const placeCard = (cardId, matchId) => {
    const card = deck.find((item) => item.id === cardId);
    if (!card) return;
    if (card.matchId === matchId) {
      setTargets((prev) => prev.map((target) => {
        if (target.matchId === matchId) return { ...target, currentCardId: cardId, status: "correct" };
        if (target.currentCardId === cardId) return { ...target, currentCardId: null, status: null };
        return target;
      }));
      setSelectedId(null);
      setMatchedCount((prev) => {
        const next = Math.min(8, prev + 1);
        if (next === 8) {
          setShowVictory(true);
          awardPoints(80);
        } else {
          awardPoints(10);
        }
        return next;
      });
      setMessage("정답입니다! 반비례 관계식과 단서가 일치합니다.");
    } else {
      setTargets((prev) => prev.map((target) => target.matchId === matchId ? { ...target, status: "wrong" } : target));
      setSelectedId(null);
      setMessage("아직 맞지 않아요. 점의 좌표를 식에 대입하거나 xy 값을 확인해 보세요.");
      setTimeout(() => {
        setTargets((prev) => prev.map((target) => target.status === "wrong" ? { ...target, status: null } : target));
      }, 800);
    }
  };

  return (
    <div className="detective-grid relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.7rem] bg-[#c0b7a2] text-slate-800">
      <style>{`
        .detective-grid { background-image: linear-gradient(rgba(0,0,0,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.08) 1px, transparent 1px); background-size:40px 40px; }
        .math-font { font-family: Georgia, serif; }
        @keyframes detectiveShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        .detective-wrong { animation: detectiveShake .25s ease-in-out 2; }
      `}</style>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b-4 border-[#e2c184] bg-[#fcdfa7] px-5 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#5d5440] p-2 text-white">🔎</div>
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-[#3b3424]">반비례 수학 수사대</h3>
            <p className="text-xs font-bold text-[#6e6041]">올바른 반비례 관계식을 단서 카드 위로 드래그하여 수사를 완료하세요!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/60 px-3 py-1 text-sm font-bold text-[#3b3424]">진행도: <span className="text-indigo-600">{matchedCount} / 8</span></div>
          <button onClick={resetGame} className="rounded-lg bg-[#5d5440] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#433c2d]">다시 하기</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-5 overflow-auto px-4 py-5">
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#524936]"><span className="h-2.5 w-2.5 rounded-full bg-indigo-700" />단서 보드</h4>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4">
            {targets.map((target) => {
              const card = cards.find((item) => item.id === target.currentCardId);
              return (
                <div key={target.matchId} className={`relative flex h-[170px] flex-col items-center justify-between rounded-xl border-2 border-[#d9cdb0] bg-[#f5ebd3] p-3 shadow-sm ${target.status === "wrong" ? "detective-wrong border-rose-400 bg-rose-100/40" : ""}`}>
                  <div className="flex h-[40px] items-center justify-center text-center text-[11px] font-extrabold leading-tight text-[#524936] sm:text-xs">{target.targetText}</div>
                  <div
                    draggable={false}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => placeCard(event.dataTransfer.getData("text/plain"), target.matchId)}
                    onClick={() => selectedId && placeCard(selectedId, target.matchId)}
                    className={`mt-2 flex w-full flex-1 cursor-pointer items-center justify-center rounded-lg border-2 transition-all ${target.status === "correct" ? "border-emerald-300 bg-white shadow-inner" : "border-dashed border-black/15 bg-white/20 hover:scale-[1.03] hover:border-indigo-600 hover:bg-white/60"}`}
                  >
                    {card ? (
                      <div className="relative flex h-20 w-28 items-center justify-center rounded-xl border-2 border-emerald-500 bg-emerald-50/40 px-3 py-5 text-center shadow-md">
                        <span className="math-font text-xl font-bold text-slate-800">{card.text}</span>
                        <span className="absolute right-1 top-1 rounded-full bg-emerald-500 p-0.5 text-xs text-white">✓</span>
                      </div>
                    ) : (
                      <span className="select-none text-[10px] font-semibold text-[#8e8267]">여기에 드롭</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 border-t border-black/10 pt-5">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#524936]"><span className="h-2.5 w-2.5 rounded-full border border-black/20 bg-white" />용의 식 카드</h4>
            <span className={`text-xs font-bold text-[#5d5440] ${selectedId ? "animate-pulse" : "hidden"}`}>💡 식 카드가 선택되었습니다. 알맞은 보드를 클릭하세요!</span>
          </div>
          <div className="flex min-h-[120px] flex-wrap items-center justify-center gap-4 rounded-2xl bg-black/10 p-5">
            {unusedCards.map((card) => (
              <button
                key={card.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", card.id)}
                onClick={() => setSelectedId(selectedId === card.id ? null : card.id)}
                className={`flex h-20 w-28 cursor-grab select-none items-center justify-center rounded-xl border-2 bg-white px-3 py-5 shadow-md transition active:cursor-grabbing ${selectedId === card.id ? "scale-[1.04] border-indigo-600 ring-4 ring-indigo-100" : "border-slate-200 hover:-translate-y-1 hover:shadow-lg"}`}
              >
                <span className="math-font text-xl font-bold text-slate-800">{card.text}</span>
              </button>
            ))}
            {unusedCards.length === 0 && <div className="text-sm font-bold text-[#5d5440]">모든 식 카드가 배치되었습니다.</div>}
          </div>
          <div className="rounded-xl bg-white/50 px-4 py-2 text-sm font-bold text-[#524936]">{message}</div>
        </div>
      </div>

      {showVictory && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md space-y-6 rounded-3xl border-4 border-[#e2c184] bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-24 w-24 animate-bounce items-center justify-center rounded-full border-2 border-amber-300 bg-amber-100 text-5xl">🕵️‍♂️🔎</div>
            <div className="space-y-2"><span className="rounded-full bg-amber-100 px-3.5 py-1 text-xs font-black text-amber-800">수사 성공</span><h3 className="text-2xl font-extrabold text-slate-900">반비례 수학 수사 완료!</h3><p className="text-sm leading-relaxed text-slate-500">모든 수사관 카드에 일치하는 반비례 함수 관계식을 완벽히 찾아냈습니다. 탐험 포인트 80P 획득!</p></div>
            <button onClick={resetGame} className="w-full rounded-xl bg-[#5d5440] py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#433c2d]">새로운 사건 해결하기</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EverydayRatioJudgeGame() {
  const endScriptTag = "</" + "script>";
  const originalHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>일상 속 비례 탐험대 - 정비례 & 반비례 판별 게임</title>
  <script src="https://cdn.tailwindcss.com">__END_SCRIPT__
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <style>
    body{font-family:'Noto Sans KR',sans-serif}.wiggle{animation:wiggle .5s ease-in-out}@keyframes wiggle{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px) rotate(-1deg)}75%{transform:translateX(6px) rotate(1deg)}}.pop{animation:pop .3s ease-out}@keyframes pop{0%{transform:scale(.9);opacity:0}100%{transform:scale(1);opacity:1}}
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between selection:bg-indigo-200">
  <header class="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-30 shadow-sm">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <div class="flex items-center space-x-3 cursor-pointer" onclick="goHome()"><span class="text-2xl">📐</span><h1 class="text-xl font-bold tracking-tight text-indigo-600">일상 속 비례 탐험대</h1></div>
      <div class="flex items-center space-x-4"><button onclick="showHelpModal()" class="text-sm font-semibold text-slate-500 hover:text-slate-800 transition">개념 학습하기</button><span id="headerHighScore" class="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">최고 점수: 0점</span></div>
    </div>
  </header>
  <main class="flex-grow max-w-4xl w-full mx-auto px-4 py-8">
    <div id="startScreen" class="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-slate-100 max-w-2xl mx-auto pop">
      <div class="text-center mb-8"><span class="text-6xl inline-block mb-4 animate-bounce">🍕✏️🚗</span><h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">수학이 일상 속으로!</h2><p class="text-slate-500 mt-2 text-base">하루 동안 만나는 수많은 상황 속에 숨겨진 정비례와 반비례를 직접 실험하고 골라보세요!</p></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center"><span class="text-2xl">📈</span><h3 class="font-bold text-emerald-800 mt-1 text-sm">정비례</h3><p class="text-xs text-emerald-600 mt-1">x가 2배, 3배 늘면<br>y도 똑같이 2배, 3배!</p><span class="inline-block mt-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">y = ax</span></div>
        <div class="bg-sky-50/50 border border-sky-100 p-4 rounded-2xl text-center"><span class="text-2xl">📉</span><h3 class="font-bold text-sky-800 mt-1 text-sm">반비례</h3><p class="text-xs text-sky-600 mt-1">x가 2배, 3배 늘면<br>y는 오히려 1/2, 1/3배!</p><span class="inline-block mt-2 text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-mono font-semibold">y = a / x</span></div>
        <div class="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-center"><span class="text-2xl">⚠️</span><h3 class="font-bold text-amber-800 mt-1 text-sm">비례 아님</h3><p class="text-xs text-amber-600 mt-1">단순 덧셈/나눗셈 관계거나,<br>아무 비례 규칙이 없는 관계</p><span class="inline-block mt-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-semibold">그 외 관계</span></div>
      </div>
      <div class="space-y-4"><button onclick="startGame('challenge')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 flex justify-between items-center group"><div class="text-left"><span class="block text-lg">⏱️ 도전 모드 (타임어택)</span><span class="block text-xs text-indigo-200 font-normal mt-0.5">60초 동안 연속 콤보로 최고 점수를 기록해보세요!</span></div><span class="text-2xl group-hover:translate-x-1 transition-transform">⚡</span></button><button onclick="startGame('practice')" class="w-full bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 font-bold py-4 px-6 rounded-2xl transition-all flex justify-between items-center group"><div class="text-left"><span class="block text-lg">📖 학습 연습 모드</span><span class="block text-xs text-slate-500 font-normal mt-0.5">시간 제한 없이 10개의 대표 일상 상황을 이해하며 풀기!</span></div><span class="text-2xl text-indigo-500 group-hover:translate-x-1 transition-transform">🎓</span></button></div>
    </div>
    <div id="gamePlayScreen" class="hidden space-y-6 pop">
      <div class="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-wrap gap-4 justify-between items-center"><div class="flex items-center space-x-3"><span id="gameModeBadge" class="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">도전 모드</span><span id="progressIndicator" class="text-sm text-slate-600 font-semibold">문제 1/10</span><button onclick="showQuitModal()" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ml-2"><span>그만하기 🏠</span></button></div><div class="flex items-center space-x-4"><div id="timerContainer" class="flex items-center space-x-2 text-rose-600 font-bold"><span class="text-xl">⏱️</span><span id="timeLeft" class="text-2xl font-mono">60s</span></div><div id="scoreContainer" class="flex items-center space-x-2 text-indigo-600 font-bold"><span class="text-xl">⭐</span><span id="currentScore" class="text-2xl font-mono">0</span></div><div id="comboBadgeContainer" class="hidden"><span id="comboBadge" class="bg-amber-400 text-amber-950 font-black px-3 py-1 rounded-full text-xs animate-bounce">2 COMBO!</span></div></div></div>
      <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div id="progressBar" class="bg-indigo-600 h-full w-0 transition-all duration-300"></div></div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6"><div class="lg:col-span-5 bg-white rounded-3xl p-6 shadow-lg border border-slate-100 flex flex-col justify-between"><div><div class="flex items-center space-x-3 mb-4"><span id="scenarioIcon" class="text-4xl p-3 bg-slate-100 rounded-2xl">✏️</span><div><span class="text-xs text-indigo-500 font-bold uppercase tracking-wider">일상 시나리오</span><h3 id="scenarioTitle" class="text-lg font-bold text-slate-900 leading-tight">연필 수량과 총 금액의 관계</h3></div></div><p id="scenarioDesc" class="text-slate-600 text-sm leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200"></p><div class="space-y-2 mb-6"><div class="flex justify-between items-center text-sm border-b border-slate-100 py-2"><span class="text-slate-500">원인 변수 (<span class="font-semibold text-slate-800">x</span>)</span><span id="xLabel" class="font-bold text-slate-800"></span></div><div class="flex justify-between items-center text-sm border-b border-slate-100 py-2"><span class="text-slate-500">결과 변수 (<span class="font-semibold text-slate-800">y</span>)</span><span id="yLabel" class="font-bold text-slate-800"></span></div></div></div><div class="space-y-3"><p class="text-xs font-bold text-slate-400 text-center uppercase tracking-widest mb-1">두 변수의 알맞은 관계를 고르세요!</p><div class="grid grid-cols-1 gap-2.5"><button onclick="submitAnswer('direct')" class="group bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-between"><span class="flex items-center"><span class="text-xl mr-2">📈</span> 정비례 관계</span><span class="text-xs bg-emerald-600 text-emerald-100 px-2 py-1 rounded-lg">y = ax</span></button><button onclick="submitAnswer('inverse')" class="group bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-between"><span class="flex items-center"><span class="text-xl mr-2">📉</span> 반비례 관계</span><span class="text-xs bg-sky-600 text-sky-100 px-2 py-1 rounded-lg">y = a / x</span></button><button onclick="submitAnswer('neither')" class="group bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-between"><span class="flex items-center"><span class="text-xl mr-2">⚖️</span> 둘 다 아님 (그 외)</span><span class="text-xs bg-amber-600 text-amber-100 px-2 py-1 rounded-lg">관계없음 등</span></button></div></div></div><div class="lg:col-span-7 bg-white rounded-3xl p-6 shadow-lg border border-slate-100 flex flex-col justify-between"><div><div class="flex justify-between items-center mb-4"><h4 class="font-bold text-slate-800 text-md flex items-center"><span class="mr-2">🔬</span> 실시간 비례 시뮬레이터</h4><span class="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded font-semibold animate-pulse">슬라이더를 움직여보세요!</span></div><div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6"><div class="flex justify-between items-center mb-2"><span class="text-xs text-slate-500 font-bold">원인 값 (x) 조절</span><span class="text-sm font-bold text-indigo-600"><span id="sliderValDisplay">1</span> <span id="xValUnit">자루</span></span></div><input type="range" id="simSlider" min="1" max="10" value="1" step="1" oninput="updateSimulation()" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"><div class="flex justify-between text-[10px] text-slate-400 mt-1"><span>최소 (1)</span><span>중간 (5)</span><span>최대 (10)</span></div></div><div class="border border-slate-100 rounded-2xl h-48 bg-slate-900 relative overflow-hidden flex items-center justify-center p-4 shadow-inner"><div id="visualPlaceholder" class="w-full h-full flex items-center justify-center"></div></div></div><div class="mt-6"><h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">비례 추이 데이터 표</h5><div class="overflow-x-auto rounded-xl border border-slate-100"><table class="w-full text-center text-xs"><thead><tr class="bg-slate-50 text-slate-500 font-bold"><th class="py-2 px-3 border-r border-slate-100">x (<span id="tableXUnit">자루</span>)</th><td class="py-2 border-r border-slate-100">1</td><td class="py-2 border-r border-slate-100">2</td><td class="py-2 border-r border-slate-100">3</td><td class="py-2">4</td></tr></thead><tbody><tr class="font-semibold text-slate-700"><th class="py-2 px-3 border-r border-slate-100 bg-slate-50/50">y (<span id="tableYUnit">원</span>)</th><td id="tableY1" class="py-2 border-r border-slate-100 text-indigo-600 font-bold">-</td><td id="tableY2" class="py-2 border-r border-slate-100 text-indigo-600 font-bold">-</td><td id="tableY3" class="py-2 border-r border-slate-100 text-indigo-600 font-bold">-</td><td id="tableY4" class="py-2 text-indigo-600 font-bold">-</td></tr></tbody></table></div></div></div></div>
    </div>
    <div id="feedbackContainer" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div id="feedbackCard" class="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 pop text-center"><div class="mb-4"><span id="feedbackResultIcon" class="text-6xl inline-block mb-2">🎉</span><h3 id="feedbackResultTitle" class="text-2xl font-black text-slate-900">정답입니다!</h3></div><div id="wrongAnswerGuide" class="hidden bg-rose-50 text-rose-800 p-3 rounded-xl text-sm font-semibold mb-4">올바른 관계: <span id="correctAnswerText" class="underline font-bold text-rose-900">정비례</span></div><div class="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl text-left mb-6"><h4 class="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">수학적 공식 해석</h4><div id="feedbackFormula" class="text-xl font-mono font-bold text-indigo-900 mb-2">y = 500 × x</div><p id="feedbackExplanation" class="text-slate-600 text-sm leading-relaxed"></p></div><button onclick="nextQuestion()" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl shadow transition">다음 단계로 넘어가기 👉</button></div></div>
    <div id="endScreen" class="hidden bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-slate-100 max-w-2xl mx-auto pop"><div class="text-center mb-8"><span class="text-6xl inline-block mb-4">🏆</span><h2 class="text-3xl font-black text-slate-900 tracking-tight">탐험이 완료되었습니다!</h2><p class="text-slate-500 mt-2">오늘 발견한 당신의 비례 탐험 성적표입니다.</p></div><div class="grid grid-cols-2 gap-4 mb-8"><div class="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl text-center"><span class="block text-xs font-bold text-indigo-600 uppercase">최종 획득 점수</span><span id="endScore" class="block text-3xl font-black text-indigo-950 mt-1">0점</span></div><div class="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl text-center"><span class="block text-xs font-bold text-slate-500 uppercase">정답률</span><span id="endAccuracy" class="block text-3xl font-black text-slate-800 mt-1">0/0</span></div></div><div id="wrongQuestionsSection" class="mb-8"><h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">놓친 비례 관계 복습하기</h3><div id="wrongQuestionsList" class="space-y-3 max-h-60 overflow-y-auto pr-2"></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><button onclick="goHome()" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-2xl transition">홈으로 가기</button><button onclick="restartGame()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow transition">다시 도전하기 🔄</button></div></div>
  </main><footer class="bg-white border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-400"><div class="max-w-4xl mx-auto"></div></footer>
  <div id="helpModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div class="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 pop max-h-[85vh] overflow-y-auto"><div class="flex justify-between items-start mb-6"><h3 class="text-2xl font-bold text-slate-900">📐 정비례 & 반비례 핵심 개념서</h3><button onclick="hideHelpModal()" class="text-2xl text-slate-400 hover:text-slate-600 transition">×</button></div><div class="space-y-6 text-left"><div class="border-l-4 border-emerald-500 pl-4"><h4 class="font-extrabold text-emerald-800 text-base">📈 정비례 관계란 무엇인가요?</h4><p class="text-sm text-slate-600 mt-1 leading-relaxed">두 변수 x와 y에 대하여, x의 값이 <strong>2배, 3배, 4배...</strong>로 변함에 따라 y의 값도 똑같이 <strong>2배, 3배, 4배...</strong>로 변하는 관계입니다.</p><div class="mt-2 bg-emerald-50 p-2.5 rounded-lg text-xs font-mono text-emerald-900"><strong>기본 공식:</strong> y = ax (단, a는 0이 아닌 상수) <br><strong>핵심 특징:</strong> y / x = a</div></div><div class="border-l-4 border-sky-500 pl-4"><h4 class="font-extrabold text-sky-800 text-base">📉 반비례 관계란 무엇인가요?</h4><p class="text-sm text-slate-600 mt-1 leading-relaxed">두 변수 x와 y에 대하여, x의 값이 <strong>2배, 3배, 4배...</strong>로 변함에 따라 y의 값은 <strong>1/2배, 1/3배, 1/4배...</strong>로 변하는 관계입니다.</p><div class="mt-2 bg-sky-50 p-2.5 rounded-lg text-xs font-mono text-sky-900"><strong>기본 공식:</strong> y = a / x 또는 x × y = a</div></div><div class="border-l-4 border-amber-500 pl-4"><h4 class="font-extrabold text-amber-800 text-base">⚖️ 비례 관계가 아닌 경우는요?</h4><p class="text-sm text-slate-600 mt-1 leading-relaxed">덧셈 관계나 불규칙적인 관계처럼 일정한 곱셈 비율을 따르지 않는 경우입니다.</p><div class="mt-2 bg-amber-50 p-2.5 rounded-lg text-xs font-mono text-amber-900"><strong>예시:</strong> y = x + 3</div></div></div><button onclick="hideHelpModal()" class="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow transition">개념 이해 완료! 게임으로 돌아가기</button></div></div>
  <div id="quitConfirmModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 pop text-center"><div class="mb-4"><span class="text-5xl inline-block mb-2">🛑</span><h3 class="text-xl font-bold text-slate-900">게임을 중단할까요?</h3><p class="text-slate-500 text-sm mt-2">지금 중단하면 현재까지 진행된 기록과 점수가 모두 사라집니다.</p></div><div class="grid grid-cols-2 gap-3 mt-6"><button onclick="hideQuitModal()" class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl transition">계속하기</button><button onclick="confirmQuit()" class="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow transition">그만두기</button></div></div></div>
  <script>
    const scenarios=[
      {id:1,title:'연필 수량과 총 금액',desc:'한 자루에 500원 하는 연필을 x자루 살 때의 총 가격을 y원이라고 합니다.',xName:'연필의 수',yName:'총 가격',xUnit:'자루',yUnit:'원',type:'direct',formula:'y = 500x',explanation:'연필의 개수가 2배, 3배가 됨에 따라 총 금액도 똑같이 2배, 3배가 되므로 정비례합니다.',icon:'✏️',calculateY:x=>500*x,visualType:'pencil_box'},
      {id:2,title:'피자 나누어 먹기',desc:'24조각짜리 피자 한 판을 x명의 사람들이 똑같이 나누어 먹을 때, 한 사람이 먹는 양을 y조각이라고 합니다.',xName:'사람의 수',yName:'한 사람당 피자 양',xUnit:'명',yUnit:'조각',type:'inverse',formula:'y = 24 / x',explanation:'인원이 2배, 3배 늘어나면 각자의 몫은 1/2, 1/3로 줄어듭니다. x*y가 24로 일정하므로 반비례합니다.',icon:'🍕',calculateY:x=>Math.round((24/x)*10)/10,visualType:'pizza_share'},
      {id:3,title:'자동차 주행 거리',desc:'시속 80km로 달리는 차량이 x시간 동안 주행한 거리 ykm입니다.',xName:'주행 시간',yName:'이동 거리',xUnit:'시간',yUnit:'km',type:'direct',formula:'y = 80x',explanation:'시간이 2배, 3배가 되면 이동 거리도 2배, 3배가 되므로 정비례합니다.',icon:'🚗',calculateY:x=>80*x,visualType:'car_speed'},
      {id:4,title:'일정한 직사각형의 가로와 세로',desc:'넓이가 36㎠로 일정한 직사각형의 가로 길이를 x㎝, 세로 길이를 y㎝라고 합니다.',xName:'가로 길이',yName:'세로 길이',xUnit:'cm',yUnit:'cm',type:'inverse',formula:'y = 36 / x',explanation:'넓이가 고정되어 있으므로 x*y=36입니다. 가로가 2배가 되면 세로는 1/2이 되어 반비례입니다.',icon:'📐',calculateY:x=>Math.round((36/x)*10)/10,visualType:'rect_area'},
      {id:5,title:'동생과 나의 나이 변화',desc:'현재 동생은 10살입니다. x년 뒤 동생의 나이를 y세라고 합시다.',xName:'흘러간 시간',yName:'동생의 미래 나이',xUnit:'년',yUnit:'세',type:'neither',formula:'y = x + 10',explanation:'시간이 2배 흘러도 나이가 2배가 되지 않습니다. 덧셈 관계이므로 정비례도 반비례도 아닙니다.',icon:'🎂',calculateY:x=>x+10,visualType:'age_add'},
      {id:6,title:'스마트폰 충전과 소요 시간',desc:'1분 동안 2%씩 배터리가 차는 충전기에서 x분 동안 충전한 증가량을 y%라고 합니다.',xName:'충전 시간',yName:'충전량 상승치',xUnit:'분',yUnit:'%',type:'direct',formula:'y = 2x',explanation:'시간이 2배, 3배 증가하면 충전량도 2배, 3배 증가하므로 정비례입니다.',icon:'⚡',calculateY:x=>2*x,visualType:'battery_charge'},
      {id:7,title:'책 정독하기',desc:'120쪽짜리 책을 매일 x쪽씩 읽을 때, 완독하는 데 걸리는 날수를 y일이라고 합니다.',xName:'하루 독서량',yName:'걸린 기간',xUnit:'쪽',yUnit:'일',type:'inverse',formula:'y = 120 / x',explanation:'매일 읽는 양을 늘릴수록 걸리는 날수는 줄어들고, x*y=120으로 일정하므로 반비례입니다.',icon:'📚',calculateY:x=>Math.round((120/x)*10)/10,visualType:'read_book'},
      {id:8,title:'기온과 아이스크림 판매량',desc:'여름날 야외 기온 x℃와 그날 아이스크림 판매량 y개입니다.',xName:'야외 온도',yName:'아이스크림 매출',xUnit:'도',yUnit:'개',type:'neither',formula:'예측 불가',explanation:'온도가 높아지면 판매량이 늘 수 있지만, 정확히 2배·3배 관계가 아니므로 수학적 비례 관계가 아닙니다.',icon:'🍦',calculateY:x=>Math.round(50+x*12.5+Math.sin(x)*10),visualType:'ice_cream'},
      {id:9,title:'소금물 희석 농도',desc:'소금 50g이 녹아 있는 전체 소금물 xg에서 농도를 y%라고 합니다.',xName:'소금물의 양',yName:'농도',xUnit:'g',yUnit:'%',type:'inverse',formula:'y = 5000 / x',explanation:'소금의 양이 일정하므로 물을 더 넣어 전체 양이 늘어나면 농도는 줄어듭니다. 반비례입니다.',icon:'🧪',calculateY:x=>Math.round((5000/(x*30))*10)/10,visualType:'salt_water'},
      {id:10,title:'정사각형의 한 변과 둘레',desc:'한 변의 길이가 x㎝인 정사각형의 둘레 길이를 y㎝라고 합니다.',xName:'한 변의 길이',yName:'둘레',xUnit:'cm',yUnit:'cm',type:'direct',formula:'y = 4x',explanation:'한 변이 2배, 3배가 되면 둘레도 2배, 3배가 되므로 정비례입니다.',icon:'⬜',calculateY:x=>4*x,visualType:'square_perimeter'}
    ];
    let gameMode='challenge',currentQuestionIndex=0,score=0,combo=0,timer=null,timeLeft=60,shuffledQuestions=[],gameResults=[],highScore=localStorage.getItem('pro_explorer_highscore')||0;
    window.onload=()=>{document.getElementById('headerHighScore').innerText='최고 점수: '+highScore+'점'};
    function playSynthSound(type){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);if(type==='correct'){o.type='triangle';o.frequency.setValueAtTime(523.25,c.currentTime);o.frequency.setValueAtTime(659.25,c.currentTime+.08);o.frequency.setValueAtTime(783.99,c.currentTime+.16);o.frequency.setValueAtTime(1046.5,c.currentTime+.24);g.gain.setValueAtTime(.15,c.currentTime);g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.45);o.start();o.stop(c.currentTime+.45)}else if(type==='wrong'){o.type='sawtooth';o.frequency.setValueAtTime(220,c.currentTime);o.frequency.setValueAtTime(146.83,c.currentTime+.12);g.gain.setValueAtTime(.2,c.currentTime);g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.35);o.start();o.stop(c.currentTime+.35)}else{o.type='sine';o.frequency.setValueAtTime(800,c.currentTime);g.gain.setValueAtTime(.08,c.currentTime);g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.06);o.start();o.stop(c.currentTime+.06)}}catch(e){}}
    function goHome(){playSynthSound('click');clearInterval(timer);['startScreen'].forEach(id=>document.getElementById(id).classList.remove('hidden'));['gamePlayScreen','endScreen','feedbackContainer','quitConfirmModal'].forEach(id=>document.getElementById(id).classList.add('hidden'))}
    function startGame(mode){playSynthSound('click');gameMode=mode;score=0;combo=0;currentQuestionIndex=0;gameResults=[];document.getElementById('currentScore').innerText=score;document.getElementById('comboBadgeContainer').classList.add('hidden');shuffledQuestions=[...scenarios].sort(()=>Math.random()-.5);if(mode==='challenge'){timeLeft=60;document.getElementById('timeLeft').innerText=timeLeft+'s';document.getElementById('timerContainer').classList.remove('hidden');document.getElementById('gameModeBadge').innerText='⏱️ 도전 모드';document.getElementById('gameModeBadge').className='px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse';clearInterval(timer);timer=setInterval(()=>{timeLeft--;document.getElementById('timeLeft').innerText=timeLeft+'s';if(timeLeft<=0){clearInterval(timer);endGame()}},1000)}else{document.getElementById('timerContainer').classList.add('hidden');document.getElementById('gameModeBadge').innerText='📖 연습 모드';document.getElementById('gameModeBadge').className='px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800'}document.getElementById('startScreen').classList.add('hidden');document.getElementById('gamePlayScreen').classList.remove('hidden');loadQuestion()}
    function loadQuestion(){const q=shuffledQuestions[currentQuestionIndex];document.getElementById('progressIndicator').innerText='문제 '+(currentQuestionIndex+1)+'/'+shuffledQuestions.length;document.getElementById('progressBar').style.width=(currentQuestionIndex/shuffledQuestions.length*100)+'%';document.getElementById('scenarioIcon').innerText=q.icon;document.getElementById('scenarioTitle').innerText=q.title;document.getElementById('scenarioDesc').innerHTML=q.desc.replace(/x/g,'<strong class="text-indigo-600">x</strong>').replace(/y/g,'<strong class="text-emerald-600">y</strong>');document.getElementById('xLabel').innerText=q.xName+' ('+q.xUnit+')';document.getElementById('yLabel').innerText=q.yName+' ('+q.yUnit+')';document.getElementById('tableXUnit').innerText=q.xUnit;document.getElementById('tableYUnit').innerText=q.yUnit;[1,2,3,4].forEach(n=>document.getElementById('tableY'+n).innerText=q.calculateY(n).toLocaleString());document.getElementById('simSlider').value=1;document.getElementById('xValUnit').innerText=q.xUnit;updateSimulation()}
    function updateSimulation(){const q=shuffledQuestions[currentQuestionIndex];if(!q)return;const xVal=parseInt(document.getElementById('simSlider').value);document.getElementById('sliderValDisplay').innerText=xVal;const yVal=q.calculateY(xVal),c=document.getElementById('visualPlaceholder');c.innerHTML='';if(['pencil_box','car_speed','read_book','battery_charge','age_add'].includes(q.visualType)){const d=document.createElement('div');d.className='text-center text-slate-100 font-bold text-lg';d.innerHTML='<div class="text-6xl mb-3">'+q.icon+'</div><div>x = '+xVal+' '+q.xUnit+'</div><div class="text-indigo-300">y = '+yVal+' '+q.yUnit+'</div>';c.appendChild(d)}else{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 200 200');svg.setAttribute('width','100%');svg.setAttribute('height','100%');const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx','100');circle.setAttribute('cy','100');circle.setAttribute('r',String(30+xVal*5));circle.setAttribute('fill',q.type==='direct'?'#10b981':q.type==='inverse'?'#38bdf8':'#f59e0b');circle.setAttribute('opacity','.8');svg.appendChild(circle);const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('x','100');text.setAttribute('y','105');text.setAttribute('text-anchor','middle');text.setAttribute('fill','#fff');text.setAttribute('font-weight','bold');text.textContent='y='+yVal;svg.appendChild(text);c.appendChild(svg)}}
    function submitAnswer(chosenType){const q=shuffledQuestions[currentQuestionIndex],ok=q.type===chosenType;gameResults.push({question:q,chosen:chosenType,correct:ok});if(ok){combo++;let points=100;if(combo>=2){points+=(combo-1)*30;document.getElementById('comboBadge').innerText=combo+' COMBO!';document.getElementById('comboBadgeContainer').classList.remove('hidden')}score+=points;document.getElementById('currentScore').innerText=score;playSynthSound('correct');document.getElementById('feedbackResultIcon').innerText='🎉';document.getElementById('feedbackResultTitle').innerText=combo>=3?combo+'연속 정답! 대단해요!':'정답입니다!';document.getElementById('feedbackResultTitle').className='text-2xl font-black text-emerald-600';document.getElementById('wrongAnswerGuide').classList.add('hidden')}else{combo=0;document.getElementById('comboBadgeContainer').classList.add('hidden');playSynthSound('wrong');document.getElementById('feedbackResultIcon').innerText='❌';document.getElementById('feedbackResultTitle').innerText='틀렸습니다. 아쉬워요!';document.getElementById('feedbackResultTitle').className='text-2xl font-black text-rose-600';document.getElementById('wrongAnswerGuide').classList.remove('hidden');document.getElementById('correctAnswerText').innerText={direct:'📈 정비례 관계',inverse:'📉 반비례 관계',neither:'⚖️ 둘 다 아님'}[q.type]}document.getElementById('feedbackFormula').innerText=q.formula;document.getElementById('feedbackExplanation').innerHTML=q.explanation;document.getElementById('feedbackContainer').classList.remove('hidden')}
    function nextQuestion(){playSynthSound('click');document.getElementById('feedbackContainer').classList.add('hidden');currentQuestionIndex++;if(currentQuestionIndex>=shuffledQuestions.length){clearInterval(timer);endGame()}else loadQuestion()}
    function endGame(){document.getElementById('gamePlayScreen').classList.add('hidden');document.getElementById('endScreen').classList.remove('hidden');document.getElementById('endScore').innerText=score.toLocaleString()+'점';const correct=gameResults.filter(r=>r.correct).length,total=gameResults.length,acc=total?Math.round(correct/total*100):0;document.getElementById('endAccuracy').innerText=correct+' / '+total+' ('+acc+'%)';if(score>highScore){highScore=score;localStorage.setItem('pro_explorer_highscore',highScore);document.getElementById('headerHighScore').innerText='최고 점수: '+highScore+'점'}const list=document.getElementById('wrongQuestionsList');list.innerHTML='';const wrong=gameResults.filter(r=>!r.correct);if(!wrong.length)list.innerHTML='<div class="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-center font-bold">🌟 축하합니다! 모든 문제를 100% 마스터하셨습니다!</div>';else wrong.forEach(item=>{const card=document.createElement('div');card.className='bg-slate-50 border border-slate-200 p-3 rounded-xl text-left text-xs space-y-1.5';const m={direct:'정비례',inverse:'반비례',neither:'둘 다 아님'};card.innerHTML='<div class="flex items-center justify-between"><span class="font-bold text-slate-800 text-sm">'+item.question.icon+' '+item.question.title+'</span><span class="bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded">틀림</span></div><p class="text-slate-500">'+item.question.desc+'</p><div class="flex space-x-4 pt-1 font-semibold"><span class="text-rose-600">내가 고른 유형: '+(m[item.chosen]||'없음')+'</span><span class="text-emerald-600">진짜 정답 유형: '+m[item.question.type]+'</span></div><p class="text-[11px] text-slate-600 bg-white p-2 rounded border border-dashed border-slate-100 mt-1">💡 <strong>복습해설:</strong> '+item.question.explanation+'</p>';list.appendChild(card)})}
    function restartGame(){startGame(gameMode)}function showHelpModal(){playSynthSound('click');document.getElementById('helpModal').classList.remove('hidden')}function hideHelpModal(){playSynthSound('click');document.getElementById('helpModal').classList.add('hidden')}function showQuitModal(){playSynthSound('click');if(gameMode==='challenge'&&timer)clearInterval(timer);document.getElementById('quitConfirmModal').classList.remove('hidden')}function hideQuitModal(){playSynthSound('click');document.getElementById('quitConfirmModal').classList.add('hidden');if(gameMode==='challenge'){clearInterval(timer);timer=setInterval(()=>{timeLeft--;document.getElementById('timeLeft').innerText=timeLeft+'s';if(timeLeft<=0){clearInterval(timer);endGame()}},1000)}}function confirmQuit(){playSynthSound('click');document.getElementById('quitConfirmModal').classList.add('hidden');goHome()}
  __END_SCRIPT__
</body>
</html>`.replaceAll("__END_SCRIPT__", endScriptTag);

  return (
    <div className="h-full overflow-hidden rounded-[1.5rem] bg-white">
      <iframe
        title="일상 속 비례 탐험대 원본 HTML"
        srcDoc={originalHtml}
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-modals"
      />
    </div>
  );
}

function SpeedConceptQuiz({ awardPoints }) {
  const quizBank = [
    { q: "점 (-3, 2)는 어느 사분면에 있나요?", choices: ["제1사분면", "제2사분면", "제3사분면", "제4사분면"], answer: "제2사분면", explain: "x<0, y>0이면 제2사분면입니다." },
    { q: "정비례 y=4x에서 y÷x의 값은?", choices: ["2", "4", "8", "x"], answer: "4", explain: "정비례 y=ax에서는 y÷x=a입니다." },
    { q: "반비례 y=12/x에서 xy의 값은?", choices: ["3", "4", "12", "24"], answer: "12", explain: "반비례 y=a/x에서는 xy=a입니다." },
    { q: "정비례 그래프가 반드시 지나는 점은?", choices: ["(0, 0)", "(1, 0)", "(0, 1)", "(-1, 1)"], answer: "(0, 0)", explain: "정비례 그래프는 항상 원점을 지납니다." },
    { q: "반비례 그래프에 대한 설명으로 알맞은 것은?", choices: ["항상 원점을 지난다", "직선이다", "좌표축에 가까워지지만 닿지 않는다", "x=0에서 값이 정해진다"], answer: "좌표축에 가까워지지만 닿지 않는다", explain: "반비례 그래프는 좌표축에 가까워지지만 만나지 않습니다." },
  ];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("문제를 맞히면 탐험 포인트를 얻습니다.");
  const question = quizBank[current];

  const choose = (choice) => {
    setSelected(choice);
    if (choice === question.answer) {
      awardPoints(10);
      setMessage("정답입니다! 탐험 포인트 10P를 얻었어요.");
    } else {
      setMessage(`아쉬워요. ${question.explain}`);
    }
  };

  const nextQuestion = () => {
    setCurrent((prev) => (prev + 1) % quizBank.length);
    setSelected(null);
    setMessage("다음 문제에 도전하세요.");
  };

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[1fr_360px]">
      <div className="rounded-[1.7rem] border border-blue-100 bg-blue-50/50 p-5">
        <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
          <div className="mb-3 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">스피드 개념 퀴즈 {current + 1}/{quizBank.length}</div>
          <h3 className="text-2xl font-black leading-snug text-blue-950">{question.q}</h3>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {question.choices.map((choice) => (
              <button key={choice} onClick={() => choose(choice)} disabled={!!selected} className={`rounded-2xl border px-5 py-4 text-left font-black transition ${selected === choice ? choice === question.answer ? "border-green-500 bg-green-600 text-white" : "border-rose-500 bg-rose-600 text-white" : "border-blue-100 bg-white hover:border-blue-300 hover:bg-blue-50"}`}>{choice}</button>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">{message}</div>
          <button onClick={nextQuestion} className="mt-5 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg shadow-blue-200">다음 문제</button>
        </div>
      </div>
      <div className="space-y-3 overflow-hidden rounded-[1.7rem] border border-blue-100 bg-white p-5">
        <h3 className="text-xl font-black text-blue-950">포인트 규칙</h3>
        <div className="space-y-2 text-sm font-bold text-slate-700">
          <div className="rounded-2xl bg-green-50 px-4 py-3">정답 1개: +10P</div>
          <div className="rounded-2xl bg-blue-50 px-4 py-3">좌표 두더지 게임에서도 포인트를 얻을 수 있습니다.</div>
          <div className="rounded-2xl bg-purple-50 px-4 py-3">누적 포인트는 홈 화면과 상단에 표시됩니다.</div>
        </div>
      </div>
    </div>
  );
}

function AssessmentScreen({ answers, setAnswers, completeMission, isMissionComplete }) {
  const [unit, setUnit] = useState("coordinate");
  const [current, setCurrent] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const set = assessmentSets[unit];
  const question = set.questions[current];
  const selected = answers[unit]?.[current];
  const score = set.questions.reduce((sum, q, index) => sum + (answers[unit]?.[index] === q.answer ? 1 : 0), 0);
  const chooseUnit = (key) => { setUnit(key); setCurrent(0); setShowResult(false); };
  const chooseAnswer = (choice) => setAnswers((prev) => ({ ...prev, [unit]: { ...(prev[unit] || {}), [current]: choice } }));
  const next = () => { if (current < 9) setCurrent((prev) => prev + 1); else setShowResult(true); };
  const prev = () => setCurrent((prev) => Math.max(0, prev - 1));

  return <Card className="h-full overflow-hidden p-5"><div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div><h2 className="text-2xl font-black text-blue-950">형성평가</h2><p className="mt-1 text-sm text-slate-500">개념별 10문항씩 제공됩니다.</p><div className="mt-2"><MissionStatusBadge done={isMissionComplete("assessment")} /></div></div><div className="grid gap-2 md:grid-cols-3">{Object.entries(assessmentSets).map(([key, value]) => <button key={key} onClick={() => chooseUnit(key)} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${unit === key ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-blue-50 text-blue-800 hover:bg-white"}`}>{value.title}</button>)}</div></div><div className="grid h-[calc(100%-84px)] min-h-0 gap-4 xl:grid-cols-[1fr_330px]"><div className="rounded-[1.7rem] border border-blue-100 bg-blue-50/50 p-5"><div className="flex items-center justify-between"><div className="text-sm font-black text-blue-700">{set.title} · 문제 {current + 1} / 10</div><div className="rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700">현재 점수 {score}/10</div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-blue-600" style={{ width: `${((current + 1) / 10) * 100}%` }} /></div>{showResult ? <div className="mt-6 rounded-[1.5rem] bg-white p-6 text-center"><div className="text-4xl font-black text-blue-700">{score} / 10</div><p className="mt-3 font-bold text-slate-700">{score >= 8 ? "잘했어요! 핵심 개념을 잘 이해하고 있어요." : "오답을 확인하고 다시 도전해 보세요."}</p><div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">✅ 형성평가 미션 완료 · +30P</div><button onClick={() => completeMission("assessment", 30)} disabled={isMissionComplete("assessment")} className="mt-4 rounded-2xl bg-green-600 px-6 py-3 font-black text-white disabled:bg-green-100 disabled:text-green-700">{isMissionComplete("assessment") ? "포인트 지급 완료" : "미션 완료 확인"}</button><button onClick={() => { setShowResult(false); setCurrent(0); }} className="mt-5 ml-2 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white">다시 풀기</button></div> : <div className="mt-5 rounded-[1.5rem] bg-white p-6"><h3 className="text-xl font-black text-slate-800">{question.q}</h3><div className="mt-5 grid gap-3 md:grid-cols-2">{question.choices.map((choice) => <button key={choice} onClick={() => chooseAnswer(choice)} className={`rounded-2xl border px-5 py-4 text-left font-black transition ${selected === choice ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-200" : "border-blue-100 bg-white hover:border-blue-300 hover:bg-blue-50"}`}>{choice}</button>)}</div>{selected && <div className={`mt-5 rounded-2xl px-5 py-4 text-sm font-bold ${selected === question.answer ? "bg-green-50 text-green-800" : "bg-rose-50 text-rose-800"}`}>{selected === question.answer ? "정답입니다! " : "다시 확인해 보세요. "}{question.explain}</div>}<div className="mt-5 flex justify-between"><button onClick={prev} className="rounded-2xl border border-blue-200 bg-white px-5 py-3 font-black text-blue-700">이전</button><button onClick={next} disabled={!selected} className="rounded-2xl bg-blue-600 px-6 py-3 font-black text-white disabled:opacity-40">{current === 9 ? "결과 보기" : "다음"}</button></div></div>}</div><AssessmentSidePanel set={set} answers={answers[unit] || {}} current={current} setCurrent={setCurrent} /></div></Card>;
}

function AssessmentSidePanel({ set, answers, current, setCurrent }) {
  return <div className="rounded-[1.7rem] border border-blue-100 bg-white p-5"><h3 className="text-xl font-black text-blue-950">문항 이동</h3><div className="mt-4 grid grid-cols-5 gap-2">{set.questions.map((q, index) => <button key={q.q} onClick={() => setCurrent(index)} className={`h-10 rounded-xl text-sm font-black ${current === index ? "bg-blue-600 text-white" : answers[index] ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{index + 1}</button>)}</div><div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-800">문항은 각 개념별로 10문항씩 구성되어 있습니다. 오답 피드백을 읽고 다음 문제로 넘어가세요.</div></div>;
}

function GrowthScreen({ setActive, answers, reflections }) {
  return <GrowthSummary setActive={setActive} answers={answers} reflections={reflections} full />;
}

function GrowthSummary({ setActive, answers = {}, reflections = {}, full = false }) {
  const summary = getAssessmentSummary(answers);
  const completedUnits = summary.units.filter((unit) => unit.solved > 0);
  const mainScoreText = summary.totalSolved === 0 ? "미응시" : `${summary.totalCorrect}/${summary.totalQuestions}`;
  const mainPercentText = summary.totalSolved === 0 ? "0%" : `${summary.averagePercent}%`;
  const recommendedQuestions = getRecommendedQuestions(summary);
  const [showRecommended, setShowRecommended] = useState(false);
  const [recommendAnswers, setRecommendAnswers] = useState({});
  const recommendScore = recommendedQuestions.reduce((sum, q) => sum + (recommendAnswers[q.id] === q.answer ? 1 : 0), 0);
  const misconceptions = getMiddle1Misconceptions(answers);
  const primaryMisconception = misconceptions[0];
  const prescriptionSteps = getPrescriptionSteps({
    gradeLabel: "중1",
    weakestTitle: summary.weakest?.title || "좌표와 그래프",
    misconceptionTitle: primaryMisconception?.title || "함수 기초 개념",
    route: primaryMisconception?.route || "개념학습 → 탐구활동",
  });

  return (
    <Card className="h-full overflow-hidden p-6">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-black text-blue-950">형성평가 / 성장기록</h2>
          <p className="mt-1 text-sm text-slate-500">형성평가 점수를 바탕으로 약한 개념을 분석하고 문제은행에서 맞춤 문제를 추천합니다.</p>
        </div>
        <button onClick={() => setActive("assessment")} className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-200">
          형성평가 풀러가기
        </button>
      </div>

      <div className="grid h-[calc(100%-78px)] min-h-0 gap-4 overflow-hidden xl:grid-cols-[300px_1fr_360px]">
        <div className="rounded-[1.5rem] border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-5 text-center">
          <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-blue-500 bg-blue-50 text-3xl font-black text-blue-700">
            {mainPercentText}
          </div>
          <div className="mt-3 font-black text-slate-800">총점 {mainScoreText}</div>
          <p className="mt-1 text-sm text-slate-500">풀이 완료 문항 {summary.totalSolved}/{summary.totalQuestions}</p>
          {summary.totalSolved === 0 && <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">아직 형성평가를 풀지 않았어요.</div>}
        </div>

        <div className="min-h-0 overflow-y-auto rounded-[1.5rem] border border-blue-200 bg-gradient-to-br from-white to-slate-50 p-5">
          <h3 className="font-black text-blue-950">개념별 형성평가 기록</h3>
          <div className="mt-4 space-y-4">
            {summary.units.map((unit) => (
              <div key={unit.key} className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-black">
                  <span className="text-slate-700">{unit.title}</span>
                  <span className="text-blue-700">{unit.correct}/{unit.total} · {unit.percent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${unit.percent}%` }} />
                </div>
                <div className="mt-2 text-xs font-bold text-slate-500">풀이 문항 {unit.solved}/{unit.total}</div>
              </div>
            ))}
          </div>
          <MisconceptionReport misconceptions={misconceptions} />
          <LearningPrescription steps={prescriptionSteps} setActive={setActive} />
          <FunctionConceptMap grade="middle1" summary={summary} />
          <TeacherDashboard title="교사용 대시보드" summary={summary} misconceptions={misconceptions} reflections={reflections} />
        </div>

        <div className="flex min-h-0 flex-col rounded-[1.5rem] border border-blue-200 bg-gradient-to-br from-white to-purple-50 p-5 overflow-hidden">
          <h3 className="shrink-0 font-black text-blue-950">문제은행 기반 AI형 맞춤 추천</h3>
          {summary.totalSolved === 0 ? (
            <div className="mt-4 shrink-0 rounded-2xl bg-blue-50 px-4 py-4 text-sm font-bold text-blue-800">
              먼저 형성평가를 풀면 약한 개념을 분석해 추천 문제를 제공합니다.
            </div>
          ) : (
            <>
              <div className="mt-4 shrink-0 rounded-2xl bg-orange-50 px-4 py-3">
                <div className="font-black text-orange-800">우선 복습 추천</div>
                <div className="mt-1 text-sm font-bold text-slate-700">{summary.weakest.title}</div>
                <div className="text-sm font-bold text-slate-500">정답률 {summary.weakest.percent}% · 추천 난이도 {getRecommendationLevel(summary.weakest.percent)}</div>
              </div>
              <div className="mt-3 shrink-0 space-y-1.5 text-xs font-bold leading-relaxed text-slate-700">
                {summary.weakest.key === "coordinate" && <div>• 사분면의 부호와 좌표축 위의 점을 다시 확인하세요.</div>}
                {summary.weakest.key === "direct" && <div>• y÷x가 일정한지 확인하고, 원점을 지나는 그래프인지 살펴보세요.</div>}
                {summary.weakest.key === "inverse" && <div>• xy가 일정한지 확인하고, x=0을 사용할 수 없는 이유를 복습하세요.</div>}
              </div>
              <button onClick={() => setShowRecommended((prev) => !prev)} className="mt-3 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-base font-black text-white shadow-lg shadow-purple-100 transition hover:bg-purple-700">
                <Sparkles className="h-5 w-5" /> {showRecommended ? "추천 문제 접기" : "AI 맞춤 문제 추천 받기"}
              </button>
              {showRecommended && (
                <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl bg-purple-50 p-3 pr-2">
                  <div className="mb-3 flex items-center justify-between text-sm font-black text-purple-900">
                    <span>추천 문제 세트</span>
                    <span>{recommendScore}/{recommendedQuestions.length}</span>
                  </div>
                  <div className="space-y-3">
                    {recommendedQuestions.map((q) => {
                      const selected = recommendAnswers[q.id];
                      return (
                        <div key={q.id} className="rounded-2xl bg-white p-3">
                          <div className="mb-1 text-xs font-black text-purple-700">{q.order}. {q.skill} · {q.difficulty}</div>
                          <div className="text-sm font-black text-slate-800">{q.q}</div>
                          <div className="mt-2 grid gap-2">
                            {q.choices.map((choice) => (
                              <button key={choice} onClick={() => setRecommendAnswers((prev) => ({ ...prev, [q.id]: choice }))} className={`rounded-xl border px-3 py-2 text-left text-sm font-bold ${selected === choice ? "border-purple-500 bg-purple-600 text-white" : "border-slate-100 bg-slate-50 text-slate-700 hover:bg-purple-50"}`}>
                                {choice}
                              </button>
                            ))}
                          </div>
                          {selected && (
                            <div className={`mt-2 rounded-xl px-3 py-2 text-xs font-bold ${selected === q.answer ? "bg-green-50 text-green-800" : "bg-rose-50 text-rose-800"}`}>
                              {selected === q.answer ? "정답입니다. " : `정답: ${q.answer}. `}{q.explain}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
          {completedUnits.length > 0 && !showRecommended && (
            <button onClick={() => setActive("concept")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-base font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
              <Star className="h-5 w-5" /> 맞춤 개념학습으로 이동
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

const gradeExtensionData = {
  middle2: {
    gradeLabel: "중2",
    title: "일차함수 그래프 탐험대",
    subtitle: "중2 일차함수 학습을 중1 웹앱 구조와 같은 흐름으로 구성했습니다.",
    units: ["1 함수와 함숫값", "2 일차함수의 뜻과 그래프", "3 절편", "3 기울기", "4 그래프의 성질", "5 일차함수의 식 구하기", "6~7 방정식과 연립방정식"],
    conceptCards: [
      {
        unitKey: "4.1",
        title: "4.1 함수와 함숫값",
        visual: "x → y",
        desc: "x의 값이 변할 때 y의 값이 하나씩 정해지는 관계를 이해해요.",
        bigIdea: "두 변수 x, y에 대하여 x의 값이 변함에 따라 y의 값이 하나씩 정해지는 대응 관계가 있을 때, y를 x의 함수라고 합니다. 함수 y=f(x)에서 x의 값에 따라 정해지는 f(x)의 값을 함숫값이라고 합니다.",
        representation: ["상황: 높이가 달라지면 기온이 정해짐", "표: x값 하나마다 y값 하나 확인", "식: y=f(x)", "그래프: x좌표에 대응하는 y좌표 읽기"],
        points: ["x값 하나에 y값이 오직 하나씩 정해져야 함수입니다.", "x값 하나에 y값이 여러 개 대응되면 함수가 아닙니다.", "f(2)는 x=2일 때의 함숫값을 뜻합니다.", "정비례와 반비례도 x값에 따라 y값이 하나씩 정해지므로 함수입니다."],
        examples: ["f(x)=3x이면 f(2)=6입니다.", "f(x)=2x-1이면 f(-3)=-7입니다.", "자연수 x의 약수의 개수 y는 x가 정해지면 y가 하나로 정해지므로 함수입니다."],
        check: "함수인지 판단할 때는 ‘x값 하나에 y값이 하나만 정해지는가?’를 먼저 확인하세요.",
      },
      {
        unitKey: "4.2",
        title: "4.2 일차함수의 뜻과 그래프",
        visual: "y=ax+b",
        desc: "일차함수의 식과 직선 그래프를 연결해요.",
        bigIdea: "함수 y=f(x)에서 y가 x에 대한 일차식 y=ax+b(a, b는 상수, a≠0)로 나타날 때, 이 함수를 x에 대한 일차함수라고 합니다. x의 값의 범위가 수 전체일 때 일차함수의 그래프는 직선입니다.",
        representation: ["상황: 물속 깊이에 따라 수압이 증가", "표: x가 일정하게 변할 때 y도 일정하게 변함", "식: y=ax+b", "그래프: 서로 다른 두 점을 연결한 직선"],
        points: ["일차함수는 y=ax+b(a≠0) 꼴입니다.", "b=0인 y=ax도 일차함수이며 중1 정비례와 연결됩니다.", "y=x²-1, y=2/x는 x에 대한 일차식이 아니므로 일차함수가 아닙니다.", "일차함수의 그래프는 서로 다른 두 점을 찾아 직선으로 연결해 그릴 수 있습니다.", "y=ax+b의 그래프는 y=ax의 그래프를 y축의 방향으로 b만큼 평행이동한 직선입니다."],
        examples: ["y=3x-2는 일차함수입니다.", "y=-1/4x+5는 일차함수입니다.", "y=x²-1은 이차식이므로 일차함수가 아닙니다."],
        check: "식에서 x의 차수가 1인지, 그리고 x의 계수 a가 0이 아닌지 확인하세요.",
      },
      {
        unitKey: "4.3a",
        title: "4.3 절편",
        visual: "x절편 · y절편",
        desc: "그래프가 x축, y축과 만나는 점을 읽어요.",
        bigIdea: "일차함수의 그래프가 x축과 만나는 점의 x좌표를 x절편, y축과 만나는 점의 y좌표를 y절편이라고 합니다. x절편은 y=0을 대입하여 구하고, y절편은 x=0을 대입하여 구합니다.",
        representation: ["상황: 직선이 두 축과 만나는 위치 찾기", "표: x=0 또는 y=0인 값 찾기", "식: y=ax+b", "그래프: (x절편,0), (0,y절편) 표시"],
        points: ["x절편은 그래프가 x축과 만나는 점의 x좌표입니다.", "y절편은 그래프가 y축과 만나는 점의 y좌표입니다.", "x절편을 구할 때는 y=0을 대입합니다.", "y절편을 구할 때는 x=0을 대입합니다.", "y=ax+b에서 y절편은 b입니다."],
        examples: ["y=2x-3에서 y절편은 -3입니다.", "y=2x-3에서 x절편은 3/2입니다.", "y=2x+6은 x절편 -3, y절편 6입니다."],
        check: "절편은 ‘점의 좌표 전체’가 아니라 축과 만나는 점의 한 좌표값을 말합니다.",
      },
      {
        unitKey: "4.3b",
        title: "4.3 기울기",
        visual: "a=Δy/Δx",
        desc: "x의 증가량에 대한 y의 증가량의 비율을 이해해요.",
        bigIdea: "일차함수 y=ax+b에서 x의 값의 증가량에 대한 y의 값의 증가량의 비율은 항상 일정하며, 이 비율 a를 그래프의 기울기라고 합니다.",
        representation: ["상황: 도로의 경사도", "표: x가 1 증가할 때 y가 얼마나 변하는지 확인", "식: 기울기=a", "그래프: 오른쪽으로 간 만큼 위아래 변화량 비교"],
        points: ["기울기 = y의 값의 증가량 / x의 값의 증가량입니다.", "y=ax+b에서 x의 계수 a가 기울기입니다.", "a>0이면 오른쪽 위로 향합니다.", "a<0이면 오른쪽 아래로 향합니다.", "|a|가 클수록 그래프가 더 가파릅니다."],
        examples: ["y=2x+1의 기울기는 2입니다.", "y=-3/2x+2의 기울기는 -3/2입니다.", "두 점 (1,2), (3,6)을 지나는 직선의 기울기는 (6-2)/(3-1)=2입니다."],
        check: "그래프에서 기울기를 읽을 때는 오른쪽으로 이동한 양을 분모, 위아래로 변한 양을 분자로 생각하세요.",
      },
      {
        unitKey: "4.4",
        title: "4.4 일차함수 그래프의 성질",
        visual: "a의 부호",
        desc: "기울기의 부호와 평행 관계를 해석해요.",
        bigIdea: "일차함수 y=ax+b의 그래프는 기울기 a의 부호에 따라 방향이 달라집니다. 또한 기울기가 같은 두 일차함수의 그래프는 서로 평행하거나 일치합니다.",
        representation: ["상황: 올라가는 직선과 내려가는 직선 비교", "표: x가 증가할 때 y가 증가/감소", "식: a의 부호 확인", "그래프: 방향과 평행 관계 판단"],
        points: ["a>0이면 x가 증가할 때 y도 증가하고, 그래프는 오른쪽 위로 향합니다.", "a<0이면 x가 증가할 때 y는 감소하고, 그래프는 오른쪽 아래로 향합니다.", "기울기가 같은 두 직선은 서로 평행하거나 일치합니다.", "서로 평행한 두 일차함수의 그래프는 기울기가 같습니다.", "기울기와 y절편이 모두 같으면 두 그래프는 일치합니다."],
        examples: ["y=2x-2와 y=2x+3은 기울기가 같으므로 평행합니다.", "y=-x+2는 오른쪽 아래로 향합니다.", "y=1/2x+2는 오른쪽 위로 향합니다."],
        check: "그래프의 방향은 b가 아니라 a의 부호가 결정합니다. b는 그래프의 위아래 위치를 바꿉니다.",
      },
      {
        unitKey: "4.5",
        title: "4.5 일차함수의 식 구하기",
        visual: "직선 → 식",
        desc: "그래프나 조건을 보고 일차함수의 식을 세워요.",
        bigIdea: "직선의 기울기와 y절편을 알면 y=ax+b의 식을 바로 구할 수 있습니다. 기울기와 한 점, 또는 서로 다른 두 점이 주어져도 일차함수의 식을 구할 수 있습니다.",
        representation: ["상황: 소리의 속력, 엘리베이터 높이 등", "표: 일정한 증가량 확인", "식: y=ax+b 세우기", "그래프: 기울기와 절편 읽기"],
        points: ["기울기와 y절편을 알면 y=ax+b에 바로 대입합니다.", "기울기와 한 점을 알면 y=ax+b에 점의 좌표를 대입하여 b를 구합니다.", "두 점을 알면 먼저 기울기를 구한 뒤 한 점을 대입합니다.", "평행한 직선은 기울기가 같다는 성질을 활용할 수 있습니다.", "실생활 문제에서는 무엇을 x, 무엇을 y로 둘지 먼저 정해야 합니다."],
        examples: ["기울기가 -3이고 점 (2,1)을 지나면 y=-3x+7입니다.", "두 점 (-2,-3), (2,5)를 지나면 기울기는 2이고 식은 y=2x+1입니다.", "기온 x℃, 소리의 속력 y m/s가 0℃에서 331이고 1℃마다 0.6씩 증가하면 y=331+0.6x입니다."],
        check: "식을 구한 뒤에는 주어진 점을 다시 대입해서 맞는지 확인하세요.",
      },
      {
        unitKey: "4.6",
        title: "4.6~4.7 방정식과 연립방정식",
        visual: "교점 = 해",
        desc: "일차방정식의 그래프와 연립방정식의 해를 연결해요.",
        bigIdea: "미지수가 2개인 일차방정식 ax+by+c=0의 그래프는 직선입니다. 두 일차방정식의 그래프가 만나는 교점의 좌표는 두 방정식을 동시에 만족하는 해, 즉 연립방정식의 해입니다.",
        representation: ["상황: 두 사람의 이동 그래프가 만나는 시점", "표: 두 조건을 동시에 만족하는 값", "식: 연립방정식", "그래프: 두 직선의 교점"],
        points: ["ax+by+c=0에서 y를 x의 식으로 나타내면 일차함수 그래프와 연결할 수 있습니다.", "x=p의 그래프는 y축에 평행한 직선입니다.", "y=q의 그래프는 x축에 평행한 직선입니다.", "두 직선이 한 점에서 만나면 해는 하나입니다.", "두 직선이 평행하면 해는 없습니다.", "두 직선이 일치하면 해는 무수히 많습니다."],
        examples: ["3x-2y+6=0은 y=3/2x+3의 그래프와 같습니다.", "x=2는 점 (2,0)을 지나고 y축에 평행한 직선입니다.", "두 직선의 교점이 (-1,-3)이면 연립방정식의 해도 x=-1, y=-3입니다."],
        check: "연립방정식을 그래프로 볼 때는 ‘교점의 개수’가 해의 개수를 뜻한다는 점을 기억하세요.",
      },
    ],
    explore: { label: "일차함수 그래프 조작", formula: "y = ax + b", aMin: -4, aMax: 4, bMin: -5, bMax: 5, defaultA: 2, defaultB: 1 },
    gameQuestions: [
      { q: "y=2x+3의 y절편은?", a: "3" },
      { q: "y=-3x+1의 기울기는?", a: "-3" },
      { q: "기울기가 양수인 직선은 오른쪽으로 갈수록 어떻게 되나요?", a: "올라간다" },
      { q: "y=4x-2는 일차함수인가요?", a: "예" },
    ],
    assessment: [
      { q: "일차함수의 일반적인 식은?", choices: ["y=ax+b", "y=a/x", "y=ax²", "xy=a"], answer: "y=ax+b", explain: "일차함수는 y=ax+b(a≠0) 꼴입니다." },
      { q: "y=3x-2의 기울기는?", choices: ["3", "-2", "2", "-3"], answer: "3", explain: "y=ax+b에서 a가 기울기입니다." },
      { q: "y=3x-2의 y절편은?", choices: ["3", "-2", "2", "0"], answer: "-2", explain: "y=ax+b에서 b가 y절편입니다." },
      { q: "기울기가 0보다 작으면 그래프는?", choices: ["오른쪽 위로", "오른쪽 아래로", "항상 수평", "곡선"], answer: "오른쪽 아래로", explain: "a<0이면 x가 증가할 때 y는 감소합니다." },
      { q: "일차함수 그래프의 모양은?", choices: ["직선", "포물선", "쌍곡선", "원"], answer: "직선", explain: "일차함수의 그래프는 직선입니다." },
      { q: "y=-2x+5의 y절편을 좌표로 나타내면?", choices: ["(5,0)", "(0,5)", "(-2,0)", "(0,-2)"], answer: "(0,5)", explain: "y절편은 x=0일 때의 y값이므로 (0,b)입니다." },
      { q: "두 점 (1,2), (3,6)을 지나는 직선의 기울기는?", choices: ["1", "2", "3", "4"], answer: "2", explain: "기울기=(6-2)/(3-1)=4/2=2입니다." },
      { q: "y=4x와 y=4x-3의 공통점은?", choices: ["기울기가 같다", "y절편이 같다", "둘 다 원점을 지난다", "그래프가 곡선이다"], answer: "기울기가 같다", explain: "두 식 모두 x의 계수가 4이므로 기울기가 같습니다." },
      { q: "기울기가 2이고 y절편이 -1인 일차함수는?", choices: ["y=2x-1", "y=-x+2", "y=x-2", "y=-2x-1"], answer: "y=2x-1", explain: "기울기 a=2, y절편 b=-1이므로 y=2x-1입니다." },
      { q: "일차함수 y=ax+b에서 b가 변하면 그래프는 어떻게 달라지나요?", choices: ["기울기만 변한다", "위아래로 평행이동한다", "항상 원점을 지난다", "포물선이 된다"], answer: "위아래로 평행이동한다", explain: "b는 y절편이므로 그래프의 위아래 위치를 바꿉니다." },
    ],
  },
  middle3: {
    gradeLabel: "중3",
    title: "이차함수 그래프 탐험대",
    subtitle: "중3 이차함수 학습을 중1 웹앱 구조와 같은 흐름으로 구성했습니다.",
    units: ["1 이차함수의 뜻", "2 y=x², y=-x²", "3 y=ax²", "4 y=ax²+q", "5 y=a(x-p)²", "6 y=a(x-p)²+q", "7 y=ax²+bx+c"],
    conceptCards: [
      {
        unitKey: "4.1",
        title: "4.1 이차함수의 뜻",
        visual: "y=ax²+bx+c",
        desc: "x에 관한 이차식으로 나타나는 함수를 이해해요.",
        bigIdea: "함수 y=f(x)에서 f(x)가 x에 관한 이차식 ax²+bx+c(a, b, c는 상수, a≠0)로 나타날 때, 이 함수를 x에 관한 이차함수라고 합니다. 중요한 것은 식을 전개하고 정리했을 때 x²항의 계수가 0이 아니어야 한다는 점입니다.",
        representation: ["상황: 직사각형 텃밭의 가로 길이와 넓이", "표: x값이 정해지면 y값이 하나씩 정해짐", "식: y=ax²+bx+c", "그래프: 앞으로 배울 포물선의 출발점"],
        points: ["이차함수는 y=ax²+bx+c(a≠0) 꼴로 정리됩니다.", "x²항이 있어 보여도 전개 후 x²항이 사라지면 이차함수가 아닙니다.", "y=5x-7은 일차식이므로 이차함수가 아닙니다.", "y=10/x은 x에 관한 이차식이 아니므로 이차함수가 아닙니다.", "특별한 말이 없으면 x의 값의 범위는 실수 전체로 생각합니다."],
        examples: ["y=2x²-5x+1은 이차함수입니다.", "y=(x+3)(x-1)=x²+2x-3이므로 이차함수입니다.", "y=2(x-1)²-2x²+4는 정리하면 -4x+6이므로 이차함수가 아닙니다."],
        check: "겉모양만 보지 말고 반드시 우변을 전개하고 정리한 뒤 x²항이 남는지 확인하세요.",
      },
      {
        unitKey: "4.2",
        title: "4.2 y=x², y=-x²의 그래프",
        visual: "y=x²",
        desc: "가장 기본적인 포물선 두 개를 비교해요.",
        bigIdea: "이차함수 y=x²의 그래프는 원점을 지나고 아래로 볼록하며 y축에 대칭인 곡선입니다. y=-x²의 그래프는 y=x²의 그래프와 x축에 대칭이고, 원점을 지나며 위로 볼록합니다.",
        representation: ["상황: 스키 점프 선수의 시간과 이동 거리", "표: x와 x², -x²의 값 비교", "식: y=x², y=-x²", "그래프: 원점을 꼭짓점으로 하는 포물선"],
        points: ["y=x²의 그래프는 원점을 지나고 아래로 볼록합니다.", "y=-x²의 그래프는 원점을 지나고 위로 볼록합니다.", "두 그래프는 모두 y축에 대칭입니다.", "y=x²에서 x<0이면 x가 증가할 때 y는 감소하고, x>0이면 y는 증가합니다.", "y=-x²의 그래프는 y=x²의 그래프와 x축에 대칭입니다."],
        examples: ["y=x²에서 x=3과 x=-3일 때 y값은 모두 9입니다.", "y=-x²에서 x=4와 x=-4일 때 y값은 모두 -16입니다.", "y=x²은 원점을 제외하면 x축보다 위쪽에 있습니다."],
        check: "x와 -x를 대입했을 때 y값이 같으므로 y축 대칭이라는 점을 꼭 확인하세요.",
      },
      {
        unitKey: "4.3",
        title: "4.3 y=ax²의 그래프",
        visual: "a",
        desc: "a의 부호와 절댓값이 포물선의 방향과 폭을 바꿔요.",
        bigIdea: "이차함수 y=ax²(a≠0)의 그래프는 원점을 꼭짓점으로 하고 y축을 축으로 하는 포물선입니다. a>0이면 아래로 볼록하고, a<0이면 위로 볼록합니다. 또 |a|가 클수록 그래프의 폭이 좁아집니다.",
        representation: ["상황: x²과 2x²의 값 비교", "표: 같은 x에서 y값이 몇 배인지 확인", "식: y=ax²", "그래프: 폭과 방향이 달라지는 포물선"],
        points: ["꼭짓점은 항상 원점 (0,0)입니다.", "축은 항상 y축, 즉 x=0입니다.", "a>0이면 아래로 볼록합니다.", "a<0이면 위로 볼록합니다.", "|a|가 클수록 폭이 좁고, |a|가 작을수록 폭이 넓습니다.", "y=ax²와 y=-ax²의 그래프는 x축에 대칭입니다."],
        examples: ["y=2x²은 y=x²보다 폭이 좁습니다.", "y=1/2x²은 y=x²보다 폭이 넓습니다.", "y=-3x²은 위로 볼록하고 폭이 좁은 포물선입니다."],
        check: "방향은 a의 부호, 폭은 |a|의 크기로 판단하세요.",
      },
      {
        unitKey: "4.4",
        title: "4.4 y=ax²+q의 그래프",
        visual: "q",
        desc: "포물선이 위아래로 평행이동하는 원리를 익혀요.",
        bigIdea: "이차함수 y=ax²+q의 그래프는 y=ax²의 그래프를 y축의 방향으로 q만큼 평행이동한 것입니다. 축은 y축이고, 꼭짓점의 좌표는 (0,q)입니다.",
        representation: ["상황: 기준 그래프를 위아래로 옮기기", "표: 같은 x에서 y값이 q만큼 달라짐", "식: y=ax²+q", "그래프: 꼭짓점이 (0,q)로 이동"],
        points: ["y=ax²의 그래프를 y축 방향으로 q만큼 평행이동합니다.", "q>0이면 위쪽으로, q<0이면 아래쪽으로 이동합니다.", "축은 y축, 즉 x=0입니다.", "꼭짓점의 좌표는 (0,q)입니다.", "평행이동해도 포물선의 폭과 방향은 a가 결정합니다."],
        examples: ["y=x²+2는 y=x²을 위로 2만큼 이동한 그래프입니다.", "y=2x²-1의 꼭짓점은 (0,-1)입니다.", "y=-2x²+3은 위로 볼록하고 꼭짓점은 (0,3)입니다."],
        check: "q는 그래프의 위아래 위치와 꼭짓점의 y좌표를 결정합니다.",
      },
      {
        unitKey: "4.5",
        title: "4.5 y=a(x-p)²의 그래프",
        visual: "p",
        desc: "포물선이 좌우로 평행이동하는 원리를 익혀요.",
        bigIdea: "이차함수 y=a(x-p)²의 그래프는 y=ax²의 그래프를 x축의 방향으로 p만큼 평행이동한 것입니다. 축의 방정식은 x=p이고, 꼭짓점의 좌표는 (p,0)입니다.",
        representation: ["상황: 기준 그래프를 왼쪽·오른쪽으로 옮기기", "표: 같은 y값이 나오는 x값 비교", "식: y=a(x-p)²", "그래프: 꼭짓점이 (p,0)으로 이동"],
        points: ["y=ax²의 그래프를 x축 방향으로 p만큼 평행이동합니다.", "식이 (x-p)²이면 오른쪽으로 p만큼 이동합니다.", "식이 (x+p)²이면 p가 음수인 경우이므로 왼쪽으로 이동합니다.", "축의 방정식은 x=p입니다.", "꼭짓점의 좌표는 (p,0)입니다."],
        examples: ["y=(x-2)²의 꼭짓점은 (2,0)입니다.", "y=(x+3)²은 y=x²을 왼쪽으로 3만큼 이동한 그래프입니다.", "y=-2(x-3)²의 축은 x=3이고 위로 볼록합니다."],
        check: "괄호 안의 부호를 그대로 읽지 말고 y=a(x-p)²의 p값을 찾아야 합니다.",
      },
      {
        unitKey: "4.6",
        title: "4.6 y=a(x-p)²+q의 그래프",
        visual: "(p,q)",
        desc: "좌우 이동과 위아래 이동을 함께 이해해요.",
        bigIdea: "이차함수 y=a(x-p)²+q의 그래프는 y=ax²의 그래프를 x축의 방향으로 p만큼, y축의 방향으로 q만큼 평행이동한 것입니다. 축의 방정식은 x=p이고, 꼭짓점의 좌표는 (p,q)입니다.",
        representation: ["상황: 포물선을 가로와 세로 방향으로 옮기기", "표: 꼭짓점을 기준으로 대칭값 확인", "식: y=a(x-p)²+q", "그래프: 꼭짓점과 축을 먼저 표시"],
        points: ["x축 방향으로 p만큼, y축 방향으로 q만큼 평행이동합니다.", "축의 방정식은 x=p입니다.", "꼭짓점의 좌표는 (p,q)입니다.", "a>0이면 아래로 볼록하고 최솟값 q를 가집니다.", "a<0이면 위로 볼록하고 최댓값 q를 가집니다.", "그래프를 그릴 때는 꼭짓점 → 축 → 대칭점 순서가 편리합니다."],
        examples: ["y=(x-2)²+3의 꼭짓점은 (2,3), 축은 x=2입니다.", "y=-(x+1)²+2의 꼭짓점은 (-1,2), 축은 x=-1입니다.", "y=2(x-1)²-4는 아래로 볼록하고 최솟값은 -4입니다."],
        check: "표준형에서는 꼭짓점과 축이 바로 보이므로 그래프 해석의 출발점으로 사용하세요.",
      },
      {
        unitKey: "4.7",
        title: "4.7 y=ax²+bx+c의 그래프",
        visual: "일반형 → 표준형",
        desc: "일반형을 표준형으로 고쳐 그래프를 해석해요.",
        bigIdea: "이차함수 y=ax²+bx+c의 그래프는 식을 y=a(x-p)²+q의 꼴로 고쳐서 그릴 수 있습니다. 이때 꼭짓점과 축을 찾으면 그래프의 모양을 쉽게 파악할 수 있고, y축과 만나는 점은 (0,c)입니다.",
        representation: ["상황: 복잡한 이차식을 그래프로 해석하기", "표: 대칭축을 기준으로 y값 비교", "식: y=ax²+bx+c → y=a(x-p)²+q", "그래프: 축, 꼭짓점, y절편 표시"],
        points: ["일반형은 표준형 y=a(x-p)²+q로 고쳐서 그래프를 그릴 수 있습니다.", "y축과 만나는 점은 (0,c)입니다.", "a>0이면 아래로 볼록, a<0이면 위로 볼록합니다.", "축의 방정식은 x=-b/(2a)입니다.", "꼭짓점의 x좌표는 -b/(2a)이고, y좌표는 그 값을 식에 대입해 구합니다.", "완전제곱식을 만들면 표준형으로 바꿀 수 있습니다."],
        examples: ["y=2x²-4x+5는 y=2(x-1)²+3이므로 꼭짓점은 (1,3)입니다.", "y=-x²+6x-1은 y=-(x-3)²+8이므로 꼭짓점은 (3,8)입니다.", "y=ax²+bx+c는 항상 y축과 (0,c)에서 만납니다."],
        check: "일반형을 보면 먼저 a의 부호, y절편 c, 축 x=-b/(2a), 꼭짓점을 차례로 확인하세요.",
      },
    ],
    explore: { label: "이차함수 그래프 조작", formula: "y = a(x-p)² + q", aMin: -3, aMax: 3, bMin: -4, bMax: 4, defaultA: 1, defaultB: 0 },
    gameQuestions: [
      { q: "y=2x²의 그래프는 위로 볼록인가요, 아래로 볼록인가요?", a: "아래로 볼록" },
      { q: "y=-x²의 꼭짓점은?", a: "(0,0)" },
      { q: "y=(x-2)²+3의 꼭짓점은?", a: "(2,3)" },
      { q: "|a|가 클수록 포물선의 폭은?", a: "좁아진다" },
    ],
    assessment: [
      { q: "이차함수 그래프의 모양은?", choices: ["직선", "포물선", "쌍곡선", "원"], answer: "포물선", explain: "이차함수의 그래프는 포물선입니다." },
      { q: "y=2x²의 꼭짓점은?", choices: ["(0,0)", "(2,0)", "(0,2)", "(1,2)"], answer: "(0,0)", explain: "y=ax²의 꼭짓점은 원점입니다." },
      { q: "a>0인 이차함수 y=ax²의 그래프는?", choices: ["아래로 볼록", "위로 볼록", "직선", "축과 만나지 않음"], answer: "아래로 볼록", explain: "a>0이면 아래로 볼록합니다." },
      { q: "y=(x-3)²+2의 축의 방정식은?", choices: ["x=3", "x=2", "y=3", "y=2"], answer: "x=3", explain: "y=a(x-p)²+q에서 축은 x=p입니다." },
      { q: "|a|가 작아지면 포물선의 폭은?", choices: ["넓어진다", "좁아진다", "항상 같다", "직선이 된다"], answer: "넓어진다", explain: "|a|가 작을수록 포물선의 폭은 넓어집니다." },
      { q: "y=x²+4의 꼭짓점은?", choices: ["(0,4)", "(4,0)", "(0,-4)", "(1,4)"], answer: "(0,4)", explain: "y=ax²+q의 꼭짓점은 (0,q)입니다." },
      { q: "y=(x+2)²의 그래프는 y=x²을 어느 쪽으로 평행이동한 것인가요?", choices: ["오른쪽 2", "왼쪽 2", "위쪽 2", "아래쪽 2"], answer: "왼쪽 2", explain: "y=(x+2)²은 y=(x-(-2))²이므로 왼쪽으로 2만큼 이동한 그래프입니다." },
      { q: "y=-2(x-1)²+3의 꼭짓점은?", choices: ["(1,3)", "(-1,3)", "(1,-3)", "(0,3)"], answer: "(1,3)", explain: "y=a(x-p)²+q의 꼭짓점은 (p,q)입니다." },
      { q: "y=-2(x-1)²+3의 그래프에 대한 설명으로 알맞은 것은?", choices: ["아래로 볼록하고 최솟값 3", "위로 볼록하고 최댓값 3", "아래로 볼록하고 최댓값 1", "직선이고 기울기 -2"], answer: "위로 볼록하고 최댓값 3", explain: "a<0이면 위로 볼록하고 꼭짓점의 y좌표 3이 최댓값입니다." },
      { q: "y=x²-4x+3의 축의 방정식은?", choices: ["x=2", "x=-2", "x=3", "x=4"], answer: "x=2", explain: "축의 방정식은 x=-b/(2a)입니다. a=1, b=-4이므로 x=2입니다." },
    ],
  },
};

function GradeExtensionHome({ grade, setActive, expPoints, isMissionComplete }) {
  const data = gradeExtensionData[grade];
  const tiles = [
    { title: "탐험 포인트", desc: `${data.gradeLabel} 함수 탐험 포인트`, icon: Star, value: `${expPoints}P`, target: null },
    { title: "학습준비", desc: `${data.units[0]}부터 빠르게 진단해요.`, icon: ClipboardCheck, target: "ready" },
    { title: "개념학습", desc: data.units.join(" · "), icon: BookOpen, target: "concept" },
    { title: "AI 그래프 해석실", desc: "함수식을 입력하고 AI처럼 그래프를 해석해요.", icon: Bot, target: "ai" },
    { title: "탐구활동", desc: `${data.explore.formula}를 조작해요.`, icon: FlaskConical, target: "explore" },
    { title: "게임존", desc: "개념 카드와 빠른 판별 게임으로 복습해요.", icon: Star, target: "game" },
    { title: "형성평가", desc: "핵심 문항으로 이해 정도를 점검해요.", icon: Target, target: "assessment" },
    { title: "성장기록", desc: "학습 흐름과 다음 학습을 확인해요.", icon: BarChart3, target: "growth" },
  ];
  return (
    <div className="grid h-full grid-cols-4 grid-rows-2 gap-3 overflow-hidden">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return <Card key={tile.title} className="p-5"><div className="flex h-full flex-col justify-between gap-3"><div><IconBadge icon={Icon} color={tile.title === "탐험 포인트" ? "orange" : "purple"} /><h3 className="mt-4 text-xl font-black text-blue-950">{tile.title}</h3>{tile.value && <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-3xl font-black text-amber-700">⭐ {tile.value}</div>}<p className="mt-3 text-sm font-bold leading-relaxed text-slate-600">{tile.desc}</p></div>{tile.target ? <div className="space-y-2">{["ready", "concept", "explore", "assessment"].includes(tile.target) && <MissionStatusBadge done={isMissionComplete(tile.target)} />}<button onClick={() => setActive(tile.target)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-base font-black text-white shadow-lg shadow-blue-100">열기 <ChevronRight className="h-4 w-4" /></button></div> : <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">학습 미션 완료 시 포인트가 올라가요.</div>}</div></Card>;
      })}
    </div>
  );
}

function GradeExtensionReady({ grade, setActive, completeMission, isMissionComplete }) {
  const data = gradeExtensionData[grade];
  const readinessMap = {
    middle2: [
      {
        id: "function",
        title: "함수의 뜻",
        q: "함수에 대한 설명으로 알맞은 것은?",
        choices: ["x값 하나에 y값이 여러 개 정해진다", "x값 하나에 y값이 하나씩 정해진다", "항상 원점을 지난다", "항상 곡선이다"],
        answer: "x값 하나에 y값이 하나씩 정해진다",
        feedback: "함수는 x값 하나에 y값이 오직 하나씩 대응되는 관계입니다.",
        recommend: "함수의 뜻부터 확인한 뒤 일차함수로 넘어가세요.",
        target: "concept",
      },
      {
        id: "slope",
        title: "기울기 판단",
        q: "일차함수 y = 2x - 3의 기울기는 무엇인가요?",
        choices: ["2", "-3", "3", "-2"],
        answer: "2",
        feedback: "y=ax+b에서 a가 기울기입니다.",
        recommend: "기울기와 y절편을 개념학습에서 다시 확인하세요.",
        target: "concept",
      },
      {
        id: "intercept",
        title: "y절편 판단",
        q: "일차함수 y = -x + 4의 그래프가 y축과 만나는 점은?",
        choices: ["(4, 0)", "(0, 4)", "(-1, 4)", "(0, -1)"],
        answer: "(0, 4)",
        feedback: "y=ax+b에서 y절편은 b이고, 점으로는 (0,b)입니다.",
        recommend: "y절편을 확인한 뒤 탐구활동에서 그래프를 조작해 보세요.",
        target: "explore",
      },
      {
        id: "linearGraph",
        title: "그래프 모양",
        q: "일차함수의 그래프 모양으로 알맞은 것은?",
        choices: ["직선", "포물선", "쌍곡선", "원"],
        answer: "직선",
        feedback: "일차함수 y=ax+b의 그래프는 직선입니다.",
        recommend: "일차함수의 식과 그래프의 모양을 개념학습에서 확인하세요.",
        target: "concept",
      },
    ],
    middle3: [
      {
        id: "quadratic",
        title: "이차함수 모양",
        q: "이차함수 y = ax²의 그래프 모양은 무엇인가요?",
        choices: ["직선", "포물선", "쌍곡선", "원"],
        answer: "포물선",
        feedback: "이차함수의 그래프는 포물선입니다.",
        recommend: "이차함수의 기본 모양부터 개념학습에서 확인하세요.",
        target: "concept",
      },
      {
        id: "direction",
        title: "그래프 방향",
        q: "y = -2x²의 그래프는 어느 방향으로 열리나요?",
        choices: ["위로 열린다", "아래로 열린다", "오른쪽으로 열린다", "항상 직선이다"],
        answer: "아래로 열린다",
        feedback: "a<0이면 포물선은 아래로 열리고 위로 볼록한 모양입니다.",
        recommend: "a의 부호와 그래프 방향을 개념학습에서 다시 확인하세요.",
        target: "concept",
      },
      {
        id: "vertex",
        title: "꼭짓점 판단",
        q: "이차함수 y = (x - 3)² + 2의 꼭짓점은?",
        choices: ["(3, 2)", "(-3, 2)", "(2, 3)", "(0, 2)"],
        answer: "(3, 2)",
        feedback: "y=a(x-p)²+q의 꼭짓점은 (p,q)입니다.",
        recommend: "꼭짓점과 축의 방정식을 탐구활동에서 조작해 보세요.",
        target: "explore",
      },
      {
        id: "axis",
        title: "축의 방정식",
        q: "이차함수 y = (x + 2)² - 1의 축의 방정식은?",
        choices: ["x=2", "x=-2", "y=-1", "y=2"],
        answer: "x=-2",
        feedback: "y=a(x-p)²+q에서 축의 방정식은 x=p입니다. (x+2)²은 p=-2입니다.",
        recommend: "표준형에서 꼭짓점과 축을 읽는 방법을 개념학습에서 확인하세요.",
        target: "concept",
      },
    ],
  };

  const readinessQuestions = readinessMap[grade] || readinessMap.middle2;
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const score = readinessQuestions.reduce((sum, item) => sum + (answers[item.id] === item.answer ? 1 : 0), 0);
  const firstWrong = readinessQuestions.find((item) => answers[item.id] && answers[item.id] !== item.answer);
  const allAnswered = readinessQuestions.every((item) => answers[item.id]);
  const recommendation = !submitted
    ? "네 문항에 답하면 오늘의 출발 학습을 추천합니다."
    : score === 4
      ? `${data.gradeLabel} 기초 준비가 잘 되어 있습니다. 탐구활동에서 그래프 조작부터 시작해도 좋습니다.`
      : firstWrong?.recommend || "기초 개념을 확인한 뒤 개념학습으로 이동해 보세요.";
  const recommendedTarget = submitted && score === 4 ? "explore" : submitted && firstWrong?.target ? firstWrong.target : "concept";
  const targetLabel = recommendedTarget === "explore" ? "탐구활동" : recommendedTarget === "ai" ? "그래프 해석실" : "개념학습";

  return (
    <Card className="h-full overflow-hidden p-5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-black text-blue-950">{data.gradeLabel} 학습준비: 사전 진단</h2>
          <p className="mt-1 text-sm text-slate-500">{data.units.join(" · ")}의 기초 이해를 빠르게 확인하고 맞춤 출발점을 추천합니다.</p>
        </div>
        <div className="rounded-2xl bg-blue-50 px-5 py-3 text-sm font-black text-blue-700">
          준비 진단 {submitted ? `${score}/4` : "0/4"}
        </div>
      </div>

      <div className="grid h-[calc(100%-84px)] min-h-0 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-3 overflow-hidden">
          {readinessQuestions.map((item, index) => {
            const selected = answers[item.id];
            const isCorrect = selected === item.answer;
            return (
              <div key={item.id} className="rounded-[1.7rem] border border-blue-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">진단 {index + 1}</div>
                  <div className="text-xs font-black text-slate-500">{item.title}</div>
                </div>
                <h3 className="min-h-[58px] text-base font-black leading-snug text-blue-950">{item.q}</h3>
                <div className="mt-4 space-y-2">
                  {item.choices.map((choice) => (
                    <button
                      key={choice}
                      onClick={() => {
                        setAnswers((prev) => ({ ...prev, [item.id]: choice }));
                        setSubmitted(false);
                      }}
                      className={`w-full rounded-2xl border px-3 py-2 text-left text-sm font-bold transition ${
                        selected === choice ? "border-blue-500 bg-blue-600 text-white" : "border-blue-100 bg-slate-50 text-slate-700 hover:bg-blue-50"
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
                {submitted && selected && (
                  <div className={`mt-3 rounded-2xl px-3 py-2 text-xs font-bold ${isCorrect ? "bg-green-50 text-green-800" : "bg-rose-50 text-rose-800"}`}>
                    {isCorrect ? "정답입니다. " : `정답: ${item.answer}. `}{item.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-3 overflow-hidden rounded-[1.7rem] border border-blue-100 bg-blue-50/60 p-4">
          <div className="rounded-2xl bg-white p-4">
            <h3 className="text-xl font-black text-blue-950">오늘의 추천 출발점</h3>
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold leading-relaxed text-slate-700">
              {recommendation}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <h3 className="font-black text-blue-950">진단 결과 기준</h3>
            <div className="mt-3 space-y-2 text-sm font-bold text-slate-700">
              <div>• 4개 정답: 탐구활동 또는 그래프 해석실로 이동</div>
              <div>• 2~3개 정답: 개념학습에서 부족한 부분 확인</div>
              <div>• 0개 정답: {data.units[0]}부터 차근차근 학습</div>
            </div>
          </div>

          <button
            onClick={() => {
              setSubmitted(true);
              completeMission("ready", 20);
            }}
            disabled={!allAnswered}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-base font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-40"
          >
            <CheckCircle2 className="h-5 w-5" /> 진단 결과 확인
          </button>

          {submitted && (
            <div className="grid gap-2">
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">✅ 학습준비 미션 완료 · +20P</div>
              <button onClick={() => setActive(recommendedTarget)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white shadow-lg shadow-emerald-100">
                {targetLabel}으로 이동 <ChevronRight className="h-5 w-5" />
              </button>
              <button onClick={() => setActive("assessment")} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 py-3 font-black text-blue-700">
                바로 형성평가 보기
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function GradeExtensionConcept({ grade, completeMission, isMissionComplete }) {
  const data = gradeExtensionData[grade];
  const [selected, setSelected] = useState(null);
  const item = selected === null ? null : data.conceptCards[selected];

  if (!item) {
    return (
      <Card className="h-full overflow-hidden p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-black text-blue-950">{data.title} 개념학습</h2>
            <p className="mt-1 text-sm text-slate-500">
              7개 개념으로 나누었습니다. 카드 하나를 선택하면 예시, 핵심 개념, 꼭 확인할 점을 볼 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <MissionStatusBadge done={isMissionComplete("concept")} />
            <button
              onClick={() => completeMission("concept", 20)}
              disabled={isMissionComplete("concept")}
              className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-green-100 disabled:bg-green-100 disabled:text-green-700"
            >
              {isMissionComplete("concept") ? "완료됨" : "개념학습 완료 +20P"}
            </button>
          </div>
        </div>
        <div className="grid h-[calc(100%-86px)] min-h-0 gap-3 overflow-hidden md:grid-cols-2 xl:grid-cols-4">
          {data.conceptCards.map((card, index) => (
            <button
              key={card.title}
              onClick={() => setSelected(index)}
              className="group flex min-h-0 flex-col rounded-[1.7rem] border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
            >
              <div className="inline-flex w-fit rounded-2xl bg-blue-50 px-4 py-3 text-xl font-black text-blue-700">{card.visual}</div>
              <h3 className="mt-3 text-lg font-black leading-tight text-blue-950">{stripUnitPrefix(card.title)}</h3>
              <p className="mt-2 flex-1 text-sm font-bold leading-relaxed text-slate-600">{card.desc}</p>
              <div className="mt-3 inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white group-hover:bg-blue-700">
                학습하기 <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <button onClick={() => setSelected(null)} className="mb-2 rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-50">
            ← 개념 목록으로
          </button>
          <h2 className="text-2xl font-black text-blue-950">{stripUnitPrefix(item.title)}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{item.desc}</p>
        </div>
        <div className="hidden rounded-[1.5rem] bg-blue-50 px-5 py-3 text-center text-xl font-black text-blue-700 xl:block">{item.visual}</div>
      </div>

      <div className="grid h-[calc(100%-86px)] min-h-0 gap-4 xl:grid-cols-[1.05fr_1.05fr_0.9fr]">
        <div className="min-h-0 overflow-auto rounded-[1.7rem] border border-blue-100 bg-blue-50/60 p-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm font-black text-blue-700">핵심 개념</div>
            <p className="mt-3 text-base font-bold leading-relaxed text-slate-700">{item.bigIdea}</p>
          </div>
          <div className="mt-4 rounded-2xl bg-amber-50 p-4">
            <div className="text-sm font-black text-amber-900">학습 포인트</div>
            <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700">{item.check}</p>
          </div>
          {item.representation && (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {item.representation.map((rep, index) => (
                <div key={rep} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                  <span className="mr-2 rounded-full bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">{index + 1}</span>
                  {rep}
                </div>
              ))}
            </div>
          )}
          {(grade === "middle2" || grade === "middle3") && item.unitKey && (
            <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm xl:hidden">
              {grade === "middle2" ? <Middle2ConceptVisual unitKey={item.unitKey} compact /> : <Middle3ConceptVisual unitKey={item.unitKey} compact />}
            </div>
          )}
        </div>

        <div className="min-h-0 overflow-auto rounded-[1.7rem] border border-blue-100 bg-white p-5">
          <h3 className="text-xl font-black text-blue-950">꼭 확인할 점</h3>
          <div className="mt-4 space-y-2 overflow-hidden">
            {item.points.map((point) => (
              <div key={point} className="flex gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-relaxed text-slate-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-0 overflow-auto rounded-[1.7rem] border border-purple-100 bg-purple-50/60 p-5">
          {(grade === "middle2" || grade === "middle3") && item.unitKey ? (
            <>
              <h3 className="text-xl font-black text-purple-950">그래프로 이해하기</h3>
              <div className="mt-4 hidden xl:block">
                {grade === "middle2" ? <Middle2ConceptVisual unitKey={item.unitKey} /> : <Middle3ConceptVisual unitKey={item.unitKey} />}
              </div>
              <div className="mt-4 space-y-3">
                {(item.examples || []).map((example, index) => (
                  <div key={example} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-relaxed text-slate-700 shadow-sm">
                    <span className="mr-2 rounded-full bg-purple-50 px-2 py-1 text-xs font-black text-purple-700">예시 {index + 1}</span>
                    {example}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
          <h3 className="text-xl font-black text-purple-950">예시로 이해하기</h3>
          <div className="mt-4 space-y-3">
            {(item.examples || []).map((example, index) => (
              <div key={example} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-relaxed text-slate-700 shadow-sm">
                <span className="mr-2 rounded-full bg-purple-50 px-2 py-1 text-xs font-black text-purple-700">예시 {index + 1}</span>
                {example}
              </div>
            ))}
          </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function Middle2ConceptVisual({ unitKey, compact = false }) {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const panelClass = compact ? "rounded-2xl border border-slate-200 bg-slate-50 p-3" : "rounded-2xl border border-slate-200 bg-slate-50 p-4";
  const graphWrapperClass = compact ? "grid gap-3" : "grid gap-4";

  if (unitKey === "4.1") {
    return (
      <div className={graphWrapperClass}>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="text-sm font-black text-blue-900">함수의 뜻</div>
          <div className="mt-2 space-y-2 text-xs font-bold leading-relaxed text-slate-700">
            <div className="rounded-xl bg-white px-3 py-2">x값 하나에 y값 하나가 대응되면 함수입니다.</div>
            <div className="rounded-xl bg-white px-3 py-2">표, 식, 그래프는 같은 관계를 다른 방법으로 나타낸 것입니다.</div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <LinearConceptGraph a={1} b={2} label="예: y = x + 2" showIntercept />
          <SimpleTableVisual title="표로 보기" rows={[["x", "-1", "0", "1", "2"], ["y", "1", "2", "3", "4"]]} />
        </div>
      </div>
    );
  }

  if (unitKey === "4.2") {
    return (
      <div className={graphWrapperClass}>
        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
          <div className="text-sm font-black text-purple-900">일차함수의 뜻과 그래프</div>
          <div className="mt-2 space-y-2 text-xs font-bold leading-relaxed text-slate-700">
            <div className="rounded-xl bg-white px-3 py-2">y = ax + b 꼴로 나타나는 함수를 일차함수라고 합니다.</div>
            <div className="rounded-xl bg-white px-3 py-2">그래프는 직선이며, a는 기울기, b는 y절편입니다.</div>
          </div>
        </div>
        <LinearConceptGraph a={2} b={1} label="y = 2x + 1" showIntercept />
      </div>
    );
  }

  if (unitKey === "4.3a") {
    return (
      <div className={graphWrapperClass}>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="text-sm font-black text-amber-900">x절편과 y절편</div>
          <div className="mt-2 space-y-2 text-xs font-bold leading-relaxed text-slate-700">
            <div className="rounded-xl bg-white px-3 py-2">x절편은 y=0일 때, y절편은 x=0일 때 확인합니다.</div>
            <div className="rounded-xl bg-white px-3 py-2">y = 2x - 4의 x절편은 2, y절편은 -4입니다.</div>
          </div>
        </div>
        <LinearConceptGraph a={2} b={-4} label="y = 2x - 4" showIntercept showXIntercept />
      </div>
    );
  }

  if (unitKey === "4.3b") {
    return (
      <div className={graphWrapperClass}>
        <div className={panelClass}>
          <div className="flex items-center justify-between text-sm font-black text-slate-800">
            <span>a값 조절</span>
            <span className="rounded-xl bg-blue-50 px-3 py-1 text-blue-700">a = {formatValue(a)}</span>
          </div>
          <input type="range" min="-4" max="4" step="0.5" value={a} onChange={(e) => setA(Number(e.target.value))} className="mt-3 w-full accent-blue-600" />
          <div className="mt-2 text-xs font-bold text-slate-600">a가 양수이면 오른쪽 위로, 음수이면 오른쪽 아래로 향합니다.</div>
        </div>
        <LinearConceptGraph a={a} b={0} label={`y = ${formatValue(a)}x`} showSlope />
      </div>
    );
  }

  if (unitKey === "4.4") {
    return (
      <div className={graphWrapperClass}>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="text-sm font-black text-emerald-900">그래프의 성질</div>
          <div className="mt-2 space-y-2 text-xs font-bold leading-relaxed text-slate-700">
            <div className="rounded-xl bg-white px-3 py-2">기울기가 같으면 두 직선은 서로 평행하거나 일치합니다.</div>
            <div className="rounded-xl bg-white px-3 py-2">y절편이 다르면 같은 기울기의 직선이 위아래로 이동합니다.</div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <LinearConceptGraph a={2} b={1} label="y = 2x + 1" />
          <LinearConceptGraph a={2} b={-2} label="y = 2x - 2" />
        </div>
      </div>
    );
  }

  if (unitKey === "4.5") {
    return (
      <div className={graphWrapperClass}>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <div className="text-sm font-black text-rose-900">일차함수의 식 구하기</div>
          <div className="mt-2 space-y-2 text-xs font-bold leading-relaxed text-slate-700">
            <div className="rounded-xl bg-white px-3 py-2">기울기와 y절편을 알면 y=ax+b에 바로 대입합니다.</div>
            <div className="rounded-xl bg-white px-3 py-2">두 점이 주어지면 먼저 기울기를 구합니다.</div>
          </div>
        </div>
        <LinearConceptGraph a={2} b={1} label="두 점을 지나는 직선" highlightPoints={[{ x: 0, y: 1, label: "(0,1)" }, { x: 2, y: 5, label: "(2,5)" }]} showIntercept />
      </div>
    );
  }

  if (unitKey === "4.6") {
    return (
      <div className={graphWrapperClass}>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="text-sm font-black text-indigo-900">교점은 연립방정식의 해</div>
          <div className="mt-2 space-y-2 text-xs font-bold leading-relaxed text-slate-700">
            <div className="rounded-xl bg-white px-3 py-2">두 직선이 만나는 점의 좌표는 두 식을 동시에 만족합니다.</div>
            <div className="rounded-xl bg-white px-3 py-2">교점의 개수는 연립방정식 해의 개수와 연결됩니다.</div>
          </div>
        </div>
        <TwoLineConceptGraph />
      </div>
    );
  }

  return null;
}

function LinearConceptGraph({ a, b, label = "", showIntercept = false, showXIntercept = false, showSlope = false, highlightPoints = [] }) {
  const size = 320;
  const padding = 28;
  const minX = -6;
  const maxX = 6;
  const minY = -6;
  const maxY = 8;
  const plotW = size - padding * 2;
  const plotH = size - padding * 2;
  const toX = (x) => padding + ((x - minX) / (maxX - minX)) * plotW;
  const toY = (y) => padding + plotH - ((y - minY) / (maxY - minY)) * plotH;
  const xTicks = Array.from({ length: maxX - minX + 1 }, (_, i) => minX + i);
  const yTicks = Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i);
  const linePath = `M ${toX(minX)} ${toY(a * minX + b)} L ${toX(maxX)} ${toY(a * maxX + b)}`;
  const xIntercept = a === 0 ? null : -b / a;
  const clipId = `linear-concept-clip-${label.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {label && <div className="mb-2 text-xs font-black text-slate-700">{label}</div>}
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full rounded-xl bg-slate-50">
        <defs><clipPath id={clipId}><rect x={padding} y={padding} width={plotW} height={plotH} /></clipPath></defs>
        {xTicks.map((x) => <line key={`lcx-${label}-${x}`} x1={toX(x)} y1={padding} x2={toX(x)} y2={padding + plotH} stroke={x === 0 ? "#64748b" : "#e5e7eb"} strokeWidth={x === 0 ? 1.8 : 1} />)}
        {yTicks.map((y) => <line key={`lcy-${label}-${y}`} x1={padding} y1={toY(y)} x2={padding + plotW} y2={toY(y)} stroke={y === 0 ? "#64748b" : "#e5e7eb"} strokeWidth={y === 0 ? 1.8 : 1} />)}
        <path d={linePath} clipPath={`url(#${clipId})`} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
        {showIntercept && b >= minY && b <= maxY && (
          <g>
            <circle cx={toX(0)} cy={toY(b)} r="5" fill="#ef4444" />
            <text x={toX(0) + 6} y={toY(b) - 6} fontSize="10" fill="#ef4444" fontWeight="900">(0, {formatValue(b)})</text>
          </g>
        )}
        {showXIntercept && xIntercept !== null && xIntercept >= minX && xIntercept <= maxX && (
          <g>
            <circle cx={toX(xIntercept)} cy={toY(0)} r="5" fill="#f97316" />
            <text x={toX(xIntercept) + 6} y={toY(0) + 16} fontSize="10" fill="#ea580c" fontWeight="900">({formatValue(xIntercept)}, 0)</text>
          </g>
        )}
        {showSlope && (
          <g>
            <circle cx={toX(0)} cy={toY(b)} r="4" fill="#8b5cf6" />
            <circle cx={toX(1)} cy={toY(a + b)} r="4" fill="#8b5cf6" />
            <line x1={toX(0)} y1={toY(b)} x2={toX(1)} y2={toY(a + b)} stroke="#8b5cf6" strokeWidth="2" />
            <text x={toX(0.45)} y={toY((a + b + b) / 2) - 8} fontSize="10" fill="#7c3aed" fontWeight="900">기울기 {formatValue(a)}</text>
          </g>
        )}
        {highlightPoints.map((pt, idx) => (
          <g key={idx}>
            <circle cx={toX(pt.x)} cy={toY(pt.y)} r="5" fill="#f97316" />
            <text x={toX(pt.x) + 6} y={toY(pt.y) - 6} fontSize="10" fill="#ea580c" fontWeight="900">{pt.label}</text>
          </g>
        ))}
        <text x={padding + plotW - 12} y={toY(0) - 8} fontSize="12" fontWeight="800" fill="#334155">x</text>
        <text x={toX(0) + 6} y={padding + 14} fontSize="12" fontWeight="800" fill="#334155">y</text>
      </svg>
    </div>
  );
}

function SimpleTableVisual({ title, rows }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 text-xs font-black text-slate-700">{title}</div>
      <table className="w-full border-collapse overflow-hidden rounded-xl text-center text-xs font-bold text-slate-700">
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={`border border-slate-200 px-2 py-2 ${cellIndex === 0 ? "bg-blue-50 text-blue-800" : "bg-white"}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TwoLineConceptGraph() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      <LinearConceptGraph a={1} b={1} label="y = x + 1" />
      <LinearConceptGraph a={-1} b={3} label="y = -x + 3 · 교점 (1,2)" highlightPoints={[{ x: 1, y: 2, label: "교점 (1,2)" }]} />
    </div>
  );
}

function Middle3ConceptVisual({ unitKey, compact = false }) {
  const [a, setA] = useState(1);
  const [p, setP] = useState(0);
  const [q, setQ] = useState(0);
  const safeA = a === 0 ? 1 : a;
  const panelClass = compact ? "rounded-2xl border border-slate-200 bg-slate-50 p-3" : "rounded-2xl border border-slate-200 bg-slate-50 p-4";
  const graphWrapperClass = compact ? "grid gap-3" : "grid gap-4";

  if (unitKey === "4.1") {
    return (
      <div className={graphWrapperClass}>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="text-sm font-black text-blue-900">이차함수는 포물선으로 나타나요</div>
          <div className="mt-2 space-y-2 text-xs font-bold leading-relaxed text-slate-700">
            <div className="rounded-xl bg-white px-3 py-2">예: y=x², y=2x²-3x+1, y=-(x-2)²+4</div>
            <div className="rounded-xl bg-white px-3 py-2">주의: y=2x+1, y=3/x는 이차함수가 아닙니다.</div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <QuadraticGraphPlane a={1} p={0} q={0} label="기본형: y = x²" showAxisLine={false} />
          <QuadraticGraphPlane a={1} p={2} q={-1} label="예: y = (x-2)² - 1" showAxisLine={false} />
        </div>
      </div>
    );
  }

  if (unitKey === "4.2") {
    return (
      <div className={graphWrapperClass}>
        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
          <div className="text-sm font-black text-purple-900">y=x²와 y=-x² 비교</div>
          <div className="mt-2 space-y-2 text-xs font-bold leading-relaxed text-slate-700">
            <div className="rounded-xl bg-white px-3 py-2">y=x²: 원점을 지나고 아래로 볼록합니다.</div>
            <div className="rounded-xl bg-white px-3 py-2">y=-x²: 원점을 지나고 위로 볼록합니다.</div>
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">두 그래프는 서로 x축에 대칭입니다.</div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <QuadraticGraphPlane a={1} p={0} q={0} label="y = x²" showAxisLine={false} />
          <QuadraticGraphPlane a={-1} p={0} q={0} label="y = -x²" showAxisLine={false} />
        </div>
      </div>
    );
  }

  if (unitKey === "4.3") {
    return (
      <div className={graphWrapperClass}>
        <div className={panelClass}>
          <div className="flex items-center justify-between text-sm font-black text-slate-800"><span>a값 조절</span><span className="rounded-xl bg-blue-50 px-3 py-1 text-blue-700">a={formatValue(a)}</span></div>
          <input type="range" min="-4" max="4" step="0.5" value={a} onChange={(e) => setA(Number(e.target.value))} className="mt-3 w-full accent-blue-600" />
          <div className="mt-2 text-xs font-bold text-slate-600">{a > 0 ? "아래로 볼록" : a < 0 ? "위로 볼록" : "a는 0이 아니어야 합니다."} · |a|가 클수록 폭이 좁아집니다.</div>
        </div>
        <QuadraticGraphPlane a={safeA} p={0} q={0} label={`y = ${formatValue(safeA)}x²`} />
      </div>
    );
  }

  if (unitKey === "4.4") {
    return (
      <div className={graphWrapperClass}>
        <div className={panelClass}>
          <div className="text-sm font-black text-slate-800">a, q 조절</div>
          <div className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-800">y = {formatValue(safeA)}x² {q >= 0 ? "+" : "-"} {formatValue(Math.abs(q))}</div>
          <label className="mt-3 block text-xs font-black text-slate-600">a값</label>
          <input type="range" min="-4" max="4" step="0.5" value={a} onChange={(e) => setA(Number(e.target.value))} className="w-full accent-blue-600" />
          <label className="mt-3 block text-xs font-black text-slate-600">q값</label>
          <input type="range" min="-5" max="5" step="1" value={q} onChange={(e) => setQ(Number(e.target.value))} className="w-full accent-purple-600" />
          <div className="mt-2 text-xs font-bold text-slate-600">꼭짓점: <span className="text-rose-600">(0, {formatValue(q)})</span></div>
        </div>
        <QuadraticGraphPlane a={safeA} p={0} q={q} label="y = ax² + q" />
      </div>
    );
  }

  if (unitKey === "4.5") {
    return (
      <div className={graphWrapperClass}>
        <div className={panelClass}>
          <div className="text-sm font-black text-slate-800">a, p 조절</div>
          <div className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-800">y = {formatValue(safeA)}(x - {formatValue(p)})²</div>
          <label className="mt-3 block text-xs font-black text-slate-600">a값</label>
          <input type="range" min="-4" max="4" step="0.5" value={a} onChange={(e) => setA(Number(e.target.value))} className="w-full accent-blue-600" />
          <label className="mt-3 block text-xs font-black text-slate-600">p값</label>
          <input type="range" min="-4" max="4" step="1" value={p} onChange={(e) => setP(Number(e.target.value))} className="w-full accent-purple-600" />
          <div className="mt-2 text-xs font-bold text-slate-600">축: <span className="text-purple-700">x={formatValue(p)}</span> · 꼭짓점: <span className="text-rose-600">({formatValue(p)}, 0)</span></div>
        </div>
        <QuadraticGraphPlane a={safeA} p={p} q={0} label="y = a(x-p)²" />
      </div>
    );
  }

  if (unitKey === "4.6") {
    return (
      <div className={graphWrapperClass}>
        <div className={panelClass}>
          <div className="text-sm font-black text-slate-800">a, p, q 조절</div>
          <div className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-800">y = {formatValue(safeA)}(x - {formatValue(p)})² {q >= 0 ? "+" : "-"} {formatValue(Math.abs(q))}</div>
          <label className="mt-3 block text-xs font-black text-slate-600">a값</label>
          <input type="range" min="-4" max="4" step="0.5" value={a} onChange={(e) => setA(Number(e.target.value))} className="w-full accent-blue-600" />
          <label className="mt-3 block text-xs font-black text-slate-600">p값</label>
          <input type="range" min="-4" max="4" step="1" value={p} onChange={(e) => setP(Number(e.target.value))} className="w-full accent-purple-600" />
          <label className="mt-3 block text-xs font-black text-slate-600">q값</label>
          <input type="range" min="-5" max="5" step="1" value={q} onChange={(e) => setQ(Number(e.target.value))} className="w-full accent-rose-600" />
          <div className="mt-2 text-xs font-bold text-slate-600">축: <span className="text-purple-700">x={formatValue(p)}</span> · 꼭짓점: <span className="text-rose-600">({formatValue(p)}, {formatValue(q)})</span></div>
        </div>
        <QuadraticGraphPlane a={safeA} p={p} q={q} label="y = a(x-p)² + q" />
      </div>
    );
  }

  if (unitKey === "4.7") {
    const b = -2 * safeA * p;
    const c = safeA * p * p + q;
    return (
      <div className={graphWrapperClass}>
        <div className={panelClass}>
          <div className="text-sm font-black text-slate-800">표준형 ↔ 일반형 연결</div>
          <div className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-black leading-relaxed text-slate-700">
            <div>표준형: y = {formatValue(safeA)}(x - {formatValue(p)})² {q >= 0 ? "+" : "-"} {formatValue(Math.abs(q))}</div>
            <div className="mt-1 text-blue-700">일반형: y = {formatValue(safeA)}x² {b >= 0 ? "+" : "-"} {formatValue(Math.abs(b))}x {c >= 0 ? "+" : "-"} {formatValue(Math.abs(c))}</div>
          </div>
          <label className="mt-3 block text-xs font-black text-slate-600">a값</label>
          <input type="range" min="-4" max="4" step="0.5" value={a} onChange={(e) => setA(Number(e.target.value))} className="w-full accent-blue-600" />
          <label className="mt-3 block text-xs font-black text-slate-600">p값</label>
          <input type="range" min="-4" max="4" step="1" value={p} onChange={(e) => setP(Number(e.target.value))} className="w-full accent-purple-600" />
          <label className="mt-3 block text-xs font-black text-slate-600">q값</label>
          <input type="range" min="-5" max="5" step="1" value={q} onChange={(e) => setQ(Number(e.target.value))} className="w-full accent-rose-600" />
          <div className="mt-2 text-xs font-bold text-slate-600">축: <span className="text-purple-700">x={formatValue(p)}</span> · y절편: <span className="text-emerald-700">(0, {formatValue(c)})</span></div>
        </div>
        <QuadraticGraphPlane a={safeA} p={p} q={q} label="y = ax² + bx + c" />
      </div>
    );
  }

  return null;
}

function QuadraticGraphPlane({ a, p, q, label = "", showVertex = true, showAxisLine = true }) {
  const size = 360;
  const padding = 18;
  const minX = -5;
  const maxX = 5;
  const minY = -5;
  const maxY = 5;
  const plotW = size - padding * 2;
  const plotH = size - padding * 2;
  const clipId = `quad-concept-clip-${label.replace(/[^a-zA-Z0-9]/g, "") || "default"}`;
  const toX = (x) => padding + ((x - minX) / (maxX - minX)) * plotW;
  const toY = (y) => padding + plotH - ((y - minY) / (maxY - minY)) * plotH;
  const xs = Array.from({ length: 501 }, (_, i) => minX + ((maxX - minX) * i) / 500);
  const path = xs
    .map((x) => ({ x, y: a * (x - p) * (x - p) + q }))
    .filter((point) => Number.isFinite(point.y))
    .map((point, index) => `${index === 0 ? "M" : "L"} ${toX(point.x)} ${toY(point.y)}`)
    .join(" ");
  const ticks = Array.from({ length: 21 }, (_, index) => -5 + index * 0.5);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
      {label && <div className="mb-1 shrink-0 truncate px-1 text-xs font-black text-slate-700">{label}</div>}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-1">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full rounded-xl bg-slate-50" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id={clipId}>
              <rect x={padding} y={padding} width={plotW} height={plotH} />
            </clipPath>
          </defs>

          <rect x={padding} y={padding} width={plotW} height={plotH} fill="white" stroke="#e2e8f0" strokeWidth="1" />

          {ticks.map((tick) => {
            const fixed = Number(tick.toFixed(2));
            const isAxis = Math.abs(fixed) < 1e-9;
            const isMajor = Number.isInteger(fixed);
            return (
              <g key={`quad-grid-${label}-${fixed}`}>
                <line x1={toX(fixed)} y1={padding} x2={toX(fixed)} y2={padding + plotH} stroke={isAxis ? "#64748b" : isMajor ? "#d1d5db" : "#e5e7eb"} strokeWidth={isAxis ? 2 : 1} />
                <line x1={padding} y1={toY(fixed)} x2={padding + plotW} y2={toY(fixed)} stroke={isAxis ? "#64748b" : isMajor ? "#d1d5db" : "#e5e7eb"} strokeWidth={isAxis ? 2 : 1} />
                {isMajor && fixed !== 0 && (
                  <>
                    <text x={toX(fixed) - 5} y={toY(0) + 15} fontSize="10" fill="#64748b">{fixed}</text>
                    <text x={toX(0) + 7} y={toY(fixed) + 4} fontSize="10" fill="#64748b">{fixed}</text>
                  </>
                )}
              </g>
            );
          })}

          {showAxisLine && p >= minX && p <= maxX && <line x1={toX(p)} y1={padding} x2={toX(p)} y2={padding + plotH} stroke="#a855f7" strokeDasharray="6 6" strokeWidth="2" />}
          <path d={path} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${clipId})`} />

          {showVertex && p >= minX && p <= maxX && q >= minY && q <= maxY && (
            <g>
              <circle cx={toX(p)} cy={toY(q)} r="6" fill="#f97316" />
              <text x={toX(p) + 8} y={toY(q) - 8} fontSize="11" fontWeight="900" fill="#ea580c">({formatValue(p)}, {formatValue(q)})</text>
            </g>
          )}
          <text x={padding + plotW - 10} y={toY(0) - 8} fontSize="14" fontWeight="900" fill="#334155">x</text>
          <text x={toX(0) + 8} y={padding + 16} fontSize="14" fontWeight="900" fill="#334155">y</text>
        </svg>
      </div>
    </div>
  );
}

function GradeExtensionGame({ grade, awardPoints, expPoints }) {
  const data = gradeExtensionData[grade];

  if (grade === "middle2") {
    return (
      <div className="grid h-full grid-rows-[46px_1fr] gap-2 overflow-hidden rounded-[2rem] border border-blue-100 bg-white/90 p-2 shadow-sm">
        <div className="flex items-center justify-between rounded-[1.25rem] bg-blue-50/70 px-3">
          <div className="text-sm font-black text-blue-900">일차함수 레이저 슈터 · 게임 전용 점수</div>
          <div className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-amber-700 shadow-sm">
            전체 탐험 포인트와 연동되지 않음
          </div>
        </div>
        <div className="min-h-0 overflow-hidden rounded-[1.5rem]">
          <LinearLaserShooterGame />
        </div>
      </div>
    );
  }

  if (grade === "middle3") {
    return (
      <div className="grid h-full grid-rows-[46px_1fr] gap-2 overflow-hidden rounded-[2rem] border border-purple-100 bg-white/90 p-2 shadow-sm">
        <div className="flex items-center justify-between rounded-[1.25rem] bg-purple-50/80 px-3">
          <div className="text-sm font-black text-purple-900">포물선 마스터 · 게임 전용 점수</div>
          <div className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-amber-700 shadow-sm">
            전체 탐험 포인트와 연동되지 않음
          </div>
        </div>
        <div className="min-h-0 overflow-hidden rounded-[1.5rem]">
          <ParabolaMasterGame />
        </div>
      </div>
    );
  }

  return <GradeQuickFunctionQuiz data={data} awardPoints={awardPoints} expPoints={expPoints} />;
}

function ParabolaMasterGame() {
  const levels = [
    {
      id: 1,
      title: "기본형 그래프와 폭 (y = ax²)",
      desc: "원점을 꼭짓점으로 하는 기본적인 이차함수입니다. 계수 a만 조절하여 타겟을 맞추어 보세요.",
      hint: "a>0이면 아래로 볼록, a<0이면 위로 볼록입니다. |a|가 클수록 폭이 좁아집니다.",
      locked: ["p", "q"],
      target: { x: 3, y: 4.5, radius: 0.7 },
      start: { a: 1.5, p: 0, q: 0 },
      points: ["식: y = 0.5x²", "원점 (0,0)을 꼭짓점으로 가집니다.", "a가 양수이므로 아래로 볼록합니다."],
    },
    {
      id: 2,
      title: "y축 방향 평행이동 (y = ax² + q)",
      desc: "a와 q를 조절해 포물선이 타겟을 지나가도록 만들어 보세요.",
      hint: "y=ax²+q의 꼭짓점은 (0,q)입니다.",
      locked: ["p"],
      target: { x: 2, y: -2, radius: 0.7 },
      start: { a: 0.5, p: 0, q: 4 },
      points: ["예상식: y = -x² + 2", "꼭짓점은 (0,2)입니다.", "a가 음수이므로 위로 볼록합니다."],
    },
    {
      id: 3,
      title: "x축 방향 평행이동 (y = a(x-p)²)",
      desc: "a와 p를 조절해 좌우로 이동한 포물선을 설계하세요.",
      hint: "y=a(x-p)²의 꼭짓점은 (p,0), 축은 x=p입니다.",
      locked: ["q"],
      target: { x: 5, y: 2, radius: 0.7 },
      start: { a: 0.5, p: 1, q: 0 },
      points: ["예상식: y = 2(x-4)²", "꼭짓점은 (4,0)입니다.", "대칭축은 x=4입니다."],
    },
    {
      id: 4,
      title: "표준형 평행이동 마스터 (y = a(x-p)² + q)",
      desc: "a, p, q를 모두 조절해 꼭짓점과 그래프 폭을 설계하세요.",
      hint: "표준형 y=a(x-p)²+q에서 꼭짓점은 항상 (p,q)입니다.",
      locked: [],
      target: { x: 6, y: 5, radius: 0.7 },
      start: { a: 0.5, p: 0, q: 0 },
      points: ["예상식: y = (x-4)² + 1", "꼭짓점은 (4,1)입니다.", "대칭축은 x=4입니다."],
    },
    {
      id: 5,
      title: "마지막 시험: 거대한 벽 너머로 발사!",
      desc: "장벽을 넘고 타겟을 맞히도록 포물선을 설계하세요.",
      hint: "장벽을 넘으려면 꼭짓점 q를 높이고, a의 절댓값을 조절해 곡선을 완만하게 만드세요.",
      locked: [],
      target: { x: 7, y: 2, radius: 0.7 },
      obstacle: { x: 3, minY: -10, maxY: 4 },
      start: { a: -0.5, p: 2, q: 3 },
      points: ["예상식: y = -0.25(x-3)² + 6", "꼭짓점은 (3,6)입니다.", "장벽 높이 4보다 위로 지나갑니다."],
    },
  ];

  const [levelIndex, setLevelIndex] = useState(0);
  const [values, setValues] = useState(levels[0].start);
  const [gameScore, setGameScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("슬라이더를 조절한 뒤 포물선 발사를 눌러 보세요.");
  const [modal, setModal] = useState(null);
  const level = levels[levelIndex];
  const size = 520;
  const padding = 34;
  const min = -10;
  const max = 10;
  const plot = size - padding * 2;
  const toX = (x) => padding + ((x - min) / (max - min)) * plot;
  const toY = (y) => padding + plot - ((y - min) / (max - min)) * plot;
  const yOf = (x) => values.a * Math.pow(x - values.p, 2) + values.q;
  const path = Array.from({ length: 501 }, (_, i) => min + ((max - min) * i) / 500)
    .map((x, index) => `${index === 0 ? "M" : "L"} ${toX(x)} ${toY(yOf(x))}`)
    .join(" ");
  const ticks = Array.from({ length: 21 }, (_, i) => -10 + i);
  const expression = `y = ${values.a === 1 ? "" : values.a === -1 ? "-" : formatValue(values.a)}(x ${values.p >= 0 ? "-" : "+"} ${formatValue(Math.abs(values.p))})² ${values.q >= 0 ? "+" : "-"} ${formatValue(Math.abs(values.q))}`;
  const targetY = yOf(level.target.x);
  const targetDistance = Math.abs(targetY - level.target.y);
  const obstaclePass = !level.obstacle || yOf(level.obstacle.x) > level.obstacle.maxY;
  const isHit = targetDistance <= level.target.radius && obstaclePass;

  const resetLevel = (index = levelIndex) => {
    setValues(levels[index].start);
    setAttempts(0);
    setMessage("슬라이더를 조절한 뒤 포물선 발사를 눌러 보세요.");
    setModal(null);
  };

  const moveLevel = (index) => {
    setLevelIndex(index);
    setValues(levels[index].start);
    setAttempts(0);
    setMessage("새 단계가 시작되었습니다. 타겟을 맞혀 보세요.");
    setModal(null);
  };

  const fire = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (isHit) {
      const bonus = Math.max(60, 140 - nextAttempts * 10);
      setGameScore((prev) => prev + bonus);
      setModal({ type: "success", title: "완벽한 명중입니다!", desc: `게임 점수 +${bonus}점`, points: level.points });
      setMessage("성공! 다음 단계로 이동할 수 있습니다.");
    } else if (level.obstacle && !obstaclePass) {
      setMessage("💥 장벽에 충돌했습니다. q를 높이거나 a를 조절해 장벽 위로 지나가게 해보세요.");
    } else {
      setMessage(`타겟과의 y값 차이: ${formatValue(targetDistance)}. a, p, q를 다시 조절해 보세요.`);
    }
  };

  const setParam = (name, value) => {
    if (level.locked.includes(name)) return;
    const numeric = Number(value);
    setValues((prev) => ({ ...prev, [name]: name === "a" && Math.abs(numeric) < 0.05 ? 0.1 : numeric }));
  };

  return (
    <div className="grid h-full min-h-0 gap-3 overflow-hidden bg-slate-50 p-2 text-slate-800 xl:grid-cols-[1.35fr_0.95fr]">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-md">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-purple-900">포물선 마스터: 타겟을 맞춰라!</h3>
            <p className="text-[11px] font-bold text-slate-600">중3 이차함수와 그래프 인터랙티브 시뮬레이션 게임</p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">게임 점수 {gameScore}점</div>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-slate-50 p-2">
          <svg viewBox={`0 0 ${size} ${size}`} className="h-full max-h-full w-auto rounded-2xl bg-white shadow-inner">
            <defs><clipPath id="parabola-master-clip"><rect x={padding} y={padding} width={plot} height={plot} /></clipPath></defs>
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={toX(tick)} y1={padding} x2={toX(tick)} y2={padding + plot} stroke={tick === 0 ? "#1e293b" : "#cbd5e1"} strokeWidth={tick === 0 ? 2.3 : 1} />
                <line x1={padding} y1={toY(tick)} x2={padding + plot} y2={toY(tick)} stroke={tick === 0 ? "#1e293b" : "#cbd5e1"} strokeWidth={tick === 0 ? 2.3 : 1} />
                {tick !== 0 && tick % 2 === 0 && <text x={toX(tick) - 5} y={toY(0) + 16} fontSize="10" fill="#475569">{tick}</text>}
                {tick !== 0 && tick % 2 === 0 && <text x={toX(0) + 7} y={toY(tick) + 4} fontSize="10" fill="#475569">{tick}</text>}
              </g>
            ))}
            {level.obstacle && (
              <g>
                <rect x={toX(level.obstacle.x) - 6} y={toY(level.obstacle.maxY)} width="12" height={toY(level.obstacle.minY) - toY(level.obstacle.maxY)} fill="#ef4444" opacity="0.65" />
                <text x={toX(level.obstacle.x) - 34} y={toY(level.obstacle.maxY) - 8} fontSize="11" fontWeight="900" fill="#b91c1c">위험 장벽</text>
              </g>
            )}
            <line x1={toX(values.p)} y1={padding} x2={toX(values.p)} y2={padding + plot} stroke="#a855f7" strokeDasharray="6 6" strokeWidth="2" />
            <path d={path} clipPath="url(#parabola-master-clip)" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" />
            <circle cx={toX(values.p)} cy={toY(values.q)} r="6" fill="#f97316" />
            <text x={toX(values.p) + 8} y={toY(values.q) - 8} fontSize="11" fontWeight="900" fill="#ea580c">꼭짓점 ({formatValue(values.p)}, {formatValue(values.q)})</text>
            <g>
              <circle cx={toX(level.target.x)} cy={toY(level.target.y)} r="17" fill="#ec4899" opacity="0.18" />
              <path d={`M ${toX(level.target.x)} ${toY(level.target.y) - 18} L ${toX(level.target.x) + 5} ${toY(level.target.y) - 5} L ${toX(level.target.x) + 18} ${toY(level.target.y) - 5} L ${toX(level.target.x) + 7} ${toY(level.target.y) + 3} L ${toX(level.target.x) + 12} ${toY(level.target.y) + 17} L ${toX(level.target.x)} ${toY(level.target.y) + 8} L ${toX(level.target.x) - 12} ${toY(level.target.y) + 17} L ${toX(level.target.x) - 7} ${toY(level.target.y) + 3} L ${toX(level.target.x) - 18} ${toY(level.target.y) - 5} L ${toX(level.target.x) - 5} ${toY(level.target.y) - 5} Z`} fill="#db2777" />
              <text x={toX(level.target.x) + 18} y={toY(level.target.y) - 18} fontSize="12" fontWeight="900" fill="#be185d">타겟 ({level.target.x}, {level.target.y})</text>
            </g>
            <text x={padding + plot - 12} y={toY(0) - 8} fontSize="14" fontWeight="900" fill="#334155">x</text>
            <text x={toX(0) + 8} y={padding + 16} fontSize="14" fontWeight="900" fill="#334155">y</text>
          </svg>
        </div>
        <div className="mt-2 grid shrink-0 grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-2 text-center text-[11px] font-black text-slate-700">
          <div>시작점: (0,0)</div>
          <div>꼭짓점: ({formatValue(values.p)}, {formatValue(values.q)})</div>
          <div>타겟: ({level.target.x}, {level.target.y})</div>
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-md">
        <div className="shrink-0 rounded-2xl bg-gradient-to-b from-indigo-50 to-purple-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700">레벨 {level.id}</span>
            <span className="text-xs font-black text-slate-600">시도 횟수 {attempts}회</span>
          </div>
          <h3 className="text-lg font-black leading-tight text-slate-900">{level.title}</h3>
          <p className="mt-1 text-xs font-bold leading-snug text-slate-700">{level.desc}</p>
          <div className="mt-2 rounded-2xl bg-white px-3 py-2 text-[11px] font-bold leading-snug text-slate-700">💡 {level.hint}</div>
        </div>

        <div className="shrink-0 rounded-2xl bg-slate-950 p-3 text-center text-white">
          <div className="text-[11px] font-bold text-purple-200">실시간 설계된 이차함수 식</div>
          <div className="mt-1 text-xl font-black tracking-wide">{expression}</div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <ParabolaControl label="그래프의 모양과 폭 a" name="a" value={values.a} min={-3} max={3} step={0.05} locked={level.locked.includes("a")} onChange={setParam} />
          <ParabolaControl label="x축 방향 평행이동 p" name="p" value={values.p} min={-8} max={8} step={0.5} locked={level.locked.includes("p")} onChange={setParam} />
          <ParabolaControl label="y축 방향 평행이동 q" name="q" value={values.q} min={-8} max={8} step={0.5} locked={level.locked.includes("q")} onChange={setParam} />
        </div>

        <div className="shrink-0 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold leading-snug text-amber-900">{message}</div>
        <div className="grid shrink-0 grid-cols-[1fr_2fr] gap-3">
          <button onClick={() => resetLevel()} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">재시도</button>
          <button onClick={fire} className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-purple-100 hover:from-purple-500 hover:to-indigo-500">🚀 포물선 발사!</button>
        </div>
      </div>

      {modal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
            <div className="mb-3 text-5xl">🌟</div>
            <h3 className="text-2xl font-black text-slate-900">{modal.title}</h3>
            <p className="mt-1 text-sm font-black text-purple-700">{modal.desc}</p>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-left text-sm font-bold text-slate-700">
              {modal.points.map((point) => <div key={point}>• {point}</div>)}
            </div>
            <button
              onClick={() => {
                if (levelIndex < levels.length - 1) moveLevel(levelIndex + 1);
                else {
                  setModal({ title: "포물선 마스터 등극!", desc: `최종 게임 점수 ${gameScore}점`, points: ["모든 포물선 미션을 완료했습니다.", "이 게임 점수는 전체 탐험 포인트와 연동되지 않습니다."] });
                  setTimeout(() => moveLevel(0), 1800);
                }
              }}
              className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white shadow-lg shadow-emerald-100"
            >
              {levelIndex < levels.length - 1 ? "다음 단계 도전하기" : "처음부터 다시 도전하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ParabolaControl({ label, name, value, min, max, step, locked, onChange }) {
  return (
    <div className={`rounded-2xl border bg-white p-2.5 ${locked ? "border-rose-100 opacity-60" : "border-slate-100"}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-black text-slate-700">
        <span>{label} {locked && <span className="ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">잠김</span>}</span>
        <span className="rounded-xl bg-slate-50 px-2.5 py-0.5 text-purple-700">{formatValue(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={locked} onChange={(event) => onChange(name, event.target.value)} className="w-full accent-purple-600" />
      <div className="mt-0.5 flex justify-between text-[10px] font-bold text-slate-400"><span>{min}</span><span>{max}</span></div>
    </div>
  );
}

function GradeExtensionExplore({ grade, completeMission, isMissionComplete, reflection, onSaveReflection }) {
  const data = gradeExtensionData[grade];
  const [a, setA] = useState(data.explore.defaultA || 1);
  const [b, setB] = useState(data.explore.defaultB || 0);
  const [p, setP] = useState(0);
  const [q, setQ] = useState(0);
  const isMiddle3 = grade === "middle3";
  const safeA = a === 0 ? 1 : a;
  const title = isMiddle3 ? "이차함수 그래프 탐구 시뮬레이터" : "일차함수 그래프 탐구 시뮬레이터";
  const expression = isMiddle3
    ? `y = ${formatValue(safeA)}(x ${p >= 0 ? "-" : "+"} ${formatValue(Math.abs(p))})² ${q >= 0 ? "+" : "-"} ${formatValue(Math.abs(q))}`
    : `y = ${formatValue(a)}x ${b >= 0 ? "+" : "-"} ${formatValue(Math.abs(b))}`;

  return (
    <Card className="h-full overflow-hidden p-5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-black text-blue-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">슬라이더를 조정하며 식과 그래프가 변하는 형태를 한눈에 관찰하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <MissionStatusBadge done={isMissionComplete("explore")} />
          <button
            onClick={() => completeMission("explore", 20)}
            disabled={isMissionComplete("explore")}
            className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-green-100 disabled:bg-green-100 disabled:text-green-700"
          >
            {isMissionComplete("explore") ? "탐구 완료" : "탐구 완료 +20P"}
          </button>
        </div>
      </div>

      <div className="grid h-[calc(100%-86px)] min-h-0 gap-4 xl:grid-cols-[360px_1fr]">
        <div className="min-h-0 overflow-auto rounded-[1.7rem] border border-blue-100 bg-blue-50/60 p-5">
          <div className="rounded-[1.5rem] bg-slate-950 p-5 text-center text-white shadow-sm">
            <div className="text-xs font-bold text-blue-200">실시간 함수식</div>
            <div className="mt-2 text-3xl font-black tracking-wide">{expression}</div>
          </div>

          <div className="mt-4 space-y-4 rounded-[1.5rem] bg-white p-5 shadow-sm">
            <SliderControl label="기울기 / 폭 a" value={a} setValue={setA} min={data.explore.aMin} max={data.explore.aMax} step={0.2} />
            {!isMiddle3 && <SliderControl label="y절편 b" value={b} setValue={setB} min={data.explore.bMin} max={data.explore.bMax} step={0.5} />}
            {isMiddle3 && (
              <>
                <SliderControl label="좌우 이동 p" value={p} setValue={setP} min={-4} max={4} step={0.5} />
                <SliderControl label="위아래 이동 q" value={q} setValue={setQ} min={-5} max={5} step={0.5} />
              </>
            )}
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-blue-100 bg-white p-4 text-sm font-bold leading-relaxed text-slate-700">
            {isMiddle3 ? (
              <>
                <div>• a의 부호는 포물선의 방향을 결정합니다.</div>
                <div>• |a|가 클수록 포물선의 폭이 좁아집니다.</div>
                <div>• 꼭짓점은 ({formatValue(p)}, {formatValue(q)})입니다.</div>
                <div>• 축의 방정식은 x = {formatValue(p)}입니다.</div>
              </>
            ) : (
              <>
                <div>• a는 기울기입니다.</div>
                <div>• b는 y절편입니다.</div>
                <div>• a가 양수이면 오른쪽 위로, 음수이면 오른쪽 아래로 향합니다.</div>
                <div>• b가 변하면 그래프가 위아래로 평행이동합니다.</div>
              </>
            )}
          </div>
          <div className="mt-4">
            <GraphExplanationBox grade={grade} reflection={reflection} onSave={onSaveReflection} />
          </div>
        </div>

        <div className="min-h-0 overflow-hidden rounded-[1.7rem] border border-blue-100 bg-white p-5">
          {isMiddle3 ? (
            <QuadraticGraphPlane a={safeA} p={p} q={q} label={expression} />
          ) : (
            <LinearExploreGraph a={a} b={b} />
          )}
        </div>
      </div>
    </Card>
  );
}

function SliderControl({ label, value, setValue, min, max, step = 1 }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-black text-slate-700">
        <span>{label}</span>
        <span className="rounded-xl bg-blue-50 px-3 py-1 text-blue-700">{formatValue(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => setValue(Number(event.target.value))} className="w-full accent-blue-600" />
      <div className="mt-1 flex justify-between text-xs font-bold text-slate-400"><span>{min}</span><span>{max}</span></div>
    </div>
  );
}

function LinearExploreGraph({ a, b }) {
  const size = 520;
  const padding = 42;
  const min = -6;
  const max = 6;
  const plotSize = size - padding * 2;
  const toX = (x) => padding + ((x - min) / (max - min)) * plotSize;
  const toY = (y) => padding + plotSize - ((y - min) / (max - min)) * plotSize;
  const candidates = [
    { x: min, y: a * min + b },
    { x: max, y: a * max + b },
  ];
  const path = `M ${toX(candidates[0].x)} ${toY(candidates[0].y)} L ${toX(candidates[1].x)} ${toY(candidates[1].y)}`;
  const ticks = Array.from({ length: 25 }, (_, index) => -6 + index * 0.5);
  return (
    <div className="flex h-full min-h-0 items-center justify-center rounded-2xl bg-slate-50 p-2">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full max-h-full w-auto rounded-2xl bg-white">
        <defs><clipPath id="linear-explore-clip"><rect x={padding} y={padding} width={plotSize} height={plotSize} /></clipPath></defs>
        {ticks.map((tick) => {
          const fixed = Number(tick.toFixed(2));
          const isAxis = Math.abs(fixed) < 1e-9;
          const isMajor = Number.isInteger(fixed);
          return (
            <g key={fixed}>
              <line x1={toX(fixed)} y1={padding} x2={toX(fixed)} y2={padding + plotSize} stroke={isAxis ? "#334155" : isMajor ? "#cbd5e1" : "#e2e8f0"} strokeWidth={isAxis ? 2 : 1} />
              <line x1={padding} y1={toY(fixed)} x2={padding + plotSize} y2={toY(fixed)} stroke={isAxis ? "#334155" : isMajor ? "#cbd5e1" : "#e2e8f0"} strokeWidth={isAxis ? 2 : 1} />
              {isMajor && fixed !== 0 && <text x={toX(fixed) - 5} y={toY(0) + 17} fontSize="11" fill="#64748b">{fixed}</text>}
              {isMajor && fixed !== 0 && <text x={toX(0) + 8} y={toY(fixed) + 4} fontSize="11" fill="#64748b">{fixed}</text>}
            </g>
          );
        })}
        <path d={path} clipPath="url(#linear-explore-clip)" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
        {b >= min && b <= max && <circle cx={toX(0)} cy={toY(b)} r="6" fill="#a855f7" />}
        <text x={padding + plotSize - 12} y={toY(0) - 8} fontSize="14" fontWeight="800" fill="#334155">x</text>
        <text x={toX(0) + 8} y={padding + 16} fontSize="14" fontWeight="800" fill="#334155">y</text>
      </svg>
    </div>
  );
}

function GradeQuickFunctionQuiz({ data, awardPoints, expPoints }) {
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("문제를 읽고 답을 입력하세요.");
  const q = data.gameQuestions[current];
  const check = () => {
    const ok = answer.trim().replaceAll(" ", "") === q.a.replaceAll(" ", "");
    if (ok) {
      awardPoints(10);
      setMessage("정답입니다! +10P");
    } else {
      setMessage(`아쉬워요. 정답 예: ${q.a}`);
    }
  };

  return (
    <Card className="h-full p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-blue-950">{data.gradeLabel} 게임존</h2>
          <p className="mt-1 text-sm text-slate-500">빠른 판별 게임으로 핵심 개념을 점검합니다.</p>
        </div>
        {expPoints !== undefined && <div className="rounded-2xl bg-amber-50 px-5 py-3 text-lg font-black text-amber-700">⭐ {expPoints}P</div>}
      </div>
      <div className="grid h-[calc(100%-84px)] place-items-center">
        <div className="w-full max-w-2xl rounded-[2rem] border border-blue-100 bg-blue-50/60 p-8">
          <div className="inline-block rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700">문제 {current + 1}/{data.gameQuestions.length}</div>
          <h3 className="mt-5 text-2xl font-black text-blue-950">{q.q}</h3>
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="mt-5 w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-xl font-black outline-none" placeholder="답 입력" />
          <div className="mt-4 rounded-2xl bg-amber-50 px-5 py-3 text-sm font-bold text-amber-800">{message}</div>
          <div className="mt-5 flex gap-3">
            <button onClick={check} className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white">정답 확인</button>
            <button onClick={() => { setCurrent((current + 1) % data.gameQuestions.length); setAnswer(""); setMessage("다음 문제에 도전하세요."); }} className="flex-1 rounded-2xl border border-blue-200 bg-white px-5 py-3 font-black text-blue-700">다음 문제</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function LinearLaserShooterGame() {
  const endScriptTag = "</" + "script>";
  const originalHtml = String.raw`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>일차함수 레이저 풍선 터트리기</title>
<script src="https://cdn.tailwindcss.com">__END_SCRIPT__
<style>
@import url('https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;700;900&display=swap');
html,body{height:100%;width:100%;margin:0;overflow:hidden}body{font-family:'Noto Sans KR',sans-serif;background-color:#F0F4F8;user-select:none;-webkit-user-select:none}.fancy-font{font-family:'Jua',sans-serif}input[type=range]{-webkit-appearance:none;width:100%;height:8px;background:#E2E8F0;border-radius:4px;outline:none}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:#3B82F6;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,.2);transition:transform .1s}input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.15)}.btn-fire{box-shadow:0 0 15px rgba(239,68,68,.4);animation:pulse-glow 2s infinite}@keyframes pulse-glow{0%,100%{box-shadow:0 0 12px rgba(239,68,68,.4)}50%{box-shadow:0 0 22px rgba(239,68,68,.8)}}
@media (max-height:760px){body{padding:6px!important}body>div:first-of-type{padding:10px 16px!important;margin-bottom:6px!important;border-radius:18px!important}body>div:first-of-type .text-xl{font-size:1.05rem!important}body>div:first-of-type .text-lg{font-size:.95rem!important}body>div:first-of-type .text-sm{font-size:.78rem!important}body>div:first-of-type .w-9{width:2rem!important;height:2rem!important}body>div:nth-of-type(2){gap:8px!important;margin-bottom:0!important}#canvas-container{padding:8px!important;border-radius:20px!important}.lg\:w-96{width:320px!important}#canvas-container+#canvas-container,body>div:nth-of-type(2)>div:last-child{padding:10px!important;gap:8px!important;border-radius:20px!important;overflow:hidden!important}#mission-desc{font-size:.75rem!important;line-height:1.25!important}#formula-math{font-size:1.75rem!important;line-height:1.1!important}.btn-fire{padding-top:10px!important;padding-bottom:10px!important;font-size:1.45rem!important}#tip-overlay{top:10px!important;left:10px!important;padding:6px 10px!important;font-size:.72rem!important}.rounded-2xl{border-radius:14px!important}.rounded-3xl{border-radius:20px!important}.p-5{padding:10px!important}.p-4{padding:10px!important}.p-3\.5{padding:8px!important}.gap-3{gap:8px!important}}
@media (max-width:1000px){body>div:nth-of-type(2){flex-direction:row!important}.lg\:w-96{width:300px!important;min-width:300px!important}}
</style>
</head>
<body class="h-screen w-screen overflow-hidden flex flex-col items-center p-3">
<div class="w-full max-w-6xl flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-md z-10 mb-2">
<div class="flex items-center gap-3"><div class="bg-blue-600 text-white px-4 py-1 rounded-full fancy-font text-lg tracking-wider shadow-inner">🎈 일차함수 레이저 슈터</div><div class="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold" id="stage-badge">STAGE 1</div></div>
<div class="flex items-center gap-6"><div class="text-slate-600 font-bold text-sm flex items-center gap-1.5"><span>게임 점수:</span><span id="score-val" class="text-xl text-blue-600 fancy-font">0</span></div><div class="text-slate-600 font-bold text-sm flex items-center gap-1.5"><span>남은 미션 풍선:</span><span id="balloon-count" class="text-xl text-red-500 fancy-font">0</span></div><div class="flex gap-1" id="hearts-wrap"><span class="text-xl text-red-500">❤️</span><span class="text-xl text-red-500">❤️</span><span class="text-xl text-red-500">❤️</span></div></div>
<div class="flex items-center gap-2"><button onclick="toggleMute()" id="mute-btn" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-lg flex items-center justify-center transition">🔊</button><button onclick="showHelp()" class="w-9 h-9 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-lg flex items-center justify-center font-bold transition">❓</button><button onclick="restartStage()" class="w-9 h-9 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 text-lg flex items-center justify-center font-bold transition">🔄</button></div>
</div>
<div class="w-full max-w-6xl flex-1 min-h-0 flex flex-row gap-4 items-stretch justify-center overflow-hidden mb-2">
<div class="flex-1 bg-white rounded-3xl p-3 shadow-lg border border-slate-100 flex flex-col relative" id="canvas-container"><div class="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md pointer-events-none z-10" id="tip-overlay">💡 오른쪽 슬라이더를 조절해 레이저 가이드라인을 풍선에 맞춰보세요!</div><div class="flex-1 w-full relative flex items-center justify-center overflow-hidden" id="canvas-wrapper"><canvas id="game-canvas" class="rounded-2xl"></canvas></div></div>
<div class="w-[340px] min-w-[320px] bg-white rounded-3xl p-4 shadow-lg border border-slate-100 flex flex-col justify-between gap-2 overflow-hidden">
<div class="bg-slate-50 rounded-2xl p-3 border border-slate-100"><h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">현재의 미션 목표</h4><p class="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-line" id="mission-desc">로딩 중...</p></div>
<div class="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2 shadow-sm"><span class="text-2xl">⚠️</span><div class="text-[11px] text-amber-900 leading-snug"><span class="font-extrabold block text-xs text-amber-900 mb-1">정밀 격파 주의 사항!</span>경로 위의 <span class="font-extrabold text-blue-600 underline">색깔 있는 미션 풍선만</span> 조준하세요. 회색 풍선이나 헛방은 하트가 줄어듭니다.</div></div>
<div class="bg-blue-50/80 border border-blue-100 rounded-2xl p-3 text-center flex flex-col items-center justify-center relative overflow-hidden"><div class="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-br-lg uppercase tracking-wider">LINEAR FUNCTION</div><div class="text-slate-500 text-xs font-semibold mb-1 mt-1">레이저의 일차함수식</div><div class="fancy-font text-3xl text-blue-800 tracking-wide flex items-center gap-1.5 py-1" id="formula-math">y = <span id="math-a" class="text-red-500 font-extrabold">1</span>x <span id="math-sign" class="mx-0.5 text-slate-400">+</span> <span id="math-b" class="text-emerald-600 font-extrabold">0</span></div></div>
<div class="flex flex-col gap-3"><div class="bg-slate-50/50 p-3 rounded-xl border border-slate-100" id="slider-a-container"><div class="flex justify-between items-center mb-1"><span class="text-xs font-bold text-slate-600 flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>기울기 (a값)</span><span class="text-sm font-black text-red-500 fancy-font" id="val-a">a = 1.0</span></div><input type="range" id="input-a" min="-4" max="4" step="0.2" value="1"><div class="flex justify-between text-[10px] text-slate-400 mt-1 font-bold"><span>-4.0</span><span>0.0</span><span>4.0</span></div></div><div class="bg-slate-50/50 p-3 rounded-xl border border-slate-100" id="slider-b-container"><div class="flex justify-between items-center mb-1"><span class="text-xs font-bold text-slate-600 flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>y절편 (b값)</span><span class="text-sm font-black text-emerald-600 fancy-font" id="val-b">b = 0.0</span></div><input type="range" id="input-b" min="-6" max="6" step="0.5" value="0"><div class="flex justify-between text-[10px] text-slate-400 mt-1 font-bold"><span>-6.0</span><span>0.0</span><span>6.0</span></div></div></div>
<button onclick="fireLaser()" class="btn-fire w-full bg-red-500 hover:bg-red-600 active:scale-95 text-white fancy-font text-2xl py-3 rounded-2xl flex items-center justify-center gap-3 transition-all duration-150 shadow-lg tracking-wider mt-1">⚡ 레이저 발사!</button>
</div></div>
<div id="game-modal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-100"><div id="modal-badge" class="text-6xl mb-3">🏆</div><h3 id="modal-title" class="fancy-font text-3xl text-slate-800 mb-2">미션 완료!</h3><p id="modal-desc" class="text-slate-600 mb-6 text-sm whitespace-pre-line leading-relaxed">훌륭합니다!</p><div class="flex gap-3 justify-center" id="modal-actions"><button id="modal-primary-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-2xl transition active:scale-95 text-base shadow-md">다음 단계로 ➡️</button></div></div></div>
<script>
class SoundEngine{constructor(){this.ctx=null;this.isMuted=false}init(){if(!this.ctx)this.ctx=new(window.AudioContext||window.webkitAudioContext)()}beep(freq=500,dur=.16,type='sine'){if(this.isMuted)return;this.init();const now=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.25,now);g.gain.exponentialRampToValueAtTime(.01,now+dur);o.connect(g);g.connect(this.ctx.destination);o.start(now);o.stop(now+dur)}playLaser(){this.beep(900,.3,'sawtooth')}playPop(){this.beep(420,.16)}playSuccess(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>this.beep(f,.2,'triangle'),i*90))}playWrong(){this.beep(140,.25,'triangle')}}
const sound=new SoundEngine(),canvas=document.getElementById('game-canvas'),ctx=canvas.getContext('2d'),wrapper=document.getElementById('canvas-wrapper');let width,height,centerX,centerY,scale,currentStage=1,score=0,lives=3,aValue=1,bValue=0,balloons=[],particles=[],scorePopups=[],laserFired=false,laserTimer=0,screenShake=0,isGameRunning=true;const gridLimit=8;
const stagePresets={1:{title:'STAGE 1: 비례 관계의 시작 (y = ax)',desc:'원점(0,0)을 통과하는 일차함수 식입니다.\n\n기울기 슬라이더(a)와 y절편 슬라이더(b)를 조절해 노란색 미션 풍선만 관통하세요!',lockB:false,setup(){aValue=-1;bValue=0;balloons=[{x:3,y:3,color:'#F59E0B',isTarget:true,popped:false},{x:-2,y:-2,color:'#F59E0B',isTarget:true,popped:false},{x:5,y:5,color:'#F59E0B',isTarget:true,popped:false},{x:-4,y:3,color:'#94A3B8',isTarget:false,popped:false},{x:2,y:-6,color:'#94A3B8',isTarget:false,popped:false}].map(addFloat)}},2:{title:'STAGE 2: 그래프의 평행이동 (y = ax + b)',desc:'기울기와 y절편을 조절해 핑크색 미션 풍선 3개를 관통하세요!',lockB:false,setup(){aValue=1;bValue=-3;balloons=[{x:-2,y:3,color:'#EC407A',isTarget:true,popped:false},{x:2,y:1,color:'#EC407A',isTarget:true,popped:false},{x:6,y:-1,color:'#EC407A',isTarget:true,popped:false},{x:0,y:0,color:'#94A3B8',isTarget:false,popped:false},{x:-4,y:-3,color:'#94A3B8',isTarget:false,popped:false}].map(addFloat)}},3:{title:'STAGE 3: 아케이드 정밀 조준 미션',desc:'기울기(a)와 y절편(b)을 함께 조절해 파란색 풍선만 관통하세요!',lockB:false,setup(){aValue=-2;bValue=4;balloons=[{x:-4,y:-4,color:'#3B82F6',isTarget:true,popped:false},{x:0,y:-2,color:'#3B82F6',isTarget:true,popped:false},{x:4,y:0,color:'#3B82F6',isTarget:true,popped:false},{x:-2,y:4,color:'#94A3B8',isTarget:false,popped:false},{x:3,y:4,color:'#94A3B8',isTarget:false,popped:false}].map(addFloat)}}};function addFloat(b){return{...b,floatOffset:Math.random()*100}}
function handleResize(){const availableWidth=wrapper.clientWidth;const availableHeight=wrapper.clientHeight;const size=Math.max(260,Math.floor(Math.min(availableWidth,availableHeight)*0.96));canvas.width=size;canvas.height=size;canvas.style.width=size+'px';canvas.style.height=size+'px';width=size;height=size;centerX=width/2;centerY=height/2;scale=width/(gridLimit*2+1);draw()}window.addEventListener('resize',handleResize);setTimeout(handleResize,100);
const inputA=document.getElementById('input-a'),inputB=document.getElementById('input-b'),valA=document.getElementById('val-a'),valB=document.getElementById('val-b'),mathA=document.getElementById('math-a'),mathB=document.getElementById('math-b'),mathSign=document.getElementById('math-sign');inputA.addEventListener('input',e=>{aValue=parseFloat(e.target.value);updateControlUI();draw()});inputB.addEventListener('input',e=>{bValue=parseFloat(e.target.value);updateControlUI();draw()});
function updateControlUI(){valA.textContent='a = '+aValue.toFixed(1);valB.textContent='b = '+bValue.toFixed(1);mathA.textContent=aValue===1?'':aValue===-1?'-':aValue.toFixed(1);if(bValue===0){mathSign.style.display='none';mathB.style.display='none'}else{mathSign.style.display='inline';mathB.style.display='inline';mathSign.textContent=bValue>0?'+':'-';mathB.textContent=Math.abs(bValue).toFixed(1)}}
function startStage(n){currentStage=n;isGameRunning=true;const p=stagePresets[n];document.getElementById('stage-badge').textContent=p.title;document.getElementById('mission-desc').textContent=p.desc;p.setup();document.getElementById('slider-b-container').style.opacity='1';inputB.disabled=false;inputA.value=aValue;inputB.value=bValue;laserFired=false;updateControlUI();updateTopBar();handleResize()}function restartStage(){startStage(currentStage)}function updateTopBar(){document.getElementById('score-val').textContent=score;document.getElementById('balloon-count').textContent=balloons.filter(b=>b.isTarget&&!b.popped).length;const w=document.getElementById('hearts-wrap');w.innerHTML='';for(let i=0;i<3;i++){const h=document.createElement('span');h.className='text-xl transition-all '+(i<lives?'':'opacity-20 scale-75');h.textContent='❤️';w.appendChild(h)}}function toggleMute(){sound.isMuted=!sound.isMuted;document.getElementById('mute-btn').textContent=sound.isMuted?'🔇':'🔊'}function showHelp(){showModal('❓ 도움말','기울기 a는 직선의 기울어진 정도, y절편 b는 y축과 만나는 높이입니다.\n색깔 있는 미션 풍선만 지나가도록 y=ax+b를 조절한 뒤 발사하세요!','💡')}
function draw(){if(!ctx)return;ctx.save();if(screenShake>0){ctx.translate((Math.random()-.5)*screenShake,(Math.random()-.5)*screenShake);screenShake*=.85;if(screenShake<.5)screenShake=0}ctx.clearRect(0,0,width,height);drawGrid();drawAxis();drawLaserBeam();drawGuide();drawBalloons();drawParticles();drawScorePopups();ctx.restore()}function drawGrid(){ctx.strokeStyle='#EBF4FA';ctx.lineWidth=1;for(let i=-gridLimit;i<=gridLimit;i++){let x=centerX+i*scale;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();let y=centerY-i*scale;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke()}}function drawAxis(){ctx.strokeStyle='#CBD5E1';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,centerY);ctx.lineTo(width,centerY);ctx.stroke();ctx.beginPath();ctx.moveTo(centerX,0);ctx.lineTo(centerX,height);ctx.stroke();ctx.fillStyle='#64748B';ctx.font='bold 15px Jua, sans-serif';ctx.fillText('x',width-20,centerY+20);ctx.fillText('y',centerX-20,20);[-6,-4,-2,2,4,6].forEach(v=>{ctx.fillText(v,centerX+v*scale-5,centerY+20);ctx.fillText(v,centerX-24,centerY-v*scale+4)})}function lineEnds(){const xl=-gridLimit-2,xr=gridLimit+2;return [centerX+xl*scale,centerY-(aValue*xl+bValue)*scale,centerX+xr*scale,centerY-(aValue*xr+bValue)*scale]}function drawGuide(){if(laserFired)return;const e=lineEnds();ctx.save();ctx.strokeStyle='rgba(239,68,68,.45)';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(e[0],e[1]);ctx.lineTo(e[2],e[3]);ctx.stroke();ctx.restore()}function drawLaserBeam(){if(!laserFired)return;const e=lineEnds(),alpha=Math.max(0,1-laserTimer/25);ctx.save();ctx.strokeStyle='rgba(239,68,68,'+alpha+')';ctx.lineWidth=12*alpha;ctx.shadowBlur=18;ctx.shadowColor='#EF4444';ctx.beginPath();ctx.moveTo(e[0],e[1]);ctx.lineTo(e[2],e[3]);ctx.stroke();ctx.restore()}function darkenColor(hex,percent){let num=parseInt(hex.replace('#',''),16),amt=Math.round(2.55*percent),R=(num>>16)-amt,G=(num>>8&255)-amt,B=(num&255)-amt;return '#'+(0x1000000+(R<255?R<0?0:R:255)*0x10000+(G<255?G<0?0:G:255)*0x100+(B<255?B<0?0:B:255)).toString(16).slice(1)}function drawBalloons(){const t=Date.now()*.0035;balloons.forEach(pt=>{if(pt.popped)return;const px=centerX+pt.x*scale+Math.sin(t+pt.floatOffset)*.15*scale,py=centerY-pt.y*scale+Math.cos(t*.8+pt.floatOffset)*.12*scale;pt.currentPx=px;pt.currentPy=py;ctx.save();ctx.translate(px,py);ctx.strokeStyle='#94A3B8';ctx.beginPath();ctx.moveTo(0,15);ctx.bezierCurveTo(Math.sin(t+pt.floatOffset)*5,25,Math.cos(t+pt.floatOffset)*5,35,0,48);ctx.stroke();const g=ctx.createRadialGradient(-5,-6,2,0,0,18);g.addColorStop(0,'#fff');g.addColorStop(.3,pt.color);g.addColorStop(1,darkenColor(pt.color,40));ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,-3,14,18,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=pt.color;ctx.beginPath();ctx.moveTo(-4,14);ctx.lineTo(4,14);ctx.lineTo(0,10);ctx.fill();if(pt.isTarget){ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(0,-3,15.5,0,Math.PI*2);ctx.stroke()}ctx.restore()})}function drawParticles(){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.16;p.alpha-=.02;if(p.alpha<=0){particles.splice(i,1);continue}ctx.save();ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();ctx.restore()}}function drawScorePopups(){for(let i=scorePopups.length-1;i>=0;i--){const s=scorePopups[i];s.y-=1.2;s.alpha-=.015;if(s.alpha<=0){scorePopups.splice(i,1);continue}ctx.save();ctx.globalAlpha=s.alpha;ctx.fillStyle=s.color;ctx.font='black 22px Jua, sans-serif';ctx.fillText(s.text,s.x,s.y);ctx.restore()}}function spawnPopParticles(x,y,color){for(let i=0;i<18;i++){const angle=Math.random()*Math.PI*2,s=2+Math.random()*5;particles.push({x,y,vx:Math.cos(angle)*s,vy:Math.sin(angle)*s,color,radius:3+Math.random()*4,alpha:1})}}function spawnScorePopup(x,y,text,color='#3B82F6'){scorePopups.push({x:x-25,y:y-25,text,color,alpha:1})}
function fireLaser(){if(laserFired||!isGameRunning)return;sound.playLaser();laserFired=true;laserTimer=0;screenShake=16;setTimeout(evaluateLaserHits,100)}function evaluateLaserHits(){let hitCount=0,hitTarget=false,hitWrong=false;balloons.forEach(pt=>{if(pt.popped)return;const d=Math.abs(pt.y-(aValue*pt.x+bValue));if(d<.35){pt.popped=true;spawnPopParticles(pt.currentPx,pt.currentPy,pt.color);sound.playPop();if(pt.isTarget){hitTarget=true;hitCount++;score+=100;spawnScorePopup(pt.currentPx,pt.currentPy,'+100점','#EAB308')}else{hitWrong=true;score=Math.max(0,score-50);spawnScorePopup(pt.currentPx,pt.currentPy,'오발 -50점','#EF4444')}}});if(hitTarget){if(hitCount>=3){score+=150;spawnScorePopup(centerX,centerY-50,'트리플 팝 +150','#EC407A')}else if(hitCount===2){score+=50;spawnScorePopup(centerX,centerY-50,'더블 팝 +50','#3B82F6')}updateTopBar();checkStageCompletion()}else{lives--;sound.playWrong();updateTopBar();if(lives<=0)endGame(false);else showModal('오폭 또는 헛발사 발생!','기울기(a)와 y절편(b)을 다시 조절해 보세요.','❌')}}function checkStageCompletion(){if(balloons.filter(b=>b.isTarget&&!b.popped).length===0){sound.playSuccess();setTimeout(()=>{if(currentStage<3)showModal('정답 클리어 성공!','게임 점수: '+score+'점\n다음 미션에 도전해보세요!','🎉',()=>startStage(currentStage+1));else endGame(true)},700)}}function endGame(v){isGameRunning=false;showModal(v?'🏆 일차함수 마스터 완성!':'💀 하트 소모 완료',v?('모든 스테이지를 통과했습니다.\n최종 게임 점수: '+score+'점'):'기회를 모두 소진했습니다. 다시 도전해 보세요.',v?'👑':'🥀',()=>{score=0;lives=3;isGameRunning=true;startStage(1)})}function showModal(title,desc,badge='📢',callback=null){const m=document.getElementById('game-modal');document.getElementById('modal-title').textContent=title;document.getElementById('modal-desc').textContent=desc;document.getElementById('modal-badge').textContent=badge;document.getElementById('modal-primary-btn').onclick=()=>{m.classList.add('hidden');laserFired=false;if(callback)callback()};m.classList.remove('hidden')}function updateAnimation(){if(laserFired){laserTimer++;if(laserTimer>35){laserFired=false;laserTimer=0}}draw();requestAnimationFrame(updateAnimation)}startStage(1);requestAnimationFrame(updateAnimation);
__END_SCRIPT__
</body>
</html>`.replaceAll("__END_SCRIPT__", endScriptTag);

  return (
    <div className="h-full overflow-hidden rounded-[1.5rem] bg-white">
      <iframe
        title="일차함수 레이저 슈터"
        srcDoc={originalHtml}
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-modals"
      />
    </div>
  );
}

function GradeExtensionAssessment({ grade, answers = {}, setAnswers, completeMission, isMissionComplete }) {
  const data = gradeExtensionData[grade];
  const [current, setCurrent] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const question = data.assessment[current];
  const selected = answers[current];
  const total = data.assessment.length;
  const score = data.assessment.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0);
  const solved = data.assessment.reduce((sum, _q, i) => sum + (answers[i] ? 1 : 0), 0);
  const chooseAnswer = (choice) => setAnswers((prev) => ({ ...prev, [current]: choice }));
  const next = () => { if (current < total - 1) setCurrent((prev) => prev + 1); else setShowResult(true); };
  const prev = () => setCurrent((prev) => Math.max(0, prev - 1));

  return <Card className="h-full overflow-hidden p-5"><div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div><h2 className="text-2xl font-black text-blue-950">{data.gradeLabel} 형성평가</h2><p className="mt-1 text-sm text-slate-500">중1과 같은 방식으로 10문항을 한 문제씩 풀고 성장기록에 반영합니다.</p><div className="mt-2"><MissionStatusBadge done={isMissionComplete("assessment")} /></div></div><button onClick={() => completeMission("assessment", 30)} disabled={solved < total || isMissionComplete("assessment")} className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-100 disabled:bg-green-100 disabled:text-green-700">{isMissionComplete("assessment") ? "미션 완료" : "평가 완료 +30P"}</button></div><div className="grid h-[calc(100%-92px)] min-h-0 gap-4 xl:grid-cols-[1fr_330px]"><div className="rounded-[1.7rem] border border-blue-100 bg-blue-50/50 p-5"><div className="flex items-center justify-between"><div className="text-sm font-black text-blue-700">{data.units[1] || data.title} · 문제 {current + 1} / {total}</div><div className="rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700">현재 점수 {score}/{total}</div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-blue-600" style={{ width: `${((current + 1) / total) * 100}%` }} /></div>{showResult ? <div className="mt-6 rounded-[1.5rem] bg-white p-6 text-center"><div className="text-4xl font-black text-blue-700">{score} / {total}</div><p className="mt-3 font-bold text-slate-700">{score >= 8 ? "잘했어요! 핵심 개념을 잘 이해하고 있어요." : "오답을 확인하고 성장기록에서 추천 복습을 확인하세요."}</p><div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">✅ 형성평가 결과가 성장기록에 반영됩니다.</div><button onClick={() => completeMission("assessment", 30)} disabled={isMissionComplete("assessment")} className="mt-4 rounded-2xl bg-green-600 px-6 py-3 font-black text-white disabled:bg-green-100 disabled:text-green-700">{isMissionComplete("assessment") ? "포인트 지급 완료" : "미션 완료 확인"}</button><button onClick={() => { setShowResult(false); setCurrent(0); }} className="mt-5 ml-2 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white">다시 풀기</button></div> : <div className="mt-5 rounded-[1.5rem] bg-white p-6"><h3 className="text-xl font-black text-slate-800">{question.q}</h3><div className="mt-5 grid gap-3 md:grid-cols-2">{question.choices.map((choice) => <button key={choice} onClick={() => chooseAnswer(choice)} className={`rounded-2xl border px-5 py-4 text-left font-black transition ${selected === choice ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-200" : "border-blue-100 bg-white hover:border-blue-300 hover:bg-blue-50"}`}>{choice}</button>)}</div>{selected && <div className={`mt-5 rounded-2xl px-5 py-4 text-sm font-bold ${selected === question.answer ? "bg-green-50 text-green-800" : "bg-rose-50 text-rose-800"}`}>{selected === question.answer ? "정답입니다! " : `정답: ${question.answer}. `}{question.explain || "핵심 개념을 다시 확인해 보세요."}</div>}<div className="mt-5 flex justify-between"><button onClick={prev} className="rounded-2xl border border-blue-200 bg-white px-5 py-3 font-black text-blue-700">이전</button><button onClick={next} disabled={!selected} className="rounded-2xl bg-blue-600 px-6 py-3 font-black text-white disabled:opacity-40">{current === total - 1 ? "결과 보기" : "다음"}</button></div></div>}</div><AssessmentSidePanel set={{ questions: data.assessment }} answers={answers} current={current} setCurrent={setCurrent} /></div></Card>;
}

function GradeExtensionGrowth({ grade, setActive, answers = {}, reflections = {} }) {
  const data = gradeExtensionData[grade];
  const total = data.assessment.length;
  const correct = data.assessment.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0);
  const solved = data.assessment.reduce((sum, _q, i) => sum + (answers[i] ? 1 : 0), 0);
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrongItems = data.assessment.map((q, i) => ({ ...q, index: i, selected: answers[i] })).filter((q) => q.selected && q.selected !== q.answer);
  const weakestLabel = grade === "middle2" ? (correct < 4 ? "함수의 뜻과 일차함수 기본" : correct < 8 ? "기울기와 y절편" : "그래프 해석 심화") : (correct < 4 ? "이차함수 기본 모양" : correct < 8 ? "꼭짓점과 축의 방정식" : "그래프 변환 심화");
  const level = percent <= 50 ? "basic" : percent < 80 ? "standard" : "challenge";
  const recommended = wrongItems.length > 0 ? wrongItems.slice(0, 3) : data.assessment.slice(0, 3).map((q, i) => ({ ...q, index: i, selected: null }));
  const [showRecommended, setShowRecommended] = useState(false);
  const [recommendAnswers, setRecommendAnswers] = useState({});
  const misconceptions = getGradeMisconceptions(grade, data, answers);
  const primaryMisconception = misconceptions[0];
  const prescriptionSteps = getPrescriptionSteps({
    gradeLabel: data.gradeLabel,
    weakestTitle: weakestLabel,
    misconceptionTitle: primaryMisconception?.title || weakestLabel,
    route: primaryMisconception?.route || "개념학습 → 탐구활동",
  });

  return <Card className="h-full overflow-hidden p-6"><div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div><h2 className="text-2xl font-black text-blue-950">형성평가 / 성장기록</h2><p className="mt-1 text-sm text-slate-500">형성평가 점수를 바탕으로 약한 개념을 분석하고 맞춤 복습을 추천합니다.</p></div><button onClick={() => setActive("assessment")} className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-200">형성평가 풀러가기</button></div><div className="grid h-[calc(100%-78px)] min-h-0 gap-4 overflow-hidden xl:grid-cols-[300px_1fr_360px]"><div className="rounded-[1.5rem] border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-5 text-center"><div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-blue-500 bg-blue-50 text-3xl font-black text-blue-700">{solved === 0 ? "0%" : `${percent}%`}</div><div className="mt-3 font-black text-slate-800">총점 {solved === 0 ? "미응시" : `${correct}/${total}`}</div><p className="mt-1 text-sm text-slate-500">풀이 완료 문항 {solved}/{total}</p>{solved === 0 && <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">아직 형성평가를 풀지 않았어요.</div>}</div><div className="min-h-0 overflow-y-auto rounded-[1.5rem] border border-blue-100 bg-white p-5"><h3 className="font-black text-blue-950">형성평가 기록</h3><div className="mt-4 rounded-2xl bg-slate-50 p-4"><div className="mb-2 flex items-center justify-between text-sm font-black"><span className="text-slate-700">{data.gradeLabel} {data.units[1] || data.title}</span><span className="text-blue-700">{correct}/{total} · {percent}%</span></div><div className="h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} /></div><div className="mt-2 text-xs font-bold text-slate-500">풀이 문항 {solved}/{total}</div></div><div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">오답 문항 {wrongItems.length}개 · 추천 복습 영역: {weakestLabel}</div><div className="mt-4 max-h-[240px] overflow-auto space-y-2">{wrongItems.length === 0 && solved > 0 ? <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-800">오답이 없습니다. 심화 문제에 도전해 보세요.</div> : wrongItems.map((item) => <div key={item.index} className="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">문제 {item.index + 1}. 정답: {item.answer} · {item.explain || "관련 개념을 복습하세요."}</div>)}</div><MisconceptionReport misconceptions={misconceptions} /><LearningPrescription steps={prescriptionSteps} setActive={setActive} /><FunctionConceptMap grade={grade} percent={percent} /><TeacherDashboard title="교사용 대시보드" gradeLabel={data.gradeLabel} percent={percent} solved={solved} total={total} misconceptions={misconceptions} reflections={reflections} /></div><div className="flex min-h-0 h-full flex-col rounded-[1.5rem] border border-blue-200 bg-gradient-to-br from-white to-purple-50 p-5 overflow-hidden"><h3 className="shrink-0 font-black text-blue-950">문제은행 기반 AI형 맞춤 추천</h3>{solved === 0 ? <div className="mt-4 shrink-0 rounded-2xl bg-blue-50 px-4 py-4 text-sm font-bold text-blue-800">먼저 형성평가를 풀면 약한 개념을 분석해 추천 문제를 제공합니다.</div> : <><div className="mt-4 shrink-0 rounded-2xl bg-orange-50 px-4 py-3"><div className="font-black text-orange-800">우선 복습 추천</div><div className="mt-1 text-sm font-bold text-slate-700">{weakestLabel}</div><div className="text-sm font-bold text-slate-500">정답률 {percent}% · 추천 난이도 {level}</div></div><div className="mt-3 shrink-0 space-y-1.5 text-xs font-bold leading-relaxed text-slate-700"><div>• 오답 문항의 핵심 개념을 먼저 확인하세요.</div><div>• 개념학습 → 탐구활동 → 형성평가 순서로 다시 연결됩니다.</div></div><button onClick={() => setShowRecommended((prev) => !prev)} className="mt-3 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-base font-black text-white shadow-lg shadow-purple-100 transition hover:bg-purple-700"><Sparkles className="h-5 w-5" /> {showRecommended ? "추천 문제 접기" : "AI 맞춤 문제 추천 받기"}</button>{!showRecommended && <button onClick={() => setActive("concept")} className="mt-3 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-base font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"><Star className="h-5 w-5" /> 맞춤 개념학습으로 이동</button>}{showRecommended && <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl bg-purple-50 p-3 pr-2"><div className="mb-3 text-sm font-black text-purple-900">추천 문제 세트</div><div className="space-y-3">{recommended.map((q, order) => { const selected = recommendAnswers[q.index]; return <div key={`${q.index}-${order}`} className="rounded-2xl bg-white p-3"><div className="mb-1 text-xs font-black text-purple-700">{order + 1}. {level}</div><div className="text-sm font-black text-slate-800">{q.q}</div><div className="mt-2 grid gap-2">{q.choices.map((choice) => <button key={choice} onClick={() => setRecommendAnswers((prev) => ({ ...prev, [q.index]: choice }))} className={`rounded-xl border px-3 py-2 text-left text-sm font-bold ${selected === choice ? "border-purple-500 bg-purple-600 text-white" : "border-slate-100 bg-slate-50 text-slate-700 hover:bg-purple-50"}`}>{choice}</button>)}</div>{selected && <div className={`mt-2 rounded-xl px-3 py-2 text-xs font-bold ${selected === q.answer ? "bg-green-50 text-green-800" : "bg-rose-50 text-rose-800"}`}>{selected === q.answer ? "정답입니다. " : `정답: ${q.answer}. `}{q.explain || "해설을 확인하세요."}</div>}</div>; })}</div></div>}</>}</div></div></Card>;
}

function makeGraphExplanationFeedback(text, grade = "middle1") {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "그래프에서 변한 값과 변하지 않은 값을 함께 써보세요.";
  const conceptWords = grade === "middle3" ? ["a", "꼭짓점", "축", "p", "q", "폭", "평행이동"] : grade === "middle2" ? ["기울기", "y절편", "a", "b", "증가", "감소"] : ["x좌표", "y좌표", "정비례", "반비례", "원점", "사분면"];
  const used = conceptWords.filter((word) => trimmed.includes(word));
  if (used.length >= 2) return `좋습니다. ${used.join(", ")} 같은 핵심 개념어를 사용해 그래프 변화를 설명했습니다.`;
  if (trimmed.length >= 20) return "관찰 내용을 충분히 썼습니다. 다음에는 기울기, 절편, 꼭짓점, 축처럼 정확한 개념어를 1개 이상 넣어보세요.";
  return "조금 더 구체적으로 써보세요. 어떤 값을 바꾸었고 그래프가 어떻게 변했는지 연결하면 좋습니다.";
}

function GraphExplanationBox({ grade, reflection, onSave }) {
  const [text, setText] = useState(reflection?.text || "");
  useEffect(() => setText(reflection?.text || ""), [reflection?.text]);
  return (
    <div className="rounded-[1.5rem] border border-indigo-100 bg-indigo-50/70 p-4">
      <h3 className="text-base font-black text-indigo-950">그래프 설명 글쓰기</h3>
      <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">그래프를 친구에게 설명하듯 한 문장으로 써보세요. 저장하면 개념어 사용 여부를 기준으로 피드백을 제공합니다.</p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="mt-3 h-20 w-full resize-none rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400"
        placeholder={grade === "middle3" ? "예) p가 커질수록 꼭짓점과 축이 오른쪽으로 이동한다." : grade === "middle2" ? "예) b가 커질수록 직선이 위로 평행이동한다." : "예) 정비례 그래프는 원점을 지나는 직선이다."}
      />
      <button onClick={() => onSave?.(text)} className="mt-2 w-full rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-indigo-100">설명 저장하고 피드백 받기</button>
      {reflection?.feedback && <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-relaxed text-indigo-900">AI형 피드백: {reflection.feedback}</div>}
    </div>
  );
}

function MisconceptionReport({ misconceptions = [] }) {
  return (
    <div className="mt-4 rounded-[1.5rem] border border-rose-100 bg-rose-50/70 p-4">
      <h3 className="font-black text-rose-950">함수 오개념 진단 리포트</h3>
      {misconceptions.length === 0 ? (
        <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">현재 뚜렷하게 반복되는 오개념은 발견되지 않았습니다. 심화 문제와 설명 글쓰기로 개념을 더 단단히 해보세요.</div>
      ) : (
        <div className="mt-3 space-y-2">
          {misconceptions.map((item) => (
            <div key={item.key} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-relaxed text-slate-700">
              <div className="font-black text-rose-800">{item.title}</div>
              <div className="mt-1 text-xs">{item.desc}</div>
              <div className="mt-1 text-xs text-slate-500">근거: {item.evidence}</div>
              <div className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">추천 경로: {item.route}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LearningPrescription({ steps = [], setActive }) {
  const targetMap = { "개념학습": "concept", "탐구활동": "explore", "성장기록": "growth", "설명 기록": "explore" };
  return (
    <div className="mt-4 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4">
      <h3 className="font-black text-emerald-950">나만의 함수 처방전</h3>
      <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1">
        {steps.map((step) => (
          <button key={step.step} onClick={() => setActive?.(targetMap[step.action] || "concept")} className="rounded-2xl bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-2"><span className="font-black text-emerald-700">{step.step} · {step.title}</span><span className="text-xs font-black text-blue-700">{step.action}</span></div>
            <div className="mt-1 font-bold leading-relaxed text-slate-700">{step.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FunctionConceptMap({ grade = "middle1", summary, percent }) {
  const middle1Done = summary?.units?.reduce((acc, unit) => ({ ...acc, [unit.key]: unit.percent >= 70 }), {}) || {};
  const nodes = [
    { id: "coordinate", label: "좌표평면", active: grade === "middle1" ? middle1Done.coordinate : true },
    { id: "direct", label: "정비례 y=ax", active: grade === "middle1" ? middle1Done.direct : true },
    { id: "inverse", label: "반비례 y=a/x", active: grade === "middle1" ? middle1Done.inverse : true },
    { id: "linear", label: "일차함수 y=ax+b", active: grade === "middle2" ? percent >= 60 : grade === "middle3" || middle1Done.direct },
    { id: "quadratic", label: "이차함수 포물선", active: grade === "middle3" ? percent >= 60 : false },
    { id: "vertex", label: "꼭짓점·축", active: grade === "middle3" ? percent >= 80 : false },
  ];
  return (
    <div className="mt-4 rounded-[1.5rem] border border-blue-100 bg-blue-50/70 p-4">
      <h3 className="font-black text-blue-950">함수 개념 성장 지도</h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {nodes.map((node, index) => (
          <React.Fragment key={node.id}>
            <div className={`rounded-2xl px-3 py-2 text-xs font-black ${node.active ? "bg-blue-600 text-white" : "bg-white text-slate-500"}`}>{node.active ? "✓ " : "○ "}{node.label}</div>
            {index < nodes.length - 1 && <span className="font-black text-blue-300">→</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function TeacherDashboard({ title = "교사용 대시보드", summary, gradeLabel = "중1", percent, solved, total, misconceptions = [], reflections = {} }) {
  const avg = summary ? summary.averagePercent : percent;
  const solvedText = summary ? `${summary.totalSolved}/${summary.totalQuestions}` : `${solved}/${total}`;
  const topWeak = summary?.weakest?.title || misconceptions[0]?.title || "형성평가 후 표시";
  const reflectionCount = Object.values(reflections || {}).filter((item) => item?.text).length;
  return (
    <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
      <h3 className="font-black text-slate-900">{title}</h3>
      <p className="mt-1 text-xs font-bold text-slate-500">연구대회 설명용 교사 관찰 지표입니다. 실제 Firebase 관리자 화면에서는 반별·학생별로 확장할 수 있습니다.</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-black text-slate-700">
        <div className="rounded-2xl bg-blue-50 px-3 py-3"><div className="text-blue-700">평균 정답률</div><div className="mt-1 text-lg text-blue-900">{avg || 0}%</div></div>
        <div className="rounded-2xl bg-emerald-50 px-3 py-3"><div className="text-emerald-700">풀이 현황</div><div className="mt-1 text-lg text-emerald-900">{solvedText}</div></div>
        <div className="rounded-2xl bg-rose-50 px-3 py-3"><div className="text-rose-700">취약 개념</div><div className="mt-1 text-sm text-rose-900">{topWeak}</div></div>
        <div className="rounded-2xl bg-purple-50 px-3 py-3"><div className="text-purple-700">설명 기록</div><div className="mt-1 text-lg text-purple-900">{reflectionCount}개</div></div>
      </div>
      <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold leading-relaxed text-slate-600">다음 수업 조정 제안: {misconceptions[0]?.route || `${gradeLabel} 개념학습과 탐구활동을 연결해 보충합니다.`}</div>
    </div>
  );
}

function Card({ children, className = "" }) { return <div className={`rounded-[2rem] border border-blue-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 shadow-md ${className}`}>{children}</div>; }
function Progress({ value }) { return <div className="h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${value}%` }} /></div>; }
function IconBadge({ icon: Icon, color = "blue", compact = false }) { const colors = { blue: "bg-blue-50 text-blue-700", green: "bg-green-50 text-green-700", purple: "bg-purple-50 text-purple-700", orange: "bg-orange-50 text-orange-700" }; return <div className={`flex shrink-0 items-center justify-center rounded-2xl ${colors[color]} ${compact ? "h-11 w-11" : "h-14 w-14"}`}><Icon className={compact ? "h-5 w-5" : "h-7 w-7"} /></div>; }
function QuickButton({ icon: Icon, label, onClick, color, compact = false }) { return <button onClick={onClick} className={`group flex items-center justify-center gap-3 rounded-[1.4rem] border border-blue-100 bg-white font-black text-blue-950 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg ${compact ? "p-3 text-base" : "p-5 text-lg"}`}><IconBadge icon={Icon} color={color} compact={compact} />{label}</button>; }
function StudentIllustration({ compact = false }) { return <div className={`relative mx-auto shrink-0 overflow-hidden rounded-[2rem] bg-gradient-to-b from-blue-100 to-blue-50 md:mx-0 ${compact ? "h-28 w-28" : "h-40 w-40"}`}><div className="absolute left-1/2 top-5 h-12 w-12 -translate-x-1/2 rounded-full bg-amber-100" /><div className="absolute left-[36px] top-3 h-7 w-14 rounded-full bg-amber-900" /><div className="absolute left-[42px] top-[38px] h-2 w-2 rounded-full bg-slate-800" /><div className="absolute left-[66px] top-[38px] h-2 w-2 rounded-full bg-slate-800" /><div className="absolute left-[50px] top-[52px] h-2 w-8 rounded-full border-b-4 border-rose-400" /><div className="absolute bottom-0 left-1/2 h-40 w-20 -translate-x-1/2 rounded-t-[3rem] bg-blue-600" /><div className="absolute right-3 top-14 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl shadow-md">👋</div></div>; }
function AxesMini() { return <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true"><line x1="48" y1="12" x2="48" y2="84" stroke="#2563eb" strokeWidth="3" /><line x1="12" y1="48" x2="84" y2="48" stroke="#2563eb" strokeWidth="3" /><polygon points="48,8 42,18 54,18" fill="#2563eb" /><polygon points="88,48 78,42 78,54" fill="#2563eb" /><text x="54" y="18" fontSize="14" fill="#1d4ed8" fontWeight="800">y</text><text x="77" y="41" fontSize="14" fill="#1d4ed8" fontWeight="800">x</text></svg>; }
function CoordinatePlane({ points }) { const size = 520, min = -4, max = 4, scale = size / (max - min); const toPx = (n) => (n - min) * scale; const toPy = (n) => size - (n - min) * scale; return <div className="rounded-[1.7rem] border border-blue-100 bg-white p-4 shadow-sm"><svg viewBox={`0 0 ${size} ${size}`} className="h-full max-h-[460px] w-full rounded-2xl bg-blue-50/40">{Array.from({ length: 9 }, (_, index) => min + index).map((n) => <g key={`grid-${n}`}><line x1={toPx(n)} y1="0" x2={toPx(n)} y2={size} stroke="#dbeafe" strokeWidth="1" /><line x1="0" y1={toPy(n)} x2={size} y2={toPy(n)} stroke="#dbeafe" strokeWidth="1" /><text x={toPx(n) + 4} y={toPy(0) + 18} fontSize="14" fill="#64748b">{n !== 0 ? n : "0"}</text><text x={toPx(0) + 8} y={toPy(n) - 6} fontSize="14" fill="#64748b">{n !== 0 ? n : ""}</text></g>)}<line x1="0" y1={toPy(0)} x2={size} y2={toPy(0)} stroke="#1e3a8a" strokeWidth="3" /><line x1={toPx(0)} y1="0" x2={toPx(0)} y2={size} stroke="#1e3a8a" strokeWidth="3" /><text x={size - 24} y={toPy(0) - 10} fontSize="22" fill="#1e3a8a" fontWeight="900">x</text><text x={toPx(0) + 12} y="24" fontSize="22" fill="#1e3a8a" fontWeight="900">y</text>{points.map((point, index) => <g key={`${point.x}-${point.y}-${index}`}><circle cx={toPx(point.x)} cy={toPy(point.y)} r="9" fill="#2563eb" /><text x={toPx(point.x) + 12} y={toPy(point.y) - 12} fontSize="20" fill="#2563eb" fontWeight="900">({point.x}, {point.y})</text></g>)}</svg></div>; }
function NumberControl({ label, value, setValue }) {
  const normalizeNumberInput = (raw) => {
    return normalizeMathInput(raw);
  };
  const next = (delta) => {
    const current = Number(value);
    setValue(Number.isFinite(current) ? Math.round((current + delta) * 10) / 10 : delta);
  };
  return (
    <div>
      <div className="mb-2 text-sm font-black text-blue-800">{label} 좌표</div>
      <div className="flex items-center gap-2">
        <button onClick={() => next(-1)} className="h-12 w-12 rounded-2xl bg-white text-2xl font-black text-blue-700 shadow-sm hover:bg-blue-50">-</button>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => {
            const val = normalizeNumberInput(event.target.value);
            setValue(val === "" || val === "-" || val === "." || val === "-." ? val : Number(val));
          }}
          onBlur={() => {
            const numeric = parseMathNumber(value);
            setValue(Number.isFinite(numeric) ? numeric : 0);
          }}
          className="h-12 w-full rounded-2xl border border-blue-100 bg-white text-center text-xl font-black text-blue-900 outline-none focus:border-blue-400"
        />
        <button onClick={() => next(1)} className="h-12 w-12 rounded-2xl bg-white text-2xl font-black text-blue-700 shadow-sm hover:bg-blue-50">+</button>
      </div>
    </div>
  );
}
function Bar({ label, value }) { return <div className="flex flex-1 flex-col items-center gap-2"><div className="flex h-28 w-12 items-end rounded-full bg-blue-50"><div className="w-full rounded-full bg-blue-600" style={{ height: `${value}%` }} /></div><div className="text-xs font-black text-slate-600">{label}</div><div className="text-xs font-black text-blue-700">{value}%</div></div>; }
function WeakItem({ title, rate }) { return <div className="mt-4 flex items-center gap-3 rounded-2xl bg-orange-50 px-4 py-3"><AlertTriangle className="h-5 w-5 text-orange-500" /><div><div className="font-black text-slate-800">{title}</div><div className="text-sm font-bold text-slate-500">정답률 {rate}</div></div></div>; }
