export function buildPrompt(data) {
  let prompt = "Please analyze the following customer data:\n\n";

  if (typeof data === "object" && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      prompt += `${key}: ${value}\n`;
    });
  } else {
    prompt += data || "";
  }

  prompt += "\nReturn a concise structured analysis.";
  return prompt;
}
