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
   音檔尚未上架時，按鈕維持停用，並顯示「試聽準備中」。
   待正式可公開授權的 MP3 備妥後，在對應 <audio> 放入 <source>，
   或在 .player 上設定 data-audio="assets/audio/檔名.mp3"。 */
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

  btn?.addEventListener("click", () => {
    if (!audio) return;
    if (player.classList.contains("is-playing")) {
      pauseCurrent();
      current = null;
      return;
    }
    if (current && current !== player) pauseCurrent();
    audio.play().then(() => {
      player.classList.add("is-playing");
      btn.setAttribute("aria-label", `暫停《${title}》`);
      current = player;
    }).catch(() => {
      if (status) status.textContent = "暫時無法播放";
    });
  });
});
