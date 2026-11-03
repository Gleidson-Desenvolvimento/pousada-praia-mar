/* =====================================================================
   POUSADA PRAIA MAR — Interações do site
   ===================================================================== */
(function () {
  "use strict";
  const C = window.PM_CONFIG;
  const P = C.pousada;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const waLink = (t) => `https://wa.me/${P.whatsapp}?text=${encodeURIComponent(t)}`;
  const localKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  /* ---------------- toast ---------------- */
  let toastT;
  window.PM_toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 3200);
  };

  /* ---------------- nav ---------------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const burger = $("#burger");
  const mobile = $("#mobileMenu");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", open);
    mobile.classList.toggle("open", open);
    nav.classList.toggle("menu-open", open);
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", mobile).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------------- vídeo do hero ---------------- */
  const video = $("#heroVideo");
  const caption = $("#heroCaption");
  const captions = [
    // sincronizadas com assets/video/caraiva-loop.mp4 (38 s)
    [0, "onde o rio encontra o mar"],
    [4, "a vila à beira do rio"],
    [7, "a chegada é de canoa"],
    [10.5, "as malas vão de carroça"],
    [14, "aqui se anda descalço"],
    [17, "sorria, você está em Caraíva"],
    [18.6, "o rio de águas calmas"],
    [21, "ruas de areia, sem carros"],
    [24, "casinhas coloridas"],
    [27.6, "barqueiros da vila"],
    [31, "peixe fresco na brasa"],
    [34, "onde o rio encontra o mar"],
  ];
  let capIdx = 0;
  video.addEventListener("timeupdate", () => {
    let i = 0;
    captions.forEach(([t], j) => { if (video.currentTime >= t) i = j; });
    if (i !== capIdx) {
      capIdx = i;
      caption.classList.add("swap");
      setTimeout(() => { caption.textContent = captions[i][1]; caption.classList.remove("swap"); }, 400);
    }
  });
  const toggle = $("#videoToggle");
  const icon = $("#videoToggleIcon");
  const setPaused = (p) => {
    p ? video.pause() : video.play().catch(() => {});
    icon.setAttribute("d", p ? "M8 5v14l11-7z" : "M7 5h3v14H7zM14 5h3v14h-3z");
    toggle.setAttribute("aria-label", p ? "Reproduzir vídeo" : "Pausar vídeo");
  };
  toggle.addEventListener("click", () => setPaused(!video.paused));
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  // economiza bateria: pausa quando o hero sai da tela
  new IntersectionObserver(([e]) => {
    if (toggle.getAttribute("aria-label") === "Reproduzir vídeo") return;
    e.isIntersecting ? video.play().catch(() => {}) : video.pause();
  }).observe(video);

  /* ---------------- busca rápida ---------------- */
  const qbIn = $("#qbIn"), qbOut = $("#qbOut"), qbGuests = $("#qbGuests"), qbHint = $("#qbHint");
  const todayK = localKey(new Date());
  qbIn.min = todayK;
  qbOut.min = todayK;
  qbIn.addEventListener("change", () => {
    if (!qbIn.value) return;
    const next = new Date(qbIn.value + "T12:00");
    next.setDate(next.getDate() + 1);
    qbOut.min = localKey(next);
    if (!qbOut.value || qbOut.value <= qbIn.value) {
      next.setDate(next.getDate() + 1);
      qbOut.value = localKey(next);
    }
    qbHint.textContent = "";
  });
  $("[data-stepper]").addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (!b) return;
    qbGuests.value = qbGuests.textContent = Math.min(Math.max(...C.quartos.map((q) => q.capacidade)), Math.max(1, +qbGuests.textContent + +b.dataset.step));
  });
  $("#quickbook").addEventListener("submit", (e) => {
    e.preventDefault();
    const adultos = +qbGuests.textContent;
    if (qbIn.value && qbOut.value) {
      const err = window.PMBooking.validateRange(qbIn.value, qbOut.value);
      if (err) { qbHint.innerHTML = err; return; }
      window.PMBooking.open({ checkin: qbIn.value, checkout: qbOut.value, adultos });
    } else {
      window.PMBooking.open({ adultos });
    }
  });

  /* ---------------- abrir reserva (qualquer botão) ---------------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open-booking]");
    if (b) { e.preventDefault(); setMenu(false); window.PMBooking.open({ quartoId: b.dataset.room }); }
  });

  /* ---------------- quartos ---------------- */
  $("#roomsGrid").innerHTML = C.quartos.map((q) => `
    <article class="room-card reveal">
      <div class="room-card__img">
        <img src="${q.img}" alt="${esc(q.nome)}" loading="lazy" />
        ${q.tag ? `<span class="tag">${esc(q.tag)}</span>` : ""}
      </div>
      <div class="room-card__body">
        <div class="room-card__top">
          <h3>${esc(q.nome)}</h3>
          <span class="price">${brl(q.preco)}<small> por pessoa/noite</small></span>
        </div>
        <p>${esc(q.resumo)}</p>
        <div class="chips">
          <span class="chip">👥 até ${q.capacidade}</span>
          ${q.camas ? `<span class="chip">🛏️ ${esc(q.camas)}</span>` : ""}
          ${q.vista ? `<span class="chip">🌿 vista ${esc(q.vista.toLowerCase())}</span>` : ""}
        </div>
        <div class="room-card__actions">
          <button class="btn btn--line" data-room-details="${q.id}">Detalhes</button>
          <button class="btn btn--anil" data-open-booking data-room="${q.id}">Reservar</button>
        </div>
      </div>
    </article>`).join("");

  /* ---------------- modais genéricos ---------------- */
  let lastFocus = null;
  function openModal(el) {
    lastFocus = document.activeElement;
    el.hidden = false;
    document.body.classList.add("lock");
    setTimeout(() => $(".modal__close, [data-close]", el)?.focus(), 30);
  }
  function closeModal(el) {
    el.hidden = true;
    if (!$$(".modal, .lightbox").some((m) => !m.hidden)) document.body.classList.remove("lock");
    lastFocus?.focus?.();
  }
  $$("#roomModal, #policyModal").forEach((m) => m.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(m); }));

  // detalhes do quarto
  const roomModal = $("#roomModal");
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-room-details]");
    if (!b) return;
    const q = C.quartos.find((x) => x.id === b.dataset.roomDetails);
    $("#roomModalBody").innerHTML = `
      <div class="room-modal">
        <div class="room-modal__gallery">
          <img id="rmMain" src="${q.galeria[0]}" alt="${esc(q.nome)}" />
          <div class="room-modal__thumbs">
            ${q.galeria.map((g, i) => `<button class="${i ? "" : "on"}" data-rm-img="${g}" aria-label="Foto ${i + 1}"><img src="${g}" alt="" /></button>`).join("")}
          </div>
        </div>
        <div class="room-modal__info">
          <p class="eyebrow">${esc(q.tag || "Acomodação")}</p>
          <h3 class="h3" id="roomModalTitle">${esc(q.nome)}</h3>
          <div class="room-modal__facts"><span class="chip">👥 até ${q.capacidade} pessoas</span>${q.camas ? `<span class="chip">🛏️ ${esc(q.camas)}</span>` : ""}${q.vista ? `<span class="chip">🌿 vista ${esc(q.vista.toLowerCase())}</span>` : ""}<span class="chip">☕ café incluso</span></div>
          <p>${esc(q.descricao)}</p>
          <ul class="amen">${q.comodidades.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
          <p class="price" style="font-size:24px">${brl(q.preco)}<small> por pessoa/noite, com café da manhã</small></p>
          <button class="btn btn--coral btn--lg" data-open-booking data-room="${q.id}">Reservar ${esc(q.nome)}</button>
        </div>
      </div>`;
    openModal(roomModal);
  });
  roomModal.addEventListener("click", (e) => {
    const t = e.target.closest("[data-rm-img]");
    if (t) {
      $("#rmMain").src = t.dataset.rmImg;
      $$("[data-rm-img]", roomModal).forEach((x) => x.classList.toggle("on", x === t));
    }
    if (e.target.closest("[data-open-booking]")) closeModal(roomModal);
  });

  // políticas
  const policyModal = $("#policyModal");
  const pct = Math.round(C.sinal * 100);
  $("#policyBody").innerHTML = `
    <h4>Garantia da reserva</h4>
    <p>A reserva é confirmada com o pagamento de ${pct}% do valor total (sinal) via Pix ou cartão. O restante é pago no check-in. Pagando 100% no Pix, você ganha ${Math.round(C.pix.descontoPagamentoTotal * 100)}% de desconto.</p>
    <h4>Cancelamento</h4>
    <ul>
      <li>Até 15 dias antes do check-in: devolução integral do valor pago.</li>
      <li>De 14 a 7 dias antes: devolução de 50% ou crédito integral para nova data em até 12 meses.</li>
      <li>Menos de 7 dias ou não comparecimento: sem devolução.</li>
      <li>Pacotes de Réveillon e Carnaval não são reembolsáveis, mas podem ser transferidos para outra pessoa.</li>
    </ul>
    <h4>Horários</h4>
    <p>Check-in a partir das ${P.checkin} e check-out até as ${P.checkout}. Chegou cedo? Guardamos suas malas e você já pode ir para a praia.</p>
    <h4>Chegada em Caraíva</h4>
    <p>Carros não entram na vila: estacione em Nova Caraíva e atravesse o rio de canoa. Avise o horário previsto e ajudamos com a travessia e a carroça para as malas.</p>
    <h4>Dúvidas</h4>
    <p>Fale com a gente pelo <a href="${waLink("Olá! Tenho uma dúvida sobre as políticas de reserva.")}" target="_blank" rel="noopener">WhatsApp</a> ou pelo e-mail ${esc(P.email)}.</p>`;
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-policy]")) { e.preventDefault(); openModal(policyModal); }
  });

  /* ---------------- galeria / lightbox ---------------- */
  const lb = $("#lightbox");
  const lbImg = $("#lightboxImg");
  let shots = [];
  let lbI = 0;
  const showLb = (i) => { lbI = (i + shots.length) % shots.length; lbImg.src = shots[lbI].src; lbImg.alt = shots[lbI].alt; };

  // abas da galeria (Jardim / Sala de estar / Caraíva) — conteúdo em config.js
  const gal = C.galeria || [];
  const galTabs = $("#galTabs"), galGrid = $("#galGrid"), galText = $("#galText");
  function showGal(id) {
    const g = gal.find((x) => x.id === id) || gal[0];
    $$("button", galTabs).forEach((b) => b.setAttribute("aria-selected", b.dataset.gal === g.id));
    galText.textContent = g.texto || "";
    galGrid.innerHTML = g.fotos.map(([src, alt], i) => `<button class="g-slide" data-lightbox="${i}" aria-label="Ampliar foto ${i + 1} de ${g.fotos.length}: ${esc(alt)}"><img src="${src}" alt="${esc(alt)}" loading="${i < 4 ? "eager" : "lazy"}" /></button>`).join("");
    shots = g.fotos.map(([src, alt]) => ({ src, alt }));
    galGrid.scrollLeft = 0;
    updateGal();
  }
  // carrossel: setas, barra de progresso e contador
  const galPrev = $("#galPrev"), galNext = $("#galNext"), galBar = $("#galBar"), galCount = $("#galCount");
  const slideStep = () => { const s = galGrid.querySelector(".g-slide"); return s ? s.getBoundingClientRect().width + 14 : 300; };
  function updateGal() {
    const max = galGrid.scrollWidth - galGrid.clientWidth;
    const total = shots.length;
    const first = Math.min(total, Math.round(galGrid.scrollLeft / slideStep()) + 1);
    const visible = Math.max(1, Math.floor((galGrid.clientWidth + 14) / slideStep()));
    const last = Math.min(total, first + visible - 1);
    galCount.textContent = total ? (first === last ? `${first} / ${total}` : `${first}–${last} / ${total}`) : "";
    galBar.style.width = max > 0 ? `${Math.max(visible / total, galGrid.scrollLeft / max) * 100}%` : "100%";
    galPrev.disabled = galGrid.scrollLeft <= 4;
    galNext.disabled = galGrid.scrollLeft >= max - 4;
  }
  galPrev.addEventListener("click", () => galGrid.scrollBy({ left: -slideStep(), behavior: "smooth" }));
  galNext.addEventListener("click", () => galGrid.scrollBy({ left: slideStep(), behavior: "smooth" }));
  galGrid.addEventListener("scroll", () => requestAnimationFrame(updateGal), { passive: true });
  galGrid.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); galNext.click(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); galPrev.click(); }
  });
  window.addEventListener("resize", updateGal);
  galTabs.innerHTML = gal.map((g) => `<button type="button" role="tab" data-gal="${g.id}">${esc(g.titulo)} <small>${g.fotos.length}</small></button>`).join("");
  galTabs.addEventListener("click", (e) => { const b = e.target.closest("[data-gal]"); if (b) showGal(b.dataset.gal); });
  if (gal.length) showGal(gal[0].id);
  galGrid.addEventListener("click", (e) => { const b = e.target.closest("[data-lightbox]"); if (b) { showLb(+b.dataset.lightbox); openModal(lb); } });
  $(".lightbox__prev").addEventListener("click", () => showLb(lbI - 1));
  $(".lightbox__next").addEventListener("click", () => showLb(lbI + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.closest("[data-close]")) closeModal(lb); });
  let touchX = null;
  lb.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) showLb(lbI + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------------- avaliações ---------------- */
  const G = C.google || {};
  const gLogo = `<svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
  const stars = (n) => "★★★★★".slice(0, Math.round(n)) + "☆☆☆☆☆".slice(0, 5 - Math.round(n));
  if (G.nota) {
    $("#gScore").innerHTML = `
      <div class="gscore__num">${G.nota.toFixed(1).replace(".", ",")}</div>
      <div>
        <div class="review__stars gscore__stars">${stars(G.nota)}</div>
        <span class="gscore__src">${gLogo} Nota no Google${G.total ? ` · ${G.total} avaliações` : ""}</span>
      </div>
      <div class="gscore__actions">
        <a class="btn btn--sun" href="${esc(G.linkAvaliacoes)}" target="_blank" rel="noopener">Ver avaliações no Google ↗</a>
        ${G.linkAvaliar ? `<a class="btn btn--ghost" href="${esc(G.linkAvaliar)}" target="_blank" rel="noopener">Deixe sua avaliação</a>` : ""}
      </div>`;
  }
  const deps = C.depoimentos || [];
  $("#reviewsGrid").innerHTML = deps.length
    ? deps.map((d) => {
        const ini = d.nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
        return `
          <figure class="review reveal">
            <div class="review__top"><span class="review__stars">${stars(d.estrelas || 5)}</span>${d.fonte === "Google" ? gLogo : d.fonte ? `<small>${esc(d.fonte)}</small>` : ""}</div>
            <blockquote>“${esc(d.texto)}”</blockquote>
            <footer><span class="avatar">${esc(ini)}</span><div><b>${esc(d.nome)}</b><span>${esc(d.quando || d.cidade || "")}</span></div></footer>
          </figure>`;
      }).join("")
    : `
      <figure class="review review--invite reveal">
        <span class="hand">sua história aqui</span>
        <blockquote>“O luxo de acordar sem pressa, com o mar logo ali.”</blockquote>
        <p>Já se hospedou com a gente? Conte como foi a sua estadia em Caraíva — sua avaliação ajuda outros viajantes a encontrar o seu refúgio.</p>
        <a class="btn btn--line-light" href="${esc(G.linkAvaliar || G.linkAvaliacoes || "#")}" target="_blank" rel="noopener">Avaliar no Google ↗</a>
      </figure>`;
  if (!deps.length) $("#reviewsGrid").classList.add("reviews__grid--single");

  /* ---------------- rodapé / contatos / mapa ---------------- */
  $("#year").textContent = new Date().getFullYear();
  $$("[data-wa]").forEach((a) => { a.href = waLink(`Olá! Vim pelo site da ${P.nome} e gostaria de mais informações. 🌊`); a.target = "_blank"; a.rel = "noopener"; });
  $("#footWa").textContent = `WhatsApp ${P.telefoneExibicao}`;
  $("#footMail").href = `mailto:${P.email}`;
  $("#footMail").textContent = P.email;
  if (P.instagram) {
    $("#footInsta").href = `https://instagram.com/${P.instagram}`;
    $("#footInsta").textContent = `@${P.instagram}`;
  } else $("#footInsta").remove();
  $("#footAddr").textContent = P.endereco;
  $("#addrText").textContent = P.endereco;
  if (P.mapaLink) $("#routeBtn").href = P.mapaLink;
  if (P.mapaLat) $("#mapFrame").src = `https://www.google.com/maps?q=${P.mapaLat},${P.mapaLng}&z=17&output=embed`;

  /* ---------------- animação ao rolar ---------------- */
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------------- ESC fecha a camada de cima ---------------- */
  document.addEventListener("keydown", (e) => {
    if (!lb.hidden) {
      if (e.key === "ArrowRight") showLb(lbI + 1);
      if (e.key === "ArrowLeft") showLb(lbI - 1);
    }
    if (e.key !== "Escape") return;
    if (!lb.hidden) return closeModal(lb);
    if (!policyModal.hidden) return closeModal(policyModal);
    if (!roomModal.hidden) return closeModal(roomModal);
    if (window.PMBooking.isOpen()) return window.PMBooking.close();
    if (!$("#chatPanel").hidden) return toggleChat(false);
    setMenu(false);
  });

  /* =====================================================================
     ATENDIMENTO "MARÉ" — respostas sobre a pousada e sobre Caraíva
     ===================================================================== */
  const precos = C.quartos.map((q) => `• ${q.nome}: ${brl(q.preco)} por pessoa/noite (até ${q.capacidade} pessoas)`).join("\n");
  const validade = C.tarifaValidaAte ? new Date(C.tarifaValidaAte + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "";
  const kb = [
    { k: ["oi", "ola", "olá", "bom dia", "boa tarde", "boa noite", "e ai"], r: "Oi! Que bom te ver por aqui 🌊 Quer saber sobre quartos, preços, como chegar em Caraíva ou já quer reservar?" },
    { k: ["quarto", "acomoda", "suite", "suíte", "chale", "chalé", "dossel"], r: `Temos ${C.quartos.length} acomodações, todas com café da manhã incluso:\n${precos}\nQuer ver a disponibilidade para as suas datas?`, a: "booking" },
    { k: ["preco", "preço", "valor", "quanto", "custa", "diaria", "diária", "tarifa"], r: `As diárias são cobradas por pessoa e já incluem o café da manhã:\n${precos}${validade ? `\nEsses valores valem até ${validade}. Para datas depois disso (Réveillon, janeiro…), consulte a gente no WhatsApp.` : ""}`, a: "booking" },
    { k: ["chegar", "chego", "aeroporto", "travessia", "canoa", "estrada", "carro", "estacion", "transfer", "porto seguro", "trancoso", "onibus", "ônibus"], r: "Caraíva fica a cerca de 70 km (≈2h30) do aeroporto de Porto Seguro, com um trecho de estrada de terra. Carros não entram na vila: você estaciona em Nova Caraíva e atravessa o rio de canoa — são poucos minutos. As malas seguem de carroça pelas ruas de areia 🛶\nA pousada fica na Aldeia Xandó, R. Pedro Marcelino, no coração de Caraíva. Oferecemos transfer do aeroporto como extra na reserva.", a: "map" },
    { k: ["endereco", "endereço", "onde fica", "localiza", "mapa", "xando", "xandó"], r: `Estamos na ${P.endereco}, no coração de Caraíva, a poucos passos da praia. Toque abaixo para abrir a rota no Google Maps 📍`, a: "map" },
    { k: ["check", "horario", "horário", "entrada", "saida", "saída"], r: `Check-in a partir das ${P.checkin} e check-out até as ${P.checkout}. Se chegar antes, guardamos suas malas e você já pode curtir a praia.` },
    { k: ["cafe", "café", "manha", "manhã", "refei", "comida", "tapioca"], r: "O café da manhã está incluso e é bem baiano: tapioca, cuscuz, frutas da estação, bolos caseiros, pães, ovos e café passado na hora ☕" },
    { k: ["cancel", "reembolso", "desist", "politica", "política"], r: "Cancelando até 15 dias antes, devolvemos tudo. De 14 a 7 dias, 50% ou crédito integral para outra data. Com menos de 7 dias não há devolução. Réveillon e Carnaval não são reembolsáveis.", a: "policy" },
    { k: ["pix", "pagamento", "pagar", "cartao", "cartão", "parcel", "sinal"], r: `Você garante a reserva com ${Math.round(C.sinal * 100)}% de sinal via Pix (QR Code na hora) ou cartão em até ${C.cartao.parcelasMax}x. Pagando 100% no Pix, ganha ${Math.round(C.pix.descontoPagamentoTotal * 100)}% de desconto. O restante é pago no check-in.` },
    { k: ["dinheiro", "saque", "caixa eletr", "banco", "especie", "espécie"], r: "Na vila as opções de saque são poucas, então vale levar algum dinheiro em espécie — principalmente para a travessia de canoa e os barqueiros. Na maioria dos lugares dá para pagar com Pix e cartão." },
    { k: ["pet", "cachorro", "gato", "animal"], r: "Sobre pets, cada caso a gente conversa direitinho. Me chama no WhatsApp que te respondo rapidinho 🐾", a: "wa" },
    { k: ["fazer", "passeio", "roteiro", "atividade", "corumbau", "satu", "espelho", "boia", "pataxo", "pataxó", "aldeia"], r: "Os clássicos de Caraíva:\n• Descer o rio de boia até a Praia da Barra\n• Pôr do sol de canoa no rio\n• Caminhar 4 km até a Praia do Satu\n• Barco até a Ponta do Corumbau e suas piscinas naturais\n• Vivências com guias Pataxó na região\n• Forró na areia à noite\nA gente ajuda a organizar tudo!" },
    { k: ["forro", "forró", "noite", "festa", "musica", "música", "bar"], r: "As noites de Caraíva são de forró pé de serra: sanfona, zabumba e triângulo, com gente dançando descalça na areia até tarde 🪗 Na recepção indicamos onde está tocando em cada dia." },
    { k: ["praia", "mar", "rio", "banho", "onda", "agua", "água"], r: "Aqui você escolhe a água: o rio Caraíva é calmo, morno e cor de chá, ótimo para boia e crianças; o mar é aberto e com ondas. Na Praia da Barra os dois se encontram — é o cartão-postal da vila." },
    { k: ["epoca", "época", "clima", "chuva", "quando ir", "temporada", "melhor mes", "melhor mês"], r: "Faz calor o ano todo. Dezembro a fevereiro e julho são alta temporada, mais animados e disputados. Março a junho e setembro a novembro são mais tranquilos e com melhores preços. Na época de chuvas, a estrada de terra pede mais atenção (4x4 ou transfer)." },
    { k: ["wifi", "wi-fi", "internet", "sinal de celular", "trabalhar"], r: "Temos Wi-Fi para quem precisa dar uma conferida no mundo 😉 Mas a gente recomenda aproveitar a desconexão: Caraíva é lugar de céu estrelado e conversa na rede." },
    { k: ["crianca", "criança", "filho", "familia", "família", "bebe", "bebê"], r: "Famílias são muito bem-vindas! As suítes Auê e Hayô acomodam até 5 pessoas e a Angorró até 4. O rio calminho é perfeito para os pequenos." },
    { k: ["reserv", "disponib", "agendar", "vaga", "data"], r: "Bora! Toque no botão abaixo para escolher as datas no calendário, ver os quartos livres e pagar com Pix na hora.", a: "booking" },
    { k: ["whats", "telefone", "contato", "falar", "atendente", "humano", "pessoa"], r: `Claro! Nosso WhatsApp é ${P.telefoneExibicao}. Toque no botão abaixo para falar com a equipe.`, a: "wa" },
  ];
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  function answer(msg) {
    const m = norm(msg);
    let best = null, score = 0;
    for (const item of kb) {
      const s = item.k.filter((k) => m.includes(norm(k))).length;
      if (s > score) { score = s; best = item; }
    }
    return best || { r: "Hmm, essa eu prefiro te responder certinho pelo WhatsApp. Mas posso ajudar com quartos, preços, como chegar, passeios, pagamento ou reservas 🙂", a: "wa" };
  }

  const panel = $("#chatPanel"), msgs = $("#chatMsgs"), input = $("#chatInput"), bubble = $("#chatBubble");
  const chips = ["Como chegar?", "Quartos e preços", "O que fazer?", "Pagamento", "Reservar"];
  $("#chatChips").innerHTML = chips.map((c) => `<button type="button">${c}</button>`).join("");
  function addMsg(text, me, action) {
    const d = document.createElement("div");
    d.className = "msg" + (me ? " msg--me" : "");
    d.textContent = text;
    if (action) {
      const a = document.createElement(action === "wa" || action === "map" ? "a" : "button");
      if (action === "map") { a.textContent = "Abrir no Google Maps 📍"; a.href = P.mapaLink; a.target = "_blank"; a.rel = "noopener"; }
      a.className = "btn btn--sun";
      a.style.cssText = "margin-top:10px;display:flex;padding:9px 14px;font-size:13px";
      if (action === "booking") { a.textContent = "Ver disponibilidade →"; a.setAttribute("data-open-booking", ""); a.addEventListener("click", () => toggleChat(false)); }
      if (action === "policy") { a.textContent = "Ler políticas completas"; a.setAttribute("data-open-policy", ""); }
      if (action === "wa") { a.textContent = "Falar no WhatsApp"; a.href = waLink(`Olá! Vim pelo site da ${P.nome} e tenho uma dúvida.`); a.target = "_blank"; a.rel = "noopener"; }
      d.appendChild(a);
    }
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function send(text) {
    text = text.trim();
    if (!text) return;
    addMsg(text, true);
    input.value = "";
    const typing = document.createElement("div");
    typing.className = "msg msg--typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => {
      typing.remove();
      const a = answer(text);
      addMsg(a.r, false, a.a);
    }, 650 + Math.random() * 500);
  }
  function toggleChat(open) {
    panel.hidden = !open;
    bubble.classList.add("hide");
    if (open) {
      if (!msgs.children.length) addMsg(`Oi! Eu sou a Maré, do atendimento da ${P.nome} 🌊\nPosso te contar como chegar em Caraíva, mostrar os quartos ou te ajudar a reservar.`);
      setTimeout(() => input.focus(), 50);
    }
  }
  $("#chatFab").addEventListener("click", () => toggleChat(panel.hidden));
  bubble.addEventListener("click", () => toggleChat(true));
  setTimeout(() => bubble.classList.add("hide"), 9000);
  $("#chatChips").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) send(b.textContent); });
  $("#chatForm").addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
})();
