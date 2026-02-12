import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
  category?: string;
  className?: string;
}

function buildHref(basePath: string, page: number, category?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (category) params.set('category', category);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath = '/blog',
  category,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className={`nbk-pagination ${className}`}>
      {currentPage > 1 ? (
        <a href={buildHref(basePath, currentPage - 1, category)} className="nbk-pagination-btn">
          Previous
        </a>
      ) : (
        <span className="nbk-pagination-btn disabled">Previous</span>
      )}

      <div className="nbk-pagination-pages">
        {pages.map((page, idx) =>
          typeof page === 'string' ? (
            <span key={`ellipsis-${idx}`} className="nbk-pagination-ellipsis">
              ...
            </span>
          ) : page === currentPage ? (
            <span key={page} className="nbk-pagination-page active">
              {page}
            </span>
          ) : (
            <a
              key={page}
              href={buildHref(basePath, page, category)}
              className="nbk-pagination-page"
            >
              {page}
            </a>
          )
        )}
      </div>

      {currentPage < totalPages ? (
        <a href={buildHref(basePath, currentPage + 1, category)} className="nbk-pagination-btn">
          Next
        </a>
      ) : (
        <span className="nbk-pagination-btn disabled">Next</span>
      )}
    </nav>
  );
}
