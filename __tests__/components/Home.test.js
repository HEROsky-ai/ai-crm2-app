import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Home from "@/pages/index";

jest.mock("next/link", () => {
  return function MockLink({ href, children }) {
    return <a href={href}>{children}</a>;
  };
});

describe("Home page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    localStorage.clear();
  });

  it("renders the main UI", () => {
    render(<Home />);

    expect(screen.getByText("聊天分析助手")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("請貼上聊天內容，或使用 Ctrl+V 貼上截圖...")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /開始深度分析/i })).toBeInTheDocument();
  });

  it("submits chat text to the analyze API", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        completeness: "完整",
        analysis: { personality: "熱情" },
      }),
    });

    render(<Home />);

    fireEvent.change(screen.getByPlaceholderText(/貼上聊天內容/i), {
      target: { value: "Hello World" },
    });
    fireEvent.click(screen.getByRole("button", { name: /開始深度分析/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/analyze",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            chat_text: "Hello World",
            images: [],
            contact_name: "",
          }),
        })
      );
    });
  });

  it("renders the analysis result", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        completeness: "完整",
        analysis: { personality: "熱情" },
      }),
    });

    render(<Home />);

    fireEvent.change(screen.getByPlaceholderText(/貼上聊天內容/i), {
      target: { value: "Hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: /開始深度分析/i }));

    await waitFor(() => {
      expect(screen.getByText(/分析結果/i)).toBeInTheDocument();
      expect(screen.getByText(/熱情/i)).toBeInTheDocument();
    });
  });

  it("shows API errors", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({
        error: "Gemini failed",
      }),
    });

    render(<Home />);

    fireEvent.change(screen.getByPlaceholderText(/貼上聊天內容/i), {
      target: { value: "Hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: /開始深度分析/i }));

    await waitFor(() => {
      expect(screen.getByText(/分析失敗/i)).toBeInTheDocument();
      expect(screen.getByText("Gemini failed")).toBeInTheDocument();
    });
  });
});
