const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ComponentType,
	ChannelType,
	PermissionFlagsBits,
} = require('discord.js');
const handleUsernameProcess = require('./otherTicketFunctions');
const fs = require('fs');
const axios = require('axios');
const getDatabase = require('../utils/getDatabase');

function getTicketCount() {
	const data = fs.readFileSync('ticketCount.txt', 'utf8');
	return parseInt(data, 10);
}

function updateTicketCount(count) {
	fs.writeFileSync('ticketCount.txt', count.toString());
}

async function createTicket(interaction, blackListedRoleId, categoryId, client) {
	const blackListedRoleId1 = '1272261764502917130';
	if (blackListedRoleId1 && interaction.member.roles.cache.has(blackListedRoleId1)) {
		return await interaction.reply({
			content: "You are not allowed to open a ticket because you're blacklisted. Contact the owner for further details.",
			ephemeral: true,
		});
	}

	// Check if the user has a linked roblox_id
	const database = await getDatabase();
	let robloxId;

	try {
		await new Promise((resolve, reject) => {
			database.connect((err) => {
				if (err) return reject(err);

				database.query(`SELECT roblox_id FROM users WHERE id='${interaction.user.id}'`, (error, results) => {
					database.end();

					if (error) return reject(error);
					if (results.length > 0) {
						robloxId = results[0].roblox_id;
					}
					resolve();
				});
			});
		});
	} catch (error) {
		console.error('Database error:', error);
		return await interaction.reply({
			content: 'An error occurred while checking your account details. Please try again later.',
			ephemeral: true,
		});
	}

	let ticketCount = getTicketCount();
	ticketCount++;
	const channelName = `ticket-${String(ticketCount).padStart(4, '0')}`;
	const category = await client.channels.fetch(categoryId);

	if (category) {
		const newChannel = await category.children.create({
			name: channelName,
			type: ChannelType.GuildText,
			permissionOverwrites: [
				{
					id: interaction.guild.id,
					deny: [PermissionFlagsBits.ViewChannel],
				},
				{
					id: interaction.user.id,
					allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.UseApplicationCommands                           ],
				},
			],
		});

		updateTicketCount(ticketCount);

		await interaction.reply({
			content: `\`✅\` Ticket successfully opened in ${newChannel} `,
			ephemeral: true,
		});

		const closeButton = new ButtonBuilder().setCustomId('closeTicket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
		const closeRow = new ActionRowBuilder().addComponents(closeButton);

// Welcome Embed
const welcomeEmbed = new EmbedBuilder()
    .setColor(5402102)
    .setTitle('<:6WhiteBear_Laugh:1269770104111894643> Hello!')
    .setDescription(`> Welcome to Swish - Robux & Services! Please answer the following questions to order!`);

// Hi Embed (conditionally included if robloxId is not linked)
const embeds = [welcomeEmbed];
if (!robloxId) {
    const hiEmbed = new EmbedBuilder()
        .setTitle('Warning')
        .setDescription(`<:v_Arrow:1317201995471523911> You need to verify youre profile in order to procceed. Verify your profile by saying </profile add:0>`)
        .setColor(16405588);
    embeds.push(hiEmbed);
}

// Send the combined embeds with the close button
await newChannel.send({
    content: `<@${interaction.user.id}>`,
    embeds: embeds,
    components: [closeRow],
});


		const paymentEmbed = new EmbedBuilder()
			.setColor(5402102)
			.setTitle('<:ShinyBlueSparkles:1290374545936486544> Select a Payment Method')
			.setDescription('> Please select your preferred payment method from the dropdown menu.');

		const paymentSelect = new StringSelectMenuBuilder()
			.setCustomId('selectPayment')
			.setPlaceholder('Choose a payment method')
			.addOptions(
				new StringSelectMenuOptionBuilder().setLabel('PayPal').setDescription('Click me to select PayPal').setEmoji('<:rpayment_paypal:1290373986240430163>').setValue('paypal'),
	//			new StringSelectMenuOptionBuilder().setLabel('Swish').setDescription('Click me to select Swish').setEmoji('<:swish:1289099190189821963>').setValue('swish'),
				new StringSelectMenuOptionBuilder().setLabel('LTC').setDescription('Click me to select Litecoin (LTC)').setEmoji('<:litecoin:1292209341411098746>').setValue('ltc'),
				new StringSelectMenuOptionBuilder().setLabel('Apple Giftcard (SWEDEN ONLY)').setDescription('Click me to select Apple Giftcard (Card Payment)').setEmoji('<:Apple:1326971277017354361>').setValue('apple')
			);

		const paymentRow = new ActionRowBuilder().addComponents(paymentSelect);

		await newChannel.send({
			embeds: [paymentEmbed],
			components: [paymentRow],
		});

		const paymentFilter = (i) => i.customId === 'selectPayment' && i.user.id === interaction.user.id;
		const paymentCollector = newChannel.createMessageComponentCollector({
			filter: paymentFilter,
			componentType: ComponentType.StringSelect,
			time: null,
		});

		paymentCollector.on('collect', async (paymentInteraction) => {
			const selectedPayment = paymentInteraction.values[0];
			await paymentInteraction.reply({
				content: `Selected Payment Method: ${selectedPayment}`,
				ephemeral: true,
			});

			const disabledPaymentSelect = new StringSelectMenuBuilder()
				.setCustomId('selectPayment')
				.setPlaceholder('-')
				.setDisabled(true)
				.addOptions(
					new StringSelectMenuOptionBuilder().setLabel('PayPal').setDescription('Click me to select PayPal').setEmoji('<:paypal:1289099355030159392>').setValue('paypal'),
					new StringSelectMenuOptionBuilder().setLabel('Swish').setDescription('Click me to select Swish').setEmoji('<:swish:1289099190189821963>').setValue('swish'),
					new StringSelectMenuOptionBuilder().setLabel('LTC').setDescription('Click me to select Litecoin (LTC)').setEmoji('<:ltc:1289099080609431606>').setValue('ltc'),
				new StringSelectMenuOptionBuilder().setLabel('Apple Giftcard (SWEDEN ONLY)').setDescription('Click me to select Apple Giftcard (Card Payment)').setEmoji('<:Apple:1326971277017354361>').setValue('apple')
				);

			const disabledPaymentRow = new ActionRowBuilder().addComponents(disabledPaymentSelect);

			await paymentInteraction.message.edit({
				components: [disabledPaymentRow],
			});

			await handleUsernameProcess(newChannel, interaction, selectedPayment);
		});
	} else {
		await interaction.reply({
			content: 'Category not found!',
			ephemeral: true,
		});
	}
}

module.exports = createTicket;