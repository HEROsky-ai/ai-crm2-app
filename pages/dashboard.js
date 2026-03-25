import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ResultCard from "../components/ResultCard";
import styles from "../styles/dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
  const { resultId } = router.query;
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!resultId) {
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/result?id=${resultId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch result");
        }

        setResult(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p>載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p>錯誤: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>分析結果</h1>
      {result ? <ResultCard data={result} /> : <p>找不到對應的分析結果</p>}
    </div>
  );
}
