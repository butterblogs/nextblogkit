import type { Collection, Document } from 'mongodb';

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  score: number;
}

export async function searchPosts(
  collection: Collection,
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const results = await collection
    .find(
      {
        $text: { $search: query },
        status: 'published',
      },
      {
        projection: {
          slug: 1,
          title: 1,
          excerpt: 1,
          score: { $meta: 'textScore' },
        },
      }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .toArray();

  return results.map((doc: Document) => ({
    slug: doc.slug as string,
    title: doc.title as string,
    excerpt: doc.excerpt as string,
    score: doc.score as number,
  }));
}
