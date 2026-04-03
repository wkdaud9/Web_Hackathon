import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeams, getHackathons, getSubmissions, getUsers } from '../utils/api';
import type { Team, Hackathon, Submission, User } from '../types/models';
import { ShieldCheck, Users, Trophy, LayoutGrid, ChevronRight, FileText, Calendar, Inbox } from 'lucide-react';

export default function AdminDashboard() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedHackathonSlug, setSelectedHackathonSlug] = useState<string | null>(null);

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
    }, []);

    const filteredSubmissions = submissions.filter(s => s.hackathonSlug === selectedHackathonSlug);
    const activeHackathon = hackathons.find(h => h.slug === selectedHackathonSlug);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-[1400px] mx-auto pb-20 relative"
        >
            {/* Decorative Stitch Background Elements */}
            <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-cta/5 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-[0px] left-[-100px] w-[300px] h-[300px] bg-cta/5 rounded-full blur-[80px] -z-10" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 px-2">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-primary dark:bg-white rounded-[22px] flex items-center justify-center shadow-2xl shadow-primary/20 transition-transform hover:rotate-3">
                        <ShieldCheck className="w-7 h-7 text-white dark:text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black font-heading text-primary dark:text-white tracking-tighter mb-1.5 transition-colors">관리자 페이지</h1>
                        <p className="text-tertiary dark:text-neutral-400 font-bold text-[15px] transition-colors leading-none">운영 현황 통합 모니터링 시스템</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Simplified and Smaller */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
                {[
                    { title: '총 사용자', count: users.length, icon: Users },
                    { title: '등록된 해커톤', count: hackathons.length, icon: Trophy },
                    { title: '활성 팀', count: teams.length, icon: LayoutGrid },
                ].map((stat) => (
                    <motion.div
                        whileHover={{ y: -4 }}
                        key={stat.title}
                        className="bg-white dark:bg-neutral-800/80 backdrop-blur-sm p-6 rounded-[28px] border border-gray-100 dark:border-neutral-700 shadow-sm flex items-center gap-5 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-neutral-700 flex items-center justify-center shrink-0 border border-neutral-100 dark:border-neutral-600 transition-colors group-hover:bg-primary dark:group-hover:bg-white group-hover:border-primary">
                            <stat.icon className="w-5 h-5 text-primary dark:text-white transition-colors group-hover:text-white dark:group-hover:text-primary" />
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-tertiary dark:text-neutral-500 uppercase tracking-widest mb-0.5">{stat.title}</p>
                            <h4 className="text-2xl font-black text-primary dark:text-white font-heading tracking-tight">{stat.count.toLocaleString()}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: Hackathon List (1/3) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-neutral-800/60 backdrop-blur-sm rounded-[36px] border border-gray-100 dark:border-neutral-700 shadow-sm overflow-hidden transition-all">
                        <div className="px-8 py-7 border-b border-gray-50 dark:border-neutral-700 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-white dark:text-primary" />
                            </div>
                            <h3 className="text-[16px] font-black text-primary dark:text-white uppercase tracking-tight">해커톤 목록</h3>
                        </div>
                        <div className="p-3">
                            <div className="space-y-1">
                                {hackathons.map((hx) => (
                                    <button
                                        key={hx.slug}
                                        onClick={() => setSelectedHackathonSlug(hx.slug)}
                                        className={`w-full text-left p-5 rounded-[24px] flex items-center justify-between group transition-all ${selectedHackathonSlug === hx.slug
                                            ? 'bg-primary dark:bg-white shadow-xl shadow-primary/10 dark:shadow-none'
                                            : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'
                                            }`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`text-[14px] font-black transition-colors truncate ${selectedHackathonSlug === hx.slug ? 'text-white dark:text-primary' : 'text-primary dark:text-white'
                                                }`}>
                                                {hx.title}
                                            </p>
                                            <p className={`text-[11px] font-bold uppercase tracking-wider transition-colors mt-0.5 ${selectedHackathonSlug === hx.slug ? 'text-white/60 dark:text-primary/60' : 'text-tertiary dark:text-neutral-500'
                                                }`}>
                                                {hx.tags?.[0]}
                                            </p>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-all ${selectedHackathonSlug === hx.slug
                                            ? 'text-white dark:text-primary translate-x-1'
                                            : 'text-tertiary dark:text-neutral-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                                            }`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Registered Submissions (2/3) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-white dark:bg-neutral-800/60 backdrop-blur-sm rounded-[40px] border border-gray-100 dark:border-neutral-700 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        <div className="px-10 py-8 border-b border-gray-50 dark:border-neutral-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/10 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-cta flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">등록된 산출물</h3>
                                    <p className="text-[12px] font-bold text-tertiary dark:text-neutral-500 uppercase tracking-widest mt-0.5">
                                        {activeHackathon?.title || '데이터 없음'}
                                    </p>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-white dark:bg-neutral-700 rounded-full border border-gray-100 dark:border-neutral-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-cta animate-pulse" />
                                <span className="text-[12px] font-black text-primary dark:text-white uppercase tracking-tighter">
                                    Total {filteredSubmissions.length}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 md:p-10 flex-1">
                            {filteredSubmissions.length === 0 ? (
                                <div className="h-full py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-neutral-700 rounded-[20px] flex items-center justify-center mb-6">
                                        <Inbox className="w-8 h-8 text-neutral-200 dark:text-neutral-600" />
                                    </div>
                                    <h4 className="text-lg font-black text-primary dark:text-white mb-2">아직 제출된 산출물이 없습니다</h4>
                                    <p className="text-[14px] text-tertiary dark:text-neutral-500 font-bold max-w-[280px]">이 해커톤에 참여 중인 팀들의 결과물 제출을 기다리고 있습니다.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <AnimatePresence mode="popLayout">
                                        {filteredSubmissions.map((sub, idx) => (
                                            <motion.div
                                                key={sub.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-gray-50 dark:bg-neutral-900/50 p-6 rounded-[32px] border border-gray-100 dark:border-neutral-800 hover:border-cta/20 dark:hover:border-cta/30 transition-all group"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[11px] font-black text-cta uppercase tracking-widest bg-blue-50 dark:bg-cta/10 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-cta/20">
                                                        {new Date(sub.submittedAt).toLocaleDateString()}
                                                    </span>
                                                    <button className="text-tertiary hover:text-primary transition-colors">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <h4 className="text-[18px] font-black text-primary dark:text-white mb-2 tracking-tight group-hover:text-cta transition-colors">
                                                    {sub.teamName}
                                                </h4>
                                                <p className="text-[13.5px] text-secondary dark:text-neutral-400 font-bold line-clamp-2 leading-relaxed mb-6">
                                                    {sub.notes || '기재된 상세 내용이 없습니다.'}
                                                </p>
                                                <div className="flex items-center justify-between pt-5 border-t border-gray-200/50 dark:border-neutral-700">
                                                    <button className="text-[12px] font-black text-primary dark:text-white hover:underline">
                                                        파일 보기
                                                    </button>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        <span className="text-[11px] font-black text-emerald-500 uppercase">Registered</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
