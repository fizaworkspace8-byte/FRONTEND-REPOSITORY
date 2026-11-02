import { useMemo, useState, useCallback } from 'react';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState';

function DataTable({
  columns,
  rows,
  keyField = 'id',
  loading = false,
  empty = 'No records found.',
  sort,
  onSortChange,
  pagination,
  onPageChange,
  pageSize,
  toolbar,
  rowClassName,
  onRowClick,
}) {
  const allRows = rows || [];

  const [internalSort, setInternalSort] = useState(sort || { key: '', dir: 'asc' });
  const effectiveSort = onSortChange ? sort : internalSort;

  const sortedRows = useMemo(() => {
    if (!effectiveSort || !effectiveSort.key) return allRows;
    const dir = effectiveSort.dir === 'desc' ? -1 : 1;
    return [...allRows].sort((a, b) => {
      const av = a[effectiveSort.key];
      const bv = b[effectiveSort.key];
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      const sa = String(av == null ? '' : av);
      const sb = String(bv == null ? '' : bv);
      return sa.localeCompare(sb, undefined, { numeric: true }) * dir;
    });
  }, [allRows, effectiveSort]);

  const handleSort = (key) => {
    if (onSortChange) {
      onSortChange(key, effectiveSort?.key === key && effectiveSort?.dir === 'asc' ? 'desc' : 'asc');
      return;
    }
    setInternalSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const [internalPage, setInternalPage] = useState(1);
  const effectivePage = onPageChange ? pagination.page : internalPage;
  const effectiveLimit = onPageChange ? pagination.limit : pageSize;

  const paginatedRows = useMemo(() => {
    if (!effectiveLimit) return sortedRows;
    const start = (effectivePage - 1) * effectiveLimit;
    return sortedRows.slice(start, start + effectiveLimit);
  }, [sortedRows, effectivePage, effectiveLimit]);

  const totalPages = effectiveLimit
    ? Math.ceil(sortedRows.length / effectiveLimit) || 1
    : 1;

  useMemo(() => {
    if (!onPageChange && pageSize) setInternalPage(1);
  }, [allRows, pageSize, onPageChange]);

  const handlePage = (delta) => {
    if (onPageChange) {
      onPageChange(Math.max(1, Math.min(totalPages, effectivePage + delta)));
      return;
    }
    setInternalPage((p) => Math.max(1, Math.min(totalPages, p + delta)));
  };

  const emptyConfig =
    typeof empty === 'string' ? { title: empty } : { icon: undefined, title: 'No records found.', description: '', ...empty };

  const alignCls = (align) => {
    switch (align) {
      case 'right': return 'text-right';
      case 'center': return 'text-center';
      default: return 'text-left';
    }
  };

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/70">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800/60 rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (paginatedRows.length === 0) {
    return (
      <div className="card overflow-hidden">
        <EmptyState
          icon={emptyConfig.icon || undefined}
          title={emptyConfig.title}
          description={emptyConfig.description || undefined}
        />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden flex flex-col">
      {toolbar ? (
        <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/30">
          {toolbar}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/70">
          <thead className="sticky top-0 z-10 bg-slate-50/60 dark:bg-slate-900/40">
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable || false;
                const isActive = effectiveSort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left ${alignCls(col.align)} text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/70 dark:border-slate-800/70 ${col.headerClassName || ''}`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 w-full text-left hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        {col.label}
                        {isActive && (
                          effectiveSort.dir === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 fill-current text-slate-400" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 fill-current text-slate-400" />
                          )
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {paginatedRows.map((row, rowIndex) => (
              <tr
                key={row[keyField] ?? `row-${rowIndex}`}
                className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${rowClassName ? rowClassName(row) : ''} ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col) => {
                  const cellContent = col.render ? col.render(row) : row[col.key] ?? '—';
                  return (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300 ${alignCls(col.align)} ${col.className || ''}`}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(pagination || pageSize) && (
        <div className="border-t border-slate-200/70 dark:border-slate-800/70 bg-slate-50/40 dark:bg-slate-900/20 px-4 py-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <div className="text-slate-500 dark:text-slate-500">{sortedRows.length} total records</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={effectivePage <= 1}
              onClick={() => handlePage(-1)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1">Prev</span>
            </button>
            <span className="px-2">Page {effectivePage} of {totalPages}</span>
            <button
              type="button"
              disabled={effectivePage >= totalPages}
              onClick={() => handlePage(1)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
