export const TRACKS = {
  elise: "Für Elise",
  winter: "Vivaldi · Winter",
  autumn: "Cozy Autumn Days",
};
export class Soundscape {
  constructor() {
    this.ctx = null;
    this.volume = 0.45;
    this.music = true;
    this.trackMode = "auto";
    this.currentTrack = "";
    this.players = new Map();
    this.lastThunder = -20;
  }
  start() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
      const b = this.ctx.createBuffer(
          1,
          this.ctx.sampleRate * 3,
          this.ctx.sampleRate,
        ),
        data = b.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = b;
      const noise = this.ctx.createBufferSource();
      noise.buffer = b;
      noise.loop = true;
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 900;
      this.rain = this.ctx.createGain();
      this.rain.gain.value = 0.007;
      noise.connect(f).connect(this.rain).connect(this.master);
      noise.start();
    }
    this.ctx.resume().catch(() => {});
  }
  setVolume(v) {
    this.volume = v;
    if (this.ctx)
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }
  setTrack(name) {
    if (!this.ctx) return;
    if (!this.music) name = "";
    if (this.currentTrack === name) return;
    this.currentTrack = name;
    for (const [key, p] of this.players) {
      p.gain.gain.cancelScheduledValues(this.ctx.currentTime);
      p.gain.gain.setTargetAtTime(
        key === name ? 0.28 : 0,
        this.ctx.currentTime,
        0.7,
      );
      if (key !== name)
        setTimeout(() => {
          if (this.currentTrack !== key) p.audio.pause();
        }, 3500);
    }
    if (!name) return;
    let p = this.players.get(name);
    if (!p) {
      const audio = new Audio(`${import.meta.env.BASE_URL}assets/${name}.mp3`);
      audio.loop = true;
      audio.preload = "none";
      const source = this.ctx.createMediaElementSource(audio),
        gain = this.ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(this.master);
      p = { audio, gain };
      this.players.set(name, p);
    }
    p.gain.gain.setTargetAtTime(0.28, this.ctx.currentTime, 0.8);
    p.audio.play().catch(() => {});
  }
  tone(freq, duration = 0.3, type = "sine", volume = 0.12, delay = 0, endFreq) {
    if (!this.ctx) return;
    const at = this.ctx.currentTime + delay,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (endFreq)
      o.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFreq),
        at + duration,
      );
    g.gain.setValueAtTime(0.001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.002, volume), at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, at + duration);
    o.connect(g).connect(this.master);
    o.start(at);
    o.stop(at + duration + 0.03);
  }
  noise(duration = 0.2, volume = 0.1, freq = 1500, delay = 0) {
    if (!this.ctx) return;
    const at = this.ctx.currentTime + delay,
      n = this.ctx.createBufferSource(),
      f = this.ctx.createBiquadFilter(),
      g = this.ctx.createGain();
    n.buffer = this.noiseBuffer;
    f.type = "bandpass";
    f.frequency.value = freq;
    g.gain.setValueAtTime(volume, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + duration);
    n.connect(f).connect(g).connect(this.master);
    n.start(at);
    n.stop(at + duration);
  }
  play(type, gain = 1) {
    if (type === "mouth") {
      this.noise(0.12, 0.5 * gain, 500);
      this.tone(160, 0.35, "triangle", 0.35 * gain, 0, 35);
      this.tone(45, 0.7, "sine", 0.3 * gain);
    } else if (type === "slash" || type === "dash") {
      this.noise(0.22, 0.24 * gain, 2600);
      this.tone(
        type === "dash" ? 640 : 380,
        0.18,
        "triangle",
        0.1 * gain,
        0,
        90,
      );
    } else if (type === "chop") {
      this.noise(0.12, 0.24 * gain, 650);
      this.tone(135, 0.14, "triangle", 0.24 * gain, 0, 65);
    } else if (type === "mine") {
      this.noise(0.08, 0.2 * gain, 3800);
      this.tone(1520, 0.25, "sine", 0.16 * gain);
      this.tone(2080, 0.17, "triangle", 0.07 * gain, 0.015);
    } else if (type === "heal" || type === "nature" || type === "roots") {
      [330, 440, 659, 880].forEach((f, i) =>
        this.tone(f, 0.7, "sine", 0.1 * gain, i * 0.055),
      );
      if (type === "roots") this.noise(0.5, 0.16 * gain, 350);
    } else if (type === "arcane" || type === "lightning") {
      this.tone(240, 0.5, "sawtooth", 0.055 * gain, 0, 950);
      this.tone(900, 0.4, "sine", 0.13 * gain, 0.08, 180);
      this.noise(0.16, 0.16 * gain, 2200);
    } else if (type === "frost") {
      this.noise(0.7, 0.2 * gain, 4500);
      [1280, 1680, 2100].forEach((f, i) =>
        this.tone(f, 0.6, "sine", 0.07 * gain, i * 0.06),
      );
    } else if (type === "fire") {
      this.noise(0.7, 0.35 * gain, 450);
      this.tone(80, 0.6, "sawtooth", 0.11 * gain, 0, 30);
    } else if (type === "shield" || type === "holy") {
      this.tone(196, 0.6, "triangle", 0.15 * gain);
      this.tone(392, 0.7, "sine", 0.15 * gain, 0.03);
      this.tone(587, 0.6, "sine", 0.08 * gain, 0.1);
      this.noise(0.08, 0.15 * gain, 1500);
    } else if (type === "level")
      [294, 370, 440, 588].forEach((f, i) =>
        this.tone(f, 0.7, "sine", 0.14, i * 0.13),
      );
    else if (type === "loot") {
      this.tone(740, 0.25);
      this.tone(988, 0.3, "sine", 0.09, 0.1);
    } else this.tone(440, 0.08, "sine", 0.035 * gain);
  }
  tick(time, weather, region, screen) {
    if (!this.ctx) return;
    const track =
      this.trackMode !== "auto"
        ? this.trackMode
        : screen !== "game"
          ? "elise"
          : region === "Frostkamm" || region === "Frostwacht"
            ? "winter"
            : "autumn";
    this.setTrack(track);
    this.rain.gain.setTargetAtTime(
      weather === "storm"
        ? 0.14
        : weather === "rain"
          ? 0.065
          : weather === "snow"
            ? 0.015
            : 0.006,
      this.ctx.currentTime,
      1,
    );
    if (
      weather === "storm" &&
      time - this.lastThunder > 7 &&
      Math.sin(time * 0.7) > 0.998
    ) {
      this.lastThunder = time;
      this.noise(2.5, 0.25, 100, 0.2);
      this.tone(40, 2, "sine", 0.2, 0.25, 22);
    }
  }
}
