// nestfind/nestfind/client/src/components/ui/Select.jsx

import { forwardRef } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'

const Select = forwardRef(
  (
    {
      label,
      options = [],
      error,
      hint,
      placeholder = 'Select an option',
      className = '',
      containerClassName = '',
      disabled = false,
      required = false,
      fullWidth = true,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base'
    }

    const borderColor = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-surface-border focus:border-yellow-500 focus:ring-yellow-500/20'

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
        {label && (
          <label className='block text-sm font-medium text-gray-300 mb-1.5'>
            {label}
            {required && <span className='text-yellow-400 ml-1'>*</span>}
          </label>
        )}

        <div className='relative'>
          <select
            ref={ref}
            disabled={disabled}
            className={`
            w-full bg-surface-card text-white appearance-none
            border rounded-xl outline-none transition-all duration-200
            focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed
            pr-10 cursor-pointer
            ${sizes[size]}
            ${borderColor}
            ${className}
          `}
            {...props}
          >
            {placeholder && (
              <option
                value=''
                disabled
                className='text-gray-500 bg-surface-card'
              >
                {placeholder}
              </option>
            )}
            {options.map(opt => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className='bg-surface-card text-white'
              >
                {opt.label}
              </option>
            ))}
          </select>

          <div className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'>
            <ChevronDown size={16} />
          </div>
        </div>

        {error && (
          <p className='mt-1.5 text-xs text-red-400 flex items-center gap-1'>
            <AlertCircle size={12} />
            {error}
          </p>
        )}
        {!error && hint && (
          <p className='mt-1.5 text-xs text-gray-500'>{hint}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
