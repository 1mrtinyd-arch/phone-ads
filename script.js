/* Tecno Camon 30S Pro — phone start-up ad, "built in VS Code".
   Left: code types itself. Right: the phone reacts (boot, unlock, WhatsApp, Notes, power menu). */

const $ = (s, r = document) => r.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const P = PHONES.find((p) => p.id === new URLSearchParams(location.search).get("p")) || PHONES[0];


/* ---------------- sound (synthesised, no audio files) ---------------- */
const AC = new (window.AudioContext || window.webkitAudioContext)();
let muted = false;
function tone(f, d = 0.12, type = "sine", vol = 0.08, at = 0, slide = 0) {
  if (muted || AC.state !== "running") return;
  const t = AC.currentTime + at, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.03);
}
function noise(d = 0.06, vol = 0.08, at = 0, hp = 2000) {
  if (muted || AC.state !== "running") return;
  const n = Math.floor(AC.sampleRate * d), buf = AC.createBuffer(1, n, AC.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = buf; f.type = "highpass"; f.frequency.value = hp; g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(AC.destination); src.start(AC.currentTime + at);
}
const sfx = {
  tap: () => tone(900, 0.05, "sine", 0.06),
  key: () => tone(1500 + Math.random() * 300, 0.025, "square", 0.012),
  click: () => { noise(0.03, 0.09, 0, 3000); tone(180, 0.05, "square", 0.05); },
  ding: () => { tone(1320, 0.18, "sine", 0.05); tone(1760, 0.25, "sine", 0.04, 0.08); },
  send: () => { tone(700, 0.08, "sine", 0.07); tone(1050, 0.14, "sine", 0.07, 0.06); },
  recv: () => { tone(1175, 0.1, "triangle", 0.08); tone(880, 0.2, "triangle", 0.07, 0.1); },
  unlock: () => { tone(660, 0.1, "sine", 0.07); tone(990, 0.18, "sine", 0.07, 0.09); },
  menu: () => tone(300, 0.25, "sine", 0.06, 0, 300),
  off: () => tone(500, 0.4, "sine", 0.06, 0, -350),
  shutter: () => { noise(0.05, 0.14, 0, 1500); noise(0.07, 0.1, 0.09, 800); tone(220, 0.05, "square", 0.04); },
  flap: () => tone(500, 0.09, "square", 0.03, 0, 400),
  score: () => tone(1100, 0.08, "square", 0.03),
  merge: () => tone(520, 0.07, "triangle", 0.05, 0, 260),
  outro: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.55, "sine", 0.06, i * 0.12)),
  boot: (n) => (n || [[523, .3, 0], [659, .3, .18], [784, .3, .36], [1047, .8, .54]]).forEach(([f, d, at]) => tone(f, d, "sine", 0.09, at)),
};
$("#mute").onclick = () => { muted = !muted; $("#mute").textContent = muted ? "🔇" : "🔊"; };
const waitStart = () => new Promise((res) => $("#start").addEventListener("click", () => { AC.resume(); $("#start").classList.add("hide"); res(); }, { once: true }));

const CH = P.chat || { who: "Ada", a: "A", m1: "Yo Ada, check this phone 🔥", r: "No way 😍 Who built this?", m2: "I'll show you 😎" };

/* ---------------- code snippets ---------------- */
const SNIP = {
  "boot.js": `// boot.js  ${P.name}
const phone = new Device("${P.short}");

phone.display = "${P.display}";
phone.camera  = "${P.camera}";
phone.battery = "${P.battery}";

await phone.powerOn();`,

  "unlock.css": `.lockscreen {
  background: linear-gradient(160deg, #0f2027, #2c5364);
  transition: transform .7s ease;
}

.lockscreen.unlocked {
  transform: translateY(-100%);
}`,

  "chat.html": `<div class="chat">
  <p class="out">${CH.m1}</p>
  <p class="in">${CH.r}</p>
  <p class="out">${CH.m2}</p>
</div>`,

  "notes.js": `const note = new Note();

note.title = "Hello!";
note.write("made by tinyd");
note.save();`,

  "camera.js": `const cam = new Camera("${P.cam || "50MP OIS"}");

cam.zoom(5);
cam.autoFocus();
await cam.capture();`,

  "power.js": `phone.press("power");      // screen off
phone.press("power");      // lock screen

phone.longPress("power");
menu.show(["Power off", "Restart"]);
phone.restart();`,

  "games.js": `const game = new Game("Sky Hop");

game.autoPlay = true;
game.fps      = 120;

await game.start();`,
};

