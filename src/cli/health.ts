export async function health() {
  console.log('');
  console.log('  NextBlogKit — Health Check');
  console.log('');

  let allPassed = true;

  // Check MongoDB
  try {
    const { getDb } = await import('../lib/db');
    const db = await getDb();
    await db.command({ ping: 1 });
    console.log('  ✓ MongoDB: Connected');
  } catch (err: any) {
    console.log(`  ✗ MongoDB: ${err.message}`);
    allPassed = false;
  }

  // Check R2
  try {
    const { R2StorageProvider } = await import('../lib/storage');
    const storage = new R2StorageProvider();
    await storage.list('blog/');
    console.log('  ✓ Cloudflare R2: Connected');
  } catch (err: any) {
    console.log(`  ✗ Cloudflare R2: ${err.message}`);
    allPassed = false;
  }

  // Check env vars
  try {
    const { getEnvConfig } = await import('../lib/config');
    getEnvConfig();
    console.log('  ✓ Environment: All variables set');
  } catch (err: any) {
    console.log(`  ✗ Environment: ${err.message}`);
    allPassed = false;
  }

  console.log('');
  if (allPassed) {
    console.log('  All checks passed!');
  } else {
    console.log('  Some checks failed. Please review your configuration.');
  }
  console.log('');
  process.exit(allPassed ? 0 : 1);
}
