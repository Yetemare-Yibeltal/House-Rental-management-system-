// nestfind/nestfind/client/src/pages/tenant/TenantNotifications.jsx

import { useEffect } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import NotificationItem from '../../components/tenant/NotificationItem'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import { useNotificationStore } from '../../context/NotificationContext'

const TenantNotifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    markAllAsRead,
    loadMore
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications(1)
  }, [])

  return (
    <DashboardLayout>
      <SEO title='Notifications' />

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            Notifications
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : 'All caught up!'}
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

      {loading && notifications.length === 0 ? (
        <PageLoader />
      ) : notifications.length === 0 ? (
        <EmptyState
          emoji='🔔'
          title='No notifications'
          description="You're all caught up! Notifications about your bookings, payments, and rentals will appear here."
        />
      ) : (
        <div className='bg-surface-card border border-surface-border rounded-2xl overflow-hidden'>
          {notifications.map((notification, i) => (
            <div
              key={notification._id}
              className={
                i < notifications.length - 1
                  ? 'border-b border-surface-border'
                  : ''
              }
            >
              <NotificationItem notification={notification} />
            </div>
          ))}
          {hasMore && (
            <div className='p-4 text-center border-t border-surface-border'>
              <Button
                variant='ghost'
                size='sm'
                onClick={loadMore}
                loading={loading}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

export default TenantNotifications
