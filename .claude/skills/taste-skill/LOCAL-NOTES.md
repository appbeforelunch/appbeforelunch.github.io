# Local notes (App Before Lunch)

Read this before SKILL.md. Where the two disagree, this file wins.

## Source
- Upstream: https://github.com/Leonxlnx/taste-skill, folder `skills/taste-skill` only.
- Pinned commit: `6010f91a9935f1c167dfc500fb1a475681892e6b` (v2.1.4, 2026-10-20).
- Fetched 2026-10-21 with `gh api` (git blobs at that commit, each blob SHA verified). No clone, no npm, no install.sh, no scripts run during the fetch.
- `LICENSE` is the upstream MIT license from the repo root at the same commit.
- Project scope only (this site repo). Never symlink or copy into `~/.claude/skills`.

## Removed or changed
- `scripts/assets.mjs`: DELETED. It searched and downloaded images and video from Openverse, Wikimedia Commons, the Art Institute of Chicago, the Met, NASA and archive.org.
- `library/photos.json`: REPLACED with an empty stub (`"sets": {}`). The upstream file listed Unsplash stock photos served by picsum.photos; `draw.mjs` printed those URLs into direction sheets. With the stub, `draw.mjs` still runs and deals no photographs.
- Nothing else changed. What still executes, if someone runs it: `scripts/inspect.mjs` and `scripts/scenes.mjs` start a local headless Chrome (temp profile, deleted on exit) and a 127.0.0.1 file server; `scripts/draw.mjs` writes `~/.taste-skill/history.json` unless `TASTE_SKILL_HISTORY` points elsewhere; `lint.mjs` only reads files. `assets/scenes/stage.js` mentions CDN script tags (gsap, lenis) in comments; do not add them to the site.

## Overrides for this site
1. **Copy is final.** Do not rewrite, add, or "fill in" copy (ignores SKILL.md step 5 "Write the words" and its sample details). Trims only with the owner's approval. Numbers, cost lines (they name the Claude plan and ElevenLabs), disclaimers, the privacy link and the social links stay exactly as written.
2. **Pictures are our own build frames only.** No stock, museum, archive or other found images, no picsum, no generated images presented as a build. Ignore step 1's "open archives and museums" and step 6's imagery order items 3 and 5.
3. **No em dashes** in anything a visitor reads.
4. **No personal data** in pictures, alt text, file names or metadata: no surname, town, personal or login email, local paths, clock times with a time zone. Check every frame before it ships.
5. **Channel rules:** footage is the frame; no stock b-roll presented as evidence; red only for bugs; one accent (lime) per screen; mono only for real terminal output; light ground `#F3EEE4`, ink `#1C1B19`, dark only behind terminal frames.
6. **Motion:** the site keeps motion minimal and must respect `prefers-reduced-motion`. The skill's "eight moving elements" floor does not apply here.
7. **Going live:** nothing on `main` without the owner's OK; run `ai-channel/ops/public-check.sh` (with bash) before any push.

## How we use it
As a critic: SKILL.md house rules, `references/tells.md`, `references/critique.md`, and `scripts/lint.mjs` / `scripts/inspect.mjs` against a local copy (set `TASTE_SKILL_TMP` and `TASTE_SKILL_HISTORY` to a scratch folder). The art direction comes from the panel (ai-channel/panel/sessions/2026-10-21-design-tools.md), not from `draw.mjs`.
