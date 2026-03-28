import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Users, Target, Search, Filter, ChevronRight, Award, Trophy, Zap, ArrowUpRight } from 'lucide-react';
import Dropdown from '../components/Dropdown';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { getHackathons, getTeams } from '../utils/api';
import type { Hackathon, Team } from '../types/models';

const STATUS_META: Record<string, { label: string; color: string; overlay: string }> = {
  ongoing: { 
    label: '진행 중', 
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    overlay: 'from-emerald-950/80 via-emerald-900/40 to-transparent'
  },
  upcoming: { 
    label: '시작 전', 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    overlay: 'from-blue-950/80 via-blue-900/40 to-transparent'
  },
  ended: { 
    label: '종료됨', 
    color: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
    overlay: 'from-black via-neutral-900/60 to-transparent'
  },
};

const THEME_IMAGES = [
  '/assets/images/hackathon_explorer.png',
  '/assets/images/team_building.png',
  '/assets/images/rankings_tropy.png',
];

function PremiumFeedCard({ 
  hackathon, 
  participantCount,
  index 
}: { 
  hackathon: Hackathon; 
  participantCount: number;
  index: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const statusMeta = STATUS_META[hackathon.status] || STATUS_META.ended;
  const deadlineAt = hackathon.period?.submissionDeadlineAt || hackathon.period?.endAt;
  const cardImage = THEME_IMAGES[Math.abs(hackathon.slug.length) % THEME_IMAGES.length];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="group relative w-full h-[480px] rounded-[56px] overflow-hidden border border-white/10 shadow-3xl mb-12"
    >
      {/* Background with Parallax */}
      <div className="absolute inset-0 z-0 bg-neutral-900">
        <motion.img 
          style={{ y }}
          src={cardImage} 
          alt={hackathon.title}
          className="w-full h-[120%] object-cover opacity-50 group-hover:opacity-100 transition-opacity duration-700"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${statusMeta.overlay} z-10`} />
      </div>

      {/* Content */}
      <div className="relative h-full w-full flex flex-col justify-between p-12 md:p-16 z-20">
        <div className="flex justify-between items-start">
           <div className={`px-5 py-2 rounded-full text-[12px] font-black border ${statusMeta.color} tracking-[0.3em] uppercase bg-black/40 backdrop-blur-xl shadow-2xl`}>
             {statusMeta.label}
           </div>
           <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 text-white/40 group-hover:text-white transition-colors">
                {index === 0 ? <Zap className="w-6 h-6" /> : <Award className="w-6 h-6" />}
              </div>
           </div>
        </div>

        <div className="max-w-4xl">
           <div className="space-y-4 mb-8">
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1] break-keep group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all">
                {hackathon.title}
              </h2>
              <div className="flex flex-wrap gap-3">
                 {hackathon.tags?.map(tag => (
                   <span key={tag} className="px-4 py-2 text-[12px] font-black bg-white/5 text-white/50 rounded-xl border border-white/10 backdrop-blur-sm group-hover:text-white group-hover:border-white/30 transition-all uppercase tracking-widest">
                      #{tag}
                   </span>
                 ))}
              </div>
           </div>

           <div className="flex flex-col md:flex-row md:items-center gap-10 mb-10">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <Calendar className="w-5 h-5 text-white/50" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Application Deadline</p>
                    <p className="text-lg font-black text-white/80">{deadlineAt ? new Date(deadlineAt).toLocaleDateString() : '일정 미정'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <Users className="w-5 h-5 text-white/50" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Live Participants</p>
                    <p className="text-lg font-black text-white/80">{participantCount}명 참여 중</p>
                 </div>
              </div>
           </div>

           <Link 
             to={`/hackathons/${hackathon.slug}`}
             className="group/btn inline-flex items-center gap-6 py-6 px-12 bg-white text-black rounded-full font-black text-xl tracking-tight transition-all hover:scale-[1.05] active:scale-[0.98] shadow-2xl shadow-blue-500/20"
           >
              <span>상세 보기</span>
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover/btn:rotate-45">
                 <ArrowUpRight className="w-6 h-6" />
              </div>
           </Link>
        </div>
      </div>

      {/* Interactive Light Beam */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
         <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent rotate-45 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      </div>
    </motion.div>
  );
}

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);
      const timer = window.setTimeout(() => {
        setHackathons(getHackathons());
        setTeams(getTeams());
        setLoading(false);
      }, 250);
      return () => window.clearTimeout(timer);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
      setLoading(false);
    }
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    hackathons.forEach(h => h.tags?.forEach((t: string) => tags.add(t)));
    return Array.from(tags);
  }, [hackathons]);

  const filtered = useMemo(() => {
    const STATUS_ORDER: Record<string, number> = { 'ongoing': 1, 'upcoming': 2, 'ended': 3 };

    return hackathons
      .filter((h) => {
        const matchStatus = filterStatus === 'all' || h.status === filterStatus;
        const matchTag = filterTag === 'all' || h.tags?.includes(filterTag);
        const matchQuery = (h.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchStatus && matchTag && matchQuery;
      })
      .sort((a, b) => {
        const orderA = STATUS_ORDER[a.status] || 99;
        const orderB = STATUS_ORDER[b.status] || 99;
        return orderA - orderB;
      });
  }, [hackathons, filterStatus, filterTag, searchQuery]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  
  return (
    <div className="w-full min-h-screen pb-40">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Hero Header */}
      <div className="px-6 mb-32">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-16">
          <div className="space-y-8">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-4 text-cta font-black tracking-[0.5em] uppercase text-sm"
            >
               <div className="w-12 h-px bg-cta/40" />
               Explore Magazine
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-8xl md:text-[140px] font-black font-heading tracking-tighter text-primary leading-[0.8] mb-12"
            >
               HACKATHON<br />LIST
            </motion.h1>
            <p className="text-2xl text-secondary/40 font-bold max-w-2xl break-keep leading-relaxed">
              프리미엄 해커톤 항목을 매거진 스타일로 탐색하세요. <br />
              스크롤할 때 느껴지는 패럴랙스 효과가 탐색의 몰입감을 더해줍니다.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-5 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-6 rounded-[48px] border border-gray-100"
          >
            <div className="relative group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary group-focus-within:text-cta transition-colors" />
               <input 
                 type="text"
                 placeholder="검색어"
                 className="bg-neutral-50/80 text-primary font-bold rounded-2xl py-4 pl-14 pr-6 outline-none border border-transparent focus:bg-white focus:border-cta/20 transition-all w-72 text-lg"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <Dropdown
              className="min-w-[160px] h-[60px]"
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { label: '상태 전체', value: 'all' },
                { label: '진행 중', value: 'ongoing' },
                { label: '시작 전', value: 'upcoming' },
                { label: '종료됨', value: 'ended' },
              ]}
            />
            <Dropdown
              className="min-w-[160px] h-[60px]"
              value={filterTag}
              onChange={(val) => setFilterTag(val)}
              options={[
                { label: '태그 전체', value: 'all' },
                ...allTags.map(t => ({ label: t, value: t }))
              ]}
            />
          </motion.div>
        </div>
      </div>

      {/* Premium Card Feed */}
      <div className="px-6 space-y-24">
        {filtered.length > 0 ? (
          <div className="space-y-16">
            {filtered.map((hackathon, idx) => {
              const participantCount = teams
                .filter((t) => t.hackathonSlug === hackathon.slug)
                .reduce((sum, team) => sum + (team.memberCount || 0), 0);

              return (
                <PremiumFeedCard
                  key={hackathon.slug}
                  hackathon={hackathon}
                  participantCount={participantCount}
                  index={idx}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Target className="w-16 h-16" />}
            title="조건과 일치하는 항목이 없습니다"
            description="다른 필터나 키워드로 다시 시도해 보세요."
            className="py-48 bg-neutral-50 rounded-[56px] border border-neutral-100"
          />
        )}
      </div>

      {/* Footer Stat */}
      <div className="mt-32 px-6">
         <div className="flex flex-col items-center gap-6">
            <div className="w-px h-24 bg-gradient-to-b from-transparent via-cta/20 to-transparent" />
            <span className="text-cta font-black tracking-[0.6em] uppercase text-[12px] opacity-40">End of Catalogue</span>
         </div>
      </div>
    </div>
  );
}
