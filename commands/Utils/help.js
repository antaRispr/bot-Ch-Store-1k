const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRow} = require('discord.js')
const config = require('../../config.json');

module.exports = {

name: 'help',
description: '📱 [Painel] Exibe meu painel de ajuda.',
type: ApplicationCommandType.ChatInput,

run: async (client, interaction, args) => {

    let embed = new EmbedBuilder()
    .setThumbnail(`${config.client.foto}`)
    .setTitle(`${config.client.title}`)
    .setDescription(`
    
    🔹 **Comandos Gerais:**
    🔹 | /help - Exibe está mensagem
    🔹 | /add-stock - Adicionar estoque aos produtos!
    🔹 | /criar - Adicionar novo produto a venda!
    🔹 | /set - Exibir produto para compra!
    🔹 | /gerenciar - Gerenciar um produto da loja
    🔹 | /limpardm - Limpa a sua dm
    
    🛡️ **Comandos de Moderação:**
    🔹 | /lock - Tranca o Canal Selecionado
    🔹 | /unlock - Destranca o Canal Selecionado
    
    ___Outros:___
    > **Ch store | Atendimento no servidor da loja.**`)
    .setColor(config.client.embed)

interaction.reply({ embeds: [embed]})
}
}