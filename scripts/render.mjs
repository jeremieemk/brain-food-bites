#!/usr/bin/env node
// add one video to history.json, rebuild videos.html (newest at the top) and open it.
// usage: node render.mjs path/to/entry.json
// entry shape: see SKILL.md

import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(fileURLToPath(import.meta.url), '../..');
const HISTORY = path.join(DIR, 'history.json');
const PAGE = path.join(DIR, 'videos.html');

const entry = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
for (const key of ['date', 'subject', 'title', 'channel', 'length', 'url', 'why']) {
  if (!entry[key]) throw new Error(`missing field: ${key}`);
}

let history = [];
try {
  history = JSON.parse(await fs.readFile(HISTORY, 'utf8'));
} catch {}
if (history.some((v) => v.url === entry.url)) throw new Error(`video already recommended: ${entry.url}`);
history.push(entry);
await fs.writeFile(HISTORY, JSON.stringify(history, null, 2) + '\n');

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// youtube thumbnail from the video id, when we can find it
const thumb = (url) => {
  const id = url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1];
  return id ? `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">` : '';
};

const cards = [...history]
  .reverse()
  .map(
    (v) => `
  <article>
    <a class="thumb" href="${esc(v.url)}" target="_blank" rel="noopener">${thumb(v.url)}</a>
    <div>
      <p class="meta">${esc(v.date)} · ${esc(v.subject.split(' — ')[0])}</p>
      <h2><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.title)}</a></h2>
      <p class="meta">${esc(v.channel)} · ${esc(v.length)}${v.angle ? ` · ${esc(v.angle)}` : ''}</p>
      <p>${esc(v.why)}</p>
    </div>
  </article>`
  )
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Brain food bites</title>
<style>
  :root { --bg: #fafaf8; --fg: #1d1d1b; --muted: #6b6b66; --line: #e4e4df; --link: #1f5fbf; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #171716; --fg: #ececea; --muted: #9a9a94; --line: #2c2c2a; --link: #7fb0ff; }
  }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 18px/1.5 system-ui, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 32px 16px; }
  h1 { font-size: 1.6rem; margin: 0 0 24px; }
  article { display: grid; grid-template-columns: 220px 1fr; gap: 20px; padding: 20px 0; border-top: 1px solid var(--line); }
  .thumb img { width: 100%; border-radius: 8px; display: block; }
  h2 { font-size: 1.15rem; margin: 4px 0; }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .meta { color: var(--muted); font-size: 0.85rem; margin: 0; }
  p { margin: 8px 0 0; }
  @media (max-width: 600px) { article { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
  <h1>Brain food bites</h1>
${cards}
</main>
</body>
</html>
`;
await fs.writeFile(PAGE, html);
console.log(`added: ${entry.title}\npage: ${PAGE}`);

if (!process.env.FUNDAMENTALS_VIDEO_NO_OPEN) spawn('open', [PAGE], { detached: true, stdio: 'ignore' }).unref();