const LANG = { js: "JavaScript", css: "CSS", html: "HTML" };

/* ---------------- tiny syntax highlighter ---------------- */
const RULES = {
  js: {
    re: /(\/\/.*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(const|let|new|await|true|false)\b|(\b\d+(?:\.\d+)?[a-zA-Z]*\b)|([A-Za-z_$][\w$]*)(?=\()/g,
    cls: ["c", "s", "k", "n", "f"],
  },
  css: {
    re: /(\/\*[\s\S]*?\*\/)|("[^"\n]*"|'[^'\n]*')|((?:[.#][\w-]+)+(?=\s*\{))|(@[\w-]+)|([\w-]+(?=\s*:))|(#[0-9a-fA-F]{3,8}\b|\b\d*\.?\d+(?:px|%|s|ms|deg|em|rem)?(?!\w))|([\w-]+(?=\())/g,
    cls: ["c", "s", "sel", "k", "prop", "n", "f"],
  },
  html: {
    re: /(<!--[\s\S]*?-->)|(<\/?[A-Za-z][\w-]*)|(\/?>)|([\w-]+)(?==)|("[^"]*")/g,
    cls: ["c", "tag", "tag", "attr", "s"],
  },
};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function highlight(text, lang) {
  const { re, cls } = RULES[lang];
  let out = "", last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(text))) {
    if (m[0] === "") { re.lastIndex++; continue; }
    out += esc(text.slice(last, m.index));
    const g = m.slice(1).findIndex((v) => v !== undefined);
    out += `<span class="t-${cls[g]}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(text.slice(last));
}

/* ---------------- editor ---------------- */
const codeEl = $("#code"), tabsEl = $("#tabs");

function openTab(name) {
  if (!tabsEl.querySelector(`[data-f="${name}"]`)) {
    const t = document.createElement("div");
    t.className = "tab"; t.dataset.f = name; t.textContent = name;
    tabsEl.appendChild(t);
  }
  tabsEl.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.f === name));
  document.querySelectorAll("#files li").forEach((li) => li.classList.toggle("active", li.dataset.f === name));
  $("#crumbs").textContent = "tecno-camon-30s  ›  " + name;
  $("#lang").textContent = LANG[name.split(".").pop()];
}

function render(text, lang) {
  const html = highlight(text, lang).split("\n").map((l) => `<div class="ln">${l || " "}</div>`);
  html[html.length - 1] = html[html.length - 1].replace("</div>", '<span class="caret"></span></div>');
  codeEl.innerHTML = html.join("");
}

async function code(name) {
  const text = SNIP[name], lang = name.split(".").pop();
  openTab(name);
  codeEl.innerHTML = "";
  for (let i = 1; i <= text.length; i++) {
    render(text.slice(0, i), lang); if (i % 3 === 0) sfx.key();
    await sleep(text[i - 1] === "\n" ? 90 : 15);
  }
  await sleep(250);
}

async function livePreview() {
  const live = $("#live"), toast = $("#toast");
  live.textContent = "⟳ Reloading…"; live.classList.add("busy");
  await sleep(650);
  live.classList.remove("busy"); live.textContent = "✔ Preview updated"; sfx.ding();
  toast.classList.add("show");
  await sleep(350);
  setTimeout(() => { toast.classList.remove("show"); live.textContent = "● Live Preview"; }, 1300);
}

function caption(t) {
  const c = $("#caption");
  c.classList.remove("in");
  if (!t) return;
  void c.offsetWidth;
  c.textContent = t;
  c.classList.add("in");
}

/* ---------------- phone helpers ---------------- */
const scr = $("#screen"), touch = $("#touch"), off = $("#off");
const screens = {};
["boot", "lock", "home", "whatsapp", "notes", "games", "play", "camera"].forEach((id) => (screens[id] = $("#" + id)));
const powerMenu = $("#power"), btnPower = $("#btn-power");

const clock = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
const dateStr = () => new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

function refreshTime() {
  document.querySelectorAll(".status").forEach((s) => {
    s.innerHTML = `<span>${clock()}</span><span class="st-icons"><span class="sig"><b></b><b></b><b></b><b></b></span><span>5G</span><span class="bat"><b></b></span></span>`;
  });
  $("#lock-time").textContent = clock();
  $("#home-time").textContent = clock();
  $("#lock-date").textContent = dateStr();
  $("#home-date").textContent = dateStr();
  $("#nt-date").textContent = dateStr();
}

let cur = "home";
function showOnly(...ids) {
  if (ids.length === 1) cur = ids[0];
  for (const [id, el] of Object.entries(screens)) el.classList.toggle("show", ids.includes(id));
}
function resetLock() {
  const l = screens.lock;
  l.classList.add("no-anim"); l.classList.remove("unlocked");
  $("#fp").classList.remove("scan", "ok"); $("#faceid").classList.remove("scan", "ok");
  void l.offsetWidth;
  l.classList.remove("no-anim");
}
const screenOff = async () => { off.classList.add("on"); await sleep(450); };
const screenOn = () => off.classList.remove("on");
async function pressPower(ms = 260) {
  btnPower.classList.add("pressed"); sfx.click(); await sleep(ms); btnPower.classList.remove("pressed");
}

async function bootSequence(toLock) {
  const b = screens.boot;
  b.classList.remove("play"); void b.offsetWidth;
  showOnly("boot"); b.classList.add("play"); sfx.boot(P.chime);
  await sleep(3700);
  if (toLock) { resetLock(); showOnly("lock"); await sleep(900); }
}

/* touch pointer (positions are in unscaled screen px) */
function centerOf(el) {
  const s = scr.getBoundingClientRect(), r = el.getBoundingClientRect(), k = s.width / scr.offsetWidth;
  return { x: (r.left + r.width / 2 - s.left) / k, y: (r.top + r.height / 2 - s.top) / k };
}
async function touchTo(x, y, ms = 650) {
  if (!touch.classList.contains("on")) {
    touch.style.transition = "none";
    touch.style.left = "150px"; touch.style.top = "570px";
    void touch.offsetWidth;
    touch.style.transition = "";
    touch.classList.add("on");
  }
  touch.style.left = x + "px"; touch.style.top = y + "px";
  await sleep(ms);
}
async function tap() { sfx.tap(); touch.classList.add("tap"); await sleep(330); touch.classList.remove("tap"); }
async function touchAt(el) { const c = centerOf(el); await touchTo(c.x, c.y); await tap(); }
const touchHide = () => touch.classList.remove("on");

/* ---------------- WhatsApp ---------------- */
const waBody = $("#wa-body"), waText = $("#wa-text"), waField = $("#wa-field"), waSend = $("#wa-send");

function addBubble(kind, text) {
  const d = document.createElement("div");
  d.className = "msg " + kind;
  d.innerHTML = `${text}<div class="meta">${clock()}${kind === "out" ? '<span class="tick">✓✓</span>' : ""}</div>`;
  waBody.appendChild(d);
}
function setField(t) {
  waText.textContent = t;
  waField.classList.toggle("empty", !t);
  waSend.textContent = t ? "➤" : "🎤";
}
async function sendMsg(text) {
  let cur = "";
  for (const ch of [...text]) { cur += ch; setField(cur); sfx.key(); await sleep(70); }
  await sleep(250);
  await touchAt(waSend);
  addBubble("out", text); setField(""); sfx.send();
}
async function receive(text) {
  const st = $("#wa-status");
  st.textContent = "typing…";
  const t = document.createElement("div");
  t.className = "msg in typing"; t.innerHTML = "<i></i><i></i><i></i>";
  waBody.appendChild(t);
  await sleep(1700);
  t.remove(); addBubble("in", text); st.textContent = "online"; sfx.recv();
}

/* ---------------- phone profile ---------------- */
function applyPhone() {
  const ph = $("#phone"), st = ph.style;
  st.setProperty("--frame", P.frame); st.setProperty("--r", P.r + "px"); st.setProperty("--b", P.bezel + "px");
  st.setProperty("--wall", P.wall); st.setProperty("--ink", P.ink || "#fff");
  ph.classList.add("p-" + P.punch, "ui-" + (P.ui || "tecno"));
  $("#st-name").textContent = P.name; $("#cam-badge").textContent = P.cam || "50MP OIS";
  if (P.chat) {
    $(".avatar").textContent = CH.a; $(".who b").textContent = CH.who;
    $("#lock-n").innerHTML = `<b>WhatsApp · ${CH.who}</b><br>Hey, are you free? 👀`;
  }
  if (P.ui === "ios") {
    $(".lock-hint").textContent = "Face ID · Swipe up to open";
    $("#power").innerHTML = '<div class="slide"><i>⏻</i><span>slide to power off</span></div><div class="cancel">Cancel</div>';
  }
  const bl = $(".boot-logo"); bl.textContent = P.logo; bl.style.backgroundImage = P.logoGrad;
  $(".boot-sub").textContent = P.sub;
  $(".title").textContent = `${P.id}-ad — Visual Studio Code`;
  document.title = `${P.name} — built in VS Code`;
}

/* ---------------- games (they play themselves) ---------------- */
const sky = $("#sky"), b48 = $("#b2048"), plScore = $("#pl-score");
let stopGame = () => {};

function skyHop() {
  const c = sky.getContext("2d"), W = sky.width, H = sky.height, GAP = 150;
  let y = H / 2, v = 0, score = 0, run = true, raf;
  const pipes = [{ x: W + 30, g: H / 2 }];
  const loop = () => {
    if (!run) return;
    const n = pipes.find((p) => p.x + 58 > 60) || pipes[0];
    if (y > n.g + 22 && v > 0) { v = -6.4; sfx.flap(); }
    v += 0.4; y += v;
    if (y > H - 50) v = -7;
    if (y < 20) y = 20;
    pipes.forEach((p) => (p.x -= 2.6));
    if (pipes[0].x < -60) { pipes.shift(); score++; plScore.textContent = score; sfx.score(); }
    if (pipes[pipes.length - 1].x < W - 175) pipes.push({ x: W + 30, g: 150 + Math.random() * (H - 360) });
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#4cc9f0"); bg.addColorStop(1, "#bde9ff");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.fillStyle = "#ffffffaa";
    [[40, 90, 22], [200, 150, 28], [120, 270, 20]].forEach(([x, yy, r]) => { c.beginPath(); c.arc(x, yy, r, 0, 7); c.arc(x + r, yy + 4, r * 0.8, 0, 7); c.fill(); });
    pipes.forEach((p) => {
      c.fillStyle = "#43a047"; c.fillRect(p.x, 0, 52, p.g - GAP / 2); c.fillRect(p.x, p.g + GAP / 2, 52, H);
      c.fillStyle = "#2e7d32"; c.fillRect(p.x - 4, p.g - GAP / 2 - 18, 60, 18); c.fillRect(p.x - 4, p.g + GAP / 2, 60, 18);
    });
    c.fillStyle = "#d7b56d"; c.fillRect(0, H - 34, W, 34); c.fillStyle = "#7cb342"; c.fillRect(0, H - 34, W, 8);
    c.fillStyle = "#ffd54a"; c.beginPath(); c.arc(70, y, 13, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(75, y - 4, 4, 0, 7); c.fill();
    c.fillStyle = "#222"; c.fillRect(76, y - 5, 2, 2);
    c.fillStyle = "#ff7043"; c.fillRect(80, y + 1, 9, 5);
    raf = requestAnimationFrame(loop);
  };
  loop();
  return () => { run = false; cancelAnimationFrame(raf); };
}

function game2048() {
  const COL = { 2: "#eee4da", 4: "#ede0c8", 8: "#f2b179", 16: "#f59563", 32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72", 256: "#edcc61", 512: "#edc850", 1024: "#edc53f", 2048: "#edc22e" };
  let b = Array(16).fill(0), score = 0;
  const add = () => { const e = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); if (e.length) b[e[(Math.random() * e.length) | 0]] = Math.random() < 0.9 ? 2 : 4; };
  const draw = () => {
    b48.innerHTML = b.map((v) => `<div class="t" style="background:${v ? COL[v] || "#3c3a32" : "#cdc1b4"};color:${v > 4 ? "#fff" : "#776e65"}">${v || ""}</div>`).join("");
    plScore.textContent = score;
  };
  const slide = (row) => {
    const r = row.filter(Boolean);
    for (let i = 0; i < r.length - 1; i++) if (r[i] === r[i + 1]) { r[i] *= 2; score += r[i]; r.splice(i + 1, 1); }
    while (r.length < 4) r.push(0);
    return r;
  };
  const move = (d) => { // 0 left, 1 right, 2 up, 3 down
    const nb = b.slice();
    for (let i = 0; i < 4; i++) {
      const idx = [0, 1, 2, 3].map((j) => (d < 2 ? i * 4 + j : j * 4 + i));
      let line = idx.map((k) => b[k]);
      if (d % 2) line.reverse();
      line = slide(line);
      if (d % 2) line.reverse();
      idx.forEach((k, j) => (nb[k] = line[j]));
    }
    if (nb.some((v, i) => v !== b[i])) { b = nb; add(); draw(); sfx.merge(); return true; }
    return false;
  };
  add(); add(); draw();
  const iv = setInterval(() => { for (const d of [3, 0, 1, 2]) if (move(d)) break; }, 320);
  return () => clearInterval(iv);
}

