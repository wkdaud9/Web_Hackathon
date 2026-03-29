import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Lightbulb, 
  FileText, 
  Plus, 
  Clock, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Trash2,
  X,
  Pencil,
  FileUp,
  Link as LinkIcon,
  Share2,
  AlertCircle,
  FileCode
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  getTeams, 
  getTeamIdeas, 
  addTeamIdea, 
  updateTeamIdea,
  deleteTeamIdea,
  getTeamSchedules, 
  addTeamSchedule, 
  updateTeamSchedule,
  deleteTeamSchedule,
  getTeamResources, 
  addTeamResource,
  updateTeamResource,
  deleteTeamResource,
  leaveTeam
} from '../utils/api';
import type { Team, TeamIdea, TeamSchedule, TeamResource } from '../types/models';

type TabType = 'overview' | 'brainstorm' | 'calendar' | 'resources';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'danger' | 'info';
}

export default function TeamWorkspacePage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<Team | null>(null);

  // Data states
  const [ideas, setIdeas] = useState<TeamIdea[]>([]);
  const [schedules, setSchedules] = useState<TeamSchedule[]>([]);
  const [resources, setResources] = useState<TeamResource[]>([]);

  // Modals & States
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isResourceSuccessModalOpen, setIsResourceSuccessModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [editingSchedule, setEditingSchedule] = useState<TeamSchedule | null>(null);
  const [editingIdea, setEditingIdea] = useState<TeamIdea | null>(null);
  const [editingResource, setEditingResource] = useState<TeamResource | null>(null);
  const [selectedResource, setSelectedResource] = useState<TeamResource | null>(null);

  // Custom Confirmation Modal State
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  // Form states
  const [newIdea, setNewIdea] = useState('');
  const [resourceForm, setResourceForm] = useState({ 
    title: '', 
    description: '', 
    url: '', 
    type: 'link' as TeamResource['type']
  });
  const [lastSavedResource, setLastSavedResource] = useState<TeamResource | null>(null);
  
  // Custom Time Form
  const [timeForm, setTimeForm] = useState({
    title: '',
    description: '',
    period: 'AM' as 'AM' | 'PM',
    hour: '09',
    minute: '00'
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadData = useCallback(() => {
    if (!currentUser) return;
    setLoading(true);
    const allTeams = getTeams();
    const team = allTeams.find(t => t.members?.includes(currentUser.nickname) || t.leaderName === currentUser.nickname);
    
    if (!team) {
      setMyTeam(null);
      setLoading(false);
      return;
    }

    setMyTeam(team);
    setIdeas(getTeamIdeas(team.teamCode));
    setSchedules(getTeamSchedules(team.teamCode));
    setResources(getTeamResources(team.teamCode));
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const timer = setTimeout(loadData, 500);
    window.addEventListener('storage-update', loadData);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage-update', loadData);
    };
  }, [currentUser, navigate, loadData]);

  // Alert/Confirm Helpers
  const requestConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' = 'danger') => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      },
      type
    });
  };

  // Idea Handlers
  const handleSaveIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTeam || !newIdea.trim() || !currentUser) return;

    if (editingIdea) {
      const updatedIdea: TeamIdea = { ...editingIdea, content: newIdea.trim() };
      updateTeamIdea(updatedIdea);
      setIdeas(ideas.map(i => i.id === updatedIdea.id ? updatedIdea : i));
      setEditingIdea(null);
      showToast('아이디어가 수정되었습니다.', 'success');
    } else {
      const idea: TeamIdea = {
        id: Math.random().toString(36).substring(2, 9),
        teamCode: myTeam.teamCode,
        author: currentUser.nickname,
        content: newIdea.trim(),
        createdAt: new Date().toISOString()
      };
      addTeamIdea(idea);
      setIdeas([idea, ...ideas]);
      showToast('아이디어가 공유되었습니다.', 'success');
    }
    setNewIdea('');
  };

  const handleDeleteIdea = (id: string) => {
    requestConfirm(
      '아이디어 삭제',
      '정말 이 아이디어를 삭제하시겠습니까? 삭제된 아이디어는 복구할 수 없습니다.',
      () => {
        deleteTeamIdea(id);
        setIdeas(prev => prev.filter(i => i.id !== id));
        showToast('아이디어가 삭제되었습니다.', 'info');
      }
    );
  };

  const startEditIdea = (idea: TeamIdea) => {
    setEditingIdea(idea);
    setNewIdea(idea.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Schedule Handlers
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTeam || !timeForm.title.trim() || !selectedDate || !currentUser) return;

    let h = parseInt(timeForm.hour);
    if (timeForm.period === 'PM' && h < 12) h += 12;
    if (timeForm.period === 'AM' && h === 12) h = 0;

    const fullDate = new Date(selectedDate);
    fullDate.setHours(h, parseInt(timeForm.minute), 0);

    const scheduleData: TeamSchedule = {
      id: editingSchedule ? editingSchedule.id : Math.random().toString(36).substring(2, 9),
      teamCode: myTeam.teamCode,
      title: timeForm.title.trim(),
      description: timeForm.description,
      startAt: fullDate.toISOString(),
      createdBy: editingSchedule ? editingSchedule.createdBy : currentUser.nickname,
      createdAt: editingSchedule ? editingSchedule.createdAt : new Date().toISOString()
    };

    if (editingSchedule) {
      updateTeamSchedule(scheduleData);
      setSchedules(schedules.map(s => s.id === scheduleData.id ? scheduleData : s).sort((a,b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
      showToast('일정이 수정되었습니다.', 'success');
    } else {
      addTeamSchedule(scheduleData);
      setSchedules([...schedules, scheduleData].sort((a,b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
      showToast('일정이 추가되었습니다.', 'success');
    }

    setIsAddModalOpen(false);
    setEditingSchedule(null);
  };

  const handleDeleteSchedule = (id: string) => {
    requestConfirm(
      '일정 삭제',
      '이 일정을 영구적으로 삭제하시겠습니까?',
      () => {
        deleteTeamSchedule(id);
        setSchedules(schedules.filter(s => s.id !== id));
        showToast('일정이 삭제되었습니다.', 'info');
        setIsAddModalOpen(false);
        setEditingSchedule(null);
      }
    );
  };

  const openAddModal = (date: Date) => {
    setSelectedDate(date);
    setEditingSchedule(null);
    setTimeForm({ title: '', description: '', period: 'AM', hour: '09', minute: '00' });
    setIsAddModalOpen(true);
  };

  const openEditModal = (schedule: TeamSchedule) => {
    const sDate = new Date(schedule.startAt);
    let h = sDate.getHours();
    const p = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    
    setEditingSchedule(schedule);
    setSelectedDate(sDate);
    setTimeForm({
      title: schedule.title,
      description: schedule.description || '',
      period: p,
      hour: String(h).padStart(2, '0'),
      minute: String(sDate.getMinutes()).padStart(2, '0')
    });
    setIsAddModalOpen(true);
  };

  // Resource Handlers
  const handleSaveResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTeam || !resourceForm.title.trim() || !currentUser) return;

    if (editingResource) {
      const updated: TeamResource = { 
        ...editingResource, 
        title: resourceForm.title, 
        description: resourceForm.description, 
        url: resourceForm.url, 
        type: resourceForm.type 
      };
      updateTeamResource(updated);
      setResources(resources.map(r => r.id === updated.id ? updated : r));
      setEditingResource(null);
      showToast('리소스가 수정되었습니다.', 'success');
    } else {
      const resource: TeamResource = {
        id: Math.random().toString(36).substring(2, 9),
        teamCode: myTeam.teamCode,
        title: resourceForm.title.trim(),
        description: resourceForm.description,
        url: resourceForm.url || '#',
        type: resourceForm.type,
        sharedBy: currentUser.nickname,
        createdAt: new Date().toISOString()
      };
      addTeamResource(resource);
      setResources([resource, ...resources]);
      setLastSavedResource(resource);
      setIsResourceSuccessModalOpen(true);
      showToast('리소스가 저장되었습니다.', 'success');
    }

    setResourceForm({ title: '', description: '', url: '', type: 'link' });
    setIsResourceModalOpen(false);
  };

  const handleDeleteResource = (id: string) => {
    requestConfirm(
      '리소스 삭제',
      '이 리소스를 삭제하시겠습니까? 복구할 수 없습니다.',
      () => {
        deleteTeamResource(id);
        setResources(resources.filter(r => r.id !== id));
        setIsDetailModalOpen(false);
        showToast('리소스가 삭제되었습니다.', 'info');
      }
    );
  };

  const startEditResource = (res: TeamResource) => {
    setEditingResource(res);
    setResourceForm({
      title: res.title,
      description: res.description || '',
      url: res.url,
      type: res.type
    });
    setIsDetailModalOpen(false);
    setIsResourceModalOpen(true);
  };

  const handleKickMember = (nickname: string) => {
    if (!myTeam || !currentUser || myTeam.leaderName !== currentUser.nickname) {
      showToast('강퇴 권한이 없습니다.', 'error');
      return;
    }
    if (nickname === myTeam.leaderName) {
      showToast('팀장 자신은 강퇴할 수 없습니다.', 'error');
      return;
    }

    requestConfirm(
      '팀원 강퇴',
      `${nickname}님을 팀에서 영구 제외하시겠습니까? 제외된 팀원은 모든 팀 콘텐츠에 접근할 수 없게 됩니다.`,
      () => {
        leaveTeam(myTeam.teamCode, nickname);
        showToast(`${nickname}님이 강퇴되었습니다.`, 'success');
      }
    );
  };

  const handleLeaveTeam = () => {
    if (!myTeam || !currentUser) return;
    if (myTeam.leaderName === currentUser.nickname) {
       showToast('팀장은 팀을 탈퇴할 수 없습니다. (먼저 팀장 권한을 위임하거나 팀을 해체해야 합니다)', 'error');
       return;
    }

    requestConfirm(
      '팀 탈퇴 확인',
      `정말로 '${myTeam.name}' 팀을 탈퇴하시겠습니까? 탈퇴 후에는 팀 내 공유된 모든 자료 및 일정 확인이 불가능합니다.`,
      () => {
        leaveTeam(myTeam.teamCode, currentUser.nickname, currentUser.id);
        showToast('정상적으로 팀에서 탈퇴되었습니다.', 'success');
        navigate('/camp');
      }
    );
  };

  // Calendar Helper Logic
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentMonth]);

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(s => {
      const sDate = new Date(s.startAt);
      return sDate.getFullYear() === date.getFullYear() && 
             sDate.getMonth() === date.getMonth() && 
             sDate.getDate() === date.getDate();
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-cta rounded-full animate-spin mb-4" />
        <p className="text-secondary font-medium">워크스페이스를 불러오고 있습니다...</p>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center bg-white rounded-[32px] border border-gray-100 shadow-sm p-10">
        <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-4">소속된 팀이 없습니다</h2>
        <p className="text-secondary font-medium mb-10 leading-relaxed">
          팀 워크스페이스는 팀에 소속된 유저만 이용할 수 있습니다.<br/>
          팀 모집 라운지에서 새로운 팀을 찾거나 직접 모집해보세요!
        </p>
        <Link to="/camp" className="px-8 py-4 bg-cta text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-200">
          팀 모집 라운지로 이동
        </Link>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: '대시보드', icon: Users },
    { id: 'brainstorm', label: '아이디어 회의', icon: Lightbulb },
    { id: 'calendar', label: '팀 캘린더', icon: CalendarIcon },
    { id: 'resources', label: '리소스 저장소', icon: FileText },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-50 text-cta rounded-[22px] flex items-center justify-center shadow-sm">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-heading text-primary tracking-tight">{myTeam.name}</h1>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-secondary text-[10px] font-black rounded-full border border-gray-100 tracking-widest uppercase">
                진행중
                <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/hackathons/${myTeam.hackathonSlug}`} className="px-5 py-3 bg-primary text-white text-[14px] font-bold rounded-2xl hover:bg-gray-800 transition-colors shadow-md">
            해커톤 페이지 바로가기
          </Link>
          {currentUser?.nickname !== myTeam.leaderName && (
            <button 
              onClick={handleLeaveTeam}
              className="px-5 py-3 bg-red-50 text-red-500 text-[14px] font-bold rounded-2xl hover:bg-red-100 transition-all border border-red-100"
            >
              탈퇴하기
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-gray-100/50 rounded-[22px] w-fit mb-10 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-[16px] text-[15px] font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-cta shadow-sm ring-1 ring-black/5' : 'text-tertiary hover:text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-cta rounded-full" />
                      팀 소개 및 현황
                    </h3>
                    <p className="text-secondary font-medium leading-relaxed mb-8">{myTeam.intro}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-5 rounded-2xl">
                        <div className="text-tertiary text-[12px] font-bold mb-1 uppercase tracking-wider">멤버 수</div>
                        <div className="text-2xl font-black text-primary">{myTeam.members?.length || 1}명</div>
                      </div>
                      <div className="bg-gray-50 p-5 rounded-2xl">
                        <div className="text-tertiary text-[12px] font-bold mb-1 uppercase tracking-wider">포지션 정보</div>
                        <div className="text-[14px] font-bold text-cta truncate">{myTeam.lookingFor.join(', ')}</div>
                      </div>
                      <div className="bg-gray-50 p-5 rounded-2xl">
                        <div className="text-tertiary text-[12px] font-bold mb-1 uppercase tracking-wider">생성일</div>
                        <div className="text-[14px] font-bold text-primary">{new Date(myTeam.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-cta rounded-full" />
                      팀 멤버 ({myTeam.members?.length || 1})
                    </h3>
                    <div className="space-y-4">
                      {myTeam.members?.sort((a) => a === myTeam.leaderName ? -1 : 1).map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group transition-colors hover:bg-white border border-transparent hover:border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm overflow-hidden text-tertiary font-bold text-[14px]">
                              {member[0]}
                            </div>
                            <div>
                              <div className="font-bold text-primary flex items-center gap-2">
                                {member}
                                {member === myTeam.leaderName && <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md">LEADER</span>}
                              </div>
                              <div className="text-[12px] text-tertiary font-medium">{member === myTeam.leaderName ? '기획 및 총괄' : '개발 및 디자인'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {currentUser?.nickname === myTeam.leaderName && member !== myTeam.leaderName && (
                              <button onClick={() => handleKickMember(member)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-fit">
                    <h4 className="text-lg font-black text-primary mb-6 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-cta" /> 다가오는 일정
                    </h4>
                    {schedules.length === 0 ? (
                      <p className="text-tertiary text-[14px] font-medium leading-relaxed mb-6 italic">아직 등록된 일정이 없습니다.</p>
                    ) : (
                      <div className="space-y-4 mb-6">
                        {schedules.slice(0, 3).map((s) => (
                          <div key={s.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-cta/20 transition-all">
                            <div className="text-[10px] font-black text-cta uppercase mb-1">{new Date(s.startAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                            <div className="font-bold text-primary text-[14px] mb-1">{s.title}</div>
                            <div className="text-[11px] text-tertiary">{new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setActiveTab('calendar')} className="w-full py-3 bg-white border border-gray-200 text-cta font-bold rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-[14px]">
                      캘린더 보기
                    </button>
                  </div>

                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-primary mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> 최근 아이디어</span>
                      <span className="text-[12px] text-tertiary">{ideas.length}</span>
                    </h4>
                    <div className="space-y-3">
                      {ideas.slice(0, 3).map((idea) => (
                        <div key={idea.id} className="text-[14px] text-secondary border-l-2 border-gray-100 pl-4 py-1">
                          <p className="line-clamp-2 mb-1">{idea.content}</p>
                          <span className="text-[11px] text-tertiary font-bold">{idea.author}</span>
                        </div>
                      ))}
                      {ideas.length === 0 && <p className="text-[13px] text-tertiary py-4 text-center">아이디어를 제안해보세요!</p>}
                    </div>
                    <button onClick={() => setActiveTab('brainstorm')} className="w-full mt-6 py-3 border border-gray-100 text-tertiary font-bold rounded-2xl hover:text-cta hover:border-cta/30 transition-all text-[14px]">
                      아이디어 보드 전체보기
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'brainstorm' && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-amber-500" />
                    아이디어 브레인스토밍
                  </h3>
                  <form onSubmit={handleSaveIdea} className="relative mb-10">
                    <textarea 
                      value={newIdea}
                      onChange={(e) => setNewIdea(e.target.value)}
                      placeholder={editingIdea ? "아이디어 수정을 진행합니다..." : "자유롭게 아이디어를 남겨주세요! 팀원들과 실시간으로 공유됩니다."}
                      className={`w-full bg-gray-50 border rounded-[28px] px-8 py-6 text-primary font-medium outline-none focus:ring-4 focus:ring-blue-100 transition-all h-32 resize-none placeholder:text-tertiary leading-relaxed ${editingIdea ? 'border-cta' : 'border-gray-100'}`}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        {editingIdea && (
                           <button type="button" onClick={() => {setEditingIdea(null); setNewIdea('');}} className="bg-gray-200 text-gray-700 px-4 py-3 rounded-2xl font-bold hover:bg-gray-300">취소</button>
                        )}
                        <button type="submit" className="bg-cta text-white p-3 rounded-2xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200">
                          {editingIdea ? <CheckCircle2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                        </button>
                    </div>
                  </form>

                  <div className="space-y-6">
                    {ideas.map((idea, idx) => (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={idea.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm group hover:border-cta/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-cta flex items-center justify-center font-bold text-[14px]">
                              {idea.author[0]}
                            </div>
                            <div>
                              <div className="font-bold text-primary text-[15px]">{idea.author}</div>
                              <div className="text-[11px] text-tertiary">{new Date(idea.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {idea.author === currentUser?.nickname && (
                               <>
                                 <button onClick={() => startEditIdea(idea)} className="p-2 text-tertiary hover:text-cta bg-gray-50 rounded-lg"><Pencil className="w-4 h-4"/></button>
                                 <button onClick={() => handleDeleteIdea(idea.id)} className="p-2 text-tertiary hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                               </>
                            )}
                          </div>
                        </div>
                        <p className="text-secondary font-medium leading-[1.7] whitespace-pre-wrap">{idea.content}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-fit sticky top-24">
                    <h3 className="text-lg font-black text-primary mb-6 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-cta" /> 다가오는 일정
                    </h3>
                    <div className="space-y-6 relative ml-2 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                      {schedules.slice(0, 5).map((s, idx) => (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} key={s.id} className="relative pl-6">
                          <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-cta shadow-[0_0_8px_rgba(59,130,246,0.5)] ring-4 ring-white" />
                          <div className="text-[11px] font-black text-cta uppercase mb-1">{new Date(s.startAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                          <div className="font-bold text-primary text-[14px] leading-tight mb-1">{s.title}</div>
                          <div className="text-[12px] text-tertiary font-medium">{new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black text-primary font-heading tracking-tight">{currentMonth.toLocaleDateString([], { year: 'numeric', month: 'long' })}</h2>
                        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
                          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1.5 hover:bg-white rounded-lg transition-colors text-tertiary hover:text-primary"><ChevronLeft className="w-5 h-5" /></button>
                          <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 text-[11px] font-black text-primary bg-white rounded-lg shadow-sm">TODAY</button>
                          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1.5 hover:bg-white rounded-lg transition-colors text-tertiary hover:text-primary"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (<div key={day} className="bg-white py-3 text-center text-[10px] font-black text-tertiary tracking-widest">{day}</div>))}
                      {calendarDays.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="bg-gray-50/50 min-h-[100px]" />;
                        const daySchedules = getSchedulesForDate(day);
                        const isToday = day.toDateString() === new Date().toDateString();
                        return (
                          <div key={day.toISOString()} onClick={() => { setSelectedDate(day); setIsDayModalOpen(true); }} className="bg-white min-h-[110px] p-2 hover:bg-blue-50/30 transition-all cursor-pointer group flex flex-col items-start gap-1">
                            <span className={`w-8 h-8 flex items-center justify-center text-[14px] font-black rounded-full transition-colors ${isToday ? 'bg-cta text-white shadow-md' : 'text-primary group-hover:text-cta'}`}>{day.getDate()}</span>
                            <div className="flex flex-col gap-1 w-full mt-1">
                              {daySchedules.slice(0, 2).map(s => (<div key={s.id} className="text-[10px] font-bold text-cta bg-blue-50 px-1.5 py-0.5 rounded-md truncate border border-blue-100/50">{s.title}</div>))}
                              {daySchedules.length > 2 && (<div className="text-[9px] font-bold text-tertiary pl-1">+{daySchedules.length - 2} more</div>)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-10">
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                       <FileText className="w-6 h-6 text-cta" /> 리소스 저장소
                    </h3>
                    <button onClick={() => { setEditingResource(null); setResourceForm({title:'', description:'', url:'', type:'link'}); setIsResourceModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-cta text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-200">
                      <Plus className="w-5 h-5"/>
                      리소스 추가
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {[
                      { id: 'file', label: '파일 보관함', icon: FileUp, color: 'blue' },
                      { id: 'link', label: '링크 보관함', icon: LinkIcon, color: 'emerald' },
                      { id: 'other', label: '기타 리소스', icon: Share2, color: 'purple' }
                    ].map(basket => {
                      const basketResources = resources.filter(r => {
                        if (basket.id === 'file') return r.type === 'file';
                        if (basket.id === 'link') return r.type === 'link';
                        return r.type !== 'file' && r.type !== 'link';
                      });

                      return (
                        <div key={basket.id} className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 min-h-[400px]">
                          <div className="flex items-center gap-3 mb-6 px-2">
                            <div className={`w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-${basket.color}-50 text-${basket.color}-500`}>
                              <basket.icon className="w-5 h-5" />
                            </div>
                            <h4 className="font-black text-primary text-lg">{basket.label}</h4>
                            <span className={`ml-auto bg-${basket.color}-100 text-${basket.color}-600 px-2.5 py-0.5 rounded-full text-[11px] font-black`}>{basketResources.length}</span>
                          </div>
                          <div className="space-y-1 bg-white/50 rounded-2xl p-2 border border-black/5 overflow-hidden">
                            {basketResources.map((res) => (
                               <button 
                                 key={res.id} 
                                 onClick={() => { setSelectedResource(res); setIsDetailModalOpen(true); }}
                                 className="w-full flex items-center justify-between px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl transition-all group"
                               >
                                 <div className="flex items-center gap-3 min-w-0">
                                   <div className={`w-1.5 h-1.5 rounded-full bg-${basket.color}-400 group-hover:scale-125 transition-transform`} />
                                   <span className="font-bold text-primary text-[14px] truncate">{res.title}</span>
                                 </div>
                                 <div className="flex items-center gap-2 shrink-0">
                                   <span className="text-[11px] font-bold text-tertiary group-hover:text-secondary">{res.sharedBy}</span>
                                   <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-cta group-hover:translate-x-0.5 transition-all" />
                                 </div>
                               </button>
                            ))}
                            {basketResources.length === 0 && <p className="text-center py-10 text-[13px] text-tertiary font-bold">비어있음</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Resource Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedResource && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsDetailModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
             <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-blue-50 text-cta rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                        {selectedResource.type === 'file' ? <FileUp className="w-6 h-6" /> : selectedResource.type === 'link' ? <LinkIcon className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
                      </div>
                      <div className="min-w-0">
                         <h3 className="text-2xl font-black text-primary truncate leading-tight">{selectedResource.title}</h3>
                         <p className="text-[12px] font-bold text-tertiary uppercase tracking-wider">{selectedResource.type} Resource</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                       {selectedResource.sharedBy === currentUser?.nickname && (
                         <>
                           <button onClick={() => startEditResource(selectedResource)} className="w-10 h-10 bg-gray-50 text-tertiary rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-cta transition-all"><Pencil className="w-5 h-5" /></button>
                           <button onClick={() => handleDeleteResource(selectedResource.id)} className="w-10 h-10 bg-gray-50 text-tertiary rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                         </>
                       )}
                       <button onClick={() => setIsDetailModalOpen(false)} className="w-11 h-11 bg-gray-50 text-tertiary rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-all"><X className="w-6 h-6" /></button>
                   </div>
                </div>

                <div className="space-y-8">
                   <div>
                      <h4 className="text-[11px] font-black text-cta uppercase mb-2 tracking-widest ml-1">상세 내용</h4>
                      <div className="bg-gray-50 p-6 rounded-[28px] border border-gray-100 text-secondary font-medium leading-[1.8] whitespace-pre-wrap">
                        {selectedResource.description || '상세 내용이 작성되지 않았습니다.'}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                         <div className="text-[10px] font-black text-tertiary uppercase mb-1">작성자</div>
                         <div className="font-bold text-primary flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px]">{selectedResource.sharedBy[0]}</div>
                            {selectedResource.sharedBy}
                         </div>
                      </div>
                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                         <div className="text-[10px] font-black text-tertiary uppercase mb-1">공유 날짜</div>
                         <div className="font-bold text-primary">{new Date(selectedResource.createdAt).toLocaleDateString()}</div>
                      </div>
                   </div>

                   <div className="pt-2">
                      <h4 className="text-[11px] font-black text-cta uppercase mb-2 tracking-widest ml-1">첨부 파일 / 링크</h4>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3 group">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-cta border border-blue-50">
                            {selectedResource.type === 'file' ? <FileCode className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            {selectedResource.url === '#' ? (
                              <span className="text-[13px] font-bold text-gray-400">연결된 경로 없음</span>
                            ) : (
                              <a 
                                href={selectedResource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[13px] font-black text-primary hover:text-cta transition-colors flex items-center gap-2 group-hover:underline decoration-cta decoration-2 underline-offset-4 truncate"
                              >
                                {selectedResource.url.length > 50 ? selectedResource.url.substring(0, 50) + '...' : selectedResource.url}
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmState.isOpen && (
           <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setConfirmState(p => ({...p, isOpen:false}))} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
             <motion.div initial={{opacity:0, scale:0.9, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.9, y:20}} className="relative bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${confirmState.type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-cta'}`}>
                  {confirmState.type === 'danger' ? <AlertCircle className="w-8 h-8" /> : <Share2 className="w-8 h-8" />}
               </div>
               <h3 className="text-xl font-black text-primary mb-2 tracking-tight">{confirmState.title}</h3>
               <p className="text-secondary text-[14px] font-medium leading-relaxed mb-8">{confirmState.message}</p>
               <div className="flex items-center gap-3">
                 <button onClick={() => setConfirmState(p => ({...p, isOpen:false}))} className="flex-1 py-3.5 bg-gray-100 text-tertiary font-bold rounded-2xl hover:bg-gray-200 transition-colors">취소</button>
                 <button onClick={confirmState.onConfirm} className={`flex-1 py-3.5 text-white font-bold rounded-2xl transition-all shadow-lg ${confirmState.type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-cta hover:bg-blue-600 shadow-blue-100'}`}>확인</button>
               </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Resource Modal (Used for both add and edit) */}
      <AnimatePresence>
        {isResourceModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsResourceModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
             <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black text-primary">{editingResource ? '리소스 수정' : '리소스 추가'}</h3>
                 <button onClick={() => setIsResourceModalOpen(false)} className="w-11 h-11 bg-gray-50 text-tertiary rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-all"><X className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleSaveResource} className="space-y-6">
                 <div>
                   <label className="block text-[13px] font-black text-tertiary mb-2 ml-1">제목</label>
                   <input required type="text" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} placeholder="리소스의 제목을 입력하세요." className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-primary font-bold focus:outline-none focus:border-cta focus:ring-4 focus:ring-blue-50 transition-all" />
                 </div>
                 <div>
                   <label className="block text-[13px] font-black text-tertiary mb-2 ml-1">설명</label>
                   <textarea value={resourceForm.description} onChange={e => setResourceForm({...resourceForm, description: e.target.value})} placeholder="리소스에 대한 간략한 설명을 입력하세요." className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-primary font-bold h-32 resize-none focus:outline-none focus:border-cta transition-all" />
                 </div>
                 <div>
                    <label className="block text-[13px] font-black text-tertiary mb-2 ml-1">유형 및 경로</label>
                    <div className="flex gap-2">
                      <select value={resourceForm.type} onChange={e => setResourceForm({...resourceForm, type: e.target.value as any})} className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-[14px] outline-none">
                        <option value="link">링크</option>
                        <option value="github">GitHub</option>
                        <option value="file">파일</option>
                      </select>
                      <input type="text" value={resourceForm.url} onChange={e => setResourceForm({...resourceForm, url: e.target.value})} placeholder="링크 URL 또는 파일 경로" className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-primary font-bold outline-none" />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-cta text-white font-black rounded-3xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-200 mt-4 text-lg">{editingResource ? '수정 사항 저장' : '리소스 업로드'}</button>
               </form>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isResourceSuccessModalOpen && lastSavedResource && (
           <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsResourceSuccessModalOpen(false)} className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" />
             <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="relative bg-white rounded-[40px] p-10 max-w-md w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-primary mb-2">저장 완료!</h3>
                <p className="text-secondary font-medium mb-8">리소스가 안전하게 보관되었습니다.</p>
                <div className="bg-gray-50 p-6 rounded-3xl text-left mb-8 border border-gray-100">
                   <div className="text-[10px] font-black text-cta uppercase mb-1">제목</div>
                   <div className="font-bold text-primary mb-4">{lastSavedResource.title}</div>
                   <div className="text-[10px] font-black text-cta uppercase mb-1">내용</div>
                   <div className="text-[14px] text-secondary font-medium leading-relaxed">{lastSavedResource.description || '상세 내용 없음'}</div>
                </div>
                <button onClick={() => setIsResourceSuccessModalOpen(false)} className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-gray-800 transition-colors">닫기</button>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Date Detail Modal */}
      <AnimatePresence>
        {isDayModalOpen && selectedDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsDayModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl z-10" onClick={e => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-primary font-heading tracking-tight mb-1">{selectedDate.toLocaleDateString([], { month: 'long', day: 'numeric' })}</h3>
                    <p className="text-[12px] font-black text-tertiary uppercase tracking-widest">Team Schedules</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openAddModal(selectedDate)} className="w-11 h-11 bg-cta text-white rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"><Plus className="w-6 h-6" /></button>
                    <button onClick={() => setIsDayModalOpen(false)} className="w-11 h-11 bg-gray-50 text-tertiary rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-all"><X className="w-6 h-6" /></button>
                  </div>
                </div>
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                  {getSchedulesForDate(selectedDate).map(s => (
                    <div key={s.id} className="p-5 bg-white rounded-[24px] border border-gray-100 hover:border-cta/20 transition-all group relative">
                       <div className="flex items-start justify-between mb-3">
                         <div className="px-2.5 py-1 bg-gray-50 text-cta text-[10px] font-black rounded-lg border border-gray-100">{new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                         <div className="flex items-center gap-2">
                           <button onClick={() => openEditModal(s)} className="p-1.5 text-tertiary hover:text-cta bg-gray-50 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3.5 h-3.5" /></button>
                           <button onClick={() => handleDeleteSchedule(s.id)} className="p-1.5 text-tertiary hover:text-red-500 bg-gray-50 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                       </div>
                       <h4 className="font-extrabold text-primary text-[16px] mb-2">{s.title}</h4>
                       {s.description && ( <p className="text-[13px] text-secondary font-medium leading-relaxed mb-3">{s.description}</p> )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Schedule Modal */}
      <AnimatePresence>
        {isAddModalOpen && selectedDate && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl z-20" onClick={e => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div><h3 className="text-xl font-black text-primary font-heading tracking-tight">{editingSchedule ? '일정 수정' : '새 일정 추가'}</h3><p className="text-[11px] font-bold text-tertiary mt-1">{selectedDate.toLocaleDateString()}</p></div>
                  <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 bg-gray-50 text-tertiary rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSaveSchedule} className="space-y-6">
                  <div><label className="block text-[13px] font-black text-tertiary mb-2 ml-1">일정 제목</label><input required type="text" value={timeForm.title} onChange={e => setTimeForm({...timeForm, title: e.target.value})} placeholder="회의 주제, 마감 기한 등" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-primary font-bold text-[15px] focus:outline-none focus:border-cta focus:ring-4 focus:ring-blue-50 transition-all" /></div>
                  <div><label className="block text-[13px] font-black text-tertiary mb-2 ml-1">상세 레이어</label><textarea value={timeForm.description} onChange={e => setTimeForm({...timeForm, description: e.target.value})} placeholder="상세 내용을 적어주세요." className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-primary font-bold h-24 resize-none focus:outline-none focus:border-cta focus:ring-4 focus:ring-blue-50 transition-all"></textarea></div>
                  <div><label className="block text-[13px] font-black text-tertiary mb-3 ml-1">시간 설정</label><div className="flex items-center gap-2"><div className="flex-1"><select value={timeForm.period} onChange={e => setTimeForm({...timeForm, period: e.target.value as any})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-primary font-black text-[15px] appearance-none focus:outline-none focus:border-cta hover:bg-white transition-all text-center"><option value="AM">오전</option><option value="PM">오후</option></select></div><div className="flex-1 relative"><select value={timeForm.hour} onChange={e => setTimeForm({...timeForm, hour: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-primary font-black text-[15px] appearance-none focus:outline-none focus:border-cta hover:bg-white transition-all text-center">{Array.from({length: 12}, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0')).map(h => (<option key={h} value={h}>{h}시</option>))}</select></div><div className="flex-1"><select value={timeForm.minute} onChange={e => setTimeForm({...timeForm, minute: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-primary font-black text-[15px] appearance-none focus:outline-none focus:border-cta hover:bg-white transition-all text-center text-center">{Array.from({length: 12}, (_, i) => String(i * 5).padStart(2, '0')).map(m => (<option key={m} value={m}>{m}분</option>))}</select></div></div></div>
                  <button type="submit" className="w-full py-4 bg-cta text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 mt-4 text-lg">{editingSchedule ? '수정 내용 저장' : '일정 생성하기'}</button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
