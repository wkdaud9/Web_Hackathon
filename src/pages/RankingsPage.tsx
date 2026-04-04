import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, User, UserPlus, CheckCircle, Search, Users } from 'lucide-react';
import Dropdown from '../components/Dropdown';
import EmptyState from '../components/ui/EmptyState';
import { getUsers, getTeams, addInvite, getInvites } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import UserProfileModal from '../components/layout/UserProfileModal';
import type { User as UserType } from '../types/models';

function RankUserRow({
  user,
  rank,
  currentUser,
  myTeam,
  isAlreadyInvited,
  onUserClick,
  onInvite
}: {
  user: UserType;
  rank: number;
  currentUser: any;
  myTeam: any;
  isAlreadyInvited: (name: string) => boolean;
  onUserClick: (user: UserType) => void;
  onInvite: (e: React.MouseEvent, user: UserType) => void;
}) {
  const isMe = user.id === currentUser?.id;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onUserClick(user)}
      className={`flex items-center justify-between p-4 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-[20px] hover:border-cta/20 dark:hover:border-cta/40 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(49,130,246,0.1)] transition-all cursor-pointer mb-3 ${isMe ? 'bg-blue-50/20 dark:bg-cta/10 border-cta/20 dark:border-cta/30 shadow-sm' : ''}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-8 flex justify-center shrink-0">
          <span className={`text-[14px] font-black ${rank <= 3 ? 'text-cta' : 'text-tertiary/40 dark:text-neutral-600'}`}>
            {rank}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-neutral-700 border border-gray-100 dark:border-neutral-600 overflow-hidden shrink-0">
          {user.profileImage ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 m-3 text-primary dark:text-white transition-colors" />}
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-black text-primary dark:text-white truncate group-hover:text-cta transition-colors">
            {user.nickname}
          </div>
          <div className="text-[11px] font-bold text-tertiary dark:text-neutral-400 uppercase tracking-wider">{user.points.toLocaleString()}점</div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4" onClick={e => e.stopPropagation()}>
        {myTeam && !isMe ? (
          isAlreadyInvited(user.nickname) ? (
            <div className="w-8 h-8 flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          ) : (
            <button onClick={(e) => onInvite(e, user)} className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-cta/10 text-cta hover:bg-cta hover:text-white rounded-full transition-all border border-blue-50 dark:border-cta/20">
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          )
        ) : null}
      </div>
    </motion.div>
  );
}

export default function RankingsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [users] = useState<UserType[]>(() => getUsers());
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('all');
  const [invites, setInvites] = useState(() => getInvites());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleUpdate = () => setInvites(getInvites());
    window.addEventListener('storage-update', handleUpdate);
    return () => window.removeEventListener('storage-update', handleUpdate);
  }, []);

  const myTeam = useMemo(() => {
    const teams = getTeams();
    return teams.find(t => t.leaderName === currentUser?.nickname) || null;
  }, [currentUser, invites]);

  const isAlreadyInvited = (nickname: string) => {
    if (!myTeam) return false;
    return invites.some(inv =>
      inv.teamCode === myTeam.teamCode &&
      inv.applicantName === nickname &&
      inv.status === 'pending'
    );
  };

  const rankedUsers = useMemo(() => {
    // Filter out operators (admins) from the rankings
    const baseUsers = users.filter(u => u.role !== 'operator');
    
    let sorted = [...baseUsers].sort((a, b) => b.points - a.points);
    if (period === '7d') sorted = sorted.map(u => ({ ...u, points: Math.floor(u.points * 0.3) }));
    else if (period === '30d') sorted = sorted.map(u => ({ ...u, points: Math.floor(u.points * 0.7) }));

    return sorted
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({ ...user, rank: index + 1 }))
      .filter(u => u.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [users, period, searchTerm]);

  const top3 = useMemo(() => rankedUsers.slice(0, 3), [rankedUsers]);

  const handleUserClick = (user: UserType) => {
    if (!user.isProfilePublic && user.id !== currentUser?.id) {
      showToast('비공개 프로필입니다.', 'error');
      return;
    }
    setSelectedUser(user);
  };

  const inviteToTeam = (e: React.MouseEvent, targetUser: UserType) => {
    e.stopPropagation();
    if (!myTeam) return;
    if (isAlreadyInvited(targetUser.nickname)) return;

    addInvite({
      id: Date.now(),
      hackathonSlug: myTeam.hackathonSlug || 'common',
      teamCode: myTeam.teamCode,
      applicantName: targetUser.nickname,
      applicantId: targetUser.id,
      message: `${currentUser?.nickname}님이 소속 팀 [${myTeam.name}]에 초대했습니다.`,
      status: 'pending',
      type: 'invitation',
      createdAt: new Date().toISOString()
    });
    showToast('초대 완료', 'success');
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-transparent transition-colors duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 px-6 py-4 transition-colors duration-300">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black text-primary dark:text-white tracking-tighter uppercase transition-colors">명예의 전당</h1>
            <div className="hidden lg:flex bg-gray-100 dark:bg-neutral-800 rounded-full px-4 py-1.5 gap-2 h-11 items-center transition-colors">
              <button onClick={() => setPeriod('all')} className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${period === 'all' ? 'bg-primary dark:bg-cta text-white shadow-md shadow-gray-200 dark:shadow-none' : 'hover:bg-gray-200 dark:hover:bg-neutral-700 text-secondary dark:text-neutral-400'}`}>전체</button>
              <button onClick={() => setPeriod('30d')} className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${period === '30d' ? 'bg-primary dark:bg-cta text-white shadow-md shadow-gray-200 dark:shadow-none' : 'hover:bg-gray-200 dark:hover:bg-neutral-700 text-secondary dark:text-neutral-400'}`}>30일</button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group flex-1 md:flex-none h-11">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary dark:text-white transition-colors" />
              <input
                type="text"
                placeholder="유저 검색"
                className="bg-gray-50 dark:bg-neutral-800 text-sm font-medium rounded-full w-full md:w-64 h-full pl-11 pr-6 outline-none border border-gray-100 dark:border-neutral-700 text-primary dark:text-white focus:bg-white dark:focus:bg-neutral-900 focus:border-cta dark:focus:border-cta transition-all block"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dropdown
              className="w-full md:w-64 h-11"
              value={period}
              onChange={(val) => setPeriod(val as any)}
              options={[{ label: '전체 기간', value: 'all' }, { label: '최근 30일', value: '30d' }, { label: '최근 7일', value: '7d' }]}
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-6 py-10 lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Left Col: Podium Surround */}
        <div className="lg:col-span-4 mb-10 lg:mb-0">
          <div className="bg-gray-50/50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-700/50 rounded-[48px] p-8 pb-12 sticky top-28 transition-colors">
            <h2 className="text-2xl font-black text-primary dark:text-white mb-12 tracking-tight text-center flex items-center justify-center gap-3 transition-colors">
              <Trophy className="w-8 h-8 text-primary dark:text-white transition-colors" /> TOP 3
            </h2>

            <div className="flex items-end justify-center gap-6">
              {/* 2nd Place */}
              {top3[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  onClick={() => handleUserClick(top3[1]!)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-300 dark:border-neutral-500 shadow-lg overflow-hidden group-hover:scale-105 transition-transform bg-white dark:bg-neutral-800 ring-4 ring-slate-100/50 dark:ring-neutral-700/30">
                      {top3[1]!.profileImage ? <img src={top3[1]!.profileImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary dark:text-white transition-colors"><User className="w-6 h-6" /></div>}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-500 dark:bg-neutral-500 border-2 border-white dark:border-neutral-800 text-white text-[10px] font-black flex items-center justify-center shadow-md">2</div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-[13px] font-black text-primary dark:text-white truncate max-w-[80px]">{top3[1]!.nickname}</h3>
                    <p className="text-cta font-black text-[11px]">{top3[1]!.points.toLocaleString()}점</p>
                  </div>
                </motion.div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleUserClick(top3[0]!)}
                  className="flex flex-col items-center group cursor-pointer -translate-y-4"
                >
                  <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-xl overflow-hidden group-hover:scale-110 transition-transform ring-4 ring-amber-100/50 bg-white dark:bg-neutral-800">
                      {top3[0]!.profileImage ? <img src={top3[0]!.profileImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary dark:text-white transition-colors"><User className="w-8 h-8" /></div>}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-400 border-2 border-white text-white text-[12px] font-black flex items-center justify-center shadow-lg">1</div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-[15px] font-black text-primary dark:text-white truncate max-w-[100px]">{top3[0]!.nickname}</h3>
                    <p className="text-cta font-black text-[13px]">{top3[0]!.points.toLocaleString()}점</p>
                  </div>
                </motion.div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  onClick={() => handleUserClick(top3[2]!)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-full border-4 border-orange-300 shadow-lg overflow-hidden group-hover:scale-105 transition-transform bg-white dark:bg-neutral-800">
                      {top3[2]!.profileImage ? <img src={top3[2]!.profileImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary dark:text-white transition-colors"><User className="w-6 h-6" /></div>}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-400 border-2 border-white text-white text-[10px] font-black flex items-center justify-center">3</div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-[13px] font-black text-primary dark:text-white truncate max-w-[80px]">{top3[2]!.nickname}</h3>
                    <p className="text-cta font-black text-[11px]">{top3[2]!.points.toLocaleString()}점</p>
                  </div>
                </motion.div>
              )}
            </div>
            <div className="mt-12 p-6 bg-white dark:bg-neutral-800 rounded-[32px] border border-gray-100 dark:border-neutral-700 transition-colors">
              <p className="text-[12px] font-bold text-tertiary dark:text-neutral-400 leading-relaxed text-center italic">"진정한 가치는 도전 자체에 있습니다."</p>
            </div>
          </div>
        </div>

        {/* Right Col: Full List */}
        <div className="lg:col-span-8">
          <div className="space-y-4">
            {rankedUsers.length === 0 ? (
              <EmptyState icon={<Users className="w-12 h-12 text-primary dark:text-white transition-colors" />} title="유저가 없습니다" description="검색 조건을 변경해보세요." />
            ) : (
              rankedUsers.map((user) => (
                <RankUserRow
                  key={user.id}
                  user={user}
                  rank={user.rank}
                  currentUser={currentUser}
                  myTeam={myTeam}
                  isAlreadyInvited={isAlreadyInvited}
                  onUserClick={handleUserClick}
                  onInvite={inviteToTeam}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <UserProfileModal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} user={selectedUser} />
        )}
      </AnimatePresence>
      <div className="h-40" />
    </div>
  );
}
