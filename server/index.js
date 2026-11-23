// server/index.js
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Regular (non-streaming) endpoint for comparison
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-5-5',
      max_tokens: 1024,
      messages,
    });

    res.json({
      content: response.content[0].text,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Streaming endpoint using SSE
app.post('/api/chat/stream', async (req, res) => {
  const { messages } = req.body;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Prevent response buffering (important for some proxies)
  res.flushHeaders();

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-5-5',
      max_tokens: 1024,
      messages,
    });

    stream.on('text', (text) => {
      // Send each text chunk as an SSE event
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    stream.on('finalMessage', (message) => {
      // Send usage information
      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          usage: message.usage,
        })}\n\n`
      );
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: 'Stream interrupted',
        })}\n\n`
      );
      res.end();
    });

    // Client aborted (e.g. closed the tab) — nothing to send, just stop quietly
    stream.on('abort', () => {
      console.log('Stream aborted: client disconnected');
    });

    // Handle client disconnect. Listen on `res`, not `req`: in Node 16+
    // `req` emits 'close' as soon as the body is read (express.json() does
    // that immediately), which would abort every stream before it starts.
    res.on('close', () => {
      if (!res.writableEnded) {
        stream.abort();
      }
    });
  } catch (error) {
    console.error('Stream setup error:', error);
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: 'Failed to start stream',
      })}\n\n`
    );
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});