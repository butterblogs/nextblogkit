export async function seed() {
  console.log('');
  console.log('  NextBlogKit — Seeding example content...');
  console.log('');

  try {
    // Dynamic import to avoid bundling issues
    const { getDb, ensureIndexes } = await import('../lib/db');
    const { createPost, createCategory } = await import('../lib/db');

    // Ensure indexes first
    await ensureIndexes();
    console.log('  ✓ Database indexes created');

    // Create example categories
    const categories = [
      { name: 'Technology', slug: 'technology', description: 'Tech tutorials and updates', order: 0 },
      { name: 'Design', slug: 'design', description: 'UI/UX and design tips', order: 1 },
      { name: 'Tutorials', slug: 'tutorials', description: 'Step-by-step guides', order: 2 },
    ];

    for (const cat of categories) {
      try {
        await createCategory(cat);
        console.log(`  ✓ Category: ${cat.name}`);
      } catch (err: any) {
        if (err.code === 11000) {
          console.log(`  ⚠ Category "${cat.name}" already exists`);
        } else {
          throw err;
        }
      }
    }

    // Create example post
    try {
      await createPost({
        title: 'Welcome to NextBlogKit',
        slug: 'welcome-to-nextblogkit',
        excerpt: 'Your new blog is ready! This is an example post to get you started with NextBlogKit.',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Getting Started' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Congratulations! Your NextBlogKit blog is up and running. This example post shows you what\u2019s possible.' },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Features' }],
          },
          {
            type: 'bulletList',
            content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Block editor with slash commands' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Full SEO optimization out of the box' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Media library with R2 storage' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Dynamic sitemap and RSS feed' }] }] },
            ],
          },
          {
            type: 'callout',
            attrs: { type: 'tip' },
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Head to the admin panel to start creating your own posts!' }] },
            ],
          },
        ] as any,
        contentHTML: '<h2>Getting Started</h2><p>Congratulations! Your NextBlogKit blog is up and running.</p><h2>Features</h2><ul><li>Block editor with slash commands</li><li>Full SEO optimization out of the box</li><li>Media library with R2 storage</li><li>Dynamic sitemap and RSS feed</li></ul>',
        status: 'published',
        categories: ['technology'],
        tags: ['nextjs', 'blog', 'getting-started'],
      });
      console.log('  ✓ Example post: "Welcome to NextBlogKit"');
    } catch (err: any) {
      if (err.code === 11000) {
        console.log('  ⚠ Example post already exists');
      } else {
        throw err;
      }
    }

    console.log('');
    console.log('  Seeding complete!');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('  ✗ Seeding failed:', error);
    process.exit(1);
  }
}
