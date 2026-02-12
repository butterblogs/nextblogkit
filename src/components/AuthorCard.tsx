import React from 'react';

interface AuthorCardProps {
  author: {
    name: string;
    avatar?: string;
    bio?: string;
    url?: string;
  };
  className?: string;
}

export function AuthorCard({ author, className = '' }: AuthorCardProps) {
  return (
    <div className={`nbk-author-card ${className}`}>
      {author.avatar && (
        <img src={author.avatar} alt={author.name} className="nbk-author-avatar" />
      )}
      <div className="nbk-author-info">
        <div className="nbk-author-name">
          {author.url ? (
            <a href={author.url} target="_blank" rel="noopener noreferrer">
              {author.name}
            </a>
          ) : (
            author.name
          )}
        </div>
        {author.bio && <p className="nbk-author-bio">{author.bio}</p>}
      </div>
    </div>
  );
}
