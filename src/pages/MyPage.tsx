import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getTeams,
  getHackathons,
  getSubmissions
} from '../utils/api';
import type { Team, Hackathon, Submission } from '../types/models';
import { useToast } from '../contexts/ToastContext';
import {
  User,
  Trophy,
  Users,
  FileCheck,
  Bell,
  Mail,
  Star,
  ChevronRight,
  ExternalLink,
  Info,
  Clock,
  Edit3
} from 'lucide-react';

export default function MyPage() {
  const { currentUser, isLoading, updateUser } = useAuth();
  const { theme } = useTheme();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [myHackathons, setMyHackathons] = useState<Hackathon[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [newGithubId, setNewGithubId] = useState('');

  const [githubEvents, setGithubEvents] = useState<any[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [commitCounts, setCommitCounts] = useState<Record<string, number>>({});

  const { showToast } = useToast();
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);

  const loadData = () => {
    if (!currentUser) return;
    const allTeams = getTeams();
    const userTeams = allTeams.filter(t => t.leaderName === currentUser.nickname || (t.members && t.members.includes(currentUser.nickname)));
    setMyTeams(userTeams);

    const allHackathons = getHackathons();
    const userHackathonSlugs = new Set(userTeams.map(t => t.hackathonSlug).filter(Boolean));
    const userHackathons = allHackathons.filter(h => userHackathonSlugs.has(h.slug));
    setMyHackathons(userHackathons);

    const allSubmissions = getSubmissions();
    const subs = allSubmissions.filter(s => s.teamName === currentUser.nickname || userTeams.some(t => t.name === s.teamName));
    setMySubmissions(subs);
  };

  useEffect(() => {
    loadData();
    if (currentUser) {
      setNewNickname(currentUser.nickname);
      setNewGithubId(currentUser.githubId || '');
    }

    // Listen for global storage updates
    window.addEventListener('storage-update', loadData);

    return () => {
      window.removeEventListener('storage-update', loadData);
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.githubId) {
      setGithubLoading(true);
      fetch(`https://api.github.com/users/${currentUser.githubId}/events/public`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const counts: Record<string, number> = {};
            data.filter(e => e.type === 'PushEvent').forEach(ev => {
              const date = new Date(ev.created_at).toISOString().split('T')[0];
              counts[date] = (counts[date] || 0) + (ev.payload.commits?.length || 1);
            });
            setCommitCounts(counts);
            setGithubEvents(data.slice(0, 15));
          } else {
            setGithubEvents([]);
            setCommitCounts({});
          }
        })
        .catch(() => {
          setGithubEvents([]);
          setCommitCounts({});
        })
        .finally(() => setGithubLoading(false));
    }
  }, [currentUser?.githubId]);

  const toggleProfilePublic = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, isProfilePublic: !currentUser.isProfilePublic };
    updateUser(updatedUser);
    showToast(updatedUser.isProfilePublic ? '프로필이 공개로 전환되었습니다.' : '프로필이 비공개로 전환되었습니다.', 'info');
  };

  const handleSaveNickname = () => {
    if (!currentUser) return;
    if (!newNickname.trim()) {
      showToast('닉네임을 입력해주세요.', 'error');
      return;
    }
    if (newNickname === currentUser.nickname && newGithubId === (currentUser.githubId || '')) {
      setIsProfileModalOpen(false);
      return;
    }

    const updatedUser = { ...currentUser, nickname: newNickname, githubId: newGithubId.trim() };
    updateUser(updatedUser);
    showToast('프로필이 성공적으로 변경되었습니다.', 'success');
    setIsProfileModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-cta rounded-full animate-spin mb-4" />
        <p className="text-secondary font-medium">데이터 불러오는 중...</p>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/" replace />;

  return (
    <div className="w-full min-h-screen bg-white dark:bg-transparent transition-colors duration-300">
      {/* Header with Title Only */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 px-6 py-4 transition-colors duration-300">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black text-primary dark:text-white tracking-tighter uppercase transition-colors">마이페이지</h1>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1240px] mx-auto px-6 py-10 pb-24 relative"
      >

        <div className="space-y-8">
          {/* User Card */}
          <div className="bg-white dark:bg-neutral-800 rounded-[40px] p-8 md:p-12 border border-gray-100 dark:border-neutral-700 shadow-[0_8px_40px_rgba(0,0,0,0.03)] dark:shadow-none relative overflow-hidden group transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="flex items-center gap-8">
                <div className="relative group/avatar shrink-0">
                  <div className="w-28 h-28 rounded-[36px] bg-blue-50 dark:bg-cta/10 text-cta flex items-center justify-center text-4xl font-black border-4 border-white dark:border-neutral-800 shadow-xl dark:shadow-none overflow-hidden transition-all group-hover/avatar:scale-105">
                    {currentUser.profileImage ? (
                      <img src={currentUser.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-cta transition-colors" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-neutral-700 rounded-2xl shadow-lg border border-gray-100 dark:border-neutral-600 flex items-center justify-center text-cta transition-colors">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight transition-colors">{currentUser.nickname}</h2>
                    <span className="px-3 py-1 bg-blue-50 dark:bg-cta/10 text-cta text-[11px] font-black rounded-lg border border-blue-100 dark:border-cta/20 uppercase tracking-widest transition-colors">Lv.4</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-secondary dark:text-neutral-300 font-medium mb-5 text-[13px] sm:text-[14px]">
                    <div className="flex items-center gap-1.5 min-w-0"><Mail className="w-4 h-4 text-cta transition-colors shrink-0" /> <span className="truncate">{currentUser.email}</span></div>
                    <div className="hidden sm:block w-1 h-1 bg-gray-200 dark:bg-neutral-700 rounded-full" />
                    <div className="flex items-center gap-1.5 shrink-0"><Star className="w-4 h-4 text-cta shrink-0" /> {currentUser.points.toLocaleString()}점</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsProfileModalOpen(true)}
                      className="px-6 py-3 bg-cta text-white text-[14px] font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
                    >
                      프로필 관리
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 dark:bg-neutral-700/30 p-6 rounded-[32px] border border-gray-100 dark:border-neutral-600/50 flex flex-col gap-4 min-w-[280px] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-black text-primary dark:text-white mb-0.5 tracking-tight transition-colors break-keep">프로필 공개 설정</div>
                    <div className="text-[11px] text-tertiary dark:text-neutral-400 font-bold transition-colors break-keep">참여 현황 공개 여부</div>
                  </div>
                  <button
                    onClick={toggleProfilePublic}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none shadow-sm ${currentUser.isProfilePublic ? 'bg-cta' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 ${currentUser.isProfilePublic ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Github Linkage */}
          <div className="bg-white dark:bg-neutral-800 rounded-[40px] p-8 md:p-10 border border-gray-100 dark:border-neutral-700 shadow-[0_8px_40px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-primary dark:text-white flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-cta" ><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                GitHub Contributions
              </h3>
              {currentUser?.githubId && <span className="text-cta font-bold text-[14px]">@{currentUser.githubId}</span>}
            </div>

            {!currentUser?.githubId ? (
              <div className="py-10 flex flex-col justify-center items-center opacity-80 border-2 border-dashed border-gray-100 dark:border-neutral-700 rounded-[32px] scale-95">
                <p className="text-tertiary dark:text-neutral-500 font-bold mb-5 break-keep">프로필에서 GitHub 아이디를 연동해주세요.</p>
                <button onClick={() => setIsProfileModalOpen(true)} className="px-6 py-2.5 bg-blue-50 dark:bg-cta/10 text-cta font-extrabold rounded-xl hover:bg-blue-100 dark:hover:bg-cta/20 transition-colors shadow-sm">GitHub 연동하기</button>
              </div>
            ) : githubLoading ? (
              <div className="py-14 text-center text-tertiary font-bold flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-50 border-t-cta rounded-full animate-spin mb-4" />
                활동 불러오는 중...
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 bg-blue-50/20 dark:bg-cta/5 p-8 rounded-[32px] border border-blue-100/30 dark:border-cta/10">
                {/* Real GitHub Contribution Grass (91 Days) */}
                <div className="flex-1 overflow-x-auto scrollbar-hide py-2 flex flex-col items-center justify-center">
                  <div className="grid grid-rows-7 gap-[4px] auto-cols-max grid-flow-col w-max mx-auto">
                    {Array.from({ length: 91 }).map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (90 - i));
                      const dateStr = date.toISOString().split('T')[0];
                      const count = commitCounts[dateStr] || 0;

                      const level = count >= 5 ? 4 : count >= 3 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0;
                      const bgDark = ['bg-neutral-800', 'bg-blue-900/40', 'bg-blue-700/60', 'bg-blue-500', 'bg-blue-400'];
                      const bgLight = ['bg-blue-50', 'bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-blue-600'];

                      return (
                        <div
                          key={i}
                          className={`w-[14px] h-[14px] rounded-[2px] transition-all duration-300 hover:scale-125 transform cursor-pointer ${theme === 'dark' ? bgDark[level] : bgLight[level]}`}
                          title={`${dateStr}: ${count} commits`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-bold text-tertiary dark:text-neutral-500 uppercase tracking-wider w-full">
                    활동 적음 <div className="flex gap-1.5"><div className="w-3 h-3 bg-blue-50 dark:bg-neutral-800 rounded-sm" /><div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/40 rounded-sm" /><div className="w-3 h-3 bg-blue-300 dark:bg-blue-700/60 rounded-sm" /><div className="w-3 h-3 bg-blue-500 dark:bg-blue-500 rounded-sm" /><div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-sm" /></div> 활동 많음
                  </div>
                </div>

                {/* Recent Events */}
                <div className="lg:w-80 shrink-0 border-l lg:pl-10 border-blue-100/50 dark:border-cta/10">
                  <h4 className="text-[12px] font-black text-cta uppercase tracking-widest mb-6 flex items-center gap-2 break-keep">
                    <div className="w-1.5 h-1.5 rounded-full bg-cta" /> 최근 활동 내역
                  </h4>
                  {githubEvents.length === 0 ? (
                    <p className="text-[14px] text-tertiary font-bold py-6">최근 활동이 없습니다.</p>
                  ) : (
                    <div className="space-y-6 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
                      {githubEvents.slice(0, 5).map((ev: any) => {
                        const isPush = ev.type === 'PushEvent';
                        const message = isPush && ev.payload.commits?.[0]?.message
                          ? ev.payload.commits[0].message
                          : ev.type.replace('Event', '');

                        return (
                          <div key={ev.id} className="text-[14px] leading-tight group">
                            <a href={`https://github.com/${ev.repo.name}`} target="_blank" rel="noreferrer" className="font-extrabold text-primary dark:text-white mb-1.5 truncate block hover:text-cta transition-colors">{ev.repo.name}</a>
                            <p className="text-secondary dark:text-neutral-400 text-[13px] line-clamp-2 group-hover:text-cta transition-colors bg-blue-50/10 dark:bg-cta/5 p-2 rounded-lg border border-transparent group-hover:border-blue-100/30 dark:group-hover:border-cta/20">
                              {message}
                            </p>
                            <div className="text-[11px] items-center text-tertiary mt-2 font-bold px-1">{new Date(ev.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Rows Matching */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch font-heading">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-neutral-800 p-8 md:p-10 rounded-[40px] border border-gray-100 dark:border-neutral-700 shadow-sm dark:shadow-none h-full flex flex-col transition-colors">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-primary dark:text-white flex items-center gap-3 transition-colors break-keep">
                    <div className="w-1.5 h-6 bg-cta rounded-full transition-colors" />
                    내 해커톤 참여기록
                  </h3>
                  <Link to="/hackathons" className="text-[13px] font-bold text-cta hover:text-blue-700 whitespace-nowrap">대회 리스트</Link>
                </div>

                {myHackathons.length === 0 ? (
                  <div className="flex-1 bg-white dark:bg-neutral-800 border-2 border-dashed border-gray-100 dark:border-neutral-700 rounded-[32px] flex flex-col items-center justify-center py-10 scale-95 opacity-80">
                    <Trophy className="w-12 h-12 text-cta mb-4 transition-colors" />
                    <p className="text-tertiary dark:text-neutral-400 font-bold">아직 참여 기록이 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {myHackathons.map(h => (
                      <Link to={`/hackathons/${h.slug}`} key={h.slug} className="group flex items-center gap-4 p-5 bg-white dark:bg-neutral-700/50 rounded-[24px] border border-gray-100 dark:border-neutral-600 hover:border-cta/20 dark:hover:border-cta/50 hover:shadow-md dark:hover:shadow-none transition-all h-fit">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-cta/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-cta/20 group-hover:bg-blue-100 dark:group-hover:bg-cta/30 transition-colors">
                          <Trophy className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-primary dark:text-white truncate leading-tight mb-1 transition-colors">{h.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-cta bg-blue-50 dark:bg-cta/10 border border-blue-100 dark:border-cta/20 px-1.5 py-0.5 rounded uppercase tracking-tighter transition-colors">
                              {h.status === 'upcoming' ? '참가 예정' : h.status === 'ongoing' ? '진행중' : h.status === 'ended' ? '종료됨' : h.status}
                            </span>
                            <span className="text-[11px] text-tertiary dark:text-neutral-500 font-bold transition-colors">{h.period?.submissionDeadlineAt ? new Date(h.period.submissionDeadlineAt).toLocaleDateString() : '일정 확인 중'}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-primary dark:text-white transition-colors group-hover:text-cta" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white dark:bg-neutral-800 p-8 rounded-[40px] border border-gray-100 dark:border-neutral-700 shadow-sm dark:shadow-none overflow-hidden h-full flex flex-col transition-colors">
                <h3 className="text-lg font-black text-primary dark:text-white mb-8 flex items-center gap-3 transition-colors break-keep">
                  <Clock className="w-5 h-5 text-cta" /> 최근 제출 기록
                </h3>

                {mySubmissions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-60">
                    <FileCheck className="w-10 h-10 text-cta mb-3 transition-colors" />
                    <p className="text-[13px] text-tertiary font-bold">제출된 내역 없음</p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-blue-100 dark:before:bg-cta/20 overflow-y-auto pr-2 custom-scrollbar">
                    {mySubmissions.slice(0, 4).map(s => (
                      <div key={s.id} className="relative pl-8 group">
                        <div className="absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full bg-white dark:bg-neutral-800 border border-blue-100 dark:border-cta/30 flex items-center justify-center shadow-sm z-10 transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-cta" />
                        </div>
                        <div className="text-[10px] font-black text-cta uppercase tracking-wider mb-1 transition-colors">{new Date(s.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                        <h5 className="font-bold text-primary dark:text-white text-[15px] leading-tight mb-2 truncate group-hover:text-cta transition-colors">{s.teamName}</h5>
                        <div className="flex items-center gap-2 text-[12px] text-cta font-medium bg-blue-50/30 dark:bg-cta/5 p-2 rounded-lg border border-blue-50 dark:border-cta/10 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 text-cta group-hover:scale-110 transition-transform" />
                          <span className="truncate">{s.fileName || 'Resource.zip'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-2">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-neutral-800 p-8 md:p-10 rounded-[40px] border border-gray-100 dark:border-neutral-700 shadow-sm dark:shadow-none h-full flex flex-col transition-colors">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-primary dark:text-white flex items-center gap-3 transition-colors break-keep">
                    <div className="w-1.5 h-6 bg-cta rounded-full transition-colors" />
                    내 소속 팀 관리
                  </h3>
                </div>

                {myTeams.length === 0 ? (
                  <div className="flex-1 bg-white dark:bg-neutral-800 border-2 border-dashed border-gray-100 dark:border-neutral-700 rounded-[32px] flex flex-col items-center justify-center py-10 scale-95 transition-all">
                    <Users className="w-12 h-12 text-cta mb-4 transition-colors opacity-60" />
                    <p className="text-tertiary dark:text-neutral-400 font-bold text-lg mb-6 opacity-80">소속된 팀이 없습니다.</p>
                    <Link to="/camp" className="px-8 py-3 bg-cta text-white font-black rounded-[20px] shadow-lg shadow-blue-100 dark:shadow-none transition-all hover:scale-105 active:scale-95">팀 찾기</Link>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1">
                    {myTeams.map(t => (
                      <Link to="/workspace" key={t.teamCode} className="flex items-center justify-between p-6 bg-white dark:bg-neutral-700/50 rounded-[32px] border border-gray-100 dark:border-neutral-600 hover:border-cta/20 dark:hover:border-cta/40 hover:shadow-md transition-all group relative h-fit shadow-sm">
                        <div className="flex-1 min-w-0 mr-8">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-extrabold text-primary dark:text-white text-xl truncate tracking-tight leading-tight group-hover:text-cta transition-colors">{t.name}</h4>
                            {t.leaderName === currentUser?.nickname && (
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-cta/10 text-cta text-[10px] font-black rounded border border-blue-100 dark:border-cta/20 tracking-tighter transition-colors">LEADER</span>
                            )}
                          </div>
                          <p className="text-[14px] text-tertiary dark:text-neutral-400 truncate max-w-lg font-medium transition-colors">{t.intro}</p>
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-right">
                            <div className="text-lg font-black text-cta dark:text-blue-400 tracking-tighter transition-colors">{t.members?.length || 1}명</div>
                            <div className="text-[10px] text-tertiary dark:text-neutral-500 font-black uppercase tracking-widest leading-none transition-colors">MEMBERS</div>
                          </div>
                          <div className="w-10 h-10 bg-blue-50 dark:bg-cta/20 rounded-xl flex items-center justify-center group-hover:bg-cta transition-colors">
                            <ChevronRight className="w-5 h-5 text-cta dark:text-white transition-colors group-hover:text-white group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white dark:bg-neutral-800 p-8 rounded-[40px] border border-gray-100 dark:border-neutral-700 shadow-sm dark:shadow-none overflow-hidden h-full flex flex-col transition-colors">
                <h3 className="text-lg font-black text-primary dark:text-white mb-10 flex items-center gap-3 uppercase tracking-tight transition-colors break-keep">
                  <Bell className="w-5 h-5 text-cta" /> 활동 통계
                </h3>
                <div className="space-y-4 flex-1">
                  <div className="p-6 bg-blue-50/30 dark:bg-cta/5 flex items-center justify-between rounded-[28px] border border-blue-50 dark:border-cta/10 group hover:shadow-inner transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center border border-blue-100 dark:border-cta/20 shadow-sm transition-colors"><Trophy className="w-5 h-5 text-cta transition-colors" /></div>
                      <div className="text-[14px] font-bold text-secondary dark:text-neutral-300 transition-colors break-keep">참여 대회</div>
                    </div>
                    <div className="text-2xl font-black text-cta font-heading tracking-tighter transition-colors">{myHackathons.length}</div>
                  </div>
                  <div className="p-6 bg-blue-50/30 dark:bg-cta/5 flex items-center justify-between rounded-[28px] border border-blue-50 dark:border-cta/10 group hover:shadow-inner transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center border border-blue-100 dark:border-cta/20 shadow-sm transition-colors"><Users className="w-5 h-5 text-cta transition-colors" /></div>
                      <div className="text-[14px] font-bold text-secondary dark:text-neutral-300 transition-colors break-keep">활동 중인 팀</div>
                    </div>
                    <div className="text-2xl font-black text-cta font-heading tracking-tighter transition-colors">{myTeams.length}</div>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-neutral-700 transition-colors">
                  <div className="bg-cta/5 dark:bg-cta/10 p-4 rounded-2xl flex items-center gap-3 transition-colors">
                    <Info className="w-4 h-4 text-cta transition-colors shrink-0" />
                    <p className="text-[11px] text-cta font-bold leading-tight">더 많은 해커톤에 참여하여<br />레벨을 올려보세요!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Modal */}
        <AnimatePresence>
          {isProfileModalOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-neutral-800 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden relative transition-colors"
              >
                <div className="p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gray-50 dark:bg-neutral-700/50 rounded-xl flex items-center justify-center text-primary dark:text-white border border-gray-100 dark:border-neutral-600 shadow-sm transition-colors">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight transition-colors">프로필 변경</h3>
                      <p className="text-[11px] text-tertiary dark:text-neutral-400 font-bold uppercase tracking-widest transition-colors">Update your identity</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[13px] font-black text-primary dark:text-white mb-2.5 ml-1 transition-colors">닉네임</label>
                      <input
                        type="text"
                        value={newNickname}
                        onChange={(e) => setNewNickname(e.target.value)}
                        placeholder="새로운 닉네임을 입력하세요"
                        className="w-full px-6 py-4 bg-gray-50/50 dark:bg-neutral-700/50 border border-gray-100 dark:border-neutral-600 rounded-[22px] text-[15px] font-bold text-primary dark:text-white focus:outline-none focus:border-cta/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-black text-primary dark:text-white mb-2.5 ml-1 transition-colors">GitHub 연동 아이디</label>
                      <input
                        type="text"
                        value={newGithubId}
                        onChange={(e) => setNewGithubId(e.target.value)}
                        placeholder="GitHub Username"
                        className="w-full px-6 py-4 bg-gray-50/50 dark:bg-neutral-700/50 border border-gray-100 dark:border-neutral-600 rounded-[22px] text-[15px] font-bold text-primary dark:text-white focus:outline-none focus:border-cta/30 transition-colors"
                      />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        onClick={handleSaveNickname}
                        className="flex-1 py-4 bg-primary dark:bg-cta text-white font-black rounded-2xl hover:bg-gray-800 dark:hover:bg-blue-600 transition-all shadow-lg shadow-gray-200 dark:shadow-none"
                      >
                        저장하기
                      </button>
                      <button
                        onClick={() => setIsProfileModalOpen(false)}
                        className="flex-1 py-4 bg-gray-100 text-tertiary font-black rounded-2xl hover:bg-gray-200 transition-all"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
