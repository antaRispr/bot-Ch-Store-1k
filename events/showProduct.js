const Discord = require('discord.js')
const config = require('../config.json')

/*============================= | Create Product | =========================================*/
module.exports = {
    name: 'showProduct',
    async execute(interaction) {
        if (interaction.isSelectMenu() && interaction.customId.startsWith("show_product")) {
            if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply({
                content: `🔹 | ${interaction.user}, Você precisa da permissão \`ADMNISTRATOR\` para usar este comando!`,
                ephemeral: true,
            })

            const product_id = interaction.values[0];

            const row = await db.get(`product_${product_id}`);
            if (row.length < 1) return interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setTitle('Produto não encontrado!')
                        .setDescription('Este produto não foi encontrado no banco de dados!')
                        .setImage(`${config.client.banner}`)
                ]
            })

            const message = await interaction.channel.send({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setTitle(`${config.client.title} | Produto`)
                        .setThumbnail(`${config.client.foto}`)
                        .setImage(`${config.client.banner}`)
                      
                        .setDescription(`\`\`\`${row.body}\`\`\` \n🔹  | **Nome:** **${row.name}** \n💰 | **Preço:** **R$${row.value.toFixed(2)}** \n📦 | **Estoque:** **${row.stocks ? row.stocks.length : 0}**`)
                        
                ],
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`sales-${product_id}`)
                                .setStyle(3)
                                .setEmoji('🛒')
                                .setLabel('Comprar')
                        )
                ]
            })

            const data = {
                channelId: interaction.channelId,
                messageId: message.id
            }

            db.set(`product_${product_id}.channel`, data)

            return interaction.reply({ content: '✅ | Produto exibido com sucesso!', ephemeral: true })
        }
    }
}