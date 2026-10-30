import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ChatWindow from '../../components/tenant/ChatWindow';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import SEO from '../../components/common/SEO';
import messageApi from '../../api/messageApi';
import { useAuthStore } from '../../context/AuthContext';
import { formatTimeAgo } from '../../utils/formatters';

const LandlordMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        const res = await messageApi.getConversations();
        const data = res.data.data || [];
        setConversations(data);
        if (data.length) setSelected(data[0]);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const other = (c) => (c?.tenant?._id === user?._id ? c?.landlord : c?.tenant);

  if (loading) return <DashboardLayout><PageLoader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <SEO title="Messages" />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white font-display">Messages</h1>
        <p className="text-gray-400 text-sm mt-1">Communicate with your tenants</p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState emoji="💬" title="No Messages Yet" description="Messages from tenants interested in your properties will appear here." />
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            <div className="w-72 border-r border-surface-border flex flex-col flex-shrink-0">
              <div className="p-3 border-b border-surface-border"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conversations</p></div>
              <div className="flex-1 overflow-y-auto">
                {conversations.map((c) => {
                  const o = other(c);
                  return (
                    <button key={c._id} onClick={() => setSelected(c)} className={`flex items-center gap-3 w-full px-3 py-3 text-left border-b border-surface-border/50 transition-colors ${selected?._id === c._id ? 'bg-yellow-500/10' : 'hover:bg-surface-light'}`}>
                      <Avatar src={o?.avatar?.url} firstName={o?.firstName} lastName={o?.lastName} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <p className="text-sm font-semibold text-white truncate">{o?.firstName} {o?.lastName}</p>
                          <span className="text-[10px] text-gray-500 ml-1">{c.lastMessage?.createdAt ? formatTimeAgo(c.lastMessage.createdAt) : ''}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{c.property?.title || c.lastMessage?.content || 'No messages yet'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {selected ? <ChatWindow conversation={selected} /> : (
                <div className="h-full flex items-center justify-center"><div className="text-center"><MessageSquare size={36} className="text-gray-600 mx-auto mb-2" /><p className="text-gray-500 text-sm">Select a conversation</p></div></div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LandlordMessages;
