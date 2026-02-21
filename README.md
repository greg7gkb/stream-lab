# stream-lab

A playground for exploring how LLM-style token-by-token streaming feels and renders in a browser.

Express server simulates token streaming via SSE. React + Vite client consumes the stream and renders tokens as they arrive, with a blinking cursor and stop button.

## Setup

```bash
npm install
npm run dev
```

Server runs on http://localhost:3001, client on http://localhost:5173.

## How it works

1. Type a prompt and hit Send (or Enter)
2. The server picks a preset response, splits it into words, and streams them back as SSE events (~30ms apart)
3. The client reads the stream via `fetch` + `ReadableStream` and appends each token to the display
4. Hit Stop to abort mid-stream

## Configuration

Set environment variables before starting the server:

| Variable | Default | Description |
|----------|---------|-------------|
| `TOKEN_DELAY_MS` | `30` | Delay between tokens (ms) |
| `CHUNK_SIZE` | `1` | Words per SSE event |
| `PORT` | `3001` | Server port |

```bash
TOKEN_DELAY_MS=15 CHUNK_SIZE=2 npm run dev
```

## Project structure

```
├── package.json              # root (npm workspaces)
├── server/
│   ├── index.js              # Express SSE endpoint
│   └── responses.js          # preset mock responses
└── client/
    ├── vite.config.js        # dev server + proxy to :3001
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx           # streaming UI component
        └── App.css           # dark theme styles
```
