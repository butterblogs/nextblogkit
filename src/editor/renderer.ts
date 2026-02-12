import type { BlockContent } from '../lib/types';

export function renderBlocksToHTML(doc: { type: string; content?: BlockContent[] }): string {
  if (!doc.content) return '';
  return doc.content.map(renderNode).join('');
}

function renderNode(node: BlockContent): string {
  switch (node.type) {
    case 'paragraph':
      return `<p>${renderInline(node)}</p>`;

    case 'heading': {
      const level = (node.attrs?.level as number) || 2;
      const text = renderInline(node);
      const id = slugify(stripTags(text));
      return `<h${level} id="${id}">${text}</h${level}>`;
    }

    case 'bulletList':
      return `<ul>${renderChildren(node)}</ul>`;

    case 'orderedList':
      return `<ol>${renderChildren(node)}</ol>`;

    case 'listItem':
      return `<li>${renderChildren(node)}</li>`;

    case 'taskList':
      return `<ul class="nbk-task-list">${renderChildren(node)}</ul>`;

    case 'taskItem': {
      const checked = node.attrs?.checked ? 'checked' : '';
      return `<li class="nbk-task-item" data-checked="${checked}"><input type="checkbox" ${checked} disabled />${renderChildren(node)}</li>`;
    }

    case 'blockquote':
      return `<blockquote>${renderChildren(node)}</blockquote>`;

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) || 'plaintext';
      const filename = node.attrs?.filename as string;
      const code = escapeHtml(getTextContent(node));
      const header = filename ? `<div class="nbk-code-header">${escapeHtml(filename)}</div>` : '';
      return `${header}<pre><code class="language-${lang}">${code}</code></pre>`;
    }

    case 'image': {
      const src = node.attrs?.src as string || '';
      const alt = node.attrs?.alt as string || '';
      const caption = node.attrs?.caption as string;
      const width = node.attrs?.width;
      const height = node.attrs?.height;
      let img = `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"`;
      if (width) img += ` width="${width}"`;
      if (height) img += ` height="${height}"`;
      img += ' loading="lazy" />';
      if (caption) {
        return `<figure>${img}<figcaption>${escapeHtml(caption)}</figcaption></figure>`;
      }
      return img;
    }

    case 'horizontalRule':
      return '<hr />';

    case 'table':
      return `<table>${renderChildren(node)}</table>`;

    case 'tableRow':
      return `<tr>${renderChildren(node)}</tr>`;

    case 'tableHeader':
      return `<th>${renderInline(node)}</th>`;

    case 'tableCell':
      return `<td>${renderInline(node)}</td>`;

    case 'callout': {
      const calloutType = (node.attrs?.type as string) || 'info';
      const icons: Record<string, string> = {
        info: 'ℹ️',
        warning: '⚠️',
        tip: '💡',
        danger: '🚨',
      };
      return `<div class="nbk-callout nbk-callout-${calloutType}"><span class="nbk-callout-icon">${icons[calloutType] || ''}</span><div class="nbk-callout-content">${renderChildren(node)}</div></div>`;
    }

    case 'faq':
      return `<div class="nbk-faq" itemscope itemtype="https://schema.org/FAQPage">${renderChildren(node)}</div>`;

    case 'faqItem':
      return `<div class="nbk-faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">${renderChildren(node)}</div>`;

    case 'faqQuestion':
      return `<h3 itemprop="name">${renderInline(node)}</h3>`;

    case 'faqAnswer':
      return `<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><div itemprop="text">${renderChildren(node)}</div></div>`;

    case 'tableOfContents':
      return '<div data-toc="true" class="nbk-toc"></div>';

    case 'html':
      return getTextContent(node);

    case 'embed': {
      const embedUrl = node.attrs?.src as string || '';
      return `<div class="nbk-embed"><iframe src="${escapeAttr(embedUrl)}" frameborder="0" allowfullscreen loading="lazy"></iframe></div>`;
    }

    case 'text':
      return renderTextNode(node);

    case 'hardBreak':
      return '<br />';

    default:
      if (node.content) return renderChildren(node);
      if (node.text) return escapeHtml(node.text);
      return '';
  }
}

function renderChildren(node: BlockContent): string {
  if (!node.content) return '';
  return node.content.map(renderNode).join('');
}

function renderInline(node: BlockContent): string {
  if (!node.content) return '';
  return node.content.map(renderNode).join('');
}

function renderTextNode(node: BlockContent): string {
  let text = escapeHtml(node.text || '');

  if (node.marks) {
    for (const mark of node.marks) {
      switch (mark.type) {
        case 'bold':
          text = `<strong>${text}</strong>`;
          break;
        case 'italic':
          text = `<em>${text}</em>`;
          break;
        case 'strike':
          text = `<s>${text}</s>`;
          break;
        case 'code':
          text = `<code>${text}</code>`;
          break;
        case 'underline':
          text = `<u>${text}</u>`;
          break;
        case 'highlight':
          text = `<mark>${text}</mark>`;
          break;
        case 'link': {
          const href = mark.attrs?.href as string || '';
          const target = href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
          text = `<a href="${escapeAttr(href)}"${target}>${text}</a>`;
          break;
        }
      }
    }
  }

  return text;
}

function getTextContent(node: BlockContent): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(getTextContent).join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/&/g, '&amp;');
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function extractHeadings(
  doc: { type: string; content?: BlockContent[] }
): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];

  function walk(node: BlockContent) {
    if (node.type === 'heading') {
      const text = getTextContent(node);
      headings.push({
        id: slugify(text),
        text,
        level: (node.attrs?.level as number) || 2,
      });
    }
    if (node.content) {
      node.content.forEach(walk);
    }
  }

  if (doc.content) {
    doc.content.forEach(walk);
  }

  return headings;
}

export function extractFAQItems(
  doc: { type: string; content?: BlockContent[] }
): { question: string; answer: string }[] {
  const items: { question: string; answer: string }[] = [];

  function walk(node: BlockContent) {
    if (node.type === 'faqItem' && node.content) {
      const question = node.content.find((c) => c.type === 'faqQuestion');
      const answer = node.content.find((c) => c.type === 'faqAnswer');
      if (question && answer) {
        items.push({
          question: getTextContent(question),
          answer: renderChildren(answer),
        });
      }
    }
    if (node.content) {
      node.content.forEach(walk);
    }
  }

  if (doc.content) {
    doc.content.forEach(walk);
  }

  return items;
}
