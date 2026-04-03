import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getTeams, addInvite } from '../../utils/api';
import { UserPlus, X, User as UserIcon, Send, Mail, Trophy, Star, Users } from 'lucide-react';
import type { User, Team } from '../../types/models';
import ChatModal from './ChatModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function UserProfileModal({ isOpen, onClose, user }: Props) {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [myTeam, setMyTeam] = useState<Team | null>(null);

  useEffect(() => {
    const teams = getTeams();
    const leading = teams.find(t => t.leaderName === currentUser?.nickname);
    setMyTeam(leading || null);
  }, [currentUser]);

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

              <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8 mb-10 mt-2">
                  <div className="relative group/avatar shrink-0">
                    <div className="w-28 h-28 rounded-[36px] bg-blue-50 dark:bg-cta/10 text-cta flex items-center justify-center text-4xl font-black border-4 border-white dark:border-neutral-800 shadow-xl dark:shadow-none overflow-hidden transition-all group-hover/avatar:scale-105">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-12 h-12 text-cta transition-colors" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-neutral-700 rounded-2xl shadow-lg border border-gray-100 dark:border-neutral-600 flex items-center justify-center text-cta transition-colors">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center text-center md:text-left h-28">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2.5">
                      <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight leading-none transition-colors">{user.nickname}</h2>
                      <span className="px-3 py-1 bg-blue-50 dark:bg-cta/10 text-cta text-[11px] font-black rounded-lg border border-blue-100 dark:border-cta/20 uppercase tracking-widest transition-colors shadow-sm">Lv.4</span>
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-3 text-secondary dark:text-neutral-400 font-bold text-[14px] mb-4">
                      <div className="flex items-center gap-1.5 transition-colors text-cta"><Mail className="w-4 h-4" /> {user.email || 'Email Private'}</div>
                      <div className="w-1 h-1 bg-gray-200 dark:bg-neutral-700 rounded-full" />
                      <div className="flex items-center gap-1.5 transition-colors"><Star className="w-4 h-4 text-cta" /> {user.points.toLocaleString()}점</div>
                    </div>

                    {user.id !== currentUser?.id && (
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        {currentUser?.role !== 'operator' && (
                          <button
                            onClick={handleSendMessage}
                            className="px-6 py-2.5 bg-cta text-white rounded-[16px] font-black text-[13px] transition-all shadow-[0_8px_25px_rgba(49,130,246,0.3)] dark:shadow-none hover:translate-y-[-2px] active:scale-95 flex items-center gap-2"
                          >
                            <Send className="w-3.5 h-3.5" />
                            쪽지 보내기
                          </button>
                        )}
                        {myTeam && (
                          <button
                            onClick={handleInvite}
                            className="px-6 py-2.5 bg-white dark:bg-neutral-800 text-secondary dark:text-neutral-300 border border-gray-100 dark:border-neutral-700 rounded-[16px] font-black text-[13px] hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            팀 초대하기
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-neutral-800 w-full mb-10 transition-colors" />

                {/* Activity Stats (MyPage Style) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="p-6 bg-blue-50/30 dark:bg-cta/5 flex items-center justify-between rounded-[28px] border border-blue-50 dark:border-cta/10 group hover:shadow-inner transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center border border-blue-100 dark:border-cta/20 shadow-sm transition-colors"><Trophy className="w-5 h-5 text-cta transition-colors" /></div>
                      <div className="text-[14px] font-bold text-secondary dark:text-neutral-300 transition-colors">참여 대회</div>
                    </div>
                    <div className="text-2xl font-black text-cta font-heading tracking-tighter transition-colors">2</div>
                  </div>
                  <div className="p-6 bg-blue-50/30 dark:bg-cta/5 flex items-center justify-between rounded-[28px] border border-blue-50 dark:border-cta/10 group hover:shadow-inner transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center border border-blue-100 dark:border-cta/20 shadow-sm transition-colors"><Users className="w-5 h-5 text-cta transition-colors" /></div>
                      <div className="text-[14px] font-bold text-secondary dark:text-neutral-300 transition-colors">활동 중인 팀</div>
                    </div>
                    <div className="text-2xl font-black text-cta font-heading tracking-tighter transition-colors">1</div>
                  </div>
                </div>

                {/* Grass Board (MyPage Style) */}
                <div className="bg-white dark:bg-neutral-800 rounded-[40px] p-8 border border-gray-100 dark:border-neutral-700 shadow-sm transition-colors mb-10">
                  <div className="flex items-center justify-between mb-8 px-2">
                    <h3 className="text-lg font-black text-primary dark:text-white flex items-center gap-3">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-cta" ><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                      GitHub Contributions
                    </h3>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-blue-50/20 dark:bg-cta/5 rounded-[32px] border border-blue-100/30 dark:border-cta/10">
                    <div className="grid grid-rows-7 gap-[4px] auto-cols-max grid-flow-col w-max mx-auto">
                      {Array.from({ length: 42 }).map((_, i) => {
                        const level = Math.floor(Math.random() * 5);
                        const bgDark = ['bg-neutral-800', 'bg-blue-900/40', 'bg-blue-700/60', 'bg-blue-500', 'bg-blue-400'];
                        const bgLight = ['bg-blue-50', 'bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-blue-600'];
                        return (
                          <div key={i} className={`w-[14px] h-[14px] rounded-[2px] ${theme === 'dark' ? bgDark[level] : bgLight[level]} transition-colors hover:scale-125 cursor-pointer`} />
                        );
                      })}
                    </div>
                    <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-black text-tertiary dark:text-neutral-500 uppercase tracking-widest w-full border-t border-blue-100/50 dark:border-cta/10 pt-4">
                      활동 적음 <div className="flex gap-1.5"><div className="w-3 h-3 bg-blue-50 dark:bg-neutral-800 rounded-sm" /><div className="w-3 h-3 bg-blue-300 dark:bg-blue-700/60 rounded-sm" /><div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-sm" /></div> 활동 많음
                    </div>
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
