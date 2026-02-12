import React from 'react';

interface CategoryItem {
  name: string;
  slug: string;
  postCount: number;
}

interface CategoryListProps {
  categories: CategoryItem[];
  activeCategory?: string;
  basePath?: string;
  className?: string;
}

export function CategoryList({
  categories,
  activeCategory,
  basePath = '/blog',
  className = '',
}: CategoryListProps) {
  if (categories.length === 0) return null;

  return (
    <div className={`nbk-category-list ${className}`}>
      <h3 className="nbk-category-list-title">Categories</h3>
      <ul className="nbk-category-items">
        {categories.map((cat) => (
          <li key={cat.slug} className="nbk-category-item">
            <a
              href={`${basePath}/category/${cat.slug}`}
              className={`nbk-category-btn ${activeCategory === cat.slug ? 'active' : ''}`}
            >
              {cat.name}
              <span className="nbk-category-count">{cat.postCount}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
