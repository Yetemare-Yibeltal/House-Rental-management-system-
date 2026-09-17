// nestfind/nestfind/client/src/pages/tenant/TenantMessages.jsx

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ChatWindow from '../../components/tenant/ChatWindow'
import Avatar from '../../components/ui/Avatar'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import SEO from '../../components/common/SEO'
import messageApi from '../../api/messageApi'
import { useAuthStore } from '../../context/AuthContext'
import { formatTimeAgo } from '../../utils/formatters'

const TenantMessages = () => {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await messageApi.getConversations()
        setConversations(response.data.data || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchConversations()
  }, [])

  const getOtherUser = conv => {
    return conv.tenant?._id === user?._id ? conv.landlord : conv.tenant
  }

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <SEO title='Messages' />

      <div className='flex h-[calc(100vh-8rem)] bg-surface-card border border-surface-border rounded-2xl overflow-hidden'>
        {/* Conversations List */}
        <div
          className={`${
            selected ? 'hidden lg:flex' : 'flex'
          } flex-col w-full lg:w-80 border-r border-surface-border flex-shrink-0`}
        >
          <div className='px-4 py-4 border-b border-surface-border'>
            <h2 className='text-base font-bold text-white font-display'>
              Messages
            </h2>
          </div>

          {conversations.length === 0 ? (
            <EmptyState
              emoji='💬'
              title='No conversations'
              description='Start messaging a landlord from a property listing.'
              size='sm'
            />
          ) : (
            <div className='flex-1 overflow-y-auto'>
              {conversations.map(conv => {
                const other = getOtherUser(conv)
                const unread =
                  conv.tenant?._id === user?._id
                    ? conv.tenantUnreadCount
                    : conv.landlordUnreadCount
                return (
                  <button
                    key={conv._id}
                    onClick={() => setSelected(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-light transition-colors text-left ${
                      selected?._id === conv._id
                        ? 'bg-surface-light border-l-2 border-yellow-500'
                        : ''
                    }`}
                  >
                    <Avatar
                      src={other?.avatar?.url}
                      firstName={other?.firstName}
                      lastName={other?.lastName}
                      size='md'
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='flex justify-between items-center'>
                        <p className='text-sm font-semibold text-white truncate'>
                          {other?.firstName} {other?.lastName}
                        </p>
                        {conv.lastMessage?.createdAt && (
                          <span className='text-[10px] text-gray-500 flex-shrink-0'>
                            {formatTimeAgo(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-gray-400 truncate mt-0.5'>
                        {conv.lastMessage?.preview ||
                          conv.property?.title ||
                          'No messages yet'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className='w-5 h-5 bg-yellow-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0'>
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div
          className={`${selected ? 'flex' : 'hidden lg:flex'} flex-1 flex-col`}
        >
          {selected ? (
            <ChatWindow conversation={selected} />
          ) : (
            <div className='flex-1 flex flex-col items-center justify-center gap-3 text-center p-8'>
              <MessageSquare size={40} className='text-gray-600' />
              <p className='text-gray-400 text-sm'>
                Select a conversation to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TenantMessages
