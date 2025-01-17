require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');
const panelConfig = require('./panelConfig.json');
const { spawn } = require('child_process');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Initialize the Roblox ID toggle setting
client.requireRobloxId = false;

eventHandler(client);

const createTicket = require('./functions/createTicket');

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isButton()) return;

	if (interaction.customId === 'createTicket') {
		let categoryId = panelConfig.categoryId;
		let blackListedRoleId = panelConfig.blacklist;

		await createTicket(interaction, blackListedRoleId, categoryId, client);
	}
});

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isButton()) return;

	if (interaction.customId === 'closeTicket') {
		const channel = interaction.channel;

		await interaction.reply('Deleting..');

		setTimeout(async () => {
			await channel.delete().catch(console.error);
		}, 2000);
	}
});

process.on('uncaughtException', (err) => {
	console.error('[ERROR] Uncaught Exception:', err);
});


// Process for starting the control panel
const startControlPanel = () => {
    const botControlPath = './src/controlpanel/botControl.js';
    const child = spawn('node', [botControlPath], { stdio: 'inherit' });

    child.on('error', (err) => {
        console.error('Failed to start botControl.js:', err);
    });

    child.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Control Panel process exited with code ${code}`);
        } else {
            console.log('Control Panel started successfully.');
        }
    });
};

// Run both the bot and control panel
startControlPanel();

client.login(process.env.DISCORD_TOKEN);

// Graceful error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('[ERROR] Uncaught Exception:', err);
});
