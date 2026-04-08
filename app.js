function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

let toastTimeout = 0;
let lastFocusEl = null;
let lastOverflow = "";
let focusTrapRoot = null;

function setPageScrollLocked(locked) {
  const body = document.body;
  if (!body) return;

  if (locked) {
    lastOverflow = body.style.overflow || "";
    body.style.overflow = "hidden";
  } else {
    body.style.overflow = lastOverflow;
  }
}

function hideToast() {
  const root = qs("#toast");
  if (!root) return;
  if (toastTimeout) {
    window.clearTimeout(toastTimeout);
    toastTimeout = 0;
  }
  root.setAttribute("hidden", "");
  root.removeAttribute("data-open");
}

function toast(title, msg) {
  const root = qs("#toast");
  const titleEl = qs("#toastTitle");
  const msgEl = qs("#toastMsg");
  if (!root || !titleEl || !msgEl) return;

  titleEl.textContent = title;
  msgEl.textContent = msg;
  root.removeAttribute("hidden");
  root.setAttribute("data-open", "true");

  if (toastTimeout) window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => hideToast(), 4600);
}

function bindToastClose() {
  document.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest("#toastClose");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      hideToast();
    },
    true,
  );

  document.addEventListener(
    "pointerdown",
    (e) => {
      const btn = e.target.closest("#toastClose");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      hideToast();
    },
    true,
  );

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape") return;
      hideToast();
    },
    true,
  );
}

function getFocusableElements(root) {
  if (!root) return [];
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex=\"-1\"])",
  ];
  return qsa(selectors.join(","), root).filter((el) => el instanceof HTMLElement && !el.hasAttribute("hidden"));
}

function trapFocus(e) {
  if (e.key !== "Tab") return;
  const root = focusTrapRoot;
  if (!root || root.hasAttribute("hidden")) return;

  const focusables = getFocusableElements(root);
  if (!focusables.length) return;

  const current = document.activeElement;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey) {
    if (current === first || !root.contains(current)) {
      e.preventDefault();
      last.focus();
    }
  } else if (current === last) {
    e.preventDefault();
    first.focus();
  }
}

function openLightboxFromImg(img) {
  const root = qs("#lightbox");
  const imgEl = qs("#lightboxImg");
  const frameWrap = qs("#lightboxFrameWrap");
  const frameEl = qs("#lightboxFrame");
  const caption = qs("#lightboxCaption");
  const closeBtn = qs("#lightboxClose");
  if (!root || !imgEl || !frameWrap || !frameEl || !caption || !closeBtn) return;

  const src = img.currentSrc || img.getAttribute("src") || "";
  if (!src) return;

  lastFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  frameWrap.setAttribute("hidden", "");
  frameEl.removeAttribute("src");
  frameEl.title = "";

  imgEl.removeAttribute("hidden");
  imgEl.src = src;
  imgEl.alt = img.getAttribute("alt") || "Imagem ampliada";
  caption.textContent = img.getAttribute("data-caption") || imgEl.alt || "";

  root.removeAttribute("hidden");
  root.setAttribute("data-open", "true");
  setPageScrollLocked(true);
  focusTrapRoot = root;
  document.addEventListener("keydown", trapFocus, true);

  closeBtn.focus();
}

function openLightboxPdf(url, captionText) {
  const root = qs("#lightbox");
  const imgEl = qs("#lightboxImg");
  const frameWrap = qs("#lightboxFrameWrap");
  const frameEl = qs("#lightboxFrame");
  const caption = qs("#lightboxCaption");
  const closeBtn = qs("#lightboxClose");
  if (!root || !imgEl || !frameWrap || !frameEl || !caption || !closeBtn) return;

  const src = String(url || "").trim();
  if (!src) return;

  lastFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  imgEl.setAttribute("hidden", "");
  imgEl.removeAttribute("src");
  imgEl.alt = "";

  frameWrap.removeAttribute("hidden");
  frameEl.src = src;
  frameEl.title = captionText || "Certificado (PDF)";

  caption.textContent = captionText || "Certificado";

  root.removeAttribute("hidden");
  root.setAttribute("data-open", "true");
  setPageScrollLocked(true);
  focusTrapRoot = root;
  document.addEventListener("keydown", trapFocus, true);

  closeBtn.focus();
}

