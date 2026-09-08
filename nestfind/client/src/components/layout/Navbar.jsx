// nestfind/nestfind/client/src/components/layout/Navbar.jsx

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Search,
  Heart,
  Bell,
  MessageSquare,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  LayoutDashboard,
  Building2,
  Bot
} from 'lucide-react'
import { useAuthStore } from '../../context/AuthContext'
import { useNotificationStore } from '../../context/NotificationContext'
import { useAIStore } from '../../context/AIContext'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import GradientText from '../ui/GradientText'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const profileRef = useRef(null)
  const { user, isAuthenticated, isAdmin, isLandlord, isTenant } =
    useAuthStore()
  const { unreadCount } = useNotificationStore()
  const { openChat } = useAIStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsProfileOpen(false)
  }, [location.pathname])

  const getDashboardLink = () => {
    if (isAdmin) return '/admin/dashboard'
    if (isLandlord) return '/landlord/dashboard'
    return '/tenant/dashboard'
  }

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/listings', label: 'Properties', icon: Building2 },
    { to: '/about', label: 'About', icon: null },
    { to: '/blog', label: 'Blog', icon: null },
    { to: '/faq', label: 'FAQ', icon: null }
  ]

  const isActive = path => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-dark/95 backdrop-blur-xl border-b border-surface-border shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo */}
          <Link to='/' className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center'>
              <Home size={16} className='text-black' />
            </div>
            <span className='text-lg font-bold font-display'>
              <GradientText>NestFind</GradientText>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className='hidden md:flex items-center gap-1'>
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'text-yellow-400 bg-yellow-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {Icon && <Icon size={14} />}
                {label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className='flex items-center gap-2'>
            {isAuthenticated ? (
              <>
                {/* AI Chat */}
                <button
                  onClick={() => openChat()}
                  className='p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors'
                  title='AI Assistant'
                >
                  <Bot size={18} />
                </button>

                {/* Notifications */}
                <Link
                  to={
                    isTenant
                      ? '/tenant/notifications'
                      : isLandlord
                      ? '/landlord/notifications'
                      : '/admin/notifications'
                  }
                  className='relative p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors'
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className='absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center'>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Messages */}
                <Link
                  to='/messages'
                  className='hidden sm:flex p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors'
                >
                  <MessageSquare size={18} />
                </Link>

                {/* Profile Dropdown */}
                <div ref={profileRef} className='relative'>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className='flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/5 transition-colors'
                  >
                    <Avatar
                      src={user?.avatar?.url}
                      firstName={user?.firstName}
                      lastName={user?.lastName}
                      size='sm'
                    />
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 transition-transform ${
                        isProfileOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className='absolute right-0 top-full mt-2 w-56 bg-surface-card border border-surface-border rounded-2xl shadow-2xl overflow-hidden z-50'
                      >
                        {/* User Info */}
                        <div className='px-4 py-3 border-b border-surface-border'>
                          <p className='text-sm font-semibold text-white'>
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className='text-xs text-gray-400'>{user?.email}</p>
                          <Badge variant='gold' size='xs' className='mt-1'>
                            {user?.role}
                          </Badge>
                        </div>

                        {/* Menu Items */}
                        <div className='py-1'>
                          <Link
                            to={getDashboardLink()}
                            className='flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors'
                          >
                            <LayoutDashboard size={15} />
                            Dashboard
                          </Link>
                          <Link
                            to='/profile'
                            className='flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors'
                          >
                            <User size={15} />
                            My Profile
                          </Link>
                          {isTenant && (
                            <Link
                              to='/tenant/saved-properties'
                              className='flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors'
                            >
                              <Heart size={15} />
                              Saved Properties
                            </Link>
                          )}
                          <Link
                            to='/messages'
                            className='flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors'
                          >
                            <MessageSquare size={15} />
                            Messages
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className='border-t border-surface-border py-1'>
                          <button
                            onClick={logout}
                            className='flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors'
                          >
                            <LogOut size={15} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className='flex items-center gap-2'>
                <Link
                  to='/login'
                  className='px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors'
                >
                  Sign In
                </Link>
                <Link
                  to='/register'
                  className='px-4 py-2 text-sm font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 text-black rounded-xl hover:shadow-gold transition-all'
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors'
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='md:hidden bg-dark/98 backdrop-blur-xl border-t border-surface-border overflow-hidden'
          >
            <div className='px-4 py-4 space-y-1'>
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'text-yellow-400 bg-yellow-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {Icon && <Icon size={16} />}
                  {label}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className='pt-3 border-t border-surface-border flex flex-col gap-2'>
                  <Link
                    to='/login'
                    className='w-full text-center py-2.5 text-sm font-medium border border-surface-border rounded-xl text-gray-300 hover:border-yellow-500/50'
                  >
                    Sign In
                  </Link>
                  <Link
                    to='/register'
                    className='w-full text-center py-2.5 text-sm font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 text-black rounded-xl'
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar
