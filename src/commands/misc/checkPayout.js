const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const noblox = require('noblox.js');
const getDatabase = require('../../utils/getDatabase');
const getPayoutEligibility = require('../../functions/getPayoutEligibility');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check-user')
		.setDescription('Check if a Roblox user is eligible for group payouts')
		.addStringOption((option) => option.setName('username').setDescription('The Roblox username to check').setRequired(true))
		.toJSON(),
	testMode: false,
	devOnly: false,
	deleted: false,
	userPermissions: [],
	botPermissions: [],
	run: async (client, interaction) => {
		const username = interaction.options.getString('username');

		try {
			const database = await getDatabase();
			await interaction.deferReply();

			// Get the discord server's settings
			database.connect(async (err) => {
				if (err) {
					console.error('Database connection error:', err);
					const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ Failed to connect to the database.');
					return await interaction.editReply({ embeds: [embed] });
				}

				database.query(`SELECT * FROM servers WHERE id='${interaction.guild.id}'`, async (err, results) => {
					// Close the database connection
					database.end();

					if (err) {
						console.error('Database query error:', err);
						const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ Failed to query the database.');
						return await interaction.editReply({ embeds: [embed] });
					}

					if (!results[0] || results.length <= 0) {
						// Build the error response message
						const embed = new EmbedBuilder()
							.setColor(0xff0000)
							.setTitle('Error')
							.setDescription('❌ The bot is not configured for this server. Configure the bot first using /set.');
						return await interaction.editReply({ embeds: [embed] });
					}

					try {
						// Get the Roblox user's ID
						const userId = await noblox.getIdFromUsername(username);
						const groupId = results[0].group_id;
						const cookie = results[0].cookie;

						if (!userId) {
							const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription(`❌ The user **${username}** does not exist.`);
							return await interaction.editReply({ embeds: [embed] });
						}

						// Fix username capitalization
						const fixedUsername = await noblox.getUsernameFromId(userId);

						// Get the player's thumbnail
						const headshotApiUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`;
						const response = await axios.get(headshotApiUrl);
						const imageUrl = response.data.data[0].imageUrl;

						// Check if the user is in the group
						const isInGroup = (await noblox.getRankInGroup(groupId, userId)) > 0;

						if (!isInGroup) {
							const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setThumbnail(imageUrl).setDescription(`❌ The user **${username}** is NOT in the group.`);
							return await interaction.editReply({ embeds: [embed] });
						}

						// Check the eligibility status
						const eligible = await getPayoutEligibility(userId, groupId, cookie);
						console.log(eligible);

						// If error, return error message
						if (eligible == undefined || eligible == null) {
							// Build the error response message
							const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription(`❌ Failed to check eligibility for **${fixedUsername}**. Please try again.`);
							return await interaction.editReply({ embeds: [embed] });
						}

						// Build the response message
						const embed = new EmbedBuilder()
							.setColor(eligible ? 5697630 : 16405588)
							.setTitle(`Payout Eligibility for ${fixedUsername}`)
							.setThumbnail(imageUrl)
							.setDescription(
								eligible ? `<:yes:1272884844942332008> The user **${fixedUsername}** is eligible for group payouts.` : `<:no:1272884877515165696> The user **${fixedUsername}** is NOT eligible for group payouts.`
							);

						await interaction.editReply({ embeds: [embed] });
					} catch (error) {
						console.log('[ERROR]'.red + 'Roblox API error:', error);

						// Fix username capitalization
						const fixedUsername = await noblox.getUsernameFromId(userId);

						// Build the error response message
						const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription(`❌ Failed to check eligibility for **${fixedUsername}**. Please try again.`);
						await interaction.editReply({ embeds: [embed] });
					}
				});
			});
		} catch (error) {
			console.log('[ERROR]'.red + 'Unexpected error:', error);

			// Fix username capitalization
			const fixedUsername = await noblox.getUsernameFromId(userId);

			// Build the error response message
			const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription(`❌ Failed to check eligibility for **${fixedUsername}**. Please try again.`);
			await interaction.editReply({ embeds: [embed] });
		}
	},
};