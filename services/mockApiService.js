const mockNewsAPIResponse = {
  articles: [
    {
      title: "Mock News Title 1",
      description: "Mock News Description 1",
      url: "http://mocknews.com/article1",
      publishedAt: new Date().toISOString(),
      country: "us",
      source: "NewsAPI",
    },
    // ...more mock articles...
  ],
};

const mockMediaStackResponse = {
  data: [
    {
      title: "Mock MediaStack Title 1",
      description: "Mock MediaStack Description 1",
      url: "http://mockmediastack.com/article1",
      published_at: new Date().toISOString(),
      country: "us",
      source: "MediaStack",
    },
    // ...more mock articles...
  ],
};

const fetchNewsFromNewsAPI = async (country) => {
  console.log(`Mock fetchNewsFromNewsAPI called for country: ${country}`);
  return mockNewsAPIResponse;
};

const fetchNewsFromMediaStack = async (country) => {
  console.log(`Mock fetchNewsFromMediaStack called for country: ${country}`);
  return mockMediaStackResponse;
};

module.exports = { fetchNewsFromNewsAPI, fetchNewsFromMediaStack };
