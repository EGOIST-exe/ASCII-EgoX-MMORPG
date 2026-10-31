import { filmShotAt } from "./cinematography.js";
import "./style.css";
import {
  World,
  makePlayer,
  KNIGHT,
  SKILLS,
  CINE,
  SPAWN,
  DAY_LENGTH,
  daylight,
  maxHp,
  xpNeeded,
  objective,
  zone,
  SEALS,
  VILLAGES,
  DUNGEON,
  terrain,
  treeAt,
  riverX,
} from "./core.js";
import { Renderer } from "./render.js";
import { Soundscape, TRACKS } from "./audio.js";
const $ = (s, r = document) => r.querySelector(s),
  app = $("#app");
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let world = new World(),
  renderer,
  mode = "intro",
  panel = "",
  dialogue = null,
  dialogueIndex = 0,
  keys = {},
  last = 0,
  uiTimer = 0,
  saveTimer = 0,
  saveData = null,
  seen = new Set(),
  lastFocus,
  flashUntil = 0;
let settings = {
  volume: 0.42,
  music: true,
  track: "auto",
  motion: !matchMedia("(prefers-reduced-motion: reduce)").matches,
  cycle: true,
  zoom: 1.05,
};
try {
  settings = {
    ...settings,
    ...JSON.parse(localStorage.getItem("egox-settings-v3") || "{}"),
  };
  const old = JSON.parse(
    localStorage.getItem("egox-save-v3") ||
      localStorage.getItem("egox-save-v2") ||
      "null",
  );
  if (old?.player?.name) saveData = old;
} catch {}
const sound = new Soundscape();
sound.volume = settings.volume;
sound.music = settings.music;
sound.trackMode = settings.track;
function audioStart() {
  sound.start();
  if (!sound.currentTrack)
    sound.setTrack(
      mode === "intro" || mode === "creation" ? "elise" : "autumn",
    );
}
audioStart();
document.addEventListener("pointerdown", audioStart, { once: true });
document.addEventListener("keydown", audioStart, { once: true });
function persistSettings() {
  try {
    localStorage.setItem("egox-settings-v3", JSON.stringify(settings));
  } catch {}
}
function save() {
  if (mode !== "game") return;
  try {
    saveData = world.serialize();
    localStorage.setItem("egox-save-v3", JSON.stringify(saveData));
  } catch {
    message("Der Browser konnte den Spielstand nicht speichern.");
  }
}
function configureRenderer() {
  renderer.zoom = settings.zoom;
  renderer.motion = settings.motion;
  renderer.cycle = settings.cycle;
}
function message(text) {
  const el = $("#message");
  if (el) {
    el.textContent = text;
    el.classList.add("visible");
    flashUntil = performance.now() + 5000;
  }
}

