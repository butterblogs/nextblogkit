# NextBlogKit

A complete blog engine for Next.js — admin panel, block editor, SEO, media storage, and more. Drop it into any Next.js 14+ app and get a fully featured blog in minutes.

## Features

- **Block Editor** — TipTap-based with slash commands, image upload, code blocks (Shiki), callouts, FAQ schema, tables, task lists
- **Admin Panel** — Dashboard, post management, media library, category manager, settings — with configurable paths
- **SEO Engine** — Meta tags, Open Graph, Twitter Cards, JSON-LD structured data, sitemap.xml, RSS feed, Yoast-like SEO scorer
- **Image Pipeline** — Cloudflare R2 storage, automatic WebP conversion, responsive sizes, thumbnails
- **MongoDB Backend** — Full CRUD, slug generation, revision history, full-text search
- **Composable Components** — Page-level components with slot injection, or use individual atomic components to build your own layout
- **Table of Contents** — Sticky sidebar TOC with IntersectionObserver-based active heading tracking
- **Theming** — CSS variables for full color/font/spacing customization, dark mode support
- **CLI** — One command scaffolding for your Next.js app

## Prerequisites

- **Next.js 14+** with App Router
- **MongoDB** (Atlas or self-hosted)
- **Node.js 18+**
- **Cloudflare R2** bucket (optional — for persistent image storage)

## Quick Start

### 1. Install

```bash
pnpm add nextblogkit
```

Or with npm/yarn:

```bash
npm install nextblogkit
# or
yarn add nextblogkit
```

### 2. Scaffold into your Next.js project

```bash
npx nextblogkit init
```

This creates:
- `app/blogs/` — Blog pages (list, post, category)
- `app/admin/blogs/` — Admin panel pages (dashboard, posts, media, categories, settings)
- `app/api/blogs/` — API routes (posts, media, categories, settings, sitemap, RSS)
- `nextblogkit.config.ts` — Configuration file
- `.env.local.example` — Environment variable template

### 3. Configure environment variables

Copy the generated `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your values:

```env
# ── REQUIRED ─────────────────────────────────────────────
# MongoDB Connection
NEXTBLOGKIT_MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mydb

# Authentication (must be at least 32 characters)
NEXTBLOGKIT_API_KEY=your-secure-api-key-must-be-at-least-32-characters-long

# ── OPTIONAL ─────────────────────────────────────────────
# Database name (optional — defaults to the database in your connection URI)
# NEXTBLOGKIT_MONGODB_DB=nextblogkit

# Cloudflare R2 Storage (needed for image uploads; without it, images use temporary blob URLs)
# NEXTBLOGKIT_R2_ACCOUNT_ID=your-account-id
# NEXTBLOGKIT_R2_ACCESS_KEY=your-access-key
# NEXTBLOGKIT_R2_SECRET_KEY=your-secret-key
# NEXTBLOGKIT_R2_BUCKET=blog-media
# NEXTBLOGKIT_R2_PUBLIC_URL=https://media.yourdomain.com

# Site Info (used in SEO meta tags, RSS, sitemap)
# NEXTBLOGKIT_SITE_URL=https://yourdomain.com
# NEXTBLOGKIT_SITE_NAME="Your Site Name"
```

> **Only `NEXTBLOGKIT_MONGODB_URI` and `NEXTBLOGKIT_API_KEY` are required to start.** `NEXTBLOGKIT_MONGODB_DB` overrides the database name from the URI. R2 variables are needed for persistent image uploads. Site URL/name are used for SEO — defaults are empty/`"Blog"` if omitted.

### 4. Run database migrations

```bash
npx nextblogkit migrate
```

This creates the required MongoDB indexes for posts, categories, and media.

### 5. Start your app

```bash
pnpm dev
```

- Blog: [http://localhost:3000/blogs](http://localhost:3000/blogs)
- Admin: [http://localhost:3000/admin/blogs](http://localhost:3000/admin/blogs)

The admin panel will prompt you for the API key on first visit (the value of `NEXTBLOGKIT_API_KEY`).

---

## Configuration

The `nextblogkit.config.ts` file controls all behavior:

```typescript
import { defineConfig } from 'nextblogkit';

