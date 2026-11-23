// server/test-stream-events.js
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testStreamEvents() {
  const stream = client.messages.stream({
    model: 'claude-haiku-5-5',
    max_tokens: 256,
    messages: [
      { role: 'user', content: 'Say hello in Swahili and English.' },
    ],
  });

  stream.on('message', (message) => {
    console.log('[message] Stream started:', message.id);
  });

  stream.on('contentBlock', (block) => {
    console.log('[contentBlock] New content block:', block.type);
  });

  stream.on('text', (text) => {
    process.stdout.write(text);
  });

  stream.on('finalMessage', (message) => {
    console.log('\n[finalMessage] Done. Stop reason:', message.stop_reason);
    console.log('Usage:', message.usage);
  });

  stream.on('error', (error) => {
    console.error('[error]', error.message);
  });

  await stream.finalMessage();
}

testStreamEvents();