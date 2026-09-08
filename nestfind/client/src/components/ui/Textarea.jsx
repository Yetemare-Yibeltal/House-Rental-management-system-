// nestfind/nestfind/client/src/components/ui/Textarea.jsx

import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

const Textarea = forwardRef(
  (
    {
      label,
      error,
      hint,
      rows = 4,
      maxLength,
      showCount = false,
      className = '',
      containerClassName = '',
      disabled = false,
      required = false,
      value = '',
      ...props
    },
    ref
  ) => {
    const borderColor = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-surface-border focus:border-yellow-500 focus:ring-yellow-500/20'

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label className='block text-sm font-medium text-gray-300 mb-1.5'>
            {label}
            {required && <span className='text-yellow-400 ml-1'>*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          className={`
          w-full bg-surface-card text-white placeholder-gray-500
          border rounded-xl px-4 py-3 text-sm
          outline-none transition-all duration-200
          focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed
          resize-y min-h-[80px]
          ${borderColor}
          ${className}
        `}
          {...props}
        />

        <div className='flex items-start justify-between mt-1.5'>
          <div>
            {error && (
              <p className='text-xs text-red-400 flex items-center gap-1'>
                <AlertCircle size={12} />
                {error}
              </p>
            )}
            {!error && hint && <p className='text-xs text-gray-500'>{hint}</p>}
          </div>
          {showCount && maxLength && (
            <span
              className={`text-xs ml-2 ${
                value.length >= maxLength ? 'text-red-400' : 'text-gray-500'
              }`}
            >
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