export default defineConfig({
  // URL paths — customize to match your site structure
  basePath: '/blogs',        // Public blog URL prefix
  adminPath: '/admin/blogs', // Admin panel URL prefix
  apiPath: '/api/blogs',     // API routes URL prefix

  // Pagination
  postsPerPage: 10,
  excerptLength: 160,

  // Editor settings
  editor: {
    blocks: ['paragraph', 'heading', 'image', 'codeBlock', 'blockquote',
             'bulletList', 'orderedList', 'taskList', 'table', 'callout',
             'tableOfContents', 'faq', 'horizontalRule'],
    maxImageSize: 10 * 1024 * 1024, // 10MB
    autosaveInterval: 30000, // 30s
  },

  // SEO
  seo: {
    titleTemplate: '%s | %siteName%',
    generateRSS: true,
    generateSitemap: true,
    structuredData: true,
  },

  // Feature toggles
  features: {
    search: true,
    relatedPosts: true,
    readingProgress: true,
    tableOfContents: true,
    shareButtons: true,
    darkMode: true,
    scheduling: true,
    revisionHistory: true,
    imageOptimization: true,
  },

  // Authentication
  auth: {
    strategy: 'api-key',
  },
});
```

### Custom URL Paths

You can change the blog URL from `/blogs` to anything — `/articles`, `/posts`, `/blog`, etc. Make sure the folder structure in your `app/` directory matches and pass the paths through to components:

```typescript
export default defineConfig({
  basePath: '/articles',
  adminPath: '/admin/articles',
  apiPath: '/api/articles',
});
```

Then in your admin layout, pass the paths:

```tsx
// app/admin/articles/layout.tsx
import { AdminLayout } from 'nextblogkit/admin';
import 'nextblogkit/styles/admin.css';

export default function AdminBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayout apiPath="/api/articles" adminPath="/admin/articles" basePath="/articles">
      {children}
    </AdminLayout>
  );
}
```

---

## Theming

NextBlogKit uses CSS variables for theming. Every color, font, radius, and shadow is a `--nbk-*` variable that you can override.

### All CSS Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--nbk-primary` | `#2563eb` | Primary brand color (links, buttons, active states) |
| `--nbk-primary-hover` | `#1d4ed8` | Primary hover state |
| `--nbk-primary-light` | `#dbeafe` | Light primary (tag backgrounds, highlights) |
| `--nbk-text` | `#1f2937` | Main text color |
| `--nbk-text-muted` | `#6b7280` | Secondary/muted text |
| `--nbk-bg` | `#ffffff` | Page background |
| `--nbk-bg-secondary` | `#f9fafb` | Secondary background (cards, sidebar) |
| `--nbk-card-bg` | `#ffffff` | Card background |
| `--nbk-border` | `#e5e7eb` | Border color |
| `--nbk-border-focus` | `#2563eb` | Input focus border |
| `--nbk-radius` | `0.5rem` | Border radius |
| `--nbk-shadow` | `0 1px 3px ...` | Default box shadow |
| `--nbk-shadow-sm` | `0 1px 2px ...` | Small shadow |
| `--nbk-shadow-lg` | `0 10px 15px ...` | Large shadow |
| `--nbk-shadow-xl` | `0 20px 25px ...` | Extra large shadow |
| `--nbk-font-heading` | `"Inter", system-ui, sans-serif` | Heading font family |
| `--nbk-font-body` | `"Inter", system-ui, sans-serif` | Body font family |
| `--nbk-font-code` | `"JetBrains Mono", monospace` | Code font family |
| `--nbk-success` | `#10b981` | Success color |
| `--nbk-warning` | `#f59e0b` | Warning color |
| `--nbk-danger` | `#ef4444` | Danger/error color |
| `--nbk-info` | `#3b82f6` | Info color |
| `--nbk-focus-ring` | `0 0 0 3px rgba(...)` | Focus ring box-shadow |

