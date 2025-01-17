    const { SlashCommandBuilder, StringSelectMenuBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ChannelType } = require('discord.js');
    const { requireLinkedRobloxID } = require('../../functions/createTicket');
    const path = require('path');
    require('dotenv').config(); // Load environment variables
    const fs = require('fs');
    const panelConfig = require('../../panelConfig.json');
    const { channel } = require('diagnostics_channel');
    const filePath = path.resolve(__dirname, '../../panelConfig.json');
    let roleConfig = {};
    try {
        const data = fs.readFileSync(filePath);
        roleConfig = JSON.parse(data);
    } catch (err) {
        // If the file doesn't exist or is invalid JSON, create a new config
        roleConfig = {
            regularCustomer: panelConfig.regularCustomer,
            loyalCustomer: panelConfig.loyalCustomer,
            VIPCustomer: panelConfig.VIPCustomer,
            blacklist: panelConfig.blacklist,
            categoryId: panelConfig.categoryId
        };
    }


    module.exports = {
        data: new SlashCommandBuilder()
            .setName("panel")
            .setDescription("Manage ticket categories, roles, and other settings."),

        userPermissions: [PermissionFlagsBits.Administrator],

        run: async (client, interaction) => {
            try {
                const panelEmbed = new EmbedBuilder()
                        .setColor(0xFF5733) // Set a vibrant color (this is an orange color in hex)
                        .setTitle("Admin Panel - Management Dashboard") // Updated title for clarity
                        .setDescription(
                            `Welcome to the Admin Panel! Use this interface to manage roles, monitor ticket statuses, toggle linked account checks, and more. Select an option below to get started.  
                            
                            Access the web version: [Click here to open the Web Panel](http://localhost:${process.env.CONTROLPANEL_PORT})`
                        ) // Updated description to include the clickable link
                        .setThumbnail("https://example.com/thumbnail.png") // Add a small image/icon (optional)
                        .addFields(
                            { 
                                name: 'Category ID Management', 
                                value: 'Manage category IDs and assign them to specific roles or tickets. Click here to set or view the category IDs.', 
                                inline: true 
                            },
                            { 
                                name: 'Role Management', 
                                value: 'Manage customer roles (VIP, Loyal, Regular, Blacklist) and assign benefits or restrictions to them. Click here to configure roles.', 
                                inline: true 
                            },
                            { 
                                name: 'Linked Account Check', 
                                value: 'Toggle the linked account check for tickets to ensure only verified accounts are eligible. Click here to manage this setting.', 
                                inline: true 
                            },
                            { 
                                name: 'Vouch Reminder', 
                                value: 'Set a reminder to prompt users to vouch for specific actions or users. Click here to configure reminder settings.', 
                                inline: true 
                            },
                            { 
                                name: 'Clear All Tickets', 
                                value: 'Clear all current tickets from the system. This option is for administrative use to reset ticket statuses or clear backlog.', 
                                inline: true 
                            }
                        ) // Detailed descriptions for each button action
                        .setFooter({ text: 'Admin Panel - Manage Settings', iconURL: 'https://example.com/footer-icon.png' }) // Updated footer for more clarity
                        .setTimestamp(); // Add timestamp to show when the embed was created
                    


                const catIdBtn = new ButtonBuilder()
                    .setCustomId("catIdBtn")
                    .setLabel("Category ID")
                    .setStyle(ButtonStyle.Primary);

                const rolesBtn = new ButtonBuilder()
                    .setCustomId("rolesBtn")
                    .setLabel("Roles")
                    .setStyle(ButtonStyle.Primary);

                const linkedAccCheckBtn = new ButtonBuilder()
                    .setCustomId("linkedAccCheckBtn")
                    .setLabel("Toggle Linked Account Check For Tickets")
                    .setStyle(ButtonStyle.Primary);

                const reminderBtn = new ButtonBuilder()
                    .setCustomId("reminderBtn")
                    .setLabel("Reminder To Vouch")
                    .setStyle(ButtonStyle.Primary);

                const clearTicketsBtn = new ButtonBuilder()
                    .setCustomId("clearTicketsBtn")
                    .setLabel("Clear All Tickets")
                    .setStyle(ButtonStyle.Danger); // Changed to Danger style


                const actionRow = new ActionRowBuilder()
                    .addComponents(catIdBtn, rolesBtn, linkedAccCheckBtn, reminderBtn, clearTicketsBtn);

                const panelMessage = await interaction.reply({ embeds: [panelEmbed], components: [actionRow] });

                const collector = panelMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 150000 });

                collector.on('collect', async i => {
                    if (i.user.id !== interaction.user.id) {
                        return i.reply({ content: 'This button is not for you.', ephemeral: true });
                    }

                    if (i.customId === 'rolesBtn') {
                        const rolesEmbed = new EmbedBuilder()
                            .setTitle("Roles")
                            .setDescription("Manage roles for members.");

                        const vipBtn = new ButtonBuilder()
                            .setCustomId("vipBtn")
                            .setLabel("VIP Customer")
                            .setStyle(ButtonStyle.Primary);

                        const loyalBtn = new ButtonBuilder()
                            .setCustomId("loyalBtn")
                            .setLabel("Loyal Customer")
                            .setStyle(ButtonStyle.Primary);

                        const regularBtn = new ButtonBuilder()
                            .setCustomId("regularBtn")
                            .setLabel("Regular Customer")
                            .setStyle(ButtonStyle.Primary);

                        const blacklistBtn = new ButtonBuilder()
                            .setCustomId("blacklistBtn")
                            .setLabel("Blacklist")
                            .setStyle(ButtonStyle.Danger);

                        const roles = interaction.guild.roles.cache
                            .filter(role => role.name !== '@everyone' && !role.managed)
                            .map(role => ({
                                label: role.name,
                                value: role.id
                            }));

                        if (roles.length === 0) {
                            return i.reply({ content: "No roles available to display.", ephemeral: true });
                        }

                        const dropdown = new StringSelectMenuBuilder()
                            .setCustomId('rolesDropdown')
                            .setPlaceholder('Select a role')
                            .addOptions(roles);

                        const dropdownRow = new ActionRowBuilder()
                            .addComponents(dropdown);

                        const rolesRow = new ActionRowBuilder()
                            .addComponents(vipBtn, loyalBtn, regularBtn, blacklistBtn);

                        await i.deferReply({ ephemeral: true });

                        try {
                            await i.editReply({ embeds: [rolesEmbed], components: [dropdownRow, rolesRow] });
                        } catch (error) {
                            console.error("Error sending roles embed:", error);
                            await i.editReply({ content: "There was an error displaying the roles options." });
                            return;
                        }


                        const subCollector = i.channel.createMessageComponentCollector({
                            filter: subI => subI.isButton() || subI.isStringSelectMenu(),
                            time: 60000
                        });

                        let roleConfigAr = {
                            regularCustomer: null,
                            loyalCustomer: null,
                            VIPCustomer: null,
                            blacklist: null,
                        };

                        let selectedRoleId = null; // Initialize outside the collector

                        subCollector.on('collect', async subInteraction => {
                        if (subInteraction.user.id !== interaction.user.id) {
                                return subInteraction.reply({ content: 'This button is not for you.', ephemeral: true });
                            }


                            if (subInteraction.isStringSelectMenu()) {
                                if (subInteraction.customId === 'rolesDropdown') {
                                    selectedRoleId = subInteraction.values[0];
                                    // Provide feedback to the user
                                    await subInteraction.reply({ content: `Selected role: <@&${selectedRoleId}>`, ephemeral: true });
                                }

                            } else if (subInteraction.isButton()) {
                                switch (subInteraction.customId) {
                                    case 'vipBtn':
                                        roleConfig.VIPCustomer = selectedRoleId;
                                        await subInteraction.reply({ content: `VIP Customer role set to: <@&${selectedRoleId}>`, ephemeral: true });
                                        break;
                                    case 'loyalBtn':
                                        roleConfig.loyalCustomer = selectedRoleId;
                                        await subInteraction.reply({ content: `Loyal Customer role set to: <@&${selectedRoleId}>`, ephemeral: true });
                                        break;
                                    case 'regularBtn':
                                        roleConfig.regularCustomer = selectedRoleId;
                                        await subInteraction.reply({ content: `Regular Customer role set to: <@&${selectedRoleId}>`, ephemeral: true });
                                        break;
                                    case 'blacklistBtn':
                                        roleConfig.blacklist = selectedRoleId;
                                        await subInteraction.reply({ content: `Blacklist role set to: <@&${selectedRoleId}>`, ephemeral: true });
                                        break;
                                    default:
                                        await subInteraction.reply({ content: 'Invalid button pressed.', ephemeral: true });
                                        break;
                                }
                                fs.writeFileSync(filePath, JSON.stringify(roleConfig, null, 2)); // Save updated config
                                console.log("Updated roleConfigAr:", roleConfig);
                            }



                        });


                        subCollector.on('end', () => console.log("Sub-collector ended."));
                    }

                    if (i.customId == "reminderBtn") {
                        const category = client.channels.cache.get(panelConfig.categoryId);
                        const childrenIds = category.children.cache.map(c => c.id);

                        childrenIds.forEach(channelId => {
                            const vouchEmbed = new EmbedBuilder()
                            .setTitle('Vouch Reminder')
                            .setDescription('You need to vouch for something idk tbh. Please take action.')
                            .setColor('#FF0000')
                            .setTimestamp();

                            i.guild.channels.fetch(channelId).then(c => c.send({embeds: [vouchEmbed]})).catch(console.error)
                        });
                    }

                    if (i.customId == "linkedAccCheckBtn") {
                        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
                            return interaction.reply({
                                content: 'You do not have permission to use this command.',
                                ephemeral: true,
                            });
                        }
                
                        requireLinkedRobloxID = !requireLinkedRobloxID;
                
                        await i.reply({
                            content: `The requirement for linked Roblox IDs has been ${requireLinkedRobloxID ? 'enabled' : 'disabled'}.`,
                            ephemeral: true,
                        });
                    }

                    if (i.customId == "catIdBtn") {
                        // Deferring the interaction immediately
                        await i.deferReply({ ephemeral: true });
                    
                        try {
                            // Fetch all channels from the guild and filter out the categories
                            const channels = await i.guild.channels.fetch();
                            const categories = i.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildCategory);

                            if (categories.size === 0) {
                            console.log("  No categories found.");
                            } else {
                            categories.forEach(category => {
                                console.log(`  - ${category.name} (ID: ${category.id})`);
                            });
                            }
                            // Map the categories into a select menu options
                            const categoryOptions = categories.map(cat => ({
                                label: cat.name.slice(0, 100), // Ensure label length doesn't exceed Discord's limits
                                value: cat.id
                            }));
                    
                            // Create a dropdown for category selection
                            const categorySelectMenu = new StringSelectMenuBuilder()
                                .setCustomId('categoryDropdown')
                                .setPlaceholder('Select a category')
                                .addOptions(categoryOptions);
                    
                            const actionRow = new ActionRowBuilder().addComponents(categorySelectMenu);
                    
                            const confirmBtn = new ButtonBuilder()
                                .setCustomId('confirmCategory')
                                .setLabel('Confirm')
                                .setStyle(ButtonStyle.Success);
                    
                            const cancelBtn = new ButtonBuilder()
                                .setCustomId('cancelCategory')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger);
                    
                            const buttonRow = new ActionRowBuilder()
                                .addComponents(confirmBtn, cancelBtn);
                    
                            const categoryEmbed = new EmbedBuilder()
                                .setTitle("Select Category")
                                .setDescription("Please select a category for the configuration.");
                    
                            // Send the category selection embed with dropdown and buttons
                            await i.editReply({
                                embeds: [categoryEmbed],
                                components: [actionRow, buttonRow]
                            });
                    
                            // Handle the category dropdown selection
                            const categoryCollector = i.channel.createMessageComponentCollector({
                                filter: subI => subI.isButton() || subI.isStringSelectMenu(),
                                time: 60000
                            });
                    
                            let selectedCategoryId = null;
                            
                            categoryCollector.on('collect', async subInteraction => {
                                if (subInteraction.user.id !== i.user.id) {
                                    return subInteraction.reply({ content: 'This action is not for you.', ephemeral: true });
                                }
                
                                

                                // Handle the category dropdown selection
                                if (subInteraction.isStringSelectMenu()) {
                                    if (subInteraction.customId === 'categoryDropdown') {
                                        selectedCategoryId = subInteraction.values[0];
                                        await subInteraction.reply({ content: `Selected category: <#${selectedCategoryId}>`, ephemeral: true });
                                    }
                                } else if (subInteraction.isButton()) {
                                    if (subInteraction.customId === 'confirmCategory') {
                                        if (!selectedCategoryId) {
                                            return subInteraction.reply({ content: 'No category selected. Please choose a category first.', ephemeral: true });
                                        }
                                        
                                        // Update the roleConfig with the selected category ID
                                        roleConfig.categoryId = selectedCategoryId;
                                            fs.writeFileSync(filePath, JSON.stringify(roleConfig, null, 2)); // Save updated config
                                            console.log("Updated roleConfigAr:", roleConfig);                                    await subInteraction.reply({ content: `Category ID set to: <#${selectedCategoryId}>`, ephemeral: true });
                                        } else if (subInteraction.customId === 'cancelCategory') {
                                            await subInteraction.reply({ content: 'Category selection canceled.', ephemeral: true });
                                        }
                                    }
                                                        
                                });
                    
                            categoryCollector.on('end', () => console.log("Category selection ended."));
                        } catch (error) {
                            console.error("Error fetching channels or sending embed:", error);
                            await i.editReply({ content: "There was an error fetching the categories." });
                        }
                    }        
                    
                    if (i.customId == "clearTicketsBtn") {
                        const category = client.channels.cache.get(panelConfig.categoryId);
                        const childrenIds = category.children.cache.map(c => c.id);

                        childrenIds.forEach(channelId => {
                            clearChannel(i.guild,channelId);
                            return i.reply({ content: 'Cleared all tickets.', ephemeral: true });
                        });
                    }
                });                
                collector.on('end', collected => console.log(`Collected ${collected.size} items`));

            } catch (error) {
                console.error(error);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: "An error occurred while executing this command." });
                } else {
                    await interaction.reply({ content: "An error occurred while executing this command.", ephemeral: true });
                }
            }
        },
    };

    async function clearChannel(guild,channelId) {
        try {
            const channel = await guild.channels.fetch(channelId); // Fetch the channel by ID

            if (!channel || !channel.isTextBased()) {
                console.error("Invalid channel or channel is not text-based.");
                return;
            }

            // Fetch messages in the channel
            const messages = await channel.messages.fetch({ limit: 100 }); // You can adjust the limit as needed

            // If there are messages to delete
            if (messages.size > 0) {
                await channel.bulkDelete(messages, true); // Delete the messages
                console.log(`${messages.size} messages deleted in channel ${channelId}`);
            } else {
                console.log("No messages found to delete.");
            }
        } catch (error) {
            console.error("Error clearing channel:", error);
        }
    }
