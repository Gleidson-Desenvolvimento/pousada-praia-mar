/* =====================================================================
   POUSADA PRAIA MAR — Datas ocupadas vindas do painel ADM
   ---------------------------------------------------------------------
   O painel publica no Firebase (publico/ocupacao) só o quarto e as datas
   de cada reserva ativa e de cada pedido aguardando aprovação — nenhum
   dado de hóspede. O calendário da reserva soma essas datas às de
   "bloqueios" do config.js. Sem internet, o site segue funcionando só
   com os bloqueios do config.js.
   ===================================================================== */
(function () {
  "use strict";
  const C = window.PM_CONFIG;
  const PROJETO = C.nuvem?.projectId;

  /* formato da API REST do Firestore → valor JS */
  const dec = (v) =>
    "stringValue" in v ? v.stringValue :
    "integerValue" in v ? Number(v.integerValue) :
    "doubleValue" in v ? v.doubleValue :
    "booleanValue" in v ? v.booleanValue :
    "arrayValue" in v ? (v.arrayValue.values || []).map(dec) :
    "mapValue" in v ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)])) :
    null;

  const O = { lista: [], atualizar };

  /* busca as datas ocupadas; avisa o calendário com o evento "pm:ocupacao" */
  async function atualizar() {
    if (!PROJETO) return;
    try {
      const base = `https://firestore.googleapis.com/v1/projects/${PROJETO}/databases/(default)/documents/publico/`;
      const ler = (doc) => fetch(base + doc, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const [doc, ext] = await Promise.all([ler("ocupacao"), ler("externo")]); // externo = datas do Booking
      if (!doc) return;
      const ocupado = dec({ mapValue: { fields: doc.fields || {} } }).ocupado || [];
      const externo = ext ? dec({ mapValue: { fields: ext.fields || {} } }).bloqueios || [] : [];
      O.lista = [...ocupado, ...externo].filter((o) => o && o.quarto && /^\d{4}-\d{2}-\d{2}$/.test(o.inicio) && /^\d{4}-\d{2}-\d{2}$/.test(o.fim));
      document.dispatchEvent(new CustomEvent("pm:ocupacao"));
    } catch (e) { /* sem rede: fica com o que já tinha */ }
  }

  window.PMOcupacao = O;
  atualizar();
})();