### Override via CSS

Add a `<style>` block in your blog layout or override in your global CSS:

```tsx
// app/blogs/layout.tsx
import 'nextblogkit/styles/blog.css';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --nbk-primary: #DC2626;
          --nbk-primary-hover: #B91C1C;
          --nbk-primary-light: #FEE2E2;
          --nbk-bg-secondary: #FEF2F2;
          --nbk-border-focus: #DC2626;
          --nbk-font-heading: "Poppins", system-ui, sans-serif;
          --nbk-font-body: "Inter", system-ui, sans-serif;
        }
      `}} />
      {children}
    </>
  );
}
```

### Color Presets

Here are some ready-to-use brand palettes:

**Red**
```css
--nbk-primary: #DC2626;
--nbk-primary-hover: #B91C1C;
--nbk-primary-light: #FEE2E2;
--nbk-bg-secondary: #FEF2F2;
```

**Teal**
```css
--nbk-primary: #0891B2;
--nbk-primary-hover: #0E7490;
--nbk-primary-light: #CCFBF1;
--nbk-bg-secondary: #F0FDFA;
```

**Purple**
```css
--nbk-primary: #7C3AED;
--nbk-primary-hover: #6D28D9;
--nbk-primary-light: #EDE9FE;
--nbk-bg-secondary: #F5F3FF;
```

**Green**
```css
--nbk-primary: #059669;
--nbk-primary-hover: #047857;
--nbk-primary-light: #D1FAE5;
--nbk-bg-secondary: #ECFDF5;
```

**Orange**
```css
--nbk-primary: #EA580C;
--nbk-primary-hover: #C2410C;
--nbk-primary-light: #FFEDD5;
--nbk-bg-secondary: #FFF7ED;
```

### Dark Mode

Dark mode variables are automatically applied via `prefers-color-scheme: dark`. Override them in a media query:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --nbk-bg: #0f172a;
    --nbk-bg-secondary: #1e293b;
    --nbk-text: #f1f5f9;
    --nbk-text-muted: #94a3b8;
    --nbk-border: #334155;
    --nbk-card-bg: #1e293b;
  }
}
```

---

## Components

### Page-Level Components

These are full-page components with built-in layouts, designed to be used directly in your route files. They accept `slots` for injecting custom content without rebuilding the entire page.

#### `BlogPostPage`

Renders a complete blog post with header, content, TOC, author card, related posts, and share buttons.

```tsx
import { BlogPostPage } from 'nextblogkit/components';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `post` | `object` | *required* | The blog post object (from `getPostBySlug`) |
| `relatedPosts` | `object[]` | `[]` | Related posts to show at the bottom |
| `showTOC` | `boolean` | `true` | Show table of contents |
| `tocPosition` | `'sidebar' \| 'top' \| 'none'` | `'sidebar'` | Where to render the TOC |
| `showAuthor` | `boolean` | `true` | Show author card |
| `showRelatedPosts` | `boolean` | `true` | Show related posts section |
| `showShareButtons` | `boolean` | `true` | Show share buttons |
| `showReadingProgress` | `boolean` | `true` | Show reading progress bar at top |
| `basePath` | `string` | `'/blogs'` | Blog URL prefix (for links) |
| `className` | `string` | `''` | Additional CSS class |
| `slots` | `BlogPostSlots` | — | Custom content injection (see below) |

**TOC Positions:**

- `'sidebar'` — Sticky sidebar on the left, visible on screens >= 1024px. Best for long-form content.
- `'top'` — Inline TOC above the post content. Good for simpler layouts.
- `'none'` — No TOC rendered at all.

The TOC only renders if the post has more than 2 headings (H2/H3/H4).

**Slots:**

```typescript
interface BlogPostSlots {
  header?: React.ReactNode;       // Above the article
  footer?: React.ReactNode;       // Below the article
  beforeContent?: React.ReactNode; // Between cover image and post body
  afterContent?: React.ReactNode;  // After post body, before tags
}
```

**Example with slots:**

```tsx
<BlogPostPage
  post={post}
  relatedPosts={relatedPosts}
  showTOC
  tocPosition="sidebar"
  basePath="/blogs"
  slots={{
    header: <SiteHeader />,
    footer: <SiteFooter />,
    beforeContent: <div className="ad-banner">Sponsored</div>,
    afterContent: <NewsletterSignup />,
  }}
