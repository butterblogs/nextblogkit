import React from 'react';
import { BlogCard } from './BlogCard';
import { BlogSearch } from './BlogSearch';
import { Pagination } from './Pagination';
import { CategoryList } from './CategoryList';

export interface BlogListSlots {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  beforePosts?: React.ReactNode;
  afterPosts?: React.ReactNode;
  sidebar?: React.ReactNode;
  renderCard?: (post: any) => React.ReactNode;
}

interface BlogListPageProps {
  posts: any[];
  total: number;
  page?: number;
  postsPerPage?: number;
  categories?: any[];
  activeCategory?: string;
  showCategories?: boolean;
  showSearch?: boolean;
  layout?: 'grid' | 'list' | 'magazine';
  basePath?: string;
  apiPath?: string;
  className?: string;
  slots?: BlogListSlots;
}

export function BlogListPage({
  posts,
  total,
  page = 1,
  postsPerPage = 10,
  categories = [],
  activeCategory,
  showCategories = true,
  showSearch = true,
  layout = 'grid',
  basePath = '/blog',
  apiPath = '/api/blog',
  className = '',
  slots,
}: BlogListPageProps) {
  const totalPages = Math.ceil(total / postsPerPage);

  return (
    <>
      {slots?.header}
      <div className={`nbk-blog-list ${className}`}>
        <div className="nbk-blog-header">
          {showSearch && <BlogSearch apiPath={apiPath} />}
        </div>

        {slots?.beforePosts}

        <div className="nbk-blog-layout">
          <div className="nbk-blog-main">
            {posts.length === 0 ? (
              <div className="nbk-empty-state">
                <p>No posts found.</p>
              </div>
            ) : (
              <div className={`nbk-posts-${layout}`}>
                {posts.map((post) =>
                  slots?.renderCard ? (
                    slots.renderCard(post)
                  ) : (
                    <BlogCard
                      key={String(post._id || post.slug)}
                      post={post}
                      layout={layout === 'list' ? 'horizontal' : 'vertical'}
                      basePath={basePath}
                    />
                  )
                )}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath={basePath}
                category={activeCategory}
              />
            )}
          </div>

          {slots?.sidebar || (showCategories && categories.length > 0 && (
            <aside className="nbk-blog-sidebar">
              <CategoryList
                categories={categories}
                activeCategory={activeCategory}
                basePath={basePath}
              />
            </aside>
          ))}
        </div>

        {slots?.afterPosts}
      </div>
      {slots?.footer}
    </>
  );
}
