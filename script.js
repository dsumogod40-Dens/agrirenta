/* ---------- EQUIPMENT DATA (sample; later this comes from the database) ---------- */
const equipment = [
  { name: "Tractor", cat: "Land preparation", price: 1500, owner: "Dennis Sumogod", rating: 4.8, reviews: 12,
    desc: "Heavy-duty tractor for plowing, harrowing and hauling." },
  { name: "Rotary Tiller", cat: "Land preparation", price: 600, owner: "Dennis Sumogod", rating: 4.8, reviews: 9,
    desc: "Breaks and levels soil before planting." },
  { name: "Water Pump", cat: "Water and spraying", price: 500, owner: "Dennis Sumogod", rating: 4.8, reviews: 7,
    desc: "Moves water to your field for irrigation." },
  { name: "Harvester", cat: "Harvest", owner: "Sample Owner",
    desc: "Cuts and gathers the crop so harvest finishes faster." },
  { name: "Thresher", cat: "Harvest", owner: "Sample Owner",
    desc: "Separates grain from the stalk after harvest." },
  { name: "Hand Tractor", cat: "Land preparation", owner: "Sample Owner",
    desc: "Small walk-behind tractor for tight or small plots." },
  { name: "Power Sprayer", cat: "Water and spraying", owner: "Sample Owner",
    desc: "Sprays crops evenly with less time and labor." },
  { name: "Farm Trailer", cat: "Hauling", owner: "Sample Owner",
    desc: "Carries harvest, seed and supplies to and from the field." }
];

/* ---------- EQUIPMENT IMAGES (galing sa images/ folder; usba kung naay sayop) ---------- */
const eqImages = {
  "Tractor": "images/Agricultural Machinery .png",
  "Rotary Tiller": "images/Rotary Tiller .png",
  "Water Pump": "images/Water Pump .png",
  "Harvester": "images/harves.png",
  "Thresher": "images/Thresher .png",
  "Hand Tractor": "images/Tiller Neon .png",
  "Power Sprayer": "images/Neon Green Agricultural Sprayer Showcase.png",
  "Farm Trailer": "images/Futuristic T736A Agricultural Trailer Showcase.png"
};

/* ---------- RENDER EQUIPMENT CARDS ---------- */
const equipmentGrid = document.getElementById("equipmentGrid");
const priceText = (item) => item.price ? "₱" + item.price.toLocaleString() + " / day" : "Price set by owner";

if (equipmentGrid) {
  equipmentGrid.innerHTML = equipment
    .map((item, i) => `
      <article class="glass eq" data-i="${i}" data-cat="${item.cat}" data-name="${item.name.toLowerCase()} ${item.cat.toLowerCase()}">
        <img class="eq-img" src="${encodeURI(eqImages[item.name] || '')}" alt="${item.name}" loading="lazy">
        <h3>${item.name}</h3>
        <span class="eq-price">${priceText(item)}</span>
        <span class="eq-meta">${item.rating ? "★ " + item.rating + " · " : ""}${item.owner}</span>
        <button type="button" class="btn btn-ghost btn-sm" data-view="${i}">View details</button>
      </article>
    `)
    .join("");
}

/* ---------- SEARCH + TYPE FILTER ---------- */
const eqSearch = document.getElementById("eqSearch");
const eqChips = document.getElementById("eqChips");
const eqEmpty = document.getElementById("eqEmpty");
let eqCat = "All";

function filterEquipment() {
  const q = (eqSearch.value || "").trim().toLowerCase();
  let shown = 0;
  equipmentGrid.querySelectorAll(".eq").forEach((card) => {
    const ok = (eqCat === "All" || card.dataset.cat === eqCat) && card.dataset.name.includes(q);
    card.hidden = !ok;
    if (ok) shown++;
  });
  eqEmpty.hidden = shown > 0;
  measureHow(); // the sideways track changed width
}
if (equipmentGrid && eqSearch && eqChips) {
  ["All", ...new Set(equipment.map((e) => e.cat))].forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (c === "All" ? " on" : "");
    b.textContent = c;
    b.addEventListener("click", () => {
      eqCat = c;
      eqChips.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === b));
      filterEquipment();
    });
    eqChips.append(b);
  });
  eqSearch.addEventListener("input", filterEquipment);
}

/* ---------- EQUIPMENT DETAILS MODAL (explore first, log in only to book) ---------- */
const eqModal = document.getElementById("eqModal");
const eqModalBody = document.getElementById("eqModalBody");

