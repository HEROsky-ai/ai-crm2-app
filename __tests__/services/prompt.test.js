import { buildPrompt } from "@/services/prompt";

describe("prompt service", () => {
  it("includes chat text and image count", () => {
    const prompt = buildPrompt("你好", ["img-1", "img-2"]);

    expect(prompt.text).toContain("你好");
    expect(prompt.text).toContain("2");
  });

  it("requires a JSON response shape", () => {
    const prompt = buildPrompt("hello");

    expect(prompt.text).toContain("completeness");
    expect(prompt.text).toContain("report_content");
    expect(prompt.text).toContain("FormDH AI");
  });

  it("falls back when chat text is empty", () => {
    const prompt = buildPrompt("", []);

    expect(prompt.text).toContain("(無文字內容)");
  });
});
