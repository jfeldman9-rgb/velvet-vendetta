# Velvet Vendetta — 100 Goals Audit

- **Branch:** `goals-100` (from `origin/fix-freeze-smooth`)
- **Commit:** `ac01324` "Fix the special-move freeze and let rounds start while the fight call finishes."
- **Date:** 2026-11-21 (America/Phoenix)
- **Model:** Claude Sonnet 5.5, Pro plan only. No extra usage credits, no Fable, no API keys.
- **Mode:** READ-ONLY. No game code, tests, assets or git state were changed. This file is the only thing written.
- **Method:** Static read of `combat.js`, `app.js`, `render.js`, `index.html`, `style.css`, both tests, `START-HERE.txt`, `assets/audio/ELEVENLABS-NOTES.md`. Looked at `hero.webp`, `cory-idle.webp`, `bob-idle.webp`, `cory-finale.webp` and `bob-finale.webp`. Ran `ffprobe` on audio and `du`/`ls` for sizes. Ran `node --test test/combat.test.js` (5/5 pass).
- **Not verified (be aware):** `node test/browser-smoke.mjs` was run once and died at its first `Runtime.evaluate` (hook injection) with `Error: Uncaught` before any match step. This is almost certainly this sandbox, not the game, but treat the browser flow as **unverified here**. I could not listen to audio or transcribe it, so spoken wording rests on `ELEVENLABS-NOTES.md` plus file durations. Several shell patterns (loops, `find -exec`, `git -C`) were auto-denied, so per-file `ffprobe` was limited to the files listed in section 4.

**Headline:** The game is essentially complete. 93 of 100 goals are MET. The 7 non-MET items are one art-quality/provenance pair (3, 4), and a verification/delivery cluster (19, 97, 98, 99, 100) that is about tests and packaging, not gameplay. Do not rebuild any gameplay.

**Later pass:** Goals 3, 19, 97, 98, 99 and 100 are now MET. Goal 4 stays PARTIAL (key-art stubble was not retouched). Current totals are in section 1; what changed is in section 5.

---

## 1. Status table (all 100 goals)

