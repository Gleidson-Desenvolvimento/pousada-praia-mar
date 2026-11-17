# Site — Pousada Praia Mar · Caraíva

Site estático (HTML + CSS + JavaScript puro). Não precisa de instalação nem de servidor especial.

## Ver o site
Abra `index.html` no navegador (duplo clique).
Para publicar, envie a pasta inteira para Netlify, Vercel, GitHub Pages, Hostinger etc.

## O que editar (tudo em `js/config.js`)
| O quê | Campo |
|---|---|
| WhatsApp, e-mail, Instagram, endereço, horários | `pousada` |
| **Chave Pix** (o dinheiro cai direto na sua conta) | `pix.chave` |
| Link de pagamento com cartão (Mercado Pago, InfinitePay…) | `cartao.linkPagamento` |
| Quartos (Baixú, Auê, Hahâu, Hayô, Maion, Angorró): fotos, camas, vista, capacidade, preço POR PESSOA (cobrado no mínimo por 2 pessoas: `minPagantes`) | `quartos` |
| Até quando os preços valem (datas depois aparecem como "consulte") | `tarifaValidaAte` |
| Galeria em abas (Jardim, Sala de estar, Caraíva) | `galeria` |
| Réveillon, janeiro, Carnaval… (preço por pessoa do período e mínimo de noites) | `temporadas` |
| Datas já vendidas por fora (Booking, Airbnb, telefone) | `bloqueios` |
| Extras (transfer, buggy, decoração…) | `extras` |
| Nota do Google e link do perfil | `google` |
| Avaliações em texto (copiadas do Google/Booking) | `depoimentos` |
| Endereço e mapa | `pousada.endereco`, `mapaLink`, `mapaLat`, `mapaLng` |
| Receber cada reserva por e-mail/planilha automaticamente | `webhookUrl` |

As políticas da reserva ficam em `js/app.js` (procure por “políticas”). As regras de cancelamento e de datas especiais aparecem só nessa seção; os prazos ficam em `cancelamentoDias`, no `js/config.js`.

## Como funciona a reserva
1. **Datas**: calendário com preço por dia, temporadas e mínimo de noites.
2. **Quarto**: mostra só o que cabe no grupo e está livre nas datas.
3. **Dados**: validação de nome, e-mail, WhatsApp e CPF + extras opcionais.
4. **Pagamento**: Pix com QR Code e copia-e-cola reais (sinal de 50% ou integral com 5% off),
   ou cartão via link de pagamento.
5. **Confirmação**: código da reserva, envio de tudo pelo WhatsApp da pousada,
   arquivo de calendário (.ics) e impressão/PDF.

> Importante: o site não tem banco de dados. A pousada recebe a reserva pelo **WhatsApp**
> (mensagem pronta com todos os dados) e, se configurar `webhookUrl`, também por e-mail ou planilha
> (ex.: Formspree, n8n, Google Apps Script). A disponibilidade vem de `quartos[].unidades` menos
> os `bloqueios` — atualize os bloqueios sempre que vender um quarto por outro canal.
> Para sincronizar automaticamente com Booking/Airbnb seria preciso um motor de reservas
> (channel manager) ou um pequeno back-end.

## Arquivos
- `index.html` — estrutura das seções
- `css/style.css` — identidade visual (anil, coral, sol, areia e o marrom do rio)
- `js/config.js` — **configurações**
- `js/booking.js` — fluxo de reserva, preços, disponibilidade, Pix
- `js/app.js` — menu, vídeo, galeria, quartos, atendimento “Maré”
- `assets/video/caraiva-loop.mp4` — vídeo do banner (≈30 s, em loop)
- `assets/img/quartos/` — fotos de cada quarto (álbuns da fotógrafa Alessia Beatrice)
- `assets/img/galeria/` — jardim e sala de estar

## Vídeo do banner
`assets/video/caraiva-loop.mp4` tem 38 s com cenas reais de Caraíva (encontro do rio com o mar, travessia, carroças, igrejinha, casinhas coloridas…), recortadas do vídeo do site de referência. As legendas que aparecem por cima estão em `js/app.js` (procure por `captions`).

## Logo
`assets/img/logo-praia-mar.jpg` — usada no menu, rodapé, chat, mapa e ícone da aba.

## SEO

Os textos de busca ficam direto nos arquivos, não no `config.js`:

- `index.html`: título, descrição, dados estruturados (bloco `application/ld+json`), perguntas frequentes e lista de quartos sem JavaScript.
- `como-chegar-a-caraiva.html`, `trancoso-a-caraiva.html` e `o-que-fazer-em-caraiva.html`: guias de viagem.
- `sitemap.xml` e `robots.txt`.

**Se mudar preço, regra ou quarto**, confira também `priceRange` e `numberOfRooms` no `index.html`, as perguntas frequentes e os guias.

**Ao trocar para um domínio próprio**, substitua `https://gleidson-desenvolvimento.github.io/pousada-praia-mar/` pelo endereço novo em todos os arquivos `.html`, no `sitemap.xml` e no `robots.txt`.
