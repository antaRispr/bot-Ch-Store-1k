const Discord = require("discord.js")
const moment = require('moment-timezone')
const config = require('../../config.json');

module.exports = {
    name: "estatisticas", // Coloque o nome do comando
    description: "📱 [Estatísticas] Ver as estatísticas da loja do mês atual!", // Coloque a descrição do comando
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {

        const row = await dbJson.get(`${moment().utc().tz('America/Sao_Paulo').format('D/M/Y')}`);

        if (!row) return interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setTitle(`${config.client.title} | Estatísticas`)
                    .setDescription('Este mês a loja ainda não teve nenhuma venda!')
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