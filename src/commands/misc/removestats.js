const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const getDatabase = require('../../utils/getDatabase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removestats')
        .setDescription('Remove deals or Robux stats from a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to update stats for')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('deals')
                .setDescription('Number of deals to remove')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('robux')
                .setDescription('Amount of Robux to remove')
                .setRequired(false)
        )
        .toJSON(),
    testMode: false,
    devOnly: false,
    deleted: false,
    userPermissions: ['ADMINISTRATOR'],
    botPermissions: [],
    run: async (client, interaction) => {
        try {
            const database = await getDatabase();
            await interaction.deferReply();

            const user = interaction.options.getUser('user');
            const dealsToRemove = interaction.options.getInteger('deals') || 0;
            const robuxToRemove = interaction.options.getInteger('robux') || 0;

            if (dealsToRemove === 0 && robuxToRemove === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Error')
                    .setDescription('❌ You must specify either deals or Robux to remove.');
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            database.connect(async () => {
                const userId = user.id;

                // Kontrollera nuvarande värden
                database.query(`SELECT purchases, robux FROM users WHERE id='${userId}'`, async (error, results) => {
                    if (error) {
                        console.error(error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle('Error')
                            .setDescription('❌ Failed to retrieve user stats from the database.');
                        return await interaction.editReply({ embeds: [errorEmbed] });
                    }

                    if (results.length === 0) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle('Error')
                            .setDescription('❌ User not found in the database.');
                        return await interaction.editReply({ embeds: [errorEmbed] });
                    }

                    const currentDeals = results[0].purchases;
                    const currentRobux = results[0].robux;

                    // Beräkna nya värden
                    const newDeals = Math.max(currentDeals - dealsToRemove, 0);
                    const newRobux = Math.max(currentRobux - robuxToRemove, 0);

                    // Uppdatera databasen
                    database.query(
                        `UPDATE users SET purchases = ${newDeals}, robux = ${newRobux} WHERE id = '${userId}'`,
                        async (updateError) => {
                            database.end();

                            if (updateError) {
                                console.error(updateError);
                                const errorEmbed = new EmbedBuilder()
                                    .setColor(0xff0000)
                                    .setTitle('Error')
                                    .setDescription('❌ Failed to update the user stats in the database.');
                                return await interaction.editReply({ embeds: [errorEmbed] });
                            }

                            const successEmbed = new EmbedBuilder()
                                .setColor(0x00ff00)
                                .setTitle('Success')
                                .setDescription(`✅ Successfully removed:\n- Deals: ${dealsToRemove}\n- Robux: ${robuxToRemove}`)
                                .addFields({ name: 'User Updated:', value: `<@${userId}>`, inline: true });

                            await interaction.editReply({ embeds: [successEmbed] });
                        }
                    );
                });
            });
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('Error')
                .setDescription('❌ An unexpected error occurred.');
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};