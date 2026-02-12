'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from './hooks';

interface TokenItem {
  _id: string;
  name: string;
  prefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

function ApiTokensSection() {
  const api = useAdminApi();
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenName, setTokenName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      const res = await api.get('/tokens');
      setTokens(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleGenerate = async () => {
    if (!tokenName.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const res = await api.post('/tokens', { name: tokenName.trim() });
      setNewToken(res.data.plainToken);
      setTokenName('');
      fetchTokens();
    } catch (err: any) {
      setError(err.message || 'Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this token? Any integrations using it will stop working.')) return;
    setRevoking(id);
    setError('');
    try {
      await api.del(`/tokens?id=${id}`);
      setTokens((prev) => prev.filter((t) => t._id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to revoke token');
    } finally {
      setRevoking(null);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d?: string) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="nbk-settings-section">
      <h2 className="nbk-section-title">API Tokens</h2>
      <p style={{ color: 'var(--nbk-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
        Generate tokens for external services (CI pipelines, automation tools, CMS integrations).
        Tokens can access the API like the master key but cannot manage other tokens.
      </p>

      {error && <div className="nbk-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {newToken && (
        <div style={{
          background: 'var(--nbk-bg-secondary)',
          border: '1px solid var(--nbk-warning, #f59e0b)',
          borderRadius: 'var(--nbk-radius)',
          padding: '1rem',
          marginBottom: '1rem',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--nbk-warning, #f59e0b)' }}>
            Save this token — it will only be shown once
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <code style={{
              flex: 1,
              background: 'var(--nbk-bg)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--nbk-radius)',
              border: '1px solid var(--nbk-border)',
              fontSize: '0.813rem',
              fontFamily: 'var(--nbk-font-code)',
              wordBreak: 'break-all',
            }}>
              {newToken}
            </code>
            <button onClick={copyToken} className="nbk-btn nbk-btn-primary" style={{ whiteSpace: 'nowrap' }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setNewToken('')}
            style={{
              marginTop: '0.5rem',
              background: 'none',
              border: 'none',
              color: 'var(--nbk-text-muted)',
              cursor: 'pointer',
              fontSize: '0.813rem',
              padding: 0,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {!showDialog ? (
        <button onClick={() => setShowDialog(true)} className="nbk-btn nbk-btn-primary" style={{ marginBottom: '1rem' }}>
          Generate New Token
        </button>
      ) : (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          alignItems: 'flex-end',
        }}>
          <div style={{ flex: 1 }}>
            <label className="nbk-label">Token Name</label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="nbk-input"
              placeholder="e.g. CI Pipeline, n8n Automation"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              autoFocus
            />
          </div>
          <button onClick={handleGenerate} className="nbk-btn nbk-btn-primary" disabled={generating || !tokenName.trim()}>
            {generating ? 'Generating...' : 'Generate'}
          </button>
          <button
            onClick={() => { setShowDialog(false); setTokenName(''); }}
            className="nbk-btn"
            style={{ background: 'var(--nbk-bg-secondary)', border: '1px solid var(--nbk-border)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--nbk-text-muted)' }}>Loading tokens...</div>
      ) : tokens.length === 0 ? (
        <div style={{ color: 'var(--nbk-text-muted)', fontSize: '0.875rem' }}>
          No API tokens generated yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--nbk-border)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 }}>Key Prefix</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 }}>Last Used</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 }}>Created</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t._id} style={{ borderBottom: '1px solid var(--nbk-border)' }}>
                  <td style={{ padding: '0.5rem 0.75rem' }}>{t.name}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <code style={{ fontFamily: 'var(--nbk-font-code)', fontSize: '0.813rem' }}>{t.prefix}...</code>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--nbk-text-muted)' }}>{formatDate(t.lastUsedAt)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--nbk-text-muted)' }}>{formatDate(t.createdAt)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRevoke(t._id)}
                      disabled={revoking === t._id}
                      style={{
                        background: 'none',
                        border: '1px solid var(--nbk-danger, #ef4444)',
                        color: 'var(--nbk-danger, #ef4444)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--nbk-radius)',
                        cursor: 'pointer',
                        fontSize: '0.813rem',
                      }}
                    >
                      {revoking === t._id ? 'Revoking...' : 'Revoke'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ApiReferenceSection() {
  const [open, setOpen] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const sampleJson = `{
  "title": "My Blog Post",
  "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Hello world!" }] }],
  "contentHTML": "<p>Hello world!</p>",
  "excerpt": "A short summary of the post",
  "status": "published",
  "categories": ["tech"],
  "tags": ["nextjs", "blog"],
  "author": {
    "name": "John Doe",
    "bio": "Software engineer",
    "avatar": "https://example.com/avatar.jpg"
  },
  "seo": {
    "metaTitle": "My Blog Post | MySite",
    "metaDescription": "A short summary for search engines",
    "focusKeyword": "blog post"
  }
}`;

  const sampleCurl = `curl -X POST https://yoursite.com/api/blog/posts \\
  -H "Authorization: Bearer nbk_your-token-here" \\
  -H "Content-Type: application/json" \\
  -d '{ "title": "My Post", "content": [{"type":"paragraph","content":[{"type":"text","text":"Hello!"}]}], "contentHTML": "<p>Hello!</p>", "status": "published" }'`;

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="nbk-settings-section">
      <h2
        className="nbk-section-title"
        onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <span style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>
          &#9654;
        </span>
        API Reference
      </h2>

      {open && (
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ fontSize: '0.938rem', fontWeight: 600, marginBottom: '0.75rem' }}>Create Post — POST /api/blog/posts</h3>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.813rem', fontWeight: 600, color: 'var(--nbk-text-muted)' }}>Sample JSON Body</span>
              <button
                onClick={() => copyText(sampleJson, setCopiedJson)}
                style={{
                  background: 'none',
                  border: '1px solid var(--nbk-border)',
                  borderRadius: 'var(--nbk-radius)',
                  padding: '0.125rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'var(--nbk-text-muted)',
                }}
              >
                {copiedJson ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre style={{
              background: 'var(--nbk-bg-secondary)',
              border: '1px solid var(--nbk-border)',
              borderRadius: 'var(--nbk-radius)',
              padding: '0.75rem',
              overflow: 'auto',
              fontSize: '0.813rem',
              fontFamily: 'var(--nbk-font-code)',
              lineHeight: 1.5,
              maxHeight: '400px',
            }}>
              {sampleJson}
            </pre>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.813rem', fontWeight: 600, color: 'var(--nbk-text-muted)' }}>Sample curl Command</span>
              <button
                onClick={() => copyText(sampleCurl, setCopiedCurl)}
                style={{
                  background: 'none',
                  border: '1px solid var(--nbk-border)',
                  borderRadius: 'var(--nbk-radius)',
                  padding: '0.125rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'var(--nbk-text-muted)',
                }}
              >
                {copiedCurl ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre style={{
              background: 'var(--nbk-bg-secondary)',
              border: '1px solid var(--nbk-border)',
              borderRadius: 'var(--nbk-radius)',
              padding: '0.75rem',
              overflow: 'auto',
              fontSize: '0.813rem',
              fontFamily: 'var(--nbk-font-code)',
              lineHeight: 1.5,
            }}>
              {sampleCurl}
            </pre>
          </div>

          <h3 style={{ fontSize: '0.938rem', fontWeight: 600, marginBottom: '0.75rem' }}>Field Reference</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--nbk-border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 }}>Field</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 }}>Required</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['title', 'string', 'Yes', 'Post title'],
                  ['content', 'BlockContent[]', 'No', 'TipTap JSON content blocks'],
                  ['contentHTML', 'string', 'No', 'HTML version of the content'],
                  ['excerpt', 'string', 'No', 'Short summary (auto-generated if omitted)'],
                  ['slug', 'string', 'No', 'URL slug (auto-generated from title if omitted)'],
                  ['status', '"draft" | "published" | "scheduled"', 'No', 'Defaults to "draft"'],
                  ['categories', 'string[]', 'No', 'Category slugs'],
                  ['tags', 'string[]', 'No', 'Tag strings'],
                  ['author', '{ name, bio?, avatar?, url? }', 'No', 'Post author info'],
                  ['seo', '{ metaTitle?, metaDescription?, focusKeyword?, ... }', 'No', 'SEO metadata'],
                  ['coverImage', '{ _id, url, alt?, caption? }', 'No', 'Cover image reference'],
                  ['publishedAt', 'ISO date string', 'No', 'Publish date (auto-set when status is "published")'],
                  ['scheduledAt', 'ISO date string', 'No', 'Schedule date for future publishing'],
                ].map(([field, type, required, desc]) => (
                  <tr key={field} style={{ borderBottom: '1px solid var(--nbk-border)' }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <code style={{ fontFamily: 'var(--nbk-font-code)', fontSize: '0.813rem' }}>{field}</code>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--nbk-text-muted)' }}>{type}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{required}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--nbk-text-muted)' }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsPage() {
  const api = useAdminApi();
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setSettings(res.data || {}))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.put('/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateNested = (parent: string, key: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      [parent]: { ...(prev[parent] as Record<string, unknown> || {}), [key]: value },
    }));
  };

  if (loading) return <div className="nbk-loading">Loading settings...</div>;

  return (
    <div className="nbk-settings">
      <div className="nbk-page-header">
        <h1 className="nbk-page-title">Settings</h1>
        <button
          onClick={handleSave}
          className="nbk-btn nbk-btn-primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {error && <div className="nbk-error">{error}</div>}

      {/* General */}
      <div className="nbk-settings-section">
        <h2 className="nbk-section-title">General</h2>

        <div className="nbk-field">
          <label className="nbk-label">Posts Per Page</label>
          <input
            type="number"
            value={(settings.postsPerPage as number) || 10}
            onChange={(e) => update('postsPerPage', parseInt(e.target.value) || 10)}
            className="nbk-input"
            min="1"
            max="100"
          />
        </div>
      </div>

      {/* Default Author */}
      <div className="nbk-settings-section">
        <h2 className="nbk-section-title">Default Author</h2>

        <div className="nbk-field">
          <label className="nbk-label">Name</label>
          <input
            type="text"
            value={(settings.defaultAuthor as any)?.name || ''}
            onChange={(e) => updateNested('defaultAuthor', 'name', e.target.value)}
            className="nbk-input"
          />
        </div>
        <div className="nbk-field">
          <label className="nbk-label">Bio</label>
          <textarea
            value={(settings.defaultAuthor as any)?.bio || ''}
            onChange={(e) => updateNested('defaultAuthor', 'bio', e.target.value)}
            className="nbk-textarea"
            rows={2}
          />
        </div>
        <div className="nbk-field">
          <label className="nbk-label">Avatar URL</label>
          <input
            type="url"
            value={(settings.defaultAuthor as any)?.avatar || ''}
            onChange={(e) => updateNested('defaultAuthor', 'avatar', e.target.value)}
            className="nbk-input"
          />
        </div>
        <div className="nbk-field">
          <label className="nbk-label">Profile URL</label>
          <input
            type="url"
            value={(settings.defaultAuthor as any)?.url || ''}
            onChange={(e) => updateNested('defaultAuthor', 'url', e.target.value)}
            className="nbk-input"
          />
        </div>
      </div>

      {/* SEO */}
      <div className="nbk-settings-section">
        <h2 className="nbk-section-title">SEO</h2>

        <div className="nbk-field">
          <label className="nbk-label">Default OG Image URL</label>
          <input
            type="url"
            value={(settings.defaultOgImage as string) || ''}
            onChange={(e) => update('defaultOgImage', e.target.value)}
            className="nbk-input"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Comments */}
      <div className="nbk-settings-section">
        <h2 className="nbk-section-title">Comments</h2>

        <div className="nbk-field">
          <label className="nbk-label">Comment System</label>
          <select
            value={(settings.commentSystem as string) || 'none'}
            onChange={(e) => update('commentSystem', e.target.value)}
            className="nbk-select"
          >
            <option value="none">None</option>
            <option value="giscus">Giscus</option>
            <option value="disqus">Disqus</option>
          </select>
        </div>
      </div>

      {/* Analytics */}
      <div className="nbk-settings-section">
        <h2 className="nbk-section-title">Analytics</h2>

        <div className="nbk-field">
          <label className="nbk-label">Google Analytics ID</label>
          <input
            type="text"
            value={(settings.analytics as any)?.gaId || ''}
            onChange={(e) => updateNested('analytics', 'gaId', e.target.value)}
            className="nbk-input"
            placeholder="G-XXXXXXXXXX"
          />
        </div>
        <div className="nbk-field">
          <label className="nbk-label">Plausible Domain</label>
          <input
            type="text"
            value={(settings.analytics as any)?.plausibleDomain || ''}
            onChange={(e) => updateNested('analytics', 'plausibleDomain', e.target.value)}
            className="nbk-input"
            placeholder="yourdomain.com"
          />
        </div>
      </div>

      {/* Custom CSS */}
      <div className="nbk-settings-section">
        <h2 className="nbk-section-title">Custom CSS</h2>

        <div className="nbk-field">
          <textarea
            value={(settings.customCSS as string) || ''}
            onChange={(e) => update('customCSS', e.target.value)}
            className="nbk-textarea nbk-code-textarea"
            rows={6}
            placeholder="/* Custom CSS styles */"
          />
        </div>
      </div>

      {/* API Access */}
      <div style={{ marginTop: '2rem' }}>
        <h2 className="nbk-page-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>API Access</h2>
        <ApiTokensSection />
        <ApiReferenceSection />
      </div>
    </div>
  );
}
