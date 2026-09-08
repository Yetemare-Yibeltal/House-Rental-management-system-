// nestfind/nestfind/client/src/components/layout/DashboardLayout.jsx

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'
import TenantSidebar from './TenantSidebar'
import LandlordSidebar from './LandlordSidebar'
import AdminSidebar from './AdminSidebar'
import Toast from '../ui/Toast'
import GoldCursor from '../ui/GoldCursor'
import { useAIStore } from '../../context/AIContext'

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isAdmin, isLandlord, isTenant } = useAuthStore()
  const { isChatOpen } = useAIStore()

  const SidebarComponent = isAdmin
    ? AdminSidebar
    : isLandlord
    ? LandlordSidebar
    : TenantSidebar

  return (
    <div className='flex h-screen bg-dark overflow-hidden'>
      <GoldCursor />
      <Toast />

      {/* Sidebar */}
      <SidebarComponent
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Mobile Header */}
        <div className='lg:hidden flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-card'>
          <button
            onClick={() => setSidebarOpen(true)}
            className='p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors'
          >
            <Menu size={20} />
          </button>
          <span className='text-sm font-semibold text-white'>
            {isAdmin
              ? 'Admin Panel'
              : isLandlord
              ? 'Landlord Dashboard'
              : 'Tenant Dashboard'}
          </span>
          <div className='w-9' />
        </div>

        {/* Page Content */}
        <main className='flex-1 overflow-y-auto'>
          <div className='max-w-7xl mx-auto p-4 sm:p-6 lg:p-8'>{children}</div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
