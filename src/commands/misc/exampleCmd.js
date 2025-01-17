const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test if everything works.")
    .toJSON(),
  testMode: false,
  devOnly: false,
  deleted: false,
  userPermissions: [],
  botPermissions: [],

  run: (client, interaction) => {
    try {
      const embed = new EmbedBuilder()
        .setTitle("title")
        .setDescription("<:ltc:1289099080609431606> - this is litecoin emoji");

      interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.log("[ERROR]".red + "Error in your exampleCmd.js run function:");
      console.log(err);
    }
  },

  // Required for autocomplete option handling ---
  autocomplete: async (client, interaction) => {
    try {
      //...
    } catch (err) {
      console.log(
        "[ERROR]".red + "Error in your exampleCmd.js autocomplete function:"
      );
      console.log(err);
    }
  },
  // --- Required for autocomplete option handling
};
