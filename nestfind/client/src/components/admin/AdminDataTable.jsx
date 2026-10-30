import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import DataTable from '../ui/DataTable';
import Input from '../ui/Input';

const AdminDataTable = ({
  title,
  columns,
  data,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  onRowClick,
  emptyTitle,
  emptyDescription,
  searchPlaceholder = 'Search...',
  onSearch,
  filters,
  onExport,
  headerActions,
  rowKey = '_id',
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {title ? <h2 className="text-lg font-bold text-white font-display">{title}</h2> : <span />}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onSearch && (
            <div className="flex-1 sm:w-64">
              <Input placeholder={searchPlaceholder} value={query} onChange={handleSearch} icon={Search} size="sm" />
            </div>
          )}
          {onExport && (
            <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-surface-border text-gray-400 rounded-xl hover:border-yellow-500/50 hover:text-yellow-400 transition-colors">
              <Download size={13} /> Export
            </button>
          )}
          {headerActions}
        </div>
      </div>

      {filters && <div className="flex flex-wrap gap-2">{filters}</div>}

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onRowClick={onRowClick}
        rowKey={rowKey}
        stickyHeader
      />
    </div>
  );
};

export default AdminDataTable;
