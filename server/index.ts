import express, { Request, Response } from 'express';
import cors from 'cors';

const PORT: number = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors());
app.use(express.json());

app.post('/stream', async (req: Request, res: Response) => {
  const {
    text = '',
    chunkSize = 1,
    avgDelay = 30,
    delayVariance = 0,
  } = req.body ?? {};

  // Split on whitespace, keeping the spaces as part of tokens
  const words = (text as string).match(/\S+\s*/g) ?? [];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let aborted = false;
  res.on('close', () => {
    aborted = true;
  });

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < words.length && !aborted; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join('');
    res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
    // Box-Muller transform: standard normal sample scaled by delayVariance
    const variance = delayVariance > 0
      ? Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random()) * delayVariance
      : 0;
    const delay = Math.max(0, avgDelay + variance);
    await sleep(delay);
  }

  if (!aborted) {
    res.write('data: [DONE]\n\n');
  }

  res.end();
});

app.listen(PORT, () => {
  console.log(`stream-lab server listening on http://localhost:${PORT}`);
});
