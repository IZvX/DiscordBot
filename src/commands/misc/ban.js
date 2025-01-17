const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a user from the server')
		.addUserOption((option) => option.setName('user').setDescription('Select the user to ban').setRequired(true))
		.addStringOption((option) => option.setName('reason').setDescription('Reason for banning the user').setRequired(false))
		.toJSON(),
	testMode: false,
	devOnly: false,
	deleted: false,
	userPermissions: [PermissionFlagsBits.BanMembers],
	botPermissions: [PermissionFlagsBits.BanMembers],

	run: async (client, interaction) => {
		// Check if the user has the required permission
		if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
			return interaction.reply({
				content: 'You do not have permission to use this command.',
				ephemeral: true,
			});
		}

		const userToBan = interaction.options.getUser('user');
		const reason = interaction.options.getString('reason') || 'No reason provided';

		try {
			// Fetch the member object
			const member = await interaction.guild.members.fetch(userToBan.id);

			// Ban the user
			await member.ban({ reason });

			// Send a confirmation embed
			const embed = new EmbedBuilder().setColor('#FF0000').setDescription(`**${userToBan.tag} was banned. Reason: ${reason}.**`);

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error('[ERROR] Error in your ban.js run function:', error);

			// Handle specific errors like the bot lacking permissions
			if (error.code === 50013) {
				return interaction.reply({
					content: 'I cannot ban this user. They might have a higher role than me.',
					ephemeral: true,
				});
			}

			// General error response
			await interaction.reply({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		}
	},
};
