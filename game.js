const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const fxCanvas = document.createElement("canvas");
const fxCtx = fxCanvas.getContext("2d");

const VIRTUAL_W = 320;
const VIRTUAL_H = 180;
const FLOOR_TOP = 112;
const FLOOR_BOTTOM = 158;
const WORLD_WIDTH = 2400;

const assets = {
  johnny: new Image(),
  travis: new Image(),
  mike: new Image(),
  bodyJohnny: new Image(),
  bodyTravis: new Image(),
  bodyEnemy: new Image(),
  bodyEnemyAlt: new Image(),
  knifeSprite: new Image(),
  chainSprite: new Image(),
  startScreen: new Image(),
  introKidnap: new Image(),
  logo: new Image(),
  truck: new Image(),
  openingText: new Image(),
  city: new Image(),
  bgSkyline: new Image(),
  bgStreetFront: new Image(),
  creditsRef: new Image(),
  victoryFight: new Image(),
  victoryCongrats: new Image(),
  finalEnd: new Image(),
  gameOverScreen: new Image(),
};
assets.johnny.src = "assets/johnny.png";
assets.travis.src = "assets/travis.png";
assets.mike.src = "assets/mike.png";
assets.bodyJohnny.src = "assets/body_johnny.png";
assets.bodyTravis.src = "assets/body_travis.png";
assets.bodyEnemy.src = "assets/body_enemy.png";
assets.bodyEnemyAlt.src = "assets/body_enemy_alt.png";
assets.knifeSprite.src = "assets/knife_sprite.png";
assets.chainSprite.src = "assets/chain_sprite.png";
assets.startScreen.src = "assets/start_screen.png";
assets.introKidnap.src = "assets/intro_kidnap.png";
assets.logo.src = "assets/bad_dudes_logo.jpg";
assets.truck.src = "assets/bad_dudes_truck.jpg";
assets.openingText.src = "assets/bad_dudes_text.jpg";
assets.city.src = "assets/city_bg.webp";
assets.bgSkyline.src = "assets/bg_skyline.png";
assets.bgStreetFront.src = "assets/bg_street_front.png";
assets.creditsRef.src = "assets/credits_ref.jpeg";
assets.victoryFight.src = "assets/victory_fight.png";
assets.victoryCongrats.src = "assets/victory_congrats.png";
assets.finalEnd.src = "assets/final_end.png";
assets.gameOverScreen.src = "assets/game_over_screen.png";

const audioTracks = {
  opening: new Audio("assets/audio/opening.mp3"),
  gameplay: new Audio("assets/audio/gameplay.mp3"),
  boss: new Audio("assets/audio/boss.mp3"),
  missionComplete: new Audio("assets/audio/mission_complete.mp3"),
  ending: new Audio("assets/audio/ending.mp3"),
  gameOver: new Audio("assets/audio/game_over.mp3"),
};
for (const track of Object.values(audioTracks)) {
  track.preload = "auto";
  track.loop = true;
  track.volume = 0.75;
  track.playsInline = true;
  track.load();
}

const sfxTracks = {
  punch: new Audio("assets/audio/punch.wav"),
  playerHit: new Audio("assets/audio/player_hit.wav"),
  enemyDie: new Audio("assets/audio/enemy_die.wav"),
  knifeThrow: new Audio("assets/audio/knife_throw.wav"),
  chainUse: new Audio("assets/audio/chain_use.wav"),
  jump: new Audio("assets/audio/jump.wav"),
  congratulations: new Audio("assets/audio/congratulations.wav"),
  youLose: new Audio("assets/audio/you_lose.wav"),
};
for (const s of Object.values(sfxTracks)) {
  s.preload = "auto";
  s.volume = 0.9;
}

function playSfx(name) {
  const src = sfxTracks[name];
  if (!src) return;
  const a = src.cloneNode();
  a.volume = src.volume;
  a.play().catch(() => {});
}

const bgm = {
  current: null,
  enabled: true,
  play(name, loop = true, onEnded = null) {
    if (!this.enabled || this.current === name || !audioTracks[name]) return;
    if (this.current && audioTracks[this.current]) {
      const prev = audioTracks[this.current];
      prev.pause();
      prev.currentTime = 0;
      if (prev.__codexOnEnded) {
        prev.removeEventListener("ended", prev.__codexOnEnded);
        prev.__codexOnEnded = null;
      }
    }
    const track = audioTracks[name];
    if (track.__codexOnEnded) {
      track.removeEventListener("ended", track.__codexOnEnded);
      track.__codexOnEnded = null;
    }
    track.loop = loop;
    if (onEnded) {
      track.__codexOnEnded = () => onEnded();
      track.addEventListener("ended", track.__codexOnEnded, { once: true });
    }
    track.play().then(() => {
      this.current = name;
    }).catch(() => {
      if (this.current === name) this.current = null;
    });
  },
  stop() {
    if (this.current && audioTracks[this.current]) {
      const track = audioTracks[this.current];
      track.pause();
      track.currentTime = 0;
      if (track.__codexOnEnded) {
        track.removeEventListener("ended", track.__codexOnEnded);
        track.__codexOnEnded = null;
      }
    }
    this.current = null;
  },
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stop();
    else if (state.scene === "intro") this.play("opening");
    else if (state.scene === "level") this.play(state.bossSpawned ? "boss" : "gameplay");
    else if (state.scene === "ending") this.play("ending");
  },
};

const keys = new Set();
window.addEventListener("keydown", (e) => {
  keys.add(e.key.toLowerCase());
  if (e.key === " ") keys.add("space");
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
  if (e.key === " ") keys.delete("space");
});

const pressed = {
  j: false,
  k: false,
  l: false,
  space: false,
  m: false,
  r: false,
  shift: false,
  enter: false,
};

function setVirtualKey(key, down) {
  if (down) keys.add(key);
  else keys.delete(key);
}

for (const btn of document.querySelectorAll(".touch-btn")) {
  const key = btn.getAttribute("data-key");
  const down = (e) => {
    e.preventDefault();
    if (window.__unlockAudio) window.__unlockAudio();
    setVirtualKey(key, true);
    btn.classList.add("is-down");
  };
  const up = (e) => {
    e.preventDefault();
    setVirtualKey(key, false);
    btn.classList.remove("is-down");
  };
  btn.addEventListener("touchstart", down, { passive: false });
  btn.addEventListener("touchend", up, { passive: false });
  btn.addEventListener("touchcancel", up, { passive: false });
  btn.addEventListener("mousedown", down);
  btn.addEventListener("mouseup", up);
  btn.addEventListener("mouseleave", up);
}

canvas.addEventListener("touchstart", (e) => {
  if (window.__unlockAudio) window.__unlockAudio();
  if (state.scene === "start") {
    setVirtualKey("enter", true);
    setTimeout(() => setVirtualKey("enter", false), 80);
  }
  e.preventDefault();
}, { passive: false });
canvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

function tap(key, attr) {
  const down = keys.has(key);
  const yes = down && !pressed[attr];
  pressed[attr] = down;
  return yes;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function text(str, x, y, size = 8, color = "#fff", align = "left") {
  ctx.fillStyle = color;
  ctx.font = `${size}px monospace`;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
}

function drawPhoto(img, dx, dy, dw, dh) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
  return true;
}

function drawPhotoContain(img, boxX, boxY, boxW, boxH) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  const srcAR = img.naturalWidth / img.naturalHeight;
  const boxAR = boxW / boxH;
  let dw = boxW;
  let dh = boxH;
  if (srcAR > boxAR) dh = boxW / srcAR;
  else dw = boxH * srcAR;
  const dx = boxX + (boxW - dw) * 0.5;
  const dy = boxY + (boxH - dh) * 0.5;
  return drawPhoto(img, dx, dy, dw, dh);
}

function drawPhotoCrop(img, dx, dy, dw, dh, crop) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  const sx = Math.floor(crop.x * img.naturalWidth);
  const sy = Math.floor(crop.y * img.naturalHeight);
  const sw = Math.floor(crop.w * img.naturalWidth);
  const sh = Math.floor(crop.h * img.naturalHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, sx, sy, sw, sh, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
  return true;
}

