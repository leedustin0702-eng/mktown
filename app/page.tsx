import React from 'react';

// 스트리머 데이터 타입 정의
interface Streamer {
  id: number;
  name: string;
  soopId: string;
  fcoNickname: string;
  tier: '1티어' | '2티어' | '3티어';
  isLive: boolean;
  viewers: number;
  streamTitle: string;
}

// 목업 데이터 (추후 구글 시트 및 SOOP API로 실시간 동기화)
const MOCK_STREAMERS: Streamer[] = [
  {
    id: 1,
    name: '김민교',
    soopId: 'mismis1',
    fcoNickname: '교양있는구단주',
    tier: '1티어',
    isLive: true,
    viewers: 12450,
    streamTitle: '⚽ MKTOWN 피파 멸망전 맞밸 매치 드가자',
  },
  {
    id: 2,
    name: '이상호',
    soopId: 'lsh1023',
    fcoNickname: '상호네축구단',
    tier: '1티어',
    isLive: true,
    viewers: 8320,
    streamTitle: '오늘 구단 가치 100조 스쿼드 테스트',
  },
  {
    id: 3,
    name: '트할',
    soopId: 'thal',
    fcoNickname: 'Thal_FC',
    tier: '2티어',
    isLive: false,
    viewers: 0,
    streamTitle: '',
  },
];

export default function MKTOWNPage() {
  const liveStreamers = MOCK_STREAMERS.filter((s) => s.isLive);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* 상단 네비게이션 & 헤더 */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              MKTOWN ⚽
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              SOOP 라이브 연동 & FC 온라인 스트리머 전적 허브
            </p>
          </div>

          <div className="flex gap-2">
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              방송 중 {liveStreamers.length}명
            </span>
          </div>
        </header>

        {/* 1. SOOP 실시간 방송 중 스트리머 섹션 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🔴 현재 FC 온라인 방송 중
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveStreamers.map((streamer) => (
              <a
                key={streamer.id}
                href={`https://play.sooplive.co.kr/${streamer.soopId}`}
                target="_blank"
                rel="noreferrer"
                className="group block bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 shadow-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 mr-2">
                      [{streamer.tier}]
                    </span>
                    <span className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {streamer.name}
                    </span>
                  </div>
                  <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono">
                    {streamer.viewers.toLocaleString()}명
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-1 mb-3">
                  {streamer.streamTitle}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                  <span>SOOP ID: {streamer.soopId}</span>
                  <span className="text-slate-300">구단주: {streamer.fcoNickname}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* 2. 스트리머 종합 티어표 (SOOP + FCO 구단주명 매핑) */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            🏆 스트리머 티어 & 구단주 현황
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['1티어', '2티어', '3티어'] as const).map((tierName) => {
              const tierMembers = MOCK_STREAMERS.filter((s) => s.tier === tierName);
              return (
                <div key={tierName} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-sm font-bold text-indigo-300 pb-3 border-b border-slate-800 mb-3 flex justify-between">
                    <span>{tierName}</span>
                    <span className="text-xs text-slate-500">{tierMembers.length}명</span>
                  </div>
                  <div className="space-y-2">
                    {tierMembers.map((s) => (
                      <div key={s.id} className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50 text-xs">
                        <div>
                          <span className="font-semibold text-slate-200">{s.name}</span>
                          <span className="text-slate-500 ml-1.5 font-mono">({s.soopId})</span>
                        </div>
                        <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {s.fcoNickname}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}