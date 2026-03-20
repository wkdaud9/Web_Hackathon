import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getAllLeaderboards, getHackathons } from '../utils/api';
import { Trophy, Medal, Star, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Hackathon, Leaderboard, LeaderboardEntry } from '../types/models';

export default function RankingsPage() {
  const [leaderboards] = useState<Leaderboard[]>(() => getAllLeaderboards());
  const [hackathons] = useState<Hackathon[]>(() => getHackathons());
  const [selectedHackathon, setSelectedHackathon] = useState<string>('all');
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('all');

  const periodFiltered = useMemo(() => {
    if (period === 'all') return leaderboards;
    const now = Date.now();
    const rangeDays = period === '7d' ? 7 : 30;
    return leaderboards
      .map((board) => ({
        ...board,
        entries: board.entries.filter((entry) => {
          const t = new Date(entry.submittedAt).getTime();
          return now - t <= rangeDays * 24 * 60 * 60 * 1000;
        }),
      }))
      .filter((board) => board.entries.length > 0);
  }, [leaderboards, period]);

  const displayedBoards = selectedHackathon === 'all' 
    ? periodFiltered 
    : periodFiltered.filter(l => l.hackathonSlug === selectedHackathon);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}}>
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-primary tracking-tight mb-2 flex items-center gap-3">
            <Trophy className="w-10 h-10 text-amber-500" />
            명예의 전당
          </h1>
          <p className="text-secondary font-medium mt-2">대회별 순위, 점수, 제출 시점을 한눈에 확인하세요.</p>
        </motion.div>
        
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}}>
          <div className="flex flex-col md:flex-row gap-3">
            <select 
              className="w-full md:w-64 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all shadow-sm appearance-none cursor-pointer"
              value={selectedHackathon} onChange={(e) => setSelectedHackathon(e.target.value)}
            >
              <option value="all">모든 해커톤 명예의 전당 보기</option>
              {hackathons.map(h => (
                <option key={h.slug} value={h.slug}>{h.title}</option>
              ))}
            </select>
            <select
              className="w-full md:w-40 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all shadow-sm appearance-none cursor-pointer"
              value={period}
              onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | 'all')}
            >
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="all">전체 기간</option>
            </select>
          </div>
        </motion.div>
      </div>

      <div className="space-y-16">
        {displayedBoards.length === 0 ? (
          <div className="text-center py-20 text-tertiary border border-dashed border-gray-200 rounded-[24px] bg-white shadow-sm font-medium">
            데이터가 없습니다.
          </div>
        ) : (
          displayedBoards.map((board, idx) => {
            const h = hackathons.find(hx => hx.slug === board.hackathonSlug);
            const title = h ? h.title : board.hackathonSlug;
            const entries = Array.isArray(board.entries) ? board.entries : [];
            
            return (
              <motion.div 
                key={board.hackathonSlug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[28px] border border-gray-100 overflow-hidden shadow-[0_4px_24px_rgb(0,0,0,0.04)]"
              >
                <div className="bg-gray-50/50 p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[24px] font-bold font-heading text-primary flex items-center gap-2">
                       <Hash className="text-cta w-6 h-6"/>
                       <Link to={`/hackathons/${board.hackathonSlug}`} className="hover:text-cta transition-colors">
                         {title}
                       </Link>
                    </h2>
                     <p className="text-[14px] font-medium text-tertiary mt-2">업데이트: {new Date(board.updatedAt).toLocaleString()}</p>
                   </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Top 3 Podium (Visual) */}
                     <div className="lg:col-span-1 border border-gray-100 bg-gray-50 rounded-[24px] p-6 flex flex-col justify-end min-h-[300px] relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none" />
                       <h3 className="text-xl font-bold text-center text-primary mb-8 font-heading flex items-center justify-center gap-2">
                         <Star className="w-5 h-5 text-amber-500 fill-amber-500"/> TOP 3 <Star className="w-5 h-5 text-amber-500 fill-amber-500"/>
                       </h3>
                       <div className="flex items-end justify-center gap-3 h-48 relative z-10">
                         {/* Rank 2 */}
                          {entries[1] && (
                            <div className="w-1/3 flex flex-col items-center">
                              <div className="text-[13px] text-secondary mb-2 w-full text-center px-1 font-bold line-clamp-2 leading-tight">{entries[1].teamName}</div>
                              <div className="w-full bg-white h-[60%] rounded-t-xl shadow-sm border border-gray-200 border-b-0 flex flex-col items-center justify-start pt-3">
                                <Medal className="w-6 h-6 text-gray-400" />
                                <span className="text-[15px] font-mono font-bold mt-2 text-primary">{entries[1].score}</span>
                              </div>
                            </div>
                          )}
                          {/* Rank 1 */}
                          {entries[0] && (
                            <div className="w-1/3 flex flex-col items-center z-10 -ml-1 -mr-1">
                              <div className="text-[14px] text-cta mb-2 w-full text-center px-1 font-extrabold line-clamp-2 leading-tight">{entries[0].teamName}</div>
                              <div className="w-[110%] bg-blue-50 h-[85%] rounded-t-xl shadow-md border border-blue-200 border-b-0 flex flex-col items-center justify-start pt-4">
                                <Trophy className="w-9 h-9 text-amber-500 drop-shadow-sm" />
                                <span className="text-[17px] font-mono font-black mt-2 text-cta">{entries[0].score}</span>
                              </div>
                            </div>
                          )}
                          {/* Rank 3 */}
                          {entries[2] && (
                            <div className="w-1/3 flex flex-col items-center">
                              <div className="text-[13px] text-secondary mb-2 w-full text-center px-1 font-bold line-clamp-2 leading-tight">{entries[2].teamName}</div>
                              <div className="w-full bg-white h-[45%] rounded-t-xl shadow-sm border border-gray-200 border-b-0 flex flex-col items-center justify-start pt-3">
                                <Medal className="w-6 h-6 text-orange-400" />
                                <span className="text-[15px] font-mono font-bold mt-2 text-primary">{entries[2].score}</span>
                              </div>
                            </div>
                          )}
                       </div>
                    </div>

                    {/* Table View */}
                    <div className="lg:col-span-2 overflow-x-auto bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100 text-tertiary text-[13px] bg-gray-50/50">
                            <th className="py-4 px-6 font-bold">순위</th>
                            <th className="py-4 px-6 font-bold">팀명</th>
                            <th className="py-4 px-6 font-bold text-right">최종 점수</th>
                            <th className="py-4 px-6 font-bold text-right">제출일</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[15px]">
                          {entries.map((entry: LeaderboardEntry) => (
                            <tr key={entry.teamName} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-black ${
                                  entry.rank === 1 ? 'bg-amber-100 text-amber-600' :
                                  entry.rank === 2 ? 'bg-gray-100 text-gray-500' :
                                  entry.rank === 3 ? 'bg-orange-100 text-orange-600' :
                                  'text-secondary border border-gray-200'
                                }`}>
                                  {entry.rank}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-primary font-bold">{entry.teamName}</td>
                              <td className="py-4 px-6 text-right font-mono font-bold text-cta text-[17px]">{entry.score}</td>
                              <td className="py-4 px-6 text-right text-[14px] text-tertiary font-medium font-mono">
                                {new Date(entry.submittedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  );
}
