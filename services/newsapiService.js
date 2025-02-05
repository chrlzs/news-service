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

const fetchNewsFromNewsAPI = async () => {
  const today = new Date().toISOString().split("T")[0];

  // Get or create today's request log
  const [log] = await RequestLog.findOrCreate({
    where: { date: today },
    defaults: { count: 0 },
  });

  // Check if the rate limit was hit recently
  if (log.lastRateLimitHit) {
    const coolDownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const timeSinceLastRateLimit = new Date() - new Date(log.lastRateLimitHit);

    if (timeSinceLastRateLimit < coolDownPeriod) {
      console.log("Cool-down period active. Skipping fetch.");
      return;
    }
  }

  try {
    const url = "https://newsapi.org/v2/top-headlines";
    const params = { apiKey: "YOUR_API_KEY", country: "us" }; // Example params
    const data = await fetchWithRetry(url, params);

    // Process and save the data
    // ...

    // Update the request log
    log.count += 1;
    await log.save();
  } catch (error) {
    if (error.response && error.response.status === 429) {
      log.lastRateLimitHit = new Date();
      await log.save();
    }
    console.error("Failed to fetch news:", error);
  }
};

module.exports = { fetchNewsFromNewsAPI };