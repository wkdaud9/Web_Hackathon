import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeams, addTeam, getHackathons } from '../utils/api';
import { Users, X, Plus, ExternalLink, Hash } from 'lucide-react';

export default function CampPage() {
  const [searchParams] = useSearchParams();
  const hackathonSlugParam = searchParams.get('hackathon');

  const [teams, setTeams] = useState<any[]>([]);
  const [hackathons, setHackathons] = useState<any[]>([]);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    intro: '',
    hackathonSlug: hackathonSlugParam || '',
    lookingFor: '',
    contact: ''
  });

  useEffect(() => {
    setTeams(getTeams(hackathonSlugParam || undefined));
    setHackathons(getHackathons());
  }, [hackathonSlugParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTeam = {
      teamCode: 'T-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      name: formData.name,
      intro: formData.intro,
      hackathonSlug: formData.hackathonSlug,
      lookingFor: formData.lookingFor.split(',').map(s => s.trim()).filter(s => s.length > 0),
      contact: { type: 'link', url: formData.contact },
      createdAt: new Date().toISOString(),
      memberCount: 1,
      isOpen: true,
    };
    addTeam(newTeam);
    setTeams([newTeam, ...teams]);
    setShowForm(false);
    setFormData({ name: '', intro: '', hackathonSlug: '', lookingFor: '', contact: '' });
  };

  return (
    <div className="w-full relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}}>
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-white mb-2">Team Camp</h1>
          <p className="text-gray-400">
            {hackathonSlugParam ? '이 해커톤에 참여할 팀을 찾거나 모집해보세요!' : '모든 해커톤의 팀 빌딩 라운지입니다.'}
          </p>
        </motion.div>
        
        <motion.button
          initial={{opacity:0}}
          animate={{opacity:1}}
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-cta text-black font-bold rounded-2xl hover:bg-green-400 hover:-translate-y-1 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> 새 팀 모집하기
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-10"
          >
            <div className="bg-primary/50 border border-cta/30 p-6 md:p-8 rounded-3xl relative">
              <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold font-heading text-white mb-6">신규 팀 등록</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">팀 이름 *</label>
                  <input required
                    type="text" 
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cta focus:ring-1 focus:ring-cta transition-all" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">목표 해커톤 (선택)</label>
                  <select 
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cta outline-none"
                    value={formData.hackathonSlug} onChange={e => setFormData({...formData, hackathonSlug: e.target.value})}
                  >
                    <option value="">-- 자유 주제 / 미정 --</option>
                    {hackathons.map(h => (
                      <option key={h.slug} value={h.slug}>{h.title}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">팀 소개 및 목표 *</label>
                  <textarea required
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cta focus:ring-1 focus:ring-cta transition-all h-24 resize-none"
                    placeholder="어떤 아이디어를 실현하고 싶은지 적어주세요!"
                    value={formData.intro} onChange={e => setFormData({...formData, intro: e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">모집 포지션 (쉼표로 구분)</label>
                  <input 
                    type="text" 
                    placeholder="기획자, 프론트엔드, 디자이너"
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cta" 
                    value={formData.lookingFor} onChange={e => setFormData({...formData, lookingFor: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">연락을 받을 URL (오픈카톡 등) *</label>
                  <input required
                    type="url" 
                    placeholder="https://open.kakao.com/..."
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cta" 
                    value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end mt-4">
                  <button type="submit" className="px-8 py-3 bg-cta text-black font-bold rounded-xl hover:bg-green-400 transition-colors shadow-lg">
                    둥지 틀기 (등록)
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team List */}
      {teams.length === 0 ? (
        <div className="text-center py-20 bg-primary/20 rounded-3xl border border-white/5">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-bold text-gray-400">아직 등록된 팀이 없습니다.</h3>
          <p className="text-gray-500 mt-2">첫 번째 팀의 리더가 되어보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, idx) => {
            const h = hackathons.find(hx => hx.slug === team.hackathonSlug);
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={team.teamCode}
                className="bg-primary/40 p-6 rounded-3xl border border-white/5 flex flex-col hover:bg-primary/60 transition-colors group relative overflow-hidden"
              >
                {/* Status indicator */}
                <div className="absolute top-0 right-0 p-4 flex gap-2">
                  <span className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${team.isOpen ? 'bg-cta text-cta' : 'bg-red-500 text-red-500'}`} title={team.isOpen ? '모집 중' : '모집 마감'}></span>
                </div>

                <div className="mb-4">
                  <span className="text-xs font-mono text-gray-500 block mb-1">{team.teamCode}</span>
                  <h3 className="text-2xl font-bold font-heading text-white group-hover:text-cta transition-colors">{team.name}</h3>
                </div>
                
                {team.hackathonSlug && (
                  <div className="mb-4 inline-flex items-center text-xs text-blue-300 bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-500/20 w-fit">
                    <Hash className="w-3 h-3 mr-1" />
                    <span className="truncate max-w-[200px]">{h ? h.title : team.hackathonSlug}</span>
                  </div>
                )}
                
                <p className="text-gray-400 text-sm mb-6 flex-1 line-clamp-3">
                  {team.intro}
                </p>
                
                <div className="space-y-4 mt-auto">
                  {team.lookingFor?.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-2">Looking for</span>
                      <div className="flex flex-wrap gap-2">
                        {team.lookingFor.map((role:string) => (
                          <span key={role} className="px-2 py-1 bg-white/10 text-white rounded-md text-xs font-medium">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-400">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{team.memberCount} 명 참여 중</span>
                    </div>
                    {team.contact?.url && (
                      <a 
                        href={team.contact.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-cta hover:text-white transition-colors flex items-center gap-1 text-sm font-bold bg-cta/10 hover:bg-cta/20 px-3 py-1.5 rounded-lg"
                      >
                        연락하기 <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
}
