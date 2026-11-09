/**
 * markdown.js — Minimal Markdown → HTML converter for blog post content.
 * Supports the editing subset used by the CMS: paragraphs, h2/h3 headings,
 * **bold**, *italic*, [links](url), and "- " / "1. " lists.
 * HTML is escaped before conversion, so CMS content can never inject markup.
 */

/**
 * Escape HTML special characters.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Apply inline Markdown (bold, italic, links) to a plain text fragment.
 * @param {string} text — already escaped text
 * @returns {string}
 */
function inline(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

/**
 * Convert one non-list block to HTML.
 * @param {string} md — already escaped block text
 * @returns {string}
 */
function renderBlock(md) {
  if (md.startsWith('### ')) return `<h3>${inline(md.slice(4))}</h3>`;
  if (md.startsWith('## ')) return `<h2>${inline(md.slice(3))}</h2>`;
  return `<p>${inline(md.replace(/\n/g, ' '))}</p>`;
}

/**
 * Convert a Markdown string to HTML.
 * @param {string} markdown
 * @returns {string}
 */
export function markdownToHTML(markdown) {
  if (!markdown || typeof markdown !== 'string') return '';

  const escaped = escapeHTML(markdown).trim();
  const blocks = escaped.split(/\n{2,}/);

  let html = '';
  let listTag = null; // 'ul' | 'ol' while a list block is open

  const closeList = () => {
    if (listTag) {
      html += `</${listTag}>`;
      listTag = null;
    }
  };

  for (const raw of blocks) {
    const lines = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) continue;

    const isList = lines.every((line) => line.startsWith('- '));
    const isOrdered = lines.every((line) => /^\d+\. /.test(line));

    if (isList || isOrdered) {
      const tag = isList ? 'ul' : 'ol';
      if (listTag !== tag) {
        closeList();
        html += `<${tag}>`;
        listTag = tag;
      }
      for (const line of lines) {
        const text = isList ? line.slice(2) : line.replace(/^\d+\. /, '');
        html += `<li>${inline(text)}</li>`;
      }
      continue;
    }

    closeList();
    html += renderBlock(raw);
  }

  closeList();
  return html;
}
