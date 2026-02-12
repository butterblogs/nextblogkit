import React from 'react';

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    coverImage?: { url: string; alt?: string };
    categories: string[];
    publishedAt?: string;
    readingTime: number;
    author: { name: string; avatar?: string };
  };
  layout?: 'vertical' | 'horizontal';
  basePath?: string;
  className?: string;
}

export function BlogCard({
  post,
  layout = 'vertical',
  basePath = '/blog',
  className = '',
}: BlogCardProps) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <article className={`nbk-card nbk-card-${layout} ${className}`}>
      <a href={`${basePath}/${post.slug}`} className="nbk-card-link">
        {post.coverImage?.url && (
          <div className="nbk-card-image">
            <img
              src={post.coverImage.url}
              alt={post.coverImage.alt || post.title}
              loading="lazy"
            />
          </div>
        )}
        <div className="nbk-card-content">
          {post.categories.length > 0 && (
            <div className="nbk-card-categories">
              {post.categories.map((cat) => (
                <span key={cat} className="nbk-card-category">
                  {cat}
                </span>
              ))}
            </div>
          )}
          <h2 className="nbk-card-title">{post.title}</h2>
          <p className="nbk-card-excerpt">{post.excerpt}</p>
          <div className="nbk-card-meta">
            {post.author.avatar && (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="nbk-card-avatar"
              />
            )}
            <span className="nbk-card-author">{post.author.name}</span>
            {date && (
              <>
                <span className="nbk-card-sep">&middot;</span>
                <time className="nbk-card-date">{date}</time>
              </>
            )}
            <span className="nbk-card-sep">&middot;</span>
            <span className="nbk-card-reading-time">{post.readingTime} min read</span>
          </div>
        </div>
      </a>
    </article>
  );
}
