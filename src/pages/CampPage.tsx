import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeams, addTeam, getHackathons } from '../utils/api';
import { Users, X, Plus, ExternalLink, Hash } from 'lucide-react';
import type { Hackathon, Team } from '../types/models';

export default function CampPage() {
  const [searchParams] = useSearchParams();
  const hackathonSlugParam = searchParams.get('hackathon');

  const [teams, setTeams] = useState<Team[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterHackathonSlug, setFilterHackathonSlug] = useState(hackathonSlugParam || 'all');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    intro: '',
    hackathonSlug: hackathonSlugParam || '',
    lookingFor: '',
    contact: '',
    isOpen: true,
  });

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);
      const timer = window.setTimeout(() => {
        setTeams(getTeams());
        setHackathons(getHackathons());
        setLoading(false);
      }, 250);
      return () => window.clearTimeout(timer);
    } catch {
      setError('팀 모집 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setLoading(false);
    }
  }, []);

  const filteredTeams = useMemo(() => {
    if (filterHackathonSlug === 'all') return teams;
    return teams.filter((team) => team.hackathonSlug === filterHackathonSlug);
  }, [filterHackathonSlug, teams]);

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
      isOpen: formData.isOpen,
    };
    addTeam(newTeam);
    setTeams(getTeams());
    setShowForm(false);
    setFormData({
      name: '',
      intro: '',
      hackathonSlug: hackathonSlugParam || '',
      lookingFor: '',
      contact: '',
      isOpen: true,
    });
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-secondary bg-white rounded-[24px] shadow-sm">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-500 bg-red-50 rounded-[24px] border border-red-100">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}}>
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-primary tracking-tight mb-2">팀 모집 라운지</h1>
          <p className="text-secondary font-medium">
            {hackathonSlugParam ? '이 해커톤에 참여할 팀을 찾거나 모집해보세요!' : '모든 해커톤의 팀 빌딩 라운지입니다.'}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="w-full md:w-auto">
          <select
            className="w-full md:w-72 bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
            value={filterHackathonSlug}
            onChange={(e) => setFilterHackathonSlug(e.target.value)}
          >
            <option value="all">모든 해커톤</option>
            {hackathons.map((h) => (
              <option key={h.slug} value={h.slug}>{h.title}</option>
            ))}
          </select>
        </motion.div>

        <motion.button
          initial={{opacity:0}}
          animate={{opacity:1}}
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-cta text-white font-bold rounded-2xl hover:bg-blue-600 hover:-translate-y-0.5 transition-all shadow-[0_8px_20px_rgba(49,130,246,0.3)] flex items-center justify-center gap-2"
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
            <div className="bg-white border border-blue-100 p-6 md:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
              <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-tertiary hover:text-primary transition-colors">
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold font-heading text-primary mb-6 tracking-tight">신규 팀 등록</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[15px] font-bold text-primary mb-2">팀 이름 *</label>
                  <input required
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-bold text-primary mb-2">목표 해커톤 (선택)</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all appearance-none cursor-pointer"
                    value={formData.hackathonSlug} onChange={e => setFormData({...formData, hackathonSlug: e.target.value})}
                  >
                    <option value="">-- 자유 주제 / 미정 --</option>
                    {hackathons.map(h => (
                      <option key={h.slug} value={h.slug}>{h.title}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[15px] font-bold text-primary mb-2">팀 소개 및 목표 *</label>
                  <textarea required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-primary font-medium outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all h-28 resize-none"
                    placeholder="어떤 아이디어를 실현하고 싶은지 적어주세요!"
                    value={formData.intro} onChange={e => setFormData({...formData, intro: e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-[15px] font-bold text-primary mb-2">모집 포지션 (쉼표로 구분)</label>
                  <input 
                    type="text" 
                    placeholder="기획자, 프론트엔드, 디자이너"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all" 
                    value={formData.lookingFor} onChange={e => setFormData({...formData, lookingFor: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-bold text-primary mb-2">연락을 받을 URL (오픈카톡 등) *</label>
                  <input required
                    type="url" 
                    placeholder="https://open.kakao.com/..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all" 
                    value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-bold text-primary mb-2">모집 상태</label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all appearance-none cursor-pointer"
                    value={formData.isOpen ? 'open' : 'closed'}
                    onChange={(e) => setFormData({ ...formData, isOpen: e.target.value === 'open' })}
                  >
                    <option value="open">모집 중</option>
                    <option value="closed">모집 마감</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-end mt-4">
                  <button type="submit" className="px-10 py-4 bg-cta text-white font-bold text-lg rounded-[16px] hover:bg-blue-600 transition-colors shadow-md">
                    등록하기
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team List View */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-20 bg-white shadow-sm rounded-[24px] border border-gray-100">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-secondary">아직 등록된 팀이 없습니다.</h3>
          <p className="text-tertiary font-medium mt-2">첫 번째 팀의 리더가 되어보세요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredTeams.map((team, idx) => {
            const h = hackathons.find(hx => hx.slug === team.hackathonSlug);
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={team.teamCode}
                className="bg-white p-5 md:p-6 rounded-[24px] border border-gray-100 flex flex-col md:flex-row md:items-center gap-5 md:gap-8 hover:border-cta/30 transition-all group shadow-[0_2px_15px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
              >
                {/* Left Section: Team Name & Status */}
                <div className="flex-shrink-0 w-full md:w-56 flex flex-col items-start">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${team.isOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-400'}`} title={team.isOpen ? '모집 중' : '모집 마감'}></span>
                    <h3 className="text-[20px] font-bold font-heading text-primary group-hover:text-cta transition-colors truncate w-full">{team.name}</h3>
                  </div>
                  <span className="text-[13px] font-bold text-tertiary mb-3">{team.teamCode}</span>
                  {team.hackathonSlug ? (
                    <div className="flex items-center text-[12px] font-bold text-cta bg-blue-50 px-2.5 py-1 rounded-lg">
                      <Hash className="w-3.5 h-3.5 mr-1" />
                      <span className="truncate max-w-[150px]">{h ? h.title : team.hackathonSlug}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-[12px] font-bold text-secondary bg-gray-100 px-2.5 py-1 rounded-lg">
                      자유 주제
                    </div>
                  )}
                </div>
                
                {/* Middle Section: Intro & Roles */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <p className="text-secondary text-[15px] font-medium leading-relaxed mb-4 line-clamp-2">
                    {team.intro}
                  </p>
                  {team.lookingFor?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-tertiary font-bold shrink-0">모집 중:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {team.lookingFor.map((role:string) => (
                          <span key={role} className="px-2 py-0.5 bg-gray-50 text-secondary border border-gray-200 rounded-md text-[12px] font-bold truncate max-w-[100px]">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right Section: Member count & Action */}
                <div className="flex justify-between items-center md:flex-col md:items-end gap-3 flex-shrink-0 md:w-32 border-t border-gray-100 md:border-t-0 pt-4 md:pt-0">
                  <div className="flex items-center text-[14px] font-bold text-tertiary">
                    <Users className="w-4 h-4 mr-1.5" />
                    <span><span className="text-primary">{team.memberCount}</span>명 참여</span>
                  </div>
                  {team.contact?.url ? (
                    <a 
                      href={team.contact.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-cta hover:text-white hover:bg-cta transition-colors flex items-center justify-center gap-1.5 text-[14px] font-bold bg-blue-50 px-4 py-2.5 rounded-xl w-full md:w-auto"
                    >
                      상세보기 <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[14px] text-tertiary font-medium px-4 py-2.5">연락처 없음</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
}
