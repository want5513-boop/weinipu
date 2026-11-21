/* 訂歌連結集中管理：帳號或通路若有更換，只需改下面這一處。 */
const ORDER_URL = "https://lin.ee/XaCESBb";

document.querySelectorAll(".js-order-link").forEach((link) => {
  link.href = ORDER_URL;
});

/* 場合選項：點選後顯示一句應景的話，並可前往方案區下單。
   放在最前面、用事件委派綁在 document 上，即使頁面其他區塊或腳本有狀況，也不會讓按鈕失效。 */
(function initOccasionChips() {
  function stickyOffset() {
    const bar = document.querySelector(".sticky-cta");
    if (!bar) return 0;
    const cs = window.getComputedStyle(bar);
    if (cs.display === "none" || cs.position !== "fixed") return 0;
    return bar.getBoundingClientRect().height;
  }

  function revealNote(note) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      const rect = note.getBoundingClientRect();
      const header = document.querySelector(".site-header");
      const topLimit = (header ? header.getBoundingClientRect().height : 0) + 12;
      const bottomLimit = window.innerHeight - stickyOffset() - 16;
      let delta = 0;
      if (rect.bottom > bottomLimit) delta = rect.bottom - bottomLimit;
      if (rect.top - delta < topLimit) delta = rect.top - topLimit;
      if (Math.abs(delta) > 1) {
        window.scrollBy({ top: delta, behavior: reduce ? "auto" : "smooth" });
      }
    });
  }

  function showLine(chip) {
    const root = chip.closest(".occasions") || document;
    const note = root.querySelector(".chip-note");
    const textEl = root.querySelector(".chip-note-text");
    const card = root.querySelector(".chip-note-card");
    const line = (chip.getAttribute("data-line") || "").trim();
    if (!note || !textEl || !line) return;

    root.querySelectorAll(".chip").forEach((other) => {
      const on = other === chip;
      other.classList.toggle("is-active", on);
      other.setAttribute("aria-pressed", on ? "true" : "false");
    });

    textEl.textContent = line;
    note.hidden = false;
    note.removeAttribute("hidden");

    if (card) {
      card.classList.remove("is-in");
      void card.offsetWidth;
      card.classList.add("is-in");
    }
    revealNote(note);
  }

  document.addEventListener("click", (event) => {
    const chip = event.target && event.target.closest ? event.target.closest(".chip[data-line]") : null;
    if (!chip) return;
    if (chip.tagName === "A") event.preventDefault();
    showLine(chip);
  });
})();

/* 手機選單 */
const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");

function setMenu(open) {
  if (!header || !toggle) return;
  header.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
}

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    setMenu(!header.classList.contains("is-open"));
  });
  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setMenu(false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });
  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) setMenu(false);
  });
}

/* 作品試聽播放器
   同時只播放一首。開始播放時會暫停網站背景音樂，結束後不自動恢復；
   若要再聽背景音樂，請按右下角喇叭。音檔尚未上架時，按鈕維持停用。 */
const players = [...document.querySelectorAll(".player")];
let current = null;

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function pauseCurrent() {
  if (!current) return;
  const audio = current.querySelector("audio");
  if (audio) audio.pause();
  current.classList.remove("is-playing");
  const btn = current.querySelector(".play-btn");
  if (btn) {
    const title = current.dataset.title || "歌曲";
    btn.setAttribute("aria-label", `播放《${title}》`);
  }
}

function pauseAllSamples() {
  pauseCurrent();
  current = null;
}

document.addEventListener("weinipu:bgmplay", pauseAllSamples);

players.forEach((player) => {
  const audio = player.querySelector("audio");
  const btn = player.querySelector(".play-btn");
  const progress = player.querySelector(".player-progress");
  const elapsed = player.querySelector("[data-elapsed]");
  const durationEl = player.querySelector("[data-duration]");
  const status = player.querySelector(".player-status");
  const title = player.dataset.title || "歌曲";

  const srcFromData = player.getAttribute("data-audio") || "";
  if (srcFromData && audio && !audio.querySelector("source") && !audio.getAttribute("src")) {
    audio.src = srcFromData;
  }

  const hasSource = Boolean(
    (audio && (audio.getAttribute("src") || audio.querySelector("source"))) || srcFromData
  );

  if (!hasSource) {
    player.classList.add("is-pending");
    if (btn) {
      btn.disabled = true;
      btn.setAttribute("aria-label", `《${title}》試聽準備中`);
    }
    if (status) status.textContent = "試聽準備中";
    return;
  }

  if (btn) btn.disabled = false;
  if (status) status.textContent = "";

  if (audio) {
    audio.addEventListener("loadedmetadata", () => {
      if (durationEl) durationEl.textContent = formatTime(audio.duration);
    });
    audio.addEventListener("timeupdate", () => {
      if (progress && audio.duration) {
        progress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
      }
      if (elapsed) elapsed.textContent = formatTime(audio.currentTime);
    });
    audio.addEventListener("ended", () => {
      player.classList.remove("is-playing");
      if (progress) progress.style.width = "0%";
      if (elapsed) elapsed.textContent = "0:00";
      if (btn) btn.setAttribute("aria-label", `播放《${title}》`);
      if (current === player) current = null;
    });
  }

  const bar = player.querySelector(".player-bar");
  bar?.addEventListener("click", (event) => {
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
  });

  btn?.addEventListener("click", () => {
    if (!audio) return;
    if (player.classList.contains("is-playing")) {
      pauseCurrent();
      current = null;
      return;
    }
    if (current && current !== player) pauseCurrent();
    document.dispatchEvent(new CustomEvent("weinipu:sampleplay"));
    audio.play().then(() => {
      player.classList.add("is-playing");
      btn.setAttribute("aria-label", `暫停《${title}》`);
      current = player;
      if (status) status.textContent = "";
    }).catch(() => {
      if (status) status.textContent = "暫時無法播放";
    });
  });
});

