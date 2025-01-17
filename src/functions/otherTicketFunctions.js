const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const {
  getUsernameFromId,
  getIdFromUsername,
  getPlayerInfo,
} = require("noblox.js");
const axios = require("axios");
const { getLTCtoUSDRate } = require("../utils/cryptoUtils");
const getDatabase = require("../utils/getDatabase");
const { createPaypalPayment } = require("../functions/paymentMethods/paypal");

try {
  async function handleUsernameProcess(channel, interaction, paymentMethod) {
    try {
      const database = await getDatabase();

      let robloxUsername;
      let mainEmbedMessage;

      async function askUsernameAndConfirm(redirect = false) {
        try {
          const userId = interaction.user.id;

          if (redirect) {
            const askEmbed = new EmbedBuilder()
              .setTitle("<:premium:1314667888644456520> Username ")
              .setDescription(`> **Mention your roblox username**`)
              .setColor(5402102);

            mainEmbedMessage = await channel.send({ embeds: [askEmbed] });

            const usernameFilter = (response) =>
              response.author.id === interaction.user.id;
            const usernameCollector = channel.createMessageCollector({
              filter: usernameFilter,
              max: 1,
              time: null,
            });

            usernameCollector.on("collect", async (usernameMessage) => {
              robloxUsername = usernameMessage.content;
              await handleUsernameConfirmation(robloxUsername);
            });

            return;
          }

          database.connect(async (error) => {
            if (error) {
              console.log(error);
              const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle("Error")
                .setDescription(
                  "❌ An error occurred while querying the database."
                );
              return await interaction.editReply({
                embeds: [errorEmbed],
                ephemeral: true,
              });
            }

            database.query(
              `SELECT * FROM users WHERE id='${userId}'`,
              async (error, results) => {
                database.end();

                if (error) {
                  console.log(error);
                  const errorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle("Error")
                    .setDescription(
                      "❌ An error occurred while querying the database."
                    );
                  return await interaction.editReply({
                    embeds: [errorEmbed],
                    ephemeral: true,
                  });
                }

                if (results.length > 0 && results[0].roblox_id) {
                  const headshotApiUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${results[0].roblox_id}&size=150x150&format=Png`;
                  const response = await axios.get(headshotApiUrl);
                  const imageUrl = response.data.data[0].imageUrl;

                  const playerInfo = await (
                    await axios.get(
                      `https://users.roblox.com/v1/users/${results[0].roblox_id}`
                    )
                  ).data;

                  const askEmbed = new EmbedBuilder()
                    .setTitle("<:premium:1314667888644456520> Username ")
                    .setDescription(
                      `> We've noticed that you have an account verified, would you like to use **${playerInfo.displayName}** (@${playerInfo.name})?`
                    )
                    .setThumbnail(imageUrl || "https://via.placeholder.com/150")
                    .setColor(5402102);

                  const yesButton = new ButtonBuilder()
                    .setCustomId("useVerified")
                    .setLabel("Yes")
                    .setEmoji("<:yes:1272884844942332008>")
                    .setStyle(ButtonStyle.Secondary);
                  const noButton = new ButtonBuilder()
                    .setCustomId("useDifferent")
                    .setLabel("Use a Different Account")
                    .setEmoji("<:no:1272884877515165696>")
                    .setStyle(ButtonStyle.Secondary);
                  const row = new ActionRowBuilder().addComponents(
                    yesButton,
                    noButton
                  );

                  mainEmbedMessage = await channel.send({
                    embeds: [askEmbed],
                    components: [row],
                  });

                  const confirmationFilter = (i) =>
                    i.user.id === interaction.user.id;
                  const confirmationCollector =
                    channel.createMessageComponentCollector({
                      filter: confirmationFilter,
                      max: 1,
                    });

                  confirmationCollector.on(
                    "collect",
                    async (confirmInteraction) => {
                      await confirmInteraction.deferUpdate();

                      const playerInfo = await (
                        await axios.get(
                          `https://users.roblox.com/v1/users/${results[0].roblox_id}`
                        )
                      ).data;
                      verifiedUsername = playerInfo.name;

                      if (confirmInteraction.customId === "useVerified") {
                        const confirmedEmbed = new EmbedBuilder()
                          .setTitle(
                            `<:Untitled15_20241206200936:1314670916642410567> Username`
                          )
                          .setDescription(
                            `> <:yes:1272884844942332008> **CONFIRMED!**\n` +
                              `> **${playerInfo.displayName}** (@${playerInfo.name})`
                          )
                          .setThumbnail(imageUrl)
                          .setColor(5697630);

                        await mainEmbedMessage.edit({
                          embeds: [confirmedEmbed],
                          components: [],
                        });

                        robloxUsername = verifiedUsername;
                        await askRobuxAmount(
                          channel,
                          interaction,
                          paymentMethod,
                          verifiedUsername
                        );
                      } else if (
                        confirmInteraction.customId === "useDifferent"
                      ) {
                        await mainEmbedMessage.delete();
                        const askEmbed = new EmbedBuilder()
                          .setTitle("<:premium:1314667888644456520> Username")
                          .setDescription(`> **Mention your roblox username**`)
                          .setColor(5402102);

                        mainEmbedMessage = await channel.send({
                          embeds: [askEmbed],
                        });

                        const usernameFilter = (response) =>
                          response.author.id === interaction.user.id;
                        const usernameCollector =
                          channel.createMessageCollector({
                            filter: usernameFilter,
                            max: 1,
                            time: null,
                          });

                        usernameCollector.on(
                          "collect",
                          async (usernameMessage) => {
                            robloxUsername = usernameMessage.content;
                            await handleUsernameConfirmation(robloxUsername);
                          }
                        );
                      }
                    }
                  );
                } else {
                  // Embed asking for the Roblox username
                  const askEmbed = new EmbedBuilder()
                    .setTitle("<:premium:1314667888644456520> Username")
                    .setDescription(`> **Mention your Roblox username**`)
                    .setColor(5402102);

                  // Send both embeds
                  mainEmbedMessage = await channel.send({ embeds: [askEmbed] });

                  // Collect the user's Roblox username
                  const usernameFilter = (response) =>
                    response.author.id === interaction.user.id;
                  const usernameCollector = channel.createMessageCollector({
                    filter: usernameFilter,
                    max: 1,
                    time: null,
                  });

                  usernameCollector.on("collect", async (usernameMessage) => {
                    robloxUsername = usernameMessage.content;
                    await handleUsernameConfirmation(robloxUsername);
                  });
                }
              }
            );
          });
        } catch (error) {
          console.log("Unexpected error", error);
        }
      }

      async function handleUsernameConfirmation(robloxUsername) {
        try {
          const userId = await getIdFromUsername(robloxUsername);
          if (!userId) {
            const notFoundEmbed = new EmbedBuilder()
              .setDescription(
                "> <:no:1272884877515165696> User not found. Please reset the username."
              )
              .setColor("Red");

            const message = await channel.send({ embeds: [notFoundEmbed] });

            setTimeout(() => {
              message
                .delete()
                .catch((err) =>
                  console.error("Failed to delete message:", err)
                );
            }, 3000);

            return askUsernameAndConfirm(true);
          }

          const headshotApiUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`;
          const response = await axios.get(headshotApiUrl);
          const imageUrl = response.data.data[0].imageUrl;
          const playerInfo = await (
            await axios.get(`https://users.roblox.com/v1/users/${userId}`)
          ).data;

          const updatedEmbed = new EmbedBuilder()
            .setTitle(
              `<:Untitled15_20241206200936:1314670916642410567> **${playerInfo.name}**`
            )
            .setDescription(
              `<@${interaction.user.id}> **${playerInfo.displayName}** (@${playerInfo.name}) will receive the payout.`
            )
            .setThumbnail(imageUrl || "https://via.placeholder.com/150")
            .setFooter({
              text: `User ID: (${userId})`,
            })
            .setColor(16382065);

          const confirmButton = new ButtonBuilder()
            .setCustomId("confirmUsername")
            .setLabel("Confirm")
            .setEmoji("<:yes:1272884844942332008>")
            .setStyle(ButtonStyle.Secondary);

          const resetButton = new ButtonBuilder()
            .setCustomId("resetUsername")
            .setLabel("Change user")
            .setEmoji("<:no:1272884877515165696>")
            .setStyle(ButtonStyle.Secondary);

          const row = new ActionRowBuilder().addComponents(
            confirmButton,
            resetButton
          );

          if (!mainEmbedMessage) {
            mainEmbedMessage = await channel.send({
              embeds: [updatedEmbed],
              components: [row],
            });
          } else {
            await mainEmbedMessage.edit({
              embeds: [updatedEmbed],
              components: [row],
            });
          }

          const confirmationFilter = (i) => i.user.id === interaction.user.id;
          const confirmationCollector = channel.createMessageComponentCollector(
            {
              filter: confirmationFilter,
              max: 1,
            }
          );

          confirmationCollector.on("collect", async (confirmInteraction) => {
            await confirmInteraction.deferUpdate();
            const userId = await getIdFromUsername(robloxUsername);
            const displayName = await (
              await axios.get(`https://users.roblox.com/v1/users/${userId}`)
            ).data.displayName;

            if (confirmInteraction.customId === "confirmUsername") {
              const confirmedEmbed = new EmbedBuilder()
                .setTitle(
                  `<:Untitled15_20241206200936:1314670916642410567> Username`
                )
                .setDescription(
                  `> <:yes:1272884844942332008> **CONFIRMED!**\n` +
                    `> **${displayName}** (@${robloxUsername})`
                )
                .setThumbnail(imageUrl)
                .setColor(5697630);

              await mainEmbedMessage.edit({
                embeds: [confirmedEmbed],
                components: [],
              });

              await askRobuxAmount(
                channel,
                interaction,
                paymentMethod,
                robloxUsername
              );
            } else if (confirmInteraction.customId === "resetUsername") {
              await mainEmbedMessage.delete();
              return askUsernameAndConfirm(true);
            }
          });

          confirmationCollector.on("end", (reason) => {
            if (reason === "time") {
              channel.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                      "> `⌛` You took too long to respond. Please try again."
                    ),
                ],
              });
            }
          });
        } catch (error) {
          console.error(error);
        }
      }

      await askUsernameAndConfirm();
    } catch (error) {
      console.log("Unexpected error", error);
    }
  }
  const logsChannelId = "1269351028956991492";
  const blackListedRoleId = "1272261764502917130";
  module.exports = handleUsernameProcess;

  async function askRobuxAmount(
    channel,
    interaction,
    paymentMethod,
    robloxUsername,
    resetCount = 0
  ) {
    try {
      const embed = new EmbedBuilder()
        .setTitle(
          "<:Untitled15_20241206201119:1314670878885286020> Amount of Robux"
        )
        .setDescription(`> <@${interaction.user.id}>, minimum of 1000 Robux.`)
        .setColor(5402102);

      let mainEmbedMessage = await channel.send({ embeds: [embed] });

      const robuxFilter = (response) =>
        response.author.id === interaction.user.id;
      const robuxCollector = channel.createMessageCollector({
        filter: robuxFilter,
        max: 1,
        time: null,
      });

      robuxCollector.on("collect", async (robuxMessage) => {
        const robuxInput = robuxMessage.content;
        let robuxAmount = parseInt(robuxInput, 10);

        if (isNaN(robuxAmount) || robuxAmount < 1000) {
          const error = new EmbedBuilder()
            .setDescription(
              "> <:no:1272884877515165696> Invalid amount! Please enter a number greater than or equal to 1000."
            )
            .setColor("Red");

          const errorMessage = await channel.send({ embeds: [error] });
          setTimeout(() => errorMessage.delete(), 3000);
          setTimeout(() => robuxMessage.delete(), 1000);
          return askRobuxAmount(
            channel,
            interaction,
            paymentMethod,
            robloxUsername,
            resetCount + 1
          );
        }

        const updatedEmbed = new EmbedBuilder()
          .setTitle(
            `<:c2fc0404eeb8d393407bdaebe2cc9994:1314670896245641267> Confirmation`
          )
          .setDescription(
            `> Are you trying to purchase **${robuxAmount}**<:robuxwhite:1314670896245641267>?\n` +
              `-# ${(robuxAmount * 0.006).toFixed(2)}$/${robuxAmount * 0.06}KR`
          )
          .setColor(16382065);

        const confirmButton = new ButtonBuilder()
          .setCustomId("confirmRobux")
          .setEmoji("<:yes:1272884844942332008>")
          .setStyle(ButtonStyle.Secondary);

        const resetButton = new ButtonBuilder()
          .setCustomId("resetRobux")
          .setEmoji("<:no:1272884877515165696>")
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(
          confirmButton,
          resetButton
        );

        await mainEmbedMessage.edit({
          embeds: [updatedEmbed],
          components: [row],
        });

        const robuxConfirmationFilter = (i) =>
          i.user.id === interaction.user.id;
        const robuxConfirmationCollector =
          channel.createMessageComponentCollector({
            filter: robuxConfirmationFilter,
            max: 1,
            time: null,
          });

        robuxConfirmationCollector.on("collect", async (confirmInteraction) => {
          await confirmInteraction.deferUpdate();

          if (confirmInteraction.customId === "confirmRobux") {
            const confirmedEmbed = new EmbedBuilder()
              .setTitle(`<:robuxwhite:1314670896245641267> Amount of Robux`)
              .setDescription(
                `> <:yes:1272884844942332008> **CONFIRMED!**\n` +
                  `> <:robuxwhite:1314670896245641267>**${robuxAmount}**`
              )
              .setColor(5697630);

            await mainEmbedMessage.edit({
              embeds: [confirmedEmbed],
              components: [],
            });
            await sendPaymentInformation(
              channel,
              interaction,
              paymentMethod,
              robuxAmount,
              robloxUsername
            );
          } else if (confirmInteraction.customId === "resetRobux") {
            resetCount++;

            const resetEmbed = new EmbedBuilder()
              .setDescription(
                `> **<@${interaction.user.id}>**, how many Robux do you want to purchase? (Minimum: 1000 Robux)\n> Reset Count: **${resetCount}**`
              )
              .setFooter({
                text: interaction.guild.name,
                iconURL: interaction.guild.iconURL(),
              })
              .setColor("White")
              .setTimestamp();

            await mainEmbedMessage.edit({
              embeds: [resetEmbed],
              components: [],
            });

            setTimeout(() => {
              mainEmbedMessage
                .delete()
                .catch((err) =>
                  console.error("Failed to delete message:", err)
                );
            }, 3000);

            return askRobuxAmount(
              channel,
              interaction,
              paymentMethod,
              robloxUsername,
              resetCount
            );
          }
        });

        robuxConfirmationCollector.on("end", (collected, reason) => {
          if (reason === "time") {
            channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor("Red")
                  .setDescription(
                    "> <:robux:1290362584830181406> You took too long to respond. Please try again."
                  ),
              ],
            });
          }
        });
      });
    } catch (error) {
      console.log("Unexpected error", error);
    }
  }

  async function sendPaymentInformation(
    channel,
    interaction,
    paymentMethod,
    robuxAmount,
    robloxUsername
  ) {
    try {
      let paymentInfoEmbed = new EmbedBuilder().setColor("White");
      let amount;
      let paymentData;

      switch (paymentMethod) {
        case "paypal":
          try {
            // Call createPaypalPayment function to get the approval URL
            const payment = await createPaypalPayment(amount); 
        
            // Extract the approval URL from the PayPal response
            const paypalLink = payment.links.find(link => link.rel === 'approval_url').href;
            
            // Create the payment info embed
            paymentInfoEmbed
              .setColor(2829617)
              .setTitle("Payment Information")
              .setDescription(
                `Pay via PayPal for **${amount} USD**.\n` +
                `Please [click here](${paypalLink}) to complete your payment.`
              );
        
            paymentData = paypalLink; // Store the approval URL or other relevant info
        
          } catch (error) {
            console.error("PayPal payment creation failed:", error);
            paymentInfoEmbed.setDescription("❌ Unable to create PayPal payment. Please try again later.");
          }
          break;
        
        case "apple":
          amount = (robuxAmount * 0.006).toFixed(2);
          paymentInfoEmbed
            .setColor(2829617)
            .setTitle("Payment Information")
            .setThumbnail(`https://imgur.com/q7X1nh4.png`)
            .setDescription(
              `# <:apple_2:1326974297087934626> [Apple Giftcard](<https://www.apple.com/se/shop/buy-giftcard/giftcard>)\n` +
                `Du kan betala med kort eller apple pay. Gå till [denna hemsidan](<https://www.apple.com/se/shop/buy-giftcard/giftcard>) och fyll i informationen nedan. Välj knappen **Annat Belopp** och fyll i det beloppet som givs.\n` +
                `## Presentkort Information`
            )
            .addFields(
              { name: "Mottagares Namn:", value: `Friend`, inline: false },
              {
                name: "Mottagares Email:",
                value: `threahts@gmail.com`,
                inline: false,
              },
              { name: "Belopp:", value: `${amount * 10}KR`, inline: false }
            )
            .setFooter({
              text: "Pinga @allat om du har frågor INNAN du köper.",
            });
          paymentData = "threahts@gmail.com";
          break;

        case "swish":
          amount = (robuxAmount * 0.06).toFixed(2);
          paymentInfoEmbed
            .setTitle("Payment Information")
            .setThumbnail(`https://imgur.com/KkEw8CK.png`)
            .setDescription(
              `> <:swish:1269362657706774681> Betala **${amount} KR** till  \`0761829930\`. Skicka bild när du är klar och tryck på knappen nedan.`
            );
          paymentData = "0761829930";
          break;

        case "ltc":
          try {
            const ltcRate = await getLTCtoUSDRate(); // Get the current LTC/USD rate
            const usdAmount = robuxAmount * 0.006; // Calculate the cost in USD
            const ltcAmount = (usdAmount / ltcRate).toFixed(8); // Convert USD to LTC (8 decimals)

            paymentInfoEmbed
              .setTitle("Payment Information")
              .setColor(12895428)
              .setThumbnail("https://imgur.com/H1DyhA2.png")
              .setDescription(
                `> <:litecoin:1292209341411098746> To pay via Litecoin, send **${ltcAmount} LTC** to \`LeK7HwGPvA5Hm7vCH4waYY1uZnSouvpedB\``
              );

            paymentData = `LeK7HwGPvA5Hm7vCH4waYY1uZnSouvpedB | ${ltcAmount}`;
          } catch (error) {
            console.error(error);
            paymentInfoEmbed.setDescription(
              "❌ Unable to calculate LTC amount. Please try again later."
            );
            paymentData = null;
          }
          break;
      }

      if (paymentData) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("payment_info")
            //            .setEmoji('<:IMG_9214:1290415151656337552>')
            .setLabel("Copy Info")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("done_button")
            .setLabel("Done")
            .setEmoji("<:yes:1272884844942332008>")
            .setStyle(ButtonStyle.Secondary)
        );

        const paymentMessage = await channel.send({
          embeds: [paymentInfoEmbed],
          components: [row],
        });

        const filter = (i) =>
          ["payment_info", "done_button"].includes(i.customId) &&
          i.user.id === interaction.user.id;

        const collector = paymentMessage.createMessageComponentCollector({
          filter,
        });

        collector.on("collect", async (i) => {
          if (i.customId === "payment_info") {
            await i.reply({
              content: paymentData,
              ephemeral: true,
            });
          } else if (i.customId === "done_button") {
            const orderEmbed = new EmbedBuilder()
              .setColor("White")
              .setTitle("New order!")
              .setDescription(
                `<:PD_eWhIcRobux:1289191395738779719> **Amount:** ${robuxAmount} Robux\n` +
                  `<:crown:1290374317300776960> **Payment Method:** ${paymentMethod}\n` +
                  `<:dec_channellock:1290415763768741908> **Channel:** <#${i.channel.id}>\n` +
                  `<:discord:1290415659544739880> **User:** <@${i.user.id}>\n` +
                  `<:roblox:1290362320509472989> **Roblox Username:** ${robloxUsername}`
              )
              .setFooter({
                text: interaction.guild.name,
                iconURL: interaction.guild.iconURL(),
              })
              .setTimestamp();

            // Send the "Awaiting Confirmation" embed to the channel
            const awaitingEmbed = new EmbedBuilder()
              .setColor(2829617)
              .setThumbnail(`https://imgur.com/unF7fUI.png`)
              .setTitle("Awaiting Confirmation")
              .setDescription(
                "Thank you for your purchase! We are currently processing your order and will notify you as soon as it is confirmed."
              );

            await i.channel.send({ embeds: [awaitingEmbed] });

            // Acknowledge interaction to avoid timeout
            await i.deferUpdate();

            collector.stop();

            const orderRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("orderComplete")
                .setLabel("Complete")
                .setEmoji("✅")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId("notReceived")
                .setEmoji("❌")
                .setLabel("Not Received")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId("username")
                .setEmoji("👤")
                .setStyle(ButtonStyle.Primary)
            );
            try {
              const targetChannel = await i.client.channels.fetch(
                logsChannelId
              );
              if (targetChannel) {
                const orderMessage = await targetChannel.send({
                  content: "<@957260557432533062>",
                  embeds: [orderEmbed],
                  components: [orderRow],
                });

                const usernameFilter = (i) => i.customId === "username";
                const usernameCollector =
                  orderMessage.createMessageComponentCollector({
                    filter: usernameFilter,
                    time: 86400000,
                  });

                usernameCollector.on("collect", async (buttonInteraction) => {
                  if (buttonInteraction.customId === "username") {
                    try {
                      await buttonInteraction.reply({
                        content: `${robloxUsername}`,
                        ephemeral: true,
                      });
                    } catch (err) {
                      console.log(err);
                    }
                  }
                });

                usernameCollector.on("end", (collected) => {
                  console.log(`Collected ${collected.size} interactions.`);
                });

                const orderFilter = (interaction) =>
                  ["orderComplete", "notReceived"].includes(
                    interaction.customId
                  );
                const orderCollector =
                  orderMessage.createMessageComponentCollector({
                    filter: orderFilter,
                  });

                orderCollector.on("collect", async (buttonInteraction) => {
                  if (buttonInteraction.customId === "orderComplete") {
                    // Disable the buttons on the original order message
                    await buttonInteraction.message.edit({
                      content: "<@957260557432533062>",
                      embeds: [orderEmbed],
                      components: [], // Remove all buttons
                    });

                    const confirmedEmbed = new EmbedBuilder()
                      .setColor(5402102)
                      .setTitle("Confirmed")
                      .setDescription("> Your payment has been confirmed!")
                      .setThumbnail(`https://imgur.com/anx7iVy.png`);

                    await awaitingMessage.edit({
                      embeds: [confirmedEmbed],
                    });

                    await buttonInteraction.reply({
                      content: "Order submitted successfully!",
                      ephemeral: true,
                    });

                    const vouch = new EmbedBuilder()
                      .setColor(5402102)
                      .setImage(`https://i.imgur.com/hGriVHZ.gif`)
                      .setDescription(
                        `# <:checkmark:1314666872201019483> Order Completed!\n` +
                          `*Please leave a vouch*\n` +
                          `## <:ShinyBlueSparkles:1290374545936486544> Format\n` +
                          `\`\`\`vouch @kittn ${robuxAmount} robux for $${(
                            robuxAmount * 0.006
                          ).toFixed(2)}\n\`\`\`\n` +
                          `Image must be included, get it [here](https://www.roblox.com/transactions)\n` +
                          `-# Not leaving a vouch within 24h will blacklist you from using our services`
                      );

                    const vouchbtn = new ButtonBuilder()
                      .setCustomId("vouched")
                      .setLabel("I vouched!")
                      .setEmoji("<:yes:1272884844942332008>")
                      .setStyle(ButtonStyle.Secondary);

                    const vouchrow = new ActionRowBuilder().addComponents(
                      vouchbtn
                    );

                    const orderMessage = await channel.send({
                      embeds: [vouch],
                      components: [vouchrow],
                      content: `<@${interaction.user.id}> https://discord.gg/QYfHXN68Db`,
                    });

                    // blacklist logic
                    const vouchTimeout = setTimeout(async () => {
                      const role =
                        interaction.guild.roles.cache.get(blackListedRoleId);
                      if (role) {
                        await interaction.guild.members
                          .fetch(interaction.user.id)
                          .then((member) => {
                            member.roles.add(role);

                            const timeoutEmbed = new EmbedBuilder()
                              .setDescription(
                                "> 😔 Since you did not vouch in time, the blacklisted role has been assigned to you."
                              )
                              .setColor("White")
                              .setFooter({
                                text: `sent by - ${interaction.guild.name}`,
                                iconURL: interaction.guild.iconURL(),
                              })
                              .setTimestamp();

                            buttonInteraction.user.send({
                              embeds: [timeoutEmbed],
                            });
                          });
                      }
                    }, 86_400_000);

                    const vouchFilter = (i) => i.customId === "vouched";
                    const vouchCollector =
                      orderMessage.createMessageComponentCollector({
                        filter: vouchFilter,
                        max: 1, // Allow only one interaction
                      });

                    vouchCollector.on("collect", async (vouchInteraction) => {
                      clearTimeout(vouchTimeout);

                      // Grant a role to the user who clicked the button
                      try {
                        const guildMember =
                          vouchInteraction.guild.members.cache.get(
                            vouchInteraction.user.id
                          );
                        const roleId = "1271161067917148211"; // Replace with the ID of the role to grant
                        await guildMember.roles.add(roleId);
                      } catch (error) {
                        console.error("Error granting role to user:", error);
                      }

                      // Disable the vouch button immediately after click
                      const disabledVouchBtn = new ButtonBuilder()
                        .setCustomId("vouched")
                        .setLabel("Vouched!")
                        .setEmoji("<:yes:1272884844942332008>")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true);

                      const disabledRow = new ActionRowBuilder().addComponents(
                        disabledVouchBtn
                      );

                      await orderMessage.edit({
                        embeds: [vouch],
                        components: [disabledRow],
                        content: `<@${interaction.user.id}> https://discord.gg/QYfHXN68Db`,
                      });

                      const checkingEmbed = new EmbedBuilder().setDescription(
                        `> <:IMG_9208:1290403966550544476> Please wait as the owner will check if the vouch is valid or not.`
                      );

                      // Add stats to database
                      const database = await getDatabase();

                      database.connect(async (error) => {
                        // Build error message embed
                        if (error) {
                          console.log(error);
                          const errorEmbed = new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle("Error")
                            .setDescription(
                              "❌ An error occurred while querying the database."
                            );
                          return await interaction.editReply({
                            embeds: [errorEmbed],
                            ephemeral: true,
                          });
                        }

                        database.query(
                          `SELECT robux, purchases FROM users WHERE id='${interaction.user.id}'`,
                          async (error, results) => {
                            if (error) {
                              database.end();
                              console.log(error);
                              const errorEmbed = new EmbedBuilder()
                                .setColor(0xff0000)
                                .setTitle("Error")
                                .setDescription(
                                  "❌ An error occurred while querying the database."
                                );
                              return await interaction.editReply({
                                embeds: [errorEmbed],
                                ephemeral: true,
                              });
                            }

                            const currentRobux =
                              results.length > 0 ? results[0].robux : 0;
                            const currentPurchases =
                              results.length > 0 ? results[0].purchases : 0;

                            const newRobux = currentRobux + robuxAmount;
                            const newPurchases = currentPurchases + 1;

                            database.query(
                              `INSERT INTO users (id, robux, purchases) VALUES ('${interaction.user.id}', ${robuxAmount}, 1) ON DUPLICATE KEY UPDATE robux=${newRobux}, purchases=${newPurchases}`,
                              async (error) => {
                                database.end();
                                if (error) {
                                  console.log(error);
                                  const errorEmbed = new EmbedBuilder()
                                    .setColor(0xff0000)
                                    .setTitle("Error")
                                    .setDescription(
                                      "❌ An error occurred while updating the database."
                                    );
                                  return await interaction.editReply({
                                    embeds: [errorEmbed],
                                    ephemeral: true,
                                  });
                                }
                              }
                            );
                          }
                        );
                      });

                      const closeButton = new ButtonBuilder()
                        .setCustomId("close")
                        .setLabel("Close Ticket")
                        .setEmoji("🔐")
                        .setStyle(ButtonStyle.Danger);

                      const closeRow = new ActionRowBuilder().addComponents(
                        closeButton
                      );

                      await vouchInteraction.deferReply();

                      try {
                        await vouchInteraction.editReply({
                          content: "<@957260557432533062>",
                          embeds: [checkingEmbed],
                          components: [closeRow],
                        });

                        // Create a message component listener for the entire channel
                        const closeHandler = async (buttonInteraction) => {
                          // Only allow the specified user to close the ticket
                          if (
                            buttonInteraction.customId === "close" &&
                            buttonInteraction.user.id === "957260557432533062"
                          ) {
                            try {
                              await buttonInteraction.reply({
                                content: "Ticket is closing...",
                              });

                              // Remove the event listener to prevent memory leaks
                              buttonInteraction.channel.client.removeListener(
                                "interactionCreate",
                                closeHandler
                              );

                              // Add a small delay before deleting the channel
                              setTimeout(async () => {
                                try {
                                  await buttonInteraction.channel.delete();
                                } catch (error) {
                                  console.error(
                                    "Error deleting channel:",
                                    error
                                  );
                                  await buttonInteraction.followUp({
                                    content:
                                      "Failed to delete the channel. Please try again or contact an administrator.",
                                    ephemeral: true,
                                  });
                                }
                              }, 1000);
                            } catch (error) {
                              console.error(
                                "Error handling close button:",
                                error
                              );
                            }
                          }
                        };

                        // Add the event listener to the client
                        vouchInteraction.channel.client.on(
                          "interactionCreate",
                          closeHandler
                        );
                      } catch (error) {
                        console.error("Error sending checking message:", error);
                      }
                    });

                    vouchCollector.on("end", (collected) => {
                      if (collected.size === 0) {
                        // If no one clicked the vouch button, disable it
                        const disabledVouchBtn = new ButtonBuilder()
                          .setCustomId("vouched")
                          .setLabel("I vouched!")
                          .setEmoji("<:yes:1272884844942332008>")
                          .setStyle(ButtonStyle.Secondary)
                          .setDisabled(true);

                        const disabledRow =
                          new ActionRowBuilder().addComponents(
                            disabledVouchBtn
                          );

                        orderMessage
                          .edit({
                            components: [disabledRow],
                          })
                          .catch(console.error);
                      }
                    });
                  } else if (interaction.customId === "username") {
                    try {
                      await interaction.reply({
                        content: `${robloxUsername}`,
                        ephemeral: true,
                      });
                    } catch (err) {
                      console.log(
                        "[ERROR]".red +
                          "Error in your exampleBtn.js run function:"
                      );
                      console.log(err);
                    }
                  } else if (buttonInteraction.customId === "notReceived") {
                    const orderNotReceivedEmbed = new EmbedBuilder()
                      .setColor("Red")
                      .setTitle("Payment not received!")
                      .setDescription(
                        "> `❌` You didn't send us the money! Please ping <@957260557432533062> in order to pay again."
                      )
                      .setFooter({
                        text: interaction.guild.name,
                        iconURL: interaction.guild.iconURL(),
                      })
                      .setTimestamp();

                    await channel.send({ embeds: [orderNotReceivedEmbed] });
                    await buttonInteraction.reply({
                      content: "Payment not received message sent!",
                      ephemeral: true,
                    });
                  }
                });
              }
              await i.reply({
                content: "Order submitted successfully!",
                ephemeral: true,
              });
            } catch (error) {
              console.error("Error sending order:", error);
              await i.reply({
                content:
                  "There was an error submitting your order. Please try again.",
                ephemeral: true,
              });
            }
          }
        });

        collector.on("end", () => {
          paymentMessage.edit({ components: [] });
        });
      } else {
        await channel.send({ embeds: [paymentInfoEmbed] });
      }
    } catch (error) {
      console.log("Unexpected error", error);
    }
  }
} catch (error) {
  console.log("Unexpected error", error);
}

async function getIPNPayment() {
  
}