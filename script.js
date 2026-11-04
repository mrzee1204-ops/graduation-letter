
const DEFAULTS = {
  recipient: "Hana Syakirah Hasibuan, S.Farm OTW M.Farm",
  sender: "Your Friend",
  introGreeting: "Selamat yaa Hanaa, untuk semua hal yang udah Hana perjuangkan sampai sejauh ini sampe hari ini.Hana layak dan berhak buat merayakan tiap hasil dari perjuangan Hanaa, karena Hana selalu ngasih 100% usaha buat menggapainya.",
  finalGreeting: "Selamat atas pencapaiannya, Hanaa. Terima kasih udah menjadi seseorang yang selalu berjuang, gak ada kata yang bisa aku ucapin selain kalo aku bener bener bangga sama Hanaa"
};

(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const body = document.body;
  const status = $("#siteStatus");
  const content = $("#siteContent");
  const music = $("#bgMusic");
  const musicDock = $("#musicDock");
  const musicMenu = $("#musicMenu");
  const musicExpand = $("#musicExpand");
  const random = (min, max) => min + Math.random() * (max - min);
  const colors = ["#ffaacb", "#f4c96b", "#91ccf2", "#bca9fa", "#95ddd2", "#fff4f1"];

  const mainStage = $("#mainStage");

  const GATE_PASSWORD = "20062004";
  const gate = $("#passwordGate");
  const gateForm = $("#gateForm");
  const gateInput = $("#gatePassword");
  const gateHint = $("#gateHint");
  const gateCard = $(".gate-card", gate);
  const gateDots = $("#gateDots");
  const gateCount = $("#gateCount");
  const gateKeys = $$("button", gateForm);
  let gateOpen = false;
  for (let i = 0; i < GATE_PASSWORD.length; i++) gateDots.append(document.createElement("span"));

  function updateCode(value) {
    gateInput.value = value.replace(/\D/g, "").slice(0, GATE_PASSWORD.length);
    [...gateDots.children].forEach((dot, i) => dot.classList.toggle("filled", i < gateInput.value.length));
    gateCount.textContent = `${gateInput.value.length} dari ${GATE_PASSWORD.length} angka terisi`;
  }
  function typeCode(digit) {
    if (gateOpen) return;
    updateCode(gateInput.value + digit);
    gateHint.textContent = "Hint: The day you were Born";
    gateCard.classList.remove("shake");
  }
  $$("[data-digit]", gateForm).forEach(key => key.addEventListener("click", () => typeCode(key.dataset.digit)));
  $("#gateDelete").addEventListener("click", () => updateCode(gateInput.value.slice(0, -1)));
  gateForm.addEventListener("submit", event => {
    event.preventDefault();
    if (gateOpen) return;
    if (gateInput.value === GATE_PASSWORD) {
      gateOpen = true;
      gateHint.textContent = "Kata sandi benar. Selamat datang";
      gate.classList.add("unlocked");
      body.classList.remove("gate-locked");
      mainStage.inert = false;
      gateKeys.forEach(key => { key.disabled = true; });
      setTimeout(() => {
        gate.hidden = true;
        $("#openLetterButton").focus({ preventScroll: true });
      }, motion.matches ? 0 : 650);
    } else {
      gateHint.textContent = gateInput.value.length < GATE_PASSWORD.length
        ? `Masukkan ${GATE_PASSWORD.length} angka dulu ya.`
        : "Kata sandinya belum tepat, coba lagi ya.";
      if (gateInput.value.length === GATE_PASSWORD.length) updateCode("");
      gateCard.classList.remove("shake");
      void gateCard.offsetWidth;
      gateCard.classList.add("shake");
    }
  });
  document.addEventListener("keydown", event => {
    if (gateOpen || event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      typeCode(event.key);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      updateCode(gateInput.value.slice(0, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      gateForm.requestSubmit();
    } else if (event.key === "Tab") {
      const first = gateKeys[0], last = gateKeys[gateKeys.length - 1];
      if (event.shiftKey && (document.activeElement === first || !gate.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !gate.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
  });
  document.addEventListener("paste", event => {
    if (gateOpen) return;
    event.preventDefault();
    typeCode(event.clipboardData.getData("text"));
  });
  updateCode("");
  requestAnimationFrame(() => gateKeys[0].focus({ preventScroll: true }));

  $("#footerRecipient").textContent = DEFAULTS.recipient || "someone special";
  $("#senderName").textContent = DEFAULTS.sender;
  $("#introGreeting").textContent = DEFAULTS.introGreeting;
  $("#finalGreeting").textContent = DEFAULTS.finalGreeting;
  $("#featureYear").textContent = String(new Date().getFullYear());

  const playlist = (window.MUSIC_PLAYLIST || []).filter(track => track && typeof track.src === "string" && track.src.trim());
  const trackList = $("#playlistTracks");
  const musicStatus = $("#musicStatus");
  const unavailableTracks = new Set();
  let trackIndex = 0;
  let playbackVersion = 0;
  let wantsPlayback = false;
  const trackLabel = track => [track.title || "Tanpa judul", track.artist].filter(Boolean).join(" — ");

  playlist.forEach((track, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    const number = document.createElement("span");
    number.className = "playlist-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const label = document.createElement("span");
    label.className = "playlist-label";
    label.textContent = trackLabel(track);
    button.append(number, label);
    button.addEventListener("click", () => selectTrack(index, true));
    item.append(button);
    trackList.append(item);
  });
  function updatePlaylist() {
    const track = playlist[trackIndex];
    $("#trackTitle").textContent = track ? trackLabel(track) : "Playlist kosong";
    $("#playlistNow").textContent = $("#trackTitle").textContent;
    $("#trackCounter").textContent = `LAGU ${track ? trackIndex + 1 : 0} / ${playlist.length}`;
    $$("button", trackList).forEach((button, i) => {
      button.setAttribute("aria-current", String(i === trackIndex));
      button.classList.toggle("is-unavailable", unavailableTracks.has(i));
      button.setAttribute("aria-label", `${trackLabel(playlist[i])}${unavailableTracks.has(i) ? ", audio belum tersedia" : ""}`);
    });
  }
  function setMusicMenu(open) {
    musicMenu.hidden = !open;
    musicExpand.setAttribute("aria-expanded", String(open));
  }
  function setPlaying(playing) {
    musicDock.classList.toggle("playing", playing);
    $("#musicToggle").setAttribute("aria-label", playing ? "Jeda musik" : "Putar musik");
  }
  function nextAvailable(direction = 1) {
    for (let step = 1; step <= playlist.length; step++) {
      const next = (trackIndex + direction * step + playlist.length) % playlist.length;
      if (!unavailableTracks.has(next)) return next;
    }
    return -1;
  }
  function audioUnavailable() {
    if (!playlist.length || unavailableTracks.has(trackIndex)) return;
    unavailableTracks.add(trackIndex);
    setPlaying(false);
    updatePlaylist();
    musicStatus.textContent = "Lagu ini belum tersedia. Kamu bisa memilih lagu lain.";
    if (!wantsPlayback) return;
    const next = nextAvailable();
    if (next < 0) {
      wantsPlayback = false;
      musicStatus.textContent = "Audio belum tersedia. Surat tetap bisa dibaca.";
      return;
    }
    selectTrack(next, true);
  }
  async function playMusic() {
    if (!playlist.length) return;
    wantsPlayback = true;
    if (music.error || unavailableTracks.has(trackIndex)) {
      selectTrack(trackIndex, true);
      return;
    }
    const version = playbackVersion;
    try {
      await music.play();
      if (version !== playbackVersion) return;
      if (!wantsPlayback) music.pause();
      else musicStatus.textContent = "";
    } catch (error) {
      if (version !== playbackVersion) return;
      if (error.name === "NotSupportedError" || music.error) audioUnavailable();
      else if (error.name !== "AbortError") {
        wantsPlayback = false;
        setPlaying(false);
        musicStatus.textContent = "Ketuk tombol putar untuk memulai musik.";
      }
    }
  }
  function selectTrack(index, autoplay = false) {
    if (!playlist.length) return;
    playbackVersion++;
    wantsPlayback = autoplay;
    music.pause();
    trackIndex = (index + playlist.length) % playlist.length;
    unavailableTracks.delete(trackIndex);
    music.src = playlist[trackIndex].src;
    music.load();
    $("#musicProgress").style.width = "0%";
    musicStatus.textContent = autoplay ? "Memuat lagu…" : "";
    updatePlaylist();
    if (autoplay) playMusic();
  }
  $("#musicToggle").addEventListener("click", () => {
    if (wantsPlayback || !music.paused) {
      wantsPlayback = false;
      music.pause();
      setPlaying(false);
      musicStatus.textContent = "Musik dijeda.";
    } else playMusic();
  });
  music.addEventListener("play", () => setPlaying(true));
  music.addEventListener("pause", () => setPlaying(false));
  music.addEventListener("error", () => { if (music.error) audioUnavailable(); });
  music.addEventListener("ended", () => {
    const next = nextAvailable();
    if (next >= 0) selectTrack(next, true);
    else { wantsPlayback = false; setPlaying(false); }
  });
  music.addEventListener("timeupdate", () => {
    if (Number.isFinite(music.duration) && music.duration > 0) {
      $("#musicProgress").style.width = `${100 * music.currentTime / music.duration}%`;
    }
  });
  musicExpand.addEventListener("click", () => setMusicMenu(musicMenu.hidden));
  $("#closeMusicMenu").addEventListener("click", () => { setMusicMenu(false); musicExpand.focus(); });
  document.addEventListener("click", event => {
    if (!musicDock.contains(event.target)) setMusicMenu(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !musicMenu.hidden) {
      setMusicMenu(false);
      musicExpand.focus({ preventScroll: true });
    }
  });
  $("#previousMusic").addEventListener("click", () => selectTrack(trackIndex - 1, true));
  $("#nextMusic").addEventListener("click", () => selectTrack(trackIndex + 1, true));
  $("#restartMusic").addEventListener("click", () => selectTrack(trackIndex, true));
  if (playlist.length) selectTrack(0);
  else {
    updatePlaylist();
    ["#musicToggle", "#previousMusic", "#nextMusic", "#restartMusic"].forEach(selector => { $(selector).disabled = true; });
    musicStatus.textContent = "Belum ada lagu di playlist.";
  }

  // One star path supplies both five-point stars and four-point glints.
  function starPath(ctx, radius, points = 5, ratio = .43) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / points;
      const r = i % 2 ? radius * ratio : radius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  const starCanvas = $("#confettiCanvas");
  const starCtx = starCanvas.getContext("2d");
  let stars = [];
  let starFrame = 0;
  let starLast = 0;
  let staticTimer = 0;
  function sizeStars() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    starCanvas.width = Math.round(innerWidth * scale);
    starCanvas.height = Math.round(innerHeight * scale);
    starCtx?.setTransform(scale, 0, 0, scale, 0, 0);
  }
  sizeStars();
  window.addEventListener("resize", sizeStars, { passive: true });

  function renderStar(p, now) {
    const fade = Math.min(1, p.life / .65);
    const twinkle = .55 + .45 * Math.sin(now * .008 + p.phase) ** 2;
    starCtx.save();
    starCtx.translate(p.x, p.y);
    starCtx.rotate(p.rotation);
    starCtx.globalAlpha = fade * twinkle;
    starCtx.shadowColor = p.color;
    starCtx.shadowBlur = p.radius * 1.3;
    starCtx.fillStyle = p.color;
    starPath(starCtx, p.radius, p.points, p.points === 4 ? .21 : .43);
    starCtx.fill();
    if (p.points === 4) {
      starCtx.fillStyle = "#fff7fa";
      starPath(starCtx, p.radius * .42, 4, .19);
      starCtx.fill();
    }
    starCtx.restore();
  }
  function clearStars() {
    cancelAnimationFrame(starFrame);
    clearTimeout(staticTimer);
    starFrame = 0;
    starLast = 0;
    stars = [];
    starCtx?.clearRect(0, 0, innerWidth, innerHeight);
  }
  function animateStars(now) {
    const dt = Math.min((now - starLast) / 1000 || 1 / 60, .033);
    starLast = now;
    starCtx.clearRect(0, 0, innerWidth, innerHeight);
    stars = stars.filter(p => p.life > 0 && p.y < innerHeight + 40);
    for (const p of stars) {
      p.life -= dt;
      p.vx *= Math.pow(.989, dt * 60);
      p.vy += 155 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
      renderStar(p, now);
    }
    if (stars.length) starFrame = requestAnimationFrame(animateStars);
    else { starFrame = 0; starLast = 0; }
  }
  function celebrate(x, y, count = 65) {
    if (!starCtx || document.hidden) return;
    if (motion.matches) {
      clearStars();
      for (let i = 0; i < 9; i++) {
        renderStar({ x: x + random(-90,90), y: y + random(-65,25), radius: random(4,8), points: 5, rotation: 0, phase: 0, life: 1, color: colors[i % colors.length] }, 0);
      }
      staticTimer = setTimeout(clearStars, 1100);
      return;
    }
    const amount = Math.min(count, 230 - stars.length);
    for (let i = 0; i < amount; i++) {
      const angle = random(Math.PI * 1.08, Math.PI * 1.92);
      const speed = random(90, 390);
      stars.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        radius: random(4,11), points: i % 3 === 0 ? 4 : 5,
        rotation: random(0,Math.PI), spin: random(-2.5,2.5),
        life: random(1.65,3.1), phase: random(0,6.28), color: colors[i % colors.length] });
    }
    if (!starFrame) { starLast = performance.now(); starFrame = requestAnimationFrame(animateStars); }
  }
  ["#celebrateButton", "#finalCelebrate"].forEach(selector => {
    $(selector).addEventListener("click", event => {
      const box = event.currentTarget.getBoundingClientRect();
      celebrate(box.left + box.width / 2, box.top + box.height / 2, 85);
      status.textContent = "Bintang berkilau untuk merayakan momen ini.";
    });
  });

  function scrollToIntro() {
    $("#intro").scrollIntoView({ behavior: motion.matches ? "instant" : "smooth" });
    $("#introTitle").focus({ preventScroll: true });
  }
  function openSurprise() {
    if (body.classList.contains("opened")) { scrollToIntro(); return; }
    body.classList.add("opened");
    content.inert = false;
    $("#openEnvelope").setAttribute("aria-expanded", "true");
    $("#openLetterButton").setAttribute("aria-expanded", "true");
    playMusic(); // Music failure must never delay opening the letter.
    celebrate(innerWidth / 2, innerHeight * .42, 26);
    setTimeout(scrollToIntro, motion.matches ? 0 : 1300);
  }
  $("#openEnvelope").addEventListener("click", openSurprise);
  $("#openLetterButton").addEventListener("click", openSurprise);
  $("#readLetterLink").addEventListener("click", () => {
    $("#letter").scrollIntoView({ behavior: motion.matches ? "instant" : "smooth" });
  });

  if (typeof IntersectionObserver !== "undefined") {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: "0px 0px -15px 0px" });
    $$(".reveal").forEach(el => revealObserver.observe(el));
    body.classList.add("js-ready");
  }

  // Photo shells retain every picture's aspect ratio. The controls are usable.
  const photoCards = $$(".glass-photo");
  const photoDialog = $("#photoDialog");
  const fallback = "assets/photos/photo-placeholder.svg";
  const icons = {
    expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 5.5a5 5 0 0 0-7 0L12 7l-1.5-1.5a5 5 0 0 0-7 7L12 21l8.5-8.5a5 5 0 0 0 0-7z"/></svg>'
  };
  let selectedPhoto = 0;
  let lastPhotoTrigger = null;
  function showPhoto(index) {
    selectedPhoto = (index + photoCards.length) % photoCards.length;
    const card = photoCards[selectedPhoto];
    $("#viewerImage").src = $("img", card).currentSrc || $("img", card).src;
    $("#viewerImage").alt = $("img", card).alt;
    $("#viewerCaption").textContent = $("figcaption", card).textContent.trim();
    $("#photoCounter").textContent = `${String(selectedPhoto + 1).padStart(2,"0")} / ${String(photoCards.length).padStart(2,"0")}`;
  }
  photoCards.forEach((card, index) => {
    const img = $("img", card);
    function usePlaceholder() {
      if (img.dataset.placeholder === "true") return;
      img.dataset.placeholder = "true";
      img.src = fallback;
      img.alt = `Ilustrasi pengganti foto kenangan ${index + 1}`;
    }
    img.addEventListener("error", usePlaceholder);
    if (img.complete && img.naturalWidth === 0) usePlaceholder();
    const controls = document.createElement("div");
    controls.className = "photo-controls";
    const tag = document.createElement("span");
    tag.className = "photo-tag";
    tag.innerHTML = `<span aria-hidden="true">✧</span> MEMORY ${String(index + 1).padStart(2,"0")}`;
    const expand = document.createElement("button");
    expand.type = "button";
    expand.className = "glass-button";
    expand.setAttribute("aria-label", `Perbesar foto ${index + 1}`);
    expand.innerHTML = icons.expand;
    expand.addEventListener("click", () => {
      lastPhotoTrigger = expand;
      showPhoto(index);
      photoDialog.showModal();
      body.classList.add("photo-open");
      syncFireworks();
    });
    controls.append(tag, expand);
    const like = document.createElement("button");
    like.type = "button";
    like.className = "photo-like glass-button";
    like.setAttribute("aria-label", `Sukai foto ${index + 1}`);
    like.setAttribute("aria-pressed", "false");
    like.innerHTML = icons.heart;
    like.addEventListener("click", () => {
      const liked = like.getAttribute("aria-pressed") !== "true";
      like.setAttribute("aria-pressed", String(liked));
      like.setAttribute("aria-label", `${liked ? "Batalkan suka" : "Sukai"} foto ${index + 1}`);
    });
    card.append(controls, like);
    card.addEventListener("pointermove", event => {
      if (motion.matches || event.pointerType !== "mouse") return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--glass-x", `${100 * (event.clientX - box.left) / box.width}%`);
      card.style.setProperty("--glass-y", `${100 * (event.clientY - box.top) / box.height}%`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--glass-x");
      card.style.removeProperty("--glass-y");
    });
  });
  $("#closePhoto").addEventListener("click", () => photoDialog.close());
  $("#previousPhoto").addEventListener("click", () => showPhoto(selectedPhoto - 1));
  $("#nextPhoto").addEventListener("click", () => showPhoto(selectedPhoto + 1));
  photoDialog.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") { event.preventDefault(); showPhoto(selectedPhoto + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); showPhoto(selectedPhoto - 1); }
  });
  photoDialog.addEventListener("click", event => {
    const box = photoDialog.getBoundingClientRect();
    if (event.target === photoDialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) photoDialog.close();
  });
  photoDialog.addEventListener("close", () => {
    body.classList.remove("photo-open");
    lastPhotoTrigger?.focus({ preventScroll: true });
    syncFireworks();
  });

  const finale = $("#finale");
  const fireCanvas = $("#fireworksCanvas");
  const fireCtx = fireCanvas.getContext("2d");
  let fireWidth = 0;
  let fireHeight = 0;
  let finaleVisible = false;
  let fireFrame = 0;
  let fireLast = 0;
  let nextLaunch = 0;
  let rockets = [];
  let sparks = [];
  function sizeFireworks() {
    const box = finale.getBoundingClientRect();
    fireWidth = box.width;
    fireHeight = box.height;
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    fireCanvas.width = Math.round(fireWidth * scale);
    fireCanvas.height = Math.round(fireHeight * scale);
    fireCtx?.setTransform(scale, 0, 0, scale, 0, 0);
  }
  if ("ResizeObserver" in window) new ResizeObserver(sizeFireworks).observe(finale);
  else window.addEventListener("resize", sizeFireworks, { passive: true });
  function launchRocket() {
    const x = random(.12,.88) * fireWidth;
    rockets.push({ x, y: fireHeight + 12, startX: x, targetY: random(.12,.48) * fireHeight, vx: random(-12,12), vy: -random(280,420), color: colors[Math.floor(random(0,colors.length))], tail: [] });
  }
  function explode(rocket) {
    const count = fireWidth < 600 ? 48 : 70;
    for (let i = 0; i < count && sparks.length < 330; i++) {
      const angle = i * Math.PI * 2 / count + random(-.06,.06);
      const speed = random(40,145);
      sparks.push({ x: rocket.x, y: rocket.y, px: rocket.x, py: rocket.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        color: i % 5 === 0 ? colors[(i + 2) % colors.length] : rocket.color,
        life: random(1.1,2.35), initialLife: 2.35, phase: random(0,6.28), size: random(.8,2.1) });
    }
  }
  function drawFireworks(now) {
    const dt = Math.min((now - fireLast) / 1000 || 1 / 60, .033);
    fireLast = now;
    fireCtx.clearRect(0,0,fireWidth,fireHeight);
    if (now >= nextLaunch) { launchRocket(); nextLaunch = now + random(1150,1800); }
    for (const r of rockets) {
      r.tail.push({ x: r.x, y: r.y });
      if (r.tail.length > 9) r.tail.shift();
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      for (let i = 1; i < r.tail.length; i++) {
        fireCtx.globalAlpha = .5 * i / r.tail.length;
        fireCtx.strokeStyle = r.color;
        fireCtx.lineWidth = 1.6;
        fireCtx.beginPath(); fireCtx.moveTo(r.tail[i - 1].x,r.tail[i - 1].y); fireCtx.lineTo(r.tail[i].x,r.tail[i].y); fireCtx.stroke();
      }
      fireCtx.globalAlpha = .9;
      fireCtx.fillStyle = "#fff0f6";
      fireCtx.beginPath(); fireCtx.arc(r.x,r.y,2,0,Math.PI * 2); fireCtx.fill();
      if (r.y <= r.targetY) { explode(r); r.done = true; }
    }
    rockets = rockets.filter(r => !r.done);
    sparks = sparks.filter(p => p.life > 0);
    for (const p of sparks) {
      p.px = p.x; p.py = p.y;
      p.vx *= Math.pow(.983,dt * 60); p.vy *= Math.pow(.983,dt * 60);
      p.vy += 27 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      fireCtx.globalAlpha = Math.min(1,p.life / .85) * (.6 + .4 * Math.sin(now * .006 + p.phase) ** 2);
      fireCtx.strokeStyle = p.color;
      fireCtx.fillStyle = p.color;
      fireCtx.shadowColor = p.color;
      fireCtx.shadowBlur = 6;
      fireCtx.lineWidth = p.size;
      fireCtx.beginPath(); fireCtx.moveTo(p.px,p.py); fireCtx.lineTo(p.x,p.y); fireCtx.stroke();
      fireCtx.beginPath(); fireCtx.arc(p.x,p.y,p.size,0,Math.PI * 2); fireCtx.fill();
    }
    fireCtx.globalAlpha = 1;
    fireCtx.shadowBlur = 0;
    fireFrame = requestAnimationFrame(drawFireworks);
  }
  function syncFireworks() {
    const active = fireCtx && finaleVisible && body.classList.contains("opened") && !document.hidden && !motion.matches && !photoDialog.open;
    if (active && !fireFrame) {
      sizeFireworks(); fireLast = performance.now(); nextLaunch = fireLast + 200;
      fireFrame = requestAnimationFrame(drawFireworks);
    } else if (!active) {
      cancelAnimationFrame(fireFrame); fireFrame = 0; rockets = []; sparks = [];
      fireCtx?.clearRect(0,0,fireWidth,fireHeight);
    }
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      finaleVisible = entries[0].isIntersecting;
      syncFireworks();
    }, { threshold: 0 }).observe(finale);
  } else {
    const checkFinale = () => {
      const box = finale.getBoundingClientRect();
      finaleVisible = box.top < innerHeight && box.bottom > 0 && box.height > 0;
      syncFireworks();
    };
    window.addEventListener("scroll",checkFinale,{ passive: true });
    checkFinale();
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearStars();
    syncFireworks();
  });
  motion.addEventListener("change", () => { clearStars(); syncFireworks(); });

  function fillStars(layer, count, local = false) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const star = document.createElement("span");
      star.className = "floating-star";
      star.textContent = i % 3 === 0 ? "✧" : "✦";
      star.style.cssText = `--sx:${random(3, 97)}%;--sy:${random(2, 98)}%;--ss:${random(local ? 12 : 5, local ? 25 : 15)}px;--sd:${random(3, 7)}s;--delay:-${random(0, 8)}s;--drift:${random(-12, 12)}px`;
      fragment.append(star);
    }
    layer.append(fragment);
  }
  $$(".floating-stars").forEach(layer => fillStars(layer, 32));
  fillStars($(".bouquet-sparkles"), 22, true);
  const experienceYes = $("#experienceYes");
  const experienceNo = $("#experienceNo");
  const experienceBouquet = $("#experienceBouquet");
  const experienceSad = $("#experienceSad");
  const bloomScene = $("#bloomScene");
  function finishBloom() {
    if (experienceBouquet.hidden || !bloomScene.classList.contains("is-blooming")) return;
    bloomScene.classList.add("is-bloomed");
    bloomScene.dataset.phase = "open";
  }
  function resetBloom() {
    bloomScene.classList.remove("is-blooming", "is-bloomed");
    bloomScene.dataset.phase = "idle";
  }
  bloomScene.addEventListener("animationend", event => {
    if (event.animationName === "bouquetPetalsOpen" && event.target.classList.contains("bloom-finish")) finishBloom();
  });
  motion.addEventListener("change", () => { if (motion.matches) finishBloom(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      bloomScene.classList.toggle("bloom-paused", !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(bloomScene);
  }
  function chooseExperience(yes) {
    resetBloom();
    experienceYes.setAttribute("aria-pressed", String(yes));
    experienceNo.setAttribute("aria-pressed", String(!yes));
    experienceBouquet.hidden = !yes;
    experienceSad.hidden = yes;
    $("#experienceStatus").textContent = yes
      ? "selamat udah berjuang sejauh ini, hana keren dan aku selalu bangga sama Hanaa"
      : "yah sedih banget, jangan gitu dong";
    if (yes) {
      void bloomScene.offsetWidth;
      bloomScene.classList.add("is-blooming");
      bloomScene.dataset.phase = "growing";
      if (motion.matches) finishBloom();
      const rect = experienceYes.getBoundingClientRect();
      celebrate(rect.left + rect.width / 2, rect.top + rect.height / 2, 45);
    }
    requestAnimationFrame(() => {
      const card = yes ? experienceBouquet : experienceSad;
      const rect = card.getBoundingClientRect();
      if (rect.top > innerHeight * .6 || rect.bottom < 0) card.scrollIntoView({ behavior: motion.matches ? "instant" : "smooth", block: "start" });
    });
  }
  experienceYes.addEventListener("click", () => chooseExperience(true));
  experienceNo.addEventListener("click", () => chooseExperience(false));
  document.addEventListener("visibilitychange", () => body.classList.toggle("decorations-paused", document.hidden));
})();
