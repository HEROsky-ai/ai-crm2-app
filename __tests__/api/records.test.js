import handler from "@/pages/api/records";

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("/api/records", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NOCODB_URL = "https://app.nocodb.com/api/v2/tables/test/records";
    process.env.NOCODB_TOKEN = "test-token";
    global.fetch = jest.fn();
  });

  it("returns 405 for non-GET requests", async () => {
    const req = { method: "POST" };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("returns config errors", async () => {
    delete process.env.NOCODB_URL;
    const req = { method: "GET", query: {} };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "NocoDB configuration missing",
      records: [],
    });
  });

  it("returns records successfully", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        list: [
          {
            Id: 1,
            互動描述: "Test message",
            目前狀態: "完整",
            建立時間: "2026-03-24T00:00:00Z"
          },
        ],
      }),
    });

    const req = { method: "GET", query: {} };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      records: [
        {
          id: 1,
          contact_name: "",
          chat_text: "Test message",
          completeness: "完整",
          analysis: {},
          created_at: "2026-03-24T00:00:00Z",
        },
      ],
      total: 1,
    });
  });

  it("adds completeness filtering when requested", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ list: [] }),
    });

    const req = { method: "GET", query: { completeness: "完整" } };
    const res = createRes();

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("where="),
      expect.any(Object)
    );
  });

  it("returns failures from NocoDB", async () => {
    global.fetch.mockRejectedValueOnce(new Error("API error"));

    const req = { method: "GET", query: {} };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        records: [],
      })
    );
  });
});
