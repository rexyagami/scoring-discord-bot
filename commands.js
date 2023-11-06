// commands.js
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const commands = [
  {
    name: "top",
    description: "Get the top scores.",
    options: [
      {
        name: "count",
        description: "The number of top scores to show.",
        type: 4, // Type 4 corresponds to INTEGER
        required: true,
      },
    ],
  },
  {
    name: "configure",
    description: "Configure bot settings for your server.",
    options: [
      {
        name: "allowed_users",
        description:
          "Usernames or user IDs who are allowed to run bot commands.",
        type: 3, // Type 3 corresponds to STRING
        required: true,
      },
      {
        name: "emoji_scores",
        description: "Emojis and their associated scores (e.g., 😄=5, 🙁=-2).",
        type: 3,
        required: true,
      },
      // {
      //     name: 'allowed_channels',
      //     description: 'Channels where the bot is allowed to access.',
      //     type: 7, // Type 7 corresponds to CHANNEL
      //     required: true,
      // },
    ],
  },
  {
    name: "add_allowed_user",
    description: "Add allowed users to your server rules.",
    options: [
      {
        name: "allowed_users",
        description: "Usernames or user IDs to add.",
        type: 3, // Type 3 corresponds to STRING
        required: true,
      },
    ],
  },
  {
    name: "hello",
    description: "Greetings the user.",
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.APPLICATION_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();