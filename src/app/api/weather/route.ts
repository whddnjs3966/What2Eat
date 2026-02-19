import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    const apiKey = process.env.OPENWEATHER_API_KEY;

    // API 키가 없거나 좌표가 없으면 더미 데이터 반환
    if (!apiKey || !lat || !lon) {
        console.log("Weather API: Returning dummy data (No API Key or Coords)");
        return NextResponse.json({
            temp: 22,
            condition: "Clear", // Rain, Snow, Clouds, etc.
            isDummy: true,
        });
    }

    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
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
