import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { init } from './init';
import { seed } from './seed';
import { health } from './health';
import { migrateCommand } from './migrate';

// Load .env files (same priority as Next.js: .env.local > .env)
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Don't override existing env vars
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const cwd = process.cwd();
loadEnvFile(resolve(cwd, '.env.local'));
loadEnvFile(resolve(cwd, '.env'));

const program = new Command();

program
  .name('nextblogkit')
  .description('NextBlogKit — Blog engine for Next.js')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize NextBlogKit in your Next.js project')
  .option('--blog-path <path>', 'Blog base path', '/blog')
  .option('--admin-path <path>', 'Admin panel path', '/admin/blog')
  .option('--api-path <path>', 'API base path', '/api/blog')
  .option('--no-example', 'Skip creating example post')
  .action(init);

program
  .command('seed')
  .description('Seed example blog content')
  .action(seed);

program
  .command('health')
  .description('Check database and storage connectivity')
  .action(health);

program
  .command('migrate')
  .description('Run database migrations')
  .action(migrateCommand);

program.parse();
