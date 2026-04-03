import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Send, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getChatHistory, sendMessage, markMessageAsRead, getUsers, getTeams, addInvite } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import UserProfileModal from './UserProfileModal';
import type { Message, User as UserType, Team } from '../../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserNickname: string;
}

export default function ChatModal({ isOpen, onClose, otherUserId, otherUserNickname }: Props) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<UserType | null>(null);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && otherUserId) {
      const users = getUsers();
      setOtherUser(users.find(u => u.id === otherUserId) || null);
      
      const teams = getTeams();
      const leading = teams.find(t => t.leaderName === currentUser?.nickname);
      setMyTeam(leading || null);
    }
  }, [isOpen, otherUserId, currentUser]);

  const fetchAndMarkMessages = () => {
    if (!currentUser || !otherUserId) return;
    const conversation = getChatHistory(currentUser.id, otherUserId);
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
      setMessages(getChatHistory(currentUser.id, otherUserId));
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

  const handleInvite = () => {
    if (!myTeam || !otherUser) return;
    
    // In a real app, this would use a dedicated invitation system
    addInvite({
      id: Date.now(),
      hackathonSlug: myTeam.hackathonSlug || 'common',
      teamCode: myTeam.teamCode,
      applicantName: otherUser.nickname,
      applicantId: otherUser.id,
      message: `${currentUser?.nickname}님이 소속 팀 [${myTeam.name}]에 초대했습니다.`,
      status: 'pending',
      type: 'invitation',
      createdAt: new Date().toISOString()
    });
    
    showToast('초대 완료', 'success');
  };

  const handleProfileClick = () => {
    if (!otherUser) return;
    if (!otherUser.isProfilePublic) {
      showToast('비공개 프로필입니다.', 'info');
      return;
    }
    setIsProfileOpen(true);
  };

  if (!isOpen || !currentUser) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {!isProfileOpen ? (
        <div key="chat-view" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 h-screen">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-600/50 dark:bg-black/60 backdrop-blur-sm transition-colors"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-gray-50 dark:bg-neutral-900 rounded-[28px] shadow-2xl overflow-hidden flex flex-col h-[70vh] max-h-[700px] z-10 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-white dark:bg-neutral-800 border-b border-gray-100 dark:border-neutral-700 flex justify-between items-center shadow-sm z-10 shrink-0 transition-colors">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleProfileClick}
                  className="w-10 h-10 rounded-full bg-blue-50 dark:bg-cta/20 text-cta flex items-center justify-center font-bold overflow-hidden hover:ring-2 hover:ring-blue-100 transition-all shrink-0"
                >
                  {otherUser?.profileImage ? (
                    <img src={otherUser.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-cta" />
                  )}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleProfileClick}
                      className="font-bold text-primary dark:text-white text-lg leading-tight truncate hover:text-cta transition-colors"
                    >
                      {otherUserNickname}
                    </button>
                    <span className="shrink-0 text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md transition-colors">대화 중</span>
                  </div>
                  {otherUser && (
                    <div className="flex items-center gap-2 mt-0.5">
                      {myTeam && (
                        <button 
                          onClick={handleInvite}
                          className="text-[11px] font-bold text-cta hover:underline"
                        >
                          팀 초대하기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-tertiary dark:text-neutral-500 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 text-left">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 shadow-sm transition-colors">
                    <span className="text-3xl">👋</span>
                  </div>
                  <p className="text-secondary dark:text-neutral-300 font-medium text-[15px] transition-colors">대화를 시작해보세요!</p>
                  <p className="text-tertiary dark:text-neutral-500 text-[13px] mt-1 transition-colors">예의바른 소통으로 좋은 인연을 만들어가요.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.senderId === currentUser.id;
                  const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx-1].createdAt).toDateString();
                  
                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="bg-gray-200/50 dark:bg-neutral-800 text-tertiary dark:text-neutral-400 text-[11px] font-bold px-3 py-1 rounded-full transition-colors">
                            {new Date(msg.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                          </span>
                        </div>
                      )}
                      <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                          <div 
                            className={`p-3.5 rounded-[20px] text-[15px] leading-relaxed break-words shadow-sm transition-colors ${
                              isMine 
                                ? 'bg-cta text-white rounded-br-[4px]' 
                                : 'bg-white dark:bg-neutral-800 text-primary dark:text-white border border-gray-100 dark:border-neutral-700 rounded-bl-[4px]'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div className={`flex flex-col text-[10px] text-tertiary dark:text-neutral-500 font-medium mb-1 transition-colors ${isMine ? 'items-end' : 'items-start'}`}>
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
            <div className="bg-white dark:bg-neutral-800 px-4 py-4 md:px-6 md:py-5 border-t border-gray-100 dark:border-neutral-700 shrink-0 z-10 transition-colors">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-[20px] px-5 py-3.5 text-primary dark:text-white text-[15px] focus:outline-none focus:border-cta dark:focus:border-cta focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 rounded-full bg-cta text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-5 h-5 -ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      ) : (
        <React.Fragment key="profile-view">
          {otherUser && (
            <UserProfileModal 
              isOpen={isProfileOpen} 
              onClose={() => setIsProfileOpen(false)} 
              user={otherUser} 
            />
          )}
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body
  );
}
