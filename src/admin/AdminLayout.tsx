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

  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCurrentPath(window.location.pathname);

    const stored = sessionStorage.getItem('nbk_api_key');
    const key = stored || apiKey;
    if (!key) {
      setInitializing(false);
      return;
    }

    const base = apiPath || '/api/blog';
    fetch(`${base}/settings`, {
      headers: { Authorization: `Bearer ${key}` },
    })
      .then((res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem('nbk_api_key');
        }
      })
      .catch(() => {
        // Network error — still allow if key exists (offline tolerance)
        if (key) setIsAuthenticated(true);
      })
      .finally(() => setInitializing(false));
  }, [apiKey, apiPath]);

  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setLoginError('');
    setLoginLoading(true);

    try {
      const base = apiPath || '/api/blog';
      const res = await fetch(`${base}/settings`, {
        headers: { Authorization: `Bearer ${inputKey}` },
      });

      if (res.ok) {
        sessionStorage.setItem('nbk_api_key', inputKey);
        setIsAuthenticated(true);
      } else {
        setLoginError('Invalid API key');
      }
    } catch {
      setLoginError('Unable to connect to server');
    } finally {
      setLoginLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="nbk-admin-login">
        <div className="nbk-login-card">
          <p className="nbk-login-subtitle">Verifying...</p>
        </div>
      </div>
    );
  }

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
              disabled={loginLoading}
            />
            {loginError && <p className="nbk-login-error">{loginError}</p>}
            <button type="submit" className="nbk-login-btn" disabled={loginLoading}>
              {loginLoading ? 'Verifying...' : 'Sign In'}
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
