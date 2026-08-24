import { NextResponse } from 'next/server';

// 🚀 Next.js 자체의 '화석 캐시(영구 저장)'를 막는 필수 방어막 (유지)
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
    
    // 서버 내부 캐시는 끄고(no-store), Vercel 겉면(CDN) 캐시만 씁니다!
    const res = await fetch(nexonUrl, {
      headers: { 'x-nxopen-api-key': API_KEY },
      cache: 'no-store', 
    });

    if (!res.ok) {
      throw new Error(`Nexon API error: ${res.status}`);
    }

    const data = await res.json();

    // 🌟 [황금 밸런스 복구] 구단주님 통찰력대로 기본 5분(300초)으로 세팅!
    let sMaxAge = 300; 

    // 매치 상세 정보(누가 골 넣었나 등 과거 기록)는 영원히 안 바뀌므로 1년(31536000초) 캐싱 (유지)
    if (endpoint.includes('/match-detail')) {
      sMaxAge = 31536000; 
    }

    return NextResponse.json(data, {
      headers: {
        // max-age=0 : 브라우저(크롬) 자체 캐시 차단
        // s-maxage=300 : Vercel 무료 CDN이 5분 동안 완벽하게 요금을 방어해 줌!
        'Cache-Control': `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=59`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}