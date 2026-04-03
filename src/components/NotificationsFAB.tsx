import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  getTeams,
  getInvites,
  updateInviteStatus,
  joinTeam
} from '../utils/api';
import type { TeamInvite } from '../types/models';

export default function NotificationsFAB() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [receivedInvites, setReceivedInvites] = useState<TeamInvite[]>([]);
  const [ledTeamInvites, setLedTeamInvites] = useState<TeamInvite[]>([]);
  const prevTotalRef = useRef(-1);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadNotifications = () => {
    if (!currentUser) return;

    const allTeams = getTeams();
    const userTeams = allTeams.filter(t => t.leaderName === currentUser.nickname || t.members?.includes(currentUser.nickname));

    const allInvites = getInvites();
    const ledTeamsCode = new Set(userTeams.filter(t => t.leaderName === currentUser.nickname).map(t => t.teamCode));

    const apps = allInvites.filter(inv =>
      ledTeamsCode.has(inv.teamCode) &&
      inv.type === 'application' &&
      inv.status === 'pending'
    );
    setLedTeamInvites(apps);

    const invs = allInvites.filter(inv =>
      inv.applicantName === currentUser.nickname &&
      inv.type === 'invitation' &&
      inv.status === 'pending'
    );

    const totalCount = apps.length + invs.length;
    if (prevTotalRef.current !== -1 && totalCount > prevTotalRef.current) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('LinkTon 액셔너블 알림', {
          body: '새로운 팀 빌딩 매칭 관련 알림이 도착했습니다!',
        });
      } else {
        showToast('새로운 팀 알림이 도착했습니다 🔔', 'info');
      }
    }
    prevTotalRef.current = totalCount;

    setLedTeamInvites(apps);
    setReceivedInvites(invs);
  };

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 5000); // Poll every 5s

      // Also listen for storage-update for immediate feedback
      window.addEventListener('storage-update', loadNotifications);

      return () => {
        clearInterval(interval);
        window.removeEventListener('storage-update', loadNotifications);
      };
    }
  }, [currentUser]);

  const handleResolveInvite = (invite: TeamInvite, accept: boolean) => {
    updateInviteStatus(invite.id, accept ? 'accepted' : 'rejected');

    if (accept) {
      joinTeam(invite.teamCode, invite.applicantName, invite.applicantId);
      showToast(`${invite.applicantName}님이 팀에 합류했습니다.`, 'success');
    } else {
      showToast('요청을 거절했습니다.', 'info');
    }
    loadNotifications();
  };

  const handleResolveInvitation = (invite: TeamInvite, accept: boolean) => {
    updateInviteStatus(invite.id, accept ? 'accepted' : 'rejected');

    if (accept) {
      joinTeam(invite.teamCode, currentUser!.nickname, currentUser!.id);
      showToast(`[${invite.teamCode}] 팀에 합류했습니다!`, 'success');
    } else {
      showToast('초대를 거절했습니다.', 'info');
    }
    loadNotifications();
  };

  const total = receivedInvites.length + ledTeamInvites.length;

  if (!currentUser) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 w-16 h-16 bg-white dark:bg-neutral-800 rounded-full shadow-[0_12px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)] flex items-center justify-center border border-gray-100 dark:border-neutral-700 z-[9999] group transition-colors"
      >
        <Mail className="w-7 h-7 text-cta group-hover:scale-110 transition-transform" />
        {total > 0 && (
          <div className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow-sm -mt-0.5 -mr-0.5 animate-bounce transition-colors">
            {total}
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative transition-colors"
            >
              <div className="p-8 border-b border-gray-50 dark:border-neutral-800 flex items-center justify-between bg-gray-50/20 dark:bg-neutral-900/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center text-cta shadow-sm border border-gray-100 dark:border-neutral-700 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-primary dark:text-white tracking-tight transition-colors">최근 알림</h3>
                    <p className="text-[11px] text-tertiary dark:text-neutral-500 font-bold uppercase tracking-widest transition-colors">Recent Notifications</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <X className="w-6 h-6 text-tertiary dark:text-neutral-400" />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto scrollbar-hide space-y-8">
                {total === 0 ? (
                  <div className="py-20 text-center">
                    <Mail className="w-16 h-16 text-gray-100 dark:text-neutral-800 mx-auto mb-6 transition-colors" />
                    <p className="text-tertiary dark:text-neutral-400 font-black text-lg transition-colors">새로운 소식이 없습니다.</p>
                    <p className="text-[13px] text-tertiary/60 dark:text-neutral-500 mt-1 font-medium transition-colors">모든 알림을 확인 완료했습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {receivedInvites.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 text-[12px] font-black text-tertiary dark:text-neutral-500 uppercase tracking-widest mb-4 transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-cta" /> 받은 팀 초대
                        </h4>
                        <div className="space-y-4">
                          {receivedInvites.map(invite => (
                            <div key={invite.id} className="bg-gray-50 dark:bg-neutral-800 p-6 rounded-[28px] border border-gray-100 dark:border-neutral-700 transition-colors">
                              <div className="font-black text-primary dark:text-white text-[17px] mb-2 transition-colors">{(getTeams() || []).find(t => t.teamCode === invite.teamCode)?.name || '팀 초대'}</div>
                              <p className="text-[14px] text-secondary dark:text-neutral-300 leading-relaxed font-medium mb-8 transition-colors">"{invite.message || '팀에 합류해 보세요!'}"</p>
                              <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleResolveInvitation(invite, true)} className="py-3 bg-cta text-white font-black rounded-2xl hover:bg-blue-600 transition-all text-[14px]">수락</button>
                                <button onClick={() => handleResolveInvitation(invite, false)} className="py-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-tertiary dark:text-neutral-400 font-black rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all text-[14px]">거절</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ledTeamInvites.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 text-[12px] font-black text-tertiary dark:text-neutral-500 uppercase tracking-widest mb-4 transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 팀 가입 신청
                        </h4>
                        <div className="space-y-4">
                          {ledTeamInvites.map(invite => (
                            <div key={invite.id} className="bg-gray-50 dark:bg-neutral-800 p-6 rounded-[28px] border border-gray-100 dark:border-neutral-700 transition-colors">
                              <div className="flex items-center justify-between mb-4">
                                <div className="font-black text-primary dark:text-white text-[17px] transition-colors">{invite.applicantName}</div>
                                <div className="text-[11px] bg-white dark:bg-neutral-700 border border-gray-100 dark:border-neutral-600 px-2.5 py-1 rounded-lg font-black text-tertiary dark:text-neutral-300 transition-colors">
                                  {(getTeams() || []).find(t => t.teamCode === invite.teamCode)?.name || '알 수 없는 팀'}
                                </div>
                              </div>
                              <p className="text-[14px] text-secondary dark:text-neutral-300 leading-relaxed font-medium mb-8 transition-colors">"{invite.message || '가입하고 싶습니다!'}"</p>
                              <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleResolveInvite(invite, true)} className="py-3 bg-primary dark:bg-white text-white dark:text-primary font-black rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all text-[14px]">승인</button>
                                <button onClick={() => handleResolveInvite(invite, false)} className="py-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-red-500 font-black rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-[14px]">거절</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