function startGame(kind) {
  stopGame();
  const isSky = kind === "sky";
  $("#pl-title").textContent = isSky ? "Sky Hop" : "2048";
  sky.style.display = isSky ? "block" : "none";
  b48.style.display = isSky ? "none" : "grid";
  plScore.textContent = "0";
  stopGame = isSky ? skyHop() : game2048();
}

async function swipeHome() {
  if (["home", "lock", "boot"].includes(cur)) return;
  const c = centerOf($(`#${cur} .nav`));
  await touchTo(c.x, c.y, 600);
  await touchTo(c.x, c.y - 190, 450);
  showOnly("home"); stopGame(); await sleep(600);
}

async function sceneGames() {
  caption("Games. Apps. Everything.");
  await code("games.js"); await livePreview();
  await swipeHome();
  await touchAt($("#app-games")); touchHide();
  showOnly("games"); await sleep(1000);
  const list = !P.game || P.game === "both" ? ["sky", "2048"] : [P.game];
  for (let i = 0; i < list.length; i++) {
    await touchAt($(list[i] === "sky" ? "#tile-sky" : "#tile-2048")); touchHide();
    startGame(list[i]); showOnly("play"); await sleep(list[i] === "sky" ? 7500 : 6500);
    if (i < list.length - 1) { await touchAt($("#play .back")); touchHide(); stopGame(); showOnly("games"); await sleep(800); }
  }
}

