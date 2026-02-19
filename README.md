# Bad Monkey (Intro + Level 1)

A compact browser game inspired by late-80s side-scrolling brawlers.

## Story setup
Mike (a shaved monkey) kidnaps President Ronnie's daughter. Johnny and Travis hit the streets to get her back.

## Install and play (simple)
No install is required.

1. Open Finder.
2. Go to `/Users/johnniemiller/Documents/Codex/arcade-rescue`.
3. Double-click `index.html`.
4. When the game loads, press any key once to enable audio in the browser.

Optional (if you prefer terminal launch):

1. Open Terminal.
2. Run:
   ```bash
   cd /Users/johnniemiller/Documents/Codex/arcade-rescue
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser.

## Controls
- Move: Arrow keys or WASD
- Mobile: On-screen D-pad and action buttons
- Jump: `Space`
- Attack: `J` (punch), `K` (kick), `L` (spin)
- Switch active hero: `Shift`
- Music toggle: `M`
- Restart game: `R`
- Skip intro: `Enter`

## What is included
- Cinematic opening sequence
- MP3 soundtrack switching by scene:
  - Opening scene: `02. Fist of Fury (Main BGM 1).mp3`
  - Gameplay: `05. Greased Lightning (Main BGM 2).mp3`
  - Boss (Mike): `06. Dragon Ninja (Boss).mp3`
  - Ending: `08. Ending (Japan Version).mp3`
- One playable level with enemy waves
- Two fixed enemy waves (4 enemies each), then Mike boss
- Weapon pickups (knife and chain)
- Sound effects for attacks, jump, pickups, and boss arrival
- Ending scene with crying Mike image, jumping heroes, and rolling credits

## Publish on GitHub Pages (exact steps)
1. Create a new empty GitHub repo, for example `bad-monkey`.
2. In Terminal, run:
   ```bash
   cd /Users/johnniemiller/Documents/Codex/arcade-rescue
   git init
   git add .
   git commit -m "Bad Monkey v1"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bad-monkey.git
   git push -u origin main
   ```
3. Open your repo on GitHub in browser.
4. Go to `Settings` -> `Pages`.
5. Under `Build and deployment`:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
   - Click `Save`
6. Wait about 1-2 minutes. Your game will be live at:
   - `https://YOUR_USERNAME.github.io/bad-monkey/`
7. Share that URL.
