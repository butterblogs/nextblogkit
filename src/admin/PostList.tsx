'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from './hooks';

interface Post {
  _id: string;
  title: string;
  slug: string;
  status: string;
  categories: string[];
  publishedAt?: string;
  updatedAt: string;
  wordCount: number;
  readingTime: number;
}

export function PostList() {
  const api = useAdminApi();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const limit = 20;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      let path = `/posts?page=${page}&limit=${limit}`;
      if (statusFilter) path += `&status=${statusFilter}`;
      if (searchQuery) path += `&q=${encodeURIComponent(searchQuery)}`;

      const res = await api.get(path);
      setPosts(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this post?')) return;
    try {
      await api.del(`/posts?id=${id}`);
      loadPosts();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selected.size === 0) return;

    for (const id of selected) {
      try {
        if (action === 'publish') {
          await api.put(`/posts?id=${id}`, { status: 'published' });
        } else if (action === 'draft') {
          await api.put(`/posts?id=${id}`, { status: 'draft' });
        } else if (action === 'archive') {
          await api.del(`/posts?id=${id}`);
        }
      } catch (err) {
        console.error(`Bulk ${action} failed for ${id}:`, err);
      }
    }
    setSelected(new Set());
    loadPosts();
  };

  const totalPages = Math.ceil(total / limit);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      published: 'nbk-badge-green',
      draft: 'nbk-badge-yellow',
      scheduled: 'nbk-badge-blue',
      archived: 'nbk-badge-gray',
    };
    return <span className={`nbk-badge ${colors[status] || 'nbk-badge-gray'}`}>{status}</span>;
  };

  return (
    <div className="nbk-post-list">
      <div className="nbk-page-header">
        <h1 className="nbk-page-title">Posts</h1>
        <a href="/admin/blog/new" className="nbk-btn nbk-btn-primary">
          New Post
        </a>
      </div>

      {/* Filters */}
      <div className="nbk-filters">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="nbk-input nbk-search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="nbk-select"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>

        {selected.size > 0 && (
          <div className="nbk-bulk-actions">
            <span>{selected.size} selected</span>
            <button onClick={() => handleBulkAction('publish')} className="nbk-btn nbk-btn-sm">
              Publish
            </button>
            <button onClick={() => handleBulkAction('draft')} className="nbk-btn nbk-btn-sm">
              Unpublish
            </button>
            <button onClick={() => handleBulkAction('archive')} className="nbk-btn nbk-btn-sm nbk-btn-danger">
              Archive
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="nbk-loading">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="nbk-empty-state">
          <p>No posts found.</p>
          <a href="/admin/blog/new" className="nbk-btn nbk-btn-primary">
            Create your first post
          </a>
        </div>
      ) : (
        <table className="nbk-table">
          <thead>
            <tr>
              <th className="nbk-th-checkbox">
                <input
                  type="checkbox"
                  checked={selected.size === posts.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected(new Set(posts.map((p) => p._id)));
                    } else {
                      setSelected(new Set());
                    }
                  }}
                />
              </th>
              <th>Title</th>
              <th>Status</th>
              <th>Categories</th>
              <th>Words</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(post._id)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(post._id);
                      else next.delete(post._id);
                      setSelected(next);
                    }}
                  />
                </td>
                <td>
                  <a href={`/admin/blog/${post._id}/edit`} className="nbk-post-title-link">
                    {post.title}
                  </a>
                  <div className="nbk-post-slug">/{post.slug}</div>
                </td>
                <td>{statusBadge(post.status)}</td>
                <td>{post.categories.join(', ') || '—'}</td>
                <td>{post.wordCount}</td>
                <td>
                  {new Date(
                    post.publishedAt || post.updatedAt
                  ).toLocaleDateString()}
                </td>
                <td>
                  <div className="nbk-actions">
                    <a href={`/admin/blog/${post._id}/edit`} className="nbk-btn nbk-btn-sm">
                      Edit
                    </a>
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nbk-btn nbk-btn-sm"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="nbk-btn nbk-btn-sm nbk-btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="nbk-pagination-admin">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="nbk-btn nbk-btn-sm"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages} ({total} posts)
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="nbk-btn nbk-btn-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