function drawMaskedHead(img, dx, dy, dw, dh, crop) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  if (crop && crop.full) {
    return drawPhoto(img, dx, dy, dw, dh);
  }
  const mask = crop.mask || "human";
  ctx.save();
  ctx.beginPath();
  if (mask === "mike") {
    ctx.moveTo(dx + dw * 0.18, dy + dh * 0.58);
    ctx.quadraticCurveTo(dx + dw * 0.06, dy + dh * 0.36, dx + dw * 0.16, dy + dh * 0.22);
    ctx.quadraticCurveTo(dx + dw * 0.28, dy + dh * 0.04, dx + dw * 0.5, dy + dh * 0.06);
    ctx.quadraticCurveTo(dx + dw * 0.72, dy + dh * 0.04, dx + dw * 0.84, dy + dh * 0.22);
    ctx.quadraticCurveTo(dx + dw * 0.94, dy + dh * 0.36, dx + dw * 0.82, dy + dh * 0.58);
    ctx.quadraticCurveTo(dx + dw * 0.66, dy + dh * 0.96, dx + dw * 0.5, dy + dh * 0.96);
    ctx.quadraticCurveTo(dx + dw * 0.34, dy + dh * 0.96, dx + dw * 0.18, dy + dh * 0.58);
  } else {
    ctx.moveTo(dx + dw * 0.2, dy + dh * 0.5);
    ctx.quadraticCurveTo(dx + dw * 0.14, dy + dh * 0.28, dx + dw * 0.3, dy + dh * 0.14);
    ctx.quadraticCurveTo(dx + dw * 0.44, dy + dh * 0.02, dx + dw * 0.5, dy + dh * 0.04);
    ctx.quadraticCurveTo(dx + dw * 0.56, dy + dh * 0.02, dx + dw * 0.7, dy + dh * 0.14);
    ctx.quadraticCurveTo(dx + dw * 0.86, dy + dh * 0.28, dx + dw * 0.8, dy + dh * 0.5);
    ctx.quadraticCurveTo(dx + dw * 0.72, dy + dh * 0.86, dx + dw * 0.5, dy + dh * 0.92);
    ctx.quadraticCurveTo(dx + dw * 0.28, dy + dh * 0.86, dx + dw * 0.2, dy + dh * 0.5);
  }
  ctx.clip();
  drawPhotoCrop(img, dx, dy, dw, dh, crop);
  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (mask === "mike") {
    ctx.moveTo(dx + dw * 0.18, dy + dh * 0.58);
    ctx.quadraticCurveTo(dx + dw * 0.06, dy + dh * 0.36, dx + dw * 0.16, dy + dh * 0.22);
    ctx.quadraticCurveTo(dx + dw * 0.28, dy + dh * 0.04, dx + dw * 0.5, dy + dh * 0.06);
    ctx.quadraticCurveTo(dx + dw * 0.72, dy + dh * 0.04, dx + dw * 0.84, dy + dh * 0.22);
    ctx.quadraticCurveTo(dx + dw * 0.94, dy + dh * 0.36, dx + dw * 0.82, dy + dh * 0.58);
    ctx.quadraticCurveTo(dx + dw * 0.66, dy + dh * 0.96, dx + dw * 0.5, dy + dh * 0.96);
    ctx.quadraticCurveTo(dx + dw * 0.34, dy + dh * 0.96, dx + dw * 0.18, dy + dh * 0.58);
  } else {
    ctx.moveTo(dx + dw * 0.2, dy + dh * 0.5);
    ctx.quadraticCurveTo(dx + dw * 0.14, dy + dh * 0.28, dx + dw * 0.3, dy + dh * 0.14);
    ctx.quadraticCurveTo(dx + dw * 0.44, dy + dh * 0.02, dx + dw * 0.5, dy + dh * 0.04);
    ctx.quadraticCurveTo(dx + dw * 0.56, dy + dh * 0.02, dx + dw * 0.7, dy + dh * 0.14);
    ctx.quadraticCurveTo(dx + dw * 0.86, dy + dh * 0.28, dx + dw * 0.8, dy + dh * 0.5);
    ctx.quadraticCurveTo(dx + dw * 0.72, dy + dh * 0.86, dx + dw * 0.5, dy + dh * 0.92);
    ctx.quadraticCurveTo(dx + dw * 0.28, dy + dh * 0.86, dx + dw * 0.2, dy + dh * 0.5);
  }
  ctx.stroke();
  return true;
}

function drawTypewriterLines(lines, x, y, size, color, t, cps = 34) {
  const full = lines.join("\n");
  const chars = Math.floor(t * cps);
  const shown = full.slice(0, chars);
  const split = shown.split("\n");
  for (let i = 0; i < split.length; i++) {
    text(split[i], x, y + i * (size + 4), size, color);
  }
}

function shade(hex, amt) {
  const c = hex.replace("#", "");
  const r = clamp(parseInt(c.slice(0, 2), 16) + amt, 0, 255);
  const g = clamp(parseInt(c.slice(2, 4), 16) + amt, 0, 255);
  const b = clamp(parseInt(c.slice(4, 6), 16) + amt, 0, 255);
  return `rgb(${r},${g},${b})`;
}

function portraitForFighter(fighter) {
  if (fighter.kind === "mike") return assets.mike;
  if (fighter.name === "Johnny") return assets.johnny;
  if (fighter.name === "Travis") return assets.travis;
  return null;
}

function faceCropForFighter(fighter) {
  if (fighter.kind === "mike") return { full: true, mask: "mike" };
  return { full: true, mask: "human" };
}

function bodySpriteForFighter(fighter) {
  if (fighter.name === "Johnny") return assets.bodyJohnny;
  if (fighter.name === "Travis") return assets.bodyTravis;
  if (fighter.kind === "thug" && fighter.spriteVariant === "alt") return assets.bodyEnemyAlt;
  return assets.bodyEnemy;
}

