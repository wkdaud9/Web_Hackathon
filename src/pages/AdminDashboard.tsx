import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeams, getHackathons, getSubmissions, getUsers, createHackathon, createHackathonDetail, updateHackathon, updateHackathonDetail, getHackathonDetail } from '../utils/api';
import type { Team, Hackathon, Submission, User, HackathonDetail } from '../types/models';
import {
  ShieldCheck,
  Users,
  Activity,
  Database,
  Search,
  ArrowUpRight,
  LayoutGrid,
  Plus,
  Settings,
  FileText,
  Download,
  Calendar,
  Award,
  Gavel,
  FileCheck,
  HelpCircle,
  Tag,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';

const formatPrice = (val: string) => {
  const num = val.replace(/[^0-9]/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('ko-KR').format(parseInt(num));
};

function CustomCalendar({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isOpen]);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const handleSelect = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(selected.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const days = [];
  const totalDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const startDay = firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="block text-[11px] font-black text-tertiary dark:text-neutral-500 uppercase tracking-widest pl-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-700 rounded-2xl pl-11 pr-5 py-4 text-sm font-bold text-primary dark:text-white outline-none flex items-center text-left hover:border-blue-600 transition-all shadow-sm"
      >
        <Calendar className="absolute left-4 w-4 h-4 text-blue-600" />
        {value ? new Date(value).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '날짜 선택'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 top-full mt-3 z-[120] bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-[32px] p-6 shadow-2xl w-[320px] transition-colors"
            >
              <div className="flex justify-between items-center mb-6">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-tertiary" />
                </button>
                <span className="text-[15px] font-black text-primary dark:text-white transition-colors">
                  {viewDate.getFullYear()}년 {monthNames[viewDate.getMonth()]}
                </span>
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-tertiary" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["일", "월", "화", "수", "목", "금", "토"].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-tertiary dark:text-neutral-500 uppercase tracking-widest py-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => d ? (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(d)}
                    className={`h-9 w-9 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all ${value === new Date(viewDate.getFullYear(), viewDate.getMonth(), d).toISOString().split('T')[0]
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-secondary dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600'
                      }`}
                  >
                    {d}
                  </button>
                ) : <div key={i} className="h-9 w-9" />)}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedHackathonSlug, setSelectedHackathonSlug] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'submissions' | 'users' | 'teams'>('submissions');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Create Hackathon Wizard State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditSelectorOpen, setIsEditSelectorOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    status: 'upcoming' as 'ongoing' | 'upcoming' | 'ended',
    startAt: '',
    endAt: '',
    registrationStartAt: '',
    registrationEndAt: '',
    submissionDeadlineAt: '',
    prizes: [{ id: '1', title: '', prize: '', description: '' }],
    judges: [{ id: '1', name: '', role: '', company: '' }],
    rules: '',
    faqs: [{ id: '1', question: '', answer: '' }],
    tags: '',
    thumbnailUrl: ''
  });

  const loadData = () => {
    const hxs = getHackathons() || [];
    setTeams(getTeams() || []);
    setHackathons(hxs);
    setSubmissions(getSubmissions() || []);
    setUsers(getUsers() || []);

    if (hxs.length > 0 && !selectedHackathonSlug) {
      setSelectedHackathonSlug(hxs[0].slug);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage-update', loadData);
    return () => window.removeEventListener('storage-update', loadData);
  }, [selectedHackathonSlug]);

  const sortedHackathons = useMemo(() => {
    const STATUS_ORDER: Record<string, number> = { 'ongoing': 1, 'upcoming': 2, 'ended': 3 };
    return [...hackathons].sort((a, b) => {
      if (a.slug === 'daker-handover-2026-03') return -1;
      if (b.slug === 'daker-handover-2026-03') return 1;
      return (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
    });
  }, [hackathons]);

  const activeHackathon = useMemo(() =>
    hackathons.find(h => h.slug === selectedHackathonSlug),
    [hackathons, selectedHackathonSlug]
  );

  const filteredSubmissions = useMemo(() =>
    submissions.filter(s =>
      s.hackathonSlug === selectedHackathonSlug &&
      ((s.teamName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
    ),
    [submissions, selectedHackathonSlug, searchTerm]
  );

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.role !== 'operator' &&
      ((u.nickname?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
    ),
    [users, searchTerm]
  );

  const filteredTeams = useMemo(() =>
    teams.filter(t =>
      (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (t.teamCode?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ),
    [teams, searchTerm]
  );

  const displayUserCount = useMemo(() => users.filter(u => u.role !== 'operator').length, [users]);

  const handleSaveHackathon = () => {
    const slug = formData.slug || formData.title.toLowerCase().replace(/ /g, '-');

    // 1. Create main hackathon object
    const hackathonData: Hackathon = {
      slug,
      title: formData.title,
      description: formData.description,
      status: formData.status,
      tags: formData.tags.split(',').map(t => t.trim()),
      thumbnailUrl: formData.thumbnailUrl || undefined,
      period: {
        registrationStartAt: formData.registrationStartAt || formData.startAt,
        registrationEndAt: formData.registrationEndAt || formData.endAt,
        startAt: formData.startAt,
        endAt: formData.endAt,
        submissionDeadlineAt: formData.submissionDeadlineAt || formData.endAt
      }
    };

    // 2. Create detail object matching models.ts structure
    const hackathonDetailData: HackathonDetail = {
      slug,
      title: formData.title,
      sections: {
        overview: {
          summary: formData.description
        },
        info: {
          notice: [
            "심사위원의 결정은 최종적이며 번복될 수 없습니다.",
            "타인의 저작권을 침해하는 결과물은 수상이 취소될 수 있습니다.",
            "대회 기간 중 생성된 코드는 공개 또는 비공개 여부를 선택할 수 있습니다."
          ]
        },
        eval: {
          description: formData.rules || "평가 기준은 추후 공지될 예정입니다.",
          scoreDisplay: {
            label: "종합 평가",
            breakdown: [
              { label: "창의성", weightPercent: 40 },
              { label: "완성도", weightPercent: 30 },
              { label: "기술력", weightPercent: 30 }
            ]
          }
        },
        schedule: {
          milestones: [
            { name: "참가 접수 시작", at: formData.registrationStartAt || formData.startAt },
            { name: "참가 접수 마감", at: formData.registrationEndAt || formData.endAt },
            { name: "대회 공식 개막", at: formData.startAt },
            { name: "최종 결과물 제출 마감", at: formData.submissionDeadlineAt || formData.endAt },
            { name: "심사 및 결과 발표", at: formData.endAt }
          ]
        },
        prize: {
          items: formData.prizes.map(p => ({
            place: p.title,
            amountKRW: parseInt((p.prize || '0').replace(/[^0-9]/g, '')) || 0
          }))
        },
        submit: {
          guide: [
            "동영상 시연 파일 (2분 이내)",
            "GitHub 저장소 URL (Public 권장)",
            "프로젝트 소개용 PPT 또는 PDF (6페이지 이내)"
          ]
        }
      }
    };

    if (isEditMode) {
      updateHackathon(hackathonData);
      updateHackathonDetail(hackathonDetailData);
    } else {
      createHackathon(hackathonData);
      createHackathonDetail(hackathonDetailData);
    }

    setIsCreateModalOpen(false);
    resetForm();
    loadData();
  };

  const startEditHackathon = (slug: string) => {
    const hx = hackathons.find(h => h.slug === slug);
    const detail = getHackathonDetail(slug);
    if (!hx) return;

    setFormData({
      title: hx.title,
      slug: hx.slug,
      description: hx.description,
      status: hx.status,
      startAt: hx.period?.startAt || '',
      endAt: hx.period?.endAt || '',
      registrationStartAt: hx.period?.registrationStartAt || '',
      registrationEndAt: hx.period?.registrationEndAt || '',
      submissionDeadlineAt: hx.period?.submissionDeadlineAt || '',
      prizes: detail?.sections?.prize?.items?.map((it, idx) => ({
        id: idx.toString(),
        title: it.place,
        prize: it.amountKRW.toLocaleString(),
        description: ''
      })) || [{ id: '1', title: '', prize: '', description: '' }],
      judges: [{ id: '1', name: '', role: '', company: '' }], // Mock/Default since not in detail
      rules: detail?.sections.eval?.description || '',
      faqs: [{ id: '1', question: '', answer: '' }], // Mock/Default
      tags: hx.tags.join(', '),
      thumbnailUrl: hx.thumbnailUrl || ''
    });

    setIsEditMode(true);
    setIsEditSelectorOpen(false);
    setIsCreateModalOpen(true);
    setCreateStep(1);
  };

  const resetForm = () => {
    setFormData({
      title: '', slug: '', description: '', status: 'upcoming',
      startAt: '', endAt: '', registrationStartAt: '', registrationEndAt: '', submissionDeadlineAt: '',
      prizes: [{ id: '1', title: '', prize: '', description: '' }],
      judges: [{ id: '1', name: '', role: '', company: '' }],
      rules: '',
      faqs: [{ id: '1', question: '', answer: '' }],
      tags: '', thumbnailUrl: ''
    });
    setCreateStep(1);
    setIsEditMode(false);
    setIsStatusDropdownOpen(false);
  };

  const renderStepContent = () => {
    switch (createStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-lg font-black text-primary dark:text-white mb-6">
              <Activity className="w-5 h-5 text-blue-600" /> 기본 정보 입력
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-black text-tertiary uppercase tracking-widest mb-2">해커톤 제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl px-5 py-4 focus:border-blue-600 outline-none text-primary dark:text-white font-bold transition-all"
                  placeholder="예: 2026 AI 모델링 해커톤"
                />
              </div>
              <div>
                <label className="block text-[12px] font-black text-tertiary uppercase tracking-widest mb-2">슬러그 (URL 주소)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl px-5 py-4 focus:border-blue-600 outline-none text-primary dark:text-white font-bold transition-all"
                  placeholder="예: ai-modeling-2026"
                />
              </div>
              <div>
                <label className="block text-[12px] font-black text-tertiary uppercase tracking-widest mb-2">상태</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl px-5 py-4 focus:border-blue-600 outline-none text-primary dark:text-white font-bold transition-all flex items-center justify-between group hover:border-blue-500"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        formData.status === 'ongoing' ? 'bg-blue-600 animate-pulse outline outline-4 outline-blue-600/20' : 
                        formData.status === 'upcoming' ? 'bg-white border border-blue-600' : 
                        'bg-neutral-600'
                      }`} />
                      <span>{formData.status === 'ongoing' ? '진행 중' : formData.status === 'upcoming' ? '시작 전' : '종료됨'}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-tertiary transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 top-full mt-3 z-50 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-3xl p-3 shadow-2xl w-full transition-colors overflow-hidden"
                        >
                          <div className="space-y-1">
                            {[
                              { id: 'upcoming', label: '시작 전', color: 'bg-white border border-blue-600' },
                              { id: 'ongoing', label: '진행 중', color: 'bg-blue-600 outline outline-4 outline-blue-600/20' },
                              { id: 'ended', label: '종료됨', color: 'bg-neutral-600' }
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, status: opt.id as any });
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center gap-4 ${
                                  formData.status === opt.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800' 
                                    : 'hover:bg-gray-50 dark:hover:bg-neutral-700 border border-transparent'
                                }`}
                              >
                                <div className={`w-3 h-3 rounded-full shrink-0 ${opt.color} ${opt.id === 'ongoing' ? 'animate-pulse' : ''}`} />
                                <p className={`text-sm font-black ${formData.status === opt.id ? 'text-blue-600 dark:text-blue-400' : 'text-primary dark:text-white'}`}>{opt.label}</p>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-black text-tertiary uppercase tracking-widest mb-2">간략한 설명</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl px-5 py-4 focus:border-blue-600 outline-none text-primary dark:text-white font-bold transition-all min-h-[120px]"
                  placeholder="해커톤에 대한 주요 내용을 입력하세요."
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-lg font-black text-primary dark:text-white mb-6">
              <Calendar className="w-5 h-5 text-blue-600" /> 일정 설정
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <CustomCalendar
                label="참가 지원 시작"
                value={formData.registrationStartAt}
                onChange={val => setFormData({ ...formData, registrationStartAt: val })}
              />
              <CustomCalendar
                label="참가 지원 마감"
                value={formData.registrationEndAt}
                onChange={val => setFormData({ ...formData, registrationEndAt: val })}
              />
              <CustomCalendar
                label="본 대회 시작"
                value={formData.startAt}
                onChange={val => setFormData({ ...formData, startAt: val })}
              />
              <CustomCalendar
                label="본 대회 종료"
                value={formData.endAt}
                onChange={val => setFormData({ ...formData, endAt: val })}
              />
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-neutral-800 transition-colors">
              <CustomCalendar
                label="최종 결과물 제출 마감 기한"
                value={formData.submissionDeadlineAt}
                onChange={val => setFormData({ ...formData, submissionDeadlineAt: val })}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-lg font-black text-primary dark:text-white mb-6">
              <Award className="w-5 h-5 text-blue-600" /> 상금 정보
            </h4>
            {formData.prizes.map((p, idx) => (
              <div key={p.id} className="p-6 bg-gray-50 dark:bg-neutral-900 rounded-[28px] border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-black text-blue-600 uppercase">순위 #{idx + 1}</span>
                  {idx > 0 && <button onClick={() => setFormData({ ...formData, prizes: formData.prizes.filter(it => it.id !== p.id) })} className="text-red-500 text-xs font-bold">삭제</button>}
                </div>
                <input type="text" placeholder="순위명 (예: 대상)" value={p.title} onChange={e => {
                  const newP = [...formData.prizes];
                  newP[idx].title = e.target.value;
                  setFormData({ ...formData, prizes: newP });
                }} className="w-full bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-primary dark:text-white outline-none focus:border-blue-600 transition-all" />
                <div className="relative">
                  <input type="text" placeholder="예: 50,000,000" value={p.prize} onChange={e => {
                    const newP = [...formData.prizes];
                    newP[idx].prize = formatPrice(e.target.value);
                    setFormData({ ...formData, prizes: newP });
                  }} className="w-full bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-primary dark:text-white outline-none focus:border-blue-600 transition-all" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-tertiary uppercase tracking-widest">KRW (자동 콤마 단위)</span>
                </div>
              </div>
            ))}
            <button onClick={() => setFormData({ ...formData, prizes: [...formData.prizes, { id: Date.now().toString(), title: '', prize: '', description: '' }] })} className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-2xl text-tertiary font-bold text-sm hover:border-blue-400 transition-all">+ 상금 항목 추가</button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-lg font-black text-primary dark:text-white mb-6">
              <Gavel className="w-5 h-5 text-blue-600" /> 심사위원 구성
            </h4>
            {formData.judges.map((j, idx) => (
              <div key={j.id} className="p-6 bg-gray-50 dark:bg-neutral-900 rounded-[28px] border border-gray-200 dark:border-neutral-700 grid grid-cols-2 gap-3">
                <input type="text" placeholder="이름" value={j.name} onChange={e => {
                  const newJ = [...formData.judges];
                  newJ[idx].name = e.target.value;
                  setFormData({ ...formData, judges: newJ });
                }} className="bg-white dark:bg-neutral-800 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                <input type="text" placeholder="소속" value={j.company} onChange={e => {
                  const newJ = [...formData.judges];
                  newJ[idx].company = e.target.value;
                  setFormData({ ...formData, judges: newJ });
                }} className="bg-white dark:bg-neutral-800 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                <input type="text" placeholder="직함" value={j.role} onChange={e => {
                  const newJ = [...formData.judges];
                  newJ[idx].role = e.target.value;
                  setFormData({ ...formData, judges: newJ });
                }} className="col-span-2 bg-white dark:bg-neutral-800 border-none rounded-xl px-4 py-3 text-sm font-bold" />
              </div>
            ))}
            <button onClick={() => setFormData({ ...formData, judges: [...formData.judges, { id: Date.now().toString(), name: '', role: '', company: '' }] })} className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-2xl text-tertiary font-bold text-sm hover:border-blue-400 transition-all">+ 심사위원 추가</button>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-lg font-black text-primary dark:text-white mb-6">
              <FileCheck className="w-5 h-5 text-blue-600" /> 가이드라인 및 규칙
            </h4>
            <textarea
              value={formData.rules}
              onChange={e => setFormData({ ...formData, rules: e.target.value })}
              className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl px-5 py-4 focus:border-blue-600 outline-none text-primary dark:text-white font-bold transition-all min-h-[300px]"
              placeholder="대회 참여 규칙 및 최종 결과물 제출 규격 등을 입력하세요."
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-lg font-black text-primary dark:text-white mb-6">
              <HelpCircle className="w-5 h-5 text-blue-600" /> FAQ (자주 묻는 질문)
            </h4>
            {formData.faqs.map((f, idx) => (
              <div key={f.id} className="space-y-3">
                <input type="text" placeholder="질문" value={f.question} onChange={e => {
                  const newF = [...formData.faqs];
                  newF[idx].question = e.target.value;
                  setFormData({ ...formData, faqs: newF });
                }} className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold" />
                <textarea placeholder="답변" value={f.answer} onChange={e => {
                  const newF = [...formData.faqs];
                  newF[idx].answer = e.target.value;
                  setFormData({ ...formData, faqs: newF });
                }} className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold min-h-[80px]" />
              </div>
            ))}
            <button onClick={() => setFormData({ ...formData, faqs: [...formData.faqs, { id: Date.now().toString(), question: '', answer: '' }] })} className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-2xl text-tertiary font-bold text-sm hover:border-blue-400 transition-all">+ FAQ 추가</button>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-lg font-black text-primary dark:text-white mb-6">
              <Tag className="w-5 h-5 text-blue-600" /> 태그 및 썸네일
            </h4>
            <div>
              <label className="block text-[12px] font-black text-tertiary uppercase tracking-widest mb-2">태그 (쉼표로 구분)</label>
              <input type="text" placeholder="예: AI, Python, 빅데이터" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl px-5 py-4 focus:border-blue-600 outline-none text-primary dark:text-white font-bold" />
            </div>
            <div>
              <label className="block text-[12px] font-black text-tertiary uppercase tracking-widest mb-2">썸네일 이미지 URL</label>
              <input type="text" placeholder="https://..." value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl px-5 py-4 focus:border-blue-600 outline-none text-primary dark:text-white font-bold" />
            </div>
            <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-3xl">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold leading-relaxed">마지막 단계입니다. 입력하신 정보가 모두 올바른지 다시 한번 확인해 주세요.<br />생성 후에도 수정이 가능합니다.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-transparent transition-colors duration-300">
      {/* Header matching CampPage and RankingsPage */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 px-6 py-4 transition-colors duration-300">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black text-primary dark:text-white tracking-tighter uppercase transition-colors">해커톤 관리</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group flex-1 md:flex-none h-11 transition-all">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary dark:text-white transition-colors" />
              <input
                type="text"
                placeholder={
                  viewMode === 'users' ? "사용자 검색 (닉네임/이메일)..." :
                    viewMode === 'teams' ? "팀 검색 (팀명/코드)..." :
                      "결과물 검색 (팀명/메모)..."
                }
                className="bg-gray-50 dark:bg-neutral-800 text-sm font-medium rounded-full w-full md:w-64 h-full pl-11 pr-6 outline-none border border-gray-100 dark:border-neutral-700 focus:bg-white dark:focus:bg-neutral-900 focus:border-cta transition-all text-primary dark:text-white block"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary dark:bg-white text-white dark:text-primary px-5 h-11 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shrink-0 shadow-md shadow-primary/10"
              title="새로운 해커톤 추가"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline font-bold text-[14px]">해커톤 생성</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setIsEditSelectorOpen(!isEditSelectorOpen)}
                className={`bg-gray-100 dark:bg-neutral-800 text-tertiary dark:text-neutral-400 w-11 h-11 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all shrink-0 flex items-center justify-center ${isEditSelectorOpen ? 'ring-2 ring-blue-600' : ''}`}
                title="해커톤 수정"
              >
                <Settings className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {isEditSelectorOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsEditSelectorOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-3 z-50 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-3xl p-4 shadow-2xl w-64 transition-colors"
                    >
                      <p className="text-[11px] font-black text-tertiary dark:text-neutral-500 uppercase tracking-widest px-3 mb-3">수정할 해커톤 선택</p>
                      <div className="space-y-1 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                        {hackathons.map(hx => (
                          <button
                            key={hx.slug}
                            onClick={() => startEditHackathon(hx.slug)}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 text-sm font-bold text-primary dark:text-white transition-colors truncate"
                          >
                            {hx.title}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-6 py-10 lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Left Col: Hackathon Selector & Quick Stats */}
        <div className="lg:col-span-4 mb-10 lg:mb-0">
          <div className="bg-gray-50/50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-700/50 rounded-[48px] p-8 pb-12 transition-colors min-h-[800px] sticky top-28">
            <div className="flex items-center gap-3 mb-10 justify-center text-primary dark:text-white transition-colors">
              <ShieldCheck className="w-8 h-8 text-primary dark:text-white transition-colors" />
              <h2 className="text-2xl font-black tracking-tight">시스템 현황</h2>
            </div>

            {/* Quick Stats Grid inside left col */}
            <div className="grid grid-cols-2 gap-4 mb-12">
              <button
                onClick={() => { setViewMode('users'); setSearchTerm(''); }}
                className={`p-5 rounded-[24px] border transition-all text-center group ${viewMode === 'users'
                  ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20'
                  : 'bg-white dark:bg-neutral-800/80 border-gray-100 dark:border-neutral-700 hover:border-cta/30 shadow-sm'
                  }`}
              >
                <Users className={`w-5 h-5 mx-auto mb-2 transition-colors ${viewMode === 'users' ? 'text-white' : 'text-tertiary dark:text-neutral-500'}`} />
                <h4 className={`text-2xl font-black font-heading tracking-tight mb-1 transition-colors ${viewMode === 'users' ? 'text-white' : 'text-primary dark:text-white'}`}>{displayUserCount.toLocaleString()}</h4>
                <p className={`text-[11px] font-black uppercase tracking-widest transition-colors ${viewMode === 'users' ? 'text-white/70' : 'text-tertiary dark:text-neutral-500'}`}>가입 유저</p>
              </button>

              <button
                onClick={() => { setViewMode('teams'); setSearchTerm(''); }}
                className={`p-5 rounded-[24px] border transition-all text-center group ${viewMode === 'teams'
                  ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20'
                  : 'bg-white dark:bg-neutral-800/80 border-gray-100 dark:border-neutral-700 hover:border-cta/30 shadow-sm'
                  }`}
              >
                <LayoutGrid className={`w-5 h-5 mx-auto mb-2 transition-colors ${viewMode === 'teams' ? 'text-white' : 'text-tertiary dark:text-neutral-500'}`} />
                <h4 className={`text-2xl font-black font-heading tracking-tight mb-1 transition-colors ${viewMode === 'teams' ? 'text-white' : 'text-primary dark:text-white'}`}>{teams.length.toLocaleString()}</h4>
                <p className={`text-[11px] font-black uppercase tracking-widest transition-colors ${viewMode === 'teams' ? 'text-white/70' : 'text-tertiary dark:text-neutral-500'}`}>참여 중인 팀</p>
              </button>
            </div>

            <div className="pt-6 border-t border-gray-200/50 dark:border-neutral-700/50 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[13px] font-black text-primary dark:text-white uppercase tracking-wider pl-2 transition-colors">운영 중인 해커톤</h3>
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse mr-2" />
              </div>
              <div className="space-y-3">
                {sortedHackathons.map((hx) => (
                  <button
                    key={hx.slug}
                    onClick={() => {
                      setSelectedHackathonSlug(hx.slug);
                      setViewMode('submissions');
                      setSearchTerm('');
                    }}
                    className={`w-full text-left p-3.5 rounded-[20px] flex items-center gap-3 transition-all group border ${selectedHackathonSlug === hx.slug && viewMode === 'submissions'
                      ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20 dark:shadow-none'
                      : 'bg-white dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 hover:border-cta/30 transition-colors'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 border transition-all ${selectedHackathonSlug === hx.slug && viewMode === 'submissions'
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-gray-50 dark:bg-neutral-700 border-gray-100 dark:border-neutral-600 text-primary dark:text-white transition-colors'
                      }`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] font-black truncate focus:outline-none transition-colors ${selectedHackathonSlug === hx.slug && viewMode === 'submissions' ? 'text-white' : 'text-primary dark:text-white group-hover:text-cta'
                        }`}>
                        {hx.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm transition-colors ${selectedHackathonSlug === hx.slug && viewMode === 'submissions'
                          ? 'bg-white/20 text-white border border-white/30'
                          : hx.status === 'ongoing' ? 'bg-blue-600 text-white' :
                            hx.status === 'upcoming' ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50' :
                              'bg-neutral-600 text-white'
                          }`}>
                          {hx.status === 'ongoing' ? '진행 중' : hx.status === 'upcoming' ? '시작 전' : '종료됨'}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className={`w-4 h-4 shrink-0 transition-all ${selectedHackathonSlug === hx.slug && viewMode === 'submissions' ? 'text-white opacity-100' : 'text-tertiary opacity-0 group-hover:opacity-100'
                      }`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Content Area */}
        <div className="lg:col-span-8">
          <div className="space-y-4">
            <div className="p-8 md:p-12 border border-gray-100 dark:border-neutral-700/50 rounded-[48px] bg-gray-50/30 dark:bg-neutral-800/40 min-h-[800px]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                  <h3 className="text-3xl font-black text-primary dark:text-white tracking-tighter mb-2 transition-colors">
                    {viewMode === 'users' ? '전체 사용자 목록' :
                      viewMode === 'teams' ? '해커톤 참여 팀 목록' :
                        '제출된 산출물'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-tertiary dark:text-neutral-400 transition-colors uppercase tracking-widest">
                      {viewMode === 'users' ? '가입 유저 관리' :
                        viewMode === 'teams' ? '참여 중인 팀 관리' :
                          (activeHackathon?.title || '해커톤 선택')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 px-6 py-4 rounded-3xl shadow-sm transition-colors">
                  {viewMode === 'users' ? <Users className="w-5 h-5 text-tertiary dark:text-neutral-500" /> :
                    viewMode === 'teams' ? <LayoutGrid className="w-5 h-5 text-tertiary dark:text-neutral-500" /> :
                      <Database className="w-5 h-5 text-tertiary dark:text-neutral-500" />}
                  <div>
                    <p className="text-[11px] font-black text-tertiary dark:text-neutral-500 uppercase tracking-widest transition-colors">
                      {viewMode === 'users' ? '가입 인원' :
                        viewMode === 'teams' ? '생성된 팀' :
                          '전체 건수'}
                    </p>
                    <p className="text-xl font-black text-primary dark:text-white leading-none mt-0.5 transition-colors">
                      {viewMode === 'users' ? filteredUsers.length :
                        viewMode === 'teams' ? filteredTeams.length :
                          filteredSubmissions.length}
                    </p>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {viewMode === 'submissions' ? (
                  <motion.div
                    key="submissions-list"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {filteredSubmissions.length === 0 ? (
                      <div className="py-24 flex flex-col items-center justify-center text-center bg-white dark:bg-neutral-800/80 rounded-[40px] border border-gray-100 dark:border-neutral-700 shadow-sm transition-colors">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-neutral-900 rounded-[32px] flex items-center justify-center mb-8 shadow-inner border border-gray-100 dark:border-neutral-800">
                          <Activity className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                        </div>
                        <h4 className="text-xl font-black text-primary dark:text-white mb-2">산출물이 없습니다</h4>
                        <p className="text-[14px] text-tertiary dark:text-neutral-500 font-bold max-w-sm">선택한 해커톤에 제출된 내역이 아직 없습니다.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredSubmissions.map((sub) => (
                          <motion.button
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={sub.id}
                            onClick={() => setSelectedSubmission(sub)}
                            className="bg-white dark:bg-neutral-800/60 transition-all duration-300 p-6 rounded-[28px] border border-gray-100 dark:border-neutral-700 flex flex-col gap-4 relative overflow-hidden group hover:border-blue-500/50 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left"
                          >
                            <div className="flex justify-between items-start">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-cta/10 flex items-center justify-center text-cta border border-blue-100 dark:border-cta/20 transition-colors">
                                <Users className="w-5 h-5" />
                              </div>
                              <div className="text-[11px] font-black text-tertiary dark:text-neutral-500 font-mono tracking-tighter transition-colors">
                                {new Date(sub.submittedAt).toLocaleDateString()}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-[17px] font-black text-primary dark:text-white transition-colors mb-1 truncate leading-tight transition-colors">{sub.teamName}</h4>
                              <p className="text-[12px] text-tertiary dark:text-neutral-500 font-bold uppercase tracking-widest transition-colors">제출 확인됨</p>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-neutral-700/50 transition-colors">
                              <span className="text-[12px] font-black text-blue-600 dark:text-blue-400 transition-colors">자세히 보기</span>
                              <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : viewMode === 'users' ? (
                  <motion.div
                    key="users-list"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-[32px] overflow-hidden shadow-sm transition-colors"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50/50 dark:bg-neutral-700/30 text-[12px] font-black text-tertiary dark:text-neutral-500 uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700 transition-colors">
                            <th className="px-8 py-5">닉네임 / 이메일</th>
                            <th className="px-8 py-5 text-right">포인트 합계</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-700 transition-colors">
                          {filteredUsers.map((u) => (
                            <tr key={u.id} className="group hover:bg-gray-50/50 dark:hover:bg-neutral-700/20 transition-colors">
                              <td className="px-8 py-5 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-cta/10 flex items-center justify-center text-cta font-black text-[14px] transition-colors">
                                    {u.nickname?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-[14px] font-black text-primary dark:text-white transition-colors">{u.nickname}</p>
                                    <p className="text-[12px] font-bold text-tertiary dark:text-neutral-500 transition-colors">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-right text-[14px] font-black text-primary dark:text-white transition-colors">
                                {u.points.toLocaleString()} <span className="text-[11px] text-tertiary font-bold ml-0.5 transition-colors">점</span>
                              </td>
                            </tr>
                          ))}
                          {filteredUsers.length === 0 && (
                            <tr>
                              <td colSpan={2} className="px-8 py-20 text-center text-tertiary dark:text-neutral-500 font-bold transition-colors">검색된 유저가 없습니다.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="teams-list"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-[32px] overflow-hidden shadow-sm transition-colors"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50/50 dark:bg-neutral-700/30 text-[12px] font-black text-tertiary dark:text-neutral-500 uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700 transition-colors">
                            <th className="px-8 py-5">팀명</th>
                            <th className="px-8 py-5">해커톤 이름</th>
                            <th className="px-8 py-5">팀장</th>
                            <th className="px-8 py-5 text-right">멤버 수</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-700 transition-colors">
                          {filteredTeams.map((t) => {
                            const hackathon = hackathons.find(h => h.slug === t.hackathonSlug);
                            return (
                              <tr key={t.teamCode} className="group hover:bg-gray-50/50 dark:hover:bg-neutral-700/20 transition-colors">
                                <td className="px-8 py-5 transition-colors">
                                  <p className="text-[14px] font-black text-primary dark:text-white transition-colors">{t.name}</p>
                                </td>
                                <td className="px-8 py-5 transition-colors">
                                  <p className="text-[14px] font-bold text-secondary dark:text-neutral-300 transition-colors truncate max-w-[220px]" title={hackathon?.title || t.hackathonSlug}>
                                    {hackathon?.title || t.hackathonSlug}
                                  </p>
                                </td>
                                <td className="px-8 py-5 transition-colors">
                                  <p className={`font-bold text-secondary dark:text-neutral-300 transition-colors whitespace-nowrap ${t.leaderName && t.leaderName.length >= 4 ? 'text-[12.5px]' : 'text-[14px]'
                                    }`}>
                                    {t.leaderName || '미지정'}
                                  </p>
                                </td>
                                <td className="px-8 py-5 text-right text-[14px] font-black text-primary dark:text-white transition-colors">
                                  {t.memberCount} <span className="text-[11px] text-tertiary font-bold ml-0.5 transition-colors">명</span>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredTeams.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-8 py-20 text-center text-tertiary dark:text-neutral-500 font-bold transition-colors">검색된 팀이 없습니다.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <div className="h-40" />

      {/* Submission Detail Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSubmission(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-[48px] shadow-2xl overflow-hidden border border-gray-100 dark:border-neutral-700 transition-colors"
            >
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[24px] bg-blue-50 dark:bg-cta/10 flex items-center justify-center text-cta shadow-sm border border-blue-100 dark:border-cta/20 transition-colors">
                      <Users className="w-8 h-8 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-[24px] font-black text-primary dark:text-white leading-tight tracking-tight mb-1 transition-colors">{selectedSubmission.teamName}</h3>
                      <p className="text-[14px] text-tertiary dark:text-neutral-500 font-bold font-mono transition-colors">
                        {new Date(selectedSubmission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="p-3 bg-gray-100 dark:bg-neutral-700/50 text-tertiary dark:text-neutral-400 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all font-black text-xl w-12 h-12 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-10">
                  <div>
                    <h4 className="text-[13px] font-black text-primary dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors">
                      <div className="w-1 h-3 bg-blue-600 rounded-full" />
                      상세 메모 내역
                    </h4>
                    <div className="bg-gray-50/50 dark:bg-neutral-900/40 p-8 rounded-[32px] border border-gray-100 dark:border-neutral-700/50 transition-colors">
                      <p className="text-secondary dark:text-neutral-300 transition-colors font-medium text-[16px] leading-[1.8] italic whitespace-pre-wrap">
                        "{selectedSubmission.notes || '상세 메모 내역이 없습니다.'}"
                      </p>
                    </div>
                  </div>

                  {selectedSubmission.fileName && (
                    <div>
                      <h4 className="text-[13px] font-black text-primary dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors">
                        <div className="w-1 h-3 bg-blue-600 rounded-full" />
                        제출된 파일
                      </h4>
                      <div className="flex items-center gap-4 text-primary dark:text-white font-black text-[15px] bg-white dark:bg-neutral-800 p-5 rounded-[20px] border border-gray-100 dark:border-neutral-700 transition-colors">
                        <FileText className="w-6 h-6 text-blue-600 transition-colors" />
                        <span className="truncate">{selectedSubmission.fileName}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <a
                      href={selectedSubmission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black text-[16px] flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/10"
                    >
                      <Download className="w-5 h-5" /> 파일 다운로드
                    </a>
                    {selectedSubmission.githubUrl && (
                      <a
                        href={selectedSubmission.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-5 bg-gray-900 dark:bg-white text-white dark:text-primary rounded-[24px] font-black text-[16px] flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-black/10"
                      >
                        Github 저장소 방문
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Hackathon Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-[48px] shadow-2xl border border-gray-100 dark:border-neutral-700 overflow-hidden flex flex-col max-h-[90vh]">

              {/* Modal Header */}
              <div className="px-10 py-8 border-b border-gray-100 dark:border-neutral-700 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-900/40">
                <div>
                  <h3 className="text-xl font-black text-primary dark:text-white tracking-tighter transition-colors">{isEditMode ? '해커톤 상세 정보 수정' : '새로운 해커톤 생성'}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest transition-colors">단계 {createStep} / 7</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map(s => (
                        <div key={s} className={`w-4 h-1 rounded-full transition-all ${s <= createStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-neutral-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 text-tertiary flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {renderStepContent()}
              </div>

              {/* Modal Footer */}
              <div className="px-10 py-8 border-t border-gray-100 dark:border-neutral-700 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-900/40">
                <button
                  onClick={() => createStep > 1 && setCreateStep(createStep - 1)}
                  className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all ${createStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-primary dark:text-white hover:bg-gray-50'}`}
                >
                  <ChevronLeft className="w-4 h-4" /> 이전으로
                </button>

                {createStep < 7 ? (
                  <button
                    onClick={() => setCreateStep(createStep + 1)}
                    className="flex items-center gap-2 px-8 py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-2xl font-black text-sm hover:opacity-90 shadow-lg shadow-primary/10 transition-all"
                  >
                    다음 단계 <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveHackathon}
                    className="flex items-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all"
                  >
                    {isEditMode ? '수정사항 저장하기' : '최종 생성하기'} <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
