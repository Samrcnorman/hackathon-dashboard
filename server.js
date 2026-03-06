require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

// ============================================================
// EDIT THESE
// ============================================================
const TARGET_HOURS = 80;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.DATABASE_ID || '261b5fdbc0bc8095beddf87ab7ac74b0';
const PORT = process.env.PORT || 3000;
// ============================================================

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/hours', async (req, res) => {
  try {
    const response = await axios.post(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        filter: {
          property: 'Hackathon?',
          checkbox: { equals: true }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      }
    );

    const results = response.data.results || [];
    let total = 0;
    const projects = [];

    for (const page of results) {
      const props = page.properties;

      // Get project name
      const titleArr = props['Project name']?.title || [];
      const name = titleArr[0]?.plain_text || '(untitled)';

      // Get hours saved
      const hours = props['Hours Saved (Hackathon)']?.number || 0;

      if (hours > 0) {
        projects.push({ name, hours });
        total += hours;
      }
    }

    res.json({ total, target: TARGET_HOURS, projects });
  } catch (err) {
    console.error('Notion API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch from Notion' });
  }
});

app.listen(PORT, () => {
  console.log(`Hackathon dashboard running at http://localhost:${PORT}`);
});