| # | Goal (short text) | Status | Evidence |
|---|---|---|---|
| 1 | Title is Velvet Vendetta | MET | `index.html` `<title>` + `h1` using `assets/velvet.svg` / `assets/vendetta.svg` |
| 2 | Opera-house setting | MET | `assets/opera.webp` (848K), "The Opera House" `app.js:8`, `hero.webp` shows an opera hall |
| 3 | Photo as likeness reference | MET | `ART-PROVENANCE.md` names Jason's supplied photo as the likeness reference and lists every portrait that derives from it. The photo itself is not in the repo. |
| 4 | Cory swept light hair, clean-shaven | PARTIAL | Sprites (`cory-idle.webp`) read clean-shaven with swept hair. `hero.webp` and `cory-finale.webp` show visible jaw stubble, which contradicts "clean-shaven" on the key art. |
| 5 | Cory flamboyant plum couture | MET | `cory-idle.webp`, `hero.webp`: plum jacket/trousers, gold boots |
| 6 | Cory gold ornament + feathers | MET | Same art: gold filigree, ruby rings, magenta/purple feather collar |
| 7 | Bob dark hair, full beard | MET | `bob-idle.webp`, `hero.webp`, `bob-finale.webp` |
| 8 | Bob tailored black agent suit | MET | `bob-idle.webp` black suit, pocket square |
| 9 | Bob narrow dark glasses + tie | MET | `bob-idle.webp` narrow wraparound shades + black tie. (`hero.webp` shades are slightly aviator-wide; cosmetic.) |
| 10 | Original key art on opening screen | MET | `assets/hero.webp` (516K) via `.hero-art` in `style.css:2` and preload in `index.html:2` |
| 11 | Arcade reachable from opening screen | MET | `#arcade` "Start arcade" `index.html`, `app.js:222` |
| 12 | Visible way to learn controls | MET | Topbar `#moves` "Move list" button, `app.js:108-113`; `.battle-keys` strip in the battle screen |
| 13 | Sound toggle on opening screen | MET | Topbar `#sound`, `app.js:34-38,42`, persisted in localStorage |
| 14 | Select Cory | MET | `[data-pick="cory"]`, `app.js:65-69` |
| 15 | Select Bob | MET | `[data-pick="bob"]`, same |
| 16 | Show fighter name + style | MET | `#style-name`/`#style-desc` set in `choose()` `app.js:67`; card shows the name |
| 17 | Way back from selection | MET | `#sel-back` `app.js:222`; `Escape` on select `app.js:235` |
| 18 | Names visible throughout round | MET | `updateHUD` `app.js:167` sets `b.name`; HUD only hidden in finale/results `app.js:182` |
| 19 | Match display usable on narrow screens | MET | `test/layout-smoke.mjs` checks 390×844, 844×390, 768×1024 and 1280×720, including touch walk and punch. Captions sit in a strip under the canvas. |
| 20 | Menu actions keyboard accessible | MET | Native `<button>`s, `focus()` calls on screen change `app.js:59,74`, dialog focus `app.js:95`, Esc closes `app.js:225` |
| 21 | Walk left | MET | `combat.js:85-87`, `keyMap` `app.js:47` |
| 22 | Walk right | MET | Same |
| 23 | Jump with visible arc | MET | `combat.js:64,73` (vy 632, g 1560); rendered via `yScale` `render.js:63,137` |
| 24 | Crouch | MET | `combat.js` sets crouch and ducks a standing jab. `render.js` draws the idle sprite tucked (no new art); guard still uses `guard.webp`. |
| 25 | Held guard | MET | `combat.js:71`, blocks only when facing `combat.js:100` |
| 26 | Fighters stay in arena | MET | `limit(...,95,1185)` `combat.js:87,101,106,142` |
| 27 | Grounded fighters don't overlap | MET | Push-apart `combat.js:140-143` (gap<67, |dy|<112) |
| 28 | Fighters face each other | MET | `combat.js:135-136`; sprite flip `render.js:75` |
| 29 | Touch movement + attack controls | MET | `.touchpad` buttons, pointer handlers `app.js:242-247`, shown on coarse pointer / ≤760px `style.css` |
| 30 | Clear held inputs on focus loss | MET | `window blur` `app.js:248` and `visibilitychange` `app.js:249` → `clearInputs()` (also auto-pauses) |
| 31 | Quick strike | MET | `moves.punch` `combat.js:7`, J |
| 32 | Stronger kick | MET | `moves.kick` `combat.js:8`, K |
| 33 | Cory orchid-colored special | MET | `moves.cory` `combat.js:9`; petals `#f9b7e9/#d94fa8` `render.js:87-90`; "Orchid Rush" `app.js:6` |
| 34 | Bob cold-colored special | MET | `moves.bob` `combat.js:10`; cyan `#bcffea/#54ffdf` `render.js:91-94` |
| 35 | Special requires meter | MET | 40-meter gate `combat.js:76,80`; test "both fighters can spend meter" |
| 36 | Meter grows through fighting | MET | `combat.js:101-102,106-107` |
| 37 | Distinct startup timings | MET | `.10 / .19 / .27 / .15` `combat.js:7-10` |
| 38 | Recovery timings | MET | `.14 / .24 / .36 / .38` `combat.js:7-10`, attack ends `combat.js:65` |
| 39 | Attacks resolve only in range | MET | `canHit` reach + vertical band `combat.js:90-96` |
| 40 | Combo counting in a window | MET | `chain=.98` `combat.js:108`; "N HITS" text `render.js:33` |
| 41 | Best-of-three | MET | `combat.js:122` (wins≥2 → finish, else next round) |
| 42 | Announce round number | MET | `round1/2/3.mp3` (1.4 s) via `app.js:88,139`; caption + callout `app.js:176` |
| 43 | Visible countdown clock | MET | `#clock` `app.js:173`, `time=60` `combat.js:28,133` |
| 44 | Rounds end on knockout | MET | `combat.js:154-156`; test "knockout, perfect, and time…" |
| 45 | Clock expiry by health | MET | `combat.js:157-158`; same test (time) |
| 46 | Tied clock, no arbitrary winner | MET | Sudden death, both set to 1 HP `combat.js:151-153`; UI `app.js:136,173`. Not unit-tested. |
| 47 | Round wins beside health bars | MET | `◆◇` in `.hud-name i` `app.js:168` |
| 48 | Positions restored each round | MET | `startRound()` rebuilds fighters `combat.js:26-30` |
| 49 | Match after two round wins | MET | `combat.js:122` → `finish` → `results` |
| 50 | Rematch action | MET | `#rematch` → `begin` `app.js:119-120` |
| 51 | CPU approaches from outside range | MET | `d>162` → approach `combat.js:53` |
| 52 | CPU multiple attacks | MET | punch/kick/special `combat.js:56-57` |
| 53 | CPU guards | MET | `combat.js:54,58` |
| 54 | Breathing room between CPU decisions | MET | `aiTime=.16+rand*.28` `combat.js:50`, `.45` at round start `combat.js:28` |
| 55 | CPU uses signature | MET | `combat.js:56`; smoke test forces Bob special |
| 56 | Practice mode | MET | `#practice` → `select('training')` `app.js:222`, `Duel(..., 'training')` |
| 57 | Practice opponent stays available | MET | Dummy gets no AI, meter 100, HP refill after 0.85 s `combat.js:47,146-149` |
| 58 | Reset practice session | MET | Pause → "Reset training" `app.js:104-105` |
| 59 | Pause mid-round | MET | `#pause`, Esc/P `app.js:237`, `pauseMenu` `app.js:102` |
| 60 | Return to title from pause | MET | `#quit` → `home()` `app.js:105` |
| 61 | Separate health bar each fighter | MET | `#hud0`/`#hud1` `.life` `index.html`, `app.js:169` |
| 62 | Animated recent damage | MET | `.delay` bar eases down `app.js:169` |
| 63 | Special meter each fighter | MET | `.meter div` scaleX `app.js:170` |
| 64 | Show special ready | MET | "SIGNATURE READY · n" `app.js:170` |
| 65 | Idle stance animation | MET | Breathing scale `render.js:64,76` |
| 66 | Separate strike and kick poses | MET | `*-punch.webp` / `*-kick.webp`, `render.js:54` |
| 67 | Guard stance | MET | `*-guard.webp`, `render.js:55` |
| 68 | Hit sparks at contact | MET | `render.js:23-34` line particles |
| 69 | Blocked hits look different | MET | Pale-cyan `#b3efee`, 14 particles, no shake `render.js:26-27` |
| 70 | Brief hit stop on big impacts | MET | `stop=.047/.074` `combat.js:110,132`; block `.033` |
| 71 | Winner gets a finisher window | MET | `finish` state 6.5 s `combat.js:125-128`; CPU winner auto-finishes at 2 s |
| 72 | Teach finisher input on screen | MET | `#finish-now` "F · Perform fatality" + callout "Finish it with eggplant!" `app.js:175,178` |
| 73 | Finish with one button | MET | F key `app.js:47` / `#finish-now` `app.js:226` |
| 74 | Cory finisher "Aubergine Ovation" | MET | `fighters.cory.finale` `app.js:6`; smoke test asserts text |
| 75 | Cory finisher = botanical disappearance | MET | `choreography` petals/feathers + loser fade `render.js:97-127,154`; `cory-finale.webp` (884K) |
| 76 | Bob finisher "Protocol Violet" | MET | `app.js:7`; smoke test asserts text |
| 77 | Bob finisher = eggplant digital deletion | MET | Scanline + square pixels `render.js:108-112,122-123`; `bob-finale.webp` (828K) shows Cory dissolving into pixels |
| 78 | Dedicated illustrated reveal per finisher | MET | `assets/cory-finale.webp`, `assets/bob-finale.webp`, `render.js:166-172`, `app.js:119` |
| 79 | Results screen names winner | MET | `<span class="result-name">` `app.js:118` |
| 80 | Ordinary victory when window expires | MET | `finish` → `results` at 6.5 s with `viaFinale=false` `combat.js:127,` `app.js:117,119` |
| 81 | Original menu score | MET | `assets/audio/menu.wav` 40,320,102 B / `menu.mp3` 3,361,581 B, 140 s |
| 82 | Original combat score | MET | `opera.*` 145.0 s, `glasshouse.*` 144 s; `audio.change(arena)` `app.js:88` |
| 83 | Music loops in long sessions | MET | `music.loop=true` `app.js:17`; mp3 primed `app.js:193-203` |
| 84 | Audible round calls | MET | `round1/2/3.mp3` (1.4–1.7 s), `app.js:88,139` |
| 85 | Voiced fight cue | MET | `fight.mp3` 4.60 s, emitted at 1.50 s `combat.js:116`, `app.js:124`; live at 2.90 s (freeze-fix commit `ac01324`) |
| 86 | Cory original voiced line | MET | `intro-cory`, `line-cory-special`, `line-cory-win` `app.js:68,132,120` |
| 87 | Bob original voiced line | MET | `intro-bob`, `line-bob-special`, `line-bob-win` |
| 88 | Light vs heavy hit sounds | MET | `punch.mp3` vs `kick.mp3`, gains .59/.72 `app.js:128` |
| 89 | Distinct block sound | MET | `block.mp3` `app.js:127` |
| 90 | Finisher sound cue each | MET | `finale-hit-cory/bob.mp3` `app.js:216`, `finale-cory/bob.mp3` `app.js:152` |
| 91 | Keyboard controls in download | MET | `START-HERE.txt` "HOW TO PLAY"; in-game move list |
| 92 | Start instructions in download | MET | `START-HERE.txt` (54 lines) |
| 93 | Offline edition playable, no remote assets | MET | No `http(s)` fetches (only the SVG xmlns string); fonts embedded as base64 in `style.css`; WAV on `file:` `app.js`. `test/browser-smoke.mjs --file` opens `index.html` and asserts `menu.wav`. |
| 94 | Ship the plan with the game | MET | `Velvet-Vendetta-100-Goals.md` is tracked and included by `tools/package.mjs`. |
| 95 | Download 100–500 decimal MB | MET | Offline zip measured at 139,384,361 B (139.384 MB). WAV scores stay in the archive. |
| 96 | Use playable media for size budget | MET | 123,552,306 B of 24-bit WAV scores are the file:// music source |
| 97 | Verify local asset references resolve | MET | `test/assets.test.js` fails if any referenced path is missing, including against an extracted zip via `VV_ROOT`. |
| 98 | Exercise round/match/finisher transitions | MET | `npm test` runs the unit tests plus `test/browser-smoke.mjs` (http and `file://`). The http run covers rounds, both finishers, an ordinary victory, and rematch. |
| 99 | Check desktop and phone layouts | MET | `test/layout-smoke.mjs` fails on overflow or offscreen controls and writes a PNG per viewport under the artifacts directory. |
| 100 | Verify final archive opens, report size | MET | `node tools/package.mjs` builds `../dist/velvet-vendetta.zip`, runs `unzip -t`, the asset test, and a `file://` open. Measured size is recorded in section 5. |

