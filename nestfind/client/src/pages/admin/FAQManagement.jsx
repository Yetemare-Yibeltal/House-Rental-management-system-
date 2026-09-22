// nestfind/nestfind/client/src/pages/admin/FAQManagement.jsx

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Badge from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import adminApi from '../../api/adminApi'
import toast from 'react-hot-toast'

const FAQ_CATEGORIES = [
  { value: 'getting_started', label: 'Getting Started' },
  { value: 'tenant', label: 'For Tenants' },
  { value: 'landlord', label: 'For Landlords' },
  { value: 'payments', label: 'Payments' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'ai_features', label: 'AI Features' },
  { value: 'account', label: 'Account' },
  { value: 'safety', label: 'Safety & Trust' }
]

const FAQManagement = () => {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFaq, setEditingFaq] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: '',
    isPublished: true,
    order: 0
  })

  const fetchFAQs = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getFAQs({ limit: 50 })
      setFaqs(response.data.data?.faqs || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFAQs()
  }, [])

  const openModal = (faq = null) => {
    setEditingFaq(faq)
    setForm(
      faq
        ? {
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            isPublished: faq.isPublished,
            order: faq.order || 0
          }
        : {
            question: '',
            answer: '',
            category: '',
            isPublished: true,
            order: 0
          }
    )
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.question || !form.answer || !form.category) {
      toast.error('Fill in all required fields')
      return
    }
    setSaving(true)
    try {
      if (editingFaq) {
        await adminApi.updateFAQ(editingFaq._id, form)
        toast.success('FAQ updated')
      } else {
        await adminApi.createFAQ(form)
        toast.success('FAQ created')
      }
      setShowModal(false)
      fetchFAQs()
    } catch {
      toast.error('Failed to save FAQ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminApi.deleteFAQ(deleteId)
      toast.success('FAQ deleted')
      setDeleteId(null)
      fetchFAQs()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <SEO title='FAQ Management' />
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            FAQ Management
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            {faqs.length} FAQs managed
          </p>
        </div>
        <Button
          variant='gold'
          size='sm'
          icon={Plus}
          onClick={() => openModal()}
        >
          Add FAQ
        </Button>
      </div>

      <div className='space-y-3'>
        {faqs.map(faq => (
          <div
            key={faq._id}
            className='bg-surface-card border border-surface-border rounded-2xl p-4'
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <Badge variant='gray' size='xs' className='capitalize'>
                    {faq.category?.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant={faq.isPublished ? 'green' : 'gray'} size='xs'>
                    {faq.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <p className='text-sm font-bold text-white mb-1'>
                  {faq.question}
                </p>
                <p className='text-xs text-gray-400 line-clamp-2'>
                  {faq.answer}
                </p>
              </div>
              <div className='flex gap-1 flex-shrink-0'>
                <button
                  onClick={() => openModal(faq)}
                  className='p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors'
                >
                  <Edit size={13} />
                </button>
                <button
                  onClick={() => setDeleteId(faq._id)}
                  className='p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors'
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFaq ? 'Edit FAQ' : 'New FAQ'}
        size='md'
      >
        <div className='space-y-4'>
          <Input
            label='Question *'
            value={form.question}
            onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
            placeholder='What is...?'
            required
          />
          <Textarea
            label='Answer *'
            value={form.answer}
            onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
            rows={5}
            required
          />
          <Select
            label='Category *'
            value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            options={FAQ_CATEGORIES}
            placeholder='Select category'
            required
          />
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={form.isPublished}
              onChange={e =>
                setForm(p => ({ ...p, isPublished: e.target.checked }))
              }
              className='w-4 h-4'
            />
            <span className='text-sm text-gray-300'>Published</span>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              fullWidth
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant='gold'
              fullWidth
              loading={saving}
              onClick={handleSave}
            >
              {editingFaq ? 'Update' : 'Create'} FAQ
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title='Delete FAQ?'
        message='This FAQ will be permanently removed.'
        type='danger'
        confirmLabel='Delete'
        loading={deleting}
      />
    </DashboardLayout>
  )
}

export default FAQManagement
