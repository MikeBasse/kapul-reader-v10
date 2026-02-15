// Backend proxy server for Kapul Reader
// Keeps the Anthropic API key secure on the server side

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent .env file (for local development)
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// API Configuration from environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS) || 1024;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    apiConfigured: Boolean(ANTHROPIC_API_KEY),
    model: ANTHROPIC_MODEL
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    configured: Boolean(ANTHROPIC_API_KEY),
    model: ANTHROPIC_MODEL
  });
});

// Proxy endpoint for Claude API
app.post('/api/claude', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: { message: 'API key not configured on server' }
    });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: { message: 'Invalid request: messages array required' }
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: system || '',
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: error.error || { message: `API Error: ${response.status}` }
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Claude API Error:', error);
    res.status(500).json({
      error: { message: 'Failed to connect to Claude API' }
    });
  }
});

// Serve the React app for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Kapul Reader server running on port ${PORT}`);
  console.log(`API configured: ${Boolean(ANTHROPIC_API_KEY)}`);
  console.log(`Model: ${ANTHROPIC_MODEL}`);
});
