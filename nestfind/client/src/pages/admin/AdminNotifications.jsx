// nestfind/nestfind/client/src/pages/admin/AdminNotifications.jsx

import { useState } from 'react'
import { Send, CheckCheck } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import NotificationItem from '../../components/tenant/NotificationItem'
import BroadcastForm from '../../components/admin/BroadcastForm'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import { useNotificationStore } from '../../context/NotificationContext'

const AdminNotifications = () => {
  const [showBroadcast, setShowBroadcast] = useState(false)
  const { notifications, loading, unreadCount, markAllAsRead } =
    useNotificationStore()
  const filtered = notifications.filter(n => n.status !== 'archived')

  return (
    <DashboardLayout>
      <SEO title='Admin Notifications' />

      <div className='flex items-center justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            Notifications
          </h1>
          <p className='text-gray-400 text-sm mt-0.5'>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        <div className='flex gap-2'>
          {unreadCount > 0 && (
            <Button
              variant='outline'
              size='sm'
              icon={CheckCheck}
              onClick={markAllAsRead}
            >
              Mark All Read
            </Button>
          )}
          <Button
            variant='gold'
            size='sm'
            icon={Send}
            onClick={() => setShowBroadcast(true)}
          >
            Send Broadcast
          </Button>
        </div>
      </div>

      {loading ? (
        <PageLoader text='Loading notifications...' />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji='🔔'
          title='No Notifications'
          description='Platform notifications will appear here.'
        />
      ) : (
        <div className='bg-surface-card border border-surface-border rounded-2xl overflow-hidden'>
          <AnimatePresence>
            {filtered.map((notification, i) => (
              <div
                key={notification._id}
                className={
                  i < filtered.length - 1
                    ? 'border-b border-surface-border'
                    : ''
                }
              >
                <NotificationItem notification={notification} />
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={showBroadcast}
        onClose={() => setShowBroadcast(false)}
        title='Send Broadcast'
        size='md'
      >
        <BroadcastForm onSuccess={() => setShowBroadcast(false)} />
      </Modal>
    </DashboardLayout>
  )
}

export default AdminNotifications
