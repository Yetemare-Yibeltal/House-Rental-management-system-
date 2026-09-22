// nestfind/nestfind/client/src/pages/admin/SystemSettings.jsx

import { useState, useEffect } from 'react'
import { Settings, Save } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import adminApi from '../../api/adminApi'
import toast from 'react-hot-toast'

const SystemSettings = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('general')

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const response = await adminApi.getSettings()
        setSettings(response.data.data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.updateSettings(settings)
      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const update = (path, value) => {
    setSettings(prev => {
      const keys = path.split('.')
      const updated = { ...prev }
      let current = updated
      keys.forEach((key, i) => {
        if (i === keys.length - 1) current[key] = value
        else {
          current[key] = { ...current[key] }
          current = current[key]
        }
      })
      return updated
    })
  }

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader text='Loading settings...' />
      </DashboardLayout>
    )

  const SECTIONS = [
    { key: 'general', label: 'General' },
    { key: 'payments', label: 'Payments' },
    { key: 'ai', label: 'AI Features' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'maintenance', label: 'Maintenance' }
  ]

  return (
    <DashboardLayout>
      <SEO title='System Settings' />

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            System Settings
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            Configure platform-wide settings
          </p>
        </div>
        <Button
          variant='gold'
          size='sm'
          icon={Save}
          loading={saving}
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </div>

      <div className='flex gap-6'>
        {/* Sidebar */}
        <div className='w-48 flex-shrink-0'>
          <div className='bg-surface-card border border-surface-border rounded-2xl overflow-hidden'>
            {SECTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-left transition-colors border-b border-surface-border last:border-0 ${
                  activeSection === key
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'text-gray-400 hover:text-white hover:bg-surface-light'
                }`}
              >
                <Settings size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className='flex-1 bg-surface-card border border-surface-border rounded-2xl p-6'>
          {activeSection === 'general' && settings?.general && (
            <div className='space-y-4'>
              <h3 className='text-base font-bold text-white mb-4'>
                General Settings
              </h3>
              <Input
                label='Platform Name'
                value={settings.general.platformName || ''}
                onChange={e => update('general.platformName', e.target.value)}
              />
              <Input
                label='Support Email'
                type='email'
                value={settings.general.supportEmail || ''}
                onChange={e => update('general.supportEmail', e.target.value)}
              />
              <Input
                label='Support Phone'
                value={settings.general.supportPhone || ''}
                onChange={e => update('general.supportPhone', e.target.value)}
              />
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={settings.general.maintenanceMode || false}
                  onChange={e =>
                    update('general.maintenanceMode', e.target.checked)
                  }
                  className='w-4 h-4'
                />
                <span className='text-sm text-gray-300'>Maintenance Mode</span>
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={settings.general.allowNewRegistrations !== false}
                  onChange={e =>
                    update('general.allowNewRegistrations', e.target.checked)
                  }
                  className='w-4 h-4'
                />
                <span className='text-sm text-gray-300'>
                  Allow New Registrations
                </span>
              </div>
            </div>
          )}

          {activeSection === 'payments' && settings?.payments && (
            <div className='space-y-4'>
              <h3 className='text-base font-bold text-white mb-4'>
                Payment Settings
              </h3>
              <Input
                label='Platform Commission (%)'
                type='number'
                min='0'
                max='100'
                value={settings.payments.platformCommissionRate || ''}
                onChange={e =>
                  update(
                    'payments.platformCommissionRate',
                    parseFloat(e.target.value)
                  )
                }
                hint='Percentage taken from each payment'
              />
              <Input
                label='Min Payment Amount (ETB)'
                type='number'
                value={settings.payments.minPaymentAmount || ''}
                onChange={e =>
                  update(
                    'payments.minPaymentAmount',
                    parseFloat(e.target.value)
                  )
                }
              />
              <Input
                label='Max Payment Amount (ETB)'
                type='number'
                value={settings.payments.maxPaymentAmount || ''}
                onChange={e =>
                  update(
                    'payments.maxPaymentAmount',
                    parseFloat(e.target.value)
                  )
                }
              />
              <Input
                label='Dispute Window (days)'
                type='number'
                value={settings.payments.disputeWindowDays || ''}
                onChange={e =>
                  update('payments.disputeWindowDays', parseInt(e.target.value))
                }
              />
            </div>
          )}

          {activeSection === 'ai' && settings?.ai && (
            <div className='space-y-4'>
              <h3 className='text-base font-bold text-white mb-4'>
                AI Feature Settings
              </h3>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={settings.ai.chatAssistantEnabled !== false}
                  onChange={e =>
                    update('ai.chatAssistantEnabled', e.target.checked)
                  }
                  className='w-4 h-4'
                />
                <span className='text-sm text-gray-300'>AI Chat Assistant</span>
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={settings.ai.fraudDetectionEnabled !== false}
                  onChange={e =>
                    update('ai.fraudDetectionEnabled', e.target.checked)
                  }
                  className='w-4 h-4'
                />
                <span className='text-sm text-gray-300'>Fraud Detection</span>
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={settings.ai.recommendationsEnabled !== false}
                  onChange={e =>
                    update('ai.recommendationsEnabled', e.target.checked)
                  }
                  className='w-4 h-4'
                />
                <span className='text-sm text-gray-300'>
                  Property Recommendations
                </span>
              </div>
              <Input
                label='Max Chat Messages Per Day'
                type='number'
                value={settings.ai.maxChatMessagesPerDay || 50}
                onChange={e =>
                  update('ai.maxChatMessagesPerDay', parseInt(e.target.value))
                }
              />
            </div>
          )}

          {activeSection === 'notifications' && settings?.notifications && (
            <div className='space-y-4'>
              <h3 className='text-base font-bold text-white mb-4'>
                Notification Settings
              </h3>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={settings.notifications.emailNotifications !== false}
                  onChange={e =>
                    update('notifications.emailNotifications', e.target.checked)
                  }
                  className='w-4 h-4'
                />
                <span className='text-sm text-gray-300'>
                  Email Notifications
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={settings.notifications.smsNotifications || false}
                  onChange={e =>
                    update('notifications.smsNotifications', e.target.checked)
                  }
                  className='w-4 h-4'
                />
                <span className='text-sm text-gray-300'>SMS Notifications</span>
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={settings.notifications.pushNotifications || false}
                  onChange={e =>
                    update('notifications.pushNotifications', e.target.checked)
                  }
                  className='w-4 h-4'
                />
                <span className='text-sm text-gray-300'>
                  Push Notifications
                </span>
              </div>
            </div>
          )}

          {activeSection === 'maintenance' && (
            <div className='space-y-4'>
              <h3 className='text-base font-bold text-white mb-4'>
                Maintenance Settings
              </h3>
              <div className='p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl'>
                <p className='text-sm font-semibold text-yellow-400 mb-1'>
                  ⚠️ Maintenance Mode
                </p>
                <p className='text-xs text-gray-400 mb-3'>
                  When enabled, only admins can access the platform. All other
                  users see a maintenance page.
                </p>
                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={settings?.general?.maintenanceMode || false}
                    onChange={e =>
                      update('general.maintenanceMode', e.target.checked)
                    }
                    className='w-4 h-4'
                  />
                  <span className='text-sm text-gray-300'>
                    Enable Maintenance Mode
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SystemSettings
