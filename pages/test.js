import { useState } from "react";

export default function TestAPI() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_text: "這是一段測試聊天內容，想確認 Gemini 分析 API 是否正常運作。",
          images: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `API error (${response.status})`);
      } else {
        setResult(data);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui" }}>
      <h1>API 測試頁</h1>

      <div style={{ marginBottom: "30px" }}>
        <button
          type="button"
          onClick={testAPI}
          disabled={loading}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            backgroundColor: loading ? "#ccc" : "#4a90e2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "測試中..." : "執行 API 測試"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fff1f0",
            border: "1px solid #ffccc7",
            color: "#cf1322",
            padding: "15px",
            borderRadius: "4px",
            marginBottom: "20px",
            whiteSpace: "pre-wrap",
          }}
        >
          <strong>錯誤</strong>
          <br />
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            color: "#274e0f",
            padding: "15px",
            borderRadius: "4px",
          }}
        >
          <strong>成功</strong>
          <br />
          <br />
          <strong>完整度：</strong> {result.completeness}
          <pre
            style={{
              background: "white",
              padding: "10px",
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "400px",
              fontSize: "12px",
            }}
          >
            {JSON.stringify(result.analysis, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
