export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query || {};

    if (!id) {
      return res.status(400).json({ error: "Missing record ID" });
    }

    const nocodbUrl = process.env.NOCODB_URL;
    const nocodbToken = process.env.NOCODB_TOKEN;

    if (!nocodbUrl || !nocodbToken) {
      return res.status(500).json({
        success: false,
        error: "NocoDB configuration missing",
      });
    }

    const url = `${nocodbUrl}/${id}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "xc-token": nocodbToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: "Record not found" });
      }
      throw new Error(`NocoDB API error: ${response.status}`);
    }

    const record = await response.json();

    return res.status(200).json(record);
  } catch (error) {
    console.error("Failed to fetch record:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch record",
    });
  }
}