class Soundtrack {
  constructor() {
    this.enabled = true;
    this.started = false;
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.leadStep = 0;
    this.padStep = 0;
    this.bassStep = 0;
    this.drumStep = 0;
    this.arpStep = 0;
    this.counterStep = 0;
    this.nextLead = 0;
    this.nextPad = 0;
    this.nextBass = 0;
    this.nextDrum = 0;
    this.nextArp = 0;
    this.nextCounter = 0;
    this.mode = "intro";
    this.bpm = 122;
    this.beat = 60 / this.bpm;
    this.introChords = [
      [57, 60, 64], // A minor
      [53, 57, 60], // F major
      [55, 59, 62], // G major
      [52, 55, 59], // E minor
    ];
    this.battleChords = [
      [57, 60, 64],
      [60, 64, 67],
      [62, 65, 69],
      [55, 59, 62],
    ];
    this.bossChords = [
      [52, 55, 59],
      [50, 53, 57],
      [48, 52, 55],
      [45, 48, 52],
    ];
    this.finalChords = [
      [45, 48, 52],
      [43, 47, 50],
      [41, 45, 48],
      [40, 43, 47],
    ];
  }

  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);

    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
  }

  unlockFromGesture() {
    this.ensure();
    if (!this.ctx) return;
    this.ctx.resume();
    if (!this.started) {
      const now = this.ctx.currentTime + 0.02;
      this.nextLead = now;
      this.nextPad = now;
      this.nextBass = now;
      this.nextDrum = now;
      this.nextArp = now;
      this.nextCounter = now;
      this.started = true;
      this.master.gain.setTargetAtTime(this.enabled ? 0.09 : 0, now, 0.05);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.ctx || !this.master) return;
    const target = this.enabled ? 0.09 : 0;
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === "intro") this.bpm = 112;
    else if (mode === "battle") this.bpm = 124;
    else if (mode === "boss") this.bpm = 118;
    else this.bpm = 138;
    this.beat = 60 / this.bpm;
  }

  playNote(freq, when, duration, type = "square", volume = 0.18, attack = 0.003, release = 0.08, detune = 0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    osc.detune.setValueAtTime(detune, when);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(type === "square" ? 1900 : 1200, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration + release);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start(when);
    osc.stop(when + duration + release + 0.02);
  }

  playKick(when) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(130, when);
    osc.frequency.exponentialRampToValueAtTime(42, when + 0.12);
    gain.gain.setValueAtTime(0.5, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(when);
    osc.stop(when + 0.18);
  }

  playSnare(when) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1500, when);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(when);
    src.stop(when + 0.13);
  }

  playHat(when) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(6200, when);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    src.connect(hp);
    hp.connect(gain);
    gain.connect(this.master);
    src.start(when);
    src.stop(when + 0.05);
  }

  playTom(when) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(190, when);
    osc.frequency.exponentialRampToValueAtTime(95, when + 0.14);
    gain.gain.setValueAtTime(0.18, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.17);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(when);
    osc.stop(when + 0.19);
  }

  update() {
    if (!this.enabled || !this.ctx || !this.started) return;
    const lookAhead = 0.1;
    const now = this.ctx.currentTime;
    const chords =
      this.mode === "final"
        ? this.finalChords
        : this.mode === "boss"
          ? this.bossChords
          : this.mode === "battle"
            ? this.battleChords
            : this.introChords;

    while (this.nextPad < now + lookAhead) {
      const chord = chords[this.padStep % chords.length];
      const when = this.nextPad;
      this.playNote(this.midiToFreq(chord[0]), when, this.beat * 1.8, "sawtooth", 0.05, 0.01, 0.35);
      this.playNote(this.midiToFreq(chord[1]), when, this.beat * 1.8, "triangle", 0.045, 0.01, 0.35);
      this.playNote(this.midiToFreq(chord[2]), when, this.beat * 1.8, "triangle", 0.04, 0.01, 0.35);
      this.nextPad += this.beat * 2;
      this.padStep += 1;
    }

    while (this.nextLead < now + lookAhead) {
      const chord = chords[this.leadStep % chords.length];
      const seq =
        this.mode === "intro"
          ? [0, 1, 2, 1]
          : this.mode === "battle"
            ? [0, 2, 1, 2]
            : this.mode === "boss"
              ? [2, 1, 0, 1]
              : [0, 0, 1, 2];
      const note = chord[seq[this.leadStep % seq.length]] + (this.mode === "boss" ? 10 : this.mode === "final" ? 14 : 0);
      const when = this.nextLead;
      this.playNote(this.midiToFreq(note + 12), when, this.beat * 0.22, "square", this.mode === "boss" ? 0.14 : 0.12, 0.002, 0.08);
      this.playNote(this.midiToFreq(note), when, this.beat * 0.2, "sawtooth", 0.06, 0.004, 0.1, 5);
      this.nextLead += this.beat * 0.5;
      this.leadStep += 1;
    }

    while (this.nextCounter < now + lookAhead) {
      const chord = chords[this.counterStep % chords.length];
      const note = chord[(this.counterStep + 1) % 3] + (this.mode === "intro" ? 0 : this.mode === "boss" ? 10 : 12);
      const when = this.nextCounter;
      this.playNote(this.midiToFreq(note), when, this.beat * 0.18, "triangle", 0.045, 0.002, 0.06);
      this.nextCounter += this.beat * (this.mode === "intro" ? 1 : this.mode === "boss" ? 0.75 : 0.5);
      this.counterStep += 1;
    }

    while (this.nextArp < now + lookAhead) {
      const chord = chords[this.arpStep % chords.length];
      const arpIdx = [0, 1, 2, 1][this.arpStep % 4];
      const note = chord[arpIdx] + 24;
      const when = this.nextArp;
      this.playNote(
        this.midiToFreq(note),
        when,
        this.beat * 0.12,
        "square",
        this.mode === "final" ? 0.09 : this.mode === "boss" ? 0.08 : 0.06,
        0.001,
        0.04
      );
      this.nextArp += this.beat * 0.25;
      this.arpStep += 1;
    }

    while (this.nextBass < now + lookAhead) {
      const chord = chords[this.bassStep % chords.length];
      const root = chord[0] - 12;
      const when = this.nextBass;
      this.playNote(this.midiToFreq(root), when, this.beat * 0.46, "sawtooth", 0.2, 0.002, 0.09);
      this.nextBass += this.beat;
      this.bassStep += 1;
    }

    while (this.nextDrum < now + lookAhead) {
      const step = this.drumStep % 8;
      const when = this.nextDrum;
      if (step === 0 || step === 4 || (this.mode !== "intro" && step === 6)) this.playKick(when);
      if (step === 2 || step === 6) this.playSnare(when);
      if (this.mode !== "intro" && (step === 3 || (this.mode === "final" && step === 7))) this.playTom(when);
      this.playHat(when + this.beat * 0.23);
      this.nextDrum += this.beat * 0.5;
      this.drumStep += 1;
    }
  }
}

const soundtrack = new Soundtrack();
let audioPrimed = false;
window.__unlockAudio = () => {
  soundtrack.unlockFromGesture();
  if (!audioPrimed) {
    audioPrimed = true;
    for (const [name, t] of Object.entries(audioTracks)) {
      if (bgm.current === name) continue;
      t.play().then(() => {
        t.pause();
        t.currentTime = 0;
      }).catch(() => {});
    }
  }
  for (const s of Object.values(sfxTracks)) {
    s.play().then(() => {
      s.pause();
      s.currentTime = 0;
    }).catch(() => {});
  }
  if (state.scene === "level") bgm.play(state.bossSpawned ? "boss" : "gameplay");
  else if (state.scene === "ending") bgm.play("ending", true);
  else if (state.scene === "gameover") bgm.play("gameOver", false);
  else bgm.play("opening");
};
window.addEventListener("keydown", () => window.__unlockAudio(), { once: true });
window.addEventListener("mousedown", () => window.__unlockAudio(), { once: true });
window.addEventListener("touchstart", () => window.__unlockAudio(), { once: true, passive: true });

const sfx = {
  punch() {
    playSfx("punch");
  },
  playerHit() {
    playSfx("playerHit");
  },
  enemyDie() {
    playSfx("enemyDie");
  },
  knifeThrow() {
    playSfx("knifeThrow");
  },
  chainUse() {
    playSfx("chainUse");
  },
  jump() {
    playSfx("jump");
  },
  congratulations() {
    playSfx("congratulations");
  },
  youLose() {
    playSfx("youLose");
  },
  pickup() {},
  bossSpawn() {},
};

class Fighter {
  constructor(opts) {
    this.name = opts.name;
    this.x = opts.x;
    this.y = opts.y;
    this.hp = opts.hp;
    this.maxHp = opts.hp;
    this.speed = opts.speed;
    this.body = opts.body;
    this.hair = opts.hair;
    this.pants = opts.pants;
    this.facing = 1;
    this.attackTimer = 0;
    this.hitTimer = 0;
    this.cooldown = 0;
    this.ai = opts.ai || false;
    this.alive = true;
    this.kind = opts.kind || "thug";
    this.anim = 0;
    this.step = 0;
    this.px = this.x;
    this.py = this.y;
    this.jumpZ = 0;
    this.jumpV = 0;
    this.weapon = null;
    this.weaponDurability = 0;
    this.deadTimer = 0;
    this.lastAttack = "punch";
    this.spriteVariant = opts.spriteVariant || "base";
  }

  laneDepth() {
    return this.y;
  }

