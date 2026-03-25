import { deleteFromNocoDB } from "@/services/storage/nocodb";

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    try {
      const { id } = req.query || {};
      if (!id) {
        return res.status(400).json({ success: false, error: "Missing record ID" });
      }

      await deleteFromNocoDB(id);
      return res.status(200).json({ success: true, message: "Record deleted" });
    } catch (deleteError) {
      console.error("Failed to delete record:", deleteError);
      return res.status(500).json({ success: false, error: deleteError.message });
    }
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { completeness } = req.query || {};
    const nocodbUrl = process.env.NOCODB_URL;
    const nocodbToken = process.env.NOCODB_TOKEN;

    if (!nocodbUrl || !nocodbToken) {
      return res.status(500).json({
        success: false,
        error: "NocoDB configuration missing",
        records: [],
      });
    }

    let url = `${nocodbUrl}?limit=1000&sort=-CreatedAt`;
    if (typeof completeness === "string" && completeness.trim()) {
      url = `${nocodbUrl}?where=(目前狀態,eq,${encodeURIComponent(
        completeness.trim()
      )})&limit=1000&sort=-CreatedAt`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "xc-token": nocodbToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`NocoDB API error: ${response.status}`);
    }

    const data = await response.json();
    const records = (data.list || []).map(row => {
      let analysisJson = {};
      try {
        analysisJson = row.分析報告 ? JSON.parse(row.分析報告) : {};
      } catch (e) {
        analysisJson = { raw: row.分析報告 };
      }
      return {
        id: row.Id,
        contact_name: row.姓名 || row.contact_name || "",
        chat_text: row.互動描述 || "",
        completeness: row.目前狀態 || "待確認",
        analysis: analysisJson,
        created_at: row.建立時間 || row.CreatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      records,
      total: records.length,
    });
  } catch (error) {
    console.error("Failed to fetch records:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch records",
      records: [],
    });
  }
}
