// usage [from the command line]: node insertTestArticles.js 
require('dotenv').config();
const sequelize = require("./config/database");
const Article = require("./models/Article");

async function insertTestArticles() {
  await sequelize.sync(); // Ensure DB is ready

  const testArticles = [
    {
      title: "Breaking: Tech Industry Surges",
      description: "Tech stocks hit record highs as AI adoption increases.",
      content: "The stock market saw significant gains today, driven by increased investments in artificial intelligence...",
      source: "TechNews",
      url: "https://example.com/tech-news",
      urlToImage: "https://example.com/tech-image.jpg",
      publishedAt: new Date(),
      country: "us",
    },
    {
      title: "Economy Update: Inflation Rates Drop",
      description: "Economic indicators show a steady decline in inflation rates.",
      content: "Economists report a promising decrease in inflation as government policies take effect...",
      source: "FinanceDaily",
      url: "https://example.com/finance-news",
      urlToImage: "https://example.com/finance-image.jpg",
      publishedAt: new Date(),
      country: "gb",
    },
  ];

  try {
    await Article.bulkCreate(testArticles);
    console.log("✅ Test articles inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting test articles:", error);
  } finally {
    await sequelize.close(); // Close DB connection
  }
}

insertTestArticles();