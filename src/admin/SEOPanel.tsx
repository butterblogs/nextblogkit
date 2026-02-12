'use client';

import React from 'react';

interface SEOPanelProps {
  seo: Record<string, unknown>;
  onChange: (seo: Record<string, unknown>) => void;
  title: string;
  slug: string;
  excerpt: string;
  basePath?: string;
}

export function SEOPanel({ seo, onChange, title, slug, excerpt, basePath = '/blog' }: SEOPanelProps) {
  const metaTitle = (seo.metaTitle as string) || '';
  const metaDescription = (seo.metaDescription as string) || '';
  const focusKeyword = (seo.focusKeyword as string) || '';
  const canonicalUrl = (seo.canonicalUrl as string) || '';
  const ogImage = (seo.ogImage as string) || '';
  const noIndex = (seo.noIndex as boolean) || false;

  const displayTitle = metaTitle || title || 'Post Title';
  const displayDesc = metaDescription || excerpt || 'Post description will appear here...';
  const displayUrl = `${basePath}/${slug || 'post-url'}`;

  const titleLength = displayTitle.length;
  const descLength = displayDesc.length;

  const titleColor =
    titleLength >= 50 && titleLength <= 60 ? 'nbk-count-good' : titleLength > 70 ? 'nbk-count-bad' : 'nbk-count-warn';
  const descColor =
    descLength >= 150 && descLength <= 160 ? 'nbk-count-good' : descLength > 170 ? 'nbk-count-bad' : 'nbk-count-warn';

  return (
    <div className="nbk-seo-panel">
      {/* SERP Preview */}
      <div className="nbk-serp-preview">
        <div className="nbk-serp-title">{displayTitle}</div>
        <div className="nbk-serp-url">{displayUrl}</div>
        <div className="nbk-serp-desc">{displayDesc.slice(0, 160)}</div>
      </div>

      {/* Focus Keyword */}
      <div className="nbk-field">
        <label className="nbk-label">Focus Keyword</label>
        <input
          type="text"
          value={focusKeyword}
          onChange={(e) => onChange({ ...seo, focusKeyword: e.target.value })}
          className="nbk-input"
          placeholder="e.g. nextjs blog"
        />
      </div>

      {/* Meta Title */}
      <div className="nbk-field">
        <label className="nbk-label">
          Meta Title <span className={titleColor}>({titleLength}/60)</span>
        </label>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => onChange({ ...seo, metaTitle: e.target.value })}
          className="nbk-input"
          placeholder={title || 'Custom meta title'}
        />
      </div>

      {/* Meta Description */}
      <div className="nbk-field">
        <label className="nbk-label">
          Meta Description <span className={descColor}>({descLength}/160)</span>
        </label>
        <textarea
          value={metaDescription}
          onChange={(e) => onChange({ ...seo, metaDescription: e.target.value })}
          className="nbk-textarea"
          rows={3}
          placeholder={excerpt || 'Custom meta description'}
        />
      </div>

      {/* Canonical URL */}
      <div className="nbk-field">
        <label className="nbk-label">Canonical URL</label>
        <input
          type="url"
          value={canonicalUrl}
          onChange={(e) => onChange({ ...seo, canonicalUrl: e.target.value })}
          className="nbk-input"
          placeholder="https://..."
        />
      </div>

      {/* OG Image Override */}
      <div className="nbk-field">
        <label className="nbk-label">OG Image Override</label>
        <input
          type="url"
          value={ogImage}
          onChange={(e) => onChange({ ...seo, ogImage: e.target.value })}
          className="nbk-input"
          placeholder="https://..."
        />
      </div>

      {/* No Index */}
      <div className="nbk-field">
        <label className="nbk-checkbox-label">
          <input
            type="checkbox"
            checked={noIndex}
            onChange={(e) => onChange({ ...seo, noIndex: e.target.checked })}
          />
          No Index (hide from search engines)
        </label>
      </div>
    </div>
  );
}