  update(dt, state) {
    if (!this.alive) {
      this.deadTimer = Math.max(0, this.deadTimer - dt);
      return;
    }
    const sx0 = this.x;
    const sy0 = this.y;

    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.hitTimer = Math.max(0, this.hitTimer - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.hp <= 0) {
      this.alive = false;
      return;
    }

    if (this.ai) {
      const target = state.player;
      if (!target || !target.alive) return;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      this.facing = dx >= 0 ? 1 : -1;

      if (Math.abs(dy) > 4) this.y += Math.sign(dy) * this.speed * 0.6 * dt;
      if (Math.abs(dx) > 18) this.x += Math.sign(dx) * this.speed * dt;

      this.y = clamp(this.y, FLOOR_TOP, FLOOR_BOTTOM);
      this.x = clamp(this.x, 0, WORLD_WIDTH);

      if (Math.abs(dx) < 20 && Math.abs(dy) < 10 && this.cooldown <= 0 && this.jumpZ < 1) {
        this.lastAttack = "punch";
        this.attackTimer = 0.18;
        this.cooldown = this.kind === "mike" ? 0.45 : 0.85;
        target.damage(this.kind === "mike" ? 14 : 8, this.facing * 7);
      }
      return;
    }

    let vx = 0;
    let vy = 0;

    if (keys.has("arrowleft") || keys.has("a")) vx -= 1;
    if (keys.has("arrowright") || keys.has("d")) vx += 1;
    if (keys.has("arrowup") || keys.has("w")) vy -= 1;
    if (keys.has("arrowdown") || keys.has("s")) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const mag = Math.hypot(vx, vy);
      vx /= mag;
      vy /= mag;
      this.x += vx * this.speed * dt;
      this.y += vy * this.speed * 0.8 * dt;
      if (Math.abs(vx) > 0) this.facing = vx > 0 ? 1 : -1;
    }

    if (tap("space", "space") && this.jumpZ <= 0.01) {
      this.jumpV = 145;
      if (!this.ai) sfx.jump();
    }

    this.jumpV -= 420 * dt;
    this.jumpZ = Math.max(0, this.jumpZ + this.jumpV * dt);
    if (this.jumpZ === 0 && this.jumpV < 0) this.jumpV = 0;

    this.x = clamp(this.x, 0, WORLD_WIDTH);
    this.y = clamp(this.y, FLOOR_TOP, FLOOR_BOTTOM);
    const moved = Math.hypot(this.x - sx0, this.y - sy0);
    this.step += moved * 0.28;
    this.anim += dt;
    this.px = sx0;
    this.py = sy0;
  }

  attack(type, enemies, state) {
    if (!this.alive || this.cooldown > 0) return;
    this.lastAttack = type;
    if (!this.ai && type === "punch") sfx.punch();
    const hasKnife = this.weapon === "knife" && this.weaponDurability > 0;
    const hasChain = this.weapon === "chain" && this.weaponDurability > 0;
    const hitRangeBase = type === "spin" ? 30 : 22;
    const hitRange = hitRangeBase + (hasKnife ? 18 : 0) + (hasChain ? 30 : 0);
    const hitPower = (type === "kick" ? 14 : type === "spin" ? 18 : 10) + (hasKnife ? 18 : 0) + (hasChain ? 12 : 0);
    const hitY = type === "spin" ? 16 : 11;
    const aerialBoost = this.jumpZ > 2 ? 4 : 0;

    if (hasKnife && type === "kick" && state) {
      sfx.knifeThrow();
      state.projectiles.push({
        type: "knife",
        owner: this.name,
        x: this.x + this.facing * 10,
        y: this.y - 8,
        vx: this.facing * 255,
        ttl: 1.15,
        rot: 0,
      });
      this.weapon = null;
      this.weaponDurability = 0;
      this.cooldown = 0.22;
      return;
    }

    this.attackTimer = type === "spin" ? 0.25 : 0.16;
    this.cooldown = (type === "spin" ? 0.65 : 0.28) * (hasKnife ? 0.75 : hasChain ? 0.8 : 1);
    if (hasChain) sfx.chainUse();

    let didHit = false;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const front = this.facing > 0 ? enemy.x > this.x - 6 : enemy.x < this.x + 6;
      const inRange = dist(this, enemy) < hitRange && Math.abs(enemy.y - this.y) < hitY + this.jumpZ * 0.03;
      if ((type === "spin" || front || hasKnife || hasChain) && inRange) {
        enemy.damage(hitPower + aerialBoost, this.facing * (type === "spin" ? 11 : 9));
        if (hasChain) {
          enemy.cooldown = Math.max(enemy.cooldown, 0.8);
          enemy.hitTimer = 0.35;
        }
        didHit = true;
      }
    }
    if (didHit && this.weaponDurability > 0) {
      this.weaponDurability -= this.weapon === "chain" ? 1 : 2;
      if (this.weaponDurability <= 0) this.weapon = null;
    }
  }

  damage(amount, push = 0) {
    if (!this.alive) return;
    this.hp -= amount;
    if (!this.ai) sfx.playerHit();
    this.hitTimer = 0.2;
    this.x += push;
    this.x = clamp(this.x, 0, WORLD_WIDTH);
    if (this.hp <= 0) {
      this.alive = false;
      this.deadTimer = 0.45;
    }
  }

  draw(cameraX) {
    if (!this.alive && this.deadTimer <= 0) return;
    const dying = !this.alive;
    const sx = this.x - cameraX;
    const sy = this.y - this.jumpZ;
    const walk = Math.sin(this.step * 0.8) * 1.2;
    const bob = Math.sin(this.step * 1.6) * 0.8 + (this.attackTimer > 0 ? -1.6 : 0);

    const shw = 20 - Math.min(8, this.jumpZ * 0.06);
    if (dying) {
      const blink = Math.sin(this.deadTimer * 52) > 0 ? 1 : 0.45;
      ctx.save();
      ctx.globalAlpha = this.deadTimer * 2.2 * blink;
    }
    rect(sx - shw / 2, this.y - 2, shw, 4, "rgba(0,0,0,0.33)");

    const sprite = bodySpriteForFighter(this);
    const baseH = this.kind === "mike" ? 42 : this.ai ? 40 : 39;
    const jumpStretch = this.jumpZ > 0 ? -2 : 0;
    const attackLean = this.attackTimer > 0 ? this.facing * 2.5 : 0;
    const bodyH = baseH + jumpStretch;
    const bodyW = sprite && sprite.naturalWidth ? (bodyH * sprite.naturalWidth) / sprite.naturalHeight : 20;
    const bodyX = sx - bodyW / 2 + attackLean;
    const bodyY = sy - bodyH + 3 + bob + walk * 0.2;

    if (sprite && sprite.complete && sprite.naturalWidth) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      let flipBody = this.ai ? this.facing < 0 : this.facing > 0;
      if (this.ai && this.kind === "thug" && this.spriteVariant === "alt") {
        flipBody = !flipBody;
      }
      if (flipBody) {
        ctx.translate(Math.round(sx), 0);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, Math.round(-bodyW / 2 + attackLean), Math.round(bodyY), Math.round(bodyW), Math.round(bodyH));
      } else {
        ctx.drawImage(sprite, Math.round(bodyX), Math.round(bodyY), Math.round(bodyW), Math.round(bodyH));
      }
      ctx.restore();
    }

    const portrait = portraitForFighter(this);
    const hasPortrait = portrait && portrait.complete && portrait.naturalWidth;
    if (hasPortrait) {
      const crop = faceCropForFighter(this);
      const headW = this.kind === "mike" ? 18 : 16;
      const headH = this.kind === "mike" ? 15 : 14;
      const headX = sx - headW / 2 + attackLean * 0.35;
      const headY = bodyY - (this.kind === "mike" ? 1 : 2);
      drawMaskedHead(portrait, headX, headY, headW, headH, crop);
    }

    const handY = bodyY + bodyH * 0.46;
    const handX = sx + (this.facing > 0 ? bodyW * 0.23 : -bodyW * 0.23);
    if (this.attackTimer > 0) {
      const maxAttack = this.lastAttack === "spin" ? 0.25 : 0.16;
      const attackP = clamp(1 - this.attackTimer / maxAttack, 0, 1);
      const limbTone = "#f2c6a0";
      const limbDark = "#2a1a0f";
      if (this.lastAttack === "punch" || this.lastAttack === "spin") {
        const reach = 4 + Math.round(6 * attackP);
        const ay = handY - 1;
        if (this.facing > 0) {
          rect(handX, ay, reach, 2, limbDark);
          rect(handX + 1, ay, Math.max(2, reach - 1), 1, limbTone);
        } else {
          rect(handX - reach, ay, reach, 2, limbDark);
          rect(handX - reach, ay, Math.max(2, reach - 1), 1, limbTone);
        }
        if (this.lastAttack === "spin") {
          const reachB = 3 + Math.round(5 * (1 - attackP));
          if (this.facing > 0) rect(handX - reachB, ay + 1, reachB, 1, limbTone);
          else rect(handX, ay + 1, reachB, 1, limbTone);
        }
      }
      if (this.lastAttack === "kick" || this.lastAttack === "spin") {
        const legY = bodyY + bodyH - 7;
        const legReach = 4 + Math.round(7 * attackP);
        if (this.facing > 0) {
          rect(sx + 1, legY, legReach, 2, "#1f1f1f");
          rect(sx + legReach, legY, 2, 1, limbTone);
        } else {
          rect(sx - legReach - 1, legY, legReach, 2, "#1f1f1f");
          rect(sx - legReach - 2, legY, 2, 1, limbTone);
        }
      }
    }

    if (this.ai) {
      const legY = bodyY + bodyH - 6;
      const swing = Math.sin(this.step * 0.9) * 2.2;
      rect(sx - 3 + swing, legY, 2, 5, "#202020");
      rect(sx + 1 - swing, legY, 2, 5, "#202020");
      rect(sx - 3 + swing, legY + 5, 3, 1, "#d8d8d8");
      rect(sx + 1 - swing, legY + 5, 3, 1, "#d8d8d8");
      if (this.attackTimer > 0) {
        const armY = bodyY + bodyH * 0.44;
        const reach = 4 + Math.round(6 * (this.attackTimer / 0.18));
        if (this.facing > 0) rect(sx + 1, armY, reach, 2, "#f1c49d");
        else rect(sx - 1 - reach, armY, reach, 2, "#f1c49d");
      }
    }

    if (this.weapon === "knife" && this.weaponDurability > 0) {
      rect(handX + (this.facing > 0 ? 0 : -4), handY, 4, 1, "#d6dbe6");
      rect(handX + (this.facing > 0 ? -1 : 0), handY, 1, 1, "#65421f");
    } else if (this.weapon === "chain" && this.weaponDurability > 0) {
      for (let i = 0; i < 5; i++) {
        rect(handX + (this.facing > 0 ? i * 2 : -i * 2), handY + (i % 2), 1, 1, "#c0c4cf");
      }
    }
    if (dying) ctx.restore();
  }
}

