'use client';

import React, { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
  className?: string;
}

export function TableOfContentsComponent({ headings, className = '' }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className={`nbk-toc ${className}`}>
      <h3 className="nbk-toc-title">Table of Contents</h3>
      <ul className="nbk-toc-list">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={`nbk-toc-item nbk-toc-level-${heading.level} ${
              activeId === heading.id ? 'active' : ''
            }`}
          >
            <a href={`#${heading.id}`} className="nbk-toc-link">
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
