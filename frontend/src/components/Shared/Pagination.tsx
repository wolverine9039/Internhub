import React from 'react';
import './Pagination.css';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, pages, total, onPageChange }) => {
  if (pages <= 1) return null;

  const getVisiblePages = (): number[] => {
    const visible: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    for (let i = start; i <= end; i++) visible.push(i);
    return visible;
  };

  return (
    <div className="pagination">
      <span className="pagination-info">{total} results</span>
      <div className="pagination-controls">
        <button className="pagination-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>←</button>
        {getVisiblePages().map((p) => (
          <button
            key={p}
            className={`pagination-btn ${p === page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button className="pagination-btn" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>→</button>
      </div>
    </div>
  );
};

export default Pagination;
