// nestfind/nestfind/client/src/pages/admin/ReviewsManagement.jsx

import { useState, useEffect } from 'react'
import { Star, CheckCircle, XCircle } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import AdminDataTable from '../../components/admin/AdminDataTable'
import Badge from '../../components/ui/Badge'
import SEO from '../../components/common/SEO'
import adminApi from '../../api/adminApi'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending')

  const fetchReviews = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 15 }
      if (statusFilter !== 'all') params.status = statusFilter
      const response = await adminApi.getReviews(params)
      setReviews(response.data.data || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews(1)
  }, [statusFilter])

  const handleModerate = async (reviewId, action) => {
    try {
      await adminApi.moderateReview(reviewId, { action })
      toast.success(`Review ${action}d`)
      fetchReviews(currentPage)
    } catch {
      toast.error('Failed to moderate review')
    }
  }

  const columns = [
    {
      key: 'reviewer',
      label: 'Reviewer',
      render: val => (
        <span className='text-xs text-white'>
          {val?.firstName} {val?.lastName}
        </span>
      )
    },
    {
      key: 'property',
      label: 'Property',
      render: val => (
        <span className='text-xs text-gray-300 line-clamp-1'>{val?.title}</span>
      )
    },
    {
      key: 'rating',
      label: 'Rating',
      render: val => (
        <div className='flex items-center gap-1'>
          <Star size={11} className='text-yellow-400 fill-yellow-400' />
          <span className='text-xs font-bold text-white'>{val}/5</span>
        </div>
      )
    },
    {
      key: 'comment',
      label: 'Comment',
      render: val => (
        <span className='text-xs text-gray-400 line-clamp-2'>{val}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: val => <Badge status={val} size='xs' dot />
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: val => (
        <span className='text-xs text-gray-400'>{formatDate(val)}</span>
      )
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) =>
        row.status === 'pending' ? (
          <div className='flex gap-1'>
            <button
              onClick={() => handleModerate(row._id, 'approve')}
              className='p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors'
            >
              <CheckCircle size={13} />
            </button>
            <button
              onClick={() => handleModerate(row._id, 'reject')}
              className='p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors'
            >
              <XCircle size={13} />
            </button>
          </div>
        ) : null
    }
  ]

  return (
    <DashboardLayout>
      <SEO title='Reviews Management' />
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Reviews Management
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Moderate property and landlord reviews
        </p>
      </div>
      <div className='flex flex-wrap gap-2 mb-4'>
        {['pending', 'approved', 'rejected', 'all'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border capitalize transition-all ${
              statusFilter === s
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : 'border-surface-border text-gray-400 hover:border-yellow-500/30'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <AdminDataTable
        title=''
        columns={columns}
        data={reviews}
        loading={loading}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={fetchReviews}
        emptyTitle='No reviews found'
        rowKey='_id'
      />
    </DashboardLayout>
  )
}

export default ReviewsManagement
