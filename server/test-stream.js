// server/test-stream.js
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testStream() {
  const stream = client.messages.stream({
    model: 'claude-haiku-5-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: 'Explain how M-Pesa works in three sentences.',
      },
    ],
  });

  // Listen for text events -- each one contains a chunk of text
  stream.on('text', (text) => {
    process.stdout.write(text);
  });

  // Wait for the stream to finish
  const finalMessage = await stream.finalMessage();

  console.log('\n\n--- Stream complete ---');
  console.log('Total tokens used:', finalMessage.usage);
}

testStream();