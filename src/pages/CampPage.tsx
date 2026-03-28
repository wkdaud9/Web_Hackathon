import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeams, addTeam, getHackathons, getUsers, sendMessage } from '../utils/api';
import Dropdown from '../components/Dropdown';
import TeamDetailModal from '../components/TeamDetailModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Users, X, Plus, Hash, Send } from 'lucide-react';
import type { Hackathon, Team } from '../types/models';

export default function CampPage() {
  const [searchParams] = useSearchParams();
  const hackathonSlugParam = searchParams.get('hackathon');

  const [teams, setTeams] = useState<Team[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterHackathonSlug, setFilterHackathonSlug] = useState(hackathonSlugParam || 'all');

  const isNewParam = searchParams.get('new') === 'true';
  const [showForm, setShowForm] = useState(isNewParam);
  const [newTeamName, setNewTeamName] = useState('');
  const [hackathonSlug, setHackathonSlug] = useState(hackathonSlugParam || '');
  const [lookingFor, setLookingFor] = useState('');
  const [intro, setIntro] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Team | null>(null);
  const [messageContent, setMessageContent] = useState('');

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editIntro, setEditIntro] = useState('');
  const [editLookingFor, setEditLookingFor] = useState('');
  const [editContactInfo, setEditContactInfo] = useState('');

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinTarget, setJoinTarget] = useState<Team | null>(null);
  const [joinMessage, setJoinMessage] = useState('');

  const loadData = () => {
    try {
      setTeams(getTeams());
      setHackathons(getHackathons());
      setLoading(false);
    } catch {
      setError('팀 모집 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(loadData, 250);
    
    // Listen for global storage updates
    window.addEventListener('storage-update', loadData);
    
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('storage-update', loadData);
    };
  }, []);

  useEffect(() => {
    if (hackathonSlugParam) {
      setFilterHackathonSlug(hackathonSlugParam);
    }
  }, [hackathonSlugParam]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  const filteredTeams = useMemo(() => {
    if (filterHackathonSlug === 'all') return teams;
    return teams.filter((team) => team.hackathonSlug === filterHackathonSlug);
  }, [filterHackathonSlug, teams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const lookingForList = lookingFor.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const newTeam = {
      teamCode: 'T-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      name: newTeamName,
      hackathonSlug: hackathonSlug,
      lookingFor: lookingForList.filter(Boolean),
      intro,
      contact: contactInfo.trim() ? { type: 'mixed', url: contactInfo.trim() } : undefined,
      createdAt: new Date().toISOString(),
      memberCount: 1,
      isOpen: true,
      leaderName: currentUser.nickname,
      members: [currentUser.nickname]
    };
    addTeam(newTeam);
    setTeams([newTeam, ...teams]);
    setShowForm(false);
    setNewTeamName('');
    setHackathonSlug('');
    setLookingFor('');
    setIntro('');
    setContactInfo('');
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

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
          <Dropdown
            className="w-full md:w-72"
            value={filterHackathonSlug}
            onChange={(val) => setFilterHackathonSlug(val)}
            options={[
              { label: '모든 해커톤', value: 'all' },
              ...hackathons.map(h => ({ label: h.title, value: h.slug }))
            ]}
          />
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
            <div className="bg-white border border-blue-100 p-6 md:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
              {!currentUser && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <p className="font-bold text-primary mb-3 text-lg">새 팀을 등록하려면 로그인이 필요합니다.</p>
                </div>
              )}
              <button 
                onClick={() => setShowForm(false)} 
                className="absolute top-6 right-6 text-tertiary hover:text-primary transition-colors z-20"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold font-heading text-primary mb-6 tracking-tight">신규 팀 등록</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[15px] font-bold text-primary mb-2.5">팀 이름 *</label>
                  <input required
                    type="text" 
                    className="w-full bg-white border border-gray-200 rounded-[16px] px-5 py-3.5 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-tertiary" 
                    placeholder="팀 이름을 입력해주세요"
                    value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-bold text-primary mb-2.5">목표 해커톤 (선택)</label>
                  <Dropdown
                    placeholder="참여할 해커톤을 선택하세요 (자유 가능)"
                    className="w-full"
                    value={hackathonSlug}
                    onChange={(val) => setHackathonSlug(val)}
                    options={[
                      { label: '자유 주제 (선택 없음)', value: '' },
                      ...hackathons.map(h => ({ label: h.title, value: h.slug }))
                    ]}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[15px] font-bold text-primary mb-2.5">팀 소개 및 목표 *</label>
                  <textarea required
                    className="w-full bg-white border border-gray-200 rounded-[16px] px-5 py-3.5 text-primary font-medium outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all h-28 resize-none placeholder:text-tertiary"
                    placeholder="어떤 아이디어를 실현하고 싶은지 적어주세요! (최대 200자)"
                    value={intro} onChange={e => setIntro(e.target.value)}
                    maxLength={200}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-[15px] font-bold text-primary mb-2.5">모집 포지션 (쉼표로 구분)</label>
                  <input 
                    type="text" 
                    placeholder="기획자, 프론트엔드, 디자이너"
                    className="w-full bg-white border border-gray-200 rounded-[16px] px-5 py-3.5 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-tertiary" 
                    value={lookingFor} onChange={e => setLookingFor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-bold text-primary mb-2.5">연락처 (이메일, 카톡 ID, 링크 등 자유롭게)</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-200 rounded-[16px] px-5 py-3.5 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-tertiary"
                    placeholder="지원자가 연락할 수 있는 정보를 남겨주세요."
                    value={contactInfo} onChange={(e) => setContactInfo(e.target.value)}
                  />
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
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="등록된 팀이 없습니다"
          description="첫 번째 팀의 리더가 되어보세요!"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredTeams.map((team, idx) => {
            const targetHackathon = hackathons.find(hx => hx.slug === team.hackathonSlug);
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={team.teamCode}
                className="bg-white p-5 md:p-6 rounded-[24px] border border-gray-100 flex flex-col md:flex-row md:items-center gap-5 md:gap-8 hover:border-cta/30 transition-all group shadow-[0_2px_15px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
              >
                {/* Left Section: Team Name & Status */}
                <div className="flex-shrink-0 w-full md:w-56 flex flex-col items-start cursor-pointer" onClick={() => setSelectedTeam(team)}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${team.isOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-400'}`} title={team.isOpen ? '모집 중' : '모집 마감'}></span>
                    <h3 className="font-bold text-[20px] text-primary group-hover:text-cta transition-colors flex items-center gap-2">
                      {team.name}
                    </h3>
                  </div>
                  
                  {targetHackathon ? (
                    <Link 
                      to={`/hackathons/${targetHackathon.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold text-cta bg-blue-50/50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors w-full md:w-auto"
                    >
                      <Hash className="w-3.5 h-3.5 flex-shrink-0" /> 
                      <span className="truncate max-w-[150px]">{targetHackathon.title}</span>
                    </Link>
                  ) : (
                    <div className="inline-flex items-center text-[12px] font-bold text-secondary bg-gray-100 px-2 py-1 rounded-md">
                      자유 주제
                    </div>
                  )}
                </div>
                
                {/* Middle Section: Intro & Roles */}
                <div className="flex-1 flex flex-col justify-center min-w-0 cursor-pointer" onClick={() => setSelectedTeam(team)}>
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
                
                {/* Right Section: Action */}
                <div className="flex flex-col items-end justify-center md:items-end gap-2.5 flex-shrink-0 md:w-36 border-t border-gray-100 md:border-t-0 pt-4 md:pt-0 shrink-0">
                  {currentUser && (team.leaderName === currentUser.nickname || team.members?.includes(currentUser.nickname) || team.memberIds?.includes(currentUser.id)) ? (
                    <Link 
                      to="/workspace"
                      className="text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 text-[14px] font-bold px-4 py-2.5 rounded-xl w-full shadow-md shadow-emerald-100"
                    >
                      워크스페이스 이동
                    </Link>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentUser) {
                          showToast('팀 합류 신청을 하려면 로그인해주세요.', 'error');
                          return;
                        }
                        if (!team.isOpen) {
                          showToast('현재 모집이 마감된 팀입니다.', 'info');
                          return;
                        }
                        setJoinTarget(team);
                        setJoinModalOpen(true);
                      }}
                      className="text-white bg-cta hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5 text-[14px] font-bold px-4 py-2.5 rounded-xl w-full shadow-md shadow-blue-200"
                    >
                      팀 합류 신청 <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {currentUser?.nickname === team.leaderName ? (
                    <div className="flex gap-2 w-full">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTeam(team);
                          setEditIntro(team.intro);
                          setEditLookingFor(team.lookingFor.join(', '));
                          setEditContactInfo(team.contact?.url || '');
                        }}
                        className="text-[13px] font-bold text-secondary bg-gray-100 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors w-full"
                      >
                        수정
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // mock close action
                          const updatedTeams = teams.map(t => t.teamCode === team.teamCode ? {...t, isOpen: !t.isOpen} : t);
                          setTeams(updatedTeams);
                        }}
                        className="text-[13px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors w-full"
                      >
                        {team.isOpen ? '마감' : '열기'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentUser) {
                          showToast('쪽지를 보내려면 로그인해주세요.', 'info');
                          return;
                        }
                        setMessageTarget(team);
                        setMessageModalOpen(true);
                      }}
                      className="text-[13px] font-bold text-secondary border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors w-full"
                    >
                      쪽지 보내기
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <TeamDetailModal 
        isOpen={!!selectedTeam} 
        onClose={() => setSelectedTeam(null)} 
        team={selectedTeam} 
      />

      <AnimatePresence>
        {joinModalOpen && joinTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setJoinModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100"
            >
              <h3 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                🚀 팀 합류 신청하기
              </h3>
              <p className="text-[14px] text-tertiary mb-6">
                <strong className="text-secondary">[{joinTarget.name}]</strong> 팀에 보낼 간략한 자기소개 및 지원 동기를 적어주세요.
              </p>
              <textarea
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="안녕하세요! 저는 이런 포지션으로 참여하고 싶습니다..."
                className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-primary font-medium outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all h-32 resize-none placeholder:text-tertiary mb-4"
              />
              <div className="flex gap-2.5">
                <button
                  onClick={() => setJoinModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-secondary font-bold rounded-[14px] hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (!joinMessage.trim()) {
                      showToast('신청 메시지를 입력해주세요.', 'info');
                      return;
                    }
                    
                    // In a real app, this would be an API call
                    import('../utils/api').then(api => {
                      api.addInvite({
                        id: Date.now(),
                        hackathonSlug: joinTarget.hackathonSlug || '',
                        teamCode: joinTarget.teamCode,
                        applicantName: currentUser!.nickname,
                        applicantId: currentUser!.id,
                        message: joinMessage.trim(),
                        status: 'pending',
                        type: 'application',
                        createdAt: new Date().toISOString()
                      });
                      
                      showToast('팀 합류 신청이 완료되었습니다!', 'success');
                      setJoinModalOpen(false);
                      setJoinMessage('');
                    });
                  }}
                  className="flex-1 py-3 bg-cta text-white font-bold rounded-[14px] hover:bg-blue-600 transition-colors shadow-sm"
                >
                  보내기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {messageModalOpen && messageTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMessageModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100"
            >
              <h3 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                ✉️ 쪽지 보내기
              </h3>
              <p className="text-[14px] text-tertiary mb-6">
                <strong className="text-secondary">{messageTarget.leaderName}</strong> 님에게 보낼 메시지를 작성해주세요.
              </p>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="간단한 인사나 질문을 남겨보세요."
                className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-primary font-medium outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all h-32 resize-none placeholder:text-tertiary mb-4"
              />
              <div className="flex gap-2.5">
                <button
                  onClick={() => setMessageModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-secondary font-bold rounded-[14px] hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (!messageContent.trim() || !messageTarget) return;
                    
                    const users = getUsers();
                    const targetUser = users.find(u => u.nickname === messageTarget.leaderName);
                    
                    if (!targetUser) {
                      showToast('상대방 정보를 찾을 수 없습니다.', 'error');
                      return;
                    }

                    sendMessage({
                      id: Math.random().toString(36).substring(2, 9),
                      senderId: currentUser!.id,
                      senderNickname: currentUser!.nickname,
                      receiverId: targetUser.id,
                      content: messageContent.trim(),
                      isRead: false,
                      createdAt: new Date().toISOString()
                    });

                    showToast(`${targetUser.nickname}님에게 쪽지를 보냈습니다!`, 'success');
                    setMessageModalOpen(false);
                    setMessageContent('');
                  }}
                  className="flex-1 py-3 bg-cta text-white font-bold rounded-[14px] hover:bg-blue-600 transition-colors shadow-sm"
                >
                  보내기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingTeam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTeam(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100"
            >
              <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                ✏️ 팀 정보 수정
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const lookingForList = editLookingFor.split(',').map(s => s.trim()).filter(Boolean);
                const updatedTeam = {
                  ...editingTeam,
                  intro: editIntro,
                  lookingFor: lookingForList,
                  contact: editContactInfo.trim() ? { type: 'mixed', url: editContactInfo.trim() } : undefined
                };
                setTeams(teams.map(t => t.teamCode === editingTeam.teamCode ? updatedTeam : t));
                setEditingTeam(null);
              }} className="space-y-4">
                  <label className="block text-[15px] font-bold text-primary mb-1">팀 소개 및 목표</label>
                  <textarea required
                    className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-primary font-medium outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all h-24 resize-none placeholder:text-tertiary"
                    value={editIntro} onChange={e => setEditIntro(e.target.value)}
                    maxLength={200}
                  ></textarea>

                  <label className="block text-[15px] font-bold text-primary mb-1 mt-4">모집 포지션 (쉼표로 구분)</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all" 
                    value={editLookingFor} onChange={e => setEditLookingFor(e.target.value)}
                  />

                  <label className="block text-[15px] font-bold text-primary mb-1 mt-4">연락처</label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all"
                    value={editContactInfo} onChange={(e) => setEditContactInfo(e.target.value)}
                  />

                <div className="flex gap-2.5 mt-8">
                  <button
                    type="button"
                    onClick={() => setEditingTeam(null)}
                    className="flex-1 py-3 bg-gray-100 text-secondary font-bold rounded-[14px] hover:bg-gray-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-cta text-white font-bold rounded-[14px] hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    저장하기
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
