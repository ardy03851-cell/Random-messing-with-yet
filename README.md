# Promptforge

A multiplayer, AI-generated browser game chaos platform. One person hosts a lobby, shares a 5-character code, everyone writes a one-line prompt about what they want in the game, the AI forges a playable 2-minute game from all the prompts, and you all play together.

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell, screens, settings modal |
| `styles.css` | Minimal dark UI with SVG icons |
| `app.js` | PeerJS multiplayer, OpenRouter AI, patch system, game loop |
| `favicon.svg` | Tiny logo |
| `sound.js` | Tiny client-side sound module (off by default — opt-in) |

That's it. **No build step. No server.** Just open `index.html`.

## Quick start

```bash
# any static server works. simplest:
python3 -m http.server 8080
# then open http://localhost:8080 in two tabs
```

> Direct `file://` won't work because of iframe `srcdoc` + module quirks — use a static server.

### Bring your own OpenRouter key

1. Click the ⚙ gear icon (top right).
2. Paste your `sk-or-…` key.
3. Pick a model — or click the refresh icon to fetch free models.
4. (Optional) Edit the system prompt or temperature under **Advanced**.

Keys are stored only in `localStorage`.

## How it works

### Token saver (the important bit)

- **Round 1**: full generation. Host sends all prompts to OpenRouter → gets `{html, css, meta}` for a brand-new game.
- **Round 2+**: *patch mode* (default ON). Host sends only the **previous meta** + the **new prompts** and asks the AI to return a **diff** — `{html?: <only the new script>, css?: <only new styles>, meta?: <only changes>}`.
- The host **appends** the diff to the existing game instead of replacing it.

This keeps token usage roughly proportional to *new content*, not total game size.

### Multiplayer

- Uses [PeerJS](https://peerjs.com) — peer-to-peer over WebRTC, with a free public broker for signalling.
- The lobby code is the host's PeerJS id (prefix `pf-`).
- Host is authoritative: it runs the timer, broadcasts round state, and forwards peer position messages.
- Guests render the same game; positions sync via `postMessage` between the iframe and the host page.

### Game sandbox

- The AI's output is dropped into a sandboxed `<iframe sandbox="allow-scripts allow-same-origin">`.
- We inject a tiny `window.PF` API for the AI's game code:
  ```js
  PF.selfId            // this player's id
  PF.onPlayerList(fn)  // called once with the player list
  PF.onInput(fn)       // called every frame with {id, keys}
  PF.broadcast(state)  // send game state (score, position) to other peers
  ```
- If the AI fails, we ship a built-in "Orb Collectors" fallback so the round is never lost.

## Game flow

```
home → host/join lobby → prompt phase → build phase → play (2 min) → results → loop
```

## Cool extra: sound module

`sound.js` is opt-in client-side sound effects using the Web Audio API (no asset files). To enable it, add `<script src="sound.js"></script>` before `app.js` in `index.html`, then call `window.PFSound.tick()` etc. from inside the AI game. Keep it disabled by default to avoid annoying users.

## Limitations / honest notes

- **AI game quality varies**. Some models produce tiny games with placeholders; free models especially. Try a bigger model for wilder games.
- **Multiplayer sync is best-effort**. We don't run a server, so we can't perfectly reconcile state — this is for fun, not competitive play.
- **2-minute hard cutoff** is enforced by the host only. A malicious guest can keep playing.
- **PeerJS public broker** is rate-limited. For a real launch, swap in your own PeerJS server (`new Peer(id, {host, port, path})`).

## Hacking it

- Edit `defaultSettings().systemPrompt` in `app.js` to steer the AI's game style.
- Change `120` (seconds) to any other value.
- The fallback game in `fallbackGame()` is a template you can ship as the guaranteed minimum experience.

## License

MIT — go nuts.