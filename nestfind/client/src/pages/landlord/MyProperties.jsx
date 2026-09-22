// nestfind/nestfind/client/src/pages/landlord/MyProperties.jsx

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Building2,
  MapPin,
  Bed,
  Bath
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import landlordApi from '../../api/landlordApi'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const STATUS_FILTERS = ['all', 'active', 'pending_review', 'inactive', 'draft']

const MyProperties = () => {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProperties = useCallback(
    async (page = 1, status = statusFilter) => {
      setLoading(true)
      try {
        const params = { page, limit: 9 }
        if (status !== 'all') params.status = status
        const response = await landlordApi.getProperties(params)
        setProperties(response.data.data || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
        setCurrentPage(page)
      } catch {
      } finally {
        setLoading(false)
      }
    },
    [statusFilter]
  )

  useEffect(() => {
    fetchProperties(1, statusFilter)
  }, [statusFilter])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await landlordApi.deleteProperty(deleteId)
      toast.success('Property deleted')
      setDeleteId(null)
      fetchProperties(currentPage, statusFilter)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete property')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <DashboardLayout>
      <SEO title='My Properties' />

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            My Properties
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            Manage your rental listings
          </p>
        </div>
        <Link to='/landlord/properties/add'>
          <Button variant='gold' size='sm' icon={Plus}>
            Add Property
          </Button>
        </Link>
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
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader text='Loading properties...' />
      ) : properties.length === 0 ? (
        <EmptyState
          emoji='🏠'
          title='No Properties Found'
          description='Start listing your properties to find verified tenants.'
          action={() => (window.location.href = '/landlord/properties/add')}
          actionLabel='Add Your First Property'
        />
      ) : (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
            {properties.map(property => (
              <div
                key={property._id}
                className='bg-surface-card border border-surface-border rounded-2xl overflow-hidden hover:border-yellow-500/20 transition-all group'
              >
                {/* Image */}
                <div className='relative h-44 bg-surface-light overflow-hidden'>
                  {property.coverImage?.url ? (
                    <img
                      src={property.coverImage.url}
                      alt={property.title}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-4xl'>
                      🏠
                    </div>
                  )}
                  <div className='absolute top-2 left-2'>
                    <Badge status={property.status} size='xs' dot />
                  </div>
                  {property.isFeatured && (
                    <div className='absolute top-2 right-2'>
                      <Badge variant='gold' size='xs'>
                        ⭐ Featured
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className='p-4'>
                  <h3 className='text-sm font-bold text-white mb-1 line-clamp-1'>
                    {property.title}
                  </h3>
                  <div className='flex items-center gap-1 mb-2'>
                    <MapPin size={11} className='text-yellow-500' />
                    <span className='text-xs text-gray-400'>
                      {property.location?.subCity}
                    </span>
                  </div>

                  <div className='flex items-center gap-3 text-xs text-gray-400 mb-3'>
                    <span className='flex items-center gap-1'>
                      <Bed size={11} />
                      {property.details?.bedrooms === 0
                        ? 'Studio'
                        : `${property.details?.bedrooms}bd`}
                    </span>
                    <span className='flex items-center gap-1'>
                      <Bath size={11} />
                      {property.details?.bathrooms}ba
                    </span>
                  </div>

                  <div className='flex items-center justify-between mb-3'>
                    <p className='text-base font-bold text-yellow-400'>
                      {formatCurrency(property.pricing?.monthlyRent)}
                      <span className='text-xs text-gray-500 font-normal'>
                        /mo
                      </span>
                    </p>
                    <div className='flex gap-2 text-xs text-gray-500'>
                      <span>{property.stats?.totalViews || 0} views</span>
                      <span>{property.stats?.totalBookings || 0} bookings</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex gap-2'>
                    <Link
                      to={`/property/${property._id}`}
                      className='flex items-center gap-1 px-2.5 py-1.5 text-xs border border-surface-border text-gray-400 rounded-lg hover:border-yellow-500/50 hover:text-yellow-400 transition-all'
                    >
                      <Eye size={11} /> View
                    </Link>
                    <Link
                      to={`/landlord/properties/edit/${property._id}`}
                      className='flex items-center gap-1 px-2.5 py-1.5 text-xs border border-surface-border text-gray-400 rounded-lg hover:border-blue-500/50 hover:text-blue-400 transition-all'
                    >
                      <Edit size={11} /> Edit
                    </Link>
                    <button
                      onClick={() => setDeleteId(property._id)}
                      className='flex items-center gap-1 px-2.5 py-1.5 text-xs border border-surface-border text-gray-400 rounded-lg hover:border-red-500/50 hover:text-red-400 transition-all'
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className='flex justify-center mt-6'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={p => fetchProperties(p, statusFilter)}
              />
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title='Delete Property?'
        message='This will permanently delete the property listing and all associated data. This cannot be undone.'
        type='danger'
        confirmLabel='Delete Property'
        loading={deleting}
      />
    </DashboardLayout>
  )
}

export default MyProperties
