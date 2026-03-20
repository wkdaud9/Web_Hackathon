import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Users, Target, Search, Filter } from 'lucide-react';
import { getHackathons, getTeams } from '../utils/api';
import type { Hackathon, Team } from '../types/models';

const STATUS_META: Record<string, { label: string; color: string }> = {
  ongoing: { label: '진행 중', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  upcoming: { label: '시작 전', color: 'bg-blue-50 text-cta border-blue-200' },
  ended: { label: '종료됨', color: 'bg-gray-100 text-tertiary border-gray-200' },
};

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
      setError('해커톤 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setLoading(false);
    }
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    hackathons.forEach(h => h.tags?.forEach((t: string) => tags.add(t)));
    return Array.from(tags);
  }, [hackathons]);

  const filtered = useMemo(() => {
    return hackathons.filter((h) => {
      const matchStatus = filterStatus === 'all' || h.status === filterStatus;
      const matchTag = filterTag === 'all' || h.tags?.includes(filterTag);
      const matchQuery = (h.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchTag && matchQuery;
    });
  }, [hackathons, filterStatus, filterTag, searchQuery]);

  if (loading) {
    return (
      <div className="py-20 text-center text-secondary bg-white rounded-[24px] shadow-sm">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-500 bg-red-50 rounded-[24px] border border-red-100">
        {error}
      </div>
    );
  }

  if (hackathons.length === 0) {
    return (
      <div className="py-20 text-center text-tertiary border border-dashed border-gray-300 rounded-[24px] bg-white">
        등록된 해커톤이 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold font-heading mb-2 text-primary tracking-tight"
          >
            해커톤 탐색
          </motion.h1>
          <p className="text-secondary font-medium">현재 상태와 태그로 필터링해 지금 도전할 대회를 빠르게 찾으세요.</p>
        </div>
        
        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-[20px] shadow-sm border border-gray-100"
        >
          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
             <input 
               type="text"
               placeholder="검색어 입력..."
               className="w-full bg-gray-50 text-primary font-medium rounded-xl py-2.5 pl-10 pr-4 outline-none border border-transparent focus:bg-white focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-tertiary"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-tertiary hidden sm:block" />
            <select 
              className="w-full sm:w-auto bg-gray-50 text-primary font-medium rounded-xl px-4 py-2.5 outline-none border border-transparent focus:bg-white focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">상태 전체</option>
              <option value="ongoing">진행 중</option>
              <option value="upcoming">시작 전</option>
              <option value="ended">종료됨</option>
            </select>
            <select 
              className="w-full sm:w-auto bg-gray-50 text-primary font-medium rounded-xl px-4 py-2.5 outline-none border border-transparent focus:bg-white focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="all">태그 전체</option>
              {allTags.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((hackathon, idx) => {
          const participantCount = teams
            .filter((t) => t.hackathonSlug === hackathon.slug)
            .reduce((sum, team) => sum + (team.memberCount || 0), 0);
          const deadlineAt = hackathon.period?.submissionDeadlineAt || hackathon.period?.endAt;
          
          const statusMeta = STATUS_META[hackathon.status] || {
            label: hackathon.status,
            color: 'bg-gray-100 text-secondary border-gray-200',
          };

          return (
            <motion.div
              key={hackathon.slug}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-gray-100 rounded-[24px] overflow-hidden flex flex-col group relative shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-40 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                <Target className="w-16 h-16 text-gray-200/50 absolute" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent z-10" />
              </div>
              
              <div className="p-6 pt-0 relative z-20 flex-1 flex flex-col -mt-8">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1.5 rounded-full text-[13px] font-bold border ${statusMeta.color} tracking-wide bg-white shadow-sm`}>
                    {statusMeta.label}
                  </div>
                </div>

                <h2 className="text-[22px] font-bold font-heading mb-3 line-clamp-2 text-primary group-hover:text-cta transition-colors leading-snug">
                  <Link to={`/hackathons/${hackathon.slug}`}>
                    {hackathon.title}
                  </Link>
                </h2>

                <div className="flex flex-wrap gap-2 mb-6">
                  {hackathon.tags?.map((tag: string) => (
                    <span key={tag} className="px-2.5 py-1 text-[13px] font-semibold bg-gray-50 text-secondary rounded-lg border border-gray-100">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center text-sm font-medium text-secondary">
                    <Calendar className="w-4 h-4 mr-2.5 text-tertiary" />
                    <span>마감: {deadlineAt ? new Date(deadlineAt).toLocaleDateString() : '일정 미정'}</span>
                  </div>
                  <div className="flex items-center text-sm font-medium text-secondary">
                    <Users className="w-4 h-4 mr-2.5 text-tertiary" />
                    <span>참여자 수: <span className="text-primary font-bold">{participantCount}</span>명</span>
                  </div>
                </div>

                <Link 
                  to={`/hackathons/${hackathon.slug}`}
                  className="mt-6 w-full py-3.5 bg-blue-50 text-cta hover:bg-cta hover:text-white rounded-[14px] text-center text-[15px] font-bold transition-colors duration-200"
                >
                  상세 보기
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {filtered.length === 0 && (
        <div className="py-20 text-center text-tertiary border border-dashed border-gray-200 rounded-[24px] bg-white shadow-sm">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">조건에 맞는 해커톤을 찾을 수 없습니다.</p>
        </div>
      )}
    </div>
  );
}
