import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';
import type { EmbeddingProvider } from './embedding-provider';

export type EmbeddingProviderName = 'gemini' | 'openai';

/**
 * Dev default is Gemini (free tier); the submitted build runs OpenAI. Both
 * stay working — switching is one flag, pointing at an already-seeded
 * collection.
 *
 * Batching and retry come from the AI SDK: `embedMany` splits values to the
 * provider's max batch size and retries transient failures per call.
 */
export function createEmbeddingProvider(name: EmbeddingProviderName): EmbeddingProvider {
  return name === 'gemini' ? geminiEmbeddings() : openaiEmbeddings();
}

function geminiEmbeddings(): EmbeddingProvider {
  // 3072 avoids the truncation footgun: gemini-embedding-001 requires manual
  // re-normalisation below 3072, and at this corpus size memory saving is
  // worthless.
  const dimensions = 3072;
  const model = google.textEmbedding('gemini-embedding-001');
  const options = (taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY') => ({
    google: { taskType, outputDimensionality: dimensions },
  });
  return {
    provider: 'gemini',
    model: 'gemini-embedding-001',
    dimensions,
    async embedDocuments(texts) {
      const { embeddings } = await embedMany({
        model,
        values: [...texts],
        providerOptions: options('RETRIEVAL_DOCUMENT'),
      });
      return embeddings;
    },
    async embedQuery(text) {
      const { embedding } = await embed({
        model,
        value: text,
        providerOptions: options('RETRIEVAL_QUERY'),
      });
      return embedding;
    },
  };
}

function openaiEmbeddings(): EmbeddingProvider {
  const dimensions = 1536;
  const model = openai.textEmbedding('text-embedding-3-small');
  return {
    provider: 'openai',
    model: 'text-embedding-3-small',
    dimensions,
    async embedDocuments(texts) {
      const { embeddings } = await embedMany({ model, values: [...texts] });
      return embeddings;
    },
    async embedQuery(text) {
      const { embedding } = await embed({ model, value: text });
      return embedding;
    },
  };
}
