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
        multiSelect: true,
        options: [
            { id: "아침", label: "아침", emoji: "🌤️", description: "가벼운 하루의 시작" },
            { id: "점심", label: "점심", emoji: "☀️", description: "든든한 에너지 충전" },
            { id: "저녁", label: "저녁", emoji: "🌙", description: "수고한 나를 위한 보상" },
            { id: "야식", label: "야식", emoji: "🌜", description: "참을 수 없는 유혹" },
            { id: "간식", label: "브런치 · 간식", emoji: "☕", description: "입이 심심할 때" },
        ],
    },
    {
        id: "companion",
        title: "누구와",
        subtitle: "함께하는 분이 있나요?",
        multiSelect: true,
        options: [
            { id: "혼밥", label: "나홀로 힐링", emoji: "🧑", description: "오롯이 즐기는 밥상" },
            { id: "연인", label: "연인과 달콤하게", emoji: "💕", description: "분위기가 필요한 오늘" },
            { id: "친구", label: "친구와 즐겁게", emoji: "👥", description: "수다와 함께 냠냠" },
            { id: "가족", label: "가족과 따뜻하게", emoji: "👨‍👩‍👧‍👦", description: "다같이 도란도란" },
            { id: "회식", label: "회식 · 단체", emoji: "🎉", description: "왁자지껄 신나게" },
        ],
    },
    {
        id: "cuisine",
        title: "요리 스타일",
        subtitle: "어느 나라 요리가 끌리나요?",
        multiSelect: true,
        options: [
            { id: "한식", label: "한식", emoji: "🇰🇷", iconUrl: "https://flagcdn.com/w80/kr.png", description: "한국인은 밥심" },
            { id: "중식", label: "중식", emoji: "🇨🇳", iconUrl: "https://flagcdn.com/w80/cn.png", description: "기름진 불맛의 매력" },
            { id: "일식", label: "일식", emoji: "🇯🇵", iconUrl: "https://flagcdn.com/w80/jp.png", description: "정갈하고 깊은 맛" },
            { id: "양식", label: "양식", emoji: "🇺🇸", iconUrl: "https://flagcdn.com/w80/us.png", description: "우아한 서양의 맛" },
            { id: "아시안", label: "아시안", emoji: "🇻🇳", iconUrl: "https://flagcdn.com/w80/vn.png", description: "이국적인 향신료" },
            { id: "기타", label: "멕시칸 · 기타", emoji: "🌮", iconUrl: "https://flagcdn.com/w80/mx.png", description: "색다른 별미가 필요할 때" },
            { id: "상관없음", label: "상관없음", emoji: "🔀", description: "아무거나 다 좋아!" },
        ],
    },
    {
        id: "cookingMethod",
        title: "조리 방식",
        subtitle: "어떤 식으로 조리된 요리가 당기나요?",
        multiSelect: true,
        options: [
            { id: "국물", label: "국물 자작하게", emoji: "🍲", description: "호로록 마시는 식감" },
            { id: "구이볶음", label: "불판 위 구이·볶음", emoji: "🍳", description: "지글지글 소리까지 맛있는" },
            { id: "튀김", label: "바삭바삭 튀김", emoji: "🍤", description: "기름에 튀긴 건 다 맛있어" },
            { id: "찜삶음", label: "부드러운 찜·삶음", emoji: "♨️", description: "건강하고 촉촉하게" },
            { id: "날것", label: "신선한 날것·콜드", emoji: "🥗", description: "재료 본연의 산뜻함" },
            { id: "상관없음", label: "상관없음", emoji: "🔀", description: "맛있으면 장땡!" },
        ],
    },
    {
        id: "taste",
        title: "맛 취향",
        subtitle: "어떤 맛을 원하시나요? (복수 선택 가능)",
        multiSelect: true,
        options: [
            { id: "매콤", label: "스트레스 쫙 매콤", emoji: "🌶️", description: "침샘폭발 틈새공략" },
            { id: "고소", label: "크리미 & 고소", emoji: "🧈", description: "풍미 가득 느끼함" },
            { id: "새콤", label: "상큼 발랄 새콤", emoji: "🍋", description: "입맛 돋우는 산뜻함" },
            { id: "짭조름", label: "마성의 단짠/짭조름", emoji: "🧂", description: "무한 흡입 감칠맛" },
            { id: "달콤", label: "기분 업! 달콤상콤", emoji: "🍯", description: "당 충전 100%" },
            { id: "담백", label: "속 편한 담백함", emoji: "🥬", description: "가볍고 깔끔한 마무리" },
            { id: "얼얼", label: "마라 마라! 얼얼함", emoji: "🔥", description: "중독성 강한 향신료" },
        ],
    },
    {
        id: "dishType",
        title: "음식 종류",
        subtitle: "어떤 메뉴가 생각나시나요?",
        multiSelect: true,
        options: [
            { id: "밥", label: "든든한 밥", emoji: "🍚", description: "비빔밥, 덮밥, 볶음밥" },
            { id: "면", label: "호로록 면", emoji: "🍜", description: "라면, 파스타, 냉면" },
            { id: "국찌개", label: "뜨끈한 국/찌개", emoji: "🍲", description: "김치찌개, 탕, 전골" },
            { id: "고기구이", label: "육식파 고기", emoji: "🥩", description: "삼겹살, 스테이크" },
            { id: "빵분식", label: "빵돌이/빵순이 & 분식", emoji: "🍕", description: "떡볶이, 피자, 샌드위치" },
            { id: "샐러드", label: "가벼운 샐러드/포케", emoji: "🥗", description: "건강 챙기기 건강식" },
            { id: "디저트", label: "디저트 & 카페", emoji: "🍰", description: "여유로운 브런치" },
            { id: "상관없음", label: "상관없음", emoji: "🔀", description: "뭐든 좋아요" },
        ],
    },
    {
        id: "temperature",
        title: "온도",
        subtitle: "뜨겁게? 차갑게?",
        multiSelect: true,
        options: [
            { id: "뜨거운", label: "이열치열 뜨거움", emoji: "🔥", description: "호호 불어먹는 맛" },
            { id: "차가운", label: "얼어죽어도 아이스", emoji: "❄️", description: "가슴 뻥 뚫리는 시원함" },
            { id: "상온", label: "상관없음", emoji: "🌡️", description: "딱 먹기 좋은 온도" },
        ],
    },
    {
        id: "budget",
        title: "예산",
        subtitle: "생각해둔 가격대가 있나요?",
        multiSelect: true,
        options: [
            { id: "가성비", label: "가성비 굿", emoji: "💰", description: "~8,000원의 소확행" },
            { id: "적당", label: "적당하게", emoji: "💳", description: "8,000~15,000원의 즐거움" },
            { id: "좀쓸게", label: "조금 무리해서", emoji: "💎", description: "15,000~25,000원 은근한 사치" },
            { id: "플렉스", label: "오늘 내가 쏜다!", emoji: "👑", description: "25,000원~ 눈치보지 마!" },
            { id: "상관없음", label: "상관없음", emoji: "🔀", description: "돈이 문제인가!" },
        ],
    },
    {
        id: "context",
        title: "특별한 상황",
        subtitle: "현재 어떤 상황이신가요?",
        optional: true,
        multiSelect: true,
        options: [
            { id: "해장", label: "과음 후엔 해장", emoji: "🍺", description: "간을 살려주세요" },
            { id: "다이어트", label: "작심삼일 다이어트", emoji: "🏃", description: "저칼로리 우선" },
            { id: "비", label: "비 오는 날 감성", emoji: "☔", description: "파전에 막걸리 각" },
            { id: "우울해", label: "기분 꿀꿀한 날", emoji: "🥺", description: "위로가 되는 소울푸드" },
            { id: "월급날", label: "월급날 플렉스", emoji: "💸", description: "고생한 나에게 선물" },
            { id: "넷플릭스", label: "넷플릭스 정주행", emoji: "📺", description: "드라마 보며 먹기 좋은" },
            { id: "시간없어", label: "빨리 먹고 가야해", emoji: "⏰", description: "스피드가 생명" },
            { id: "패스", label: "초능력 평범함", emoji: "🚫", description: "특별한 상황은 아님" },
        ],
    },
];

