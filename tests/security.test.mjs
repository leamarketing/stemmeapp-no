import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { assertCaseSlug, safePublicUrl } from '../scripts/public-content.mjs';
import { pageHtml } from '../scripts/sync-cases.mjs';

test('case slugs cannot escape the generated directory', () => {
  assert.equal(assertCaseSlug('tannhelse-nat-2026-0018'), 'tannhelse-nat-2026-0018');
  for (const value of ['../index', '../../.github/workflows/sync', '/tmp/x', '..', '.', 'a/b', 'a\\b', '%2e%2e', 'a'.repeat(181), null]) {
    assert.throws(() => assertCaseSlug(value), /Ugyldig/);
  }
});

test('public links reject script schemes and embedded credentials', () => {
  assert.equal(safePublicUrl('https://regjeringen.no/hoering'), 'https://regjeringen.no/hoering');
  for (const value of ['javascript:alert(1)', 'data:text/html,<script>', '//evil.test', 'https://user:pass@evil.test']) {
    assert.equal(safePublicUrl(value), '');
  }
});

test('case text is escaped and unsafe image/source URLs are omitted', () => {
  const attack = '<img src=x onerror="alert(1)">';
  const html = pageHtml({ slug: 'test-sak', title: attack, question: attack, heroSrc: 'javascript:alert(1)',
    deepDive: { knowledgeCard: { what: attack, sources: [{ title: attack, url: 'javascript:alert(1)' }] } } });
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes(attack));
  assert.ok(!html.includes('javascript:'));
});

test('a malicious detail slug aborts the sync before deleting or writing any site files', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stemmeapp-sync-test-'));
  const originalCwd = process.cwd();
  const originalFetch = globalThis.fetch;
  try {
    await mkdir(path.join(root, 'saker', 'behold'), { recursive: true });
    await writeFile(path.join(root, 'saker', 'behold', 'index.html'), 'original');
    process.chdir(root);
    const { main } = await import('../scripts/sync-cases.mjs?isolated-test');
    let calls = 0;
    globalThis.fetch = async () => ({ ok: true, json: async () => ++calls === 1
      ? { issues: [{ slug: 'test-sak' }] }
      : { issue: { slug: '../../index' } } });
    await assert.rejects(main(), /Ugyldig/);
    assert.equal(await readFile(path.join(root, 'saker', 'behold', 'index.html'), 'utf8'), 'original');
  } finally {
    process.chdir(originalCwd);
    globalThis.fetch = originalFetch;
    await rm(root, { recursive: true, force: true });
  }
});
