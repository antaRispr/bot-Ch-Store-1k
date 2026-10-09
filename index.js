const Discord = require("discord.js");
const { joinVoiceChannel } = require('@discordjs/voice');
const sourcebin = require('sourcebin');
const config = require("./config.json");
const fs = require('fs');
const { QuickDB } = require("quick.db");
const { JsonDatabase } = require("wio.db");

// Database
global.db = new QuickDB();
global.dbJson = new JsonDatabase({
    databasePath: "./databases/myJsonDatabase.json",
});
//--

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessageReactions,
        '32767'
    ]
});

module.exports = client

client.on('interactionCreate', (interaction) => {

    if (interaction.type === Discord.InteractionType.ApplicationCommand) {

        const cmd = client.slashCommands.get(interaction.commandName);

        if (!cmd) return interaction.reply({ content: `Erro, este comando não existe`, ephemeral: true });

        interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);

        cmd.run(client, interaction)

    }
});

client.on("ready", () => {
  console.log(`💜 | Logado em: ${client.user.username}!`)
})

/*============================= | Bot Entrar Em Call | =========================================*/

client.on("ready", () => {
  let canal = client.channels.cache.get(`${config.client.canaldevoz}`) // coloque o ID do canal de voz
  if (!canal) return console.log("❌ Não foi possível entrar no canal de voz.")
  if (canal.type !== Discord.ChannelType.GuildVoice) return console.log(`❌ Não foi possível entrar no canal [ ${canal.name} ].`)

  try {

    joinVoiceChannel({
      channelId: canal.id, // ID do canal de voz
      guildId: canal.guild.id, // ID do servidor
      adapterCreator: canal.guild.voiceAdapterCreator,
    })
    console.log(`💔 Entrei no canal de voz [ ${canal.name} ] com sucesso!`)

  } catch(e) {
    console.log(`💔 Não foi possível entrar no canal [ ${canal.name} ].`)
  }

})

/*============================= | Anti OFF | =========================================*/

process.on('multipleResolves', (type, reason, promise) => {
 return;
});
process.on('unhandRejection', (reason, promise) => {
 return;
});
process.on('uncaughtException', (error, origin) => {
  return;
});
process.on('uncaughtException', (error, origin) => {
  return;
});


/*============================= | STATUS RICH PRESENCE | =========================================*/

let status = [
  (config.client.title),
  `Em desenvolvimento`,
],
i = 0

setInterval(() =>{
client.user.setActivity(`${status[i++ % status.length]}`, { 
})
}, 4000);


/*============================= | Import handler | =========================================*/

client.slashCommands = new Discord.Collection()

require('./handler')(client)

const botToken = process.env.DISCORD_BOT_TOKEN || config.client.token;
if (!botToken) {
  console.error('Configure DISCORD_BOT_TOKEN para iniciar a Ch store.');
  process.exit(1);
}
client.login(botToken)

client.on('interactionCreate', require('./events/createProduct').execute)
client.on('interactionCreate', require('./events/showProduct').execute)
client.on('interactionCreate', require('./events/startCheckout').execute)
client.on('interactionCreate', require('./events/addStockProducts').execute)
client.on('interactionCreate', require('./events/editProduct').execute)

/*============================= | UPDATE PRODUCT | =========================================*/
setInterval(async () => {
    var row = await db.all();
    row = row.filter(p => p.id.startsWith('product_'));

    row.forEach(async product => {
        if (!product.value.channel) return;

        const channel = await client.channels.cache.get(product.value.channel.channelId)
        if (!channel) return;
        const message = await channel.messages.fetch(product.value.channel.messageId).catch(() => null);
        if (!message) return;

        try {
            message.edit({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setImage(`${config.client.banner}`)
                        .setTitle(product.value.name)
                        .setDescription(`${product.value.body}\n\n**R$ ${product.value.value.toFixed(2)}**`)
                        
                ],
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`sales-${product.value.id}`)
                                .setStyle(3)
                                .setEmoji('🛒')
                                .setLabel('Solicitar serviço')
                        )
                ]
            })
        } catch (error) {
            console.error("Falha ao atualizar painel de serviço:", error.message);
        }
    });
}, 60000);




// SISTEMA DE TICKETS

