const { REST, Routes } = require('discord.js');
const readline = require('readline');
const { clientId, guildId } = require('../config.json'); // Update this with your client ID, token, and guild ID
require('dotenv/config');

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  try {
    // Fetch all commands for a guild
    const guildCommands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));

    // Fetch global commands (commands available across all servers)
    const globalCommands = await rest.get(Routes.applicationCommands(clientId));

    // Combine both lists (guild-specific and global)
    const allCommands = [...guildCommands, ...globalCommands];

    if (allCommands.length === 0) {
      console.log("No commands registered.");
      rl.close();
      return;
    }

    // Display the commands with their IDs
    console.log("Registered commands:");
    allCommands.forEach((command, index) => {
      console.log(`${index + 1}: ${command.name} (ID: ${command.id})`);
    });

    // Ask user to select a command to unregister
    rl.question("\nEnter the number of the command you want to unregister: ", async (choice) => {
      const commandIndex = parseInt(choice) - 1;

      if (commandIndex < 0 || commandIndex >= allCommands.length) {
        console.log("Invalid choice.");
        rl.close();
        return;
      }

      const commandToDelete = allCommands[commandIndex];
      console.log(`You selected: ${commandToDelete.name}`);

      // Confirm deletion
      rl.question(`Are you sure you want to delete the command "${commandToDelete.name}"? (y/n): `, async (confirmation) => {
        if (confirmation.toLowerCase() === 'y') {
          try {
            // Delete the selected command
            if (commandToDelete.guild_id) {
              // Delete guild-specific command
              await rest.delete(Routes.applicationGuildCommand(clientId, guildId, commandToDelete.id));
            } else {
              // Delete global command
              await rest.delete(Routes.applicationCommand(clientId, commandToDelete.id));
            }
            console.log(`Successfully deleted command: ${commandToDelete.name}`);
          } catch (error) {
            console.error('Error deleting command:', error);
          }
        } else {
          console.log("Command deletion canceled.");
        }

        rl.close();
      });
    });
  } catch (error) {
    console.error('Error fetching commands:', error);
    rl.close();
  }
})();
