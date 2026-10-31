import "./style.css";
import {
  World,
  CLASSES,
  MOB_TYPES,
  makePlayer,
  maxHp,
  maxMana,
  xpNeeded,
  SHOP,
  zone,
  safeAt,
  WORLD_SIZE,
  VILLAGES,
  terrain,
} from "./core.js";
import { Renderer } from "./render.js";
import { TINTS } from "./models.js";
import { Soundscape, TRACKS } from "./audio.js";
import { Party } from "./network.js";

const $ = (s, r = document) => r.querySelector(s),
  app = $("#app");
const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const classIds = ["mage", "samurai", "elf", "paladin"];
const symbol = {
  settings: "⚙",
  inventory: "▣",
  party: "♧",
  journal: "≡",
  map: "⌖",
};
let world = new World(),
  renderer,
  party,
  screen = "intro",
  panel = "",
  classIndex = 2,
  gender = "female",
  tint = 0,
  keys = {},
  last = 0,
  uiTime = 0,
  saveTime = 0,
  lastFocus,
  selectedName = "",
  saved = null;
let pendingRoom = new URLSearchParams(location.search).get("room"),
  netStatus = "Bis zu vier Gefährten. Eine gemeinsame Welt.";
const seen = new Set(),
  sound = new Soundscape();
let settings = {
  volume: 0.45,
  music: true,
  track: "auto",
  motion: !matchMedia("(prefers-reduced-motion: reduce)").matches,
  cycle: true,
  zoom: 1.25,
  density: 3.5,
  keys: {
    up: "w",
    down: "s",
    left: "a",
    right: "d",
    interact: "e",
    gather: "g",
    potion: "q",
    inventory: "i",
    journal: "j",
    party: "p",
    map: "m",
  },
};
try {
  settings = {
    ...settings,
    ...JSON.parse(localStorage.getItem("egox-settings-v2") || "{}"),
  };
  const raw = JSON.parse(
    localStorage.getItem("egox-save-v2") ||
      localStorage.getItem("egox-save-v1") ||
      "null",
  );
  if (
    raw?.player &&
    CLASSES[raw.player.kind] &&
    Number.isFinite(raw.player.x) &&
    Array.isArray(raw.player.inventory)
  )
    saved = raw;
} catch {}
sound.volume = settings.volume;
sound.music = settings.music;
sound.trackMode = settings.track;
function player() {
  return world.players.get(party?.playerId || "local");
}
function persist() {
  try {
    localStorage.setItem("egox-settings-v2", JSON.stringify(settings));
  } catch {}
}
function makeParty() {
  party = new Party(world, (message) => {
    netStatus = message;
    toast(message);
    if (
      screen === "game" &&
      party.mode === "solo" &&
      !world.players.has("local")
    )
      restore();
    if (panel === "party") renderPanel();
  });
}
makeParty();
function brand() {
  return '<span class="wordmark">EGO<span>X</span><small>ASCII REALMS</small></span>';
}
function toast(text) {
  const root = $("#toasts");
  if (!root) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  root.appendChild(el);
  while (root.children.length > 3) root.firstChild.remove();
  setTimeout(() => el.remove(), 4600);
}
function rendererSettings() {
  renderer.motion = settings.motion;
  renderer.cycle = settings.cycle;
  renderer.zoom = settings.zoom;
  if (renderer.cellSize !== settings.density) {
    renderer.cellSize = settings.density;
    renderer.resize();
  }
}

