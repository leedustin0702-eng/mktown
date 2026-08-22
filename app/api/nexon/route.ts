import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
  }

  const API_KEY = process.env.NEXON_API_KEY;

  // API 키가 없으면 명확하게 알려주기 (undefined 헤더로 터지는 것 방지)
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'NEXON_API_KEY가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`https://open.api.nexon.com${endpoint}`, {
      headers: { 'x-nxopen-api-key': API_KEY },
    });

    if (!res.ok) {
      const detail = await res.text();
      // 넥슨이 준 HTTP 상태 코드를 그대로 노출 (429=사용량초과, 403=키문제 등 진단용)
      return NextResponse.json(
        { error: 'Nexon API Error', nexonStatus: res.status, detail },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch', detail: String(error) },
      { status: 500 }
    );
  }
}
