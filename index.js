require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const {
  updateServerRules,
  getServerRules,
  updateScore,
  getTopScores,
  addAllowedUser,
} = require("./database");
const { commands } = require("./commands");
const { setupMongoDB } = require("./database");
const token = process.env.BOT_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Create an Express web server
const app = express();
const PORT = process.env.PORT || 3000;

// Set up a route to keep the bot active
app.get("/", (req, res) => {
  res.send("Bot is active!");
});

// Start the web server on the specified port
app.listen(PORT, () => {
  console.log(`Web server is listening on port ${PORT}`);
});

client.once("ready", async () => {
  // Call the setupMongoDB function to establish the MongoDB connection
  try {
    await setupMongoDB();
    const rest = new REST({ version: "10" }).setToken(token);

    rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), {
      body: commands,
    });

    console.log(`Ready! Logged in as ${client.user.tag}`);
  } catch (error) {
    console.error("Failed to initialize MongoDB:", error);
  }
});

// Handle the message reaction add event
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  await reaction.fetch();

  const server = reaction.message.guild;
  const serverId = server.id;
  const userId = reaction.message.author.id;
  const username = reaction.message.author.tag;
  const scorerId = user.id;
  const scorerUsername = user.tag;
  const reactionEmoji = reaction.emoji.name;

  // Retrieve server-specific rules from the database
  const serverRules = await getServerRules(serverId);

  // Check if the server rules are added
  if (!serverRules) {
    // No Server Rules found; do not proceed
    await interaction.reply({
      content:
        "Server rules are not set up. Use `/configure` command to set up rules first.",
      ephemeral: true,
    });
    console.log(
      `No server rules found for server ${commandGuildId}. The user ${username} will not be allowed to run bot commands.`
    );
    return;
  }

  // Check if the username is allowed
  if (!serverRules.allowedUsers.includes(scorerUsername)) {
    // Username is not allowed; do not proceed
    console.log(
      `User ${user.tag} tried to react to a message by ${reaction.message.author.tag} with ${reactionEmoji} but they are not allowed to run bot commands.`
    );
    return;
  }

  // Check if the reaction emoji is allowed
  if (!serverRules.emojiScores[reactionEmoji]) {
    // Emoji is not allowed; do not proceed
    console.log(
      `User ${user.tag} tried to react to a message by ${reaction.message.author.tag} with ${reactionEmoji} but that emoji is not allowed.`
    );
    return;
  }

  // Calculate the scoreChange based on the allowed emojis
  const scoreChange = serverRules.emojiScores[reactionEmoji];

  // Continue with updating the score
  updateScore(
    serverId,
    userId,
    username,
    reactionEmoji,
    scorerId,
    scorerUsername,
    scoreChange
  );
});

// Handle the message reaction remove event
client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Error fetching partial reaction:", error);
      return;
    }
  }

  const server = reaction.message.guild;
  const serverId = server.id;
  const userId = reaction.message.author.id;
  const username = reaction.message.author.tag;
  const scorerId = user.id;
  const scorerUsername = user.tag;
  const reactionEmoji = reaction.emoji.name;

  // Retrieve server-specific rules from the database
  const serverRules = await getServerRules(serverId);

  // Check if the server rules are added
  if (!serverRules) {
    // No Server Rules found; do not proceed
    await interaction.reply({
      content:
        "Server rules are not set up. Use `/configure` command to set up rules first.",
      ephemeral: true,
    });
    console.log(
      `No server rules found for server ${commandGuildId}. The user ${username} will not be allowed to run bot commands.`
    );
    return;
  }

  // Check if the username is allowed
  if (!serverRules.allowedUsers.includes(username)) {
    // Username is not allowed; do not proceed
    console.log(
      `User ${user.tag} tried to react to a message by ${reaction.message.author.tag} with ${reactionEmoji} but they are not allowed to run bot commands.`
    );
    return;
  }

  // Check if the reaction emoji is allowed
  if (!serverRules.emojiScores[reactionEmoji]) {
    // Emoji is not allowed; do not proceed
    console.log(
      `User ${user.tag} tried to react to a message by ${reaction.message.author.tag} with ${reactionEmoji} but that emoji is not allowed.`
    );
    return;
  }

  // Calculate the scoreChange based on the allowed emojis
  const scoreChange = serverRules.emojiScores[reactionEmoji];

  // Continue with updating the score
  updateScore(
    serverId,
    userId,
    username,
    reactionEmoji,
    scorerId,
    scorerUsername,
    -scoreChange
  );
});

// Handle the slash command
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, commandGuildId } = interaction;
  const username = interaction.user.username;

  // Retrieve server-specific rules from the database
  const serverRules = await getServerRules(commandGuildId);

  // Check if the server rules are added
  if (!serverRules) {
    // No Server Rules found; do not proceed
    await interaction.reply({
      content:
        "Server rules are not set up. Use `/configure` command to set up rules first.",
      ephemeral: true,
    });
    console.log(
      `No server rules found for server ${commandGuildId}. The user ${username} will not be allowed to run bot commands.`
    );
    return;
  }

  // Check if the username is allowed
  if (!serverRules.allowedUsers.includes(username)) {
    // Username is not allowed; do not proceed
    console.log(
      `User ${user.tag} tried to react to a message by ${username} with ${reactionEmoji} but they are not allowed to run bot commands.`
    );
    return;
  }

  if (commandName === "top") {
    const count = options.getInteger("count");

    console.log(
      `User called ${commandName} in ${interaction.guild.name} with count: ${count}`
    );

    const topScores = await getTopScores(interaction.guild.id, count);

    const response = topScores.map((user, index) => {
      return `${index + 1}. ${user.username} - ${user.score}`;
    });

    await interaction.reply({ content: response.join("\n"), ephemeral: true });
  }

  if (commandName === "configure") {
    const serverId = interaction.guild.id;
    const allowedUsers = interaction.options
      .getString("allowed_users")
      .split(",")
      .map((user) => user.trim());
    const emojiScores = {};
    const emojiScorePairs = interaction.options
      .getString("emoji_scores")
      .split(",");
    emojiScorePairs.forEach((pair) => {
      const [emoji, score] = pair.split("=");
      emojiScores[emoji.trim()] = parseInt(score.trim());
    });

    const channelIds = interaction.options.getChannel("allowed_channels") || [];
    // const allowedChannels = interaction.options.get('allowed_channels').value;

    // Call the function to update server rules with the provided data
    await updateServerRules(serverId, allowedUsers, emojiScores);

    await interaction.reply({
      content: "Bot settings have been configured for your server.",
      ephemeral: true,
    });
  }

  if (commandName === "add_allowed_user") {
    const serverId = interaction.guild.id;
    const allowedUsers = interaction.options.getString("allowed_users");
    const response = await addAllowedUser(serverId, allowedUsers);
    if (response.status === 200) {
      await interaction.reply({
        content: response.message,
        ephemeral: true,
      });
    } else if (response.status === 404) {
      await interaction.reply({
        content: response.message,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Something went wrong. Please try again.",
        ephemeral: true,
      });
    }
  }

  if (commandName === "hello") {
    await interaction.reply({
      content: "Hello by bot 👀! only to youuuuu",
      ephemeral: true,
    });
  }
  if (commandName === "help") {
    await interaction.reply({
      content: "Help by bot 👀! only to youuuuu",
      ephemeral: true,
    });
  }
});

client.login(token);
