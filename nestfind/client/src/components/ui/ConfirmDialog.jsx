// nestfind/nestfind/client/src/components/ui/ConfirmDialog.jsx

import { AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

const icons = {
  danger: {
    icon: Trash2,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20'
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20'
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20'
  }
}

const confirmButtonVariants = {
  danger: 'danger',
  warning: 'gold',
  success: 'success',
  info: 'gold'
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  type = 'danger',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false
}) => {
  const { icon: IconComponent, color, bg } = icons[type] || icons.danger
  const confirmVariant = confirmButtonVariants[type] || 'danger'

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='sm' showClose={false}>
      <div className='flex flex-col items-center text-center py-2'>
        <div
          className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${bg}`}
        >
          <IconComponent size={24} className={color} />
        </div>

        <h3 className='text-lg font-bold text-white mb-2 font-display'>
          {title}
        </h3>

        {message && (
          <p className='text-gray-400 text-sm mb-6 leading-relaxed'>
            {message}
          </p>
        )}

        <div className='flex gap-3 w-full'>
          <Button
            variant='outline'
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            fullWidth
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
