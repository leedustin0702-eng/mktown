import { NextResponse } from 'next/server';

// 💡 Cloudflare 배포를 위한 필수 설정! (초고속 엣지 런타임 사용)
export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  
  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
  }

  const API_KEY = process.env.NEXON_API_KEY;

  try {
    const res = await fetch(`https://open.api.nexon.com${endpoint}`, {
      headers: { "x-nxopen-api-key": API_KEY as string }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Nexon API Error' }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}