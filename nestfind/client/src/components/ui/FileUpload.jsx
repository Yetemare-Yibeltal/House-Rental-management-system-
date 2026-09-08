// nestfind/nestfind/client/src/components/ui/FileUpload.jsx

import { useRef, useState, useCallback } from 'react'
import { Upload, X, Image, File } from 'lucide-react'
import { formatFileSize } from '../../utils/formatters'

const FileUpload = ({
  accept = 'image/*',
  multiple = false,
  maxSize = 5 * 1024 * 1024,
  maxFiles = 10,
  onFilesChange,
  label = 'Upload Files',
  hint = 'Drag and drop or click to upload',
  className = '',
  disabled = false,
  existingFiles = []
}) => {
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState([])
  const inputRef = useRef(null)

  const validateFiles = useCallback(
    fileList => {
      const valid = []
      const errs = []

      Array.from(fileList).forEach(file => {
        if (file.size > maxSize) {
          errs.push(
            `${file.name} is too large (max ${formatFileSize(maxSize)})`
          )
          return
        }
        if (files.length + valid.length + existingFiles.length >= maxFiles) {
          errs.push(`Maximum ${maxFiles} files allowed`)
          return
        }
        valid.push({
          file,
          preview: file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : null,
          name: file.name,
          size: file.size,
          type: file.type,
          id: `${file.name}-${Date.now()}`
        })
      })

      return { valid, errs }
    },
    [files.length, existingFiles.length, maxSize, maxFiles]
  )

  const handleFiles = useCallback(
    fileList => {
      const { valid, errs } = validateFiles(fileList)
      setErrors(errs)
      if (valid.length > 0) {
        const updated = multiple ? [...files, ...valid] : valid
        setFiles(updated)
        onFilesChange?.(updated.map(f => f.file))
      }
    },
    [validateFiles, files, multiple, onFilesChange]
  )

  const handleDrop = useCallback(
    e => {
      e.preventDefault()
      setDragOver(false)
      if (!disabled) handleFiles(e.dataTransfer.files)
    },
    [disabled, handleFiles]
  )

  const handleDragOver = useCallback(
    e => {
      e.preventDefault()
      if (!disabled) setDragOver(true)
    },
    [disabled]
  )

  const removeFile = useCallback(
    id => {
      setFiles(prev => {
        const updated = prev.filter(f => f.id !== id)
        onFilesChange?.(updated.map(f => f.file))
        return updated
      })
    },
    [onFilesChange]
  )

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className='block text-sm font-medium text-gray-300 mb-2'>
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200
          ${
            dragOver
              ? 'border-yellow-500 bg-yellow-500/10'
              : 'border-surface-border hover:border-yellow-500/50 bg-surface-card'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type='file'
          accept={accept}
          multiple={multiple}
          onChange={e => handleFiles(e.target.files)}
          className='hidden'
          disabled={disabled}
        />

        <Upload size={32} className='mx-auto mb-3 text-gray-500' />
        <p className='text-sm text-gray-300 mb-1'>{hint}</p>
        <p className='text-xs text-gray-500'>
          {accept.includes('image') ? 'PNG, JPG, WEBP' : 'Any file'} up to{' '}
          {formatFileSize(maxSize)}
        </p>
      </div>

      {errors.length > 0 && (
        <div className='mt-2 space-y-1'>
          {errors.map((err, i) => (
            <p key={i} className='text-xs text-red-400'>
              {err}
            </p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className='mt-3 grid grid-cols-3 gap-2'>
          {files.map(f => (
            <div
              key={f.id}
              className='relative group rounded-lg overflow-hidden bg-surface-card border border-surface-border'
            >
              {f.preview ? (
                <img
                  src={f.preview}
                  alt={f.name}
                  className='w-full h-20 object-cover'
                />
              ) : (
                <div className='w-full h-20 flex flex-col items-center justify-center'>
                  <File size={20} className='text-gray-400' />
                  <span className='text-xs text-gray-400 mt-1 px-1 truncate w-full text-center'>
                    {f.name}
                  </span>
                </div>
              )}
              <button
                onClick={e => {
                  e.stopPropagation()
                  removeFile(f.id)
                }}
                className='absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
              >
                <X size={10} />
              </button>
              <div className='absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5'>
                <p className='text-[9px] text-white truncate'>
                  {formatFileSize(f.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload
