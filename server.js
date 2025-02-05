require('dotenv').config();

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { fetchNewsFromNewsAPI } = require("./services/newsapiService");
const { fetchNewsFromMediaStack } = require("./services/mediastackService");
const Article = require("./models/Article");
const sequelize = require("./config/database");

const app = express();
const port = process.env.PORT || 1337;
const apiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

// Enable CORS
app.use(cors());

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || !apiKeys.includes(apiKey)) {
    return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
  }
  next();
};

// Apply middleware globally
app.use(validateApiKey);

// Ensure a single database sync
sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced");

  // Fetch news on startup with delay to avoid race conditions
  setTimeout(async () => {
    await fetchNewsWithRetry(fetchNewsFromNewsAPI, 3);
    await fetchNewsWithRetry(fetchNewsFromMediaStack, 3);
  }, 5000); // Delay startup fetch to avoid database lock
});

// Fetch news every 12 hours with retry logic
cron.schedule("0 */12 * * *", async () => {
  await fetchNewsWithRetry(fetchNewsFromNewsAPI, 3);
  await fetchNewsWithRetry(fetchNewsFromMediaStack, 3);
});

// Exponential backoff retry for API requests
async function fetchNewsWithRetry(fetchFunction, retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await fetchFunction();
      return; // Exit loop if successful
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['Retry-After'] || delay;
        console.warn(`429 received, retrying after ${retryAfter * (i + 1)}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * (i + 1)));
      } else {
        console.error(`Fetch attempt ${i + 1} failed:`, error);
      }
    }
  }
  console.error("Max retries reached for fetch function:", fetchFunction.name);
}

// Serve cached articles
app.get("/news", async (req, res) => {
  try {
    const articles = await Article.findAll({ order: [["publishedAt", "DESC"]] });

    // Group articles by country and source
    const groupedArticles = articles.reduce((acc, article) => {
      if (!acc[article.country]) acc[article.country] = {};
      if (!acc[article.country][article.source]) acc[article.country][article.source] = [];
      acc[article.country][article.source].push(article);
      return acc;
    }, {});

    res.json({ articles: groupedArticles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
