const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const getDatabase = require('../../utils/getDatabase');

module.exports = {
	data: new SlashCommandBuilder().setName('leaderboard').setDescription('Shows the top 20 users with the most robux').toJSON(),
	testMode: false,
	devOnly: false,
	deleted: false,
	userPermissions: [],
	botPermissions: [],

	run: async (client, interaction) => {
		try {
			const database = await getDatabase();

			database.connect(async (error) => {
				if (error) {
					console.log(error);
					const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ An unexpected error occurred while querying the database.');
					return await interaction.editReply({ embeds: [errorEmbed] });
				}

				database.query(`SELECT * FROM users WHERE roblox_id IS NOT NULL ORDER BY robux DESC LIMIT 20`, async (error, results) => {
					database.end();

					if (error) {
						console.log(error);
						const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ An unexpected error occurred while querying the database.');
						return await interaction.editReply({ embeds: [errorEmbed] });
					}

					const totalPages = Math.ceil(results.length / 10);
					let page = 1;

					const generateEmbed = (page) => {
						const start = (page - 1) * 10;
						const end = start + 10;
						const leaderboard = results.slice(start, end);

						const medals = ['🥇', '🥈', '🥉'];
						const description = leaderboard
							.map((user, index) => {
								const position = start + index + 1;
								const medal = medals[position - 1] || `${position}.`;

								return `${medal} <@${user.id}> - ${user.robux} Robux`;
							})
							.join('\n');

						return new EmbedBuilder().setColor(5402102).setTitle(`Leaderboard - Page ${page} of ${totalPages}`).setDescription(description);
					};

					await interaction.reply({ embeds: [generateEmbed(page)] });

					if (totalPages > 1) {
						const filter = (i) => i.user.id === interaction.user.id;
						const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

						collector.on('collect', async (i) => {
							if (i.customId === 'next') {
								page = 2;
							} else if (i.customId === 'previous') {
								page = 1;
							}

							await i.update({ embeds: [generateEmbed(page)], components: [generateRow(page)] });
						});

						const generateRow = (page) => {
							const row = new ActionRowBuilder();
							if (page === 1) {
								row.addComponents(new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary));
							} else {
								row.addComponents(new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Primary));
							}
							return row;
						};

						await interaction.editReply({ components: [generateRow(page)] });
					}
				});
			});
		} catch (err) {
			console.error('[ERROR] Error in your leaderboard.js run function:', err);
		}
	},
};