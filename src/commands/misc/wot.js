const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");  

module.exports = {  
  data: new SlashCommandBuilder()  
    .setName("wot")  
    .setDescription("Calculate how much you will receive after getting paid the amount entered.")  
    .addNumberOption(option =>  
      option.setName("amount")  
        .setDescription("The amount to calculate")  
        .setRequired(true))  
    .toJSON(),  

  run: async (client, interaction) => {  
    try {  
      const amount = interaction.options.getNumber("amount");  
      const result = amount * 0.7;  

      const embed = new EmbedBuilder()  
        .setColor(0x0000FF)  
        .setDescription(`**${amount}R$** wot is ${result}.`);  

      await interaction.reply({ embeds: [embed] });  
    } catch (err) {  
      console.log("[ERROR] Error in your bt.js run function:");  
      console.log(err);  
    }  
  },  
};