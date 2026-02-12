import type { BlogPost, SEOScore, SEOCheck, SEOCheckStatus } from './types';

function check(id: string, status: SEOCheckStatus, message: string): SEOCheck {
  return { id, status, message };
}

export function calculateSEOScore(post: BlogPost): SEOScore {
  const checks: SEOCheck[] = [];
  const keyword = post.seo?.focusKeyword?.toLowerCase() || '';
  const title = post.title.toLowerCase();
  const slug = post.slug.toLowerCase();
  const excerpt = (post.seo?.metaDescription || post.excerpt || '').toLowerCase();
  const contentText = post.contentText?.toLowerCase() || '';
  const contentHTML = post.contentHTML || '';

  // 1. Focus keyword in title
  if (!keyword) {
    checks.push(check('focus-keyword-in-title', 'warn', 'No focus keyword set'));
  } else if (title.includes(keyword)) {
    checks.push(check('focus-keyword-in-title', 'pass', 'Focus keyword appears in title'));
  } else {
    checks.push(check('focus-keyword-in-title', 'fail', 'Focus keyword not found in title'));
  }

  // 2. Focus keyword in slug
  if (!keyword) {
    checks.push(check('focus-keyword-in-slug', 'warn', 'No focus keyword set'));
  } else if (slug.includes(keyword.replace(/\s+/g, '-'))) {
    checks.push(check('focus-keyword-in-slug', 'pass', 'Focus keyword appears in URL slug'));
  } else {
    checks.push(check('focus-keyword-in-slug', 'fail', 'Focus keyword not found in URL slug'));
  }

  // 3. Focus keyword in meta description
  if (!keyword) {
    checks.push(check('focus-keyword-in-excerpt', 'warn', 'No focus keyword set'));
  } else if (excerpt.includes(keyword)) {
    checks.push(check('focus-keyword-in-excerpt', 'pass', 'Focus keyword appears in meta description'));
  } else {
    checks.push(check('focus-keyword-in-excerpt', 'fail', 'Focus keyword not found in meta description'));
  }

  // 4. Focus keyword in H2
  if (keyword) {
    const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
    const h2s = contentHTML.match(h2Regex) || [];
    const keywordInH2 = h2s.some((h2) => h2.toLowerCase().includes(keyword));
    if (keywordInH2) {
      checks.push(check('focus-keyword-in-h2', 'pass', 'Focus keyword found in a subheading'));
    } else {
      checks.push(check('focus-keyword-in-h2', 'warn', 'Focus keyword not found in any H2 subheading'));
    }
  }

  // 5. Focus keyword in first paragraph
  if (keyword && contentText) {
    const first150Words = contentText.split(/\s+/).slice(0, 150).join(' ');
    if (first150Words.includes(keyword)) {
      checks.push(check('focus-keyword-in-first-paragraph', 'pass', 'Focus keyword appears early in content'));
    } else {
      checks.push(check('focus-keyword-in-first-paragraph', 'warn', 'Focus keyword not found in the first paragraph'));
    }
  }

  // 6. Keyword density
  if (keyword && contentText) {
    const words = contentText.split(/\s+/).length;
    const keywordCount = (contentText.match(new RegExp(keyword, 'g')) || []).length;
    const density = (keywordCount / words) * 100;
    if (density >= 0.5 && density <= 2.5) {
      checks.push(check('focus-keyword-density', 'pass', `Keyword density is ${density.toFixed(1)}% (ideal)`));
    } else if (density < 0.5) {
      checks.push(check('focus-keyword-density', 'warn', `Keyword density is ${density.toFixed(1)}% (too low, aim for 0.5-2.5%)`));
    } else {
      checks.push(check('focus-keyword-density', 'warn', `Keyword density is ${density.toFixed(1)}% (too high, aim for 0.5-2.5%)`));
    }
  }

  // 7. Title length
  const metaTitle = post.seo?.metaTitle || post.title;
  if (metaTitle.length >= 50 && metaTitle.length <= 60) {
    checks.push(check('title-length', 'pass', `Title is ${metaTitle.length} characters (ideal)`));
  } else if (metaTitle.length < 30) {
    checks.push(check('title-length', 'fail', `Title is ${metaTitle.length} characters (too short, aim for 50-60)`));
  } else if (metaTitle.length > 70) {
    checks.push(check('title-length', 'warn', `Title is ${metaTitle.length} characters (too long, aim for 50-60)`));
  } else {
    checks.push(check('title-length', 'warn', `Title is ${metaTitle.length} characters (aim for 50-60)`));
  }

  // 8. Meta description length
  const metaDesc = post.seo?.metaDescription || post.excerpt || '';
  if (metaDesc.length >= 150 && metaDesc.length <= 160) {
    checks.push(check('meta-description-length', 'pass', `Meta description is ${metaDesc.length} characters (ideal)`));
  } else if (metaDesc.length < 120) {
    checks.push(check('meta-description-length', 'warn', `Meta description is ${metaDesc.length} characters (too short, aim for 150-160)`));
  } else if (metaDesc.length > 170) {
    checks.push(check('meta-description-length', 'warn', `Meta description is ${metaDesc.length} characters (too long, may be truncated)`));
  } else {
    checks.push(check('meta-description-length', 'pass', `Meta description is ${metaDesc.length} characters`));
  }

  // 9. Slug length
  if (post.slug.length <= 75) {
    checks.push(check('slug-length', 'pass', `URL slug is ${post.slug.length} characters`));
  } else {
    checks.push(check('slug-length', 'warn', `URL slug is ${post.slug.length} characters (should be under 75)`));
  }

  // 10. Content length
  if (post.wordCount >= 300) {
    checks.push(check('content-length', 'pass', `Content is ${post.wordCount} words`));
  } else {
    checks.push(check('content-length', 'fail', `Content is only ${post.wordCount} words (aim for 300+)`));
  }

  // 11. Heading hierarchy
  const headingRegex = /<(h[2-6])[^>]*>/gi;
  const headings = [...contentHTML.matchAll(headingRegex)].map((m) => parseInt(m[1][1]));
  let hierarchyOk = true;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      hierarchyOk = false;
      break;
    }
  }
  if (headings.length === 0) {
    checks.push(check('heading-hierarchy', 'warn', 'No subheadings found — add H2s to structure content'));
  } else if (hierarchyOk) {
    checks.push(check('heading-hierarchy', 'pass', 'Heading hierarchy is correct'));
  } else {
    checks.push(check('heading-hierarchy', 'warn', 'Heading levels are skipped (e.g., H2 → H4)'));
  }

  // 12. Image alt text
  const imgRegex = /<img[^>]*>/gi;
  const images = contentHTML.match(imgRegex) || [];
  const missingAlt = images.filter((img) => !img.includes('alt=') || img.includes('alt=""'));
  if (images.length === 0) {
    checks.push(check('image-alt-text', 'warn', 'No images found in content'));
  } else if (missingAlt.length === 0) {
    checks.push(check('image-alt-text', 'pass', 'All images have alt text'));
  } else {
    checks.push(check('image-alt-text', 'fail', `${missingAlt.length} image(s) missing alt text`));
  }

  // 13. Internal links
  const internalLinkRegex = /href=["']\/[^"']*["']/gi;
  const internalLinks = contentHTML.match(internalLinkRegex) || [];
  if (internalLinks.length > 0) {
    checks.push(check('internal-links', 'pass', `${internalLinks.length} internal link(s) found`));
  } else {
    checks.push(check('internal-links', 'warn', 'No internal links found — add links to related content'));
  }

  // 14. External links
  const externalLinkRegex = /href=["']https?:\/\/[^"']*["']/gi;
  const externalLinks = contentHTML.match(externalLinkRegex) || [];
  if (externalLinks.length > 0) {
    checks.push(check('external-links', 'pass', `${externalLinks.length} external link(s) found`));
  } else {
    checks.push(check('external-links', 'warn', 'No external links found'));
  }

  // 15. Paragraph length
  const paragraphs = contentHTML.split(/<\/p>/i).filter((p) => p.trim());
  const longParagraphs = paragraphs.filter((p) => {
    const text = p.replace(/<[^>]+>/g, '');
    return text.split(/\s+/).length > 300;
  });
  if (longParagraphs.length === 0) {
    checks.push(check('paragraph-length', 'pass', 'All paragraphs are a reasonable length'));
  } else {
    checks.push(check('paragraph-length', 'warn', `${longParagraphs.length} paragraph(s) exceed 300 words`));
  }

  // 16. Cover image
  if (post.coverImage?.url) {
    checks.push(check('cover-image', 'pass', 'Post has a cover image'));
  } else {
    checks.push(check('cover-image', 'warn', 'No cover image set — social shares may look plain'));
  }

  // 17. Readability (simplified Flesch-like check)
  if (contentText) {
    const sentences = contentText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = contentText.split(/\s+/).length;
    const avgWordsPerSentence = sentences.length > 0 ? words / sentences.length : 0;
    if (avgWordsPerSentence <= 20) {
      checks.push(check('readability-score', 'pass', `Average sentence length: ${avgWordsPerSentence.toFixed(0)} words`));
    } else if (avgWordsPerSentence <= 25) {
      checks.push(check('readability-score', 'warn', `Average sentence length: ${avgWordsPerSentence.toFixed(0)} words (try to keep under 20)`));
    } else {
      checks.push(check('readability-score', 'fail', `Average sentence length: ${avgWordsPerSentence.toFixed(0)} words (too long, aim for under 20)`));
    }
  }

  // Calculate overall score
  const fails = checks.filter((c) => c.status === 'fail').length;
  const warns = checks.filter((c) => c.status === 'warn').length;

  let overall: SEOScore['overall'];
  if (fails >= 3) {
    overall = 'poor';
  } else if (fails >= 1 || warns >= 5) {
    overall = 'ok';
  } else {
    overall = 'good';
  }

  return { overall, checks };
}
