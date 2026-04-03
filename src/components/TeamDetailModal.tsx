import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, ExternalLink, Mail, User, Shield } from 'lucide-react';
import type { Team } from '../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
}

export default function TeamDetailModal({ isOpen, onClose, team }: Props) {
  if (!team) return null;

  const isUrl = (text: string) => {
    return text.startsWith('http://') || text.startsWith('https://');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-primary/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-[32px] shadow-2xl overflow-hidden my-auto transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-6 md:px-10 md:py-8 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-start bg-gray-50/50 dark:bg-neutral-900/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-[8px] text-[12px] font-bold tracking-wide">
                    TEAM PROFILE
                  </span>
                  <span className="text-tertiary text-[13px] font-mono font-medium">{team.teamCode}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold font-heading text-primary dark:text-white transition-colors">{team.name}</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-tertiary dark:text-neutral-500 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                aria-label="모달 닫기"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-10 max-h-[70vh] overflow-y-auto w-full">
              {/* Intro Section */}
              <div className="mb-10">
                <h3 className="text-[15px] font-bold text-tertiary dark:text-neutral-500 mb-3 flex items-center gap-1.5 transition-colors">
                  <span className="w-1 h-3.5 bg-gray-300 dark:bg-neutral-600 rounded-full"></span> 팀 소개
                </h3>
                <p className="text-[16px] text-secondary dark:text-neutral-300 leading-relaxed bg-gray-50 dark:bg-neutral-800 p-5 rounded-[20px] border border-gray-100 dark:border-neutral-700 transition-colors">
                  {team.intro}
                </p>
              </div>

               {/* Members Section */}
               <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h3 className="text-[15px] font-bold text-tertiary dark:text-neutral-500 mb-4 flex items-center gap-1.5 transition-colors">
                      <span className="w-1 h-3.5 bg-gray-300 dark:bg-neutral-600 rounded-full"></span> 팀원 정보
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 p-3 rounded-[16px] border border-gray-200 dark:border-neutral-700 shadow-sm transition-colors">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-cta/20 flex items-center justify-center text-cta transition-colors">
                           <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[12px] font-bold text-cta">팀장 (Leader)</div>
                          <div className="font-bold text-[15px] text-primary dark:text-white transition-colors">{team.leaderName || `${team.name} 소속 대표`}</div>
                        </div>
                      </div>
                      
                      {team.members && team.members.length > 0 ? (
                        <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-[16px] p-4 space-y-2 transition-colors">
                           {team.members.map((member, idx) => (
                             <div key={idx} className="flex items-center gap-2">
                               <User className="w-4 h-4 text-tertiary dark:text-neutral-500 transition-colors" />
                               <span className="text-[14px] font-medium text-secondary dark:text-neutral-300 transition-colors">{member}</span>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 border-dashed rounded-[16px] p-4 text-center text-[13px] text-tertiary dark:text-neutral-500 font-medium transition-colors">
                          아직 상세 팀원 정보가 등록되지 않았습니다.
                        </div>
                      )}
                    </div>
                 </div>

                 <div>
                    <h3 className="text-[15px] font-bold text-tertiary dark:text-neutral-500 mb-4 flex items-center gap-1.5 transition-colors">
                      <span className="w-1 h-3.5 bg-gray-300 dark:bg-neutral-600 rounded-full"></span> 우승 및 수상 경력
                    </h3>
                    {team.history && team.history.length > 0 ? (
                      <div className="space-y-3">
                        {team.history.map((hist, idx) => (
                          <div key={idx} className="bg-white dark:bg-neutral-800 p-3 rounded-[16px] border border-gray-200 dark:border-neutral-700 shadow-sm flex flex-col gap-1 hover:border-cta/30 dark:hover:border-cta/50 transition-colors">
                            <span className="text-[12px] font-bold text-amber-500 flex items-center gap-1.5">
                              <Trophy className="w-3.5 h-3.5" /> {hist.prize}
                            </span>
                            <span className="font-bold text-[14px] text-primary dark:text-white transition-colors">{hist.eventName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 border-dashed rounded-[16px] p-8 text-center flex flex-col items-center justify-center gap-2 h-[calc(100%-2.5rem)] transition-colors">
                        <Trophy className="w-6 h-6 text-gray-300 dark:text-neutral-600 transition-colors" />
                        <span className="text-[13px] text-tertiary dark:text-neutral-500 font-medium transition-colors">기록된 수상 경력이 없습니다.</span>
                      </div>
                    )}
                 </div>
               </div>

              {/* Contact Section */}
               <div>
                  <h3 className="text-[15px] font-bold text-tertiary dark:text-neutral-500 mb-3 flex items-center gap-1.5 transition-colors">
                    <span className="w-1 h-3.5 bg-gray-300 dark:bg-neutral-600 rounded-full"></span> 연락처 및 링크
                  </h3>
                  {team.contact?.url ? (
                    isUrl(team.contact.url) ? (
                      <a 
                        href={team.contact.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-blue-50 dark:bg-cta/20 text-cta px-5 py-3.5 rounded-[16px] font-bold hover:bg-cta hover:text-white transition-colors"
                      >
                         오픈 채팅 / 연락망 열기 <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-neutral-800 text-primary dark:text-white px-5 py-3.5 rounded-[16px] font-bold border border-gray-200 dark:border-neutral-700 select-all transition-colors">
                        <Mail className="w-4 h-4 text-tertiary dark:text-neutral-500" /> {team.contact.url}
                      </div>
                    )
                  ) : (
                    <div className="text-[14px] text-tertiary dark:text-neutral-500 bg-gray-50 dark:bg-neutral-800 p-4 rounded-[16px] transition-colors">
                      등록된 연락처가 없습니다.
                    </div>
                  )}
               </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