function closeLightbox() {
  const root = qs("#lightbox");
  const imgEl = qs("#lightboxImg");
  const frameWrap = qs("#lightboxFrameWrap");
  const frameEl = qs("#lightboxFrame");
  const caption = qs("#lightboxCaption");
  if (!root || !imgEl || !frameWrap || !frameEl || !caption) return;

  root.setAttribute("hidden", "");
  root.removeAttribute("data-open");
  setPageScrollLocked(false);
  focusTrapRoot = null;
  document.removeEventListener("keydown", trapFocus, true);

  imgEl.removeAttribute("src");
  imgEl.alt = "";
  imgEl.setAttribute("hidden", "");

  frameWrap.setAttribute("hidden", "");
  frameEl.removeAttribute("src");
  frameEl.title = "";
  caption.textContent = "";

  if (lastFocusEl) lastFocusEl.focus();
  lastFocusEl = null;
}

function bindLightbox() {
  document.addEventListener("click", (e) => {
    const close = e.target.closest("[data-lightbox-close], #lightboxClose");
    if (close) {
      e.preventDefault();
      closeLightbox();
      return;
    }

    const pdfBtn = e.target.closest("[data-lightbox-pdf]");
    if (pdfBtn) {
      e.preventDefault();
      openLightboxPdf(pdfBtn.getAttribute("data-lightbox-pdf"), pdfBtn.getAttribute("data-caption") || "");
      return;
    }

    const img = e.target.closest("img[data-lightbox]");
    if (!img) return;

    e.preventDefault();
    openLightboxFromImg(img);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const root = qs("#lightbox");
    if (!root || root.hasAttribute("hidden")) return;
    closeLightbox();
  });
}

const THEMES = new Set(["azul", "lilas", "preto", "vermelho"]);

function setTheme(theme) {
  const safe = String(theme || "").trim();
  if (!safe || !THEMES.has(safe)) return;
  document.documentElement.setAttribute("data-theme", safe);
  try {
    window.localStorage.setItem("portfolio-theme", safe);
  } catch {
    // ignore
  }
}

function restoreTheme() {
  try {
    const stored = window.localStorage.getItem("portfolio-theme");
    if (stored) setTheme(stored);
  } catch {
    // ignore
  }
}

function bindTheme() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme]");
    if (!btn) return;
    setTheme(btn.getAttribute("data-theme"));
  });
}

function bindNav() {
  const toggle = qs("#navToggle");
  const links = qs("#navLinks");
  if (!toggle || !links) return;

  const closeMenu = () => {
    links.removeAttribute("data-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = links.getAttribute("data-open") === "true";
    if (open) closeMenu();
    else {
      links.setAttribute("data-open", "true");
      toggle.setAttribute("aria-expanded", "true");
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("#navLinks") || e.target.closest("#navToggle")) return;
    closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeMenu();
  });

  qsa('a[href^="#"]', links).forEach((a) => {
    a.addEventListener("click", () => closeMenu());
  });
}

function bindActiveSection() {
  const navLinks = qsa('.nav__link[href^="#"]');
  const ids = navLinks
    .map((a) => String(a.getAttribute("href") || "").slice(1))
    .filter(Boolean);
  const sections = ids.map((id) => qs(`#${CSS.escape(id)}`)).filter(Boolean);
  if (!sections.length || !navLinks.length) return;

  const linkById = new Map();
  navLinks.forEach((a) => linkById.set(String(a.getAttribute("href")).slice(1), a));

  const setCurrent = (id) => {
    navLinks.forEach((a) => a.removeAttribute("aria-current"));
    const link = linkById.get(id);
    if (link) link.setAttribute("aria-current", "true");
  };

  const obs = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
      if (!visible) return;
      setCurrent(visible.target.id);
    },
    { root: null, threshold: [0.25, 0.4, 0.55], rootMargin: "-20% 0px -70% 0px" },
  );

  sections.forEach((s) => obs.observe(s));

  const initial = String(window.location.hash || "").slice(1);
  if (initial) setCurrent(initial);
}

async function copyToClipboard(text) {
  const value = String(text || "");
  if (!value) return false;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(area);
  return ok;
}

