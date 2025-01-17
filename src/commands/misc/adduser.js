const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('adduser')
		.setDescription('Adds another user to the ticket')
		.addUserOption((option) => option.setName('user').setDescription('User to add').setRequired(true))
		.toJSON(),
	testMode: false,
	devOnly: false,
	deleted: false,
	userPermissions: [],
	botPermissions: [PermissionFlagsBits.ManageChannels],

	run: async (client, interaction) => {
		try {
			const userToAdd = interaction.options.getUser('user');
			const ticketChannel = interaction.channel;

			await ticketChannel.permissionOverwrites.edit(userToAdd.id, {
				ViewChannel: true,
				SendMessages: true,
			});

			await interaction.reply({ content: `${userToAdd} has been added to the ticket!`, ephemeral: true });
		} catch (err) {
			console.error('[ERROR] Error in your adduser.js run function:', err);
		}
	},
};
