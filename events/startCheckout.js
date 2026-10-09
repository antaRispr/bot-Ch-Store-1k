const D = require('discord.js');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const config = require('../config.json');
const locks = new Set();
const ephemeral = { ephemeral: true, allowedMentions: { parse: [] } };
const money = value => `R$ ${value.toFixed(2)}`;
function staff(i) { return i.member.roles.cache.has(config.sales.cargo_aprovar); }
function buttons(order) {
  const row = new D.ActionRowBuilder();
  if (order.status === 'pending') row.addComponents(
    new D.ButtonBuilder().setCustomId(`service:pix:${order.id}`).setLabel('PIX Copia e Cola').setEmoji('💳').setStyle(1),
    new D.ButtonBuilder().setCustomId(`service:qr:${order.id}`).setLabel('QR Code').setEmoji('📱').setStyle(1),
    new D.ButtonBuilder().setCustomId(`service:approve:${order.id}`).setLabel('Aprovar pagamento').setEmoji('✅').setStyle(3),
    new D.ButtonBuilder().setCustomId(`service:cancel:${order.id}`).setLabel('Cancelar pedido').setStyle(4)
  );
  if (order.status === 'paid') row.addComponents(new D.ButtonBuilder().setCustomId(`service:complete:${order.id}`).setLabel('Concluir atendimento').setEmoji('🏁').setStyle(3));
  return row.components.length ? [row] : [];
}
function panel(order) {
  const statuses = { pending: 'Aguardando pagamento', paid: 'Pagamento aprovado — atendimento aberto', completed: 'Serviço concluído', cancelled: 'Pedido cancelado' };
  return {
    embeds: [new D.EmbedBuilder().setColor(config.client.embed).setTitle(`${config.client.title} | Encomenda`)
      .addFields({ name: 'Serviço', value: order.name }, { name: 'Valor combinado para este pacote', value: money(order.price) },
        { name: 'Solicitação do cliente', value: order.details }, { name: 'Status', value: statuses[order.status] })
      .setDescription(order.status === 'pending' ? 'A equipe deve confirmar o escopo e o prazo antes do pagamento. Pague apenas após esse acordo. Confira o valor no PIX: o QR Code não tem valor fixo. Alterações fora do pacote podem exigir outro orçamento.' : 'Use este canal para conversar com a equipe e receber a entrega. Não envie tokens ou senhas.')
      .setFooter({ text: `Pedido ${order.id}` })],
    components: buttons(order), allowedMentions: { parse: [] }
  };
}
async function release(order) {
  const key = `service_active_${order.guild}_${order.customer}`;
  if (await db.get(key) === order.id) await db.delete(key);
}
async function refresh(i, order) {
  const message = await i.channel.messages.fetch(order.message);
  await message.edit(panel(order));
}
module.exports = {
  name: 'startCheckout',
  async execute(i) {
    try {
      if (i.isButton() && i.customId.startsWith('sales-')) {
        const product = await db.get(`product_${i.customId.slice(6)}`);
        if (!product) return i.reply({ ...ephemeral, content: 'Serviço não encontrado. Peça à equipe para publicar o painel novamente.' });
        const modal = new D.ModalBuilder().setCustomId(`service_request:${product.id}`).setTitle('Solicitar bot personalizado');
        modal.addComponents(new D.ActionRowBuilder().addComponents(new D.TextInputBuilder().setCustomId('details')
          .setLabel('O que você quer no seu bot?').setStyle(D.TextInputStyle.Paragraph).setRequired(true).setMinLength(10).setMaxLength(1000)
          .setPlaceholder('Tipo de bot, comandos, cores e funcionalidades. Não envie tokens ou senhas.')));
        return i.showModal(modal);
      }
      if (i.isModalSubmit() && i.customId.startsWith('service_request:')) {
        await i.deferReply(ephemeral);
        const key = `service_active_${i.guildId}_${i.user.id}`;
        if (locks.has(key)) return i.editReply('Seu pedido está sendo criado. Aguarde.');
        locks.add(key);
        let channel;
        try {
          const active = await db.get(key);
          if (active) {
            const existing = await db.get(`service_order_${active}`);
            if (existing && ['pending', 'paid'].includes(existing.status)) {
              const current = await i.guild.channels.fetch(existing.channel);
              if (current) return i.editReply(`Você já tem um pedido aberto em <#${existing.channel}>.`);
            }
            await db.delete(key);
          }
          const product = await db.get(`product_${i.customId.split(':')[1]}`);
          if (!product || !Number.isFinite(product.value) || product.value <= 0) return i.editReply('Serviço indisponível ou preço inválido. Avise a equipe.');
          if (!config.sales.categoria_carrinho || !config.sales.cargo_aprovar || !config.sales.logs_compras) return i.editReply('A equipe precisa configurar a categoria, o cargo de atendimento e o canal de registros.');
          const id = randomUUID();
          channel = await i.guild.channels.create({ name: `pedido-${i.user.id}`, type: D.ChannelType.GuildText, parent: config.sales.categoria_carrinho,
            permissionOverwrites: [
              { id: i.guildId, deny: [D.PermissionFlagsBits.ViewChannel] },
              { id: i.user.id, allow: [D.PermissionFlagsBits.ViewChannel, D.PermissionFlagsBits.SendMessages, D.PermissionFlagsBits.AttachFiles, D.PermissionFlagsBits.ReadMessageHistory] },
              { id: config.sales.cargo_aprovar, allow: [D.PermissionFlagsBits.ViewChannel, D.PermissionFlagsBits.SendMessages, D.PermissionFlagsBits.AttachFiles, D.PermissionFlagsBits.ReadMessageHistory] },
              { id: i.client.user.id, allow: [D.PermissionFlagsBits.ViewChannel, D.PermissionFlagsBits.SendMessages, D.PermissionFlagsBits.EmbedLinks, D.PermissionFlagsBits.AttachFiles, D.PermissionFlagsBits.ReadMessageHistory, D.PermissionFlagsBits.ManageChannels] }
            ] });
          const order = { id, guild: i.guildId, channel: channel.id, customer: i.user.id, product: product.id, name: product.name, price: product.value,
            details: i.fields.getTextInputValue('details'), status: 'pending', createdAt: Date.now() };
          const message = await channel.send(panel(order));
          order.message = message.id;
          await db.set(`service_order_${id}`, order);
          await db.set(key, id);
          await i.editReply(`✅ Pedido aberto em <#${channel.id}>. Combine o escopo e o prazo com a equipe antes de pagar.`);
        } catch (error) {
          // Remove only a newly created channel if no durable order was saved.
          if (channel && !await db.get(key)) await channel.delete().catch(() => {});
          throw error;
        } finally { locks.delete(key); }
        return;
      }
      if (!i.isButton() || !i.customId.startsWith('service:')) return;
      const [, action, id] = i.customId.split(':');
      const order = await db.get(`service_order_${id}`);
      if (!order || order.guild !== i.guildId || order.channel !== i.channelId) return i.reply({ ...ephemeral, content: 'Pedido não encontrado neste canal.' });
      const isStaff = staff(i);
      if (i.user.id !== order.customer && !isStaff) return i.reply({ ...ephemeral, content: 'Esse pedido pertence a outro cliente.' });
      if (['approve', 'complete'].includes(action) && !isStaff) return i.reply({ ...ephemeral, content: 'Somente a equipe autorizada pode aprovar pagamentos ou concluir serviços.' });
      if (action === 'pix' || action === 'qr') {
        if (order.status !== 'pending') return i.reply({ ...ephemeral, content: 'Esse pedido não está aguardando pagamento.' });
        if (action === 'qr') return i.reply({ ...ephemeral, content: `Informe ${money(order.price)} ao pagar. Aguarde a confirmação do escopo pela equipe.`, files: [new D.AttachmentBuilder(path.join(__dirname, '../public/pix.png'))] });
        return i.reply({ ...ephemeral, content: `💳 ${config.sales.banco.tipochave}: ${config.sales.banco.ChaveAleatória}\nValor: ${money(order.price)}\nPIX Copia e Cola:\n${config.sales.banco.copia_cola}\nAguarde a confirmação do escopo pela equipe antes de pagar.` });
      }
      await i.deferReply(ephemeral);
      if (locks.has(id)) return i.editReply('Este pedido está sendo atualizado. Aguarde.');
      locks.add(id);
      try {
        const current = await db.get(`service_order_${id}`);
        if (action === 'approve') {
          if (current.status !== 'pending') return i.editReply('Esse pedido já foi aprovado ou encerrado.');
          current.status = 'paid'; current.approvedBy = i.user.id; current.paidAt = Date.now();
          await db.set(`service_order_${id}`, current);
          await refresh(i, current);
          await i.editReply('✅ Pagamento aprovado. O canal continua aberto para atendimento e entrega.');
          if (config.sales.cargo_cliente) {
            try { const member = await i.guild.members.fetch(current.customer); await member.roles.add(config.sales.cargo_cliente); }
            catch (error) { console.error('Falha ao entregar cargo Cliente:', error.message); await i.followUp({ ...ephemeral, content: 'Pagamento registrado, mas não consegui entregar o cargo Cliente. Confira a hierarquia e Gerenciar cargos.' }); }
          }
          try {
            const logs = await i.guild.channels.fetch(config.sales.logs_compras);
            await logs.send({ content: `✅ Pedido ${id} aprovado por <@${i.user.id}>. Cliente: <@${current.customer}>. Serviço: ${current.name}. Valor: ${money(current.price)}. Atendimento: <#${current.channel}>.`, allowedMentions: { parse: [] } });
          } catch (error) { console.error('Falha no registro do pedido:', error.message); await i.followUp({ ...ephemeral, content: 'Pagamento registrado, mas o envio ao canal de registros falhou. Confira as permissões.' }); }
        } else if (action === 'cancel' || action === 'complete') {
          const expected = action === 'cancel' ? 'pending' : 'paid';
          if (current.status !== expected) return i.editReply('O estado atual não permite essa ação. Pedidos pagos só podem ser concluídos pela equipe.');
          // Lock customer messages while preserving the channel and its history.
          await i.channel.permissionOverwrites.edit(current.customer, { SendMessages: false, AttachFiles: false });
          current.status = action === 'cancel' ? 'cancelled' : 'completed'; current.closedAt = Date.now();
          await db.set(`service_order_${id}`, current);
          await release(current);
          await refresh(i, current);
          await i.editReply(action === 'cancel' ? 'Pedido cancelado. O canal foi preservado para consulta.' : 'Atendimento concluído. O canal foi preservado para consulta.');
        } else await i.editReply('Ação desconhecida.');
      } finally { locks.delete(id); }
    } catch (error) {
      console.error('Falha no pedido de serviço:', error.message);
      try {
        const content = 'Não consegui concluir esta ação. O pedido pode ter sido registrado; consulte o canal e os logs antes de repetir.';
        if (i.deferred) await i.editReply(content); else if (!i.replied) await i.reply({ ...ephemeral, content });
      } catch {}
    }
  }
};
