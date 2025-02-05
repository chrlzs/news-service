const axios = require("axios");
const { Op } = require("sequelize");
const Article = require("../models/Article");
const RequestLog = require("../models/RequestLog");

const countries = [
  "us", "gb", "ca", "au", "in", "cn", "jp", "fr", "de", "it", "es", "ru", "br", "mx", "za", "ng", "eg", "sa", "ae", "kr", "tr", "id", "my", "th", "vn", "ph", "sg", "nz", "ie", "nl", "be", "ch", "at", "se", "no", "fi", "dk", "pl", "cz", "hu", "gr", "pt", "ro", "il", "ua", "ar", "co", "ve", "cl", "pe", "ec", "bo", "py", "uy", "cr", "pa", "do", "hn", "sv", "ni", "gt", "pr", "cu", "jm", "ht", "bs", "bz", "tt", "gd", "lc", "vc", "kn", "ag", "dm", "bb", "sr", "gy", "gf", "mq", "gp", "re", "yt", "pm", "bl", "mf", "aw", "cw", "sx", "bq", "ai", "vg", "ky", "ms", "tc", "fk", "gf", "pf", "nc", "wf", "tf", "yt", "re", "gf", "pf", "nc", "wf", "tf"
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, params, retries = 3, delayMs = 1000) => {
  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      console.log(`429 error encountered. Retrying in ${delayMs}ms...`);
      await delay(delayMs);
      return fetchWithRetry(url, params, retries - 1, delayMs * 2);
    }
    throw error;
  }
};

const fetchNewsFromMediaStack = async () => {
    const today = new Date().toISOString().split("T")[0];
  
    // Get or create today's request log
    const [log] = await RequestLog.findOrCreate({
      where: { date: today },
      defaults: { count: 0 },
    });
  
    // Check if the rate limit was hit recently
    if (log.lastRateLimitHit) {
      const coolDownPeriod = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
      const timeSinceLastRateLimit = new Date() - new Date(log.lastRateLimitHit);
  
      if (timeSinceLastRateLimit < coolDownPeriod) {
        console.log("Cool-down period active. Skipping fetch.");
        return;
      }
    }
  
    if (log.count >= 500) {
      console.log("Monthly request limit reached for MediaStack");
      log.lastRateLimitHit = new Date(); // Record the time the rate limit was hit
      await log.save();
      return;
    }
  
    // Fetch news for each country
    for (const country of countries) {
      try {
        // Check for cached articles
        const cachedArticles = await Article.findAll({
          where: {
            country: country,
            publishedAt: {
              [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000),
            },
          },
        });
  
        if (cachedArticles.length > 0) {
          console.log(`Serving cached articles for ${country}`);
          continue;
        }
  
        // Fetch news from MediaStack with retry logic
        const data = await fetchWithRetry("http://api.mediastack.com/v1/news", {
          access_key: process.env.MEDIASTACK_API_KEY,
          countries: country,
          limit: 10,
        });
  
        const articles = data.data;
  
        // Save articles to the database
        for (const article of articles) {
          await Article.findOrCreate({
            where: { url: article.url },
            defaults: {
              title: article.title,
              description: article.description,
              url: article.url,
              publishedAt: new Date(article.published_at),
              country: country,
              source: "MediaStack",
            },
          });
        }
  
        console.log(`Fetched and saved articles from ${country}:`, articles.length);
  
        // Increment the request count
        await log.increment("count");
  
        // Stop if the monthly limit is reached
        if (log.count >= 500) {
          console.log("Monthly request limit reached for MediaStack");
          log.lastRateLimitHit = new Date(); // Record the time the rate limit was hit
          await log.save();
          break;
        }
      } catch (error) {
        console.error(`Error fetching news for ${country}:`, error.message);
      }
    }
  };

module.exports = { fetchNewsFromMediaStack };