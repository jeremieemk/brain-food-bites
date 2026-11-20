// Prints the real facts of one or more YouTube videos, from the official YouTube Data API.
// Usage: node scripts/check.mjs <id> [<id> ...]
// The API key sits in ../youtube-api-key (one line, never shared, never committed).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error('usage: node scripts/check.mjs <video id> [<video id> ...]');
  process.exit(1);
}

let key;
try {
  key = readFileSync(join(here, '..', 'youtube-api-key'), 'utf8').trim();
} catch {
  console.error('no API key: put a YouTube Data API v3 key in youtube-api-key, next to SKILL.md');
  process.exit(1);
}

const url =
  'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics' +
  `&id=${ids.join(',')}&key=${key}`;
const res = await fetch(url);
const data = await res.json();
if (!res.ok) {
  console.error(`YouTube API error ${res.status}: ${data.error?.message ?? 'unknown'}`);
  process.exit(1);
}

// "PT1H2M3S" -> "1:02:03", "PT8M12S" -> "8:12"
function length(iso) {
  const [, h = 0, m = 0, s = 0] = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/).map((x) => x ?? 0);
  const pad = (n) => String(n).padStart(2, '0');
  return Number(h) > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${Number(m)}:${pad(s)}`;
}

const found = new Set();
for (const v of data.items) {
  found.add(v.id);
  const sn = v.snippet;
  const st = v.statistics;
  console.log(`== ${v.id}`);
  console.log(`title:    ${sn.title}`);
  console.log(`channel:  ${sn.channelTitle}`);
  console.log(`length:   ${length(v.contentDetails.duration)}`);
  console.log(`views:    ${Number(st.viewCount ?? 0).toLocaleString('en-US')}`);
  console.log(`likes:    ${st.likeCount ? Number(st.likeCount).toLocaleString('en-US') : 'hidden'}`);
  console.log(`date:     ${sn.publishedAt.slice(0, 10)}`);
  console.log(`language: ${sn.defaultAudioLanguage ?? sn.defaultLanguage ?? 'not set'}`);
}
for (const id of ids) if (!found.has(id)) console.log(`== ${id}\nnot found (wrong id, private or deleted)`);
