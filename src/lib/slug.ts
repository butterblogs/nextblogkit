import type { Collection } from 'mongodb';

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function ensureUniqueSlug(
  slug: string,
  collection: Collection,
  excludeId?: string
): Promise<string> {
  let candidate = slug;
  let counter = 1;

  while (true) {
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await collection.findOne(query);
    if (!existing) return candidate;

    candidate = `${slug}-${counter}`;
    counter++;
  }
}
