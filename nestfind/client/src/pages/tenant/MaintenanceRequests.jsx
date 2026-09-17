// nestfind/nestfind/client/src/pages/tenant/MaintenanceRequests.jsx

import { useState, useEffect } from 'react'
import { Plus, Wrench } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import MaintenanceForm from '../../components/tenant/MaintenanceForm'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import tenantApi from '../../api/tenantApi'
import { formatDate, formatTimeAgo } from '../../utils/formatters'
import { URGENCY_LEVELS, MAINTENANCE_CATEGORIES } from '../../utils/constants'

const STATUS_FILTERS = [
  'all',
  'submitted',
  'acknowledged',
  'in_progress',
  'completed',
  'cancelled'
]

const MaintenanceRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeStatus, setActiveStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState(null)

  const fetchRequests = async (status = activeStatus, page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 10 }
      if (status !== 'all') params.status = status
      const response = await tenantApi.getMaintenanceRequests(params)
      setRequests(response.data.data || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const getUrgencyColor = urgency => {
    const map = {
      emergency: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'green'
    }
    return map[urgency] || 'gray'
  }

  const getCategoryLabel = key =>
    MAINTENANCE_CATEGORIES.find(c => c.value === key)?.label || key

  return (
    <DashboardLayout>
      <SEO title='Maintenance Requests' />

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            Maintenance Requests
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            Report and track property issues
          </p>
        </div>
        <Button
          variant='gold'
          size='sm'
          icon={Plus}
          onClick={() => setShowForm(true)}
        >
          New Request
        </Button>
      </div>

      {/* Status Filter */}
      <div className='flex gap-2 flex-wrap mb-5'>
        {STATUS_FILTERS.map(status => (
          <button
            key={status}
            onClick={() => {
              setActiveStatus(status)
              fetchRequests(status, 1)
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all capitalize ${
              activeStatus === status
                ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                : 'border-surface-border text-gray-400 hover:border-yellow-500/30'
            }`}
          >
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : requests.length === 0 ? (
        <EmptyState
          emoji='🔧'
          title='No maintenance requests'
          description='Submit a request when you have an issue with your rental property.'
          action={() => setShowForm(true)}
          actionLabel='Submit Request'
        />
      ) : (
        <div className='space-y-4'>
          {requests.map(req => (
            <div
              key={req._id}
              onClick={() => setSelected(req)}
              className='bg-surface-card border border-surface-border rounded-2xl p-5 hover:border-yellow-500/20 transition-all cursor-pointer'
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-bold text-white line-clamp-1'>
                    {req.title}
                  </p>
                  <p className='text-xs text-gray-400 mt-0.5'>
                    {getCategoryLabel(req.category)} ·{' '}
                    {formatTimeAgo(req.createdAt)}
                  </p>
                </div>
                <div className='flex gap-2 ml-3'>
                  <Badge variant={getUrgencyColor(req.urgency)} size='xs'>
                    {req.urgency}
                  </Badge>
                  <Badge status={req.status} size='xs' dot />
                </div>
              </div>
              <p className='text-xs text-gray-400 line-clamp-2 mb-3'>
                {req.description}
              </p>
              {req.landlordResponse?.message && (
                <div className='p-2.5 bg-surface-light rounded-xl'>
                  <p className='text-[10px] text-gray-500 mb-0.5'>
                    Landlord response
                  </p>
                  <p className='text-xs text-gray-300 line-clamp-2'>
                    {req.landlordResponse.message}
                  </p>
                </div>
              )}
            </div>
          ))}
          {totalPages > 1 && (
            <div className='flex justify-center mt-4'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={p => fetchRequests(activeStatus, p)}
              />
            </div>
          )}
        </div>
      )}

      {/* New Request Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title='Submit Maintenance Request'
        size='md'
      >
        <MaintenanceForm
          onSuccess={() => {
            setShowForm(false)
            fetchRequests()
          }}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title='Request Details'
        size='md'
      >
        {selected && (
          <div className='space-y-4'>
            <div className='flex gap-2'>
              <Badge variant={getUrgencyColor(selected.urgency)} size='sm'>
                {selected.urgency}
              </Badge>
              <Badge status={selected.status} size='sm' dot />
            </div>
            <div>
              <p className='text-xs text-gray-500 mb-1'>Issue</p>
              <p className='text-sm font-bold text-white'>{selected.title}</p>
            </div>
            <div>
              <p className='text-xs text-gray-500 mb-1'>Description</p>
              <p className='text-sm text-gray-300 leading-relaxed'>
                {selected.description}
              </p>
            </div>
            {selected.ai?.diagnosis && (
              <div className='p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl'>
                <p className='text-xs font-semibold text-yellow-400 mb-1'>
                  AI Diagnosis
                </p>
                <p className='text-xs text-gray-300'>{selected.ai.diagnosis}</p>
              </div>
            )}
            {selected.landlordResponse?.estimatedCompletionDate && (
              <div className='grid grid-cols-2 gap-2'>
                <div className='bg-surface-light rounded-xl p-3'>
                  <p className='text-[10px] text-gray-500'>Est. Completion</p>
                  <p className='text-xs font-semibold text-white'>
                    {formatDate(
                      selected.landlordResponse.estimatedCompletionDate
                    )}
                  </p>
                </div>
                {selected.repairCost > 0 && (
                  <div className='bg-surface-light rounded-xl p-3'>
                    <p className='text-[10px] text-gray-500'>Repair Cost</p>
                    <p className='text-xs font-semibold text-yellow-400'>
                      ETB {selected.repairCost?.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}

export default MaintenanceRequests