/>
```

**Full page example:**

```tsx
// app/blogs/[slug]/page.tsx
import { BlogPostPage } from 'nextblogkit/components';
import { getPostBySlug, listPosts, generateMetaTags } from 'nextblogkit/lib';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };
  const meta = generateMetaTags(post);
  return {
    title: meta.title,
    description: meta.description,
    openGraph: meta.openGraph,
    twitter: meta.twitter,
    alternates: { canonical: meta.canonical },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return <div className="nbk-not-found">Post not found</div>;
  }

  let relatedPosts: any[] = [];
  if (post.categories?.length) {
    const { posts } = await listPosts({
      status: 'published',
      category: post.categories[0],
      limit: 4,
    });
    relatedPosts = posts
      .filter((p) => String(p._id) !== String(post._id))
      .slice(0, 3);
  }

  return (
    <BlogPostPage
      post={JSON.parse(JSON.stringify(post))}
      relatedPosts={JSON.parse(JSON.stringify(relatedPosts))}
      showTOC
      tocPosition="sidebar"
      basePath="/blogs"
    />
  );
}
```

---

#### `BlogListPage`

Renders a blog listing with search, categories, pagination, and grid/list/magazine layouts.

```tsx
import { BlogListPage } from 'nextblogkit/components';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `posts` | `object[]` | *required* | Array of post objects |
| `total` | `number` | *required* | Total number of posts (for pagination) |
| `page` | `number` | `1` | Current page number |
| `postsPerPage` | `number` | `10` | Posts per page |
| `categories` | `object[]` | `[]` | List of categories |
| `activeCategory` | `string` | — | Currently filtered category slug |
| `showCategories` | `boolean` | `true` | Show category sidebar |
| `showSearch` | `boolean` | `true` | Show search bar |
| `layout` | `'grid' \| 'list' \| 'magazine'` | `'grid'` | Post card layout style |
| `basePath` | `string` | `'/blogs'` | Blog URL prefix |
| `apiPath` | `string` | `'/api/blogs'` | API URL prefix (for search) |
| `className` | `string` | `''` | Additional CSS class |
| `slots` | `BlogListSlots` | — | Custom content injection (see below) |

**Slots:**

```typescript
interface BlogListSlots {
  header?: React.ReactNode;       // Above the blog list
  footer?: React.ReactNode;       // Below the blog list
  beforePosts?: React.ReactNode;  // Between search bar and posts grid
  afterPosts?: React.ReactNode;   // After posts grid, before footer
  sidebar?: React.ReactNode;      // Replaces the default category sidebar
  renderCard?: (post: any) => React.ReactNode; // Custom card renderer
}
```

**Example with custom card:**

```tsx
<BlogListPage
  posts={posts}
  total={total}
  basePath="/blogs"
  apiPath="/api/blogs"
  layout="grid"
  slots={{
    header: <h1 className="text-3xl font-bold">Our Blog</h1>,
    renderCard: (post) => (
      <div key={post.slug} className="my-custom-card">
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
      </div>
    ),
    sidebar: (
      <div>
        <h3>Newsletter</h3>
        <NewsletterSignup />
      </div>
    ),
  }}
/>
```

