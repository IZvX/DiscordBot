const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs'); // Required to read and write to a file

// Helper function to get the current vouch count
function getVouchCount() {
    if (!fs.existsSync('vouchCount.txt')) {
        fs.writeFileSync('vouchCount.txt', '0'); // Create file if it doesn't exist
        return 0;
    }

    let data = fs.readFileSync('vouchCount.txt', 'utf8');
    // Ensure the data is a valid number
    if (isNaN(data) || data.trim() === '') {
        return 0;
    }

    return parseInt(data, 10);
}

// Helper function to update the vouch count in the file
function updateVouchCount(count) {
    fs.writeFileSync('vouchCount.txt', count.toString());
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupvouchcheck')
        .setDescription('Setup automatic vouch format checking for a channel')
        .toJSON(),

    run: async (client, interaction) => {
        try {
            // Respond to the interaction to confirm setup
            await interaction.reply({
                content: '✅ Vouch format checker with emoji reactions is now active in this channel.',
                ephemeral: true,
            });

            let vouchCount = getVouchCount(); // Retrieve the current vouch count from the file

            // Now you should pass the client here to use it globally
            client.on('messageCreate', async (message) => {
                // Ignore bot messages
                if (message.author.bot) return;

                // Only check messages that mention the specified user ID
                const targetUserId = '957260557432533062';
                if (!message.content.startsWith(`vouch <@${targetUserId}>`)) {
                    return;
                }

                // Validate the message structure
                const parts = message.content.split(' '); // Split the message by spaces
                if (parts.length < 6) {
                    const embed = new EmbedBuilder()
                        .setColor(16405588)
                        .setTitle('Invalid Vouch Format')
                        .setDescription(`<:v_Arrow:1317201995471523911> Your vouch message is invalid. Please follow the format given to you in the ticket.`)

                    const errorMessage = await message.reply({ embeds: [embed], ephemeral: true });

                    // Delete the error message after 10 seconds
                    setTimeout(() => {
                        errorMessage.delete();
                    }, 10000);

                    await message.delete();
                    return;
                }

                // Extract and validate individual components
                const robuxAmount = parseInt(parts[2], 10);
                const robuxKeyword = parts[3]?.toLowerCase();
                const forKeyword = parts[4]?.toLowerCase();
                const moneyAmount = parseFloat(parts[5]?.replace('$', ''));

                // Ensure there is an image attached to the message
                if (message.attachments.size === 0) {
                    const embed = new EmbedBuilder()
                        .setColor(16405588)
                        .setTitle('Invalid Vouch Format')
                        .setDescription(`<:v_Arrow:1317201995471523911> Your vouch message is missing an image. Please include an image.`)

                    const errorMessage = await message.reply({ embeds: [embed], ephemeral: true });

                    // Delete the error message after 10 seconds
                    setTimeout(() => {
                        errorMessage.delete();
                    }, 10000);

                    await message.delete();
                    return;
                }

                // Check for valid format and values
                if (
                    isNaN(robuxAmount) || 
                    robuxKeyword !== 'robux' || 
                    forKeyword !== 'for' || 
                    isNaN(moneyAmount)
                ) {
                    const embed = new EmbedBuilder()
                        .setColor(16405588)
                        .setTitle('Invalid Vouch Format')
                        .setDescription(`<:v_Arrow:1317201995471523911> Your vouch message is invalid. Please follow the format given to you in the ticket.`)

                    const errorMessage = await message.reply({ embeds: [embed], ephemeral: true });

                    // Delete the error message after 10 seconds
                    setTimeout(() => {
                        errorMessage.delete();
                    }, 10000);

                    await message.delete();
                    return;
                }

                // Increment vouch count for valid messages
                let vouchCount = getVouchCount();
                vouchCount++; // Increment the vouch count
                updateVouchCount(vouchCount); // Update the vouch count in the file
                console.log(`Vouch count updated: ${vouchCount}`);

                // React to the message immediately
                try {
                    const emojiMap = {
                        0: ['<:0_zero:1321541019589939241>', '<:0_zero:1321541070852456479>', '<:0_zero:1321541085926785045>'],
                        1: ['<:1_one:1321541132626427927>', '<:1_one:1321541137978228820>', '<:1_one:1321541143506194554>'],
                        2: ['<:2_two:1321541197789139057>', '<:2_two:1321541199634501704>', '<:2_two:1321541206592721008>'],
                        3: ['<:3_three:1321541237945143348>', '<:3_three:1321541243339145257>', '<:3_three:1321541248749801493>'],
                        4: ['<:4_four:1321541284329951273>', '<:4_four:1321541289266905189>', '<:4_four:1321541293821792379>'],
                        5: ['<:5_five:1321541391721041922>', '<:5_five:1321541398654353582>', '<:5_five:1321541403154579528>'],
                        6: ['<:6_six:1321541435152924765>', '<:6_six:1321541438475075636>', '<:6_six:1321541443566833664>'],
                        7: ['<:7_seven:1321541484763287643>', '<:7_seven:1321541487065956373>', '<:7_seven:1321541493370130464>'],
                        8: ['<:8_eight:1321541537041088606>', '<:8_eight:1321541541885513798>', '<:8_eight:1321541550060339281>'],
                        9: ['<:9_nine:1321541581026754590>', '<:9_nine:1321541586810699866>', '<:9_nine:1321541593479516191>'],
                    };

                    // Convert the vouch count to string and break into digits
                    const vouchCountStr = vouchCount.toString(); // Convert the number to a string

                    // For numbers greater than 99, we handle each digit individually
                    for (let i = 0; i < vouchCountStr.length; i++) {
                        const digit = vouchCountStr[i];
                        const emojis = emojiMap[digit];
                        if (emojis) {
                            // Cycle through the 3 versions of each emoji using `i % 3`
                            const emojiToReact = emojis[i % 3]; 
                            try {
                                await message.react(emojiToReact); // React with the emoji
                                console.log(`Reacted with: ${emojiToReact}`);
                            } catch (err) {
                                console.error("Error reacting with emoji:", err);
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error with reactions:", err);
                }

                // Update the voice channel name after reacting (non-blocking)
                setTimeout(async () => {
                    try {
                        const channel = await client.channels.fetch('1271577372499382405'); // Channel ID for vouches
                        const newChannelName = `vouches: ${vouchCount}`;
                        await channel.setName(newChannelName);
                        console.log(`Updated channel name to: ${newChannelName}`);
                    } catch (err) {
                        console.error("Error updating channel name:", err);
                    }
                }, 1000); // Delay updating channel name by 1 second to avoid rate limits

                // Notify the user to return to the ticket
                const reminderEmbed = new EmbedBuilder()
                    .setColor(5402102)
                    .setTitle('Vouch Received!')
                .setThumbnail(`https://imgur.com/mttenfe.png`)
                    .setDescription(`<:v_Arrow:1317202044938883114> Head back to your ticket and click on the **I Vouched** button to complete the deal!`);

                await message.reply({ embeds: [reminderEmbed], ephemeral: true });
            });

        } catch (err) {
            console.error('Error in setup:', err);
        }
    }
};
