jest.mock("@/services/ai/openrouter", () => ({
  analyzeWithOpenRouter: jest.fn(),
}));

jest.mock("@/services/ai/groq", () => ({
  analyzeWithGroq: jest.fn(),
}));

jest.mock("@/services/ai/gemini", () => ({
  analyzeWithGemini: jest.fn(),
}));

jest.mock("@/services/prompt", () => ({
  buildPrompt: jest.fn(),
}));

import { analyzeWithGemini } from "@/services/ai/gemini";
import { analyzeWithGroq } from "@/services/ai/groq";
import { buildPrompt } from "@/services/prompt";
import { analyzeWithAI, runAI } from "@/services/ai";

describe("AI service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AI_PROVIDER = "gemini";
  });

  describe("runAI", () => {
    it("uses Gemini by default", async () => {
      analyzeWithGemini.mockResolvedValueOnce("gemini-result");

      const result = await runAI("test-prompt");

      expect(result).toBe("gemini-result");
      expect(analyzeWithGemini).toHaveBeenCalledWith("test-prompt");
    });

    it("supports Groq when configured", async () => {
      process.env.AI_PROVIDER = "groq";
      analyzeWithGroq.mockResolvedValueOnce("groq-result");

      const result = await runAI("test-prompt");

      expect(result).toBe("groq-result");
      expect(analyzeWithGroq).toHaveBeenCalledWith("test-prompt");
    });

    it("throws for an unsupported provider", async () => {
      process.env.AI_PROVIDER = "invalid";

      await expect(runAI("test-prompt")).rejects.toThrow(
        "Unsupported AI provider: invalid"
      );
    });
  });

  describe("analyzeWithAI", () => {
    it("builds the prompt from chat text and images", async () => {
      buildPrompt.mockReturnValueOnce("built-prompt");
      analyzeWithGemini.mockResolvedValueOnce("analysis-text");

      const result = await analyzeWithAI({
        chat_text: "hello",
        images: ["img-1"],
      });

      expect(buildPrompt).toHaveBeenCalledWith("hello", ["img-1"]);
      expect(result).toEqual(
        expect.objectContaining({
          analysis: "analysis-text",
          timestamp: expect.any(String),
        })
      );
    });

    it("uses a custom prompt when provided", async () => {
      analyzeWithGemini.mockResolvedValueOnce("analysis-text");

      await analyzeWithAI({ chat_text: "hello" }, "custom-prompt");

      expect(buildPrompt).not.toHaveBeenCalled();
      expect(analyzeWithGemini).toHaveBeenCalledWith("custom-prompt");
    });

    it("wraps downstream failures", async () => {
      buildPrompt.mockReturnValueOnce("built-prompt");
      analyzeWithGemini.mockRejectedValueOnce(new Error("Gemini unavailable"));

      await expect(analyzeWithAI({ chat_text: "hello" })).rejects.toThrow(
        "AI analysis failed: Gemini unavailable"
      );
    });
  });
});
