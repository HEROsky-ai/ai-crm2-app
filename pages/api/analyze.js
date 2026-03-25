import { runAI } from "@/services/ai";
import { buildPrompt } from "@/services/prompt";
import { saveRecord } from "@/services/storage";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { chat_text = "", images = [], contact_name = "" } = req.body || {};

    if (!chat_text.trim() && (!Array.isArray(images) || images.length === 0)) {
      return res.status(400).json({ error: "Please provide chat text or images" });
    }

    const prompt = buildPrompt(chat_text, images, contact_name);

    let aiText;
    let aiModelUsed = "unknown";
    try {
      const rawResult = await runAI(prompt);
      if (typeof rawResult === "object" && rawResult !== null && rawResult.text) {
        aiText = rawResult.text;
        aiModelUsed = rawResult.modelUsed || "openrouter/fallback";
      } else {
        aiText = rawResult;
        aiModelUsed = process.env.AI_PROVIDER || "gemini";
      }
    } catch (aiError) {
      console.error("AI request failed:", aiError);
      let statusCode = 500;

      if (aiError.message?.includes("rate limit")) {
        statusCode = 429;
      } else if (aiError.message?.includes("timed out")) {
        statusCode = 504;
      }

      return res.status(statusCode).json({
        error: `AI request failed: ${aiError.message || "Unknown error"}`,
      });
    }

    if (!aiText || aiText.trim() === "") {
      return res.status(500).json({ error: "AI returned empty content" });
    }

    let parsed;
    try {
      // Sometimes models wrap json in markdown
      const cleanJson = aiText.replace(/```[a-z]*\n?/ig, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = { raw: aiText };
    }
    
    parsed.ai_model_used = aiModelUsed;

    const completeness = parsed.completeness || "pending";
    // AI may have inferred the contact name from chat; user-provided name takes priority
    const resolvedName = contact_name || parsed.contact_name || "";
    const imageDesc = Array.isArray(images) && images.length > 0 ? `\n(附帶 ${images.length} 張圖片)` : '';
    const recordData = {
      姓名: resolvedName,
      互動描述: (chat_text || "") + imageDesc,
      分析報告: JSON.stringify(parsed),
      目前狀態: completeness,
      建立時間: new Date().toISOString(),
    };

    try {
      await saveRecord(recordData);
    } catch (saveError) {
      console.error("Failed to save record:", saveError);
    }

    return res.status(200).json({
      completeness,
      analysis: parsed,
    });
  } catch (error) {
    console.error("Analyze API failed:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
