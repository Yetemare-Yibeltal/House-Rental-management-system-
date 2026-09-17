// nestfind/nestfind/client/src/pages/landlord/MyProperties.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, MapPin, Bed, Bath } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import propertyApi from '../../api/propertyApi'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const STATUS_FILTERS = ['all', 'active', 'pending_review', 'rented', 'inactive']

const MyProperties = () => {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('all')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const response = await propertyApi.getProperties({ limit: 50 })
      setProperties(response.data.data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await propertyApi.deleteProperty(deleteId)
      setProperties(prev => prev.filter(p => p._id !== deleteId))
      toast.success('Property deleted')
      setDeleteId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const filtered =
    activeStatus === 'all'
      ? properties
      : properties.filter(p => p.status === activeStatus)

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <SEO title='My Properties' />

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            My Properties
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            {properties.length} total listings
          </p>
        </div>
        <Link to='/landlord/properties/add'>
          <Button variant='gold' size='sm' icon={Plus}>
            Add Property
          </Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className='flex gap-2 flex-wrap mb-5'>
        {STATUS_FILTERS.map(status => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all capitalize ${
              activeStatus === status
                ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                : 'border-surface-border text-gray-400 hover:border-yellow-500/30'
            }`}
          >
            {status.replace(/_/g, ' ')} (
            {status === 'all'
              ? properties.length
              : properties.filter(p => p.status === status).length}
            )
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji='🏠'
          title='No properties found'
          description='Add your first property listing to get started.'
          action={() => (window.location.href = '/landlord/properties/add')}
          actionLabel='Add Property'
        />
      ) : (
        <div className='space-y-4'>
          {filtered.map(property => (
            <div
              key={property._id}
              className='bg-surface-card border border-surface-border rounded-2xl p-4 hover:border-yellow-500/20 transition-all'
            >
              <div className='flex gap-4'>
                {/* Thumbnail */}
                <div className='w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-light'>
                  {property.coverImage?.url ? (
                    <img
                      src={property.coverImage.url}
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
                    <p className='text-sm font-bold text-white line-clamp-1'>
                      {property.title}
                    </p>
                    <Badge status={property.status} size='xs' dot />
                  </div>
                  <div className='flex items-center gap-1 mb-1.5'>
                    <MapPin size={11} className='text-yellow-500' />
                    <span className='text-xs text-gray-400'>
                      {property.location?.subCity}, {property.location?.city}
                    </span>
                  </div>
                  <div className='flex items-center gap-3 mb-2 text-xs text-gray-400'>
                    <span className='flex items-center gap-0.5'>
                      <Bed size={11} /> {property.details?.bedrooms}bd
                    </span>
                    <span className='flex items-center gap-0.5'>
                      <Bath size={11} /> {property.details?.bathrooms}ba
                    </span>
                    <span className='font-bold text-yellow-400'>
                      {formatCurrency(property.pricing?.monthlyRent)}/mo
                    </span>
                  </div>
                  <div className='flex gap-2'>
                    <Link to={`/property/${property._id}`}>
                      <Button variant='ghost' size='xs' icon={Eye}>
                        View
                      </Button>
                    </Link>
                    <Link to={`/landlord/properties/edit/${property._id}`}>
                      <Button variant='outline' size='xs' icon={Edit}>
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant='danger'
                      size='xs'
                      icon={Trash2}
                      onClick={() => setDeleteId(property._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title='Delete Property?'
        message='This will permanently remove this property listing. This action cannot be undone.'
        type='danger'
        confirmLabel='Delete Property'
        loading={deleting}
      />
    </DashboardLayout>
  )
}

export default MyProperties
