const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user by their ID.")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("The user to kick")
        .setRequired(true)
    )
    .toJSON(),

  run: async (client, interaction) => {
    // Check if the user has the required permission
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("member");

    try {
      const member = await interaction.guild.members.fetch(user.id);
      await member.kick();

      const embed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setDescription(`**<:dynosuccess:1288083167785517108> ${user.tag} was kicked.**`);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);

      // Handle specific cases, like user not found or lacking permissions
      if (error.code === 50013) { // Lack of permission to kick the target
        return interaction.reply({
          content: "I cannot kick this user. They may have a higher role than me.",
          ephemeral: true,
        });
      }

      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