client.on("interactionCreate", (interaction) => {
    if (interaction.isSelectMenu()) {
      if (interaction.customId === "painel_ticket") {
        let opc = interaction.values[0]
        if (opc === "opc1") {
  
          ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          // Nova opção
  
          let nome = `🛠️・Suporte`;
          let categoria = config.client.categoria_tickets // Coloque o ID da categoria
  
          if (!interaction.guild.channels.cache.get(categoria)) categoria = null;
  
          if (interaction.guild.channels.cache.find(c => c.name === nome)) {
            interaction.reply({ content: `❌ Você já possui um ticket aberto em ${interaction.guild.channels.cache.find(c => c.name === nome)}!`, ephemeral: true })
          } else {
            interaction.guild.channels.create({
            name: nome,
            type: Discord.ChannelType.GuildText,
            parent: categoria,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [
                  Discord.PermissionFlagsBits.ViewChannel
                ]
              },
              {
                id: interaction.user.id,
                allow: [
                  Discord.PermissionFlagsBits.ViewChannel,
                  Discord.PermissionFlagsBits.SendMessages,
                  Discord.PermissionFlagsBits.AttachFiles,
                  Discord.PermissionFlagsBits.EmbedLinks,
                  Discord.PermissionFlagsBits.AddReactions
                ]
              }
            ]
          }).then( (ch) => {
            interaction.reply({ content: `✅ Olá ${interaction.user}, seu ticket foi aberto em ${ch}!`, ephemeral: true })
            let embed = new Discord.EmbedBuilder()
            .setColor("Random")
            .setDescription(`Olá ${interaction.user}, Você abriu o ticket de Suporte, para nos ajudar ja me fale qual é o problema.`);
            let botao = new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
            .setCustomId("fechar_ticket")
            .setEmoji("🔒")
            .setStyle(Discord.ButtonStyle.Danger)
            );
  
            ch.send({ embeds: [embed], components: [botao] }).then( m => { 
              m.pin()
             })
          })
          }
          
        } else if (opc === "opc2") {
  
          ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          // Nova opção
  
          let nome = `❓・Duvida`;
          let categoria = config.client.categoria_tickets // Coloque o ID da categoria
  
          if (!interaction.guild.channels.cache.get(categoria)) categoria = null;
  
          if (interaction.guild.channels.cache.find(c => c.name === nome)) {
            interaction.reply({ content: `❌ Você já possui um ticket aberto em ${interaction.guild.channels.cache.find(c => c.name === nome)}!`, ephemeral: true })
          } else {
            interaction.guild.channels.create({
            name: nome,
            type: Discord.ChannelType.GuildText,
            parent: categoria,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [
                  Discord.PermissionFlagsBits.ViewChannel
                ]
              },
              {
                id: interaction.user.id,
                allow: [
                  Discord.PermissionFlagsBits.ViewChannel,
                  Discord.PermissionFlagsBits.SendMessages,
                  Discord.PermissionFlagsBits.AttachFiles,
                  Discord.PermissionFlagsBits.EmbedLinks,
                  Discord.PermissionFlagsBits.AddReactions
                ]
              }
            ]
          }).then( (ch) => {
            interaction.reply({ content: `✅ Olá ${interaction.user}, seu ticket foi aberto em ${ch}!`, ephemeral: true })
            let embed = new Discord.EmbedBuilder()
            .setColor("Random")
            .setDescription(`Olá ${interaction.user}, Você abriu o ticket de Duvida, para nos ajudar ja me fale qual é sua Duvida.`);
            let botao = new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
            .setCustomId("fechar_ticket")
            .setEmoji("🔒")
            .setStyle(Discord.ButtonStyle.Danger)
            );
  
            ch.send({ embeds: [embed], components: [botao] }).then( m => { 
              m.pin()
             })
          })
          }
          
        } else if (opc === "opc3") {

                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          // Nova opção
  
          let nome = `🤝・Parceria`;
          let categoria = config.client.categoria_tickets // Coloque o ID da categoria
  
          if (!interaction.guild.channels.cache.get(categoria)) categoria = null;
  
          if (interaction.guild.channels.cache.find(c => c.name === nome)) {
            interaction.reply({ content: `❌ Você já possui um ticket aberto em ${interaction.guild.channels.cache.find(c => c.name === nome)}!`, ephemeral: true })
          } else {
            interaction.guild.channels.create({
            name: nome,
            type: Discord.ChannelType.GuildText,
            parent: categoria,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [
                  Discord.PermissionFlagsBits.ViewChannel
                ]
              },
              {
                id: interaction.user.id,
                allow: [
                  Discord.PermissionFlagsBits.ViewChannel,
                  Discord.PermissionFlagsBits.SendMessages,
                  Discord.PermissionFlagsBits.AttachFiles,
                  Discord.PermissionFlagsBits.EmbedLinks,
                  Discord.PermissionFlagsBits.AddReactions
                ]
              }
            ]
          }).then( (ch) => {
            interaction.reply({ content: `✅ Olá ${interaction.user}, seu ticket foi aberto em ${ch}!`, ephemeral: true })
            let embed = new Discord.EmbedBuilder()
            .setColor("Random")
            .setDescription(`Olá ${interaction.user}, Você abriu o ticket de Suporte, para nos ajudar ja me fale qual é o problema.`);
            let botao = new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
            .setCustomId("fechar_ticket")
            .setEmoji("🔒")
            .setStyle(Discord.ButtonStyle.Danger)
            );
  
            ch.send({ embeds: [embed], components: [botao] }).then( m => { 
              m.pin()
             })
          })
          }
          
        } else if (opc === "opc4") {
  
          ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          // Nova opção
  
          let nome =`💵・Resgatar`;
          let categoria = config.client.categoria_tickets // Coloque o ID da categoria
  
          if (!interaction.guild.channels.cache.get(categoria)) categoria = null;
  
          if (interaction.guild.channels.cache.find(c => c.name === nome)) {
            interaction.reply({ content: `❌ Você já possui um ticket aberto em ${interaction.guild.channels.cache.find(c => c.name === nome)}!`, ephemeral: true })
          } else {
            interaction.guild.channels.create({
            name: nome,
            type: Discord.ChannelType.GuildText,
            parent: categoria,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [
                  Discord.PermissionFlagsBits.ViewChannel
                ]
              },
              {
                id: interaction.user.id,
                allow: [
                  Discord.PermissionFlagsBits.ViewChannel,
                  Discord.PermissionFlagsBits.SendMessages,
                  Discord.PermissionFlagsBits.AttachFiles,
                  Discord.PermissionFlagsBits.EmbedLinks,
                  Discord.PermissionFlagsBits.AddReactions
                ]
              }
            ]
          }).then( (ch) => {
            interaction.reply({ content: `✅ Olá ${interaction.user}, seu ticket foi aberto em ${ch}!`, ephemeral: true })
            let embed = new Discord.EmbedBuilder()
            .setColor("Random")
            .setDescription(`Olá ${interaction.user}, Você abriu o ticket de Problemas no Produto, para nos ajudar ja me fale qual é o Problema do Produto.`);
            let botao = new Discord.ActionRowBuilder().addComponents(
              new Discord.ButtonBuilder()
            .setCustomId("fechar_ticket")
            .setEmoji("🔒")
            .setStyle(Discord.ButtonStyle.Danger)
            );
  
            ch.send({ embeds: [embed], components: [botao] }).then( m => { 
              m.pin()
             })
          })
          }
          
        }
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === "fechar_ticket") {
        interaction.reply(`Olá ${interaction.user}, este ticket será excluído em 5 segundos...`)
        setTimeout ( () => {
          try { 
            interaction.channel.delete()
          } catch (e) {
            return;
          }
        }, 5000)
      }
    }
  })

  // SISTEMA DE Verificação

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
      if (interaction.customId === "verificar") {
        let role_id = await db.get(`cargo_verificação_${interaction.guild.id}`);
        let role = interaction.guild.roles.cache.get(role_id);
        if (!role) return;
        interaction.member.roles.add(role.id)
        interaction.reply({ content: `Olá ${interaction.user.username}, vc foi verificado`, ephemeral: true })
      }
    }
  })

