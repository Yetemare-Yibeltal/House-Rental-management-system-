// nestfind/nestfind/client/src/pages/landlord/BookingRequests.jsx

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import BookingRequestCard from '../../components/landlord/BookingRequestCard'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import landlordApi from '../../api/landlordApi'

const STATUS_FILTERS = [
  'all',
  'pending',
  'approved',
  'declined',
  'completed',
  'cancelled'
]

const BookingRequests = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState({})

  const fetchBookings = useCallback(
    async (page = 1, status = statusFilter) => {
      setLoading(true)
      try {
        const params = { page, limit: 12 }
        if (status !== 'all') params.status = status
        const response = await landlordApi.getBookings(params)
        setBookings(response.data.data || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
        setCounts(response.data.counts || {})
        setCurrentPage(page)
      } catch {
      } finally {
        setLoading(false)
      }
    },
    [statusFilter]
  )

  useEffect(() => {
    fetchBookings(1, statusFilter)
  }, [statusFilter])

  return (
    <DashboardLayout>
      <SEO title='Booking Requests' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Booking Requests
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Manage tenant visit requests for your properties
          {counts.pending > 0 && (
            <span className='text-yellow-400 font-semibold'>
              {' '}
              · {counts.pending} pending
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-2 mb-5'>
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border capitalize transition-all ${
              statusFilter === s
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : 'border-surface-border text-gray-400 hover:border-yellow-500/30'
            }`}
          >
            {s} {counts[s] > 0 && `(${counts[s]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader text='Loading booking requests...' />
      ) : bookings.length === 0 ? (
        <EmptyState
          emoji='📅'
          title='No Booking Requests'
          description={
            statusFilter !== 'all'
              ? `No ${statusFilter} booking requests found.`
              : 'Tenants will send visit requests when they are interested in your properties.'
          }
        />
      ) : (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {bookings.map(booking => (
              <BookingRequestCard
                key={booking._id}
                booking={booking}
                onUpdate={() => fetchBookings(currentPage, statusFilter)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className='flex justify-center mt-6'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={p => fetchBookings(p, statusFilter)}
              />
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

export default BookingRequests
