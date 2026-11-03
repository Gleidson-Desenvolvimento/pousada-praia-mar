/* =====================================================================
   POUSADA PRAIA MAR — CONFIGURAÇÃO
   ---------------------------------------------------------------------
   Este é o ÚNICO arquivo que você precisa editar para ajustar contatos,
   preços, quartos, temporadas, Pix e depoimentos. Tudo no site lê daqui.
   ===================================================================== */

window.PM_CONFIG = {
  pousada: {
    nome: "Pousada Praia Mar",
    cidade: "Caraíva",
    endereco: "Aldeia Xandó, R. Pedro Marcelino — Caraíva, Porto Seguro - BA, 45810-000",
    whatsapp: "5573991502165",          // só números, com DDI 55 + DDD (confirme se é WhatsApp)
    telefoneExibicao: "(73) 99150-2165",
    email: "praiamarpousadacaraiva@hotmail.com",
    instagram: "",                       // sem @ — vazio esconde o link
    /* Localização (Google Maps) */
    mapaLink: "https://maps.app.goo.gl/HbFNayxW56uMY3bz9",
    mapaLat: -16.8110084,
    mapaLng: -39.1469225,
    checkin: "14h",
    checkout: "11h",
  },

  /* ---------------- PIX (pagamento real, cai direto na sua conta) -------
     chave: CPF/CNPJ (só números), e-mail, telefone (+5573...) ou chave aleatória
     nomeRecebedor: até 25 caracteres, sem acentos
     cidadeRecebedor: até 15 caracteres, sem acentos                       */
  pix: {
    chave: "praiamarpousadacaraiva@hotmail.com", // TODO: confirme a sua chave Pix real
    nomeRecebedor: "POUSADA PRAIA MAR",
    cidadeRecebedor: "PORTO SEGURO",
    descontoPagamentoTotal: 0.05, // 5% off pagando 100% no Pix
  },

  /* ---------------- CARTÃO ---------------------------------------------
     Por segurança o site NÃO coleta número de cartão. Crie um link de
     pagamento (Mercado Pago, PagSeguro, InfinitePay, Stripe...) e cole aqui.
     Se ficar vazio, o hóspede escolhe "cartão" e a pousada envia o link
     pelo WhatsApp.                                                       */
  cartao: {
    linkPagamento: "",  // ex.: "https://mpago.la/xxxxxxx"
    parcelasMax: 6,
  },

  /* Percentual cobrado como sinal para garantir a reserva */
  sinal: 0.5,

  /* ---------------- RECEBIMENTO AUTOMÁTICO DAS RESERVAS ----------------
     Opcional: URL que recebe um POST JSON com cada reserva (Formspree,
     n8n, Make, Zapier, Google Apps Script...). Vazio = só WhatsApp.      */
  webhookUrl: "",

  /* ---------------- ACOMODAÇÕES ----------------------------------------
     preco = diária base (baixa temporada) para a ocupação padrão
     unidades = quantos quartos iguais a pousada tem desse tipo           */
  quartos: [
    {
      id: "suite-dossel",
      nome: "Suíte Dossel",
      resumo: "Cama queen com dossel de voil, paredes em tons de pôr do sol e luz natural entrando pela manhã.",
      descricao:
        "A suíte mais romântica da casa. Cama queen envolta em dossel de voil branco, paredes pintadas à mão com as cores do entardecer no rio, madeira de demolição e piso de cimento queimado fresquinho. Ideal para casais que vieram para desacelerar.",
      img: "assets/img/suite-dossel.jpg",
      galeria: ["assets/img/suite-dossel.jpg", "assets/img/jardim-redes.jpg", "assets/img/canoas-por-do-sol.jpg"],
      tag: "Para casais",
      capacidade: 2,
      area: "22 m²",
      preco: 420,
      unidades: 3,
      comodidades: ["Cama queen com dossel", "Ventilador de teto", "Frigobar", "Banheiro privativo", "Roupa de cama e banho", "Café da manhã"],
    },
    {
      id: "suite-jardim",
      nome: "Suíte Jardim",
      resumo: "Varanda com rede de frente para o jardim tropical, samambaias e o som dos passarinhos.",
      descricao:
        "Abre direto para o jardim, com varanda própria, rede baiana e samambaias penduradas. Perfeita para quem quer ler, cochilar depois da praia e ouvir os sabiás no fim da tarde.",
      img: "assets/img/jardim-redes.jpg",
      galeria: ["assets/img/jardim-redes.jpg", "assets/img/suite-dossel.jpg", "assets/img/aerea-rio-mar.jpg"],
      tag: "Mais pedida",
      capacidade: 3,
      area: "26 m²",
      preco: 490,
      unidades: 2,
      comodidades: ["Varanda com rede", "Cama casal + solteiro", "Ventilador de teto", "Frigobar", "Banheiro privativo", "Café da manhã"],
    },
    {
      id: "chale-mare",
      nome: "Chalé Maré",
      resumo: "Chalé com sala colorida, rede, sofás e ar-condicionado. Espaço de sobra para família e amigos.",
      descricao:
        "Um pedacinho de casa em Caraíva: sala com paredes anil e mostarda, sofás de madeira maciça, rede para a sesta, mesa para o café e quarto separado. Cabe a família inteira — e ainda sobra lugar para a canga molhada.",
      img: "assets/img/chale-sala.jpg",
      galeria: ["assets/img/chale-sala.jpg", "assets/img/suite-dossel.jpg", "assets/img/jardim-redes.jpg"],
      tag: "Família",
      capacidade: 4,
      area: "45 m²",
      preco: 690,
      unidades: 1,
      comodidades: ["Sala de estar com rede", "Quarto separado", "Ar-condicionado", "Frigobar", "Mesa de refeições", "Café da manhã"],
    },
  ],

  /* ---------------- TEMPORADAS ------------------------------------------
     Datas no formato "MM-DD". A primeira regra que bater vale.
     Para regras com ano específico (Carnaval) use "AAAA-MM-DD".         */
  temporadas: [
    { nome: "Réveillon", inicio: "12-27", fim: "01-02", multiplicador: 1.9, minNoites: 5 },
    { nome: "Carnaval 2027", inicio: "2027-02-05", fim: "2027-02-10", multiplicador: 1.6, minNoites: 4 },
    { nome: "Alta temporada", inicio: "12-15", fim: "02-28", multiplicador: 1.3, minNoites: 3 },
    { nome: "Férias de julho", inicio: "07-01", fim: "07-31", multiplicador: 1.2, minNoites: 2 },
  ],
  minNoitesPadrao: 2,
  hospedeExtra: 90, // por noite, acima de 2 pessoas

  /* Datas já ocupadas (reservas feitas por fora: Booking, Airbnb, telefone)
     { quarto: "suite-dossel", inicio: "2026-12-27", fim: "2027-01-02" }
     "fim" = dia do check-out                                              */
  bloqueios: [],

  extras: [
    { id: "transfer", nome: "Transfer aeroporto Porto Seguro ⇄ Nova Caraíva", preco: 380, tipo: "estadia", desc: "Ida e volta, carro com motorista local (até 4 pessoas)" },
    { id: "carroca", nome: "Carroça para as malas na chegada", preco: 40, tipo: "estadia", desc: "Da beira do rio até a porta do quarto" },
    { id: "barco", nome: "Passeio de barco até Corumbau", preco: 160, tipo: "pessoa", desc: "Saída pela manhã, retorno no fim da tarde" },
    { id: "romantica", nome: "Decoração romântica", preco: 150, tipo: "estadia", desc: "Flores, espumante e pétalas na chegada" },
  ],

  /* ---------------- AVALIAÇÕES DO GOOGLE --------------------------------
     nota/total: o que aparece no seu perfil do Google Maps.
     linkAvaliacoes: abre o perfil; linkAvaliar: link "Pedir avaliações"
     do Perfil da Empresa (opcional).                                     */
  google: {
    nota: 5.0,
    total: null,   // ex.: 23 — quantidade de avaliações (null esconde)
    linkAvaliacoes: "https://maps.app.goo.gl/HbFNayxW56uMY3bz9",
    linkAvaliar: "",
  },

  /* Avaliações em texto — copie do Google/Booking EXATAMENTE como o hóspede
     escreveu. Exemplo:
     { nome: "Ana Souza", estrelas: 5, quando: "março de 2026", fonte: "Google",
       texto: "Lugar maravilhoso..." }                                     */
  depoimentos: [],
};
