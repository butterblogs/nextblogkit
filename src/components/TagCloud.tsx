'use client';

import React from 'react';

interface TagCloudProps {
  tags: { name: string; count: number }[];
  basePath?: string;
  className?: string;
}

export function TagCloud({ tags, basePath = '/blog', className = '' }: TagCloudProps) {
  if (tags.length === 0) return null;

  const maxCount = Math.max(...tags.map((t) => t.count));

  return (
    <div className={`nbk-tag-cloud ${className}`}>
      <h3 className="nbk-tag-cloud-title">Tags</h3>
      <div className="nbk-tags">
        {tags.map((tag) => {
          const size = 0.8 + (tag.count / maxCount) * 0.6;
          return (
            <a
              key={tag.name}
              href={`${basePath}?tag=${tag.name}`}
              className="nbk-tag"
              style={{ fontSize: `${size}rem` }}
            >
              #{tag.name}
            </a>
          );
        })}
      </div>
    </div>
  );
}
