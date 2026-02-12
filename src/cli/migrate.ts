export async function migrateCommand() {
  console.log('');
  console.log('  NextBlogKit — Database Migration');
  console.log('');

  try {
    const { ensureIndexes } = await import('../lib/db');

    console.log('  Creating/updating indexes...');
    await ensureIndexes();
    console.log('  ✓ All indexes created');

    console.log('');
    console.log('  Migration complete!');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('  ✗ Migration failed:', error);
    process.exit(1);
  }
}
