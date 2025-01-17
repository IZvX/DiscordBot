const { AttachmentBuilder,SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const getDatabase = require('../../utils/getDatabase');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');
const rolesConfig = require('../../panelConfig.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription("View your account's info & stats")
        .addUserOption((option) => option.setName('user').setDescription('The user to view info for').setRequired(false))
        .toJSON(),
    testMode: false,
    devOnly: false,
    deleted: false,
    userPermissions: [],
    botPermissions: [],
    run: async (client, interaction) => {
        try {
            const database = await getDatabase();
            await interaction.deferReply();

            const user = interaction.options.getUser('user') || interaction.user;
            const isSelf = user.id === interaction.user.id;

            const LOYAL_ROLE_ID = rolesConfig.loyalCustomer;
            const VIP_ROLE_ID = rolesConfig.VIPCustomer;
            const LOYAL_THRESHOLD = 10000;
            const VIP_THRESHOLD = 50000;

            database.connect(async () => {
                const userId = user.id;

                database.query(`SELECT * FROM users WHERE id='${userId}'`, async (error, results) => {
                    database.end();

                    if (error) {
                        console.error(error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle('Error')
                            .setDescription('❌ An unexpected error occurred while querying the database.');
                        return await interaction.editReply({ embeds: [errorEmbed] });
                    }

                    const userInfo = results[0];

                    if (!userInfo || (userInfo && !userInfo.roblox_id)) {
                        const noUserEmbed = new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle('User Not Found')
                            .setDescription('❌ No information found for this user. To verify your account, run the /profile add command.');
                        return await interaction.editReply({ embeds: [noUserEmbed] });
                    }

                    const purchasesAmount = userInfo.purchases || 0;
                    const robuxBought = userInfo.robux || 0;

                    // Comma-separated Robux value
                    const formattedRobux = robuxBought.toLocaleString();

                    // Determine role progress
                    let progressFooter = '';
                    if (robuxBought < LOYAL_THRESHOLD) {
                        progressFooter = `Loyal Customer`;
                    } else if (robuxBought < VIP_THRESHOLD) {
                        progressFooter = `VIP role!`;
                    }

                    // Assign roles if the user ran the command on themselves
                    if (isSelf) {
                        const member = await interaction.guild.members.fetch(user.id);

                        if (robuxBought >= LOYAL_THRESHOLD && !member.roles.cache.has(LOYAL_ROLE_ID)) {
                            await member.roles.add(LOYAL_ROLE_ID);
                        }
                        if (robuxBought >= VIP_THRESHOLD && !member.roles.cache.has(VIP_ROLE_ID)) {
                            await member.roles.add(VIP_ROLE_ID);
                        }
                    }

                    // Get the player's thumbnail
                    const headshotApiUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${results[0].roblox_id}&size=150x150&format=Png`;
                    const response = await axios.get(headshotApiUrl);
                    const imageUrl = response.data.data[0].imageUrl;

                    const playerInfo = await (await axios.get(`https://users.roblox.com/v1/users/${results[0].roblox_id}`)).data;

                    let displayText;
                    if (playerInfo.displayName === playerInfo.name) {
                        displayText = `## [${playerInfo.name}](https://www.roblox.com/users/${results[0].roblox_id}/profile)`;
                    } else {
                        displayText = `## [${playerInfo.displayName} (@${playerInfo.name})](https://www.roblox.com/users/${results[0].roblox_id}/profile)`;
                    }

                    try {
                        const scale = 4;
            
                        GlobalFonts.registerFromPath('./src/resources/Inter-Regular.ttf', 'Inter');
            
                        //#region bg
                        const width = 128 * scale;
                        const height = 48 * scale;
                        const canvas = createCanvas(width, height);
                        const context = canvas.getContext('2d');
            
                        const backgroundBuffer = fs.readFileSync('./src/resources/bg.png');
                        const background = await loadImage(backgroundBuffer);
            
                        context.drawImage(background, 0, 0, canvas.width, canvas.height);
                        //#endregion
            
                        //#region pfp
                        const pfpURL = imageUrl;
                        const pfpImage = await loadImage(pfpURL);
                        const pfpX = 7 * scale + 16 * scale;
                        const pfpY = 8 * scale + 16 * scale;
                        const pfpRadius = 16 * scale;
            
                        context.save();
                        context.beginPath();
                        context.arc(pfpX, pfpY, pfpRadius, 0, Math.PI * 2, false);
                        context.clip();
            
                        context.drawImage(pfpImage, 7 * scale, 8 * scale, 32 * scale, 32 * scale);
            
                        context.lineWidth = 2 * scale;
                        context.strokeStyle = '#6744FF';
                        context.stroke();
            
                        context.restore();
            
                        //#endregion
            
                        //#region prograssBarBg1
                        const rectX = 41 * scale;
                        const rectY = 27 * scale;
                        const rectWidth = 80 * scale;
                        const rectHeight = 4 * scale;
                        const cornerRadius = 2 * scale;
            
                        context.fillStyle = '#D9D9D9';
                        context.beginPath();
                        context.moveTo(rectX + cornerRadius, rectY);
                        context.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + rectHeight, cornerRadius);
                        context.arcTo(rectX + rectWidth, rectY + rectHeight, rectX, rectY + rectHeight, cornerRadius);
                        context.arcTo(rectX, rectY + rectHeight, rectX, rectY, cornerRadius);
                        context.arcTo(rectX, rectY, rectX + rectWidth, rectY, cornerRadius);
                        context.closePath();
                        context.fill();
                        //#endregion
            
                        //#region progressBarBg2
                        const rectX2 = 42 * scale;
                        const rectY2 = 28 * scale;
                        const rectWidth2 = 78 * scale;
                        const rectHeight2 = 2 * scale;
                        const cornerRadius2 = 1 * scale;
            
                        context.fillStyle = '#49445E';
                        context.beginPath();
                        context.moveTo(rectX2 + cornerRadius2, rectY2);
                        context.arcTo(rectX2 + rectWidth2, rectY2, rectX2 + rectWidth2, rectY2 + rectHeight2, cornerRadius2);
                        context.arcTo(rectX2 + rectWidth2, rectY2 + rectHeight2, rectX2, rectY2 + rectHeight2, cornerRadius2);
                        context.arcTo(rectX2, rectY2 + rectHeight2, rectX2, rectY2, cornerRadius2);
                        context.arcTo(rectX2, rectY2, rectX2 + rectWidth2, rectY2, cornerRadius2);
                        context.closePath();
                        context.fill();
            
                        context.lineWidth = 0.5 * scale;
                        context.strokeStyle = '#49445E';
                        context.stroke();
            
                        const currentProgress = 4000;
                        const maxProgress = 8000;
                        const progressWidth = (robuxBought / LOYAL_THRESHOLD) * rectWidth;
                        //#endregion
            
                        //#region progressBarFill
                        const rectXprogress = 42 * scale;
                        const rectYprogress = 28 * scale;
                        const rectWidthprogress = progressWidth;
                        const rectHeightprogress = 2 * scale;
                        const cornerRadiusprogress = 1 * scale;
            
                        context.fillStyle = '#6744FF';
                        context.beginPath();
                        context.moveTo(rectXprogress + cornerRadiusprogress, rectYprogress);
                        context.arcTo(rectXprogress + rectWidthprogress, rectYprogress, rectXprogress + rectWidthprogress, rectYprogress + rectHeightprogress, cornerRadiusprogress);
                        context.arcTo(rectXprogress + rectWidthprogress, rectYprogress + rectHeightprogress, rectXprogress, rectYprogress + rectHeightprogress, cornerRadiusprogress);
                        context.arcTo(rectXprogress, rectYprogress + rectHeightprogress, rectXprogress, rectYprogress, cornerRadiusprogress);
                        context.arcTo(rectXprogress, rectYprogress, rectXprogress + rectWidthprogress, rectYprogress, cornerRadiusprogress);
                        context.closePath();
                        context.fill();
            
                        context.lineWidth = 0.5 * scale;
                        context.strokeStyle = '#6744FF';
                        context.stroke();
            
                        //#endregion
            
                        //#region Username Text
                        context.fillStyle = '#FFFFFF';
                        context.font = `${10 * scale}px 'Inter'`;
                        context.textAlign = "left";
                        context.textBaseline = "top";
            
                        context.fillText(playerInfo.displayName, 41 * scale, 8 * scale);
            
                        //#endregion 
            
                        //#region Deals Completed Text
                        context.fillStyle = '#FFFFFF';
                        context.font = `${4 * scale}px 'Inter'`;
                        context.textAlign = "left";
                        context.textBaseline = "top";
            
                        context.fillText(`Deals completed: ${purchasesAmount}`, 41 * scale, 20 * scale);
            
                        //#endregion
            
                        //#region Progress Text
                        context.fillText(`${robuxBought}/${LOYAL_THRESHOLD}`, 41 * scale, 34 * scale);
                        //#endregion
            
                        //#region For Text
                        context.fillText(`for`, 68 * scale, 34 * scale);
                        //#endregion
            
                        //#region Customer Text
                        context.font = `${4 * scale}px 'Inter'`;
                        context.textAlign = "center";
                        context.textBaseline = "middle";
                        const member = await interaction.guild.members.fetch(userId);

                        // Now you can access roles
                        const userRoles = member.roles.cache;
                        let userRoleText;
                        
                        if (userRoles.has(VIP_ROLE_ID)) {
                            userRoleText = "VIP Customer";
                        } else if (userRoles.has(LOYAL_ROLE_ID)) {
                            userRoleText = "Loyal Customer";
                        } else {
                            userRoleText = "Customer";
                        }
                        
                        // Use the text in your canvas
                        context.fillText(`${userRoleText}`, 23 * scale, 43 * scale);                        //#endregion
            
                        //#region Rank Text
                        context.shadowColor = '#6744FF';
                        context.shadowBlur = 8;
                        context.shadowOffsetX = 0;
                        context.shadowOffsetY = 0;
                        context.fillStyle = '#6744FF';
                        context.font = `${4 * scale}px 'Inter'`;
                        context.textAlign = "left";
                        context.textBaseline = "top";
            
                        context.fillText(progressFooter, 75 * scale, 34 * scale);
            
                        context.shadowColor = 'transparent';
            
                        //#endregion
            
                        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
            
                        const msg = await interaction.editReply({ files: [attachment] });
            
                    } catch (error) {
                        console.error('Error generating user info image:', error);
                        await interaction.editReply('Error generating user info image. Please try again later.');
                    }

                });
            });
        } catch (error) {

            try {
                const scale = 4;
            
                GlobalFonts.registerFromPath('./src/resources/Inter-Regular.ttf', 'Inter');
            
                //#region bg
                const width = 128 * scale;
                const height = 48 * scale;
                const canvas = createCanvas(width, height);
                const context = canvas.getContext('2d');
            
                const backgroundBuffer = fs.readFileSync('./src/resources/errBg.png');
                const background = await loadImage(backgroundBuffer);
            
                context.drawImage(background, 0, 0, canvas.width, canvas.height);
                //#endregion
            
                //#region pfp
                const pfpBuffer = fs.readFileSync('./src/resources/err.webp');
                const pfp = await loadImage(pfpBuffer);
                const pfpX = 7 * scale + 16 * scale;
                const pfpY = 8 * scale + 16 * scale;
                const pfpRadius = 16 * scale;
            
                context.save();
                context.beginPath();
                context.arc(pfpX, pfpY, pfpRadius, 0, Math.PI * 2, false);
                context.clip();
            
                context.drawImage(pfp, 7 * scale, 8 * scale, 32 * scale, 32 * scale);
            
                context.lineWidth = 2 * scale;
                context.strokeStyle = '#FF4447';
                context.stroke();
            
                context.restore();
            
                //#endregion
            
                //#region progressBarBg1
                const rectX = 41 * scale;
                const rectY = 27 * scale;
                const rectWidth = 80 * scale;
                const rectHeight = 4 * scale;
                const cornerRadius = 2 * scale;
            
                context.fillStyle = '#D9D9D9';
                context.beginPath();
                context.moveTo(rectX + cornerRadius, rectY);
                context.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + rectHeight, cornerRadius);
                context.arcTo(rectX + rectWidth, rectY + rectHeight, rectX, rectY + rectHeight, cornerRadius);
                context.arcTo(rectX, rectY + rectHeight, rectX, rectY, cornerRadius);
                context.arcTo(rectX, rectY, rectX + rectWidth, rectY, cornerRadius);
                context.closePath();
                context.fill();
                //#endregion
            
                //#region progressBarBg2
                const rectX2 = 42 * scale;
                const rectY2 = 28 * scale;
                const rectWidth2 = 78 * scale;
                const rectHeight2 = 2 * scale;
                const cornerRadius2 = 1 * scale;
            
                context.fillStyle = '#49445E';
                context.beginPath();
                context.moveTo(rectX2 + cornerRadius2, rectY2);
                context.arcTo(rectX2 + rectWidth2, rectY2, rectX2 + rectWidth2, rectY2 + rectHeight2, cornerRadius2);
                context.arcTo(rectX2 + rectWidth2, rectY2 + rectHeight2, rectX2, rectY2 + rectHeight2, cornerRadius2);
                context.arcTo(rectX2, rectY2 + rectHeight2, rectX2, rectY2, cornerRadius2);
                context.arcTo(rectX2, rectY2, rectX2 + rectWidth2, rectY2, cornerRadius2);
                context.closePath();
                context.fill();
            
                context.lineWidth = 0.5 * scale;
                context.strokeStyle = '#49445E';
                context.stroke();
            
                const currentProgress = 4000;
                const maxProgress = 8000;
                const progressWidth = (currentProgress / maxProgress) * rectWidth;
                //#endregion
            
                //#region progressBarFill
                const rectXprogress = 42 * scale;
                const rectYprogress = 28 * scale;
                const rectWidthprogress = progressWidth;
                const rectHeightprogress = 2 * scale;
                const cornerRadiusprogress = 1 * scale;
            
                context.fillStyle = '#FF4447'; // Changed from #6744FF
                context.beginPath();
                context.moveTo(rectXprogress + cornerRadiusprogress, rectYprogress);
                context.arcTo(rectXprogress + rectWidthprogress, rectYprogress, rectXprogress + rectWidthprogress, rectYprogress + rectHeightprogress, cornerRadiusprogress);
                context.arcTo(rectXprogress + rectWidthprogress, rectYprogress + rectHeightprogress, rectXprogress, rectYprogress + rectHeightprogress, cornerRadiusprogress);
                context.arcTo(rectXprogress, rectYprogress + rectHeightprogress, rectXprogress, rectYprogress, cornerRadiusprogress);
                context.arcTo(rectXprogress, rectYprogress, rectXprogress + rectWidthprogress, rectYprogress, cornerRadiusprogress);
                context.closePath();
                context.fill();
            
                context.lineWidth = 0.5 * scale;
                context.strokeStyle = '#FF4447'; // Changed from #6744FF
                context.stroke();
            
                //#endregion
            
                //#region Text
                context.fillStyle = '#FFFFFF';
                context.font = `${10 * scale}px 'Inter'`;
                context.textAlign = "left";
                context.textBaseline = "top";
            
                context.fillText("Error", 41 * scale, 8 * scale); // Changed text
            
                //#endregion 
            
                //#region Deals Completed Text
                context.fillStyle = '#FFFFFF';
                context.font = `${4 * scale}px 'Inter'`;
                context.textAlign = "left";
                context.textBaseline = "top";
            
                context.fillText("Error", 41 * scale, 20 * scale); // Changed text
            
                //#endregion
            
                //#region Progress Text
                context.fillText("Error/Error", 41 * scale, 34 * scale); // Changed text
                //#endregion
            
                //#region For Text
                context.fillText("Error", 68 * scale, 34 * scale); // Changed text
                //#endregion
            
                //#region Customer Text
                context.font = `${4 * scale}px 'Inter'`;
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText("Error", 23 * scale, 43 * scale); // Changed text
                //#endregion
            
                //#region Rank Text
                context.shadowColor = '#FF4447'; // Changed from #6744FF
                context.shadowBlur = 8;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
                context.fillStyle = '#FF4447'; // Changed from #6744FF
                context.font = `${4 * scale}px 'Inter'`;
                context.textAlign = "left";
                context.textBaseline = "top";
            
                context.fillText("Error", 95 * scale, 34 * scale); // Changed text
            
                context.shadowColor = 'transparent';
            
                //#endregion
                const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
            
                await interaction.editReply({ files: [attachment] });
            
            } catch (error) {
                console.error('Error generating user info image:', error);
                await interaction.editReply('Error generating user info image. Please try again later.');
            }
            
            console.error(error);
        }
    },
};

