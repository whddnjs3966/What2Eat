import HomeClient from "./HomeClient";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "What2Eat — 오늘 뭐 먹지?",
  url: "https://what2eat.kr",
  description:
    "오늘 뭐 먹지? 고민될 때 사용하는 메뉴 추천 서비스. 간단한 취향 선택만으로 아침, 점심, 저녁, 야식 메뉴를 추천해드립니다.",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "All",
  inLanguage: "ko-KR",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
};

export default function Home() {
  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 크롤러용 숨김 텍스트 — 검색엔진이 읽는 키워드 영역 */}
      <div className="sr-only">
        <h1>오늘 뭐 먹지? 메뉴 추천 — What2Eat (왓투잇)</h1>
        <p>
          오늘 뭐 먹지 고민될 때, What2Eat에서 간단한 질문 몇 가지로 오늘의 메뉴를 추천받으세요.
          점심 메뉴 추천, 저녁 메뉴 추천, 야식 추천, 혼밥 메뉴, 회식 메뉴까지 — 취향에 맞는 음식을
          빠르게 찾아드립니다.
        </p>
        <ul>
          <li>오늘 뭐먹지 추천</li>
          <li>점심 메뉴 고르기</li>
          <li>저녁 메뉴 추천</li>
          <li>야식 추천</li>
          <li>혼밥 메뉴 추천</li>
          <li>메뉴 결정 장애</li>
          <li>왓투잇</li>
          <li>What2Eat</li>
          <li>음식 추천 앱</li>
          <li>랜덤 메뉴 추천</li>
        </ul>
      </div>

      {/* 실제 앱 UI */}
      <HomeClient />
    </>
  );
}