function bindCopyEmail() {
  const btn = qs("#copyEmail");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const email = btn.getAttribute("data-email");
    try {
      const ok = await copyToClipboard(email);
      toast(ok ? "Copiado" : "Não copiado", ok ? "E-mail copiado para a área de transferência." : "Não foi possível copiar.");
    } catch {
      toast("Erro", "Não foi possível copiar o e-mail.");
    }
  });
}

function bindProjectFilters() {
  const section = qs("#projetos");
  if (!section) return;

  const buttons = qsa(".filter[data-filter]", section);
  const cards = qsa(".project[data-kind]", section);
  if (!buttons.length || !cards.length) return;
  if (buttons.length < 2) {
    const wrap = qs(".filters", section);
    if (wrap) wrap.setAttribute("hidden", "");
    return;
  }

  const setActive = (value) => {
    const filter = String(value || "all");

    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === filter)));
    cards.forEach((card) => {
      const kind = card.getAttribute("data-kind");
      card.hidden = filter !== "all" && kind !== filter;
    });
  };

  buttons.forEach((b) => {
    b.addEventListener("click", () => setActive(b.getAttribute("data-filter")));
  });

  setActive("all");
}

function bindAvatarPhoto() {
  const avatar = qs("[data-avatar]");
  if (!avatar) return;

  const img = qs(".avatar__img", avatar);
  if (!img) return;

  const mark = () => avatar.classList.add("has-photo");
  const clear = () => {
    avatar.classList.remove("has-photo");
    img.remove();
  };

  if (img.complete && img.naturalWidth > 0) mark();
  img.addEventListener("load", mark);
  img.addEventListener("error", clear);
}

