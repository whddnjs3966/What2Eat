// Step definitions — 8단계 선택 플로우 구성 데이터
export interface StepOption {
    id: string;
    label: string;
    emoji: string;
    iconUrl?: string; // For flag images
    description?: string;
}

export interface StepConfig {
    id: string;
    title: string;
    subtitle: string;
    multiSelect?: boolean;
    optional?: boolean;
    options: StepOption[];
}

export const stepsConfig: StepConfig[] = [
    {
        id: "mealTime",
        title: "식사 시간",
        subtitle: "언제 드실 예정인가요?",
        options: [
            { id: "아침", label: "아침", emoji: "🌅", description: "가벼운 아침 식사" },
            { id: "점심", label: "점심", emoji: "☀️", description: "든든한 한 끼" },
            { id: "저녁", label: "저녁", emoji: "🌆", description: "하루를 마무리하는 식사" },
            { id: "야식", label: "야식", emoji: "🌙", description: "늦은 밤 간식·안주" },
            { id: "간식", label: "브런치 · 간식", emoji: "☕", description: "가볍게 즐기기" },
        ],
    },
    {
        id: "companion",
        title: "동행",
        subtitle: "누구와 함께 하시나요?",
        options: [
            { id: "혼밥", label: "혼밥", emoji: "🧑", description: "나 혼자 즐기는" },
            { id: "연인", label: "연인 · 데이트", emoji: "💕", description: "분위기 있게" },
            { id: "친구", label: "친구 · 동료", emoji: "👥", description: "함께 나눠먹기" },
            { id: "가족", label: "가족", emoji: "👨‍👩‍👧‍👦", description: "온 가족이 함께" },
            { id: "회식", label: "회식 · 모임", emoji: "🎉", description: "다같이 즐겁게" },
        ],
    },
    {
        id: "cuisine",
        title: "선호하는 요리",
        subtitle: "어떤 스타일의 요리가 생각나세요?",
        options: [
            { id: "한식", label: "한식", emoji: "🇰🇷", iconUrl: "https://flagcdn.com/w80/kr.png", description: "비빔밥, 김치찌개, 삼겹살" },
            { id: "중식", label: "중식", emoji: "🇨🇳", iconUrl: "https://flagcdn.com/w80/cn.png", description: "짜장면, 탕수육, 마라탕" },
            { id: "일식", label: "일식", emoji: "🇯🇵", iconUrl: "https://flagcdn.com/w80/jp.png", description: "초밥, 라멘, 돈카츠" },
            { id: "양식", label: "양식", emoji: "🇺🇸", iconUrl: "https://flagcdn.com/w80/us.png", description: "파스타, 스테이크, 피자" },
            { id: "아시안", label: "아시안", emoji: "🇻🇳", iconUrl: "https://flagcdn.com/w80/vn.png", description: "쌀국수, 팟타이, 커리" },
            { id: "기타", label: "멕시칸 · 기타", emoji: "🌮", iconUrl: "https://flagcdn.com/w80/mx.png", description: "타코, 케밥, 브리또" },
            { id: "상관없음", label: "상관없음", emoji: "🔀", description: "전체에서 추천" },
        ],
    },
    {
        id: "taste",
        title: "맛 취향",
        subtitle: "어떤 맛을 선호하시나요? (복수 선택 가능)",
        multiSelect: true,
        options: [
            { id: "매콤", label: "매콤한", emoji: "🌶️", description: "칼칼하고 얼큰한" },
            { id: "고소", label: "고소한 · 느끼한", emoji: "🧈", description: "크리미하고 진한" },
            { id: "새콤", label: "새콤한", emoji: "🍋", description: "상큼하고 산뜻한" },
            { id: "짭조름", label: "짭조름한", emoji: "🧂", description: "감칠맛 나는" },
            { id: "달콤", label: "달콤한", emoji: "🍯", description: "단맛이 포인트" },
            { id: "담백", label: "담백한 · 깔끔한", emoji: "🥬", description: "가볍고 건강한" },
            { id: "얼얼", label: "얼얼한 (마라)", emoji: "🔥", description: "중독성 향신료" },
        ],
    },
    {
        id: "dishType",
        title: "음식 종류",
        subtitle: "어떤 종류의 음식이 땡기시나요?",
        options: [
            { id: "밥", label: "밥류", emoji: "🍚", description: "비빔밥, 볶음밥, 덮밥" },
            { id: "면", label: "면류", emoji: "🍜", description: "라면, 냉면, 파스타" },
            { id: "국찌개", label: "국 · 찌개 · 탕", emoji: "🍲", description: "김치찌개, 설렁탕" },
            { id: "고기구이", label: "고기 · 구이", emoji: "🥩", description: "삼겹살, 스테이크" },
            { id: "빵분식", label: "빵 · 분식", emoji: "🍕", description: "피자, 떡볶이, 김밥" },
            { id: "샐러드", label: "샐러드 · 건강식", emoji: "🥗", description: "포케, 샐러드" },
            { id: "디저트", label: "카페 · 디저트", emoji: "🍰", description: "브런치, 케이크" },
            { id: "상관없음", label: "아무거나", emoji: "🔀", description: "제한 없음" },
        ],
    },
    {
        id: "temperature",
        title: "음식 온도",
        subtitle: "따뜻한 음식? 시원한 음식?",
        options: [
            { id: "뜨거운", label: "뜨끈뜨끈", emoji: "🔥", description: "김이 모락모락" },
            { id: "차가운", label: "시원 · 차가운", emoji: "❄️", description: "냉면, 샐러드, 빙수" },
            { id: "상온", label: "상관없음", emoji: "🌡️", description: "온도 무관" },
        ],
    },
    {
        id: "budget",
        title: "예산",
        subtitle: "생각하시는 가격대가 있나요?",
        options: [
            { id: "가성비", label: "가성비", emoji: "💰", description: "~8,000원" },
            { id: "적당", label: "적당히", emoji: "💳", description: "8,000~15,000원" },
            { id: "좀쓸게", label: "좀 쓸게요", emoji: "💎", description: "15,000~25,000원" },
            { id: "플렉스", label: "플렉스", emoji: "👑", description: "25,000원~" },
            { id: "상관없음", label: "상관없음", emoji: "🔀", description: "가격 무관" },
        ],
    },
    {
        id: "context",
        title: "특별한 상황",
        subtitle: "현재 상황에 맞는 추천이 필요하신가요?",
        optional: true,
        options: [
            { id: "해장", label: "술 한잔 후 (해장)", emoji: "🍺", description: "해장국, 콩나물국밥" },
            { id: "다이어트", label: "다이어트 중", emoji: "🏃", description: "저칼로리 우선" },
            { id: "컨디션", label: "컨디션 안 좋은 날", emoji: "🤒", description: "죽, 소화 잘되는 음식" },
            { id: "비", label: "비 오는 날", emoji: "☔", description: "파전, 수제비, 칼국수" },
            { id: "더운날", label: "더운 날", emoji: "🥵", description: "냉면, 콩국수, 빙수" },
            { id: "추운날", label: "추운 날", emoji: "❄️", description: "설렁탕, 감자탕, 찌개" },
            { id: "기분좋은날", label: "기분 좋은 날", emoji: "🎊", description: "치킨, 고기, 외식" },
            { id: "시간없어", label: "시간 없어요", emoji: "⏰", description: "빠르게 먹을 수 있는" },
            { id: "패스", label: "없음 (패스)", emoji: "🚫", description: "특수 상황 없음" },
        ],
    },
];
