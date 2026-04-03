import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const { login, register } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setLoginId('');
      setPassword('');
      setNickname('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (mode === 'login') {
      if (!loginId.trim() || !password.trim()) return;
      const success = await login(loginId.trim(), password.trim());
      if (success) {
        onClose();
      } else {
        setErrorMsg('아이디 또는 비밀번호가 일치하지 않습니다.');
      }
    } else {
      if (!loginId.trim() || !password.trim() || !nickname.trim()) return;
      const success = await register(loginId.trim(), password.trim(), nickname.trim());
      if (success) {
        onClose();
      } else {
        setErrorMsg('이미 존재하는 아이디거나 닉네임입니다.');
      }
    }
  };

  const handleToggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setErrorMsg('');
    setLoginId('');
    setPassword('');
    setNickname('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-[24px] shadow-2xl overflow-hidden z-10 p-8 transition-colors"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-tertiary dark:text-neutral-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold font-heading mb-2 text-primary dark:text-white transition-colors">
               {mode === 'login' ? '로그인' : '회원가입'}
            </h2>
            <p className="text-secondary dark:text-neutral-400 font-medium mb-6 transition-colors">
               {mode === 'login' ? '아이디와 비밀번호를 입력해주세요.' : '가입에 필요한 정보를 입력해주세요.'}
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <div className="text-red-500 dark:text-red-400 text-[13px] font-bold bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-500/20">{errorMsg}</div>}
              <div>
                <input
                  autoFocus
                  type="text"
                  placeholder="아이디"
                  className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-[14px] px-4 py-3 text-primary dark:text-white font-medium focus:outline-none focus:border-cta dark:focus:border-cta focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-tertiary dark:placeholder:text-neutral-500"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="비밀번호"
                  className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-[14px] px-4 py-3 text-primary dark:text-white font-medium focus:outline-none focus:border-cta dark:focus:border-cta focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-tertiary dark:placeholder:text-neutral-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    type="text"
                    placeholder="닉네임 (예: 최파운드)"
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-[14px] px-4 py-3 text-primary dark:text-white font-medium focus:outline-none focus:border-cta dark:focus:border-cta focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-tertiary dark:placeholder:text-neutral-500 mt-4"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                  />
                </motion.div>
              )}
              <button
                type="submit"
                className="w-full py-3.5 bg-cta text-white font-bold rounded-[14px] hover:bg-blue-600 transition-colors shadow-[0_8px_20px_rgba(49,130,246,0.3)] dark:shadow-none hover:shadow-none"
              >
                {mode === 'login' ? '로그인' : '가입 완료하기'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center">
              <button 
                type="button" 
                onClick={handleToggleMode}
                className="text-[13px] font-bold text-tertiary dark:text-neutral-500 hover:text-cta transition-colors underline underline-offset-4"
              >
                {mode === 'login' ? '아직 회원이 아니신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
