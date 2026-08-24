import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
  }

  // 💡 기존에 설정해두신 환경변수 이름 그대로 쓰시면 됩니다!
  const API_KEY = process.env.NEXON_API_KEY || process.env.NEXT_PUBLIC_NEXON_API_KEY || '';

  try {
    const nexonUrl = `https://open.api.nexon.com${endpoint}`;
    const res = await fetch(nexonUrl, {
      headers: { 'x-nxopen-api-key': API_KEY },
    });

    if (!res.ok) {
      throw new Error(`Nexon API error: ${res.status}`);
    }

    const data = await res.json();

    // 🌟 [핵심 캐싱 마법] 데이터 종류에 따라 캐시 유통기한을 다르게 설정합니다.
    let sMaxAge = 300; // 기본은 300초(5분) 유지

    // '경기 상세 정보'는 과거 기록이라 영원히 안 바뀌므로 1년(31536000초) 캐싱!
    // 이렇게 하면 100번 조회 중 겹치는 경기는 서버 요금을 아예 갉아먹지 않습니다.
    if (endpoint.includes('/match-detail')) {
      sMaxAge = 31536000; 
    }

    return NextResponse.json(data, {
      headers: {
        // Vercel CDN(가장자리 서버) 캐싱 설정:
        // s-maxage 동안 캐시 유지, stale-while-revalidate로 유저 몰래 뒤에서 최신 데이터 갱신
        'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=59`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}