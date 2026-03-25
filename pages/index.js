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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.4rem', 
              color: '#1e293b', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              🎯 深度洞察報告
            </h2>
            <div className={`${styles.completenessBadge} ${styles['completeness' + result.completeness]}`} style={{ margin: 0 }}>
              {result.completeness || "已完成"}
            </div>
          </div>

          <div className={styles.analysisContent} style={{ position: 'relative' }}>
            {typeof result.analysis === "object" && (result.analysis.report_content || result.analysis.report) ? (
              <div className={styles.markdownWrapper}>
                <MarkdownRenderer content={result.analysis.report_content || result.analysis.report} />
              </div>
            ) : typeof result.analysis === "object" ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                {Object.entries(result.analysis)
                  .filter(([key]) => !['ai_model_used', 'completeness', 'contact_name', 'raw'].includes(key))
                  .map(([key, value]) => (
                  <div key={key} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <strong style={{ color: '#64748b', display: 'block', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {key}
                    </strong>
                    <div style={{ paddingLeft: '4px', color: '#334155' }}>
                      {typeof value === 'object' ? (
                        <pre style={{ margin: 0, fontSize: '13px', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        String(value)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.markdownWrapper}>
                <MarkdownRenderer content={String(result.analysis)} />
              </div>
            )}
            
            <div style={{ 
              marginTop: '24px', 
              paddingTop: '16px', 
              borderTop: '1px dashed #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                🤖 使用模型：<span style={{ color: '#4facfe', fontWeight: '600' }}>{result.analysis?.ai_model_used || "未知"}</span>
              </span>
              <button 
                onClick={copyToClipboard}
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  color: '#64748b', 
                  cursor: 'pointer',
                  fontWeight: '600',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.background = '#e2e8f0'; e.target.style.color = '#1e293b'; }}
                onMouseLeave={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#64748b'; }}
              >
                📋 複製報告內容
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
