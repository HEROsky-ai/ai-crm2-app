jest.mock("@/services/storage/nocodb", () => ({
  saveToNocoDB: jest.fn(),
  queryNocoDB: jest.fn(),
}));

import { queryNocoDB, saveToNocoDB } from "@/services/storage/nocodb";
import { getResult, saveRecord, storeResult } from "@/services/storage";

describe("storage service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saveRecord forwards data to NocoDB", async () => {
    saveToNocoDB.mockResolvedValueOnce({ id: 1 });

    const result = await saveRecord({ foo: "bar" });

    expect(saveToNocoDB).toHaveBeenCalledWith({ foo: "bar" });
    expect(result).toEqual({ id: 1 });
  });

  it("storeResult normalizes the payload before saving", async () => {
    saveToNocoDB.mockResolvedValueOnce({ id: 2 });

    const result = await storeResult(
      { chat_text: "hello" },
      { analysis: "analysis-result", timestamp: "2024-01-01T00:00:00.000Z" }
    );

    expect(saveToNocoDB).toHaveBeenCalledWith({
      input: JSON.stringify({ chat_text: "hello" }),
      analysis: "analysis-result",
      timestamp: "2024-01-01T00:00:00.000Z",
    });
    expect(result).toEqual({ id: 2 });
  });

  it("wraps store errors", async () => {
    saveToNocoDB.mockRejectedValueOnce(new Error("network"));

    await expect(
      storeResult({}, { analysis: "x", timestamp: "2024-01-01T00:00:00.000Z" })
    ).rejects.toThrow("Failed to store result: network");
  });

  it("getResult forwards the record id", async () => {
    queryNocoDB.mockResolvedValueOnce({ id: 3 });

    const result = await getResult("3");

    expect(queryNocoDB).toHaveBeenCalledWith("3");
    expect(result).toEqual({ id: 3 });
  });

  it("wraps get errors", async () => {
    queryNocoDB.mockRejectedValueOnce(new Error("missing"));

    await expect(getResult("3")).rejects.toThrow("Failed to get result: missing");
  });
});
