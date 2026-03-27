import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import HackathonsPage from './pages/HackathonsPage';
import HackathonDetailPage from './pages/HackathonDetailPage';
import CampPage from './pages/CampPage';
import RankingsPage from './pages/RankingsPage';
import MyPage from './pages/MyPage';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="hackathons" element={<HackathonsPage />} />
              <Route path="hackathons/:slug" element={<HackathonDetailPage />} />
              <Route path="camp" element={<CampPage />} />
              <Route path="rankings" element={<RankingsPage />} />
              <Route path="mypage" element={<MyPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
