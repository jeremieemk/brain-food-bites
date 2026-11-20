# Brain food bites

Swap a few minutes of social media for something that feeds your brain.

Brain food bites is a [Claude Code](https://claude.com/claude-code) skill. Each time you run it,
it picks **one short YouTube video (under 10 minutes)** on a computer science or AI basic, and
quizzes you on what you watched before.

## What it does

- Goes through a list of subjects in order, then starts again with a new angle on each one.
- Picks only short, hands-on videos from trusted channels: real code, demos and examples, not
  lectures or "10 things you should know" lists.
- Checks each video with the YouTube Data API: length, language, views and likes.
- Never recommends the same video twice.
- Adds each pick to the top of one HTML page that opens in your browser.
- Saves the video's transcript and pulls out 2 to 4 key ideas.
- Asks you one question on old ideas when they are due (spaced repetition: after 1 day,
  3 days, 1 week, 3 weeks, 2 months). A wrong answer brings the idea back sooner.

## Subjects

They live in `video-subjects.txt`, one per line. Edit the list freely. It starts with:

1. Binary and bits
2. Big O notation
3. Hashing
4. Data structures
5. Recursion
6. How the internet works
7. Caching
8. Concurrency
9. How neural networks learn
10. Tokens and embeddings

## Setup

1. Put this folder in `~/.claude/skills/brain-food-bites` (or link it there).
2. Get a YouTube Data API v3 key from the Google Cloud console.
3. Save the key, on one line, in a file called `youtube-api-key` in this folder.
   Git ignores this file, so it never gets uploaded.
4. In Claude Code, run `/brain-food-bites`.

Saving transcripts also needs the Claude in Chrome extension, because YouTube blocks scripts
from fetching captions.

## Files

- `SKILL.md`: the steps Claude follows.
- `scripts/`: small Node and Python helpers (check a video, render the page, track reviews).
- `history.json`: every video picked so far.
- `ideas.json`: key ideas and when each one is next due for review.
- `videos.html`: the page with all your picks.
- `transcripts/`: saved captions (kept on your computer only, not uploaded).
