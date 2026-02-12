'use client';

import React, { useEffect, useState } from 'react';
import { BlogCard } from './BlogCard';

interface RelatedPostsProps {
  currentPostId: string;
  categories?: string[];
  count?: number;
  apiPath?: string;
  basePath?: string;
  className?: string;
}

export function RelatedPosts({
  currentPostId,
  categories = [],
  count = 3,
  apiPath = '/api/blog',
  basePath = '/blog',
  className = '',
}: RelatedPostsProps) {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRelated() {
      try {
        const category = categories[0];
        let url = `${apiPath}/posts?limit=${count + 1}&status=published`;
        if (category) url += `&category=${category}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          const filtered = (data.data || [])
            .filter((p: any) => p._id !== currentPostId)
            .slice(0, count);
          setPosts(filtered);
        }
      } catch {
        // silently fail
      }
    }
    fetchRelated();
  }, [currentPostId, categories, count, apiPath]);

  if (posts.length === 0) return null;

  return (
    <section className={`nbk-related ${className}`}>
      <h2 className="nbk-related-title">Related Posts</h2>
      <div className="nbk-related-grid">
        {posts.map((post) => (
          <BlogCard key={post._id || post.slug} post={post} basePath={basePath} />
        ))}
      </div>
    </section>
  );
}
