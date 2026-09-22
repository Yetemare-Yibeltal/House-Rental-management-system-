// nestfind/nestfind/client/src/pages/admin/KYCVerification.jsx

import { useState, useEffect, useCallback } from 'react'
import { Shield } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import AdminDataTable from '../../components/admin/AdminDataTable'
import KYCReviewModal from '../../components/admin/KYCReviewModal'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import SEO from '../../components/common/SEO'
import adminApi from '../../api/adminApi'
import { formatDate, formatTimeAgo } from '../../utils/formatters'

const KYCVerification = () => {
  const [kycs, setKycs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [selectedKYC, setSelectedKYC] = useState(null)

  const fetchKYCs = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params = { page, limit: 15 }
        if (statusFilter !== 'all') params.status = statusFilter
        const response = await adminApi.getKYCSubmissions(params)
        setKycs(response.data.data || [])
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
    fetchKYCs(1)
  }, [statusFilter])

  const columns = [
    {
      key: 'user',
      label: 'Applicant',
      render: val => (
        <div className='flex items-center gap-2'>
          <Avatar
            src={val?.avatar?.url}
            firstName={val?.firstName}
            lastName={val?.lastName}
            size='sm'
          />
          <div>
            <p className='text-sm font-semibold text-white'>
              {val?.firstName} {val?.lastName}
            </p>
            <p className='text-xs text-gray-400'>{val?.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'user',
      label: 'Role',
      render: val => (
        <Badge variant='gold' size='xs' className='capitalize'>
          {val?.role}
        </Badge>
      )
    },
    {
      key: 'primaryDocumentType',
      label: 'Document',
      render: val => (
        <span className='text-xs capitalize'>{val?.replace(/_/g, ' ')}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: val => <Badge status={val} size='xs' dot />
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      render: val => (
        <span className='text-xs text-gray-400'>{formatTimeAgo(val)}</span>
      )
    },
    {
      key: '_id',
      label: 'Action',
      render: (_, row) => (
        <Button
          variant='outline'
          size='xs'
          icon={Shield}
          onClick={() => setSelectedKYC(row)}
        >
          Review
        </Button>
      )
    }
  ]

  return (
    <DashboardLayout>
      <SEO title='KYC Verification' />
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          KYC Verification
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Review and approve identity verification submissions
        </p>
      </div>
      <div className='flex flex-wrap gap-2 mb-4'>
        {['submitted', 'under_review', 'approved', 'rejected', 'all'].map(s => (
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
        data={kycs}
        loading={loading}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={fetchKYCs}
        emptyTitle='No KYC submissions'
        emptyDescription='No KYC submissions match the selected filter.'
        rowKey='_id'
      />
      <KYCReviewModal
        isOpen={!!selectedKYC}
        onClose={() => setSelectedKYC(null)}
        kyc={selectedKYC}
        onUpdate={() => {
          setSelectedKYC(null)
          fetchKYCs(currentPage)
        }}
      />
    </DashboardLayout>
  )
}

export default KYCVerification
