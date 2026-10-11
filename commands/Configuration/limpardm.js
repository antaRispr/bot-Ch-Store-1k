const Discord = require('discord.js')
const config = require('../../config.json')
module.exports = {
    name: "limpar-dm",
    description: `📱 [Limpe] todas as minhas mensagens no seu privado do bot`,
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {

        const dm = await interaction.member.createDM();
        await interaction.reply({ embeds: [ new Discord.EmbedBuilder()
            .setDescription(`✉️ | Estou limpando a DM, ${interaction.user} aguarde um pouco em quanto eu á limpo.`)
            .setColor(`ffff00`)]})
            
            setTimeout(() => {
                interaction.editReply({embeds: [
                    new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setDescription(`⏳ **Limpando nossa DM.**`)
                ]})
            }, 1000)
            setTimeout(() => {
                interaction.editReply({embeds: [
                    new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setDescription(`⏳ **Limpando nossa DM..**`)
                ]})
            }, 2000)
            setTimeout(() => {
                interaction.editReply({embeds: [
                    new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setDescription(`⏳ **Limpando nossa DM...**`)
                ]})
            }, 3000)
            setTimeout(() => {
              interaction.editReply({embeds: [
                new Discord.EmbedBuilder()
                .setColor(config.client.embed)
                  .setDescription(`⏳ **Limpando nossa DM.**`)
              ]})
          }, 4000)
          setTimeout(() => {
            interaction.editReply({embeds: [
                new Discord.EmbedBuilder()
                .setColor(config.client.embed)
                .setDescription(`⏳ **Limpando nossa DM..**`)
            ]})
        }, 5000)
        setTimeout(() => {
          interaction.editReply({embeds: [
            new Discord.EmbedBuilder()
            .setColor(config.client.embed)
              .setDescription(`⏳ **Limpando nossa DM...**`)
          ]})
      }, 6000)
        setTimeout(() => {
            interaction.editReply({embeds: [ new Discord.EmbedBuilder()
                .setDescription(`<:check~1:1558665037227499622> | Prontinho, ${interaction.user} a dm foi limpada com sucesso! `)
                .setColor(config.client.embed)]
            })}, 8000)
        const deleteMessages = await client.channels.cache
            .get(dm.id)
            .messages.fetch({ limit: 100 });
        await deleteMessages.map((msg) => {
            if (msg.author.bot) {
                msg.delete();
            }
        });
    }
}