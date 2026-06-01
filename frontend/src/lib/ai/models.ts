/**
 * AI model configuration used by the frontend chatbot and tool agent.
 *
 * TIER 1 (primary): Google Gemini 3.1 Flash-Lite (via GOOGLE_API_KEY, free)
 * TIER 2 (fallback): OpenRouter free models (via OPENROUTER_API_KEY)
 */
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

const googleApiKey = process.env.GOOGLE_API_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

/**
 * Returns the best available model:
 *   Tier 1: Google Gemini 3.1 Flash-Lite (GOOGLE_API_KEY)
 *   Tier 2: OpenRouter free models (OPENROUTER_API_KEY)
 * Throws only if neither key is configured.
 */
export function getPrimaryModel() {
  // Tier 1: Google Gemini 3.1 Flash-Lite
  if (googleApiKey) {
    console.log("[AI Model] Using Google Gemini 3.1 Flash-Lite (primary)");
    return new ChatGoogleGenerativeAI({
      model: "gemini-3.1-flash-lite",
      apiKey: googleApiKey,
    });
  }

  // Tier 2: OpenRouter fallback (first model in the chain)
  if (openRouterKey) {
    console.warn("[AI Model] GOOGLE_API_KEY not set — falling back to OpenRouter (owl-alpha)");
    return new ChatOpenAI({
      modelName: "openrouter/owl-alpha",
      apiKey: openRouterKey,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
      temperature: 0.2,
    });
  }

  throw new Error(
    "No AI model API key configured. Set GOOGLE_API_KEY (primary) or OPENROUTER_API_KEY (fallback) in environment variables."
  );
}
