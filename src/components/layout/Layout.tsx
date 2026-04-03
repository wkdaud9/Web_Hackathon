import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { User, ChevronDown, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import AuthModal from '../AuthModal';
import MessageDropdown from './MessageDropdown';
import NotificationsFAB from '../NotificationsFAB';

const navItems = [
  { name: '홈', path: '/' },
  { name: '해커톤', path: '/hackathons' },
  { name: '팀 빌딩', path: '/camp' },
  { name: '랭킹', path: '/rankings' },
];

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    showToast('로그아웃 되었습니다.', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#111111] font-sans text-primary dark:text-neutral-100 selection:bg-blue-100 dark:selection:bg-blue-900/50 selection:text-cta flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-100 dark:border-neutral-800 shadow-sm transition-all duration-300">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 bg-cta rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100 dark:shadow-none group-hover:scale-110 transition-transform overflow-hidden">
              <span className="text-xl font-black leading-none">L</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-primary dark:text-white uppercase">LinkTon</span>
          </Link>

          <div className="hidden md:flex items-center gap-1.5 flex-1 max-w-2xl justify-center">
            {navItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => 
                  `px-6 py-2.5 rounded-2xl text-[15px] font-bold transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-cta/10 text-cta shadow-sm shadow-blue-50 dark:shadow-none' 
                      : 'text-tertiary dark:text-neutral-400 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-800'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            {currentUser && (
              <NavLink 
                to="/workspace" 
                className={({ isActive }) => 
                  `px-6 py-2.5 rounded-2xl text-[15px] font-bold transition-all duration-300 flex items-center gap-2 ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-cta/10 text-cta shadow-sm shadow-blue-50 dark:shadow-none' 
                      : 'text-secondary/70 dark:text-neutral-400 hover:text-cta dark:hover:text-cta hover:bg-blue-50/50 dark:hover:bg-neutral-800'
                  }`
                }
              >
                워크스페이스
                <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
              </NavLink>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2.5 text-tertiary dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-4">
                 <MessageDropdown />
                 
                 <div className="relative" ref={userMenuRef}>
                   <button 
                     onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                     className="flex items-center gap-2 pl-1.5 pr-4 py-1.5 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-full hover:border-cta/20 dark:hover:border-cta/40 hover:shadow-md transition-all group"
                   >
                     <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-cta/20 text-cta flex items-center justify-center border border-white dark:border-neutral-800 shadow-sm overflow-hidden shrink-0">
                        {currentUser.profileImage ? (
                          <img src={currentUser.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                     </div>
                     <div className="text-left hidden lg:block">
                        <div className="text-[14px] font-black text-primary dark:text-white leading-tight">{currentUser.nickname}</div>
                     </div>
                     <ChevronDown className={`w-4 h-4 text-tertiary dark:text-neutral-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                   </button>

                   <AnimatePresence>
                     {isUserMenuOpen && (
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95, y: 10 }}
                         className="absolute right-0 mt-3 w-52 bg-white dark:bg-neutral-800 rounded-3xl shadow-xl dark:shadow-2xl border border-gray-100 dark:border-neutral-700 p-2 z-[60]"
                       >
                         <Link 
                           to="/mypage" 
                           onClick={() => setIsUserMenuOpen(false)}
                           className="flex items-center gap-3 w-full px-4 py-3 text-[14px] font-bold text-secondary dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-neutral-700 hover:text-cta dark:hover:text-white rounded-2xl transition-all"
                         >
                           마이페이지
                         </Link>
                         <div className="h-px bg-gray-50 dark:bg-neutral-700 my-1 mx-2" />
                         <button 
                           onClick={handleLogout}
                           className="flex items-center gap-3 w-full px-4 py-3 text-[14px] font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
                         >
                           로그아웃
                         </button>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-2.5 bg-cta text-white text-[13.5px] font-black rounded-full hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-95"
              >
                시작하기
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Outlet />
      </main>

      <footer className="w-full py-8 text-center text-sm text-tertiary">
        &copy; {new Date().getFullYear()} LinkTon. Built for monthly hackathon challenge.
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <NotificationsFAB />
    </div>
  );
}
