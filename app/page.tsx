/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==========================================
// ⚙️ 콘텐츠 설정 스위치
// ==========================================
const IS_PPUROPA_OPEN = false;

// API 주소 (시트 주소)
const CSV_MAIN = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQOygdnJy5ZHfvRUhFGepi8kshPOHWnlfAMqopg5P3ihGsJYHjVoYDNhMf25o-QtPYxcEfA5_JFKGm/pub?output=csv";
const CSV_PPUDCUP = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQOygdnJy5ZHfvRUhFGepi8kshPOHWnlfAMqopg5P3ihGsJYHjVoYDNhMf25o-QtPYxcEfA5_JFKGm/pub?gid=987034824&single=true&output=csv";
const CSV_PPUCHAMPS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQOygdnJy5ZHfvRUhFGepi8kshPOHWnlfAMqopg5P3ihGsJYHjVoYDNhMf25o-QtPYxcEfA5_JFKGm/pub?gid=845104215&single=true&output=csv";
const CSV_FISHMAN = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQOygdnJy5ZHfvRUhFGepi8kshPOHWnlfAMqopg5P3ihGsJYHjVoYDNhMf25o-QtPYxcEfA5_JFKGm/pub?gid=1716437779&single=true&output=csv";
const CSV_PPUROPA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQOygdnJy5ZHfvRUhFGepi8kshPOHWnlfAMqopg5P3ihGsJYHjVoYDNhMf25o-QtPYxcEfA5_JFKGm/pub?gid=1339520970&single=true&output=csv";
const CSV_NOTICE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQOygdnJy5ZHfvRUhFGepi8kshPOHWnlfAMqopg5P3ihGsJYHjVoYDNhMf25o-QtPYxcEfA5_JFKGm/pub?gid=1640060087&single=true&output=csv";
const CSV_FCO_BOARD = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQOygdnJy5ZHfvRUhFGepi8kshPOHWnlfAMqopg5P3ihGsJYHjVoYDNhMf25o-QtPYxcEfA5_JFKGm/pub?gid=1509458439&single=true&output=csv";
const CSV_BANNER = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQOygdnJy5ZHfvRUhFGepi8kshPOHWnlfAMqopg5P3ihGsJYHjVoYDNhMf25o-QtPYxcEfA5_JFKGm/pub?gid=846801615&single=true&output=csv";
// ==========================================

const DIVISIONS: Record<number, string> = {
  800: "슈퍼 챔피언스", 900: "챔피언스", 1000: "슈퍼 챌린지", 1100: "챌린지 1부", 1200: "챌린지 2부", 1300: "챌린지 3부",
  2000: "월드클래스 1부", 2100: "월드클래스 2부", 2200: "월드클래스 3부", 2300: "월드클래스 3부",
  2400: "프로 1부", 2500: "프로 2부", 2600: "프로 3부",
  2700: "세미프로 1부", 2800: "세미프로 2부", 2900: "세미프로 3부",
  3000: "유망주 1부", 3100: "유망주 2부", 3200: "유망주 3부",
  4000: "세미프로 1부", 4100: "세미프로 2부", 4200: "세미프로 3부",
  5000: "유망주 1부", 5100: "유망주 2부", 5200: "유망주 3부"
};

interface Streamer { id: number; name: string; soopId: string; fcoNickname: string; tier: string; isLive: boolean; isFco: boolean; viewers: number; soopTitle?: string; soopBno?: string; soopThumbnail?: string; }
interface MatchLog { date: string; result: string; myScore: number; oppScore: number; oppName: string; }
interface H2HStat { streamer: Streamer; wins: number; draws: number; losses: number; recentMatches: MatchLog[]; }

const getLatestSeason = (data: any[]) => {
  const seasons = Array.from(new Set(data.map(d => d.season).filter(s => s && s.trim() !== '')));
  if (seasons.length === 0) return "시즌1"; 
  return seasons.sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
    const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
    return numB - numA; 
  })[0];
};

