#!/usr/bin/env node
// keep the list of key ideas to review (ideas.json), spaced repetition style.
//
// usage:
//   node ideas.mjs add <file.json> [--spread <days>]
//       add new ideas. file = [{ "subject", "idea", "source" }, ...]
//       first review is tomorrow, or spread over the next <days> days (for a backlog).
//   node ideas.mjs review <id> <got|hint|missed> "<question asked>"
//       record one review and set the next review date.
//
// gaps between reviews (the "ladder"): 1 day, 3 days, 1 week, 3 weeks, 2 months.
// got it -> one step up. needed a hint -> same step. missed -> back to 1 day.

import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const LADDER = [1, 3, 7, 21, 60];
const DIR = path.resolve(fileURLToPath(import.meta.url), '../..');
export const IDEAS = path.join(DIR, 'ideas.json');

export async function loadIdeas() {
  try {
    return JSON.parse(await fs.readFile(IDEAS, 'utf8'));
  } catch {
    return [];
  }
}

// local date as YYYY-MM-DD, moved by `days`
export function day(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-CA');
}

// short label for a subject line: "Hashing — turning any..." -> "hashing"
const slug = (subject) =>
  subject.split(' — ')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function add(file, spread) {
  const ideas = await loadIdeas();
  const fresh = JSON.parse(await fs.readFile(file, 'utf8'));
  // mix subjects so one day doesn't get all the ideas of one video
  const order = spread ? interleave(fresh) : fresh;
  order.forEach((x, i) => {
    for (const key of ['subject', 'idea', 'source']) if (!x[key]) throw new Error(`missing field: ${key}`);
    const n = ideas.filter((y) => y.subject === x.subject).length + 1;
    const offset = spread ? 1 + Math.floor((i * spread) / order.length) : LADDER[0];
    ideas.push({
      id: `${slug(x.subject)}-${n}`,
      subject: x.subject,
      idea: x.idea,
      source: x.source,
      added: day(),
      step: 0,
      due: day(offset),
      reviews: [],
    });
    console.log(`added ${ideas.at(-1).id} (first review ${ideas.at(-1).due})`);
  });
  await fs.writeFile(IDEAS, JSON.stringify(ideas, null, 2) + '\n');
}

function interleave(list) {
  const groups = Object.values(Object.groupBy(list, (x) => x.subject));
  const out = [];
  for (let i = 0; out.length < list.length; i++) for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
}

async function review(id, result, question) {
  if (!['got', 'hint', 'missed'].includes(result)) throw new Error('result must be got, hint or missed');
  if (!question) throw new Error('give the question you asked');
  const ideas = await loadIdeas();
  const x = ideas.find((y) => y.id === id);
  if (!x) throw new Error(`no idea with id ${id}`);
  if (result === 'got') x.step = Math.min(x.step + 1, LADDER.length - 1);
  if (result === 'missed') x.step = 0;
  x.due = day(LADDER[x.step]);
  x.reviews.push({ date: day(), result, question });
  await fs.writeFile(IDEAS, JSON.stringify(ideas, null, 2) + '\n');
  console.log(`${id}: ${result} -> next review ${x.due} (in ${LADDER[x.step]} day${LADDER[x.step] > 1 ? 's' : ''})`);
}

// strong / weak / learning / new, from the review results
export function strength(x) {
  const r = x.reviews.map((y) => y.result);
  if (r.length === 0) return 'new';
  const last2 = r.slice(-2);
  if (r.at(-1) === 'missed' || (r.length >= 2 && last2.every((y) => y !== 'got'))) return 'weak';
  if (last2.length === 2 && last2.every((y) => y === 'got')) return 'strong';
  return 'learning';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'add') {
    const i = args.indexOf('--spread');
    await add(args[0], i >= 0 ? Number(args[i + 1]) : 0);
  } else if (cmd === 'review') {
    await review(...args);
  } else {
    console.error('usage: node ideas.mjs add <file.json> [--spread <days>] | review <id> <got|hint|missed> "<question>"');
    process.exit(1);
  }
}
