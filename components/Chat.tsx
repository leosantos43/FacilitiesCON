
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, UserRole } from '../types';
import { db } from '../services/mockSupabase';
import { Icons } from './Icons';

interface ChatProps {
  requestId: string;
  user: User;
}

export const Chat: React.FC<ChatProps> = ({ requestId, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await db.getRequestMessages(requestId);
      setMessages(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [requestId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgText = newMessage;
    setNewMessage('');
    
    try {
      await db.sendRequestMessage(requestId, user, msgText);
      await fetchMessages();
    } catch (err) {
      alert('Erro ao enviar mensagem.');
      setNewMessage(msgText);
    }
  };

  const getRoleColor = (role: UserRole) => {
    if (role === UserRole.ADMIN) return 'bg-slate-900 text-white';
    if (role === UserRole.SYNDIC) return 'bg-indigo-600 text-white';
    return 'bg-brand-accent text-brand-blue';
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
      >
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Icons.Loader className="animate-spin text-brand-accent" />
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user.id;
            const isSystem = msg.message.startsWith('SISTEMA:');
            
            if (isSystem) {
               return (
                 <div key={msg.id} className="flex justify-center my-4">
                    <span className="bg-slate-100 text-slate-400 text-[9px] font-black uppercase px-4 py-1 rounded-full border border-slate-200 tracking-widest">
                       {msg.message.replace('SISTEMA:', '')}
                    </span>
                 </div>
               )
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-xs font-bold leading-relaxed ${
                  isMe ? `${getRoleColor(user.role)} rounded-tr-none shadow-glow` : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  <p>{msg.message}</p>
                  <span className={`text-[8px] block text-right mt-2 opacity-60`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {!isMe && (
                  <span className="text-[9px] text-slate-400 mt-2 mx-2 font-black uppercase tracking-widest">
                    {msg.user_name} • {msg.role}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem para a equipe..."
            className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-brand-accent/5 outline-none text-slate-800"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="w-12 h-12 flex items-center justify-center bg-brand-blue text-brand-accent rounded-2xl hover:bg-black transition-all disabled:opacity-30"
          >
            <Icons.Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
