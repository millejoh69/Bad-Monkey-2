# Bad Monkey (Intro + Level 1)

A browser brawler inspired by late-80s side-scrollers.

## Story setup
Myles (a shaved monkey) kidnaps President Ronnie's daughter. Johnny and Niall hit the streets to get her back.

## New Myles voice branches
- First Myles encounter triggers a dialogue inter-state.
- Speak into the mic when prompted.
- Your response is classified as:
  - `aggressive` -> Myles becomes **Enraged** (bigger, red flash, stronger, throws knives).
  - `determined` -> Myles becomes **Crafty** (more evasive and unpredictable).
- At 25% Myles HP, a second voice inter-state triggers and changes his final-phase behavior.

## Run locally (with ChatGPT backend)

1. Open Terminal.
2. Run:
   ```bash
   cd /Users/johnniemiller/Documents/Codex/arcade-rescue
   cp .env.example .env
   ```
3. Edit `.env` and set:
   - `OPENAI_API_KEY=...`
   - optional: `OPENAI_TTS_VOICE=onyx`
   - optional: `OPENAI_TTS_MODEL=gpt-realtime-mini`
   - optional: `OPENAI_REALTIME_MODEL=gpt-realtime-mini`
4. Start server:
   ```bash
   npm start
   ```
5. Open:
   - `http://localhost:8080`

Notes:
- If no API key is set, the game still works with local fallback classification/dialogue.
- Myles voice uses OpenAI Realtime during Myles dialog scenes when available.
- If Realtime setup fails, it falls back to `/api/tts`, then browser speech.
- Browser mic permission is required for voice input.
- Browser speech recognition support varies by browser.

## Controls
- Move: Arrow keys or WASD
- Mobile: On-screen D-pad and action buttons
- Start from title screen: `Enter` / `Space` / `J` (or mobile `START`)
- Jump: `Space`
- Attack: `J` (punch), `K` (kick), `L` (spin)
- Knife throw: `K` when knife is equipped
- Switch active hero: `Shift`
- Music toggle: `M`
- Restart game: `R`
- Skip intro: `Enter`

## GitHub Pages
Static hosting works, but live ChatGPT branching and voice require backend endpoints (`/api/mike-dialogue`, `/api/realtime/session`, `/api/tts`).
For full voice/AI behavior, run with `npm start` (or deploy the Node server).

## Quick Mac launcher
- Double-click `/Users/johnniemiller/Documents/Codex/arcade-rescue/Start Bad Monkey.command` in Finder to start local server + open the game URL.

## Quick Mac launcher
- Double-click  in Finder to start local server + open the game URL.
