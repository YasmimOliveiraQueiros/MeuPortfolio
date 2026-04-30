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

const THEMES = new Set(["azul", "lilas", "preto"]);
const LANGS = new Set(["pt", "en"]);

const GITHUB_USER = "YasmimOliveiraQueiros";
const FEATURED_REPOS = ["PaginaLogin", "MeuPortfio"];
const PROJECT_LIVE_OVERRIDES = {
  PaginaLogin: "https://pagina-login-umber.vercel.app",
};

const PROJECT_I18N_OVERRIDES = {
  PaginaLogin: {
    title: { pt: "PaginaLogin · Login e cadastro", en: "PaginaLogin · Login & sign-up" },
    desc: {
      pt: "Página de login e cadastro, com foco em interface clara e organização do front-end.",
      en: "Login and sign-up page focused on a clear interface and front-end organization.",
    },
    tags: ["HTML", "CSS", "JavaScript"],
  },
  MeuPortfio: {
    title: { pt: "Meu Portfólio", en: "My Portfolio" },
    desc: {
      pt: "Meu portfólio pessoal: layout responsivo, sessões bem organizadas (sobre, projetos e certificados), temas de cor e interações com JavaScript.",
      en: "My personal portfolio: responsive layout, well-organized sections (about, projects and certificates), color themes, and JavaScript interactions.",
    },
    tags: ["HTML", "CSS", "JavaScript"],
  },
};

