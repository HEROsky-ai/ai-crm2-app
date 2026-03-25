export const NOCODB_URL = process.env.NOCODB_URL || "";
export const NOCODB_TOKEN = process.env.NOCODB_TOKEN || "";
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const AI_PROVIDER = process.env.AI_PROVIDER || "gemini";
export const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "nocodb";

export function validateConfig() {
  const missing = [];

  if (!NOCODB_URL) {
    missing.push("NOCODB_URL");
  }

  if (!NOCODB_TOKEN) {
    missing.push("NOCODB_TOKEN");
  }

  if (AI_PROVIDER === "gemini" && !GEMINI_API_KEY) {
    missing.push("GEMINI_API_KEY");
  }

  if (AI_PROVIDER === "openrouter" && !OPENROUTER_API_KEY) {
    missing.push("OPENROUTER_API_KEY");
  }

  if (AI_PROVIDER === "groq" && !GROQ_API_KEY) {
    missing.push("GROQ_API_KEY");
  }

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`);
  }

  return missing.length === 0;
}
