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
- Jump: `Space`
- Attack: `J` (punch), `K` (kick), `L` (spin)
- Switch active hero: `Shift`
- Music toggle: `M`
- Skip intro / restart after ending: `Enter`

## What is included
- Cinematic opening sequence
- Dynamic synth soundtrack (intro/battle/boss modes)
- One playable level with enemy waves
- Boss fight against Mike, then final boss phase (Mecha Mike)
- Weapon pickups (knife and chain)
- Level clear / failure states

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