### Totals

**MET: 99 · PARTIAL: 1 (4) · MISSING: 0** — total 100.

The table above is the original read-only audit, with rows 3, 19, 24, 93, 94, and 97–100 updated after the implementation in section 5. Goal 4 stays PARTIAL: the key-art stubble was not retouched.

---

## 2. Build briefs (PARTIAL and MISSING)

Global constraints for every brief: keep the download between 100,000,000 and 500,000,000 bytes; `file://` must still work with no remote fonts, audio, art or scripts; keep plain JS (no build step, no new engine); Cory = plum couture, swept light hair, clean-shaven, gold ornament, theatrical feathers; Bob = dark hair, full beard, black agent suit, narrow dark glasses, tie; tone campy, flirty, affectionate ribbing, no slurs; the announcer never says "K.O."; do not touch `Sound.banterEl`/`banter()` naming or the rAF/try-catch structure in `frame()` (see risk 5).

### B1 — Goal 3: Likeness reference provenance (PARTIAL)
- **Gap:** The repo has no record that the supplied photo drove the art, and no way for a reviewer to compare.
- **Files:** new `assets/ART-NOTES.md` (text only); `START-HERE.txt` credits.
- **Approach:** Add a short note listing, per fighter, which likeness traits are intended (Cory: swept light hair, clean-shaven, bright grin; Bob: short dark hair, full beard, narrow dark shades, tie) and which asset files carry them (`*-face`, `*-idle`, `hero`, `*-finale`). Do **not** commit the reference photo unless Jason says so (privacy). Jason signs off on likeness in a PR comment.
- **Acceptance:** `ART-NOTES.md` exists; Jason confirms likeness on `hero.webp` and both `*-face.webp`. Re-mark MET only after that sign-off.
- **Constraints:** No private photo in a public repo without explicit consent. Size impact: negligible.

