export interface Token {
  id: number;
  text: string;
}

export interface DebugEntry {
  seq: number;
  ms: number;   // elapsed ms since stream start
  raw: string;  // raw SSE payload
}
