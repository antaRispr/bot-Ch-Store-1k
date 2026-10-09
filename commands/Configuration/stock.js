const Discord = require("discord.js")
const config = require('../../config.json')

module.exports = {
    name: "add-stock", // Coloque o nome do comando
    description: "📱 [Adicionar] estoque aos produtos!", // Coloque a descrição do comando
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply({
            content: `🔹 | ${interaction.user}, Você precisa da permissão \`ADMNISTRATOR\` para usar este comando!`,
            ephemeral: true,
        })

        return interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setTitle('Adicionar estoque')
                    .setDescription('Clique no botão abaixo para adicionar novos estoque aos produtos!')
            ],
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('addstockproducts')
                            .setEmoji('➕')
                            .setLabel('Adicionar estoque')
                            .setStyle(3)
                    )
            ]
        })
    }
}