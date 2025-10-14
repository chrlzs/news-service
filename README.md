# Simple News Service

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

## Overview
A simple and efficient news aggregation service that fetches and processes news articles from various sources. Designed for internal use, this service provides an easy way to retrieve and organize news data.

## Features
- Fetches news from multiple sources
- Supports filtering and keyword-based searches
- Lightweight and efficient
- Simple API for integration with other services

## Installation
```sh
git clone https://github.com/chrlzs/news-service.git
cd news-service
npm install
```

## Configuration
Create a `.env` file in the root directory and set the required environment variables:
```
NEWS_API_KEY=your_api_key_here
PORT=3000
```

## Usage
Start the service:
```sh
npm start
```
Example API request:
```sh
curl http://localhost:3000/news?keyword=technology
```

## API Endpoints
| Method | Endpoint          | Description                |
|--------|------------------|----------------------------|
| GET    | `/news`          | Fetch latest news articles |
| GET    | `/news?keyword=` | Search news by keyword     |

## Dependencies
- Node.js
- Express.js
- Axios

## Notes
- Ensure your API key is valid and has sufficient quota.
- The service can be extended to support additional news sources.

## License
This project is licensed under the MIT License.


