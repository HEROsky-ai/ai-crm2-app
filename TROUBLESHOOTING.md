# AI 分析結果故障排查指南

## 🔴 問題：分析結果跑不出來

如果點擊「開始分析」後沒有得到結果，請按照以下步驟診斷：

### 🔍 第一步：檢查錯誤信息

1. **查看前端錯誤**（預設已顯示在頁面上）
   - 如果看到紅色錯誤提示，請記下錯誤信息
   - 點擊「診斷建議」查看可能的解決方案

2. **查看瀏覽器控制台**
   ```
   按 F12 → Console 標籤
   ```
   - 查找紅色或黃色的錯誤信息
   - 複製完整的錯誤堆棧信息

### 🔑 第二步：驗證 API 密鑰

檢查 `.env.local` 文件：

```bash
# 正確格式
OPENROUTER_API_KEY=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

# ❌ 錯誤格式
OPENROUTER_API_KEY=invalid-key
OPENROUTER_API_KEY=  # 空值
```

**關鍵點：**
- 必須以 `sk-or-v1-` 開頭
- 長度通常 50+ 字符
- 不要用引號包裹

### 💰 第三步：檢查 OpenRouter 餘額

1. 訪問 [OpenRouter 控制台](https://openrouter.ai/account)
2. 查看 API 使用情況和餘額
3. 確保有足量的可用額度

### 🌐 第四步：測試 API 連接

在瀏覽器控制台執行以下代碼：

```javascript
// 測試 API 連接
fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_text: '測試訊息',
    images: []
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ API 成功:', data);
  if (data.error) {
    console.error('❌ API 錯誤:', data.error);
  }
})
.catch(err => console.error('❌ 連接失敗:', err));
```

### 🔧 第五步：重新配置環境

1. **重新構建應用**
   ```bash
   npm run build
   ```

2. **清除 Node 快取**
   ```bash
   rm -r .next node_modules
   npm install
   npm run build
   ```

3. **重啟開發服務器**
   ```bash
   npm run dev
   ```

### 📊 常見錯誤代碼

| 錯誤信息 | 原因 | 解決方案 |
|---------|------|--------|
| `缺少 OPENROUTER_API_KEY` | API 密鑰未配置 | 檢查 .env.local 文件 |
| `invalid OPENROUTER_API_KEY 格式` | 密鑰格式錯誤 | 確保以 sk-or-v1- 開頭 |
| `API 錯誤 (401)` | 密鑰無效或已過期 | 重新生成或驗證密鑰 |
| `API 錯誤 (429)` | 速率限制/額度用盡 | 等待或充值 OpenRouter 餘額 |
| `API 錯誤 (500)` | OpenRouter 服務錯誤 | 稍後重試 |
| `未返回有效內容` | OpenRouter 沒有返回結果 | 檢查密鑰和餘額 |

### 🛠️ 進階診斷

**查看完整日誌：**

```bash
# 開發模式下查看詳細日誌
npm run dev
# 嘗試分析，查看終端輸出
```

**日誌位置：**
- 前端錯誤：瀏覽器控制台
- 後端錯誤：npm run dev 的終端輸出

### ✅ 測試步驟

1. ✅ 打開 http://localhost:3000
2. ✅ 在文字框輸入簡單文本（如「測試」）
3. ✅ **不選擇圖片**
4. ✅ 點擊「開始分析」
5. ✅ 等待 5-10 秒（首次調用較慢）
6. ✅ 檢查是否出現分析結果或錯誤信息

如果仍然沒有結果，請：
- 打開 F12 控制台
- 複製錯誤信息
- 檢查 `.env.local` 配置

---

**快速修復檢查清單：**
- [ ] API 密鑰以 `sk-or-v1-` 開頭
- [ ] `.env.local` 文件存在且格式正確
- [ ] OpenRouter 帳戶有足夠餘額
- [ ] 已執行 `npm run build` 
- [ ] 瀏覽器刷新（Ctrl+R 或 Cmd+R）
- [ ] 檢查 F12 控制台是否有錯誤

若以上都檢查無誤，請在控制台執行上述測試代碼，並將結果反饋給我。
