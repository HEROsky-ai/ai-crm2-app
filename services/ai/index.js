import { analyzeWithOpenRouter } from "./openrouter";
import { analyzeWithGroq } from "./groq";
import { analyzeWithGemini } from "./gemini";
import { buildPrompt } from "../prompt";

export async function runAI(prompt, modelOverride = "default") {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  if (provider === "openrouter") {
    return analyzeWithOpenRouter(prompt, modelOverride);
  }

  if (provider === "groq") {
    return analyzeWithGroq(prompt);
  }

  if (provider === "gemini") {
    return analyzeWithGemini(prompt);
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

export async function analyzeWithAI(data, promptTemplate = null) {
  try {
    const chatText =
      typeof data === "string" ? data : data?.chat_text ?? data?.chat ?? "";
    const images = Array.isArray(data?.images) ? data.images : [];
    const prompt = promptTemplate || buildPrompt(chatText, images);
    const response = await runAI(prompt);

    return {
      analysis: response,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

export { analyzeWithOpenRouter, analyzeWithGroq, analyzeWithGemini, buildPrompt };
