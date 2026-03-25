export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
    const diagnostics = {
      timestamp: new Date().toISOString(),
      aiProvider: provider,
      services: {
        gemini: {
          configured: Boolean(process.env.GEMINI_API_KEY),
          model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
        },
        groq: {
          configured: Boolean(process.env.GROQ_API_KEY),
        },
        openrouter: {
          configured: Boolean(process.env.OPENROUTER_API_KEY),
        },
        nocodb: {
          configured: Boolean(process.env.NOCODB_URL && process.env.NOCODB_TOKEN),
          hasUrl: Boolean(process.env.NOCODB_URL),
          hasToken: Boolean(process.env.NOCODB_TOKEN),
        },
      },
    };

    const recommendations = [];

    if (provider === "gemini" && !diagnostics.services.gemini.configured) {
      recommendations.push("Missing GEMINI_API_KEY in .env.local");
    }

    if (provider === "groq" && !diagnostics.services.groq.configured) {
      recommendations.push("Missing GROQ_API_KEY in .env.local");
    }

    if (provider === "openrouter" && !diagnostics.services.openrouter.configured) {
      recommendations.push("Missing OPENROUTER_API_KEY in .env.local");
    }

    if (!diagnostics.services.nocodb.configured) {
      recommendations.push("Missing NocoDB configuration in .env.local");
    }

    return res.status(200).json({
      success: true,
      diagnostics,
      recommendations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