async function sceneCamera() {
  caption("Shoot. Zoom. Capture.");
  await code("camera.js"); await livePreview();
  await swipeHome();
  await touchAt($("#app-camera")); touchHide();
  showOnly("camera"); await sleep(1000);
  $("#cam-scene").classList.add("zoom"); $("#zoom-lbl").textContent = "5x"; await sleep(1600);
  await touchAt($("#shutter"));
  sfx.shutter(); $("#cam-flash").classList.add("go"); await sleep(150);
  $("#cam-thumb").classList.add("has"); await sleep(500);
  touchHide(); await sleep(1500);
}

/* ---------------- scenes ---------------- */
async function resetAll() {
  codeEl.innerHTML = ""; tabsEl.innerHTML = "";
  document.querySelectorAll("#files li").forEach((li) => li.classList.remove("active"));
  $("#crumbs").textContent = "tecno-camon-30s";
  waBody.innerHTML = ""; setField("");
  $("#nt-text").textContent = ""; $("#nt-saved").classList.remove("show");
  powerMenu.classList.remove("show"); $("#opt-restart").classList.remove("active");
  $("#cam-scene").classList.remove("zoom"); $("#cam-thumb").classList.remove("has"); $("#cam-flash").classList.remove("go"); $("#zoom-lbl").textContent = "1x";
  document.querySelector(".slide")?.classList.remove("go");
  stopGame(); touchHide(); resetLock(); showOnly(); off.classList.add("on");
  caption("");
  refreshTime();
  await sleep(900);
}

