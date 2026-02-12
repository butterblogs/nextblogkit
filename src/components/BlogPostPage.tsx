import React from 'react';
import { TableOfContentsComponent } from './TableOfContents';
import { ShareButtons } from './ShareButtons';
import { AuthorCard } from './AuthorCard';
import { ReadingProgressBar } from './ReadingProgressBar';
import { BreadcrumbNav } from './BreadcrumbNav';
import { BlogCard } from './BlogCard';

export interface BlogPostSlots {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  beforeContent?: React.ReactNode;
  afterContent?: React.ReactNode;
}

interface BlogPostPageProps {
  post: any;
  relatedPosts?: any[];
  showTOC?: boolean;
  tocPosition?: 'sidebar' | 'top' | 'none';
  showAuthor?: boolean;
  showRelatedPosts?: boolean;
  showShareButtons?: boolean;
  showReadingProgress?: boolean;
  basePath?: string;
  className?: string;
  slots?: BlogPostSlots;
}

export function BlogPostPage({
  post,
  relatedPosts = [],
  showTOC = true,
  tocPosition = 'sidebar',
  showAuthor = true,
  showRelatedPosts = true,
  showShareButtons = true,
  showReadingProgress = true,
  basePath = '/blog',
  className = '',
  slots,
}: BlogPostPageProps) {
  if (!post) {
    return <div className="nbk-not-found">Post not found</div>;
  }

  // Extract headings from HTML for TOC
  const headings: { id: string; text: string; level: number }[] = [];
  const headingRegex = /<h([2-4])\s+id="([^"]*)"[^>]*>(.*?)<\/h[2-4]>/gi;
  let match;
  while ((match = headingRegex.exec(post.contentHTML || '')) !== null) {
    headings.push({
      level: parseInt(match[1]),
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, ''),
    });
  }

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const postUrl = `${basePath}/${post.slug}`;
  const hasTOC = showTOC && tocPosition !== 'none' && headings.length > 2;
  const hasSidebarTOC = hasTOC && tocPosition === 'sidebar';

  return (
    <>
      {slots?.header}
      <article className={`nbk-post ${hasSidebarTOC ? 'nbk-post-with-toc' : ''} ${className}`}>
        {showReadingProgress && <ReadingProgressBar />}

        <BreadcrumbNav
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: basePath },
            ...(post.categories?.[0]
              ? [{ label: post.categories[0], href: `${basePath}/category/${post.categories[0]}` }]
              : []),
            { label: post.title },
          ]}
        />

        <header className="nbk-post-header">
          {post.categories?.length > 0 && (
            <div className="nbk-post-categories">
              {post.categories.map((cat: string) => (
                <a key={cat} href={`${basePath}/category/${cat}`} className="nbk-post-category">
                  {cat}
                </a>
              ))}
            </div>
          )}
          <h1 className="nbk-post-title">{post.title}</h1>
          <div className="nbk-post-meta">
            {post.author?.avatar && (
              <img src={post.author.avatar} alt={post.author.name} className="nbk-post-avatar" />
            )}
            <span className="nbk-post-author">{post.author?.name}</span>
            {date && (
              <>
                <span className="nbk-post-sep">&middot;</span>
                <time className="nbk-post-date" dateTime={String(post.publishedAt)}>
                  {date}
                </time>
              </>
            )}
            <span className="nbk-post-sep">&middot;</span>
            <span className="nbk-post-reading-time">{post.readingTime} min read</span>
          </div>
        </header>

        {post.coverImage?.url && (
          <div className="nbk-post-cover">
            <img
              src={post.coverImage.url}
              alt={post.coverImage.alt || post.title}
              className="nbk-post-cover-img"
            />
          </div>
        )}

        {hasTOC && tocPosition === 'top' && (
          <div className="nbk-post-toc-inline">
            <TableOfContentsComponent headings={headings} />
          </div>
        )}

        {slots?.beforeContent}

        <div className="nbk-post-layout">
          {hasSidebarTOC && (
            <aside className="nbk-post-toc-sidebar">
              <TableOfContentsComponent headings={headings} />
            </aside>
          )}

          <div
            className="nbk-post-content"
            dangerouslySetInnerHTML={{ __html: post.contentHTML || '' }}
          />
        </div>

        {slots?.afterContent}

        {post.tags?.length > 0 && (
          <div className="nbk-post-tags">
            {post.tags.map((tag: string) => (
              <a key={tag} href={`${basePath}?tag=${tag}`} className="nbk-tag">
                #{tag}
              </a>
            ))}
          </div>
        )}

        {showShareButtons && (
          <ShareButtons url={postUrl} title={post.title} />
        )}

        {showAuthor && post.author && (
          <AuthorCard author={post.author} />
        )}

        {showRelatedPosts && relatedPosts.length > 0 && (
          <section className="nbk-related">
            <h2 className="nbk-related-title">Related Posts</h2>
            <div className="nbk-related-grid">
              {relatedPosts.map((p) => (
                <BlogCard key={String(p._id || p.slug)} post={p} basePath={basePath} />
              ))}
            </div>
          </section>
        )}
      </article>
      {slots?.footer}
    </>
  );
}