const state = {
  scene: "start",
  timer: 0,
  levelElapsed: 0,
  levelTimer: 90,
  cameraX: 0,
  introIndex: 0,
  introElapsed: 0,
  activeHero: "johnny",
  heroes: {
    johnny: new Fighter({
      name: "Johnny",
      x: 110,
      y: 134,
      hp: 140,
      speed: 55,
      body: "#e4413a",
      hair: "#151515",
      pants: "#2f6bc8",
    }),
    travis: new Fighter({
      name: "Travis",
      x: 104,
      y: 140,
      hp: 140,
      speed: 57,
      body: "#2a9b5e",
      hair: "#2a1d12",
      pants: "#c8792a",
    }),
  },
  enemies: [],
  powerUps: [],
  projectiles: [],
  spawnTimer: 0,
  powerSpawnTimer: 4,
  kills: 0,
  wave: 1,
  waveActive: false,
  waveGateX: 760,
  bossSpawned: false,
  bossDefeated: false,
  endingTick: 0,
  creditsY: VIRTUAL_H + 20,
  startFade: 0,
  endingStage: "win1",
  endingStageInit: false,
  endingStageTimer: 0,
  endingFade: 0,
  gameOverInit: false,
};

const OPENING_LINES = [
  "PRESIDENT RONNIE'S DAUGHTER",
  "HAS BEEN KIDNAPPED BY MIKE.",
  "",
  "ARE JOHNNY + TRAVIS",
  "BAD ENOUGH DUDES",
  "TO RESCUE HER?",
];
const OPENING_CPS = 17;
const OPENING_HOLD = 1.4;
const OPENING_LEN = OPENING_LINES.join("\n").length / OPENING_CPS + OPENING_HOLD;

const introScenes = [
  {
    len: OPENING_LEN,
    draw(t) {
      rect(0, 0, VIRTUAL_W, VIRTUAL_H, "#040404");
      drawPhoto(assets.introKidnap, 0, 0, VIRTUAL_W, VIRTUAL_H);
      rect(0, 0, VIRTUAL_W, VIRTUAL_H, "rgba(0,0,0,0.35)");
      rect(8, 12, 206, 100, "rgba(0,0,0,0.68)");
      drawTypewriterLines(
        OPENING_LINES,
        14,
        30,
        8,
        "#f4f4f4",
        t,
        OPENING_CPS
      );
      rect(0, 149, VIRTUAL_W, 31, "rgba(0,0,0,0.75)");
      text("PRESS ENTER TO SKIP", 160, 168, 7, "#9bc2ff", "center");
    },
  },
  {
    len: 3,
    draw() {
      rect(0, 0, VIRTUAL_W, VIRTUAL_H, "#07070b");
      text("LEVEL 1: IRON DISTRICT", 160, 78, 11, "#ffd250", "center");
      text("FIND MIKE. RESCUE RONNIE'S DAUGHTER.", 160, 95, 8, "#f2f2f2", "center");
      text("FIGHT STARTS NOW.", 160, 120, 8, "#ff7f64", "center");
    },
  },
];

function getPlayer() {
  return state.heroes[state.activeHero];
}

Object.defineProperty(state, "player", {
  get() {
    return getPlayer();
  },
});

function switchHero() {
  state.activeHero = state.activeHero === "johnny" ? "travis" : "johnny";
}

function spawnEnemy() {
  const side = Math.random() > 0.5 ? 1 : -1;
  const x = side > 0 ? state.cameraX + VIRTUAL_W + 24 : state.cameraX - 24;
  state.enemies.push(
    new Fighter({
      name: "Goon",
      x: clamp(x, 0, WORLD_WIDTH),
      y: FLOOR_TOP + Math.random() * (FLOOR_BOTTOM - FLOOR_TOP),
      hp: 32,
      speed: 34 + Math.random() * 10,
      body: Math.random() > 0.5 ? "#7f48b0" : "#86552e",
      hair: "#111",
      pants: "#303030",
      ai: true,
      spriteVariant: Math.random() < 0.5 ? "alt" : "base",
    })
  );
}

function spawnWave(wave) {
  state.waveActive = true;
  const baseX = wave === 1 ? 460 : 1180;
  for (let i = 0; i < 4; i++) {
    state.enemies.push(
      new Fighter({
        name: "Goon",
        x: baseX + i * 30 + Math.random() * 24,
        y: 120 + i * 9 + Math.random() * 6,
        hp: 42,
        speed: 36 + Math.random() * 8,
        body: i % 2 ? "#416ec7" : "#7f48b0",
        hair: "#111",
        pants: "#282828",
        ai: true,
        spriteVariant: Math.random() < 0.5 ? "alt" : "base",
      })
    );
  }
}

function spawnBossMike() {
  if (state.bossSpawned) return;
  state.bossSpawned = true;
  sfx.bossSpawn();
  bgm.play("boss");
  const spawnX = clamp(state.player.x + 110, state.cameraX + VIRTUAL_W - 54, WORLD_WIDTH - 30);
  const spawnY = clamp(state.player.y + (Math.random() > 0.5 ? -8 : 8), FLOOR_TOP + 8, FLOOR_BOTTOM - 6);
  state.enemies.push(
    new Fighter({
      name: "Mike",
      x: spawnX,
      y: spawnY,
      hp: 300,
      speed: 44,
      body: "#9b9b9b",
      hair: "#efefef",
      pants: "#8d1f1f",
      ai: true,
      kind: "mike",
    })
  );
}

function spawnPowerUp() {
  const type = Math.random() > 0.5 ? "knife" : "chain";
  state.powerUps.push({
    type,
    x: clamp(state.cameraX + 60 + Math.random() * (VIRTUAL_W - 120), 20, WORLD_WIDTH - 20),
    y: FLOOR_TOP + 10 + Math.random() * (FLOOR_BOTTOM - FLOOR_TOP - 20),
    ttl: 14,
  });
}

