import { Outlet, Link, NavLink } from 'react-router-dom';

const navItems = [
  { to: '/hackathons', label: '해커톤 탐색' },
  { to: '/camp', label: '팀 모집 라운지' },
  { to: '/rankings', label: '명예의 전당' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col font-body selection:bg-blue-100 selection:text-blue-900">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <nav className="mx-auto w-[min(1200px,calc(100%-1.5rem))] px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="text-xl font-heading font-bold tracking-tight text-primary">
            Hackathon Hub
          </Link>
          <div className="flex items-center gap-1 md:gap-2 overflow-x-auto">
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
          </div>
        </nav>
      </header>

      <main className="relative flex-1 w-full max-w-7xl mx-auto px-4 pt-10 pb-16">
        <Outlet />
      </main>

      <footer className="w-full py-8 text-center text-sm text-tertiary">
        &copy; {new Date().getFullYear()} Hackathon Hub. Built for monthly hackathon challenge.
      </footer>
    </div>
  );
}
