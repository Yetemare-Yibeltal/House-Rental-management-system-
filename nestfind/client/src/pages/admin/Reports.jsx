// nestfind/nestfind/client/src/pages/admin/Reports.jsx

import { useState, useEffect, useCallback } from 'react'
import { Flag, CheckCircle, XCircle, Eye } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import AdminDataTable from '../../components/admin/AdminDataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import SEO from '../../components/common/SEO'
import adminApi from '../../api/adminApi'
import { formatTimeAgo } from '../../utils/formatters'
import toast from 'react-hot-toast'

const Reports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedReport, setSelectedReport] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchReports = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params = { page, limit: 15 }
        if (statusFilter !== 'all') params.status = statusFilter
        const response = await adminApi.getReports(params)
        setReports(response.data.data || [])
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
    fetchReports(1)
  }, [statusFilter])

  const handleResolve = async (reportId, action) => {
    setActionLoading(true)
    try {
      await adminApi.resolveReport(reportId, {
        action,
        adminNote: 'Reviewed by admin'
      })
      toast.success(`Report ${action}d`)
      setSelectedReport(null)
      fetchReports(currentPage)
    } catch {
      toast.error('Failed to process report')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    {
      key: 'reason',
      label: 'Reason',
      render: val => (
        <span className='text-xs capitalize font-semibold text-white'>
          {val?.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'reportedBy',
      label: 'Reporter',
      render: val => (
        <span className='text-xs text-gray-300'>
          {val?.firstName} {val?.lastName}
        </span>
      )
    },
    {
      key: 'targetType',
      label: 'Target',
      render: val => (
        <Badge variant='gray' size='xs' className='capitalize'>
          {val}
        </Badge>
      )
    },
    {
      key: 'severity',
      label: 'Severity',
      render: val => (
        <Badge
          variant={
            val === 'critical' ? 'red' : val === 'high' ? 'orange' : 'gold'
          }
          size='xs'
          className='capitalize'
        >
          {val}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: val => <Badge status={val} size='xs' dot />
    },
    {
      key: 'createdAt',
      label: 'Reported',
      render: val => (
        <span className='text-xs text-gray-400'>{formatTimeAgo(val)}</span>
      )
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => setSelectedReport(row)}
          className='p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors'
        >
          <Eye size={13} />
        </button>
      )
    }
  ]

  return (
    <DashboardLayout>
      <SEO title='Reports' />
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>Reports</h1>
        <p className='text-gray-400 text-sm mt-1'>
          Review and resolve user reports
        </p>
      </div>
      <div className='flex flex-wrap gap-2 mb-4'>
        {['pending', 'investigating', 'resolved', 'dismissed', 'all'].map(s => (
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
        data={reports}
        loading={loading}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={fetchReports}
        emptyTitle='No reports found'
        rowKey='_id'
      />
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title='Report Details'
        size='md'
      >
        {selectedReport && (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              {[
                {
                  label: 'Reason',
                  value: selectedReport.reason?.replace(/_/g, ' ')
                },
                { label: 'Severity', value: selectedReport.severity },
                { label: 'Target Type', value: selectedReport.targetType },
                { label: 'Status', value: selectedReport.status }
              ].map(({ label, value }) => (
                <div key={label} className='bg-surface-light rounded-xl p-3'>
                  <p className='text-xs text-gray-500'>{label}</p>
                  <p className='text-sm font-semibold text-white capitalize mt-0.5'>
                    {value}
                  </p>
                </div>
              ))}
            </div>
            {selectedReport.description && (
              <div className='bg-surface-light rounded-xl p-4'>
                <p className='text-xs text-gray-500 mb-1'>Description</p>
                <p className='text-sm text-gray-300'>
                  {selectedReport.description}
                </p>
              </div>
            )}
            {selectedReport.status === 'pending' && (
              <div className='flex gap-2'>
                <Button
                  variant='danger'
                  fullWidth
                  icon={XCircle}
                  loading={actionLoading}
                  onClick={() => handleResolve(selectedReport._id, 'dismiss')}
                >
                  Dismiss
                </Button>
                <Button
                  variant='gold'
                  fullWidth
                  icon={CheckCircle}
                  loading={actionLoading}
                  onClick={() => handleResolve(selectedReport._id, 'resolve')}
                >
                  Resolve
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}

export default Reports
