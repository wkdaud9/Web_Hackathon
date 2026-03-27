import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getTeams, getHackathons, getSubmissions, getInvites, updateInviteStatus, updateTeam } from '../utils/api';
import type { Team, Hackathon, Submission, TeamInvite } from '../types/models';
import { useToast } from '../contexts/ToastContext';
import { Check, X } from 'lucide-react';

export default function MyPage() {
  const { currentUser, isLoading } = useAuth();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [myHackathons, setMyHackathons] = useState<Hackathon[]>([]);

  const { showToast } = useToast();
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [ledTeamInvites, setLedTeamInvites] = useState<TeamInvite[]>([]);

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

    const allInvites = getInvites();
    const ledTeamsCode = new Set(userTeams.filter(t => t.leaderName === currentUser.nickname).map(t => t.teamCode));
    const pendingInvites = allInvites.filter(inv => ledTeamsCode.has(inv.teamCode) && inv.status === 'pending');
    setLedTeamInvites(pendingInvites);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleResolveInvite = (invite: TeamInvite, accept: boolean) => {
    updateInviteStatus(invite.id, accept ? 'accepted' : 'rejected');
    
    if (accept) {
      const allTeams = getTeams();
      const teamToUpdate = allTeams.find(t => t.teamCode === invite.teamCode);
      if (teamToUpdate) {
        teamToUpdate.members = [...(teamToUpdate.members || []), invite.applicantName];
        updateTeam(teamToUpdate);
        showToast(`${invite.applicantName}님이 새로운 팀원으로 합류했습니다!`, 'success');
      }
    } else {
      showToast('합류 신청을 거절했습니다.', 'info');
    }
    loadData();
  };

  if (isLoading) return <div className="py-20 text-center font-bold">로딩 중...</div>;
  if (!currentUser) return <Navigate to="/" replace />;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold font-heading mb-8">마이페이지</h1>
      <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-24 h-24 rounded-full bg-blue-50 text-cta flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md">
            {currentUser.nickname.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">{currentUser.nickname}</h2>
            <p className="text-secondary font-medium">{currentUser.email || '이메일 없음'}</p>
            <div className="mt-2 inline-block px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[13px] font-bold">
              활동 포인트: {currentUser.points.toLocaleString()} PT
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              📂 참여 중인 해커톤
            </h3>
            {myHackathons.length === 0 ? (
              <p className="text-tertiary text-[14px]">참여 중인 해커톤이 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {myHackathons.map(h => (
                  <li key={h.slug} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-cta/30 transition-colors">
                    <div>
                      <h4 className="font-bold text-primary text-[15px]">{h.title}</h4>
                      <span className="text-[12px] text-tertiary">{h.status === 'ongoing' ? '진행 중' : h.status === 'upcoming' ? '예정됨' : '종료됨'}</span>
                    </div>
                    <Link to={`/hackathons/${h.slug}`} className="text-[13px] font-bold text-cta bg-blue-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      보기
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-6 rounded-[24px] border border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              🛡️ 소속 팀 정보
            </h3>
            {myTeams.length === 0 ? (
              <p className="text-tertiary text-[14px] bg-white p-4 rounded-xl border border-gray-100">소속된 팀 정보가 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {myTeams.map(t => (
                  <li key={t.teamCode} className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col gap-2 relative overflow-hidden group hover:border-cta/30 transition-colors">
                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${t.isOpen ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                    <div className="flex justify-between items-start ml-2">
                      <h4 className="font-bold text-primary text-[15px] group-hover:text-cta transition-colors">{t.name}</h4>
                      <span className="text-[12px] font-bold text-tertiary bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                        {t.memberCount}명 모집중
                      </span>
                    </div>
                    <div className="text-[13px] text-secondary ml-2 flex items-center gap-2">
                      <span className="font-semibold text-primary">{t.leaderName === currentUser?.nickname ? '👑 내가 팀장' : '팀원'}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="truncate flex-1">{t.intro}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Submissions Section */}
        <div className="mt-6 p-6 md:p-8 rounded-[24px] border border-gray-100 bg-blue-50/30">
          <h3 className="font-bold text-primary mb-5 flex items-center gap-2 text-[18px]">
            <span className="w-1.5 h-6 bg-cta rounded-full"></span> 내 제출 내역
          </h3>
          {mySubmissions.length === 0 ? (
            <p className="text-tertiary text-[14px] bg-white p-5 rounded-[16px] border border-gray-100">제출한 결과물이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {mySubmissions.map(s => (
                <div key={s.id} className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-primary text-[16px]">{s.teamName}</h4>
                      <span className="text-[12px] text-tertiary font-mono">{new Date(s.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="text-cta font-mono font-bold text-[14px] truncate max-w-sm">{s.fileUrl}</div>
                  </div>
                  {s.fileName && (
                    <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] text-secondary font-bold shrink-0">
                      📄 {s.fileName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Management Dashboard */}
        {myTeams.some(t => t.leaderName === currentUser.nickname) && (
          <div className="mt-6 p-6 md:p-8 rounded-[24px] border border-emerald-100 bg-emerald-50/30">
            <h3 className="font-bold text-primary mb-5 flex items-center gap-2 text-[18px]">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span> 팀 합류 신청 관리
            </h3>
            {ledTeamInvites.length === 0 ? (
              <p className="text-tertiary text-[14px] bg-white p-5 rounded-[16px] border border-gray-100">대기 중인 팀 합류 신청이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ledTeamInvites.map(invite => (
                  <div key={invite.id} className="bg-white p-5 rounded-[20px] shadow-sm border border-emerald-100 flex flex-col gap-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary text-[16px]">{invite.applicantName}</span>
                        <span className="text-[12px] text-secondary font-medium">님의 신청</span>
                      </div>
                      <span className="bg-gray-100 text-tertiary px-2 py-0.5 rounded text-[11px] font-bold">
                        {myTeams.find(t => t.teamCode === invite.teamCode)?.name || invite.teamCode}
                      </span>
                    </div>
                    {invite.message && (
                      <p className="text-[13px] text-secondary bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">"{invite.message}"</p>
                    )}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        onClick={() => handleResolveInvite(invite, true)}
                        className="py-2 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold rounded-[12px] hover:bg-emerald-600 transition-colors shadow-sm"
                      >
                        <Check className="w-4 h-4" /> 수락
                      </button>
                      <button
                        onClick={() => handleResolveInvite(invite, false)}
                        className="py-2 flex items-center justify-center gap-2 bg-red-50 text-red-500 font-bold rounded-[12px] hover:bg-red-100 transition-colors"
                      >
                        <X className="w-4 h-4" /> 거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
