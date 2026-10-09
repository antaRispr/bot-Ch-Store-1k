const Discord = require("discord.js")
const config = require('../../config.json')
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ApplicationCommandType, SelectMenuBuilder } = require("discord.js")

module.exports = {

    name: "tempo",
    description: "📱 [Bot] Permite ver o tempo de funcionamento do Bot",
    permission: "None",
    dm: false,

    async run(client, message, args) {

        let days = Math.floor((client.uptime / (1000 * 60 * 60 * 24)) % 60).toString();
        let hours = Math.floor((client.uptime / (1000 * 60 * 60)) % 60).toString();
        let minuts = Math.floor((client.uptime / (1000 * 60)) % 60).toString();
        let seconds = Math.floor((client.uptime / 1000) % 60).toString();

        let Embed = new Discord.EmbedBuilder()
        .setColor(config.client.embed)
        .setTitle("**⏳‎  -  Tempo de funcionamento do seu bot**")
        .setThumbnail(client.user.displayAvatarURL({dynamic: true}))
        .setDescription("*O seu Bot tem estado a funcionar desde...*")
        .setTimestamp()
        .addFields({name: `Dias : `, value: `${days}`})
        .addFields({name: `Horas : `, value: `${hours}`})
        .addFields({name: `Minutos : `, value: `${minuts}`})
        .addFields({name: `Segundos : `, value: `${seconds}`})
        .setFooter({text: client.user.username, iconURL: client.user.displayAvatarURL({ ephemeral: true})})

        await message.reply({embeds: [Embed], ephemeral: true})
    }
};