// SISTEMA DE SUGESTÂO

client.on('interactionCreate', async interaction => {

  if (interaction.isButton()) {
    if (interaction.customId.startsWith("botao_modal")) {
      const modal = new Discord.ModalBuilder()
        .setCustomId('modal_sugestao')
        .setTitle(`Olá usuário, Nos diga qual é a sua sugestão.`)
      const sugestao3 = new Discord.TextInputBuilder()
        .setCustomId('sugestão')
        .setLabel('Qual sua sugestão?')
        .setStyle(Discord.TextInputStyle.Paragraph)

      const firstActionRow = new Discord.ActionRowBuilder().addComponents(sugestao3);
      modal.addComponents(firstActionRow)
      await interaction.showModal(modal);

      interaction.followUp({
        content: `${interaction.user}, Não abuse dessa função, caso contrario poderá e irá resultar em banimento.`,
        ephemeral: true
      })

    }
  }
  //

  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'modal_sugestao') {
    const moment = require("moment")
    let channel = client.channels.cache.get(config.client.canal_sugestoes) //canal para o envio da sugestão.
    const sugestao2 = interaction.fields.getTextInputValue('sugestão');

    interaction.reply({
      content: `🔹 | ${interaction.user}, Sua sugestão foi enviada com sucesso!`, ephemeral: true
    })

    channel.send({
      embeds: [new Discord.EmbedBuilder()
        .setColor('Random')
        .setAuthor({ name: `👤 - ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dinamyc: true }) })
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dinamyc: true }) })
        .setThumbnail(`${config.client.foto}`)
        .setDescription(`**Horário da sugestão:**
<t:${moment(interaction.createdTimestamp).unix()}>(<t:${parseInt(interaction.createdTimestamp / 1000)}:R>)

**Sobre o usuário:**

**ID:** (\`${interaction.user.id}\`)
**Usuario que fez a sugestão:** ${interaction.user}
**Nome no discord:** \`${interaction.user.tag}\`

**Sugestão:**
\`\`\`${sugestao2}\`\`\``)
      ]
    })
  }
})

