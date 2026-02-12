'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from './hooks';

interface MediaItem {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  alt?: string;
  caption?: string;
  createdAt: string;
}

export function MediaLibrary() {
  const api = useAdminApi();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const limit = 24;

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/media?page=${page}&limit=${limit}`);
      setMedia(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post('/media', formData);
      }
      loadMedia();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media file? This cannot be undone.')) return;
    try {
      await api.del(`/media?id=${id}`);
      setSelected(null);
      loadMedia();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="nbk-media-library">
      <div className="nbk-page-header">
        <h1 className="nbk-page-title">Media Library</h1>
        <label className="nbk-btn nbk-btn-primary">
          {uploading ? 'Uploading...' : 'Upload Files'}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            className="nbk-hidden"
          />
        </label>
      </div>

      {/* Drop Zone */}
      <div
        className={`nbk-dropzone ${dragOver ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        Drop files here to upload
      </div>

      {/* Grid */}
      {loading ? (
        <div className="nbk-loading">Loading media...</div>
      ) : media.length === 0 ? (
        <div className="nbk-empty-state">
          <p>No media files yet. Upload your first image!</p>
        </div>
      ) : (
        <div className="nbk-media-grid">
          {media.map((item) => (
            <div
              key={item._id}
              className={`nbk-media-card ${selected?._id === item._id ? 'selected' : ''}`}
              onClick={() => setSelected(item)}
            >
              <div className="nbk-media-thumb">
                <img src={item.url} alt={item.alt || item.originalName} loading="lazy" />
              </div>
              <div className="nbk-media-info">
                <div className="nbk-media-name" title={item.originalName}>
                  {item.originalName}
                </div>
                <div className="nbk-media-size">{formatSize(item.size)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <div className="nbk-media-detail">
          <div className="nbk-media-detail-header">
            <h3>File Details</h3>
            <button onClick={() => setSelected(null)} className="nbk-close-btn">
              &times;
            </button>
          </div>
          <img src={selected.url} alt={selected.alt || ''} className="nbk-media-preview" />
          <div className="nbk-media-meta">
            <div><strong>Name:</strong> {selected.originalName}</div>
            <div><strong>Type:</strong> {selected.mimeType}</div>
            <div><strong>Size:</strong> {formatSize(selected.size)}</div>
            {selected.width && selected.height && (
              <div><strong>Dimensions:</strong> {selected.width} x {selected.height}</div>
            )}
            <div><strong>Uploaded:</strong> {new Date(selected.createdAt).toLocaleString()}</div>
          </div>
          <div className="nbk-media-url">
            <label className="nbk-label">URL</label>
            <input
              type="text"
              readOnly
              value={selected.url}
              className="nbk-input"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          <button
            onClick={() => handleDelete(selected._id)}
            className="nbk-btn nbk-btn-danger"
          >
            Delete File
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="nbk-pagination-admin">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="nbk-btn nbk-btn-sm">
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="nbk-btn nbk-btn-sm">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
