// nestfind/nestfind/client/src/pages/tenant/TenantProfile.jsx

import { useState, useRef } from 'react'
import { Camera, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import SEO from '../../components/common/SEO'
import { useAuthStore } from '../../context/AuthContext'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
]

const EMPLOYMENT_OPTIONS = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'student', label: 'Student' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'other', label: 'Other' }
]

const TenantProfile = () => {
  const { user, refreshUser } = useAuthStore()
  const { updateProfile, uploadAvatar, loading } = useAuth()
  const fileInputRef = useRef(null)
  const [tab, setTab] = useState('personal')
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    dateOfBirth: user?.dateOfBirth?.split('T')[0] || '',
    gender: user?.gender || '',
    occupation: user?.occupation || '',
    address: {
      street: user?.address?.street || '',
      subCity: user?.address?.subCity || '',
      city: user?.address?.city || ''
    }
  })

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }))
    } else {
      setForm(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSave = async () => {
    const result = await updateProfile(form)
    if (result.success) await refreshUser()
  }

  const handleAvatarChange = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadAvatar(file)
    await refreshUser()
  }

  const TABS = [
    { key: 'personal', label: 'Personal Info' },
    { key: 'verification', label: 'Verification' },
    { key: 'preferences', label: 'Preferences' }
  ]

  return (
    <DashboardLayout>
      <SEO title='My Profile' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          My Profile
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Manage your account information
        </p>
      </div>

      {/* Avatar Section */}
      <div className='bg-surface-card border border-surface-border rounded-2xl p-6 mb-5'>
        <div className='flex items-center gap-5'>
          <div className='relative'>
            <Avatar
              src={user?.avatar?.url}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size='3xl'
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className='absolute bottom-0 right-0 w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors'
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <h2 className='text-lg font-bold text-white'>
              {user?.firstName} {user?.lastName}
            </h2>
            <p className='text-sm text-gray-400'>{user?.email}</p>
            <div className='flex gap-2 mt-2'>
              <Badge
                variant={user?.isEmailVerified ? 'green' : 'red'}
                size='xs'
              >
                {user?.isEmailVerified
                  ? '✓ Email Verified'
                  : '✗ Email Unverified'}
              </Badge>
              <Badge variant={user?.isKYCVerified ? 'green' : 'gold'} size='xs'>
                {user?.isKYCVerified ? '✓ KYC Verified' : 'KYC Pending'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 border-b border-surface-border mb-5'>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Personal Info Tab */}
      {tab === 'personal' && (
        <div className='bg-surface-card border border-surface-border rounded-2xl p-6 space-y-4'>
          <div className='grid grid-cols-2 gap-3'>
            <Input
              label='First Name'
              value={form.firstName}
              onChange={e => handleChange('firstName', e.target.value)}
            />
            <Input
              label='Last Name'
              value={form.lastName}
              onChange={e => handleChange('lastName', e.target.value)}
            />
          </div>
          <Input
            label='Phone Number'
            type='tel'
            value={form.phone}
            onChange={e => handleChange('phone', e.target.value)}
            placeholder='0911234567'
          />
          <div className='grid grid-cols-2 gap-3'>
            <Input
              label='Date of Birth'
              type='date'
              value={form.dateOfBirth}
              onChange={e => handleChange('dateOfBirth', e.target.value)}
            />
            <Select
              label='Gender'
              value={form.gender}
              onChange={e => handleChange('gender', e.target.value)}
              options={GENDER_OPTIONS}
              placeholder='Select gender'
            />
          </div>
          <Input
            label='Occupation'
            value={form.occupation}
            onChange={e => handleChange('occupation', e.target.value)}
            placeholder='e.g. Software Engineer'
          />
          <Textarea
            label='Bio'
            value={form.bio}
            onChange={e => handleChange('bio', e.target.value)}
            placeholder='Tell landlords a bit about yourself...'
            rows={3}
            maxLength={300}
            showCount
          />

          <div className='border-t border-surface-border pt-4'>
            <h3 className='text-sm font-bold text-white mb-3'>Address</h3>
            <div className='grid grid-cols-2 gap-3'>
              <Input
                label='Street'
                value={form.address.street}
                onChange={e => handleChange('address.street', e.target.value)}
              />
              <Input
                label='Sub-City'
                value={form.address.subCity}
                onChange={e => handleChange('address.subCity', e.target.value)}
              />
            </div>
            <Input
              label='City'
              value={form.address.city}
              onChange={e => handleChange('address.city', e.target.value)}
              className='mt-3'
            />
          </div>

          <Button
            variant='gold'
            fullWidth
            loading={loading}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      )}

      {/* Verification Tab */}
      {tab === 'verification' && (
        <div className='space-y-4'>
          <div
            className={`p-5 rounded-2xl border ${
              user?.isKYCVerified
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-yellow-500/5 border-yellow-500/20'
            }`}
          >
            <div className='flex items-center gap-3 mb-3'>
              {user?.isKYCVerified ? (
                <CheckCircle size={20} className='text-green-400' />
              ) : (
                <AlertCircle size={20} className='text-yellow-400' />
              )}
              <div>
                <p className='text-sm font-bold text-white'>
                  {user?.isKYCVerified
                    ? 'Identity Verified ✓'
                    : 'Identity Verification Required'}
                </p>
                <p className='text-xs text-gray-400'>
                  {user?.isKYCVerified
                    ? 'Your identity has been verified. You have full access to all NestFind features.'
                    : `KYC Status: ${user?.kycStatus || 'not submitted'}`}
                </p>
              </div>
            </div>
            {!user?.isKYCVerified && user?.kycStatus !== 'pending' && (
              <Button
                variant='gold'
                size='sm'
                icon={Shield}
                onClick={() =>
                  toast.info('Upload KYC documents in the form below')
                }
              >
                Start Verification
              </Button>
            )}
            {user?.kycStatus === 'pending' && (
              <p className='text-xs text-yellow-400'>
                Your documents are being reviewed. This usually takes 24-48
                hours.
              </p>
            )}
          </div>

          <div className='bg-surface-card border border-surface-border rounded-2xl p-5'>
            <h3 className='text-sm font-bold text-white mb-3'>
              Email Verification
            </h3>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-300'>{user?.email}</p>
                <Badge
                  variant={user?.isEmailVerified ? 'green' : 'red'}
                  size='xs'
                  className='mt-1'
                >
                  {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>
              {!user?.isEmailVerified && (
                <Button variant='outline' size='sm'>
                  Verify Email
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {tab === 'preferences' && (
        <div className='bg-surface-card border border-surface-border rounded-2xl p-6'>
          <h3 className='text-sm font-bold text-white mb-4'>
            Employment Information
          </h3>
          <div className='space-y-3'>
            <Select
              label='Employment Status'
              value={user?.tenantProfile?.employmentStatus || ''}
              onChange={() => {}}
              options={EMPLOYMENT_OPTIONS}
              placeholder='Select status'
            />
            <Input
              label='Monthly Income (ETB)'
              type='number'
              value={user?.tenantProfile?.monthlyIncome || ''}
              onChange={() => {}}
              placeholder='Your monthly income'
            />
          </div>
          <Button
            variant='gold'
            fullWidth
            loading={loading}
            className='mt-4'
            onClick={handleSave}
          >
            Save Preferences
          </Button>
        </div>
      )}
    </DashboardLayout>
  )
}

export default TenantProfile
