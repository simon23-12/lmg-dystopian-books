"use strict";

/* ---------------------------------------------------------------
   The Great LMG Dystopian Book Overview
   Zeitstrahl der Plakate und eine Vollbild-Ansicht fuers iPad:
   wischen zum Blaettern, zwei Finger oder Doppeltipp zum Zoomen.
----------------------------------------------------------------- */

const $ = (id) => document.getElementById(id);
let books = [];
let index = -1;

fetch("books.json")
  .then((r) => r.json())
  .then((data) => {
    books = data;
    render();
    fromHash();
  });

function render() {
  const list = $("books");
  books.forEach((b, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "card";
    btn.type = "button";
    btn.setAttribute("aria-label", `${b.title} by ${b.author}, ${b.year} — open poster`);
    btn.innerHTML = `
      <div class="thumb">
        <img src="thumbs/${b.slug}.jpg" alt="" loading="${i < 6 ? "eager" : "lazy"}" decoding="async">
        <span class="year">${b.year}</span>
      </div>
      <div class="label">
        <h3></h3>
        <p></p>
        <p class="no">Poster ${String(i + 1).padStart(2, "0")} / ${books.length}</p>
      </div>`;
    btn.querySelector("h3").textContent = b.title;
    btn.querySelector(".label p").textContent = b.author;
    btn.addEventListener("click", () => open(i));
    li.appendChild(btn);
    list.appendChild(li);
  });
}

/* ---------- Adresse: #the-giver oeffnet direkt das Plakat ---------- */

function fromHash() {
  const slug = decodeURIComponent(location.hash.slice(1));
  const i = books.findIndex((b) => b.slug === slug);
  if (i >= 0) show(i);
  else if (index >= 0) hide();
}
window.addEventListener("hashchange", fromHash);

function open(i) {
  location.hash = books[i].slug;
}
function close() {
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  hide();
}

/* ---------- Vollbild-Ansicht ---------- */

const viewer = $("viewer");
const stage = $("stage");
const img = $("v-img");
let lastFocus = null;

// Zoom-Zustand: Bild liegt zentriert in Grundgroesse (fit); darauf
// wirkt translate(tx, ty) scale(s) mit Ursprung oben links.
let s = 1, tx = 0, ty = 0;
let fit = { w: 0, h: 0, x: 0, y: 0 };

function show(i) {
  const first = index < 0 || viewer.hidden;
  index = i;
  const b = books[i];
  if (first) {
    lastFocus = document.activeElement;
    viewer.hidden = false;
    document.body.style.overflow = "hidden";
  }
  viewer.classList.remove("ruhig");
  $("v-title").textContent = b.title;
  $("v-meta").textContent = `${b.author} · ${b.year}`;
  $("v-count").textContent = `${String(i + 1).padStart(2, "0")} / ${books.length}`;
  $("v-prev").disabled = i === 0;
  $("v-next").disabled = i === books.length - 1;
  img.alt = `Poster: ${b.title} by ${b.author}`;

  // Erst das kleine Bild, dann das scharfe nachladen.
  img.src = `thumbs/${b.slug}.jpg`;
  const gross = new Image();
  gross.onload = () => { if (index === i) img.src = gross.src; };
  gross.src = `posters/${b.slug}.jpg`;
  [i - 1, i + 1].forEach((n) => { if (books[n]) new Image().src = `posters/${books[n].slug}.jpg`; });

  layout();
  reset(false);
  if (first) $("v-close").focus();
}

function hide() {
  viewer.hidden = true;
  document.body.style.overflow = "";
  index = -1;
  lastFocus?.focus?.();
}

function layout() {
  if (index < 0) return;
  const r = books[index].ratio;
  const cw = stage.clientWidth, ch = stage.clientHeight;
  let w = cw, h = cw / r;
  if (h > ch) { h = ch; w = ch * r; }
  fit = { w, h, x: (cw - w) / 2, y: (ch - h) / 2 };
  img.style.width = `${w}px`;
  img.style.height = `${h}px`;
  img.style.position = "absolute";
  img.style.left = `${fit.x}px`;
  img.style.top = `${fit.y}px`;
  img.style.maxWidth = "none";
  img.style.maxHeight = "none";
}
window.addEventListener("resize", () => { layout(); reset(false); });

function apply(anim) {
  stage.classList.toggle("anim", !!anim);
  img.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  viewer.classList.toggle("zoomed", s > 1.01);
}

function reset(anim) {
  s = 1; tx = 0; ty = 0;
  apply(anim);
}

/** Haelt das Plakat im Bild: kleiner als der Schirm -> mittig. */
function clamp() {
  const cw = stage.clientWidth, ch = stage.clientHeight;
  const w = fit.w * s, h = fit.h * s;
  tx = w <= cw ? (cw - w) / 2 - fit.x : Math.min(-fit.x, Math.max(cw - fit.x - w, tx));
  ty = h <= ch ? (ch - h) / 2 - fit.y : Math.min(-fit.y, Math.max(ch - fit.y - h, ty));
}

/** Zoom auf Stufe neu um den Punkt (px, py) in Buehnen-Koordinaten. */
function zoomAt(neu, px, py) {
  const ux = (px - fit.x - tx) / s, uy = (py - fit.y - ty) / s;
  s = Math.min(5, Math.max(1, neu));
  tx = px - fit.x - s * ux;
  ty = py - fit.y - s * uy;
}

/* ---------- Gesten ---------- */

const zeiger = new Map();
let geste = null;
let letzterTipp = { t: 0, x: 0, y: 0 };

