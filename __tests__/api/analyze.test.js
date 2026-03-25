jest.mock("@/services/ai", () => ({
  runAI: jest.fn(),
}));

jest.mock("@/services/prompt", () => ({
  buildPrompt: jest.fn(),
}));

jest.mock("@/services/storage", () => ({
  saveRecord: jest.fn(),
}));

import handler from "@/pages/api/analyze";
import { buildPrompt } from "@/services/prompt";
import { runAI } from "@/services/ai";
import { saveRecord } from "@/services/storage";

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("/api/analyze", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 405 for non-POST requests", async () => {
    const req = { method: "GET" };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("returns 400 when input is empty", async () => {
    const req = { method: "POST", body: { chat_text: "", images: [] } };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Please provide chat text or images",
    });
  });

  it("returns parsed JSON analysis", async () => {
    const req = {
      method: "POST",
      body: { chat_text: "Hello", images: [] },
    };
    const res = createRes();

    buildPrompt.mockReturnValueOnce("built-prompt");
    runAI.mockResolvedValueOnce('{"completeness":"complete","personality":"warm"}');
    saveRecord.mockResolvedValueOnce({ id: 1 });

    await handler(req, res);

    expect(buildPrompt).toHaveBeenCalledWith("Hello", [], "");
    expect(runAI).toHaveBeenCalledWith("built-prompt", "default");
    expect(saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        姓名: "",
        互動描述: "Hello",
        目前狀態: "complete",
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      completeness: "complete",
      analysis: {
        completeness: "complete",
        personality: "warm",
        ai_model_used: "gemini",
      },
    });
  });

  it("returns raw analysis when AI output is not JSON", async () => {
    const req = {
      method: "POST",
      body: { chat_text: "Hello", images: ["img"] },
    };
    const res = createRes();

    buildPrompt.mockReturnValueOnce("built-prompt");
    runAI.mockResolvedValueOnce("plain text response");
    saveRecord.mockResolvedValueOnce({ id: 1 });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      completeness: "待確認",
      analysis: {
        report_content: "plain text response",
        completeness: "待確認",
        ai_model_used: "gemini",
      },
    });
  });

  it("returns 429 when the AI provider is rate limited", async () => {
    const req = {
      method: "POST",
      body: { chat_text: "Hello", images: [] },
    };
    const res = createRes();

    buildPrompt.mockReturnValueOnce("built-prompt");
    runAI.mockRejectedValueOnce(new Error("Gemini API rate limit exceeded. Please retry later."));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: "AI request failed: Gemini API rate limit exceeded. Please retry later.",
    });
  });

  it("returns 504 when the AI provider times out", async () => {
    const req = {
      method: "POST",
      body: { chat_text: "Hello", images: [] },
    };
    const res = createRes();

    buildPrompt.mockReturnValueOnce("built-prompt");
    runAI.mockRejectedValueOnce(new Error("Request timed out after 30000ms"));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(504);
  });

  it("still succeeds when record saving fails", async () => {
    const req = {
      method: "POST",
      body: { chat_text: "Hello", images: [] },
    };
    const res = createRes();

    buildPrompt.mockReturnValueOnce("built-prompt");
    runAI.mockResolvedValueOnce('{"completeness":"complete"}');
    saveRecord.mockRejectedValueOnce(new Error("save failed"));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      completeness: "complete",
      analysis: {
        completeness: "complete",
        ai_model_used: "gemini",
      },
    });
  });
});
