export interface ChunkOptions {
  maxChunkSize?: number;
  overlap?: number;
}

const DEFAULTS: Required<ChunkOptions> = {
  maxChunkSize: 1000,
  overlap: 200,
};

/**
 * Split text into overlapping chunks at sentence boundaries.
 * Overlap ensures context isn't lost at chunk edges.
 */
export function chunkText(text: string, options?: ChunkOptions): string[] {
  const { maxChunkSize, overlap } = { ...DEFAULTS, ...options };

  const cleaned = text.replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length <= maxChunkSize) return [cleaned];

  const sentences = cleaned.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [
    cleaned,
  ];

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      const words = current.split(" ");
      const overlapWords = [];
      let overlapLen = 0;
      for (let i = words.length - 1; i >= 0 && overlapLen < overlap; i--) {
        overlapWords.unshift(words[i]);
        overlapLen += words[i].length + 1;
      }
      current = overlapWords.join(" ") + " " + sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}