const I18N = {
  pt: {
    "meta.title": "Portfólio · Técnica em Informática",
    "meta.desc": "Portfólio responsivo de técnica em informática: sobre, habilidades, projetos e certificados.",
    skip: "Pular para o conteúdo",
    "boot.label": "NEXUS // ACESSO",
    "boot.kicker": "Portfólio",
    "boot.enter": "Iniciar",
    "boot.bypass": "Pular intro",
    "boot.hint": "Clique ou pressione Enter",
    "boot.aria": "Abertura do portfólio",
    "brand.sub": "Técnica em Informática · Dev Front-end/Back-end",
    "idcard.role": "Técnica em Informática",
    "topbar.aria": "Barra superior",
    "brand.aria": "Ir para o início",
    "nav.aria": "Navegação principal",
    "hero.aria": "Apresentação",
    "nav.menu": "Menu",
    "nav.about": "Sobre",
    "nav.skills": "Habilidades",
    "nav.learning": "Em aprendizado",
    "nav.projects": "Projetos",
    "nav.certs": "Certificados",
    "nav.contact": "Contato",
    "hero.pill1": "Ensino Médio Técnico (3º ano)",
    "hero.pill2": "Iniciando carreira em TI",
    "hero.pill3": "Disponível para estágio",
    "hero.title": "Construo soluções claras, eficientes e com foco em impacto.",
    "hero.lead":
      "Interesse em desenvolvimento de software, inteligência artificial e banco de dados — sempre buscando entender o “porquê” por trás das soluções.",
    "hero.ctaProjects": "Ver projetos",
    "hero.ctaContact": "Falar comigo",
    "theme.label": "Cores",
    "theme.aria": "Opções de cores e idioma",
    "theme.palette.aria": "Paleta de cores",
    "theme.swatch.blue": "Tema azul",
    "theme.swatch.purple": "Tema lilás",
    "theme.swatch.black": "Tema preto",
    "lang.aria": "Idioma",
    "hero.card.ctaCerts": "Ver certificados",
    "hero.card.copyEmail": "Copiar e-mail",
    "hero.card.aria": "Resumo rápido",
    "hero.facts.aria": "Destaques",
    "profile.alt": "Foto de Yasmim Oliveira Queiros",
    "hero.card.role": "Atuação",
    "hero.card.roleValue": "Front-end e Back-end",
    "hero.card.focus": "Foco",
    "hero.card.focusValue": "Software · IA · Dados",
    "about.title": "Quem sou eu",
    "about.section.aria": "Sobre mim",
    "about.card.aria": "Quem sou eu",
    "about.kv.aria": "Informações rápidas",
    "about.stats.aria": "Destaques rápidos",
    "about.kv.name": "Nome",
    "about.kv.course": "Curso",
    "about.kv.courseValue": "Ensino Médio Técnico em Informática",
    "about.kv.role": "Atuação",
    "about.kv.roleValue": "Dev Front-end & Back-end",
    "about.kv.focus": "Foco",
    "about.kv.focusValue": "Software · IA · Dados",
    "about.kv.goal": "Objetivo",
    "about.kv.goalValue": "Estágio em TI · Desenvolvimento fullstack",
    "about.kv.langs": "Idiomas",
    "about.kv.langsValue": "Português (Nativo) · Inglês (intermediário - aprimoramento)",
    "about.p1":
      "Sou estudante do 3º ano do Ensino Médio Técnico em Informática, apaixonada por tecnologia e pelo impacto que ela pode gerar na vida das pessoas. Tenho grande interesse em desenvolvimento de software, inteligência artificial e banco de dados, buscando constantemente evoluir minhas habilidades técnicas e analíticas.",
    "about.p2":
      "Ao longo da minha formação, venho desenvolvendo projetos práticos que envolvem lógica de programação, modelagem de dados e construção de aplicações, sempre com foco em organização, clareza e eficiência. Tenho facilidade em aprender novas tecnologias e gosto de entender não apenas o “como”, mas principalmente o “porquê” das soluções.",
    "about.p3":
      "Meu objetivo é ingressar na área de Tecnologia da Informação e contribuir com soluções inovadoras, enquanto continuo evoluindo profissionalmente e academicamente na área de computação.",
    "about.stats.year": "Ano do técnico",
    "about.stats.projects": "Projetos em destaque",
    "about.stats.certs": "Certificados",
    "about.stats.role": "Atuação",
    "about.stats.roleValue": "Front + Back",
    "section.about.title": "Sobre",
    "section.about.sub": "Quem eu sou e como penso.",
    "section.stack.title": "Tecnologias",
    "section.stack.sub": "Ferramentas que uso no dia a dia (passe o mouse para destacar).",
    "stack.section.aria": "Tecnologias e ferramentas",
    "stack.ticker.aria": "Tecnologias e ferramentas em destaque",
    "section.skills.title": "Habilidades",
    "section.skills.sub": "O que eu uso para entregar valor.",
    "skills.section.aria": "Habilidades",
    "skills.dev.title": "Desenvolvimento",
    "skills.dev.i1": "Estruturas de dados e lógica de programação",
    "skills.dev.i2": "Criação de APIs e integração front/back",
    "skills.dev.i3": "Interfaces responsivas e acessíveis",
    "skills.data.title": "Dados",
    "skills.data.i1": "Modelagem relacional e consultas SQL (PostgreSQL)",
    "skills.data.i2": "Organização e consistência de dados",
    "skills.data.i3": "Boas práticas de versionamento",
    "skills.ai.title": "IA & produtividade",
    "skills.ai.i1": "Uso de LLMs para estudo e prototipação",
    "skills.ai.i2": "Automação de tarefas, documentação e pacote Office",
    "skills.ai.i3": "Comunicação clara e foco em resultado",
    "section.learning.title": "Em aprendizado",
    "section.learning.sub": "O que estou estudando agora e onde quero evoluir.",
    "learning.section.aria": "Em aprendizado",
    "learning.title": "Metas e evolução",
    "learning.lead": "Planejamento por etapas: o que ainda vou iniciar, o que já está em andamento e o que já concluí.",
    "learning.future.title": "Futuras",
    "learning.future.badge": "Ainda não iniciadas",
    "learning.started.title": "Iniciadas",
    "learning.started.badge": "Em andamento",
    "learning.done.title": "Concluídas",
    "learning.done.badge": "Já finalizadas",
    "learning.tag.future": "Futura",
    "learning.tag.started": "Em andamento",
    "learning.tag.done": "Concluída",
    "learning.future.react": "Componentização, hooks e consumo de APIs.",
    "learning.future.sql": "Consultas avançadas, performance e modelagem.",
    "learning.future.python": "Bases sólidas e projetos práticos.",
    "learning.started.data": "Estudo aplicado e produtividade com IA.",
    "learning.started.java": "POO, organização e boas práticas.",
    "learning.started.db": "Aprimoramento da teoria e prática em banco de dados.",
    "learning.started.en": "Leitura técnica e conversação.",
    "learning.done.cloud": "Fundamentos e certificação.",
    "learning.done.networks": "Conceitos e fundamentos de rede.",
    "learning.note": "Acompanhe minha evolução pelo GitHub e pelos projetos.",
    "section.projects.title": "Projetos",
    "section.projects.sub": "Seleção para demonstrar prática e evolução.",
    "section.projects.more": "Quero ver mais",
    "projects.section.aria": "Projetos",
    "projects.filters.aria": "Filtrar projetos",
    "projects.tags.aria": "Tecnologias",
    "projects.filter.all": "Todos",
    "projects.repo": "Repositório",
    "projects.web": "Ver na web",
    "projects.p1.repoAria": "Abrir repositório PaginaLogin no GitHub",
    "projects.p1.webAria": "Abrir PaginaLogin na web",
    "projects.p1.title": "PaginaLogin · Login e cadastro",
    "projects.p1.desc": "Página de login e cadastro, com foco em interface clara e organização do front-end.",
    "projects.p2.repoAria": "Abrir repositório deste portfólio no GitHub",
    "projects.p2.title": "Meu Portfólio",
    "projects.p2.desc":
      "Meu portfólio pessoal: layout responsivo, sessões bem organizadas (sobre, projetos e certificados), temas de cor e interações com JavaScript.",
    "section.certs.title": "Certificados",
    "section.certs.sub": "Sessão dedicada apenas a certificados.",
    "certs.section.aria": "Certificados",
    "aria.year": "Ano",
    "certs.uane.title": "Fábrica de Programadores",
    "certs.uane.meta": "UANE · Programação em blocos",
    "certs.uane.alt": "Certificado: UANE · Fábrica de Programadores",
    "certs.uane.caption": "UANE · Fábrica de Programadores",
    "certs.huaweiCloud.title": "HCCDA - Tech Essentials (Cloud)",
    "certs.huaweiCloud.meta": "Huawei ICT Academy · 21/02/2026",
    "certs.huaweiCloud.alt": "Certificado: Huawei ICT Academy · HCCDA - Tech Essentials (Cloud)",
    "certs.huaweiCloud.caption": "Huawei ICT Academy · HCCDA - Tech Essentials (Cloud)",
    "certs.huaweiNetworks.title": "HCCDA - Tech Essentials (Redes)",
    "certs.huaweiNetworks.meta": "Huawei · Certificado de redes",
    "certs.huaweiNetworks.alt": "Certificado: Huawei · Redes de computadores",
    "certs.huaweiNetworks.caption": "Huawei · Redes de computadores",
    "certs.aluraIa.title": "Imersão Front-end com IA",
    "certs.aluraIa.meta": "Alura · 08/04/2026",
    "certs.aluraIa.alt": "Certificado: Alura · Imersão Front-end com IA",
    "certs.aluraIa.caption": "Alura · Imersão Front-end com IA",
    "certs.clm.title": "Certificado de Inglês",
    "certs.clm.meta": "CLM · 17/03/2026",
    "certs.clm.alt": "Certificado: CLM · Inglês",
    "certs.clm.caption": "CLM · Certificado de Inglês",
    "section.contact.title": "Contato",
    "section.contact.sub": "Vamos conversar sobre oportunidades e projetos.",
    "contact.section.aria": "Contato",
    "footer.top": "Voltar ao topo",
    "footer.aria": "Rodapé",
    "toast.ok": "Tudo certo",
    "toast.close": "Fechar",
    "toast.closeAria": "Fechar",
    "toast.copy.ok.title": "Copiado",
    "toast.copy.ok.msg": "E-mail copiado para a área de transferência.",
    "toast.copy.fail.title": "Não copiado",
    "toast.copy.fail.msg": "Não foi possível copiar.",
    "toast.copy.error.title": "Erro",
    "toast.copy.error.msg": "Não foi possível copiar o e-mail.",
    "toast.form.name.title": "Faltou o nome",
    "toast.form.name.msg": "Digite seu nome para enviar a mensagem.",
    "toast.form.email.title": "E-mail inválido",
    "toast.form.email.msg": "Digite um e-mail válido para receber a cópia.",
    "toast.form.subject.title": "Faltou o assunto",
    "toast.form.subject.msg": "Digite um assunto para a mensagem.",
    "toast.form.message.title": "Faltou a mensagem",
    "toast.form.message.msg": "Escreva sua mensagem antes de enviar.",
    "toast.gmail.title": "Abrindo Gmail",
    "toast.gmail.msg": "Finalize o envio no Gmail. A mensagem vai para mim e com cópia para você.",
    "lightbox.aria": "Visualizar imagem",
    "lightbox.close": "Fechar",
    "lightbox.closeAria": "Fechar imagem",
    "contact.channels.title": "Canais",
    "contact.channels.email": "E-mail",
    "contact.avail.title": "Disponibilidade",
    "contact.avail.lead": "Aberta a estágios, projetos e oportunidades para aprender e contribuir.",
    "contact.form.name": "Seu nome",
    "contact.form.email": "Seu e-mail",
    "contact.form.subject": "Assunto",
    "contact.form.subjectPh": "Ex.: Estágio em TI",
    "contact.form.message": "Mensagem",
    "contact.form.messagePh": "Conte um pouco sobre a vaga/projeto e como posso ajudar.",
    "contact.form.hint": "Ao enviar, o Gmail abre com a mensagem pronta (para mim e com cópia para você).",
    "contact.form.send": "Enviar mensagem",
    "contact.form.reset": "Limpar",
    "contact.form.noscript": "Ative o JavaScript para enviar pelo formulário, ou use o e-mail nos canais ao lado.",
  },
  en: {
    "meta.title": "Portfolio · IT Student",
    "meta.desc": "Responsive portfolio: about, skills, projects and certificates.",
    skip: "Skip to content",
    "boot.label": "NEXUS // ACCESS",
    "boot.kicker": "Portfolio",
    "boot.enter": "Start",
    "boot.bypass": "Skip intro",
    "boot.hint": "Click or press Enter",
    "boot.aria": "Portfolio opening",
    "brand.sub": "IT Student · Front-end/Back-end Dev",
    "idcard.role": "IT Student",
    "topbar.aria": "Top bar",
    "brand.aria": "Go to home",
    "nav.aria": "Main navigation",
    "hero.aria": "Hero",
    "nav.menu": "Menu",
    "nav.about": "About",
    "nav.skills": "Skills",
    "nav.learning": "Learning",
    "nav.projects": "Projects",
    "nav.certs": "Certificates",
    "nav.contact": "Contact",
    "hero.pill1": "Technical High School (3rd year)",
    "hero.pill2": "Starting in IT",
    "hero.pill3": "Open to internships",
    "hero.title": "I build clear, efficient solutions with impact.",
    "hero.lead":
      "Interested in software development, artificial intelligence and databases — always trying to understand the “why” behind each solution.",
    "hero.ctaProjects": "View projects",
    "hero.ctaContact": "Contact me",
    "theme.label": "Colors",
    "theme.aria": "Color and language options",
    "theme.palette.aria": "Color palette",
    "theme.swatch.blue": "Blue theme",
    "theme.swatch.purple": "Purple theme",
    "theme.swatch.black": "Black theme",
    "lang.aria": "Language",
    "hero.card.ctaCerts": "View certificates",
    "hero.card.copyEmail": "Copy email",
    "hero.card.aria": "Quick summary",
    "hero.facts.aria": "Highlights",
    "profile.alt": "Photo of Yasmim Oliveira Queiros",
    "hero.card.role": "Role",
    "hero.card.roleValue": "Front-end & Back-end",
    "hero.card.focus": "Focus",
    "hero.card.focusValue": "Software · AI · Data",
    "about.title": "About me",
    "about.section.aria": "About me",
    "about.card.aria": "About me",
    "about.kv.aria": "Quick info",
    "about.stats.aria": "Quick highlights",
    "about.kv.name": "Name",
    "about.kv.course": "Course",
    "about.kv.courseValue": "Technical High School (IT)",
    "about.kv.role": "Role",
    "about.kv.roleValue": "Front-end & Back-end Dev",
    "about.kv.focus": "Focus",
    "about.kv.focusValue": "Software · AI · Data",
    "about.kv.goal": "Goal",
    "about.kv.goalValue": "IT internship · Full‑stack development",
    "about.kv.langs": "Languages",
    "about.kv.langsValue": "Portuguese (Native) · English (intermediate — improving)",
    "about.p1":
      "I’m a 3rd‑year technical high school student in IT, passionate about technology and the impact it can have on people’s lives. I’m especially interested in software development, artificial intelligence and databases, constantly improving my technical and analytical skills.",
    "about.p2":
      "Throughout my training, I’ve been building practical projects involving programming logic, data modeling and application development — always focusing on organization, clarity and efficiency. I learn new technologies quickly and like to understand not only “how”, but mainly “why” solutions work.",
    "about.p3":
      "My goal is to enter the IT field and contribute with innovative solutions, while continuing to grow professionally and academically in computing.",
    "about.stats.year": "Technical year",
    "about.stats.projects": "Featured projects",
    "about.stats.certs": "Certificates",
    "about.stats.role": "Role",
    "about.stats.roleValue": "Front + Back",
    "section.about.title": "About",
    "section.about.sub": "Who I am and how I think.",
    "section.stack.title": "Technologies",
    "section.stack.sub": "Tools I use day to day (hover to highlight).",
    "stack.section.aria": "Technologies and tools",
    "stack.ticker.aria": "Featured technologies and tools",
    "section.skills.title": "Skills",
    "section.skills.sub": "What I use to deliver value.",
    "skills.section.aria": "Skills",
    "skills.dev.title": "Development",
    "skills.dev.i1": "Data structures and programming logic",
    "skills.dev.i2": "API building and front/back integration",
    "skills.dev.i3": "Responsive and accessible interfaces",
    "skills.data.title": "Data",
    "skills.data.i1": "Relational modeling and SQL queries (PostgreSQL)",
    "skills.data.i2": "Data organization and consistency",
    "skills.data.i3": "Version control best practices",
    "skills.ai.title": "AI & productivity",
    "skills.ai.i1": "Using LLMs for studying and prototyping",
    "skills.ai.i2": "Task automation, documentation and Office tools",
    "skills.ai.i3": "Clear communication and outcome focus",
    "section.learning.title": "Learning",
    "section.learning.sub": "What I’m studying now and where I want to grow.",
    "learning.section.aria": "Learning",
    "learning.title": "Goals & growth",
    "learning.lead": "A simple roadmap: what I’ll start later, what’s in progress, and what’s already completed.",
    "learning.future.title": "Future",
    "learning.future.badge": "Not started yet",
    "learning.started.title": "In progress",
    "learning.started.badge": "Ongoing",
    "learning.done.title": "Done",
    "learning.done.badge": "Completed",
    "learning.tag.future": "Future",
    "learning.tag.started": "In progress",
    "learning.tag.done": "Done",
    "learning.future.react": "Components, hooks, and API consumption.",
    "learning.future.sql": "Advanced queries, performance, and modeling.",
    "learning.future.python": "Strong fundamentals and practical projects.",
    "learning.started.data": "Applied study and productivity with AI.",
    "learning.started.java": "OOP, organization, and best practices.",
    "learning.started.db": "Improving database theory and practice.",
    "learning.started.en": "Technical reading and conversation.",
    "learning.done.cloud": "Fundamentals and certification.",
    "learning.done.networks": "Core concepts and networking fundamentals.",
    "learning.note": "Follow my progress on GitHub and through my projects.",
    "section.projects.title": "Projects",
    "section.projects.sub": "A selection to show hands-on practice and growth.",
    "section.projects.more": "See more",
    "projects.section.aria": "Projects",
    "projects.filters.aria": "Filter projects",
    "projects.tags.aria": "Technologies",
    "projects.filter.all": "All",
    "projects.repo": "Repository",
    "projects.web": "View on web",
    "projects.p1.repoAria": "Open PaginaLogin repository on GitHub",
    "projects.p1.webAria": "Open PaginaLogin on the web",
    "projects.p1.title": "PaginaLogin · Login & sign-up",
    "projects.p1.desc": "Login and sign-up page focused on a clear interface and front-end organization.",
    "projects.p2.repoAria": "Open this portfolio repository on GitHub",
    "projects.p2.title": "My Portfolio",
    "projects.p2.desc":
      "My personal portfolio: responsive layout, well-organized sections (about, projects and certificates), color themes, and JavaScript interactions.",
    "section.certs.title": "Certificates",
    "section.certs.sub": "A section dedicated to certificates.",
    "certs.section.aria": "Certificates",
    "aria.year": "Year",
    "certs.uane.title": "Programmers Factory",
    "certs.uane.meta": "UANE · Block-based programming",
    "certs.uane.alt": "Certificate: UANE · Programmers Factory",
    "certs.uane.caption": "UANE · Programmers Factory",
    "certs.huaweiCloud.title": "HCCDA - Tech Essentials (Cloud)",
    "certs.huaweiCloud.meta": "Huawei ICT Academy · 2026-02-21",
    "certs.huaweiCloud.alt": "Certificate: Huawei ICT Academy · HCCDA - Tech Essentials (Cloud)",
    "certs.huaweiCloud.caption": "Huawei ICT Academy · HCCDA - Tech Essentials (Cloud)",
    "certs.huaweiNetworks.title": "HCCDA - Tech Essentials (Networks)",
    "certs.huaweiNetworks.meta": "Huawei · Networking certificate",
    "certs.huaweiNetworks.alt": "Certificate: Huawei · Computer networks",
    "certs.huaweiNetworks.caption": "Huawei · Computer networks",
    "certs.aluraIa.title": "Front-end Immersion with AI",
    "certs.aluraIa.meta": "Alura · 2026-04-08",
    "certs.aluraIa.alt": "Certificate: Alura · Front-end Immersion with AI",
    "certs.aluraIa.caption": "Alura · Front-end Immersion with AI",
    "certs.clm.title": "English Certificate",
    "certs.clm.meta": "CLM · 2026-03-17",
    "certs.clm.alt": "Certificate: CLM · English",
    "certs.clm.caption": "CLM · English certificate",
    "section.contact.title": "Contact",
    "section.contact.sub": "Let’s talk about opportunities and projects.",
    "contact.section.aria": "Contact",
    "footer.top": "Back to top",
    "footer.aria": "Footer",
    "toast.ok": "All set",
    "toast.close": "Close",
    "toast.closeAria": "Close",
    "toast.copy.ok.title": "Copied",
    "toast.copy.ok.msg": "Email copied to the clipboard.",
    "toast.copy.fail.title": "Not copied",
    "toast.copy.fail.msg": "Couldn’t copy.",
    "toast.copy.error.title": "Error",
    "toast.copy.error.msg": "Couldn’t copy the email.",
    "toast.form.name.title": "Name required",
    "toast.form.name.msg": "Type your name to send the message.",
    "toast.form.email.title": "Invalid email",
    "toast.form.email.msg": "Type a valid email to receive a copy.",
    "toast.form.subject.title": "Subject required",
    "toast.form.subject.msg": "Type a subject for the message.",
    "toast.form.message.title": "Message required",
    "toast.form.message.msg": "Write a message before sending.",
    "toast.gmail.title": "Opening Gmail",
    "toast.gmail.msg": "Finish sending in Gmail. It will go to me and be CC’d to you.",
    "lightbox.aria": "View image",
    "lightbox.close": "Close",
    "lightbox.closeAria": "Close image",
    "contact.channels.title": "Channels",
    "contact.channels.email": "Email",
    "contact.avail.title": "Availability",
    "contact.avail.lead": "Open to internships, projects, and opportunities to learn and contribute.",
    "contact.form.name": "Your name",
    "contact.form.email": "Your email",
    "contact.form.subject": "Subject",
    "contact.form.subjectPh": "e.g., Internship opportunity",
    "contact.form.message": "Message",
    "contact.form.messagePh": "Tell me about the role/project and how I can help.",
    "contact.form.hint": "When you submit, Gmail opens with the message ready (to me and CC’d to you).",
    "contact.form.send": "Send message",
    "contact.form.reset": "Clear",
    "contact.form.noscript": "Enable JavaScript to send via the form, or use the email in the channels next to it.",
  },
};

