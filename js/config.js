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
    mapaLink: "https://maps.google.com/?cid=456902039530879537&entry=gps&g_st=ac",
    mapaLat: -16.810558,
    mapaLng: -39.1470621,
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

  /* ---------------- PAINEL ADM (Firebase) ------------------------------
     Projeto do Firebase do painel: cada reserva concluída aparece lá em
     "pedidos_site". Vazio = não envia.                                    */
  nuvem: {
    projectId: "pousada-praia-mar",
  },

  /* ---------------- ACOMODAÇÕES ----------------------------------------
     preco = diária POR PESSOA, com café da manhã (vale até tarifaValidaAte)
             cobrada no mínimo por minPagantes pessoas (ver abaixo)
     unidades = quantos quartos iguais a pousada tem desse tipo           */
  quartos: [
    {
      id: "baixu",
      nome: "Suíte Baixú",
      resumo: "Suíte clara e fresca com cama queen, cama de solteiro e vista para o jardim.",
      descricao:
        "Clara, fresca e cheia de luz natural. A Baixú tem cama queen com mosquiteiro, uma cama de solteiro, janelas de madeira abertas para o jardim e banheiro em tons de azul.",
      img: "assets/img/quartos/baixu-1.jpg",
      galeria: ["assets/img/quartos/baixu-1.jpg", "assets/img/quartos/baixu-2.jpg", "assets/img/quartos/baixu-3.jpg", "assets/img/quartos/baixu-4.jpg", "assets/img/quartos/baixu-5.jpg", "assets/img/quartos/baixu-6.jpg"],
      tag: "Vista para o jardim",
      capacidade: 3,
      camas: "1 queen + 1 solteiro",
      vista: "Jardim",
      preco: 135,
      unidades: 1,
      comodidades: ["1 cama queen", "1 cama de solteiro", "Vista para o jardim", "Ar-condicionado", "Wi-Fi", "Café da manhã"],
    },
    {
      id: "aue",
      nome: "Suíte Auê",
      resumo: "A maior suíte da casa: cama king, 3 camas de solteiro e vista para o jardim.",
      descricao:
        "Espaçosa e cheia de cor, com paredes pintadas à mão nos tons do pôr do sol. Cama king com dossel, três camas de solteiro e vista para o jardim — perfeita para famílias e grupos de amigos.",
      img: "assets/img/quartos/aue-1.jpg",
      galeria: ["assets/img/quartos/aue-1.jpg", "assets/img/quartos/aue-2.jpg", "assets/img/quartos/aue-3.jpg", "assets/img/quartos/aue-4.jpg", "assets/img/quartos/aue-5.jpg", "assets/img/quartos/aue-6.jpg"],
      tag: "Família",
      capacidade: 5,
      camas: "1 king + 3 solteiro",
      vista: "Jardim",
      preco: 150,
      unidades: 1,
      comodidades: ["1 cama king", "3 camas de solteiro", "Vista para o jardim", "Ar-condicionado", "Wi-Fi", "Café da manhã"],
    },
    {
      id: "hahau",
      nome: "Suíte Hahâu",
      resumo: "Suíte para casal com cama queen com dossel e vista para a varanda.",
      descricao:
        "A suíte mais romântica da Praia Mar. Cama queen com dossel de voil, grafismos em tons de areia nas paredes e janela para a varanda com espreguiçadeiras.",
      img: "assets/img/quartos/hahau-1.jpg",
      galeria: ["assets/img/quartos/hahau-1.jpg", "assets/img/quartos/hahau-2.jpg", "assets/img/quartos/hahau-3.jpg", "assets/img/quartos/hahau-4.jpg", "assets/img/quartos/hahau-5.jpg", "assets/img/quartos/hahau-6.jpg"],
      tag: "Para casais",
      capacidade: 2,
      camas: "1 queen",
      vista: "Varanda",
      preco: 135,
      unidades: 1,
      comodidades: ["1 cama queen", "Vista para a varanda", "Ar-condicionado", "Wi-Fi", "Café da manhã"],
    },
    {
      id: "hayo",
      nome: "Suíte Hayô",
      resumo: "Cama queen, 3 camas de solteiro e vista para a varanda.",
      descricao:
        "Barrado verde-mar, luminárias de palha e espelho com moldura colorida. Cama queen com dossel, três camas de solteiro e vista para a varanda — espaço de sobra para a família toda.",
      img: "assets/img/quartos/hayo-1.jpg",
      galeria: ["assets/img/quartos/hayo-1.jpg", "assets/img/quartos/hayo-2.jpg", "assets/img/quartos/hayo-3.jpg", "assets/img/quartos/hayo-4.jpg", "assets/img/quartos/hayo-5.jpg", "assets/img/quartos/hayo-6.jpg"],
      tag: "Família",
      capacidade: 5,
      camas: "1 queen + 3 solteiro",
      vista: "Varanda",
      preco: 150,
      unidades: 1,
      comodidades: ["1 cama queen", "3 camas de solteiro", "Vista para a varanda", "Ar-condicionado", "Wi-Fi", "Café da manhã"],
    },
    {
      id: "maion",
      nome: "Quarto Maion",
      resumo: "Quarto aconchegante com cama de casal e cama de solteiro.",
      descricao:
        "Simples e aconchegante, com cama de casal, cama de solteiro, sofá listrado para descansar e janela de madeira deixando a brisa entrar.",
      img: "assets/img/quartos/maion-1.jpg",
      galeria: ["assets/img/quartos/maion-1.jpg", "assets/img/quartos/maion-2.jpg", "assets/img/quartos/maion-3.jpg", "assets/img/quartos/maion-4.jpg", "assets/img/quartos/maion-5.jpg"],
      tag: "",
      capacidade: 3,
      camas: "1 casal + 1 solteiro",
      vista: "",
      preco: 125,
      unidades: 1,
      comodidades: ["1 cama de casal", "1 cama de solteiro", "Wi-Fi", "Café da manhã"],
    },
    {
      id: "angoro",
      nome: "Suíte Angorró",
      resumo: "Cama king com dossel e 2 camas de solteiro.",
      descricao:
        "Luz suave, pratos de palha trançada na parede e cama king com dossel, além de duas camas de solteiro. Ótima para casal com filhos ou amigos viajando juntos.",
      img: "assets/img/quartos/angoro-1.jpg",
      galeria: ["assets/img/quartos/angoro-1.jpg", "assets/img/quartos/angoro-2.jpg", "assets/img/quartos/angoro-3.jpg", "assets/img/quartos/angoro-4.jpg", "assets/img/quartos/angoro-5.jpg", "assets/img/quartos/angoro-6.jpg"],
      tag: "",
      capacidade: 4,
      camas: "1 king + 2 solteiro",
      vista: "",
      preco: 135,
      unidades: 1,
      comodidades: ["1 cama king", "2 camas de solteiro", "Ar-condicionado", "Wi-Fi", "Café da manhã"],
    },
  ],

  /* ---------------- GALERIA (abas) ------------------------------------- */
  galeria: [
    {
      id: "jardim",
      titulo: "Jardim",
      texto: "Gramado e fresco para curtir a natureza e ficar à sombra de um longevo e lindo cajueiro.",
      fotos: [
        ["assets/img/galeria/jardim-11.jpg", "Varanda da pousada de frente para o jardim"],
        ["assets/img/galeria/jardim-3.jpg", "Gramado com espreguiçadeiras sob o céu azul"],
        ["assets/img/galeria/jardim-1.jpg", "Mesas de madeira na varanda coberta de palha"],
        ["assets/img/galeria/jardim-5.jpg", "Espreguiçadeiras entre as plantas do jardim"],
        ["assets/img/galeria/jardim-4.jpg", "Varanda com mesas compridas de madeira"],
        ["assets/img/galeria/jardim-2.jpg", "Jardim visto da varanda"],
        ["assets/img/jardim-redes.jpg", "Redes penduradas com samambaias no jardim"],
        ["assets/img/galeria/jardim-7.jpg", "Mesas coloridas na varanda"],
        ["assets/img/galeria/jardim-9.jpg", "Cadeiras de praia no gramado"],
        ["assets/img/galeria/jardim-6.jpg", "Placa Lava-pés entre as plantas"],
        ["assets/img/galeria/jardim-8.jpg", "Mesa e plantas na varanda"],
        ["assets/img/galeria/jardim-10.jpg", "Cachorro da pousada descansando na sombra"],
        ["assets/img/galeria/jardim-12.jpg", "Placa: que bom que você chegou"],
      ],
    },
    {
      id: "sala",
      titulo: "Sala de estar",
      texto: "Rede e sofás para ficar à vontade.",
      fotos: [
        ["assets/img/galeria/sala-1.jpg", "Sala de estar com rede, sofás e parede amarela"],
        ["assets/img/galeria/sala-3.jpg", "Sala com cadeiras de fio e parede pintada com folhagens"],
        ["assets/img/chale-sala.jpg", "Sofá de madeira, rede azul e mesa posta"],
        ["assets/img/galeria/sala-2.jpg", "Aparador de madeira e artesanato na sala"],
        ["assets/img/galeria/sala-4.jpg", "Sofá com almofadas e janela de madeira"],
      ],
    },
    {
      id: "caraiva",
      titulo: "Caraíva",
      texto: "A vila entre o rio e o mar, a poucos passos da pousada.",
      fotos: [
        ["assets/img/aerea-rio-mar.jpg", "Vista aérea do encontro do rio com o mar em Caraíva"],
        ["assets/img/canoas-por-do-sol.jpg", "Canoas coloridas no Rio Caraíva ao pôr do sol"],
      ],
    },
  ],

  /* ---------------- TARIFA EM VIGOR -------------------------------------
     O preço de cada quarto (acima) vale para as noites até esta data
     (inclusive). Depois dela, só têm preço as noites que estiverem dentro
     de alguma TEMPORADA (abaixo). Noites sem preço aparecem como "—" no
     calendário e o hóspede é levado ao WhatsApp.                          */
  tarifaValidaAte: "2026-12-26",

  /* Cobrança mínima da tarifa dos quartos: o quarto paga no mínimo por
     esta quantidade de pessoas. Com 2: Maion = R$ 250 para 1 ou 2 pessoas
     e + R$ 125 a partir da 3ª. Não vale para as temporadas (a não ser que
     a temporada tenha minPagantes próprio).                              */
  minPagantes: 2,

  /* NOVA TARIFA — a partir de "inicio" (inclusive), sem data de fim, cada
     quarto passa a ter este valor POR PESSOA (com a cobrança mínima de
     minPagantes). As temporadas abaixo continuam valendo por cima dela.
     150 = R$ 300 o casal (+150 por pessoa a partir da 3ª)
     200 = R$ 400 o casal (+200 por pessoa a partir da 3ª)               */
  novaTarifa: {
    inicio: "2027-02-01",
    precos: { maion: 150, baixu: 150, hahau: 150, angoro: 150, aue: 200, hayo: 200 },
  },

  /* Crianças com até esta idade (inclusive) NÃO pagam diária.
     Elas continuam contando na capacidade do quarto (ocupam cama).       */
  criancaGratisAte: 10,

  /* Prazo para cancelar com devolução integral, contado da confirmação do
     pagamento. Datas especiais usam cancelamentoDias da temporada.        */
  cancelamentoDias: 7,

  /* TEMPORADAS — períodos com preço próprio.
     inicio / fim = primeira e ÚLTIMA NOITE do período ("AAAA-MM-DD").
     preco      = diária POR PESSOA com café, igual para todos os quartos
     (ou use multiplicador: 1.5 para aplicar sobre o preço de cada quarto)
     minNoites  = estadia mínima quando a reserva pega alguma noite do período
     cancelamentoDias = prazo de cancelamento gratuito nessas datas especiais
     minPagantes = (opcional) cobrança mínima de pessoas nesse período     */
  temporadas: [
    { nome: "Réveillon", inicio: "2026-12-27", fim: "2027-01-08", preco: 1300, minNoites: 3, cancelamentoDias: 3 },
    { nome: "Janeiro", inicio: "2027-01-09", fim: "2027-01-31", preco: 500, cancelamentoDias: 3 },
    // Carnaval: R$ 1.100 o casal (550 por pessoa, mínimo de 2), + R$ 550 a partir da 3ª pessoa
    { nome: "Carnaval", inicio: "2027-02-04", fim: "2027-02-09", preco: 550, minPagantes: 2, minNoites: 3, cancelamentoDias: 3 },
  ],
  minNoitesPadrao: 1,

  /* Datas já ocupadas (reservas feitas por fora: Booking, Airbnb, telefone)
     { quarto: "baixu", inicio: "2026-12-27", fim: "2027-01-02" }
     "fim" = dia do check-out                                              */
  bloqueios: [],

  extras: [
    { id: "transfer", nome: "Transfer aeroporto Porto Seguro ⇄ Nova Caraíva", preco: 1100, tipo: "estadia", desc: "Ida e volta, carro com motorista local (até 4 pessoas)" },
    { id: "buggy", nome: "Passeio de buggy até Corumbau", preco: 500, tipo: "estadia", desc: "Valor por passeio, para até 4 pessoas" },
    { id: "romantica", nome: "Decoração romântica", preco: 150, tipo: "estadia", desc: "Flores, espumante e pétalas na chegada" },
  ],

  /* ---------------- AVALIAÇÕES DO GOOGLE --------------------------------
     nota/total: o que aparece no seu perfil do Google Maps.
     linkAvaliacoes: abre o perfil; linkAvaliar: link "Pedir avaliações"
     do Perfil da Empresa (opcional).                                     */
  google: {
    nota: 5.0,
    total: null,   // ex.: 23 — quantidade de avaliações (null esconde)
    linkAvaliacoes: "https://maps.google.com/?cid=456902039530879537&entry=gps&g_st=ac",
    linkAvaliar: "",
  },

  /* Avaliações em texto — copie do Google/Booking EXATAMENTE como o hóspede
     escreveu. Exemplo:
     { nome: "Ana Souza", estrelas: 5, quando: "março de 2026", fonte: "Google",
       texto: "Lugar maravilhoso..." }                                     */
  depoimentos: [],
};
