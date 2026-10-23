// UI/UX checklist for appbeforelunch.com (panel/sessions/2026-10-21-design-tools.md, round 2).
// Run: npx playwright test            (all three viewports: w390, w768, w1280)
// Baselines: npx playwright test -g visual --update-snapshots   (only on purpose, after reviewing diffs)
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PAGES = ['/', '/privacy.html', '/posts/ep01-invoice.html', '/posts/ep02-pipeline.html'];
const SOCIAL = /(^|\.)(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com)$/;
const KB = 1024;

// Authored numbers and lines that must survive any redesign, per page.
const GUARD: Record<string, string[]> = {
  '/': [
    'Can AI build', 'before lunch?',
    'the bugs stay in the video',
    '41 checks', '$1.19 at API prices, covered by Claude + ElevenLabs plans',
    '39 of 231', '46 / 46', '$10.08 at API prices, covered by Claude + ElevenLabs plans',
    '1 lb 11.5 oz', '61 tests', '$3.87 at API prices, covered by Claude + ElevenLabs plans', 'Not affiliated with Amazon.',
    '90 rules', '107 rules', 'Not medical advice.', '$0 on top of Claude + ElevenLabs plans',
    '27 seconds', 'fourteen passing tests', '14 / 14', '$0 on top of a Claude plan', 'using it for the LLC',
    'No back and forth', 'I never touch the source', 'not a programmer',
    'the narration is an AI clone of the host\'s own voice',
    'paid Claude subscription', 'paid ElevenLabs plan (neither sponsored)', 'Everything is shown as recorded.',
  ],
  '/privacy.html': ['no tracking or analytics scripts', 'Limited Use requirements', 'contact@appbeforelunch.com'],
};
const GUARD_HREFS = ['privacy.html', 'https://www.tiktok.com/@appbeforelunch', 'https://www.youtube.com/@AppBeforeLunch',
  'https://www.instagram.com/appbeforelunch', 'https://www.facebook.com/appbeforelunch', 'https://github.com/appbeforelunch', 'mailto:contact@appbeforelunch.com'];
// Ep7 card (branch ep7-live): only checked when the card is on the page.
const GUARD_EP7 = ['281', '64', '$6.02 at API prices, covered by Claude + ElevenLabs plans', 'Not affiliated with Adobe.'];

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
}
const slug = (p: string) => (p === '/' ? 'index' : p.replace(/^\//, '').replace(/\W+/g, '-').replace(/-html$/, ''));

// 1. Viewports: no horizontal scroll.
for (const path of PAGES) {
  test(`layout: no horizontal scroll ${path}`, async ({ page }) => {
    await open(page, path);
    const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    expect(sw, `scrollWidth ${sw} > innerWidth ${iw}`).toBeLessThanOrEqual(iw);
  });
}

// 2. Visual baselines and diffs (iframes masked: YouTube embeds change on their own).
for (const path of PAGES) {
  test(`visual: full page ${path}`, async ({ page }) => {
    await open(page, path);
    await expect(page).toHaveScreenshot(`${slug(path)}.png`, { fullPage: true, mask: [page.locator('iframe')] });
  });
}

// 3. Accessibility: axe WCAG 2.x A/AA incl. colour contrast, light and dark preference.
for (const path of PAGES) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`a11y: axe wcag2aa ${path} (${scheme})`, async ({ page }, info) => {
      await page.emulateMedia({ colorScheme: scheme });
      await open(page, path);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('iframe').analyze();
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      for (const v of r.violations.filter((v) => !bad.includes(v))) info.annotations.push({ type: 'warn', description: `${v.id} (${v.impact}) x${v.nodes.length}` });
      expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
}

// 4. Keyboard: skip link first, Tab walks every focusable in DOM order, focus is visible.
test('keyboard: skip link, tab order, visible focus on /', async ({ page }) => {
  await open(page, '/');
  const order = await page.evaluate(() =>
    [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((e) => { const r = (e as HTMLElement).getBoundingClientRect(); const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && (r.width > 0 || r.height > 0 || e.matches('.skip')); })
      .map((e) => (e as HTMLElement).outerHTML.slice(0, 80)));
  expect(order.length).toBeGreaterThan(5);
  // First Tab lands on a skip link to main content.
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => { const a = document.activeElement as HTMLAnchorElement; return { href: a?.getAttribute('href') || '', text: a?.textContent || '' }; });
  expect.soft(first.text.toLowerCase(), 'first tab stop should be a skip link').toContain('skip');
  const target = first.href.startsWith('#') ? first.href.slice(1) : '';
  expect.soft(target && (await page.locator(`[id="${target}"]`).count()), 'skip link target exists').toBeTruthy();
  // Walk every stop: focus order must equal DOM order, and each stop must show a focus indicator.
  const seen: string[] = [];
  const invisible: string[] = [];
  await open(page, '/');
  for (let i = 0; i < order.length; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const e = document.activeElement as HTMLElement; const s = getComputedStyle(e);
      const outline = s.outlineStyle === 'auto' || (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2);
      const ring = !!s.boxShadow && s.boxShadow !== 'none';
      return { html: e.outerHTML.slice(0, 80), visible: outline || ring };
    });
    seen.push(f.html);
    if (!f.visible) invisible.push(f.html);
  }
  expect(seen).toEqual(order);
  expect(invisible, 'elements with no visible focus indicator').toEqual([]);
});

