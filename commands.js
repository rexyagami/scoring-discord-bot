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
  {
    name: "score_from_date_range",
    description: "Configure bot settings for your server.",
    options: [
      {
        name: "start_date",
        description:
          "Enter the starting date from where you want to count the scores. Date format YYYY-MM-DD",
        type: 3, // Type 3 corresponds to STRING
        required: true,
      },
      {
        name: "end_date",
        description:
          "Enter the ending date till when you want to count the scores. Date format YYYY-MM-DD",
        type: 3,
        required: true,
      },
      {
        name: "count",
        description: "The number of candidates you want to display.",
        type: 4, // Type 4 corresponds to INTEGER
        required: true,
      },
    ],
  },
  {
    name: "export_all_scores",
    description: "Configure bot settings for your server.",
  },
];

module.exports = commands;
