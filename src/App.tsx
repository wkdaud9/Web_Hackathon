import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import HackathonsPage from './pages/HackathonsPage';
import HackathonDetailPage from './pages/HackathonDetailPage';
import CampPage from './pages/CampPage';
import RankingsPage from './pages/RankingsPage';
import MyPage from './pages/MyPage';
import TeamWorkspacePage from './pages/TeamWorkspacePage';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="hackathons" element={<HackathonsPage />} />
                <Route path="hackathons/:slug" element={<HackathonDetailPage />} />
                <Route path="camp" element={<CampPage />} />
                <Route path="rankings" element={<RankingsPage />} />
                <Route path="mypage" element={<MyPage />} />
                <Route path="workspace" element={<TeamWorkspacePage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
