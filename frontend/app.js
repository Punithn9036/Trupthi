(function () {
  "use strict";

  // ----------------------------------------------------------
  // CONFIG — point this at your deployed backend.
  let API_BASE = window.API_BASE_URL;
  if (!API_BASE) {
    const isLocal =
      window.location.protocol === "file:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "";
    API_BASE = isLocal ? "http://localhost:3001" : "";
  }

  // ============================================================
  // PART 1 — CRITICAL SETUP (navigation + forms)
  // Everything in this part must run before anything decorative.
  // If any of it throws, we want to know loudly, not silently
  // fall back to native form submission (which reloads the page).
  // ============================================================

  // ----------------------------------------------------------
  // SLIDE ORDER / NAVIGATION
  // ----------------------------------------------------------
  const ORDER = ["1", "2", "3", "4", "5", "6", "7", "8"]; // linear part (include slide 8)
  let currentSlideKey = "1";
  let history = ["1"]; // stack for back navigation across branches

  const slides = {};
  document.querySelectorAll(".slide").forEach((el) => {
    slides[el.dataset.slide] = el;
  });

  const progressEl = document.getElementById("progress");

  function updateProgress(key) {
    const idx = ORDER.indexOf(key);
    progressEl.textContent = idx === -1 ? "" : `${idx + 1} / ${ORDER.length}`;
  }

  function goTo(key, { fromBack = false, pushHistory = true } = {}) {
    if (!slides[key]) return;
    const outgoing = slides[currentSlideKey];
    const incoming = slides[key];

    if (outgoing) {
      outgoing.classList.remove("is-active");
      outgoing.classList.toggle("is-leaving-back", fromBack);
    }

    incoming.classList.remove("is-leaving-back");
    void incoming.offsetWidth; // force reflow so the transition re-triggers
    incoming.classList.add("is-active");

    if (pushHistory && currentSlideKey !== key) {
      history.push(key);
    }
    currentSlideKey = key;
    updateProgress(key);

    incoming.querySelectorAll(".reveal-text").forEach((n) => {
      n.style.animation = "none";
      void n.offsetWidth;
      n.style.animation = "";
    });

    incoming.scrollTop = 0;
  }

  function goBack() {
    if (history.length <= 1) return;
    history.pop();
    goTo(history[history.length - 1], { fromBack: true, pushHistory: false });
  }

  function nextInOrder() {
    const idx = ORDER.indexOf(currentSlideKey);
    if (idx === -1 || idx === ORDER.length - 1) return;
    goTo(ORDER[idx + 1]);
  }

  document.querySelectorAll("[data-next]").forEach((btn) => btn.addEventListener("click", nextInOrder));
  document.querySelectorAll("[data-back]").forEach((btn) => btn.addEventListener("click", goBack));
  document.querySelectorAll("[data-back-to-8]").forEach((btn) =>
    btn.addEventListener("click", () => goTo("8", { fromBack: true }))
  );

  slides["1"].classList.add("is-active");
  updateProgress("1");

  const btnYes = document.getElementById("btnYes");
  if (btnYes) btnYes.addEventListener("click", () => goTo("9a"));
  else console.warn("btnYes not found — cannot attach handler");

  const btnTalk = document.getElementById("btnTalk");
  if (btnTalk) btnTalk.addEventListener("click", () => goTo("9b"));
  else console.warn("btnTalk not found — cannot attach handler");

  // ----------------------------------------------------------
  // HELPERS used by the forms below
  // ----------------------------------------------------------
  function setLoading(btn, isLoading) {
    const spinner = btn.querySelector(".btn-spinner");
    btn.disabled = isLoading;
    if (spinner) spinner.hidden = !isLoading;
    btn.style.opacity = isLoading ? "0.85" : "1";
  }

  function formatDate(isoDate) {
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(t) {
    const [h, m] = t.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  // ----------------------------------------------------------
  // SLIDE 8A — DATE FORM
  // ----------------------------------------------------------
  const dateForm = document.getElementById("dateForm");
  const dateInput = document.getElementById("dateInput");
  const timeInput = document.getElementById("timeInput");
  const messageInput = document.getElementById("messageInput");
  const formError = document.getElementById("formError");
  const submitError = document.getElementById("submitError");
  const confirmBtn = document.getElementById("confirmDateBtn");

  // prevent selecting a date in the past
  (function setMinDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  })();

  let dateSubmitted = false;

  dateForm.addEventListener("submit", async (e) => {
    // preventDefault must run synchronously, first thing, no matter what —
    // this is what stops the browser from doing a native page reload.
    e.preventDefault();
    e.stopPropagation();

    try {
      if (dateSubmitted) return; // prevent duplicate accidental submissions

      formError.hidden = true;
      submitError.hidden = true;

      const dateVal = dateInput.value;
      const timeVal = timeInput.value;

      if (!dateVal || !timeVal) {
        formError.textContent = "Please choose both a date and a time.";
        formError.hidden = false;
        return;
      }

      const chosen = new Date(`${dateVal}T${timeVal}`);
      if (chosen.getTime() < Date.now()) {
        formError.textContent = "That time's already passed — could you pick a moment in the future?";
        formError.hidden = false;
        return;
      }

      setLoading(confirmBtn, true);
      dateSubmitted = true;

      try {
        const res = await fetch(`${API_BASE}/api/response`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            response: "yes",
            date: dateVal,
            time: timeVal,
            message: messageInput.value.trim(),
          }),
        });

        if (!res.ok) {
          // surface the server's actual error message when available
          let serverMsg = "";
          try {
            const body = await res.json();
            serverMsg = body?.error || "";
          } catch (_) {
            /* response wasn't JSON — ignore */
          }
          console.error("Submit failed:", res.status, serverMsg);
          throw new Error(serverMsg || `Request failed with status ${res.status}`);
        }

        document.getElementById("confirmedDateTime").textContent = `${formatDate(dateVal)} at ${formatTime(
          timeVal
        )}`;
        goTo("9a-confirm");
      } catch (err) {
        console.error("Date form submission error:", err);
        dateSubmitted = false;
        submitError.hidden = false;
      } finally {
        setLoading(confirmBtn, false);
      }
    } catch (outerErr) {
      // belt-and-suspenders: even if something above throws unexpectedly,
      // preventDefault() already fired, so we just log it — no page reload.
      console.error("Unexpected error in date form handler:", outerErr);
      setLoading(confirmBtn, false);
      submitError.hidden = false;
    }

    return false;
  });

  // ----------------------------------------------------------
  // SLIDE 8B — TALK FIRST FORM
  // ----------------------------------------------------------
  const talkForm = document.getElementById("talkForm");
  const talkMessageInput = document.getElementById("talkMessageInput");
  const talkSubmitError = document.getElementById("talkSubmitError");
  const sendTalkBtn = document.getElementById("sendTalkBtn");

  let talkSubmitted = false;

  talkForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (talkSubmitted) return;

      talkSubmitError.hidden = true;
      setLoading(sendTalkBtn, true);
      talkSubmitted = true;

      try {
        const res = await fetch(`${API_BASE}/api/response`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            response: "talk_first",
            message: talkMessageInput.value.trim(),
          }),
        });

        if (!res.ok) {
          let serverMsg = "";
          try {
            const body = await res.json();
            serverMsg = body?.error || "";
          } catch (_) {}
          console.error("Submit failed:", res.status, serverMsg);
          throw new Error(serverMsg || `Request failed with status ${res.status}`);
        }

        goTo("9b-confirm");
      } catch (err) {
        console.error("Talk-first form submission error:", err);
        talkSubmitted = false;
        talkSubmitError.hidden = false;
      } finally {
        setLoading(sendTalkBtn, false);
      }
    } catch (outerErr) {
      console.error("Unexpected error in talk form handler:", outerErr);
      setLoading(sendTalkBtn, false);
      talkSubmitError.hidden = false;
    }

    return false;
  });

  // ============================================================
  // PART 2 — DECORATIVE / OPTIONAL (hearts, photos)
  // Wrapped in try/catch so a bad image path or missing element
  // can never break navigation or form submission above.
  // ============================================================

  function safe(fn, label) {
    try {
      fn();
    } catch (err) {
      console.warn(`[decorative] "${label}" failed, continuing anyway:`, err);
    }
  }

  safe(function spawnHearts() {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const container = document.getElementById("hearts");
    if (!container) return;
    for (let i = 0; i < 10; i++) {
      const span = document.createElement("span");
      span.textContent = "❤";
      span.style.left = `${Math.random() * 100}%`;
      span.style.fontSize = `${0.9 + Math.random() * 1.1}rem`;
      const duration = 14 + Math.random() * 12;
      span.style.animationDuration = `${duration}s`;
      span.style.animationDelay = `${Math.random() * duration}s`;
      container.appendChild(span);
    }
  }, "ambient hearts");

  const DATA = window.SITE_DATA || {};

  safe(function openingPhoto() {
    if (!(DATA.openingPhoto && DATA.openingPhoto.image)) return;
    const wrap = document.getElementById("openingPhotoWrap");
    const img = document.getElementById("openingPhotoImg");
    const cap = document.getElementById("openingPhotoCaption");
    if (!wrap || !img || !cap) return;
    img.src = DATA.openingPhoto.image;
    img.alt = DATA.openingPhoto.caption || "";
    cap.textContent = DATA.openingPhoto.caption || "";
    wrap.hidden = false;
  }, "opening photo");

  safe(function hugPhoto() {
    const img = document.getElementById("hugPhotoImg");
    const cap = document.getElementById("hugPhotoCaption");
    const card = document.getElementById("hugPhotoCard");
    if (!img || !cap || !card) return;
    if (DATA.hugPhoto && DATA.hugPhoto.image) {
      img.src = DATA.hugPhoto.image;
      img.alt = DATA.hugPhoto.caption || "the one hug";
      cap.textContent = DATA.hugPhoto.caption || "";
    } else {
      card.style.display = "none";
    }
  }, "hug photo");

  safe(function timePassedPhoto() {
    if (!(DATA.timePassedPhoto && DATA.timePassedPhoto.image)) return;
    const wrap = document.getElementById("timePhotoWrap");
    const img = document.getElementById("timePhotoImg");
    const cap = document.getElementById("timePhotoCaption");
    if (!wrap || !img) return;
    img.src = DATA.timePassedPhoto.image;
    img.alt = DATA.timePassedPhoto.caption || "";
    if (cap && DATA.timePassedPhoto.caption) {
      cap.textContent = DATA.timePassedPhoto.caption;
    }
    wrap.hidden = false;
  }, "time-passed photo");

  safe(function memoryPolaroids() {
    const row = document.getElementById("memoryPhotos");
    if (!row) return;
    const memories = (DATA.memories || []).filter((m) => m.feature && m.image);

    const slots = Array.from(row.querySelectorAll(".polaroid--slot"));
    if (slots.length) {
      // Fill existing slots (keeps layout intact)
      slots.forEach((slot, i) => {
        const m = memories[i];
        if (!m) return;
        // clear placeholder content
        slot.innerHTML = "";
        slot.classList.remove("polaroid--placeholder");
        slot.classList.add("polaroid");
        slot.style.transform = Math.random() > 0.5 ? "rotate(2.5deg)" : "rotate(-2.5deg)";
        const img = document.createElement("img");
        img.src = m.image;
        img.alt = m.title || "";
        const cap = document.createElement("p");
        cap.className = "polaroid-caption";
        cap.textContent = m.title || "";
        slot.appendChild(img);
        slot.appendChild(cap);
      });
    } else {
      // fallback: append up to 6
      memories.slice(0, 6).forEach((m) => {
        const card = document.createElement("div");
        card.className = "polaroid";
        card.style.transform = Math.random() > 0.5 ? "rotate(2.5deg)" : "rotate(-2.5deg)";
        const img = document.createElement("img");
        img.src = m.image;
        img.alt = m.title || "";
        const cap = document.createElement("p");
        cap.className = "polaroid-caption";
        cap.textContent = m.title || "";
        card.appendChild(img);
        card.appendChild(cap);
        row.appendChild(card);
      });
    }
  }, "memory polaroids");

  // ----------------------------------------------------------
  // MUSIC PLAYER ("♫ Play something?" -> "I Wanna Be Yours")
  // ----------------------------------------------------------
  safe(function initMusicPlayer() {
    const btn = document.getElementById("musicToggle");
    const audio = document.getElementById("bgMusic");
    const text = document.getElementById("musicToggleText");
    if (!btn || !audio || !text) return;

    btn.addEventListener("click", () => {
      if (audio.paused) {
        audio.play().then(() => {
          btn.classList.add("is-playing");
          text.textContent = "I Wanna Be Yours ⏸";
        }).catch((err) => {
          console.warn("Audio playback failed or needs user interaction:", err);
          // If no audio file is found or network issue:
          text.textContent = "I Wanna Be Yours ♪";
        });
      } else {
        audio.pause();
        btn.classList.remove("is-playing");
        text.textContent = "Play something? ▶";
      }
    });

    audio.addEventListener("ended", () => {
      btn.classList.remove("is-playing");
      text.textContent = "Play something?";
    });
  }, "music player");
})();
