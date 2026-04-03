import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getTeams, getHackathons, addInvite } from '../../utils/api';
import { UserPlus, X, User as UserIcon, Send } from 'lucide-react';
import type { User, Team, Hackathon } from '../../types/models';
import ChatModal from './ChatModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function UserProfileModal({ isOpen, onClose, user }: Props) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [userHackathons, setUserHackathons] = useState<Hackathon[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [myTeam, setMyTeam] = useState<Team | null>(null);

  useEffect(() => {
    const teams = getTeams();
    const leading = teams.find(t => t.leaderName === currentUser?.nickname);
    setMyTeam(leading || null);
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && user) {
      const allTeams = getTeams();
      const teams = allTeams.filter(t => t.leaderName === user.nickname || t.members?.includes(user.nickname));
      setUserTeams(teams);
      
      const allHackathons = getHackathons();
      const userHackathonSlugs = new Set(teams.map(t => t.hackathonSlug).filter(Boolean));
      const hackathons = allHackathons.filter(h => userHackathonSlugs.has(h.slug));
      setUserHackathons(hackathons);
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen && !isChatOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isChatOpen, onClose]);

  const handleSendMessage = () => {
    if (!currentUser) {
      showToast('쪽지를 보내시려면 먼저 로그인해주세요.', 'error');
      return;
    }
    setIsChatOpen(true);
  };

  const handleInvite = () => {
    if (!myTeam || !user) return;
    
    addInvite({
      id: Date.now(),
      hackathonSlug: myTeam.hackathonSlug || 'common',
      teamCode: myTeam.teamCode,
      applicantName: user.nickname,
      applicantId: user.id,
      message: `${currentUser?.nickname}님이 소속 팀 [${myTeam.name}]에 초대했습니다.`,
      status: 'pending',
      type: 'invitation',
      createdAt: new Date().toISOString()
    });
    
    showToast('초대 완료', 'success');
  };

  if (!isOpen || !user) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {!isChatOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 h-screen">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm transition-colors"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-tertiary dark:text-neutral-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors z-20"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-6 md:p-8 overflow-y-auto">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 mt-2">
                  <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-cta/20 flex items-center justify-center overflow-hidden border-4 border-white dark:border-neutral-800 shadow-md shrink-0 transition-colors">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-cta" />
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold font-heading text-primary dark:text-white mb-1 transition-colors">{user.nickname}</h2>
                    <p className="text-secondary dark:text-neutral-400 text-[15px] mb-3 transition-colors">{user.email || '이메일 미공개'}</p>
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                      <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-500/20 transition-colors">
                        <span className="text-[13px] font-bold mr-1">획득 포인트:</span>
                        <span className="font-mono font-black text-[15px]">{user.points.toLocaleString()}점</span>
                      </div>
                    </div>
                    {user.id !== currentUser?.id && (
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <button 
                          onClick={handleSendMessage}
                          className="inline-flex items-center justify-center gap-2 bg-cta hover:bg-blue-600 text-white px-5 py-2.5 rounded-[14px] font-bold text-[14px] transition-all shadow-[0_8px_20px_rgba(49,130,246,0.3)] dark:shadow-none hover:shadow-none bg-gradient-to-r from-blue-500 to-blue-600"
                        >
                          <Send className="w-4 h-4" />
                          쪽지 보내기
                        </button>
                        {myTeam && (
                          <button 
                            onClick={handleInvite}
                            className="inline-flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 text-secondary dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 px-5 py-2.5 rounded-[14px] font-bold text-[14px] hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm"
                          >
                            <UserPlus className="w-4 h-4" />
                            팀 초대하기
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-neutral-800 w-full mb-8 transition-colors" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Hackathons */}
                  <div className="bg-gray-50/50 dark:bg-neutral-900/50 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800 transition-colors">
                    <h3 className="font-bold text-primary dark:text-white mb-4 flex items-center gap-2 transition-colors">
                      📂 참여 중인 해커톤
                    </h3>
                    {userHackathons.length === 0 ? (
                      <p className="text-tertiary dark:text-neutral-500 text-[14px] transition-colors">참여 중인 해커톤이 없습니다.</p>
                    ) : (
                      <ul className="space-y-3">
                        {userHackathons.map(h => (
                          <li key={h.slug} className="bg-white dark:bg-neutral-800 p-3.5 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 transition-colors">
                            <h4 className="font-bold text-primary dark:text-white text-[14px] mb-1 leading-tight transition-colors">{h.title}</h4>
                            <span className="text-[12px] font-medium text-tertiary dark:text-neutral-400 transition-colors">{h.status === 'ongoing' ? '진행 중' : h.status === 'upcoming' ? '예정됨' : '종료됨'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Teams */}
                  <div className="bg-gray-50/50 dark:bg-neutral-900/50 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800 transition-colors">
                    <h3 className="font-bold text-primary dark:text-white mb-4 flex items-center gap-2 transition-colors">
                      🛡️ 소속 팀 정보
                    </h3>
                    {userTeams.length === 0 ? (
                      <p className="text-tertiary dark:text-neutral-500 text-[14px] transition-colors">소속된 팀 정보가 없습니다.</p>
                    ) : (
                      <ul className="space-y-3">
                        {userTeams.map(t => (
                          <li key={t.teamCode} className="bg-white dark:bg-neutral-800 p-3.5 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 relative overflow-hidden flex flex-col gap-1.5 transition-colors">
                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${t.isOpen ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                            <h4 className="font-bold text-primary dark:text-white text-[14px] ml-2 leading-tight transition-colors">{t.name}</h4>
                            <div className="text-[12px] text-secondary dark:text-neutral-400 ml-2 flex flex-wrap items-center gap-2 transition-colors">
                              <span className="font-semibold text-primary dark:text-white transition-colors">{t.leaderName === user.nickname ? '👑 팀장' : '팀원'}</span>
                              <span className="w-1 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full shrink-0 transition-colors"></span>
                              <span className="truncate flex-1">{t.intro}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        otherUserId={user.id} 
        otherUserNickname={user.nickname} 
      />
    </>,
    document.body
  );
}