function buildGmailComposeUrl({ to, cc, subject, body }) {
  const params = new URLSearchParams();
  params.set("view", "cm");
  params.set("fs", "1");
  params.set("tf", "1");
  params.set("to", to);
  if (cc) params.set("cc", cc);
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function runIntro() {
  const root = qs("#intro");
  if (!root) return;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    root.remove();
    return;
  }

  const skipBtn = qs("#introSkip");
  const canvas = qs("#introCanvas");
  let done = false;
  let timer = 0;
  let raf = 0;
  let resizeTimer = 0;
  let particles = [];
  let ctx = null;
  let start = 0;

  const getColor = (name, fallback) => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch {
      return fallback;
    }
  };

  const setupCanvas = () => {
    if (!(canvas instanceof HTMLCanvasElement)) return false;
    const c = canvas;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = c.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    ctx = c.getContext("2d");
    if (!ctx) return false;

    const count = Math.round(Math.min(130, Math.max(80, (rect.width * rect.height) / 14000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 0.8 + Math.random() * 1.9,
      a: 0.32 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
    }));
    return true;
  };

  const draw = (t) => {
    if (done || !ctx || !(canvas instanceof HTMLCanvasElement)) return;
    if (!start) start = t;

    const elapsed = (t - start) / 1000;
    const c = canvas;
    const w = c.width;
    const h = c.height;
    const cx = w * 0.5;
    const cy = h * 0.46;

    const accent = getColor("--accent", "rgba(59,130,246,1)");
    const accent2 = getColor("--accent2", "rgba(56,189,248,1)");

    ctx.clearRect(0, 0, w, h);

    // Soft vignette to keep focus near center
    const vignette = ctx.createRadialGradient(cx, cy, 40, cx, cy, Math.max(w, h) * 0.70);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.30)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    const orbit = 0.58 + Math.sin(elapsed * 0.35) * 0.06;
    const pull = 0.00115;
    const maxDist = Math.min(w, h) * 0.16;

    // Update particles
    for (const p of particles) {
      const dx = cx - p.x;
      const dy = cy - p.y;
      p.vx += dx * pull;
      p.vy += dy * pull;

      // gentle swirl
      const sw = 0.00018;
      p.vx += -dy * sw * orbit;
      p.vy += dx * sw * orbit;

      p.x += p.vx;
      p.y += p.vy;

      // small damping for slower motion
      p.vx *= 0.995;
      p.vy *= 0.995;

      // bounds
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;
    }

    // Lines
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d > maxDist) continue;
        const alpha = (1 - d / maxDist) * 0.20;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = accent2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Accent arcs
    const r0 = Math.min(w, h) * 0.14;
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(2, Math.min(5, w * 0.0028));
    ctx.beginPath();
    ctx.arc(cx, cy, r0, elapsed * 0.22, elapsed * 0.22 + 1.8);
    ctx.stroke();

    ctx.strokeStyle = accent2;
    ctx.globalAlpha = 0.30;
    ctx.lineWidth = Math.max(2, Math.min(4, w * 0.0022));
    ctx.beginPath();
    ctx.arc(cx, cy, r0 * 1.22, -elapsed * 0.18, -elapsed * 0.18 + 1.4);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Dots
    for (const p of particles) {
      const tw = 0.55 + 0.45 * (Math.sin(elapsed * 0.8 + p.phase) * 0.5 + 0.5);
      ctx.fillStyle = `rgba(255,255,255,${p.a * tw})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    raf = window.requestAnimationFrame(draw);
  };

  const finish = () => {
    if (done) return;
    done = true;
    if (timer) window.clearTimeout(timer);
    if (raf) window.cancelAnimationFrame(raf);
    if (resizeTimer) window.clearTimeout(resizeTimer);
    root.setAttribute("data-state", "closing");
    setPageScrollLocked(false);

    window.setTimeout(() => {
      root.remove();
    }, 420);

    document.removeEventListener("keydown", onKeydown, true);
    window.removeEventListener("resize", onResize);
  };

  const onKeydown = (e) => {
    if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      finish();
    }
  };

  const onResize = () => {
    if (done) return;
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (setupCanvas()) {
        if (!raf) raf = window.requestAnimationFrame(draw);
      }
    }, 80);
  };

  root.addEventListener("click", (e) => {
    const skip = e.target.closest("#introSkip");
    if (skip) return;
    finish();
  });

  if (skipBtn) skipBtn.addEventListener("click", finish);

  setPageScrollLocked(true);
  document.addEventListener("keydown", onKeydown, true);
  window.addEventListener("resize", onResize);

  if (setupCanvas()) raf = window.requestAnimationFrame(draw);

  window.requestAnimationFrame(() => {
    if (root.getAttribute("data-state") !== "open") root.setAttribute("data-state", "open");
    if (skipBtn) skipBtn.focus();
  });

  timer = window.setTimeout(finish, 4800);
}

function bindContactForm() {
  const form = qs("#contactForm");
  if (!form) return;

  const nameEl = qs("#cfName", form);
  const emailEl = qs("#cfEmail", form);
  const subjectEl = qs("#cfSubject", form);
  const messageEl = qs("#cfMessage", form);
  if (!nameEl || !emailEl || !subjectEl || !messageEl) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = String(nameEl.value || "").trim();
    const email = String(emailEl.value || "").trim();
    const subject = String(subjectEl.value || "").trim();
    const message = String(messageEl.value || "").trim();

    if (!name) {
      toast("Faltou o nome", "Digite seu nome para enviar a mensagem.");
      nameEl.focus();
      return;
    }
    if (!email || !email.includes("@")) {
      toast("E-mail inválido", "Digite um e-mail válido para receber a cópia.");
      emailEl.focus();
      return;
    }
    if (!subject) {
      toast("Faltou o assunto", "Digite um assunto para a mensagem.");
      subjectEl.focus();
      return;
    }
    if (!message) {
      toast("Faltou a mensagem", "Escreva sua mensagem antes de enviar.");
      messageEl.focus();
      return;
    }

    const to = "yasmim.oliveiraqueiros@gmail.com";
    const body = `Nome: ${name}\nE-mail: ${email}\n\nMensagem:\n${message}`;

    const url = buildGmailComposeUrl({ to, cc: email, subject, body });
    const opened = window.open(url, "_blank", "noopener");
    if (!opened) window.location.assign(url);
    toast("Abrindo Gmail", "Finalize o envio no Gmail. A mensagem vai para mim e com cópia para você.");
  });
}

function setYear() {
  const year = qs("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function main() {
  restoreTheme();
  runIntro();
  bindTheme();
  bindNav();
  bindActiveSection();
  bindToastClose();
  bindLightbox();
  bindAvatarPhoto();
  bindCopyEmail();
  bindContactForm();
  bindProjectFilters();
  setYear();
}

document.addEventListener("DOMContentLoaded", main);
