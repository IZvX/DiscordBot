const { EmbedBuilder } = require("discord.js");

/**
 * @param {import('discord.js').Client} client - The Discord client instance.
 * @param {Object} options - Configuration options for the event.
 * @param {string} options.channelId - The ID of the channel to send the welcome message to.
 * @param {string} options.welcomeMessage - The message to send to the new member.
 */
module.exports = async (client) => {
  const blank = "<:blank:1269382344578699404>";
  // WELCOME
  client.on("guildMemberAdd", async (member) => {
    const channelId = "1269406917332307979";
    const channel = member.guild.channels.cache.get(channelId);

    const embed = new EmbedBuilder()
      .setTitle(`<:ShinyBlueSparkles:1290374545936486544> - ${member.displayName}`)
      .setColor(5402102)
      .setDescription(
        `[shop](https://discord.com/channels/1269351027640107053/1269351028483031113)${blank}${blank}${blank} ﹒\n${blank}${blank}<:robux:1314670878885286020>${blank}${blank}\n﹒${blank}${blank}${blank}[verify](https://discord.com/channels/1269351027640107053/1269351028013400191)`
      )
      .setThumbnail(member.displayAvatarURL());

    if (channel) {
      try {
        await channel.send({ content: `${member}`, embeds: [embed] });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      console.log(`Channel with ID ${channelId} not found.`);
    }
  });

  // BAIBAI

  client.on("guildMemberRemove", async (member) => {
    const channelId = "";
    const channel = member.guild.channels.cache.get(channelId);
  });
};
