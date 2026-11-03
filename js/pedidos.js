/* =====================================================================
   POUSADA PRAIA MAR — Envio dos pedidos de reserva para o painel
   ---------------------------------------------------------------------
   Cada reserva concluída no site vira um documento em "pedidos_site" no
   Firebase do painel ADM. O visitante só consegue CRIAR o pedido; ler,
   aprovar ou apagar é só no painel (ver firestore.rules do painel).
   Se a internet falhar, o pedido fica guardado e é reenviado na próxima
   visita. O WhatsApp continua funcionando como antes.
   ===================================================================== */
(function () {
  "use strict";
  const C = window.PM_CONFIG;
  const PROJETO = C.nuvem?.projectId;
  const FILA_KEY = "pm_pedidos_pendentes";

  /* valor JS → formato da API REST do Firestore */
  const enc = (v) => {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === "string") return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
    return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
  };

  /* só os campos que as regras do Firebase aceitam */
  function pedidoDe(r) {
    const h = r.hospede || {};
    const s = (x) => String(x ?? "");
    return {
      codigo: r.codigo, status: r.status, quarto: r.quarto, quartoNome: r.quartoNome,
      inicio: r.inicio, fim: r.fim, noites: r.noites, adultos: r.adultos, criancas: r.criancas,
      extras: (r.extras || []).map((e) => ({ nome: s(e.nome), valor: e.valor })),
      pagamento: r.pagamento, total: r.total, pagoAgora: r.pagoAgora, restante: r.restante, desconto: r.desconto,
      hospede: { nome: s(h.nome), email: s(h.email), telefone: s(h.telefone), cpf: s(h.cpf), cidade: s(h.cidade), chegada: s(h.chegada), ocasiao: s(h.ocasiao), obs: s(h.obs) },
      criadaEm: r.criadaEm,
    };
  }

  /* grava o pedido; "ok" = gravado ou já existia, "recusado" = regras negaram, "falhou" = rede */
  async function gravar(pedido) {
    const base = `projects/${PROJETO}/databases/(default)/documents`;
    const corpo = {
      writes: [{
        update: { name: `${base}/pedidos_site/${pedido.codigo}`, fields: enc(pedido).mapValue.fields },
        currentDocument: { exists: false },
        updateTransforms: [{ fieldPath: "recebidoEm", setToServerValue: "REQUEST_TIME" }],
      }],
    };
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/${base}:commit`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo),
      });
      if (res.ok) return "ok";
      const erro = await res.json().catch(() => ({}));
      // documento com esse código já existe = já tinha sido enviado
      if (erro.error?.status === "ALREADY_EXISTS" || erro.error?.status === "FAILED_PRECONDITION") return "ok";
      console.warn("Pedido não aceito pelo Firebase:", erro.error?.message || res.status);
      return res.status >= 500 || res.status === 429 ? "falhou" : "recusado";
    } catch (e) {
      return "falhou";
    }
  }

  const lerFila = () => { try { return JSON.parse(localStorage.getItem(FILA_KEY)) || []; } catch { return []; } };
  const salvarFila = (f) => { try { f.length ? localStorage.setItem(FILA_KEY, JSON.stringify(f)) : localStorage.removeItem(FILA_KEY); } catch {} };

  async function enviar(r) {
    if (!PROJETO) return "desligado";
    const pedido = pedidoDe(r);
    const resultado = await gravar(pedido);
    if (resultado === "falhou") salvarFila([...lerFila().filter((p) => p.codigo !== pedido.codigo), pedido]);
    return resultado;
  }

  /* reenvia o que ficou pendente numa visita anterior */
  async function reenviarPendentes() {
    const fila = lerFila();
    if (!PROJETO || !fila.length) return;
    const resta = [];
    for (const p of fila) if ((await gravar(p)) === "falhou") resta.push(p);
    salvarFila(resta);
  }
  window.addEventListener("load", () => setTimeout(reenviarPendentes, 3000));

  window.PMPedidos = { enviar, reenviarPendentes, pedidoDe, enc };
})();
