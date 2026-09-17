// nestfind/nestfind/client/src/pages/landlord/BookingRequests.jsx

import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import BookingRequestCard from '../../components/landlord/BookingRequestCard'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import landlordApi from '../../api/landlordApi'

const STATUS_FILTERS = ['all', 'pending', 'approved', 'declined', 'completed']

const BookingRequests = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchBookings = async (status = activeStatus, page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 9 }
      if (status !== 'all') params.status = status
      const response = await landlordApi.getBookings(params)
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

  return (
    <DashboardLayout>
      <SEO title='Booking Requests' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Booking Requests
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Manage property visit requests from tenants
        </p>
      </div>

      <div className='flex gap-2 flex-wrap mb-5'>
        {STATUS_FILTERS.map(status => (
          <button
            key={status}
            onClick={() => {
              setActiveStatus(status)
              fetchBookings(status, 1)
            }}
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
        <PageLoader />
      ) : bookings.length === 0 ? (
        <EmptyState
          emoji='📅'
          title='No booking requests'
          description='Tenant visit requests will appear here when they book your properties.'
        />
      ) : (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {bookings.map(booking => (
              <BookingRequestCard
                key={booking._id}
                booking={booking}
                onUpdate={() => fetchBookings()}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className='flex justify-center mt-6'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={p => fetchBookings(activeStatus, p)}
              />
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

export default BookingRequests