function drawBackground(cameraX, pulse = 0) {
  rect(0, 0, VIRTUAL_W, VIRTUAL_H, "#040617");

  const drawTiledLayer = (img, y, h, speed) => {
    if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return false;
    const tileW = Math.max(2, Math.round((img.naturalWidth / img.naturalHeight) * h));
    const offset = -((cameraX * speed) % tileW);
    for (let x = offset - tileW; x < VIRTUAL_W + tileW; x += tileW) {
      drawPhoto(img, x, y, tileW, h);
    }
    return true;
  };

  if (assets.bgSkyline.complete && assets.bgSkyline.naturalWidth) {
    drawTiledLayer(assets.bgSkyline, 0, 110, 0.18);
  } else if (assets.city.complete && assets.city.naturalWidth) {
    drawTiledLayer(assets.city, 0, 110, 0.18);
  }

  rect(0, 0, VIRTUAL_W, 110, "rgba(12,16,35,0.36)");

  if (assets.bgStreetFront.complete && assets.bgStreetFront.naturalWidth) {
    drawTiledLayer(assets.bgStreetFront, 66, 92, 0.52);
    rect(0, 66, VIRTUAL_W, 92, "rgba(0,0,0,0.12)");
  }

  rect(0, 114, VIRTUAL_W, 66, "rgba(28,28,30,0.9)");
  rect(0, 116, VIRTUAL_W, 6, "rgba(59,58,61,0.9)");
  rect(0, 130, VIRTUAL_W, 2, "rgba(80,84,95,0.7)");
  rect(0, 149, VIRTUAL_W, 2, "rgba(80,84,95,0.7)");

  const stripeOffset = -((cameraX * 1.2) % 24);
  for (let x = stripeOffset; x < VIRTUAL_W; x += 24) {
    rect(x, 140, 10, 2, "#d8bf61");
  }
}

function drawUI() {
  const hero = state.player;
  rect(6, 6, 130, 14, "rgba(0,0,0,0.55)");
  rect(7, 7, 128, 12, "#1c2238");
  rect(8, 8, (hero.hp / hero.maxHp) * 126, 10, hero.hp > 40 ? "#52e28a" : "#e55757");
  text(`${hero.name.toUpperCase()} HP`, 11, 16, 7);

  rect(185, 6, 129, 14, "rgba(0,0,0,0.55)");
  rect(186, 7, 127, 12, "#2b1e2f");
  const progress = clamp(state.player.x / (WORLD_WIDTH - 150), 0, 1);
  rect(187, 8, progress * 125, 10, "#ffb347");
  text("LEVEL", 191, 16, 7, "#fff");

  text(`TIMER ${String(Math.ceil(state.levelTimer)).padStart(2, "0")}`, 160, 16, 8, "#f4f4f4", "center");
  text(`K.O. ${state.kills}`, 160, 173, 8, "#8ed3ff", "center");
  text(`MUSIC ${bgm.enabled ? "ON" : "OFF"} (M)`, 308, 16, 7, "#b6ffcf", "right");
  const weaponText = hero.weapon ? `${hero.weapon.toUpperCase()} ${hero.weaponDurability}` : "NONE";
  text(`WEAPON ${weaponText}`, 10, 26, 7, "#ffe9a8");
  const phase = state.wave <= 2 ? `WAVE ${state.wave}` : state.bossSpawned ? "BOSS" : "ADVANCE";
  text(phase, 262, 26, 7, "#ffcf9f", "right");
}

function drawCitySky(cameraX, siren = false) {
  rect(0, 0, VIRTUAL_W, VIRTUAL_H, "#0a1024");
  for (let i = 0; i < 8; i++) {
    const x = (i * 42 - (cameraX * 0.12) % 360 + 360) % 360;
    const h = 40 + (i % 4) * 14;
    rect(x, 86 - h, 26, h, "#1a2647");
    for (let j = 0; j < 5; j++) {
      if ((i + j) % 2 === 0) rect(x + 5 + j * 4, 86 - h + 8 + j * 5, 2, 2, "#ffd569");
    }
  }
  rect(0, 86, VIRTUAL_W, 94, "#20222b");

  if (siren) {
    const c = Math.sin(Date.now() * 0.012) > 0 ? "rgba(255,40,40,0.16)" : "rgba(80,120,255,0.14)";
    rect(0, 0, VIRTUAL_W, VIRTUAL_H, c);
  }
}

function drawCar(x, y, color) {
  rect(x, y, 26, 8, color);
  rect(x + 4, y - 5, 10, 5, "#a5d8ff");
  rect(x + 3, y + 6, 4, 2, "#111");
  rect(x + 19, y + 6, 4, 2, "#111");
}

function drawDaughter(x, y) {
  rect(x - 3, y - 15, 6, 8, "#f5ccb0");
  rect(x - 4, y - 7, 8, 11, "#ef7bb8");
  rect(x - 2, y - 17, 4, 2, "#c08a3a");
}

function drawMike(x, y, facing = 1) {
  rect(x - 4, y - 13, 8, 8, "#9f9f9f");
  rect(x - 5, y - 5, 10, 9, "#7e7e7e");
  rect(x - 2 + facing * 4, y - 3, 4, 2, "#f5f5f5");
  rect(x - 3, y - 15, 6, 2, "#ececec");
}

function drawNewsBackdrop() {
  rect(0, 0, VIRTUAL_W, VIRTUAL_H, "#111932");
  rect(16, 20, 180, 68, "#2b3d68");
  rect(20, 24, 172, 60, "#1e2f56");
  rect(0, 148, VIRTUAL_W, 32, "#740f18");
  rect(0, 151, VIRTUAL_W, 2, "#f24c4c");
}

function drawDojo() {
  rect(0, 0, VIRTUAL_W, VIRTUAL_H, "#130f0d");
  rect(0, 96, VIRTUAL_W, 84, "#2b2217");
  for (let i = 0; i < 12; i++) {
    rect(i * 28, 110, 2, 70, "#513f2a");
  }
  rect(10, 18, 70, 30, "#772723");
  text("DRAGON", 45, 35, 8, "#f4d089", "center");
}

function drawHeroCard(x, y, name, jacket, pants, bob = 0) {
  const y2 = y + bob * 1.5;
  rect(x - 18, y2 - 4, 36, 32, "rgba(0,0,0,0.4)");
  rect(x - 17, y2 - 3, 34, 30, "#1a2236");
  const portrait = name === "Johnny" ? assets.johnny : assets.travis;
  const hasPortrait = portrait.complete && portrait.naturalWidth;
  if (hasPortrait) {
    const crop = faceCropForFighter({ name, kind: "hero" });
    drawMaskedHead(portrait, x - 15, y2 - 1, 30, 24, crop);
  } else {
    rect(x - 4, y2 - 20, 8, 10, jacket);
    rect(x - 3, y2 - 27, 6, 7, "#d8b48f");
    rect(x - 4, y2 - 10, 8, 8, pants);
  }
  rect(x - 16, y2 + 21, 32, 5, name === "Johnny" ? "#973931" : "#2d7f52");
  text(name.toUpperCase(), x, y2 + 26, 6, "#f7f7f7", "center");
}

function drawCrtOverlay() {
  const v = ctx.createRadialGradient(160, 90, 48, 160, 90, 180);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
}

function drawIntro(dt) {
  state.introElapsed += dt;
  bgm.play("opening");

  if (tap("enter", "enter")) {
    state.introIndex = introScenes.length - 1;
    state.introElapsed = introScenes[state.introIndex].len + 0.01;
  }

  const scene = introScenes[state.introIndex];
  scene.draw(state.introElapsed);
  if (!soundtrack.started) {
    text("PRESS ANY KEY FOR AUDIO", 160, 14, 7, "#b5d8ff", "center");
  }
  drawCrtOverlay();

  if (state.introElapsed > scene.len) {
    state.introElapsed = 0;
    state.introIndex += 1;
    if (state.introIndex >= introScenes.length) {
      state.scene = "level";
      state.timer = 0;
      bgm.play("gameplay");
    }
  }
}

