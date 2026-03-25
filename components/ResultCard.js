import styles from "../styles/ResultCard.module.css";

export default function ResultCard({ data }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>分析結果</h2>
        <p className={styles.timestamp}>
          {data.timestamp ? new Date(data.timestamp).toLocaleString("zh-TW") : "未知時間"}
        </p>
      </div>

      {data.chat_text && (
        <div className={styles.section}>
          <h3>輸入對話</h3>
          <div className={styles.content}>{data.chat_text}</div>
        </div>
      )}

      {data.analysis && (
        <div className={styles.section}>
          <h3>AI 分析結果</h3>
          <pre className={styles.content}>
            {typeof data.analysis === "string"
              ? data.analysis
              : JSON.stringify(data.analysis, null, 2)}
          </pre>
        </div>
      )}

      <div className={styles.footer}>
        <a href="/">返回首頁</a>
      </div>
    </div>
  );
}
