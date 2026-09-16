// nestfind/nestfind/client/src/pages/public/ContactPage.jsx

import { useState } from 'react'
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Send,
  CheckCircle
} from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import ScrollReveal from '../../components/ui/ScrollReveal'
import GradientText from '../../components/ui/GradientText'
import SEO from '../../components/common/SEO'
import toast from 'react-hot-toast'

const CONTACT_INFO = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@nestfind.et',
    href: 'mailto:support@nestfind.et'
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+251 911 000 000',
    href: 'tel:+251911000000'
  },
  {
    icon: MapPin,
    label: 'Office',
    value: 'Bole, Addis Ababa, Ethiopia',
    href: null
  }
]

const SUBJECTS = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'tenant_support', label: 'Tenant Support' },
  { value: 'landlord_support', label: 'Landlord Support' },
  { value: 'report_fraud', label: 'Report Fraud / Fake Listing' },
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' }
]

const ContactPage = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = field => e =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email || !form.message || !form.subject) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setSubmitted(true)
    setLoading(false)
    toast.success("Message sent! We'll respond within 24 hours.")
  }

  return (
    <PublicLayout>
      <SEO
        title='Contact Us'
        description='Get in touch with the NestFind team for support, partnerships, or any inquiries.'
      />

      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        {/* Header */}
        <ScrollReveal animation='fadeUp'>
          <div className='text-center mb-12'>
            <span className='text-xs font-semibold text-yellow-400 uppercase tracking-wider'>
              Contact Us
            </span>
            <h1 className='text-3xl sm:text-4xl font-bold font-display text-white mt-2 mb-3'>
              We're Here to <GradientText>Help</GradientText>
            </h1>
            <p className='text-gray-400 max-w-xl mx-auto'>
              Have a question, issue, or partnership inquiry? Our team responds
              within 24 hours.
            </p>
          </div>
        </ScrollReveal>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Contact Info */}
          <ScrollReveal animation='fadeRight'>
            <div className='space-y-5'>
              <div className='bg-surface-card border border-surface-border rounded-2xl p-6'>
                <h3 className='text-base font-bold text-white font-display mb-4'>
                  Contact Information
                </h3>
                <div className='space-y-4'>
                  {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className='flex items-start gap-3'>
                      <div className='w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0'>
                        <Icon size={16} className='text-yellow-400' />
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>{label}</p>
                        {href ? (
                          <a
                            href={href}
                            className='text-sm text-gray-300 hover:text-yellow-400 transition-colors'
                          >
                            {value}
                          </a>
                        ) : (
                          <p className='text-sm text-gray-300'>{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='bg-surface-card border border-surface-border rounded-2xl p-6'>
                <h3 className='text-base font-bold text-white font-display mb-2'>
                  Support Hours
                </h3>
                <div className='space-y-1.5 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Mon – Fri</span>
                    <span className='text-white'>8:00 AM – 6:00 PM</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Saturday</span>
                    <span className='text-white'>9:00 AM – 3:00 PM</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Sunday</span>
                    <span className='text-gray-500'>Closed</span>
                  </div>
                </div>
                <div className='mt-3 pt-3 border-t border-surface-border'>
                  <p className='text-xs text-gray-500'>
                    Ethiopian Standard Time (EAT / UTC+3)
                  </p>
                </div>
              </div>

              <div className='bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5'>
                <div className='flex items-center gap-2 mb-2'>
                  <MessageSquare size={16} className='text-yellow-400' />
                  <p className='text-sm font-semibold text-yellow-400'>
                    AI Support 24/7
                  </p>
                </div>
                <p className='text-xs text-gray-400'>
                  Our AI assistant is available around the clock for instant
                  help with properties, contracts, and platform questions.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Contact Form */}
          <ScrollReveal animation='fadeLeft' className='lg:col-span-2'>
            <div className='bg-surface-card border border-surface-border rounded-2xl p-6 sm:p-8'>
              {submitted ? (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <div className='w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4'>
                    <CheckCircle size={32} className='text-green-400' />
                  </div>
                  <h3 className='text-lg font-bold text-white mb-2'>
                    Message Sent!
                  </h3>
                  <p className='text-gray-400 text-sm mb-6'>
                    Thank you for reaching out. Our team will respond to{' '}
                    <strong className='text-white'>{form.email}</strong> within
                    24 hours.
                  </p>
                  <Button variant='gold' onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <h3 className='text-lg font-bold text-white font-display mb-2'>
                    Send us a Message
                  </h3>
                  <div className='grid grid-cols-2 gap-3'>
                    <Input
                      label='First Name'
                      value={form.firstName}
                      onChange={handleChange('firstName')}
                      placeholder='Your first name'
                    />
                    <Input
                      label='Last Name'
                      value={form.lastName}
                      onChange={handleChange('lastName')}
                      placeholder='Your last name'
                    />
                  </div>
                  <Input
                    label='Email Address *'
                    type='email'
                    value={form.email}
                    onChange={handleChange('email')}
                    placeholder='you@example.com'
                    required
                    icon={Mail}
                  />
                  <Input
                    label='Phone (optional)'
                    type='tel'
                    value={form.phone}
                    onChange={handleChange('phone')}
                    placeholder='0911234567'
                    icon={Phone}
                  />
                  <Select
                    label='Subject *'
                    value={form.subject}
                    onChange={handleChange('subject')}
                    options={SUBJECTS}
                    placeholder='Select a subject'
                    required
                  />
                  <Textarea
                    label='Message *'
                    value={form.message}
                    onChange={handleChange('message')}
                    placeholder='Describe your issue or question in detail...'
                    rows={5}
                    maxLength={2000}
                    showCount
                    required
                  />
                  <Button
                    type='submit'
                    variant='gold'
                    fullWidth
                    loading={loading}
                    icon={Send}
                  >
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </PublicLayout>
  )
}

export default ContactPage
