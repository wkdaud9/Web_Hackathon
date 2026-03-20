import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Users, Target, Search, Filter } from 'lucide-react';
import { getHackathons, getTeams } from '../utils/api';

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setHackathons(getHackathons());
    setTeams(getTeams());
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    hackathons.forEach(h => h.tags?.forEach((t: string) => tags.add(t)));
    return Array.from(tags);
  }, [hackathons]);

  const filtered = useMemo(() => {
    return hackathons.filter(h => {
      const matchStatus = filterStatus === 'all' || h.status === filterStatus;
      const matchTag = filterTag === 'all' || h.tags?.includes(filterTag);
      const matchQuery = h.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchTag && matchQuery;
    });
  }, [hackathons, filterStatus, filterTag, searchQuery]);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold font-heading mb-2 text-white"
          >
            Explore Hackathons
          </motion.h1>
          <p className="text-gray-400">Discover coding challenges to elevate your career.</p>
        </div>
        
        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center gap-4 bg-primary/40 p-3 rounded-2xl border border-white/10"
        >
          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text"
               placeholder="Search..."
               className="w-full bg-secondary/50 text-white rounded-xl py-2 pl-9 pr-4 outline-none border border-transparent focus:border-cta/50 transition-colors"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              className="bg-secondary/50 text-white rounded-xl px-3 py-2 outline-none border border-transparent focus:border-cta/50 appearance-none min-w-[100px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="ongoing">Ongoing</option>
              <option value="upcoming">Upcoming</option>
              <option value="ended">Ended</option>
            </select>
            <select 
              className="bg-secondary/50 text-white rounded-xl px-3 py-2 outline-none border border-transparent focus:border-cta/50 appearance-none min-w-[100px]"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="all">All Tags</option>
              {allTags.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((hackathon, idx) => {
          const teamCount = teams.filter(t => t.hackathonSlug === hackathon.slug).length;
          // compute status color
          const statusColor = hackathon.status === 'ongoing' ? 'bg-cta/20 text-cta border-cta/30' :
                              hackathon.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              'bg-gray-500/20 text-gray-400 border-gray-500/30';

          return (
            <motion.div
              key={hackathon.slug}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-primary/30 border border-white/5 rounded-3xl overflow-hidden hover:bg-primary/50 transition-all duration-300 hover:border-cta/30 flex flex-col group relative"
            >
              <div className="h-40 bg-secondary/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent z-10" />
                {/* Fallback pattern if no image */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--color-cta)_0%,_transparent_70%)]" />
              </div>
              
              <div className="p-6 pt-0 relative z-20 flex-1 flex flex-col -mt-10">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor} uppercase tracking-wide backdrop-blur-md`}>
                    {hackathon.status}
                  </div>
                </div>

                <h2 className="text-xl font-bold font-heading mb-3 line-clamp-2 hover:text-cta transition-colors">
                  <Link to={`/hackathons/${hackathon.slug}`}>
                    {hackathon.title}
                  </Link>
                </h2>

                <div className="flex flex-wrap gap-2 mb-6">
                  {hackathon.tags?.map((tag: string) => (
                    <span key={tag} className="px-2 py-1 text-xs font-medium bg-white/5 text-gray-300 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <span>마감: {new Date(hackathon.period.endAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <span>모집 팀: {teamCount}팀</span>
                  </div>
                </div>

                <Link 
                  to={`/hackathons/${hackathon.slug}`}
                  className="mt-6 w-full py-3 bg-white/5 hover:bg-cta hover:text-black rounded-xl text-center text-sm font-semibold transition-colors duration-300"
                >
                  View Details
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {filtered.length === 0 && (
        <div className="py-20 text-center text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hackathons found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
