import { useEffect, useState } from "react";
import Link from "next/link";
import MarkdownRenderer from "../components/MarkdownRenderer";
import styles from "../styles/index.module.css";

function getInitials(name) {
  if (!name || name === "未知聯絡人") return "?";
  return name.trim().charAt(0).toUpperCase();
}

function avatarColor(name) {
  const colors = ["#4facfe", "#43e97b", "#f857a6", "#fa8231", "#a55eea", "#00d2d3"];
  if (!name) return colors[0];
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[code % colors.length];
}

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/records");
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error("Failed to fetch records:", error);
      const cached = localStorage.getItem("analysis_records");
      if (cached) {
        setRecords(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent toggling the card
    if (!window.confirm("確定要刪除這筆紀錄嗎？此動作不可復原。")) {
      return;
    }

    try {
      const response = await fetch(`/api/records?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert("刪除失敗: " + (data.error || "未知錯誤"));
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("刪除時發生錯誤");
    }
  };

  useEffect(() => {
    fetchRecords();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRecords, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredRecords = records.filter((record) => {
    if (filter === "all") return true;
    if (filter === "complete") return record.completeness === "完整";
    if (filter === "incomplete") return record.completeness === "不完整";
    return true;
  });

  // Group by contact_name
  const grouped = filteredRecords.reduce((acc, record) => {
    const name = record.contact_name || "未知聯絡人";
    if (!acc[name]) acc[name] = [];
    acc[name].push(record);
    return acc;
  }, {});

  // Compute Model Usage Stats
  const modelStats = filteredRecords.reduce((acc, record) => {
    const model = record.analysis?.ai_model_used || "未知 (早期紀錄)";
    acc[model] = (acc[model] || 0) + 1;
    return acc;
  }, {});

  const formatDate = (dateString) => {
    if (!dateString) return "未知時間";
    return new Date(dateString).toLocaleString("zh-TW");
  };

  return (
    <div className={styles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>📋 歷史分析紀錄</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={fetchRecords}
            style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid #4facfe", color: "#4facfe", background: "transparent", cursor: "pointer", fontSize: "13px" }}
          >
            🔄 重新整理
          </button>
          <Link href="/">返回分析頁</Link>
        </div>
      </div>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button type="button" onClick={() => setFilter("all")}
          style={{ padding: "6px 14px", borderRadius: "20px", border: "none", background: filter === "all" ? "#4facfe" : "#eee", color: filter === "all" ? "#fff" : "#333", cursor: "pointer" }}>
          全部 ({records.length})
        </button>
        <button type="button" onClick={() => setFilter("complete")}
          style={{ padding: "6px 14px", borderRadius: "20px", border: "none", background: filter === "complete" ? "#52c41a" : "#eee", color: filter === "complete" ? "#fff" : "#333", cursor: "pointer" }}>
          完整 ({records.filter((r) => r.completeness === "完整").length})
        </button>
        <button type="button" onClick={() => setFilter("incomplete")}
          style={{ padding: "6px 14px", borderRadius: "20px", border: "none", background: filter === "incomplete" ? "#faad14" : "#eee", color: filter === "incomplete" ? "#fff" : "#333", cursor: "pointer" }}>
          不完整 ({records.filter((r) => r.completeness === "不完整").length})
        </button>
      </div>

      <div style={{ marginBottom: "20px", padding: "12px", background: "#f0f2f5", borderRadius: "8px" }}>
        <strong style={{ fontSize: "14px", color: "#333" }}>🤖 AI 模型使用統計：</strong>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
          {Object.entries(modelStats).map(([model, count]) => (
            <span key={model} style={{ background: "#fff", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", border: "1px solid #d9d9d9", color: "#555" }}>
              {model}: <strong style={{ color: "#1890ff" }}>{count}</strong> 次
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <p>載入中...</p>
      ) : filteredRecords.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999" }}>
          {filter === "all" ? "目前沒有分析紀錄" : "這個篩選條件沒有資料"}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {Object.entries(grouped).map(([contactName, contactRecords]) => (
            <div key={contactName}>
              {/* Contact Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{
                  width: "44px", height: "44px",
                  borderRadius: "50%",
                  background: avatarColor(contactName),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: "700", fontSize: "18px",
                  flexShrink: 0,
                }}>
                  {getInitials(contactName)}
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#222" }}>{contactName}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{contactRecords.length} 筆分析紀錄</div>
                </div>
              </div>

              {/* Records */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
                {contactRecords.map((record, index) => (
                  <div
                    key={`${record.created_at || record.id || index}`}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "10px",
                      padding: "14px",
                      backgroundColor: record.completeness === "完整" ? "#f6ffed" : "#fffbe6",
                      borderLeft: `4px solid ${record.completeness === "完整" ? "#52c41a" : "#faad14"}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                      <span style={{
                        display: "inline-block", padding: "3px 10px",
                        borderRadius: "4px",
                        backgroundColor: record.completeness === "完整" ? "#52c41a" : "#faad14",
                        color: "white", fontSize: "11px", fontWeight: "bold",
                      }}>
                        {record.completeness || "待確認"}
                      </span>
                      <span style={{ fontSize: "11px", color: "#999" }}>
                        {formatDate(record.created_at)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, record.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ff4d4f",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "4px",
                          marginLeft: "8px",
                          display: "flex",
                          alignItems: "center",
                          opacity: 0.7
                        }}
                        title="刪除紀錄"
                        onMouseEnter={(e) => e.target.style.opacity = 1}
                        onMouseLeave={(e) => e.target.style.opacity = 0.7}
                      >
                        🗑️
                      </button>
                    </div>

                    <p style={{ margin: "8px 0", fontWeight: "bold", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {record.chat_text || "無文字內容"}
                    </p>

                    {record.analysis?.report_content && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === `${record.id}-${index}` ? null : `${record.id}-${index}`)}
                          style={{ background: "none", border: "none", color: "#4a90e2", fontSize: "12px", cursor: "pointer", fontWeight: "bold", padding: "0" }}
                        >
                          {expandedId === `${record.id}-${index}` ? "▲ 收起報告" : "▼ 查看分析報告"}
                        </button>
                         {expandedId === `${record.id}-${index}` && (
                          <div className={styles.markdownWrapper} style={{
                            marginTop: "10px", fontSize: "12px",
                            lineHeight: "1.7", color: "#333",
                            background: "white", padding: "12px", borderRadius: "8px",
                            maxHeight: "500px", overflowY: "auto",
                            border: "1px solid #edf2f7"
                          }}>
                            {record.analysis?.report_content || record.analysis?.report ? (
                              <MarkdownRenderer content={record.analysis.report_content || record.analysis.report} />
                            ) : typeof record.analysis === 'object' ? (
                              <div style={{ display: 'grid', gap: '10px' }}>
                                {Object.entries(record.analysis)
                                  .filter(([k]) => !['ai_model_used', 'completeness', 'contact_name', 'raw'].includes(k))
                                  .map(([k, v]) => (
                                    <div key={k}>
                                      <strong style={{ color: '#4facfe', fontSize: '11px', textTransform: 'uppercase' }}>{k}</strong>
                                      <div style={{ fontSize: '12px', marginTop: '2px' }}>
                                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <MarkdownRenderer content={String(record.analysis)} />
                            )}
                            
                            <div style={{ marginTop: '15px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '10px', color: '#999', textAlign: 'right' }}>
                              🤖 {record.analysis?.ai_model_used || "未知模型"}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
