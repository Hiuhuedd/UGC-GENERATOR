const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for your client
app.use(cors({
  origin: 'http://127.0.0.1:5500', // Update with your allowed origin
}));

// Middleware to parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// RapidAPI credentials for Quora Scraper
const RAPIDAPI_KEY = '27365f6579msh93c9f38dd1de230p1b0d67jsn5e144031af30';
const RAPIDAPI_HOST = 'quora-scraper.p.rapidapi.com';

// Helper function to fetch Quora data from RapidAPI
const fetchQuoraData = async (query) => {
  const url = `https://${RAPIDAPI_HOST}/search_answers?query=${query}&language=en&time=all_times`;

  const headers = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
  };

  try {
    const response = await axios.get(url, { headers });
console.log(response.data.data[0]);

    // Assuming the response structure contains an array of questions
    if (response.data) {
      return response.data.data.map(answer => ({
        text: answer.content, // The main content of the answer
        author: answer.author?.name || 'Unknown Author', // Safely accessing the author's name
        credentials: `Upvotes: ${answer.upvotes}, Comments: ${answer.comments}, Shares: ${answer.shares}`, // Additional details
        url: answer.url, // URL of the answer
        views: answer.views, // Number of views
      }));
    } else {
      throw new Error('No answers found for the given query.');
    }
  } catch (error) {
    console.error('Error fetching Quora data:', error.response?.data || error.message);
    throw new Error('Unable to fetch Quora data. Please try again later.');
  }
};

// Endpoint to fetch quotes from Quora and other sources
app.post('/api/quotes', async (req, res) => {
  const query = req.body.query;

  if (!query) {
    return res.status(400).json({
      error: 'No keyword provided. Please enter a keyword to search for quotes.',
    });
  }

  try {
    const quoraData = await fetchQuoraData(query);

    // Combine Quora data with other data sources (if applicable)
    const quotes = quoraData; // Here, we're just using Quora data as an example

    return res.status(200).json({ quotes });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Root endpoint to confirm the server is running
app.get('/', (req, res) => {
  res.send('Welcome to the Quotes API! Use POST /api/quotes to fetch quotes.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
