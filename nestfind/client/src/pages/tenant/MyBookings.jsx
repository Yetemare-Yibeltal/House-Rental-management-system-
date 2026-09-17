// nestfind/nestfind/client/src/pages/tenant/MyBookings.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SEO from '../../components/common/SEO'
import tenantApi from '../../api/tenantApi'
import { formatDate, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

const STATUS_FILTERS = [
  'all',
  'pending',
  'approved',
  'declined',
  'completed',
  'cancelled'
]

const MyBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cancelId, setCancelId] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const fetchBookings = async (status = activeStatus, page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 10 }
      if (status !== 'all') params.status = status
      const response = await tenantApi.getBookings(params)
      setBookings(response.data.data || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleStatusFilter = status => {
    setActiveStatus(status)
    fetchBookings(status, 1)
  }

  const handleCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    try {
      await tenantApi.cancelBooking(cancelId, {
        cancellationReason: 'Cancelled by tenant'
      })
      toast.success('Booking cancelled')
      setCancelId(null)
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }

  const statusIcon = status => {
    if (status === 'approved')
      return <CheckCircle size={14} className='text-green-400' />
    if (status === 'declined' || status === 'cancelled')
      return <XCircle size={14} className='text-red-400' />
    if (status === 'pending')
      return <AlertCircle size={14} className='text-yellow-400' />
    return null
  }

  return (
    <DashboardLayout>
      <SEO title='My Bookings' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          My Bookings
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Track your property visit requests
        </p>
      </div>

      {/* Status Filter */}
      <div className='flex gap-2 flex-wrap mb-5'>
        {STATUS_FILTERS.map(status => (
          <button
            key={status}
            onClick={() => handleStatusFilter(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all capitalize ${
              activeStatus === status
                ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                : 'border-surface-border text-gray-400 hover:border-yellow-500/30'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader text='Loading bookings...' />
      ) : bookings.length === 0 ? (
        <EmptyState
          emoji='📅'
          title='No bookings found'
          description="You haven't made any property visit requests yet."
          action={() => (window.location.href = '/listings')}
          actionLabel='Browse Properties'
        />
      ) : (
        <div className='space-y-4'>
          {bookings.map(booking => (
            <div
              key={booking._id}
              className='bg-surface-card border border-surface-border rounded-2xl p-5 hover:border-yellow-500/20 transition-all'
            >
              <div className='flex gap-4'>
                {/* Property Image */}
                <div className='w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-light'>
                  {booking.property?.coverImage?.url ? (
                    <img
                      src={booking.property.coverImage.url}
                      alt=''
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-2xl'>
                      🏠
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-2 mb-1'>
                    <Link
                      to={`/property/${booking.property?._id}`}
                      className='text-sm font-bold text-white hover:text-yellow-400 transition-colors line-clamp-1'
                    >
                      {booking.property?.title}
                    </Link>
                    <div className='flex items-center gap-1.5 flex-shrink-0'>
                      {statusIcon(booking.status)}
                      <Badge status={booking.status} size='xs' />
                    </div>
                  </div>

                  <div className='flex items-center gap-1 mb-2'>
                    <MapPin size={11} className='text-yellow-500' />
                    <span className='text-xs text-gray-400'>
                      {booking.property?.location?.subCity},{' '}
                      {booking.property?.location?.city}
                    </span>
                  </div>

                  <div className='grid grid-cols-2 gap-2 mb-3'>
                    <div className='flex items-center gap-1.5 text-xs text-gray-400'>
                      <Calendar size={11} className='text-yellow-400' />
                      <span>
                        {booking.status === 'approved' && booking.confirmedDate
                          ? `Confirmed: ${formatDate(booking.confirmedDate)}`
                          : `Requested: ${formatDate(booking.preferredDate)}`}
                      </span>
                    </div>
                    <div className='flex items-center gap-1.5 text-xs text-gray-400'>
                      <Clock size={11} className='text-yellow-400' />
                      <span>
                        {booking.status === 'approved' && booking.confirmedTime
                          ? booking.confirmedTime
                          : booking.preferredTime}
                      </span>
                    </div>
                  </div>

                  {booking.landlordResponse && (
                    <div className='p-2 bg-surface-light rounded-lg mb-2'>
                      <p className='text-xs text-gray-300'>
                        "{booking.landlordResponse}"
                      </p>
                    </div>
                  )}

                  {booking.status === 'pending' && (
                    <Button
                      variant='danger'
                      size='xs'
                      onClick={() => setCancelId(booking._id)}
                    >
                      Cancel Request
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className='flex justify-center mt-4'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={p => fetchBookings(activeStatus, p)}
              />
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title='Cancel Booking?'
        message='Are you sure you want to cancel this visit request? The landlord will be notified.'
        type='warning'
        confirmLabel='Yes, Cancel'
        loading={cancelling}
      />
    </DashboardLayout>
  )
}

export default MyBookings
