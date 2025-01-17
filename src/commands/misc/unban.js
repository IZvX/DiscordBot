const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user by their ID.")
    .addStringOption(option =>
      option
        .setName("id")
        .setDescription("The ID of the user to unban")
        .setRequired(true)
    ),

  run: async (client, interaction) => {
    const userId = interaction.options.getString("id");

    try {
      const user = await client.users.fetch(userId);

      // Attempt to unban the user
      await interaction.guild.members.unban(userId);

      const embed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setDescription(
          `**<:dynosuccess:1288083167785517108> ${user.tag} *was unbanned.***`
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);

      // Error handling for the "Unknown Ban" error (error code 10026)
      if (error.code === 10026) {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setDescription(
            `**<:dynofail:1288083167785517108> The user with ID \`${userId}\` is not banned.**`
          );

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        // Generic error handling
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  },
};