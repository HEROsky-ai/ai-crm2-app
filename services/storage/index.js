import { queryNocoDB, saveToNocoDB } from "./nocodb";

export async function saveRecord(data) {
  return saveToNocoDB(data);
}

export async function storeResult(inputData, analysisResult) {
  try {
    const record = {
      input: JSON.stringify(inputData),
      analysis: analysisResult.analysis,
      timestamp: analysisResult.timestamp,
    };

    return await saveRecord(record);
  } catch (error) {
    throw new Error(`Failed to store result: ${error.message}`);
  }
}

export async function getResult(recordId) {
  try {
    return await queryNocoDB(recordId);
  } catch (error) {
    throw new Error(`Failed to get result: ${error.message}`);
  }
}

export { saveToNocoDB, queryNocoDB };
