import { render, screen, waitFor } from "@testing-library/react";
import History from "@/pages/history";

jest.mock("next/link", () => {
  return function MockLink({ href, children }) {
    return <a href={href}>{children}</a>;
  };
});

describe("History page", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.clear();
  });

  it("renders the page title", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ records: [] }),
    });

    render(<History />);

    await waitFor(() => {
      expect(screen.getByText(/歷史分析紀錄/i)).toBeInTheDocument();
    });
  });

  it("shows filter buttons", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ records: [] }),
    });

    render(<History />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /全部/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^完整/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^不完整/i })).toBeInTheDocument();
    });
  });

  it("renders records returned by the API", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        records: [
          {
            chat_text: "今天先聊到這裡",
            completeness: "完整",
            created_at: "2024-01-01T10:00:00Z",
            analysis: { category: "follow-up" },
          },
        ],
      }),
    });

    render(<History />);

    await waitFor(() => {
      expect(screen.getByText("今天先聊到這裡")).toBeInTheDocument();
    });
  });

  it("uses localStorage fallback when the API fails", async () => {
    localStorage.setItem(
      "analysis_records",
      JSON.stringify([
        {
          chat_text: "快取資料",
          completeness: "完整",
          created_at: "2024-01-01T10:00:00Z",
        },
      ])
    );

    global.fetch.mockRejectedValueOnce(new Error("API failed"));

    render(<History />);

    await waitFor(() => {
      expect(screen.getByText("快取資料")).toBeInTheDocument();
    });
  });
});
