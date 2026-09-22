// nestfind/nestfind/client/src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'

// Context Providers
import { AuthProvider, useAuthStore } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { NotificationProvider } from './context/NotificationContext'
import { AIProvider } from './context/AIContext'

// Guards
import ProtectedRoute from './components/common/ProtectedRoute'
import RoleRoute from './components/common/RoleRoute'

// Error
import ErrorBoundary from './components/ui/ErrorBoundary'
import ErrorPage from './pages/public/ErrorPage'

// Public Pages
import LandingPage from './pages/public/LandingPage'
import ListingsPage from './pages/public/ListingsPage'
import PropertyDetailPage from './pages/public/PropertyDetailPage'
import SearchResultsPage from './pages/public/SearchResultsPage'
import AboutPage from './pages/public/AboutPage'
import ContactPage from './pages/public/ContactPage'
import FAQPage from './pages/public/FAQPage'
import BlogPage from './pages/public/BlogPage'
import TrustPage from './pages/public/TrustPage'
import NotFoundPage from './pages/public/NotFoundPage'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OTPPage from './pages/auth/OTPPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Tenant Pages
import TenantDashboard from './pages/tenant/TenantDashboard'
import MyBookings from './pages/tenant/MyBookings'
import ActiveRentals from './pages/tenant/ActiveRentals'
import MyContracts from './pages/tenant/MyContracts'
import PaymentHistory from './pages/tenant/PaymentHistory'
import MakePayment from './pages/tenant/MakePayment'
import MaintenanceRequests from './pages/tenant/MaintenanceRequests'
import SavedProperties from './pages/tenant/SavedProperties'
import SavedSearches from './pages/tenant/SavedSearches'
import TenantMessages from './pages/tenant/TenantMessages'
import TenantNotifications from './pages/tenant/TenantNotifications'
import TenantProfile from './pages/tenant/TenantProfile'

// Landlord Pages
import LandlordDashboard from './pages/landlord/LandlordDashboard'
import MyProperties from './pages/landlord/MyProperties'
import AddEditProperty from './pages/landlord/AddEditProperty'
import BookingRequests from './pages/landlord/BookingRequests'
import ManageTenants from './pages/landlord/ManageTenants'
import ContractManagement from './pages/landlord/ContractManagement'
import RentPayments from './pages/landlord/RentPayments'
import Analytics from './pages/landlord/Analytics'
import LandlordMessages from './pages/landlord/LandlordMessages'
import LandlordNotifications from './pages/landlord/LandlordNotifications'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import KYCVerification from './pages/admin/KYCVerification'
import PropertyManagement from './pages/admin/PropertyManagement'
import PaymentsRevenue from './pages/admin/PaymentsRevenue'
import Reports from './pages/admin/Reports'
import ReviewsManagement from './pages/admin/ReviewsManagement'
import BlogCMS from './pages/admin/BlogCMS'
import FAQManagement from './pages/admin/FAQManagement'
import AuditLogs from './pages/admin/AuditLogs'
import AdminNotifications from './pages/admin/AdminNotifications'
import SystemSettings from './pages/admin/SystemSettings'

// Root redirect based on role
const RootRedirect = () => {
  const { isAuthenticated, isAdmin, isLandlord, isTenant, isInitialized } =
    useAuthStore()

  if (!isInitialized) return null

  if (!isAuthenticated) return <LandingPage />
  if (isAdmin) return <Navigate to='/admin/dashboard' replace />
  if (isLandlord) return <Navigate to='/landlord/dashboard' replace />
  return <Navigate to='/tenant/dashboard' replace />
}

// Messages redirect based on role
const MessagesRedirect = () => {
  const { isLandlord } = useAuthStore()
  return isLandlord ? (
    <Navigate to='/landlord/messages' replace />
  ) : (
    <Navigate to='/tenant/messages' replace />
  )
}

// Profile redirect based on role
const ProfileRedirect = () => {
  const { isAdmin, isLandlord } = useAuthStore()
  if (isAdmin) return <Navigate to='/admin/dashboard' replace />
  if (isLandlord) return <Navigate to='/landlord/dashboard' replace />
  return <Navigate to='/tenant/profile' replace />
}