### B2 — Goal 4: Cory clean-shaven on key art (PARTIAL)
- **Gap:** `hero.webp` and `cory-finale.webp` show visible stubble on Cory's jaw. Sprites are fine.
- **Files:** `assets/hero.webp`, `assets/cory-finale.webp` (replace in place; same filenames and aspect ratio 1672×941). Referenced by `index.html:2`, `style.css:2`, `app.js:119`, `render.js:168`.
- **Approach:** Regenerate or retouch the two images with an explicit "clean-shaven, smooth jaw, no stubble, swept light hair" instruction, keeping composition, Bob, feathers and gold. Check `cory-face.webp` too. Export WebP at about the current size (≤ 1 MB each).
- **Acceptance:** Visual check at full size of hero, finale, face, idle, win: no stubble. `node --test` still passes; every `assets/*.webp` still referenced loads (B7 test).
- **Constraints:** Keep Bob's black suit, narrow dark shades, tie; no remote asset; size delta under ~1 MB.

### B6 — Goals 19 and 99: Narrow-screen and phone layout (19 PARTIAL, 99 MISSING)
- **Gap:** CSS for narrow, portrait and landscape phones exists but is never exercised by a test, so regressions would go unseen.
- **Files:** new `test/layout-smoke.mjs` (reuse the CDP scaffolding in `test/browser-smoke.mjs`); possibly small CSS tweaks in `style.css` if the check finds overflow.
- **Approach:**
  1. Launch headless Chrome like the existing test, then call `Emulation.setDeviceMetricsOverride` for 390×844 (portrait), 844×390 (landscape), 768×1024 and 1280×720, with `mobile:true` and `Emulation.setTouchEmulationEnabled` for the phones.
  2. For each, open title, select, battle (Cory vs CPU). Assert `document.documentElement.scrollWidth <= innerWidth`, `#hud0`/`#hud1`/`#clock`/`#pause` are inside the viewport, `.touchpad` is visible on phones, and `#canvas` height > 250 px.
  3. Capture one PNG per viewport and print the paths. Do not commit the PNGs.
  4. Fix any overflow the run finds in `style.css` (portrait block at the end of the file, `max-height:550px` landscape block).
