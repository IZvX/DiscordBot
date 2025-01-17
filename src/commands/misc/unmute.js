const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {

  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmute a user by their ID.")
    .addUserOption(option =>
      option.setName("member")
        .setDescription("The member to unmute")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  run: async (client, interaction) => {
    return module.exports.execute(interaction);
  },

  execute: async (interaction) => {
    const user = interaction.options.getUser("member");
    const userId = user.id;

    try {
      const member = await interaction.guild.members.fetch(userId);

      if (!member.communicationDisabledUntilTimestamp) {
        return interaction.reply({
          content: `${member.user.tag} is not muted.`,
          ephemeral: true
        });
      }

      await member.timeout(null);

      const embed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setDescription(`**\<:dynosuccess:1288083167785517108> ${member.user.tag} *was unmuted***`);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
  }

};
