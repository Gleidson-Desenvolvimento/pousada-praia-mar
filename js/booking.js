/* =====================================================================
   POUSADA PRAIA MAR — Fluxo de reserva
   1 Datas → 2 Quarto → 3 Dados → 4 Pagamento (Pix/Cartão) → 5 Confirmação
   ===================================================================== */
(function () {
  "use strict";
  const C = window.PM_CONFIG;
  const STORE_KEY = "pm_reservas";
  const MAX_NIGHTS = 30;
  const KID_AGE = C.criancaGratisAte ?? 10; // crianças até essa idade não pagam
  const MAX_GUESTS = Math.max(...C.quartos.map((q) => q.capacidade));

  /* ---------------- utilidades ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
  const nightsBetween = (a, b) => Math.round((b - a) / 86400000);
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: v % 1 ? 2 : 0 });
  const fmtShort = (d) => d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).replace(/\./g, "");
  const fmtLong = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const roomById = (id) => C.quartos.find((q) => q.id === id);
  const stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

  /* ---------------- temporadas & preços ---------------- */
  function seasonOf(d) {
    const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const full = key(d);
    for (const t of C.temporadas) {
      if (t.inicio.length > 5) {
        if (full >= t.inicio && full <= t.fim) return t;
      } else if (t.inicio <= t.fim) {
        if (md >= t.inicio && md <= t.fim) return t;
      } else if (md >= t.inicio || md <= t.fim) {
        return t; // período que vira o ano (ex.: Réveillon)
      }
    }
    return null;
  }
  // nova tarifa dos quartos, a partir de C.novaTarifa.inicio (sem data de fim)
  const NOVA = C.novaTarifa?.inicio ? C.novaTarifa : null;
  const naNova = (d) => !!NOVA && key(d) >= NOVA.inicio;
  // preço POR PESSOA, por noite, com café da manhã
  const nightRate = (room, d) => {
    const s = seasonOf(d);
    if (s && s.preco) return s.preco;
    const base = (naNova(d) && NOVA.precos?.[room.id]) || room.preco;
    return Math.round(base * (s?.multiplicador || 1));
  };
  // quantas pessoas pagam a noite: tarifa dos quartos cobra no mínimo C.minPagantes
  const pagantesNoite = (d, adultos) => {
    const s = seasonOf(d);
    const min = s && s.preco ? (s.minPagantes || 1) : (C.minPagantes || 1);
    return Math.max(adultos, min);
  };
  // noites sem preço definido (depois de tarifaValidaAte e fora de temporada) → "consulte"
  const LIMITE = C.tarifaValidaAte || null;
  const priced = (d) => !LIMITE || key(d) <= LIMITE || !!seasonOf(d) || naNova(d);
  const firstUnpriced = (ci, co) => { for (let d = new Date(ci); d < co; d = addDays(d, 1)) if (!priced(d)) return d; return null; };
  const ddmm = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  function minNightsFor(ci, co) {
    let min = C.minNoitesPadrao, why = null;
    for (let d = new Date(ci); d < co; d = addDays(d, 1)) {
      const s = seasonOf(d);
      if (s && s.minNoites > min) { min = s.minNoites; why = s.nome; }
    }
    return { min, why };
  }

  /* ---------------- disponibilidade ---------------- */
  const loadStored = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; } };
  const allBookings = () => [...(C.bloqueios || []), ...(window.PMOcupacao?.lista || []), ...loadStored().filter((r) => r.status !== "cancelada")];

  function unitsFree(roomId, dk) {
    const room = roomById(roomId);
    const used = allBookings().filter((b) => b.quarto === roomId && b.inicio <= dk && dk < b.fim).length;
    return room.unidades - used;
  }
  function rangeFree(roomId, ci, co) {
    for (let d = new Date(ci); d < co; d = addDays(d, 1)) if (unitsFree(roomId, key(d)) <= 0) return false;
    return true;
  }
  const anyFree = (d) => C.quartos.some((q) => unitsFree(q.id, key(d)) > 0);
  const cheapest = (d) => Math.min(...C.quartos.filter((q) => unitsFree(q.id, key(d)) > 0).map((q) => nightRate(q, d)));

  /* ---------------- cálculo do total ---------------- */
  function quote(s = state) {
    const room = roomById(s.quartoId);
    if (!room || !s.checkin || !s.checkout) return null;
    const n = nightsBetween(s.checkin, s.checkout);
    const pessoas = s.adultos + s.criancas;   // ocupação do quarto
    const pagantes = s.adultos;               // crianças até KID_AGE anos não pagam
    let diarias = 0;
    const faixas = []; // [{ preco, noites, nome, pagantes }] — noites agrupadas pelo valor
    for (let d = new Date(s.checkin); d < s.checkout; d = addDays(d, 1)) {
      const r = nightRate(room, d), nome = seasonOf(d)?.nome || "", p = pagantesNoite(d, pagantes);
      diarias += r * p;
      const f = faixas.find((x) => x.preco === r && x.nome === nome && x.pagantes === p);
      if (f) f.noites++; else faixas.push({ preco: r, noites: 1, nome, pagantes: p });
    }
    const extraPessoas = 0;
    const extras = C.extras.filter((e) => s.extras.has(e.id)).map((e) => ({ ...e, total: e.tipo === "pessoa" ? e.preco * pessoas : e.preco }));
    const extrasTotal = extras.reduce((a, e) => a + e.total, 0);
    const subtotal = diarias + extraPessoas + extrasTotal;
    const desconto = s.pagamento === "pix-total" ? Math.round(subtotal * C.pix.descontoPagamentoTotal * 100) / 100 : 0;
    const total = subtotal - desconto;
    const agora = s.pagamento === "pix-total" ? total : Math.round(total * C.sinal * 100) / 100;
    return { room, n, pessoas, pagantes, criancas: s.criancas, diarias, faixas, extraPessoas, extras, subtotal, desconto, total, agora, restante: total - agora };
  }

  /* ---------------- Pix (BR Code EMV) ---------------- */
  function crc16(str) {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }
  function pixPayload(valor, txid) {
    const f = (id, v) => id + pad(v.length) + v;
    const clean = (s, n) => stripAccents(s).toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, n);
    const mai = f("00", "br.gov.bcb.pix") + f("01", C.pix.chave.trim());
    const p = f("00", "01") + f("26", mai) + f("52", "0000") + f("53", "986") + f("54", valor.toFixed(2)) +
      f("58", "BR") + f("59", clean(C.pix.nomeRecebedor, 25)) + f("60", clean(C.pix.cidadeRecebedor, 15)) +
      f("62", f("05", txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25))) + "6304";
    return p + crc16(p);
  }

  /* ---------------- estado ---------------- */
  const fresh = () => ({
    step: 1, checkin: null, checkout: null, adultos: 2, criancas: 0, quartoId: null,
    extras: new Set(), hospede: {}, pagamento: "pix-sinal", codigo: null, calMonth: (() => { const t = today(); return new Date(t.getFullYear(), t.getMonth(), 1); })(),
    pixExpira: null, reserva: null,
  });
  let state = fresh();
  let timerId = null;

  /* ---------------- render principal ---------------- */
  const modal = () => $("#booking");
  function render() {
    $$("#bkSteps li").forEach((li) => {
      const s = +li.dataset.s;
      li.classList.toggle("on", s === state.step);
      li.classList.toggle("done", s < state.step);
    });
    const main = $("#bkMain");
    main.innerHTML = [null, stepDates, stepRoom, stepGuest, stepPay, stepDone][state.step]();
    main.scrollTop = 0;
    renderSummary();
  }

  /* ---------- PASSO 1: datas ---------- */
  function monthHTML(first) {
    const t = today();
    const dows = ["D", "S", "T", "Q", "Q", "S", "S"].map((d) => `<span class="cal__dow">${d}</span>`).join("");
    let cells = "";
    for (let i = 0; i < first.getDay(); i++) cells += "<span></span>";
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= days; i++) {
      const d = new Date(first.getFullYear(), first.getMonth(), i);
      const k = key(d);
      const past = d < t;
      const free = !past && anyFree(d);
      const ci = state.checkin && key(state.checkin) === k;
      const co = state.checkout && key(state.checkout) === k;
      const inR = state.checkin && state.checkout && d > state.checkin && d < state.checkout;
      // check-out pode cair num dia lotado (a noite não é usada)
      const canCheckout = state.checkin && !state.checkout && d > state.checkin && !firstUnpriced(state.checkin, d);
      const hasPrice = priced(d);
      const disabled = past || ((!free || !hasPrice) && !canCheckout);
      const cls = ["cal__day", !past && !free ? "full" : "", seasonOf(d) ? "season" : "", +d === +t ? "today" : "", ci ? "start" : "", co ? "end" : "", inR ? "in" : ""].join(" ");
      const price = past ? "<small>&nbsp;</small>" : !hasPrice ? "<small>—</small>" : free ? `<small>${Math.round(cheapest(d))}</small>` : "<small>&nbsp;</small>";
      const label = !past && !hasPrice ? " — valores a consultar" : !free && !past ? " — lotado" : "";
      cells += `<button type="button" class="${cls}${!past && !hasPrice ? " noprice" : ""}" data-day="${k}" ${disabled ? "disabled" : ""} aria-label="${fmtLong(d)}${label}">${i}${price}</button>`;
    }
    const mes = first.toLocaleDateString("pt-BR", { month: "long" });
    const title = `${mes[0].toUpperCase()}${mes.slice(1)} ${first.getFullYear()}`;
    return `<div class="cal__month"><h4>${title}</h4><div class="cal__grid">${dows}${cells}</div></div>`;
  }

  function stepDates() {
    const m1 = state.calMonth;
    const m2 = new Date(m1.getFullYear(), m1.getMonth() + 1, 1);
    const t = today();
    const atStart = m1.getFullYear() === t.getFullYear() && m1.getMonth() === t.getMonth();
    const hint = !state.checkin ? "Toque no dia da chegada." : !state.checkout ? "Agora toque no dia da saída." : `${nightsBetween(state.checkin, state.checkout)} noite(s) selecionada(s).`;
    return `
      <p class="bk-title">Quando você vem para Caraíva?</p>
      <p class="bk-sub">${hint} Abaixo de cada dia: diária por pessoa a partir de (R$), com café da manhã.</p>
      <div class="cal">
        <div class="cal__nav">
          <button type="button" data-cal="-1" ${atStart ? "disabled" : ""} aria-label="Mês anterior">‹</button>
          <button type="button" data-cal="1" aria-label="Próximo mês">›</button>
        </div>
        ${monthHTML(m1)}${monthHTML(m2)}
      </div>
      <div class="cal-legend">
        <span><i style="background:var(--anil)"></i>Selecionado</span>
        ${C.temporadas.length ? `<span><i style="background:rgba(224,87,58,.25)"></i>Valor em vermelho = temporada especial</span>` : ""}
        <span><i style="background:#e9e0cf"></i>Riscado = lotado</span>
        ${LIMITE && !NOVA ? `<span>“—” = valores ainda não abertos: <a href="${waLink("Olá! Gostaria de consultar valores e disponibilidade para datas que ainda não aparecem no site.")}" target="_blank" rel="noopener">consulte no WhatsApp</a></span>` : ""}
      </div>
      <div class="guests">
        <div class="guest-box"><div><b>Adultos</b><span>${KID_AGE + 1} anos ou mais</span></div>
          <div class="stepper"><button type="button" data-g="adultos" data-d="-1" ${state.adultos <= 1 ? "disabled" : ""}>−</button><output>${state.adultos}</output><button type="button" data-g="adultos" data-d="1" ${state.adultos + state.criancas >= MAX_GUESTS ? "disabled" : ""}>+</button></div></div>
        <div class="guest-box"><div><b>Crianças</b><span>até ${KID_AGE} anos · não pagam</span></div>
          <div class="stepper"><button type="button" data-g="criancas" data-d="-1" ${state.criancas <= 0 ? "disabled" : ""}>−</button><output>${state.criancas}</output><button type="button" data-g="criancas" data-d="1" ${state.adultos + state.criancas >= MAX_GUESTS ? "disabled" : ""}>+</button></div></div>
      </div>
      <p class="bk-error" id="bkErr"></p>
      <div class="bk-nav">
        <button type="button" class="btn btn--line" data-clear>Limpar datas</button>
        <button type="button" class="btn btn--coral btn--lg" data-next>Ver quartos disponíveis →</button>
      </div>`;
  }

  function validateDates() {
    if (!state.checkin || !state.checkout) return "Escolha a data de chegada e a de saída no calendário.";
    const n = nightsBetween(state.checkin, state.checkout);
    if (n < 1) return "A saída precisa ser depois da chegada.";
    if (n > MAX_NIGHTS) return `Para estadias acima de ${MAX_NIGHTS} noites, fale com a gente pelo WhatsApp.`;
    const semPreco = LIMITE && firstUnpriced(state.checkin, state.checkout);
    if (semPreco) {
      const msg = "Olá! Gostaria de consultar valores e disponibilidade de " + fmtShort(state.checkin) + " a " + fmtShort(state.checkout) + ".";
      return `O valor da noite de ${ddmm(semPreco)} ainda não está aberto no site. <a href="${waLink(msg)}" target="_blank" rel="noopener">Consulte essas datas no WhatsApp</a> — respondemos rapidinho.`;
    }
    const { min, why } = minNightsFor(state.checkin, state.checkout);
    if (n < min) return `Nesse período${why ? ` (${why})` : ""} a estadia mínima é de ${min} noites.`;
    return null;
  }

  /* ---------- PASSO 2: quarto ---------- */
  const rateLabel = (qq) => {
    const v = qq.faixas.map((f) => f.preco);
    const lo = Math.min(...v), hi = Math.max(...v);
    const txt = lo === hi ? brl(lo) : `${brl(lo)} a ${brl(hi)}`;
    const min = qq.faixas.find((f) => f.pagantes > qq.pagantes);
    return `${txt} por pessoa/noite${min ? `<br/>valor mínimo de ${min.pagantes} pessoas` : ""}`;
  };
  function stepRoom() {
    const n = nightsBetween(state.checkin, state.checkout);
    const pessoas = state.adultos + state.criancas;
    const cards = C.quartos.map((q) => {
      const cap = q.capacidade >= pessoas;
      const free = rangeFree(q.id, state.checkin, state.checkout);
      const qq = quote({ ...state, quartoId: q.id, extras: new Set(), pagamento: "pix-sinal" });
      const ok = cap && free;
      const badge = !free ? `<span class="badge badge--warn">Esgotado nessas datas</span>` : !cap ? `<span class="badge badge--warn">Acomoda até ${q.capacidade} pessoas</span>` : `<span class="badge">✓ Disponível · café da manhã incluso</span>`;
      return `
        <button type="button" class="pick-room ${state.quartoId === q.id ? "on" : ""}" data-room="${q.id}" ${ok ? "" : "disabled"}>
          <img src="${q.img}" alt="${esc(q.nome)}" />
          <div><h4>${esc(q.nome)}</h4><p>${esc(q.resumo)}</p>${badge}</div>
          <div class="pick-room__price"><b>${brl(qq.diarias)}</b><span>${n} noite${n > 1 ? "s" : ""} · ${state.adultos} adulto${state.adultos > 1 ? "s" : ""}${state.criancas ? ` + ${state.criancas} criança${state.criancas > 1 ? "s" : ""} grátis` : ""}<br/>${rateLabel(qq)}</span></div>
        </button>`;
    }).join("");
    const none = C.quartos.every((q) => !(q.capacidade >= pessoas && rangeFree(q.id, state.checkin, state.checkout)));
    return `
      <p class="bk-title">Escolha o seu cantinho</p>
      <p class="bk-sub">${fmtShort(state.checkin)} → ${fmtShort(state.checkout)} · ${n} noite${n > 1 ? "s" : ""} · ${pessoas} hóspede${pessoas > 1 ? "s" : ""}</p>
      <div class="pick">${cards}</div>
      ${none ? `<p class="bk-error">Não encontramos quarto para essas datas/ocupação. Tente outras datas ou <a href="${waLink("Olá! Gostaria de verificar disponibilidade em Caraíva de " + fmtShort(state.checkin) + " a " + fmtShort(state.checkout) + " para " + pessoas + " pessoas.")}" target="_blank" rel="noopener">fale com a gente no WhatsApp</a>.</p>` : `<p class="bk-error" id="bkErr"></p>`}
      <div class="bk-nav">
        <button type="button" class="btn btn--line" data-back>← Datas</button>
        <button type="button" class="btn btn--coral btn--lg" data-next ${state.quartoId ? "" : "disabled"}>Continuar →</button>
      </div>`;
  }

  /* ---------- PASSO 3: extras + hóspede ---------- */
  function stepGuest() {
    const h = state.hospede;
    const pessoas = state.adultos + state.criancas;
    const extras = C.extras.map((e) => `
      <label class="extra">
        <input type="checkbox" data-extra="${e.id}" ${state.extras.has(e.id) ? "checked" : ""} />
        <div><b>${esc(e.nome)}</b><span>${esc(e.desc)}</span></div>
        <em>${e.tipo === "pessoa" ? `${brl(e.preco)}/pessoa` : brl(e.preco)}</em>
      </label>`).join("");
    const v = (k) => esc(h[k] || "");
    return `
      <p class="bk-title">Quem vem para Caraíva?</p>
      <p class="bk-sub">Usamos esses dados só para a sua reserva e para combinar a travessia.</p>
      <p class="subhead">Deixe a viagem ainda melhor <span class="muted" style="font-weight:400">(opcional)</span></p>
      <div class="extras">${extras}</div>
      <p class="subhead">Dados do responsável</p>
      <form class="form" id="guestForm" novalidate>
        <div class="field field--full"><label for="g-nome">Nome completo *</label><input id="g-nome" name="nome" autocomplete="name" value="${v("nome")}" required /><span class="err"></span></div>
        <div class="field"><label for="g-email">E-mail *</label><input id="g-email" name="email" type="email" autocomplete="email" value="${v("email")}" required /><span class="err"></span></div>
        <div class="field"><label for="g-tel">WhatsApp *</label><input id="g-tel" name="telefone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(11) 99999-9999" value="${v("telefone")}" required /><span class="err"></span></div>
        <div class="field"><label for="g-cpf">CPF <span class="muted">(opcional)</span></label><input id="g-cpf" name="cpf" inputmode="numeric" placeholder="000.000.000-00" value="${v("cpf")}" /><span class="err"></span></div>
        <div class="field"><label for="g-cidade">Cidade de origem</label><input id="g-cidade" name="cidade" autocomplete="address-level2" value="${v("cidade")}" /><span class="err"></span></div>
        <div class="field"><label for="g-chegada">Previsão de chegada em Nova Caraíva</label>
          <select id="g-chegada" name="chegada">
            ${["A combinar", "Manhã (até 12h)", "Tarde (12h–17h)", "Fim de tarde / noite (após 17h)"].map((o) => `<option ${h.chegada === o ? "selected" : ""}>${o}</option>`).join("")}
          </select></div>
        <div class="field"><label for="g-ocasiao">Alguma ocasião especial?</label>
          <select id="g-ocasiao" name="ocasiao">
            ${["Nenhuma", "Lua de mel", "Aniversário", "Aniversário de casamento", "Férias em família", "Trabalho remoto"].map((o) => `<option ${h.ocasiao === o ? "selected" : ""}>${o}</option>`).join("")}
          </select></div>
        <div class="field field--full"><label for="g-obs">Observações</label><textarea id="g-obs" name="obs" placeholder="Restrição alimentar, berço, horário do voo…">${v("obs")}</textarea></div>
        <label class="check-line"><input type="checkbox" id="g-aceite" ${h.aceite ? "checked" : ""} /> <span>Li e aceito as <a href="#" data-open-policy>políticas de reserva e cancelamento</a>. *</span></label>
      </form>
      <p class="bk-error" id="bkErr"></p>
      <div class="bk-nav">
        <button type="button" class="btn btn--line" data-back>← Quarto</button>
        <button type="button" class="btn btn--coral btn--lg" data-next>Ir para pagamento →</button>
      </div>`;
  }

  const onlyDigits = (s) => (s || "").replace(/\D/g, "");
  function validCPF(c) {
    c = onlyDigits(c);
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    for (let t = 9; t < 11; t++) {
      let s = 0;
      for (let i = 0; i < t; i++) s += +c[i] * (t + 1 - i);
      if (((10 * s) % 11) % 10 !== +c[t]) return false;
    }
    return true;
  }
  const maskPhone = (v) => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 2) return d ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };
  const maskCPF = (v) => onlyDigits(v).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");

  function readGuest() {
    const f = $("#guestForm");
    const h = state.hospede;
    ["nome", "email", "telefone", "cpf", "cidade", "chegada", "ocasiao", "obs"].forEach((k) => (h[k] = f.elements[k].value.trim()));
    h.aceite = $("#g-aceite").checked;
  }
  function validateGuest() {
    readGuest();
    const h = state.hospede;
    const errs = {};
    if (h.nome.split(/\s+/).filter(Boolean).length < 2) errs.nome = "Informe nome e sobrenome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(h.email)) errs.email = "E-mail inválido.";
    if (onlyDigits(h.telefone).length < 10) errs.telefone = "Informe DDD + número.";
    if (h.cpf && !validCPF(h.cpf)) errs.cpf = "CPF inválido.";
    $$("#guestForm .field").forEach((fd) => {
      const inp = $("input,select,textarea", fd);
      const e = errs[inp?.name];
      fd.classList.toggle("invalid", !!e);
      const span = $(".err", fd);
      if (span) span.textContent = e || "";
    });
    if (Object.keys(errs).length) { $("#guestForm .invalid input")?.focus(); return "Confira os campos destacados."; }
    if (!h.aceite) return "Para continuar, aceite as políticas da reserva.";
    return null;
  }

  /* ---------- PASSO 4: pagamento ---------- */
  function stepPay() {
    const base = quote({ ...state, pagamento: "pix-sinal" });
    const full = quote({ ...state, pagamento: "pix-total" });
    if (!state.codigo) state.codigo = genCode();
    const q = quote();
    const opt = (id, title, sub, val) => `<button type="button" class="pay-opt ${state.pagamento === id ? "on" : ""}" data-pay="${id}"><b>${title}</b><span>${sub}</span><strong>${val}</strong></button>`;
    let detail = "";
    if (state.pagamento.startsWith("pix")) {
      if (!state.pixExpira) state.pixExpira = Date.now() + 30 * 60 * 1000;
      const payload = pixPayload(q.agora, state.codigo);
      let qr = "";
      try {
        const g = window.qrcode(0, "M");
        g.addData(payload);
        g.make();
        qr = g.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: "QR Code Pix" });
      } catch (e) { qr = "<p>QR indisponível — use o copia e cola.</p>"; }
      detail = `
        <div class="pix-box">
          <div class="pix-qr">${qr}</div>
          <div>
            <p class="subhead" style="margin:0">Pague ${brl(q.agora)} com Pix</p>
            <span class="timer" id="pixTimer">⏱ 30:00 para pagar</span>
            <div class="pix-code"><input id="pixCode" readonly value="${esc(payload)}" aria-label="Pix copia e cola" /><button type="button" class="btn btn--anil" data-copy>Copiar</button></div>
            <ol class="pix-steps">
              <li>Abra o app do seu banco e escolha <b>Pix → Ler QR Code</b> ou <b>Copia e cola</b>.</li>
              <li>Confira o recebedor: <b>${esc(C.pix.nomeRecebedor)}</b>.</li>
              <li>Pague e toque em <b>“Já paguei”</b> para concluir.</li>
            </ol>
          </div>
        </div>`;
    } else {
      const hasLink = !!C.cartao.linkPagamento;
      detail = `
        <div class="card-box">
          <p>💳 Pagamento em até <b>${C.cartao.parcelasMax}x</b> no cartão, em ambiente seguro do nosso processador de pagamentos — o site da pousada não armazena dados do seu cartão.</p>
          ${hasLink
            ? `<a class="btn btn--anil" href="${esc(C.cartao.linkPagamento)}" target="_blank" rel="noopener">Abrir pagamento seguro ↗</a><p style="margin-top:12px">Depois de pagar, volte aqui e toque em “Concluir reserva”.</p>`
            : `<p>Ao concluir, enviamos o <b>link de pagamento seguro</b> no seu WhatsApp em poucos minutos. Suas datas ficam pré-reservadas por 2 horas.</p>`}
        </div>`;
    }
    return `
      <p class="bk-title">Como prefere pagar?</p>
      <p class="bk-sub">Reserva nº <b>${state.codigo}</b> · total ${brl(q.total)}</p>
      <div class="pay-opts">
        ${opt("pix-sinal", `Pix · sinal de ${Math.round(C.sinal * 100)}%`, "Restante no check-in", brl(base.agora))}
        ${opt("pix-total", "Pix · valor integral", `${Math.round(C.pix.descontoPagamentoTotal * 100)}% de desconto`, brl(full.total))}
        ${opt("cartao", "Cartão de crédito", `Até ${C.cartao.parcelasMax}x · sinal de ${Math.round(C.sinal * 100)}%`, brl(base.agora))}
      </div>
      ${detail}
      <p class="bk-error" id="bkErr"></p>
      <div class="bk-nav">
        <button type="button" class="btn btn--line" data-back>← Dados</button>
        <button type="button" class="btn btn--coral btn--lg" data-finish>${state.pagamento.startsWith("pix") ? "Já paguei — concluir reserva" : "Concluir reserva"} ✓</button>
      </div>`;
  }

  function genCode() {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "PM";
    const rnd = crypto.getRandomValues(new Uint8Array(6));
    rnd.forEach((b) => (s += abc[b % abc.length]));
    return s;
  }

  let finishing = false;
  async function finish() {
    if (finishing) return;
    finishing = true;
    try { await window.PMOcupacao?.atualizar(); } finally { finishing = false; } // datas ocupadas mais recentes do painel
    if (state.step !== 4) return;
    const q = quote();
    // checa de novo a disponibilidade (pode ter mudado)
    if (!rangeFree(state.quartoId, state.checkin, state.checkout)) {
      $("#bkErr").textContent = "Ops! Esse quarto acabou de ser reservado nessas datas. Volte e escolha outro.";
      return;
    }
    const h = state.hospede;
    const r = {
      codigo: state.codigo,
      criadaEm: new Date().toISOString(),
      status: "aguardando-pagamento",
      quarto: q.room.id,
      quartoNome: q.room.nome,
      inicio: key(state.checkin),
      fim: key(state.checkout),
      noites: q.n,
      adultos: state.adultos,
      criancas: state.criancas,
      extras: q.extras.map((e) => ({ nome: e.nome, valor: e.total })),
      pagamento: state.pagamento,
      total: q.total,
      pagoAgora: q.agora,
      restante: q.restante,
      desconto: q.desconto,
      hospede: { nome: h.nome, email: h.email, telefone: h.telefone, cpf: h.cpf, cidade: h.cidade, chegada: h.chegada, ocasiao: h.ocasiao, obs: h.obs },
    };
    const list = loadStored();
    list.push(r);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch {}
    if (C.webhookUrl) {
      fetch(C.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(r) }).catch(() => {});
    }
    window.PMPedidos?.enviar(r); // envia ao painel ADM (js/pedidos.js)
    state.reserva = r;
    clearInterval(timerId);
    go(5);
  }

  /* ---------- PASSO 5: confirmação ---------- */
  function reservationText(r) {
    const pag = { "pix-sinal": `Pix (sinal) — ${brl(r.pagoAgora)}`, "pix-total": `Pix (integral) — ${brl(r.pagoAgora)}`, cartao: `Cartão — sinal ${brl(r.pagoAgora)} (aguardando link)` }[r.pagamento];
    return [
      `Olá! Acabei de fazer uma reserva pelo site da ${C.pousada.nome} 🌊`,
      ``,
      `*Reserva:* ${r.codigo}`,
      `*Quarto:* ${r.quartoNome}`,
      `*Check-in:* ${fmtLong(parse(r.inicio))}`,
      `*Check-out:* ${fmtLong(parse(r.fim))} (${r.noites} noites)`,
      `*Hóspedes:* ${r.adultos} adulto(s)${r.criancas ? `, ${r.criancas} criança(s) até ${KID_AGE} anos (não pagam)` : ""}`,
      r.extras.length ? `*Extras:* ${r.extras.map((e) => e.nome).join(", ")}` : null,
      `*Total:* ${brl(r.total)}`,
      `*Pagamento:* ${pag}`,
      r.restante > 0 ? `*Restante no check-in:* ${brl(r.restante)}` : null,
      ``,
      `*Nome:* ${r.hospede.nome}`,
      `*Chegada prevista:* ${r.hospede.chegada}`,
      r.hospede.ocasiao && r.hospede.ocasiao !== "Nenhuma" ? `*Ocasião:* ${r.hospede.ocasiao}` : null,
      r.hospede.obs ? `*Obs.:* ${r.hospede.obs}` : null,
      ``,
      r.pagamento.startsWith("pix") ? `Segue o comprovante do Pix 👇` : `Aguardo o link de pagamento 🙂`,
    ].filter((l) => l !== null).join("\n");
  }
  const waLink = (text) => `https://wa.me/${C.pousada.whatsapp}?text=${encodeURIComponent(text)}`;

  function stepDone() {
    const r = state.reserva;
    const first = esc(r.hospede.nome.split(" ")[0]);
    return `
      <div class="done print-area">
        <div class="done__icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#151a45" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></div>
        <p class="hand">até breve, ${first}!</p>
        <p class="bk-title">Pré-reserva registrada</p>
        <span class="done__status">● ${r.pagamento.startsWith("pix") ? "Aguardando o comprovante do Pix" : "Aguardando pagamento com cartão"}</span>
        <div><span class="done__code">${r.codigo}</span></div>
        <p class="muted">${esc(r.quartoNome)} · ${fmtShort(parse(r.inicio))} → ${fmtShort(parse(r.fim))} · ${r.noites} noites<br/>
        Total ${brl(r.total)}${r.restante > 0 ? ` · ${brl(r.pagoAgora)} agora e ${brl(r.restante)} no check-in` : ""}</p>
        <p class="muted" style="font-size:14px">Para <b>finalizar</b>, envie a mensagem com ${r.pagamento.startsWith("pix") ? "o comprovante" : "seus dados"} no nosso WhatsApp. Confirmamos tudo e mandamos as dicas da travessia de canoa. 🛶</p>
        <div class="done__actions">
          <a class="btn btn--coral btn--lg btn--block" href="${waLink(reservationText(r))}" target="_blank" rel="noopener">Enviar no WhatsApp e finalizar</a>
          <button type="button" class="btn btn--line btn--block" data-ics>📅 Adicionar ao calendário</button>
          <button type="button" class="btn btn--line btn--block" data-print>🖨️ Imprimir / salvar em PDF</button>
          <button type="button" class="btn btn--line btn--block" data-close-done>Voltar ao site</button>
        </div>
      </div>`;
  }

  function downloadICS(r) {
    const d = (k) => k.replace(/-/g, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pousada Praia Mar//Reserva//PT",
      "BEGIN:VEVENT",
      `UID:${r.codigo}@pousadapraiamar`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART;VALUE=DATE:${d(r.inicio)}`,
      `DTEND;VALUE=DATE:${d(r.fim)}`,
      `SUMMARY:Caraíva · ${C.pousada.nome} (${r.codigo})`,
      `LOCATION:${C.pousada.endereco}`,
      `DESCRIPTION:${r.quartoNome} · check-in ${C.pousada.checkin} · check-out ${C.pousada.checkout}. Estacione em Nova Caraíva e atravesse o rio de canoa.`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `reserva-${r.codigo}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------------- resumo lateral ---------------- */
  function renderSummary() {
    const el = $("#bkSummary");
    const q = quote();
    const n = state.checkin && state.checkout ? nightsBetween(state.checkin, state.checkout) : 0;
    const dates = `
      <div class="sum-dates">
        <div><span>Check-in</span><b>${state.checkin ? fmtShort(state.checkin) : "—"}</b></div>
        <div><span>Check-out</span><b>${state.checkout ? fmtShort(state.checkout) : "—"}</b></div>
      </div>`;
    const collapsed = el.classList.contains("collapsed");
    const toggle = `<button type="button" class="sum-toggle" data-sumtoggle>${q ? `Total <b>${brl(q.total)}</b>` : "Resumo da reserva"} <span>${collapsed ? "▲" : "▼"}</span></button>`;
    if (!q) {
      el.innerHTML = `${toggle}
        <div class="sum-empty"><span class="hand">sua estadia</span>${n ? `${n} noite${n > 1 ? "s" : ""} · ${state.adultos + state.criancas} hóspede(s)<br/>Escolha o quarto para ver o total.` : "Escolha as datas para ver os valores."}</div>
        ${dates}
        <p class="sum-note">☕ Café da manhã incluso · Check-in ${C.pousada.checkin} · Check-out ${C.pousada.checkout}</p>`;
      return;
    }
    const lines = [
      ...q.faixas.map((f) => `<li><span>${f.noites} diária${f.noites > 1 ? "s" : ""}${f.nome ? ` ${esc(f.nome)}` : ""} × ${f.pagantes > q.pagantes ? `mínimo de ${f.pagantes} pessoas` : `${f.pagantes} adulto${f.pagantes > 1 ? "s" : ""}`} (${brl(f.preco)})</span><span>${brl(f.preco * f.noites * f.pagantes)}</span></li>`),
      q.criancas ? `<li class="disc"><span>${q.criancas} criança${q.criancas > 1 ? "s" : ""} até ${KID_AGE} anos</span><span>grátis</span></li>` : "",
      q.extraPessoas ? `<li><span>Hóspedes adicionais</span><span>${brl(q.extraPessoas)}</span></li>` : "",
      ...q.extras.map((e) => `<li><span>${esc(e.nome)}</span><span>${brl(e.total)}</span></li>`),
      q.desconto ? `<li class="disc"><span>Desconto Pix</span><span>− ${brl(q.desconto)}</span></li>` : "",
    ].join("");
    const seasons = new Set();
    for (let d = new Date(state.checkin); d < state.checkout; d = addDays(d, 1)) { const s = seasonOf(d); if (s) seasons.add(s.nome); }
    el.innerHTML = `${toggle}
      <img class="sum-img" src="${q.room.img}" alt="" />
      <p class="sum-title">${esc(q.room.nome)}</p>
      ${dates}
      <p class="muted" style="margin:0;font-size:13px">${state.adultos} adulto${state.adultos > 1 ? "s" : ""}${state.criancas ? ` · ${state.criancas} criança${state.criancas > 1 ? "s" : ""}` : ""}${seasons.size ? ` · ${[...seasons].join(", ")}` : ""}</p>
      <ul class="sum-lines">${lines}</ul>
      <div class="sum-total"><span>Total</span><b>${brl(q.total)}</b></div>
      ${state.step >= 4 ? `<ul class="sum-lines"><li><span>Pagar agora</span><span><b>${brl(q.agora)}</b></span></li>${q.restante > 0 ? `<li><span>No check-in</span><span>${brl(q.restante)}</span></li>` : ""}</ul>` : ""}
      <p class="sum-note">✓ Café da manhã incluso<br/>✓ Check-in ${C.pousada.checkin} · Check-out ${C.pousada.checkout}</p>`;
  }

  /* ---------------- navegação ---------------- */
  function go(step) {
    state.step = step;
    render();
    if (step === 4) startTimer();
    if (window.matchMedia("(max-width: 900px)").matches) $("#bkSummary").classList.add("collapsed");
  }
  function startTimer() {
    clearInterval(timerId);
    const tick = () => {
      const el = $("#pixTimer");
      if (!el || !state.pixExpira) return;
      const left = Math.max(0, state.pixExpira - Date.now());
      const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
      el.textContent = left ? `⏱ ${pad(m)}:${pad(s)} para pagar` : "⏱ Código expirado — gerando outro…";
      if (!left) { state.pixExpira = null; render(); startTimer(); }
    };
    tick();
    timerId = setInterval(tick, 1000);
  }

  /* Um único listener delegado em #bkMain; despacha para o passo atual */
  const handlers = {
    1: { click(e) {
        const day = e.target.closest("[data-day]");
        if (day) {
          const d = parse(day.dataset.day);
          if (!state.checkin || state.checkout || d <= state.checkin) { state.checkin = d; state.checkout = null; }
          else state.checkout = d;
          state.quartoId = null;
          render();
          return;
        }
        const cal = e.target.closest("[data-cal]");
        if (cal) { const m = state.calMonth; state.calMonth = new Date(m.getFullYear(), m.getMonth() + +cal.dataset.cal, 1); render(); return; }
        const g = e.target.closest("[data-g]");
        if (g) { state[g.dataset.g] += +g.dataset.d; render(); return; }
        if (e.target.closest("[data-clear]")) { state.checkin = state.checkout = null; state.quartoId = null; render(); return; }
        if (e.target.closest("[data-next]")) {
          const err = validateDates();
          if (err) { $("#bkErr").innerHTML = err; return; }
          if (state.quartoId && !(rangeFree(state.quartoId, state.checkin, state.checkout) && roomById(state.quartoId).capacidade >= state.adultos + state.criancas)) state.quartoId = null;
          go(2);
        }
    } },
    2: { click(e) {
        const r = e.target.closest("[data-room]");
        if (r && !r.disabled) { state.quartoId = r.dataset.room; render(); return; }
        if (e.target.closest("[data-back]")) return go(1);
        if (e.target.closest("[data-next]") && state.quartoId) go(3);
    } },
    3: {
      change(e) {
        const x = e.target.closest("[data-extra]");
        if (x) { x.checked ? state.extras.add(x.dataset.extra) : state.extras.delete(x.dataset.extra); renderSummary(); }
      },
      input(e) {
        if (e.target.id === "g-tel") e.target.value = maskPhone(e.target.value);
        if (e.target.id === "g-cpf") e.target.value = maskCPF(e.target.value);
      },
      click(e) {
        if (e.target.closest("[data-back]")) { readGuest(); return go(2); }
        if (e.target.closest("[data-next]")) {
          const err = validateGuest();
          $("#bkErr").textContent = err || "";
          if (!err) go(4);
        }
    } },
    4: { click(e) {
        const p = e.target.closest("[data-pay]");
        if (p) { state.pagamento = p.dataset.pay; render(); startTimer(); return; }
        if (e.target.closest("[data-copy]")) {
          const inp = $("#pixCode");
          (navigator.clipboard?.writeText(inp.value) || Promise.reject()).then(
            () => window.PM_toast?.("Código Pix copiado! Cole no app do seu banco."),
            () => { inp.select(); document.execCommand("copy"); window.PM_toast?.("Código Pix copiado!"); }
          );
          return;
        }
        if (e.target.closest("[data-back]")) { clearInterval(timerId); return go(3); }
        if (e.target.closest("[data-finish]")) finish();
    } },
    5: { click(e) {
        if (e.target.closest("[data-ics]")) downloadICS(state.reserva);
        if (e.target.closest("[data-print]")) window.print();
        if (e.target.closest("[data-close-done]")) close(true);
    } },
  };

  /* ---------------- abrir / fechar ---------------- */
  let lastFocus = null;
  function open(opts = {}) {
    window.PMOcupacao?.atualizar(); // o calendário se redesenha quando chegar (evento pm:ocupacao)
    if (state.step === 5) state = fresh();
    if (opts.checkin) { state.checkin = parse(opts.checkin); state.calMonth = new Date(state.checkin.getFullYear(), state.checkin.getMonth(), 1); }
    if (opts.checkout) state.checkout = parse(opts.checkout);
    if (opts.adultos) { state.adultos = opts.adultos; state.criancas = 0; }
    if (opts.quartoId) state.quartoId = opts.quartoId;
    let step = 1;
    if (opts.checkin && opts.checkout && !validateDates()) step = 2;
    lastFocus = document.activeElement;
    modal().hidden = false;
    document.body.classList.add("lock");
    go(step);
    setTimeout(() => $(".modal__panel--booking .modal__close")?.focus(), 50);
  }
  function close(force) {
    if (!force && state.step >= 3 && state.step <= 4 && !confirm("Sair da reserva? Os dados preenchidos continuam guardados até você fechar a página.")) return;
    modal().hidden = true;
    document.body.classList.remove("lock");
    clearInterval(timerId);
    if (state.step === 5) state = fresh();
    lastFocus?.focus?.();
  }

  // datas ocupadas do painel chegaram: redesenha o calendário / lista de quartos se estiverem na tela
  document.addEventListener("pm:ocupacao", () => { if (!modal().hidden && state.step <= 2) render(); });

  document.addEventListener("DOMContentLoaded", () => {
    ["click", "change", "input"].forEach((t) => $("#bkMain").addEventListener(t, (e) => handlers[state.step]?.[t]?.(e)));
    modal().addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) close();
      if (e.target.closest("[data-sumtoggle]")) { $("#bkSummary").classList.toggle("collapsed"); renderSummary(); }
    });
  });

  window.PMBooking = { open, close, isOpen: () => !modal().hidden, validateRange: (ci, co) => {
    const s = { ...state };
    state.checkin = parse(ci); state.checkout = parse(co);
    const err = validateDates();
    state.checkin = s.checkin; state.checkout = s.checkout;
    return err;
  }, nightRate, seasonOf, waLink, reservationText, pixPayload, crc16 };
})();
