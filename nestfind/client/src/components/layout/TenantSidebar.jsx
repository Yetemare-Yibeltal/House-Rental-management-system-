// nestfind/nestfind/client/src/components/layout/TenantSidebar.jsx

import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Heart,
  BookOpen,
  FileText,
  CreditCard,
  Wrench,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Home,
  Save,
  Receipt
} from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'
import { useNotificationStore } from '../../context/NotificationContext'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../ui/Avatar'
import GradientText from '../ui/GradientText'

const navItems = [
  { to: '/tenant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/listings', icon: Search, label: 'Find Properties' },
  { to: '/tenant/saved-properties', icon: Heart, label: 'Saved Properties' },
  { to: '/tenant/saved-searches', icon: Save, label: 'Saved Searches' },
  { to: '/tenant/bookings', icon: BookOpen, label: 'My Bookings' },
  { to: '/tenant/rentals', icon: Home, label: 'Active Rentals' },
  { to: '/tenant/contracts', icon: FileText, label: 'Contracts' },
  { to: '/tenant/payments', icon: CreditCard, label: 'Payments' },
  { to: '/tenant/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/tenant/notifications', icon: Bell, label: 'Notifications' },
  { to: '/tenant/profile', icon: User, label: 'My Profile' }
]

const TenantSidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const { logout } = useAuth()

  return (
    <>
      {/* Overlay for mobile */}
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
          <span className='font-bold font-display text-base'>
            <GradientText>NestFind</GradientText>
          </span>
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
              <p className='text-xs text-gray-400'>Tenant</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className='flex-1 overflow-y-auto py-3 px-3 space-y-0.5'>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
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
                  <span className='flex-1'>{label}</span>
                  {label === 'Notifications' && unreadCount > 0 && (
                    <span className='w-5 h-5 bg-yellow-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center'>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
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

export default TenantSidebar
