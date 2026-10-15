const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const e = require('./emojis');

const templates = Object.freeze({
  loja: {
    label: 'Vitrine da loja', emoji: e.carrinho,
    title: `${e.carrinho} CH STORE • LOJA OFICIAL`,
    description: [
      '**Bem-vindo à CH Store!** Seu próximo projeto começa aqui.',
      '',
      'Explore nossas soluções digitais, desenvolvidas para unir **qualidade, praticidade e um visual profissional**. Nossa equipe acompanha cada pedido, do primeiro contato até a entrega.',
      '',
      `${e.carrinho} **Como comprar**`,
      '• Confira os serviços disponíveis no catálogo do servidor.',
      '• Escolha a opção ideal e abra seu pedido.',
      '• Combine os detalhes e receba as instruções para o PIX.',
      '• Envie o comprovante e aguarde a **aprovação manual da equipe**.',
      '',
      '**Importante:** prazos e condições são informados antes da confirmação. Nunca envie pagamentos sem conferir as instruções oficiais.',
    ].join('\n'),
    footer: 'CH Store • Atendimento e confiança em cada pedido',
  },
  parcerias: {
    label: 'Parcerias', emoji: e.parcerias,
    title: `${e.parcerias} CH STORE • PARCERIAS`,
    description: [
      '**Vamos crescer juntos?**',
      '',
      'A CH Store está aberta a parcerias com comunidades, criadores e projetos que valorizem **profissionalismo, transparência e colaboração**.',
      '',
      `${e.parcerias} **O que buscamos**`,
      '• Comunidades ativas e bem administradas.',
      '• Projetos com propostas claras e público compatível.',
      '• Divulgação responsável e benefícios reais para ambos os lados.',
      '',
      '**Como propor uma parceria:** entre em contato com nossa equipe, apresente seu servidor ou projeto e explique sua proposta. Cada solicitação será avaliada individualmente.',
      '',
      '✨ **Boas conexões constroem grandes resultados.**',
    ].join('\n'),
    footer: 'CH Store • Conexões que impulsionam projetos',
  },
  novidades: {
    label: 'Novidades e lançamentos', emoji: e.foguete,
    title: `${e.foguete} CH STORE • NOVIDADES`,
    description: [
      '**O próximo nível está chegando!**',
      '',
      'Este é o espaço oficial para acompanhar **lançamentos, melhorias, atualizações e novidades** da CH Store.',
      '',
      `${e.foguete} **Fique por dentro**`,
      '• Novos bots, serviços e funcionalidades.',
      '• Melhorias na experiência de compra e atendimento.',
      '• Comunicados importantes sobre produtos e manutenção.',
      '• Campanhas especiais, quando anunciadas pela equipe.',
      '',
      '**Acompanhe este canal** para não perder os próximos anúncios. Informações oficiais serão publicadas aqui pela administração.',
    ].join('\n'),
    footer: 'CH Store • Evoluindo com você',
  },
  configuracoes: {
    label: 'Informações e configurações', emoji: e.configuracoes,
    title: `${e.configuracoes} CH STORE • CENTRAL DE INFORMAÇÕES`,
    description: [
      '**Tudo organizado para uma experiência simples e segura.**',
      '',
      'Use os canais oficiais da CH Store para consultar produtos, acompanhar pedidos e solicitar suporte.',
      '',
      `${e.configuracoes} **Orientações importantes**`,
      '• Consulte o catálogo antes de abrir um pedido.',
      '• Informe sua necessidade com clareza para agilizar o atendimento.',
      '• Pagamentos via PIX são **verificados manualmente** pela equipe.',
      '• Guarde o comprovante e acompanhe as atualizações do seu atendimento.',
      '• Nunca compartilhe senhas, tokens ou códigos privados em canais públicos.',
      '',
      '**Precisa de ajuda?** Procure os canais de suporte ou entre em contato com a administração.',
    ].join('\n'),
    footer: 'CH Store • Organização, segurança e suporte',
  },
});

function makeEmbed(key) {
  const template = templates[key];
  if (!template) throw new Error('Template desconhecido');
  return new EmbedBuilder()
    .setColor(config.client.embed || '#313338')
    .setTitle(template.title)
    .setDescription(template.description)
    .setFooter({ text: template.footer })
    .setTimestamp();
}

module.exports = { templates, makeEmbed };