function openEquipment(i) {
  const item = equipment[i];
  const days = [];
  for (let d = 0; d < 14; d++) {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    const booked = (d * 7 + i * 3) % 5 === 0; // sample pattern only
    days.push(`<span class="day${booked ? " off" : ""}"><small>${dt.toLocaleDateString("en-US", { weekday: "short" })}</small>${dt.getDate()}</span>`);
  }
  eqModalBody.innerHTML = `
    <button type="button" class="modal-x" data-close aria-label="Close">✕</button>
    <img class="modal-img" src="${encodeURI(eqImages[item.name] || '')}" alt="${item.name}">
    <div class="modal-info">
      <h2>${item.name}</h2>
      <p class="eq-price">${priceText(item)}</p>
      <p>${item.desc}</p>
      <p class="eq-meta">Owner: ${item.owner}${item.rating ? " · ★ " + item.rating + " (" + item.reviews + " sample reviews)" : " · no reviews yet"}</p>
      <h3>Availability, next 14 days</h3>
      <div class="days">${days.join("")}</div>
      <p class="eq-meta">Greyed days are already booked. Sample data for now.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="login.html?book=${encodeURIComponent(item.name)}">Log in to book</a>
        <button type="button" class="btn btn-ghost" data-close>Keep browsing</button>
      </div>
      <p class="eq-meta">You need an account to send a booking request.</p>
    </div>`;
  eqModal.showModal();
}
if (equipmentGrid && eqModal) {
  equipmentGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".eq");
    if (card) openEquipment(+card.dataset.i);
  });
  eqModal.addEventListener("click", (e) => {
    if (e.target === eqModal || e.target.closest("[data-close]")) eqModal.close();
  });
}

/* ---------- TEAM: tap effect + start animation kung makita ---------- */
/* (ang team cards naa na sa index.html, dili na i-render gikan sa JS) */
const teamGrid = document.querySelector(".tm-grid");
if (teamGrid) {
  teamGrid.querySelectorAll(".tm-card").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.remove("tap-pop"); void card.offsetWidth;
      card.classList.add("tap-pop");
      setTimeout(() => card.classList.remove("tap-pop"), 450);
    });
  });

  new IntersectionObserver(([en], io) => {
    if (en.isIntersecting) { teamGrid.classList.add("go"); io.disconnect(); }
  }, { threshold: 0.2 }).observe(teamGrid);
}


/* ---------- NAV (mobile menu) ---------- */
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
});
navLinks.addEventListener("click", (e) => { if (e.target.tagName === "A") navLinks.classList.remove("open"); });

/* ---------- REVEAL ON SCROLL (staggered per row) ---------- */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduce) {
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("in");
      revealIO.unobserve(el);
      // after the entrance, drop the delay so hover effects stay snappy
      setTimeout(() => { el.classList.add("done"); el.style.removeProperty("--d"); }, 1600);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".glass:not(.step):not(.eq), .section-head:not(.how-head)").forEach((el) => {
    el.classList.add("reveal");
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("glass"));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--d", i * 90 + "ms");
    revealIO.observe(el);
  });
}

/* ---------- STEP VIDEOS: hover on laptop, in-view/tap on phone ---------- */
const hoverDevice = matchMedia("(hover: hover) and (pointer: fine)");
const stepCards = document.querySelectorAll(".step");
stepCards.forEach((card) => {
  const v = card.querySelector("video");
  card._play = () => { v.play().catch(() => {}); card.classList.add("playing"); };
  card._stop = () => { v.pause(); v.currentTime = 0.1; card.classList.remove("playing"); };
  card.addEventListener("mouseenter", () => hoverDevice.matches && card._play());
  card.addEventListener("mouseleave", () => hoverDevice.matches && card._stop());
  card.addEventListener("click", () => (v.paused ? card._play() : card._stop()));
});
const stepIO = new IntersectionObserver((entries) => {
  if (hoverDevice.matches) return;
  entries.forEach((e) => (e.isIntersecting ? e.target._play() : e.target._stop()));
}, { threshold: 0.7 });
stepCards.forEach((c) => stepIO.observe(c));

