const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('calc')
		.setDescription('Calculate robux to USD')
		.addNumberOption((option) =>
			option
				.setName('amount')
				.setDescription('The amount to calculate')
				.setRequired(true)
		)
		.toJSON(),

	run: async (client, interaction) => {
		try {
			const amount = interaction.options.getNumber('amount');

			// Check if the amount is within the allowed range
			if (amount < 1000) {
				const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
					.setTitle('Invalid Amount')
					.setDescription('> <:no:1272884877515165696> The amount must be **1000** or more');

				return await interaction.reply({
					embeds: [errorEmbed],
					ephemeral: true,
				});
			}else if(amount >= 200000)
			{
				const errorEmbed = new EmbedBuilder()
				.setColor('Red')
				.setTitle('Invalid Amount')
				.setDescription('> <:no:1272884877515165696> The amount must be less than **200000**');

				return await interaction.reply({
					embeds: [errorEmbed],
					ephemeral: true,
				});
			}

			const result = amount * 0.006;

			const embed = new EmbedBuilder()
				.setColor(5402102)
				.setTitle(`<:Untitled15_20241206201119:1314670878885286020> Robux Conversion`)
				.setDescription(
					`**${amount}**<:c2fc0404eeb8d393407bdaebe2cc9994:1314670896245641267> is **${result.toFixed(2)}$** / **${(
						result * 10
					).toFixed(0)}KR**`
				);

			await interaction.reply({ embeds: [embed] });
		} catch (err) {
			console.log('[ERROR] Error in your calc.js run function:');
			console.log(err);
		}
	},
};
