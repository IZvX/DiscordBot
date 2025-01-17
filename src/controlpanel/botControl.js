require('dotenv').config(); // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const { Client, IntentsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config.json')

const app = express();
const port = process.env.CONTROLPANEL_PORT;
const filePath = path.resolve(__dirname, '../panelConfig.json'); // Path to config file
const db = require('./database'); // Import database functions

app.use(express.static(path.join(__dirname, 'public'))); // Correctly serves files from /public

// Discord bot setup
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages, // Add necessary intents
        IntentsBitField.Flags.MessageContent,  // For clearing messages
    ],
});

client.login(process.env.DISCORD_TOKEN); // Your bot token

// Middleware
app.use(bodyParser.json());

// Load Configuration
let panelConfig = {};
try {
    const data = fs.readFileSync(filePath);
    panelConfig = JSON.parse(data);
} catch (err) {
    panelConfig = {  // Default configuration
        regularCustomer: null,
        loyalCustomer: null,
        VIPCustomer: null,
        blacklist: null,
        categoryId: null,
        requireLinkedRobloxID: false // Add the linked account check setting
    };
    fs.writeFileSync(filePath, JSON.stringify(panelConfig, null, 2));
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve index.html
});

// API Endpoint for getting roles (mock data for now)
app.get('/api/roles', async (req, res) => {
    try {
        const guild = await client.guilds.fetch(config.guildId);  // Use your guild ID here
        const roles = guild.roles.cache.map(role => ({
            id: role.id,
            name: role.name
        }));
        
        res.json({ success: true, roles: roles });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch roles.' });
    }
});

// API Endpoint for getting categories (mock data for now)
app.get('/api/categories', async (req, res) => {
    try {
        const guild = await client.guilds.fetch(config.guildId);  // Use your guild ID here
        // Mock categories, you can replace this with actual data
        const channels = await guild.channels.fetch();
        const categories = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildCategory);

        res.json({ success: true, categories: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
    }
});

// API Endpoint for getting categories (mock data for now)
app.get('/api/channels', async (req, res) => {
    try {
        const guild = await client.guilds.fetch(config.guildId);  // Use your guild ID here
        // Mock categories, you can replace this with actual data
        const channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);

        res.json({ success: true, categories: channels });
    } catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch channels.' });
    }
});


app.get('/api/bannedUsers', async (req, res) => {
    try {
        const guild = await client.guilds.fetch(config.guildId);
        const banned = await guild.bans.fetch();
        const bannedUsers = Array.from(banned.entries()).map(([userId, ban]) => ({
            username: ban.user.tag,
            pfp: ban.user.displayAvatarURL({ size: 64, dynamic: true }), // Get PFP URL
        }));

        res.json({ success: true, bannedUsers });
    } catch (error) {
        console.error('Error fetching banned users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch banned users.' });
    }
});

app.get('/api/timedOutUsers', async (req, res) => {
    try {
        const guild = await client.guilds.fetch(config.guildId);
        const timedOutUsers = [];

        // This loop is inefficient for large servers!
        for (const [memberId, member] of guild.members.cache) {
            if (member.communicationDisabledUntilTimestamp) {
                timedOutUsers.push({
                    userId: member.id,
                    username: member.user.tag,
                    pfp: member.user.displayAvatarURL({ size: 64, dynamic: true }), // Get PFP URL
                    timeoutDuration: member.communicationDisabledUntilTimestamp - Date.now(), //Calculate remaining time
                });
            }
        }

        res.json({ success: true, timedOutUsers });
    } catch (error) {
        console.error('Error fetching timed-out users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch timed-out users.' });
    }
});



// Example: Category ID Endpoint
app.post('/api/submitCategory', (req, res) => {
    try {
    // Authentication...

    const { categoryId } = req.body;  // Get the category ID from the request body
    panelConfig.categoryId = categoryId;
    fs.writeFileSync(filePath, JSON.stringify(panelConfig, null, 2));
    res.json({ success: true, message: `Category ID set to ${categoryId}` });

  } catch (error) {
    console.error("Error setting category ID:", error);
    res.status(500).json({ success: false, message: 'Failed to set category ID.' });
  }
});

// Generalized endpoint for setting any customer role
app.post('/api/submitRole', (req, res) => {
    try {
        const { roleType, roleValue } = req.body;  // Get the role type and value from the request body
        console.log(`Received roleType: ${roleType}, roleValue: ${roleValue}`);  // Debugging: log received data

        if (panelConfig.hasOwnProperty(roleType)) {
            panelConfig[roleType] = roleValue;
            fs.writeFileSync(filePath, JSON.stringify(panelConfig, null, 2));
            res.json({ success: true, message: `${roleType} set to ${roleValue}` });
        } else {
            console.log(`Invalid roleType: ${roleType}`);  // Debugging: log invalid role type
            res.status(400).json({ success: false, message: 'Invalid role type.' });
        }

    } catch (error) {
        console.error(`Error setting ${roleType}:`, error);
        res.status(500).json({ success: false, message: `Failed to set ${roleType}.` });
    }
});