async function sceneBoot() {
  caption(`Code the ${P.short} — right in VS Code`);
  await code("boot.js"); await livePreview(); await sleep(300);
  await pressPower(380);
  screenOn(); await bootSequence(true);
}

async function sceneUnlock() {
  caption("Live preview. Zero setup.");
  await code("unlock.css"); await livePreview();
  showOnly("home", "lock");
  await sleep(300);
  const id = P.ui === "ios" ? $("#faceid") : $("#fp");
  if (P.ui !== "ios") await touchAt(id);
  id.classList.add("scan"); await sleep(1000);
  id.classList.remove("scan"); id.classList.add("ok"); sfx.unlock(); await sleep(450);
  touchHide();
  screens.lock.classList.add("unlocked"); await sleep(800);
  showOnly("home"); await sleep(500);
}

async function sceneChat() {
  caption("Chat. Reply. Instantly.");
  await code("chat.html"); await livePreview();
  await swipeHome();
  await touchAt($("#app-whatsapp")); touchHide();
  showOnly("whatsapp"); await sleep(900);
  await sendMsg(CH.m1);
  touchHide(); await sleep(500);
  await receive(CH.r);
  await sleep(700);
  await sendMsg(CH.m2);
  touchHide(); await sleep(900);
}

async function sceneNotes() {
  caption("Notes? Built in.");
  await code("notes.js"); await livePreview();
  await swipeHome("play");
  await touchAt($("#app-notes")); touchHide();
  showOnly("notes"); await sleep(900);
  const target = $("#nt-text");
  for (const ch of "made by tinyd") { target.textContent += ch; sfx.key(); await sleep(130); }
  await sleep(500);
  $("#nt-saved").classList.add("show");
  await sleep(1800);
}

