---
name: brain-food-bites
description: Recommends ONE short (under 10 minutes), high-quality, hands-on English YouTube video on a computer science or AI fundamental, cycling in order through the subject list in video-subjects.txt (in this folder). Adds each pick to the top of a single HTML page that opens in the browser, and keeps a history so no video repeats. Use when the user runs /brain-food-bites, asks for a new video, a "video to learn", or a short CS / AI fundamentals video.
---

# Brain food bites — one short video, one subject at a time

## Who it is for

A hands-on person, a "hacker" more than an academic. They learn best by seeing things built,
shown or taken apart, not from lectures or slides full of formulas.

The first video on a subject starts from the very basics. Assume no math background: no
formulas, no code-heavy walkthrough. Go deeper only in later rounds. (2026-11-17: a Welch Labs
gradient descent video, with formulas and Python code, was too hard as a first video on neural
networks.)

They watch during downtime in the workday (a build running, waiting on something), so a video
must fit a short break. No daily rhythm: some days several runs, some days none.

## Workflow

1. **Check state:** `node scripts/status.mjs`
   Prints the next subject (the list is followed in order, then starts again at the top),
   every video already recommended for that subject, the key ideas due for review today
   (at most 3), and how the reader did on this subject's ideas (strong / weak / learning / new).

2. **Review the due ideas first** (spaced repetition), one at a time, in chat. Skip if none.
   - Read the idea's transcript, then ask **one new question** on the idea. Never repeat a
     question listed under "asked". Make it harder as the step rises: step 1 = explain the idea,
     later steps = apply it to a new case, a real bug, or the reader's own work (apps, audio).
   - Wait for the answer. Judge it against the transcript: `got` (right, unaided),
     `hint` (needed a hint or was half right), `missed`. Tell the reader in one or two
     plain sentences what was right and what was missing.
   - Record it: `node scripts/ideas.mjs review <id> <got|hint|missed> "<question asked>"`
   Then move on to the new video.

3. **Search for a video** on that subject with WebSearch (try a few searches). If the subject
   already has videos, pick a **different angle** (e.g. build it in code, a real-world bug it
   caused, a visual demo, how a real product uses it). Never pick a video already in the history.
   Use the review results printed by status.mjs:
   - **weak** ideas: pick a video that attacks that idea from a new angle, or more simply;
   - all **strong**: go one step deeper, skip what the reader already knows;
   - mention this in the `angle` field (e.g. "targets the weak spot: why MD5 broke").

4. **Check the video** before choosing it, with the official YouTube Data API:
   `node scripts/check.mjs <id> [<id> ...]`
   Prints title, channel, length, views, likes, date and language. The key is in
   `youtube-api-key` (never print it, never share it). Don't scrape youtube.com pages: YouTube
   answers scripts with "Sign in to confirm you're not a bot" and hides the length.
   - English, **under 10 minutes**, length confirmed (not guessed).
   - **High quality:** well-known, trusted channel and strong views / likes for its age.
     Good examples: SimonDev and Computerphile (the reader's favourites so far: one idea, taken
     apart by someone who knows it well), Fireship, 3Blue1Brown, Ben Eater, Code Aesthetic,
     Reducible, Sebastian Lague, Andrej Karpathy. Others are fine if the quality signals are strong.
   - **Hands-on:** shows code, a demo, a machine or a concrete example. Skip lecture recordings
     and slide-only talks.
   - **One idea, in depth:** the video takes one thing apart: how it works, what breaks, a real
     case. Skip catalogue videos ("10 X every developer should know", "N types of Y") that give
     each item one line. Too abstract fails too: an idea explained without a concrete case.
     Before picking ByteByteGo or any "overview" title, check it isn't a list.
   If nothing passes all checks, say so and ask before lowering the bar.

5. **Write the entry JSON** to the scratchpad:
   ```json
   {
     "date": "YYYY-MM-DD",
     "subject": "exact subject line from video-subjects.txt",
     "title": "video title",
     "channel": "channel name",
     "length": "7:42",
     "url": "https://www.youtube.com/watch?v=...",
     "angle": "a few words: what makes this take different",
     "why": "one or two plain sentences: what you will get out of it"
   }
   ```

6. **Render + record:** `node scripts/render.mjs /path/to/entry.json`
   Adds the entry to `history.json`, rebuilds `videos.html` (newest at the top) and opens it.
   Set `FUNDAMENTALS_VIDEO_NO_OPEN=1` to not open it.

7. **Save the transcript** into `transcripts/<nn>-<short-subject>-<video id>.txt`
   (`nn` = the entry's number in `history.json`, e.g. `11-sorting-abc123.txt`).
   Scripts can't fetch captions: YouTube blocks them, with or without VPN (tested 2026-11-19
   with youtube-transcript-api). So it goes through the user's Chrome:
   - start the receiver in the background: `python3 -I scripts/receive-transcript.py`
     (it saves one file, then stops);
   - open the video in a new Chrome tab (claude-in-chrome), then run the code in
     `scripts/grab-captions.js` with the javascript tool, after setting `NAME` and `HEADER`;
   - it answers `200 words=...` when saved, or `NO CAPTIONS`; close the tab.
   If it fails, say so in the report and move on: the video pick still counts.

8. **Add the video's key ideas** for future reviews (only if the transcript was saved).
   Read the transcript and pick 2–4 key ideas yourself, without asking: what the video really
   teaches, not side remarks or sponsor bits. One plain sentence each. Write them to the
   scratchpad as `[{ "subject": "<exact subject line>", "idea": "...", "source": "<transcript file name>" }]`
   and run `node scripts/ideas.mjs add /path/to/ideas.json` (first review tomorrow).

9. **Report** in one or two lines: subject, title, channel, length, whether the transcript
   was saved, and how many ideas were added.

## Notes

- The subject list lives in `video-subjects.txt`, in this folder. Edit it freely: one subject
  per line. The rotation follows how many videos have been recommended so far.
- Data (`history.json`, `videos.html`, `transcripts/`, `ideas.json`) sits in this folder, next
  to the code.
- Spaced repetition: gaps between reviews are 1 day, 3 days, 1 week, 3 weeks, 2 months.
  `got` moves the idea one step up, `hint` keeps it on the same step, `missed` sends it back to
  1 day. The idea stays the same; the question changes every time. Rules live in `scripts/ideas.mjs`.
- Transcripts are mostly YouTube's automatic captions: some misheard words, little punctuation.
