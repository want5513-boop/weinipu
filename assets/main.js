/* 訂歌連結集中管理：帳號或通路若有更換，只需改下面這一處。 */
const ORDER_URL = "https://lin.ee/XaCESBb";

document.querySelectorAll(".js-order-link").forEach((link) => {
  link.href = ORDER_URL;
});

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
