'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from './hooks';

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  postCount: number;
}

export function CategoryManager() {
  const api = useAdminApi();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setError('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || undefined,
      };
      if (slug.trim()) body.slug = slug.trim();

      if (editingId) {
        await api.put(`/categories?id=${editingId}`, body);
      } else {
        await api.post('/categories', body);
      }
      resetForm();
      loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    }
  };

  const handleEdit = (cat: CategoryItem) => {
    setEditingId(cat._id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.del(`/categories?id=${id}`);
      loadCategories();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const idx = categories.findIndex((c) => c._id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    try {
      await Promise.all([
        api.put(`/categories?id=${categories[idx]._id}`, { order: categories[swapIdx].order }),
        api.put(`/categories?id=${categories[swapIdx]._id}`, { order: categories[idx].order }),
      ]);
      loadCategories();
    } catch (err) {
      console.error('Reorder failed:', err);
    }
  };

  return (
    <div className="nbk-category-manager">
      <h1 className="nbk-page-title">Categories</h1>

      {/* Form */}
      <div className="nbk-category-form">
        <h3>{editingId ? 'Edit Category' : 'Add Category'}</h3>
        {error && <div className="nbk-error">{error}</div>}
        <div className="nbk-form-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="nbk-input"
            placeholder="Category name"
          />
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="nbk-input"
            placeholder="slug (auto-generated)"
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="nbk-textarea"
          rows={2}
          placeholder="Description (optional)"
        />
        <div className="nbk-form-actions">
          <button onClick={handleSave} className="nbk-btn nbk-btn-primary">
            {editingId ? 'Update' : 'Add Category'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="nbk-btn nbk-btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="nbk-loading">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="nbk-empty-state">No categories yet.</div>
      ) : (
        <table className="nbk-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Posts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, idx) => (
              <tr key={cat._id}>
                <td>
                  <div className="nbk-reorder">
                    <button
                      onClick={() => handleReorder(cat._id, 'up')}
                      disabled={idx === 0}
                      className="nbk-btn-icon"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleReorder(cat._id, 'down')}
                      disabled={idx === categories.length - 1}
                      className="nbk-btn-icon"
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td>{cat.name}</td>
                <td className="nbk-text-muted">/{cat.slug}</td>
                <td>{cat.postCount}</td>
                <td>
                  <div className="nbk-actions">
                    <button onClick={() => handleEdit(cat)} className="nbk-btn nbk-btn-sm">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
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
    </div>
  );
}
