import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SCRIPT = '<script src="/external-links.js" defer></script>';
const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'scripts', 'data', 'images']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) && path.dirname(rel) === '.') continue;
      files.push(...await walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

let changed = 0;
for (const file of await walk(ROOT)) {
  let html = await fs.readFile(file, 'utf8');
  if (html.includes('/external-links.js')) continue;
  if (html.includes('</head>')) {
    html = html.replace('</head>', `  ${SCRIPT}\n</head>`);
  } else if (html.includes('</body>')) {
    html = html.replace('</body>', `${SCRIPT}\n</body>`);
  } else {
    continue;
  }
  await fs.writeFile(file, html, 'utf8');
  changed += 1;
}

console.log(`La til ekstern-lenke-regel på ${changed} HTML-sider.`);