function t(key, lang) {
  const safeLang = LANGS.has(lang) ? lang : "pt";
  return (I18N[safeLang] && I18N[safeLang][key]) || (I18N.pt && I18N.pt[key]) || "";
}

function getCurrentLang() {
  const v = String(document.documentElement.getAttribute("data-lang") || "").trim();
  return LANGS.has(v) ? v : "pt";
}

function toastI18n(titleKey, msgKey) {
  const lang = getCurrentLang();
  toast(t(titleKey, lang) || titleKey, t(msgKey, lang) || msgKey);
}

function applyI18n(lang) {
  const safeLang = LANGS.has(lang) ? lang : "pt";
  const html = document.documentElement;
  html.setAttribute("data-lang", safeLang);
  html.setAttribute("lang", safeLang === "en" ? "en" : "pt-BR");

  qsa("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const value = t(key, safeLang);
    if (value) el.textContent = value;
  });

  qsa("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    const value = t(key, safeLang);
    if (!value) return;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.placeholder = value;
    else el.setAttribute("placeholder", value);
  });

  qsa("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (!key) return;
    const value = t(key, safeLang);
    if (value) el.setAttribute("aria-label", value);
  });

  qsa("[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    if (!key) return;
    const value = t(key, safeLang);
    if (value) el.setAttribute("alt", value);
  });

  qsa("[data-i18n-caption]").forEach((el) => {
    const key = el.getAttribute("data-i18n-caption");
    if (!key) return;
    const value = t(key, safeLang);
    if (value) el.setAttribute("data-caption", value);
  });

  // Title & meta description
  const title = t("meta.title", safeLang);
  if (title) document.title = title;
  const metaDesc = qs('meta[name="description"]');
  const desc = t("meta.desc", safeLang);
  if (metaDesc && desc) metaDesc.setAttribute("content", desc);

  // Update language buttons state
  qsa(".lang__btn[data-lang]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === safeLang));
  });

  applyProjectsI18n(safeLang);
}

