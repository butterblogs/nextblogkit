'use client';

import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'plaintext',
  filename,
  className = '',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={`nbk-code-block ${className}`}>
      <div className="nbk-code-header">
        <span className="nbk-code-lang">{filename || language}</span>
        <button onClick={handleCopy} className="nbk-code-copy">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className={`nbk-code-pre language-${language}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
