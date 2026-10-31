export class Soundscape {
  constructor() { this.volume = .35; this.music = true; this.ctx = null; this.nextNote = 0; this.weather = ''; }
  start() {
    if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = this.volume; this.master.connect(this.ctx.destination);
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 3, this.ctx.sampleRate); const d = buffer.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * .35;
      this.noise = this.ctx.createBufferSource(); this.noise.buffer = buffer; this.noise.loop = true; const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 700; this.rain = this.ctx.createGain(); this.rain.gain.value = .015; this.noise.connect(filter).connect(this.rain).connect(this.master); this.noise.start();
    } this.ctx.resume().catch(() => {});
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, .1); }
  tone(freq, duration = .4, type = 'sine', gain = .12, delay = 0) {
    if (!this.ctx) return; const at = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, at); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + .03); g.gain.exponentialRampToValueAtTime(.001, at + duration); o.connect(g).connect(this.master); o.start(at); o.stop(at + duration + .05);
  }
  tick(time, weather, kind = 'elf') {
    if (!this.ctx) return;
    if (this.weather !== weather) { this.weather = weather; this.rain.gain.setTargetAtTime(weather === 'storm' ? .5 : weather === 'rain' ? .25 : weather === 'snow' ? .035 : .012, this.ctx.currentTime, 2); }
    if (this.music && time > this.nextNote) { this.nextNote = time + 2.4; const scale = [146.83, 174.61, 196, 220, 261.63, 293.66]; const f = scale[Math.floor(time / 2.4) % scale.length]; this.tone(f * (kind === 'mage' ? 2 : 1), 3, 'sine', .09); this.tone(f * 1.5, 3, 'sine', .025, .2); if (Math.random() < .3) this.tone(1174, .12, 'sine', .035, .4); }
    if (weather === 'storm' && Math.random() < .0008) { this.tone(42, 2.8, 'sawtooth', .13); this.tone(30, 2, 'sine', .16, .2); }
  }
  play(type) { if (type === 'level') [293.66, 369.99, 440, 587.33].forEach((f, i) => this.tone(f, .8, 'sine', .13, i * .12)); else if (type === 'loot') { this.tone(740, .25); this.tone(988, .3, 'sine', .09, .1); } else if (type === 'attack') this.tone(170, .12, 'triangle', .15); else this.tone(440, .13, 'sine', .05); }
}