function setLang(lang) {
  const safe = String(lang || "").trim();
  if (!safe || !LANGS.has(safe)) return;
  try {
    window.localStorage.setItem("portfolio-lang", safe);
  } catch {
    // ignore
  }
  applyI18n(safe);
}

function restoreLang() {
  let lang = "";
  try {
    lang = String(window.localStorage.getItem("portfolio-lang") || "").trim();
  } catch {
    // ignore
  }

  if (!LANGS.has(lang)) {
    const nav = String((navigator && navigator.language) || "").toLowerCase();
    lang = nav.startsWith("en") ? "en" : "pt";
  }
  applyI18n(lang);
}

function bindLang() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang__btn[data-lang]");
    if (!btn) return;
    setLang(btn.getAttribute("data-lang"));
  });
}

function getProjectLiveUrl(repo) {
  const byOverride = PROJECT_LIVE_OVERRIDES[repo.name];
  if (byOverride) return byOverride;

  const homepage = String(repo.homepage || "").trim();
  if (homepage) return homepage.startsWith("http") ? homepage : `https://${homepage}`;

  if (repo.has_pages) return `https://${GITHUB_USER}.github.io/${repo.name}/`;
  return "";
}

function getProjectText(repo, lang) {
  const o = PROJECT_I18N_OVERRIDES[repo.name];
  const title = (o && o.title && o.title[lang]) || repo.name;
  const desc = (o && o.desc && o.desc[lang]) || String(repo.description || "").trim();
  const tags = (o && o.tags) || (repo.language ? [repo.language] : []);
  return { title, desc, tags };
}

