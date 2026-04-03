import { useState, useEffect, useRef } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMessages, getUnreadCount, markAllAsRead, getUsers } from '../../utils/api';
import type { Message, User as UserType } from '../../types/models';
import { useMemo } from 'react';
import ChatModal from './ChatModal';

export default function MessageDropdown() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [chatPartner, setChatPartner] = useState<{ id: string, nickname: string } | null>(null);

  const fetchMessages = () => {
    if (!currentUser) return;
    setMessages(getMessages(currentUser.id));
    setUnreadCount(getUnreadCount(currentUser.id));
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchMessages();
    }
  };

  const handleOpenChat = (senderId: string, senderNickname: string) => {
    markAllAsRead(currentUser!.id, senderId);
    fetchMessages();
    setIsOpen(false);
    setChatPartner({ id: senderId, nickname: senderNickname });
  };

  const conversations = useMemo(() => {
    const allUsers = getUsers();
    const groups: Record<string, { partnerId: string; partnerNickname: string; lastMsg: Message; unreadCount: number }> = {};
    
    // Create copy and sort chronological ascending to ensure lastMsg is truly the last one
    const chrono = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    chrono.forEach(msg => {
      const isMine = msg.senderId === currentUser!.id;
      const partnerId = isMine ? msg.receiverId : msg.senderId;
      
      const partner = allUsers.find((u: UserType) => u.id === partnerId);
      const partnerNickname = partner?.nickname || (isMine ? '상대방' : msg.senderNickname);

      groups[partnerId] = { 
        partnerId, 
        partnerNickname,
        lastMsg: msg, 
        unreadCount: (groups[partnerId]?.unreadCount || 0) + (!msg.isRead && !isMine ? 1 : 0)
      };
    });
    
    // Convert to array and sort by lastMsg.createdAt descending for UI
    return Object.values(groups).sort((a, b) => 
      new Date(b.lastMsg.createdAt).getTime() - new Date(a.lastMsg.createdAt).getTime()
    );
  }, [messages, currentUser]);

  if (!currentUser) return null;

  return (
    <div className="relative flex items-center h-full" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 text-secondary dark:text-neutral-400 hover:text-cta dark:hover:text-cta transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
      >
        <Mail className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white dark:border-neutral-800 transition-colors">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-[0_4px_24px_rgb(0,0,0,0.12)] dark:shadow-none border border-gray-100 dark:border-neutral-800 overflow-hidden z-[100] flex flex-col max-h-[400px] transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gray-50/50 dark:bg-neutral-900/50 transition-colors">
            <h3 className="font-bold text-primary dark:text-white transition-colors">쪽지함</h3>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-gray-200 dark:text-neutral-700 transition-colors" />
                <p className="text-tertiary dark:text-neutral-500 text-[13px] font-medium transition-colors">대화 중인 상대가 없습니다.</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.partnerId} 
                  onClick={() => handleOpenChat(conv.partnerId, conv.partnerNickname)}
                  className={`p-3.5 rounded-xl border cursor-pointer hover:shadow-md transition-all ${conv.unreadCount > 0 ? 'bg-blue-50/50 dark:bg-cta/10 border-blue-100 dark:border-cta/20 hover:border-blue-200 dark:hover:border-cta/30' : 'bg-white dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 hover:border-gray-200 dark:hover:border-neutral-600'}`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[14px] text-primary dark:text-white transition-colors">{conv.partnerNickname}</span>
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-tertiary dark:text-neutral-500 font-medium transition-colors">
                      {new Date(conv.lastMsg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[13px] text-secondary dark:text-neutral-400 font-medium truncate leading-relaxed transition-colors">
                    {conv.lastMsg.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {chatPartner && (
        <ChatModal 
          isOpen={!!chatPartner}
          onClose={() => {
            setChatPartner(null);
            fetchMessages();
          }}
          otherUserId={chatPartner.id}
          otherUserNickname={chatPartner.nickname}
        />
      )}
    </div>
  );
}
