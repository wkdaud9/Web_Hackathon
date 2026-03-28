import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, User, UserPlus, Mail, CheckCircle } from 'lucide-react';
import Dropdown from '../components/Dropdown';
import EmptyState from '../components/ui/EmptyState';
import { getUsers, getTeams, addInvite, getInvites } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import UserProfileModal from '../components/layout/UserProfileModal';
import type { User as UserType } from '../types/models';

export default function RankingsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [users] = useState<UserType[]>(() => getUsers());
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('all');
  const [invites, setInvites] = useState(() => getInvites());

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
    let sorted = [...users].sort((a, b) => b.points - a.points);
    
    if (period === '7d') {
      sorted = sorted.map(u => ({ ...u, points: Math.floor(u.points * 0.3) })).sort((a, b) => b.points - a.points);
    } else if (period === '30d') {
      sorted = sorted.map(u => ({ ...u, points: Math.floor(u.points * 0.7) })).sort((a, b) => b.points - a.points);
    }

    return sorted.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  }, [users, period]);

  const handleUserClick = (user: UserType) => {
    if (!user.isProfilePublic) {
      showToast('비공개 프로필입니다.', 'error');
      return;
    }
    setSelectedUser(user);
  };

  const inviteToTeam = (e: React.MouseEvent, targetUser: UserType) => {
    e.stopPropagation();
    if (!myTeam) return;

    if (isAlreadyInvited(targetUser.nickname)) {
       showToast('이미 초대를 보낸 사용자입니다.', 'info');
       return;
    }

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
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}}>
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-primary tracking-tight mb-2 flex items-center gap-3">
            <Trophy className="w-10 h-10 text-amber-500" />
            명예의 전당
          </h1>
          <p className="text-secondary font-medium mt-2">전체 해커톤에서 획득한 누적 포인트를 기반으로 한 유저 랭킹입니다.</p>
        </motion.div>
        
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}}>
          <Dropdown
            className="w-full md:w-40"
            value={period}
            onChange={(val) => setPeriod(val as '7d' | '30d' | 'all')}
            options={[
              { label: '전체 기간', value: 'all' },
              { label: '최근 7일', value: '7d' },
              { label: '최근 30일', value: '30d' }
            ]}
          />
        </motion.div>
      </div>

      <div className="space-y-10">
        {rankedUsers.length === 0 ? (
          <EmptyState
            icon={<Trophy className="w-8 h-8" />}
            title="랭킹 정보 없음"
            description="표시할 랭킹 데이터가 없습니다."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Top 3 Podium */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-1 border border-gray-100 bg-white rounded-[32px] p-6 lg:p-8 flex flex-col justify-center min-h-[350px] relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 to-transparent pointer-events-none" />
              <h3 className="text-xl font-bold text-center text-primary mb-8 font-heading flex items-center justify-center gap-2 relative z-10">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500"/> TOP 3 유저 <Star className="w-5 h-5 text-amber-500 fill-amber-500"/>
              </h3>
              <div className="flex items-end justify-center gap-3 h-48 relative z-10">
                {/* Rank 2 */}
                {rankedUsers[1] && (
                  <button 
                    onClick={() => handleUserClick(rankedUsers[1])}
                    className="w-1/3 flex flex-col items-center group cursor-pointer hover:-translate-y-1 transition-transform"
                  >
                    <div className="w-10 h-10 mb-2 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm group-hover:border-blue-100 transition-colors">
                      {rankedUsers[1].profileImage ? <img src={rankedUsers[1].profileImage} alt="" className="w-full h-full object-cover"/> : <User className="w-5 h-5 text-tertiary group-hover:text-cta transition-colors"/>}
                    </div>
                    <div className="text-[14px] text-secondary mb-2 w-full text-center px-1 font-bold line-clamp-1 group-hover:text-primary transition-colors">{rankedUsers[1].nickname}</div>
                    <div className="w-full bg-gray-50 h-[60%] rounded-t-xl shadow-inner border border-gray-200 border-b-0 flex flex-col items-center justify-start pt-3 group-hover:bg-gray-100 transition-colors">
                      <Medal className="w-6 h-6 text-gray-400" />
                      <span className="text-[15px] font-mono font-bold mt-2 text-primary">{rankedUsers[1].points.toLocaleString()}점</span>
                    </div>
                  </button>
                )}
                {/* Rank 1 */}
                {rankedUsers[0] && (
                  <button 
                    onClick={() => handleUserClick(rankedUsers[0])}
                    className="w-1/3 flex flex-col items-center z-10 -ml-1 -mr-1 group cursor-pointer hover:-translate-y-1 transition-transform"
                  >
                    <div className="w-12 h-12 mb-2 rounded-full bg-amber-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-md group-hover:border-blue-100 transition-colors">
                      {rankedUsers[0].profileImage ? <img src={rankedUsers[0].profileImage} alt="" className="w-full h-full object-cover"/> : <User className="w-6 h-6 text-amber-500"/>}
                    </div>
                    <div className="text-[15px] text-cta mb-2 w-full text-center px-1 font-extrabold line-clamp-1">{rankedUsers[0].nickname}</div>
                    <div className="w-[110%] bg-blue-50 h-[85%] rounded-t-xl shadow-md border border-blue-200 border-b-0 flex flex-col items-center justify-start pt-4 relative overflow-hidden group-hover:bg-blue-100/80 transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                      <Trophy className="w-9 h-9 text-amber-500 drop-shadow-sm relative z-10" />
                      <span className="text-[17px] font-mono font-black mt-2 text-cta relative z-10">{rankedUsers[0].points.toLocaleString()}점</span>
                    </div>
                  </button>
                )}
                {/* Rank 3 */}
                {rankedUsers[2] && (
                  <button 
                    onClick={() => handleUserClick(rankedUsers[2])}
                    className="w-1/3 flex flex-col items-center group cursor-pointer hover:-translate-y-1 transition-transform"
                  >
                    <div className="w-10 h-10 mb-2 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm group-hover:border-blue-100 transition-colors">
                      {rankedUsers[2].profileImage ? <img src={rankedUsers[2].profileImage} alt="" className="w-full h-full object-cover"/> : <User className="w-5 h-5 text-tertiary group-hover:text-cta transition-colors"/>}
                    </div>
                    <div className="text-[14px] text-secondary mb-2 w-full text-center px-1 font-bold line-clamp-1 group-hover:text-primary transition-colors">{rankedUsers[2].nickname}</div>
                    <div className="w-full bg-gray-50 h-[45%] rounded-t-xl shadow-inner border border-gray-200 border-b-0 flex flex-col items-center justify-start pt-3 group-hover:bg-gray-100 transition-colors">
                      <Medal className="w-6 h-6 text-orange-400" />
                      <span className="text-[15px] font-mono font-bold mt-2 text-primary">{rankedUsers[2].points.toLocaleString()}점</span>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>

            {/* Table View */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 overflow-x-auto bg-white rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-2 md:p-6"
            >
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-100 text-tertiary text-[14px] bg-white">
                    <th className="py-3 px-3 font-bold w-16 text-center">순위</th>
                    <th className="py-3 px-3 font-bold">유저명</th>
                    <th className="py-3 px-3 font-bold text-right w-28">누적 점수</th>
                    <th className="py-3 px-3 font-bold text-center w-20">쪽지</th>
                    <th className="py-4 px-3 font-bold text-center w-20">초대</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[15px]">
                  {rankedUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      onClick={() => handleUserClick(user)}
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-black ${
                          user.rank === 1 ? 'bg-amber-100 text-amber-600' :
                          user.rank === 2 ? 'bg-gray-100 text-gray-500' :
                          user.rank === 3 ? 'bg-orange-100 text-orange-600' :
                          'text-tertiary border border-gray-200 bg-white'
                        }`}>
                          {user.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
                            {user.profileImage ? <img src={user.profileImage} alt="" className="w-full h-full object-cover"/> : <User className="w-4 h-4 text-tertiary"/>}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-primary group-hover:text-cta tracking-tight text-[15px] transition-colors truncate">
                              {user.nickname}
                            </div>
                            <div className="text-[12px] text-tertiary font-medium">
                              {user.isProfilePublic ? '공개' : '비공개'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-black text-cta text-[17px] whitespace-nowrap">
                        {user.points.toLocaleString()} 점
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {user.id !== currentUser?.id ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUserClick(user); }}
                            className="bg-gray-50 text-secondary hover:bg-gray-100 p-2 rounded-xl transition-all shadow-sm border border-gray-100 mx-auto block"
                            title="쪽지 보내기"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-tertiary opacity-30 italic text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                         {myTeam && user.id !== currentUser?.id ? (
                          isAlreadyInvited(user.nickname) ? (
                            <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl border border-emerald-100 mx-auto block w-fit" title="초대 완료">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => inviteToTeam(e, user)}
                              className="bg-blue-50 text-cta hover:bg-cta hover:text-white p-2 rounded-xl transition-all shadow-sm mx-auto block"
                              title="팀 초대하기"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )
                        ) : (
                          <span className="text-tertiary opacity-30 italic text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserProfileModal 
          isOpen={!!selectedUser} 
          onClose={() => setSelectedUser(null)} 
          user={selectedUser} 
        />
      )}
    </div>
  );
}
