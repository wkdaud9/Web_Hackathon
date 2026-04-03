import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onOpen?: () => void;
}

export default function Dropdown({ value, options, onChange, onOpen, placeholder = '선택해주세요', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState && onOpen) onOpen();
        }}
        className={`w-full h-full bg-gray-50/50 dark:bg-neutral-800 border rounded-full px-6 flex items-center justify-between text-left transition-all duration-300 group hover:bg-white dark:hover:bg-neutral-700 hover:shadow-lg ${
          isOpen ? 'bg-white dark:bg-neutral-900 border-cta ring-4 ring-cta/5 shadow-md shadow-blue-50 dark:shadow-none' : 'border-gray-100 dark:border-neutral-700'
        }`}
      >
        <span className={`block truncate mr-2 flex-1 text-left text-[14px] font-bold tracking-tight transition-colors ${selectedOption ? 'text-primary dark:text-white' : 'text-tertiary dark:text-neutral-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-cta text-white rotate-180' : 'bg-gray-100 dark:bg-neutral-700 text-tertiary dark:text-neutral-400 group-hover:bg-gray-200 dark:group-hover:bg-neutral-600'}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute z-[100] mt-3 w-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-gray-100/50 dark:border-neutral-700/50 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-none overflow-hidden transition-colors"
          >
            <div className="max-h-72 overflow-y-auto p-2.5 scrollbar-hide space-y-1">
              {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-[20px] text-left text-[13.5px] font-bold transition-all duration-200 ${
                      isSelected
                        ? 'bg-cta text-white shadow-md shadow-blue-200 dark:shadow-none'
                        : 'text-tertiary dark:text-neutral-400 hover:bg-gray-100/80 dark:hover:bg-neutral-800 hover:text-primary dark:hover:text-white'
                    }`}
                  >
                    <span className="truncate pr-4">{opt.label}</span>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0">
                         <Check className="w-4 h-4" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
