import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getHackathonDetail,
  getTeams,
  getLeaderboard,
  addSubmission,
  getSubmissions,
  getInvites,
  addInvite,
  updateInviteStatus,
} from '../utils/api';
import type {
  HackathonDetail,
  Leaderboard,
  LeaderboardEntry,
  Submission,
  Team,
  TeamInvite,
} from '../types/models';

export default function HackathonDetailPage() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [detail, setDetail] = useState<HackathonDetail | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submitNotes, setSubmitNotes] = useState('');
  const [submitFile, setSubmitFile] = useState('');
  const [submitFileName, setSubmitFileName] = useState('');
  const [submitTeamName, setSubmitTeamName] = useState('');

  const [inviteApplicantName, setInviteApplicantName] = useState('');
  const [inviteTeamCode, setInviteTeamCode] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

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

  // Set up intersection observer to update activeTab on scroll
  useEffect(() => {
    if (loading || error || !detail) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries.reduce((prev, current) => {
          return (current.intersectionRatio > prev.intersectionRatio) ? current : prev;
        });

        if (visibleSection.isIntersecting && visibleSection.intersectionRatio > 0.5) {
          const id = visibleSection.target.getAttribute('data-section-id');
          if (id && id !== activeTab) {
            setActiveTab(id);
          }
        }
      },
      { root: scrollContainerRef.current, threshold: 0.6 }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading, error, detail, activeTab]);

  // 유저가 제시한 브라우저 수직 휠 입력을 가로 스크롤로 완벽 직접 연결(Bridge)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // 상하 휠에만 반응하도록 조치
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        
        // 1. 카드 내부에서 내부 스크롤이 우선 동작하도록 보장하는 로직
        let target = e.target as HTMLElement | null;
        let canScrollVertically = false;
        
        while (target && target !== container) {
          const overflowY = window.getComputedStyle(target).overflowY;
          if ((overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
            const isAtTop = target.scrollTop <= 0;
            const isAtBottom = Math.ceil(target.scrollTop + target.clientHeight) >= (target.scrollHeight - 2); // 2px 여유 (유저 제시 반영)
            if (e.deltaY > 0 && !isAtBottom) { canScrollVertically = true; break; }
            if (e.deltaY < 0 && !isAtTop) { canScrollVertically = true; break; }
          }
          target = target.parentElement;
        }

        if (canScrollVertically) return;

        // 2. 가로 스크롤로 다이렉트 매핑 (유저 제시 Bridge 로직 반영)
        e.preventDefault(); 
        
        // CSS scrollBehavior smooth를 아까 뺐으므로 직접 매핑이 정상 동작함
        // snap-x mandatory 속성과 결합되어, 스크롤 후 자동으로 목적지에 안착함
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = sectionRefs.current[id];
    if (element && scrollContainerRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
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
    if (!slug || !inviteTeamCode || !inviteApplicantName.trim()) return;

    const newInvite: TeamInvite = {
      id: Date.now(),
      hackathonSlug: slug,
      teamCode: inviteTeamCode,
      applicantName: inviteApplicantName.trim(),
      message: inviteMessage.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    addInvite(newInvite);
    setInvites((prev) => [...prev, newInvite]);
    setInviteApplicantName('');
    setInviteTeamCode('');
    setInviteMessage('');
  };

  const handleInviteStatusChange = (id: number, status: TeamInvite['status']) => {
    if (!slug) return;
    const updated = updateInviteStatus(id, status);
    setInvites(updated.filter((invite) => invite.hackathonSlug === slug));
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-secondary font-medium bg-white rounded-[24px] shadow-sm">
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
      <div className="text-center py-20 bg-white shadow-sm flex flex-col items-center justify-center min-h-[50vh] gap-4 border border-gray-100 rounded-[24px]">
        <p className="text-tertiary font-medium text-lg">해당 해커톤 상세 정보를 찾을 수 없습니다.</p>
        <Link to="/hackathons" className="px-6 py-3 rounded-[14px] bg-blue-50 text-cta font-bold hover:bg-cta hover:text-white transition-colors">
          목록으로 이동
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !submitTeamName.trim() || (!submitFile && !submitFileName)) return;

    const fileRef = submitFile || (submitFileName ? `local://${submitFileName}` : '');
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
    setSubmitNotes('');
    setSubmitFile('');
    setSubmitFileName('');
    setSubmitTeamName('');
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
    <div className="w-full max-w-[100vw]">
      <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mb-8">
        <Link to="/hackathons" className="text-[15px] font-bold text-tertiary hover:text-primary mb-3 inline-block transition-colors">&larr; 목록으로 돌아가기</Link>
        <h1 className="text-3xl md:text-5xl font-bold font-heading text-primary mb-4 truncate tracking-tight">{detail.title}</h1>
      </motion.div>

      {/* Tabs Menu (Sticky) */}
      <div className="sticky top-[80px] z-30 bg-[#F2F4F6]/90 backdrop-blur-md pt-4 border-b border-gray-200 pb-3 mb-6">
        <div className="flex flex-nowrap overflow-x-auto gap-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`px-5 py-3 rounded-[16px] text-[15px] font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'bg-transparent text-tertiary hover:bg-white hover:text-primary hover:shadow-sm'
                }`}
              >
                {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Scroll Snap Container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-10 pt-4"
      >
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            data-section-id={tab.id}
            ref={(el) => { sectionRefs.current[tab.id] = el; }}
            className="w-full flex-shrink-0 snap-center snap-always px-4 md:px-0"
          >
            <div className="bg-white p-6 md:p-10 rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-auto w-full max-w-[900px] max-h-[75vh] overflow-y-auto scrollbar-hide">
              {tab.id === 'overview' && (
                <div className="relative">
                   <h2 className="text-2xl font-bold font-heading mb-6 text-primary flex items-center gap-3">
                     <span className="w-1.5 h-6 bg-cta rounded-full"></span> 개요
                    </h2>
                   <p className="text-secondary font-medium leading-[1.7] mb-10 text-[17px]">{detail.sections?.overview?.summary || '제공된 개요가 없습니다.'}</p>
                   
                   <h3 className="text-[20px] font-bold mb-4 text-primary">유의사항 (Notice)</h3>
                    <ul className="list-disc pl-5 text-secondary font-medium space-y-3">
                      {detail.sections?.info?.notice?.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                 </div>
              )}

              {tab.id === 'eval' && (
                <div className="relative">
                   <h2 className="text-2xl font-bold font-heading mb-6 text-primary flex items-center gap-3">
                     <span className="w-1.5 h-6 bg-cta rounded-full"></span> 평가 기준
                    </h2>
                   <p className="text-secondary font-medium mb-8 text-[17px] leading-[1.7]">{detail.sections?.eval?.description || '평가 상세 정보가 없습니다.'}</p>
                   
                   {detail.sections?.eval?.scoreDisplay && (
                     <div className="bg-gray-50 p-8 rounded-[24px] border border-gray-100 inline-block min-w-[320px] w-full max-w-2xl shadow-sm">
                        <h3 className="font-bold text-primary mb-5 text-lg">{detail.sections.eval.scoreDisplay.label} 가중치 안내</h3>
                       <ul className="space-y-4">
                          {detail.sections.eval.scoreDisplay.breakdown?.map((b, i) => (
                            <li key={i} className="flex justify-between items-center text-secondary font-medium border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                              <span>{b.label}</span>
                              <span className="font-mono text-cta font-black bg-blue-50 px-3 py-1.5 rounded-lg">{b.weightPercent}%</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                </div>
              )}

              {tab.id === 'schedule' && (
                <div className="relative">
                   <h2 className="text-2xl font-bold font-heading mb-10 text-primary flex items-center gap-3">
                     <span className="w-1.5 h-6 bg-cta rounded-full"></span> 일정 (KST 기준)
                    </h2>
                   <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200">
                      {detail.sections?.schedule?.milestones?.map((m, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-[3px] border-white bg-cta md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm shrink-0 z-10 ml-0 md:ml-auto md:mr-auto"></div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white p-5 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-cta/30 transition-colors">
                            <div className="font-bold text-primary mb-2 text-[17px]">{m.name}</div>
                            <time className="text-[14px] text-tertiary font-mono font-semibold">{new Date(m.at).toLocaleString()}</time>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {tab.id === 'prize' && (
                <div className="relative max-w-2xl">
                   <h2 className="text-2xl font-bold font-heading mb-6 text-primary flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-cta rounded-full"></span> 상금 리스트
                    </h2>
                   <div className="space-y-4">
                      {detail.sections?.prize?.items?.map((item, i) => (
                        <div key={i} className="bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 rounded-[20px] flex justify-between items-center border border-gray-100 hover:border-cta hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
                         <div className="flex items-center gap-4">
                            <span className="text-3xl">{item.place === '1st' ? '🥇' : item.place === '2nd' ? '🥈' : item.place === '3rd' ? '🥉' : '🏅'}</span>
                            <strong className="text-[18px] text-primary uppercase tracking-wider">{item.place} PLACE</strong>
                         </div>
                         <span className="font-black text-[22px] text-cta font-mono">{item.amountKRW.toLocaleString()} KRW</span>
                       </div>
                     )) || <p className="text-tertiary font-medium">상금 정보가 준비되지 않았습니다.</p>}
                   </div>
                </div>
              )}

              {tab.id === 'teams' && (
                <div className="relative">
                   <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                      <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-cta rounded-full"></span> 참여/모집 팀 ({teams.length})
                      </h2>
                      <Link to={`/camp?hackathon=${slug}`} className="px-6 py-3.5 bg-cta text-white rounded-[16px] font-bold hover:bg-blue-600 transition-colors shadow-[0_8px_20px_rgba(49,130,246,0.3)] flex items-center gap-2 w-fit">
                        + 팀 모집글 등록
                      </Link>
                    </div>
                   
                    {teams.length === 0 ? (
                      <div className="text-center py-16 bg-gray-50 rounded-[24px] border border-gray-100 border-dashed">
                        <p className="text-secondary font-medium mb-2">아직 이 해커톤을 위한 팀이 없습니다.</p>
                        <p className="text-[14px] text-tertiary">첫 팀을 결성하고 멤버를 구해 우승에 도전하세요!</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <form onSubmit={handleInviteSubmit} className="bg-gray-50 p-6 md:p-8 rounded-[24px] border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="md:col-span-3">
                            <h3 className="font-bold text-primary mb-4 text-[17px]">팀 합류 신청하기</h3>
                          </div>
                          <input
                            type="text"
                            value={inviteApplicantName}
                            onChange={(e) => setInviteApplicantName(e.target.value)}
                            placeholder="신청자 이름"
                            className="bg-white border border-gray-200 rounded-[14px] px-4 py-3 text-primary font-medium outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-tertiary"
                            required
                          />
                          <select
                            value={inviteTeamCode}
                            onChange={(e) => setInviteTeamCode(e.target.value)}
                            className="bg-white border border-gray-200 rounded-[14px] px-4 py-3 text-primary font-medium outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer text-tertiary"
                            required
                          >
                            <option value="">신청 팀 선택</option>
                            {teams.map((team) => (
                              <option key={team.teamCode} value={team.teamCode} className="text-primary">
                                {team.name} ({team.teamCode})
                              </option>
                            ))}
                          </select>
                          <button type="submit" className="px-4 py-3 bg-primary text-white rounded-[14px] font-bold hover:bg-gray-800 transition-colors shadow-sm">
                            팀 합류 신청
                          </button>
                          <textarea
                            value={inviteMessage}
                            onChange={(e) => setInviteMessage(e.target.value)}
                            placeholder="간단한 소개/포지션 (선택)"
                            className="md:col-span-3 bg-white border border-gray-200 rounded-[14px] px-4 py-3 text-primary font-medium outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all h-28 resize-none placeholder:text-tertiary"
                          />
                        </form>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {teams.map((t) => {
                            const pendingCount = invites.filter(
                              (invite) => invite.teamCode === t.teamCode && invite.status === 'pending',
                            ).length;
                            return (
                              <div key={t.teamCode} className="bg-white p-6 rounded-[24px] border border-gray-100 hover:border-cta/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all flex flex-col h-full">
                                <div className="flex justify-between items-start mb-3">
                                  <h3 className="font-bold text-[18px] text-primary group-hover:text-cta">{t.name}</h3>
                                  <span className="bg-gray-50 px-2.5 py-1 rounded-lg text-[12px] font-bold font-mono text-tertiary border border-gray-100">
                                    <span className="text-primary">{t.memberCount}</span> MBRS
                                  </span>
                                </div>
                                <p className="text-secondary text-[14px] font-medium mb-5 flex-1 line-clamp-3 leading-relaxed">{t.intro}</p>
                                <div className="flex flex-wrap gap-1.5 mb-5">
                                  {t.lookingFor?.map((role) => <span key={role} className="text-[12px] font-bold text-cta bg-blue-50 px-2 py-0.5 rounded-md">#{role}</span>)}
                                </div>
                                <div className="text-[13px] font-bold text-tertiary mb-3 flex items-center justify-between border-t border-gray-100 pt-4">
                                  <span>대기 중 신청</span>
                                  <span className="bg-blue-50 text-cta px-2 rounded-full">{pendingCount}</span>
                                </div>

                                <div className="space-y-2.5">
                                  {invites
                                    .filter((invite) => invite.teamCode === t.teamCode)
                                    .slice()
                                    .reverse()
                                    .slice(0, 3)
                                    .map((invite) => (
                                      <div key={invite.id} className="bg-gray-50 border border-gray-100 rounded-[12px] p-3.5 text-[13px]">
                                        <div className="flex justify-between font-bold mb-1.5">
                                          <span className="text-primary">{invite.applicantName}</span>
                                          <span className={invite.status === 'pending' ? 'text-orange-500' : invite.status === 'accepted' ? 'text-emerald-500' : 'text-gray-400'}>{
                                            invite.status === 'pending' ? '대기 중' : invite.status === 'accepted' ? '수락됨' : '거절됨'
                                          }</span>
                                        </div>
                                        {invite.message && <div className="text-secondary font-medium mb-3 mt-1 bg-white p-2 rounded-lg border border-gray-100">{invite.message}</div>}
                                        {invite.status === 'pending' && (
                                          <div className="flex gap-2.5 mt-2">
                                            <button
                                              type="button"
                                              onClick={() => handleInviteStatusChange(invite.id, 'accepted')}
                                              className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors"
                                            >
                                              수락
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleInviteStatusChange(invite.id, 'rejected')}
                                              className="flex-1 py-1.5 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                                            >
                                              거절
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                 </div>
              )}

              {tab.id === 'submit' && (
                <div className="relative w-full">
                   <h2 className="text-2xl font-bold font-heading mb-6 text-primary flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-cta rounded-full"></span> 결과물 제출
                    </h2>
                   
                   <div className="bg-blue-50 border border-blue-100 p-6 md:p-8 rounded-[24px] mb-10 w-full max-w-3xl">
                     <h3 className="font-bold text-cta mb-4 flex items-center gap-2">📝 제출 가이드</h3>
                     <ul className="list-disc pl-5 text-secondary font-medium text-[15px] space-y-2.5 leading-relaxed">
                        {detail.sections?.submit?.guide?.map((g, i) => <li key={i}>{g}</li>) || <li>가이드가 없습니다. 규칙에 맞게 제출하세요.</li>}
                      </ul>
                    </div>
                   
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-gray-50/50 p-6 md:p-8 rounded-[32px] border border-gray-200 w-full">
                      <div>
                        <label className="block text-[15px] font-bold text-primary mb-2.5">팀명</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-gray-200 rounded-[16px] px-5 py-3.5 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-tertiary"
                          placeholder="예: 404found"
                          value={submitTeamName}
                          onChange={(e) => setSubmitTeamName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[15px] font-bold text-primary mb-2.5">제출 파일 / URL 링크</label>
                        <input 
                          type="text" 
                           className="w-full bg-white border border-gray-200 rounded-[16px] px-5 py-3.5 text-primary font-medium focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-tertiary"
                         placeholder="https://github.com/..."
                         value={submitFile}
                         onChange={(e) => setSubmitFile(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[15px] font-bold text-primary mb-2.5">파일 업로드 (zip/pdf 등)</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".zip,.pdf,.txt,.md"
                            className="w-full block text-[15px] text-tertiary file:mr-4 file:py-2.5 file:px-6 file:rounded-[12px] file:border-0 file:text-[14px] file:font-bold file:bg-gray-100 file:text-primary hover:file:bg-gray-200 cursor-pointer bg-white border border-gray-200 rounded-[16px] p-2 focus:outline-none focus:border-cta transition-all"
                            onChange={(e) => setSubmitFileName(e.target.files?.[0]?.name || '')}
                          />
                        </div>
                      </div>
                     <div>
                       <label className="block text-[15px] font-bold text-primary mb-2.5">설명 메시지 (선택)</label>
                       <textarea 
                          className="w-full bg-white border border-gray-200 rounded-[16px] px-5 py-4 text-primary font-medium outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all h-40 resize-none placeholder:text-tertiary leading-[1.7]"
                         placeholder="심사위원이 확인할 참고 사항이나 서비스 소개를 남겨주세요."
                         value={submitNotes}
                         onChange={(e) => setSubmitNotes(e.target.value)}
                       ></textarea>
                     </div>
                      <button type="submit" className="w-full py-4 bg-primary text-white text-[17px] font-bold rounded-[16px] hover:bg-gray-800 transition-colors shadow-md mt-4">
                        로컬에 제출 저장하기
                      </button>
                    </form>

                   {submissions.length > 0 && (
                     <div className="mt-12 w-full max-w-3xl">
                       <h3 className="text-[20px] font-bold mb-6 text-primary flex items-center gap-2">
                         <span className="w-1.5 h-5 bg-gray-300 rounded-full"></span> 최근 제출 기록
                        </h3>
                       <div className="space-y-4">
                          {recentSubmissions.map((s) => (
                             <div key={s.id} className="bg-gray-50 p-6 rounded-[20px] border border-gray-100 flex flex-col gap-2 relative overflow-hidden group">
                              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gray-200 group-hover:bg-cta transition-colors"></div>
                              <div className="flex justify-between text-tertiary text-[13px] font-bold mb-2">
                                <span>제출 시간</span>
                                <span className="font-mono">{new Date(s.submittedAt).toLocaleString()}</span>
                              </div>
                              <div className="text-primary text-[16px] font-bold flex items-center gap-2">
                                <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200 text-[13px] text-tertiary font-bold">팀</span> {s.teamName || '미상'}
                              </div>
                              {s.fileName && <div className="text-secondary text-[14px] font-medium mt-2">첨부: {s.fileName}</div>}
                               <div className="text-cta mt-1 font-mono font-bold truncate bg-blue-50/50 p-3 rounded-[12px] inline-block w-fit mt-2 border border-blue-100/50">{s.fileUrl}</div>
                              {s.notes && <div className="text-secondary font-medium mt-4 bg-white p-4 rounded-[14px] border border-gray-100">{s.notes}</div>}
                            </div>
                          ))}
                        </div>
                     </div>
                   )}
                </div>
              )}

              {tab.id === 'leaderboard' && (
                <div className="relative w-full">
                   <h2 className="text-2xl font-bold font-heading mb-4 text-primary flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-cta rounded-full"></span> 리더보드
                    </h2>
                   <p className="text-secondary font-medium mb-10 max-w-3xl leading-relaxed text-[16px]">{detail.sections?.leaderboard?.note}</p>
                   
                   {!leaderboard || !leaderboard.entries || leaderboard.entries.length === 0 ? (
                      <div className="bg-gray-50 p-16 rounded-[24px] border border-gray-100 text-center text-tertiary font-bold text-lg">
                        아직 리더보드 점수가 등록되지 않았습니다.
                      </div>
                    ) : (
                      <div className="space-y-8 max-w-4xl">
                        <div className="w-full overflow-x-auto rounded-[24px] border border-gray-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] bg-white">
                          <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-gray-50/80 text-tertiary text-[13px] uppercase tracking-wider">
                              <th className="py-5 px-6 font-bold">순위</th>
                              <th className="py-5 px-6 font-bold">팀명</th>
                              <th className="py-5 px-6 font-bold text-right">최종 점수</th>
                              <th className="py-5 px-6 font-bold text-right">제출 일자</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {leaderboard.entries?.map((entry: LeaderboardEntry) => (
                              <tr key={entry.teamName} className="hover:bg-gray-50/50 transition-colors">
                               <td className="py-4 px-6">
                                 <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-[13px] ${
                                   entry.rank === 1 ? 'bg-amber-100 text-amber-600' : 
                                   entry.rank === 2 ? 'bg-gray-100 text-gray-500' : 
                                   entry.rank === 3 ? 'bg-orange-100 text-orange-600' : 
                                   'text-secondary border border-gray-200'
                                 }`}>
                                   {entry.rank}
                                 </span>
                               </td>
                               <td className="py-4 px-6 text-primary font-bold text-[16px]">
                                 {entry.teamName}
                               </td>
                                <td className="py-4 px-6 text-cta font-mono font-black text-right text-[18px]">
                                  {entry.score}
                                </td>
                               <td className="py-4 px-6 text-[14px] text-tertiary font-mono font-medium text-right">
                                 {new Date(entry.submittedAt).toLocaleDateString()}
                               </td>
                              </tr>
                            ))}
                          </tbody>
                          </table>
                        </div>

                        <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-6 md:p-8">
                          <h3 className="text-[15px] font-bold text-primary mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-gray-400 rounded-full"></span>
                            미제출 팀
                          </h3>
                          {notSubmittedTeams.length === 0 ? (
                            <p className="text-[14px] text-tertiary font-medium bg-white p-4 rounded-[12px] border border-gray-100 w-fit">모든 팀이 제출을 완료했습니다.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2.5">
                              {notSubmittedTeams.map((team) => (
                                <span key={team.teamCode} className="px-3.5 py-1.5 rounded-[10px] text-[13px] font-bold bg-white text-primary border border-gray-200 shadow-sm flex items-center gap-2">
                                  {team.name}
                                  <span className="bg-red-50 text-red-500 px-1.5 py-0.5 rounded-[6px] text-[11px]">미제출</span>
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
  );
}