export default function MKTOWNPage() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [notices, setNotices] = useState<any[]>([]); 
  
  const [fcoBoardNotices, setFcoBoardNotices] = useState<string[]>([]);
  const [currentBoardIdx, setCurrentBoardIdx] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  const [banners, setBanners] = useState<string[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [logoError, setLogoError] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null); 

  const [ppudcup, setPpudcup] = useState<any[]>([]);
  const [ppuchamps, setPpuchamps] = useState<any[]>([]);
  const [fishman, setFishman] = useState<any[]>([]);
  const [ppuropa, setPpuropa] = useState<any[]>([]);

  const [searchInput, setSearchInput] = useState<string>('');
  const [searchResult, setSearchResult] = useState<Streamer | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const [nexonBasic, setNexonBasic] = useState<any>(null);
  const [nexonRank, setNexonRank] = useState<any>(null);
  const [cusStats, setCusStats] = useState<any>(null);
  const [matchLogs, setMatchLogs] = useState<MatchLog[]>([]);
  const [h2hData, setH2hData] = useState<H2HStat[]>([]);

  const [selectedH2H, setSelectedH2H] = useState<H2HStat | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const [lolPlayers, setLolPlayers] = useState<Record<string, string[]>>({ '탑': ['', ''], '정글': ['', ''], '미드': ['', ''], '원딜': ['', ''], '서포터': ['', ''] });
  const [blueTeam, setBlueTeam] = useState<Record<string, string> | null>(null);
  const [redTeam, setRedTeam] = useState<Record<string, string> | null>(null);

  const [pbItems, setPbItems] = useState<string>('치킨 쏘기, 커피 쏘기, 벌칙, 무효, 만원 기부');
  const [pbResult, setPbResult] = useState<string | null>(null);
  const [pbRolling, setPbRolling] = useState<boolean>(false);
  const [pbCurrent, setPbCurrent] = useState<string>('준비 완료!');

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
  const [ladderAllResults, setLadderAllResults] = useState<{player: string, result: string}[] | null>(null);

  const fetchSheetData = useCallback(async () => {
    const parseCSV = (text: string) => {
      const rows = text.split('\n').map((row) => row.trim()).filter(Boolean);
      rows.shift();
      return rows.map(row => row.split(',').map(c => c.trim().replace(/\r$/, '')));
    };

    try {
      const timestamp = new Date().getTime();
      const [resMain, resCup, resChamps, resFish, resRopa, resNotice, resFcoBoard, resBanner] = await Promise.all([
        fetch(`${CSV_MAIN}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${CSV_PPUDCUP}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${CSV_PPUCHAMPS}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${CSV_FISHMAN}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${CSV_PPUROPA}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${CSV_NOTICE}&t=${timestamp}`, { cache: 'no-store' }).catch(() => null),
        fetch(`${CSV_FCO_BOARD}&t=${timestamp}`, { cache: 'no-store' }).catch(() => null),
        fetch(`${CSV_BANNER}&t=${timestamp}`, { cache: 'no-store' }).catch(() => null)
      ]);

      const mainRows = parseCSV(await resMain.text());
      const baseStreamers = mainRows.map((cols, index) => {
        let rawTier = cols[3] || '티어 미정';
        if (!rawTier.includes('티어') && rawTier.trim() !== '') rawTier = rawTier + '티어';
        
        const isLiveStr = cols[4] ? cols[4].toUpperCase() : '';
        const categoryStr = cols[5] ? cols[5].toUpperCase() : ''; 
        
        const isCurrentlyLive = isLiveStr === 'ON' || isLiveStr === 'O' || isLiveStr === 'TRUE' || isLiveStr.includes('FC') || categoryStr !== '';
        const isFco = isCurrentlyLive && (isLiveStr.includes('FC') || categoryStr.includes('FC') || categoryStr.includes('피파'));

        return {
          id: index + 1, name: cols[0] || '이름 없음', soopId: cols[1] || '아이디 없음', 
          fcoNickname: cols[2] || '구단주 미정', tier: rawTier, isLive: isCurrentlyLive, isFco: isFco, viewers: 0,
        };
      });

      const liveBjids = baseStreamers.filter(s => s.isLive && s.soopId !== '아이디 없음').map(s => s.soopId);
      let soopDataMap: Record<string, any> = {};

      if (liveBjids.length > 0) {
        try {
          const soopRes = await fetch('/api/soop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bjids: liveBjids })
          });
          if(soopRes.ok) {
             const soopList = await soopRes.json();
             soopList.forEach((info: any) => {
               soopDataMap[info.bjid] = info;
             });
          }
        } catch(e) { console.error("SOOP API 연동 에러:", e); }
      }

      const finalStreamers = baseStreamers.map(s => {
        if (s.isLive && soopDataMap[s.soopId]) {
          const info = soopDataMap[s.soopId];
          return {
            ...s,
            isFco: info.isFco,
            soopTitle: info.title,
            viewers: info.viewers,
            soopBno: info.bno,
            soopThumbnail: info.thumbnail
          };
        }
        return s;
      });

      setStreamers(finalStreamers);

      setPpudcup(parseCSV(await resCup.text()).map(c => ({ season: c[0], name: c[1], team: c[2], rank: c[3] })));
      setPpuchamps(parseCSV(await resChamps.text()).map(c => ({ season: c[0], name: c[1], team: c[2], rank: c[3] })));
      setPpuropa(parseCSV(await resRopa.text()).map(c => ({ season: c[0], name: c[1], team: c[2], rank: c[3] })));
      setFishman(parseCSV(await resFish.text()).map(c => ({ name: c[0], step: c[1] })));
      
      if(resNotice && resNotice.ok) {
         const noticeData = parseCSV(await resNotice.text());
         if(noticeData.length > 0) {
           setNotices(noticeData.map(c => ({ date: c[0], tag: c[1], title: c[2] })));
         } else { setNotices([]); }
      }

      if(resFcoBoard && resFcoBoard.ok) {
         const boardData = parseCSV(await resFcoBoard.text());
         if(boardData.length > 0) {
           const activeBoards = boardData.filter(c => c[2] && c[2].toUpperCase() === 'O').map(c => c[1]).filter(Boolean);
           setFcoBoardNotices(activeBoards);
         } else { setFcoBoardNotices([]); }
      }

      if(resBanner && resBanner.ok) {
         const bannerData = parseCSV(await resBanner.text());
         const activeBanners = bannerData.filter(c => c[1] && c[1].toUpperCase() === 'O').map(c => c[0]).filter(Boolean);
         setBanners([...activeBanners, 'DEFAULT_BANNER']);
      } else {
         setBanners(['DEFAULT_BANNER']);
      }

      const now = new Date();
      const ampm = now.getHours() >= 12 ? '오후' : '오전';
      const h = now.getHours() % 12 || 12;
      const m = String(now.getMinutes()).padStart(2, '0');
      setLastUpdateTime(`${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${ampm} ${h}:${m} 기준`);

    } catch (error) { console.error('시트 로드 실패:', error); }
  }, []);

  useEffect(() => {
    fetchSheetData();
    const timer = setInterval(() => {
      fetchSheetData();
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchSheetData]);

  useEffect(() => {
    if (fcoBoardNotices.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBoardIdx((prev) => (prev + 1) % fcoBoardNotices.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [fcoBoardNotices.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length, currentBannerIdx]);

  const handlePrevBanner = () => {
    setCurrentBannerIdx((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };
  const handleNextBanner = () => {
    setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
  };

  const fetchNexonAPI = async (endpoint: string, retries = 3): Promise<any> => {
    try {
      const res = await fetch(`/api/nexon?endpoint=${encodeURIComponent(endpoint)}`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`API Error ${res.status}`);
      return await res.json();
    } catch (err) {
      if (retries > 0) { await new Promise(r => setTimeout(r, 1000)); return fetchNexonAPI(endpoint, retries - 1); }
      throw err;
    }
  };

  const handleSearch = async (targetName?: string) => {
    if (isLoading) return; 

    const queryName = targetName || searchInput;
    if (!queryName.trim()) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const found = streamers.find(s => s.name.includes(queryName) || s.fcoNickname.includes(queryName));
    
    if (!found) {
      alert("명단에 없는 스트리머 또는 구단주입니다.\n아직 데이터베이스에 없다면 숲 melonoff 로 [스트리머명+구단주닉네임] 제보 부탁드립니다!");
      setIsDropdownOpen(false); 
      return; 
    }

    const searchTargetNickname = found.fcoNickname;

    setSearchResult(found);
    setNexonBasic(null); setNexonRank(null); setCusStats(null); setMatchLogs([]); setH2hData([]);
    
    setIsLoading(true); setProgress(5); setLoadingText('서버 접속 중...');
    
    try {
      const dataId = await fetchNexonAPI(`/fconline/v1/id?nickname=${encodeURIComponent(searchTargetNickname)}`);
      if (!dataId.ouid) { 
        alert("넥슨 서버에서 구단주를 찾을 수 없습니다. 구단주명이 변경되었을 수 있습니다."); 
        setIsLoading(false); 
        return; 
      }
      const ouid = dataId.ouid;
      setProgress(15);

      setLoadingText('기본 정보 불러오는 중...');
      const dataBasic = await fetchNexonAPI(`/fconline/v1/user/basic?ouid=${ouid}`);
      const dataRank = await fetchNexonAPI(`/fconline/v1/user/maxdivision?ouid=${ouid}`);
      setProgress(25);

      setLoadingText('최근 매치 식별자 가져오는 중...');
      const cusMatchIds = await fetchNexonAPI(`/fconline/v1/user/match?ouid=${ouid}&matchtype=40&offset=0&limit=100`).catch(() => []);
      setProgress(35);

      let matchDetails: any[] = [];
      let apiLimitReached = false; 

      if (Array.isArray(cusMatchIds) && cusMatchIds.length > 0) {
        setLoadingText('커스텀 1on1 데이터 로드 중 (캐시 확인)...');
        const chunkSize = 5; 
        for (let i = 0; i < cusMatchIds.length; i += chunkSize) {
          if (apiLimitReached) break;
          const chunk = cusMatchIds.slice(i, i + chunkSize);
          const chunkResults = await Promise.all(
            chunk.map(async (id) => {
              const cacheKey = `fco_match_${id}`;
              const cachedData = localStorage.getItem(cacheKey);
              if (cachedData) { try { return JSON.parse(cachedData); } catch(e){} }

              for (let attempt = 0; attempt < 3; attempt++) {
                try {
                  const url = `/api/nexon?endpoint=${encodeURIComponent(`/fconline/v1/match-detail?matchid=${id}`)}`;
                  const r = await fetch(url);
                  if (r.status === 429 || r.status === 403) { apiLimitReached = true; return null; }
                  if (!r.ok) return null;
                  const data = await r.json();
                  try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch(e){} 
                  return data;
                } catch (e) { await new Promise(res => setTimeout(res, 500)); }
              }
              return null;
            })
          );
          matchDetails.push(...chunkResults.filter(r => r !== null));
          setProgress(35 + Math.floor(((i + chunkSize) / cusMatchIds.length) * 60));
          await new Promise(res => setTimeout(res, 100)); 
        }
      }

      setLoadingText('분석 결과 정리 중...');
      setProgress(95);

      let wins = 0, draws = 0, losses = 0, totalGF = 0, totalGA = 0, totalPossession = 0, validMatches = 0;
      let totalShoot = 0, totalEffectiveShoot = 0, totalPassTry = 0, totalPassSuccess = 0;
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

        totalShoot += myInfo.shoot?.shootTotal || 0;
        totalEffectiveShoot += myInfo.shoot?.effectiveShootTotal || 0;
        totalPassTry += myInfo.pass?.passTry || 0;
        totalPassSuccess += myInfo.pass?.passSuccess || 0;
        
        const utcDateStr = match.matchDate.endsWith('Z') ? match.matchDate : match.matchDate + 'Z';
        const d = new Date(utcDateStr);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        const dateStr = `${month}-${day} ${hours}:${mins}`;
        
        if (res === '승') wins++; else if (res === '무') draws++; else if (res === '패') losses++;
        totalGF += myScore; totalGA += oppScore;
        totalPossession += myInfo.matchDetail.possession;
        validMatches++;

        const matchObj = { date: dateStr, result: res, myScore, oppScore, oppName: oppInfo.nickname };

        if (logs.length < 10) logs.push(matchObj);

        const oppStreamer = streamers.find(s => s.fcoNickname === oppInfo.nickname);
        if (oppStreamer) {
          const oppName = oppStreamer.name;
          if (!h2hMap[oppName]) h2hMap[oppName] = { streamer: oppStreamer, wins: 0, draws: 0, losses: 0, recentMatches: [] };
          if (res === '승') h2hMap[oppName].wins++; else if (res === '무') h2hMap[oppName].draws++; else if (res === '패') h2hMap[oppName].losses++;
          if (h2hMap[oppName].recentMatches.length < 5) h2hMap[oppName].recentMatches.push(matchObj);
        }
      });

      const calcAvgGA = validMatches > 0 ? (totalGA / validMatches) : 0;

      setCusStats({
        total: validMatches, 
        wins, draws, losses, 
        winRate: validMatches > 0 ? Math.round((wins / validMatches) * 100) : 0,
        avgGF: validMatches > 0 ? (totalGF / validMatches).toFixed(1) : 0, 
        avgGA: calcAvgGA.toFixed(1), 
        avgPossession: validMatches > 0 ? Math.round(totalPossession / validMatches) : 0,
        shootAccuracy: totalShoot > 0 ? Math.round((totalEffectiveShoot / totalShoot) * 100) : 0,
        passAccuracy: totalPassTry > 0 ? Math.round((totalPassSuccess / totalPassTry) * 100) : 0,
        defenseEfficiency: validMatches > 0 ? Math.max(0, 100 - Math.round((calcAvgGA / 3.0) * 100)) : 0, 
      });

      setNexonBasic(dataBasic);
      setNexonRank(Array.isArray(dataRank) ? dataRank : null);
      setMatchLogs(logs);
      setH2hData(Object.values(h2hMap).sort((a, b) => (b.wins + b.draws + b.losses) - (a.wins + a.draws + a.losses)));
      setProgress(100);

      if (apiLimitReached) setTimeout(() => alert("⚠️ 보안 시스템(WAF) 통과를 위해 일부 전적만 불러왔습니다."), 500);

    } catch (e) { console.error(e); alert("데이터 로드 실패."); }
    finally { setTimeout(() => { setIsLoading(false); setLoadingText(''); setProgress(0); }, 500); }
  };

  const renderRadarChart = () => {
    if (!cusStats || cusStats.total === 0) return null;
    
    const winRate = cusStats.winRate; 
    const attack = Math.min(100, Math.round((cusStats.avgGF / 3.0) * 100)); 
    const pass = cusStats.passAccuracy; 
    const defense = cusStats.defenseEfficiency; 
    const possession = Math.min(100, Math.max(0, Math.round((cusStats.avgPossession - 35) * 3.33))); 
    const shoot = cusStats.shootAccuracy; 

    const data = [
      { label: '승부사', val: winRate }, { label: '공격력', val: attack }, { label: '빌드업', val: pass },
      { label: '수비력', val: defense }, { label: '지배력', val: possession }, { label: '결정력', val: shoot }
    ];

    const cx = 120, cy = 120, maxR = 80;
    const getPoint = (val: number, idx: number) => {
      const angle = idx * 60 - 90; 
      const rad = (angle * Math.PI) / 180;
      const r = (val / 100) * maxR;
      return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
    };

    const polygonPoints = data.map((d, i) => getPoint(d.val, i)).join(' ');

    return (
      <div className="flex flex-col items-center">
        <svg width="240" height="240" viewBox="0 0 240 240" className="drop-shadow-xl">
          {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => (
            <polygon key={`bg-${i}`} points={data.map((_, idx) => getPoint(100 * scale, idx)).join(' ')} fill="none" stroke="#064e3b" strokeWidth="1" opacity="0.5" />
          ))}
          {data.map((_, idx) => (
            <line key={`axis-${idx}`} x1={cx} y1={cy} x2={getPoint(100, idx).split(',')[0]} y2={getPoint(100, idx).split(',')[1]} stroke="#064e3b" strokeWidth="1" opacity="0.5" />
          ))}
          <polygon points={polygonPoints} fill="rgba(16, 185, 129, 0.3)" stroke="#34d399" strokeWidth="2" filter="drop-shadow(0 0 8px rgba(16,185,129,0.5))" className="transition-all duration-1000" />
          {data.map((d, idx) => (
            <circle key={`dot-${idx}`} cx={getPoint(d.val, idx).split(',')[0]} cy={getPoint(d.val, idx).split(',')[1]} r="4" fill="#6ee7b7" />
          ))}
          {data.map((d, idx) => {
            const angle = idx * 60 - 90;
            const rad = (angle * Math.PI) / 180;
            const r = maxR + 20;
            return (
              <text key={`label-${idx}`} x={cx + r * Math.cos(rad)} y={cy + r * Math.sin(rad) + 4} textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="900" className="drop-shadow-md">
                {d.label}
              </text>
            );
          })}
        </svg>

        <div className="w-full mt-4 bg-[#050a08] p-4 rounded-xl border border-emerald-900/30">
          <p className="text-[10px] text-emerald-500 font-bold mb-2 flex items-center gap-1"><span>💡</span> 육각형 지표 설명</p>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            <div className="text-[10px] text-slate-300"><strong className="text-emerald-400">승부사:</strong> 전체 승률(%)</div>
            <div className="text-[10px] text-slate-300"><strong className="text-emerald-400">공격력:</strong> 평균 득점</div>
            <div className="text-[10px] text-slate-300"><strong className="text-emerald-400">결정력:</strong> 유효 슈팅 비율(%)</div>
            <div className="text-[10px] text-slate-300"><strong className="text-emerald-400">빌드업:</strong> 패스 성공률(%)</div>
            <div className="text-[10px] text-slate-300"><strong className="text-emerald-400">지배력:</strong> 평균 볼 점유율(%)</div>
            <div className="text-[10px] text-slate-300"><strong className="text-emerald-400">수비력:</strong> 수비 효율(%)</div>
          </div>
        </div>
      </div>
    );
  };

  const goHome = () => { setActiveTab('home'); setSearchResult(null); setNexonRank(null); setNexonBasic(null); setH2hData([]); setSearchInput(''); };

  const handleShuffleTeams = () => {
    const blue: Record<string, string> = {}; const red: Record<string, string> = {};
    Object.keys(lolPlayers).forEach((role) => {
      const p = lolPlayers[role];
      if (Math.random() > 0.5) { blue[role] = p[0] || '(미입력)'; red[role] = p[1] || '(미입력)'; } else { blue[role] = p[1] || '(미입력)'; red[role] = p[0] || '(미입력)'; }
    });
    setBlueTeam(blue); setRedTeam(red);
  };
  const handleStartPinball = () => {
    const arr = pbItems.split(',').map(s => s.trim()).filter(Boolean);
    if(arr.length < 2) { alert('쉼표(,)로 구분해서 2개 이상 입력하세요!'); return; }
    setPbRolling(true); setPbResult(null);
    let count = 0; const maxCount = 40 + Math.floor(Math.random() * 20); let delay = 30;
    const roll = () => {
      count++; setPbCurrent(arr[Math.floor(Math.random() * arr.length)]);
      if (count < maxCount) { delay += 6; setTimeout(roll, delay); } else { setPbRolling(false); const winner = arr[Math.floor(Math.random() * arr.length)]; setPbResult(winner); setPbCurrent(winner); }
    };
    roll();
  };

  const SVG_W = 1000; const SVG_H = 1000;
  const getX = (c: number) => (c + 0.5) * (SVG_W / ladderCols); const getY = (r: number) => r * (SVG_H / (LADDER_ROWS + 1));
  
  const generateLadder = () => {
    const newLines = [];
    for (let r = 0; r < LADDER_ROWS; r++) {
      const rowArr = Array(ladderCols - 1).fill(false);
      for (let c = 0; c < ladderCols - 1; c++) { if (c > 0 && rowArr[c-1]) continue; rowArr[c] = Math.random() > 0.6; }
      newLines.push(rowArr);
    }
    setLadderLines(newLines); setLadderPath(null); setLadderEndIdx(null); setIsLadderAnimating(false); setLadderAllResults(null);
  };

  const traceLadder = (startCol: number) => {
    if (ladderLines.length === 0) { alert('먼저 사다리를 생성해주세요!'); return; }
    if (isLadderAnimating) return; 
    let c = startCol; const path = [{x: c, y: 0}];
    for (let r = 0; r < LADDER_ROWS; r++) {
       path.push({x: c, y: r + 1});
       if (c < ladderCols - 1 && ladderLines[r][c]) { c++; path.push({x: c, y: r + 1}); } else if (c > 0 && ladderLines[r][c-1]) { c--; path.push({x: c, y: r + 1}); }
    }
    path.push({x: c, y: LADDER_ROWS + 1});
    setLadderPath(path); setLadderEndIdx(null); setIsLadderAnimating(true); setLadderAnimKey(Date.now()); setLadderAllResults(null);
    setTimeout(() => { setLadderEndIdx(c); setIsLadderAnimating(false); }, 1500); 
  };
  const handleShowAllLadderResults = () => {
    if (ladderLines.length === 0) { alert('먼저 사다리를 생성해주세요!'); return; }
    if (isLadderAnimating) return;
    const resultsMap = [];
    for(let startCol = 0; startCol < ladderCols; startCol++) {
      let c = startCol;
      for (let r = 0; r < LADDER_ROWS; r++) {
        if (c < ladderCols - 1 && ladderLines[r][c]) c++;
        else if (c > 0 && ladderLines[r][c-1]) c--;
      }
      resultsMap.push({ player: ladderPlayers[startCol] || `참가자${startCol+1}`, result: ladderResults[c] || `결과${c+1}` });
    }
    setLadderAllResults(resultsMap);
    setLadderPath(null); setLadderEndIdx(null);
  };
  const handleResetLadder = () => {
    setLadderPlayers(Array.from({length: 20}, (_, i) => `참가자${i+1}`));
    setLadderResults(Array.from({length: 20}, (_, i) => i % 2 === 0 ? '꽝' : '당첨'));
    setLadderLines([]); setLadderPath(null); setLadderEndIdx(null); setIsLadderAnimating(false); setLadderAllResults(null);
  };

  const renderPlayer = (p: any, type: 'tourney' | 'fishman') => {
    const streamer = streamers.find(s => s.name === p.name);
    const soopId = streamer?.soopId || '';
    const imgUrl = soopId ? `https://stimg.afreecatv.com/LOGO/${soopId.substring(0, 2)}/${soopId}/${soopId}.jpg` : 'https://via.placeholder.com/150';
    return (
        <div key={p.name} className="flex items-center gap-3 bg-[#050a08] p-3 rounded-xl border border-emerald-900/20 hover:border-emerald-500/30 transition-colors group cursor-pointer" onClick={() => { setSearchInput(streamer?.fcoNickname || p.name); handleSearch(streamer?.fcoNickname || p.name); setActiveTab('ranking'); }}>
             <img src={imgUrl} referrerPolicy="no-referrer" className="w-10 h-10 shrink-0 rounded-full border border-slate-700 object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Img' }} />
             <div className="flex flex-col flex-1">
                 <span className="font-bold text-slate-200 text-sm group-hover:text-emerald-400 transition-colors">{p.name}</span>
                 {type === 'tourney' && p.team && <span className="text-[10px] text-emerald-500 bg-emerald-900/20 inline-block px-1.5 py-0.5 rounded mt-0.5 w-max">{p.team}</span>}
                 {type === 'fishman' && p.step && <span className="text-[10px] text-amber-500 bg-amber-900/20 inline-block px-1.5 py-0.5 rounded mt-0.5 w-max">{p.step}</span>}
             </div>
             {type === 'tourney' && p.rank && ( <div className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/50 border border-slate-700 font-black text-amber-400 shadow-inner">{p.rank}</div> )}
        </div>
    )
  };

  const sortTourney = (data: any[]) => {
     return [...data].sort((a, b) => {
        if (!a.rank && !b.rank) return 0; if (!a.rank) return 1; if (!b.rank) return -1;
        return parseInt(a.rank) - parseInt(b.rank);
     });
  };

  const filteredStreamers = searchInput.trim() === '' ? [] : streamers.filter(s => 
    s.name.includes(searchInput) || s.fcoNickname.includes(searchInput)
  );

  const latestPpudcupSeason = getLatestSeason(ppudcup);
  const latestPpuchampsSeason = getLatestSeason(ppuchamps);
  const latestPpuropaSeason = getLatestSeason(ppuropa);

  const currentPpuropa = ppuropa.filter(p => p.season === latestPpuropaSeason && p.name);
  const isPpuropaAutoOpen = currentPpuropa.length > 0;

  const minkyoData = streamers.find(s => s.name === '김민교.');
  const isMinkyoLive = minkyoData?.isLive || false;

  const fcoLiveStreamers = streamers.filter(s => s.isLive && s.isFco);

  return (
    <main className="min-h-screen bg-[#050a08] text-slate-100 p-6 md:p-10 font-sans selection:bg-emerald-500/30 relative">
      <style dangerouslySetInnerHTML={{ __html: `@keyframes drawLineAnimation { 0% { stroke-dashoffset: 30000; } 100% { stroke-dashoffset: 0; } }`}} />

      {selectedH2H && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050a08]/90 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0a120e] border border-emerald-500/50 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.3)] relative">
            <button onClick={() => setSelectedH2H(null)} className="absolute top-4 right-6 text-slate-400 hover:text-white text-3xl font-light">&times;</button>
            <div className="flex items-center gap-4 mb-6 border-b border-emerald-900/50 pb-4">
              <img src={selectedH2H.streamer.soopId ? `https://stimg.afreecatv.com/LOGO/${selectedH2H.streamer.soopId.substring(0, 2)}/${selectedH2H.streamer.soopId}/${selectedH2H.streamer.soopId}.jpg` : 'https://via.placeholder.com/150'} referrerPolicy="no-referrer" className="w-16 h-16 rounded-full border-2 border-emerald-500/50 object-cover" />
              <div>
                <h3 className="text-2xl font-black text-white">{searchResult?.name} <span className="text-emerald-500">VS</span> {selectedH2H.streamer.name}</h3>
                <p className="text-emerald-400/80 text-sm font-bold mt-1">상대전적 {selectedH2H.wins}승 {selectedH2H.draws}무 {selectedH2H.losses}패</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-400 mb-2">최근 맞대결 기록 (최대 5경기)</h4>
              {selectedH2H.recentMatches.map((log, i) => (
                <div key={i} className="flex items-center justify-between bg-[#050a08] p-3 rounded-xl border border-emerald-900/30">
                  <div className={`w-10 text-center py-1 rounded text-xs font-black ${log.result === '승' ? 'bg-blue-500/20 text-blue-400' : log.result === '패' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-300'}`}>{log.result}</div>
                  <div className="flex-1 flex items-center justify-center gap-3">
                    <span className="text-emerald-400 font-black text-lg">{log.myScore}</span>
                    <span className="text-slate-600 text-xs font-bold">VS</span>
                    <span className="text-slate-300 font-black text-lg">{log.oppScore}</span>
                  </div>
                  <span className="text-slate-500 text-[10px] font-mono">{log.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050a08]/60 backdrop-blur-sm cursor-wait">
          <div className="w-16 h-16 border-4 border-emerald-900/50 border-t-emerald-400 rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-400 font-black tracking-widest text-lg">{loadingText}</p>
          <div className="w-48 h-2 bg-emerald-950 rounded-full mt-4 overflow-hidden"><div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-emerald-900/50 pb-6 relative z-10">
          <button onClick={goHome} className="text-left group cursor-pointer flex items-center gap-4 shrink-0">
            {!logoError && ( <img src="/logo.png" alt="Logo" className="w-12 h-12 md:w-14 md:h-14 object-contain rounded-2xl drop-shadow-lg" onError={() => setLogoError(true)} /> )}
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent whitespace-nowrap">민교의 놀이터</h1>
          </button>
          
          <nav className="flex flex-wrap gap-2 w-full lg:w-auto">
            {[ 
              { id: 'home', icon: '🏠', label: '메인' }, 
              { id: 'fco_main', icon: '🌟', label: 'FCO 메인' }, 
              { id: 'tourney', icon: '🏆', label: 'FCO 콘텐츠' }, 
              { id: 'ranking', icon: '🔍', label: 'FCO 전적' }, 
              { id: 'members', icon: '✨', label: '스트리머 명단' }, 
              { id: 'lol', icon: '⚔️', label: '롤 내전 뽑기' }, 
              { id: 'pinball', icon: '🎯', label: '아케이드 핀볼' }, 
              { id: 'ladder', icon: '🪜', label: '사다리 타기' }
            ].map((tab) => (
              <button key={tab.id} disabled={isLoading} onClick={() => { setActiveTab(tab.id); if (tab.id === 'ranking') setSearchResult(null); }} className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-bold text-xs md:text-sm transition-all whitespace-nowrap border disabled:opacity-50 ${ activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-transparent text-slate-500 border-emerald-900/30 hover:text-emerald-200 hover:bg-emerald-900/20' }`}>
                <span>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === 'fco_main' && (
          <div className="animate-fadeIn space-y-10">
            
            <div className="w-full bg-[#050812] border-2 border-emerald-500/80 rounded-3xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] relative overflow-hidden flex items-center justify-center min-h-[120px]">
               <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 via-transparent to-emerald-900/20"></div>
               {fcoBoardNotices.length > 0 ? (
                   <h2 key={currentBoardIdx} className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400 animate-pulse text-center w-full px-4 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">
                      {fcoBoardNotices[currentBoardIdx]}
                   </h2>
               ) : (
                   <p className="text-emerald-900/50 font-bold text-xl">등록된 전광판 메시지가 없습니다.</p>
               )}
            </div>

            <div className="bg-[#050a08] border border-slate-800 rounded-3xl p-6 md:p-8 relative">
               <div className="mb-6">
                 {/* 💡 NOW STREAMING -> 현재 방송중 교체 완료 */}
                 <p className="text-emerald-500 font-black tracking-widest text-xs mb-1">현재 방송중</p>
                 <div className="flex flex-wrap items-center gap-3">
                   <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">FC 온라인 <span className="text-red-500 font-black">LIVE</span></h3>
                   <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                   {/* 💡 rounded-full -> rounded 교체 (직사각형 뱃지) */}
                   <span className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-400 text-xs font-bold px-2 py-1 rounded">{fcoLiveStreamers.length}명 방송중</span>
                 </div>
                 {/* 💡 설명 멘트 교체 완료 */}
                 <p className="text-slate-400 text-sm mt-2">스트리머 명단에 있는 스트리머 중 FC 온라인 카테고리에서 방송 중인 스트리머가 표시됩니다.</p>
               </div>

               <div className="flex justify-between items-end mb-4">
                 <div className="bg-emerald-950/40 border border-emerald-900/50 px-3 py-1.5 rounded text-emerald-500 text-xs font-bold flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> 
                   5분마다 자동 갱신 · {lastUpdateTime}
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => scrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' })} className="w-8 h-8 rounded border border-slate-700 flex items-center justify-center bg-[#0a120e] hover:bg-slate-800 transition-colors text-slate-400">&lt;</button>
                   <button onClick={() => scrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' })} className="w-8 h-8 rounded border border-slate-700 flex items-center justify-center bg-[#0a120e] hover:bg-slate-800 transition-colors text-slate-400">&gt;</button>
                 </div>
               </div>

               <div ref={scrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden">
                 {fcoLiveStreamers.length > 0 ? (
                   fcoLiveStreamers.map(s => (
                     <a key={s.id} href={`https://play.sooplive.co.kr/${s.soopId}`} target="_blank" rel="noreferrer" className="snap-start flex flex-col bg-[#0a120e] border border-slate-800 hover:border-slate-600 rounded-2xl overflow-hidden min-w-[280px] md:min-w-[320px] shrink-0 transition-transform duration-300 hover:-translate-y-1 shadow-lg group">
                       
                       <div className="relative aspect-video w-full bg-slate-900 overflow-hidden border-b border-slate-800/80">
                         <img 
                            src={s.soopThumbnail || `https://liveimg.afreecatv.com/m/${s.soopId}?${Math.floor(Date.now() / 300000)}`} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            onError={(e) => { 
                              const target = e.currentTarget as HTMLImageElement;
                              if(!target.dataset.failed) {
                                target.dataset.failed = '1';
                                target.src = `https://liveimg.afreecatv.com/m/${s.soopId}?${Math.floor(Date.now() / 300000)}`;
                              } else if(target.dataset.failed === '1') {
                                target.dataset.failed = '2';
                                target.src = 'https://via.placeholder.com/400x225/050a08/334155?text=No+Signal';
                              }
                            }} 
                         />
                         <div className="absolute top-3 left-3 bg-black/70 px-2.5 py-1 rounded-full text-white text-[11px] font-black flex items-center gap-1.5 shadow-md backdrop-blur-sm">
                           <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                           {s.viewers?.toLocaleString() || '0'}
                         </div>
                       </div>
                       
                       <div className="p-4 flex gap-3 items-start bg-[#0a120e]">
                         <img src={s.soopId ? `https://stimg.afreecatv.com/LOGO/${s.soopId.substring(0, 2)}/${s.soopId}/${s.soopId}.jpg` : 'https://via.placeholder.com/150'} referrerPolicy="no-referrer" className="w-12 h-12 rounded-full border border-slate-700 shrink-0 object-cover bg-slate-800" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Img' }} />
                         
                         <div className="flex flex-col overflow-hidden w-full">
                           <span className="font-black text-slate-100 text-base truncate group-hover:text-emerald-400 transition-colors">{s.name}</span>
                           <span className="text-slate-400 text-xs truncate mt-0.5">{s.soopTitle || 'FC 온라인 방송 중입니다'}</span>
                           
                           <div className="flex items-center gap-1.5 mt-2.5">
                             <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-medium border border-slate-700">한국어</span>
                             <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-medium border border-slate-700">FC 온라인</span>
                           </div>
                         </div>
                       </div>

                     </a>
                   ))
                 ) : (
                   <div className="w-full py-16 flex flex-col items-center justify-center bg-[#0a120e] rounded-2xl border border-dashed border-slate-700/50">
                     <span className="text-5xl mb-4 opacity-50 grayscale">📺</span>
                     <p className="text-slate-400 font-bold">현재 FC 온라인 카테고리 방송이 없습니다.</p>
                   </div>
                 )}
               </div>
            </div>

          </div>
        )}

        {activeTab === 'home' && (
          <div className="animate-fadeIn space-y-6">
            
            <div className="w-full bg-[#0a120e] border border-emerald-900/50 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden mb-8">
              <div className="absolute left-0 top-0 w-1.5 h-full bg-emerald-500"></div>
              <h3 className="text-xl font-black text-white mb-5 flex items-center gap-2 border-b border-emerald-900/30 pb-3">
                <span className="text-emerald-500 animate-pulse text-2xl">📢</span> 실시간 알림판
              </h3>
              {notices.length > 0 ? (
                <div className="space-y-3">
                  {notices.slice(0, 5).map((n, i) => (
                    <div key={i} className="flex items-center gap-4 bg-[#050a08] p-4 rounded-xl border border-emerald-900/20 hover:border-emerald-500/40 transition-colors">
                      <span className={`text-[10px] font-black px-2 py-1 rounded shrink-0 ${
                        n.tag === '공지' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                        n.tag === '홍보' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 
                        n.tag === '업데이트' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>{n.tag}</span>
                      <span className="text-slate-200 font-bold text-sm flex-1 truncate">{n.title}</span>
                      <span className="text-slate-600 text-xs font-mono hidden sm:block">{n.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-6">등록된 소식이 없습니다.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <a href="https://play.sooplive.co.kr/phonics1" target="_blank" rel="noreferrer" className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all overflow-hidden group ${isMinkyoLive ? 'bg-red-950/20 border-red-900/50 hover:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'bg-[#0a120e] border-slate-800 hover:border-slate-600'}`}>
                {isMinkyoLive && <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent opacity-50"></div>}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`text-4xl ${!isMinkyoLive && 'grayscale opacity-50'}`}>📺</div>
                  <h4 className={`font-black text-lg flex items-center gap-2 ${isMinkyoLive ? 'text-red-400' : 'text-slate-400'}`}>
                    김민교 생방송 
                  </h4>
                  <div className="mt-1">
                    {isMinkyoLive ? (
                      <span className="shrink-0 flex items-center gap-1.5 bg-red-950/40 px-2 py-1 rounded border border-red-900/50 shadow-[0_0_5px_rgba(239,68,68,0.2)]">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                        <span className="text-xs font-black text-red-500 tracking-wider">ON AIR</span>
                      </span>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1.5 bg-slate-900/60 px-2 py-1 rounded border border-slate-700/50">
                        <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                        <span className="text-xs font-black text-slate-400 tracking-wider">오프라인입니다</span>
                      </span>
                    )}
                  </div>
                </div>
              </a>

              <a href="https://www.sooplive.com/station/phonics1" target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-6 bg-[#0a120e] rounded-2xl border border-blue-900/30 hover:border-blue-500/80 hover:bg-blue-950/20 transition-all shadow-lg group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📝</div>
                <h4 className="font-black text-lg text-blue-400">김민교 방송국</h4>
                <p className="text-xs text-slate-500 mt-2 font-bold">최신 공지 및 다시보기</p>
              </a>

              <a href="https://cafe.naver.com/0nepunchk1ng" target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-6 bg-[#0a120e] rounded-2xl border border-green-900/30 hover:border-[#03c75a]/80 hover:bg-[#03c75a]/10 transition-all shadow-lg group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">☕</div>
                <h4 className="font-black text-lg text-[#03c75a]">패션민교 카페</h4>
                <p className="text-xs text-slate-500 mt-2 font-bold">공식 네이버 팬카페</p>
              </a>
            </div>

            {banners.length > 0 && (
              <div className="w-full h-48 md:h-80 bg-[#050a08] rounded-3xl overflow-hidden relative border border-emerald-900/30 shadow-2xl group flex items-center justify-center">
                {banners.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 flex items-center justify-center ${idx === currentBannerIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    {item === 'DEFAULT_BANNER' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-emerald-950 via-[#0a120e] to-emerald-950">
                        <span className="text-4xl md:text-5xl mb-3 animate-bounce">📢</span>
                        <h3 className="text-2xl md:text-3xl font-black text-emerald-400 mb-2 drop-shadow-lg">홍보 배너 등록 문의</h3>
                        <p className="text-sm md:text-base text-slate-300 font-bold bg-[#050a08]/80 px-5 py-2 rounded-full border border-emerald-900/50 mt-2">
                          SOOP <span className="text-emerald-300 font-black">melonoff</span> 로 쪽지 부탁드립니다.
                        </p>
                      </div>
                    ) : (
                      <img src={item} alt={`홍보 배너 ${idx + 1}`} className="w-full h-full object-contain" />
                    )}
                  </div>
                ))}
                
                {banners.length > 1 && (
                  <>
                    <button 
                      onClick={handlePrevBanner} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-emerald-500 text-white hover:text-black w-10 h-10 flex items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    >
                      &#10094;
                    </button>
                    <button 
                      onClick={handleNextBanner} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-emerald-500 text-white hover:text-black w-10 h-10 flex items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    >
                      &#10095;
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/50 px-3 py-1.5 rounded-full">
                      {banners.map((_, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setCurrentBannerIdx(idx)}
                          className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${idx === currentBannerIdx ? 'bg-white w-6 shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'bg-white/40 w-2 hover:bg-white/70'}`} 
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        )}

        {activeTab === 'tourney' && (
          <div className="animate-fadeIn space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2 className="text-3xl font-black text-white flex items-center gap-3"><span className="text-emerald-500">🏆</span> 진행 중인 대회 및 콘텐츠</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#0a120e] border border-blue-900/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-black text-blue-400 mb-5 pb-3 border-b border-blue-900/30 flex items-center gap-2">⚽ 미니 뿌드컵 <span className="text-sm font-bold bg-blue-900/40 px-2 py-0.5 rounded-full ml-1">{latestPpudcupSeason}</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-blue-900/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {sortTourney(ppudcup.filter(p => p.season === latestPpudcupSeason && p.name)).map(p => renderPlayer(p, 'tourney'))}
                  {ppudcup.filter(p => p.season === latestPpudcupSeason && p.name).length === 0 && <p className="text-slate-500 text-sm py-4 col-span-2 text-center">진행 중인 데이터가 없습니다.</p>}
                </div>
              </div>

              <div className="bg-[#0a120e] border border-amber-900/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-black text-amber-400 mb-5 pb-3 border-b border-amber-900/30 flex items-center gap-2">🔥 미니 뿌챔스 <span className="text-sm font-bold bg-amber-900/40 px-2 py-0.5 rounded-full ml-1">{latestPpuchampsSeason}</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-amber-900/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {sortTourney(ppuchamps.filter(p => p.season === latestPpuchampsSeason && p.name)).map(p => renderPlayer(p, 'tourney'))}
                  {ppuchamps.filter(p => p.season === latestPpuchampsSeason && p.name).length === 0 && <p className="text-slate-500 text-sm py-4 col-span-2 text-center">진행 중인 데이터가 없습니다.</p>}
                </div>
              </div>

              <div className="relative bg-[#0a120e] border border-purple-900/50 rounded-3xl p-6 shadow-2xl overflow-hidden">
                <h3 className="text-xl font-black text-purple-400 mb-5 pb-3 border-b border-purple-900/30 flex items-center gap-2">🚧 미니 뿌로파 <span className="text-sm font-bold bg-purple-900/40 px-2 py-0.5 rounded-full ml-1">{latestPpuropaSeason}</span></h3>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 ${!isPpuropaAutoOpen ? 'blur-[6px] opacity-40 select-none pointer-events-none' : ''}`}>
                  {sortTourney(currentPpuropa).map(p => renderPlayer(p, 'tourney'))}
                </div>
                {!isPpuropaAutoOpen && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050a08]/50 z-10">
                    <span className="text-5xl mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">🔒</span>
                    <h4 className="text-2xl font-black text-purple-300">기획 단계입니다</h4>
                    <p className="text-sm font-bold text-purple-500/70 mt-2 tracking-widest">COMING SOON</p>
                  </div>
                )}
              </div>

              <div className="bg-[#0a120e] border border-cyan-900/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-black text-cyan-400 mb-5 pb-3 border-b border-cyan-900/30 flex items-center gap-2">🌊 어인섬 도장깨기(수산시장)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-cyan-900/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {fishman.filter(p => p.name).map(p => renderPlayer(p, 'fishman'))}
                  {fishman.filter(p => p.name).length === 0 && <p className="text-slate-500 text-sm py-4 col-span-2 text-center">진행 중인 데이터가 없습니다.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <section className="animate-fadeIn space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2"><span className="text-emerald-500">✨</span> FCO 스트리머 명단 <span className="text-sm font-normal text-emerald-600/70 ml-2">(가나다순)</span></h2>
              <span className="text-xs font-bold bg-[#050a08] px-4 py-1.5 rounded-full text-emerald-500 border border-emerald-900/50">총 {streamers.length}명</span>
            </div>
            <div className="bg-[#0a120e] border border-emerald-900/30 rounded-3xl p-6 shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-emerald-900/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#050a08]">
                {streamers.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR')).map((s) => (
                  <div key={s.id} onClick={() => { setSearchInput(s.fcoNickname); handleSearch(s.fcoNickname); setActiveTab('ranking'); }} className="group flex items-center gap-4 bg-[#050a08] p-3 rounded-2xl border border-emerald-900/20 hover:border-emerald-500/50 transition-all cursor-pointer">
                    <img src={s.soopId ? `https://stimg.afreecatv.com/LOGO/${s.soopId.substring(0, 2)}/${s.soopId}/${s.soopId}.jpg` : 'https://via.placeholder.com/150'} referrerPolicy="no-referrer" alt="profile" className="w-10 h-10 shrink-0 rounded-full border border-slate-700 object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Img' }} />
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 group-hover:text-emerald-300 transition-colors truncate">{s.name}</span>
                        {s.isLive && (
                          <span className="shrink-0 flex items-center gap-1 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/50 shadow-[0_0_5px_rgba(239,68,68,0.2)]">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                            <span className="text-[8px] font-black text-red-500 tracking-wider mt-0.5">ON AIR</span>
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 text-[10px] font-mono group-hover:text-emerald-600 transition-colors truncate">{s.fcoNickname}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'ranking' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-[#0a120e] border border-emerald-900/50 rounded-2xl p-6 shadow-2xl relative overflow-visible">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
              
              <h2 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2 ml-2">
                <span className="animate-pulse">🟢</span> 스트리머 및 구단주 전적 검색
              </h2>
              
              <div className="flex gap-3 relative ml-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="스트리머명 또는 구단주명 입력 (예: 김민교, 교로텔리)" 
                    className="w-full bg-[#050a08] border border-emerald-900/60 rounded-xl px-5 py-4 text-emerald-100 placeholder-emerald-800/50 focus:outline-none focus:border-emerald-500/80 transition-all font-bold" 
                    value={searchInput} 
                    onChange={(e) => setSearchInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  />
                  
                  {isDropdownOpen && searchInput.trim() !== '' && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-[#0a120e] border border-emerald-900/50 rounded-xl shadow-[0_15px_50px_-12px_rgba(16,185,129,0.25)] z-[100] max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-emerald-900/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {filteredStreamers.length > 0 ? (
                        filteredStreamers.map(s => (
                          <div 
                            key={s.id} 
                            onClick={() => { setSearchInput(s.fcoNickname); handleSearch(s.fcoNickname); setIsDropdownOpen(false); }}
                            className="flex items-center gap-4 p-4 border-b border-emerald-900/30 hover:bg-emerald-900/40 cursor-pointer transition-colors last:border-0"
                          >
                            <img src={s.soopId ? `https://stimg.afreecatv.com/LOGO/${s.soopId.substring(0, 2)}/${s.soopId}/${s.soopId}.jpg` : 'https://via.placeholder.com/150'} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-emerald-500/50 object-cover shadow-[0_0_10px_rgba(16,185,129,0.2)]" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Img' }} />
                            <div className="flex flex-col flex-1">
                              <span className="text-white font-black text-sm">{s.name}</span>
                              <span className="text-emerald-400 text-xs font-mono font-bold mt-0.5">구단주: {s.fcoNickname}</span>
                            </div>
                            <span className="shrink-0 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-md">{s.tier}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-sm text-slate-400 leading-relaxed bg-[#050a08]/50">
                          <p className="text-xl mb-2">😢</p>
                          <p className="font-bold text-slate-200 mb-1">명단에 등록되지 구단주입니다.</p>
                          <p><span className="text-emerald-400 font-bold bg-emerald-900/30 px-1 py-0.5 rounded">숲 melonoff</span> 로</p>
                          <p className="text-xs mt-1 text-slate-500">[스트리머명 + 구단주닉네임] 제보 부탁드립니다!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => handleSearch()} disabled={isLoading} className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-[#050a08] px-10 py-4 rounded-xl text-sm font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 shrink-0">검색</button>
              </div>
            </div>

            {searchResult && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fadeIn">
                
                {/* 🟢 좌측 열: 프로필 + 1on1 요약 + 육각형 전력 분석 차트 */}
                <div className="xl:col-span-1 space-y-6">
                  
                  {/* 프로필 박스 */}
                  <div className="bg-[#0a120e] border border-emerald-900/50 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#050a08] ring-2 ring-emerald-500 bg-slate-800 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <img src={searchResult.soopId ? `https://stimg.afreecatv.com/LOGO/${searchResult.soopId.substring(0, 2)}/${searchResult.soopId}/${searchResult.soopId}.jpg` : 'https://via.placeholder.com/150'} referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Img' }} />
                    </div>
                    <h2 className="text-3xl font-black text-white flex flex-col items-center gap-2 mt-2">
                      <div className="flex items-center gap-2">{searchResult.name}{nexonBasic?.level && <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">Lv.{nexonBasic.level}</span>}</div>
                    </h2>
                    <p className="text-emerald-500 font-medium mt-3">구단주: <strong className="text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded ml-1">{searchResult.fcoNickname}</strong></p>
                    
                    {cusStats ? (
                      <div className="w-full bg-[#050a08] mt-6 p-4 rounded-2xl border border-emerald-900/40 shadow-inner">
                        <p className="text-slate-500 text-xs mb-1">역대 최고 등급</p>
                        <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{nexonRank && nexonRank.length > 0 ? DIVISIONS[nexonRank[0].division] || `Div ${nexonRank[0].division}` : '기록 없음'}</p>
                      </div>
                    ) : ( <div className="w-full h-20 bg-emerald-900/10 mt-6 rounded-2xl animate-pulse"></div> )}
                  </div>

                  {/* 1on1 요약 박스 */}
                  <div className="bg-[#0a120e] border border-emerald-900/50 rounded-3xl p-6 shadow-2xl">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><span className="text-emerald-500">📊</span> 커스텀 1on1 요약</h3>
                    {cusStats ? (
                       cusStats.total > 0 ? (
                        <div className="flex justify-between items-center bg-[#050a08] p-4 rounded-2xl border border-emerald-900/30">
                          <div className="text-center"><p className="text-slate-500 text-[10px] mb-1">전적 ({cusStats.total}전)</p><p className="text-emerald-400 font-black text-lg">{cusStats.wins}승 {cusStats.draws}무 {cusStats.losses}패</p></div>
                          <div className="h-10 w-px bg-emerald-900/50"></div>
                          <div className="text-center"><p className="text-slate-500 text-[10px] mb-1">승률</p><p className="text-white font-black text-2xl">{cusStats.winRate}<span className="text-sm text-emerald-500">%</span></p></div>
                        </div>
                      ) : (<p className="text-slate-500 text-sm text-center py-6">경기 데이터가 없습니다.</p>)
                    ) : (<div className="w-full h-24 bg-emerald-900/10 rounded-2xl animate-pulse"></div>)}
                  </div>

                  {/* 🌟 전력 분석 차트 */}
                  <div className="bg-[#0a120e] border border-emerald-900/50 rounded-3xl p-6 shadow-2xl">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><span className="text-emerald-500">🕸️</span> 전력 분석 차트</h3>
                    {cusStats && cusStats.total > 0 ? (
                      renderRadarChart()
                    ) : (
                      <div className="w-full h-64 bg-emerald-900/10 rounded-2xl flex items-center justify-center">
                        <p className="text-slate-500 text-sm">데이터 부족</p>
                      </div>
                    )}
                  </div>
                  
                </div>

                {/* 🟢 우측 열: 최근 경기 로그 + 원래 형태의 시트 멤버 상대전적 */}
                <div className="xl:col-span-2 space-y-6">
                  
                  {/* 최근 경기 로그 박스 */}
                  <div className="bg-[#0a120e] border border-emerald-900/50 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2 border-b border-emerald-900/30 pb-3"><span className="text-emerald-500">📝</span> 최근 경기 로그</h3>
                    {cusStats ? (
                      matchLogs.length > 0 ? (
                        <div className="space-y-2">
                          {matchLogs.map((log, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-[#050a08] p-3 md:p-4 rounded-xl border border-emerald-900/20">
                              <div className="flex items-center gap-4 w-1/4">
                                <div className={`w-10 text-center py-1 rounded text-xs font-black ${log.result === '승' ? 'bg-blue-500/20 text-blue-400' : log.result === '패' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-300'}`}>{log.result}</div>
                                <span className="text-slate-500 text-xs font-mono hidden md:block">{log.date}</span>
                              </div>
                              <div className="flex-1 flex items-center justify-center gap-3"><span className="text-emerald-400 font-black text-lg">{log.myScore}</span><span className="text-slate-600 text-xs font-bold">VS</span><span className="text-slate-300 font-bold text-lg">{log.oppScore}</span></div>
                              <div className="w-1/3 text-right"><p className="text-slate-300 font-bold text-sm truncate">{log.oppName}</p></div>
                            </div>
                          ))}
                        </div>
                      ) : (<p className="text-slate-500 text-sm text-center py-10">최근 경기 로그가 존재하지 않습니다.</p>)
                    ) : (<div className="w-full h-40 bg-emerald-900/10 rounded-2xl animate-pulse"></div>)}
                  </div>

                  {/* 시트 멤버 상대전적 */}
                  <div className="bg-[#0a120e] border border-emerald-900/50 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <div className="flex flex-col mb-5 border-b border-emerald-900/30 pb-3">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-emerald-500">⚔️</span> 시트 멤버 상대전적</h3>
                      <p className="text-[10px] text-slate-500 mt-1.5">※ 상대전적은 최근 100경기 전적을 기준으로 하며, 검색 주체에 따라 집계 시점이 달라 결과가 상이할 수 있습니다.</p>
                    </div>
                    {cusStats ? (
                      h2hData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {h2hData.map((stat, idx) => (
                            <div key={idx} className="bg-[#050a08] border border-emerald-900/30 rounded-2xl p-4 flex flex-col gap-3 group hover:border-emerald-500/50 transition-colors relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-900 group-hover:bg-emerald-500 transition-colors"></div>
                              
                              <div className="flex items-center gap-3 pl-2 flex-1">
                                <img src={stat.streamer.soopId ? `https://stimg.afreecatv.com/LOGO/${stat.streamer.soopId.substring(0, 2)}/${stat.streamer.soopId}/${stat.streamer.soopId}.jpg` : 'https://via.placeholder.com/150'} referrerPolicy="no-referrer" className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full border border-slate-700 object-cover" />
                                <div className="flex-1">
                                  <p className="font-bold text-slate-100">{stat.streamer.name}</p>
                                  <p className="text-xs text-slate-500 mt-1">{stat.wins}승 {stat.draws}무 {stat.losses}패</p>
                                </div>
                              </div>
                              
                              <div className="flex gap-2 pl-2 mt-2">
                                <button onClick={() => setSelectedH2H(stat)} className="flex-1 py-2 bg-emerald-900/20 hover:bg-emerald-800/40 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-800/30 transition-colors flex items-center justify-center gap-1 z-10 relative">
                                  📄 상세
                                </button>
                                <button onClick={() => { setSearchInput(stat.streamer.fcoNickname); handleSearch(stat.streamer.fcoNickname); }} className="flex-1 py-2 bg-blue-900/20 hover:bg-blue-800/40 text-blue-400 text-xs font-bold rounded-lg border border-blue-800/30 transition-colors flex items-center justify-center gap-1 z-10 relative">
                                  🏃‍♂️ 이동
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (<div className="bg-[#050a08] border border-emerald-900/20 border-dashed rounded-2xl p-10 text-center"><p className="text-slate-500 text-sm">최근 100경기 내에 대결 기록이 없습니다.</p></div>)
                    ) : (<div className="w-full h-40 bg-emerald-900/10 rounded-2xl animate-pulse"></div>)}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {activeTab === 'lol' && (
          <div className="flex flex-col gap-8 animate-fadeIn max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#050812] border border-blue-900/50 rounded-3xl p-6 shadow-[0_0_30px_rgba(37,99,235,0.1)] flex flex-col"><h3 className="text-xl font-black text-blue-500 mb-5 text-center tracking-widest">🟦 BLUE TEAM</h3><div className="space-y-3 flex-1 flex flex-col justify-center">{(['탑', '정글', '미드', '원딜', '서포터'] as const).map((role) => (<div key={role} className="flex justify-between items-center bg-blue-950/20 p-4 rounded-xl border border-blue-900/30"><span className="text-blue-500/70 font-bold text-sm w-12">{role}</span><span className="font-bold text-white text-lg">{blueTeam ? blueTeam[role] : '대기 중...'}</span></div>))}</div></div>
              <div className="bg-[#120505] border border-red-900/50 rounded-3xl p-6 shadow-[0_0_30px_rgba(220,38,38,0.1)] flex flex-col"><h3 className="text-xl font-black text-red-500 mb-5 text-center tracking-widest">🟥 RED TEAM</h3><div className="space-y-3 flex-1 flex flex-col justify-center">{(['탑', '정글', '미드', '원딜', '서포터'] as const).map((role) => (<div key={role} className="flex justify-between items-center bg-red-950/20 p-4 rounded-xl border border-red-900/30"><span className="text-red-500/70 font-bold text-sm w-12">{role}</span><span className="font-bold text-white text-lg">{redTeam ? redTeam[role] : '대기 중...'}</span></div>))}</div></div>
            </div>
            <div className="w-full flex flex-col bg-[#0a120e] border border-emerald-900/50 rounded-3xl p-8 md:p-10 shadow-2xl relative"><h2 className="text-3xl font-black text-white mb-2 text-center">⚔️ 롤 라인업 입력</h2>
              <div className="space-y-5 mb-10 mt-5 flex-1">
                {(['탑', '정글', '미드', '원딜', '서포터'] as const).map((role) => (
                  <div key={role} className="flex flex-col md:flex-row items-center gap-3 md:gap-6 bg-[#050a08] p-4 rounded-2xl border border-emerald-900/30">
                    <div className="w-full md:w-20 text-center font-black text-emerald-500 bg-emerald-900/20 py-3 rounded-xl border border-emerald-900/40">{role}</div>
                    <input type="text" placeholder="플레이어 1" className="flex-1 w-full bg-transparent border border-slate-800 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 text-center md:text-left" value={lolPlayers[role][0]} onChange={(e) => setLolPlayers({...lolPlayers, [role]: [e.target.value, lolPlayers[role][1]]})} />
                    <span className="text-slate-700 font-black italic hidden md:block">VS</span>
                    <input type="text" placeholder="플레이어 2" className="flex-1 w-full bg-transparent border border-slate-800 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 text-center md:text-left" value={lolPlayers[role][1]} onChange={(e) => setLolPlayers({...lolPlayers, [role]: [lolPlayers[role][0], e.target.value]})} />
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-auto"><button onClick={handleShuffleTeams} className="w-full md:w-auto px-16 py-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-[#050a08] font-black text-xl rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform">팀 섞기 🎲</button></div>
            </div>
          </div>
        )}

        {activeTab === 'pinball' && (
          <div className="max-w-4xl mx-auto animate-fadeIn space-y-8">
            <div className="bg-[#0a120e] border border-pink-900/50 rounded-3xl p-8 shadow-[0_0_40px_rgba(236,72,153,0.1)] relative overflow-hidden"><h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-2 text-center relative z-10">🎯 아케이드 럭키 핀볼</h2>
              <div className="flex flex-col md:flex-row gap-8 relative z-10 mt-10">
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                  <textarea className="w-full h-40 md:h-full bg-[#050812] border border-pink-900/30 rounded-2xl p-4 text-pink-100 focus:outline-none focus:border-pink-500/50 resize-none" placeholder="치킨, 꽝, 만원" value={pbItems} onChange={(e) => setPbItems(e.target.value)} />
                  <button onClick={handleStartPinball} disabled={pbRolling} className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white font-black text-xl rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:opacity-50 transition-all">{pbRolling ? '추첨 중...' : '시작 🕹️'}</button>
                </div>
                <div className="w-full md:w-2/3 h-64 bg-[#050812] border-4 border-pink-900/30 rounded-3xl flex items-center justify-center relative shadow-inner overflow-hidden">
                  {pbRolling ? (<div className="text-4xl md:text-5xl font-black text-pink-300 animate-pulse tracking-widest drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">{pbCurrent}</div>) : pbResult ? (<div className="flex flex-col items-center animate-bounce"><span className="text-pink-500 text-sm font-bold mb-2">당첨 결과</span><div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">🎉 {pbResult} 🎉</div></div>) : (<div className="text-xl font-bold text-pink-900/50 tracking-widest">READY TO START</div>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ladder' && (
          <div className="max-w-6xl mx-auto animate-fadeIn space-y-8">
            <div className="bg-[#0a120e] border border-amber-900/50 rounded-3xl p-8 shadow-[0_0_40px_rgba(245,158,11,0.1)] relative overflow-hidden">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-2 text-center">🪜 사다리 타기</h2>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#050a08] p-4 rounded-2xl border border-amber-900/30 flex-wrap">
                <div className="flex items-center gap-4">
                  <span className="text-amber-500 font-bold">인원 수 ({ladderCols}명)</span>
                  <div className="flex gap-2">
                    <button onClick={() => setLadderCols(p => Math.max(2, p - 1))} className="w-10 h-10 rounded-full bg-amber-900/30 text-amber-400 hover:bg-amber-900/60 font-black text-xl flex items-center justify-center">-</button>
                    <button onClick={() => setLadderCols(p => Math.min(20, p + 1))} className="w-10 h-10 rounded-full bg-amber-900/30 text-amber-400 hover:bg-amber-900/60 font-black text-xl flex items-center justify-center">+</button>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap justify-center">
                  <button onClick={generateLadder} className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-500 text-[#050a08] font-black rounded-xl hover:from-amber-500 hover:to-orange-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    🎲 사다리 생성
                  </button>
                  <button onClick={handleShowAllLadderResults} className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-[#050a08] font-black rounded-xl hover:from-emerald-500 hover:to-teal-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    📊 전체결과
                  </button>
                  <button onClick={handleResetLadder} className="px-6 py-2 bg-slate-800 text-slate-300 font-black rounded-xl hover:bg-slate-700 transition-all border border-slate-700">
                    🔄 초기화
                  </button>
                </div>
              </div>

              <div className="w-full overflow-x-auto pb-6 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-amber-900/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#050a08]">
                <div style={{ minWidth: ladderCols > 8 ? `${ladderCols * 80}px` : '100%' }} className="relative px-2">
                  <div className="flex justify-between mb-4 relative z-10">{Array.from({length: ladderCols}).map((_, i) => (<div key={`p-${i}`} className="flex-1 px-1 flex justify-center"><div className="flex flex-col gap-2 w-full max-w-[90px]"><input type="text" className="w-full text-center text-xs md:text-sm font-bold bg-[#050812] border-2 border-amber-900/50 hover:border-amber-500/50 rounded-lg py-1.5 text-slate-200 focus:outline-none focus:border-amber-500" value={ladderPlayers[i] || ''} onChange={(e) => { const newP = [...ladderPlayers]; newP[i] = e.target.value; setLadderPlayers(newP); }} placeholder={`참가${i+1}`} /><button onClick={() => traceLadder(i)} className={`w-full py-1.5 text-[10px] md:text-xs font-black rounded-lg transition-all ${ladderPath && ladderPath[0].x === i ? 'bg-amber-500 text-amber-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-amber-900/30 text-amber-500 hover:bg-amber-400 hover:text-amber-950 border border-amber-900/50'}`}>START</button></div></div>))}</div>
                  <div className="relative h-[450px] w-full bg-[#050812] border border-amber-900/30 rounded-2xl overflow-hidden shadow-inner">{ladderLines.length === 0 ? (<div className="absolute inset-0 flex items-center justify-center text-amber-900/50 font-black text-2xl tracking-widest">생성 버튼을 눌러주세요</div>) : (<svg viewBox="0 0 1000 1000" className="w-full h-full" preserveAspectRatio="none">{Array.from({length: ladderCols}).map((_, c) => ( <line key={`v-${c}`} x1={getX(c)} y1={0} x2={getX(c)} y2={SVG_H} stroke="#451a03" strokeWidth="6" /> ))}{ladderLines.map((rowArr, r) => rowArr.map((hasLine, c) => hasLine && ( <line key={`h-${r}-${c}`} x1={getX(c)} y1={getY(r+1)} x2={getX(c+1)} y2={getY(r+1)} stroke="#451a03" strokeWidth="6" /> )) )}{ladderPath && (<polyline key={ladderAnimKey} points={ladderPath.map(p => `${getX(p.x)},${getY(p.y)}`).join(' ')} fill="none" stroke="#fbbf24" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 30000, strokeDashoffset: 30000, animation: 'drawLineAnimation 1.5s linear forwards' }} />)}</svg>)}</div>
                  <div className="flex justify-between mt-4 relative z-10">{Array.from({length: ladderCols}).map((_, i) => (<div key={`r-${i}`} className="flex-1 px-1 flex justify-center"><input type="text" className={`w-full max-w-[90px] text-center text-xs md:text-sm font-bold bg-[#050a08] border-2 rounded-lg py-2 transition-all focus:outline-none focus:border-amber-500 ${ladderEndIdx === i ? 'border-red-500 text-red-400 bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-110' : 'border-amber-900/50 text-slate-400'}`} value={ladderResults[i] || ''} onChange={(e) => { const newR = [...ladderResults]; newR[i] = e.target.value; setLadderResults(newR); }} placeholder={`결과${i+1}`} /></div>))}</div>
                </div>
              </div>

              {ladderAllResults && (
                <div className="mt-8 bg-[#050a08] p-6 rounded-2xl border border-emerald-900/50 animate-fadeIn">
                  <h3 className="text-xl font-black text-emerald-400 mb-4 text-center">📊 전체 사다리 결과</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {ladderAllResults.map((res, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#0a120e] p-3 rounded-xl border border-emerald-900/30">
                        <span className="text-slate-300 font-bold truncate flex-1">{res.player}</span>
                        <span className="text-slate-500 mx-2">➔</span>
                        <span className="text-emerald-400 font-black shrink-0">{res.result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}