function drawStart(dt) {
  state.timer += dt;
  bgm.play("opening");
  rect(0, 0, VIRTUAL_W, VIRTUAL_H, "#000");
  if (assets.startScreen.complete && assets.startScreen.naturalWidth) {
    drawPhotoContain(assets.startScreen, 0, 0, VIRTUAL_W, VIRTUAL_H);
  }
  rect(0, 146, VIRTUAL_W, 34, "rgba(0,0,0,0.52)");
  if (Math.sin(state.timer * 6) > -0.15) {
    text("PRESS START", 160, 166, 12, "#ffe45f", "center");
  }
  text("ENTER / SPACE / TAP BUTTON", 160, 177, 6, "#dce7ff", "center");

  if (state.startFade <= 0 && (tap("enter", "enter") || tap("space", "space") || tap("j", "j"))) {
    state.startFade = 0.001;
  }
  if (state.startFade > 0) {
    state.startFade = Math.min(1, state.startFade + dt * 2.2);
    rect(0, 0, VIRTUAL_W, VIRTUAL_H, `rgba(0,0,0,${state.startFade})`);
  }
  if (state.startFade >= 1) {
    state.scene = "intro";
    state.introIndex = 0;
    state.introElapsed = 0;
    state.startFade = 0;
    bgm.play("opening");
  }
}

function updateLevel(dt) {
  const player = state.player;
  state.levelTimer -= dt;
  state.levelElapsed += dt;
  if (tap("shift", "shift")) {
    switchHero();
  }

  if (tap("j", "j")) player.attack("punch", state.enemies, state);
  if (tap("k", "k")) player.attack("kick", state.enemies, state);
  if (tap("l", "l")) player.attack("spin", state.enemies, state);

  player.update(dt, state);
  if (!state.bossSpawned && state.waveGateX) {
    player.x = Math.min(player.x, state.waveGateX);
  }

  state.powerSpawnTimer -= dt;
  if (state.powerSpawnTimer <= 0 && state.powerUps.length < 2) {
    spawnPowerUp();
    state.powerSpawnTimer = 5 + Math.random() * 5;
  }

  for (const pu of state.powerUps) {
    pu.ttl -= dt;
    if (dist(player, pu) < 14 && Math.abs(player.y - pu.y) < 10) {
      player.weapon = pu.type;
      player.weaponDurability = pu.type === "chain" ? 30 : 22;
      sfx.pickup();
      pu.ttl = -1;
    }
  }

  state.powerUps = state.powerUps.filter((pu) => pu.ttl > 0);

  for (const p of state.projectiles) {
    p.x += p.vx * dt;
    p.ttl -= dt;
    p.rot += dt * 18;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (d < (enemy.kind === "mike" ? 18 : 15)) {
        enemy.damage(enemy.kind === "mike" ? 34 : 50, Math.sign(p.vx) * 10);
        p.ttl = -1;
        break;
      }
    }
  }
  state.projectiles = state.projectiles.filter((p) => p.ttl > 0 && p.x > -10 && p.x < WORLD_WIDTH + 10);

  const aliveEnemies = state.enemies.filter((e) => e.alive);

  if (!state.bossSpawned && !state.waveActive) {
    if (state.wave === 1) {
      state.waveGateX = 760;
      spawnWave(1);
    } else if (state.wave === 2) {
      state.waveGateX = 1500;
      spawnWave(2);
    } else if (state.wave === 3) {
      state.waveGateX = 0;
      spawnBossMike();
    }
  }

  for (const enemy of state.enemies) {
    enemy.update(dt, state);
  }

  for (const enemy of state.enemies) {
    if (!enemy.alive && !enemy.counted) {
      enemy.counted = true;
      state.kills += 1;
      sfx.enemyDie();
      if (enemy.kind === "mike") state.bossDefeated = true;
      if (Math.random() < 0.22) {
        state.powerUps.push({
          type: Math.random() > 0.5 ? "knife" : "chain",
          x: enemy.x,
          y: enemy.y,
          ttl: 10,
        });
      }
    }
  }

  const aliveGoonsNow = state.enemies.filter((e) => e.alive && e.kind === "thug").length;
  if (!state.bossSpawned && state.waveActive && aliveGoonsNow === 0) {
    if (state.wave === 2) {
      state.wave = 3;
      state.waveActive = false;
      state.waveGateX = 0;
      spawnBossMike();
    } else {
      state.wave += 1;
      state.waveActive = false;
    }
  }

  state.enemies = state.enemies.filter((e) => e.alive || e.hitTimer > 0 || e.deadTimer > 0);

  state.cameraX = clamp(player.x - VIRTUAL_W * 0.35, 0, WORLD_WIDTH - VIRTUAL_W);

  if (!player.alive || state.levelTimer <= 0) {
    bgm.stop();
    state.scene = "gameover";
    state.gameOverInit = false;
    state.timer = 0;
  }

  if (state.bossDefeated) {
    state.scene = "ending";
    state.endingStage = "win1";
    state.endingStageInit = false;
    state.endingStageTimer = 0;
    state.endingFade = 0;
    state.creditsY = VIRTUAL_H + 22;
    bgm.stop();
  }
}

function drawLevel() {
  drawBackground(state.cameraX, (Math.sin(performance.now() * 0.01) > 0 ? 1 : 0));

  for (const pu of state.powerUps) {
    const sx = pu.x - state.cameraX;
    if (sx < -10 || sx > VIRTUAL_W + 10) continue;
    rect(sx - 5, pu.y - 2, 10, 3, "rgba(0,0,0,0.35)");
    if (pu.type === "knife") {
      rect(sx - 1, pu.y - 10, 2, 8, "#d7dde8");
      rect(sx - 2, pu.y - 2, 4, 2, "#6f4926");
    } else {
      for (let i = 0; i < 6; i++) rect(sx - 5 + i * 2, pu.y - 8 + (i % 2), 1, 1, "#c7cad4");
      rect(sx - 6, pu.y - 7, 1, 2, "#896036");
      rect(sx + 6, pu.y - 7, 1, 2, "#896036");
    }
  }

  const all = [state.heroes.johnny, state.heroes.travis, ...state.enemies]
    .filter((f) => f.alive || f.hitTimer > 0 || f.deadTimer > 0)
    .sort((a, b) => a.laneDepth() - b.laneDepth());

  for (const f of all) {
    if (f === state.heroes.johnny || f === state.heroes.travis) {
      if (f !== state.player) {
        const anchor = state.player;
        f.x = anchor.x + (f.name === "Johnny" ? -14 : 14);
        f.y = anchor.y + (f.name === "Johnny" ? 4 : -4);
      }
    }
    f.draw(state.cameraX);

    if (f.kind === "mike" && f.alive) {
      const sx = f.x - state.cameraX;
      text("MIKE", sx, f.y - 32, 7, "#ff9d9d", "center");
    }
  }

  for (const p of state.projectiles) {
    const sx = p.x - state.cameraX;
    if (sx < -12 || sx > VIRTUAL_W + 12) continue;
    const y = p.y + Math.sin(p.rot * 2) * 1.3;
    rect(sx - 3, y - 1, 6, 2, "#d8dee8");
    rect(sx - 4, y - 1, 1, 2, "#6b4421");
  }

  drawUI();

  const hero2 = state.activeHero === "johnny" ? "TRAVIS" : "JOHNNY";
  text(`ACTIVE: ${state.player.name.toUpperCase()}  (SHIFT FOR ${hero2})`, 10, 173, 7, "#d6e7ff");

  if (!state.bossSpawned && state.player.x > WORLD_WIDTH - 650) {
    text("YOU'RE CLOSE. MIKE IS AHEAD.", 160, 92, 8, "#ffd88a", "center");
  }
  text("JUMP: SPACE", 228, 173, 7, "#bcd7ff");
  drawCrtOverlay();
}

