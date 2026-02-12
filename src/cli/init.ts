import fs from 'fs';
import path from 'path';
import { getTemplates } from './templates';

interface InitOptions {
  blogPath: string;
  adminPath: string;
  apiPath: string;
  example?: boolean;
}

export async function init(options: InitOptions) {
  const cwd = process.cwd();

  // Verify this is a Next.js project
  const packageJsonPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: No package.json found. Run this in a Next.js project root.');
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const hasNext = pkg.dependencies?.next || pkg.devDependencies?.next;
  if (!hasNext) {
    console.error('Error: next is not a dependency. This must be a Next.js project.');
    process.exit(1);
  }

  // Detect app directory
  const appDir = fs.existsSync(path.join(cwd, 'src', 'app'))
    ? path.join(cwd, 'src', 'app')
    : path.join(cwd, 'app');

  if (!fs.existsSync(appDir)) {
    console.error('Error: No app/ directory found. NextBlogKit requires the Next.js App Router.');
    process.exit(1);
  }

  console.log('');
  console.log('  NextBlogKit — Initializing...');
  console.log('');

  const templates = getTemplates(options);

  for (const template of templates) {
    const filePath = path.join(appDir, template.path);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      console.log(`  ⚠ Skipping ${template.path} (already exists)`);
      continue;
    }

    fs.writeFileSync(filePath, template.content);
    console.log(`  ✓ ${template.path}`);
  }

  // Create config file
  const configPath = path.join(cwd, 'nextblogkit.config.ts');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(
      configPath,
      `import { defineConfig } from 'nextblogkit';

export default defineConfig({
  basePath: '${options.blogPath}',
  adminPath: '${options.adminPath}',
  apiPath: '${options.apiPath}',
  auth: {
    strategy: 'api-key',
  },
});
`
    );
    console.log('  ✓ nextblogkit.config.ts');
  }

  // Create .env.local.example
  const envExamplePath = path.join(cwd, '.env.local.example');
  if (!fs.existsSync(envExamplePath)) {
    fs.writeFileSync(
      envExamplePath,
      `# NextBlogKit Configuration
# Copy this to .env.local and fill in your values

# MongoDB Connection
NEXTBLOGKIT_MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mydb

# Cloudflare R2 Storage
NEXTBLOGKIT_R2_ACCOUNT_ID=your-account-id
NEXTBLOGKIT_R2_ACCESS_KEY=your-access-key
NEXTBLOGKIT_R2_SECRET_KEY=your-secret-key
NEXTBLOGKIT_R2_BUCKET=blog-media
NEXTBLOGKIT_R2_PUBLIC_URL=https://media.yourdomain.com

# Authentication
NEXTBLOGKIT_API_KEY=your-secure-api-key-must-be-at-least-32-characters-long

# Site Info
NEXTBLOGKIT_SITE_URL=https://yourdomain.com
NEXTBLOGKIT_SITE_NAME="Your Site Name"
`
    );
    console.log('  ✓ .env.local.example');
  }

  console.log('');
  console.log('  Done! Next steps:');
  console.log('');
  console.log('  1. Copy .env.local.example to .env.local and fill in your values');
  console.log('  2. Run: npm run dev');
  console.log(`  3. Visit: http://localhost:3000${options.adminPath}`);
  console.log('');
}
