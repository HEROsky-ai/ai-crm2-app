import { fetchWithTimeout } from "../../lib/fetchWithTimeout";

export async function analyzeWithOpenRouter(promptInput, modelOverride = "default") {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY environment variable");
    }

    if (!apiKey.startsWith("sk-or-v1-")) {
      throw new Error("Invalid OPENROUTER_API_KEY format");
    }

    let content;
    if (typeof promptInput === "object" && promptInput !== null && promptInput.text) {
      content = [
        {
          type: "text",
          text: promptInput.text,
        },
      ];

      if (Array.isArray(promptInput.images)) {
        promptInput.images.forEach((image) => {
          content.push({
            type: "image_url",
            image_url: {
              url: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`,
            },
          });
        });
      }
    } else {
      content = typeof promptInput === "string" ? promptInput : JSON.stringify(promptInput);
    }

    const baseModel = (modelOverride !== "default" ? modelOverride : process.env.OPENROUTER_MODEL) || "openai/gpt-4o-mini";
    const fallbackModels = [
      "anthropic/claude-3-haiku",
      "google/gemini-1.5-flash",
      "meta-llama/llama-3-8b-instruct"
    ].filter(m => m !== baseModel);
    
    const modelsToTry = [baseModel, ...fallbackModels];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`OpenRouter: 嘗試使用模型 ${model}...`);
        const res = await fetchWithTimeout(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:3000",
              "X-Title": process.env.OPENROUTER_TITLE || "Amway Chat CRM",
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: "user",
                  content,
                },
              ],
            }),
          },
          30000
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            `OpenRouter API error (${res.status}): ${data.error?.message || JSON.stringify(data)}`
          );
        }

        const aiContent = data.choices?.[0]?.message?.content;
        if (!aiContent) {
          throw new Error("OpenRouter did not return any text content");
        }

        // Return an object instead of a string to provide model context
        return {
          text: aiContent,
          modelUsed: data.model || model
        };

      } catch (err) {
        console.warn(`OpenRouter: 模型 ${model} 請求失敗: ${err.message}，準備嘗試下一個...`);
        lastError = err;
      }
    }

    // If all models fail
    console.error("OpenRouter request failed: All fallback models exhausted.", lastError);
    throw lastError || new Error("All fallback models failed");
  } catch (error) {
    throw error;
  }
}

export const callOpenRouter = analyzeWithOpenRouter;
