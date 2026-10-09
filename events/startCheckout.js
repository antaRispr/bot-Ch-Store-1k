const Discord = require('discord.js')
const config = require('../config.json')
const moment = require("moment")
moment.locale("pt-br");
const mercadopago = require('mercadopago');
/*============================= | Create Product | =========================================*/
module.exports = {
    name: 'startCheckout',
    async execute(interaction) {
        if (interaction.isButton() && interaction.customId.startsWith("sales-")) {
            const product_id = interaction.customId.slice(interaction.customId.indexOf('-')).replace('-', '')
            const row = await db.get(`product_${product_id}`);

            if (!row) return interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setTitle('Produto não encontrado!')
                        .setDescription('Este produto pode não estar mais disponível!')
                ],
                ephemeral: true
            })

            if (!row.stocks || row.stocks.length < 1) return interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)  
                        .setDescription('⚠️ | Este produto está sem estoque, aguarde um reabastecimento!')
                
                    ],
                    ephemeral: true,
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                        .setCustomId(`cancel_checkout`)
                        .setStyle(2)
                        .setLabel(`Ativar Notificações`)
                        .setEmoji('🔔'),
                    ),
            ]
        })
            
            

            if (interaction.guild.channels.cache.find(c => c.name === `🛒・${interaction.user.username}`)) {
                return interaction.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.client.embed)
                            .setTitle(`${config.client.title} | Sistema de Carrinho`)
                            .setDescription(`✅ | ${interaction.user} Você já possui um carrinho aberto, finalize a compra para abrir um novo!`)
                    ],
                    ephemeral: true,
                })
            }

            interaction.guild.channels.create({
                name: `🛒・${interaction.user.username}`,
                type: 0,
                parent: config.sales.categoria_carrinho,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ["ViewChannel"]
                    },
                    {
                        id: interaction.user.id,
                        allow: ["ViewChannel"],
                        deny: ["SendMessages", "AttachFiles", "AddReactions"]
                    }
                ]
            }).then(channel => {
                    interaction.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(config.client.embed)
                                .setDescription(`✅ | ${interaction.user} **Seu carrinho foi aberto com sucesso em: ${channel}, fique à vontade para adicionar mais produtos.**`)
                        ],   ephemeral: true
                    })

                var qrcode = true;
                var pix = true;
                var quantity = 1;
                var product_price = row.value * quantity

                const protocol = Math.floor(Math.random() * 900000) + 100000;;
                
                channel.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.client.embed)
                            .setTitle(`${config.client.title} | Resumo da Compra`)
                            .setDescription(`🔹  | Produto: \`${row.name}\`\n💰 | Valor unitário: \`R$${(row.value * quantity).toFixed(2)}\`\n 📦 | Quantidade: \`${quantity}\`\n✅ | Total: \`R$${(row.value * quantity).toFixed(2)}\`\n\n\n🛒 | **Produto no Carrinho:** \`${quantity}\`\n💰 | **Valor a Pagar:** \`R$${(row.value * quantity).toFixed(2)}\`\n🔹 | **Cupom Adicionado:** \`Em breve\``)
                    ], content: `<@${interaction.user.id}>`,
                    components: [
                        new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                .setCustomId(`remove_checkout_product`)
                                .setStyle(2)
                                .setLabel('-'),
                            new Discord.ButtonBuilder()
                                .setCustomId(`confirm_checkout_product`)
                                .setStyle(3)
                                .setLabel('Comprar')
                                .setEmoji('✅'),
                                new Discord.ButtonBuilder()
                                .setCustomId(`add_checkout_product`)
                                .setStyle(2)
                                .setLabel('+'),
                            new Discord.ButtonBuilder()
                                .setCustomId(`cancel_checkout`)
                                .setStyle(4)
                                .setEmoji('🗑️')
                            ),
                    ]
                }).then(async msg => {
                    const filter = i => i.member.id === interaction.user.id;
                    const collector = msg.createMessageComponentCollector({ filter });
                    collector.on('collect', interaction2 => {
                        if (interaction2.customId === "remove_checkout_product") {
                            if (quantity <= 1) return interaction2.reply({ content: `🔹 | Você não pode deixar o stock abaixo de 0`, ephemeral: true })

                            quantity -= 1;

                            product_price = row.value * quantity;

                            interaction2.update({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(config.client.embed)
                                        .setTitle(`${config.client.title} | Resumo da Compra`)
                                        .setDescription(`🔹  | Produto: \`${row.name}\`\n💰 | Valor unitário: \`R$${(row.value * quantity).toFixed(2)}\`\n 📦 | Quantidade: \`${quantity}\`\n✅ | Total: \`R$${(row.value * quantity).toFixed(2)}\`\n\n\n✅ | **Produto no Carrinho:** \`${quantity}\`\n💰 | **Valor a Pagar:** \`R$${(row.value * quantity).toFixed(2)}\`\n🔹 | **Cupom Adicionado:** \`Em breve\``)
                                ], content: `<@${interaction.user.id}>`,
                                components: [
                                    new Discord.ActionRowBuilder()
                                    .addComponents(
                                        new Discord.ButtonBuilder()
                                            .setCustomId(`remove_checkout_product`)
                                            .setStyle(2)
                                            .setEmoji('➖'),
                                        new Discord.ButtonBuilder()
                                            .setCustomId(`confirm_checkout_product`)
                                            .setStyle(3)
                                            .setLabel('Finalizar')
                                            .setEmoji('✅'),
                                            new Discord.ButtonBuilder()
                                            .setCustomId(`add_checkout_product`)
                                            .setStyle(2)    
                                            .setEmoji('➕'),
                                        new Discord.ButtonBuilder()
                                            .setCustomId(`cancel_checkout`)
                                            .setStyle(4)
                                            .setLabel('Cancelar')
                                            .setEmoji('❌')
                                    ),
                            ]
                            });

                        } else if (interaction2.customId === "add_checkout_product2") {
                            if (quantity >= row.stocks.length)return interaction2.reply({ content: `🔹 | Você não pode adicionar o stock acima do valor`, ephemeral: true })
                       
                            interaction2.update({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(config.client.embed)
                                        .setTitle(`${config.client.title} | Resumo da Compra`)
                                        .setDescription(`🔹  | Produto: \`${row.name}\`\n💰 | Valor unitário: \`R$${(row.value * quantity).toFixed(2)}\`\n 📦 | Quantidade: \`${quantity}\`\n✅ | Total: \`R$${(row.value * quantity).toFixed(2)}\`\n\n\n✅ | **Produto no Carrinho:** \`${quantity}\`\n💰 | **Valor a Pagar:** \`R$${(row.value * quantity).toFixed(2)}\`\n🔹 | **Cupom Adicionado:** \`Em breve\``)
                                ], content: `<@${interaction.user.id}>`,
                                components: [
                                    new Discord.ActionRowBuilder()
                                    .addComponents(
                                        new Discord.ButtonBuilder()
                                            .setCustomId(`remove_checkout_product`)
                                            .setStyle(2)
                                            .setEmoji('➖'),
                                        new Discord.ButtonBuilder()
                                            .setCustomId(`confirm_checkout_product`)
                                            .setStyle(3)
                                            .setLabel('Finalizar')
                                            .setEmoji('✅'),
                                            new Discord.ButtonBuilder()
                                            .setCustomId(`add_checkout_product`)
                                            .setStyle(2)    
                                            .setEmoji('➕'),
                                        new Discord.ButtonBuilder()
                                            .setCustomId(`cancel_checkout`)
                                            .setStyle(4)
                                            .setLabel('Cancelar')
                                            .setEmoji('❌')
                                    ),
                            ]
                            });
                    
                        } else if (interaction2.customId === "add_checkout_product") {
                            if (quantity >= row.stocks.length) return interaction2.reply({ content: `🔹 | Você não pode adicionar o stock acima do valor`, ephemeral: true })
                            
                            
                            quantity += 1;

                            product_price = row.value * quantity;

                            interaction2.update({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(config.client.embed)
                                        .setTitle(`${config.client.title} | Resumo da Compra`)
                                        .setDescription(`🔹  | Produto: \`${row.name}\`\n💰 | Valor unitário: \`R$${(row.value * quantity).toFixed(2)}\`\n 📦 | Quantidade: \`${quantity}\`\n✅ | Total: \`R$${(row.value * quantity).toFixed(2)}\`\n\n\n✅ | **Produto no Carrinho:** \`${quantity}\`\n💰 | **Valor a Pagar:** \`R$${(row.value * quantity).toFixed(2)}\`\n🔹 | **Cupom Adicionado:** \`Em breve\``)
                                ], content: `<@${interaction.user.id}>`,
                                components: [
                                    new Discord.ActionRowBuilder()
                                    .addComponents(
                                        new Discord.ButtonBuilder()
                                            .setCustomId(`remove_checkout_product`)
                                            .setStyle(2)
                                            .setEmoji('➖'),
                                        new Discord.ButtonBuilder()
                                            .setCustomId(`confirm_checkout_product`)
                                            .setStyle(3)
                                            .setLabel('Finalizar')
                                            .setEmoji('✅'),
                                            new Discord.ButtonBuilder()
                                            .setCustomId(`add_checkout_product`)
                                            .setStyle(2)    
                                            .setEmoji('➕'),
                                        new Discord.ButtonBuilder()
                                            .setCustomId(`cancel_checkout`)
                                            .setStyle(4)
                                            .setLabel('Cancelar')
                                            .setEmoji('❌')
                                    ),
                            ]
                            });
                        } else if (interaction2.customId === "cancel_checkout") {
                            interaction2.channel.delete().then(() => {
                                interaction2.user.send({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setColor(config.client.embed)
                                            .setTitle(`${config.client.title} | Compra Cancelada`)
                                            .setDescription(`Olá ${interaction.user} \n\n • Você cancelou a compra, e todos os produtos foram devolvido para o estoque. Você pode voltar a comprar quando quiser!`)
                                
                                    ]
                                })
                            })
                            
                        } else if (interaction2.customId === "confirm_checkout_product") {
                            interaction2.message.delete()
                            interaction2.channel.send({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(config.client.embed)
                                        .setTitle(`${config.client.title} | Sistema de Pagamento`)
                                        .setDescription(`\`\`\`Efetue o pagamento Utilizando a Chave Pix ou QR Code.\`\`\``)
                                        .addFields([
                                            { name: '🔹  | Produto', value: `${row.name}`, inline: false },
                                            { name: '💰 | Preço', value: `R$${(row.value * quantity).toFixed(2)}`, inline: true },
                                        ])
                                ], content: `<@${interaction.user.id}>`,
                                components: [
                                    new Discord.ActionRowBuilder()
                                        .addComponents(
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`codigo`)
                                                .setStyle(1)
                                                .setEmoji("💳")
                                                .setLabel('Pix'),
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`qrcode_checkout_product1`)
                                                .setStyle(1)
                                                .setEmoji("📱")
                                                .setLabel('Qr Code'),
                                                new Discord.ButtonBuilder()
                                                .setCustomId(`confirm_payment_checkout`)
                                                .setStyle(3)
                                                .setEmoji("✅")
                                                .setLabel('Aprovar'),
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`cancel_checkout`)
                                                .setStyle(4)
                                                .setEmoji("🗑️"),
                                        
                                        ),
                                ]
                            }).then(async msg => {
                                interaction2.channel.edit({
                                    permissionOverwrites: [
                                        {
                                            id: interaction2.guild.id,
                                            deny: ["ViewChannel"]
                                        },
                                        {
                                            id: interaction2.user.id,
                                            allow: ["ViewChannel", "SendMessages", "AttachFiles"],
                                            deny: ["AddReactions"]
                                        }
                                    ]
                                })
                                const collector = msg.createMessageComponentCollector();

                                collector.on('collect', async interaction => {
                                    if (interaction.customId === "qrcode_checkout_product1") {
                                        return interaction.reply({
                                            files: [new Discord.AttachmentBuilder(require("path").join(__dirname, "../public/pix.png"))],
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor(config.client.embed)
                                                    .setImage(config.sales.banco.qrcode)
                                            ],   ephemeral: true
                                        })

                                    } else if (interaction.customId === "codigo") {
                                        return interaction.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(`Forma de Pagamento`)
                                                    .setThumbnail(`${config.client.foto}`)
                                                    .setDescription(`🔑** | Tipo de Chave:**\n${config.sales.banco.tipochave} \n💳** | Chave Pix:**\n${config.sales.banco.ChaveAleatória}\n\n📋 **PIX Copia e Cola:**\n\`\`\`${config.sales.banco.copia_cola}\`\`\``)
                                                    .setFooter({ text: `${config.client.title} Todos os direitos reservados.`, iconURL: `${config.client.foto}` })
                                                    .setColor(config.client.embed)
                                            ],
                                            ephemeral: true
                                        })

                                    } else if (interaction.customId === "cancel_checkout") {
                                        interaction.channel.delete().then(() => {
                                            interaction.user.send({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setColor(config.client.embed)
                                                        .setTitle(`${config.client.title} | Compra Cancelada`)
                                                        .setDescription(`Olá ${interaction.user} \n\n • Você cancelou a compra, e todos os produtos foram devolvido para o estoque. Você pode voltar a comprar quando quiser!`)
                                                        
                                                ]
                                            })
                                        })
                                    } else if (interaction.customId === "confirm_payment_checkout") {
                                        if (!interaction.member.roles.cache.get(config.sales.cargo_aprovar)) return interaction.reply({ content: `Você não tem permissão de aprovar a compra!`, ephemeral: true })

                                        if (row.stocks.length < quantity) return interaction.channel.send({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor(config.client.embed)
                                                    .setTitle(`${config.client.title} | Compra aprovada`)
                                                    .setDescription(`Infelizmente alguem comprou esse produto antes de você, mande mensagem para algum dos staffs e apresente o codigo: \`\`\`[${payment.body.id}]\`\`\``)
                                            ]
                                        })

                                            setTimeout(() => msg.delete(),10)
                                            interaction.channel.send({ content: `
                                            ✅ | Compra Confirmada`, embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor(config.client.embed)
                                                    .setTitle(`⭐ ${config.client.title} | Compra aprovada ⭐`)
                                                    .setDescription(`${interaction.user} **Compra aprovada com sucesso aguarde um administrador entregar seu produto**`)
                                                    
                                            ]})
                                          

                                        const stocks = row.stocks.slice(0, quantity);
                                        db.pull(`product_${row.id}.stocks`, stocks)

                                        const owner_id = interaction.channel.name.replace('🛒・', '');
                                        const user = await interaction.guild.members.fetch(owner_id);

                                        if (!user.roles.cache.get(config.sales.cargo_cliente)) user.roles.add(config.sales.cargo_cliente);

                                        user.send({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor(config.client.embed)
                                                    .setTitle(`⭐ ${config.client.title} | Compra aprovada ⭐`)
                                                    .setDescription(`
                                                         📦 | **Seu Produto(s):**
                                                         \`\`\`${stocks.join('\n')}\`\`\`\
                                                         🔹 | **ID da compra:** 
                                                         ${protocol}
                                                `)
                                                .setFooter({ text: `${config.client.title} Agradece a sua preferência!` })
                                            ]
                                        })

                                        const channel = interaction.guild.channels.cache.get(config.sales.logs_compras);
                                        channel.send({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor(config.client.embed)
                                                    .setTitle(`${config.client.title} | Compra Aprovada`)
                                                    .setThumbnail(`${config.client.foto}`)
                                                  
                                                    .setFooter({ text: `${config.client.title} - Todos os direitos reservados` })
                                                    .addFields([
                                                        { name: `🔹 | Comprador`, value: `${user.user.tag}` },
                                                        { name: `🛒 | Produto:`, value: `${row.name}` },
                                                        { name: `💰 | Valor Pago:`, value: `R$${product_price.toFixed(2)}` },
                                                        { name: `🔹 | Quantidade:`, value: `${quantity}x` },
                                                        { name: '⭐ | Avaliação:', value: `⭐ ⭐ ⭐ ⭐ ⭐ (5)` },
                                                        { name: ' | Data da compra:', value: `(${moment().format('LLLL')})` }
                                                    ])
                                            ]
                                            
                                        })
                                        
                                        setTimeout(() => interaction.channel.delete(), 50000)
                                        dbJson.add("pedidostotal", 1)
                                        dbJson.add("gastostotal", product_price)
                                        dbJson.add(`${moment().utc().tz('America/Sao_Paulo').format('D/M/Y')}.pedidos`, 1)
                                        dbJson.add(`${moment().utc().tz('America/Sao_Paulo').format('D/M/Y')}.compras`, product_price)
                                        dbJson.add(`${interaction2.user.id}.compras`, product_price)
                                        dbJson.add(`${interaction2.user.id}.pedidos`, 1)
                                    }
                                })
                            })
                        }
                    })
                })
            })
        }
    }
}