const axios = require("axios");
const Article = require("../models/Article");
const RequestLog = require("../models/RequestLog");

const fetchNews = async () => {
    const today = new Date().toISOString().split("T")[0];
  
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
  
    // Fetch news from NewsAPI
    const response = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        country: "us",
        apiKey: process.env.NEWSAPI_KEY,
      },
    });
  
    const articles = response.data.articles;
  
    // Save articles to the database
    for (const article of articles) {
      await Article.findOrCreate({
        where: { url: article.url },
        defaults: {
          title: article.title,
          description: article.description,
          publishedAt: new Date(article.publishedAt),
        },
      });
    }
  
    console.log("Fetched and saved articles:", articles.length);
  };

module.exports = { fetchNews };