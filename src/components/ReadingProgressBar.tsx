'use client';

import React, { useEffect, useState } from 'react';

interface ReadingProgressBarProps {
  className?: string;
}

export function ReadingProgressBar({ className = '' }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min((scrollTop / docHeight) * 100, 100));
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`nbk-progress-bar ${className}`}>
      <div
        className="nbk-progress-fill"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
