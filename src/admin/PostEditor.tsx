'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { BlogEditor } from '../editor/Editor';
import { renderBlocksToHTML } from '../editor/renderer';
import { SEOPanel } from './SEOPanel';
import { useAdminApi, getBasePath } from './hooks';

interface PostEditorProps {
  postId?: string;
}

export function PostEditor({ postId }: PostEditorProps) {
  const api = useAdminApi();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState<Record<string, unknown>>({ type: 'doc', content: [{ type: 'paragraph' }] });
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<string>('draft');
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string>('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [seo, setSeo] = useState<Record<string, unknown>>({});
  const [authorName, setAuthorName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const [allCategories, setAllCategories] = useState<{ slug: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [error, setError] = useState('');
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [loading, setLoading] = useState(!!postId);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Media picker state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaItems, setMediaItems] = useState<{ _id: string; url: string; alt?: string; originalName: string }[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'cover' | 'editor'>('cover');
  const [mediaPickerResolve, setMediaPickerResolve] = useState<((result: { url: string; alt?: string } | null) => void) | null>(null);

  useEffect(() => {
    api.get('/categories').then((res) => {
      setAllCategories(res.data || []);
    }).catch(() => {});

    if (postId) {
      api.get(`/posts?id=${postId}`).then((res) => {
        const post = res.data;
        setTitle(post.title || '');
        setSlug(post.slug || '');
        setContent(post.content?.length ? { type: 'doc', content: post.content } : { type: 'doc', content: [{ type: 'paragraph' }] });
        setExcerpt(post.excerpt || '');
        setStatus(post.status || 'draft');
        setCategories(post.categories || []);
        setTags((post.tags || []).join(', '));
        setCoverImageUrl(post.coverImage?.url || '');
        setSeo(post.seo || {});
        setAuthorName(post.author?.name || '');
        setScheduledAt(post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '');
      }).catch((err) => setError(err.message)).finally(() => setLoading(false));
    }
  }, [postId]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!postId) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async (targetStatus?: string) => {
    setSaving(true);
    setError('');

    try {
      const contentArray = (content as any).content || [];
      const html = renderBlocksToHTML(content as any);

      const body: Record<string, unknown> = {
        title,
        slug,
        excerpt,
        content: contentArray,
        contentHTML: html,
        status: targetStatus || status,
        categories,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        seo,
      };

      if (coverImageUrl) {
        body.coverImage = { _id: '', url: coverImageUrl, alt: title };
      }

      if (authorName) {
        body.author = { name: authorName };
      }

      if (scheduledAt && (targetStatus || status) === 'scheduled') {
        body.scheduledAt = new Date(scheduledAt).toISOString();
      }

      if (postId) {
        await api.put(`/posts?id=${postId}`, body);
      } else {
        const res = await api.post('/posts', body);
        // Redirect to edit page
        if (res.data?._id) {
          window.location.href = `/admin/blog/${res.data._id}/edit`;
          return;
        }
      }

      setLastSaved(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAutosave = useCallback(
    (editorContent: Record<string, unknown>) => {
      if (!postId) return;
      const contentArray = (editorContent as any).content || [];
      const html = renderBlocksToHTML(editorContent as any);
      api.put(`/posts?id=${postId}`, {
        content: contentArray,
        contentHTML: html,
      }).then(() => {
        setLastSaved(new Date().toLocaleTimeString());
      }).catch(() => {});
    },
    [postId]
  );

  const uploadImage = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/media', formData);
      return { url: res.data.url, alt: res.data.alt || file.name };
    } catch (err: any) {
      const msg = err.message || 'Upload failed';
      if (msg.includes('R2') || msg.includes('STORAGE_NOT_CONFIGURED')) {
        setError('Image upload requires Cloudflare R2 configuration. Set R2 environment variables or use an external image URL instead.');
      } else {
        setError(msg);
      }
      throw err;
    }
  };

  const openMediaPicker = async (target: 'cover' | 'editor') => {
    setMediaPickerTarget(target);
    setShowMediaPicker(true);
    setMediaLoading(true);
    try {
      const res = await api.get('/media?limit=50');
      setMediaItems(res.data || []);
    } catch {
      setMediaItems([]);
    } finally {
      setMediaLoading(false);
    }
  };

  const selectMedia = (item: { url: string; alt?: string }) => {
    if (mediaPickerTarget === 'cover') {
      setCoverImageUrl(item.url);
    }
    if (mediaPickerTarget === 'editor' && mediaPickerResolve) {
      mediaPickerResolve(item);
      setMediaPickerResolve(null);
    }
    setShowMediaPicker(false);
  };

  const closeMediaPicker = () => {
    setShowMediaPicker(false);
    if (mediaPickerResolve) {
      mediaPickerResolve(null);
      setMediaPickerResolve(null);
    }
  };

  const handleBrowseMedia = (): Promise<{ url: string; alt?: string } | null> => {
    return new Promise((resolve) => {
      setMediaPickerResolve(() => resolve);
      openMediaPicker('editor');
    });
  };

  if (loading) {
    return (
      <div className="nbk-post-editor">
        <div className="nbk-editor-header">
          <h1 className="nbk-page-title">Loading...</h1>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--nbk-text-muted)' }}>
          Loading post...
        </div>
      </div>
    );
  }

  return (
    <div className="nbk-post-editor">
      <div className="nbk-editor-header">
        <h1 className="nbk-page-title">{postId ? 'Edit Post' : 'New Post'}</h1>
        <div className="nbk-editor-actions">
          {lastSaved && <span className="nbk-last-saved">Last saved: {lastSaved}</span>}
          <button
            onClick={() => handleSave('draft')}
            className="nbk-btn nbk-btn-secondary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave('published')}
            className="nbk-btn nbk-btn-primary"
            disabled={saving}
          >
            {saving ? 'Publishing...' : 'Publish'}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="nbk-btn nbk-btn-ghost"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? '⇥' : '⇤'}
          </button>
        </div>
      </div>

      {error && <div className="nbk-error">{error}</div>}

      <div className={`nbk-editor-layout ${sidebarOpen ? '' : 'nbk-sidebar-collapsed'}`}>
        {/* Main Editor */}
        <div className="nbk-editor-main">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title..."
            className="nbk-title-input"
          />

          <BlogEditor
            content={content}
            onChange={setContent}
            onSave={postId ? handleAutosave : undefined}
            uploadImage={uploadImage}
            onBrowseMedia={handleBrowseMedia}
          />
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="nbk-editor-sidebar">
            {/* Status */}
            <div className="nbk-sidebar-section">
              <h3 className="nbk-sidebar-heading">Publish</h3>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="nbk-select"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
              {status === 'scheduled' && (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="nbk-input"
                />
              )}
            </div>

            {/* Slug */}
            <div className="nbk-sidebar-section">
              <h3 className="nbk-sidebar-heading">URL Slug</h3>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="nbk-input"
                placeholder="post-url-slug"
              />
            </div>

            {/* Categories */}
            <div className="nbk-sidebar-section">
              <h3 className="nbk-sidebar-heading">Categories</h3>
              <div className="nbk-checkbox-list">
                {allCategories.map((cat) => (
                  <label key={cat.slug} className="nbk-checkbox-label">
                    <input
                      type="checkbox"
                      checked={categories.includes(cat.slug)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCategories([...categories, cat.slug]);
                        } else {
                          setCategories(categories.filter((c) => c !== cat.slug));
                        }
                      }}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="nbk-sidebar-section">
              <h3 className="nbk-sidebar-heading">Tags</h3>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="nbk-input"
                placeholder="tag1, tag2, tag3"
              />
            </div>

            {/* Cover Image */}
            <div className="nbk-sidebar-section">
              <h3 className="nbk-sidebar-heading">Cover Image</h3>
              {coverImageUrl && (
                <img src={coverImageUrl} alt="Cover" className="nbk-cover-preview" />
              )}
              <input
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="nbk-input"
                placeholder="Image URL"
              />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={async () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async () => {
                      const file = input.files?.[0];
                      if (!file) return;
                      try {
                        const result = await uploadImage(file);
                        setCoverImageUrl(result.url);
                      } catch (err) {
                        console.error('Cover upload failed:', err);
                      }
                    };
                    input.click();
                  }}
                  className="nbk-btn nbk-btn-sm nbk-btn-secondary"
                >
                  Upload New
                </button>
                <button
                  onClick={() => openMediaPicker('cover')}
                  className="nbk-btn nbk-btn-sm nbk-btn-secondary"
                >
                  Choose from Library
                </button>
              </div>
            </div>

            {/* Author */}
            <div className="nbk-sidebar-section">
              <h3 className="nbk-sidebar-heading">Author</h3>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="nbk-input"
                placeholder="Author name"
              />
            </div>

            {/* Excerpt */}
            <div className="nbk-sidebar-section">
              <h3 className="nbk-sidebar-heading">Excerpt</h3>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="nbk-textarea"
                rows={3}
                placeholder="Short description..."
              />
            </div>

            {/* SEO Panel */}
            <div className="nbk-sidebar-section">
              <button
                onClick={() => setSeoExpanded(!seoExpanded)}
                className="nbk-sidebar-heading nbk-expandable"
              >
                SEO Settings {seoExpanded ? '▼' : '▶'}
              </button>
              {seoExpanded && (
                <SEOPanel
                  seo={seo}
                  onChange={setSeo}
                  title={title}
                  slug={slug}
                  excerpt={excerpt}
                  basePath={getBasePath()}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={closeMediaPicker}
        >
          <div
            style={{
              background: 'var(--nbk-bg, #fff)',
              borderRadius: 'var(--nbk-radius, 0.5rem)',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--nbk-border, #e5e7eb)',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                Choose from Media Library
              </h2>
              <button
                onClick={closeMediaPicker}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--nbk-text-muted)',
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
              {mediaLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--nbk-text-muted)' }}>
                  Loading media...
                </div>
              ) : mediaItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--nbk-text-muted)' }}>
                  No media files found. Upload images via the Media Library first.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '0.75rem',
                }}>
                  {mediaItems.filter((m) => m.url).map((item) => (
                    <button
                      key={item._id}
                      onClick={() => selectMedia({ url: item.url, alt: item.alt || item.originalName })}
                      style={{
                        background: 'none',
                        border: '2px solid var(--nbk-border, #e5e7eb)',
                        borderRadius: 'var(--nbk-radius, 0.5rem)',
                        padding: '0.25rem',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--nbk-primary, #2563eb)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--nbk-border, #e5e7eb)')}
                      title={item.originalName}
                    >
                      <img
                        src={item.url}
                        alt={item.alt || item.originalName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 'calc(var(--nbk-radius, 0.5rem) - 4px)',
                        }}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
