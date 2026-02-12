interface Template {
  path: string;
  content: string;
}

interface TemplateOptions {
  blogPath: string;
  adminPath: string;
  apiPath: string;
}

export function getTemplates(options: TemplateOptions): Template[] {
  return [
    // ---- Blog Pages ----
    {
      path: 'blog/layout.tsx',
      content: `import 'nextblogkit/styles/blog.css';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`,
    },
    {
      path: 'blog/page.tsx',
      content: `import { BlogCard, BlogSearch, Pagination, CategoryList } from 'nextblogkit/components';
import { listPosts, listCategories } from 'nextblogkit/lib';

interface Props {
  searchParams: Promise<{ page?: string; category?: string; q?: string }>;
}

export default async function Blog({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);

  const [{ posts, total }, categories] = await Promise.all([
    listPosts({
      page,
      limit: 10,
      status: 'published',
      category: params.category || undefined,
      search: params.q || undefined,
      sortBy: 'publishedAt',
      sortOrder: 'desc',
    }),
    listCategories(),
  ]);

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="nbk-blog-list">
      <div className="nbk-blog-header">
        <BlogSearch apiPath="/api/blog" />
      </div>

      <div className="nbk-blog-layout">
        <div className="nbk-blog-main">
          {posts.length === 0 ? (
            <div className="nbk-empty-state">
              <p>No posts found.</p>
            </div>
          ) : (
            <div className="nbk-posts-grid">
              {posts.map((post) => (
                <BlogCard
                  key={String(post._id || post.slug)}
                  post={JSON.parse(JSON.stringify(post))}
                  basePath="/blog"
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath="/blog"
              category={params.category}
            />
          )}
        </div>

        {categories.length > 0 && (
          <aside className="nbk-blog-sidebar">
            <CategoryList
              categories={JSON.parse(JSON.stringify(categories))}
              activeCategory={params.category}
              basePath="/blog"
            />
          </aside>
        )}
      </div>
    </div>
  );
}
`,
    },
    {
      path: 'blog/[slug]/page.tsx',
      content: `import { AuthorCard, BreadcrumbNav, ShareButtons, ReadingProgressBar, BlogCard } from 'nextblogkit/components';
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

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <article className="nbk-post">
      <ReadingProgressBar />

      <BreadcrumbNav
        items={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          ...(post.categories?.[0]
            ? [{ label: post.categories[0], href: \\\`/blog/category/\\\${post.categories[0]}\\\` }]
            : []),
          { label: post.title },
        ]}
      />

      <header className="nbk-post-header">
        {post.categories?.length > 0 && (
          <div className="nbk-post-categories">
            {post.categories.map((cat: string) => (
              <a key={cat} href={\\\`/blog/category/\\\${cat}\\\`} className="nbk-post-category">
                {cat}
              </a>
            ))}
          </div>
        )}
        <h1 className="nbk-post-title">{post.title}</h1>
        <div className="nbk-post-meta">
          <span className="nbk-post-author">{post.author?.name}</span>
          {date && (
            <>
              <span className="nbk-post-sep">&middot;</span>
              <time className="nbk-post-date">{date}</time>
            </>
          )}
          <span className="nbk-post-sep">&middot;</span>
          <span className="nbk-post-reading-time">{post.readingTime} min read</span>
        </div>
      </header>

      {post.coverImage?.url && (
        <div className="nbk-post-cover">
          <img src={post.coverImage.url} alt={post.coverImage.alt || post.title} />
        </div>
      )}

      <div
        className="nbk-post-content"
        dangerouslySetInnerHTML={{ __html: post.contentHTML || '' }}
      />

      <ShareButtons url={\\\`/blog/\\\${slug}\\\`} title={post.title} />

      {post.author && <AuthorCard author={post.author} />}

      {relatedPosts.length > 0 && (
        <section className="nbk-related">
          <h2 className="nbk-related-title">Related Posts</h2>
          <div className="nbk-related-grid">
            {relatedPosts.map((p) => (
              <BlogCard key={String(p._id)} post={JSON.parse(JSON.stringify(p))} basePath="/blog" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
`,
    },
    {
      path: 'blog/category/[slug]/page.tsx',
      content: `import { BlogCard, BlogSearch, Pagination, CategoryList } from 'nextblogkit/components';
import { listPosts, listCategories } from 'nextblogkit/lib';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parseInt(sp.page || '1', 10);

  const [{ posts, total }, categories] = await Promise.all([
    listPosts({
      page,
      limit: 10,
      status: 'published',
      category: slug,
      sortBy: 'publishedAt',
      sortOrder: 'desc',
    }),
    listCategories(),
  ]);

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="nbk-blog-list">
      <div className="nbk-blog-header">
        <BlogSearch apiPath="/api/blog" />
      </div>

      <div className="nbk-blog-layout">
        <div className="nbk-blog-main">
          {posts.length === 0 ? (
            <div className="nbk-empty-state">
              <p>No posts found in this category.</p>
            </div>
          ) : (
            <div className="nbk-posts-grid">
              {posts.map((post) => (
                <BlogCard
                  key={String(post._id || post.slug)}
                  post={JSON.parse(JSON.stringify(post))}
                  basePath="/blog"
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath="/blog"
              category={slug}
            />
          )}
        </div>

        {categories.length > 0 && (
          <aside className="nbk-blog-sidebar">
            <CategoryList
              categories={JSON.parse(JSON.stringify(categories))}
              activeCategory={slug}
              basePath="/blog"
            />
          </aside>
        )}
      </div>
    </div>
  );
}
`,
    },

    // ---- Admin Pages ----
    {
      path: 'admin/blog/layout.tsx',
      content: `import { AdminLayout } from 'nextblogkit/admin';
import 'nextblogkit/styles/admin.css';

export default function AdminBlogLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
`,
    },
    {
      path: 'admin/blog/page.tsx',
      content: `import { Dashboard } from 'nextblogkit/admin';

export default function AdminDashboard() {
  return <Dashboard />;
}
`,
    },
    {
      path: 'admin/blog/posts/page.tsx',
      content: `import { PostList } from 'nextblogkit/admin';

export default function AdminPosts() {
  return <PostList />;
}
`,
    },
    {
      path: 'admin/blog/new/page.tsx',
      content: `import { PostEditor } from 'nextblogkit/admin';

export default function NewPost() {
  return <PostEditor />;
}
`,
    },
    {
      path: 'admin/blog/[id]/edit/page.tsx',
      content: `import { PostEditor } from 'nextblogkit/admin';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPost({ params }: Props) {
  const { id } = await params;
  return <PostEditor postId={id} />;
}
`,
    },
    {
      path: 'admin/blog/media/page.tsx',
      content: `import { MediaLibrary } from 'nextblogkit/admin';

export default function AdminMedia() {
  return <MediaLibrary />;
}
`,
    },
    {
      path: 'admin/blog/categories/page.tsx',
      content: `import { CategoryManager } from 'nextblogkit/admin';

export default function AdminCategories() {
  return <CategoryManager />;
}
`,
    },
    {
      path: 'admin/blog/settings/page.tsx',
      content: `import { SettingsPage } from 'nextblogkit/admin';

export default function AdminSettings() {
  return <SettingsPage />;
}
`,
    },

    // ---- API Routes ----
    {
      path: 'api/blog/posts/route.ts',
      content: `export { GET, POST, PUT, DELETE } from 'nextblogkit/api/posts';
`,
    },
    {
      path: 'api/blog/media/route.ts',
      content: `export { GET, POST, DELETE } from 'nextblogkit/api/media';
`,
    },
    {
      path: 'api/blog/categories/route.ts',
      content: `export { GET, POST, PUT, DELETE } from 'nextblogkit/api/categories';
`,
    },
    {
      path: 'api/blog/settings/route.ts',
      content: `export { GET, PUT } from 'nextblogkit/api/settings';
`,
    },
    {
      path: 'api/blog/sitemap.xml/route.ts',
      content: `export { GET } from 'nextblogkit/api/sitemap';
`,
    },
    {
      path: 'api/blog/rss.xml/route.ts',
      content: `export { GET } from 'nextblogkit/api/rss';
`,
    },
  ];
}