function drawEnding(dt) {
  state.endingTick += dt;
  const credits = [
    "EXECUTIVE MONKEY: SLEEVE MCDICHAEL",
    "LEAD AIRPORT NAMER: WILLIE DUSTICE",
    "CHAIN PHYSICS: JEROMY GRIDE",
    "KNIFE BALANCE: SCOTT DOUQUE",
    "CITY LIGHTING: SHAWN FURCOTTE",
    "TEARS ENGINEER: MIKE TRUK",
    "BOSS FEELINGS: TIM SANDEALE",
    "D-PAD SCIENCE: KARL DANDLETON",
    "END CREDITS: BOBSON DUGNUTT",
  ];

  if (state.endingStage === "win1") {
    drawPhoto(assets.victoryFight, 0, 0, VIRTUAL_W, VIRTUAL_H);
    if (!state.endingStageInit) {
      state.endingStageInit = true;
      bgm.play("missionComplete", false, () => {
        state.endingStage = "fadeToWin2";
        state.endingStageInit = false;
        state.endingStageTimer = 0;
        state.endingFade = 0;
      });
    }
  } else if (state.endingStage === "fadeToWin2") {
    drawPhoto(assets.victoryFight, 0, 0, VIRTUAL_W, VIRTUAL_H);
    state.endingFade = clamp(state.endingFade + dt * 3.4, 0, 1);
    rect(0, 0, VIRTUAL_W, VIRTUAL_H, `rgba(0,0,0,${state.endingFade})`);
    if (state.endingFade >= 1) {
      state.endingStage = "win2";
      state.endingStageInit = false;
      state.endingStageTimer = 0;
      state.endingFade = 1;
    }
  } else if (state.endingStage === "win2") {
    state.endingStageTimer += dt;
    drawPhoto(assets.victoryCongrats, 0, 0, VIRTUAL_W, VIRTUAL_H);
    if (state.endingFade > 0) {
      state.endingFade = clamp(state.endingFade - dt * 3.6, 0, 1);
      rect(0, 0, VIRTUAL_W, VIRTUAL_H, `rgba(0,0,0,${state.endingFade})`);
    }
    if (!state.endingStageInit) {
      state.endingStageInit = true;
      bgm.play("ending", true);
      sfx.congratulations();
    }
    const creditStart = 1.5;
    if (state.endingStageTimer >= creditStart) {
      const t = clamp((state.endingStageTimer - creditStart) / 7, 0, 1);
      const dark = 0.2 + t * 0.22;
      rect(0, 0, VIRTUAL_W, VIRTUAL_H, `rgba(0,0,0,${dark})`);
      const startY = VIRTUAL_H + 14;
      const endY = -credits.length * 11;
      const y0 = startY + (endY - startY) * t;
      for (let i = 0; i < credits.length; i++) {
        text(credits[i], 160, y0 + i * 11, 7, "#ffffff", "center");
      }
      if (t >= 1) {
        state.endingStage = "fadeToEnd";
        state.endingStageInit = false;
        state.endingFade = 0;
      }
    }
  } else if (state.endingStage === "fadeToEnd") {
    drawPhoto(assets.victoryCongrats, 0, 0, VIRTUAL_W, VIRTUAL_H);
    state.endingFade = clamp(state.endingFade + dt * 3.2, 0, 1);
    rect(0, 0, VIRTUAL_W, VIRTUAL_H, `rgba(0,0,0,${state.endingFade})`);
    if (state.endingFade >= 1) {
      state.endingStage = "theEnd";
      state.endingStageInit = true;
      state.endingFade = 0;
    }
  } else {
    drawPhoto(assets.finalEnd, 0, 0, VIRTUAL_W, VIRTUAL_H);
    text("THE END??", 160, 168, 12, "#fff4a2", "center");
    text("PRESS R TO RESTART GAMEPLAY", 160, 178, 6, "#ffffff", "center");
  }
  drawCrtOverlay();
}

function drawGameOver(dt) {
  const gameOverArt = assets.gameOverScreen.complete && assets.gameOverScreen.naturalWidth ? assets.gameOverScreen : assets.finalEnd;
  drawPhoto(gameOverArt, 0, 0, VIRTUAL_W, VIRTUAL_H);
  rect(0, 0, VIRTUAL_W, VIRTUAL_H, "rgba(0,0,0,0.2)");
  if (!state.gameOverInit) {
    state.gameOverInit = true;
    bgm.play("gameOver", false);
    sfx.youLose();
  }
  if (Math.sin(state.timer * 7) > -0.2) {
    text("Restart? Press R", 160, 170, 11, "#ffef82", "center");
  }
  state.timer += dt;
  drawCrtOverlay();
}

function resetGame() {
  bgm.stop();
  state.scene = "start";
  state.timer = 0;
  state.levelElapsed = 0;
  state.levelTimer = 90;
  state.cameraX = 0;
  state.introIndex = 0;
  state.introElapsed = 0;
  state.activeHero = "johnny";
  state.heroes.johnny = new Fighter({
    name: "Johnny",
    x: 110,
    y: 134,
    hp: 140,
    speed: 55,
    body: "#e4413a",
    hair: "#151515",
    pants: "#2f6bc8",
  });
  state.heroes.travis = new Fighter({
    name: "Travis",
    x: 104,
    y: 140,
    hp: 140,
    speed: 57,
    body: "#2a9b5e",
    hair: "#2a1d12",
    pants: "#c8792a",
  });
  state.enemies = [];
  state.powerUps = [];
  state.projectiles = [];
  state.spawnTimer = 0;
  state.powerSpawnTimer = 4;
  state.kills = 0;
  state.wave = 1;
  state.waveActive = false;
  state.waveGateX = 760;
  state.bossSpawned = false;
  state.bossDefeated = false;
  state.endingTick = 0;
  state.creditsY = VIRTUAL_H + 28;
  state.startFade = 0;
  state.endingStage = "win1";
  state.endingStageInit = false;
  state.endingStageTimer = 0;
  state.endingFade = 0;
  state.gameOverInit = false;
}

function resetToGameplay() {
  bgm.stop();
  state.scene = "level";
  state.timer = 0;
  state.levelElapsed = 0;
  state.levelTimer = 90;
  state.cameraX = 0;
  state.activeHero = "johnny";
  state.heroes.johnny = new Fighter({
    name: "Johnny",
    x: 110,
    y: 134,
    hp: 140,
    speed: 55,
    body: "#e4413a",
    hair: "#151515",
    pants: "#2f6bc8",
  });
  state.heroes.travis = new Fighter({
    name: "Travis",
    x: 104,
    y: 140,
    hp: 140,
    speed: 57,
    body: "#2a9b5e",
    hair: "#2a1d12",
    pants: "#c8792a",
  });
  state.enemies = [];
  state.powerUps = [];
  state.projectiles = [];
  state.spawnTimer = 0;
  state.powerSpawnTimer = 4;
  state.kills = 0;
  state.wave = 1;
  state.waveActive = false;
  state.waveGateX = 760;
  state.bossSpawned = false;
  state.bossDefeated = false;
  state.endingTick = 0;
  state.creditsY = VIRTUAL_H + 28;
  state.startFade = 0;
  state.endingStage = "win1";
  state.endingStageInit = false;
  state.endingStageTimer = 0;
  state.endingFade = 0;
  state.gameOverInit = false;
  bgm.play("gameplay");
}

let last = performance.now();
bgm.play("opening");
window.addEventListener("load", () => bgm.play("opening"), { once: true });

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  if (tap("m", "m")) {
    bgm.toggle();
  }
  if (tap("r", "r")) {
    if (state.scene === "gameover") resetToGameplay();
    else resetGame();
  }

  ctx.save();
  ctx.scale(canvas.width / VIRTUAL_W, canvas.height / VIRTUAL_H);
  ctx.imageSmoothingEnabled = true;

  if (state.scene === "intro") {
    drawIntro(dt);
  } else if (state.scene === "start") {
    drawStart(dt);
  } else if (state.scene === "level") {
    updateLevel(dt);
    drawLevel();
  } else if (state.scene === "ending") {
    drawEnding(dt);
  } else if (state.scene === "gameover") {
    drawGameOver(dt);
  }

  ctx.restore();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
