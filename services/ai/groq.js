export async function analyzeWithGroq(prompt) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('缺少 GROQ_API_KEY 環境變數');
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await res.json();

    // 檢查 API 錯誤響應
    if (!res.ok) {
      console.error('Groq API 錯誤:', data);
      throw new Error(`Groq API 錯誤 (${res.status}): ${data.error?.message || JSON.stringify(data)}`);
    }

    // 檢查是否有有效的內容
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('Groq 無效回應:', data);
      throw new Error('Groq 未返回有效內容');
    }

    return content;
  } catch (error) {
    console.error('Groq 函數錯誤:', error);
    throw error;
  }
}

// 向後兼容
export const callGroq = analyzeWithGroq;
