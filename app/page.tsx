/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect } from 'react';

// API 키가 보이지 않는 안전한 구조! (서버 라우트 사용)
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQOygdnJy5ZHfvRUhFGepi8kshPOHWnlfAMqopg5P3ihGsJYHjVoYDNhMf25o-QtPYxcEfA5_JFKGm/pub?output=csv";

const DIVISIONS: Record<number, string> = {
  800: "슈퍼 챔피언스", 900: "챔피언스", 1000: "슈퍼 챌린지",
  1100: "챌린지 1부", 1200: "챌린지 2부", 1300: "챌린지 3부",
  2000: "월드클래스 1부", 2100: "월드클래스 2부", 2200: "월드클래스 3부",
  3000: "프로 1부", 3100: "프로 2부", 3200: "프로 3부"
};

interface Streamer { id: number; name: string; soopId: string; fcoNickname: string; tier: string; isLive: boolean; viewers: number; }
interface MatchLog { date: string; result: string; myScore: number; oppScore: number; oppName: string; }
interface H2HStat { streamer: Streamer; wins: number; draws: number; losses: number; recentMatches: string[]; }

export default function MKTOWNPage() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [activeTab, setActiveTab] = useState<string>('home'); 
  const [selectedTierModal, setSelectedTierModal] = useState<string | null>(null);

  const [logoError, setLogoError] = useState<boolean>(false);

  // --- 전적 관련 상태 ---
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchResult, setSearchResult] = useState<Streamer | null>(null);
  const [nexonBasic, setNexonBasic] = useState<any>(null);
  const [nexonRank, setNexonRank] = useState<any>(null);
  const [cusStats, setCusStats] = useState<any>(null);
  const [matchLogs, setMatchLogs] = useState<MatchLog[]>([]);
  const [h2hData, setH2hData] = useState<H2HStat[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  // --- 롤 내전 상태 ---
  const [lolPlayers, setLolPlayers] = useState<Record<string, string[]>>({
    '탑': ['', ''], '정글': ['', ''], '미드': ['', ''], '원딜': ['', ''], '서포터': ['', '']
  });
  const [blueTeam, setBlueTeam] = useState<Record<string, string> | null>(null);
  const [redTeam, setRedTeam] = useState<Record<string, string> | null>(null);

  // --- 🎯 핀볼 (룰렛) 상태 ---
  const [pbItems, setPbItems] = useState<string>('치킨 쏘기, 커피 쏘기, 벌칙, 무효, 만원 기부');
  const [pbResult, setPbResult] = useState<string | null>(null);
  const [pbRolling, setPbRolling] = useState<boolean>(false);
  const [pbCurrent, setPbCurrent] = useState<string>('준비 완료!');

  // --- 🪜 사다리 상태 ---
  const LADDER_ROWS = 12;
  const [ladderCols, setLadderCols] = useState<number>(4);
  
  const initPlayers = Array.from({length: 20}, (_, i) => i < 8 ? `참가자${i+1}` : '');
  const initResults = Array.from({length: 20}, (_, i) => i % 2 === 0 ? '꽝' : '당첨');
  const [ladderPlayers, setLadderPlayers] = useState<string[]>(initPlayers);
  const [ladderResults, setLadderResults] = useState<string[]>(initResults);
  
  const [ladderLines, setLadderLines] = useState<boolean[][]>([]);
  const [ladderPath, setLadderPath] = useState<{x:number, y:number}[] | null>(null);
  const [ladderEndIdx, setLadderEndIdx] = useState<number | null>(null);
  const [isLadderAnimating, setIsLadderAnimating] = useState<boolean>(false);
  const [ladderAnimKey, setLadderAnimKey] = useState<number>(0);

  // 구글 시트 데이터 로드
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(CSV_URL, { cache: 'no-store' });
        const text = await res.text();
        const rows = text.split('\n').map((row) => row.trim()).filter(Boolean);
        rows.shift(); 
        const data = rows.map((row, index) => {
          const cols = row.split(',').map(c => c.trim().replace(/\r$/, ''));
          let rawTier = cols[3] || '티어 미정';
          if (!rawTier.includes('티어') && rawTier.trim() !== '') rawTier = rawTier + '티어';
          
          const isLiveStr = cols[4] ? cols[4].toUpperCase() : '';
          const isCurrentlyLive = isLiveStr === 'ON' || isLiveStr === 'O' || isLiveStr === 'TRUE';

          return {
            id: index + 1, name: cols[0] || '이름 없음', soopId: cols[1] || '아이디 없음', 
            fcoNickname: cols[2] || '구단주 미정', tier: rawTier, isLive: isCurrentlyLive, viewers: Math.floor(Math.random() * 1000) + 100,
          };
        });
        setStreamers(data);
      } catch (error) { console.error('시트 로드 실패:', error); }
    }
    fetchData();
  }, []);

  const fetchNexonAPI = async (endpoint: string) => {
    const res = await fetch(`/api/nexon?endpoint=${encodeURIComponent(endpoint)}`);
    if (!res.ok) throw new Error('API Error');
    return res.json();
  };

  const handleSearch = async (targetName?: string) => {
    const queryName = targetName || searchInput;
    if (!queryName.trim()) return;

    const found = streamers.find(s => s.name.includes(queryName) || s.fcoNickname.includes(queryName));
    const searchTargetNickname = found ? found.fcoNickname : queryName;

    setIsLoading(true); setProgress(5); setLoadingText('서버 접속 중...');
    
    try {
      const dataId = await fetchNexonAPI(`/fconline/v1/id?nickname=${encodeURIComponent(searchTargetNickname)}`);
      if (!dataId.ouid) { alert("구단주를 찾을 수 없습니다."); setIsLoading(false); return; }
      const ouid = dataId.ouid;
      setProgress(15);

      setLoadingText('기본 정보 불러오는 중...');
      const dataBasic = await fetchNexonAPI(`/fconline/v1/user/basic?ouid=${ouid}`);
      const dataRank = await fetchNexonAPI(`/fconline/v1/user/maxdivision?ouid=${ouid}`);
      setProgress(25);

      setLoadingText('최근 매치 식별자 가져오는 중...');
      // 💡 서비스 키 승인 완료! matchtype=40(커스텀/클래식 1on1) & limit=100 으로 파워업!
      const cusMatchIds = await fetchNexonAPI(`/fconline/v1/user/match?ouid=${ouid}&matchtype=40&offset=0&limit=100`).catch(() => []);
      setProgress(35);

      let matchDetails: any[] = [];
      let apiLimitReached = false; 

      if (Array.isArray(cusMatchIds) && cusMatchIds.length > 0) {
        setLoadingText('커스텀 1on1 100경기 분석 진행 중...');
        // 💡 서비스 키는 쾌속 호출이 가능하므로 한 번에 10개씩 빠르게 처리
        const chunkSize = 10; 
        for (let i = 0; i < cusMatchIds.length; i += chunkSize) {
          if (apiLimitReached) break;

          const chunk = cusMatchIds.slice(i, i + chunkSize);
          const chunkResults = await Promise.all(
            chunk.map(async (id) => {
              for (let attempt = 0; attempt < 3; attempt++) {
                try {
                  const r = await fetch(`/api/nexon?endpoint=${encodeURIComponent(`/fconline/v1/match-detail?matchid=${id}`)}`);
                  if (r.status === 429 || r.status === 403) { 
                    apiLimitReached = true; 
                    return null; 
                  }
                  if (!r.ok) return null;
                  return await r.json();
                } catch (e) { await new Promise(res => setTimeout(res, 500)); }
              }
              return null;
            })
          );
          matchDetails.push(...chunkResults.filter(r => r !== null));
          setProgress(35 + Math.floor(((i + chunkSize) / cusMatchIds.length) * 60));
          // 💡 딜레이도 100ms로 확 줄여서 분석 체감 속도 UP!
          await new Promise(res => setTimeout(res, 100)); 
        }
      }

      setLoadingText('분석 결과 정리 중...');
      setProgress(95);

      let wins = 0, draws = 0, losses = 0, totalGF = 0, totalGA = 0, totalPossession = 0, validMatches = 0;
      const h2hMap: Record<string, H2HStat> = {};
      const logs: MatchLog[] = [];

      matchDetails.forEach((match: any) => {
        if (!match || !match.matchInfo || match.matchInfo.length < 2) return;
        const myInfo = match.matchInfo.find((m: any) => m.ouid === ouid);
        const oppInfo = match.matchInfo.find((m: any) => m.ouid !== ouid);
        if (!myInfo || !oppInfo) return;

        const res = myInfo.matchDetail.matchResult;
        const myScore = myInfo.shoot.goalTotal;
        const oppScore = oppInfo.shoot.goalTotal;
        
        if (res === '승') wins++; else if (res === '무') draws++; else if (res === '패') losses++;
        totalGF += myScore; totalGA += oppScore;
        totalPossession += myInfo.matchDetail.possession;
        validMatches++;

        if (logs.length < 10) {
          const dateStr = match.matchDate.substring(5, 16).replace('T', ' ');
          logs.push({ date: dateStr, result: res, myScore, oppScore, oppName: oppInfo.nickname });
        }

        const oppStreamer = streamers.find(s => s.fcoNickname === oppInfo.nickname);
        if (oppStreamer) {
          const oppName = oppStreamer.name;
          if (!h2hMap[oppName]) h2hMap[oppName] = { streamer: oppStreamer, wins: 0, draws: 0, losses: 0, recentMatches: [] };
          if (res === '승') h2hMap[oppName].wins++; else if (res === '무') h2hMap[oppName].draws++; else if (res === '패') h2hMap[oppName].losses++;
          if (h2hMap[oppName].recentMatches.length < 5) h2hMap[oppName].recentMatches.push(res);
        }
      });

      setCusStats({
        total: validMatches, wins, draws, losses,
        winRate: validMatches > 0 ? Math.round((wins / validMatches) * 100) : 0,
        avgGF: validMatches > 0 ? (totalGF / validMatches).toFixed(1) : 0,
        avgGA: validMatches > 0 ? (totalGA / validMatches).toFixed(1) : 0,
        avgPossession: validMatches > 0 ? Math.round(totalPossession / validMatches) : 0
      });

      const foundMe = streamers.find(s => s.fcoNickname === searchTargetNickname);
      setSearchResult(foundMe || { id: 999, name: searchTargetNickname, soopId: '', fcoNickname: searchTargetNickname, tier: '일반유저', isLive: false, viewers: 0 });
      setNexonBasic(dataBasic);
      setNexonRank(Array.isArray(dataRank) ? dataRank : null);
      setMatchLogs(logs);
      setH2hData(Object.values(h2hMap).sort((a, b) => (b.wins + b.draws + b.losses) - (a.wins + a.draws + a.losses)));
      setProgress(100);

      if (apiLimitReached) {
        setTimeout(() => alert("⚠️ 일시적인 네트워크 오류로 100경기를 전부 불러오지 못했습니다. 잠시 후 다시 시도해주세요."), 500);
      }

    } catch (e) {
      console.error(e); alert("데이터 로드 실패.");
    } finally {
      setTimeout(() => { setIsLoading(false); setLoadingText(''); setProgress(0); }, 500);
    }
  };

  const goHome = () => { setActiveTab('home'); setSearchResult(null); setNexonRank(null); setNexonBasic(null); setH2hData([]); setSearchInput(''); };

  const handleShuffleTeams = () => {
    const blue: Record<string, string> = {}; const red: Record<string, string> = {};
    Object.keys(lolPlayers).forEach((role) => {
      const p = lolPlayers[role];
      if (Math.random() > 0.5) { blue[role] = p[0] || '(미입력)'; red[role] = p[1] || '(미입력)'; } 
      else { blue[role] = p[1] || '(미입력)'; red[role] = p[0] || '(미입력)'; }
    });
    setBlueTeam(blue); setRedTeam(red);
  };

  const handleStartPinball = () => {
    const arr = pbItems.split(',').map(s => s.trim()).filter(Boolean);
    if(arr.length < 2) { alert('쉼표(,)로 구분해서 2개 이상 입력하세요!'); return; }
    
    setPbRolling(true);
    setPbResult(null);
    let count = 0;
    const maxCount = 40 + Math.floor(Math.random() * 20);
    let delay = 30;

    const roll = () => {
      count++;
      setPbCurrent(arr[Math.floor(Math.random() * arr.length)]);
      if (count < maxCount) {
        delay += 6;
        setTimeout(roll, delay);
      } else {
        setPbRolling(false);
        const winner = arr[Math.floor(Math.random() * arr.length)];
        setPbResult(winner);
        setPbCurrent(winner);
      }
    };
    roll();
  };

  const SVG_W = 1000;
  const SVG_H = 1000;
  const getX = (c: number) => (c + 0.5) * (SVG_W / ladderCols);
  const getY = (r: number) => r * (SVG_H / (LADDER_ROWS + 1));

  const generateLadder = () => {
    const newLines = [];
    for (let r = 0; r < LADDER_ROWS; r++) {
      const rowArr = Array(ladderCols - 1).fill(false);
      for (let c = 0; c < ladderCols - 1; c++) {
         if (c > 0 && rowArr[c-1]) continue; 
         rowArr[c] = Math.random() > 0.6; 
      }
      newLines.push(rowArr);
    }
    setLadderLines(newLines);
    setLadderPath(null);
    setLadderEndIdx(null);
    setIsLadderAnimating(false);
  };

  const traceLadder = (startCol: number) => {
    if (ladderLines.length === 0) { alert('먼저 사다리를 생성해주세요!'); return; }
    if (isLadderAnimating) return; 

    let c = startCol;
    const path = [{x: c, y: 0}];
    for (let r = 0; r < LADDER_ROWS; r++) {
       path.push({x: c, y: r + 1});
       if (c < ladderCols - 1 && ladderLines[r][c]) {
          c++;
          path.push({x: c, y: r + 1});
       } else if (c > 0 && ladderLines[r][c-1]) {
          c--;
          path.push({x: c, y: r + 1});
       }
    }
    path.push({x: c, y: LADDER_ROWS + 1});
    setLadderPath(path);
    setLadderEndIdx(null); 
    setIsLadderAnimating(true); 
    
    setLadderAnimKey(Date.now()); 

    setTimeout(() => {
      setLadderEndIdx(c);
      setIsLadderAnimating(false);
    }, 3000); 
  };

  const uniqueTiers = Array.from(new Set(streamers.map(s => s.tier))).sort();

  return (
    <main className="min-h-screen bg-[#050a08] text-slate-100 p-6 md:p-10 font-sans selection:bg-emerald-500/30 relative">
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drawLineAnimation {
          0% { stroke-dashoffset: 30000; }
          100% { stroke-dashoffset: 0; }
        }
      `}} />

      {/* 팝업(모달) 레이어 */}
      {selectedTierModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050a08]/90 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0a120e] border border-emerald-500/50 rounded-3xl w-full max-w-lg p-8 shadow-[0_0_50px_rgba(16,185,129,0.3)] relative">
            <div className="flex justify-between items-center border-b border-emerald-900/50 pb-4 mb-4">
              <h3 className="text-2xl font-black text-emerald-400 flex items-center gap-2">🏆 {selectedTierModal} 전체 명단</h3>
              <button onClick={() => setSelectedTierModal(null)} className="text-slate-400 hover:text-white text-4xl font-light leading-none transition-colors">&times;</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-emerald-900/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {streamers
                .filter(s => s.tier === selectedTierModal)
                .sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'))
                .map((s) => (
                <div key={s.id} onClick={() => { setSearchInput(s.fcoNickname); handleSearch(s.fcoNickname); setSelectedTierModal(null); }} className="group flex items-center gap-4 bg-[#050a08] p-4 rounded-xl border border-emerald-900/20 hover:border-emerald-500/50 transition-all cursor-pointer">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 group-hover:bg-emerald-400 transition-colors ml-2"></span>
                  <div className="flex flex-col ml-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-lg group-hover:text-emerald-400 transition-colors">{s.name}</span>
                      {s.isLive && (
                        <span className="flex items-center gap-1 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/50">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                          <span className="text-[9px] font-black text-red-500 tracking-wider mt-0.5">ON AIR</span>
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-xs font-mono group-hover:text-emerald-600 transition-colors">{s.fcoNickname}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 상단 헤더 */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-emerald-900/50 pb-6">
          <button onClick={goHome} className="text-left group cursor-pointer flex flex-col gap-1">
            <div className="flex items-center gap-3">
              {!logoError && (
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-12 h-12 md:w-14 md:h-14 object-contain rounded-2xl drop-shadow-lg" 
                  onError={() => setLogoError(true)}
                />
              )}
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent group-hover:scale-[1.02] transition-transform">
                MK&apos;s playground
              </h1>
            </div>
            <p className="text-sm text-emerald-600/80 font-medium tracking-wide mt-1 ml-1">민교의 놀이터</p>
          </button>
          
          <nav className="flex space-x-2 overflow-x-auto pb-2 w-full md:w-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-emerald-900/50">
            {[
              { id: 'home', icon: '🏠', label: '홈' },
              { id: 'ranking', icon: '🔍', label: 'FCO 전적' }, 
              { id: 'lol', icon: '⚔️', label: '롤 내전 뽑기' },
              { id: 'pinball', icon: '🎯', label: '아케이드 핀볼' },
              { id: 'ladder', icon: '🪜', label: '사다리 타기' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'ranking') setSearchResult(null);
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap border ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                    : 'bg-transparent text-slate-500 border-transparent hover:text-emerald-200 hover:bg-emerald-900/20'
                }`}
              >
                <span>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </nav>
        </header>

        {/* 1. 홈 화면 */}
        {activeTab === 'home' && (
          <div className="flex flex-col items-center justify-center py-32 animate-fadeIn">
            <div className="w-24 h-24 bg-emerald-900/30 border border-emerald-500/50 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <span className="text-5xl">⚽</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-4">MK&apos;s playground 데이터 허브에 오신 것을 환영합니다</h2>
            <p className="text-emerald-500/80 text-center max-w-lg mb-8 leading-relaxed">
              상단의 <strong className="text-emerald-400">[FCO 전적]</strong> 메뉴를 클릭하여 스트리머들의 실시간 커스텀 1on1 매치 성적과 상대 전적을 검색해 보세요.
            </p>
            <button onClick={() => setActiveTab('ranking')} className="bg-emerald-600 hover:bg-emerald-500 text-[#050a08] font-black px-8 py-3 rounded-full transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              FCO 전적 검색하러 가기 ➔
            </button>
          </div>
        )}

        {/* 2. FCO 전적 화면 */}
        {activeTab === 'ranking' && (
          <div className="space-y-10 animate-fadeIn">
            
            <div className="bg-[#0a120e] border border-emerald-900/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
              <h2 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
                <span className="animate-pulse">🟢</span> FC 온라인 구단주 전적 검색
              </h2>
              <div className="flex gap-3">
                <input type="text" placeholder="FC 온라인 구단주명 입력 (예: 교로텔리)" className="flex-1 bg-[#050a08] border border-emerald-900/60 rounded-xl px-5 py-4 text-emerald-100 placeholder-emerald-800/50 focus:outline-none focus:border-emerald-500/80 transition-all font-bold" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                <button onClick={() => handleSearch()} disabled={isLoading} className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-[#050a08] px-10 py-4 rounded-xl text-sm font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 relative overflow-hidden">
                  {isLoading ? '분석중...' : '검색'}
                  {isLoading && <div className="absolute bottom-0 left-0 h-1 bg-white/50 transition-all duration-300" style={{ width: `${progress}%` }}></div>}
                </button>
              </div>
              {isLoading && (
                <div className="mt-5 flex items-center gap-4">
                  <div className="flex-1 h-1.5 bg-emerald-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,1)]" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="text-emerald-400 font-mono text-xs w-10 text-right">{progress}%</span>
                  <span className="text-emerald-500/70 text-xs w-48 truncate">{loadingText}</span>
                </div>
              )}
            </div>

            {searchResult ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fadeIn">
                <div className="xl:col-span-1 space-y-6">
                  <div className="bg-[#0a120e] border border-emerald-900/50 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#050a08] ring-2 ring-emerald-500 bg-slate-800 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <img src={searchResult.soopId ? `https://stimg.afreecatv.com/LOGO/${searchResult.soopId.substring(0, 2)}/${searchResult.soopId}/${searchResult.soopId}.jpg` : 'https://via.placeholder.com/150'} alt="profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Img' }} />
                    </div>
                    <div className="inline-block px-3 py-1 bg-emerald-900/30 text-emerald-400 text-xs font-bold rounded-lg mb-2 border border-emerald-800/50">{searchResult.tier}</div>
                    <h2 className="text-3xl font-black text-white flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        {searchResult.name}
                        {nexonBasic?.level && <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 align-middle">Lv.{nexonBasic.level}</span>}
                      </div>
                      {searchResult.isLive && (
                        <span className="flex items-center gap-1.5 bg-red-950/40 px-3 py-1 rounded-full border border-red-900/50 shadow-[0_0_10px_rgba(239,68,68,0.2)] mt-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                          <span className="text-[10px] font-black text-red-500 tracking-widest mt-0.5">SOOP 라이브 방송 중</span>
                        </span>
                      )}
                    </h2>
                    <p className="text-emerald-500 font-medium mt-3">구단주: <strong className="text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded ml-1">{searchResult.fcoNickname}</strong></p>
                    <div className="w-full bg-[#050a08] mt-6 p-4 rounded-2xl border border-emerald-900/40 shadow-inner">
                      <p className="text-slate-500 text-xs mb-1">역대 최고 등급</p>
                      <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                        {nexonRank && nexonRank.length > 0 ? DIVISIONS[nexonRank[0].division] || `Div ${nexonRank[0].division}` : '기록 없음'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0a120e] border border-emerald-900/50 rounded-3xl p-6 shadow-2xl">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><span className="text-emerald-500">📊</span> 최근 커스텀 1on1 100경기 스탯 요약</h3>
                    {cusStats && cusStats.total > 0 ? (
                      <div className="space-y-5">
                        <div className="flex justify-between items-center bg-[#050a08] p-4 rounded-2xl border border-emerald-900/30">
                          <div className="text-center">
                            <p className="text-slate-500 text-[10px] mb-1">전적 ({cusStats.total}전)</p>
                            <p className="text-emerald-400 font-black text-lg">{cusStats.wins}승 {cusStats.draws}무 {cusStats.losses}패</p>
                          </div>
                          <div className="h-10 w-px bg-emerald-900/50"></div>
                          <div className="text-center">
                            <p className="text-slate-500 text-[10px] mb-1">승률</p>
                            <p className="text-white font-black text-2xl">{cusStats.winRate}<span className="text-sm text-emerald-500">%</span></p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#050a08] p-3 rounded-xl border border-emerald-900/20 text-center">
                            <p className="text-slate-500 text-[10px] mb-1">평균 득/실점</p>
                            <p className="text-white font-bold font-mono"><span className="text-blue-400">{cusStats.avgGF}</span> / <span className="text-red-400">{cusStats.avgGA}</span></p>
                          </div>
                          <div className="bg-[#050a08] p-3 rounded-xl border border-emerald-900/20 text-center">
                            <p className="text-slate-500 text-[10px] mb-1">평균 점유율</p>
                            <p className="text-emerald-400 font-bold font-mono">{cusStats.avgPossession}%</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm text-center py-6">분석된 경기 데이터가 없습니다.</p>
                    )}
                  </div>
                </div>

                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-[#0a120e] border border-emerald-900/50 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2 border-b border-emerald-900/30 pb-3">
                      <span className="text-emerald-500">📝</span> 최근 경기 로그 <span className="text-xs font-normal text-emerald-600 bg-emerald-950/50 px-2 py-0.5 rounded ml-2">커스텀 1on1</span>
                    </h3>
                    {matchLogs.length > 0 ? (
                      <div className="space-y-2">
                        {matchLogs.map((log, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-[#050a08] p-3 md:p-4 rounded-xl border border-emerald-900/20 hover:border-emerald-500/30 transition-colors">
                            <div className="flex items-center gap-4 w-1/4">
                              <div className={`w-10 text-center py-1 rounded text-xs font-black ${log.result === '승' ? 'bg-blue-500/20 text-blue-400' : log.result === '패' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-300'}`}>{log.result}</div>
                              <span className="text-slate-500 text-xs font-mono hidden md:block">{log.date}</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-3">
                              <span className="text-emerald-400 font-black text-lg">{log.myScore}</span>
                              <span className="text-slate-600 text-xs font-bold">VS</span>
                              <span className="text-slate-300 font-bold text-lg">{log.oppScore}</span>
                            </div>
                            <div className="w-1/3 text-right"><p className="text-slate-300 font-bold text-sm truncate">{log.oppName}</p></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm text-center py-10">최근 경기 로그가 존재하지 않습니다.</p>
                    )}
                  </div>

                  <div className="bg-[#0a120e] border border-emerald-900/50 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-emerald-900/30 pb-3 mb-5 gap-2">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-emerald-500">⚔️</span> 100전 기반 시트 멤버 상대전적
                      </h3>
                    </div>
                    {h2hData.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {h2hData.map((stat, idx) => (
                          <div key={idx} className="bg-[#050a08] border border-emerald-900/30 rounded-2xl p-4 flex items-center justify-between group hover:border-emerald-500/50 transition-colors relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-900 group-hover:bg-emerald-500 transition-colors"></div>
                            <div className="flex items-center gap-3 pl-2">
                              <img src={stat.streamer.soopId ? `https://stimg.afreecatv.com/LOGO/${stat.streamer.soopId.substring(0, 2)}/${stat.streamer.soopId}/${stat.streamer.soopId}.jpg` : 'https://via.placeholder.com/150'} alt="profile" className="w-full h-full rounded-full border border-slate-700 object-cover" />
                              <div>
                                <p className="font-bold text-slate-100">{stat.streamer.name}</p>
                                <p className="text-[10px] text-emerald-500 bg-emerald-900/20 inline-block px-1 rounded mt-0.5">{stat.streamer.tier}</p>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <p className="text-lg font-black text-emerald-400">{stat.wins}승 {stat.draws}무 {stat.losses}패</p>
                              <div className="flex gap-1 mt-1">
                                {stat.recentMatches.map((res, i) => (
                                  <span key={i} className={`w-4 h-4 flex items-center justify-center rounded text-[8px] font-bold ${res === '승' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : res === '패' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'}`}>{res === '승' ? 'W' : res === '패' ? 'L' : 'D'}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#050a08] border border-emerald-900/20 border-dashed rounded-2xl p-10 text-center"><p className="text-slate-500 text-sm">최근 100경기 내에 대결 기록이 없습니다.</p></div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-emerald-500">🏆</span> 티어별 명단 (가나다 오름차순)
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {uniqueTiers.filter(t => t).map((tierName) => {
                    const tierMembers = streamers
                      .filter((s) => s.tier === tierName)
                      .sort((a, b) => a.name.localeCompare(b.name, 'ko-KR')); 
                    
                    const displayMembers = tierMembers.slice(0, 5);
                    return (
                      <div key={tierName} className="bg-[#0a120e] border border-emerald-900/30 rounded-2xl p-5 flex flex-col h-full hover:border-emerald-700/50 transition-colors shadow-lg">
                        <div className="text-sm font-black text-emerald-400 pb-3 border-b border-emerald-900/40 mb-4 flex justify-between items-center">
                          <span>{tierName}</span>
                          <span className="text-xs bg-[#050a08] px-2 py-0.5 rounded text-emerald-600">{tierMembers.length}명</span>
                        </div>
                        <div className="space-y-2 flex-grow">
                          {displayMembers.map((s) => (
                            <div key={s.id} onClick={() => { setSearchInput(s.fcoNickname); handleSearch(s.fcoNickname); }} className="group flex items-center gap-3 bg-[#050a08] p-3 rounded-xl border border-transparent hover:border-emerald-500/30 transition-all cursor-pointer">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 group-hover:bg-emerald-400 transition-colors ml-2"></span>
                              <div className="flex flex-col ml-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-300 group-hover:text-emerald-300 transition-colors">{s.name}</span>
                                  {s.isLive && (
                                    <span className="flex items-center gap-1 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/50">
                                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                                      <span className="text-[8px] font-black text-red-500 tracking-wider mt-0.5">ON AIR</span>
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-600 text-[10px] font-mono group-hover:text-emerald-600 transition-colors">{s.fcoNickname}</span>
                              </div>
                            </div>
                          ))}
                          {tierMembers.length > 5 && (
                            <button onClick={() => setSelectedTierModal(tierName)} className="w-full mt-3 py-2 text-xs font-bold text-emerald-600/70 hover:text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/40 rounded-lg transition-colors border border-emerald-900/20">
                              더보기 ({tierMembers.length - 5}명) ➕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 3. 롤 내전 팀 뽑기 */}
        {activeTab === 'lol' && (
          <div className="flex flex-col gap-8 animate-fadeIn max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#050812] border border-blue-900/50 rounded-3xl p-6 shadow-[0_0_30px_rgba(37,99,235,0.1)] flex flex-col">
                <h3 className="text-xl font-black text-blue-500 mb-5 text-center tracking-widest">🟦 BLUE TEAM</h3>
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  {(['탑', '정글', '미드', '원딜', '서포터'] as const).map((role) => (
                    <div key={role} className="flex justify-between items-center bg-blue-950/20 p-4 rounded-xl border border-blue-900/30">
                      <span className="text-blue-500/70 font-bold text-sm w-12">{role}</span>
                      <span className="font-bold text-white text-lg">{blueTeam ? blueTeam[role] : '대기 중...'}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-[#120505] border border-red-900/50 rounded-3xl p-6 shadow-[0_0_30px_rgba(220,38,38,0.1)] flex flex-col">
                <h3 className="text-xl font-black text-red-500 mb-5 text-center tracking-widest">🟥 RED TEAM</h3>
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  {(['탑', '정글', '미드', '원딜', '서포터'] as const).map((role) => (
                    <div key={role} className="flex justify-between items-center bg-red-950/20 p-4 rounded-xl border border-red-900/30">
                      <span className="text-red-500/70 font-bold text-sm w-12">{role}</span>
                      <span className="font-bold text-white text-lg">{redTeam ? redTeam[role] : '대기 중...'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col bg-[#0a120e] border border-emerald-900/50 rounded-3xl p-8 md:p-10 shadow-2xl relative">
              <h2 className="text-3xl font-black text-white mb-2 text-center">⚔️ 롤 라인업 입력</h2>
              <p className="text-center text-emerald-500/70 text-sm mb-10">각 라인별 플레이어 후보를 입력하고 팀 섞기를 눌러주세요.</p>
              
              <div className="space-y-5 mb-10 flex-1">
                {(['탑', '정글', '미드', '원딜', '서포터'] as const).map((role) => (
                  <div key={role} className="flex flex-col md:flex-row items-center gap-3 md:gap-6 bg-[#050a08] p-4 rounded-2xl border border-emerald-900/30">
                    <div className="w-full md:w-20 text-center font-black text-emerald-500 bg-emerald-900/20 py-3 rounded-xl border border-emerald-900/40">{role}</div>
                    <input type="text" placeholder="플레이어 1" className="flex-1 w-full bg-transparent border border-slate-800 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 text-center md:text-left" value={lolPlayers[role][0]} onChange={(e) => setLolPlayers({...lolPlayers, [role]: [e.target.value, lolPlayers[role][1]]})} />
                    <span className="text-slate-700 font-black italic hidden md:block">VS</span>
                    <input type="text" placeholder="플레이어 2" className="flex-1 w-full bg-transparent border border-slate-800 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 text-center md:text-left" value={lolPlayers[role][1]} onChange={(e) => setLolPlayers({...lolPlayers, [role]: [lolPlayers[role][0], e.target.value]})} />
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-auto">
                <button onClick={handleShuffleTeams} className="w-full md:w-auto px-16 py-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-[#050a08] font-black text-xl rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">팀 섞기 🎲</button>
              </div>
            </div>
          </div>
        )}

        {/* 4. 아케이드 핀볼 */}
        {activeTab === 'pinball' && (
          <div className="max-w-4xl mx-auto animate-fadeIn space-y-8">
            <div className="bg-[#0a120e] border border-pink-900/50 rounded-3xl p-8 shadow-[0_0_40px_rgba(236,72,153,0.1)] relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-pink-500/10 blur-[100px] pointer-events-none"></div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-2 text-center relative z-10">🎯 아케이드 럭키 핀볼</h2>
              <p className="text-center text-pink-500/70 text-sm mb-10 relative z-10">벌칙이나 상품을 쉼표(,)로 구분해 입력하고 뽑아보세요!</p>

              <div className="flex flex-col md:flex-row gap-8 relative z-10">
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                  <textarea className="w-full h-40 md:h-full bg-[#050812] border border-pink-900/30 rounded-2xl p-4 text-pink-100 focus:outline-none focus:border-pink-500/50 resize-none" placeholder="예: 치킨, 피자, 커피, 꽝, 만원 기부" value={pbItems} onChange={(e) => setPbItems(e.target.value)} />
                  <button onClick={handleStartPinball} disabled={pbRolling} className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xl rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:opacity-50 transition-all">
                    {pbRolling ? '추첨 중...' : '시작 🕹️'}
                  </button>
                </div>
                <div className="w-full md:w-2/3 h-64 bg-[#050812] border-4 border-pink-900/30 rounded-3xl flex items-center justify-center relative shadow-inner overflow-hidden">
                  <div className="absolute inset-0 border-2 border-dashed border-pink-500/20 m-2 rounded-2xl"></div>
                  {pbRolling ? (
                    <div className="text-4xl md:text-5xl font-black text-pink-300 animate-pulse tracking-widest drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">{pbCurrent}</div>
                  ) : pbResult ? (
                    <div className="flex flex-col items-center animate-bounce">
                      <span className="text-pink-500 text-sm font-bold mb-2">당첨 결과</span>
                      <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">🎉 {pbResult} 🎉</div>
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-pink-900/50 tracking-widest">READY TO START</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. 사다리 타기 */}
        {activeTab === 'ladder' && (
          <div className="max-w-6xl mx-auto animate-fadeIn space-y-8">
            <div className="bg-[#0a120e] border border-amber-900/50 rounded-3xl p-8 shadow-[0_0_40px_rgba(245,158,11,0.1)] relative overflow-hidden">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-2 text-center">🪜 사다리 타기</h2>
              <p className="text-center text-amber-500/70 text-sm mb-10">사다리를 생성하고 참가자 이름을 클릭하여 결과를 확인하세요! (최대 20명)</p>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#050a08] p-4 rounded-2xl border border-amber-900/30">
                <div className="flex items-center gap-4">
                  <span className="text-amber-500 font-bold">인원 수 ({ladderCols}명)</span>
                  <div className="flex gap-2">
                    <button onClick={() => setLadderCols(p => Math.max(2, p - 1))} className="w-10 h-10 rounded-full bg-amber-900/30 text-amber-400 hover:bg-amber-900/60 font-black text-xl flex items-center justify-center">-</button>
                    <button onClick={() => setLadderCols(p => Math.min(20, p + 1))} className="w-10 h-10 rounded-full bg-amber-900/30 text-amber-400 hover:bg-amber-900/60 font-black text-xl flex items-center justify-center">+</button>
                  </div>
                </div>
                <button onClick={generateLadder} className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-[#050a08] font-black rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all">
                  사다리 생성하기 🎲
                </button>
              </div>

              <div className="w-full overflow-x-auto pb-6 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-amber-900/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#050a08]">
                <div style={{ minWidth: ladderCols > 8 ? `${ladderCols * 80}px` : '100%' }} className="relative px-2">
                  
                  <div className="flex justify-between mb-4 relative z-10">
                    {Array.from({length: ladderCols}).map((_, i) => (
                      <div key={`p-${i}`} className="flex-1 px-1 flex justify-center">
                        <input 
                          type="text" 
                          className={`w-full max-w-[90px] text-center text-sm font-bold bg-[#050812] border-2 rounded-lg py-2 focus:outline-none transition-colors cursor-pointer ${ladderPath && ladderPath[0].x === i ? 'border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border-amber-900/50 text-slate-300 hover:border-amber-500/50'}`}
                          value={ladderPlayers[i] || ''}
                          onChange={(e) => { const newP = [...ladderPlayers]; newP[i] = e.target.value; setLadderPlayers(newP); }}
                          onClick={() => traceLadder(i)}
                          readOnly={ladderLines.length > 0} 
                          placeholder={`입력${i+1}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="relative h-[450px] w-full bg-[#050812] border border-amber-900/30 rounded-2xl overflow-hidden shadow-inner">
                    {ladderLines.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-amber-900/50 font-black text-2xl tracking-widest">생성 버튼을 눌러주세요</div>
                    ) : (
                      <svg viewBox="0 0 1000 1000" className="w-full h-full" preserveAspectRatio="none">
                        {Array.from({length: ladderCols}).map((_, c) => (
                          <line key={`v-${c}`} x1={getX(c)} y1={0} x2={getX(c)} y2={SVG_H} stroke="#451a03" strokeWidth="6" />
                        ))}
                        {ladderLines.map((rowArr, r) =>
                          rowArr.map((hasLine, c) => hasLine && (
                            <line key={`h-${r}-${c}`} x1={getX(c)} y1={getY(r+1)} x2={getX(c+1)} y2={getY(r+1)} stroke="#451a03" strokeWidth="6" />
                          ))
                        )}
                        {ladderPath && (
                          <polyline
                            key={ladderAnimKey}
                            points={ladderPath.map(p => `${getX(p.x)},${getY(p.y)}`).join(' ')}
                            fill="none" stroke="#fbbf24" strokeWidth="10"
                            strokeLinecap="round" strokeLinejoin="round"
                            style={{
                              strokeDasharray: 30000,
                              strokeDashoffset: 30000,
                              animation: 'drawLineAnimation 3s linear forwards'
                            }}
                          />
                        )}
                      </svg>
                    )}
                  </div>

                  <div className="flex justify-between mt-4 relative z-10">
                    {Array.from({length: ladderCols}).map((_, i) => (
                      <div key={`r-${i}`} className="flex-1 px-1 flex justify-center">
                        <input 
                          type="text" 
                          className={`w-full max-w-[90px] text-center text-sm font-bold bg-[#050a08] border-2 rounded-lg py-2 focus:outline-none transition-colors ${ladderEndIdx === i ? 'border-red-500 text-red-400 bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-110 transform' : 'border-amber-900/50 text-slate-400'}`}
                          value={ladderResults[i] || ''}
                          onChange={(e) => { const newR = [...ladderResults]; newR[i] = e.target.value; setLadderResults(newR); }}
                          placeholder={`결과${i+1}`}
                        />
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}