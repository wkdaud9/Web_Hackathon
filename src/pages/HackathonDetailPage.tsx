import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  getHackathons,
  getHackathonDetail,
  getTeams,
  getLeaderboard,
  getInvites,
  addInvite,
  addLeaderboardEntry,
  getSubmissionByTeam,
  updateSubmission,
  deleteSubmission,
  addSubmission,
  getSubmissions
} from '../utils/api';
import Dropdown from '../components/Dropdown';
import TeamDetailModal from '../components/TeamDetailModal';
import type {
  Hackathon,
  HackathonDetail,
  Leaderboard,
  LeaderboardEntry,
  Submission,
  Team,
  TeamInvite,
} from '../types/models';
import {
  Trophy,
  Users,
  FileCheck,
  Clock,
  Layout,
  ArrowLeft,
  Calendar,
  Gift,
  List,
  FileText,
  Calculator
} from 'lucide-react';

export default function HackathonDetailPage() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [detail, setDetail] = useState<HackathonDetail | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [, setInvites] = useState<TeamInvite[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);

  const [submitNotes, setSubmitNotes] = useState('');
  const [submitFile, setSubmitFile] = useState('');
  const [submitFileName, setSubmitFileName] = useState('');
  const [submissionType, setSubmissionType] = useState<'individual' | 'team'>('individual');
  const [submitTeamName, setSubmitTeamName] = useState('');

  const [inviteTeamCode, setInviteTeamCode] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const timer = window.setTimeout(() => {
        setHackathon(getHackathons().find((h) => h.slug === slug) || null);
        setDetail(getHackathonDetail(slug));
        setTeams(getTeams(slug));
        setLeaderboard(getLeaderboard(slug));
        setSubmissions(getSubmissions().filter((s) => s.hackathonSlug === slug));
        setInvites(getInvites(slug));
        setLoading(false);
      }, 250);
      return () => window.clearTimeout(timer);
    } catch {
      setError('해커톤 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setLoading(false);
    }
  }, [slug]);

  // Auto-detect team or individual for submission and check for existing submission
  useEffect(() => {
    if (currentUser) {
      let teamName = '';
      if (submissionType === 'individual') {
        teamName = currentUser.nickname;
      } else {
        const myTeam = teams.find(t => t.leaderName === currentUser.nickname || (t.members && t.members.includes(currentUser.nickname)));
        if (myTeam) {
          teamName = myTeam.name;
        }
      }
      setSubmitTeamName(teamName);

      if (teamName && slug) {
        const existing = getSubmissionByTeam(slug, teamName);
        setExistingSubmission(existing);
        if (existing) {
          setSubmitNotes(existing.notes);
          setSubmitFileName(existing.fileName || '');
        } else {
          setSubmitNotes('');
          setSubmitFileName('');
        }
      }
    } else {
      setSubmitTeamName('');
      setExistingSubmission(null);
    }
  }, [currentUser, teams, submissionType, slug]);

  // Set up intersection observer to update activeTab on scroll
  useEffect(() => {
    if (loading || error || !detail) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section-id');
            if (id && id !== activeTab) {
              setActiveTab(id);
            }
          }
        });
      },
      // rootMargin: 상단에서 20% 내려온 지점부터 하단에서 60% 올라온 지점까지의 "센서 영역"을 만듭니다.
      // 이 센서 영역에 카드가 들어오면 entry.isIntersecting이 단번에 true가 됩니다.
      { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading, error, detail, activeTab]);

  // 가로 스크롤 관련 wheel 이벤트를 제거하고 수직 배치로 원복합니다.

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = sectionRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const recentSubmissions = useMemo(() => submissions.slice().reverse(), [submissions]);

  const submittedTeamNames = useMemo(() => {
    const names = new Set<string>();
    submissions.forEach((submission) => {
      if (submission.teamName) names.add(submission.teamName);
    });
    leaderboard?.entries?.forEach((entry) => names.add(entry.teamName));
    return names;
  }, [submissions, leaderboard]);

  const notSubmittedTeams = useMemo(
    () => teams.filter((team) => !submittedTeamNames.has(team.name)),
    [teams, submittedTeamNames],
  );

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !inviteTeamCode || !currentUser) return;

    const newInvite: TeamInvite = {
      id: Date.now(),
      hackathonSlug: slug,
      teamCode: inviteTeamCode,
      applicantName: currentUser.nickname,
      applicantId: currentUser.id,
      message: inviteMessage.trim(),
      status: 'pending',
      type: 'application',
      createdAt: new Date().toISOString(),
    };

    addInvite(newInvite);
    setInvites((prev) => [...prev, newInvite]);
    setInviteTeamCode('');
    setInviteMessage('');
    showToast('팀 합류 신청이 완료되었습니다!', 'success');
  };



  if (loading) {
    return (
      <div className="py-20 text-center text-secondary dark:text-neutral-300 transition-colors font-medium bg-white dark:bg-neutral-800 rounded-[24px] shadow-sm dark:shadow-none">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-500 font-bold bg-red-50 rounded-[24px] border border-red-100">
        {error}
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-20 bg-white dark:bg-neutral-800 transition-colors shadow-sm dark:shadow-none flex flex-col items-center justify-center min-h-[50vh] gap-4 border border-gray-100 dark:border-neutral-700 rounded-[24px]">
        <p className="text-tertiary dark:text-neutral-400 transition-colors font-medium text-lg">해당 해커톤 상세 정보를 찾을 수 없습니다.</p>
        <Link to="/hackathons" className="px-6 py-3 rounded-[14px] bg-blue-50 dark:bg-cta/10 transition-colors text-cta font-bold hover:bg-cta hover:text-white">
          목록으로 이동
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !submitTeamName.trim() || (!submitFile && !submitFileName)) return;

    const fileRef = submitFile || (submitFileName ? `local://${submitFileName}` : '');

    if (existingSubmission) {
      const updatedSub: Submission = {
        ...existingSubmission,
        notes: submitNotes,
        fileUrl: fileRef || existingSubmission.fileUrl,
        fileName: submitFileName || existingSubmission.fileName,
        submittedAt: new Date().toISOString(),
      };
      updateSubmission(updatedSub);
      setSubmissions(submissions.map(s => s.id === updatedSub.id ? updatedSub : s));
      showToast('제출물이 수정되었습니다.', 'success');
    } else {
      const newSub: Submission = {
        id: Date.now(),
        hackathonSlug: slug,
        teamName: submitTeamName.trim(),
        notes: submitNotes,
        fileUrl: fileRef,
        fileName: submitFileName || undefined,
        submittedAt: new Date().toISOString(),
      };
      addSubmission(newSub);
      setSubmissions([...submissions, newSub]);
      showToast('성공적으로 제출되었습니다!', 'success');

      // Add to real-time leaderboard only for new submissions or handled differently
      const mockScore = Math.floor(Math.random() * 31) + 70; // 70 ~ 100
      const newEntry: LeaderboardEntry = {
        rank: 0,
        teamName: submitTeamName.trim(),
        score: mockScore,
        submittedAt: new Date().toISOString()
      };
      addLeaderboardEntry(slug, newEntry);

      setLeaderboard(prev => {
        const updatedEntries = [...(prev?.entries || []), newEntry].sort((a, b) => b.score - a.score);
        updatedEntries.forEach((e, idx) => { e.rank = idx + 1; });
        return { hackathonSlug: slug, updatedAt: new Date().toISOString(), entries: updatedEntries };
      });
    }

    setSubmitNotes('');
    setSubmitFile('');
    setSubmitFileName('');
    // setSubmitTeamName(''); // Keep team name for persistence/UI consistency
  };

  const handleDeleteSubmission = (id: number, teamName: string) => {
    if (!slug) return;
    if (!window.confirm('정말로 이 제출물을 삭제하시겠습니까? 리더보드 점수도 함께 삭제됩니다.')) return;

    deleteSubmission(id, slug, teamName);
    setSubmissions(submissions.filter(s => s.id !== id));

    // Update local state for leaderboard
    setLeaderboard(prev => {
      if (!prev) return null;
      const updatedEntries = prev.entries.filter(e => e.teamName !== teamName);
      updatedEntries.forEach((e, idx) => { e.rank = idx + 1; });
      return { ...prev, entries: updatedEntries, updatedAt: new Date().toISOString() };
    });

    // Reset form state if the deleted submission was the active one
    if (existingSubmission?.id === id) {
      setExistingSubmission(null);
      setSubmitNotes('');
      setSubmitFileName('');
    }

    showToast('제출물이 삭제되었습니다.', 'success');
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
    <div className="w-full min-h-screen bg-white dark:bg-transparent transition-colors duration-300">
      {/* Sticky Header */}
      <div className="sticky top-0 z-[40] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 px-6 py-4 transition-colors duration-300">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/hackathons" className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors flex items-center justify-center text-primary dark:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-black text-primary dark:text-white tracking-tighter uppercase transition-colors truncate">{detail.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-6 pt-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 hidden">
          <Link to="/hackathons" className="text-[15px] font-bold text-tertiary dark:text-neutral-400 transition-colors hover:text-primary dark:hover:text-white dark:text-white mb-3 inline-block">&larr; 목록으로 돌아가기</Link>
          <h1 className="text-3xl md:text-5xl font-bold font-heading text-primary dark:text-white transition-colors mb-4 truncate tracking-tight">{detail.title}</h1>
        </motion.div>

        {/* 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-10 items-start relative pb-20">

          {/* Left Sidebar Navigation (Desktop Only) */}
          <div className="hidden lg:flex flex-col sticky top-[100px] w-64 flex-shrink-0 bg-white dark:bg-neutral-800 transition-colors p-4 rounded-[24px] border border-gray-100 dark:border-neutral-700 shadow-[0_4px_20px_rgb(0,0,0,0.03)] z-30">
            <h3 className="text-[14px] font-bold text-tertiary dark:text-neutral-400 transition-colors mb-3 px-3">빠른 이동</h3>
            <div className="flex flex-col gap-1.5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`text-left px-5 py-3.5 rounded-[16px] text-[15px] font-bold transition-all duration-200 ${activeTab === tab.id ? 'bg-primary text-white shadow-md dark:shadow-none' : 'bg-transparent text-secondary dark:text-neutral-300 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors dark:bg-neutral-800/50 transition-colors hover:text-primary dark:hover:text-white transition-colors dark:text-white transition-colors '
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Top Bar (Hidden on Desktop) */}
          <div className="lg:hidden sticky top-[64px] z-30 w-full min-w-0 bg-[#F2F4F6]/95 backdrop-blur-md pt-5 border-b border-gray-200 dark:border-neutral-700 transition-colors pb-3 mb-6">
            <div className="w-full overflow-x-auto scrollbar-hide py-1">
              <div className="flex flex-nowrap gap-2 w-max px-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => scrollToSection(tab.id)}
                    className={`flex-shrink-0 px-5 py-2.5 rounded-[14px] text-[14px] font-bold transition-all duration-200 whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-md dark:shadow-none' : 'bg-transparent text-tertiary dark:text-neutral-400 transition-colors hover:bg-white dark:bg-neutral-800 transition-colors hover:text-primary dark:hover:text-white transition-colors dark:text-white transition-colors hover:shadow-sm dark:shadow-none'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {/* 우측 끝 여백을 줘서 마지막 아이템 그림자나 컨텐츠가 잘리지 않게 함 */}
                <div className="w-2 flex-shrink-0"></div>
              </div>
            </div>
          </div>

          {/* Right Content Area (Vertical Flow) */}
          <div
            ref={scrollContainerRef}
            className="flex-1 flex flex-col gap-10 w-full min-w-0"
          >
            {tabs.map(tab => (
              <div
                key={tab.id}
                data-section-id={tab.id}
                ref={(el) => { sectionRefs.current[tab.id] = el; }}
                className="w-full px-4 md:px-0 scroll-mt-32"
              >
                <div className="bg-white dark:bg-neutral-800 transition-colors p-6 md:p-12 rounded-[32px] border border-gray-100 dark:border-neutral-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-auto w-full max-w-[900px]">
                  {tab.id === 'overview' && (
                    <div className="relative">
                      <h2 className="text-2xl font-bold font-heading mb-6 text-primary dark:text-white transition-colors flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-primary dark:text-white" /> 개요
                      </h2>
                      <p className="text-secondary dark:text-neutral-300 transition-colors font-medium leading-[1.7] mb-10 text-[17px]">{detail.sections?.overview?.summary || '제공된 개요가 없습니다.'}</p>

                      <h3 className="text-[20px] font-bold mb-4 text-primary dark:text-white transition-colors">유의사항 (Notice)</h3>
                      <ul className="list-disc pl-5 text-secondary dark:text-neutral-300 transition-colors font-medium space-y-3">
                        {detail.sections?.info?.notice?.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                  )}

                  {tab.id === 'eval' && (
                    <div className="relative">
                      <h2 className="text-2xl font-bold font-heading mb-6 text-primary dark:text-white transition-colors flex items-center gap-3">
                        <FileCheck className="w-6 h-6 text-primary dark:text-white" /> 평가 기준
                      </h2>
                      <p className="text-secondary dark:text-neutral-300 transition-colors font-medium mb-8 text-[17px] leading-[1.7]">{detail.sections?.eval?.description || '평가 상세 정보가 없습니다.'}</p>

                      {detail.sections?.eval?.scoreDisplay && (
                        <div className="bg-gray-50 dark:bg-neutral-800/50 transition-colors p-8 rounded-[24px] border border-gray-100 dark:border-neutral-700 inline-block min-w-[320px] w-full max-w-2xl shadow-sm dark:shadow-none">
                          <h3 className="font-bold text-primary dark:text-white transition-colors mb-5 text-lg">{detail.sections.eval.scoreDisplay.label} 가중치 안내</h3>
                          <ul className="space-y-4">
                            {detail.sections.eval.scoreDisplay.breakdown?.map((b, i) => (
                              <li key={i} className="flex justify-between items-center text-secondary dark:text-neutral-300 transition-colors font-medium border-b border-gray-200 dark:border-neutral-700 pb-3 last:border-0 last:pb-0">
                                <span>{b.label}</span>
                                <span className="font-mono text-cta font-black bg-blue-50 dark:bg-cta/10 transition-colors px-3 py-1.5 rounded-lg">{b.weightPercent}%</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {tab.id === 'schedule' && (
                    <div className="relative">
                      <h2 className="text-2xl font-bold font-heading mb-10 text-primary dark:text-white transition-colors flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-primary dark:text-white" /> 일정 (KST 기준)
                      </h2>
                      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200">
                        {detail.sections?.schedule?.milestones?.map((m, i) => (
                          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full border-[3px] border-white bg-cta md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm dark:shadow-none shrink-0 z-10 ml-0 md:ml-auto md:mr-auto"></div>
                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white dark:bg-neutral-800 transition-colors p-5 rounded-[20px] border border-gray-100 dark:border-neutral-700 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-cta/30">
                              <div className="font-bold text-primary dark:text-white transition-colors mb-2 text-[17px]">{m.name}</div>
                              <time className="text-[14px] text-tertiary dark:text-neutral-400 transition-colors font-mono font-semibold">{new Date(m.at).toLocaleString()}</time>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab.id === 'prize' && (
                    <div className="relative max-w-2xl">
                      <h2 className="text-2xl font-bold font-heading mb-6 text-primary dark:text-white transition-colors flex items-center gap-3">
                        <Gift className="w-6 h-6 text-primary dark:text-white" /> 상금 리스트
                      </h2>
                      <div className="space-y-4">
                        {detail.sections?.prize?.items?.map((item, i) => (
                          <div key={i} className="bg-white dark:bg-neutral-800 transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 rounded-[24px] flex justify-between items-center border border-gray-100 dark:border-neutral-700 hover:border-cta/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
                            <div className="flex items-center gap-5">
                              <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center border transition-colors shadow-sm ${item.place === '1st' ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30 text-amber-500' :
                                item.place === '2nd' ? 'bg-slate-50 border-slate-100 dark:bg-neutral-700/50 dark:border-neutral-600 text-slate-400' :
                                  item.place === '3rd' ? 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30 text-orange-400' :
                                    'bg-gray-50 border-gray-100 dark:bg-neutral-800 dark:border-neutral-700 text-tertiary'
                                }`}>
                                <Trophy className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-tertiary dark:text-neutral-500 uppercase tracking-[0.2em] leading-none mb-1.5">RANK</span>
                                <strong className="text-[18px] text-primary dark:text-white transition-colors uppercase font-black tracking-tight">{item.place}</strong>
                              </div>
                            </div>
                            <span className="font-black text-[22px] text-cta font-mono">{item.amountKRW.toLocaleString()} KRW</span>
                          </div>
                        )) || <p className="text-tertiary dark:text-neutral-400 transition-colors font-medium">상금 정보가 준비되지 않았습니다.</p>}
                      </div>
                    </div>
                  )}

                  {tab.id === 'teams' && (
                    <div className="relative">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-bold font-heading text-primary dark:text-white transition-colors flex items-center gap-3">
                            <Users className="w-6 h-6 text-primary dark:text-white" /> 참여/모집 팀 ({teams.length})
                          </h2>
                          <button
                            onClick={() => setIsNoticeOpen(true)}
                            className="w-6 h-6 rounded-full bg-blue-50 dark:bg-cta/10 transition-colors text-cta flex items-center justify-center font-bold text-[12px] hover:bg-blue-100 shadow-sm dark:shadow-none"
                            title="팀 구성 유의사항"
                          >
                            ?
                          </button>
                        </div>
                        <Link to={`/camp?hackathon=${slug}&new=true`} className="px-6 py-3.5 bg-cta text-white rounded-[16px] font-bold hover:bg-blue-600 transition-colors shadow-[0_8px_20px_rgba(49,130,246,0.3)] flex items-center justify-center gap-2 w-full sm:w-fit">
                          + 팀 모집글 등록
                        </Link>
                      </div>

                      {teams.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 dark:bg-neutral-800/50 transition-colors rounded-[24px] border border-gray-100 dark:border-neutral-700 border-dashed">
                          <p className="text-secondary dark:text-neutral-300 transition-colors font-medium mb-2">아직 이 해커톤을 위한 팀이 없습니다.</p>
                          <p className="text-[14px] text-tertiary dark:text-neutral-400 transition-colors">첫 팀을 결성하고 멤버를 구해 우승에 도전하세요!</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {hackathon?.status === 'ended' ? (
                            <div className="bg-gray-50 dark:bg-neutral-800/50 transition-colors border border-gray-200 dark:border-neutral-700 p-8 rounded-[24px] text-center w-full">
                              <p className="text-secondary dark:text-neutral-300 transition-colors font-bold">팀 모집 및 합류가 종료되었습니다.</p>
                            </div>
                          ) : (
                            <form onSubmit={handleInviteSubmit} className="bg-gray-50 dark:bg-neutral-800/50 transition-colors p-6 md:p-8 rounded-[24px] border border-gray-100 dark:border-neutral-700 grid grid-cols-1 md:grid-cols-2 gap-5 relative overflow-hidden">
                              {!currentUser && (
                                <div className="absolute inset-0 bg-white dark:bg-neutral-800 transition-colors /60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-[24px]">
                                  <p className="font-bold text-primary dark:text-white transition-colors mb-3 text-lg">팀 지원은 로그인 후 가능합니다.</p>
                                </div>
                              )}
                              <div className="md:col-span-2">
                                <h3 className="font-bold text-primary dark:text-white transition-colors mb-2 text-[17px]">팀 합류 신청하기</h3>
                              </div>
                              <div className="w-full">
                                <Dropdown
                                  options={[
                                    { label: '신청 팀 선택', value: '' },
                                    ...teams.map((team) => ({
                                      label: team.name,
                                      value: team.teamCode,
                                    })),
                                  ]}
                                  value={inviteTeamCode}
                                  onChange={(val) => setInviteTeamCode(val)}
                                  className="w-full !rounded-[14px]"
                                />
                              </div>
                              <button type="submit" disabled={!inviteTeamCode} className="px-4 py-3 bg-primary text-white rounded-[14px] font-bold hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed">
                                팀 합류 신청
                              </button>
                              <textarea
                                value={inviteMessage}
                                onChange={(e) => setInviteMessage(e.target.value)}
                                placeholder="간단한 소개/포지션 (선택)"
                                className="md:col-span-2 bg-white dark:bg-neutral-800 transition-colors border border-gray-200 dark:border-neutral-700 rounded-[14px] px-4 py-3 text-primary dark:text-white font-medium outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all h-28 resize-none placeholder:text-tertiary dark:text-neutral-400"
                              />
                            </form>
                          )}

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {teams.map((t) => (
                              <div key={t.teamCode} className="bg-white dark:bg-neutral-800 transition-colors p-6 rounded-[24px] border border-gray-100 dark:border-neutral-700 hover:border-cta/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all flex flex-col h-full">
                                <div className="flex justify-between items-start mb-3">
                                  <button onClick={() => setSelectedTeam(t)} className="font-bold text-[18px] text-primary dark:text-white transition-colors hover:text-cta text-left">
                                    {t.name}
                                  </button>
                                </div>
                                <p className="text-secondary dark:text-neutral-300 transition-colors text-[14px] font-medium mb-5 flex-1 line-clamp-3 leading-relaxed">{t.intro}</p>
                                <div className="flex flex-wrap gap-1.5 mb-5">
                                  {t.lookingFor?.map((role) => <span key={role} className="text-[12px] font-bold text-cta bg-blue-50 dark:bg-cta/10 transition-colors px-2 py-0.5 rounded-md">#{role}</span>)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {tab.id === 'submit' && (
                    <div className="relative w-full">
                      <h2 className="text-2xl font-bold font-heading mb-6 text-primary dark:text-white transition-colors flex items-center gap-3">
                        <Layout className="w-6 h-6 text-primary dark:text-white" />
                        {existingSubmission ? '결과물 수정' : '결과물 제출'}
                      </h2>

                      <div className="bg-blue-50 dark:bg-cta/10 transition-colors border border-blue-100 dark:border-cta/20 p-6 md:p-8 rounded-[24px] mb-10 w-full max-w-3xl">
                        <h3 className="font-bold text-cta mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-cta" /> 제출 가이드
                        </h3>
                        <ul className="list-disc pl-5 text-secondary dark:text-neutral-300 transition-colors font-medium text-[15px] space-y-2.5 leading-relaxed">
                          {detail.sections?.submit?.guide?.map((g, i) => <li key={i}>{g}</li>) || <li>가이드가 없습니다. 규칙에 맞게 제출하세요.</li>}
                        </ul>
                      </div>

                      {hackathon?.status === 'ended' ? (
                        <div className="bg-gray-50 dark:bg-neutral-800/50 transition-colors border border-gray-200 dark:border-neutral-700 p-10 rounded-[32px] text-center w-full max-w-3xl">
                          <div className="w-16 h-16 bg-gray-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                            <Clock className="w-8 h-8 text-primary dark:text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-primary dark:text-white transition-colors mb-2">종료된 해커톤입니다</h3>
                          <p className="text-secondary dark:text-neutral-300 transition-colors font-medium text-[15px]">제출 마감 기한이 지나 더 이상 결과물을 제출할 수 없습니다.<br />리더보드 탭에서 다른 팀들의 멋진 결과물을 확인해보세요!</p>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-gray-50/50 dark:bg-neutral-800/40 p-6 md:p-8 rounded-[32px] border border-gray-200 dark:border-neutral-700 transition-colors w-full relative overflow-hidden shadow-sm dark:shadow-none">
                          {!currentUser && (
                            <div className="absolute inset-0 bg-white dark:bg-neutral-800 transition-colors /60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-[32px]">
                              <p className="font-bold text-primary dark:text-white transition-colors mb-3 text-lg">결과물 제출은 로그인 후 가능합니다.</p>
                            </div>
                          )}
                          <div>
                            <div className={`flex bg-white dark:bg-neutral-800 transition-colors rounded-[16px] p-1.5 border border-gray-200 dark:border-neutral-700 transition-colors mb-6 max-w-xs shadow-sm dark:shadow-none ${existingSubmission ? 'opacity-60 cursor-not-allowed' : ''}`}>
                              <button
                                type="button"
                                onClick={() => !existingSubmission && setSubmissionType('individual')}
                                disabled={!!existingSubmission}
                                className={`flex-1 py-2 text-[14px] font-bold rounded-[12px] transition-colors ${submissionType === 'individual' ? 'bg-primary text-white shadow-sm dark:shadow-none' : 'text-tertiary dark:text-neutral-400 transition-colors hover:text-primary dark:hover:text-white transition-colors dark:text-white transition-colors '} ${existingSubmission ? 'cursor-not-allowed' : ''}`}
                              >개인 제출</button>
                              <button
                                type="button"
                                onClick={() => !existingSubmission && setSubmissionType('team')}
                                disabled={!!existingSubmission}
                                className={`flex-1 py-2 text-[14px] font-bold rounded-[12px] transition-colors ${submissionType === 'team' ? 'bg-primary text-white shadow-sm dark:shadow-none' : 'text-tertiary dark:text-neutral-400 transition-colors hover:text-primary dark:hover:text-white transition-colors dark:text-white transition-colors '} ${existingSubmission ? 'cursor-not-allowed' : ''}`}
                              >팀 제출</button>
                            </div>

                            {submissionType === 'team' && !submitTeamName && (
                              <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-[16px] flex items-start gap-3 transition-colors">
                                <span className="text-red-500 dark:text-red-400 text-lg mt-0.5 transition-colors">⚠️</span>
                                <div>
                                  <h4 className="font-bold text-red-700 dark:text-red-400 text-[14px] transition-colors">소속된 팀이 없습니다</h4>
                                  <p className="text-[13px] text-red-600 dark:text-red-300 font-medium mt-1 transition-colors">팀 제출을 원하시면 먼저 [참여 팀 현황] 탭에서 팀에 가입하거나 생성해주세요.</p>
                                </div>
                              </div>
                            )}

                            <label className="block text-[15px] font-bold text-primary dark:text-white transition-colors mb-2.5">
                              {submissionType === 'individual' ? '참여자 이름 (자동 입력됨)' : '소속 팀명 (자동 인식됨)'}
                            </label>
                            <input
                              type="text"
                              className="w-full bg-gray-50 dark:bg-neutral-800/50 transition-colors border border-gray-200 dark:border-neutral-700 rounded-[16px] px-5 py-3.5 text-secondary dark:text-neutral-300 font-medium focus:outline-none cursor-not-allowed"
                              value={submitTeamName}
                              readOnly
                              disabled
                            />
                            {submissionType === 'team' && submitTeamName.length > 0 && (
                              <p className="text-[13px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 ml-1 transition-colors">✓ 소속된 팀({submitTeamName})이 자동으로 선택되었습니다.</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[15px] font-bold text-primary dark:text-white transition-colors mb-2.5">제출 파일 / URL 링크</label>
                            <input
                              type="text"
                              className="w-full bg-white dark:bg-neutral-800 transition-colors border border-gray-200 dark:border-neutral-700 rounded-[16px] px-5 py-3.5 text-primary dark:text-white font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-tertiary dark:text-neutral-400"
                              placeholder="https://github.com/..."
                              value={submitFile}
                              onChange={(e) => setSubmitFile(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[15px] font-bold text-primary dark:text-white transition-colors mb-2.5">파일 업로드 (zip, pdf, txt, md)</label>
                            <div className="relative">
                              <input
                                type="file"
                                accept=".zip,.pdf,.txt,.md"
                                className="w-full block text-[15px] text-tertiary dark:text-neutral-400 transition-colors file:mr-4 file:py-2.5 file:px-6 file:rounded-[12px] file:border-0 file:text-[14px] file:font-bold file:bg-gray-100 dark:bg-neutral-700 file:text-primary dark:text-white hover:file:bg-gray-200 cursor-pointer bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-[16px] p-2 focus:outline-none focus:border-cta transition-all"
                                onChange={(e) => setSubmitFileName(e.target.files?.[0]?.name || '')}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[15px] font-bold text-primary dark:text-white transition-colors mb-2.5">설명 메시지 (선택)</label>
                            <textarea
                              className="w-full bg-white dark:bg-neutral-800 transition-colors border border-gray-200 dark:border-neutral-700 rounded-[16px] px-5 py-4 text-primary dark:text-white font-medium outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all h-28 resize-none placeholder:text-tertiary dark:text-neutral-400 leading-[1.7]"
                              placeholder="심사위원이 확인할 참고 사항이나 서비스 소개를 남겨주세요."
                              value={submitNotes}
                              onChange={(e) => setSubmitNotes(e.target.value)}
                            ></textarea>
                          </div>
                          <button type="submit" disabled={submissionType === 'team' && !submitTeamName} className="w-full py-4 bg-cta text-white text-[17px] font-bold rounded-[16px] hover:bg-blue-600 transition-colors shadow-lg dark:shadow-none shadow-blue-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cta">
                            {existingSubmission ? '결과물 수정하기' : '결과물 제출하기'}
                          </button>
                        </form>
                      )}

                      {submissions.length > 0 && (
                        <div className="mt-12 w-full max-w-3xl">
                          <h3 className="text-[20px] font-bold mb-6 text-primary dark:text-white transition-colors flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary dark:text-white" /> 최근 제출 기록
                          </h3>
                          <div className="space-y-4">
                            {recentSubmissions.map((s) => (
                              <div key={s.id} className="bg-gray-50/50 dark:bg-neutral-800/40 transition-all duration-300 p-6 rounded-[24px] border border-gray-100 dark:border-neutral-700 flex flex-col gap-2 relative overflow-hidden group hover:border-cta/40 hover:bg-white dark:hover:bg-neutral-700/50 hover:shadow-md dark:hover:shadow-[0_0_25px_rgba(49,130,246,0.12)]">
                                <div className="flex justify-between text-tertiary dark:text-neutral-400 transition-colors text-[13px] font-bold mb-2">
                                  <span>제출 시간</span>
                                  <span className="font-mono">{new Date(s.submittedAt).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="text-primary dark:text-white transition-colors text-[16px] font-bold flex items-center gap-2">
                                    <span className="bg-white dark:bg-neutral-800 transition-colors px-2.5 py-1 rounded-md border border-gray-200 dark:border-neutral-700 text-[13px] text-tertiary dark:text-neutral-400 font-bold">팀</span> {s.teamName || '미상'}
                                  </div>
                                  {s.teamName === submitTeamName && (
                                    <button
                                      onClick={() => handleDeleteSubmission(s.id, s.teamName!)}
                                      className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors bg-red-50 dark:bg-red-900/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                                    >
                                      삭제
                                    </button>
                                  )}
                                </div>
                                {s.fileName && <div className="text-secondary dark:text-neutral-300 transition-colors text-[14px] font-medium mt-2">첨부: {s.fileName}</div>}
                                <div className="text-cta mt-1 font-mono font-bold truncate bg-blue-50/50 dark:bg-cta/10 transition-colors p-3 rounded-[12px] inline-block w-fit mt-2 border border-blue-100/50 dark:border-cta/20">{s.fileUrl}</div>
                                {s.notes && <div className="text-secondary dark:text-neutral-300 transition-colors font-medium mt-4 bg-white dark:bg-neutral-800 p-4 rounded-[14px] border border-gray-100 dark:border-neutral-700">{s.notes}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {tab.id === 'leaderboard' && (
                    <div className="relative w-full">
                      <h2 className="text-2xl font-bold font-heading mb-4 text-primary dark:text-white transition-colors flex items-center gap-3">
                        <List className="w-6 h-6 text-primary dark:text-white" /> 리더보드
                      </h2>

                      {detail.sections?.eval?.scoreDisplay && (
                        <div className="bg-blue-50/50 dark:bg-cta/10 transition-colors p-5 rounded-[20px] mb-8 border border-blue-100 dark:border-cta/20 flex items-start gap-4 shadow-sm dark:shadow-none max-w-3xl">
                          <Calculator className="w-6 h-6 text-primary dark:text-white mt-1 transition-colors" />
                          <div>
                            <h4 className="font-bold text-primary dark:text-white transition-colors mb-1">점수 산정 방식 안내</h4>
                            <p className="text-[14px] text-secondary dark:text-neutral-300 transition-colors font-medium leading-relaxed">
                              최종 점수는 <strong>{detail.sections.eval.scoreDisplay.label}</strong> 기준에 따라 산정됩니다.
                              ({detail.sections.eval.scoreDisplay.breakdown?.map(b => `${b.label} ${b.weightPercent}%`).join(', ')})
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="text-secondary dark:text-neutral-300 transition-colors font-medium mb-10 max-w-3xl leading-relaxed text-[16px]">{detail.sections?.leaderboard?.note}</p>

                      {!leaderboard || !leaderboard.entries || leaderboard.entries.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-neutral-800/50 transition-colors p-16 rounded-[24px] border border-gray-100 dark:border-neutral-700 text-center text-tertiary dark:text-neutral-400 font-bold text-lg">
                          아직 리더보드 점수가 등록되지 않았습니다.
                        </div>
                      ) : (
                        <div className="space-y-8 max-w-4xl">
                          <div className="w-full overflow-x-auto rounded-[24px] border border-gray-100 dark:border-neutral-700 transition-colors shadow-[0_2px_15px_rgb(0,0,0,0.02)] bg-white dark:bg-neutral-800">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                              <thead>
                                <tr className="bg-gray-50/80 dark:bg-neutral-800/80 text-tertiary dark:text-neutral-400 transition-colors text-[13px] uppercase tracking-wider">
                                  <th className="py-5 px-6 font-bold">순위</th>
                                  <th className="py-5 px-6 font-bold">팀명</th>
                                  <th className="py-5 px-6 font-bold text-right">최종 점수</th>
                                  <th className="py-5 px-6 font-bold text-right">제출 일자</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700 transition-colors">
                                {leaderboard.entries?.map((entry: LeaderboardEntry) => (
                                  <tr key={entry.teamName} className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors /50">
                                    <td className="py-4 px-6">
                                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-[13px] ${entry.rank === 1 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 transition-colors' :
                                        entry.rank === 2 ? 'bg-slate-100 dark:bg-neutral-700/50 text-slate-600 dark:text-neutral-300 ring-2 ring-slate-200 dark:ring-neutral-600' :
                                          entry.rank === 3 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 transition-colors' :
                                            'text-secondary dark:text-neutral-300 transition-colors border border-gray-200 dark:border-neutral-700 transition-colors '
                                        }`}>
                                        {entry.rank}
                                      </span>
                                    </td>
                                    <td className="py-4 px-6 text-primary dark:text-white transition-colors font-bold text-[16px]">
                                      {entry.teamName}
                                    </td>
                                    <td className="py-4 px-6 text-cta font-mono font-black text-right text-[18px]">
                                      {entry.score}점
                                    </td>
                                    <td className="py-4 px-6 text-[14px] text-tertiary dark:text-neutral-400 transition-colors font-mono font-medium text-right">
                                      {new Date(entry.submittedAt).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="rounded-[24px] border border-gray-100 dark:border-neutral-700 transition-colors bg-gray-50 dark:bg-neutral-800/50 p-6 md:p-8 mt-6">
                            <h3 className="text-[15px] font-bold text-primary dark:text-white transition-colors mb-4 flex items-center gap-2">
                              <span className="w-1.5 h-4 bg-gray-400 dark:bg-neutral-500 transition-colors rounded-full"></span>
                              미제출 팀
                            </h3>
                            {notSubmittedTeams.length === 0 ? (
                              <p className="text-[14px] text-tertiary dark:text-neutral-400 transition-colors font-medium bg-white dark:bg-neutral-800 p-4 rounded-[12px] border border-gray-100 dark:border-neutral-700 w-fit">모든 팀이 제출을 완료했습니다.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2.5">
                                {notSubmittedTeams.map((team) => (
                                  <span key={team.teamCode} className="px-3.5 py-1.5 rounded-[10px] text-[13px] font-bold bg-white dark:bg-neutral-800 transition-colors text-primary dark:text-white border border-gray-200 dark:border-neutral-700 shadow-sm dark:shadow-none flex items-center gap-2">
                                    {team.name}
                                    <span className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors px-1.5 py-0.5 rounded-[6px] text-[11px]">미제출</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {isNoticeOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsNoticeOpen(false)}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-neutral-800 transition-colors rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-neutral-700"
              >
                <h3 className="text-xl font-bold font-heading text-primary dark:text-white transition-colors mb-4 flex items-center gap-2">
                  <span className="text-cta">💡</span> 팀 구성 유의사항
                </h3>
                <ul className="space-y-3 text-secondary dark:text-neutral-300 transition-colors text-[15px] font-medium leading-relaxed mb-8">
                  <li className="flex gap-2.5"><span className="text-cta font-bold">&middot;</span> 각 해커톤 규정에 명시된 최대 인원 수를 초과할 수 없습니다.</li>
                  <li className="flex gap-2.5"><span className="text-cta font-bold">&middot;</span> 한 사용자는 동시에 같은 해커톤의 여러 팀에 소속될 수 없습니다.</li>
                  <li className="flex gap-2.5"><span className="text-cta font-bold">&middot;</span> 제출된 팀명은 수정이 불가능하니 신중하게 결정해주세요.</li>
                </ul>
                <button
                  onClick={() => setIsNoticeOpen(false)}
                  className="w-full py-3.5 bg-gray-100 dark:bg-neutral-700 transition-colors text-primary dark:text-white font-bold rounded-[16px] hover:bg-gray-200"
                >
                  확인
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <TeamDetailModal isOpen={!!selectedTeam} onClose={() => setSelectedTeam(null)} team={selectedTeam} />
      </div>
    </div>
  );
}
