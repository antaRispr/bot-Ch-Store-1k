const Discord = require('discord.js');
const { templates, makeEmbed } = require('../../templates');

module.exports = {
  name: 'template',
  description: 'Publica um painel profissional da CH Store no canal selecionado.',
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'modelo',
      description: 'Escolha o modelo de mensagem.',
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
      choices: Object.entries(templates).map(([value, t]) => ({ name: t.label, value })),
    },
    {
      name: 'canal',
      description: 'Canal onde o painel será publicado (padrão: canal atual).',
      type: Discord.ApplicationCommandOptionType.Channel,
      required: false,
      channel_types: [Discord.ChannelType.GuildText, Discord.ChannelType.GuildAnnouncement],
    },
  ],
  run: async (client, interaction) => {
    if (!interaction.inGuild() || !interaction.memberPermissions?.has(Discord.PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Você precisa da permissão **Gerenciar Servidor** para publicar templates.', ephemeral: true });
    }
    const key = interaction.options.getString('modelo');
    if (!Object.hasOwn(templates, key)) return interaction.reply({ content: 'Modelo inválido.', ephemeral: true });
    const channel = interaction.options.getChannel('canal') || interaction.channel;
    if (!channel || !channel.isTextBased() || !channel.send) return interaction.reply({ content: 'Selecione um canal de texto válido.', ephemeral: true });
    const botMember = await interaction.guild.members.fetchMe();
    const permissions = channel.permissionsFor(botMember);
    if (!permissions?.has([Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages, Discord.PermissionFlagsBits.EmbedLinks])) {
      return interaction.reply({ content: 'Preciso das permissões **Ver Canal**, **Enviar Mensagens** e **Inserir Links** nesse canal.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      await channel.send({ embeds: [makeEmbed(key)], allowedMentions: { parse: [] } });
      await interaction.editReply(`Template **${templates[key].label}** publicado em ${channel}.`);
    } catch (err) {
      console.error('Erro ao publicar template:', err);
      await interaction.editReply('Não consegui publicar o template. Confira as permissões e tente novamente.');
    }
  },
};
