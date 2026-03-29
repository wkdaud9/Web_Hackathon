import { useAuth } from '../contexts/AuthContext';
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
  ShieldCheck,
  LayoutGrid,
  Info,
  Clock,
  Edit3
} from 'lucide-react';

export default function MyPage() {
  const { currentUser, isLoading, updateUser } = useAuth();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [myHackathons, setMyHackathons] = useState<Hackathon[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newNickname, setNewNickname] = useState('');

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
    }
    
    // Listen for global storage updates
    window.addEventListener('storage-update', loadData);
    
    return () => {
      window.removeEventListener('storage-update', loadData);
    };
  }, [currentUser]);

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
    if (newNickname === currentUser.nickname) {
      setIsProfileModalOpen(false);
      return;
    }

    const updatedUser = { ...currentUser, nickname: newNickname };
    updateUser(updatedUser);
    showToast('닉네임이 성공적으로 변경되었습니다.', 'success');
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto pb-20 px-4 relative"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm">
              <LayoutGrid className="w-6 h-6 text-cta" />
           </div>
           <div>
              <h1 className="text-3xl font-bold font-heading text-primary tracking-tight">마이페이지</h1>
              <p className="text-tertiary font-medium text-[14px]">활동 정보와 보상을 관리하세요.</p>
           </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* User Card */}
        <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.03)] relative overflow-hidden group">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="flex items-center gap-8">
              <div className="relative group/avatar shrink-0">
                <div className="w-28 h-28 rounded-[36px] bg-blue-50 text-cta flex items-center justify-center text-4xl font-black border-4 border-white shadow-xl overflow-hidden transition-all group-hover/avatar:scale-105">
                  {currentUser.profileImage ? (
                    <img src={currentUser.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center text-cta">
                  <Star className="w-5 h-5 fill-current" />
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black text-primary tracking-tight">{currentUser.nickname}</h2>
                  <span className="px-3 py-1 bg-white text-tertiary text-[11px] font-black rounded-lg border border-gray-100 uppercase tracking-widest">Lv.4</span>
                </div>
                <div className="flex items-center gap-3 text-secondary font-medium mb-4 text-[14px]">
                   <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-tertiary" /> {currentUser.email}</div>
                   <div className="w-1 h-1 bg-gray-200 rounded-full" />
                   <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500" /> {currentUser.points.toLocaleString()}점</div>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={() => setIsProfileModalOpen(true)}
                     className="px-6 py-3 bg-primary text-white text-[14px] font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                   >
                     프로필 관리
                   </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 flex flex-col gap-4 min-w-[280px]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-black text-primary mb-0.5 tracking-tight">프로필 공개 설정</div>
                  <div className="text-[11px] text-tertiary font-bold">참여 현황 공개 여부</div>
                </div>
                <button 
                  onClick={toggleProfilePublic}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none shadow-sm ${currentUser.isProfilePublic ? 'bg-cta' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 ${currentUser.isProfilePublic ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="pt-3 border-t border-gray-200/50 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-tertiary">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Secure Access</span>
                 </div>
                 <div className="text-[11px] font-bold text-emerald-500">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rows Matching */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch font-heading">
           <div className="lg:col-span-2">
              <div className="bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 shadow-sm h-full flex flex-col">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-primary flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-gray-200 rounded-full" />
                    내 해커톤 참여기록
                  </h3>
                  <Link to="/hackathons" className="text-[13px] font-bold text-cta hover:text-blue-700">대회 리스트</Link>
                </div>
                
                {myHackathons.length === 0 ? (
                  <div className="flex-1 bg-white border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center py-10 scale-95 opacity-80">
                    <Trophy className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="text-tertiary font-bold">아직 참여 기록이 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {myHackathons.map(h => (
                      <Link to={`/hackathons/${h.slug}`} key={h.slug} className="group flex items-center gap-4 p-5 bg-white rounded-[24px] border border-gray-100 hover:border-cta/20 hover:shadow-md transition-all h-fit">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-blue-50 transition-colors">
                           <Trophy className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-primary truncate leading-tight mb-1">{h.title}</h4>
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-tertiary bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                {h.status === 'upcoming' ? '참가 예정' : h.status === 'ongoing' ? '진행중' : h.status === 'ended' ? '종료됨' : h.status}
                              </span>
                              <span className="text-[11px] text-tertiary font-bold">{h.period?.submissionDeadlineAt ? new Date(h.period.submissionDeadlineAt).toLocaleDateString() : '일정 확인 중'}</span>
                           </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-cta transition-colors" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
           </div>

           <div>
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
                <h3 className="text-lg font-black text-primary mb-8 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-cta" /> 최근 제출 기록
                </h3>
                
                {mySubmissions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-60">
                     <FileCheck className="w-10 h-10 text-gray-100 mb-3" />
                     <p className="text-[13px] text-tertiary font-bold">제출된 내역 없음</p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100 overflow-y-auto pr-2 scrollbar-hide">
                    {mySubmissions.slice(0, 4).map(s => (
                      <div key={s.id} className="relative pl-8 group">
                        <div className="absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm z-10">
                           <div className="w-1.5 h-1.5 rounded-full bg-cta" />
                        </div>
                        <div className="text-[10px] font-black text-tertiary uppercase tracking-wider mb-1">{new Date(s.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                        <h5 className="font-bold text-primary text-[15px] leading-tight mb-2 truncate group-hover:text-cta transition-colors">{s.teamName}</h5>
                        <div className="flex items-center gap-2 text-[12px] text-tertiary font-medium bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                           <ExternalLink className="w-3.5 h-3.5 text-tertiary/60" />
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
              <div className="bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 shadow-sm h-full flex flex-col">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-primary flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-gray-200 rounded-full" />
                    내 소속 팀 관리
                  </h3>
                </div>

                {myTeams.length === 0 ? (
                  <div className="flex-1 bg-white border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center py-10 scale-95 opacity-80">
                    <Users className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="text-tertiary font-bold text-lg mb-6">소속된 팀이 없습니다.</p>
                    <Link to="/camp" className="px-6 py-3 bg-cta text-white font-black rounded-2xl shadow-lg shadow-blue-100">팀 찾기</Link>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1">
                    {myTeams.map(t => (
                      <Link to="/workspace" key={t.teamCode} className="flex items-center justify-between p-6 bg-white rounded-[32px] border border-gray-100 hover:border-cta/20 hover:shadow-md transition-all group relative h-fit shadow-sm">
                        <div className="flex-1 min-w-0 mr-8">
                           <div className="flex items-center gap-3 mb-2">
                             <h4 className="font-extrabold text-primary text-xl truncate tracking-tight leading-tight group-hover:text-cta transition-colors">{t.name}</h4>
                             {t.leaderName === currentUser?.nickname && (
                               <span className="px-2 py-0.5 bg-gray-50 text-tertiary text-[10px] font-black rounded border border-gray-200 tracking-tighter">LEADER</span>
                             )}
                           </div>
                           <p className="text-[14px] text-tertiary truncate max-w-lg font-medium">{t.intro}</p>
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                           <div className="text-right">
                              <div className="text-lg font-black text-primary tracking-tighter">{t.members?.length || 1}명</div>
                              <div className="text-[10px] text-tertiary font-black uppercase tracking-widest leading-none">MEMBERS</div>
                           </div>
                           <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-cta transition-colors">
                              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                           </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
           </div>

           <div>
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm h-full flex flex-col">
                <h3 className="text-lg font-black text-primary mb-10 flex items-center gap-3 uppercase tracking-tight">
                  <Bell className="w-5 h-5 text-cta" /> 활동 통계
                </h3>
                <div className="space-y-4 flex-1">
                   <div className="p-6 bg-gray-50 flex items-center justify-between rounded-[28px] border border-gray-50 group hover:shadow-inner transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm"><Trophy className="w-5 h-5 text-amber-500" /></div>
                         <div className="text-[14px] font-bold text-secondary">참여 대회</div>
                      </div>
                      <div className="text-2xl font-black text-primary font-heading tracking-tighter">{myHackathons.length}</div>
                   </div>
                   <div className="p-6 bg-gray-50 flex items-center justify-between rounded-[28px] border border-gray-50 group hover:shadow-inner transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm"><Users className="w-5 h-5 text-cta" /></div>
                         <div className="text-[14px] font-bold text-secondary">활동 중인 팀</div>
                      </div>
                      <div className="text-2xl font-black text-primary font-heading tracking-tighter">{myTeams.length}</div>
                   </div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-50">
                   <div className="bg-cta/5 p-4 rounded-2xl flex items-center gap-3">
                      <Info className="w-4 h-4 text-cta shrink-0" />
                      <p className="text-[11px] text-cta font-bold leading-tight">더 많은 해커톤에 참여하여 레벨을 올려보세요!</p>
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
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden relative"
            >
              <div className="p-10">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-cta border border-gray-100 shadow-sm">
                       <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-primary tracking-tight">프로필 변경</h3>
                       <p className="text-[11px] text-tertiary font-bold uppercase tracking-widest">Update your identity</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div>
                       <label className="block text-[13px] font-black text-primary mb-2.5 ml-1">닉네임</label>
                       <input 
                         type="text" 
                         value={newNickname}
                         onChange={(e) => setNewNickname(e.target.value)}
                         placeholder="새로운 닉네임을 입력하세요"
                         className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[22px] text-[15px] font-bold text-primary focus:outline-none focus:border-cta/30 transition-all"
                       />
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                       <button 
                         onClick={handleSaveNickname}
                         className="flex-1 py-4 bg-primary text-white font-black rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
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
  );
}
