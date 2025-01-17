const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { getIdFromUsername, getUsernameFromId, getBlurb } = require('noblox.js');
const getDatabase = require('../../utils/getDatabase');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Manage your ROBLOX connections')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('add')
				.setDescription('Connect your ROBLOX account')
				.addStringOption((option) => option.setName('username').setDescription('Your ROBLOX username (not display name)').setRequired(true))
		)
		.addSubcommand((subcommand) => subcommand.setName('remove').setDescription('Remove your ROBLOX account'))
		.toJSON(),
	testMode: false,
	devOnly: false,
	deleted: false,
	userPermissions: [],
	botPermissions: [],
	run: async (client, interaction) => {
		try {
			const database = await getDatabase();
			await interaction.deferReply({ ephemeral: true });

			// Get the subcommand
			const subcommand = interaction.options.getSubcommand();

			database.connect(async (err) => {
				if (err) {
					console.error(err);
					const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ Failed to connect to the database.');
					return await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
				}

				try {
					if (subcommand == 'add') {
						// Get the ROBLOX account id && capitalized username
						const id = await getIdFromUsername(interaction.options.getString('username'));

						if (!id) {
							// Build the error response message
							const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ The ROBLOX user does not exist.');
							return await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
						}

						const username = await getUsernameFromId(id);

						// Check if the user is already verified and has only 1 account
						database.query(`SELECT * FROM users WHERE roblox_id='${id}' AND id='${interaction.user.id}'`, async (error, results) => {
							if (error) {
								console.error(error);
								const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ An error occurred while querying the database.');
								return await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
							}

							if (results && results.length > 0) {
								// Build the error response message
								const embed = new EmbedBuilder()
									.setColor(0xff0000)
									.setTitle('Error')
									.setDescription(`❌ The ROBLOX user **${username}** is already connected to your account.`);
								return await interaction.editReply({ embeds: [embed], ephemeral: true });
							}

							database.query(`SELECT * FROM users WHERE id='${interaction.user.id}'`, async (error, results) => {
								if (error) {
									console.error(error);
									const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ An error occurred while querying the database.');
									return await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
								}

								if (results[0] && results[0]['roblox_id'] != null) {
									// Build the error response message
									const embed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription(`❌ You already have verified with another ROBLOX account.`);
									return await interaction.editReply({ embeds: [embed], ephemeral: true });
								}

								// Generate a custom word list
								const words = [];
								const wordlist = require('../../utils/wordlist.json');

								for (let i = 0; i < 10; i++) words.push(wordlist[Math.floor(Math.random() * wordlist.length)]);
								const list = words.join(' ');

								// Get the player's thumbnail
								const headshotApiUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png`;
								const response = await axios.get(headshotApiUrl);
								const imageUrl = response.data.data[0].imageUrl;

								// Build the verification message
								const instructionsEmbed = new EmbedBuilder()
									.setColor(5402102)
									.setTitle('<:checkmark:1314666872201019483> Verification Process')
									.setThumbnail(imageUrl)
									.setDescription(
										`Please verify your ROBLOX account **${username}** by following the instructions below.\n**1.** Go to your [ROBLOX profile](https://www.roblox.com/users/${id}/profile).\n**2.** Copy the text below and paste it in your profile About section: \`\`\`${list}\`\`\`\n**3.** Click the button below to confirm.`
									)
									.setFooter({ text: 'If this is not your profile then please cancel the verification process.' });

								// Build the action row
								const row = new ActionRowBuilder().addComponents(
									new ButtonBuilder().setCustomId('add_confirm').setLabel("I'm done!").setStyle(ButtonStyle.Success),
									new ButtonBuilder().setCustomId('add_copy').setLabel('Copy').setStyle(ButtonStyle.Secondary),
									new ButtonBuilder().setCustomId('add_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
								);

								await interaction.editReply({ embeds: [instructionsEmbed], components: [row], ephemeral: true });

								// Handle button interactions
								const filter = (rowInteraction) => rowInteraction.user.id === interaction.user.id;
								const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 * 5 });

								// Handle collector input
collector.on('collect', async (rowInteraction) => {
    if (rowInteraction.customId === 'add_confirm') {
        // Stop the collector
        collector.stop();

        // Check if the user has added the word list to their profile
        const blurb = await getBlurb({ userId: Number(id) });

        if (blurb.includes(list)) {
            // Insert or update the user in the database
            database.query(
                `INSERT INTO users (id, roblox_id, robux, purchases) VALUES ('${interaction.user.id}', '${id}', 0, 0) ON DUPLICATE KEY UPDATE roblox_id='${id}'`,
                async (error) => {
                    if (error) {
                        console.error(error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle('Error')
                            .setDescription('❌ An error occurred while inserting into the database.');
                        return await interaction.editReply({ embeds: [errorEmbed], components: [], ephemeral: true });
                    }

                    // Grant the role
//                    const role = interaction.guild.roles.cache.get('1319393457982279800');
//                 if (role) {
  //                      const member = await interaction.guild.members.fetch(interaction.user.id);
 //                       await member.roles.add(role).catch(console.error);
//                    }

                    // Build the success response message
                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle('Success')
                        .setThumbnail(imageUrl)
                        .setDescription(`✅ The ROBLOX user **${username}** has been verified.`);
                    await interaction.editReply({ embeds: [successEmbed], components: [], ephemeral: true });

                    // Close the database connection
                    database.end();
                }
            );
        } else {
            // Build the error response message
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription(`❌ The text in your profile does not match the verification word list. Please try again.`);
            await interaction.editReply({ embeds: [errorEmbed], components: [], ephemeral: true });
        }
    } else if (rowInteraction.customId === 'add_copy') {
        // Send another message with the word list
        await rowInteraction.reply({ content: list, ephemeral: true });
    } else if (rowInteraction.customId === 'add_cancel') {
        const cancelEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('Canceled')
            .setDescription(`❌ The verification process has been canceled.`);
        await interaction.editReply({ embeds: [cancelEmbed], components: [], ephemeral: true });
    }
});

								// Handle collector timeout
								collector.on('end', async (collected, reason) => {
									if (reason === 'time') {
										const timeoutEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Timeout').setDescription(`❌ The verification process has timed out.`);
										await interaction.editReply({ embeds: [timeoutEmbed], components: [], ephemeral: true });
									}
								});
							});
						});
					} else if (subcommand == 'remove') {
						// Check if the user is verified
						database.query(`SELECT * FROM users WHERE id='${interaction.user.id}'`, async (error, results) => {
							if (error) {
								console.log(error);
								const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ An error occurred while querying the database.');
								return await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
							}

							if (results && results.length > 0) {
								// Get the ROBLOX account id && capitalized username
								const id = results[0].roblox_id;

								if (!id) {
									// Build the error response message
									const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ You have not linked a ROBLOX user to your account.');
									return await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
								}

								const username = await getUsernameFromId(id);

								// Get the player's thumbnail
								const headshotApiUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png`;
								const response = await axios.get(headshotApiUrl);
								const imageUrl = response.data.data[0].imageUrl;

								// Build the confirmation message
								const embed = new EmbedBuilder()
									.setColor(0xffa500)
									.setTitle('Confirmation')
									.setThumbnail(imageUrl)
									.setDescription(`⚠️ Are you sure that you want to unlink the ROBLOX user **${username}** from your account?`);

								// Build the action row
								const row = new ActionRowBuilder().addComponents(
									new ButtonBuilder().setCustomId('remove_confirm').setLabel('Confirm').setStyle(ButtonStyle.Danger),
									new ButtonBuilder().setCustomId('remove_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
								);

								await interaction.editReply({ embeds: [embed], components: [row], ephemeral: true });

								// Handle button interactions
								const filter = (rowInteraction) => rowInteraction.user.id === interaction.user.id;
								const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

								collector.on('collect', async (rowInteraction) => {
									if (rowInteraction.customId === 'remove_confirm') {
										// Remove the user from the database
database.query(`UPDATE users SET roblox_id=NULL WHERE id='${interaction.user.id}' AND roblox_id='${id}'`, async (error, results) => {
    if (error) {
        console.error(error);
        const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ An error occurred while updating the database.');
        return await interaction.editReply({ embeds: [errorEmbed], components: [], ephemeral: true });
    }

    // Remove the role
    const role = interaction.guild.roles.cache.get('1319393457982279800');
    if (role) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        await member.roles.remove(role).catch(console.error);
    }

    // Build the success response message
    const successEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('Success')
        .setThumbnail(imageUrl)
        .setDescription(`✅ The ROBLOX user **${username}** has been unlinked.`);
    await interaction.editReply({ embeds: [successEmbed], components: [], ephemeral: true });

    // Close the database connection
    database.end();
});
									} else {
										const cancelEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Canceled').setDescription(`❌ The removal process has been canceled.`);
										await interaction.editReply({ embeds: [cancelEmbed], components: [], ephemeral: true });
									}

									// Stop the collector
									collector.stop();
								});

								// Handle collector timeout
								collector.on('end', async (collected, reason) => {
									if (reason === 'time') {
										const timeoutEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Timeout').setDescription(`❌ The removal process has timed out.`);
										await interaction.editReply({ embeds: [timeoutEmbed], components: [], ephemeral: true });
									}
								});
							} else {
								// Build the error response message
								const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription(`❌ You have not verified with a ROBLOX account.`);
								await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
							}
						});
					}
				} catch (error) {
					console.error(error);
					const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ An unexpected error occurred.');
					await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
				}
			});
		} catch (error) {
			console.error(error);
			const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('Error').setDescription('❌ An unexpected error occurred.');
			await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
		}
	},
}; 