// nestfind/nestfind/client/src/components/ui/Pagination.jsx

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisible = 5,
  className = ''
}) => {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxVisible / 2)
    let start = Math.max(currentPage - half, 1)
    let end = start + maxVisible - 1

    if (end > totalPages) {
      end = totalPages
      start = Math.max(end - maxVisible + 1, 1)
    }

    const pages = []
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  const btnBase = `
    w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium
    transition-all duration-200 border
  `

  const activeBtn = `${btnBase} bg-yellow-500 border-yellow-500 text-black`
  const inactiveBtn = `${btnBase} border-surface-border text-gray-400 hover:border-yellow-500/50 hover:text-yellow-400`
  const disabledBtn = `${btnBase} border-surface-border text-gray-600 cursor-not-allowed opacity-50`

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={currentPage === 1 ? disabledBtn : inactiveBtn}
        >
          <ChevronsLeft size={14} />
        </button>
      )}

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={currentPage === 1 ? disabledBtn : inactiveBtn}
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className='w-9 h-9 flex items-center justify-center text-gray-500 text-sm'
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={page === currentPage ? activeBtn : inactiveBtn}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={currentPage === totalPages ? disabledBtn : inactiveBtn}
      >
        <ChevronRight size={14} />
      </button>

      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={currentPage === totalPages ? disabledBtn : inactiveBtn}
        >
          <ChevronsRight size={14} />
        </button>
      )}
    </div>
  )
}

export default Pagination
