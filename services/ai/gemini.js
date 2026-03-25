import { fetchWithTimeout } from "../../lib/fetchWithTimeout";

export async function analyzeWithGemini(promptInput) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    let parts = [];
    if (typeof promptInput === "object" && promptInput !== null && promptInput.text) {
      parts.push({ text: promptInput.text });
      if (Array.isArray(promptInput.images)) {
        promptInput.images.forEach((image) => {
          const mimeType = image.split(";")[0]?.split(":")[1] || "image/jpeg";
          const data = image.split(",")[1] || image;
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: data,
            },
          });
        });
      }
    } else {
      parts.push({
        text: typeof promptInput === "string" ? promptInput : JSON.stringify(promptInput),
      });
    }

    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts,
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      },
      30000
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Gemini API error:", data);
      if (res.status === 429) {
        throw new Error("Gemini API rate limit exceeded. Please retry later.");
      }

      throw new Error(
        `Gemini API error (${res.status}): ${data.error?.message || JSON.stringify(data)}`
      );
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      console.error("Gemini returned an unexpected payload:", data);
      throw new Error("Gemini did not return any text content");
    }

    return content;
  } catch (error) {
    console.error("Gemini request failed:", error);
    throw error;
  }
}

export const callGemini = analyzeWithGemini;