---

### Atomic Components

All individual components are exported from `nextblogkit/components` and can be used to build custom layouts:

```tsx
import {
  BlogCard,
  BlogSearch,
  TableOfContents,
  ShareButtons,
  ReadingProgressBar,
  Pagination,
  AuthorCard,
  BreadcrumbNav,
  CategoryList,
  TagCloud,
  CodeBlock,
} from 'nextblogkit/components';
```

| Component | Description |
|-----------|-------------|
| `BlogCard` | Post preview card (vertical or horizontal layout) |
| `BlogSearch` | Search input with instant results dropdown (accepts `basePath` prop) |
| `TableOfContents` | Heading list with scroll-to and active heading tracking |
| `ShareButtons` | Social share buttons (Twitter, Facebook, LinkedIn, copy link) |
| `ReadingProgressBar` | Top-of-page progress bar tied to scroll position |
| `Pagination` | Page navigation with prev/next and page numbers |
| `AuthorCard` | Author info card with avatar and bio |
| `BreadcrumbNav` | Breadcrumb trail navigation |
| `CategoryList` | Category list with post counts |
| `TagCloud` | Tag cloud with weighted sizes |
| `CodeBlock` | Syntax-highlighted code with Shiki |

---

### Admin Components

```tsx
import {
  AdminLayout,
  Dashboard,
  PostList,
  PostEditor,
  MediaLibrary,
  CategoryManager,
  SettingsPage,
  SEOPanel,
  useAdminApi,
  setApiBase,
  setBasePath,
  getBasePath,
} from 'nextblogkit/admin';
```

#### `AdminLayout`

Wraps all admin pages with sidebar navigation and authentication.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | *required* | Page content |
| `apiKey` | `string` | — | Pre-set API key (bypasses login prompt) |
| `apiPath` | `string` | `'/api/blogs'` | API route prefix for all admin API calls |
| `adminPath` | `string` | `'/admin/blogs'` | Admin route prefix for sidebar nav links |
| `basePath` | `string` | `'/blogs'` | Public blog URL prefix (used for "View" links in post list and SEO preview) |

**Important:** If you change `apiPath` or `basePath` in your config, you **must** pass them to `AdminLayout`:

```tsx
// app/admin/blogs/layout.tsx
import { AdminLayout } from 'nextblogkit/admin';
import 'nextblogkit/styles/admin.css';

export default function AdminBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayout apiPath="/api/blogs" adminPath="/admin/blogs" basePath="/blogs">
      {children}
    </AdminLayout>
  );
}
```

---

## Styles

Import the CSS files you need in your layout files:

```tsx
// Blog pages — import in app/blogs/layout.tsx
import 'nextblogkit/styles/blog.css';

// Admin pages — import in app/admin/blogs/layout.tsx
import 'nextblogkit/styles/admin.css';
```

| Stylesheet | When to import | Description |
|-----------|----------------|-------------|
| `nextblogkit/styles/blog.css` | Blog layout | Blog list, post page, TOC, cards, pagination |
| `nextblogkit/styles/admin.css` | Admin layout | Admin panel, dashboard, forms, tables |
| `nextblogkit/styles/editor.css` | Admin layout (auto) | TipTap editor styles |
| `nextblogkit/styles/globals.css` | Root layout (optional) | CSS variables, utility classes, buttons, forms |
| `nextblogkit/styles/prose.css` | Blog layout (optional) | Post body typography |

The `blog.css` and `admin.css` files already include the global variables. You only need `globals.css` if using atomic components outside of the page-level components.

---

## Package Exports