/* 網站背景音樂：第一次互動後播放副歌循環，右下角按鈕可靜音並記住選擇。 */
(function initSiteBgm() {
  const audio = document.getElementById("site-bgm");
  const btn = document.getElementById("bgm-toggle");
  if (!audio || !btn) return;

  const STORAGE_KEY = "weinipu-bgm";
  const TARGET_VOL = 0.5;
  const FADE_MS = 1500;
  const GESTURES = ["pointerdown", "touchstart", "scroll", "keydown"];

  let fadeFrame = 0;
  let started = false;
  let starting = false;
  let userOff = false;
  let holdOff = false;

  try {
    userOff = localStorage.getItem(STORAGE_KEY) === "off";
  } catch (err) {
    userOff = false;
  }

  function remember(off) {
    userOff = off;
    try {
      localStorage.setItem(STORAGE_KEY, off ? "off" : "on");
    } catch (err) {
      /* private mode */
    }
  }

  function setUi(playing) {
    btn.classList.toggle("is-playing", playing);
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    btn.setAttribute("aria-label", playing ? "關閉背景音樂" : "開啟背景音樂");
  }

  function fadeTo(target, ms) {
    if (fadeFrame) cancelAnimationFrame(fadeFrame);
    const from = audio.volume;
    const t0 = performance.now();
    const token = {};
    fadeFrame = token;
    function step(now) {
      if (fadeFrame !== token) return;
      const p = Math.min(1, Math.max(0, (now - t0) / ms));
      const eased = 1 - (1 - p) * (1 - p);
      const next = from + (target - from) * eased;
      audio.volume = Math.min(1, Math.max(0, next));
      if (p < 1) requestAnimationFrame(step);
      else fadeFrame = 0;
    }
    requestAnimationFrame(step);
  }

  function startPlayback() {
    if (userOff || started || starting || holdOff) return Promise.resolve();
    starting = true;
    audio.muted = false;
    audio.volume = 0;
    const play = audio.play();
    const onStart = () => {
      starting = false;
      started = true;
      fadeTo(TARGET_VOL, FADE_MS);
      setUi(true);
    };
    const onFail = (err) => {
      starting = false;
      throw err;
    };
    if (play && typeof play.then === "function") {
      return play.then(onStart, onFail);
    }
    onStart();
    return Promise.resolve();
  }

  function stopPlayback() {
    fadeFrame = 0;
    starting = false;
    audio.pause();
    started = false;
    setUi(false);
  }

  function onFirstGesture(event) {
    if (userOff || started || holdOff) return;
    if (event && btn.contains(event.target)) return;
    const target = event && event.target;
    if (target && target.closest && target.closest(".player, .sample-lyrics, .play-btn")) return;
    startPlayback().catch(() => {});
  }

  function armGestures() {
    const onOnce = (event) => {
      GESTURES.forEach((name) => {
        window.removeEventListener(name, onOnce, true);
      });
      onFirstGesture(event);
    };
    GESTURES.forEach((name) => {
      window.addEventListener(name, onOnce, { capture: true, passive: true });
    });
  }

  function duckForSample() {
    holdOff = true;
    if (fadeFrame) cancelAnimationFrame(fadeFrame);
    fadeFrame = 0;
    starting = false;
    audio.pause();
    started = false;
    setUi(false);
  }

  document.addEventListener("weinipu:sampleplay", duckForSample);

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (started && !audio.paused) {
      remember(true);
      holdOff = false;
      stopPlayback();
      return;
    }
    remember(false);
    holdOff = false;
    started = false;
    document.dispatchEvent(new CustomEvent("weinipu:bgmplay"));
    startPlayback().catch(() => {});
  });

  setUi(false);

  if (userOff) {
    return;
  }

  const autoplay = startPlayback();
  if (autoplay && typeof autoplay.catch === "function") {
    autoplay.catch(() => {});
  }
  armGestures();
})();

/* 歌詞範例放大 */
(function () {
  var thumbs = document.querySelectorAll(".lyric-thumb");
  if (!thumbs.length) return;
  var box = document.createElement("div");
  box.className = "lyric-lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "歌詞範例放大圖");
  box.innerHTML = '<button type="button" class="lyric-lightbox-close" aria-label="關閉">\u00d7</button><img alt="">';
  document.body.appendChild(box);
  var img = box.querySelector("img");
  var last = null;
  function close() { box.classList.remove("is-open"); img.removeAttribute("src"); if (last) last.focus(); }
  Array.prototype.forEach.call(thumbs, function (t) {
    t.addEventListener("click", function () {
      last = t;
      img.src = t.getAttribute("data-full");
      img.alt = (t.querySelector("img") || {}).alt || "";
      box.classList.add("is-open");
      box.querySelector("button").focus();
    });
  });
  box.addEventListener("click", function (e) { if (e.target !== img) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box.classList.contains("is-open")) close(); });
})();
