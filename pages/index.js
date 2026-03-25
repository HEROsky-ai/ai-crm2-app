import { useRef, useState } from "react";
import Link from "next/link";
import MarkdownRenderer from "../components/MarkdownRenderer";
import styles from "../styles/index.module.css";

export default function Home() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [contactName, setContactName] = useState("");
  const [selectedModel, setSelectedModel] = useState("default");
  const fileInputRef = useRef(null);
  const MAX_IMAGES = 15;

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const remainingSlots = MAX_IMAGES - images.length;
    const filesToAdd = files.slice(0, remainingSlots);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    if (files.length > remainingSlots) {
      window.alert(`最多只能上傳 ${MAX_IMAGES} 張圖片`);
    }
  };

  const handlePaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) {
      return;
    }

    for (const item of items) {
      if (!item.type.startsWith("image/")) {
        continue;
      }

      event.preventDefault();

      if (images.length >= MAX_IMAGES) {
        window.alert(`最多只能上傳 ${MAX_IMAGES} 張圖片`);
        return;
      }

      const file = item.getAsFile();
      if (!file) {
        continue;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const saveToLocalStorage = (record) => {
    try {
      const existing = JSON.parse(localStorage.getItem("analysis_records") || "[]");
      const updated = [record, ...existing].slice(0, 100);
      localStorage.setItem("analysis_records", JSON.stringify(updated));
    } catch (storageError) {
      console.error("Failed to save to localStorage:", storageError);
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();

    if (!chatText.trim() && images.length === 0) {
      setError("請輸入聊天內容或上傳圖片");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_text: chatText,
          images,
          contact_name: contactName,
          ai_model_id: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API error (${response.status})`);
      }

      setResult(data);

      saveToLocalStorage({
        chat_text: chatText,
        images_count: images.length,
        completeness: data.completeness,
        analysis: data.analysis,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    } catch (requestError) {
      console.error("Analyze request failed:", requestError);
      setError(requestError.message || "分析失敗");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = () => {
    if (!result?.analysis) return;
    const text = typeof result.analysis === 'string' 
      ? result.analysis 
      : JSON.stringify(result.analysis, null, 2);
    navigator.clipboard.writeText(text);
    alert("已複製到剪貼簿");
  };

  return (
    <div className={styles.container}>
      <header className={styles.headerContainer}>
        <h1 className={styles.title}>聊天分析助手</h1>
        <Link href="/history" className={styles.historyLink}>查看歷史紀錄</Link>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="👤 輸入聯絡人名稱（可不填，AI 將自動辨識）"
          style={{
            width: '100%',
            padding: '10px 14px',
            marginBottom: '10px',
            borderRadius: '8px',
            border: '1px solid #d0d7de',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            marginBottom: '10px',
            borderRadius: '8px',
            border: '1px solid #d0d7de',
            fontSize: '14px',
            boxSizing: 'border-box',
            backgroundColor: '#fff',
            cursor: 'pointer'
          }}
        >
          <option value="default">✨ 預設模型 (openai/gpt-4o-mini)</option>
          
          <optgroup label="💎 付費高級模型 (最聰明)">
            <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (最強社交分析)</option>
            <option value="google/gemini-2.0-flash">Gemini 2.0 Flash (極速穩定版)</option>
            <option value="google/gemini-1.5-pro">Gemini 1.5 Pro (Google最強大腦)</option>
            <option value="openai/gpt-4o">GPT-4o (全能綜合實力)</option>
            <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B (強大且快速)</option>
          </optgroup>

          <optgroup label="🆓 免費暢玩模型 (:free)">
            <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (免費王者・最推)</option>
            <option value="deepseek/deepseek-chat:free">DeepSeek Chat (中文理解優異)</option>
            <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B (穩定免費版)</option>
            <option value="mistralai/mistral-7b-instruct:free">Mistral 7B (快速精簡版)</option>
            <option value="openrouter/auto">Auto (自動挑選免費模型)</option>
          </optgroup>
        </select>
        <textarea
          value={chatText}
          onChange={(event) => setChatText(event.target.value)}
          onPaste={handlePaste}
          placeholder="請貼上聊天內容，或使用 Ctrl+V 貼上截圖..."
          className={styles.textarea}
        />

        {images.length > 0 && (
          <div className={styles.imageGrid}>
            {images.map((image, index) => (
              <div key={`${index}-${image.slice(0, 20)}`} className={styles.imagePreview}>
                <img src={image} alt={`preview-${index}`} />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className={styles.removeImage}
                  aria-label={`remove-image-${index}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES || loading}
            className={styles.uploadButton}
          >
            📷 上傳圖片 ({images.length}/{MAX_IMAGES})
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />

          <button
            type="submit"
            disabled={loading || (!chatText.trim() && images.length === 0)}
            className={styles.submitButton}
            style={{ flex: 1 }}
          >
            {loading ? "✨ 正在啟動 AI 分析中..." : "🚀 開始深度分析"}
          </button>
        </div>
      </form>

      {error && (
        <div className={styles.errorBox}>
          <strong>🚨 分析失敗</strong>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className={styles.resultBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0 }}>🎯 分析結果</h2>
            <button 
              onClick={copyToClipboard}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#4facfe', 
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📋 複製內容
            </button>
          </div>
          
          <div className={`${styles.completenessBadge} ${styles['completeness' + result.completeness]}`}>
            狀態：{result.completeness}
          </div>

          <div className={styles.analysisContent}>
            {typeof result.analysis === "object" && result.analysis.report_content ? (
              <div className={styles.markdownWrapper}>
                <MarkdownRenderer content={result.analysis.report_content} />
              </div>
            ) : typeof result.analysis === "object" ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {Object.entries(result.analysis).map(([key, value]) => (
                  <div key={key} style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
                    <strong style={{ color: '#4facfe', display: 'block', marginBottom: '4px' }}>{key}</strong>
                    <div style={{ paddingLeft: '10px' }}>
                      {typeof value === 'object' ? (
                        <pre style={{ margin: 0, fontSize: '13px' }}>{JSON.stringify(value, null, 2)}</pre>
                      ) : (
                        String(value)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              result.analysis
            )}
          </div>
        </div>
      )}
    </div>
  );
}
