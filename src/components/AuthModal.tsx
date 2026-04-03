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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-[36px] shadow-2xl z-10 p-8 md:p-12 transition-colors"
          >
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-2 text-tertiary dark:text-neutral-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors z-20"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-10">
              <h2 className="text-3xl font-black font-heading mb-3 text-primary dark:text-white transition-colors tracking-tight">
                {mode === 'login' ? '다시 만나서 반가워요!' : '환영합니다!'}
              </h2>
              <p className="text-[15px] text-secondary dark:text-neutral-400 font-bold tracking-tight">
                {mode === 'login' ? '이미 가입된 계정으로 로그인하세요.' : '해커톤 허브의 새로운 멤버가 되어보세요.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-500 dark:text-red-400 text-[13px] font-black bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border border-red-100 dark:border-red-500/20 mb-4"
                >
                  {errorMsg}
                </motion.div>
              )}

              <div className="space-y-4">
                <input
                  autoFocus
                  type="text"
                  placeholder="아이디"
                  className="w-full bg-gray-50 dark:bg-neutral-800/30 border border-gray-100 dark:border-neutral-700 rounded-[20px] px-6 py-4 text-primary dark:text-white font-bold focus:outline-none focus:border-cta dark:focus:border-cta focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-500/5 transition-all placeholder:text-tertiary dark:placeholder:text-neutral-500 shadow-sm"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="비밀번호"
                  className="w-full bg-gray-50 dark:bg-neutral-800/30 border border-gray-100 dark:border-neutral-700 rounded-[20px] px-6 py-4 text-primary dark:text-white font-bold focus:outline-none focus:border-cta dark:focus:border-cta focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-500/5 transition-all placeholder:text-tertiary dark:placeholder:text-neutral-500 shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <input
                      type="text"
                      placeholder="닉네임"
                      className="w-full bg-gray-50 dark:bg-neutral-800/30 border border-gray-100 dark:border-neutral-700 rounded-[20px] px-6 py-4 text-primary dark:text-white font-bold focus:outline-none focus:border-cta dark:focus:border-cta focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-500/5 transition-all placeholder:text-tertiary dark:placeholder:text-neutral-500 shadow-sm"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required
                    />
                  </motion.div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 mt-8 bg-cta text-white font-black rounded-[20px] hover:bg-blue-600 transition-all shadow-[0_8px_25px_rgba(49,130,246,0.2)] dark:shadow-none hover:translate-y-[-2px] active:scale-[0.98] text-[15px]"
              >
                {mode === 'login' ? '로그인하기' : '회원가입 완료'}
              </button>
            </form>

            <div className="mt-10 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setMode(prev => prev === 'login' ? 'register' : 'login');
                  setErrorMsg('');
                  setLoginId('');
                  setPassword('');
                  setNickname('');
                }}
                className="text-[14px] font-bold text-tertiary dark:text-neutral-500 hover:text-cta transition-colors flex items-center gap-2 group"
              >
                {mode === 'login' ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
                <span className="text-cta underline underline-offset-4 decoration-current/30 group-hover:decoration-current transition-all">
                  {mode === 'login' ? '회원가입' : '로그인'}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