// 5. Links and assets.
test('links: internal links and assets resolve', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'w1280', 'run once');
  const broken: string[] = [];
  for (const path of PAGES) {
    const failed: string[] = [];
    page.on('response', (r) => { if (r.url().startsWith(info.project.use.baseURL!) && r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    await open(page, path);
    broken.push(...failed.map((f) => `${path}: asset ${f}`));
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const h of new Set(hrefs)) {
      const u = new URL(h);
      if (u.origin !== new URL(info.project.use.baseURL!).origin) continue;
      const res = await request.get(u.pathname);
      if (res.status() >= 400) broken.push(`${path}: link ${u.pathname} ${res.status()}`);
      if (u.hash && u.pathname === new URL(page.url()).pathname) {
        const id = decodeURIComponent(u.hash.slice(1));
        if (id && !(await page.locator(`[id="${id}"]`).count())) broken.push(`${path}: anchor #${id} missing`);
      }
    }
  }
  expect(broken).toEqual([]);
});

test('links: external links (social sites warn only)', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'w1280', 'run once');
  test.setTimeout(180_000);
  const ext = new Set<string>();
  for (const path of PAGES) {
    await open(page, path);
    for (const h of await page.$$eval('a[href]', (as) => as.map((a) => (a as HTMLAnchorElement).href))) {
      const u = new URL(h);
      if (/^https?:$/.test(u.protocol) && u.origin !== new URL(info.project.use.baseURL!).origin) ext.add(u.href);
    }
  }
  const fail: string[] = [];
  for (const href of ext) {
    let status = 0;
    try { status = (await request.get(href, { timeout: 20_000, maxRedirects: 10, headers: { 'user-agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140 Safari/537.36' } })).status(); } catch { status = -1; }
    if (status >= 200 && status < 400) continue;
    if (status === 429 || SOCIAL.test(new URL(href).hostname)) info.annotations.push({ type: 'warn', description: `${status} ${href}` });
    else fail.push(`${status} ${href}`);
  }
  expect(fail).toEqual([]);
});

// 6. Performance (local, approximate): throttled to ~4 Mbps / 100 ms RTT / 2x CPU.
for (const path of PAGES) {
  test(`perf: CLS, LCP, weight ${path}`, async ({ page }, info) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (1024 * 1024) / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 2 });
    let bytes = 0;
    cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; });
    await page.addInitScript(() => {
      (window as any).__cls = 0; (window as any).__lcp = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries() as any) if (!e.hadRecentInput) (window as any).__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) (window as any).__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    await page.goto(path, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    // Scroll through so lazy images load and count toward weight and CLS.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(1000);
    const { cls, lcp } = await page.evaluate(() => ({ cls: (window as any).__cls, lcp: (window as any).__lcp }));
    info.annotations.push({ type: 'perf', description: `CLS ${cls.toFixed(3)} LCP ${Math.round(lcp)} ms weight ${(bytes / KB).toFixed(0)} KB` });
    expect.soft(cls, 'CLS').toBeLessThan(0.1);
    expect.soft(lcp, 'LCP ms').toBeLessThan(2500);
    expect.soft(bytes / KB, 'page weight KB (third-party iframes excluded by Chromium site isolation)').toBeLessThan(500);
  });
}

