const axios = require('axios');
require('dotenv').config();

(async () => {
  try {
    const res = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    });

    const models = res.data.data.map(m => m.id);
    console.log("✅ Models you can use:\n", models);
  } catch (err) {
    console.error("❌ Could not fetch models:\n", err.response?.data || err.message);
  }
})();
