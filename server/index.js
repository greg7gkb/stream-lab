import express from 'express';
import cors from 'cors';
import { pickResponse } from './responses.js';

const PORT = process.env.PORT ?? 3001;
const TOKEN_DELAY_MS = Number(process.env.TOKEN_DELAY_MS ?? 30);
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE ?? 1);

const app = express();
app.use(cors());
app.use(express.json());

app.post('/stream', async (req, res) => {
  const { prompt = '' } = req.body ?? {};

  const text = pickResponse(prompt);
  // Split on whitespace, keeping the spaces as part of tokens
  const words = text.match(/\S+\s*/g) ?? [];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let aborted = false;
  res.on('close', () => {
    aborted = true;
  });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < words.length && !aborted; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join('');
    res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
    await sleep(TOKEN_DELAY_MS);
  }

  if (!aborted) {
    res.write('data: [DONE]\n\n');
  }

  res.end();
});

app.listen(PORT, () => {
  console.log(`stream-lab server listening on http://localhost:${PORT}`);
  console.log(`  TOKEN_DELAY_MS = ${TOKEN_DELAY_MS}`);
  console.log(`  CHUNK_SIZE     = ${CHUNK_SIZE}`);
});
