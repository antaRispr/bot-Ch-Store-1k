const Discord = require("discord.js")
const moment = require('moment-timezone')
const config = require('../../config.json');

module.exports = {
    name: "estatisticas", // Coloque o nome do comando
    description: "📱 [Estatísticas] Ver as estatísticas da loja do dia atual!", // Coloque a descrição do comando
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {

        const today = moment().tz('America/Sao_Paulo').format('D/M/Y');
        const orders = (await db.all()).filter(item => item.id.startsWith('service_order_') && item.value.guild === interaction.guildId && item.value.paidAt && moment(item.value.paidAt).tz('America/Sao_Paulo').format('D/M/Y') === today);
        const row = orders.length ? { pedidos: orders.length, compras: orders.reduce((total, item) => total + item.value.price, 0) } : null;

        if (!row) return interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setTitle(`${config.client.title} | Estatísticas`)
                    .setDescription('Hoje a loja ainda não teve nenhuma venda!')
            ]
        })

        return interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setTitle(`${config.client.title} | Estatísticas`)
                    .addFields(
                        { name: '✅ | Pedidos:', value: `${row.pedidos} compra(s) realizadas` },
                        { name: '💰 | Recebimentos:', value: `R$${row.compras.toFixed(2)}` }
                    )
            ]
        })
    }
}