test('images: width, height and alt on every <img>', async ({ page }) => {
  const bad: string[] = [];
  for (const path of PAGES) {
    await open(page, path);
    bad.push(...(await page.$$eval('img', (imgs) => imgs.filter((i) => !i.hasAttribute('alt') || !i.getAttribute('width') || !i.getAttribute('height')).map((i) => i.outerHTML.slice(0, 100)))).map((h) => `${path}: ${h}`));
    // Content images (not the logo) need real alt text.
    bad.push(...(await page.$$eval('img:not([src$="logo.svg"])', (imgs) => imgs.filter((i) => (i.getAttribute('alt') || '').trim().length < 8).map((i) => 'short alt ' + i.getAttribute('src')))).map((h) => `${path}: ${h}`));
  }
  expect(bad).toEqual([]);
});

// 7. Media preferences.
test('motion: prefers-reduced-motion stops motion and smooth scroll', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of PAGES) {
    await open(page, path);
    const r = await page.evaluate(() => ({
      smooth: getComputedStyle(document.documentElement).scrollBehavior === 'smooth',
      running: document.getAnimations().filter((a) => a.playState === 'running').length,
      longTransitions: [...document.querySelectorAll('*')].filter((e) => { const d = getComputedStyle(e).transitionDuration.split(',').map(parseFloat); return Math.max(...d) > 0.01; }).length,
      autoplay: [...document.querySelectorAll('video[autoplay]')].length,
    }));
    expect(r, path).toEqual({ smooth: false, running: 0, longTransitions: 0, autoplay: 0 });
  }
});

// 8. Content guard.
test('content: authored numbers and lines survive', async ({ page }, info) => {
  test.skip(info.project.name !== 'w1280', 'run once');
  for (const [path, needles] of Object.entries(GUARD)) {
    await open(page, path);
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    const missing = needles.filter((n) => !text.includes(n));
    if (path === '/' && text.includes('EP 07')) missing.push(...GUARD_EP7.filter((n) => !text.includes(n)));
    expect(missing, `missing on ${path}`).toEqual([]);
    expect(text.includes('—'), `em dash on ${path}`).toBe(false);
  }
  await open(page, '/');
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
  expect(GUARD_HREFS.filter((h) => !hrefs.includes(h))).toEqual([]);
  // Every episode keeps its Watch link and repo links.
  for (const id of ['qcxpuCKRqPw', '1tjh4OmDaiE', '9B1pi4yKmbE', 'jt-_8jG8GNs', 'N4y15sT-9og', 'coD7vvNehcY']) expect(hrefs.some((h) => h?.includes(id)), id).toBe(true);
  for (const repo of ['lunch-limits', 'lunch-notify', 'lunch-unitprice', 'lunch-foodcheck', 'lunch-video', 'lunch-invoice']) {
    expect(hrefs.filter((h) => h?.startsWith(`https://github.com/appbeforelunch/${repo}`)).length, repo).toBeGreaterThanOrEqual(2);
  }
});

test('publish: tooling is excluded from the Pages build', async ({}, info) => {
  test.skip(info.project.name !== 'w1280', 'run once');
  const cfg = readFileSync(resolve(__dirname, '..', '_config.yml'), 'utf8');
  for (const x of ['.claude', 'tests', 'node_modules']) expect(cfg).toMatch(new RegExp(`^\\s*- ${x.replace('.', '\\.')}\\s*$`, 'm'));
});

// 9. Calls to action: a lime Subscribe closes the page, and
//    "Latest build" lands on the newest episode card, not the section heading.
test('cta: bottom Subscribe button and Latest build target', async ({ page }) => {
  await open(page, '/');
  const sub = page.locator('#follow a.btn[href="https://www.youtube.com/@AppBeforeLunch?sub_confirmation=1"]');
  await expect(sub).toHaveCount(1);
  await expect(sub).toBeVisible();
  const href = (await page.locator('.cta a', { hasText: 'Latest build' }).getAttribute('href')) || '';
  expect(href).toMatch(/^#ep\d\d$/);
  const target = page.locator(`[id="${href.slice(1)}"]`);
  await expect(target).toHaveCount(1);
  // The target is an episode card, and the first (newest) one on the page.
  expect(await target.evaluate((e) => e.matches('.ep') && e === document.querySelector('#episodes .ep'))).toBe(true);
});
