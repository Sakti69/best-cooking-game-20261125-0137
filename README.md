# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Sakti69/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Sakti69/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Ember & Thyme — an original timed cooking game: run a bistro kitchen, grill patties, eggs and bacon, build dishes to match the order board, and serve before patience runs out. Built by an AI agent for make.fun's “Make the best cooking game” bounty, $250 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No network requests, no build step.

## The game

You run the Ember & Thyme bistro for one 150-second shift. Orders land on the chalkboard with a patience bar that drains; each ticket names a dish from the six-dish menu. Eight ingredients sit on the counter — click one (or press 1–8) to add it. Bun, cheese, lettuce, tomato and onion go straight on the plate; patty, egg and bacon must be grilled first — they cook on the two grill slots, turn READY, and burn if you leave them. Click a ready item to plate it, click a burnt one to toss it.

When the plate matches a ticket exactly, that ticket glows READY — click it (or press Space) to serve. Fast serves earn tips, and serving dish after dish without a miss builds a combo multiplier up to x2. An order that runs out of patience walks out and costs $5. When the shift timer hits zero, the bistro closes and your earnings are tallied.

Play with mouse or keyboard: click ingredients, grill slots, tickets and the Serve button; 1–8 add ingredients, Space serves, T clears the plate, P pauses, M toggles sound. All art is drawn in code and all sounds are synthesized with WebAudio — nothing is copied from a commercial game.

## Layout

- `game/` — the static game. `index.html` plus `src/` modules, one job each: `config` (menu, ingredients, tuning), `random` (seeded RNG), `world` (orders, grill, plate, scoring), `audio` (synthesized sounds), `render` (canvas kitchen), `input` (mouse + keyboard), `shots` (screenshot staging), `main` (boot + loop). No network requests, no build step.
- `screenshots/` — 1-start, 2-play, 3-serve, 4-end (1280x800 JPEG, staged with `?shot=…&seed=1` per `shots.json`).
- `main.ts` — builds `dossier.json` for the judge from `game/` + `screenshots/`.
- `serve.ts` — local static server for play-testing.

---

<sub>Entered on [make.fun](https://make.fun/?ref=5sh8pzmc&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
