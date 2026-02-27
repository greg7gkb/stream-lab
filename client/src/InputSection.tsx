import { memo } from 'react';

const WORDS = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'a', 'lazy', 'dog',
  'she', 'walked', 'through', 'an', 'open', 'field', 'under', 'bright',
  'blue', 'sky', 'with', 'soft', 'clouds', 'drifting', 'slowly', 'above',
  'he', 'sat', 'by', 'river', 'watching', 'water', 'flow', 'past',
  'ancient', 'stones', 'covered', 'in', 'green', 'moss', 'they', 'built',
  'small', 'cabin', 'near', 'edge', 'of', 'forest', 'where', 'tall',
  'trees', 'swayed', 'gently', 'wind', 'birds', 'sang', 'their', 'morning',
  'songs', 'while', 'sun', 'rose', 'behind', 'distant', 'mountains',
  'light', 'filled', 'valley', 'and', 'shadows', 'retreated', 'into',
  'deep', 'ravines', 'children', 'played', 'on', 'warm', 'sand', 'waves',
  'crashed', 'against', 'rocky', 'shore', 'each', 'day', 'brought', 'new',
  'stories', 'to', 'those', 'who', 'listened', 'carefully', 'old', 'man',
  'told', 'tales', 'from', 'long', 'ago', 'when', 'world', 'was', 'young',
  'still', 'full', 'wonder', 'people', 'gathered', 'around', 'fire',
  'sharing', 'bread', 'laughter', 'stars', 'appeared', 'one', 'night',
  'fell', 'across', 'land', 'gentle', 'rain', 'began', 'fall', 'quietly',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateText(wordCount: number): string {
  const result: string[] = [];
  let sentenceLength = 0;
  let currentTarget = randomInt(8, 15);

  for (let i = 0; i < wordCount; i++) {
    let word = WORDS[randomInt(0, WORDS.length - 1)];

    if (sentenceLength === 0) {
      word = word[0].toUpperCase() + word.slice(1);
    }

    sentenceLength++;

    if (sentenceLength >= currentTarget || i === wordCount - 1) {
      word += '.';
      sentenceLength = 0;
      currentTarget = randomInt(8, 15);
    }

    result.push(word);
  }

  return result.join(' ');
}

interface Props {
  prompt: string;
  autoWordCount: number;
  streaming: boolean;
  onPromptChange: (v: string) => void;
  onAutoWordCountChange: (v: number) => void;
  onSend: () => void;
  onStop: () => void;
}

export default memo(function InputSection({
  prompt,
  autoWordCount,
  streaming,
  onPromptChange,
  onAutoWordCountChange,
  onSend,
  onStop,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleAutoGenerate = () => {
    onPromptChange(generateText(Math.max(1, autoWordCount)));
  };

  return (
    <section className="section">
      <h2 className="section-label">Input</h2>
      <div className="input-row">
        <textarea
          className="prompt-input"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a prompt… (Enter to send, Shift+Enter for newline)"
          rows={3}
          disabled={streaming}
        />
        <div className="button-col">
          <div className="auto-generate-group">
            <label className="auto-word-label">
              Words
              <input
                type="number"
                className="auto-word-input"
                value={autoWordCount}
                onChange={(e) => onAutoWordCountChange(Math.max(1, Number(e.target.value) || 1))}
                min={1}
                disabled={streaming}
              />
            </label>
            <button
              className="btn-auto"
              onClick={handleAutoGenerate}
              disabled={streaming}
            >
              Auto Generate
            </button>
          </div>
          {streaming ? (
            <button className="btn btn-stop" onClick={onStop}>
              Stop
            </button>
          ) : (
            <button
              className="btn btn-send"
              onClick={onSend}
              disabled={!prompt.trim()}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </section>
  );
});
