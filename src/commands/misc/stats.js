const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const getDatabase = require('../../utils/getDatabase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addstats')
        .setDescription('Add deals or Robux stats to a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to update stats for')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('deals')
                .setDescription('Number of deals to add')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('robux')
                .setDescription('Amount of Robux to add')
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
            const dealsToAdd = interaction.options.getInteger('deals') || 0;
            const robuxToAdd = interaction.options.getInteger('robux') || 0;

            if (dealsToAdd === 0 && robuxToAdd === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Error')
                    .setDescription('❌ You must specify either deals or Robux to add.');
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            database.connect(async () => {
                const userId = user.id;

                // Update the database
                database.query(
                    `UPDATE users SET purchases = purchases + ${dealsToAdd}, robux = robux + ${robuxToAdd} WHERE id = '${userId}'`,
                    async (error, results) => {
                        database.end();

                        if (error) {
                            console.error(error);
                            const errorEmbed = new EmbedBuilder()
                                .setColor(0xff0000)
                                .setTitle('Error')
                                .setDescription('❌ Failed to update the user stats in the database.');
                            return await interaction.editReply({ embeds: [errorEmbed] });
                        }

                        const successEmbed = new EmbedBuilder()
                            .setColor(0x00ff00)
                            .setTitle('Success')
                            .setDescription(`✅ Successfully added:\n- Deals: ${dealsToAdd}\n- Robux: ${robuxToAdd}`)
                            .addFields({ name: 'User Updated:', value: `<@${userId}>`, inline: true });

                        await interaction.editReply({ embeds: [successEmbed] });
                    }
                );
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