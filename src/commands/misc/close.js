const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("close")
    .setDescription("Closes the ticket")
    .toJSON(),
  testMode: false,
  devOnly: false,
  deleted: false,
  userPermissions: [], // Not used here
  botPermissions: [PermissionFlagsBits.ManageChannels],

  run: async (client, interaction) => {
    // Check if the user has Administrator permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    try {
      const ticketChannel = interaction.channel;

      // Delete the channel
      await ticketChannel.delete("Ticket closed by command.");

      // Reply (note: the reply won't be seen as the channel is deleted, but for safety we include it)
      await interaction.reply({ content: "The ticket has been closed!", ephemeral: true });
    } catch (err) {
      console.error("[ERROR] Error in your close.js run function:", err);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