function punkt(e) {
  const r = stage.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

stage.addEventListener("pointerdown", (e) => {
  stage.setPointerCapture(e.pointerId);
  zeiger.set(e.pointerId, punkt(e));
  const p = [...zeiger.values()];
  if (p.length === 1) {
    geste = { art: "eins", start: p[0], tx0: tx, ty0: ty, bewegt: false, zeit: Date.now() };
  } else if (p.length === 2) {
    const mitte = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
    geste = {
      art: "zwei",
      abstand: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y),
      s0: s,
      ux: (mitte.x - fit.x - tx) / s,
      uy: (mitte.y - fit.y - ty) / s,
    };
  }
});

stage.addEventListener("pointermove", (e) => {
  if (!zeiger.has(e.pointerId) || !geste) return;
  zeiger.set(e.pointerId, punkt(e));
  const p = [...zeiger.values()];

  if (geste.art === "zwei" && p.length >= 2) {
    const mitte = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
    const abstand = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    s = Math.min(5, Math.max(0.8, geste.s0 * (abstand / geste.abstand)));
    tx = mitte.x - fit.x - s * geste.ux;
    ty = mitte.y - fit.y - s * geste.uy;
    apply(false);
    return;
  }

  if (geste.art === "eins") {
    const dx = p[0].x - geste.start.x, dy = p[0].y - geste.start.y;
    if (Math.hypot(dx, dy) > 8) geste.bewegt = true;
    if (s > 1.01) {
      tx = geste.tx0 + dx; ty = geste.ty0 + dy;   // verschieben
    } else {
      tx = dx; ty = 0;                             // wischen
    }
    apply(false);
  }
});

function ende(e) {
  if (!zeiger.has(e.pointerId)) return;
  zeiger.delete(e.pointerId);
  if (!geste) return;

  if (geste.art === "zwei") {
    if (zeiger.size === 0) {
      if (s < 1.05) reset(true);
      else { clamp(); apply(true); }
      geste = null;
    } else {
      // Ein Finger bleibt liegen: als Verschieben weitermachen.
      const rest = [...zeiger.values()][0];
      geste = { art: "eins", start: rest, tx0: tx, ty0: ty, bewegt: true, zeit: Date.now() };
    }
    return;
  }

  const dx = tx;
  if (!geste.bewegt) {
    tipp(geste.start);
  } else if (s <= 1.01) {
    if (dx < -70 && index < books.length - 1) return weiter(1);
    if (dx > 70 && index > 0) return weiter(-1);
    reset(true);
  } else {
    clamp();
    apply(true);
  }
  geste = null;
}
stage.addEventListener("pointerup", ende);
stage.addEventListener("pointercancel", ende);

function tipp(p) {
  const jetzt = Date.now();
  const doppelt = jetzt - letzterTipp.t < 320 && Math.hypot(p.x - letzterTipp.x, p.y - letzterTipp.y) < 40;
  letzterTipp = { t: doppelt ? 0 : jetzt, x: p.x, y: p.y };
  clearTimeout(tipp.timer);
  if (doppelt) {
    if (s > 1.01) reset(true);
    else { zoomAt(2.6, p.x, p.y); clamp(); apply(true); }
  } else {
    // Einfacher Tipp: Leisten ein- oder ausblenden (verzoegert, falls
    // noch ein zweiter Tipp kommt).
    tipp.timer = setTimeout(() => viewer.classList.toggle("ruhig"), 330);
  }
}

// Trackpad und Mausrad am Laptop
stage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const p = punkt(e);
  if (e.ctrlKey) zoomAt(s * Math.exp(-e.deltaY / 100), p.x, p.y);
  else if (s > 1.01) { tx -= e.deltaX; ty -= e.deltaY; }
  else return;
  if (s <= 1.01) reset(false);
  else { clamp(); apply(false); }
}, { passive: false });

// Safari schickt eigene Gesten-Events; die sollen nicht die Seite zoomen.
["gesturestart", "gesturechange", "gestureend"].forEach((t) =>
  viewer.addEventListener(t, (e) => e.preventDefault()),
);

function weiter(richtung) {
  const ziel = index + richtung;
  if (!books[ziel]) return reset(true);
  // Kurz hinausgleiten lassen, dann das naechste Plakat zeigen.
  tx = -richtung * stage.clientWidth;
  apply(true);
  setTimeout(() => {
    history.replaceState(null, "", "#" + books[ziel].slug);
    show(ziel);
    tx = richtung * stage.clientWidth * 0.4;
    apply(false);
    requestAnimationFrame(() => { tx = 0; apply(true); });
  }, 200);
  geste = null;
}

$("v-prev").addEventListener("click", () => weiter(-1));
$("v-next").addEventListener("click", () => weiter(1));
$("v-close").addEventListener("click", close);

document.addEventListener("keydown", (e) => {
  if (viewer.hidden) return;
  if (e.key === "Escape") close();
  else if (e.key === "ArrowRight") weiter(1);
  else if (e.key === "ArrowLeft") weiter(-1);
  else if (e.key === "+" || e.key === "=") { zoomAt(s * 1.5, stage.clientWidth / 2, stage.clientHeight / 2); clamp(); apply(true); }
  else if (e.key === "-") { if (s / 1.5 <= 1.01) reset(true); else { zoomAt(s / 1.5, stage.clientWidth / 2, stage.clientHeight / 2); clamp(); apply(true); } }
});

/* ---------- Offline: alles fuer den Unterricht ohne WLAN speichern ---------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data === "offline-bereit") $("offline").hidden = false;
    });
    navigator.serviceWorker.ready.then(async () => {
      const letzte = await caches.match("posters/stolen-time.jpg");
      if (letzte) $("offline").hidden = false;
    });
  });
}
