# stream-lab

A playground for exploring how LLM-style token-by-token streaming feels and renders in a browser.

Express server echoes input text back as a token stream via SSE. React + Vite client controls all streaming parameters and renders tokens as they arrive, with a blinking cursor and stop button.

## Setup

```bash
npm install
npm run dev
```

Server runs on http://localhost:3001, client on http://localhost:5173.

## How it works

1. Type any text into the Input box (or click Auto Generate to fill it with random text)
2. Adjust streaming parameters as desired
3. Hit Send (or Enter) — the server echoes your text back word-by-word as SSE events
4. Hit Stop to abort mid-stream

## Parameters

All streaming parameters are controlled from the client UI per-request:

| Parameter | Default | Description |
|-----------|---------|-------------|
| Avg Delay | `30` ms | Average delay between tokens |
| Delay Variance | `0` ms | Standard deviation (σ) of per-token delay, sampled from a Gaussian distribution |
| Chunk Size | `1` word | Number of words grouped into each SSE event |

The only server-level configuration is:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |

## Project structure

```
├── package.json              # root (npm workspaces)
├── server/
│   ├── index.ts              # Express SSE endpoint
│   └── tsconfig.json
└── client/
    ├── vite.config.ts        # dev server + proxy to :3001
    ├── index.html
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx           # streaming UI component
        └── App.css           # dark theme styles (monospace)
```
