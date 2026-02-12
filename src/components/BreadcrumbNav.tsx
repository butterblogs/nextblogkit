import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className = '' }: BreadcrumbNavProps) {
  return (
    <nav className={`nbk-breadcrumb ${className}`} aria-label="Breadcrumb">
      <ol className="nbk-breadcrumb-list">
        {items.map((item, idx) => (
          <li key={idx} className="nbk-breadcrumb-item">
            {idx > 0 && <span className="nbk-breadcrumb-sep">/</span>}
            {item.href ? (
              <a href={item.href} className="nbk-breadcrumb-link">
                {item.label}
              </a>
            ) : (
              <span className="nbk-breadcrumb-current">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
