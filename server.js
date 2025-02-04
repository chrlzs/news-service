require('dotenv').config();

const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 1337;
const newsApiKey = process.env.NEWSAPI_KEY;
const cron = require("node-cron");
const { fetchNewsFromNewsAPI } = require("./services/newsapiService");
const { fetchNewsFromMediaStack } = require("./services/mediastackService");
const Article = require("./models/Article");
const sequelize = require("./config/database");

// Enable CORS
app.use(cors());

sequelize.sync({ alter: true }).then(() => {
    console.log("Database synced");
  });

// Sync database and fetch news on startup
sequelize.sync().then(() => {
    console.log("Database synced");
    fetchNewsFromNewsAPI();
    fetchNewsFromMediaStack();

  });
  
// Fetch news every 12 hours
cron.schedule("0 */12 * * *", () => {
  fetchNewsFromNewsAPI();
  fetchNewsFromMediaStack();
});

const apiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

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

// Serve cached articles
app.get("/news", async (req, res) => {
  const articles = await Article.findAll({
    order: [["publishedAt", "DESC"]],
  });

  // Group articles by country and source
  const groupedArticles = articles.reduce((acc, article) => {
    if (!acc[article.country]) {
      acc[article.country] = {};
    }
    if (!acc[article.country][article.source]) {
      acc[article.country][article.source] = [];
    }
    acc[article.country][article.source].push(article);
    return acc;
  }, {});

  res.json({ articles: groupedArticles });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});