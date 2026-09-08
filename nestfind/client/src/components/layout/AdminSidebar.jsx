// nestfind/nestfind/client/src/components/layout/AdminSidebar.jsx

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Flag,
  Star,
  Settings,
  FileText,
  HelpCircle,
  Shield,
  BarChart3,
  Bell,
  LogOut,
  Home,
  Bot,
  ScrollText
} from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../ui/Avatar'
import GradientText from '../ui/GradientText'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/kyc', icon: Shield, label: 'KYC Verification' },
  { to: '/admin/properties', icon: Building2, label: 'Properties' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments & Revenue' },
  { to: '/admin/reports', icon: Flag, label: 'Reports' },
  { to: '/admin/reviews', icon: Star, label: 'Reviews' },
  { to: '/admin/blog', icon: FileText, label: 'Blog CMS' },
  { to: '/admin/faq', icon: HelpCircle, label: 'FAQ Management' },
  { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/settings', icon: Settings, label: 'System Settings' }
]

const AdminSidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore()
  const { logout } = useAuth()

  return (
    <>
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/60 z-30 lg:hidden'
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-surface-card border-r border-surface-border
          flex flex-col z-40 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className='flex items-center gap-2 px-5 py-4 border-b border-surface-border'>
          <div className='w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center'>
            <Home size={14} className='text-black' />
          </div>
          <div>
            <span className='font-bold font-display text-base'>
              <GradientText>NestFind</GradientText>
            </span>
            <p className='text-[10px] text-red-400 font-semibold'>
              Admin Panel
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className='px-4 py-3 border-b border-surface-border'>
          <div className='flex items-center gap-3'>
            <Avatar
              src={user?.avatar?.url}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size='sm'
            />
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-semibold text-white truncate'>
                {user?.firstName} {user?.lastName}
              </p>
              <p className='text-xs text-red-400'>Administrator</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className='flex-1 overflow-y-auto py-3 px-3 space-y-0.5'>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                ${
                  isActive
                    ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? 'text-yellow-400'
                        : 'text-gray-500 group-hover:text-gray-300'
                    }
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}

          {/* AI Section */}
          <div className='pt-2 mt-2 border-t border-surface-border'>
            <p className='text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-3 mb-1'>
              AI Management
            </p>
            <NavLink
              to='/admin/ai'
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all
                ${
                  isActive
                    ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Bot size={15} className='text-yellow-500/60' />
              AI Statistics
            </NavLink>
          </div>
        </nav>

        {/* Logout */}
        <div className='p-3 border-t border-surface-border'>
          <button
            onClick={logout}
            className='flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors'
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar
