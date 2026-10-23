// Generates one written post per episode from ai-channel/episodes/<slug>.json into posts/<slug>.html.
// Usage: node build-posts.mjs   (run from the site repo; commit the output)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

// Sibling folders of this repo (ai-channel, lunch-*), so no absolute paths are committed.
const PROJECTS = path.resolve(import.meta.dirname, '..');

const EPISODES = [
  { slug: 'ep01-invoice', n: 1, date: '2026-09-05', repo: 'https://github.com/appbeforelunch/lunch-invoice', app: 'https://appbeforelunch.github.io/lunch-invoice/', video: 'coD7vvNehcY' },
  { slug: 'ep02-pipeline', n: 2, date: '2026-09-15', repo: 'https://github.com/appbeforelunch/lunch-video', app: '', video: 'N4y15sT-9og' },
];
const SRC = path.join(PROJECTS, 'ai-channel', 'episodes') + '/';
const clean = (s) => String(s).replace(/\[[^\]]+\]\s*/g, '');
const esc = (s) => clean(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
mkdirSync('posts', { recursive: true });

// Styles live in ../site.css (shared with the home page). The video is a click-to-play facade:
// a plain link to YouTube without script, the youtube-nocookie embed only after a click.
const FACADE_JS = `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-yt]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+a.dataset.yt+'?autoplay=1';f.title=a.dataset.title;f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;a.replaceWith(f);});`;

for (const ep of EPISODES) {
  const d = JSON.parse(readFileSync(SRC + ep.slug + '.json', 'utf8'));
  let prompt = '';
  try { prompt = readFileSync(`${PROJECTS}/${{ 'ep01-invoice': 'lunch-invoice', 'ep02-pipeline': 'lunch-video', 'ep03-foodcheck': 'lunch-foodcheck' }[ep.slug]}/PROMPT.md`, 'utf8').split('\n').slice(2).join('\n').trim(); } catch {}
  const lede = d.description.split('\n\n')[0];
  const scorecard = d.scenes.find((s) => s.id.endsWith('scorecard'));
  const body = d.scenes
    .filter((s) => !['title', 'outro'].includes(s.type) && !s.id.endsWith('scorecard'))
    .map((s) => {
      const h = s.type === 'demo' ? s.caption || '' : s.headline;
      const bullets = s.type === 'point' && s.bullets?.length ? `<ul class="bullets">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '';
      return `${h ? `<h2>${esc(h)}</h2>` : ''}${bullets}<p>${esc(s.voice)}</p>`;
    })
    .join('\n');
  const outro = d.scenes.find((s) => s.type === 'outro');
  const video = ep.video ? `<div class="video"><img src="https://i.ytimg.com/vi/${ep.video}/hqdefault.jpg" alt="${esc(d.title)}" width="480" height="360" fetchpriority="high"><a href="https://www.youtube.com/watch?v=${ep.video}" data-yt="${ep.video}" data-title="${esc(d.title)}"><span>Watch on YouTube</span></a></div>` : `<div class="video">Video goes live ${ep.date}. <a href="https://www.youtube.com/@AppBeforeLunch" style="margin-left:8px">Subscribe to catch it</a></div>`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.title)} | App Before Lunch</title>
<meta name="description" content="${esc(lede).slice(0, 155)}">
<meta property="og:title" content="${esc(d.title)}"><meta property="og:description" content="${esc(lede).slice(0, 200)}"><meta property="og:image" content="https://appbeforelunch.com/og.png">
<link rel="icon" href="../logo.svg" type="image/svg+xml">
<meta name="color-scheme" content="light">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../site.css"></head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar"><div class="wrap"><a class="brand" href="../"><img src="../logo.svg" alt="" width="32" height="32">App Before Lunch</a><nav aria-label="Site"><a href="../#episodes">All episodes</a></nav></div></header>
<main id="main" class="page" tabindex="-1"><div class="wrap">
  <div class="kicker">EPISODE ${String(ep.n).padStart(2, '0')} · ${ep.date}</div>
  <h1>${esc(d.title)}</h1>
  <p class="lede">${esc(lede)}</p>
  <div class="actions">${ep.app ? `<a class="primary" href="${ep.app}">Try the app</a>` : ''}<a href="${ep.repo}">Source on GitHub</a><a href="${ep.repo}/blob/main/PROMPT.md">The prompt</a><a href="https://www.youtube.com/@AppBeforeLunch">Watch on YouTube</a></div>
  ${video}
  ${ep.health ? '<div class="warn"><b>Not medical advice.</b> The app in this episode is a lookup over public guidance from the FDA, ACOG, and CDC. Always ask your doctor or midwife.</div>' : ''}
  <p>${esc(d.scenes[0].voice)}</p>
  ${body}
  ${scorecard ? `<h2>Scorecard</h2><div class="score">${scorecard.bullets.map((b) => esc(b)).join('<br>')}</div><p>${esc(scorecard.voice)}</p>` : ''}
  <h2>The prompt, word for word</h2>
  <div class="prompt">${esc(prompt || 'See PROMPT.md in the repo.')}</div>
  ${outro ? `<p><b>Next:</b> ${esc(outro.headline.replace(/^Next:\s*/i, ''))}</p>` : ''}
  <p class="muted">This post is the episode's script. The narration in the video is an AI clone of the host's voice; the apps were generated by Claude Code and are shown as recorded. Tools: Claude Code on a paid Claude subscription, ElevenLabs on a paid plan, Remotion (free for individuals). Not sponsored.</p>
</div></main>
<footer class="small-footer"><div class="wrap">© 2026 App Before Lunch · <a href="../">Home</a> · <a href="https://www.youtube.com/@AppBeforeLunch">YouTube</a> · <a href="https://github.com/appbeforelunch">GitHub</a></div></footer>
<script>${FACADE_JS}</script>
</body></html>`;
  writeFileSync(`posts/${ep.slug}.html`, html);
  console.log(`posts/${ep.slug}.html (${(html.length / 1024).toFixed(0)} KB)`);
}
