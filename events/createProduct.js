const Discord = require('discord.js');
const { randomUUID } = require('node:crypto');

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
                .setTitle(`Cadastrar serviço`)

            const product_name = new Discord.TextInputBuilder()
                .setCustomId('product_name')
                .setLabel('Nome')
                .setRequired(true)
                .setMaxLength(150)
                .setStyle(1)
                .setPlaceholder('Exemplo');

            const product_value = new Discord.TextInputBuilder()
                .setCustomId('product_value')
                .setLabel('Valor do pacote (R$)')
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
                .setPlaceholder('Descreva o que está incluído, o prazo e os limites do pacote.')

            modal.addComponents(
                new Discord.ActionRowBuilder().addComponents(product_name),
                new Discord.ActionRowBuilder().addComponents(product_value),
                new Discord.ActionRowBuilder().addComponents(product_body)
            );

            return interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith("create_product")) {
            if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply({ content: 'Somente administradores podem cadastrar serviços.', ephemeral: true });
            const value = Number(interaction.fields.getTextInputValue('product_value').trim().replace(',', '.'));
            if (!Number.isFinite(value) || value <= 0) return interaction.reply({ content: 'Informe um preço válido maior que zero, como 15,00.', ephemeral: true });
            const id = randomUUID();
            const product = {
                id,
                name: interaction.fields.getTextInputValue('product_name'),
                value,
                type: 'service',
                body: interaction.fields.getTextInputValue('product_body'),
            };

            await db.set(`product_${id}`, product);
            interaction.reply({ content: '✅ | Serviço cadastrado com sucesso!', ephemeral: true })
        }
    }
}