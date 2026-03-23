import { motion } from 'framer-motion';

interface Props {
  text?: string;
}

export default function LoadingSpinner({ text = '데이터를 불러오는 중입니다...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px] w-full bg-white rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-gray-100 border-t-cta rounded-full mb-5"
      />
      <p className="text-secondary font-medium">{text}</p>
    </div>
  );
}
