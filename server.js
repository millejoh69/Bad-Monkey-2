import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (existsSync(path.join(__dirname, ".env"))) {
  const envText = readFileSync(path.join(__dirname, ".env"), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

const PORT = Number(process.env.PORT || 8080);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ico": "image/x-icon",
};

function classifyLocal(text = "", phase = "intro") {
  const t = text.toLowerCase();
  if (phase === "intro") {
    const aggressive = ["kill", "smash", "destroy", "die", "dead", "crush", "rip", "rage", "blood"];
    const hit = aggressive.some((w) => t.includes(w));
    return hit ? "aggressive" : "determined";
  }
  const taunt = ["haha", "lol", "weak", "easy", "cry", "loser", "clown", "joke"];
  const hit = taunt.some((w) => t.includes(w));
  return hit ? "taunt" : "angry";
}

function localMikeLine(phase, classification) {
  const taunts = [
    "Shut it. You're all noise and no power.",
    "I can hear fear in your voice already.",
    "Keep yapping. It makes crushing you easier.",
  ];
  const pick = taunts[Math.floor(Math.random() * taunts.length)];
  if (phase === "intro") {
    if (classification === "aggressive") {
      return `You've made me... furious! ${pick}`;
    }
    return `You sound determined. Good. ${pick}`;
  }
  if (classification === "taunt") return `Ha! Keep laughing. ${pick}`;
  return `Enough talk. ${pick}`;
}

async function callOpenAI(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const classification = classifyLocal(payload.playerText, payload.phase);
    return { classification, mikeLine: localMikeLine(payload.phase, classification) };
  }

  const phase = payload.phase === "phase2" ? "phase2" : "intro";
  const allowed = phase === "intro" ? "aggressive|determined" : "taunt|angry";
  const system = [
    "You are Mike, a taunting monkey boss in an arcade beat-em-up.",
    `Classify player text as one of: ${allowed}.`,
    "Return JSON only with keys: classification, mikeLine.",
    "mikeLine must be one short, hostile taunting sentence in Mike's voice, directly addressing the player's words.",
    "Prefer interruption language like 'Enough' or 'Shut it' when it fits, keep it aggressive and challenging, and reference prior banter when possible.",
    "No slurs, no hate content, no targeting protected classes.",
    "No markdown.",
  ].join(" ");

  const user = JSON.stringify({
    phase,
    mikeMode: payload.mikeMode || "normal",
    playerText: payload.playerText || "",
    exchange: payload.exchange ?? 0,
    historyUser: Array.isArray(payload.historyUser) ? payload.historyUser.slice(-4) : [],
    historyMike: Array.isArray(payload.historyMike) ? payload.historyMike.slice(-4) : [],
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${txt.slice(0, 240)}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content || "";
  const match = content.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : content);

  const classification = String(parsed.classification || "").toLowerCase();
  const mikeLine = String(parsed.mikeLine || "").trim();

  const validIntro = ["aggressive", "determined"];
  const validPhase2 = ["taunt", "angry"];
  const valid = phase === "intro" ? validIntro : validPhase2;
  const finalClass = valid.includes(classification) ? classification : classifyLocal(payload.playerText, phase);

  return {
    classification: finalClass,
    mikeLine: mikeLine || localMikeLine(phase, finalClass),
  };
}

async function parseJsonBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
}

async function parseTextBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body || "";
}

