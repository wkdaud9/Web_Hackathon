import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getHackathonDetail, getTeams, getLeaderboard, addSubmission, getSubmissions } from '../utils/api';

export default function HackathonDetailPage() {
  const { slug } = useParams();
  const [detail, setDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tab states data
  const [teams, setTeams] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Form state
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitFile, setSubmitFile] = useState('');

  useEffect(() => {
    if (slug) {
      setDetail(getHackathonDetail(slug));
      setTeams(getTeams(slug));
      setLeaderboard(getLeaderboard(slug));
      setSubmissions(getSubmissions().filter((s:any) => s.hackathonSlug === slug));
    }
  }, [slug]);

  if (!detail) {
    return <div className="text-center py-20 text-gray-500 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin mb-4"></div>
      데이터를 불러오는 중입니다...
    </div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitFile && !submitNotes) return;
    const newSub = {
      id: Date.now(),
      hackathonSlug: slug,
      notes: submitNotes,
      fileUrl: submitFile,
      submittedAt: new Date().toISOString(),
    };
    addSubmission(newSub);
    setSubmissions([...submissions, newSub]);
    setSubmitNotes('');
    setSubmitFile('');
    alert('제출이 완료되었습니다!');
  };

  const tabs = [
    { id: 'overview', label: '해커톤 개요' },
    { id: 'eval', label: '평가 기준' },
    { id: 'schedule', label: '일정 안내' },
    { id: 'prize', label: '상금 내역' },
    { id: 'teams', label: '참여 팀 현황' },
    { id: 'submit', label: '결과물 제출' },
    { id: 'leaderboard', label: '현재 순위 (Rank)' }
  ];

  return (
    <div className="w-full">
      <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mb-8">
        <Link to="/hackathons" className="text-sm font-bold text-gray-500 hover:text-white mb-2 inline-block transition-colors">&larr; 목록으로 돌아가기</Link>
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-white mb-4 bg-clip-text truncate">{detail.title}</h1>
      </motion.div>

      {/* Tabs Menu */}
      <div className="flex flex-nowrap overflow-x-auto gap-2 mb-8 border-b border-white/10 pb-4 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id ? 'bg-cta text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-primary/50 text-gray-400 hover:bg-primary hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-primary/40 p-6 md:p-10 rounded-3xl border border-white/5 min-h-[400px] shadow-2xl relative overflow-hidden"
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />

          {activeTab === 'overview' && (
            <div className="relative z-10">
               <h2 className="text-2xl font-bold font-heading mb-6 text-white flex items-center gap-2">
                 <span className="w-2 h-6 bg-cta rounded-full"></span> 개요
               </h2>
               <p className="text-gray-300 leading-relaxed mb-8 text-lg">{detail.sections?.overview?.summary || '제공된 개요가 없습니다.'}</p>
               
               <h3 className="text-xl font-bold mb-4 text-white">유의사항 (Notice)</h3>
               <ul className="list-disc pl-5 text-gray-400 space-y-3">
                 {detail.sections?.info?.notice?.map((n:string, i:number) => <li key={i}>{n}</li>)}
               </ul>
            </div>
          )}

          {activeTab === 'eval' && (
            <div className="relative z-10">
               <h2 className="text-2xl font-bold font-heading mb-6 text-white flex items-center gap-2">
                 <span className="w-2 h-6 bg-cta rounded-full"></span> 평가 기준
               </h2>
               <p className="text-gray-300 mb-6 text-lg">{detail.sections?.eval?.description || '평가 상세 정보가 없습니다.'}</p>
               
               {detail.sections?.eval?.scoreDisplay && (
                 <div className="bg-secondary/40 p-6 rounded-2xl border border-white/5 inline-block min-w-[300px]">
                   <h3 className="font-bold text-cta mb-4 text-lg">{detail.sections.eval.scoreDisplay.label} 가중치 안내</h3>
                   <ul className="space-y-3">
                     {detail.sections.eval.scoreDisplay.breakdown?.map((b:any, i:number) => (
                       <li key={i} className="flex justify-between items-center text-gray-300 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                         <span>{b.label}</span>
                         <span className="font-mono text-white bg-white/10 px-2 py-1 rounded-md">{b.weightPercent}%</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="relative z-10">
               <h2 className="text-2xl font-bold font-heading mb-6 text-white flex items-center gap-2">
                 <span className="w-2 h-6 bg-cta rounded-full"></span> 일정 (KST 기준)
               </h2>
               <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                 {detail.sections?.schedule?.milestones?.map((m:any, i:number) => (
                   <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-primary bg-cta md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shrink-0 z-10 ml-0 md:ml-auto md:mr-auto"></div>
                     <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] bg-secondary/30 p-4 rounded-xl border border-white/5 hover:border-cta/30 transition-colors">
                       <div className="font-bold text-white mb-1">{m.name}</div>
                       <time className="text-sm text-cta font-mono">{new Date(m.at).toLocaleString()}</time>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'prize' && (
            <div className="relative z-10 max-w-2xl">
               <h2 className="text-2xl font-bold font-heading mb-6 text-white flex items-center gap-2">
                 <span className="w-2 h-6 bg-cta rounded-full"></span> 상금 리스트
               </h2>
               <div className="space-y-3">
                 {detail.sections?.prize?.items?.map((item:any, i:number) => (
                   <div key={i} className="bg-gradient-to-r from-secondary/50 to-secondary/20 p-5 rounded-2xl flex justify-between items-center border border-white/5 hover:border-amber-500/30 transition-colors">
                     <div className="flex items-center gap-4">
                        <span className="text-3xl">{item.place === '1st' ? '🥇' : item.place === '2nd' ? '🥈' : item.place === '3rd' ? '🥉' : '🏅'}</span>
                        <strong className="text-xl text-white uppercase tracking-wider">{item.place} PLACE</strong>
                     </div>
                     <span className="font-bold text-xl text-amber-400 font-mono">{item.amountKRW.toLocaleString()} KRW</span>
                   </div>
                 )) || <p className="text-gray-400 italic">상금 정보가 준비되지 않았습니다.</p>}
               </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="relative z-10">
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                 <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
                   <span className="w-2 h-6 bg-cta rounded-full"></span> 참여/모집 팀 ({teams.length})
                 </h2>
                 <Link to={`/camp?hackathon=${slug}`} className="px-5 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2">
                   + 팀 모집글 등록
                 </Link>
               </div>
               
               {teams.length === 0 ? (
                 <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-white/5 border-dashed">
                   <p className="text-gray-400 mb-2">아직 이 해커톤을 위한 팀이 없습니다.</p>
                   <p className="text-sm text-gray-500">첫 팀을 결성하고 멤버를 구해 우승에 도전하세요!</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   {teams.map((t:any) => (
                     <div key={t.teamCode} className="bg-secondary/40 p-5 rounded-2xl border border-white/5 hover:border-cta/20 transition-all flex flex-col h-full">
                       <div className="flex justify-between items-start mb-2">
                         <h3 className="font-bold text-lg text-white group-hover:text-cta">{t.name}</h3>
                         <span className="bg-primary px-2 py-1 rounded-md text-xs font-mono text-gray-400 border border-white/5">
                           {t.memberCount} MBRS
                         </span>
                       </div>
                       <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">{t.intro}</p>
                       <div className="text-xs text-cta/80 flex gap-2">
                         {t.lookingFor?.map((role:string) => <span key={role}>#{role}</span>)}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'submit' && (
            <div className="relative z-10">
               <h2 className="text-2xl font-bold font-heading mb-6 text-white flex items-center gap-2">
                 <span className="w-2 h-6 bg-cta rounded-full"></span> 결과물 제출
               </h2>
               
               <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl mb-8">
                 <ul className="list-disc pl-5 text-blue-200 text-sm space-y-2 leading-relaxed">
                   {detail.sections?.submit?.guide?.map((g:string, i:number) => <li key={i}>{g}</li>) || <li>가이드가 없습니다. 규칙에 맞게 제출하세요.</li>}
                 </ul>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl bg-secondary/20 p-6 md:p-8 rounded-3xl border border-white/5 shadow-inner">
                 <div>
                   <label className="block text-sm font-semibold text-gray-300 mb-2">제출 파일 / URL 링크</label>
                   <input 
                     type="text" 
                     className="w-full bg-primary/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cta focus:ring-1 focus:ring-cta transition-all" 
                     placeholder="https://github.com/..."
                     value={submitFile}
                     onChange={(e) => setSubmitFile(e.target.value)}
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-300 mb-2">설명 메시지 (선택)</label>
                   <textarea 
                     className="w-full bg-primary/80 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cta focus:ring-1 focus:ring-cta transition-all h-32 resize-none"
                     placeholder="심사위원이 확인할 참고 사항이나 서비스 소개를 남겨주세요."
                     value={submitNotes}
                     onChange={(e) => setSubmitNotes(e.target.value)}
                   ></textarea>
                 </div>
                 <button type="submit" className="w-full py-3.5 bg-cta text-black font-bold rounded-xl hover:bg-green-400 transition-colors shadow-lg active:scale-[0.98]">
                   로컬에 제출 저장하기
                 </button>
               </form>

               {submissions.length > 0 && (
                 <div className="mt-10 max-w-2xl">
                   <h3 className="font-bold mb-4 text-white">최근 제출 기록</h3>
                   <div className="space-y-3">
                     {submissions.slice().reverse().map((s:any) => (
                       <div key={s.id} className="bg-secondary/30 p-4 rounded-xl text-sm border border-white/5 border-l-4 border-l-cta">
                         <div className="flex justify-between text-gray-500 text-xs mb-2">
                           <span>제출 시간</span>
                           <span>{new Date(s.submittedAt).toLocaleString()}</span>
                         </div>
                         <div className="text-green-300 mb-2 font-mono truncate">{s.fileUrl}</div>
                         <div className="text-gray-300">{s.notes}</div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="relative z-10 w-full overflow-hidden">
               <h2 className="text-2xl font-bold font-heading mb-4 text-white flex items-center gap-2">
                 <span className="w-2 h-6 bg-cta rounded-full"></span> 리더보드
               </h2>
               <p className="text-gray-400 mb-8 max-w-2xl leading-relaxed">{detail.sections?.leaderboard?.note}</p>
               
               {!leaderboard || !leaderboard.entries || leaderboard.entries.length === 0 ? (
                 <div className="bg-secondary/20 p-10 rounded-2xl border border-white/5 text-center text-gray-500">
                   아직 리더보드 점수가 등록되지 않았습니다.
                 </div>
               ) : (
                 <div className="w-full overflow-x-auto rounded-2xl border border-white/10">
                   <table className="w-full text-left border-collapse min-w-[600px]">
                     <thead>
                       <tr className="bg-secondary/50 text-gray-400 text-xs uppercase tracking-wider">
                         <th className="py-4 px-6 font-semibold">순위</th>
                         <th className="py-4 px-6 font-semibold">팀명</th>
                         <th className="py-4 px-6 font-semibold text-right">최종 점수</th>
                         <th className="py-4 px-6 font-semibold text-right">제출 일자</th>
                       </tr>
                     </thead>
                     <tbody className="bg-primary/20 divide-y divide-white/5">
                       {leaderboard.entries?.map((entry:any) => (
                         <tr key={entry.teamName} className="hover:bg-white/5 transition-colors group">
                           <td className="py-4 px-6">
                             <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                               entry.rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                               entry.rank === 2 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30' : 
                               entry.rank === 3 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' : 
                               'bg-secondary/50 text-gray-500 border border-white/10'
                             }`}>
                               {entry.rank}
                             </span>
                           </td>
                           <td className="py-4 px-6 text-gray-200 font-bold group-hover:text-white transition-colors">
                             {entry.teamName}
                           </td>
                           <td className="py-4 px-6 text-cta font-mono font-bold text-right text-lg">
                             {entry.score}
                           </td>
                           <td className="py-4 px-6 text-sm text-gray-500 font-mono text-right">
                             {new Date(entry.submittedAt).toLocaleDateString()}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
