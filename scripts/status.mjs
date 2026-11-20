#!/usr/bin/env node
// print the next subject to cover and the videos already picked for it.
// usage: node status.mjs

import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadIdeas, day, strength, LADDER } from './ideas.mjs';

const DIR = path.resolve(fileURLToPath(import.meta.url), '../..');
const SUBJECTS = path.resolve(DIR, 'video-subjects.txt');
const HISTORY = path.join(DIR, 'history.json');

const subjects = (await fs.readFile(SUBJECTS, 'utf8'))
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

let history = [];
try {
  history = JSON.parse(await fs.readFile(HISTORY, 'utf8'));
} catch {}

// follow the list in order, then start again at the top
const index = history.length % subjects.length;
const next = subjects[index];
const round = Math.floor(history.length / subjects.length) + 1;
const past = history.filter((v) => v.subject === next);

console.log(`next subject (${index + 1}/${subjects.length}, round ${round}):`);
console.log(`  ${next}`);
console.log(`\nvideos already picked for this subject: ${past.length ? '' : 'none'}`);
for (const v of past) console.log(`  - ${v.title} (${v.channel}) — angle: ${v.angle} — ${v.url}`);
console.log(`\nall urls already used (never repeat): ${history.length ? '' : 'none'}`);
for (const v of history) console.log(`  ${v.url}`);

// spaced repetition: ideas due today (at most 3, most overdue first)
const ideas = await loadIdeas();
const today = day();
const due = ideas.filter((x) => x.due <= today).sort((a, b) => a.due.localeCompare(b.due));
console.log(`\nideas to review first (${Math.min(due.length, 3)} of ${due.length} due):${due.length ? '' : ' none'}`);
for (const x of due.slice(0, 3)) {
  console.log(`  [${x.id}] ${x.idea}`);
  console.log(`    transcript: transcripts/${x.source} — step ${x.step + 1}/${LADDER.length}, due ${x.due}`);
  for (const r of x.reviews) console.log(`    asked ${r.date} (${r.result}): ${r.question}`);
}

// how the reader does on this subject's ideas, to steer the video pick
const mine = ideas.filter((x) => x.subject === next);
console.log(`\nreview results for this subject:${mine.length ? '' : ' no ideas yet'}`);
for (const x of mine) console.log(`  ${strength(x).padEnd(8)} ${x.idea}`);