function applyProjectsI18n(lang) {
  const grid = qs("[data-projects-grid]");
  if (!grid) return;

  qsa(".project[data-repo]", grid).forEach((card) => {
    const title = card.getAttribute(lang === "en" ? "data-title-en" : "data-title-pt") || "";
    const desc = card.getAttribute(lang === "en" ? "data-desc-en" : "data-desc-pt") || "";
    const titleEl = qs(".card__title", card);
    const descEl = qs(".muted", card);
    if (titleEl && title) titleEl.textContent = title;
    if (descEl && desc) descEl.textContent = desc;

    qsa("[data-role='repo']", card).forEach((el) => (el.textContent = t("projects.repo", lang) || "Repository"));
    qsa("[data-role='web']", card).forEach((el) => (el.textContent = t("projects.web", lang) || "View on web"));
  });
}

async function fetchGithubRepos() {
  // small cache to avoid rate limits on refresh
  try {
    const raw = window.localStorage.getItem("github-repos-cache");
    if (raw) {
      const parsed = JSON.parse(raw);
      const ts = Number(parsed && parsed.ts);
      const repos = parsed && parsed.repos;
      if (ts && Array.isArray(repos) && Date.now() - ts < 10 * 60 * 1000) return repos;
    }
  } catch {
    // ignore cache errors
  }

  const url = `https://api.github.com/users/${encodeURIComponent(GITHUB_USER)}/repos?per_page=100&sort=updated`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  try {
    if (Array.isArray(data)) window.localStorage.setItem("github-repos-cache", JSON.stringify({ ts: Date.now(), repos: data }));
  } catch {
    // ignore
  }
  return data;
}

