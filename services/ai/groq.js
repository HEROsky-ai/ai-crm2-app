import { fetchWithTimeout } from "../../lib/fetchWithTimeout";

export async function analyzeWithGroq(promptInput) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("Missing GROQ_API_KEY environment variable");
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

    const res = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.2-11b-vision-preview",
          messages: [
            {
              role: "user",
              content,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      },
      30000
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Groq API error:", data);
      throw new Error(
        `Groq API error (${res.status}): ${data.error?.message || JSON.stringify(data)}`
      );
    }

    const aiContent = data.choices?.[0]?.message?.content;
    if (!aiContent) {
      console.error("Groq returned an unexpected payload:", data);
      throw new Error("Groq did not return any text content");
    }

    return aiContent;
  } catch (error) {
    console.error("Groq request failed:", error);
    throw error;
  }
}

export const callGroq = analyzeWithGroq;
