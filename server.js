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
  setTimeout(() => {
    attemptNewsFetch();
  }, 5000); // 5-second delay before first attempt
});

// Fetch news every 24 hours
cron.schedule("0 0 * * *", () => {
  attemptNewsFetch();
});

// Function to attempt fetching news with retry and fallback logic
async function attemptNewsFetch(retries = 3) {
  const countries = ["us", "gb", "ca", "de", "fr"]; // Example country codes

  console.log("Starting news fetch...");

  for (const country of countries) {
    let success = false;

    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Fetching news for ${country} (Attempt ${i + 1})...`);
        
        // Fetch news from both services for the specific country
        await fetchNewsFromNewsAPI(country);
        await fetchNewsFromMediaStack(country);

        console.log(`News fetch successful for ${country}.`);
        success = true;
        break; // Exit retry loop if successful
      } catch (error) {
        console.error(`Fetch attempt ${i + 1} failed for ${country}:`, error);

        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['Retry-After'] || (1000 * (i + 1));
          console.warn(`429 received for ${country}, retrying after ${retryAfter}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter));
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
        }
      }
    }

    if (!success) {
      console.error(`All retries failed for ${country}. Retrying in 24 hours.`);
      setTimeout(() => attemptNewsFetchForCountry(country, retries), 24 * 60 * 60 * 1000);
    }
  }
}

// Function to retry a single country after 24-hour backoff
async function attemptNewsFetchForCountry(country, retries = 3) {
  console.log(`Reattempting news fetch for ${country} after backoff...`);
  let success = false;

  for (let i = 0; i < retries; i++) {
    try {
      await fetchNewsFromNewsAPI(country);
      await fetchNewsFromMediaStack(country);
      console.log(`News fetch successful for ${country} after backoff.`);
      success = true;
      break;
    } catch (error) {
      console.error(`Retry attempt ${i + 1} failed for ${country}:`, error);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Short delay before retry
    }
  }

  if (!success) {
    console.error(`All retries failed for ${country} again. Waiting another 24 hours.`);
    setTimeout(() => attemptNewsFetchForCountry(country, retries), 24 * 60 * 60 * 1000);
  }
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
