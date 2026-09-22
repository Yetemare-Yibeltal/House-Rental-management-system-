// nestfind/nestfind/client/src/pages/landlord/LandlordNotifications.jsx

import { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import NotificationItem from '../../components/tenant/NotificationItem'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import { useNotificationStore } from '../../context/NotificationContext'

const LandlordNotifications = () => {
  const [priorityFilter, setPriorityFilter] = useState('all')
  const { notifications, loading, unreadCount, markAllAsRead } =
    useNotificationStore()

  const filtered = notifications.filter(
    n =>
      n.status !== 'archived' &&
      (priorityFilter === 'all' || n.priority === priorityFilter)
  )

  return (
    <DashboardLayout>
      <SEO title='Notifications' />

      <div className='flex items-center justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            Notifications
          </h1>
          <p className='text-gray-400 text-sm mt-0.5'>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
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
      </div>

      {/* Priority Filters */}
      <div className='flex flex-wrap gap-2 mb-5'>
        {['all', 'urgent', 'high', 'normal', 'low'].map(p => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border capitalize transition-all ${
              priorityFilter === p
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : 'border-surface-border text-gray-400 hover:border-yellow-500/30'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader text='Loading notifications...' />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji='🔔'
          title='No Notifications'
          description="You're all caught up! Notifications about bookings, payments, and maintenance will appear here."
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
    </DashboardLayout>
  )
}

export default LandlordNotifications
