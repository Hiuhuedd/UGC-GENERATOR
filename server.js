const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for your client app
app.use(cors({
  origin: ['http://127.0.0.1:5500', "https://ugc-fe.onrender.com"]
}));

// Middleware to parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// RapidAPI credentials for Quora Scraper
const RAPIDAPI_KEY = '5d042ae686msh7d584937ec7459bp141c0cjsn5b828dfc4528';
const RAPIDAPI_HOST = 'quora-scraper.p.rapidapi.com';

// Common headers for RapidAPI requests
const getRapidAPIHeaders = () => ({
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': RAPIDAPI_HOST
});

// Helper function to fetch Quora data from RapidAPI
const fetchQuoraData = async (query) => {
  const url = `https://${RAPIDAPI_HOST}/search_answers?query=${query}&language=en&time=all_times`;
  const headers = getRapidAPIHeaders();

  try {
    const response = await axios.get(url, { headers });
    
    if (response.data) {
      return response.data.data.map(answer => ({
        text: answer.content,
        author: answer.author?.name || 'Unknown Author',
        credentials: `Upvotes: ${answer.upvotes}, Comments: ${answer.comments}, Shares: ${answer.shares}`,
        url: answer.url,
        views: answer.views
      }));
    } else {
      throw new Error('No answers found for the given query.');
    }
  } catch (error) {
    console.error('Error fetching Quora data:', error.response?.data || error.message);
    throw new Error('Unable to fetch Quora data. Please try again later.');
  }
};

// Endpoint to fetch quotes from Quora
app.post('/api/quotes', async (req, res) => {
  const query = req.body.query;

  if (!query) {
    return res.status(400).json({
      error: 'No keyword provided. Please enter a keyword to search for quotes.',
    });
  }

  try {
    const quoraData = await fetchQuoraData(query);
    return res.status(200).json({ quotes: quoraData });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// New endpoint to search Quora questions
app.get('/api/search/questions', async (req, res) => {
  const { query, language = 'en', time = 'all_times' } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const options = {
      method: 'GET',
      url: 'https://quora-scraper.p.rapidapi.com/search_questions',
      params: { query, language, time },
      headers: getRapidAPIHeaders()
    };

    const response = await axios.request(options);
    console.log("SERCH QUESTIONS",response.data);
    
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch Quora questions' });
  }
});

// New endpoint to search Quora profiles
app.get('/api/search/profiles', async (req, res) => {
  const { query, language = 'en' } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const options = {
      method: 'GET',
      url: 'https://quora-scraper.p.rapidapi.com/search_profiles',
      params: { query, language },
      headers: getRapidAPIHeaders()
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch Quora profiles' });
  }
});

// Utility function for detailed error handling
const logError = (error) => {
  if (error.response) {
    console.error('Error Response:', error.response.data);
  } else if (error.request) {
    console.error('Error Request:', error.request);
  } else {
    console.error('Error Message:', error.message);
  }
};

// New endpoint to get question answers
app.get('/api/question/answers', async (req, res) => {
  const { url} = req.query;

  // Validate URL parameter
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  const fullUrl = `https://www.quora.com/${url.replace(/\s+/g, '-')}`;

  try {
    const options = {
      method: 'GET',
      url: 'https://quora-scraper.p.rapidapi.com/question_answers',
      params: { url: fullUrl, sort:'hide_relevant_answers' },
      headers: getRapidAPIHeaders(),
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    logError(error);
    res.status(500).json({ error: 'Failed to fetch question answers' });
  }
});

// New endpoint to get question comments
app.get('/api/question/comments', async (req, res) => {
  const { url } = req.query;

  // Validate the URL parameter
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Replace spaces with hyphens in the URL
  const fullUrl = `https://www.quora.com/${url.replace(/\s+/g, '-')}`;
  console.log('Full URL:', fullUrl);

  try {
    const options = {
      method: 'GET',
      url: 'https://quora-scraper.p.rapidapi.com/question_comments',
      params: { url: fullUrl, sort: 'hide_relevant_answers' },
      headers: getRapidAPIHeaders(),
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error('Error occurred:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch question comments' });
  }
});

// New endpoint to get answer comments
app.get('/api/answer/comments', async (req, res) => {
  const url  = req.query;
  const  url1  = `https://www.quora.com/${url}`

  if (!url1) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const options = {
      method: 'GET',
      url: 'https://quora-scraper.p.rapidapi.com/answer_comments',
      params: { url:url1 },
      headers: getRapidAPIHeaders()
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch answer comments' });
  }
});

// Root endpoint to confirm the server is running
app.get('/', (req, res) => {
  res.send('Welcome to the Quora Scraper API! Use various endpoints to fetch Quora data.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});