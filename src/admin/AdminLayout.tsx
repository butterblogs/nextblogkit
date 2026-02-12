'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { setApiBase, setBasePath } from './hooks';

interface AdminLayoutProps {
  children: ReactNode;
  apiKey?: string;
  apiPath?: string;
  adminPath?: string;
  basePath?: string;
}

function buildNavItems(adminPath: string) {
  return [
    { label: 'Dashboard', href: adminPath, icon: '📊' },
    { label: 'Posts', href: `${adminPath}/posts`, icon: '📝' },
    { label: 'New Post', href: `${adminPath}/new`, icon: '✏️' },
    { label: 'Media', href: `${adminPath}/media`, icon: '🖼️' },
    { label: 'Categories', href: `${adminPath}/categories`, icon: '📁' },
    { label: 'Settings', href: `${adminPath}/settings`, icon: '⚙️' },
  ];
}

export function AdminLayout({ children, apiKey, apiPath, adminPath = '/admin/blog', basePath = '/blog' }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    if (apiPath) {
      setApiBase(apiPath);
    }
    if (basePath) {
      setBasePath(basePath);
    }
  }, [apiPath, basePath]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
      const stored = sessionStorage.getItem('nbk_api_key');
      if (stored || apiKey) {
        setIsAuthenticated(true);
      }
    }
  }, [apiKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      sessionStorage.setItem('nbk_api_key', inputKey);
      setIsAuthenticated(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="nbk-admin-login">
        <div className="nbk-login-card">
          <h1 className="nbk-login-title">Blog Admin</h1>
          <p className="nbk-login-subtitle">Enter your API key to continue</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Enter API key"
              className="nbk-login-input"
              autoFocus
            />
            <button type="submit" className="nbk-login-btn">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="nbk-admin">
      {/* Sidebar */}
      <aside className={`nbk-admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="nbk-sidebar-header">
          <h2 className="nbk-sidebar-title">NextBlogKit</h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="nbk-sidebar-toggle"
          >
            {sidebarOpen ? '\u2190' : '\u2192'}
          </button>
        </div>
        <nav className="nbk-sidebar-nav">
          {buildNavItems(adminPath).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`nbk-sidebar-link ${currentPath === item.href ? 'active' : ''}`}
            >
              <span className="nbk-sidebar-icon">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>
        <div className="nbk-sidebar-footer">
          <button
            onClick={() => {
              sessionStorage.removeItem('nbk_api_key');
              setIsAuthenticated(false);
            }}
            className="nbk-sidebar-link"
          >
            <span className="nbk-sidebar-icon">🚪</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="nbk-admin-main">
        {children}
      </main>
    </div>
  );
}
