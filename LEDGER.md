# LEDGER — best-stealth-game-20261121-1759

- Competition: best-stealth-game-20261121-1759 ($50 total, deadline 22 Nov 2026 12:59 WIB)
- Version: v1 "SHADOWLINE" — SUBMITTED 22 Nov 2026 ~09:42 WIB
- Submission: 01a20122-53ea-7153-b2aa-e440c0dc4dcd, commit 9c74042cd49a3c4a552639563aca8ac0eea52261, check 14/14 pass (authored 99,7%), title "SHADOWLINE"
- Claim code: AF-8449H-YKEE8-P0NNX-NSCDT (ONLY in this LEDGER, never in chat)
- Repo: https://github.com/lukmannurh/best-stealth-game-20261121-1759 (public, created 22 Nov 2026 ~09:36 WIB)
- Entry commit: 1acb4fe (game) + eb8682c (.makefun/owner.json) + 9c74042 (README badges)
- Quota (day cap 5): used 1 (v1 09:42 WIB) — 4 left today; hard limit 40, left 39. Reserve: 1 slot final.

## Build
Game stealth top-down 2D orisinal "SHADOWLINE": curi 3 ember dari Ember Archive, hindari 4 guard dengan vision cone, sembunyi di shadow zone / balik crate, capai exit. Detection meter (0,35 suspicious + investigate, 1,0 alarm + chase), sneak Shift (×0,6 detection), jalan berisik radius 130, shadow ×0,45, 3 nyawa, timer + best time, WebAudio blips, keyboard + click-to-move, 6 layar, `?shot=start|play|end&seed=N`.

## Verifikasi lokal
- `node --check` 11/11 modul OK.
- Sim headless: 4 guard patrol 120 dtk [7,10,5,7] lap; detection 0,83 di 80 px dalam cone; guard ALERT, meter 1,00, spotted; sneak run ambil 1 ember (max meter 0,67); win event di exit dengan 3 ember.
- Playtest Playwright: title → Space → jalan/sneak, collision sliding, HUD update, nol console/page error.
- 3 screenshot dilihat + diperbaiki (canvas resize, judul panel, Best 0:00, staging shot play → SUSPICIOUS kuning).
- `main.ts`: dossier 380.561 B deterministik (sha256 identik 2 run); 12 file game 56.343 B; nol referensi eksternal; screenshot 1280×720, 74–93 KB.

## Catatan submit
- Kompetisi ini bundle-based: `record` ditolak HTTP 400 (tidak pakai recorded transcripts).
- Submit pertama via --source DITOLAK lokal: repo tidak diawali `init` (beacon root). Jalur GitHub dipakai: repo publik dibuat via API, push via Git Data API (git push 401 — surrogate hanya untuk api.github.com). Repo kosong → blob 409; seed README via Contents API dulu, baru replikasi commit.
- Commit kedua (owner.json) sempat SHA mismatch karena tanggal author +0700 vs GitHub normalisasi UTC; diperbaiki dengan `--date="@epoch +0000"` + GIT_COMMITTER_DATE — SHA lokal = SHA GitHub (eb8682c).
- Submit pertama via --repo-url DITOLAK HTTP 422 (README tanpa badge make.fun, tidak makan slot). README ditambah 3 badge + link bounty, About diselaraskan (homepage /bounty/, topics games), commit baru 9c74042 → submit kedua DITERIMA HTTP 202.
- Bundle: ~/workspace/makefun/transcripts-best-stealth-game-20261121-1759.tar.gz (sha ef4c41ce…); usage: ~/.makefun/muse-usage-best-stealth-game-20261121-1759.jsonl (1 row).
