const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  customId: "idkdkdk;klasjfhf",
  testMode: false,
  devOnly: false,
  userPermissions: [],
  botPermissions: [],

  run: async (client, interaction) => {
    try {
      await interaction.reply({
        content: `${robloxUsername}`,
        ephemeral: true, // Makes the message visible only to the user
      });
    } catch (err) {
      console.log("[ERROR]".red + "Error in your exampleBtn.js run function:");
      console.log(err);
    }
  },
};