/* ---------- PINNED SIDEWAYS SECTIONS: "How it works" + "Equipment" (laptop) ---------- */
const desktop = matchMedia("(min-width: 821px)");
const heroVideo = document.getElementById("heroVideo");
const pinned = [["how", "stepsTrack"], ["equipment", "equipmentGrid"]]
  .map(([s, t]) => ({ sec: document.getElementById(s), track: document.getElementById(t), dist: 0 }))
  .filter((p) => p.sec && p.track);

function measureHow() {
  pinned.forEach((p) => {
    if (!desktop.matches) { p.sec.style.height = ""; p.track.style.transform = ""; return; }
    p.dist = Math.max(p.track.scrollWidth - window.innerWidth, 0);
    p.sec.style.height = window.innerHeight + p.dist + "px";
  });
  onScroll();
}
function onScroll() {
  if (desktop.matches) {
    pinned.forEach((p) => {
      const range = p.sec.offsetHeight - window.innerHeight || 1;
      const pr = Math.min(Math.max(-p.sec.getBoundingClientRect().top / range, 0), 1);
      p.track.style.transform = `translate3d(${-pr * p.dist}px,0,0)`;
    });
  }
  if (!reduce && window.scrollY < window.innerHeight) {
    heroVideo.style.transform = `translateY(${window.scrollY * 0.12}px) scale(1.12)`; // slight parallax
  }
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", measureHow);
window.addEventListener("load", measureHow);
measureHow();

/* ---------- ANCHOR LINKS: land on the right section even with the pinned "How it works" ---------- */
function goTo(hash, smooth) {
  const el = document.querySelector(hash);
  if (!el) return;
  measureHow(); // make sure the pinned section has its final height first
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: smooth ? "smooth" : "instant" });
}
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const hash = a.getAttribute("href");
    if (hash.length > 1) { e.preventDefault(); history.replaceState(null, "", hash); goTo(hash, true); }
  });
});
window.addEventListener("load", () => { if (location.hash) goTo(location.hash, false); });

/* =====================================================
   V5: extra motion
   ===================================================== */

/* Hero headline: split into words so they can rise one by one */
const heroH1 = document.querySelector(".hero-inner h1");
if (heroH1 && !reduce) {
  let n = 0;
  Array.from(heroH1.childNodes).forEach((node) => {
    if (node.nodeType !== 3) return;
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part.trim()) { frag.append(part); return; }
      const w = document.createElement("span");
      w.className = "w";
      w.style.setProperty("--i", n++);
      w.textContent = part;
      frag.append(w);
    });
    node.replaceWith(frag);
  });
}

/* Cards: 3D tilt + light that follows the cursor (laptop only) */
if (hoverDevice.matches && !reduce) {
  document.querySelectorAll(".eq, .grid .glass, .about-launch").forEach((card) => {
    card.classList.add("tilt");
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--ry", (x - 0.5) * 8 + "deg");
      card.style.setProperty("--rx", (0.5 - y) * 8 + "deg");
      card.style.setProperty("--mx", x * 100 + "%");
      card.style.setProperty("--my", y * 100 + "%");
    });
    card.addEventListener("mouseleave", () => {
      ["--rx", "--ry"].forEach((v) => card.style.removeProperty(v));
    });
  });
}

/* Scroll progress bar, nav state, active link */
const progress = document.createElement("div");
progress.className = "progress";
document.body.prepend(progress);
const navEl = document.querySelector(".nav");
const spyLinks = [...document.querySelectorAll(".nav-links a")];
const spySections = spyLinks.map((a) => document.querySelector(a.getAttribute("href")));

function onScrollV5() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.setProperty("--p", max > 0 ? Math.min(window.scrollY / max, 1) : 0);
  navEl.classList.toggle("scrolled", window.scrollY > window.innerHeight * 0.6);
  let current = -1;
  spySections.forEach((sec, i) => {
    if (sec && sec.getBoundingClientRect().top <= window.innerHeight * 0.4) current = i;
  });
  spyLinks.forEach((a, i) => a.classList.toggle("active", i === current));
}
window.addEventListener("scroll", onScrollV5, { passive: true });
onScrollV5();

/* Count-up for the commission number */
const bigNum = document.querySelector(".big-num");
if (bigNum && !reduce) {
  const target = parseFloat(bigNum.textContent);
  const suffix = bigNum.textContent.replace(/[\d.]/g, "");
  bigNum.textContent = "0" + suffix;
  const numIO = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    numIO.disconnect();
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / 1200, 1);
      bigNum.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }, { threshold: 0.6 });
  numIO.observe(bigNum);
}