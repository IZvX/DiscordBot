
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { requireLinkedRobloxID } = require('../../functions/createTicket'); // Corrected path

module.exports = {
	data: new SlashCommandBuilder()
		.setName('togglelinkcheck')
		.setDescription('Toggles the requirement for a linked Roblox ID when creating tickets.')
		.toJSON(),
	userPermissions: [PermissionFlagsBits.Administrator],

	run: async (client, interaction) => {
		if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return interaction.reply({
				content: 'You do not have permission to use this command.',
				ephemeral: true,
			});
		}

		requireLinkedRobloxID = !requireLinkedRobloxID;

await interaction.reply({
    content: `The requirement for linked Roblox IDs has been ${requireLinkedRobloxID ? 'enabled' : 'disabled'}.`,
    ephemeral: true,
});
	},
};