```typescript
// Main exports — config, types, defineConfig
import { defineConfig } from 'nextblogkit';
import type { BlogPost, Category, NextBlogKitConfig } from 'nextblogkit';

// Library — server-side utilities
import { getDb, generateMetaTags, searchPosts, calculateSEOScore } from 'nextblogkit/lib';

// Blog components — client-side React components
import { BlogListPage, BlogPostPage, BlogCard, BlogSearch } from 'nextblogkit/components';
import { TableOfContents, ShareButtons, ReadingProgressBar } from 'nextblogkit/components';
import { Pagination, AuthorCard, BreadcrumbNav, CategoryList } from 'nextblogkit/components';
import type { BlogListSlots, BlogPostSlots } from 'nextblogkit/components';

// Admin panel — client-side React components
import { AdminLayout, Dashboard, PostList, PostEditor } from 'nextblogkit/admin';
import { MediaLibrary, CategoryManager, SettingsPage, SEOPanel } from 'nextblogkit/admin';

// Editor — TipTap block editor
import { BlogEditor } from 'nextblogkit/editor';

// API route handlers — re-export in your route.ts files
export { GET, POST, PUT, DELETE } from 'nextblogkit/api/posts';
export { GET, POST, DELETE } from 'nextblogkit/api/media';
export { GET, POST, PUT, DELETE } from 'nextblogkit/api/categories';
export { GET, PUT } from 'nextblogkit/api/settings';
export { GET, POST, DELETE } from 'nextblogkit/api/tokens';
export { GET } from 'nextblogkit/api/sitemap';
export { GET } from 'nextblogkit/api/rss';

// Styles
import 'nextblogkit/styles/blog.css';
import 'nextblogkit/styles/admin.css';
import 'nextblogkit/styles/editor.css';
import 'nextblogkit/styles/prose.css';
import 'nextblogkit/styles/globals.css';
```

---

## Integrating with Your Site

A common pattern is wrapping the blog in your site's header, footer, and theme. Here's a full example:

```tsx
// app/blogs/layout.tsx
import 'nextblogkit/styles/blog.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Override nextblogkit colors to match your brand */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --nbk-primary: #DC2626;
          --nbk-primary-hover: #B91C1C;
          --nbk-primary-light: #FEE2E2;
          --nbk-bg-secondary: #FEF2F2;
          --nbk-border-focus: #DC2626;
          --nbk-font-heading: var(--font-geist-sans), system-ui, sans-serif;
          --nbk-font-body: var(--font-geist-sans), system-ui, sans-serif;
        }
      `}} />
      <SiteHeader />
      <div style={{ paddingTop: '4rem' }}>
        {children}
      </div>
      <SiteFooter />
    </>
  );
}
```

---

## API Routes

All API routes require a Bearer token (`NEXTBLOGKIT_API_KEY`) for write operations. GET requests for public data (published posts, categories) are unauthenticated.

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blogs/posts` | List posts (supports `?status=`, `?category=`, `?search=`, `?page=`, `?limit=`) |
| GET | `/api/blogs/posts?slug=my-post` | Get single post by slug |
| GET | `/api/blogs/posts?id=abc123` | Get single post by ID |
| POST | `/api/blogs/posts` | Create post |
| PUT | `/api/blogs/posts` | Update post (requires `?id=`) |
| DELETE | `/api/blogs/posts` | Delete/archive post (requires `?id=`) |

### Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blogs/media` | List media files |
| POST | `/api/blogs/media` | Upload file (multipart/form-data) |
| DELETE | `/api/blogs/media?id=abc123` | Delete media file |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blogs/categories` | List categories |
| POST | `/api/blogs/categories` | Create category |
| PUT | `/api/blogs/categories?id=abc123` | Update category |
| DELETE | `/api/blogs/categories?id=abc123` | Delete category |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blogs/settings` | Get settings |
| PUT | `/api/blogs/settings` | Update settings |

> **Note:** These endpoints use the default `/api/blogs` prefix. If you changed `apiPath` in your config, replace `/api/blogs` with your custom path.

