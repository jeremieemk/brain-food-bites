// runs inside the youtube video page (claude-in-chrome javascript tool).
// turns subtitles on, catches the caption text the player loads, and sends it
// to scripts/receive-transcript.py, which saves it in transcripts/.
// before running: replace NAME and HEADER on the two lines below.
const NAME = '11-subject-VIDEOID.txt';
const HEADER = 'Video title — Channel';

window.__cap = null;
const open0 = XMLHttpRequest.prototype.open, send0 = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; return open0.apply(this, arguments); };
XMLHttpRequest.prototype.send = function () {
  if (String(this.__u).includes('timedtext')) this.addEventListener('load', () => { window.__cap = this.responseText; });
  return send0.apply(this, arguments);
};
const fetch0 = window.fetch;
window.fetch = async function (i) {
  const r = await fetch0.apply(this, arguments);
  const u = typeof i === 'string' ? i : i?.url;
  if (String(u).includes('timedtext')) r.clone().text().then((t) => (window.__cap = t));
  return r;
};

// wait for the player, then switch subtitles off and on so it loads them fresh
await new Promise((r) => setTimeout(r, 2500));
const player = document.querySelector('#movie_player');
player.seekTo(0);
player.playVideo();
const ccButton = document.querySelector('.ytp-subtitles-button');
if (ccButton?.getAttribute('aria-pressed') === 'true') { ccButton.click(); await new Promise((r) => setTimeout(r, 500)); }
document.querySelector('.ytp-subtitles-button')?.click();
for (let i = 0; i < 20 && !window.__cap; i++) await new Promise((r) => setTimeout(r, 500));
player.pauseVideo();

let result = 'NO CAPTIONS';
if (window.__cap) {
  const text = JSON.parse(window.__cap).events
    .filter((e) => e.segs)
    .map((e) => e.segs.map((s) => s.utf8).join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  const r = await fetch0('http://127.0.0.1:8765/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: NAME, text: HEADER + '\n' + location.href + '\n\n' + text + '\n' }),
  });
  result = r.status + ' words=' + text.split(' ').length + ' start: ' + text.slice(0, 80);
}
result;
