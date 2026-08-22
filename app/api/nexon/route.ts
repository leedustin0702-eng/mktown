import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
  }

  const API_KEY = process.env.NEXON_API_KEY;

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'NEXON_API_KEY가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const targetUrl = `https://open.api.nexon.com${endpoint}`;

  try {
    const res = await fetch(targetUrl, {
      headers: { 'x-nxopen-api-key': API_KEY },
    });

    if (!res.ok) {
      const detail = await res.text();
      // 진단용: 넥슨에 실제로 보낸 주소와 서버가 받은 endpoint를 함께 노출
      return NextResponse.json(
        {
          error: 'Nexon API Error',
          nexonStatus: res.status,
          receivedEndpoint: endpoint,
          targetUrl,
          detail,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch', targetUrl, detail: String(error) },
      { status: 500 }
    );
  }
}
