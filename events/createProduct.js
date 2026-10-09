const Discord = require('discord.js');
const { toJSON } = require('..');

/*============================= | Create Product | =========================================*/
module.exports = {
    name: 'createProduct',
    async execute(interaction) {
        if (interaction.isButton() && interaction.customId.startsWith("create_product")) {
            if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply({
                content: `🔹 | ${interaction.user}, Você precisa da permissão \`ADMNISTRATOR\` para usar este comando!`,
                ephemeral: true,
            })

            const modal = new Discord.ModalBuilder()
                .setCustomId('create_product')
                .setTitle(`New Product`)

            const product_name = new Discord.TextInputBuilder()
                .setCustomId('product_name')
                .setLabel('Nome')
                .setRequired(true)
                .setMaxLength(150)
                .setStyle(1)
                .setPlaceholder('Exemplo');

            const product_value = new Discord.TextInputBuilder()
                .setCustomId('product_value')
                .setLabel('Valor')
                .setRequired(true)
                .setMaxLength(50)
                .setStyle(1)
                .setPlaceholder('20.00');

            const product_body = new Discord.TextInputBuilder()
                .setCustomId('product_body')
                .setLabel('Descrição')
                .setRequired(true)
                .setMaxLength(255)
                .setStyle(2)
                .setPlaceholder('Melhor produto da atualidade.')

            modal.addComponents(
                new Discord.ActionRowBuilder().addComponents(product_name),
                new Discord.ActionRowBuilder().addComponents(product_value),
                new Discord.ActionRowBuilder().addComponents(product_body)
            );

            return interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith("create_product")) {
            const id = Math.floor(Math.random() * 5000) + 1000;
            const product = {
                id,
                name: interaction.fields.getTextInputValue('product_name'),
                value: parseFloat(interaction.fields.getTextInputValue('product_value')),
                body: interaction.fields.getTextInputValue('product_body'),
            };

            db.set(`product_${id}`, product);
            interaction.reply({ content: '✅ | Produto cadastrado com sucesso!', ephemeral: true })
        }
    }
}