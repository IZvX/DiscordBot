const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removeuser")
    .setDescription("Removes a user from the ticket")
    .addUserOption(option => 
      option
        .setName("user")
        .setDescription("User to remove")
        .setRequired(true)
    )
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
      const userToRemove = interaction.options.getUser("user");
      const ticketChannel = interaction.channel;

      // Remove the user's ability to view the channel
      await ticketChannel.permissionOverwrites.edit(userToRemove.id, {
        ViewChannel: false,
      });

      // Confirm removal to the user
      await interaction.reply({ 
        content: `${userToRemove} has been removed from the ticket!`, 
        ephemeral: true 
      });
    } catch (err) {
      console.error("[ERROR] Error in your removeuser.js run function:", err);

      // Inform about an error
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
