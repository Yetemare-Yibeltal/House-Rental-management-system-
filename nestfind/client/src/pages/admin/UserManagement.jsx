// nestfind/nestfind/client/src/pages/admin/UserManagement.jsx

import { useState, useEffect, useCallback } from 'react'
import { UserX, UserCheck, Shield } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import AdminDataTable from '../../components/admin/AdminDataTable'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Select from '../../components/ui/Select'
import SEO from '../../components/common/SEO'
import adminApi from '../../api/adminApi'
import { formatDate, formatTimeAgo } from '../../utils/formatters'
import toast from 'react-hot-toast'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionUser, setActionUser] = useState(null)
  const [actionType, setActionType] = useState('')
  const [actioning, setActioning] = useState(false)

  const fetchUsers = useCallback(
    async (page = 1, q = search) => {
      setLoading(true)
      try {
        const params = { page, limit: 15 }
        if (q) params.search = q
        if (roleFilter) params.role = roleFilter
        if (statusFilter) params.status = statusFilter
        const response = await adminApi.getUsers(params)
        setUsers(response.data.data || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
        setCurrentPage(page)
      } catch {
      } finally {
        setLoading(false)
      }
    },
    [search, roleFilter, statusFilter]
  )

  useEffect(() => {
    fetchUsers(1, search)
  }, [roleFilter, statusFilter])

  const handleUserAction = async () => {
    setActioning(true)
    try {
      if (actionType === 'suspend') {
        await adminApi.suspendUser(actionUser._id, { reason: 'Admin action' })
        toast.success('User suspended')
      } else if (actionType === 'activate') {
        await adminApi.activateUser(actionUser._id)
        toast.success('User activated')
      }
      setActionUser(null)
      fetchUsers(currentPage, search)
    } catch {
      toast.error('Action failed')
    } finally {
      setActioning(false)
    }
  }

  const columns = [
    {
      key: 'firstName',
      label: 'User',
      render: (_, row) => (
        <div className='flex items-center gap-2'>
          <Avatar
            src={row.avatar?.url}
            firstName={row.firstName}
            lastName={row.lastName}
            size='sm'
          />
          <div>
            <p className='text-sm font-semibold text-white'>
              {row.firstName} {row.lastName}
            </p>
            <p className='text-xs text-gray-400'>{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: val => (
        <Badge variant='gold' size='xs' className='capitalize'>
          {val}
        </Badge>
      )
    },
    {
      key: 'isEmailVerified',
      label: 'Email',
      render: val => (
        <Badge variant={val ? 'green' : 'red'} size='xs'>
          {val ? 'Verified' : 'Unverified'}
        </Badge>
      )
    },
    {
      key: 'isKYCVerified',
      label: 'KYC',
      render: val => (
        <Badge variant={val ? 'green' : 'gray'} size='xs'>
          {val ? 'Verified' : 'Pending'}
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
      label: 'Joined',
      render: val => (
        <span className='text-xs text-gray-400'>{formatDate(val)}</span>
      )
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className='flex gap-1'>
          {row.status === 'active' ? (
            <button
              onClick={() => {
                setActionUser(row)
                setActionType('suspend')
              }}
              className='p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors'
            >
              <UserX size={13} />
            </button>
          ) : (
            <button
              onClick={() => {
                setActionUser(row)
                setActionType('activate')
              }}
              className='p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors'
            >
              <UserCheck size={13} />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <DashboardLayout>
      <SEO title='User Management' />
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          User Management
        </h1>
        <p className='text-gray-400 text-sm mt-1'>Manage all platform users</p>
      </div>
      <AdminDataTable
        title=''
        columns={columns}
        data={users}
        loading={loading}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={p => fetchUsers(p, search)}
        emptyTitle='No users found'
        searchPlaceholder='Search by name or email...'
        onSearch={q => {
          setSearch(q)
          fetchUsers(1, q)
        }}
        filters={
          <div className='flex gap-2'>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className='bg-surface-card border border-surface-border text-gray-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-yellow-500'
            >
              <option value=''>All Roles</option>
              <option value='tenant'>Tenant</option>
              <option value='landlord'>Landlord</option>
              <option value='admin'>Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='bg-surface-card border border-surface-border text-gray-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-yellow-500'
            >
              <option value=''>All Status</option>
              <option value='active'>Active</option>
              <option value='suspended'>Suspended</option>
              <option value='inactive'>Inactive</option>
            </select>
          </div>
        }
      />
      <ConfirmDialog
        isOpen={!!actionUser}
        onClose={() => setActionUser(null)}
        onConfirm={handleUserAction}
        title={actionType === 'suspend' ? 'Suspend User?' : 'Activate User?'}
        message={`Are you sure you want to ${actionType} ${actionUser?.firstName} ${actionUser?.lastName}?`}
        type={actionType === 'suspend' ? 'danger' : 'success'}
        confirmLabel={actionType === 'suspend' ? 'Suspend' : 'Activate'}
        loading={actioning}
      />
    </DashboardLayout>
  )
}

export default UserManagement
