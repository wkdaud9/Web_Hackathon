import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Send, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getConversation, sendMessage, markMessageAsRead } from '../../utils/api';
import type { Message } from '../../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserNickname: string;
}

export default function ChatModal({ isOpen, onClose, otherUserId, otherUserNickname }: Props) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchAndMarkMessages = () => {
    if (!currentUser || !otherUserId) return;
    const conversation = getConversation(currentUser.id, otherUserId);
    setMessages(conversation);
    
    // Mark incoming unread messages as read
    let updated = false;
    conversation.forEach(m => {
      if (m.receiverId === currentUser.id && !m.isRead) {
        markMessageAsRead(m.id);
        updated = true;
      }
    });
    
    if (updated) {
      setMessages(getConversation(currentUser.id, otherUserId));
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAndMarkMessages();
      const interval = setInterval(fetchAndMarkMessages, 2000); // Polling for new messages
      return () => clearInterval(interval);
    }
  }, [isOpen, currentUser, otherUserId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMessage.trim()) return;

    const msg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: currentUser.id,
      senderNickname: currentUser.nickname,
      receiverId: otherUserId,
      content: newMessage.trim(),
      isRead: false,
      createdAt: new Date().toISOString()
    };

    sendMessage(msg);
    setNewMessage('');
    fetchAndMarkMessages();
  };

  if (!isOpen || !currentUser) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-600/50 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-gray-50 rounded-[28px] shadow-2xl overflow-hidden flex flex-col h-[70vh] max-h-[700px] z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-cta flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-primary text-lg leading-tight">{otherUserNickname}</h3>
                <span className="text-xs font-semibold text-emerald-500">대화 중</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-tertiary hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <span className="text-3xl">👋</span>
                </div>
                <p className="text-secondary font-medium text-[15px]">대화를 시작해보세요!</p>
                <p className="text-tertiary text-[13px] mt-1">예의바른 소통으로 좋은 인연을 만들어가요.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMine = msg.senderId === currentUser.id;
                const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx-1].createdAt).toDateString();
                
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="bg-gray-200/50 text-tertiary text-[11px] font-bold px-3 py-1 rounded-full">
                          {new Date(msg.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                        </span>
                      </div>
                    )}
                    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                        <div 
                          className={`p-3.5 rounded-[20px] text-[15px] leading-relaxed break-words shadow-sm ${
                            isMine 
                              ? 'bg-cta text-white rounded-br-[4px]' 
                              : 'bg-white text-primary border border-gray-100 rounded-bl-[4px]'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className={`flex flex-col text-[10px] text-tertiary font-medium mb-1 ${isMine ? 'items-end' : 'items-start'}`}>
                          {isMine && msg.isRead && <span className="text-cta font-bold">읽음</span>}
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white px-4 py-4 md:px-6 md:py-5 border-t border-gray-100 shrink-0 z-10">
            <form onSubmit={handleSend} className="flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-[20px] px-5 py-3.5 text-primary text-[15px] focus:outline-none focus:border-cta focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-12 h-12 rounded-full bg-cta text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
