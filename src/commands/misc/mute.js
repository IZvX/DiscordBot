const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const ms = require('ms');

module.exports = {

  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a user by their ID for a specified time.")
    .addUserOption(option => 
      option.setName("member")
        .setDescription("The ID of the user to mute")
        .setRequired(true))
    .addStringOption(option => 
      option.setName("duration")
        .setDescription("Duration of the mute (e.g., 1h, 30m, 1d)")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  run: async (client, interaction) => {
    return module.exports.execute(interaction);
  },

  execute: async (interaction) => {
    const user = interaction.options.getUser("member");
    const userId = user.id;
    const duration = interaction.options.getString("duration");

    try {
      const member = await interaction.guild.members.fetch(userId);
      const timeMs = ms(duration);
      console.log(timeMs)
      if (isNaN(timeMs)) {
        return interaction.reply({ 
          content: "Invalid duration format. Use formats like '1h', '30m', '1d'.",
          ephemeral: true
        });
      }

      await member.timeout(timeMs);
      
      const embed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setDescription(`**\<:dynosuccess:1288083167785517108> ${member.user.tag} *was muted***`)

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
  }

};