// API Endpoint for clearing tickets
app.post('/api/clearTickets', async (req, res) => {
  try {
    // Wait for the bot to be ready
    if (!client.isReady()) {
        return res.status(503).json({ success: false, message: 'Bot is not ready yet.' });
    }

    const category = client.channels.cache.get(panelConfig.categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
        return res.status(400).json({ success: false, message: 'Invalid category ID.' });
    }

    const childrenIds = category.children.cache.map(c => c.id);

    const deletionPromises = childrenIds.map(channelId => clearChannel(config.guildId, channelId, client)); // Pass req.body.guildId to clearChannel
    await Promise.all(deletionPromises);  // Wait for all channels to be cleared

    res.json({ success: true, message: 'Tickets cleared successfully!' });
  } catch (error) {
    console.error('Error clearing tickets:', error);
    res.status(500).json({ success: false, message: 'Failed to clear tickets.' });
  }
});


app.post('/api/createEmbed', async (req, res) => {
    try {
        const { channelId } = req.body;

        if (!channelId) {
            return res.status(400).json({ success: false, message: 'Missing channelId.' });
        }

        const guild = await client.guilds.fetch(config.guildId);
        const channel = await guild.channels.fetch(channelId);

        if (!channel) {
            return res.status(404).json({ success: false, message: 'Channel not found.' });
        }

        if (!channel.isTextBased()) {
            return res.status(400).json({ success: false, message: 'Channel is not a text channel.' });
        }

        // Static embed content
        const embed = new EmbedBuilder()
            .setColor(5402102)
            .setTitle('<:robux:1314670878885286020> Purchase Robux')
            .setDescription('Click the button below to get your order started.');

        const button = new ButtonBuilder()
            .setCustomId('createTicket')
            .setLabel('Buy')
            .setEmoji('1314971567003930634')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(button);

        await channel.send({ embeds: [embed], components: [row] });

        res.json({ success: true, message: 'Embed created successfully!' });

    } catch (error) {
        console.error('Error creating embed:', error);
        res.status(500).json({ success: false, message: 'Failed to create embed.' });
    }
});



app.get('/api/json-files', (req, res) => {
    const directoryPath = path.join(__dirname, '../');  // Adjust as needed for your directory
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error reading directory' });
        }
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        res.json(jsonFiles);
    });
});

app.get('/api/json-file-content', (req, res) => {
    const { fileName } = req.query;

    if (!fileName) {
        return res.status(400).json({ message: 'File name is required.' });
    }

    const filePath = path.resolve(__dirname, `../${fileName}`);
    try {
        const jsonData = require(filePath); // Dynamically require the JSON file
        res.json(jsonData);
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ message: 'Failed to read JSON file.' });
    }
});


app.post('/api/update-json', (req, res) => {
    const { fileName, jsonContent } = req.body;

    if (!fileName || !jsonContent) {
        return res.status(400).json({ success: false, message: 'File name and JSON content are required.' });
    }

    // Write JSON content to the file
    const filePath = path.resolve(__dirname, `../${fileName}`);
    try {
        fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2));
        console.log(jsonContent)
        res.json({ success: true, message: 'File updated successfully.' });

    } catch (error) {
        console.error('Error writing file:', error);
        res.status(500).json({ success: false, message: 'Failed to update file.' });
    }
});



app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded



// Start the server after the bot is logged in
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    app.listen(port, () => console.log(`Dashboard listening on port ${port}`));
});

// Modified clearChannel function to accept guild ID and client
async function clearChannel(guildId, channelId, client) {  // Add client as an argument
    try {
        const guild = await client.guilds.fetch(guildId);  // Fetch the guild
        const channel = await guild.channels.fetch(channelId);  // Fetch the channel from the guild

        if (!channel || !channel.isTextBased()) {
            console.error("Invalid channel or channel is not text-based.");
            return;
        }

        const messages = await channel.messages.fetch({ limit: 100 });
        if (messages.size > 0) {
            await channel.bulkDelete(messages, true);
            console.log(`${messages.size} messages deleted in channel ${channelId}`);
        } else {
            console.log("No messages found to delete.");
        }
    } catch (error) {
        console.error("Error clearing channel:", error);
    }
}


