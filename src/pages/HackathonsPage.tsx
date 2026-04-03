import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Target, Search } from 'lucide-react';
import Dropdown from '../components/Dropdown';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { getHackathons, getTeams } from '../utils/api';
import type { Hackathon, Team } from '../types/models';

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  ongoing: { 
    label: '진행 중', 
    color: 'bg-emerald-500 text-white',
    dot: 'bg-emerald-500'
  },
  upcoming: { 
    label: '시작 전', 
    color: 'bg-blue-500 text-white',
    dot: 'bg-blue-500'
  },
  ended: { 
    label: '종료됨', 
    color: 'bg-neutral-600 text-white',
    dot: 'bg-neutral-400'
  },
};

const THUMBNAIL_MAP: Record<string, string> = {
  'aimers-8-model-lite': '/thumbnails/aimers8.png',
  'monthly-vibe-coding-2026-02': '/thumbnails/vibe2026.png',
  'daker-handover-2026-03': '/thumbnails/handover2026.png',
  'mystery-hackathon-2026-04': '/thumbnails/mystery2026.png',
};

function HackathonGridCard({ 
  hackathon, 
  participantCount,
}: { 
  hackathon: Hackathon; 
  participantCount: number;
}) {
  const statusMeta = STATUS_META[hackathon.status] || STATUS_META.ended;
  const deadlineAt = hackathon.period?.submissionDeadlineAt || hackathon.period?.endAt;
  const thumbnail = THUMBNAIL_MAP[hackathon.slug] || '/assets/images/hackathon_explorer.png';

  return (
    <Link 
      to={`/hackathons/${hackathon.slug}`}
      className="group flex flex-col w-full h-full"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-4 transition-colors">
        <motion.img 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          src={thumbnail} 
          alt={hackathon.title}
          className="w-full h-full object-cover"
        />
        
        {/* Status Badge Overlays */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-lg ${statusMeta.color}`}>
            {statusMeta.label}
          </div>
        </div>

        {/* Info Overlays (Like Duration) */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-black/80 backdrop-blur-md rounded-md border border-white/10">
           <Users className="w-3 h-3 text-white/60" />
           <span className="text-[10px] font-bold text-white tracking-tight">{participantCount}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-1">
        <div className="flex flex-col min-w-0">
          <div className="min-h-[2.8rem]">
            <h3 className="text-[15px] font-bold text-primary dark:text-white leading-snug line-clamp-2 mb-1 group-hover:text-cta transition-colors">
              {hackathon.title}
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2">
            {hackathon.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="text-[12px] text-tertiary hover:text-secondary">#{tag}</span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[12px] text-tertiary dark:text-neutral-400 font-medium transition-colors">
             <div className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot} opacity-60`} />
             <span className="truncate">마감: {deadlineAt ? new Date(deadlineAt).toLocaleDateString() : '일정 미정'}</span>
          </div>
        </div>
      </div>
    </Link>
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
    <div className="w-full min-h-screen bg-white dark:bg-transparent transition-colors duration-300">
      {/* Header with Search */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 px-6 py-4 transition-colors duration-300">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
             <h1 className="text-xl font-black text-primary dark:text-white tracking-tighter transition-colors">HACKATHONS</h1>
             <div className="flex bg-gray-100 dark:bg-neutral-800 rounded-full px-4 py-1.5 gap-2 h-11 overflow-x-auto scrollbar-hide items-center transition-colors">
                <button onClick={() => setFilterStatus('all')} className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${filterStatus === 'all' ? 'bg-primary dark:bg-cta text-white shadow-md shadow-gray-200 dark:shadow-none' : 'hover:bg-gray-200 dark:hover:bg-neutral-700 text-secondary dark:text-neutral-400'}`}>전체</button>
                <button onClick={() => setFilterStatus('ongoing')} className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${filterStatus === 'ongoing' ? 'bg-primary dark:bg-cta text-white shadow-md shadow-gray-200 dark:shadow-none' : 'hover:bg-gray-200 dark:hover:bg-neutral-700 text-secondary dark:text-neutral-400'}`}>진행 중</button>
                <button onClick={() => setFilterStatus('upcoming')} className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${filterStatus === 'upcoming' ? 'bg-primary dark:bg-cta text-white shadow-md shadow-gray-200 dark:shadow-none' : 'hover:bg-gray-200 dark:hover:bg-neutral-700 text-secondary dark:text-neutral-400'}`}>시작 전</button>
                <button onClick={() => setFilterStatus('ended')} className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${filterStatus === 'ended' ? 'bg-primary dark:bg-cta text-white shadow-md shadow-gray-200 dark:shadow-none' : 'hover:bg-gray-200 dark:hover:bg-neutral-700 text-secondary dark:text-neutral-400'}`}>종료됨</button>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group flex-1 md:flex-none h-11">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary dark:text-neutral-500" />
               <input 
                 type="text"
                 placeholder="해커톤 검색"
                 className="bg-gray-50 dark:bg-neutral-800 text-sm font-medium rounded-full w-full md:w-64 h-full pl-10 pr-6 outline-none border border-gray-200 dark:border-neutral-700 text-primary dark:text-white focus:bg-white dark:focus:bg-neutral-800 focus:border-cta dark:focus:border-cta focus:ring-4 focus:ring-cta/5 transition-all block"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <Dropdown
              className="hidden lg:flex min-w-[140px] h-11"
              value={filterTag}
              onChange={(val) => setFilterTag(val)}
              options={[
                { label: '모든 태그', value: 'all' },
                ...allTags.map(t => ({ label: t, value: t }))
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <main className="max-w-[1920px] mx-auto px-6 py-10">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
            {filtered.map((hackathon) => {
              const participantCount = teams
                .filter((t) => t.hackathonSlug === hackathon.slug)
                .reduce((sum, team) => sum + (team.memberCount || 0), 0);

              return (
                <HackathonGridCard
                  key={hackathon.slug}
                  hackathon={hackathon}
                  participantCount={participantCount}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Target className="w-16 h-16" />}
            title="조건과 일치하는 항목이 없습니다"
            description="다른 필터나 키워드로 다시 시도해 보세요."
            className="py-48"
          />
        )}
      </main>

      {/* Footer Buffer */}
      <div className="h-40" />
    </div>
  );
}
