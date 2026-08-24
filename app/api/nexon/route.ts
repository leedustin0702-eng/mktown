import { NextResponse } from 'next/server';

// 🚀 [핵심 마법 1] Next.js 자체의 지독한 '화석 캐시(영구 저장)'를 강제로 박살냅니다!
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
  }

  const API_KEY = process.env.NEXON_API_KEY || process.env.NEXT_PUBLIC_NEXON_API_KEY || '';

  try {
    const nexonUrl = `https://open.api.nexon.com${endpoint}`;
    
    // 🚀 [핵심 마법 2] 서버 내부 캐시는 끄고(no-store), Vercel 겉면(CDN) 캐시만 씁니다!
    const res = await fetch(nexonUrl, {
      headers: { 'x-nxopen-api-key': API_KEY },
      cache: 'no-store', 
    });

    if (!res.ok) {
      throw new Error(`Nexon API error: ${res.status}`);
    }

    const data = await res.json();

    // 🌟 기본 데이터(매치 리스트, 랭크 등)는 답답하지 않게 60초(1분)로 대폭 축소!
    let sMaxAge = 60; 

    // 매치 상세 정보(누가 골 넣었나 등 과거 기록)는 영원히 안 바뀌므로 1년(31536000초) 캐싱
    if (endpoint.includes('/match-detail')) {
      sMaxAge = 31536000; 
    }

    return NextResponse.json(data, {
      headers: {
        // max-age=0 : 브라우저(크롬) 자체 캐시 차단 (항상 서버에 묻도록)
        // s-maxage=... : Vercel 무료 CDN 진열장만 똑똑하게 활용!
        'Cache-Control': `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=59`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}