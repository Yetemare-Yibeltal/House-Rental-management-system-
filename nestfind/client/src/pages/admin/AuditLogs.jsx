// nestfind/nestfind/client/src/pages/admin/AuditLogs.jsx

import { useState, useEffect } from 'react'
import { ScrollText } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import AdminDataTable from '../../components/admin/AdminDataTable'
import Badge from '../../components/ui/Badge'
import SEO from '../../components/common/SEO'
import adminApi from '../../api/adminApi'
import { formatDateTime } from '../../utils/formatters'

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  const fetchLogs = async (page = 1, q = search) => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (q) params.search = q
      const response = await adminApi.getAuditLogs(params)
      setLogs(response.data.data || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
  }, [])

  const columns = [
    {
      key: 'admin',
      label: 'Admin',
      render: val => (
        <span className='text-xs text-white'>
          {val?.firstName} {val?.lastName}
        </span>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: val => (
        <span className='text-xs font-mono text-yellow-400'>{val}</span>
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
      key: 'description',
      label: 'Description',
      render: val => (
        <span className='text-xs text-gray-300 line-clamp-2'>{val}</span>
      )
    },
    {
      key: 'ipAddress',
      label: 'IP',
      render: val => (
        <span className='text-xs font-mono text-gray-500'>{val}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Time',
      render: val => (
        <span className='text-xs text-gray-400'>{formatDateTime(val)}</span>
      )
    }
  ]

  return (
    <DashboardLayout>
      <SEO title='Audit Logs' />
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Audit Logs
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Track all admin actions on the platform
        </p>
      </div>
      <AdminDataTable
        title=''
        columns={columns}
        data={logs}
        loading={loading}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={p => fetchLogs(p, search)}
        emptyTitle='No audit logs'
        searchPlaceholder='Search logs...'
        onSearch={q => {
          setSearch(q)
          fetchLogs(1, q)
        }}
        rowKey='_id'
      />
    </DashboardLayout>
  )
}

export default AuditLogs
