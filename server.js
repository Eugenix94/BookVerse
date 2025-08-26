const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Proxy endpoint: /loc/bib/:lccn
app.get('/loc/bib/:lccn', async (req, res) => {
  try {
    const lccn = req.params.lccn;
    if (!lccn) return res.status(400).json({ error: 'Missing lccn' });

    const url = `https://id.loc.gov/resources/bibs/${encodeURIComponent(lccn)}.json`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });

    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

// Simple status endpoint so the frontend can detect if the proxy is running
app.get('/status', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

app.listen(PORT, () => console.log(`LoC proxy running on http://localhost:${PORT}`));
