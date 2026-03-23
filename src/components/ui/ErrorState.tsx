import { motion } from 'framer-motion';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({ message = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.', onRetry, className = '' }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-12 min-h-[300px] w-full bg-red-50/50 rounded-[32px] border border-red-100 text-center ${className}`}
    >
      <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-red-600 mb-2">오류 발생</h3>
      <p className="text-red-500/80 font-medium mb-8 max-w-sm mx-auto">{message}</p>
      
      <div className="flex gap-3">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 font-bold text-[14px] rounded-[14px] hover:bg-red-50 transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            다시 시도
          </button>
        )}
        <Link 
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-bold text-[14px] rounded-[14px] hover:bg-red-600 transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          메인으로
        </Link>
      </div>
    </motion.div>
  );
}
