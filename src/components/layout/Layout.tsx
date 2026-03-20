import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-body">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 mx-4 mt-4 bg-primary/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/5 flex items-center justify-between">
        <Link to="/" className="text-xl font-heading font-bold flex items-center gap-2">
          Hackathon Hub
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/hackathons" className="text-sm hover:text-cta transition-colors">Hackathons</Link>
          <Link to="/camp" className="text-sm hover:text-cta transition-colors">Team Camp</Link>
          <Link to="/rankings" className="text-sm hover:text-cta transition-colors">Rankings</Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pt-32 pb-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-white/10 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Hackathon Web Service. Built with Vibe Coding.
      </footer>
    </div>
  );
}
