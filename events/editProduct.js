const Discord = require('discord.js');
const config = require('../config.json');

/*============================= | Create Product | =========================================*/
module.exports = {
    name: 'editProduct',
    async execute(interaction) {
        if (interaction.isSelectMenu() && interaction.customId.startsWith("edit_product")) {
            if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply({
                content: `🔹 | ${interaction.user}, Você precisa da permissão \`ADMNISTRATOR\` para usar este comando!`,
                ephemeral: true,
            })

            const product_id = interaction.values[0];

            var row = await db.get(`product_${product_id}`);
            if (!row) return interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setTitle('Produto não encontrado!')
                        .setDescription('Este produto não foi encontrado no banco de dados!')
                ]
            })

            interaction.update({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setTitle(`${config.client.title} | Gerenciar Produto`)
                        .setThumbnail(`${config.client.foto}`)
                        .setDescription(`Você está editando um produto. 
                        
                        🆔 | **Id do produto:** ${row.id}`)
                        
                ],
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('edit_name')
                                .setLabel('Nome')
                                .setEmoji("🏷️")
                                .setStyle(3),
                            new Discord.ButtonBuilder()
                                .setCustomId('edit_description')
                                .setLabel('Descrição')
                                .setEmoji("📝")
                                .setStyle(3),
                            new Discord.ButtonBuilder()
                                .setCustomId('edit_value')
                                .setLabel('Preço')
                                .setEmoji("💰")
                                .setStyle(3),
                            new Discord.ButtonBuilder()
                                .setCustomId('delete_product')
                                .setLabel('Deletar')
                                .setEmoji("🗑️")
                                .setStyle(4),
                        ),
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('closed_edit_product')
                                .setLabel('Fechar')
                                .setEmoji("❌")
                                .setStyle(4),
                        )
                ]
            }).then(msg => {
                const filter = i => i.member.id === interaction.user.id;
                const collector = msg.createMessageComponentCollector({ filter });
                collector.on('collect', async (interaction2) => {
                    if (interaction2.customId === "edit_name") {
                        const msg = await interaction2.reply('🔹  | Digite qual o nome você que deseja colocar!')
                        const collectorName = interaction2.channel.createMessageCollector();
                        collectorName.on('collect', (interactionName) => {
                            db.set(`product_${row.id}.name`, `${interactionName.content}`)
                            interaction2.editReply(`<:check~1:1558665037227499622> | Nome alterado com sucesso!`).then(m => { setTimeout(() => { m.delete() }, 1000) })
                            interactionName.delete();
                            collectorName.stop();
                        });
                    } else if (interaction2.customId === "edit_description") {
                        const msg = await interaction2.reply('Digite qual a descrição que você deseja colocar!')
                        const collectorDescription = interaction2.channel.createMessageCollector();
                        collectorDescription.on('collect', (interactionName) => {
                            db.set(`product_${row.id}.body`, `${interactionName.content}`)
                            interaction2.editReply(`<:check~1:1558665037227499622> | Descrição alterada com sucesso!`).then(m => { setTimeout(() => { m.delete() }, 1000) })
                            interactionName.delete();
                            collectorDescription.stop()
                        });
                    } else if (interaction2.customId === "edit_value") {
                        const msg = await interaction2.reply('🔹  | Digite qual o valor que você deseja colocar!')
                        const collectorValue = interaction2.channel.createMessageCollector();
                        collectorValue.on('collect', (interactionName) => {
                            db.set(`product_${row.id}.value`, parseFloat(interactionName.content))
                            interaction2.editReply(`<:check~1:1558665037227499622> | Valor alterado com sucesso!`).then(m => { setTimeout(() => { m.delete() }, 1000) })
                            interactionName.delete();
                            collectorValue.stop()
                        });
                    } else if (interaction2.customId === "delete_product") {
                        interaction.deleteReply();
                        db.delete(`product_${row.id}`);
                    } else if (interaction2.customId === "closed_edit_product") {
                        collector.stop();
                    }
                })

                collector.on('end', collected => {
                    interaction.deleteReply();
                })
            })
        }
    }
}