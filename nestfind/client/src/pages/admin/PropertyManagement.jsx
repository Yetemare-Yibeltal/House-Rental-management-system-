// nestfind/nestfind/client/src/pages/admin/PropertyManagement.jsx

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import AdminDataTable from '../../components/admin/AdminDataTable'
import Badge from '../../components/ui/Badge'
import SEO from '../../components/common/SEO'
import adminApi from '../../api/adminApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const PropertyManagement = () => {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending_review')
  const [search, setSearch] = useState('')

  const fetchProperties = useCallback(
    async (page = 1, q = search) => {
      setLoading(true)
      try {
        const params = { page, limit: 15 }
        if (q) params.search = q
        if (statusFilter !== 'all') params.status = statusFilter
        const response = await adminApi.getProperties(params)
        setProperties(response.data.data || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
        setCurrentPage(page)
      } catch {
      } finally {
        setLoading(false)
      }
    },
    [search, statusFilter]
  )

  useEffect(() => {
    fetchProperties(1, search)
  }, [statusFilter])

  const handleApprove = async propertyId => {
    try {
      await adminApi.approveProperty(propertyId)
      toast.success('Property approved and is now live')
      fetchProperties(currentPage, search)
    } catch {
      toast.error('Failed to approve property')
    }
  }

  const handleReject = async propertyId => {
    try {
      await adminApi.rejectProperty(propertyId, {
        reason: 'Does not meet platform standards'
      })
      toast.success('Property rejected')
      fetchProperties(currentPage, search)
    } catch {
      toast.error('Failed to reject property')
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Property',
      render: (val, row) => (
        <div className='flex items-center gap-2'>
          {row.coverImage?.url ? (
            <img
              src={row.coverImage.url}
              alt=''
              className='w-10 h-8 object-cover rounded-lg flex-shrink-0'
            />
          ) : (
            <div className='w-10 h-8 bg-surface-light rounded-lg flex items-center justify-center flex-shrink-0 text-base'>
              🏠
            </div>
          )}
          <div>
            <p className='text-sm font-semibold text-white line-clamp-1'>
              {val}
            </p>
            <p className='text-xs text-gray-400'>{row.location?.subCity}</p>
          </div>
        </div>
      )
    },
    {
      key: 'propertyType',
      label: 'Type',
      render: val => <span className='text-xs capitalize'>{val}</span>
    },
    {
      key: 'pricing',
      label: 'Rent',
      render: val => (
        <span className='font-bold text-yellow-400 text-xs'>
          {formatCurrency(val?.monthlyRent)}/mo
        </span>
      )
    },
    {
      key: 'landlord',
      label: 'Landlord',
      render: val => (
        <div>
          <p className='text-xs font-semibold text-white'>
            {val?.firstName} {val?.lastName}
          </p>
          <p className='text-[10px] text-gray-400'>
            {val?.isKYCVerified ? '✅ Verified' : '⚠️ Unverified'}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: val => <Badge status={val} size='xs' dot />
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className='flex gap-1'>
          <Link
            to={`/property/${row._id}`}
            className='p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors'
          >
            <Eye size={13} />
          </Link>
          {row.status === 'pending_review' && (
            <>
              <button
                onClick={() => handleApprove(row._id)}
                className='p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors'
              >
                <CheckCircle size={13} />
              </button>
              <button
                onClick={() => handleReject(row._id)}
                className='p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors'
              >
                <XCircle size={13} />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <DashboardLayout>
      <SEO title='Property Management' />
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Property Management
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Review and manage all property listings
        </p>
      </div>
      <div className='flex flex-wrap gap-2 mb-4'>
        {['pending_review', 'active', 'inactive', 'rejected', 'all'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border capitalize transition-all ${
              statusFilter === s
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : 'border-surface-border text-gray-400 hover:border-yellow-500/30'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
      <AdminDataTable
        title=''
        columns={columns}
        data={properties}
        loading={loading}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={p => fetchProperties(p, search)}
        emptyTitle='No properties found'
        searchPlaceholder='Search properties...'
        onSearch={q => {
          setSearch(q)
          fetchProperties(1, q)
        }}
        rowKey='_id'
      />
    </DashboardLayout>
  )
}

export default PropertyManagement
