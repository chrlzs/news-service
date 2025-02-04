const axios = require("axios");
const { Op } = require("sequelize");
const Article = require("../models/Article");
const RequestLog = require("../models/RequestLog");

const fetchWithRetry = async (url, params, retries = 3, delay = 1000) => {
  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, params, retries - 1, delay * 2);
    }
    throw error;
  }
};

const fetchNews = async () => {
  const today = new Date().toISOString().split("T")[0];

  // Check for cached articles
  const cachedArticles = await Article.findAll({
    where: {
      country: "us",
      publishedAt: {
        [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });

  if (cachedArticles.length > 0) {
    console.log("Serving cached articles");
    return cachedArticles;
  }

  // Get or create today's request log
  const [log] = await RequestLog.findOrCreate({
    where: { date: today },
    defaults: { count: 0 },
  });

  if (log.count >= 100) {
    console.log("Daily request limit reached");
    return;
  }

  // Increment the request count
  await log.increment("count");

  try {
    // Fetch news from NewsAPI with retry logic
    const data = await fetchWithRetry("https://newsapi.org/v2/top-headlines", {
      country: "us",
      apiKey: process.env.NEWS_API_KEY,
    });

    const articles = data.articles;

    // Save articles to the database
    for (const article of articles) {
      await Article.findOrCreate({
        where: { url: article.url },
        defaults: {
          title: article.title,
          description: article.description,
          url: article.url,
          publishedAt: new Date(article.publishedAt),
          country: "us",
        },
      });
    }

    console.log("Fetched and saved articles:", articles.length);
  } catch (error) {
    console.error("Error fetching news:", error.message);
  }
};

module.exports = { fetchNews };