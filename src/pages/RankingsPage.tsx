import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllLeaderboards, getHackathons } from '../utils/api';
import { Trophy, Medal, Star, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RankingsPage() {
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<string>('all');

  useEffect(() => {
    setLeaderboards(getAllLeaderboards());
    setHackathons(getHackathons());
  }, []);

  const displayedBoards = selectedHackathon === 'all' 
    ? leaderboards 
    : leaderboards.filter(l => l.hackathonSlug === selectedHackathon);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}}>
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-white mb-2 flex items-center gap-3">
            <Trophy className="w-10 h-10 text-amber-400" />
            Hall of Fame
          </h1>
          <p className="text-gray-400">명예의 전당. 해커톤별 리더보드를 확인하세요.</p>
        </motion.div>
        
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}}>
          <select 
            className="w-full md:w-64 bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cta outline-none shadow-lg"
            value={selectedHackathon} onChange={(e) => setSelectedHackathon(e.target.value)}
          >
            <option value="all">모든 해커톤 명예의 전당 보기</option>
            {hackathons.map(h => (
              <option key={h.slug} value={h.slug}>{h.title}</option>
            ))}
          </select>
        </motion.div>
      </div>

      <div className="space-y-16">
        {displayedBoards.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-3xl">
            데이터가 없습니다.
          </div>
        ) : (
          displayedBoards.map((board, idx) => {
            const h = hackathons.find(hx => hx.slug === board.hackathonSlug);
            const title = h ? h.title : board.hackathonSlug;
            
            return (
              <motion.div 
                key={board.hackathonSlug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-primary/20 rounded-3xl border border-white/5 overflow-hidden"
              >
                <div className="bg-primary/60 p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
                       <Hash className="text-amber-500 w-5 h-5"/>
                       <Link to={`/hackathons/${board.hackathonSlug}`} className="hover:text-amber-400 transition-colors">
                         {title}
                       </Link>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">업데이트: {new Date(board.updatedAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Top 3 Podium (Visual) */}
                    <div className="lg:col-span-1 border border-white/5 bg-secondary/20 rounded-3xl p-6 flex flex-col justify-end min-h-[300px] relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none" />
                       <h3 className="text-lg font-bold text-center text-amber-500 mb-6 font-heading flex items-center justify-center gap-2">
                         <Star className="w-5 h-5"/> TOP 3 <Star className="w-5 h-5"/>
                       </h3>
                       <div className="flex items-end justify-center gap-2 h-48">
                         {/* Rank 2 */}
                         {board.entries[1] && (
                           <div className="w-1/3 flex flex-col items-center">
                             <div className="text-xs text-gray-400 mb-1 truncate w-full text-center px-1 font-bold">{board.entries[1].teamName}</div>
                             <div className="w-full bg-gray-400/20 h-[60%] rounded-t-lg relative flex flex-col items-center justify-start pt-2 border-t-2 border-gray-400 group relative">
                               <Medal className="w-6 h-6 text-gray-400" />
                               <span className="text-xs font-mono font-bold mt-2 text-white">{board.entries[1].score}</span>
                             </div>
                           </div>
                         )}
                         {/* Rank 1 */}
                         {board.entries[0] && (
                           <div className="w-1/3 flex flex-col items-center">
                             <div className="text-xs text-amber-400 mb-1 truncate w-full text-center px-1 font-bold">{board.entries[0].teamName}</div>
                             <div className="w-full bg-amber-500/20 h-[85%] rounded-t-lg relative flex flex-col items-center justify-start pt-2 border-t-2 border-amber-500 group relative">
                               <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_currentColor]" />
                               <span className="text-sm font-mono font-bold mt-2 text-white">{board.entries[0].score}</span>
                             </div>
                           </div>
                         )}
                         {/* Rank 3 */}
                         {board.entries[2] && (
                           <div className="w-1/3 flex flex-col items-center">
                             <div className="text-xs text-orange-400 mb-1 truncate w-full text-center px-1 font-bold">{board.entries[2].teamName}</div>
                             <div className="w-full bg-orange-700/20 h-[45%] rounded-t-lg relative flex flex-col items-center justify-start pt-2 border-t-2 border-orange-700 group relative">
                               <Medal className="w-6 h-6 text-orange-400" />
                               <span className="text-xs font-mono font-bold mt-2 text-white">{board.entries[2].score}</span>
                             </div>
                           </div>
                         )}
                       </div>
                    </div>

                    {/* Table View */}
                    <div className="lg:col-span-2 overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/5 text-gray-500 text-sm">
                            <th className="py-3 px-4 font-normal">순위</th>
                            <th className="py-3 px-4 font-normal">팀명</th>
                            <th className="py-3 px-4 font-normal text-right">최종 점수</th>
                            <th className="py-3 px-4 font-normal text-right">제출일</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {board.entries.map((entry:any) => (
                            <tr key={entry.teamName} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                                  entry.rank === 1 ? 'bg-amber-500/20 text-amber-500' :
                                  entry.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                                  entry.rank === 3 ? 'bg-orange-700/30 text-orange-400' :
                                  'text-gray-500'
                                }`}>
                                  {entry.rank}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-200 font-bold">{entry.teamName}</td>
                              <td className="py-3 px-4 text-right font-mono text-cta">{entry.score}</td>
                              <td className="py-3 px-4 text-right text-sm text-gray-500">
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
