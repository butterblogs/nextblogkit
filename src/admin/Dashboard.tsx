'use client';

import React, { useEffect, useState } from 'react';
import { useAdminApi } from './hooks';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalMedia: number;
  totalCategories: number;
}

export function Dashboard() {
  const api = useAdminApi();
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalMedia: 0,
    totalCategories: 0,
  });
  const [recentDrafts, setRecentDrafts] = useState<any[]>([]);
  const [recentPublished, setRecentPublished] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [allPosts, published, drafts, media, categories] = await Promise.all([
          api.get('/posts?limit=1'),
          api.get('/posts?status=published&limit=5'),
          api.get('/posts?status=draft&limit=5'),
          api.get('/media?limit=1'),
          api.get('/categories'),
        ]);

        setStats({
          totalPosts: allPosts.meta?.total || 0,
          publishedPosts: published.meta?.total || 0,
          draftPosts: drafts.meta?.total || 0,
          totalMedia: media.meta?.total || 0,
          totalCategories: Array.isArray(categories.data) ? categories.data.length : 0,
        });

        setRecentDrafts(drafts.data || []);
        setRecentPublished(published.data || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="nbk-loading">Loading dashboard...</div>;
  }

  return (
    <div className="nbk-dashboard">
      <h1 className="nbk-page-title">Dashboard</h1>

      {/* Stats Grid */}
      <div className="nbk-stats-grid">
        <div className="nbk-stat-card">
          <div className="nbk-stat-number">{stats.totalPosts}</div>
          <div className="nbk-stat-label">Total Posts</div>
        </div>
        <div className="nbk-stat-card">
          <div className="nbk-stat-number">{stats.publishedPosts}</div>
          <div className="nbk-stat-label">Published</div>
        </div>
        <div className="nbk-stat-card">
          <div className="nbk-stat-number">{stats.draftPosts}</div>
          <div className="nbk-stat-label">Drafts</div>
        </div>
        <div className="nbk-stat-card">
          <div className="nbk-stat-number">{stats.totalMedia}</div>
          <div className="nbk-stat-label">Media Files</div>
        </div>
        <div className="nbk-stat-card">
          <div className="nbk-stat-number">{stats.totalCategories}</div>
          <div className="nbk-stat-label">Categories</div>
        </div>
      </div>

      <div className="nbk-dashboard-grid">
        {/* Recent Drafts */}
        <div className="nbk-dashboard-section">
          <h2 className="nbk-section-title">Recent Drafts</h2>
          {recentDrafts.length === 0 ? (
            <p className="nbk-empty-state">No drafts yet</p>
          ) : (
            <ul className="nbk-post-list-simple">
              {recentDrafts.map((post: any) => (
                <li key={post._id}>
                  <a href={`/admin/blog/${post._id}/edit`} className="nbk-post-link">
                    <span className="nbk-post-link-title">{post.title}</span>
                    <span className="nbk-post-link-date">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Published */}
        <div className="nbk-dashboard-section">
          <h2 className="nbk-section-title">Recently Published</h2>
          {recentPublished.length === 0 ? (
            <p className="nbk-empty-state">No published posts yet</p>
          ) : (
            <ul className="nbk-post-list-simple">
              {recentPublished.map((post: any) => (
                <li key={post._id}>
                  <a href={`/admin/blog/${post._id}/edit`} className="nbk-post-link">
                    <span className="nbk-post-link-title">{post.title}</span>
                    <span className="nbk-post-link-date">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="nbk-quick-actions">
        <a href="/admin/blog/new" className="nbk-btn nbk-btn-primary">
          New Post
        </a>
        <a href="/admin/blog/media" className="nbk-btn nbk-btn-secondary">
          Media Library
        </a>
      </div>
    </div>
  );
}
