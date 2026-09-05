// Generates one written post per episode from ai-channel/episodes/<slug>.json into posts/<slug>.html.
// Usage: node build-posts.mjs   (run from the site repo; commit the output)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const EPISODES = [
  { slug: 'ep01-invoice', n: 1, date: '2026-09-08', repo: 'https://github.com/appbeforelunch/lunch-invoice', app: 'https://appbeforelunch.github.io/lunch-invoice/', video: '' },
  { slug: 'ep02-pipeline', n: 2, date: '2026-09-15', repo: 'https://github.com/appbeforelunch/lunch-video', app: '', video: '' },
  { slug: 'ep03-foodcheck', n: 3, date: '2026-09-22', repo: 'https://github.com/appbeforelunch/lunch-foodcheck', app: 'https://appbeforelunch.github.io/lunch-foodcheck/', video: '', health: true },
];
const SRC = '/Users/joseocasio/Documents/Personal-Projects/ai-channel/episodes/';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
mkdirSync('posts', { recursive: true });

const CSS = `
  :root{--bg:#0B0F19;--panel:#161D30;--lime:#C6FF3D;--orange:#FF7A1A;--text:#F5F5F0;--muted:#8C91A0;--line:#1f2740}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased}
  a{color:var(--lime);text-decoration:none}a:hover{text-decoration:underline}
  h1,h2,h3{font-family:"Space Grotesk",Inter,sans-serif;letter-spacing:-.02em;line-height:1.1}
  .wrap{max-width:760px;margin:0 auto;padding:0 24px}
  header{border-bottom:1px solid var(--line)}nav{display:flex;align-items:center;justify-content:space-between;height:64px}
  .brand{display:flex;align-items:center;gap:10px;color:var(--text);font-family:"Space Grotesk";font-weight:700;letter-spacing:.06em;font-size:14px;text-transform:uppercase}.brand img{width:34px;height:34px;border-radius:8px}
  .kicker{font-family:"JetBrains Mono",monospace;color:var(--orange);font-size:14px;margin:56px 0 12px}
  h1{font-size:clamp(34px,6vw,52px);margin:0 0 14px}.lede{font-size:20px;color:var(--muted);margin:0 0 28px}
  .actions{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 36px}.actions a{padding:9px 14px;border-radius:10px;border:1px solid var(--line);color:var(--text);font-size:14px;font-weight:500}.actions a.primary{background:var(--lime);color:#0B0F19;border-color:var(--lime)}.actions a:hover{text-decoration:none;border-color:var(--lime)}
  .video{aspect-ratio:16/9;background:var(--panel);border:1px solid var(--line);border-radius:16px;display:flex;align-items:center;justify-content:center;color:var(--muted);margin:0 0 36px;overflow:hidden}.video iframe{width:100%;height:100%;border:0}
  .warn{background:#2a1a0a;border:1px solid #5a3a10;border-radius:12px;padding:14px 18px;color:#ffd9b3;margin:0 0 28px}
  h2{font-size:26px;margin:44px 0 10px}p{margin:0 0 18px;font-size:17px}
  ul.bullets{padding-left:0;list-style:none;margin:0 0 18px}ul.bullets li{padding:8px 0 8px 40px;position:relative}ul.bullets li:before{content:"";position:absolute;left:0;top:16px;width:14px;height:14px;border-radius:4px;background:var(--lime)}
  .score{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px 22px;font-family:"JetBrains Mono",monospace;font-size:14px;line-height:1.9;margin:0 0 18px}
  .prompt{background:#0f1424;border:1px solid var(--line);border-left:4px solid var(--orange);border-radius:12px;padding:18px 22px;white-space:pre-wrap;font-family:"JetBrains Mono",monospace;font-size:14px;line-height:1.6;margin:0 0 18px}
  footer{border-top:1px solid var(--line);padding:36px 0;color:var(--muted);font-size:13px;margin-top:60px}
  @media(max-width:600px){h2{font-size:22px}p{font-size:16px}}
`;

for (const ep of EPISODES) {
  const d = JSON.parse(readFileSync(SRC + ep.slug + '.json', 'utf8'));
  let prompt = '';
  try { prompt = readFileSync(`/Users/joseocasio/Documents/Personal-Projects/${{ 'ep01-invoice': 'lunch-invoice', 'ep02-pipeline': 'lunch-video', 'ep03-foodcheck': 'lunch-foodcheck' }[ep.slug]}/PROMPT.md`, 'utf8').split('\n').slice(2).join('\n').trim(); } catch {}
  const lede = d.description.split('\n\n')[0];
  const scorecard = d.scenes.find((s) => s.id.endsWith('scorecard'));
  const body = d.scenes
    .filter((s) => !['title', 'outro'].includes(s.type) && !s.id.endsWith('scorecard'))
    .map((s) => {
      const h = s.type === 'demo' ? s.caption || '' : s.headline;
      const bullets = s.type === 'point' && s.bullets?.length ? `<ul class="bullets">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '';
      return `<h2>${esc(h)}</h2>${bullets}<p>${esc(s.voice)}</p>`;
    })
    .join('\n');
  const outro = d.scenes.find((s) => s.type === 'outro');
  const video = ep.video ? `<div class="video"><iframe src="https://www.youtube.com/embed/${ep.video}" title="${esc(d.title)}" allowfullscreen></iframe></div>` : `<div class="video">Video goes live ${ep.date}. <a href="https://www.youtube.com/@AppBeforeLunch" style="margin-left:8px">Subscribe to catch it</a></div>`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.title)} — App Before Lunch</title>
<meta name="description" content="${esc(lede).slice(0, 155)}">
<meta property="og:title" content="${esc(d.title)}"><meta property="og:description" content="${esc(lede).slice(0, 200)}"><meta property="og:image" content="https://appbeforelunch.com/og.png">
<link rel="icon" href="../logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>${CSS}</style></head>
<body>
<header><div class="wrap"><nav><a class="brand" href="../">​<img src="../logo.svg" alt="">App Before Lunch</a><a href="../#episodes" style="font-size:14px;color:var(--muted)">All episodes</a></nav></div></header>
<main class="wrap">
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
  <p style="color:var(--muted);font-size:14px">This post is the episode's script. The narration in the video is an AI clone of the host's voice; the apps were generated by Claude Code and are shown as recorded. Tools: Claude Code on a paid Claude subscription, ElevenLabs on a paid plan, Remotion (free for individuals). Not sponsored.</p>
</main>
<footer><div class="wrap">© 2026 App Before Lunch · <a href="../">Home</a> · <a href="https://www.youtube.com/@AppBeforeLunch">YouTube</a> · <a href="https://github.com/appbeforelunch">GitHub</a></div></footer>
</body></html>`;
  writeFileSync(`posts/${ep.slug}.html`, html);
  console.log(`posts/${ep.slug}.html (${(html.length / 1024).toFixed(0)} KB)`);
}
