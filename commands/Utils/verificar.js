const Discord = require("discord.js")
const { QuickDB } = require("quick.db")
const config = require('../../config.json')
const db = new QuickDB()

module.exports = {
  name: "verificação", // Coloque o nome do comando
  description: "📱 [Verificação] Ative o sistema de verificação.", // Coloque a descrição do comando
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
        name: "cargo_verificado",
        description: "Mencione um cargo para o membro receber após se verificar.",
        type: Discord.ApplicationCommandOptionType.Role,
        required: true,
    },
    {
        name: "canal",
        description: "Mencione um canal de texto.",
        type: Discord.ApplicationCommandOptionType.Channel,
        required: false,
    }
],

  run: async (client, interaction) => {

    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
        interaction.reply(`Olá ${interaction.user}, você não possui permissão para utilizar este comando.`)
    } else {
        let canal = interaction.options.getChannel("canal");
        if (!canal) canal = interaction.channel;

        let cargo = interaction.options.getRole("cargo_verificado");
        await db.set(`cargo_verificação_${interaction.guild.id}`, cargo.id);

        let embed_ephemeral = new Discord.EmbedBuilder()
        .setDescription(`Olá ${interaction.user}, o sistema foi ativado no canal ${canal} com sucesso.`);

        let embed_verificacao = new Discord.EmbedBuilder()
        .setTitle(`${config.client.title}`)
        .setThumbnail(`${config.client.foto}`)
        .setDescription(`> Nosso sistema de verificação foi feito com o intuito de evitar \n> robôs no nosso servidor.\n**Como funciona?**\n・ Para ter acesso ao nosso servidor você deverá passar por uma \n**Verificação** que é feita por nossa Bot Automático, para realizar a verificação clique no botão abaixo.`);

        let botao = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
            .setCustomId("verificar")
            .setEmoji({ id: '1558665037227499622' })
            .setLabel("Verifique-se")
            .setStyle(Discord.ButtonStyle.Primary)
        );

        interaction.reply({ embeds: [embed_ephemeral], ephemeral: true }).then( () => {
            canal.send({ embeds: [embed_verificacao], components: [botao] })
        })
    }


    
  }
}