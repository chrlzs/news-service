require('dotenv').config();

const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 1337;
const newsApiKey = process.env.NEWSAPI_KEY;

// Enable CORS
app.use(cors());

// Example news data
const news = [
  {
    title: "Breaking News",
    description: "This is a breaking news article.",
    url: "https://example.com",
  },
  {
    title: "Another News Article",
    description: "This is another news article.",
    url: "https://example.com",
  },
];

// API endpoint to fetch news
app.get("/news", (req, res) => {
  res.json({ articles: news });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});