async function createRealtimeCall(sdp) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  if (!sdp || !sdp.trim()) throw new Error("Missing SDP offer");

  const realtimeModel = String(process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-mini");
  const voice = String(process.env.OPENAI_TTS_VOICE || "onyx");
  const instructions = String(
    process.env.OPENAI_REALTIME_INSTRUCTIONS ||
      "You are Mike, a furious arcade boss. Deliver lines with aggressive, angry energy, clipped rhythm, and minimal silence. Keep lines short, hostile, and challenging."
  );

  const session = JSON.stringify({
    type: "realtime",
    model: realtimeModel,
    instructions,
    audio: {
      input: {
        turn_detection: { type: "server_vad" },
      },
      output: {
        voice,
      },
    },
  });

  const fd = new FormData();
  fd.set("sdp", sdp);
  fd.set("session", session);

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: fd,
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Realtime error ${response.status}: ${txt.slice(0, 300)}`);
  }

  const answerSdp = await response.text();
  if (!answerSdp || !answerSdp.includes("v=")) {
    throw new Error("Invalid realtime SDP answer");
  }
  return answerSdp;
}

async function callOpenAITts(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const input = String(payload?.text || "").trim();
  if (!input) throw new Error("Missing text");

  const voice = String(process.env.OPENAI_TTS_VOICE || "onyx");
  const requestedModel = String(process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts");
  const model = requestedModel === "gpt-realtime-mini" ? "gpt-4o-mini-tts" : requestedModel;
  const instructions = String(
    process.env.OPENAI_TTS_INSTRUCTIONS ||
      "Furious villain voice. Fast pace, hard attacks on key words, almost no silence, and intense angry emotion."
  );

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      voice,
      input: input.slice(0, 700),
      format: "mp3",
      instructions,
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`OpenAI TTS error ${response.status}: ${txt.slice(0, 240)}`);
  }

  const audio = await response.arrayBuffer();
  return { audio };
}

async function transcribeAudio(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const audioBase64 = String(payload?.audioBase64 || "");
  if (!audioBase64) throw new Error("Missing audio payload");
  const mimeType = String(payload?.mimeType || "audio/webm");
  const model = String(process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe");

  const audioBuffer = Buffer.from(audioBase64, "base64");
  if (!audioBuffer.length) throw new Error("Empty audio payload");

  const fd = new FormData();
  const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "m4a" : "webm";
  fd.set("model", model);
  fd.set("file", new Blob([audioBuffer], { type: mimeType }), `taunt.${ext}`);

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: fd,
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`OpenAI STT error ${response.status}: ${txt.slice(0, 240)}`);
  }

  const json = await response.json();
  return String(json?.text || "").trim();
}

async function handleDialogueApi(req, res) {
  const payload = await parseJsonBody(req);

  try {
    const result = await callOpenAI(payload);
    res.writeHead(200, { "Content-Type": MIME[".json"] });
    res.end(JSON.stringify({ ok: true, result }));
  } catch (err) {
    const classification = classifyLocal(payload.playerText || "", payload.phase || "intro");
    const result = { classification, mikeLine: localMikeLine(payload.phase || "intro", classification) };
    res.writeHead(200, { "Content-Type": MIME[".json"] });
    res.end(JSON.stringify({ ok: true, result, fallback: true, error: String(err.message || err) }));
  }
}

async function handleTtsApi(req, res) {
  const payload = await parseJsonBody(req);
  try {
    const { audio } = await callOpenAITts(payload);
    res.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "Content-Length": String(audio.byteLength),
    });
    res.end(Buffer.from(audio));
  } catch (err) {
    res.writeHead(503, { "Content-Type": MIME[".json"] });
    res.end(JSON.stringify({ ok: false, error: String(err.message || err) }));
  }
}

async function handleRealtimeSessionApi(req, res) {
  const offerSdp = await parseTextBody(req);
  try {
    const answerSdp = await createRealtimeCall(offerSdp);
    res.writeHead(200, { "Content-Type": "application/sdp" });
    res.end(answerSdp);
  } catch (err) {
    res.writeHead(503, { "Content-Type": MIME[".json"] });
    res.end(JSON.stringify({ ok: false, error: String(err.message || err) }));
  }
}

async function handleTranscribeApi(req, res) {
  const payload = await parseJsonBody(req);
  try {
    const text = await transcribeAudio(payload);
    res.writeHead(200, { "Content-Type": MIME[".json"] });
    res.end(JSON.stringify({ ok: true, text }));
  } catch (err) {
    res.writeHead(503, { "Content-Type": MIME[".json"] });
    res.end(JSON.stringify({ ok: false, text: "", error: String(err.message || err) }));
  }
}

async function handleStatic(req, res) {
  const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(reqUrl.pathname);
  if (pathname === "/") pathname = "/index.html";

  const safePath = path.normalize(pathname).replace(/^\.\.(\/|\\|$)/, "");
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { "Content-Type": MIME[".json"] });
    res.end(JSON.stringify({ ok: false, error: "Forbidden" }));
    return;
  }

  let finalPath = filePath;
  if (!existsSync(finalPath)) {
    finalPath = path.join(__dirname, "index.html");
  }

  try {
    const data = await readFile(finalPath);
    const ext = path.extname(finalPath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": MIME[".json"] });
    res.end(JSON.stringify({ ok: false, error: "Not found" }));
  }
}

const server = createServer(async (req, res) => {
  if ((req.method === "POST") && req.url === "/api/mike-dialogue") {
    await handleDialogueApi(req, res);
    return;
  }
  if ((req.method === "POST") && req.url === "/api/realtime/session") {
    await handleRealtimeSessionApi(req, res);
    return;
  }
  if ((req.method === "POST") && req.url === "/api/tts") {
    await handleTtsApi(req, res);
    return;
  }
  if ((req.method === "POST") && req.url === "/api/transcribe") {
    await handleTranscribeApi(req, res);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    await handleStatic(req, res);
    return;
  }
  res.writeHead(405, { "Content-Type": MIME[".json"] });
  res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
});

server.listen(PORT, () => {
  console.log(`Bad Monkey server running at http://localhost:${PORT}`);
});