### Tokens

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blogs/tokens` | List API tokens (master key only) |
| POST | `/api/blogs/tokens` | Generate new token (master key only) |
| DELETE | `/api/blogs/tokens?id=abc123` | Revoke token (master key only) |

### Authentication

Include the API key or a generated token as a Bearer token:

```bash
curl -X POST http://localhost:3000/api/blogs/posts \
  -H "Authorization: Bearer your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Post", "content": [...], "status": "published"}'
```

**API Tokens** — You can generate scoped API tokens from the admin Settings page (API Access section). Generated tokens work the same as the master key for read/write operations, but cannot manage other tokens. This is useful for CI pipelines, n8n workflows, and other external integrations.

### Create Post — Sample JSON

```json
{
  "title": "My Blog Post",
  "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Hello world!" }] }],
  "contentHTML": "<p>Hello world!</p>",
  "excerpt": "A short summary of the post",
  "status": "published",
  "categories": ["tech"],
  "tags": ["nextjs", "blog"],
  "author": {
    "name": "John Doe",
    "bio": "Software engineer",
    "avatar": "https://example.com/avatar.jpg"
  },
  "seo": {
    "metaTitle": "My Blog Post | MySite",
    "metaDescription": "A short summary for search engines",
    "focusKeyword": "blog post"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Post title |
| `content` | BlockContent[] | No | TipTap JSON content blocks |
| `contentHTML` | string | No | HTML version of the content |
| `excerpt` | string | No | Short summary (auto-generated if omitted) |
| `slug` | string | No | URL slug (auto-generated from title if omitted) |
| `status` | `"draft"` \| `"published"` \| `"scheduled"` | No | Defaults to `"draft"` |
| `categories` | string[] | No | Category slugs |
| `tags` | string[] | No | Tag strings |
| `author` | `{ name, bio?, avatar?, url? }` | No | Post author info |
| `seo` | `{ metaTitle?, metaDescription?, focusKeyword?, ... }` | No | SEO metadata |
| `coverImage` | `{ _id, url, alt?, caption? }` | No | Cover image reference |
| `publishedAt` | ISO date string | No | Publish date (auto-set when status is `"published"`) |
| `scheduledAt` | ISO date string | No | Schedule date for future publishing |

---

## Editor Slash Commands

Type `/` in the editor to open the command menu:

| Command | Description |
|---------|-------------|
| Heading 2 | Section heading |
| Heading 3 | Subsection heading |
| Bullet List | Unordered list |
| Numbered List | Ordered list |
| Task List | Checklist with checkboxes |
| Blockquote | Quote block |
| Code Block | Syntax-highlighted code |
| Image | Upload an image |
| Media Library | Choose from uploaded images (when `onBrowseMedia` is provided) |
| Table | Insert a 3x3 table |
| Divider | Horizontal rule |
| Callout | Info/warning/tip/danger box |
| FAQ | FAQ section with schema markup |
| Table of Contents | Auto-generated TOC |

---

## Custom Image Upload

Pass a custom upload handler to the editor:

```tsx
import { BlogEditor } from 'nextblogkit/editor';

function MyEditor() {
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/blogs/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    return { url: data.url, alt: file.name };
  };

  return (
    <BlogEditor
      uploadImage={handleUpload}
      onChange={(content) => console.log(content)}
      placeholder="Start writing..."
    />
  );
}
```

---

## SEO

NextBlogKit automatically generates:

- **Meta tags** — Title, description, canonical URL
- **Open Graph** — og:title, og:description, og:image, og:type
- **Twitter Cards** — twitter:card, twitter:title, twitter:description
- **JSON-LD** — BlogPosting and FAQPage structured data
- **Sitemap** — Dynamic XML sitemap at `/api/blogs/sitemap.xml`
- **RSS** — RSS 2.0 feed at `/api/blogs/rss.xml`

The built-in SEO scorer checks 17 factors including keyword density, title length, heading hierarchy, image alt text, and readability.

---

## CLI Commands

```bash
npx nextblogkit init            # Scaffold blog into your Next.js project
npx nextblogkit seed            # Insert example blog content
npx nextblogkit health          # Check MongoDB and R2 connectivity
npx nextblogkit migrate         # Create database indexes
```

### Init options

```bash
npx nextblogkit init --blog-path /articles --admin-path /admin/articles --api-path /api/articles
```

---

## What Gets Scaffolded

Running `npx nextblogkit init` creates thin wrapper files inside your `app/` directory. Each file is a one-liner that re-exports from the package:

```
app/
├── blogs/
│   ├── page.tsx                    # Blog list page
│   ├── [slug]/page.tsx             # Individual post page (with SEO metadata)
│   └── category/[slug]/page.tsx    # Category filter page
├── admin/blogs/
│   ├── layout.tsx                  # Admin layout with sidebar
│   ├── page.tsx                    # Dashboard
│   ├── posts/page.tsx              # Post list
│   ├── new/page.tsx                # New post editor
│   ├── [id]/edit/page.tsx          # Edit post
│   ├── media/page.tsx              # Media library
│   ├── categories/page.tsx         # Category manager
│   └── settings/page.tsx           # Settings
└── api/blogs/
    ├── posts/route.ts              # Posts CRUD
    ├── media/route.ts              # Media upload/list/delete
    ├── categories/route.ts         # Categories CRUD
    ├── settings/route.ts           # Settings read/update
    ├── tokens/route.ts             # API token management
    ├── sitemap.xml/route.ts        # Dynamic sitemap
    └── rss.xml/route.ts            # RSS feed
```

Because these are thin wrappers, you can customize any page by editing the generated file directly.

---

## Local Development (without R2)

NextBlogKit works with just **MongoDB + API key**. Cloudflare R2 is optional — without it, the editor uses temporary blob URLs for images (they won't persist across reloads), and the upload API returns a clear 503 error. This lets you develop locally and add R2 when you're ready.

1. **MongoDB** — Use a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, or run locally:
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongo mongo:7
   # Then use: NEXTBLOGKIT_MONGODB_URI=mongodb://localhost:27017/nextblogkit
   ```

2. **API Key** — Generate a secure key:
   ```bash
   openssl rand -hex 32
   ```

3. **R2 (optional)** — Create a free Cloudflare R2 bucket at [dash.cloudflare.com](https://dash.cloudflare.com) for persistent image storage. The free tier includes 10 GB storage and 10 million reads/month.

---

## Project Structure (package internals)

```
src/
├── lib/            # Server-side: DB, storage, config, SEO, search, utils
├── api/            # Next.js API route handlers
├── editor/         # TipTap editor + extensions (client-side)
├── admin/          # Admin panel components (client-side)
├── components/     # Public blog components (client-side)
├── styles/         # CSS files
├── cli/            # CLI tool (init, seed, health, migrate)
└── index.ts        # Main entry point
```

---

## Developing NextBlogKit Itself

If you want to contribute or develop locally:

```bash
git clone https://github.com/patidar-santosh/nextblogkit.git
cd nextblogkit
pnpm install
pnpm run build       # Build the package
pnpm run dev         # Watch mode for development
```

### Using a local build in a Next.js project

```bash
# Build, pack, and install
cd /path/to/nextblogkit
npm run build
cp -r src/styles dist/styles
npm pack

# In your Next.js project
cd /path/to/my-nextjs-app
pnpm install /path/to/nextblogkit/nextblogkit-0.6.0.tgz
```

After installing, clear the Next.js cache:

```bash
rm -rf .next
pnpm dev
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Editor | TipTap 2.x |
| Database | MongoDB (native driver) |
| Storage | Cloudflare R2 (S3-compatible) |
| Image Processing | Sharp |
| Syntax Highlighting | Shiki |
| Validation | Zod |
| CLI | Commander.js |
| Build | tsup (ESM + CJS) |
| Styling | CSS Variables + Tailwind-compatible |

## License

MIT
