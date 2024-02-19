// Import the necessary MongoDB packages
const { MongoClient } = require("mongodb");

// Define the schema for storing user scores
class UserScore {
  constructor(serverId, userId, username, score) {
    this.serverId = serverId;
    this.userId = userId;
    this.username = username;
    this.score = score;
  }
}

// Define the schema for storing score logs
class ScoreLog {
  constructor(
    serverId,
    scorerId,
    scorerUsername,
    scoredUserId,
    scoredUsername,
    score,
    timestamp
  ) {
    this.serverId = serverId;
    this.scorerId = scorerId;
    this.scorerUsername = scorerUsername;
    this.scoredUserId = scoredUserId;
    this.scoredUsername = scoredUsername;
    this.score = score;
    this.timestamp = timestamp || new Date();
  }
}

// Define the schema for storing server rules
class ServerRule {
  constructor(serverId, allowedUsers, emojiScores, allowedChannels) {
    this.serverId = serverId;
    this.allowedUsers = allowedUsers || [];
    this.emojiScores = emojiScores || {};
    // this.allowedChannels = allowedChannels || [];
  }
}

// Placeholder for the MongoDB client
let mongoClient;

// Function to set up the MongoDB connection
async function setupMongoDB() {
  if (!mongoClient) {
    const dbURI = process.env.MONGODB_URI;
    mongoClient = new MongoClient(dbURI);

    try {
      await mongoClient.connect();
      console.log("Connected to the MongoDB database.");
    } catch (error) {
      console.error("Failed to connect to the MongoDB database:", error);
      throw error; // Handle the error as needed
    }
  }
}

// Function to setup ServerRules for the specific server
async function updateServerRules(serverId, allowedUsers, emojiScores) {
  const db = mongoClient.db();
  const serverRulesCollection = db.collection("serverRules");

  const existingRule = await serverRulesCollection.findOne({ serverId });

  const updateObject = {
    allowedUsers: { $each: allowedUsers },
    emojiScores,
    // allowedChannels: { $each: allowedChannels },
  };

  if (existingRule) {
    // Update the existing rule
    await serverRulesCollection.updateOne(
      { serverId },
      {
        $addToSet: updateObject,
      }
    );
  } else {
    // Insert a new rule for the server
    await serverRulesCollection.insertOne(
      new ServerRule(serverId, allowedUsers, emojiScores)
    );
  }
}

// Function to get the ServerRules for the specific server
async function getServerRules(serverId) {
  const db = mongoClient.db();
  const serverRulesCollection = db.collection("serverRules");

  const serverRule = await serverRulesCollection.findOne({ serverId });

  return serverRule;
}

// Function to insert or update a user's score in the database
async function updateScore(
  serverId,
  userId,
  username,
  reactionEmoji,
  scorerId,
  scorerUsername,
  scoreChange
) {
  // Ensure the MongoDB client is set up

  const db = mongoClient.db();
  const scoresCollection = db.collection("scores");
  const scoreLogsCollection = db.collection("scoreLogs");

  // Check if the user's score already exists in the database
  const existingScore = await scoresCollection.findOne({ serverId, userId });

  if (existingScore) {
    // Update the existing score
    const updatedScore = existingScore.score + scoreChange;
    await scoresCollection.updateOne(
      { serverId, userId },
      {
        $set: {
          score: updatedScore,
        },
      }
    );
  } else {
    // Insert a new score for the user
    await scoresCollection.insertOne({
      serverId,
      userId,
      username,
      score: scoreChange,
    });
  }

  // Insert a new score log
  await scoreLogsCollection.insertOne({
    serverId,
    scorerId,
    scorerUsername,
    scoredUserId: userId,
    scoredUsername: username,
    score: scoreChange,
    timestamp: new Date(),
  });
}

// Function to retrieve the top X scores for a server
async function getTopScores(serverId, count) {
  const db = mongoClient.db();
  const scoresCollection = db.collection("scores");

  const topScores = await scoresCollection
    .find({ serverId })
    .sort({ score: -1 })
    .limit(count)
    .toArray();

  return topScores;
}

// Function to retrieve all scores for a server
async function getAllScores(serverId) {
  const db = mongoClient.db();
  const scoresCollection = db.collection("scores");

  const allScores = await scoresCollection
    .find({ serverId })
    .sort({ score: -1 })
    .toArray();

  return allScores;
}

// Function to add allowed users to the server rules
async function addAllowedUser(serverId, username) {
  const db = mongoClient.db();
  const serverRulesCollection = db.collection("serverRules");

  // Fetch existing server rules
  const existingRules = await serverRulesCollection.findOne({ serverId });

  if (existingRules) {
    // Update the existing rules
    await serverRulesCollection.updateOne(
      { serverId },
      {
        $addToSet: {
          allowedUsers: username,
        },
      }
    );
    const data = {
      status: 200,
      message: "User was added to the allowed users list.",
    };

    return data;
  } else {
    // Server rules don't exist; send a reply to the user
    const data = {
      status: 404,
      message:
        "Server rules are not set up. Use `/configure` command to set up rules first.",
    };

    return data;
  }
}

async function getScoreLogsByDateRange(startDate, endDate, guildId) {
  await setupMongoDB();

  const db = mongoClient.db();
  const scoreLogsCollection = db.collection("scoreLogs");

  const scoreLogs = await scoreLogsCollection
    .find({
      serverId: guildId, // Filter by server ID
      timestamp: { $gte: startDate, $lte: endDate },
    })
    .toArray();

  return scoreLogs;
}

// Add a new function to compile scores for each user
function compileUserScores(scoreLogs) {
  const userScores = {};

  scoreLogs.forEach((log) => {
    const { scoredUsername, score } = log;

    if (!userScores[scoredUsername]) {
      userScores[scoredUsername] = 0;
    }

    userScores[scoredUsername] += score;
  });

  return userScores;
}

// Add a new function to get top scores
function getAllTopScores(userScores, count) {
  const sortedScores = Object.entries(userScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count);

  // const topScores = sortedScores.map(([userId, score]) => `<@${userId}>: ${score}`);
  const topScores = sortedScores.map(
    ([userName, score]) => `${userName}: ${score}`
  );

  return topScores;
}

module.exports = {
  setupMongoDB,
  updateServerRules,
  getServerRules,
  updateScore,
  getTopScores,
  getAllScores,
  addAllowedUser,
  getScoreLogsByDateRange,
  compileUserScores,
  getAllTopScores,
};
