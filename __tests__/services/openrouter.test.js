import { analyzeWithOpenRouter } from "@/services/ai/openrouter";

describe("OpenRouter service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key";
    global.fetch = jest.fn();
  });

  it("calls the OpenRouter API", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '{"ok":true}',
            },
          },
        ],
      }),
    });

    const result = await analyzeWithOpenRouter("prompt");

    expect(result).toEqual({ text: '{"ok":true}', modelUsed: 'openai/gpt-4o-mini' });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-or-v1-test-key",
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("rejects invalid API keys", async () => {
    process.env.OPENROUTER_API_KEY = "invalid";

    await expect(analyzeWithOpenRouter("prompt")).rejects.toThrow(
      "Invalid OPENROUTER_API_KEY format"
    );
  });

  it("surfaces API errors", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({
        error: { message: "unauthorized" },
      }),
    });

    await expect(analyzeWithOpenRouter("prompt")).rejects.toThrow("unauthorized");
  });
});