function intro() {
  app.innerHTML = `<section class="intro"><header>${brand()}<a href="https://discord.gg/ego-x" target="_blank" rel="noopener noreferrer">DISCORD ↗</a></header><canvas id="intro-canvas" aria-label="Animiertes EGOIST-Intro in ASCII"></canvas><div class="intro-title"><span class="eyebrow">A WORLD WRITTEN IN CHARACTERS</span><h1>Die Welt wartet.</h1><button class="primary" id="begin-intro">Mit Ton beginnen <span>↗</span></button><p id="loading-label">Intro & Musik starten nach deinem Klick.</p><div class="loading-track"><i></i></div></div><footer><span>EGOX · REALMS REBORN</span><button id="skip-intro">Überspringen →</button></footer></section><div id="toasts" aria-live="polite"></div>`;
  const canvas = $("#intro-canvas"),
    ctx = canvas.getContext("2d"),
    sample = document.createElement("canvas"),
    sc = sample.getContext("2d", { willReadFrequently: true });
  sample.width = 220;
  sample.height = 62;
  const video = document.createElement("video");
  video.src = `${import.meta.env.BASE_URL}assets/intro.mp4`;
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  let ended = false,
    frame,
    mouth = false,
    started = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(frame);
    video.pause();
    video.removeAttribute("src");
    video.load();
    selection();
  };
  const draw = () => {
    if (ended) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.fillStyle = "#07090d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (video.readyState >= 2) {
      sc.drawImage(video, 0, 0, 220, 62);
      const data = sc.getImageData(0, 0, 220, 62).data,
        size = Math.min(canvas.width / 220, canvas.height / 124),
        left = (canvas.width - size * 220) / 2,
        top = (canvas.height - size * 124) / 2;
      ctx.font = `bold ${size * 1.8}px monospace`;
      const chars = " .,:;=+*#%@",
        tick = Math.floor(video.currentTime * 15);
      for (let y = 0; y < 62; y++)
        for (let x = 0; x < 220; x++) {
          const i = (y * 220 + x) * 4,
            l = (data[i] + data[i + 1] + data[i + 2]) / 765;
          if (l < 0.05) continue;
          const index = Math.min(
            10,
            Math.floor(l * 9) + ((x + y + tick) % 3 === 0 ? 1 : 0),
          );
          ctx.fillStyle = `rgb(${Math.round(120 + l * 130)},${Math.round(130 + l * 120)},${Math.round(145 + l * 110)})`;
          ctx.fillText(chars[index], left + x * size, top + y * size * 2);
        }
      if (started && video.currentTime >= 1.75 && !mouth) {
        mouth = true;
        sound.play("mouth");
      }
    }
    frame = requestAnimationFrame(draw);
  };
  $("#begin-intro").onclick = () => {
    if (started) return;
    started = true;
    sound.start();
    sound.setTrack("elise");
    $("#begin-intro").hidden = true;
    $("#loading-label").textContent = "Die Zeichen erwachen …";
    $(".loading-track").classList.add("active");
    video.play().catch(finish);
    setTimeout(finish, 7000);
  };
  $("#skip-intro").onclick = () => {
    sound.start();
    sound.setTrack("elise");
    finish();
  };
  video.onended = () => setTimeout(finish, 350);
  video.onerror = finish;
  video.addEventListener("loadeddata", draw, { once: true });
}
function selection() {
  renderer?.dispose();
  screen = "selection";
  panel = "";
  keys = {};
  world = new World();
  world.weather = "clear";
  makeParty();
  app.innerHTML = `<section class="creation"><header>${brand()}<span class="chapter">01 / WÄHLE DEINEN WEG</span><a href="https://discord.gg/ego-x" target="_blank" rel="noopener noreferrer">DISCORD ↗</a></header><div class="creation-title"><span class="eyebrow">DEINE GESCHICHTE HAT EINEN ANFANG.</span><h1>Wähle deinen Weg.</h1></div><canvas id="character-canvas" aria-label="Drehbares animiertes 3D-Charaktermodell im ASCII-Stil"></canvas><div class="character-orbit"><span>MODELL / <b id="model-number">03</b></span><i></i><span>← SWIPE →</span></div><div class="carousel"><button id="prev-class" aria-label="Vorherige Klasse">←</button><div><span id="class-counter">03 / 04</span><h2 id="class-name">Elf</h2></div><button id="next-class" aria-label="Nächste Klasse">→</button></div><div class="class-dots" aria-label="Klasse auswählen">${classIds.map((id, i) => `<button data-class="${i}" aria-label="${CLASSES[id].name}"></button>`).join("")}</div><section class="creation-details"><span id="class-role" class="eyebrow"></span><h2 id="class-title"></h2><p id="class-desc"></p><div class="character-stats" id="class-stats"></div><label class="field-label">GESTALT</label><div class="segmented"><button data-gender="female">Weiblich</button><button data-gender="male">Männlich</button></div><label class="field-label">FARBVARIANTE</label><div class="swatches">${TINTS.map((color, i) => `<button data-tint="${i}" aria-label="Farbvariante ${i + 1}" style="--swatch:${color}"></button>`).join("")}</div><form id="character-form"><label for="character-name" class="field-label">DEIN NAME</label><input id="character-name" minlength="2" maxlength="20" required placeholder="Wie nennt man dich?" autocomplete="nickname" value="${escape(selectedName)}"/><button class="primary" type="submit">${pendingRoom ? "Gruppe beitreten" : "In die Welt aufbrechen"} <span>→</span></button></form>${saved ? '<button id="continue-game" class="continue">Abenteuer fortsetzen ↗</button>' : ""}<span class="creation-note">Vier Klassen. Ein eigener Weg.</span></section><footer><span>3D / LIVING ASCII</span><span>← → Klasse wählen · Ziehen zum Drehen</span><button id="selection-sound">♫ MUSIK</button></footer></section><div id="toasts" aria-live="polite"></div>`;
  renderer = new Renderer($("#character-canvas"), world, { showcase: true });
  rendererSettings();
  renderer.cellSize = Math.min(settings.density, 3.5);
  renderer.resize();
  updateClass();
  $("#prev-class").onclick = () => cycleClass(-1);
  $("#next-class").onclick = () => cycleClass(1);
  app.querySelectorAll("[data-class]").forEach(
    (b) =>
      (b.onclick = () => {
        classIndex = +b.dataset.class;
        updateClass();
      }),
  );
  app.querySelectorAll("[data-gender]").forEach(
    (b) =>
      (b.onclick = () => {
        gender = b.dataset.gender;
        updateClass();
      }),
  );
  app.querySelectorAll("[data-tint]").forEach(
    (b) =>
      (b.onclick = () => {
        tint = +b.dataset.tint;
        updateClass();
      }),
  );
  let pointerStart = null,
    rotation = 0;
  const canvas = $("#character-canvas");
  canvas.onpointerdown = (e) => {
    pointerStart = { x: e.clientX, y: e.clientY };
    rotation = renderer.avatar?.rotation.y || 0;
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointermove = (e) => {
    if (pointerStart && renderer.avatar) {
      renderer.avatar.rotation.y =
        rotation + (e.clientX - pointerStart.x) * 0.012;
      renderer.dragging = true;
    }
  };
  canvas.onpointerup = (e) => {
    if (
      pointerStart &&
      Math.abs(e.clientX - pointerStart.x) > 70 &&
      e.pointerType === "touch"
    )
      cycleClass(e.clientX < pointerStart.x ? 1 : -1);
    pointerStart = null;
    setTimeout(() => {
      if (renderer) renderer.dragging = false;
    }, 2500);
  };
  $("#character-form").onsubmit = (e) => {
    e.preventDefault();
    const name = $("#character-name").value.trim();
    if (name.length < 2) {
      $("#character-name").setCustomValidity(
        "Mindestens zwei Zeichen eingeben.",
      );
      $("#character-name").reportValidity();
      return;
    }
    selectedName = name;
    sound.start();
    start(makePlayer(classIds[classIndex], name, gender, tint));
  };
  $("#character-name").oninput = (e) => e.target.setCustomValidity("");
  if ($("#continue-game"))
    $("#continue-game").onclick = () => {
      sound.start();
      restore();
      start(world.players.get("local"), true);
    };
  $("#selection-sound").onclick = () => {
    sound.start();
    settings.music = !settings.music;
    sound.music = settings.music;
    sound.setTrack(settings.music ? "elise" : "");
    persist();
  };
}
function cycleClass(dir) {
  classIndex = (classIndex + dir + 4) % 4;
  updateClass();
  sound.play("click");
}
function updateClass() {
  const id = classIds[classIndex],
    c = CLASSES[id];
  $("#class-name").textContent = c.name;
  $("#class-title").textContent = c.title;
  $("#class-role").textContent = c.role;
  $("#class-desc").textContent = c.desc;
  $("#class-counter").textContent = `0${classIndex + 1} / 04`;
  $("#model-number").textContent = `0${classIndex + 1}`;
  $("#class-stats").innerHTML = [
    ["LEBEN", c.hp],
    ["MANA", c.mana],
    ["TEMPO", c.speed.toFixed(1)],
    ["SCHUTZ", c.defense],
  ]
    .map(([label, n]) => `<span><b>${n}</b>${label}</span>`)
    .join("");
  app.querySelectorAll("[data-class]").forEach((b) => {
    b.classList.toggle("active", +b.dataset.class === classIndex);
    b.setAttribute("aria-pressed", +b.dataset.class === classIndex);
  });
  app.querySelectorAll("[data-gender]").forEach((b) => {
    b.classList.toggle("active", b.dataset.gender === gender);
    b.setAttribute("aria-pressed", b.dataset.gender === gender);
  });
  app.querySelectorAll("[data-tint]").forEach((b) => {
    b.classList.toggle("active", +b.dataset.tint === tint);
    b.setAttribute("aria-pressed", +b.dataset.tint === tint);
  });
  renderer.setCharacter(id, gender, tint);
  document.documentElement.style.setProperty(
    "--class-color",
    tint ? TINTS[tint] : c.color,
  );
  $('[data-tint="0"]').style.setProperty("--swatch", c.color);
}

function restore() {
  if (!saved) return;
  world = new World();
  const defaults = makePlayer(
    saved.player.kind,
    saved.player.name,
    saved.player.gender,
    saved.player.tint,
  );
  const p = {
    ...defaults,
    ...saved.player,
    id: "local",
    input: {},
    anim: { type: "idle", start: 0, duration: 0 },
  };
  p.materials = { ...defaults.materials, ...p.materials };
  p.hp = Math.min(p.hp, maxHp(p));
  p.mana = Math.min(p.mana, maxMana(p));
  p.cooldowns = [0, 0, 0, 0];
  world.time = saved.time || 0;
  world.depleted = saved.depleted || {};
  world.opened = new Set(
    (saved.opened || []).map((id) =>
      /^c\d/.test(id)
        ? id.replace(/^c/, "chest:")
        : /^g\d/.test(id)
          ? id.replace(/^g/, "coin:")
          : /^s\d/.test(id)
            ? id.replace(/^s/, "shrine:")
            : id,
    ),
  );
  if (saved.version !== 2) {
    p.weapon = CLASSES[p.kind].weapon;
    p.inventory.forEach((i) => {
      if (i.id === "starter") i.name = p.weapon;
    });
  }
  world.ensureArea(p.x, p.y);
  world.objects.forEach((o) => (o.opened = world.opened.has(o.id)));
  world.players.set("local", p);
  makeParty();
  if (renderer) renderer.world = world;
}
function save() {
  const p = world.players.get("local");
  if (screen !== "game" || !p || party.mode === "guest") return;
  try {
    saved = {
      version: 2,
      player: { ...p, input: {} },
      time: world.time,
      depleted: world.depleted,
      opened: [
        ...new Set([
          ...world.opened,
          ...world.objects.filter((o) => o.opened).map((o) => o.id),
        ]),
      ],
    };
    localStorage.setItem("egox-save-v2", JSON.stringify(saved));
  } catch {
    toast("Der Browser konnte den Spielstand nicht speichern.");
  }
}
function start(p, restored = false) {
  renderer?.dispose();
  if (!restored) {
    world = new World();
    world.players.set("local", p);
    makeParty();
  }
  screen = "game";
  panel = "";
  keys = {};
  app.innerHTML = `<section class="game"><canvas id="world" tabindex="0" aria-label="3D-ASCII-Welt. WASD bewegen, Leertaste angreifen, E interagieren, G abbauen."></canvas><div class="edge-shade" aria-hidden="true"></div><div id="entity-labels" aria-hidden="true"></div><div class="vitals"><div class="identity"><b id="hud-name"></b><span id="hud-level"></span></div>${["health", "mana", "stamina"].map((id, i) => `<div class="vital ${id}"><span>${["LP", "MP", "AU"][i]}</span><div><i id="${id}-fill"></i></div><b id="${id}-value"></b></div>`).join("")}<span class="class-label" id="hud-class"></span></div><div class="area"><span id="zone-title"></span><small id="area-detail"></small></div><div class="wealth"><span>◈ <b id="coins"></b></span><small id="buff-label"></small></div><div class="lower-left"><div id="recent-event" aria-live="polite"></div><nav class="tools" aria-label="Spielmenü">${["settings", "inventory", "party", "journal", "map"].map((id) => `<button data-panel="${id}" aria-label="${{ settings: "Einstellungen", inventory: "Inventar", party: "Gruppe", journal: "Journal", map: "Weltkarte" }[id]}" title="${{ settings: "Einstellungen · Esc", inventory: "Inventar · I", party: "Gruppe · P", journal: "Journal · J", map: "Weltkarte · M" }[id]}">${symbol[id]}</button>`).join("")}</nav><span class="world-mark">EGOX <i>·</i> <span id="server-status">SOLO</span></span></div><div class="skillbar-wrap"><div id="interact-hint" hidden></div><div class="skillbar"><button data-action="attack" class="basic-attack" title="Standardangriff · Leertaste"><span>╱</span><kbd>SPACE</kbd></button><div id="skill-slots"></div><button data-action="potion" class="potion" title="Heiltrank"><span>♜</span><b id="potion-count"></b><kbd id="potion-key">Q</kbd></button></div><div class="xp-line"><i id="xp-fill"></i></div><div class="controls-hint">WASD bewegen <i>·</i> SHIFT sprinten <i>·</i> E interagieren <i>·</i> G abbauen</div></div><div class="lower-right"><span id="weapon-name"></span><div id="materials-summary"></div><span id="weather-label"></span><span id="coords"></span></div><div id="death-screen" hidden><span class="eyebrow">EIN FUNKE BLEIBT.</span><h1>Deine Geschichte geht weiter.</h1><p>Erwache in Immerhain · Opfergabe: 10 % Gold</p><button class="primary" data-action="respawn">Am Schrein erwachen →</button></div></section><div id="modal-root"></div><div id="toasts" aria-live="polite"></div>`;
  renderer = new Renderer($("#world"), world);
  rendererSettings();
  renderer.cameraTarget.set(p.x, 0, p.y);
  wireNav();
  app
    .querySelectorAll("[data-action]")
    .forEach((b) => (b.onclick = () => action(b.dataset.action)));
  $("#world").onpointerdown = () => action("attack");
  $("#world").focus({ preventScroll: true });
  updateUI();
  save();
  if (pendingRoom) {
    const room = pendingRoom;
    pendingRoom = null;
    party.join(room, p);
  }
}
function wireNav() {
  app
    .querySelectorAll("[data-panel]")
    .forEach((b) => (b.onclick = () => openPanel(b.dataset.panel)));
}
function action(type, data) {
  if (screen !== "game") return;
  party.action(type, data);
  if (panel === "inventory" || panel === "shop") setTimeout(renderPanel, 160);
}
let skillVersion = "";
function updateUI() {
  const p = player();
  if (screen !== "game" || !p) return;
  const c = CLASSES[p.kind];
  $("#hud-name").textContent = p.name;
  $("#hud-level").textContent = `LV ${p.level}`;
  $("#hud-class").textContent =
    `${c.name} / ${c.role.split(" · ")[0].toLowerCase()}`;
  for (const [id, value, max] of [
    ["health", p.hp, maxHp(p)],
    ["mana", p.mana, maxMana(p)],
    ["stamina", p.stamina, 100],
  ]) {
    $(`#${id}-fill`).style.width = `${(Math.max(0, value) / max) * 100}%`;
    $(`#${id}-value`).textContent = `${Math.ceil(value)}/${max}`;
  }
  $("#coins").textContent = p.coins;
  $("#zone-title").textContent = Number.isInteger(p.inside)
    ? "Ein stiller Ort"
    : zone(p.x, p.y);
  $("#area-detail").textContent = Number.isInteger(p.inside)
    ? "Innenraum"
    : safeAt(p.x, p.y)
      ? "Zuflucht"
      : "Wildnis";
  $("#buff-label").textContent =
    p.buff > 0 ? `Schutzsegen ${Math.ceil(p.buff)}s` : "";
  $("#weapon-name").textContent = p.weapon;
  $("#coords").textContent = `${Math.round(p.x)} : ${Math.round(p.y)}`;
  $("#server-status").textContent =
    party.mode === "solo" ? "SOLO" : `GRUPPE ${world.players.size}/4`;
  $("#potion-count").textContent = p.potions;
  $("#potion-key").textContent = settings.keys.potion.toUpperCase();
  $("#weather-label").textContent = {
    clear: "Heiter",
    rain: "Regen",
    storm: "Gewitter",
    snow: "Schneefall",
  }[world.weather];
  const mat = p.materials || {};
  $("#materials-summary").textContent =
    `Holz ${mat.wood || 0} · Stein ${mat.stone || 0}`;
  $("#xp-fill").style.width = `${(p.xp / xpNeeded(p)) * 100}%`;
  $("#death-screen").hidden = p.hp > 0;
  const version = `${p.kind}:${p.unlocked.join(",")}`;
  if (version !== skillVersion || !$("#skill-slots").children.length) {
    skillVersion = version;
    $("#skill-slots").innerHTML = [0, 1, 2, 3]
      .map((i) => {
        const s = c.skills[p.unlocked[i]];
        return `<button data-skill="${i}" ${s ? "" : "disabled"} aria-label="${s ? s.name : "Gesperrter Platz"}" title="${s ? `${s.name} · ${s.cost} Mana · ${s.cd}s` : "Beim Levelaufstieg freischalten"}"><span>${s?.icon || "◇"}</span><i></i><kbd>${i + 1}</kbd><small>${s?.name || "Gesperrt"}</small></button>`;
      })
      .join("");
    $("#skill-slots")
      .querySelectorAll("[data-skill]")
      .forEach((b) => (b.onclick = () => action("skill", +b.dataset.skill)));
  }
  $("#skill-slots")
    .querySelectorAll("[data-skill]")
    .forEach((b, i) => {
      const cd = p.cooldowns[i] || 0;
      b.classList.toggle("cooldown", cd > 0);
      $("i", b).textContent = cd > 0 ? Math.ceil(cd) : "";
      b.classList.toggle("no-mana", c.skills[p.unlocked[i]]?.cost > p.mana);
    });
  const near = world.nearest(p),
    resource = world.resource(p),
    hint = $("#interact-hint");
  hint.hidden = (!near && !resource) || !!panel || p.hp <= 0;
  hint.innerHTML = near
    ? `<kbd>${escape(settings.keys.interact.toUpperCase())}</kbd> ${escape(near.name || (near.type === "chest" ? "Kiste öffnen" : "Schrein berühren"))}`
    : resource
      ? `<kbd>${escape(settings.keys.gather.toUpperCase())}</kbd> ${resource.type === "tree" ? "Baum fällen" : "Stein abbauen"}`
      : "";
  const labels = [];
  for (const e of [
    ...world.players.values(),
    ...world.npcs,
    ...world.mobs.filter(
      (m) => !m.dead && m.hp > 0 && m.hp < MOB_TYPES[m.kind].hp,
    ),
  ]) {
    if (
      Math.hypot(e.x - p.x, e.y - p.y) > 19 ||
      (Number.isInteger(e.inside) ? e.inside : null) !==
        (Number.isInteger(p.inside) ? p.inside : null)
    )
      continue;
    const point = renderer.project(e.x, e.y, e.kind === 0 ? 1.5 : 3.25);
    if (!point.visible) continue;
    const ally = e.id && world.players.has(e.id),
      mob = Number.isInteger(e.kind);
    labels.push(
      `<div class="entity-label ${ally ? "ally" : ""}" style="left:${point.x}px;top:${point.y}px">${escape(e.name || MOB_TYPES[e.kind]?.name)}${ally && e.id !== p.id ? `<span class="ally-hp"><i style="width:${(e.hp / maxHp(e)) * 100}%"></i></span>` : ""}${mob ? `<span class="enemy-hp"><i style="width:${(Math.max(0, e.hp) / MOB_TYPES[e.kind].hp) * 100}%"></i></span>` : ""}</div>`,
    );
  }
  for (const e of world.effects)
    if (e.text && ["hit", "heal", "damage", "chips", "loot"].includes(e.kind)) {
      const point = renderer.project(
        e.x,
        e.y,
        2.7 + (1 - e.life / e.maxLife) * 1.5,
      );
      if (point.visible)
        labels.push(
          `<div class="floating-text" style="left:${point.x}px;top:${point.y}px;color:${escape(e.color)}">${escape(e.text)}</div>`,
        );
    }
  $("#entity-labels").innerHTML = labels.join("");
  for (const e of world.events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    if (e.type === "sfx") {
      const source = world.players.get(e.player);
      if (
        source &&
        (Number.isInteger(source.inside) ? source.inside : null) ===
          (Number.isInteger(p.inside) ? p.inside : null)
      ) {
        const distance = Math.hypot(source.x - p.x, source.y - p.y);
        if (distance < 22) sound.play(e.text, 1 - distance / 25);
      }
      continue;
    }
    if (e.player && e.player !== party.playerId) continue;
    if (e.type === "panel") {
      openPanel(e.text);
      continue;
    }
    $("#recent-event").textContent = e.text;
    if (e.type === "level" || e.type === "loot") {
      toast(e.text);
      sound.play(e.type);
    }
  }
  if (seen.size > 1500) {
    seen.clear();
    world.events.forEach((e) => seen.add(e.id));
  }
}

function openPanel(name) {
  if (screen !== "game") return;
  if (panel === name) {
    closePanel();
    return;
  }
  lastFocus = document.activeElement;
  panel = name;
  keys = {};
  renderPanel();
}
function closePanel() {
  panel = "";
  $("#modal-root").innerHTML = "";
  keys = {};
  lastFocus?.focus?.({ preventScroll: true });
  if (!lastFocus?.isConnected) $("#world")?.focus({ preventScroll: true });
}
function renderPanel() {
  if (!panel || screen !== "game") return;
  const p = player();
  if (!p) return;
  const titles = {
    settings: "Einstellungen",
    inventory: "Dein Gepäck",
    party: "Deine Gefährten",
    journal: "Wächter von Immerhain",
    shop: "Elaras Waren",
    quest: "Eldrics Bitte",
    healer: "Eine Atempause",
    map: "Die bekannten Lande",
  };
  let body = "";
  if (panel === "inventory") {
    const mat = p.materials || {};
    body = `<div class="materials">${[
      ["wood", "Holz"],
      ["stone", "Stein"],
      ["ancientWood", "Antikes Holz"],
      ["rareOre", "Seltene Erze"],
    ]
      .map(
        ([id, label]) =>
          `<span class="${id === "ancientWood" || id === "rareOre" ? "rare" : ""}"><b>${mat[id] || 0}</b>${label}</span>`,
      )
      .join(
        "",
      )}</div><p class="hint">Fälle Bäume und baue Felsen mit G ab. Seltene Funde: 2,5 % der Vorkommen. Nach vier Minuten wachsen Ressourcen nach.</p><div class="inventory-meta">◈ ${p.coins} Gold <span>${p.potions} Heiltränke</span></div>${p.inventory.map((i) => `<div class="item-row"><span class="item-rune">${i.type === "weapon" ? "†" : i.type === "book" ? "▤" : i.type === "tool" ? "⚒" : "♜"}</span><div><b>${escape(i.name)}</b><small>${escape(i.desc || `+${i.bonus || 0} ${i.type === "armor" ? "Schutz" : "Schaden"}`)}</small></div><button data-equip="${escape(i.id)}" ${i.equipped || i.type === "tool" ? "disabled" : ""}>${i.equipped ? "Angelegt" : i.type === "book" ? "Lesen" : i.type === "tool" ? "Aktiv" : "Anlegen"}</button></div>`).join("")}<h3>Künste</h3><p class="hint">Die ersten vier liegen auf 1–4. Weitere auf Platz 4 tauschen.</p>${p.unlocked
      .map((id, i) => {
        const s = CLASSES[p.kind].skills[id];
        return `<div class="item-row"><span class="item-rune">${s.icon}</span><div><b>${s.name}</b><small>${s.cost} Mana · ${s.cd}s</small></div>${i < 4 ? `<kbd>${i + 1}</kbd>` : `<button data-swap="${i}">Platz 4</button>`}</div>`;
      })
      .join("")}`;
  }
  if (panel === "shop")
    body = `<p class="prose">„Eine gute Klinge. Ein voller Beutel. Was fehlt dir noch?“</p><div class="inventory-meta">◈ ${p.coins} Gold</div>${SHOP.map((i, n) => `<div class="item-row"><div><b>${i.name}</b><small>${i.desc}</small></div><button data-buy="${n}" ${p.coins < i.price ? "disabled" : ""}>◈ ${i.price}</button></div>`).join("")}`;
  if (panel === "journal" || panel === "quest")
    body = `<p class="eyebrow">ELDRIC · DORFÄLTESTER</p><p class="prose">„Jenseits der alten Tore regt sich etwas. Hilf Immerhain, Reisender. Besiege die Wesen in den Wäldern und suche den Segen der Alten.“</p>${[
      [p.kills, 5, "Feinde besiegen"],
      [p.chests, 1, "Eine Kiste öffnen"],
      [p.shrines, 1, "Einen Schrein aktivieren"],
    ]
      .map(
        ([n, goal, title]) =>
          `<div class="objective ${n >= goal ? "done" : ""}"><span>${n >= goal ? "✓" : "◇"} ${title}</span><b>${Math.min(n, goal)}/${goal}</b></div>`,
      )
      .join(
        "",
      )}<div class="reward">BELOHNUNG <b>100 Gold</b><b>80 EP</b></div>${panel === "quest" ? `<button class="primary" id="claim-quest" ${p.questClaimed ? "disabled" : ""}>${p.questClaimed ? "Abgeschlossen" : "Belohnung beanspruchen"}</button>` : '<p class="hint">Eldric wartet nordöstlich des Dorfbrunnens.</p>'}`;
  if (panel === "healer")
    body =
      '<p class="prose">„Ruh dich aus. Der Wald hat noch Licht für dich übrig.“</p><p class="hint">Leben und Mana vollständig auffüllen. Kostenlos.</p><button class="primary" id="heal">Ausruhen →</button>';
  if (panel === "party")
    body = `<p class="hint">Vier Spieler insgesamt. Der Host hält die gemeinsame Welt offen.</p>${[...world.players.values()].map((a) => `<div class="item-row"><span class="item-rune">${CLASSES[a.kind].glyph}</span><div><b>${escape(a.name)}</b><small>${CLASSES[a.kind].name} · Level ${a.level}</small></div><small>${a.id === party.playerId ? "DU" : "VERBÜNDET"}</small></div>`).join("")}<p class="network-status">${escape(netStatus)}</p>${party.mode === "solo" ? '<button id="host-party" class="primary">Gruppe erstellen →</button>' : party.mode === "host" ? `<label class="field-label" for="invite-link">EINLADUNGSLINK</label><div class="invite"><input id="invite-link" value="${escape(party.invite)}" readonly/><button id="copy-invite">Kopieren</button></div>` : '<span class="eyebrow">MIT HOST VERBUNDEN</span>'}<p class="hint">Heilung des Elfen wirkt auf lebende Verbündete in Reichweite. Gruppenfortschritt gehört zur Host-Welt; dein Solo-Spielstand bleibt separat. WebRTC kann in restriktiven Netzwerken blockiert sein.</p>${party.mode !== "solo" ? '<button class="secondary" id="leave-party">Gruppe verlassen</button>' : ""}`;
  if (panel === "map")
    body = `<p class="hint">768 × 768 Felder · Sechs Siedlungen. Deine Position: ${Math.round(p.x)}, ${Math.round(p.y)}</p><canvas id="large-map" width="512" height="512" aria-label="Weltkarte"></canvas><div class="map-places">${VILLAGES.map((v) => `<span>${v.name}<small>${v.x} : ${v.y}</small></span>`).join("")}</div>`;
  if (panel === "settings")
    body = `<div class="setting-row"><label for="volume">Lautstärke</label><input id="volume" type="range" min="0" max="1" step=".05" value="${settings.volume}"/></div><div class="setting-row"><label for="music">Hintergrundmusik</label><input type="checkbox" id="music" ${settings.music ? "checked" : ""}/></div><div class="setting-row"><label for="track">Musikauswahl</label><select id="track">${[["auto", "Nach Region"], ...Object.entries(TRACKS)].map(([key, title]) => `<option value="${key}" ${settings.track === key ? "selected" : ""}>${title}</option>`).join("")}</select></div><div class="setting-row"><label for="motion">Umgebungsanimationen</label><input type="checkbox" id="motion" ${settings.motion ? "checked" : ""}/></div><div class="setting-row"><label for="cycle">ASCII-Zeichen durchcyclen</label><input type="checkbox" id="cycle" ${settings.cycle ? "checked" : ""}/></div><div class="setting-row"><label for="density">Zeichendichte</label><select id="density">${[
      [2.5, "Sehr fein"],
      [3.5, "Fein"],
      [4.5, "Standard"],
    ]
      .map(
        ([v, title]) =>
          `<option value="${v}" ${settings.density === v ? "selected" : ""}>${title}</option>`,
      )
      .join(
        "",
      )}</select></div><div class="setting-row"><label for="zoom">Kameraentfernung</label><select id="zoom">${[
      [1, "Weiter"],
      [1.25, "Nah"],
      [1.5, "Sehr nah"],
    ]
      .map(
        ([v, title]) =>
          `<option value="${v}" ${settings.zoom === v ? "selected" : ""}>${title}</option>`,
      )
      .join(
        "",
      )}</select></div><h3>Tasten</h3><div class="keybinds">${Object.entries(
      settings.keys,
    )
      .map(
        ([id, key]) =>
          `<label>${{ up: "Vorwärts", down: "Rückwärts", left: "Links", right: "Rechts", interact: "Interagieren", gather: "Abbauen", potion: "Heiltrank", inventory: "Inventar", journal: "Journal", party: "Gruppe", map: "Weltkarte" }[id]}<button data-bind="${id}">${escape(key.toUpperCase())}</button></label>`,
      )
      .join(
        "",
      )}</div><p class="hint">Leertaste: Angriff · 1–4: Fähigkeiten · Shift: Sprinten · Esc: Schließen.<br>Die Welt läuft bei geöffneten Menüs weiter.</p><div class="button-row"><button class="secondary" id="save-now">Speichern</button><button class="secondary" id="return-selection">Charakterauswahl</button></div>`;
  $("#modal-root").innerHTML =
    `<div class="scrim"><section class="dialog ${panel === "map" ? "atlas-dialog" : ""}" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header><span class="eyebrow">EGOX / ${panel.toUpperCase()}</span><button id="close-panel" aria-label="Menü schließen">×</button></header><h2 id="dialog-title">${titles[panel] || "Journal"}</h2><div class="dialog-body">${body}</div><footer><span>ASCII REALMS</span><span><kbd>ESC</kbd> Zurück</span></footer></section></div>`;
  $("#close-panel").onclick = closePanel;
  $("#close-panel").focus({ preventScroll: true });
  $(".scrim").onclick = (e) => {
    if (e.target.classList.contains("scrim")) closePanel();
  };
  document
    .querySelectorAll("[data-equip]")
    .forEach((b) => (b.onclick = () => action("equip", b.dataset.equip)));
  document
    .querySelectorAll("[data-buy]")
    .forEach((b) => (b.onclick = () => action("buy", +b.dataset.buy)));
  document
    .querySelectorAll("[data-swap]")
    .forEach(
      (b) => (b.onclick = () => action("swapSkill", [3, +b.dataset.swap])),
    );
  if ($("#claim-quest"))
    $("#claim-quest").onclick = () => {
      action("quest");
      closePanel();
    };
  if ($("#heal"))
    $("#heal").onclick = () => {
      action("heal");
      closePanel();
    };
  if ($("#host-party"))
    $("#host-party").onclick = async (e) => {
      e.target.disabled = true;
      await party.host();
      if (panel === "party") renderPanel();
    };
  if ($("#copy-invite"))
    $("#copy-invite").onclick = async () => {
      try {
        await navigator.clipboard.writeText(party.invite);
        toast("Einladungslink kopiert.");
      } catch {
        $("#invite-link").select();
        toast("Mit Strg+C kopieren.");
      }
    };
  if ($("#leave-party"))
    $("#leave-party").onclick = () => {
      const guest = party.mode === "guest";
      party.leave();
      if (guest) restore();
      renderer.world = world;
      netStatus = "Du bist wieder in deiner eigenen Welt.";
      renderPanel();
    };
  if (panel === "settings") wireSettings();
  if (panel === "map") drawMap(p);
}
function wireSettings() {
  $("#volume").oninput = (e) => {
    settings.volume = +e.target.value;
    sound.start();
    sound.setVolume(settings.volume);
    persist();
  };
  $("#music").onchange = (e) => {
    settings.music = e.target.checked;
    sound.music = settings.music;
    persist();
  };
  $("#track").onchange = (e) => {
    settings.track = e.target.value;
    sound.trackMode = settings.track;
    persist();
  };
  for (const id of ["motion", "cycle"])
    $(`#${id}`).onchange = (e) => {
      settings[id] = e.target.checked;
      rendererSettings();
      persist();
    };
  for (const id of ["density", "zoom"])
    $(`#${id}`).onchange = (e) => {
      settings[id] = +e.target.value;
      rendererSettings();
      persist();
    };
  $("#save-now").onclick = () => {
    save();
    toast(
      party.mode === "guest"
        ? "Dein Solo-Spielstand bleibt erhalten."
        : "Spielstand gespeichert.",
    );
  };
  $("#return-selection").onclick = () => {
    save();
    party.leave();
    closePanel();
    selection();
  };
  document.querySelectorAll("[data-bind]").forEach(
    (b) =>
      (b.onclick = () => {
        b.textContent = "…";
        document.addEventListener(
          "keydown",
          (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            const key = e.key.toLowerCase();
            if (
              key.length === 1 &&
              /[a-zäöü]/.test(key) &&
              (!Object.values(settings.keys).includes(key) ||
                settings.keys[b.dataset.bind] === key)
            ) {
              settings.keys[b.dataset.bind] = key;
              persist();
            } else if (key !== "escape")
              toast("Wähle eine freie Buchstabentaste.");
            b.textContent = settings.keys[b.dataset.bind].toUpperCase();
          },
          { capture: true, once: true },
        );
      }),
  );
}
function drawMap(p) {
  const canvas = $("#large-map"),
    ctx = canvas.getContext("2d"),
    s = 512 / WORLD_SIZE;
  ctx.fillStyle = "#111b20";
  ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < WORLD_SIZE; y += 3)
    for (let x = 0; x < WORLD_SIZE; x += 3) {
      ctx.fillStyle = {
        water: "#5e8a95",
        snow: "#8a9b9e",
        marsh: "#395d54",
        ruins: "#767e72",
        path: "#aaa080",
        grass: "#354b37",
        wall: "#18211c",
      }[terrain(x, y)];
      ctx.fillRect(x * s, y * s, 3 * s + 0.5, 3 * s + 0.5);
    }
  ctx.font = "10px monospace";
  for (const v of VILLAGES) {
    ctx.fillStyle = "#ddc58e";
    ctx.fillRect(v.x * s - 2, v.y * s - 2, 4, 4);
    ctx.fillText(v.name, v.x * s + 5, v.y * s);
  }
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(p.x * s, p.y * s, 4, 0, Math.PI * 2);
  ctx.fill();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && panel) {
    const nodes = [
        ...document.querySelectorAll(
          ".dialog button:not(:disabled),.dialog input,.dialog select",
        ),
      ],
      first = nodes[0],
      end = nodes.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      end?.focus();
    } else if (!e.shiftKey && document.activeElement === end) {
      e.preventDefault();
      first?.focus();
    }
    return;
  }
  if (
    ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) &&
    e.key !== "Escape"
  )
    return;
  if (screen === "selection") {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      cycleClass(-1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      cycleClass(1);
    }
    return;
  }
  if (screen !== "game" || e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key.toLowerCase(),
    m = settings.keys;
  if (key === "escape") {
    e.preventDefault();
    panel ? closePanel() : openPanel("settings");
    return;
  }
  if (!e.repeat) {
    const destination = Object.keys(symbol).find((id) => m[id] === key);
    if (destination) {
      e.preventDefault();
      openPanel(destination);
      return;
    }
  }
  if (panel) return;
  if (
    [
      m.up,
      m.down,
      m.left,
      m.right,
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      " ",
      "shift",
    ].includes(key)
  ) {
    e.preventDefault();
    keys[key] = true;
  }
  if (!e.repeat) {
    if (key === " ") action("attack");
    if (key === m.interact) action("interact");
    if (key === m.gather) action("gather");
    if (key === m.potion) action("potion");
    if (/^[1-4]$/.test(key)) action("skill", +key - 1);
  }
});
document.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
window.addEventListener("blur", () => (keys = {}));
window.addEventListener("beforeunload", save);
function loop(ms) {
  const dt = Math.min((ms - last) / 1000 || 0.016, 0.05);
  last = ms;
  if (screen === "selection") {
    world.time += dt;
    renderer?.draw(null, dt);
    sound.tick(world.time, "clear", "", screen);
  }
  if (screen === "game") {
    const p = player(),
      m = settings.keys,
      input = {
        up: !!(keys[m.up] || keys.arrowup),
        down: !!(keys[m.down] || keys.arrowdown),
        left: !!(keys[m.left] || keys.arrowleft),
        right: !!(keys[m.right] || keys.arrowright),
        sprint: !!keys.shift,
      };
    if (p && party.mode !== "guest") p.input = panel ? {} : input;
    if (party.mode !== "guest") world.update(dt);
    if (keys[" "] && !panel) action("attack");
    if (keys[m.gather] && !panel) action("gather");
    party.tick(ms / 1000, panel ? {} : input);
    renderer.draw(p, dt);
    sound.tick(world.time, world.weather, p ? zone(p.x, p.y) : "", screen);
    uiTime += dt;
    saveTime += dt;
    if (uiTime > 0.1) {
      updateUI();
      uiTime = 0;
    }
    if (saveTime > 10) {
      save();
      saveTime = 0;
    }
  }
  requestAnimationFrame(loop);
}
intro();
requestAnimationFrame(loop);
