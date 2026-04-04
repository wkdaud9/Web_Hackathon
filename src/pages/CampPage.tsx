import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeams, addTeam, updateTeam, getHackathons, getUsers, sendMessage } from '../utils/api';
import Dropdown from '../components/Dropdown';
import TeamDetailModal from '../components/TeamDetailModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Users, X, Plus, Send, Settings, Sparkles, Loader2, Zap } from 'lucide-react';
import type { Hackathon, Team } from '../types/models';
import { getTeamRecommendations, type AIMatchResult } from '../services/geminiService';

function TeamListCard({
  team,
  hackathons,
  currentUser,
  onSelect,
  onJoin,
  onEdit,
  onMessage
}: {
  team: Team;
  hackathons: Hackathon[];
  currentUser: any;
  onSelect: (team: Team) => void;
  onJoin: (team: Team) => void;
  onEdit: (team: Team) => void;
  onMessage: (team: Team) => void;
}) {
  const targetHackathon = hackathons.find(hx => hx.slug === team.hackathonSlug);
  const isMyTeam = currentUser && (team.leaderName === currentUser.nickname || team.members?.includes(currentUser.nickname) || team.memberIds?.includes(currentUser.id));
  const isLeader = currentUser?.nickname === team.leaderName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative py-7 px-10 rounded-[32px] border transition-all group cursor-pointer overflow-hidden ${team.isOpen
        ? 'bg-white dark:bg-neutral-800/40 border-gray-100 dark:border-neutral-700/50 hover:border-primary/20 shadow-[0_2px_15px_rgb(0,0,0,0.01)]'
        : 'bg-gray-50/50 dark:bg-neutral-900/30 border-gray-100 dark:border-neutral-800 opacity-60'
        }`}
      onClick={() => onSelect(team)}
    >
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Primary Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            {team.isOpen && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
              </span>
            )}
            <span className={`text-[12px] font-black uppercase tracking-[0.1em] ${team.isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'}`}>
              {team.isOpen ? '현재 모집 중' : '모집 마감'}
            </span>
            <span className="w-1 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700"></span>
            {targetHackathon && (
              <span className="text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-tight">
                {targetHackathon.title}
              </span>
            )}
          </div>

          <h3 className="font-black text-[22px] text-primary dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2.5 break-words">
            {team.name}
          </h3>

          <p className="text-neutral-500 dark:text-neutral-400 text-[15px] font-medium leading-relaxed mb-5 line-clamp-2">
            {team.intro}
          </p>

          {team.lookingFor?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-[12px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mt-1.5 mr-1">모집 분야:</span>
              {team.lookingFor.map((role: string) => (
                <span key={role} className="px-4 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-primary dark:text-neutral-300 border border-neutral-100 dark:border-neutral-700 rounded-full text-[13px] font-bold transition-colors hover:border-blue-200">
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Meta & Actions */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-6 md:w-56 shrink-0 md:border-l border-neutral-100 dark:border-neutral-700/50 md:pl-8 pt-6 md:pt-0 border-t md:border-t-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[15px] font-black text-primary dark:text-white leading-none mb-1.5">{team.leaderName}</span>
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-neutral-400 dark:text-neutral-500">
                <Users className="w-3.5 h-3.5" /> {team.memberCount}명 참여 중
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center text-[14px] font-black text-primary dark:text-white shadow-sm transition-colors">
              {team.leaderName?.[0]}
            </div>
          </div>

          <div className="flex gap-2 w-full" onClick={e => e.stopPropagation()}>
            {isMyTeam ? (
              <>
                <Link
                  to="/workspace"
                  className="flex-1 bg-cta hover:bg-blue-600 text-white text-[13px] font-black h-[46px] rounded-xl shadow-md flex items-center justify-center transition-all"
                >
                  워크스페이스
                </Link>
                {isLeader && (
                  <button
                    onClick={() => onEdit(team)}
                    className="w-[46px] h-[46px] flex items-center justify-center text-primary dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                    title="모집 관리"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </>
            ) : (
              currentUser?.role !== 'operator' && (
                <>
                  <button
                    onClick={() => onJoin(team)}
                    disabled={!team.isOpen}
                    className={`flex-1 text-[13px] font-black h-[46px] rounded-xl transition-all whitespace-nowrap shadow-md ${team.isOpen ? 'bg-cta hover:bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed border-none shadow-none'
                      }`}
                  >
                    {team.isOpen ? '합류 신청' : '모집 완료'}
                  </button>
                  <button
                    onClick={() => onMessage(team)}
                    className="w-[46px] h-[46px] flex items-center justify-center text-primary dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                    title="쪽지"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CampPage() {
  const [searchParams] = useSearchParams();
  const hackathonSlugParam = searchParams.get('hackathon');

  const [teams, setTeams] = useState<Team[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterHackathonSlug, setFilterHackathonSlug] = useState(hackathonSlugParam || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  const isNewParam = searchParams.get('new') === 'true';
  const [showForm, setShowForm] = useState(isNewParam);
  const formRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [showForm]);

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

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIMatchResult[]>([]);
  const [userSkills, setUserSkills] = useState('');

  // Reset AI states when modal opens/closes to ensure a fresh start
  useEffect(() => {
    if (aiModalOpen) {
      setUserSkills('');
      setAiRecommendations([]);
    }
  }, [aiModalOpen]);

  const handleGetAiRecommendations = async () => {
    if (!userSkills.trim()) {
      showToast('자신의 기술 및 소개를 간략히 적어주세요.', 'error');
      return;
    }
    setAiLoading(true);
    const results = await getTeamRecommendations(userSkills, teams);
    setAiRecommendations(results || []);
    setAiLoading(false);
  };

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
    window.addEventListener('storage-update', loadData);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('storage-update', loadData);
    };
  }, []);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchHackathon = filterHackathonSlug === 'all' || team.hackathonSlug === filterHackathonSlug;
      const matchQuery = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.intro.toLowerCase().includes(searchQuery.toLowerCase());
      return matchHackathon && matchQuery;
    });
  }, [filterHackathonSlug, teams, searchQuery]);

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
    showToast('신규 팀이 성공적으로 모집 등록되었습니다.', 'success');
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="w-full min-h-screen bg-white dark:bg-transparent transition-colors duration-300 font-sans">
      {/* Header with Search & New Team Button */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 px-6 py-4 transition-colors duration-300">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black text-primary dark:text-white tracking-tighter uppercase transition-colors">라운지</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group flex-1 md:flex-none h-11 transition-all">
              <input
                type="text"
                placeholder="팀명, 소개 검색"
                className="bg-gray-50 dark:bg-neutral-800 text-sm font-medium rounded-full w-full md:w-64 h-full px-6 outline-none border border-gray-100 dark:border-neutral-700 focus:bg-white dark:focus:bg-neutral-900 focus:border-cta transition-all text-primary dark:text-white block"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dropdown
              className="w-full md:w-64 h-11"
              value={filterHackathonSlug}
              onChange={(val) => setFilterHackathonSlug(val)}
              options={[
                { label: '모든 해커톤', value: 'all' },
                ...hackathons.map(h => ({ label: h.title, value: h.slug }))
              ]}
            />
            <button
              onClick={() => setAiModalOpen(true)}
              className="bg-primary dark:bg-white text-white dark:text-primary px-5 h-11 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shrink-0 group/ai shadow-md shadow-primary/10"
              title="AI 기반 팀 추천 받기"
            >
              <Zap className="w-4 h-4 transition-transform group-hover/ai:scale-110 fill-current" />
              <span className="hidden md:inline font-bold text-[14px]">AI 팀 매칭</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary dark:bg-white text-white dark:text-neutral-900 w-11 h-11 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md shrink-0 flex items-center justify-center"
              title="함께 할 팀 모집하기"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-6 py-10">
        <AnimatePresence>
          {showForm && (
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mb-12 bg-gray-50/50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800 rounded-[48px] p-8 md:p-12 relative transition-colors z-10"
            >
              <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 p-3 hover:bg-white dark:hover:bg-neutral-800 rounded-2xl transition-all"><X className="w-6 h-6 text-primary dark:text-white transition-colors" /></button>
              <h2 className="text-3xl font-black text-primary dark:text-white mb-10 tracking-tight transition-colors">팀 모집 등록</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[13px] font-black text-primary dark:text-white mb-3 uppercase tracking-wider transition-colors">팀 이름</label>
                    <input ref={inputRef} required type="text" placeholder="팀 이름을 정해주세요" className="w-full bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-[22px] px-6 py-4 text-primary dark:text-white font-bold focus:outline-none focus:border-cta transition-all" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-black text-primary dark:text-white mb-3 uppercase tracking-wider transition-colors">모집 포지션 (쉼표로 구분)</label>
                    <input type="text" placeholder="예: 프론트엔드, 디자이너, PM" className="w-full bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-[22px] px-6 py-4 text-primary dark:text-white font-bold focus:outline-none focus:border-cta transition-all" value={lookingFor} onChange={e => setLookingFor(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-black text-primary dark:text-white mb-3 uppercase tracking-wider transition-colors">참여 해커톤</label>
                    <Dropdown className="w-full h-[60px]" value={hackathonSlug} onChange={(val) => setHackathonSlug(val)} options={[{ label: '자유 주제 (선택 안함)', value: '' }, ...hackathons.map(h => ({ label: h.title, value: h.slug }))]} onOpen={() => window.scrollBy({ top: 180, behavior: 'smooth' })} />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[13px] font-black text-primary dark:text-white mb-3 uppercase tracking-wider transition-colors">팀 소개 및 목표</label>
                    <textarea required className="w-full bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-[22px] px-6 py-4 text-primary dark:text-white font-bold focus:outline-none focus:border-cta transition-all h-[152px] resize-none" placeholder="팀의 목표와 분위기를 설명해주세요 (최대 200자)" value={intro} onChange={e => setIntro(e.target.value)} maxLength={200} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-black text-primary dark:text-white mb-3 uppercase tracking-wider transition-colors">연락 수단 (링크)</label>
                    <input type="text" placeholder="오픈카톡, 디스코드 등 연락 링크" className="w-full bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-[22px] px-6 py-4 text-primary dark:text-white font-bold focus:outline-none focus:border-cta transition-all" value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end pt-4">
                  <button type="submit" className="px-8 py-3.5 bg-primary dark:bg-cta text-white font-black text-[15px] rounded-2xl hover:bg-gray-800 dark:hover:bg-blue-600 transition-all shadow-lg shadow-gray-200 dark:shadow-none">모집 시작하기</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredTeams.length === 0 ? (
          <EmptyState icon={<Users className="w-12 h-12 text-primary dark:text-white transition-colors" />} title="조건과 일치하는 팀이 없습니다" description="필터를 변경하거나 새로운 팀을 직접 모집해보세요!" className="py-20" />
        ) : (
          <div className="flex flex-col gap-6">
            {filteredTeams.map((team) => (
              <TeamListCard
                key={team.teamCode}
                team={team}
                hackathons={hackathons}
                currentUser={currentUser}
                onSelect={(t) => setSelectedTeam(t)}
                onJoin={(t) => {
                  if (!currentUser) { showToast('로그인이 필요합니다.', 'error'); return; }
                  setJoinTarget(t); setJoinModalOpen(true);
                }}
                onEdit={(t) => {
                  setEditingTeam(t);
                  setEditIntro(t.intro);
                  setEditLookingFor(t.lookingFor.join(', '));
                  setEditContactInfo(t.contact?.url || '');
                }}
                onMessage={(t) => { if (!currentUser) { showToast('로그인이 필요합니다.', 'error'); return; } setMessageTarget(t); setMessageModalOpen(true); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TeamDetailModal isOpen={!!selectedTeam} onClose={() => setSelectedTeam(null)} team={selectedTeam} />

      {/* Join Request Modal */}
      <AnimatePresence>
        {joinModalOpen && joinTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setJoinModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden">
              <div className="mb-8">
                <span className="text-cta font-black tracking-widest uppercase text-[11px] mb-2 block">합류 신청</span>
                <h3 className="text-2xl font-black text-primary leading-tight">팀 합류 신청</h3>
              </div>
              <p className="text-[14px] text-tertiary mb-6 leading-relaxed">
                <strong className="text-primary">[{joinTarget.name}]</strong> 팀 리더에게 보낼 메시지입니다.
              </p>
              <textarea value={joinMessage} onChange={(e) => setJoinMessage(e.target.value)} placeholder="자신 있는 분야와 참여 동기를 짧게 적어주세요." className="w-full bg-gray-50 border border-gray-100 rounded-[28px] px-6 py-5 text-primary font-bold outline-none focus:border-cta transition-all h-32 resize-none placeholder:text-tertiary mb-8" />
              <div className="flex gap-3">
                <button onClick={() => setJoinModalOpen(false)} className="flex-1 py-4 bg-gray-100 dark:bg-neutral-800 text-tertiary dark:text-neutral-400 font-black rounded-2xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">취소</button>
                <button onClick={() => {
                  if (!joinMessage.trim()) { showToast('신청 메시지를 입력해주세요.', 'info'); return; }
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
                    showToast('신청 완료!', 'success');
                    setJoinModalOpen(false);
                    setJoinMessage('');
                  });
                }} className="flex-1 py-4 bg-cta text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-200 dark:shadow-none">신청하기</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Direct Message Modal */}
      <AnimatePresence>
        {messageModalOpen && messageTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMessageModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl">
              <div className="mb-8">
                <span className="text-cta font-black tracking-widest uppercase text-[11px] mb-2 block">Direct Message</span>
                <h3 className="text-2xl font-black text-primary tracking-tight">쪽지 보내기</h3>
              </div>
              <p className="text-[14px] text-tertiary mb-6 font-medium">리더 <strong className="text-primary">{messageTarget.leaderName}</strong> 님에게 전할 내용을 입력하세요.</p>
              <textarea value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="간단한 협업 제안이나 질문을 적어주세요." className="w-full bg-gray-50 border border-gray-100 rounded-[28px] px-6 py-5 text-primary font-bold outline-none focus:border-cta transition-all h-32 resize-none placeholder:text-tertiary mb-8" />
              <div className="flex gap-3">
                <button onClick={() => setMessageModalOpen(false)} className="flex-1 py-4 bg-gray-100 dark:bg-neutral-800 text-tertiary dark:text-neutral-400 font-black rounded-2xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">취소</button>
                <button onClick={() => {
                  if (!messageContent.trim()) return;
                  const users = getUsers();
                  const targetUser = users.find(u => u.nickname === messageTarget.leaderName);
                  if (!targetUser) { showToast('사용자를 찾을 수 없습니다.', 'error'); return; }
                  sendMessage({
                    id: Math.random().toString(36).substring(2, 9),
                    senderId: currentUser!.id,
                    senderNickname: currentUser!.nickname,
                    receiverId: targetUser.id,
                    content: messageContent.trim(),
                    isRead: false,
                    createdAt: new Date().toISOString()
                  });
                  showToast('전송 완료!', 'success');
                  setMessageModalOpen(false);
                  setMessageContent('');
                }} className="flex-1 py-4 bg-cta text-white font-black rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-colors">보내기</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Recruitment Modal */}
      <AnimatePresence>
        {editingTeam && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingTeam(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-cta font-black tracking-widest uppercase text-[11px] mb-2 block">Management</span>
                  <h3 className="text-2xl font-black text-primary tracking-tight">모집 글 관리</h3>
                </div>
                <button onClick={() => setEditingTeam(null)} className="p-3 hover:bg-gray-50 rounded-2xl transition-all"><X className="w-6 h-6 text-tertiary" /></button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const lookingForList = editLookingFor.split(',').map(s => s.trim()).filter(Boolean);
                const updatedTeam = {
                  ...editingTeam,
                  intro: editIntro,
                  lookingFor: lookingForList,
                  contact: editContactInfo.trim() ? { type: 'mixed', url: editContactInfo.trim() } : editingTeam.contact
                };

                updateTeam(updatedTeam);

                setTeams(teams.map(t => t.teamCode === editingTeam.teamCode ? updatedTeam : t));
                setEditingTeam(null);
                showToast('모집 글 정보가 저장되었습니다.', 'success');
              }} className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-[28px] border border-gray-100 flex items-center justify-between group/toggle">
                  <div>
                    <p className="text-[14px] font-black text-primary mb-0.5">현재 모집 현황</p>
                    <p className="text-[11px] font-bold text-tertiary">
                      {editingTeam.isOpen ? '현재 팀원을 모집하고 있습니다.' : '모집을 마감한 상태입니다.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[12px] font-black transition-colors ${editingTeam.isOpen ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {editingTeam.isOpen ? '모집 중' : '모집 마감'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...editingTeam, isOpen: !editingTeam.isOpen };
                        updateTeam(updated);
                        setTeams(teams.map(t => t.teamCode === editingTeam.teamCode ? updated : t));
                        setEditingTeam(updated);
                        showToast(updated.isOpen ? '팀원 모집을 시작합니다.' : '팀원 모집을 마감했습니다.', 'info');
                      }}
                      className={`relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none shadow-inner ${editingTeam.isOpen ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <motion.div
                        animate={{ x: editingTeam.isOpen ? 24 : 4 }}
                        className="absolute top-1 left-0 bg-white w-6 h-6 rounded-full shadow-md"
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-black text-primary mb-2.5 ml-1 uppercase">팀 소개 문구</label>
                  <textarea required className="w-full bg-white border border-gray-100 rounded-[22px] px-6 py-4 text-primary font-bold outline-none focus:border-cta h-28 resize-none shadow-sm transition-all" value={editIntro} onChange={e => setEditIntro(e.target.value)} maxLength={200} />
                </div>

                <div>
                  <label className="block text-[13px] font-black text-primary mb-2.5 ml-1 uppercase">찾는 포지션</label>
                  <input type="text" className="w-full bg-white border border-gray-100 rounded-[20px] px-6 py-4 text-primary font-bold shadow-sm outline-none focus:border-cta transition-all" value={editLookingFor} onChange={e => setEditLookingFor(e.target.value)} placeholder="예: 프론트엔드, 디자이너 (쉼표 구분)" />
                </div>

                <div>
                  <label className="block text-[13px] font-black text-primary mb-2.5 ml-1 uppercase">연락 수단</label>
                  <input type="text" className="w-full bg-white border border-gray-100 rounded-[20px] px-6 py-4 text-primary font-bold shadow-sm outline-none focus:border-cta transition-all" value={editContactInfo} onChange={(e) => setEditContactInfo(e.target.value)} placeholder="오픈카톡, 디스코드 등 링크" />
                </div>

                <div className="flex gap-3 pt-6">
                  <button type="button" onClick={() => setEditingTeam(null)} className="flex-1 py-4 bg-gray-100 dark:bg-neutral-800 text-tertiary dark:text-neutral-400 font-black rounded-2xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">취소</button>
                  <button type="submit" className="flex-1 py-4 bg-primary dark:bg-cta text-white font-black rounded-2xl hover:bg-gray-800 dark:hover:bg-blue-600 transition-all shadow-lg shadow-gray-200 dark:shadow-none">저장 완료</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Recommendation Modal */}
      <AnimatePresence>
        {aiModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAiModalOpen(false)} className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-[40px] p-8 md:p-12 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex flex-col">
                  <h3 className="text-[28px] font-black text-primary dark:text-white leading-tight">지능형 팀원 추천</h3>
                  <p className="text-[14px] text-tertiary dark:text-neutral-500 font-bold mt-1.5">가장 적합한 팀을 AI가 찾아드립니다.</p>
                </div>
                <button onClick={() => setAiModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-2xl transition-all"><X className="w-6 h-6 text-primary dark:text-white" /></button>
              </div>

              <div className="overflow-y-auto pr-2 scrollbar-hide flex-1">
                <div className="mb-10">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={userSkills}
                        onChange={e => setUserSkills(e.target.value)}
                        placeholder="본인의 기술 스택과 협업 스타일을 입력해주세요."
                        className="flex-1 px-5 h-11 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 font-bold text-[14px] text-primary dark:text-white outline-none focus:border-cta focus:bg-white transition-all text-center"
                        onKeyDown={e => { if (e.key === 'Enter') handleGetAiRecommendations(); }}
                      />
                      <button
                        onClick={handleGetAiRecommendations}
                        disabled={aiLoading}
                        className="px-6 h-11 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-black flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-50 min-w-[120px] shadow-md shadow-primary/10 dark:shadow-none text-[13px]"
                      >
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '최적 매칭 시작'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pb-8">
                  {aiRecommendations.length > 0 ? (
                    aiRecommendations.map((rec, idx) => {
                      const targetTeam = teams.find(t => t.teamCode === rec.teamCode);
                      if (!targetTeam) return null;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setAiModalOpen(false);
                            setSelectedTeam(targetTeam);
                          }}
                          className="bg-white dark:bg-neutral-800/40 border border-gray-100 dark:border-neutral-700 p-6 rounded-[28px] flex flex-col group hover:border-cta/30 transition-all hover:bg-gray-50/30 dark:hover:bg-neutral-800/60 cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <h4 className="text-[18px] font-black text-primary dark:text-white truncate pr-4">{targetTeam.name}</h4>
                            <div className="shrink-0 text-cta dark:text-blue-400 text-[13px] font-black tracking-tight">
                              {rec.matchScore}% 일치
                            </div>
                          </div>

                          <p className="text-[13px] text-tertiary dark:text-neutral-400 font-bold leading-relaxed line-clamp-3 whitespace-pre-line">
                            {rec.reason}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    !aiLoading && (
                      <div className="py-20 text-center text-tertiary dark:text-neutral-500 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-neutral-800 flex items-center justify-center mb-5">
                          <Sparkles className="w-6 h-6 text-neutral-200 dark:text-neutral-700" />
                        </div>
                        <p className="font-bold text-[15px]">나와 가장 잘 맞는 팀을 AI가 추천해 드립니다.</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="h-40" />
    </div>
  );
}
