import { NextResponse } from 'next/server';

// 강제 영구 캐시(화석화) 방지
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { bjids } = await request.json();
    
    // 비정상적인 요청 방어
    if (!bjids || !Array.isArray(bjids)) {
      return NextResponse.json({ error: 'Invalid bjids' }, { status: 400 });
    }

    // 시트에서 ON AIR로 판정된 스트리머들의 진짜 카테고리를 SOOP에 하나씩 물어봄
    const results = await Promise.all(bjids.map(async (bjid) => {
      try {
        const res = await fetch(`https://bjapi.afreecatv.com/api/${bjid}/station`, {
          // SOOP 봇 차단을 뚫기 위한 가짜 브라우저 정보(User-Agent)
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });
        
        const data = await res.json();
        
        // broad(방송 정보) 객체가 있다면 진짜 라이브 중인 것!
        if (data && data.broad) {
          // 혹시 모를 구조 변경에 대비해 데이터를 통째로 문자열로 만들어서 강력하게 스캔!
          const rawDataString = JSON.stringify(data).toUpperCase();
          
          // '00040070'은 FC온라인의 고유 카테고리 코드번호입니다.
          const isFco = rawDataString.includes('00040070') || 
                        rawDataString.includes('FC') || 
                        rawDataString.includes('피파');
          
          return {
            bjid,
            isLive: true,
            isFco, // 여기서 FC온라인이면 true가 되어 메인화면에 노출됨!
            title: data.broad.broad_title || data.broad.title || 'FC 온라인 방송 중입니다',
            viewers: data.broad.current_sum_viewer || 0,
            bno: data.broad.broad_no,
            // 💡 실시간 캡쳐 썸네일 고화질 주소
            thumbnail: `https://liveimg.afreecatv.com/h/${data.broad.broad_no}.webp`
          };
        }
        return { bjid, isLive: false, isFco: false };
      } catch (e) {
        console.error(`[SOOP API Error] ${bjid}:`, e);
        return { bjid, isLive: false, isFco: false };
      }
    }));

    return NextResponse.json(results, {
      headers: {
        // Vercel 무료 한도 방어를 위해 1분간 캐시 유지
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error("Backend Post Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}