async function scenePower() {
  caption("Power. Restart. Done.");
  await code("power.js"); await livePreview(); await sleep(400);
  await pressPower(280); await screenOff();
  resetLock(); showOnly("lock");                // prepared behind the black screen
  await sleep(1500);
  await pressPower(280); screenOn(); await sleep(1500);   // lock screen is back

  btnPower.classList.add("pressed");            // long press
  await sleep(950);
  powerMenu.classList.add("show"); sfx.menu();
  await sleep(350); btnPower.classList.remove("pressed");
  await sleep(1600);

  if (P.ui === "ios") {
    const k = $(".slide i"), c = centerOf(k);
    await touchTo(c.x, c.y); sfx.tap();
    k.parentNode.classList.add("go"); await touchTo(c.x + 190, c.y, 700); touchHide();
    await sleep(300);
    powerMenu.classList.remove("show"); showOnly(); off.classList.add("on"); sfx.off();
    await sleep(1800);
    await pressPower(1100);
  } else {
    $("#opt-restart").classList.add("active");
    await touchAt($("#opt-restart")); touchHide();
    powerMenu.classList.remove("show"); showOnly(); off.classList.add("on"); sfx.off();
    await sleep(800);
  }
  off.classList.remove("on");
  await bootSequence(false);
}

async function endCard() {
  const e = $("#endcard");
  caption("");
  e.classList.add("show"); sfx.outro();
  await sleep(4600);
  e.classList.remove("show");
  await sleep(900);
}

/* ---------------- fit phone to stage ---------------- */
function fit() {
  const st = $("#stage");
  const k = Math.min((st.clientHeight - 30) / 660, (st.clientWidth - 30) / 300);
  $("#phone").style.setProperty("--ps", Math.max(0.4, k));
}
window.addEventListener("resize", fit);

/* ---------------- run forever ---------------- */
const SC = { boot: sceneBoot, unlock: sceneUnlock, chat: sceneChat, games: sceneGames, notes: sceneNotes, power: scenePower, camera: sceneCamera };
async function main() {
  applyPhone(); fit();
  setInterval(refreshTime, 10000);
  await waitStart();
  while (true) {
    await resetAll();
    for (const k of P.order || ["boot", "unlock", "chat", "games", "notes", "power"]) await SC[k]();
    await endCard();
  }
}
main();
