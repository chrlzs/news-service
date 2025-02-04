const axios = require("axios");
const Article = require("../models/Article");
const RequestLog = require("../models/RequestLog");

const countries = [
    "ae", "ar", "at", "au", "be", "bg", "br", "ca", "ch", "cn", "co", "cu", "cz",
    "de", "eg", "fr", "gb", "gr", "hk", "hu", "id", "ie", "il", "in", "it", "jp",
    "kr", "lt", "lv", "ma", "mx", "my", "ng", "nl", "no", "nz", "ph", "pl", "pt",
    "ro", "rs", "ru", "sa", "se", "sg", "si", "sk", "th", "tr", "tw", "ua", "us", "ve", "za"
  ];

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
  
    // Fetch headlines for each country
    for (const country of countries) {
      try {
        const response = await axios.get("https://newsapi.org/v2/top-headlines", {
          params: {
            country: country,
            apiKey: process.env.NEWSAPI_KEY,
          },
        });
  
        const articles = response.data.articles;
  
        // Add country of origin to each article
        for (const article of articles) {
          await Article.findOrCreate({
            where: { url: article.url },
            defaults: {
              title: article.title,
              description: article.description,
              url: article.url,
              publishedAt: new Date(article.publishedAt),
              country: country, // Add country of origin
            },
          });
        }
  
        console.log(`Fetched ${articles.length} articles from ${country}`);
  
        // Increment the request count
        await log.increment("count");
  
        // Stop if the daily limit is reached
        if (log.count >= 100) {
          console.log("Daily request limit reached");
          break;
        }
      } catch (error) {
        console.error(`Error fetching news for ${country}:`, error.message);
      }
    }
  };
  
  module.exports = { fetchNews };