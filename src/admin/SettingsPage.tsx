'use client';

import React, { useEffect, useState } from 'react';
import { useAdminApi } from './hooks';

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
    </div>
  );
}
