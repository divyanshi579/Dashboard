require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit'); // ✅ add this
const path = require('path');

const app = express();
const port = 3001;

// ✅ create the rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(cors());
app.use(express.json());

//WEATHER ENDPOINT
app.get('/api/weather', apiLimiter, async (req, res) => {
  const { city } = req.query;

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );

    const data = response.data;

    const weatherData = {
      temp: Number(data.main?.temp) || 0,
      feels_like: Number(data.main?.feels_like) || 0,
      humidity: Number(data.main?.humidity) || 0,
      pressure: Number(data.main?.pressure) || 0,
      wind_speed: Number(data.wind?.speed) || 0,
      wind_deg: Number(data.wind?.deg) || 0,
      description: data.weather?.[0]?.description || "No description",
      icon: data.weather?.[0]?.icon || "01d",
      city: data.name,
      country: data.sys?.country
    };

    res.json(weatherData);
  } catch (error) {
    console.error("Weather API error:", error.message, error.response?.data);
    res.status(404).json({ error: "City not found or weather service unavailable." });
    res.status(500).json({ 
    error: "Weather service unavailable",
    details: error.response?.data?.message 
});

  }
});

// ----------------------
// CHAT ENDPOINT (FIXED)
// ----------------------


app.post('/api/chat', async (req, res) => {
  const userInput = req.body.messages?.filter(m => m.role === 'user').pop()?.content || 'Hello';

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-small-3.2-24b-instruct:free',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: userInput }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dashboard-8aas.onrender.com', // or your actual frontend URL
          'X-Title': 'ChatWidget'
        }
      }
    );

    const text = response.data.choices[0].message.content;
    res.json({ role: "assistant", content: text });

  } catch (err) {
    console.error("OpenRouter API Error:", err.response?.data || err.message);
    res.status(500).json({ content: "⚠️ OpenRouter service unavailable" });
  }
});


// Start server
// Start server
const PORT = process.env.PORT || 3001;

// Serve static frontend files from ../client
const clientPath = path.join(__dirname, '../client');

app.use(express.static(clientPath));

app.get('/*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.listen(PORT, () => console.log(`
✅ Server running at http://localhost:${PORT}
🌦️  Weather API → GET /api/weather?city=London
🤖  Chat API    → POST /api/chat
`));
