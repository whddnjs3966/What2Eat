import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    const apiKey = process.env.OPENWEATHER_API_KEY;

    // 좌표 유효성 검증 (숫자만 허용, 범위 체크)
    const latNum = lat ? parseFloat(lat) : NaN;
    const lonNum = lon ? parseFloat(lon) : NaN;

    if (!apiKey || !lat || !lon || isNaN(latNum) || isNaN(lonNum) ||
        latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
        console.log("Weather API: Returning dummy data (No API Key or Coords)");
        return NextResponse.json({
            temp: 22,
            condition: "Clear", // Rain, Snow, Clouds, etc.
            isDummy: true,
        });
    }

    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lonNum}&appid=${apiKey}&units=metric`
        );

        if (!res.ok) {
            throw new Error(`Weather API Error: ${res.statusText}`);
        }

        const data = await res.json();

        // 메인 날씨 상태 (Rain, Snow, Clear, Clouds, etc.)
        const condition = data.weather[0]?.main || "Clear";
        const temp = data.main.temp;

        return NextResponse.json({
            temp,
            condition,
            isDummy: false,
        });
    } catch (error) {
        console.error("Weather API Fetch Error:", error);
        // 에러 발생 시에도 더미 데이터로 폴백
        return NextResponse.json({
            temp: 22,
            condition: "Clear",
            isDummy: true,
            error: "Failed to fetch real weather data",
        });
    }
}