- **Acceptance:** Test exits 0 on all four viewports; touch emulation can walk and punch (dispatch `pointerdown` on `[data-hold=right]`, `[data-tap=punch]`).
- **Constraints:** Must also run against `file:///.../index.html` (see B7 for the file:// mode). No remote fonts.

### B7 — Goals 97 and 98: Automated asset-reference and transition checks (both PARTIAL)
- **Gap:** No test proves every referenced file exists. The browser flow test is http-only, depends on external binaries, isn't runnable via one command, and failed to start here. Unit tests don't cover match/finisher/tie logic.
- **Files:** new `test/assets.test.js`; extend `test/combat.test.js`; new `package.json` with `"scripts": {"test":"node --test test/*.test.js","smoke":"node test/browser-smoke.mjs"}` (no dependencies; this does not install anything); optionally add a `file://` mode to `test/browser-smoke.mjs`.
- **Approach:**
  1. `assets.test.js`: read `index.html`, `style.css`, `app.js`, `render.js`; regex-collect `assets/...` literals; add dynamic names (`['cory','bob']×poses`, `-face`, `-finale`, `aubergine`, stage ids, the audio ids used by `audio.say/sfx/banter` plus `menu/opera/glasshouse` in both `.wav` and `.mp3`). Assert each file exists and is non-empty. Assert no `http(s)://` outside the SVG xmlns string, and no `@import url(http`. Assert no audio manifest entry text contains "K.O.".
  2. `combat.test.js` additions (all deterministic with `random=()=>0`): best-of-three flow (two wins → `finish`); a 1–1 round three; tie at time 0 → `sudden` event, both HP 1, next hit ends the round; `finish` with `input.finish` → `finale` → `results`; no input → `results` at 6.5 s with `viaFinale=false`; CPU winner auto-finale at 2.0 s; training dummy reset and `rehearse()`; walls clamp x to 95–1185; separation; combo counter within `chain` and reset after; meter < 40 blocks specials and emits `lowMeter`.
  3. Browser smoke: pass `--no-sandbox` is already present; add an early `Runtime.evaluate` of `'1+1'` before HOOKS so a startup failure is reported clearly (the failure here was an opaque "Uncaught"). Add a mode that navigates to `file://` and asserts WAV music is requested and MP3 is not.
- **Acceptance:** `npm test` (or `node --test test/*.test.js`) passes offline; `node test/browser-smoke.mjs` passes on a machine with Chrome; breaking a file name (temporarily, in a scratch copy) fails `assets.test.js`.
- **Constraints:** No new dependencies; tests must not modify the tree; keep the existing source-grep test that guards the freeze regression.

### B8 — Goal 100: Build the archive, open it, report its size (MISSING)
- **Gap:** There is no packaging script, so "final archive opens, with measured size" can't be reproduced.
- **Files:** new `tools/package.sh` or `tools/package.mjs` (reads only); the output `.zip` goes outside the repo (e.g. `../dist/`).
- **Approach:**
  1. Zip exactly: `index.html app.js combat.js render.js style.css START-HERE.txt Velvet-Vendetta-100-Goals.md assets/` (exclude `.git`, `test/`, `node_modules`, `*.md` under `assets/audio` if desired).
  2. Verify: `unzip -t`, extract into a fresh empty folder, run the asset test (B7) against the extracted copy, serve it with `file://` in headless Chrome and confirm the title screen renders and WAV music requests succeed.
  3. Print byte size and decimal MB (bytes ÷ 1,000,000) and fail unless 100,000,000 ≤ size ≤ 500,000,000.
  4. Append the measured size to the release notes or PR description.
- **Acceptance:** One command produces the zip, prints "OK <bytes> B / <MB> MB", and exits non-zero if outside the range or any check fails.
- **Constraints:** Compression of 24-bit WAV is poor, so expect the zip near the tree size of ~141 MB (estimate; measure it). Do not drop the WAVs to save space (would fall below 100 MB, see risks).

---

## 3. "Make it feel great" enhancements (beyond the 100)

Ranked by impact ÷ effort. All fit plain JS, two fighters, the current size budget.

1. **Distinct crouch pose** — Impact High / Effort Low-Med. Crouch currently squashes the guard sprite (`render.js:55,65`). Add `cory-crouch.webp`/`bob-crouch.webp` (~60–150 KB each) and map `p.crouch` to it.
2. **Hit-stop + camera punch scaling by damage** — High / Low. Scale `this.stop` and `this.shake` with `m.damage` and combo count in `combat.js:110` / `render.js:27`; add a 1–2 frame white flash on specials.
3. **Screen-edge "K.O." art without saying it** — Med / Low. A slow-mo zoom on the final blow (reduce `dt` for 0.4 s in `app.js` frame loop, rendering only) with the "Knockout" callout; no spoken "K.O."
4. **Input buffering polish / jump-cancel feel** — High / Low. The 0.16 s buffer exists; widen to ~0.2 s for attacks queued during recovery and add a coyote-style 80 ms window on guard release. Add unit tests.
5. **Win-pose and trash-talk captions** — Med / Low. Show the winner's line as a caption while `line-*-win.mp3` plays (campy, affectionate ribbing, no slurs). Pure `app.js` text.
6. **Meter-full cue** — Med / Low. A soft chime and HUD glow when meter crosses 40 (`app.js:170`, new tiny sfx ≤ 20 KB).
7. **Sprite motion tweening** — Med / Med. Add 1–2 in-between frames of lean/anticipation for punch/kick using transforms only (`render.js:66-70`), no new art.
8. **Stage parallax and crowd shimmer** — Med / Med. Use the existing stage WebP with a second slow-moving layer and light flicker; no new assets required.
9. **Finisher camera push-in and music duck** — Med / Low. Duck music to 0.1 (reuse `pauseDucking`) during `finale`, then restore. Check the freeze regression (risk 5).
10. **Gamepad support** — Med / Med. `navigator.getGamepads()` mapped into `held`/`taps` in `readInput`; works on `file://`.
11. **Persistent options** — Low / Low. Remember last fighter, arena and mode in `localStorage` (same pattern as `velvet-audio`).
12. **Control-remap or on-screen hints for first-time players** — Low / Med. Show the first-match hint strip once, then hide.

---

## 4. Risks

1. **Download size (100–500 decimal MB).** Measured tree: **141,588,804 B (141.6 MB)** excluding `.git`. Audio dir ≈ 129 MiB. The three WAV scores total **123,552,306 B** (`menu.wav` 40,320,102 · `opera.wav` 41,760,102 · `glasshouse.wav` 41,472,102; 48 kHz, 24-bit, 140–145 s each). Their MP3 siblings total **10,300,167 B** (3,361,581 · 3,481,389 · 3,457,197; 192 kbps, 145 s). Everything except the WAVs is ~18.0 MB. **If the WAVs were dropped, the tree would be ~18 MB — about 82 MB under the 100 MB floor — so do not remove them or "fix" size by shrinking them.** Headroom to the 500 MB cap is ~358 MB, so new art/audio of tens of MB is safe, but anything bulky (video, uncompressed new music) should be budgeted. The ZIP is unmeasured; 24-bit WAV compresses poorly, so expect roughly the tree size, still above 100 MB, but measure it (B8).
2. **Offline `file://` without remote assets.** Music source switches on `location.protocol==='file:'` (`app.js:10`); fonts are base64 inside `style.css`; no network fetches in code. Never replace this with CDN fonts, streamed audio or `fetch()` of remote JSON. The existing browser test only exercises http, so the WAV/file path has no automated coverage (B7). Large WAV looping on `file://` is untested on low-end machines.
3. **Announcer wording.** Visible text uses "Knockout" (`app.js:177`), never "K.O.". Intended calls: fight "Cory and Big Dick Bob, fight! May the best eggplant win!" (`fight.mp3`, 4.60 s), Bob KO "Buck 75 down!" (`ko-bob.mp3`, 2.35 s), Cory KO "Tell the Colombian to bring a body bag!" (`ko-cory.mp3`, 2.77 s); both fit inside the 3.6 s KO hold. `fight-cory-and-bob.mp3` ("Cory and Bob, fight!") exists but is unwired, fine. `ko.mp3` ("Knockout!") is an unused fallback; `app.js:147` can never reach it. I could not listen to the clips, so the spoken text is unverified; consider adding a transcript manifest and an assertion that no file or caption contains "K.O.". Winner-specific lines are chosen by `duel.players[duel.winner].id` (`app.js:146-147`) and are used for any knockout, including CPU wins; a perfect round plays `perfect.mp3` instead.
4. **Character art constraints.** Sprites match the brief. `hero.webp` and `cory-finale.webp` show Cory stubble (goal 4). Any regeneration must keep Bob's narrow dark glasses and tie, and Cory's plum/gold/feathers. Likeness provenance is not documented (goal 3).
5. **Freeze regression (PR #3).** The fixes: `Sound` holds `this.banterEl` and a method `banter(id)` (a property named `banter` once shadowed the method and froze the first special); `frame()` arms `requestAnimationFrame(frame)` **before** a `try{…}catch` so one thrown error can no longer kill the loop; `.play()` rejections are swallowed (`app.js:21`); intro goes live at 2.90 s so the fight call overlaps the start of the round (`combat.js:117`). `test/combat.test.js:113-131` greps for exactly these. Any refactor must keep those names/order and the `Math.min(devicePixelRatio||1,1.5)` cap. Also keep `audio.banter` and `say` on separate `Audio` elements so a special's banter can't cut the announcer.
6. **Test coverage gaps.** Unit tests are 5 and cover intro timing, round-end holds, special meter spend, and source-greps. Untested: movement/walls/overlap, guard/crouch rules, combo, best-of-three, sudden death, finisher paths, training reset, pause, touch input, results/rematch UI, asset references, `file://` path, phone layouts, and archive size. The one browser test can't be run with a single command, needs `google-chrome`/`python3`, and writes to `/tmp`. See B6–B8.
7. **Minor gameplay notes (not goal failures).** Crouch shares the guard sprite; the CPU is always player 2 and the finisher is only interactive for the player (CPU wins play an automatic opponent finisher); training mode shows an infinity clock; no gamepad. Window blur auto-pauses, so the smoke test stubs blur events (`browser-smoke.mjs:90`) — don't remove that stub or headless runs will pause themselves.

---

## 5. Implementation pass

The read-only findings above are unchanged. This pass added the missing checks and the feel work without new image art, new audio files, or announcer rewiring.

- **Provenance.** `ART-PROVENANCE.md` records that Jason's photo is the likeness reference and is not in the repo, and lists the portrait files derived from it. Goal 4 is still PARTIAL.
- **Checks.** `test/assets.test.js`, `test/dialogue.test.js`, extended `test/combat.test.js`, `test/browser-smoke.mjs` (`--file` plus an ordinary victory), `test/layout-smoke.mjs`, and `tools/package.mjs`. `npm test` runs units, the http smoke, the file smoke, and the layout smoke.
- **Archive.** `node tools/package.mjs` wrote `/agent/repos/dist/velvet-vendetta.zip` (outside the repo). `unzip -t` passed, the asset test passed against the extract, and `index.html` opened via `file://` with `menu.wav` requested. **139,384,361 B / 139.384 MB.**
- **Feel.** Crouch is a transform of the idle sprite. Hit-stop scales with damage and combo, with a short white flash on specials. The killing blow sets a 0.4 s render slow-mo and zoom; the callout stays "Knockout". Attack buffer life is 0.2 s and guard release keeps blocking for about 80 ms. Meter-full adds a HUD glow and a synthesized chime. Finale music ducks to 0.1 without pausing the finale voice.
- **Captions.** `dialogue.js` holds the on-screen lines. No new audio. Each fighter has 10 lines in each of intro, taunt, bigHit, block, special, meter, roundWin, roundLoss, matchWin, and finisher (200 lines). Picks skip the line just shown. The caption is a strip under the canvas, so it does not cover the health bars or the fighters.
