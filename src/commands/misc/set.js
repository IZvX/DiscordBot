const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { refreshCookie } = require('noblox.js');
const getDatabase = require('../../utils/getDatabase');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set')
		.setDescription('Change server settings')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('group')
				.setDescription('Set the group Id')
				.addIntegerOption((option) => option.setName('group').setDescription("The group's id").setRequired(true))
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('cookie')
				.setDescription('Set the .ROBLOSECURITY token')
				.addStringOption((option) => option.setName('cookie').setDescription("The ROBLOX bot's security token").setRequired(true))
		)
		.toJSON(),
	testMode: false,
	devOnly: false,
	deleted: false,
	userPermissions: [PermissionFlagsBits.Administrator],
	botPermissions: [],

	run: async (client, interaction) => {
		try {
			const database = await getDatabase();
			await interaction.deferReply({ ephemeral: true });

			const subcommand = interaction.options.getSubcommand();
			const value = interaction.options.getString('cookie') || interaction.options.getInteger('group');
			const filter = subcommand === 'group' ? 'group_id' : 'cookie';

			if (!value) {
				const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription(`❌ The value for **${subcommand}** is required.`);
				return await interaction.editReply({ embeds: [embed], ephemeral: true });
			}

			database.connect(async (err) => {
				if (err) {
					console.error('Database connection error:', err);
					const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ Failed to connect to the database.');
					return await interaction.editReply({ embeds: [embed], ephemeral: true });
				}

				database.query(`SELECT ${filter} FROM servers WHERE id='${interaction.guild.id}'`, async (error, results) => {
					if (error) {
						console.error('Database query error:', error);
						const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ Failed to query the database.');
						await interaction.editReply({ embeds: [embed], ephemeral: true });
						return database.end();
					}

					if (!results[0] || results.length <= 0) {
						database.query(`INSERT INTO servers (id, ${filter}) VALUES ('${interaction.guild.id}', '${value}')`, (insertError) => {
							if (insertError) {
								console.error('Database insert error:', insertError);
								const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ Failed to insert into the database.');
								interaction.editReply({ embeds: [embed], ephemeral: true });
							} else {
								const embed = new EmbedBuilder().setColor(0x00ff00).setTitle('Success').setDescription(`✅ Successfully set the server's **${subcommand}**.`);
								interaction.editReply({ embeds: [embed], ephemeral: true });
							}

							database.end();
						});
					} else {
						database.query(`UPDATE servers SET ${filter}='${value}' WHERE id='${interaction.guild.id}'`, (updateError) => {
							if (updateError) {
								console.error('Database update error:', updateError);
								const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ Failed to update the database.');
								interaction.editReply({ embeds: [embed], ephemeral: true });
							} else {
								const embed = new EmbedBuilder().setColor(0x00ff00).setTitle('Success').setDescription(`✅ Successfully updated the server's **${subcommand}**.`);
								interaction.editReply({ embeds: [embed], ephemeral: true });
							}

							database.end();
						});
					}
				});
			});
		} catch (error) {
			console.error('Unexpected error:', error);
			const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ An unexpected error occurred.');
			await interaction.editReply({ embeds: [embed], ephemeral: true });
		}
	},
};