// App wrapper that initializes auth
const AppContent = () => {
  const { initialize, isInitialized } = useAuthStore()

  useEffect(() => {
    if (!isInitialized) initialize()
  }, [initialize, isInitialized])

  return (
    <ErrorBoundary>
      <Routes>
        {/* Root */}
        <Route path='/' element={<RootRedirect />} />

        {/* Public Routes */}
        <Route path='/listings' element={<ListingsPage />} />
        <Route path='/property/:id' element={<PropertyDetailPage />} />
        <Route path='/search' element={<SearchResultsPage />} />
        <Route path='/about' element={<AboutPage />} />
        <Route path='/contact' element={<ContactPage />} />
        <Route path='/faq' element={<FAQPage />} />
        <Route path='/blog' element={<BlogPage />} />
        <Route path='/blog/:slug' element={<BlogPage />} />
        <Route path='/trust' element={<TrustPage />} />

        {/* Auth Routes */}
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/verify-otp' element={<OTPPage />} />
        <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/reset-password' element={<ResetPasswordPage />} />

        {/* Protected common routes */}
        <Route
          path='/messages'
          element={
            <ProtectedRoute>
              <MessagesRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <ProfileRedirect />
            </ProtectedRoute>
          }
        />

        {/* ──────────────── TENANT ROUTES ──────────────── */}
        <Route
          path='/tenant/dashboard'
          element={
            <RoleRoute roles={['tenant']}>
              <TenantDashboard />
            </RoleRoute>
          }
        />
        <Route
          path='/tenant/bookings'
          element={
            <RoleRoute roles={['tenant']}>
              <MyBookings />
            </RoleRoute>
          }
        />
        <Route
          path='/tenant/rentals'
          element={
            <RoleRoute roles={['tenant']}>
              <ActiveRentals />
            </RoleRoute>
          }
        />
        <Route
          path='/tenant/contracts'
          element={
            <RoleRoute roles={['tenant']}>
              <MyContracts />
            </RoleRoute>
          }
        />
        <Route
          path='/tenant/payments'
          element={
            <RoleRoute roles={['tenant']}>
              <PaymentHistory />
            </RoleRoute>
          }
        />
        <Route
          path='/tenant/payments/make'
          element={
            <RoleRoute roles={['tenant']}>
              <MakePayment />
            </RoleRoute>
          }
        />
        <Route
          path='/tenant/maintenance'
          element={
            <RoleRoute roles={['tenant']}>
              <MaintenanceRequests />
            </RoleRoute>
          }
        />
        <Route
          path='/tenant/saved-properties'
          element={
            <RoleRoute roles={['tenant']}>
              <SavedProperties />
            </RoleRoute>
          }
        />
        <Route
          path='/tenant/saved-searches'
          element={
            <RoleRoute roles={['tenant']}>
              <SavedSearches />
            </RoleRoute>
          }
        />
        <Route
          path='/tenant/messages'
          element={
            <RoleRoute roles={['tenant']}>
              <TenantMessages />
            </RoleRoute>
          }
        />
        <Route
          path='/tenant/notifications'
          element={
            <RoleRoute roles={['tenant']}>
              <TenantNotifications />
            </RoleRoute>
          }
        />
        <Route
          path='/tenant/profile'
          element={
            <RoleRoute roles={['tenant']}>
              <TenantProfile />
            </RoleRoute>
          }
        />

        {/* ──────────────── LANDLORD ROUTES ──────────────── */}
        <Route
          path='/landlord/dashboard'
          element={
            <RoleRoute roles={['landlord']}>
              <LandlordDashboard />
            </RoleRoute>
          }
        />
        <Route
          path='/landlord/properties'
          element={
            <RoleRoute roles={['landlord']}>
              <MyProperties />
            </RoleRoute>
          }
        />
        <Route
          path='/landlord/properties/add'
          element={
            <RoleRoute roles={['landlord']}>
              <AddEditProperty />
            </RoleRoute>
          }
        />
        <Route
          path='/landlord/properties/edit/:id'
          element={
            <RoleRoute roles={['landlord']}>
              <AddEditProperty />
            </RoleRoute>
          }
        />
        <Route
          path='/landlord/bookings'
          element={
            <RoleRoute roles={['landlord']}>
              <BookingRequests />
            </RoleRoute>
          }
        />
        <Route
          path='/landlord/tenants'
          element={
            <RoleRoute roles={['landlord']}>
              <ManageTenants />
            </RoleRoute>
          }
        />
        <Route
          path='/landlord/contracts'
          element={
            <RoleRoute roles={['landlord']}>
              <ContractManagement />
            </RoleRoute>
          }
        />
        <Route
          path='/landlord/payments'
          element={
            <RoleRoute roles={['landlord']}>
              <RentPayments />
            </RoleRoute>
          }
        />
        <Route
          path='/landlord/analytics'
          element={
            <RoleRoute roles={['landlord']}>
              <Analytics />
            </RoleRoute>
          }
        />
        <Route
          path='/landlord/messages'
          element={
            <RoleRoute roles={['landlord']}>
              <LandlordMessages />
            </RoleRoute>
          }
        />
        <Route
          path='/landlord/notifications'
          element={
            <RoleRoute roles={['landlord']}>
              <LandlordNotifications />
            </RoleRoute>
          }
        />

        {/* ──────────────── ADMIN ROUTES ──────────────── */}
        <Route
          path='/admin/dashboard'
          element={
            <RoleRoute roles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path='/admin/users'
          element={
            <RoleRoute roles={['admin']}>
              <UserManagement />
            </RoleRoute>
          }
        />
        <Route
          path='/admin/kyc'
          element={
            <RoleRoute roles={['admin']}>
              <KYCVerification />
            </RoleRoute>
          }
        />
        <Route
          path='/admin/properties'
          element={
            <RoleRoute roles={['admin']}>
              <PropertyManagement />
            </RoleRoute>
          }
        />
        <Route
          path='/admin/payments'
          element={
            <RoleRoute roles={['admin']}>
              <PaymentsRevenue />
            </RoleRoute>
          }
        />
        <Route
          path='/admin/reports'
          element={
            <RoleRoute roles={['admin']}>
              <Reports />
            </RoleRoute>
          }
        />
        <Route
          path='/admin/reviews'
          element={
            <RoleRoute roles={['admin']}>
              <ReviewsManagement />
            </RoleRoute>
          }
        />
        <Route
          path='/admin/blog'
          element={
            <RoleRoute roles={['admin']}>
              <BlogCMS />
            </RoleRoute>
          }
        />
        <Route
          path='/admin/faq'
          element={
            <RoleRoute roles={['admin']}>
              <FAQManagement />
            </RoleRoute>
          }
        />
        <Route
          path='/admin/audit-logs'
          element={
            <RoleRoute roles={['admin']}>
              <AuditLogs />
            </RoleRoute>
          }
        />
        <Route
          path='/admin/notifications'
          element={
            <RoleRoute roles={['admin']}>
              <AdminNotifications />
            </RoleRoute>
          }
        />
        <Route
          path='/admin/settings'
          element={
            <RoleRoute roles={['admin']}>
              <SystemSettings />
            </RoleRoute>
          }
        />

        {/* Catch-all 404 */}
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}

// Root App wraps everything in providers
const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <AIProvider>
            <AppContent />
          </AIProvider>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