function intro() {
  app.innerHTML =
    '<section class="intro"><canvas id="intro" aria-label="Automatisch startendes ASCII-Intro"></canvas><div class="intro-caption"><span>E G O X</span><small>D E R   L E T Z T E   E I D</small></div><button id="skip-intro" class="quiet">[ Enter ] überspringen</button></section>';
  const canvas = $("#intro"),
    ctx = canvas.getContext("2d"),
    sample = document.createElement("canvas"),
    sc = sample.getContext("2d", { willReadFrequently: true });
  sample.width = 210;
  sample.height = 59;
  const video = document.createElement("video");
  video.src = `${import.meta.env.BASE_URL}assets/intro.mp4`;
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  let done = false,
    frame,
    mouth = false;
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame);
    video.pause();
    video.removeAttribute("src");
    video.load();
    filmIntro();
  };
  const draw = () => {
    if (done) return;
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width;
    canvas.height = r.height;
    ctx.fillStyle = "#101b18";
    ctx.fillRect(0, 0, r.width, r.height);
    if (video.readyState >= 2) {
      sc.drawImage(video, 0, 0, 210, 59);
      const data = sc.getImageData(0, 0, 210, 59).data,
        size = Math.min((r.width * 0.85) / 210, (r.height * 0.7) / 118),
        left = (r.width - 210 * size) / 2,
        top = (r.height - 118 * size) / 2 - 25;
      ctx.font = `${size * 1.8}px "Courier New",monospace`;
      const chars = " .,:;=+*#%@",
        tick = Math.floor(video.currentTime * 12);
      for (let y = 0; y < 59; y++)
        for (let x = 0; x < 210; x++) {
          const i = (y * 210 + x) * 4,
            l = (data[i] + data[i + 1] + data[i + 2]) / 765;
          if (l < 0.05) continue;
          const index = Math.min(
            10,
            Math.floor(l * 9) + ((x + y + tick) % 3 === 0 ? 1 : 0),
          );
          ctx.fillStyle = `rgb(${130 + l * 115},${145 + l * 100},${120 + l * 110})`;
          ctx.fillText(chars[index], left + x * size, top + y * size * 2);
        }
      if (video.currentTime > 1.75 && !mouth) {
        mouth = true;
        sound.play("mouth");
      }
    }
    frame = requestAnimationFrame(draw);
  };
  $("#skip-intro").onclick = finish;
  window.skipIntro = finish;
  video.onended = () => setTimeout(finish, 250);
  video.onerror = finish;
  video.play().catch(() => {});
  draw();
  setTimeout(finish, 6500);
}
function filmCopy() {
  const cine = world.cinematic;
  if (!cine) return;
  const shot = filmShotAt(cine.time);
  $("#cinematic-title").textContent = shot.title;
  $("#cinematic-line").textContent = shot.line.slice(
    0,
    Math.floor(shot.local * 35) + 1,
  );
  sound.ambience(world.time, false, shot);
  document
    .querySelector(".game")
    ?.style.setProperty("--film-fade", shot.fade.toFixed(3));
}
function filmIntro() {
  mode = "film";
  world = new World();
  world.startCinematic("prologue");
  renderer?.dispose();
  app.innerHTML =
    '<section class="game film-intro in-cinematic"><canvas id="world" aria-label="Aurelions Fall – sechs vollständig in ASCII inszenierte Filmsequenzen"></canvas><div id="cinematic-copy"><span id="cinematic-title"></span><p id="cinematic-line"></p><button id="skip-cinematic">[ Enter ] Film überspringen</button></div></section>';
  renderer = new Renderer($("#world"), world);
  configureRenderer();
  $("#skip-cinematic").onclick = () => {
    world.finishCinematic();
    creation();
  };
}
function creation() {
  mode = "creation";
  world = new World();
  renderer?.dispose();
  app.innerHTML = `<section class="creation"><canvas id="world" aria-label="Ein männlicher Ritter sitzt in einer blühenden Wiese an einer alten Linde; alles ist aus ASCII-Zeichen gezeichnet."></canvas><div class="creation-wash"></div><section class="name-form"><span class="eyebrow">AURELION IST GEFALLEN.</span><h1>Ein Eid bleibt.</h1><p>Die Mauern sind zu Asche geworden.<br>Doch irgendwo wartet sie noch auf dich.</p><form id="name-form"><label for="knight-name">Wie heißt der letzte Ritter?</label><input id="knight-name" name="name" minlength="2" maxlength="20" value="${esc(saveData?.player?.name || "")}" autocomplete="nickname" placeholder="Dein Name" required/><button type="submit" class="text-button">Den Weg beginnen <span>--&gt;</span></button></form>${saveData ? '<button id="continue-game" class="continue">[ Gespeicherten Weg fortsetzen ]</button>' : ""}<span class="small-note">Ein Ritter. Ein verlorenes Königreich. Dein Weg.</span></section><span class="creation-corner">EGOX / DER LETZTE EID</span></section>`;
  renderer = new Renderer($("#world"), world);
  configureRenderer();
  $("#name-form").onsubmit = (e) => {
    e.preventDefault();
    const n = $("#knight-name").value.trim();
    if (n.length < 2) {
      $("#knight-name").setCustomValidity(
        "Bitte gib mindestens zwei Zeichen ein.",
      );
      $("#knight-name").reportValidity();
      return;
    }
    const next = new World(makePlayer(n));
    next.player.story.begun = true;
    start(next);
  };
  $("#knight-name").oninput = (e) => e.target.setCustomValidity("");
  if ($("#continue-game"))
    $("#continue-game").onclick = () => start(World.restore(saveData));
}
function start(next) {
  renderer?.dispose();
  world = next;
  mode = "game";
  panel = "";
  dialogue = null;
  keys = {};
  seen = new Set();
  app.innerHTML = `<section class="game"><canvas id="world" tabindex="0" aria-label="ASCII-Singleplayer-Abenteuer. WASD bewegen, Leertaste Schwert, E interagieren, G abbauen, V Drache."></canvas><div class="game-hud"><span id="knight-identity"></span><span id="health-line"></span><span id="stamina-line"></span></div><div class="journey"><span id="location"></span><small id="daytime"></small></div><div class="quest-note" id="quest-note"></div><div id="message" class="message" aria-live="polite"></div><div id="context-hint" class="context-hint"></div><div class="game-tools"><button data-panel="settings">[ Esc ]</button><button data-panel="journal">[ J ] Reise</button><button data-panel="inventory">[ I ] Gepäck</button><button data-panel="map">[ M ] Karte</button></div><div class="skill-hints" id="skill-hints"></div><div class="resources" id="resources"></div><div id="death" hidden><span class="eyebrow">DEIN EID IST NOCH NICHT ERFÜLLT.</span><h2>Du wirst noch gebraucht.</h2><p>Ein neuer Atemzug am letzten Rastplatz.<br>Opfergabe: 5 % deines Goldes.</p><button id="respawn">[ R ] Wieder erwachen</button></div><div id="cinematic-copy" hidden><span id="cinematic-title"></span><p id="cinematic-line"></p><button id="skip-cinematic">[ Enter ] weiter</button></div></section><div id="modal-root"></div><div id="dialogue-root"></div>`;
  renderer = new Renderer($("#world"), world);
  configureRenderer();
  renderer.camera = { x: world.player.x, y: world.player.y };
  document
    .querySelectorAll("[data-panel]")
    .forEach((b) => (b.onclick = () => openPanel(b.dataset.panel)));
  $("#respawn").onclick = () => act("respawn");
  $("#skip-cinematic").onclick = () => act("skip-cinematic");
  $("#world").onpointerdown = () => {
    if (!panel && !dialogue && !world.cinematic) act("attack");
  };
  $("#world").focus({ preventScroll: true });
  if (!world.player.story.begun && !world.cinematic)
    world.startCinematic("prologue");
  updateUI();
  save();
}
function act(type, data) {
  if (mode !== "game") return;
  world.action(type, data);
  if (type === "respawn") save();
  if (panel === "shop" || panel === "inventory") renderPanel();
}
function updateUI() {
  if (mode !== "game") return;
  const p = world.player,
    clock = daylight(world.clock),
    hours = Math.floor(clock.hour),
    minutes = Math.floor((clock.hour - hours) * 60);
  $("#knight-identity").textContent = `${p.name}  /  RITTER ${p.level}`;
  $("#health-line").textContent =
    `LEBEN [${"|".repeat(Math.ceil((p.hp / maxHp(p)) * 18))}${".".repeat(18 - Math.ceil((p.hp / maxHp(p)) * 18))}] ${Math.ceil(p.hp)}`;
  $("#stamina-line").textContent =
    p.stamina < 92 || keys.tab
      ? `ATEM  [${"|".repeat(Math.ceil((p.stamina / 100) * 18))}${".".repeat(18 - Math.ceil((p.stamina / 100) * 18))}]`
      : "";
  $("#location").textContent = zone(p);
  $("#daytime").textContent =
    `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} / ${clock.night ? "Nacht" : hours < 11 ? "Morgen" : hours > 17 ? "Abend" : "Tag"}`;
  $("#quest-note").textContent = objective(p);
  $("#resources").textContent =
    `${p.coins} Gold${p.mounted ? " / Ascheflügel" : ""}`;
  $("#death").hidden = p.hp > 0;
  $("#context-hint").hidden =
    !!panel || !!dialogue || !!world.cinematic || p.hp <= 0;
  const n = world.nearest();
  $("#context-hint").textContent = p.fishing
    ? p.fishing.bite
      ? "[ E ] Biss! Jetzt einholen."
      : "Die Pose tanzt. Warte auf einen Biss ..."
    : n
      ? `[ E ] ${n.name || { chest: "Alte Kiste öffnen", elder: "Merin", merchant: "Nela", healer: "Lio" }[n.type]}`
      : world.atRiver()
        ? "[ E ] Angel auswerfen"
        : "";
  $("#skill-hints").textContent = SKILLS.map(
    (s, i) =>
      `${i + 1} ${p.level < s.level ? `Rang ${s.level}` : s.name}${p.cooldowns[i] > 0 ? ` (${Math.ceil(p.cooldowns[i])})` : ""}`,
  ).join("   ");
  $("#skill-hints").classList.toggle(
    "visible",
    !!keys.tab || p.attackCd > 0 || p.block > 0,
  );
  if (performance.now() > flashUntil) $("#message").classList.remove("visible");
  const cine = world.cinematic;
  $("#cinematic-copy").hidden = !cine;
  $(".game").classList.toggle("in-cinematic", !!cine);
  if (cine?.id === "prologue") filmCopy();
  else if (cine) {
    const spec = CINE[cine.id],
      segment = cine.duration / spec.lines.length,
      index = Math.min(spec.lines.length - 1, Math.floor(cine.time / segment)),
      elapsed = cine.time - index * segment;
    $("#cinematic-title").textContent = spec.title;
    $("#cinematic-line").textContent = spec.lines[index].slice(
      0,
      Math.floor(elapsed * 36) + 1,
    );
  }
  for (const e of world.events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    if (e.type === "message") message(e.text);
    if (e.type === "sound") sound.play(e.name);
    if (e.type === "save") save();
    if (e.type === "panel") openPanel(e.panel);
    if (e.type === "dialogue") {
      dialogue = e;
      dialogueIndex = 0;
      keys = {};
      showDialogue();
    }
    if (e.type === "cinematic") {
      keys = {};
      if (panel) closePanel();
    }
  }
  if (seen.size > 1000) {
    seen.clear();
    world.events.forEach((e) => seen.add(e.id));
  }
}
function showDialogue() {
  if (!dialogue) {
    $("#dialogue-root").innerHTML = "";
    return;
  }
  $("#dialogue-root").innerHTML =
    `<section class="dialogue" role="dialog" aria-modal="true" aria-label="Gespräch"><span>${esc(dialogue.speaker)}</span><p>${esc(dialogue.lines[dialogueIndex])}</p><button id="next-dialogue">[ E ] ${dialogueIndex + 1 < dialogue.lines.length ? "Weiter" : "Den Weg fortsetzen"}</button></section>`;
  $("#next-dialogue").onclick = nextDialogue;
  $("#next-dialogue").focus({ preventScroll: true });
}
function nextDialogue() {
  if (!dialogue) return;
  dialogueIndex++;
  if (dialogueIndex >= dialogue.lines.length) {
    world.resolveDialogue(dialogue.resolve);
    dialogue = null;
    save();
    $("#world").focus({ preventScroll: true });
  }
  showDialogue();
}
function openPanel(name) {
  if (mode !== "game" || world.cinematic || dialogue || world.player.hp <= 0)
    return;
  if (panel === name) {
    closePanel();
    return;
  }
  lastFocus = document.activeElement;
  panel = name;
  keys = {};
  world.player.input = {};
  renderPanel();
}
function closePanel() {
  panel = "";
  $("#modal-root").innerHTML = "";
  keys = {};
  $("#world")?.focus({ preventScroll: true });
}
function renderPanel() {
  if (!panel) return;
  const p = world.player;
  let title = "",
    body = "";
  if (panel === "settings") {
    title = "Ein Moment für dich";
    body = `<div class="setting"><label for="volume">Lautstärke</label><input id="volume" type="range" min="0" max="1" step=".05" value="${settings.volume}"/></div><div class="setting"><label for="music">Musik</label><input id="music" type="checkbox" ${settings.music ? "checked" : ""}/></div><div class="setting"><label for="track">Klang der Reise</label><select id="track">${[["auto", "Dem Weg folgen"], ...Object.entries(TRACKS)].map(([id, label]) => `<option value="${id}" ${settings.track === id ? "selected" : ""}>${label}</option>`).join("")}</select></div><div class="setting"><label for="motion">Bewegte Natur</label><input id="motion" type="checkbox" ${settings.motion ? "checked" : ""}/></div><div class="setting"><label for="cycle">Lebendige ASCII-Zeichen</label><input id="cycle" type="checkbox" ${settings.cycle ? "checked" : ""}/></div><div class="setting"><label for="zoom">Nähe</label><select id="zoom">${[
      [0.85, "Weiter"],
      [1.05, "Nah"],
      [1.3, "Sehr nah"],
    ]
      .map(
        ([id, label]) =>
          `<option value="${id}" ${settings.zoom === id ? "selected" : ""}>${label}</option>`,
      )
      .join(
        "",
      )}</select></div><p class="note">WASD / Pfeile: Gehen · Shift: Sprinten · Strg: Ausweichrolle<br>Leertaste: Schwert · 1–4: Ritterkünste<br>E: Benutzen / Angeln · G: Abbauen · Q: Trank<br>V: Drachenreiten · F: Flöte · Tab: Künste<br>Die Reise pausiert in Menüs.</p><div class="menu-actions"><button id="save-now">[ Speichern ]</button><button id="back-creation">[ Zur Linde ]</button></div><a class="discord" href="https://discord.gg/ego-x" target="_blank" rel="noopener noreferrer">EGOX / Discord ↗</a>`;
  }
  if (panel === "journal") {
    title = "Das Buch eines Eides";
    body = `<p class="chapter">${esc(objective(p))}</p><p class="story-text">Aurelion, dein Königreich, wurde in einer einzigen Nacht zerstört. Prinzessin Elara floh mit der letzten Wache über den Silberfluss. Unter einer alten Linde hast du geschworen, sie wiederzufinden.</p><ol class="quest-list">${[[p.story.begun, "Ein Eid unter der Linde"], [p.story.elder, "Mit Merin sprechen (51 : 66)"], ...SEALS.map((s) => [p.story.seals.includes(s.id), `${s.name} (${s.x} : ${s.y})`]), [p.story.dragon, "Die Aschengewölbe und ihr Hüter (125 : 114, Rang 4)"], [p.story.flute, "Die Mondglasflöte im Silberfluss finden"], [p.story.arrived, "Jenseits des Nebels fliegen"], [p.story.reunited, "Elara im Garten finden (66 : 51)"]].map(([done, label]) => `<li class="${done ? "done" : ""}"><span>${done ? "[x]" : "[ ]"}</span>${label}</li>`).join("")}</ol><p class="note">Die drei Siegel bringen genug Erfahrung für Rang 4. Im Dungeon erwarten dich zwei Wachen und der Aschenhüter. Nach der Drachenbefreiung findest du die Flöte spätestens beim dritten erfolgreichen Fang. Angeln: auf „Biss“ warten und dann E drücken.</p>`;
  }
  if (panel === "inventory") {
    title = "Was du bei dir trägst";
    body = `<div class="inventory-grid">${[
      ["Gold", p.coins],
      ["Heiltränke", p.potions],
      ["Silberfische", p.fish],
      ["Holz", p.wood],
      ["Stein", p.stone],
      ["Antikes Holz", p.ancientWood],
      ["Seltene Erze", p.rareOre],
    ]
      .map(([label, n]) => `<span>${label}<b>${n}</b></span>`)
      .join(
        "",
      )}</div><p class="chapter">Ritterschwert +${p.damageBonus} Schaden<br>Rüstung und Kettenhemd +${p.armor} Schutz</p><div class="menu-actions"><button id="drink-potion" ${!p.potions || p.hp >= maxHp(p) ? "disabled" : ""}>[ Heiltrank trinken ]</button><button id="eat-fish" ${!p.fish || p.hp >= maxHp(p) ? "disabled" : ""}>[ Fisch essen ]</button></div><p class="note">${p.story.dragon ? "Ascheflügel ist bei dir. V: Auf-/Absteigen." : "Ein Drache schlummert hinter dem letzten Tor."}<br>${p.story.flute ? "Mondglasflöte im Gepäck. F: Flug zwischen den Gebieten." : "Die Mondglasflöte fehlt noch."}</p><div class="arts">${SKILLS.map((s, i) => `<p><span>[ ${i + 1} ] ${s.name}</span><small>${p.level >= s.level ? `${s.cost} Atem / ${s.cd}s` : `Ab Rang ${s.level}`}</small></p>`).join("")}</div>`;
  }
  if (panel === "shop") {
    title = "Nelas kleiner Handel";
    body = `<p class="story-text">„Ein gutes Schwert hilft. Aber vergiss auf deinem Weg das Ausruhen nicht.“</p><p class="chapter">Dein Gold: ${p.coins}</p>${[
      ["Heiltrank", "60 Leben", 16],
      ["Schwert schärfen", "Dauerhaft +5 Schaden", 80],
      ["Rüstung verstärken", "Dauerhaft +2 Schutz", 65],
    ]
      .map(
        ([name, desc, cost], i) =>
          `<div class="shop-row"><div><b>${name}</b><small>${desc}</small></div><button data-buy="${i}" ${p.coins < cost ? "disabled" : ""}>[ ${cost} Gold ]</button></div>`,
      )
      .join("")}`;
  }
  if (panel === "rest") {
    title = "Die Bank im Wind";
    body =
      '<p class="story-text">Du legst das Schwert neben dich. Zwischen den Blumen summt ein leiser Sommer. Die Welt kann einen Augenblick warten.</p><div class="rest-options"><button id="rest-short">[ Eine kleine Rast ]</button><button id="rest-evening">[ Bis zur Nacht bleiben ]</button></div><p class="note">Beide Rasten füllen Leben und Atem vollständig auf. Dein Fortschritt wird gespeichert.</p>';
  }
  if (panel === "map") {
    title = "Wege, die noch vor dir liegen";
    body =
      '<canvas id="map-canvas" width="660" height="530" aria-label="ASCII-Reisekarte"></canvas><p class="note">@ Du / V Dorf / * Siegel / D Dungeon / ~ Fluss<br>Welt: 768 × 768 Felder. Die Reisekarte zeigt die besiedelte Anfangsregion.</p>';
  }
  $("#modal-root").innerHTML =
    `<div class="scrim"><section class="paper" role="dialog" aria-modal="true" aria-labelledby="panel-title"><div class="paper-top"><span>+-- DAS REISEBUCH --+</span><button id="close-panel" aria-label="Menü schließen">[ x ]</button></div><h2 id="panel-title">${title}</h2><div class="paper-body">${body}</div><div class="paper-foot">[ Esc ] Zurück auf den Weg</div></section></div>`;
  $("#close-panel").onclick = closePanel;
  $("#close-panel").focus({ preventScroll: true });
  $(".scrim").onclick = (e) => {
    if (e.target.classList.contains("scrim")) closePanel();
  };
  if (panel === "settings") {
    $("#volume").oninput = (e) => {
      settings.volume = +e.target.value;
      sound.setVolume(settings.volume);
      persistSettings();
    };
    $("#music").onchange = (e) => {
      settings.music = e.target.checked;
      sound.music = settings.music;
      persistSettings();
    };
    $("#track").onchange = (e) => {
      settings.track = e.target.value;
      sound.trackMode = settings.track;
      persistSettings();
    };
    for (const id of ["motion", "cycle"])
      $(`#${id}`).onchange = (e) => {
        settings[id] = e.target.checked;
        configureRenderer();
        persistSettings();
      };
    $("#zoom").onchange = (e) => {
      settings.zoom = +e.target.value;
      configureRenderer();
      persistSettings();
    };
    $("#save-now").onclick = () => {
      save();
      message("Dein Weg ist gespeichert.");
    };
    $("#back-creation").onclick = () => {
      save();
      closePanel();
      creation();
    };
  }
  if ($("#drink-potion")) $("#drink-potion").onclick = () => act("potion");
  if ($("#eat-fish")) $("#eat-fish").onclick = () => act("eat");
  document
    .querySelectorAll("[data-buy]")
    .forEach((b) => (b.onclick = () => act("buy", +b.dataset.buy)));
  if ($("#rest-short"))
    $("#rest-short").onclick = () => {
      closePanel();
      act("rest", "short");
    };
  if ($("#rest-evening"))
    $("#rest-evening").onclick = () => {
      closePanel();
      act("rest", "evening");
    };
  if (panel === "map") drawMap();
}
function drawMap() {
  const p = world.player,
    c = $("#map-canvas"),
    ctx = c.getContext("2d");
  ctx.fillStyle = "#17251e";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.font = '11px "Courier New",monospace';
  for (let row = 0; row < 48; row++) {
    let line = "";
    for (let col = 0; col < 80; col++) {
      const x = col * 2,
        y = row * 3;
      line +=
        terrain(x, y) === "water"
          ? "~"
          : terrain(x, y) === "path"
            ? ":"
            : treeAt(x, y)
              ? "^"
              : ".";
    }
    ctx.fillStyle = row % 2 ? "#7a9270" : "#617e62";
    ctx.fillText(line, 10, 15 + row * 10);
  }
  for (const v of VILLAGES) {
    ctx.fillStyle = "#d0c398";
    ctx.fillText(`V ${v.name}`, (v.x / 2) * 6.6 + 10, (v.y / 3) * 10 + 15);
  }
  for (const s of SEALS) {
    ctx.fillStyle = p.story.seals.includes(s.id) ? "#607963" : "#e4cd9e";
    ctx.fillText("*", (s.x / 2) * 6.6 + 10, (s.y / 3) * 10 + 15);
  }
  ctx.fillStyle = "#d0a68a";
  ctx.fillText("D", (DUNGEON.x / 2) * 6.6 + 10, (DUNGEON.y / 3) * 10 + 15);
  if (p.area === "vale") {
    ctx.fillStyle = "#fff1c8";
    ctx.fillText("@", (p.x / 2) * 6.6 + 10, (p.y / 3) * 10 + 15);
  } else {
    ctx.fillStyle = "#e0d5ac";
    ctx.fillText(
      p.area === "isle"
        ? "Du bist jenseits des Nebels."
        : "Du bist in den Aschengewölben.",
      20,
      510,
    );
  }
}

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (mode === "intro" && key === "enter") {
    e.preventDefault();
    window.skipIntro?.();
    return;
  }
  if (mode === "film") {
    if (["enter", "escape"].includes(key)) {
      e.preventDefault();
      world.finishCinematic();
      creation();
    }
    return;
  }
  if (mode !== "game" || e.altKey || e.metaKey) return;
  if (
    ["INPUT", "SELECT"].includes(document.activeElement?.tagName) &&
    key !== "escape"
  )
    return;
  if (key === "tab" && panel) {
    const focusables = [
      ...document.querySelectorAll(
        ".paper button:not(:disabled),.paper input,.paper select",
      ),
    ];
    const first = focusables[0],
      end = focusables.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      end?.focus();
    } else if (!e.shiftKey && document.activeElement === end) {
      e.preventDefault();
      first?.focus();
    }
    return;
  }
  if (world.cinematic) {
    if (key === "enter" || key === "escape") {
      e.preventDefault();
      act("skip-cinematic");
    }
    return;
  }
  if (dialogue) {
    if (["e", "enter", " "].includes(key) && !e.repeat) {
      e.preventDefault();
      nextDialogue();
    }
    return;
  }
  if (key === "escape") {
    e.preventDefault();
    panel ? closePanel() : openPanel("settings");
    return;
  }
  if (!e.repeat && ["i", "j", "m"].includes(key)) {
    e.preventDefault();
    openPanel({ i: "inventory", j: "journal", m: "map" }[key]);
    return;
  }
  if (panel) return;
  world.activity();
  if (key === "control") {
    e.preventDefault();
    if (!e.repeat) act("roll");
    return;
  }
  if (
    e.ctrlKey &&
    ![
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
    ].includes(key)
  )
    return;
  if (
    [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowleft",
      "arrowdown",
      "arrowright",
      "shift",
      " ",
      "g",
      "tab",
    ].includes(key)
  ) {
    e.preventDefault();
    keys[key] = true;
  }
  if (!e.repeat) {
    if (key === " ") act("attack");
    if (key === "e") act("interact");
    if (key === "g") act("gather");
    if (key === "q") act("potion");
    if (key === "v") act("mount");
    if (key === "f") act("flute");
    if (key === "r") act("respawn");
    if (/^[1-4]$/.test(key)) act("skill", +key - 1);
  }
});
document.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
window.addEventListener("blur", () => {
  keys = {};
  if (mode === "game") world.player.input = {};
});
window.addEventListener("beforeunload", save);
function loop(ms) {
  const dt = Math.min((ms - last) / 1000 || 0.016, 0.05);
  last = ms;
  if (mode === "film") {
    world.update(dt);
    if (world.cinematic) {
      renderer.draw(dt, "film");
      filmCopy();
      sound.tick(world.time, "clear", "", "film");
    } else creation();
  }
  if (mode === "creation") {
    world.time += dt;
    renderer?.draw(dt, "creation");
    sound.tick(world.time, "clear", "", mode);
  }
  if (mode === "game") {
    world.player.input =
      panel || dialogue || world.cinematic
        ? {}
        : {
            up: !!(keys.w || keys.arrowup),
            down: !!(keys.s || keys.arrowdown),
            left: !!(keys.a || keys.arrowleft),
            right: !!(keys.d || keys.arrowright),
            sprint: !!keys.shift,
          };
    if (!panel && !dialogue) world.update(dt);
    if (!panel && !dialogue && !world.cinematic) {
      if (keys[" "]) act("attack");
      if (keys.g) act("gather");
    }
    renderer.draw(dt);
    sound.ambience(
      world.time,
      world.camp && world.camp.area === world.player.area,
    );
    sound.tick(
      world.time,
      world.weather,
      world.player.area === "dungeon" ? "Frostkamm" : zone(world.player),
      mode,
    );
    uiTimer += dt;
    saveTimer += dt;
    if (uiTimer > 0.07) {
      updateUI();
      uiTimer = 0;
    }
    if (saveTimer > 8) {
      save();
      saveTimer = 0;
    }
  }
  requestAnimationFrame(loop);
}
intro();
requestAnimationFrame(loop);
