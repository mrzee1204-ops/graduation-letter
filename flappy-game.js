(() => {
  "use strict";

  const WORLD = Object.freeze({ width: 360, height: 540, floor: 492, birdX: 92, radius: 10, gravity: 880, flap: -275, speed: 132, gap: 160, pipeWidth: 56, spacing: 204 });
  const BIOMES = Object.freeze([
    { start: 0, name: "Hutan", sky: ["#75c6cc", "#e3efc3"], pipe: ["#456433", "#a5cd64", "#e4f3a8", "#638d39"], ground: ["#87b657", "#ded0a1"], accent: "#315b4b" },
    { start: 250, name: "Perkotaan", sky: ["#7b8ebd", "#f4c8b7"], pipe: ["#3e526d", "#8aadc3", "#d4e6ed", "#577b99"], ground: ["#9fa8b7", "#566273"], accent: "#404b76" },
    { start: 500, name: "Gurun", sky: ["#df9a74", "#f9dfab"], pipe: ["#8a523c", "#dca269", "#ffe0a0", "#b16f4b"], ground: ["#e7bd72", "#d6a269"], accent: "#8b513d" },
    { start: 750, name: "Kutub Selatan", sky: ["#729bc9", "#dcf3ef"], pipe: ["#5c8dba", "#b4e3ed", "#f1ffff", "#83bfd8"], ground: ["#f4fcf5", "#b6dce6"], accent: "#426488" },
    { start: 1000, name: "Savana Afrika", sky: ["#d58072", "#f9dca0"], pipe: ["#7b603a", "#c3a254", "#f9db88", "#9e7d42"], ground: ["#c5ab58", "#d5b57d"], accent: "#70533d" },
    { start: 1250, name: "Pegunungan Himalaya", sky: ["#6384b1", "#e0e8ed"], pipe: ["#4c647d", "#9cbdcc", "#f5f8ed", "#6c8f9f"], ground: ["#e7efe8", "#a0a9b3"], accent: "#425b78" },
    { start: 1500, name: "Grand Canyon / Ngarai", sky: ["#b68394", "#f9d3a1"], pipe: ["#793f38", "#c27a58", "#f2be83", "#9e5144"], ground: ["#d49767", "#ae674e"], accent: "#793f45" },
    { start: 1750, name: "Air Terjun", sky: ["#619f9a", "#d7edcb"], pipe: ["#375e55", "#77a786", "#ccedc0", "#4e8070"], ground: ["#83b296", "#67938c"], accent: "#315f59" },
    { start: 2000, name: "Laut & Pantai", sky: ["#63bdd3", "#fff1cf"], pipe: ["#916746", "#dbb982", "#fff0bd", "#b88c61"], ground: ["#f5e3b0", "#dec394"], accent: "#376f82" },
    { start: 2250, name: "Danau & Padang Rumput", sky: ["#84b8ca", "#edf0c4"], pipe: ["#497046", "#99bc77", "#dbedab", "#6f9457"], ground: ["#a3bb6b", "#b8ac7c"], accent: "#426f58" },
    { start: 2500, name: "Gunung Berapi", sky: ["#42394f", "#cf725d"], pipe: ["#412f3c", "#82606a", "#f8a677", "#5c424f"], ground: ["#cf7756", "#55434d"], accent: "#804244" },
    { start: 3000, name: "Bawah Laut", sky: ["#389bad", "#123b67"], pipe: ["#264b69", "#52859d", "#a6d9dc", "#36667f"], ground: ["#97c0b7", "#677f95"], accent: "#315576" },
    { start: 3500, name: "Dataran Tinggi di Atas Awan", sky: ["#9a98cb", "#ffe9cb"], pipe: ["#6d6b9a", "#b6b0d4", "#fff5e4", "#9290bb"], ground: ["#c5d3ab", "#a09aac"], accent: "#68608f" }
  ]);
  const biomeForScore = score => {
    for (let i = BIOMES.length - 1; i > 0; i--) if (score >= BIOMES[i].start) return i;
    return 0;
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const biomeProgress = score => {
    const index = biomeForScore(score);
    const next = BIOMES[index + 1];
    return next ? clamp((score - BIOMES[index].start) / (next.start - BIOMES[index].start), 0, 1) : 1;
  };

  class Flight {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() {
      this.score = 0;
      this.distance = 0;
      this.bird = { x: WORLD.birdX, y: 244, velocity: 0 };
      this.pipes = [];
      this.nextPipe = 204;
      this.lastCenter = 250;
      this.alive = false;
      this.addPipe(WORLD.width + 46);
    }
    addPipe(x) {
      this.lastCenter = clamp(this.lastCenter + (this.random() - .5) * 140, 136, 362);
      this.pipes.push({ x, center: this.lastCenter, passed: false });
    }
    start() { this.reset(); this.alive = true; this.flap(); }
    flap() { if (this.alive) this.bird.velocity = WORLD.flap; }
    overlaps(x, y, width, height) {
      const dx = this.bird.x - clamp(this.bird.x, x, x + width);
      const dy = this.bird.y - clamp(this.bird.y, y, y + height);
      return dx * dx + dy * dy < WORLD.radius * WORLD.radius;
    }
    step(dt) {
      if (!this.alive) return { points: 0, hit: false, changed: false };
      const previousBiome = biomeForScore(this.score);
      const previousScore = this.score;
      this.bird.velocity = Math.min(440, this.bird.velocity + WORLD.gravity * dt);
      this.bird.y += this.bird.velocity * dt;
      this.distance += WORLD.speed * dt;
      for (const pipe of this.pipes) pipe.x -= WORLD.speed * dt;
      while (this.distance >= this.nextPipe) {
        this.addPipe(WORLD.width + 46 - (this.distance - this.nextPipe));
        this.nextPipe += WORLD.spacing;
      }
      let hit = this.bird.y - WORLD.radius <= 0 || this.bird.y + WORLD.radius >= WORLD.floor;
      for (const pipe of this.pipes) {
        const top = pipe.center - WORLD.gap / 2;
        const bottom = pipe.center + WORLD.gap / 2;
        hit ||= this.overlaps(pipe.x, 0, WORLD.pipeWidth, top - 16)
          || this.overlaps(pipe.x - 4, top - 16, WORLD.pipeWidth + 8, 16)
          || this.overlaps(pipe.x - 4, bottom, WORLD.pipeWidth + 8, 16)
          || this.overlaps(pipe.x, bottom + 16, WORLD.pipeWidth, WORLD.floor - bottom - 16);
      }
      if (hit) {
        this.alive = false;
        this.bird.y = clamp(this.bird.y, WORLD.radius, WORLD.floor - WORLD.radius);
      } else {
        for (const pipe of this.pipes) {
          if (!pipe.passed && pipe.x + WORLD.pipeWidth + 4 < this.bird.x - WORLD.radius) {
            pipe.passed = true;
            this.score += 5;
          }
        }
      }
      this.pipes = this.pipes.filter(pipe => pipe.x + WORLD.pipeWidth + 6 > 0);
      return { points: this.score - previousScore, hit, changed: previousBiome !== biomeForScore(this.score) };
    }
  }

  if (typeof module === "object" && module.exports) {
    module.exports = { Flight, WORLD, BIOMES, biomeForScore, biomeProgress };
    return;
  }

  const $ = selector => document.querySelector(selector);
  const section = $("#littleFlight");
  if (!section) return;
  const panel = $("#flightConsole");
  const canvas = $("#flightCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const stage = $("#flightStage");
  const menu = $("#flightMenu");
  const action = $("#flightAction");
  const expand = $("#flightExpand");
  const exit = $("#flightExit");
  const pause = $("#flightPause");
  const dialog = $("#flightDialog");
  const slot = $("#flightSlot");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const storageKey = "hana.flappy-little-journey.highscore.v1";
  const token = `flight-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const round = new Flight();
  let mode = "home";
  let best = 0;
  let active = false;
  let expanded = false;
  let historyOwned = false;
  let historyClosing = false;
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let accumulator = 0;
  let scenery = 0;
  let clock = 0;
  let bubble = 0;
  let announcement = 0;
  let scoreFlash = 0;
  let lastRound = 0;
  let roundNumber = 0;
  let savedScroll = 0;

  try {
    const value = Number(localStorage.getItem(storageKey));
    if (Number.isSafeInteger(value) && value >= 0) best = Math.floor(value / 10) * 10;
  } catch (_) {}

  const rect = (color, x, y, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
  };
  const polygon = (color, points) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(Math.round(x), Math.round(y)) : ctx.moveTo(Math.round(x), Math.round(y)));
    ctx.closePath(); ctx.fill();
  };
  const noise = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const wrap = (n, size) => ((n % size) + size) % size;

  function sun(x, y, radius, color) {
    rect(color, x - radius * .65, y - radius, radius * 1.3, radius * 2);
    rect(color, x - radius, y - radius * .65, radius * 2, radius * 1.3);
    rect(color, x - radius * .87, y - radius * .87, radius * 1.74, radius * 1.74);
  }

  function cloud(x, y, size, color) {
    rect(color, x, y + 8 * size, 56 * size, 13 * size);
    rect(color, x + 8 * size, y, 19 * size, 22 * size);
    rect(color, x + 26 * size, y + 4 * size, 22 * size, 20 * size);
    rect(color, x - 7 * size, y + 14 * size, 69 * size, 7 * size);
  }

  function hills(color, baseline, amplitude, period, offset) {
    const points = [[0, WORLD.floor]];
    for (let x = -8; x <= WORLD.width + 8; x += 8) points.push([x, baseline + Math.sin((x + offset) / period) * amplitude]);
    points.push([WORLD.width, WORLD.floor]);
    polygon(color, points);
  }

  function pine(x, base, height, color) {
    rect(color, x - 3, base - height, 6, height);
    for (let i = 0; i < 4; i++) {
      const y = base - height + i * height * .17;
      const span = height * (.12 + i * .035);
      polygon(color, [[x, y], [x + span, y + height * .4], [x - span, y + height * .4]]);
    }
  }

  function tree(x, base, height, shade, leaves, acacia = false) {
    const top = base - height;
    rect(shade, x - 4, top + 20, 9, height - 20);
    polygon(shade, [[x - 2, top + 55], [x - 24, top + 20], [x - 14, top + 20], [x + 5, top + 45]]);
    polygon(shade, [[x, top + 45], [x + 26, top + 12], [x + 31, top + 14], [x + 7, top + 59]]);
    if (acacia) {
      rect(leaves, x - 51, top + 15, 105, 13);
      rect(leaves, x - 36, top + 5, 74, 18);
      rect(leaves, x - 18, top, 42, 14);
    } else {
      cloud(x - 38, top, 1.3, leaves);
      cloud(x - 26, top + 22, .9, leaves);
      rect("#ffffff12", x - 25, top + 7, 22, 5);
    }
  }

  function forest() {
    hills("#98c2a1", 333, 34, 74, scenery * .14);
    hills("#76a78d", 368, 28, 58, scenery * .23);
    for (let i = -1; i < 8; i++) {
      const x = i * 66 - wrap(scenery * .24, 66);
      pine(x, 424, 90 + noise(i + 7) * 55, "#66957d");
    }
    for (let i = -1; i < 4; i++) tree(i * 159 - wrap(scenery * .46, 159), 486, 136 + noise(i + 12) * 44, "#537a62", "#48886c");
    hills("#36755e", 462, 11, 23, scenery * .65);
    for (let i = 0; i < 13; i++) {
      const x = wrap(i * 31 - scenery * .55, 360);
      const y = 399 + noise(i) * 68 + Math.sin(clock * 1.6 + i) * 6;
      ctx.globalAlpha = .3 + .5 * Math.sin(clock * 2 + i) ** 2;
      rect("#fff3ae", x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function city() {
    for (let layer = 0; layer < 2; layer++) {
      const stride = layer ? 70 : 54;
      const base = layer ? 457 : 393;
      for (let i = -1; i < 9; i++) {
        const x = i * stride - wrap(scenery * (layer ? .34 : .16), stride);
        const height = 65 + noise(i + layer * 31 + 9) * (layer ? 90 : 115);
        const top = base - height;
        rect(layer ? "#626c90" : "#a5a3ba", x, top, stride - 7, height);
        rect(layer ? "#555d7d" : "#969bb3", x + stride - 17, top, 10, height);
        if (i % 2) { rect("#7b819f", x + 15, top - 12, 15, 12); rect("#777f9f", x + 20, top - 28, 2, 16); }
        for (let row = 12; row < height - 5; row += 18) for (let col = 8; col < stride - 14; col += 14) {
          const lit = noise(i * 43 + row + col) > .3;
          rect(lit ? (layer ? "#eecf9c" : "#d4c4b9") : "#8093ae", x + col, top + row, 5, 8);
        }
      }
    }
    rect("#969bb2", 0, 451, 360, 41);
    rect("#6c7690", 0, 466, 360, 26);
    for (let i = -1; i < 10; i++) rect("#e9d3b1", i * 50 - wrap(scenery * .65, 50), 480, 26, 2);
    for (let i = 0; i < 3; i++) {
      const x = wrap(i * 155 + clock * (i % 2 ? -17 : 20) - scenery * .3, 440) - 40;
      const y = i % 2 ? 463 : 477;
      rect(i % 2 ? "#cc90a0" : "#e1c69a", x, y - 9, 29, 10);
      rect("#dfe7eb", x + 6, y - 13, 14, 5);
      rect("#434963", x + 3, y, 5, 4); rect("#434963", x + 21, y, 5, 4);
    }
  }

  function desert() {
    hills("#e2b589", 322, 30, 85, scenery * .1);
    for (let i = -1; i < 3; i++) {
      const x = i * 225 - wrap(scenery * .19, 225);
      polygon("#d7a27a", [[x, 400], [x + 83, 263], [x + 170, 400]]);
      polygon("#bc896d", [[x + 83, 263], [x + 109, 400], [x + 170, 400]]);
    }
    hills("#edc58e", 385, 20, 83, scenery * .29);
    hills("#deb079", 446, 24, 62, scenery * .43);
    for (let i = -1; i < 4; i++) {
      const x = i * 142 - wrap(scenery * .6, 142);
      rect("#869069", x, 411, 9, 72);
      rect("#798360", x - 14, 430, 7, 25); rect("#798360", x - 8, 448, 12, 7);
      rect("#8f986f", x + 14, 420, 7, 29); rect("#8f986f", x + 7, 442, 12, 7);
      rect("#9da780", x + 2, 415, 2, 57);
      rect("#bd8e61", x + 43, 478, 24, 9); rect("#d3a36d", x + 47, 472, 14, 7);
    }
    for (let i = 0; i < 15; i++) rect("#fae2af99", wrap(i * 47 - clock * 17, 360), 338 + noise(i) * 142, 4, 1);
  }

  function antarctica() {
    for (let i = -1; i < 4; i++) {
      const x = i * 147 - wrap(scenery * .12, 147);
      const top = 257 + noise(i + 7) * 25;
      polygon("#b1ccdf", [[x - 50, 403], [x + 38, top], [x + 148, 403]]);
      polygon("#eaf4ef", [[x + 38, top], [x - 1, top + 65], [x + 30, top + 53], [x + 48, top + 70], [x + 69, top + 44]]);
      polygon("#8eafce", [[x + 38, top], [x + 65, 403], [x + 148, 403]]);
    }
    rect("#85bdce", 0, 394, 360, 98);
    for (let i = 0; i < 9; i++) {
      const x = wrap(i * 71 - scenery * .32, 430) - 40;
      rect("#b4e4e5", x, 407 + (i % 4) * 17, 33, 2);
      rect("#f1fcf4", x + 7, 428 + (i % 3) * 14, 30, 6);
      rect("#bddee5", x + 11, 434 + (i % 3) * 14, 23, 6);
    }
    hills("#dbf0ed", 468, 12, 34, scenery * .49);
    for (let i = -1; i < 3; i++) {
      const x = i * 180 - wrap(scenery * .6, 180) + 53;
      rect("#4a5d73", x, 452, 13, 24); rect("#4a5d73", x + 3, 447, 9, 8);
      rect("#f4f6e8", x + 3, 459, 8, 15); rect("#e1b174", x + 11, 452, 5, 3);
      rect("#e1b174", x, 476, 6, 3); rect("#e1b174", x + 9, 476, 6, 3);
      rect("#263b50", x + 8, 450, 2, 2);
    }
    for (let i = 0; i < 29; i++) {
      const x = wrap(i * 41 + Math.sin(clock + i) * 8 - clock * 10, 360);
      const y = wrap(i * 37 + clock * (9 + i % 7), 490);
      rect("#f5fffcba", x, y, i % 3 ? 2 : 3, 2);
    }
  }

  function savanna() {
    hills("#c39772", 352, 22, 87, scenery * .13);
    hills("#c6a76c", 395, 16, 67, scenery * .24);
    for (let i = -1; i < 4; i++) tree(i * 185 - wrap(scenery * .4, 185), 472, 105 + noise(i + 8) * 30, "#776550", "#8a8955", true);
    hills("#b2a15e", 467, 10, 28, scenery * .54);
    const giraffe = wrap(251 - scenery * .35, 590) - 35;
    rect("#b8804f", giraffe, 439, 26, 14); rect("#b8804f", giraffe + 21, 405, 8, 42);
    rect("#bf915e", giraffe + 22, 400, 18, 10);
    rect("#956d4f", giraffe + 24, 395, 2, 7); rect("#956d4f", giraffe + 31, 395, 2, 7);
    rect("#a7784d", giraffe + 3, 450, 4, 27); rect("#a7784d", giraffe + 21, 450, 4, 27);
    for (let i = 0; i < 4; i++) rect("#895f43", giraffe + 22, 414 + i * 7, 4, 3);
    rect("#895f43", giraffe + 6, 442, 5, 4); rect("#895f43", giraffe + 16, 447, 5, 4);
    const elephant = wrap(45 - scenery * .3, 550) - 60;
    rect("#8b826f", elephant, 446, 35, 21); rect("#8b826f", elephant + 28, 445, 17, 19);
    rect("#7e7666", elephant + 23, 445, 11, 17); rect("#8b826f", elephant + 40, 455, 5, 20);
    rect("#8b826f", elephant + 3, 464, 7, 15); rect("#8b826f", elephant + 27, 464, 7, 15);
    for (let i = 0; i < 8; i++) {
      const x = wrap(i * 64 - clock * 13, 400) - 20;
      const y = 202 + noise(i) * 60;
      const wing = Math.sin(clock * 5 + i) > 0 ? -3 : 2;
      rect("#856f66", x, y, 2, 2); rect("#856f66", x - 4, y + wing, 4, 2); rect("#856f66", x + 2, y + wing, 4, 2);
    }
  }

  function himalaya() {
    for (let layer = 0; layer < 2; layer++) {
      const stride = layer ? 230 : 170;
      for (let i = -1; i < 4; i++) {
        const x = i * stride - wrap(scenery * (layer ? .24 : .1), stride);
        const peak = 163 + noise(i + layer * 17) * 75 + layer * 56;
        const summit = x + stride * .48;
        polygon(layer ? "#748fa4" : "#a5bacd", [[x - 35, 474], [summit, peak], [x + stride + 40, 474]]);
        polygon(layer ? "#526b88" : "#879db8", [[summit, peak], [summit + 18, 474], [x + stride + 40, 474]]);
        polygon("#eef5ee", [[summit, peak], [summit - 43, peak + 91], [summit - 10, peak + 66], [summit + 5, peak + 87], [summit + 21, peak + 66], [summit + 55, peak + 97]]);
        polygon("#c4dce0", [[summit, peak], [summit + 5, peak + 87], [summit + 21, peak + 66], [summit + 55, peak + 97]]);
      }
    }
    hills("#c1d6d9", 464, 13, 54, scenery * .4);
    for (let i = -1; i < 6; i++) pine(i * 86 - wrap(scenery * .5, 86), 486, 40 + noise(i + 5) * 23, "#577a7d");
    for (let i = 0; i < 24; i++) rect("#f4fcf7a8", wrap(i * 47 - clock * 12, 360), wrap(i * 53 + clock * 14, 486), 2, 2);
  }

  function canyon() {
    for (let layer = 0; layer < 2; layer++) {
      const stride = layer ? 205 : 145;
      for (let i = -1; i < 4; i++) {
        const x = i * stride - wrap(scenery * (layer ? .32 : .13), stride);
        const top = (layer ? 284 : 224) + noise(i + 9 + layer) * 45;
        polygon(layer ? "#aa634e" : "#d29674", [[x - 20, 466], [x + 4, top + 60], [x + 19, top + 60], [x + 30, top], [x + 87, top], [x + 99, top + 83], [x + 120, 466]]);
        polygon(layer ? "#814c46" : "#bd7c64", [[x + 70, top], [x + 87, top], [x + 99, top + 83], [x + 120, 466], [x + 79, 466]]);
        for (let band = 0; band < 5; band++) rect(layer ? "#d79a6c" : "#e8b08a", x + 27 - band * 3, top + 28 + band * 28, 45 + band * 4, 4);
      }
    }
    hills("#bb7a59", 460, 15, 60, scenery * .4);
    polygon("#6ca7a1", [[188, 411], [207, 411], [162, 450], [198, 469], [250, 492], [152, 492], [143, 467], [139, 446]]);
    polygon("#b2cec0", [[191, 423], [181, 439], [154, 451], [179, 468], [173, 468], [148, 450], [174, 438]]);
    for (let i = 0; i < 5; i++) {
      const x = wrap(i * 93 - scenery * .5, 440) - 40;
      rect("#96553f", x, 476, 30, 12); rect("#d89b70", x + 5, 468, 18, 9);
    }
  }

  function waterfall() {
    hills("#85b6a0", 303, 31, 70, scenery * .12);
    hills("#579489", 342, 33, 50, scenery * .23);
    for (let i = -1; i < 3; i++) {
      const x = i * 252 - wrap(scenery * .24, 252);
      polygon("#537b73", [[x - 10, 440], [x + 12, 277], [x + 49, 254], [x + 164, 271], [x + 214, 327], [x + 237, 440]]);
      rect("#3d645d", x + 69, 289, 65, 144);
      rect("#92d8d4", x + 77, 276, 48, 154);
      rect("#dbf5e5", x + 83, 276, 11, 157);
      rect("#b9eee3", x + 108, 277, 9, 153);
      for (let j = 0; j < 13; j++) rect("#ffffffaf", x + 81 + j % 3 * 14, 282 + wrap(j * 27 + clock * 86, 143), 3, 15);
      rect("#79a975", x + 20, 265, 140, 12);
      cloud(x + 54, 418, 1.2, "#e9f8de97");
    }
    rect("#70bcb7", 0, 443, 360, 49);
    for (let i = 0; i < 18; i++) rect("#d8f3d9a0", wrap(i * 53 - scenery * .34 + clock * 7, 380) - 10, 449 + i % 5 * 8, 10 + i % 4 * 6, 2);
    for (let i = -1; i < 4; i++) tree(i * 184 - wrap(scenery * .48, 184), 485, 115, "#446e5e", "#4c8768");
    for (let i = 0; i < 10; i++) rect("#edfff0a0", wrap(i * 61 + clock * 5, 360), 397 + noise(i) * 77 + Math.sin(clock + i) * 5, 2, 2);
  }

  function coast() {
    rect("#4ba9b7", 0, 311, 360, 181);
    rect("#8ec9c5", 0, 311, 360, 4);
    for (let i = 0; i < 25; i++) {
      const y = 325 + i % 8 * 15;
      const x = wrap(i * 71 - scenery * .2 + Math.sin(clock + i) * 9, 400) - 20;
      rect(i % 3 ? "#a5e3d29c" : "#e8f6ddbb", x, y, 14 + i % 5 * 6, 2);
    }
    hills("#b5e1ca", 434, 15, 65, scenery * .22 + Math.sin(clock) * 7);
    hills("#fff0c4", 450, 16, 65, scenery * .22);
    hills("#ead49d", 462, 13, 65, scenery * .22);
    for (let i = -1; i < 3; i++) {
      const x = i * 226 - wrap(scenery * .43, 226);
      polygon("#9b7c50", [[x, 484], [x + 9, 484], [x + 22, 359], [x + 14, 357]]);
      for (let j = 0; j < 5; j++) rect("#c3a372", x + 5 + j * 2, 465 - j * 20, 8, 3);
      polygon("#558b63", [[x + 18, 356], [x - 19, 338], [x - 43, 363], [x - 13, 351], [x + 18, 363]]);
      polygon("#3d7c59", [[x + 18, 356], [x + 52, 339], [x + 76, 366], [x + 46, 351], [x + 20, 364]]);
      polygon("#70a16a", [[x + 18, 356], [x + 1, 329], [x + 6, 305], [x + 24, 342], [x + 44, 315], [x + 45, 339]]);
      rect("#836242", x + 12, 358, 7, 8);
    }
    const boat = wrap(223 - scenery * .12 + clock * 4, 470) - 45;
    polygon("#e8dbc4", [[boat, 338], [boat + 34, 338], [boat + 27, 346], [boat + 6, 346]]);
    rect("#6d8891", boat + 18, 298, 2, 40);
    polygon("#fff7df", [[boat + 16, 300], [boat + 16, 333], [boat - 1, 333]]);
    for (let i = 0; i < 4; i++) {
      const x = wrap(i * 121 + clock * 9 - scenery * .08, 390);
      const y = 208 + i % 3 * 23;
      const wing = Math.sin(clock * 3 + i) * 3;
      rect("#fcf7df", x - 5, y + wing, 5, 2); rect("#fcf7df", x, y, 2, 2); rect("#fcf7df", x + 2, y + wing, 5, 2);
    }
  }

  function deer(x, y, scale = 1) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(scale, scale);
    rect("#94704f", 0, -20, 25, 12); rect("#94704f", 21, -32, 6, 20);
    rect("#b09365", 22, -35, 13, 7); rect("#493e3d", 31, -33, 2, 2);
    for (let i = 0; i < 3; i++) rect("#705e49", 3 + i * 9, -10, 3, 11);
    rect("#705e49", 23, -43, 2, 10); rect("#705e49", 19, -42, 6, 2);
    rect("#705e49", 28, -41, 2, 8); rect("#705e49", 29, -42, 5, 2);
    rect("#e6d3a3", 2, -15, 8, 4); rect("#705e49", -5, -21, 7, 3);
    ctx.restore();
  }

  function lake() {
    hills("#96baa2", 309, 35, 80, scenery * .12);
    hills("#72a58c", 357, 24, 60, scenery * .2);
    for (let i = -1; i < 6; i++) pine(i * 96 - wrap(scenery * .24, 96), 375, 64 + noise(i + 4) * 34, "#608f7a");
    rect("#77b6bd", 0, 378, 360, 96);
    for (let i = 0; i < 17; i++) rect("#c0ded099", wrap(i * 53 - scenery * .2 + clock * 3, 380) - 15, 388 + i % 6 * 12, 22, 2);
    hills("#b2c77c", 458, 17, 78, scenery * .33);
    hills("#8dad68", 481, 8, 39, scenery * .48);
    deer(wrap(80 - scenery * .35, 470) - 45, 467);
    deer(wrap(145 - scenery * .35, 470) - 45, 466, .65);
    for (let i = 0; i < 3; i++) {
      const x = wrap(65 + i * 121 + clock * 5 - scenery * .2, 410) - 25;
      rect("#d6c9a0", x, 416 + i % 2 * 12, 14, 6);
      rect("#476f62", x + 9, 410 + i % 2 * 12, 6, 8);
      rect("#eac77f", x + 15, 413 + i % 2 * 12, 4, 2);
    }
    const rabbit = wrap(300 - scenery * .48, 470) - 25;
    rect("#d1c4a5", rabbit, 475, 13, 9); rect("#d1c4a5", rabbit + 9, 470, 8, 9);
    rect("#d1c4a5", rabbit + 10, 461, 3, 12); rect("#d1c4a5", rabbit + 15, 463, 3, 10);
    rect("#534f48", rabbit + 14, 473, 2, 2);
    for (let i = 0; i < 24; i++) {
      const x = wrap(i * 43 - scenery * .5, 380) - 10;
      const y = 472 + i % 4 * 5;
      rect("#668c58", x, y, 2, 10); rect(i % 2 ? "#f8e5ac" : "#deb3c4", x - 2, y - 3, 6, 4);
    }
  }

  function volcano() {
    hills("#64505d", 334, 33, 74, scenery * .11);
    const x = 155 - Math.sin(scenery * .0009) * 45;
    for (let i = 0; i < 7; i++) cloud(x - 14 + Math.sin(clock * .4 + i) * 13 + i * 7, 221 - i * 23 - wrap(clock * 5, 23), .6 + i * .16, "#61576780");
    polygon("#55404c", [[x - 165, 472], [x - 24, 240], [x + 25, 240], [x + 171, 472]]);
    polygon("#3e3546", [[x + 7, 246], [x + 25, 240], [x + 171, 472], [x + 30, 472]]);
    rect("#ef8f62", x - 24, 239, 49, 8);
    polygon("#e27650", [[x - 7, 244], [x + 9, 245], [x - 5, 295], [x + 21, 327], [x + 6, 365], [x + 57, 448], [x + 37, 448], [x - 8, 367], [x + 7, 328], [x - 20, 296]]);
    polygon("#ffca78", [[x - 3, 246], [x + 3, 246], [x - 12, 297], [x + 14, 328], [x + 8, 330], [x - 17, 299]]);
    hills("#644651", 453, 20, 42, scenery * .36);
    hills("#423741", 480, 9, 26, scenery * .55);
    for (let i = 0; i < 6; i++) {
      const rock = wrap(i * 73 - scenery * .5, 430) - 35;
      polygon("#f39457", [[rock, 483], [rock + 12, 476], [rock + 36, 479], [rock + 43, 485], [rock + 26, 488]]);
      rect("#ffd17e", rock + 15, 480, 15, 2);
    }
    for (let i = 0; i < 25; i++) {
      const sparkX = wrap(i * 47 + Math.sin(clock + i) * 8 - clock * 8, 360);
      const sparkY = wrap(i * 61 - clock * (13 + i % 7), 492);
      rect(i % 3 ? "#f4b777b0" : "#ffebbb", sparkX, sparkY, 2, i % 3 ? 2 : 4);
    }
  }

  function fish(x, y, color, size = 1, direction = 1) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(size * direction, size);
    polygon(color, [[-12, -6], [-4, -1], [-12, 6]]);
    rect(color, -5, -6, 17, 12); rect(color, 11, -3, 4, 6);
    rect("#f5e8bca0", 0, -5, 3, 10); rect("#183b54", 10, -3, 2, 2);
    ctx.restore();
  }

  function underwater() {
    for (let i = 0; i < 4; i++) {
      const x = i * 121 + Math.sin(clock * .4 + i) * 10;
      polygon("#b8ecdb0e", [[x, 0], [x + 26, 0], [x - 50, 492], [x - 99, 492]]);
    }
    hills("#24556e", 403, 32, 63, scenery * .16);
    hills("#356e7b", 451, 19, 50, scenery * .3);
    hills("#83aea7", 482, 8, 42, scenery * .42);
    for (let i = 0; i < 9; i++) {
      const x = wrap(i * 59 - scenery * .4, 420) - 30;
      const stemHeight = 34 + noise(i + 3) * 51;
      const points = [];
      for (let j = 0; j < 8; j++) points.push([x + Math.sin(clock * 1.2 + i + j * .5) * (8 - j), 492 - stemHeight + j * stemHeight / 7]);
      for (let j = 7; j >= 0; j--) points.push([points[j][0] + 5, points[j][1]]);
      polygon(i % 2 ? "#478e82" : "#65ad97", points);
    }
    for (let i = 0; i < 5; i++) {
      const x = wrap(i * 107 - scenery * .5, 470) - 40;
      const coral = i % 2 ? "#c994b2" : "#df9c8f";
      rect(coral, x, 461, 6, 30); rect(coral, x - 13, 449, 5, 24); rect(coral, x - 9, 467, 10, 5);
      rect(coral, x + 15, 454, 5, 25); rect(coral, x + 5, 473, 13, 5);
      rect("#efc5ae", x - 14, 447, 7, 4); rect("#efc5ae", x + 14, 451, 7, 4);
    }
    for (let i = 0; i < 8; i++) fish(wrap(i * 71 + clock * (i % 2 ? -13 : 16) - scenery * .17, 430) - 35, 211 + noise(i + 7) * 176 + Math.sin(clock + i) * 7, ["#f4c58b", "#97ced8", "#d9a9cc"][i % 3], .5 + i % 3 * .15, i % 2 ? -1 : 1);
    const turtle = wrap(275 + clock * 5 - scenery * .13, 480) - 50;
    const ty = 337 + Math.sin(clock * .7) * 9;
    rect("#90bfa4", turtle + 24, ty + 4, 12, 8);
    polygon("#79b49e", [[turtle + 8, ty + 7], [turtle - 5, ty - 6], [turtle + 12, ty - 1]]);
    polygon("#79b49e", [[turtle + 8, ty + 15], [turtle - 5, ty + 25], [turtle + 15, ty + 19]]);
    rect("#598f85", turtle, ty, 27, 19); rect("#80ac90", turtle + 4, ty + 3, 18, 12);
    rect("#315771", turtle + 31, ty + 5, 2, 2);
    const jelly = wrap(55 - scenery * .19, 450) - 30;
    const jy = 304 + Math.sin(clock) * 10;
    rect("#c7c5e088", jelly, jy, 22, 13); rect("#e2d9e8aa", jelly + 4, jy - 5, 14, 7);
    for (let j = 0; j < 4; j++) rect("#ccdaec88", jelly + j * 6 + Math.sin(clock * 2 + j) * 2, jy + 12, 2, 13 + j % 2 * 7);
    for (let i = 0; i < 22; i++) {
      const bx = wrap(i * 43 + Math.sin(clock + i) * 5, 360);
      const by = wrap(i * 57 - clock * (12 + i % 7), 490);
      ctx.strokeStyle = "#dcf9f57a"; ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(bx), Math.round(by), 2 + i % 3, 3 + i % 3);
    }
  }

  function cloudHighlands() {
    for (let i = -1; i < 4; i++) {
      const x = i * 146 - wrap(scenery * .09, 146);
      polygon("#afadcc", [[x - 20, 385], [x + 50, 233 + noise(i + 1) * 45], [x + 133, 385]]);
    }
    for (let i = -1; i < 5; i++) cloud(i * 128 - wrap(scenery * .17, 128), 348 + i % 2 * 14, 2.1, "#f5e8e9");
    rect("#f5e8e9", 0, 396, 360, 96);
    for (let i = -1; i < 3; i++) {
      const x = i * 238 - wrap(scenery * .3, 238);
      const y = 331 + noise(i + 4) * 45;
      polygon("#89829e", [[x - 10, y], [x + 125, y], [x + 101, y + 39], [x + 73, y + 65], [x + 48, y + 104], [x + 29, y + 54], [x + 10, y + 46]]);
      polygon("#6b6b8b", [[x + 64, y], [x + 125, y], [x + 101, y + 39], [x + 48, y + 104]]);
      polygon("#bed0a0", [[x - 11, y], [x + 12, y - 15], [x + 87, y - 19], [x + 125, y - 5], [x + 127, y + 5], [x + 9, y + 8]]);
      rect("#dfdfb6", x + 20, y - 10, 58, 4);
      pine(x + 37, y - 10, 51, "#70928a"); pine(x + 71, y - 14, 38, "#84a18f");
      for (let j = 0; j < 5; j++) rect(j % 2 ? "#edbfd1" : "#faf0c9", x + j * 15 + 8, y - 3, 3, 3);
    }
    for (let i = -1; i < 5; i++) cloud(i * 132 - wrap(scenery * .43, 132), 445 + i % 2 * 14, 2.2, "#fff4e9");
    for (let i = 0; i < 12; i++) {
      const x = wrap(i * 37 - clock * 4, 360);
      const y = 168 + noise(i + 4) * 251;
      ctx.globalAlpha = .25 + Math.sin(clock * 1.5 + i) ** 2 * .55;
      rect("#fff4cf", x - 2, y, 5, 1); rect("#fff4cf", x, y - 2, 1, 5);
    }
    ctx.globalAlpha = 1;
  }

  const SCENES = [forest, city, desert, antarctica, savanna, himalaya, canyon, waterfall, coast, lake, volcano, underwater, cloudHighlands];

  function background(biome) {
    const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.floor);
    gradient.addColorStop(0, biome.sky[0]); gradient.addColorStop(1, biome.sky[1]);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 360, 540);
    const index = biomeForScore(round.score);
    if (index !== 11) sun(281, index === 4 ? 205 : 100, index === 4 ? 45 : 27, index === 3 || index === 5 ? "#f9fbdf" : index === 10 ? "#f5a58077" : "#fff2c2b3");
    if (![2, 10, 11].includes(index)) for (let i = 0; i < 5; i++) cloud(wrap(i * 110 - scenery * .1 - clock * 2, 510) - 95, 108 + noise(i + 2) * 145, .7 + noise(i) * .7, index === 1 ? "#f7dbd269" : "#f9f5d880");
    SCENES[index]();
  }

  function pipePart(x, y, height, palette, capTop) {
    if (height <= 0) return;
    const width = WORLD.pipeWidth;
    rect(palette[0], x, y, width, height);
    rect(palette[1], x + 3, y + 2, width - 6, Math.max(0, height - 2));
    rect(palette[2], x + 8, y + 2, 5, Math.max(0, height - 2));
    rect(palette[2] + "88", x + 14, y + 2, 5, Math.max(0, height - 2));
    rect(palette[3], x + width - 14, y + 2, 10, Math.max(0, height - 2));
    const capY = capTop ? y : y + height - 17;
    rect(palette[0], x - 4, capY, width + 8, 17);
    rect(palette[1], x - 1, capY + 3, width + 2, 11);
    rect(palette[2], x + 5, capY + 3, 6, 10);
    rect(palette[3], x + width - 9, capY + 3, 12, 11);
    rect(palette[2], x - 1, capY + 2, width + 2, 2);
  }

  function drawPipes(biome) {
    if (mode === "home") return;
    for (const pipe of round.pipes) {
      const top = pipe.center - WORLD.gap / 2;
      const bottom = pipe.center + WORLD.gap / 2;
      pipePart(pipe.x, -3, top + 3, biome.pipe, false);
      pipePart(pipe.x, bottom, WORLD.floor - bottom, biome.pipe, true);
      if ([3, 5].includes(biomeForScore(round.score))) {
        rect("#f7fffa", pipe.x - 3, bottom, WORLD.pipeWidth + 6, 5);
        rect("#eaffff", pipe.x + 8, top, 4, 9);
        rect("#eaffff", pipe.x + 33, top, 3, 6);
      }
    }
  }

  function ground(biome) {
    rect(biome.pipe[0], 0, WORLD.floor, 360, 2);
    rect(biome.ground[0], 0, WORLD.floor + 2, 360, 13);
    for (let i = -1; i < 19; i++) {
      const x = i * 23 - wrap(scenery, 23);
      polygon(biome.pipe[2] + "bb", [[x, 494], [x + 8, 494], [x - 2, 504], [x - 10, 504]]);
    }
    rect(biome.pipe[0], 0, 505, 360, 2);
    rect(biome.ground[1], 0, 507, 360, 33);
    rect("#ffffff33", 0, 508, 360, 3);
    for (let i = 0; i < 24; i++) rect("#60524320", wrap(i * 29 - scenery * .9, 360), 515 + i % 4 * 6, 3, 2);
  }

  function bird() {
    const isPreview = mode === "home";
    const x = isPreview ? 180 : round.bird.x;
    const y = isPreview ? 133 + Math.sin(clock * 3) * 5 : round.bird.y;
    const palette = [["#e78361", "#f1b67d"], ["#b584c2", "#ddaddd"], ["#6fa7b9", "#b7dce3"]][roundNumber % 3];
    ctx.save(); ctx.translate(Math.round(x), Math.round(y));
    if (!isPreview) ctx.rotate(clamp(round.bird.velocity / 650, -.4, .85));
    rect("#4d4043", -12, -10, 22, 20); rect("#4d4043", -16, -5, 30, 12);
    rect(palette[0], -11, -8, 20, 16); rect(palette[1], -9, -7, 16, 5);
    rect("#fae4ba", -9, 4, 17, 4); rect("#fff9ee", 2, -9, 10, 11);
    rect("#4d4043", 9, -7, 3, 6); rect("#ffffff", 9, -7, 1, 2);
    rect("#4d4043", 10, 1, 10, 7); rect("#f3b95e", 12, 2, 8, 4);
    const wing = Math.floor(clock * 12) % 3;
    rect("#62444b", -15, wing === 0 ? -9 : wing === 1 ? -3 : 2, 11, 8);
    rect("#fff1d3", -14, wing === 0 ? -8 : wing === 1 ? -2 : 3, 9, 5);
    ctx.restore();
    if (bubble > 0 && mode === "playing") {
      const bx = clamp(x - 52, 6, 360 - 160);
      const by = clamp(y - 61, 62, WORLD.floor - 54);
      rect("#584450", bx, by, 154, 32);
      rect("#fffdf4", bx + 2, by + 2, 150, 28);
      polygon("#584450", [[bx + 38, by + 31], [bx + 50, by + 31], [bx + 44, by + 39]]);
      polygon("#fffdf4", [[bx + 41, by + 30], [bx + 47, by + 30], [bx + 44, by + 35]]);
      ctx.fillStyle = "#80536a"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("hebat, kamu keren", bx + 77, by + 20);
    }
  }

  function draw() {
    ctx.imageSmoothingEnabled = false;
    const biome = BIOMES[biomeForScore(round.score)];
    background(biome); drawPipes(biome); ground(biome); bird();
    ctx.font = "bold 11px monospace";
    const label = `${String(biomeForScore(round.score) + 1).padStart(2, "0")} / ${biome.name.toUpperCase()}`;
    const labelWidth = Math.min(336, Math.max(168, ctx.measureText(label).width + 24));
    rect("#fffaf0df", 12, 12, labelWidth, 27);
    rect(biome.accent, 12, 12, 3, 27);
    ctx.fillStyle = biome.accent; ctx.textAlign = "left"; ctx.font = "bold 11px monospace";
    ctx.fillText(label, 24, 30, labelWidth - 24);
    const progress = biomeProgress(round.score);
    rect("#ffffff66", 12, 43, labelWidth, 3); rect(biome.accent, 12, 43, labelWidth * progress, 3);
    if (scoreFlash > 0) {
      ctx.globalAlpha = Math.min(1, scoreFlash * 2);
      ctx.font = "bold 22px monospace"; ctx.textAlign = "center";
      ctx.strokeStyle = "#364d46"; ctx.lineWidth = 4; ctx.strokeText("+10", 253, 108 - (1 - scoreFlash) * 18);
      ctx.fillStyle = "#fff5c0"; ctx.fillText("+5", 253, 108 - (1 - scoreFlash) * 18);
      ctx.globalAlpha = 1;
    }
    if (announcement > 0) {
      ctx.globalAlpha = Math.min(1, announcement, 3 - announcement);
      rect("#fff9ebf0", 24, 73, 312, 28);
      ctx.fillStyle = biome.accent; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`Selamat datang di ${biome.name}!`, 180, 91, 292);
      ctx.globalAlpha = 1;
    }
  }

  function saveBest() {
    if (round.score <= best) return;
    best = round.score;
    try { localStorage.setItem(storageKey, String(best)); } catch (_) {}
  }

  function updateScore() {
    saveBest();
    $("#flightScore").textContent = round.score.toLocaleString("id-ID");
    $("#flightBest").textContent = best.toLocaleString("id-ID");
    const index = biomeForScore(round.score);
    $("#flightWorldName").textContent = BIOMES[index].name;
    panel.dataset.world = String(index);
    section.querySelectorAll("[data-flight-world]").forEach(item => {
      const current = Number(item.dataset.flightWorld) === index;
      item.classList.toggle("is-current", current);
      if (current) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
    });
    if (expanded) fitExpanded();
  }

  function setMode(next) {
    mode = next;
    panel.dataset.state = next;
    menu.hidden = next === "playing";
    pause.disabled = next !== "playing";
    exit.hidden = !active;
    $("#flightMenuExit").hidden = !active;
    $("#flightResults").hidden = next !== "over";
    const copy = {
      home: ["Ada 13 Destinasi yang menunggu, Bisa gak Hana tamatin dalam sekali jalan? keknya nggak sihh, wkwkkw", "Terbang yang jauh, Hanaa!", "Percaya yaa sama kepakan kecil Hana, burung ini merepresentasikan perjuangan Hana yang jatuh bangun", "Mulai terbang ↗"],
      paused: ["Take a deep breath", "Kita jeda dulu yaa", "Lanjutin lagi pas Hana bener bener udah siap. Kepakan berikutnya menunggu.", "Lanjutkan ↗"],
      over: [round.score >= best && round.score > 0 ? "Fly High" : "Coba lagi yuk?", "Terbang lagi?", "Kepakan kecil Hana udah bawa Hana sejauh ini.", "Retry ↻"]
    }[next];
    if (copy) {
      $("#flightMenuKicker").textContent = copy[0];
      $("#flightMenuTitle").textContent = copy[1];
      $("#flightMenuText").textContent = copy[2];
      action.textContent = copy[3];
    }
    if (next === "over") {
      $("#flightLastScore").textContent = round.score.toLocaleString("id-ID");
      $("#flightResultBest").textContent = best.toLocaleString("id-ID");
    }
    accumulator = 0;
    lastTime = 0;
    draw(); syncLoop();
  }

  function openSession() {
    if (historyClosing || document.body.classList.contains("gate-locked") || !document.body.classList.contains("opened")) return false;
    if (!active) {
      active = true;
      document.body.classList.add("flight-active");
      try {
        const state = history.state && typeof history.state === "object" ? history.state : {};
        history.pushState({ ...state, littleFlight: token }, "", location.href);
        historyOwned = true;
      } catch (_) { historyOwned = false; }
    }
    exit.hidden = false; $("#flightMenuExit").hidden = false;
    return true;
  }

  function startRound() {
    if (!openSession()) return;
    roundNumber++;
    round.start();
    scenery = 0; bubble = 3.5; scoreFlash = 0; announcement = 0;
    updateScore(); setMode("playing");
    $("#flightStatus").textContent = "hebat, Hanaa keren. Ronde selanjutnya di hutan, yaa";
    canvas.focus({ preventScroll: true });
  }

  function pauseGame() {
    if (mode !== "playing") return;
    setMode("paused");
    $("#flightStatus").textContent = "Permainan dijeda.";
  }

  function resumeGame() {
    if (mode !== "paused" || !active) return;
    round.flap(); bubble = 2;
    setMode("playing"); canvas.focus({ preventScroll: true });
  }

  function fitExpanded() {
    if (!expanded) { stage.style.removeProperty("width"); return; }
    dialog.style.height = `${window.visualViewport?.height || innerHeight}px`;
    const style = getComputedStyle(dialog);
    const panelStyle = getComputedStyle(panel);
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const panelPaddingY = parseFloat(panelStyle.paddingTop) + parseFloat(panelStyle.paddingBottom) + 4;
    const panelPaddingX = parseFloat(panelStyle.paddingLeft) + parseFloat(panelStyle.paddingRight);
    const availableHeight = dialog.clientHeight - paddingY - panelPaddingY - $(".flight-toolbar").offsetHeight - $(".flight-footer").offsetHeight - 4;
    const availableWidth = panel.clientWidth - panelPaddingX;
    stage.style.width = `${Math.max(100, Math.floor(Math.min(availableWidth, availableHeight * 2 / 3)))}px`;
  }

  function collapseGame() {
    if (!expanded) return;
    expanded = false;
    slot.append(panel);
    dialog.close();
    document.body.classList.remove("flight-expanded");
    slot.style.removeProperty("min-height");
    stage.style.removeProperty("width");
    expand.setAttribute("aria-label", "Perbesar game"); expand.title = "Perbesar game";
    expand.setAttribute("aria-expanded", "false");
    window.scrollTo({ top: savedScroll, behavior: "instant" });
    expand.focus({ preventScroll: true });
    syncLoop();
  }

  function expandGame() {
    if (!openSession()) return;
    pauseGame();
    if (expanded) { collapseGame(); return; }
    savedScroll = scrollY;
    slot.style.minHeight = `${slot.offsetHeight}px`;
    $("#flightDialogMount").append(panel);
    expanded = true;
    document.body.classList.add("flight-expanded");
    dialog.showModal();
    expand.setAttribute("aria-label", "Perkecil game"); expand.title = "Perkecil game";
    expand.setAttribute("aria-expanded", "true");
    fitExpanded(); syncLoop();
    action.focus({ preventScroll: true });
  }

  function leaveGame(fromHistory = false) {
    if (!active && !expanded) return;
    saveBest(); lastRound = round.score;
    const shouldBack = !fromHistory && historyOwned && history.state?.littleFlight === token;
    active = false; historyOwned = false;
    document.body.classList.remove("flight-active");
    collapseGame();
    round.reset(); bubble = 0; announcement = 0; scoreFlash = 0;
    updateScore(); setMode("home");
    $("#flightStatus").textContent = `Keluar dari game. Skor terakhir ${lastRound}. Highscore ${best}.`;
    action.focus({ preventScroll: true });
    if (shouldBack) { historyClosing = true; history.back(); }
  }

  function update(dt) {
    clock += dt;
    if (mode === "playing") {
      accumulator += dt;
      while (accumulator >= 1 / 120 && mode === "playing") {
        accumulator -= 1 / 120;
        const event = round.step(1 / 120);
        scenery = round.distance;
        if (event.points) { scoreFlash = 1; updateScore(); }
        if (event.changed) {
          bubble = 3.5; announcement = 2.99;
          $("#flightStatus").textContent = `hebat, kamu keren. Sekarang di ${BIOMES[biomeForScore(round.score)].name}. Skor ${round.score}.`;
        }
        if (event.hit) {
          saveBest(); setMode("over");
          $("#flightStatus").textContent = `Ronde selesai. Skor ${round.score}. Highscore ${best}. Pilih Retry untuk mencoba lagi.`;
          action.focus({ preventScroll: true });
        }
      }
      bubble = Math.max(0, bubble - dt);
      announcement = Math.max(0, announcement - dt);
      scoreFlash = Math.max(0, scoreFlash - dt);
    } else if (mode === "home" && !reducedMotion.matches) scenery += dt * 14;
  }

  function canAnimate() { return !document.hidden && (visible || expanded) && (!reducedMotion.matches || mode === "playing"); }
  function tick(now) {
    frame = 0;
    if (!canAnimate()) return;
    const dt = Math.min((now - (lastTime || now)) / 1000, .05);
    lastTime = now;
    update(dt); draw();
    if (!frame && canAnimate()) frame = requestAnimationFrame(tick);
  }
  function syncLoop() {
    if (canAnimate() && !frame) { lastTime = 0; frame = requestAnimationFrame(tick); }
    else if (!canAnimate()) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; draw(); }
  }

  action.addEventListener("click", () => mode === "paused" ? resumeGame() : startRound());
  pause.addEventListener("click", pauseGame);
  expand.addEventListener("click", expandGame);
  exit.addEventListener("click", () => leaveGame());
  $("#flightMenuExit").addEventListener("click", () => leaveGame());
  canvas.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    if (mode === "playing") round.flap();
  });
  canvas.addEventListener("contextmenu", event => event.preventDefault());
  document.addEventListener("keydown", event => {
    if (!active) return;
    if (event.key === "Escape") { event.preventDefault(); leaveGame(); return; }
    if (event.code !== "Space" || event.target.closest("button, input, textarea, select, [contenteditable]")) return;
    event.preventDefault();
    if (event.repeat) return;
    if (mode === "playing") round.flap();
    else if (mode === "paused") resumeGame();
  });
  dialog.addEventListener("cancel", event => { event.preventDefault(); leaveGame(); });
  dialog.addEventListener("close", () => { if (expanded) leaveGame(); });
  window.addEventListener("popstate", event => {
    historyClosing = false;
    if (active && event.state?.littleFlight !== token) leaveGame(true);
    else if (!active && event.state?.littleFlight === token && document.body.classList.contains("opened")) {
      active = true; historyOwned = true; document.body.classList.add("flight-active"); setMode("home");
      section.scrollIntoView({ behavior: "instant", block: "center" });
      action.focus({ preventScroll: true });
    }
  });
  window.addEventListener("blur", pauseGame);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseGame(); syncLoop(); });
  window.addEventListener("resize", () => { pauseGame(); fitExpanded(); }, { passive: true });
  window.visualViewport?.addEventListener("resize", () => { pauseGame(); fitExpanded(); }, { passive: true });
  reducedMotion.addEventListener("change", syncLoop);
  window.addEventListener("pagehide", () => { saveBest(); cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener("pageshow", () => { if (mode === "playing") pauseGame(); syncLoop(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible && !expanded) pauseGame();
      syncLoop();
    }, { threshold: 0 }).observe(slot);
  } else {
    const check = () => { const box = slot.getBoundingClientRect(); visible = box.top < innerHeight && box.bottom > 0; if (!visible && !expanded) pauseGame(); syncLoop(); };
    addEventListener("scroll", check, { passive: true }); check();
  }
  updateScore(); setMode("home");
})();
