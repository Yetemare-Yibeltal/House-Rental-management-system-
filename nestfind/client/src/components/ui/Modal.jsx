// nestfind/nestfind/client/src/components/ui/Modal.jsx

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl mx-4'
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  footer,
  className = ''
}) => {
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            onClick={closeOnOverlay ? onClose : undefined}
          />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`
              relative w-full bg-surface-card border border-surface-border
              rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col
              ${sizeClasses[size]}
              ${className}
            `}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className='flex items-center justify-between px-6 py-4 border-b border-surface-border flex-shrink-0'>
                {title && (
                  <h2 className='text-lg font-bold text-white font-display'>
                    {title}
                  </h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className='ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors'
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className='flex-1 overflow-y-auto px-6 py-4'>{children}</div>

            {/* Footer */}
            {footer && (
              <div className='px-6 py-4 border-t border-surface-border flex-shrink-0'>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Modal
