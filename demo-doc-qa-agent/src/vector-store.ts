import { openai } from "@ai-sdk/openai";
import { embedMany, embed } from "ai";

export interface DocumentChunk {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    source: string;
    page?: number;
    chunkIndex: number;
  };
}

/**
 * In-memory vector store with cosine similarity search.
 * For production, swap this with pgvector/Pinecone/Qdrant — the interface stays the same.
 */
export class VectorStore {
  private chunks: DocumentChunk[] = [];
  private embeddingModel = openai.embedding("text-embedding-3-small");

  get size() {
    return this.chunks.length;
  }

  async addDocuments(
    texts: string[],
    metadatas: DocumentChunk["metadata"][]
  ): Promise<void> {
    const batchSize = 100;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchMeta = metadatas.slice(i, i + batchSize);

      const { embeddings } = await embedMany({
        model: this.embeddingModel,
        values: batch,
      });

      for (let j = 0; j < batch.length; j++) {
        this.chunks.push({
          id: `${batchMeta[j].source}-${batchMeta[j].chunkIndex}`,
          text: batch[j],
          embedding: embeddings[j],
          metadata: batchMeta[j],
        });
      }
    }
  }

  async search(query: string, topK = 5): Promise<DocumentChunk[]> {
    const { embedding } = await embed({
      model: this.embeddingModel,
      value: query,
    });

    const scored = this.chunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(embedding, chunk.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => s.chunk);
  }

  serialize(): string {
    return JSON.stringify(this.chunks);
  }

  static deserialize(data: string): VectorStore {
    const store = new VectorStore();
    store.chunks = JSON.parse(data);
    return store;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
