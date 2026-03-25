import { fetchWithTimeout } from "../../lib/fetchWithTimeout";

export async function saveToNocoDB(data) {
  if (!process.env.NOCODB_URL || !process.env.NOCODB_TOKEN) {
    throw new Error("NocoDB configuration is missing");
  }

  const response = await fetchWithTimeout(
    process.env.NOCODB_URL,
    {
      method: "POST",
      headers: {
        "xc-token": process.env.NOCODB_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
    15000
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || `NocoDB API error: ${response.status}`);
  }

  return payload;
}

export async function insertNocoDB(data) {
  return saveToNocoDB(data);
}

export async function queryNocoDB(recordId) {
  if (!process.env.NOCODB_URL || !process.env.NOCODB_TOKEN) {
    throw new Error("NocoDB configuration is missing");
  }

  const response = await fetchWithTimeout(
    `${process.env.NOCODB_URL}/${recordId}`,
    {
      method: "GET",
      headers: {
        "xc-token": process.env.NOCODB_TOKEN,
      },
    },
    15000
  );

  if (!response.ok) {
    throw new Error(`NocoDB query failed: ${response.status}`);
  }

  return response.json();
}

export async function deleteFromNocoDB(recordId) {
  if (!process.env.NOCODB_URL || !process.env.NOCODB_TOKEN) {
    throw new Error("NocoDB configuration is missing");
  }

  const response = await fetchWithTimeout(
    `${process.env.NOCODB_URL}/${recordId}`,
    {
      method: "DELETE",
      headers: {
        "xc-token": process.env.NOCODB_TOKEN,
      },
    },
    15000
  );

  if (!response.ok) {
    throw new Error(`NocoDB delete failed: ${response.status}`);
  }

  return response.json();
}
