import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useSocket, useSocketEvent } from '../../hooks/useSocket';
import { useAuthStore } from '../../context/AuthContext';
import messageApi from '../../api/messageApi';
import Avatar from '../ui/Avatar';
import { formatTimeAgo } from '../../utils/formatters';
import { PageLoader } from '../ui/LoadingSpinner';

const ChatWindow = ({ conversation }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const { user } = useAuthStore();
  const { emit, joinConversation, leaveConversation, sendTyping } = useSocket();

  const other = conversation?.tenant?._id === user?._id ? conversation?.landlord : conversation?.tenant;

  useEffect(() => {
    if (!conversation?._id) return;
    let cancelled = false;
    setLoading(true);
    joinConversation?.(conversation._id);
    (async () => {
      try {
        const res = await messageApi.getMessages(conversation._id);
        if (!cancelled) setMessages(res.data.data || []);
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; leaveConversation?.(conversation._id); };
  }, [conversation?._id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useSocketEvent('new_message', ({ message, conversationId }) => {
    if (conversationId !== conversation?._id) return;
    setMessages((prev) => {
      const withoutTemp = prev.filter((m) => !(m.status === 'sending' && m.content === message.content));
      return withoutTemp.find((m) => m._id === message._id) ? withoutTemp : [...withoutTemp, message];
    });
  });

  useSocketEvent('user_typing', ({ userId, conversationId, isTyping: typing }) => {
    if (conversationId === conversation?._id && userId !== user?._id) setIsTyping(typing);
  });

  useSocketEvent('message_deleted', ({ messageId, conversationId }) => {
    if (conversationId === conversation?._id) setMessages((prev) => prev.filter((m) => m._id !== messageId));
  });

  const handleInput = (e) => {
    setContent(e.target.value);
    sendTyping?.(conversation._id, other?._id, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping?.(conversation._id, other?._id, false), 1500);
  };

  const send = () => {
    const text = content.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { _id: `tmp-${Date.now()}`, content: text, sender: user, createdAt: new Date(), status: 'sending' }]);
    setContent('');
    emit('send_message', { conversationId: conversation._id, receiverId: other?._id, content: text, messageType: 'text' });
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (loading) return <PageLoader text="Loading messages..." />;

  return (
    <div className="flex flex-col h-full bg-dark">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-surface-card flex-shrink-0">
        <Avatar src={other?.avatar?.url} firstName={other?.firstName} lastName={other?.lastName} size="md" />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{other?.firstName} {other?.lastName}</p>
          {isTyping ? <p className="text-xs text-yellow-400">typing...</p> : <p className="text-xs text-gray-500 capitalize">{other?.role}</p>}
        </div>
        {conversation?.property && <p className="text-xs text-gray-400 text-right max-w-32 truncate">{conversation.property.title}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full"><p className="text-gray-500 text-sm">No messages yet. Say hello! 👋</p></div>
        ) : (
          messages.map((msg) => {
            const mine = msg.sender?._id === user?._id || msg.sender === user?._id;
            return (
              <div key={msg._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && <Avatar src={other?.avatar?.url} firstName={other?.firstName} lastName={other?.lastName} size="xs" className="mr-2 mt-1" />}
                <div className="max-w-[70%] space-y-0.5">
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${mine ? 'bg-gradient-to-br from-yellow-600 to-yellow-500 text-black rounded-br-sm' : 'bg-surface-card border border-surface-border text-gray-200 rounded-bl-sm'}`}>
                    {msg.content}
                  </div>
                  <p className={`text-[10px] text-gray-500 px-1 ${mine ? 'text-right' : 'text-left'}`}>
                    {formatTimeAgo(msg.createdAt)}{mine && msg.status === 'sending' && ' · Sending...'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="flex-shrink-0 px-4 py-3 border-t border-surface-border bg-surface-card">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-surface-light border border-surface-border rounded-2xl px-4 py-2.5">
            <textarea ref={inputRef} value={content} onChange={handleInput} onKeyDown={onKeyDown} placeholder="Type a message..." rows={1}
              className="w-full bg-transparent text-white text-sm placeholder-gray-500 outline-none resize-none max-h-24" />
          </div>
          <button onClick={send} disabled={!content.trim()} className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-400 flex items-center justify-center text-black hover:shadow-gold transition-all disabled:opacity-50 flex-shrink-0">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
