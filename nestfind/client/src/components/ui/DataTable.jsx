// nestfind/nestfind/client/src/components/ui/DataTable.jsx

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { TableRowSkeleton } from './Skeleton'
import EmptyState from './EmptyState'
import Pagination from './Pagination'

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No data found',
  emptyDescription = '',
  onSort,
  sortField,
  sortDirection,
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  rowKey = '_id',
  onRowClick,
  stickyHeader = false
}) => {
  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <ChevronsUpDown size={14} className='text-gray-600' />
    return sortDirection === 'asc' ? (
      <ChevronUp size={14} className='text-yellow-400' />
    ) : (
      <ChevronDown size={14} className='text-yellow-400' />
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <div className='overflow-x-auto rounded-xl border border-surface-border'>
        <table className='w-full text-sm text-left'>
          <thead
            className={`bg-surface-card border-b border-surface-border ${
              stickyHeader ? 'sticky top-0 z-10' : ''
            }`}
          >
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`
                    px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap
                    ${
                      col.sortable
                        ? 'cursor-pointer hover:text-yellow-400 select-none'
                        : ''
                    }
                    ${col.className || ''}
                  `}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className='flex items-center gap-1'>
                    {col.label}
                    {col.sortable && <SortIcon field={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className='divide-y divide-surface-border bg-dark'>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    size='sm'
                  />
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr
                  key={row[rowKey] || Math.random()}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    transition-colors duration-150
                    ${
                      onRowClick
                        ? 'cursor-pointer hover:bg-surface-card'
                        : 'hover:bg-surface-card/50'
                    }
                  `}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-gray-300 whitespace-nowrap ${
                        col.cellClassName || ''
                      }`}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className='flex justify-center mt-4'>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}

export default DataTable
