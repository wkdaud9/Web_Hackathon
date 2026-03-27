import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../AuthModal';
import MessageDropdown from './MessageDropdown';
import { getTeams, getInvites } from '../../utils/api';

const navItems = [
  { to: '/hackathons', label: '해커톤 탐색' },
  { to: '/camp', label: '팀 모집 라운지' },
  { to: '/rankings', label: '명예의 전당' },
];

export default function Layout() {
  const { currentUser, logout, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasPendingInvites, setHasPendingInvites] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Polling or re-evaluating pending invites when currentUser or dropdown state changes
  useEffect(() => {
    if (currentUser) {
      const allTeams = getTeams();
      const allInvites = getInvites();
      const ledTeamsCode = new Set(allTeams.filter(t => t.leaderName === currentUser.nickname).map(t => t.teamCode));
      const pendingInvites = allInvites.filter(inv => ledTeamsCode.has(inv.teamCode) && inv.status === 'pending');
      setHasPendingInvites(pendingInvites.length > 0);
    } else {
      setHasPendingInvites(false);
    }
  }, [currentUser, isDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col font-body selection:bg-blue-100 selection:text-blue-900">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <nav className="mx-auto w-[min(1200px,calc(100%-1.5rem))] px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="text-xl font-heading font-bold tracking-tight text-primary">
            Hackathon Hub
          </Link>
          <div className="flex items-center gap-1 md:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 md:px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-cta'
                      : 'text-secondary hover:bg-gray-100 hover:text-primary'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>

            {!isLoading && (
              currentUser ? (
                <div className="flex items-center gap-2 md:gap-4 h-full">
                  <MessageDropdown />
                  <div className="relative flex items-center h-full" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-[14px] font-bold text-primary hover:text-cta transition-colors"
                  >
                    {currentUser.profileImage ? (
                      <div className="relative">
                        <img src={currentUser.profileImage} alt="" className="w-7 h-7 rounded-full bg-gray-100 object-cover" />
                        {hasPendingInvites && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white"></span>}
                      </div>
                    ) : (
                      <div className="relative w-7 h-7 rounded-full bg-blue-50 text-cta flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                        {hasPendingInvites && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white"></span>}
                      </div>
                    )}
                    <span className="hidden sm:inline-block truncate max-w-[100px]">{currentUser.nickname}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden z-[100]">
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/mypage');
                        }}
                        className="block w-full flex items-center justify-between px-4 py-3 text-[14px] font-medium text-primary hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <span>마이페이지</span>
                        {hasPendingInvites && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                      </button>
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-3 text-[14px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-primary text-white text-[14px] font-bold rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap shrink-0"
                >
                  로그인
                </button>
              )
            )}
          </div>
        </nav>
      </header>

      <main className="relative flex-1 w-full max-w-7xl mx-auto px-4 pt-10 pb-16">
        <Outlet />
      </main>

      <footer className="w-full py-8 text-center text-sm text-tertiary">
        &copy; {new Date().getFullYear()} Hackathon Hub. Built for monthly hackathon challenge.
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
