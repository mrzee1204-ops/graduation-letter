// Pixel companions at the six section boundaries. No sprite downloads required.
(() => {
  "use strict";
  const CAT = 64;
  const BUTTERFLY = 18;
  const SPEED = 72; // CSS pixels per second; independent of the display refresh rate.
  const HEIGHT = 128;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const dialog = document.querySelector("#photoDialog");

  // Integer coordinates retain hard pixel edges at the requested 64 × 64 size.
  const catDrawing = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="64" height="64" shape-rendering="crispEdges" aria-hidden="true">
    <g class="cat-tail-pixels">
      <path fill="#514653" d="M2 12h3v7h4v3H4v-3H2z"/>
      <path fill="#aaa0af" d="M3 12h2v6h3v2H5v-2H3z"/>
    </g>
    <g class="cat-leg cat-leg-back">
      <path fill="#514653" d="M8 24h5v6H7v-2h1zM21 24h4v6h-6v-2h2z"/>
      <path fill="#e8dfe5" d="M7 28h5v1H7zM19 28h5v1h-5z"/>
    </g>
    <path fill="#514653" d="M9 16h13v2h4v8H9v-1H7v-7h2z"/>
    <path fill="#aaa0af" d="M10 17h12v3h3v5H9v-7h1z"/>
    <path fill="#d6cbd5" d="M10 22h14v3H10z"/>
    <path fill="#796b80" d="M12 17h2v4h-2zM17 17h2v4h-2z"/>
    <g class="cat-leg cat-leg-front">
      <path fill="#514653" d="M11 24h4v6H9v-2h2zM24 23h4v7h-6v-2h2z"/>
      <path fill="#d6cbd5" d="M12 24h2v4h-2zM25 23h2v5h-2z"/>
      <path fill="#fff0e9" d="M9 28h5v1H9zM22 28h5v1h-5z"/>
    </g>
    <g class="cat-head-pixels">
      <path fill="#514653" d="M17 5h3v2h2v2h3V7h2V5h3v16h-2v2H17v-2h-2V10h2z"/>
      <path fill="#aaa0af" d="M18 7h2v3h7V8h2v12h-2v2h-9v-2h-2v-8h2z"/>
      <path fill="#eab3c8" d="M18 8h2v3h-2zM27 8h2v3h-2z"/>
      <path fill="#796b80" d="M21 10h2v3h-2zM24 10h2v3h-2z"/>
      <path fill="#eadde5" d="M23 18h6v2h-2v2h-7v-2h3z"/>
      <g class="cat-open-eyes"><path fill="#382f3c" d="M19 15h2v3h-2zM26 15h2v3h-2z"/><path fill="#fff7e9" d="M19 15h1v1h-1zM26 15h1v1h-1z"/></g>
      <path class="cat-happy-eyes" fill="#514653" d="M18 16h1v-1h2v1h1v1h-1v-1h-2v1h-1zM25 16h1v-1h2v1h1v1h-1v-1h-2v1h-1z"/>
      <path fill="#c77f9d" d="M28 18h2v1h-2zM18 19h3v1h-3z"/>
      <path fill="#796b80" d="M28 20h2v1h-2z"/>
    </g>
  </svg>`;
  const butterflyDrawing = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" shape-rendering="crispEdges" aria-hidden="true">
    <g class="butterfly-wing butterfly-wing-left">
      <path fill="#95618f" d="M1 3h4v1h2v2h1v9H4v-1H2v-4h1V9H1z"/>
      <path fill="#e4a6d5" d="M2 4h3v1h2v4H4V8H2zM3 11h4v3H4v-1H3z"/>
      <path fill="#fff0ca" d="M3 5h2v2H3zM4 11h2v2H4z"/>
    </g>
    <g class="butterfly-wing butterfly-wing-right">
      <path fill="#95618f" d="M13 3h4v6h-2v1h1v4h-2v1h-4V6h1V4h2z"/>
      <path fill="#f2c09e" d="M13 4h3v4h-2v1h-3V5h2zM11 11h4v2h-1v1h-3z"/>
      <path fill="#fff0ca" d="M13 5h2v2h-2zM12 11h2v2h-2z"/>
    </g>
    <path fill="#65516d" d="M8 6h2v9H8zM7 3h1v3H7zM10 3h1v3h-1z"/>
    <path fill="#fff1c9" d="M8 7h1v4H8z"/>
  </svg>`;

  const scenes = [...document.querySelectorAll(".cat-divider")].map((root, index) => {
    const track = root.querySelector(".pet-track");
    const cat = root.querySelector(".chase-cat");
    const sprite = root.querySelector(".chase-cat-sprite");
    const butterfly = root.querySelector(".chase-butterfly");
    const canvas = root.querySelector(".pet-sparkles");
    sprite.innerHTML = catDrawing;
    butterfly.innerHTML = butterflyDrawing;
    return { root, track, cat, sprite, butterfly, canvas, ctx: canvas.getContext("2d"),
      width: 0, phase: .12 + index * .17, clock: index, visible: false,
      hover: false, focus: false, happyUntil: 0, particles: [], emission: 0,
      x: 0, y: 0, direction: 1 };
  });
  let frame = 0;
  let previousTime = 0;

  // The butterfly turns first. The cat reaches its own edge 0.85 s later.
  function pingPong(phase) {
    const cycle = ((phase % 2) + 2) % 2;
    return { progress: cycle <= 1 ? cycle : 2 - cycle, direction: cycle < 1 ? 1 : -1 };
  }
  function place(scene) {
    const distance = Math.max(1, scene.width - BUTTERFLY);
    const legDuration = Math.max(2.8, distance / SPEED);
    const lead = pingPong(scene.phase);
    const chase = pingPong(scene.phase - .85 / legDuration);
    const catX = Math.round(chase.progress * Math.max(0, scene.width - CAT));
    scene.x = lead.progress * Math.max(0, scene.width - BUTTERFLY);
    scene.y = 43 + (reducedMotion.matches ? 0 : Math.sin(scene.clock * 3.6) * 9);
    scene.direction = lead.direction;
    scene.cat.style.transform = `translate3d(${catX}px, 0, 0)`;
    scene.sprite.style.transform = `scaleX(${chase.direction})`;
    scene.butterfly.style.transform = `translate3d(${Math.round(scene.x)}px, ${Math.round(scene.y)}px, 0)`;
  }
  function clearTrail(scene) {
    scene.particles.length = 0;
    scene.emission = 0;
    scene.ctx?.clearRect(0, 0, scene.width, HEIGHT);
  }
  function measure(scene) {
    const width = scene.track.getBoundingClientRect().width;
    if (width <= 0) return; // The letter is initially closed.
    scene.width = width;
    const scale = Math.min(devicePixelRatio || 1, 2);
    scene.canvas.width = Math.round(width * scale);
    scene.canvas.height = Math.round(HEIGHT * scale);
    scene.ctx?.setTransform(scale, 0, 0, scale, 0, 0);
    clearTrail(scene);
    place(scene);
  }
  function drawTrail(scene, dt) {
    const ctx = scene.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, scene.width, HEIGHT);
    scene.emission += dt;
    if (scene.emission >= .065 && scene.particles.length < 24) {
      scene.emission = 0;
      scene.particles.push({ x: scene.x + 9 - scene.direction * 6,
        y: scene.y + 11, vx: -scene.direction * (8 + Math.random() * 12),
        vy: 9 + Math.random() * 9, life: 1, size: 1.5 + Math.random() * 2,
        color: Math.random() > .45 ? "#fff3c1" : "#e0a0cf" });
    }
    scene.particles = scene.particles.filter(p => p.life > 0);
    for (const p of scene.particles) {
      p.life -= dt * 1.3;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 20 * dt;
      const size = p.size * Math.max(0, p.life);
      ctx.globalAlpha = Math.max(0, p.life) * .85;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - size * 1.8);
      ctx.lineTo(p.x + size * .4, p.y - size * .4);
      ctx.lineTo(p.x + size * 1.8, p.y);
      ctx.lineTo(p.x + size * .4, p.y + size * .4);
      ctx.lineTo(p.x, p.y + size * 1.8);
      ctx.lineTo(p.x - size * .4, p.y + size * .4);
      ctx.lineTo(p.x - size * 1.8, p.y);
      ctx.lineTo(p.x - size * .4, p.y - size * .4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  function blocked() {
    return document.hidden || dialog?.open || !document.body.classList.contains("opened");
  }
  function sync() {
    const animate = !blocked() && !reducedMotion.matches;
    for (const scene of scenes) {
      scene.root.classList.toggle("is-running", animate && scene.visible);
      if (!animate || !scene.visible) clearTrail(scene);
    }
    if (animate && scenes.some(scene => scene.visible)) {
      if (!frame) { previousTime = performance.now(); frame = requestAnimationFrame(tick); }
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  function tick(now) {
    const dt = Math.min((now - previousTime) / 1000, .05);
    previousTime = now;
    for (const scene of scenes) {
      if (!scene.visible || !scene.width) continue;
      scene.clock += dt;
      const petting = scene.hover || scene.happyUntil > now;
      scene.root.classList.toggle("is-petted", petting);
      scene.root.classList.toggle("is-paused", petting || scene.focus);
      if (!petting && !scene.focus) {
        scene.phase += dt / Math.max(2.8, (scene.width - BUTTERFLY) / SPEED);
      }
      place(scene);
      drawTrail(scene, dt);
    }
    frame = requestAnimationFrame(tick);
  }

  scenes.forEach(scene => {
    let petTimer = 0;
    function pet() {
      scene.happyUntil = performance.now() + 1400;
      scene.root.classList.add("is-petted", "is-paused");
      clearTimeout(petTimer);
      petTimer = setTimeout(() => {
        if (!scene.hover) scene.root.classList.remove("is-petted");
        if (!scene.hover && !scene.focus) scene.root.classList.remove("is-paused");
      }, 1450);
    }
    scene.cat.addEventListener("pointerenter", event => {
      if (event.pointerType === "touch") return;
      scene.hover = true;
      pet();
    });
    scene.cat.addEventListener("pointerleave", () => { scene.hover = false; pet(); });
    scene.cat.addEventListener("pointercancel", () => { scene.hover = false; pet(); });
    scene.cat.addEventListener("pointerdown", pet);
    // A native button supplies Enter / Space activation and touch support.
    scene.cat.addEventListener("click", event => {
      scene.focus = event.detail === 0; // Only keyboard activation retains focus-pause.
      pet();
    });
    scene.cat.addEventListener("focus", () => {
      scene.focus = scene.cat.matches(":focus-visible");
      if (scene.focus) scene.root.classList.add("is-paused");
    });
    scene.cat.addEventListener("blur", () => { scene.focus = false; });
    // Mouse/touch focus should not hold the chase after the reaction finishes.
    scene.cat.addEventListener("pointerup", () => { scene.focus = false; });
    measure(scene);
  });

  function checkVisibility() {
    scenes.forEach(scene => {
      const box = scene.track.getBoundingClientRect();
      scene.visible = box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight;
      if (scene.visible && !scene.width) measure(scene);
    });
    sync();
  }
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const scene = scenes.find(item => item.track === entry.target);
        scene.visible = entry.isIntersecting && entry.boundingClientRect.width > 0;
        if (scene.visible && !scene.width) measure(scene);
      });
      sync();
    }, { threshold: 0 });
    scenes.forEach(scene => observer.observe(scene.track));
  } else {
    addEventListener("scroll", checkVisibility, { passive: true });
  }
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => measure(scenes.find(scene => scene.track === entry.target)));
      checkVisibility();
    });
    scenes.forEach(scene => observer.observe(scene.track));
  }
  addEventListener("resize", () => { scenes.forEach(measure); checkVisibility(); }, { passive: true });
  new MutationObserver(checkVisibility).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  if (dialog) new MutationObserver(sync).observe(dialog, { attributes: true, attributeFilter: ["open"] });
  function releasePointers() {
    scenes.forEach(scene => { scene.hover = false; scene.happyUntil = 0;
      scene.root.classList.remove("is-petted"); });
  }
  addEventListener("blur", releasePointers);
  document.addEventListener("visibilitychange", () => { if (document.hidden) releasePointers(); sync(); });
  reducedMotion.addEventListener("change", () => { scenes.forEach(measure); sync(); });
  checkVisibility();
})();
