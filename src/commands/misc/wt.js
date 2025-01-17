const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");  

module.exports = {  
  data: new SlashCommandBuilder()  
    .setName("wt")  
    .setDescription("Calculate how much you have to pay to receive the amount entered.")  
    .addNumberOption(option =>  
      option.setName("amount")  
        .setDescription("The amount to calculate")  
        .setRequired(true))  
    .toJSON(),  

  run: async (client, interaction) => {  
    try {  
      const amount = interaction.options.getNumber("amount");  
      const result = amount / 0.7;  

      const embed = new EmbedBuilder()  
        .setColor(0x0000FF)  
        .setDescription(`**${amount}R$** wt is ${result.toFixed()}.`);  

      await interaction.reply({ embeds: [embed] });  
    } catch (err) {  
      console.log("[ERROR] Error in your at.js run function:");  
      console.log(err);  
    }  
  },  
};