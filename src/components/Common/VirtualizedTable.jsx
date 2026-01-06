/**
 * ============================================================
 * 🚀 VIRTUALIZED TABLE COMPONENT
 * ============================================================
 * Optimized table rendering for large datasets (1000+ rows)
 * Uses react-window to render only visible rows
 * 
 * Usage:
 *   <VirtualizedTable
 *     data={applicants}
 *     columns={columns}
 *     height={600}
 *     rowHeight={50}
 *   />
 */

import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Table } from 'reactstrap';

const VirtualizedTable = ({
  data = [],
  columns = [],
  height = 600,
  rowHeight = 50,
  onRowClick,
  className = '',
  headerClassName = '',
  rowClassName = '',
}) => {
  // Memoize row renderer
  const Row = ({ index, style }) => {
    const row = data[index];
    if (!row) return null;

    return (
      <div
        style={style}
        className={`virtualized-row ${rowClassName} ${onRowClick ? 'cursor-pointer' : ''}`}
        onClick={() => onRowClick && onRowClick(row, index)}
        onMouseEnter={(e) => {
          if (onRowClick) {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }
        }}
        onMouseLeave={(e) => {
          if (onRowClick) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div className="d-flex">
          {columns.map((column, colIndex) => {
            const cellValue = column.accessorKey
              ? row[column.accessorKey]
              : column.accessor
              ? column.accessor(row)
              : null;

            return (
              <div
                key={colIndex}
                className="px-3 py-2"
                style={{
                  width: column.width || `${100 / columns.length}%`,
                  minWidth: column.minWidth || '100px',
                  flex: column.flex || '1 1 auto',
                  borderRight: colIndex < columns.length - 1 ? '1px solid #dee2e6' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {column.cell
                  ? column.cell({ row, value: cellValue, column })
                  : cellValue != null
                  ? String(cellValue)
                  : ''}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Memoize header
  const Header = useMemo(
    () => (
      <div className={`d-flex bg-light border-bottom ${headerClassName}`} style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        {columns.map((column, index) => (
          <div
            key={index}
            className="px-3 py-2 fw-bold"
            style={{
              width: column.width || `${100 / columns.length}%`,
              minWidth: column.minWidth || '100px',
              flex: column.flex || '1 1 auto',
              borderRight: index < columns.length - 1 ? '1px solid #dee2e6' : 'none',
            }}
          >
            {column.header || column.accessorKey || ''}
          </div>
        ))}
      </div>
    ),
    [columns, headerClassName]
  );

  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-5 ${className}`}>
        <p className="text-muted">No data available</p>
      </div>
    );
  }

  return (
    <div className={`virtualized-table-container ${className}`} style={{ height, overflow: 'hidden' }}>
      {Header}
      <List
        height={height - 50} // Subtract header height
        itemCount={data.length}
        itemSize={rowHeight}
        width="100%"
        overscanCount={5} // Render 5 extra items for smoother scrolling
      >
        {Row}
      </List>
    </div>
  );
};

export default VirtualizedTable;

