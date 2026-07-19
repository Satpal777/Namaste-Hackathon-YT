/**
 * Greetings and small talk never retrieve a confident transcript match, so
 * without this a plain "hi" hits the abstention message ("I couldn't find this
 * in the uploaded videos…") — which reads as broken. This classifies those
 * conversational openers deterministically (no embedding, no model call, no
 * cost) and returns a friendly reply that also points the user at what the app
 * can actually answer.
 *
 * It stays deliberately narrow: the regexes are anchored, so ONLY a message
 * that is entirely a greeting / thanks / capability question matches. A real
 * question — even one that opens with "hi, what is a closure?" — falls through
 * to retrieval, and an off-topic question ("how do I bake bread?") still
 * abstains. The retrieval guardrail is unchanged; this only rescues the openers.
 */

export type ConversationalIntent = 'greeting' | 'gratitude' | 'capability';

export const CONVERSATIONAL_REPLIES: Record<ConversationalIntent, string> = {
  greeting:
    "Namaste! 👋 I'm your guide to the *Namaste JavaScript* series by Akshay Saini. Ask me about a concept from the videos — hoisting, closures, the execution context, promises, `async/await` — and I'll answer with citations that jump to the exact moment in the source video.",
  gratitude:
    "You're welcome! Ask me anything else about the *Namaste JavaScript* series whenever you're ready.",
  capability:
    "I answer questions about the *Namaste JavaScript* series by Akshay Saini, using only what's said in the videos. Try hoisting, closures, the execution context, the scope chain, promises, or `async/await` — every answer links back to the exact second in the source video.",
};

const GREETING =
  /^(hi+|hey+|hello+|hiya|yo+|namaste|namaskar|hola|greetings|sup|howdy|good\s*(morning|afternoon|evening|day)|what'?s\s*up)[\s!.,]*$/i;

const GRATITUDE =
  /^(thanks?|thank\s*(you|u)|thx|ty|cheers|appreciate\s*it|much\s*appreciated|got\s*it|nice|cool|awesome|great|perfect|ok(ay)?)[\s!.,]*$/i;

const CAPABILITY =
  /^(who\s*(are|r)\s*(you|u)|what\s*(are|r)\s*(you|u)|what\s*can\s*(you|u)\s*do|what\s*do\s*(you|u)\s*do|how\s*(do|does)\s*(this|it|you)\s*work|what\s*is\s*this|help)[\s?!.,]*$/i;

/**
 * Returns the small-talk intent of a message, or null when it isn't small talk
 * (in which case the caller proceeds to normal retrieval).
 */
export function detectConversationalIntent(text: string): ConversationalIntent | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (GREETING.test(trimmed)) return 'greeting';
  if (GRATITUDE.test(trimmed)) return 'gratitude';
  if (CAPABILITY.test(trimmed)) return 'capability';
  return null;
}
