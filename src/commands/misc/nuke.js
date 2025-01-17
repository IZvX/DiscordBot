const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("Delete channels in the specified category")
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Number of channels to delete (latest first)")
        .setRequired(false)
    )
    .toJSON(),
  testMode: false,
  devOnly: false,
  deleted: false,
  userPermissions: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.ManageChannels],

  run: async (client, interaction) => {
    const categoryId = "1269351028776767534"; // Hardcoded category ID
    const amount = interaction.options.getInteger("amount");

    // Check for the Administrator permission
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    // Find all channels in the category
    const categoryChannels = interaction.guild.channels.cache.filter(
      channel => channel.parentId === categoryId
    );

    if (categoryChannels.size === 0) {
      return interaction.reply({
        content: "No channels were found in the specified category.",
        ephemeral: true,
      });
    }

    // Sort channels by creation date (newest first)
    const sortedChannels = [...categoryChannels.values()].sort((a, b) => b.createdAt - a.createdAt);

    // Determine how many channels to delete
    const channelsToDelete = amount ? sortedChannels.slice(0, amount) : sortedChannels;

    try {
      // Delete the channels
      for (const channel of channelsToDelete) {
        await channel.delete();
      }

      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(
          `**${channelsToDelete.length} channel(s)** have been deleted from the category **${categoryChannels.first().parent.name}**.`
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[ERROR] Error in deletecategory.js run function:", error);

      await interaction.reply({
        content: "An error occurred while trying to delete channels. Please check my permissions or try again.",
        ephemeral: true,
      });
    }
  },
};
