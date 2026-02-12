'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface BlogSearchProps {
  onSearch?: (query: string) => void;
  apiPath?: string;
  basePath?: string;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
}

export function BlogSearch({
  onSearch,
  apiPath = '/api/blog',
  basePath = '/blog',
  placeholder = 'Search posts...',
  className = '',
}: BlogSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${apiPath}/posts?q=${encodeURIComponent(q)}&limit=5&status=published`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data || []);
          setShowResults(true);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [apiPath]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      search(value);
      onSearch?.(value);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
    setShowResults(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`nbk-search ${className}`} ref={containerRef}>
      <form onSubmit={handleSubmit} className="nbk-search-form">
        <input
          type="search"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="nbk-search-input"
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {loading && <span className="nbk-search-spinner" />}
      </form>

      {showResults && results.length > 0 && (
        <div className="nbk-search-results">
          {results.map((result) => (
            <a
              key={result.slug}
              href={`${basePath}/${result.slug}`}
              className="nbk-search-result"
              onClick={() => setShowResults(false)}
            >
              <div className="nbk-search-result-title">{result.title}</div>
              <div className="nbk-search-result-excerpt">
                {result.excerpt?.slice(0, 100)}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
