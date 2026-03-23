import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = '' }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center p-12 min-h-[350px] w-full bg-white rounded-[32px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-center ${className}`}
    >
      <div className="w-16 h-16 bg-blue-50 text-cta rounded-full flex items-center justify-center mb-6 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-primary font-heading mb-3">{title}</h3>
      {description && <p className="text-secondary font-medium mb-8 max-w-sm mx-auto leading-relaxed">{description}</p>}
      {action && <div>{action}</div>}
    </motion.div>
  );
}
