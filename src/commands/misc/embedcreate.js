const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('embedcreate')
		.setDescription('Creates an embed to open a purchase ticket')
		.addChannelOption((opt) => opt.setName('channel').setDescription('The channel where it should be sent').setRequired(true))
		.toJSON(),
	testMode: false,
	devOnly: false,
	deleted: false,
	userPermissions: [],
	botPermissions: [PermissionFlagsBits.SendMessages],

	run: async (client, interaction) => {
		try {
			const channel = interaction.options.getChannel('channel');
			const embed = new EmbedBuilder().setColor(5402102).setTitle('<:robux:1314670878885286020> Purchase Robux').setDescription(' Click the button below to get your order started.');

			const button = new ButtonBuilder().setCustomId('createTicket').setLabel('Buy').setEmoji('1314971567003930634').setStyle(ButtonStyle.Secondary);

			const row = new ActionRowBuilder().addComponents(button);

			interaction.reply({
				content: `\`✅\` sent to channel ${channel}!`,
				ephemeral: true,
			});
			await channel.send({ embeds: [embed], components: [row] });
		} catch (err) {
			console.error('[ERROR] Error in your embedcreate.js run function:', err);
			await interaction.reply({
				content: 'An error occurred while creating the ticket. Please try again later.',
				ephemeral: true,
			});
		}
	},
};