function renderProjectsFromRepos(repos) {
  const grid = qs("[data-projects-grid]");
  if (!grid) return;

  const lang = getCurrentLang();

  const clean = repos.filter((r) => r && !r.fork && !r.archived);
  const byName = new Map(clean.map((r) => [r.name, r]));
  const chosen = [];

  for (const name of FEATURED_REPOS) {
    const r = byName.get(name);
    if (r) chosen.push(r);
  }

  const sorted = [...clean].sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
  for (const r of sorted) {
    if (chosen.length >= 6) break;
    if (chosen.some((x) => x.name === r.name)) continue;
    chosen.push(r);
  }

  if (!chosen.length) return;

  grid.innerHTML = "";

  for (const repo of chosen) {
    const textPt = getProjectText(repo, "pt");
    const textEn = getProjectText(repo, "en");
    const liveUrl = getProjectLiveUrl(repo);

    const card = document.createElement("article");
    card.className = "card project";
    card.setAttribute("data-repo", repo.name);
    card.setAttribute("data-kind", "all");
    card.setAttribute("data-title-pt", textPt.title);
    card.setAttribute("data-title-en", textEn.title);
    card.setAttribute("data-desc-pt", textPt.desc);
    card.setAttribute("data-desc-en", textEn.desc);

    const top = document.createElement("div");
    top.className = "project__top";

    const h3 = document.createElement("h3");
    h3.className = "card__title";

    const tagsWrap = document.createElement("div");
    tagsWrap.className = "tags";
    tagsWrap.setAttribute("aria-label", "Tecnologias");
    tagsWrap.setAttribute("data-i18n-aria", "projects.tags.aria");

    const tags = (lang === "en" ? textEn.tags : textPt.tags).slice(0, 4);
    for (const tag of tags) {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tag;
      tagsWrap.appendChild(span);
    }

    top.appendChild(h3);
    top.appendChild(tagsWrap);

    const p = document.createElement("p");
    p.className = "muted";

    const links = document.createElement("div");
    links.className = "project__links";

    const repoA = document.createElement("a");
    repoA.className = "linkbtn";
    repoA.href = repo.html_url;
    repoA.setAttribute("data-role", "repo");
    repoA.setAttribute("aria-label", lang === "en" ? `Open ${repo.name} repository on GitHub` : `Abrir repositório ${repo.name} no GitHub`);

    links.appendChild(repoA);

    if (liveUrl) {
      const webA = document.createElement("a");
      webA.className = "linkbtn";
      webA.href = liveUrl;
      webA.target = "_blank";
      webA.rel = "noopener noreferrer";
      webA.setAttribute("data-role", "web");
      webA.setAttribute("aria-label", lang === "en" ? `Open ${repo.name} on the web` : `Abrir ${repo.name} na web`);
      links.appendChild(webA);
    }

    card.appendChild(top);
    card.appendChild(p);
    card.appendChild(links);

    grid.appendChild(card);
  }

  // Apply i18n for the current language after render
  applyProjectsI18n(lang);
  // Apply aria translations for newly created elements
  applyI18n(lang);
  updateProjectCount();
}

