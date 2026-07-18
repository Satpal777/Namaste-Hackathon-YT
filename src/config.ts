import { API_KEY_ENV_VAR, type EmbeddingProviderName } from './embeddings/providers';

/**
 * One PROVIDER flag switches chat *and* embeddings together — the judging
 * story is "flip one flag, point at the already-seeded collection". Individual
 * CHAT_* variables override the derived chat settings when set.
 */
export interface AppConfig {
  readonly databaseUrl: string;
  readonly qdrant: { readonly url: string; readonly apiKey?: string };
  readonly provider: EmbeddingProviderName;
  readonly chat: {
    readonly baseURL: string;
    readonly apiKey: string;
    readonly model: string;
  };
  /**
   * Retrieval-score floor for abstention. Cosine scales differ per embedding
   * model, so the default is per-provider; ABSTENTION_THRESHOLD overrides for
   * hand-tuning against real questions.
   */
  readonly abstentionThreshold: number;
  readonly rateLimit?: {
    readonly url: string;
    readonly token: string;
    readonly dailyCap: number;
  };
}

const CHAT_DEFAULTS = {
  gemini: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-2.5-flash',
    // gemini-embedding-001 cosine scores run high; irrelevant text still lands
    // near ~0.5.
    abstentionThreshold: 0.55,
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    // text-embedding-3-small scores run much lower across the board.
    abstentionThreshold: 0.3,
  },
} as const;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const provider = (env.PROVIDER ?? 'gemini') as EmbeddingProviderName;
  if (provider !== 'gemini' && provider !== 'openai') {
    throw new Error(`PROVIDER must be "gemini" or "openai", got "${env.PROVIDER}"`);
  }

  const defaults = CHAT_DEFAULTS[provider];
  const apiKeyVar = API_KEY_ENV_VAR[provider];
  const chatApiKey = env.CHAT_API_KEY ?? env[apiKeyVar];

  return {
    databaseUrl: required(env, 'DATABASE_URL'),
    qdrant: {
      url: required(env, 'QDRANT_URL'),
      apiKey: env.QDRANT_API_KEY,
    },
    provider,
    chat: {
      baseURL: env.CHAT_BASE_URL ?? defaults.baseURL,
      apiKey:
        chatApiKey ?? missing(`CHAT_API_KEY or ${apiKeyVar} (PROVIDER=${provider})`),
      model: env.CHAT_MODEL ?? defaults.model,
    },
    abstentionThreshold: env.ABSTENTION_THRESHOLD
      ? Number(env.ABSTENTION_THRESHOLD)
      : defaults.abstentionThreshold,
    rateLimit:
      env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
        ? {
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
            dailyCap: Number(env.DAILY_REQUEST_CAP ?? '500'),
          }
        : undefined,
  };
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  return env[name] ?? missing(name);
}

function missing(name: string): never {
  throw new Error(`Missing required environment variable: ${name}`);
}