async function updateProjectsFromGithub() {
  const grid = qs("[data-projects-grid]");
  if (!grid) return;

  try {
    const repos = await fetchGithubRepos();
    renderProjectsFromRepos(Array.isArray(repos) ? repos : []);
  } catch {
    // keep static HTML fallback
  }
}

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
      if (ok) toastI18n("toast.copy.ok.title", "toast.copy.ok.msg");
      else toastI18n("toast.copy.fail.title", "toast.copy.fail.msg");
    } catch {
      toastI18n("toast.copy.error.title", "toast.copy.error.msg");
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

function runBootgate() {
  const root = qs("#bootgate");
  if (!root) return;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    root.remove();
    return;
  }

  const enterBtn = qs("#bootEnter");
  const bypassBtn = qs("#bootBypass");
  const canvas = qs("#bootFx");

  const DURATION_MS = 5600;

  let done = false;
  let start = 0;
  let lastT = 0;
  let raf = 0;
  let timer = 0;
  let resizeTimer = 0;
  let ctx = null;
  let stars = [];
  let streaks = [];
  let bands = [];

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

    const area = Math.max(1, rect.width * rect.height);
    const count = Math.round(Math.min(240, Math.max(120, area / 8000)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.4 + Math.random() * 1.4,
      a: 0.18 + Math.random() * 0.55,
      v: 6 + Math.random() * 26,
      tw: Math.random() * Math.PI * 2,
      tws: 0.7 + Math.random() * 1.8,
    }));

    bands = Array.from({ length: 4 }, (_, i) => ({
      phase: Math.random() * Math.PI * 2,
      amp: 0.10 + i * 0.05 + Math.random() * 0.04,
      freq: 0.006 + Math.random() * 0.006,
      freq2: 0.016 + Math.random() * 0.010,
      speed: 0.32 + Math.random() * 0.28,
      drift: (Math.random() - 0.5) * 0.08,
      alpha: 0.22 + i * 0.06,
      width: 0.024 + i * 0.012,
    }));

    streaks = [];
    lastT = 0;

    return true;
  };

  const draw = (t) => {
    if (done || !ctx || !(canvas instanceof HTMLCanvasElement)) return;
    if (!start) start = t;

    const elapsed = (t - start) / 1000;
    const dt = Math.min(0.033, Math.max(0.001, lastT ? (t - lastT) / 1000 : 0.016));
    lastT = t;

    const c = canvas;
    const w = c.width;
    const h = c.height;
    const cx = w * 0.5;
    const cy = h * 0.52;
    const m = Math.min(w, h);

    const accent = getColor("--accent", "#3b82f6");
    const accent2 = getColor("--accent2", "#38bdf8");

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Aurora ribbons (cinematic, non-HUD)
    const baseAmp = m * 0.10;
    for (let i = 0; i < bands.length; i++) {
      const b = bands[i];
      const amp = baseAmp * b.amp;
      const width = Math.max(10, m * b.width);
      const y0 = cy + (i - 1.5) * m * 0.05 + Math.sin(elapsed * 0.22 + b.phase) * m * 0.03;

      const g = ctx.createLinearGradient(0, y0 - width, 0, y0 + width);
      g.addColorStop(0, "rgba(168,85,247,0)");
      g.addColorStop(0.25, `rgba(168,85,247,${0.10 + b.alpha * 0.55})`);
      g.addColorStop(0.55, `rgba(34,211,238,${0.06 + b.alpha * 0.35})`);
      g.addColorStop(1, "rgba(34,211,238,0)");

      ctx.strokeStyle = g;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.75;
      ctx.shadowColor = "rgba(168,85,247,0.28)";
      ctx.shadowBlur = Math.max(12, width * 0.55);

      ctx.beginPath();
      const step = Math.max(10, Math.round(w / 70));
      for (let x = -step; x <= w + step; x += step) {
        const n1 = Math.sin(x * b.freq + elapsed * b.speed + b.phase);
        const n2 = Math.sin(x * b.freq2 - elapsed * (b.speed * 1.18) + b.phase * 1.7);
        const drift = Math.sin(elapsed * 0.15 + b.phase) * m * b.drift;
        const y = y0 + drift + (n1 * 0.65 + n2 * 0.35) * amp;
        if (x <= 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // Stars
    ctx.globalCompositeOperation = "screen";
    for (const s of stars) {
      s.y += s.v * dt * (m / 700);
      if (s.y > h + 40) {
        s.y = -40;
        s.x = Math.random() * w;
        s.v = 6 + Math.random() * 26;
        s.r = 0.4 + Math.random() * 1.4;
        s.a = 0.18 + Math.random() * 0.55;
      }

      const tw = 0.62 + 0.38 * (Math.sin(elapsed * s.tws + s.tw) * 0.5 + 0.5);
      ctx.fillStyle = `rgba(255,255,255,${s.a * tw})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (0.85 + tw * 0.35), 0, Math.PI * 2);
      ctx.fill();
    }

    // Occasional shooting streaks
    if (streaks.length < 5 && Math.random() < 0.045) {
      const fromLeft = Math.random() < 0.5;
      streaks.push({
        x: fromLeft ? -60 : w + 60,
        y: Math.random() * h * 0.55,
        vx: fromLeft ? (420 + Math.random() * 520) : -(420 + Math.random() * 520),
        vy: 140 + Math.random() * 220,
        life: 0,
        max: 0.5 + Math.random() * 0.45,
      });
    }

    for (let i = streaks.length - 1; i >= 0; i--) {
      const st = streaks[i];
      st.life += dt;
      st.x += st.vx * dt;
      st.y += st.vy * dt;
      const k = 1 - Math.min(1, st.life / st.max);
      if (k <= 0) {
        streaks.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = 0.28 * k;
      ctx.lineWidth = 2.2;
      const len = 80 + 120 * k;
      const a = Math.atan2(st.vy, st.vx);
      const x1 = st.x - Math.cos(a) * len;
      const y1 = st.y - Math.sin(a) * len;
      const grad = ctx.createLinearGradient(x1, y1, st.x, st.y);
      grad.addColorStop(0, "rgba(168,85,247,0)");
      grad.addColorStop(0.5, accent2);
      grad.addColorStop(1, "rgba(255,255,255,0.85)");
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(st.x, st.y);
      ctx.stroke();
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

    root.setAttribute("data-phase", "leave");
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
    const btn = e.target.closest("#bootEnter, #bootBypass");
    if (btn) return;
    finish();
  });

  if (enterBtn) enterBtn.addEventListener("click", finish);
  if (bypassBtn) bypassBtn.addEventListener("click", finish);

  setPageScrollLocked(true);
  document.addEventListener("keydown", onKeydown, true);
  window.addEventListener("resize", onResize);

  if (setupCanvas()) raf = window.requestAnimationFrame(draw);

  window.requestAnimationFrame(() => {
    if (root.getAttribute("data-phase") !== "show") root.setAttribute("data-phase", "show");
    if (enterBtn) enterBtn.focus();
  });

  timer = window.setTimeout(finish, DURATION_MS);
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
      toastI18n("toast.form.name.title", "toast.form.name.msg");
      nameEl.focus();
      return;
    }
    if (!email || !email.includes("@")) {
      toastI18n("toast.form.email.title", "toast.form.email.msg");
      emailEl.focus();
      return;
    }
    if (!subject) {
      toastI18n("toast.form.subject.title", "toast.form.subject.msg");
      subjectEl.focus();
      return;
    }
    if (!message) {
      toastI18n("toast.form.message.title", "toast.form.message.msg");
      messageEl.focus();
      return;
    }

    const to = "yasmim.oliveiraqueiros@gmail.com";
    const body = `Nome: ${name}\nE-mail: ${email}\n\nMensagem:\n${message}`;

    const url = buildGmailComposeUrl({ to, cc: email, subject, body });
    const opened = window.open(url, "_blank", "noopener");
    if (!opened) window.location.assign(url);
    toastI18n("toast.gmail.title", "toast.gmail.msg");
  });
}

function setYear() {
  const year = qs("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function updateCertCount() {
  const count = qsa("#certificados .certcard").length;
  qsa('[data-count="certs"]').forEach((el) => {
    el.textContent = String(count);
  });
}

function updateProjectCount() {
  const count = qsa("#projetos .project").length;
  qsa('[data-count="projects"]').forEach((el) => {
    el.textContent = String(count);
  });
}

function main() {
  restoreTheme();
  restoreLang();
  updateCertCount();
  updateProjectCount();
  updateProjectsFromGithub();
  runBootgate();
  bindTheme();
  bindLang();
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
