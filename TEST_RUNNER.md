# 測試運行指南

## 概述

本項目已配置完整的測試框架，包括單元測試、集成測試和組件測試。

## 安裝和配置

### 1. 安裝依賴

```bash
npm install
```

這將安裝以下測試依賴：
- Jest (~29.7.0)
- React Testing Library (~14.1.2)
- @testing-library/jest-dom (~6.1.4)
- jest-environment-jsdom (~29.7.0)

### 2. 驗證配置

檢查以下文件是否存在：
- ✅ `jest.config.js` - Jest 主配置
- ✅ `jest.setup.js` - Jest 初始化
- ✅ `__tests__/` - 測試目錄

## 運行測試

### 命令速查表

| 命令 | 說明 |
|------|------|
| `npm test` | 運行所有測試 |
| `npm run test:watch` | 監聽模式（開發時使用） |
| `npm run test:coverage` | 生成覆蓋率報告 |

### 詳細示例

**運行所有測試**:
```bash
npm test
```

預期輸出：
```
PASS  __tests__/services/prompt.test.js
PASS  __tests__/services/ai.test.js
PASS  __tests__/services/openrouter.test.js
PASS  __tests__/services/storage.test.js
PASS  __tests__/api/analyze.test.js
PASS  __tests__/components/Home.test.js

Test Suites: 6 passed, 6 total
Tests:       50+ passed, 50+ total
```

**監聽模式（開發時）**:
```bash
npm run test:watch
```

特點：
- 自動重新運行修改過的測試
- 命令行交互式選項
- 實時反饋

**生成覆蓋率報告**:
```bash
npm run test:coverage
```

這將生成：
- 終端覆蓋率摘要
- `coverage/` 目錄下的詳細 HTML 報告

查看 HTML 報告：
```bash
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html # Windows
```

## 測試套件詳解

### 1. 服務層測試 (6 個測試文件)

#### `__tests__/services/prompt.test.js`
```bash
npm test -- prompt.test.js
```

測試內容：
- ✅ prompt.buildPrompt() 函數
- ✅ 提示詞格式正確性
- ✅ 字段完整性

#### `__tests__/services/openrouter.test.js`
```bash
npm test -- openrouter.test.js
```

測試內容：
- ✅ API 調用正確性
- ✅ 響應解析
- ✅ 錯誤處理

#### `__tests__/services/ai.test.js`
```bash
npm test -- ai.test.js
```

測試內容：
- ✅ runAI() 函數
- ✅ analyzeWithAI() 函數
- ✅ 時間戳生成

#### `__tests__/services/storage.test.js`
```bash
npm test -- storage.test.js
```

測試內容：
- ✅ saveRecord() 函數
- ✅ storeResult() 函數
- ✅ getResult() 函數

### 2. API 集成測試 (1 個測試文件)

#### `__tests__/api/analyze.test.js`
```bash
npm test -- analyze.test.js
```

測試內容：
- ✅ POST /api/analyze 端點
- ✅ 完整工作流
- ✅ 錯誤情景

### 3. 組件測試 (1 個測試文件)

#### `__tests__/components/Home.test.js`
```bash
npm test -- Home.test.js
```

測試內容：
- ✅ 表單渲染
- ✅ 表單提交
- ✅ 結果顯示
- ✅ 加載狀態
- ✅ 錯誤處理

## 覆蓋率目標

目前覆蓋統計（預期）:

```
File               | % Stmts | % Branches | % Funcs | % Lines |
-------------------|---------|-----------|---------|---------|
All files          |   85%   |    80%    |   90%   |   85%   |
 services/         |   95%   |    90%    |   95%   |   95%   |
 pages/api/        |   90%   |    85%    |   90%   |   90%   |
 pages/            |   75%   |    70%    |   75%   |   75%   |
 components/       |   80%   |    75%    |   85%   |   80%   |
```

## 常見問題排查

### 1. "Cannot find module" 錯誤

**原因**: 依賴未安裝或路徑不正確

**解決方案**:
```bash
rm -rf node_modules
npm install
npm test
```

### 2. 某個測試集中的測試失敗

**檢查步驟**:
1. 查看錯誤消息中的文件路徑
2. 確認該文件存在：`ls -la services/ai/openrouter.js`
3. 檢查 mock 配置
4. 運行單個測試: `npm test -- --testNamePattern="test name"`

### 3. "ENOENT: no such file or directory" 錯誤

**解決方案**:
```bash
npm test -- --verbose  # 查看詳細路徑信息
npm test -- --no-coverage  # 禁用覆蓋率生成
```

### 4. 測試超時

**解決方案**:
```bash
npm test -- --testTimeout=10000  # 增加超時時間到 10 秒
```

## 持續集成

建議 Git 提交前運行測試：

```bash
#!/bin/bash
# 保存為 .git/hooks/pre-commit
npm test
if [ $? -ne 0 ]; then
  echo "Tests failed, commit aborted"
  exit 1
fi
```

## 調試測試

### 添加控制台日誌

```javascript
it('test name', () => {
  console.log('Debug info:', data);
  expect(...).toBe(...);
});
```

### 運行單個測試

```bash
npm test -- --testNamePattern="specific test name"
```

### 調試模式

```bash
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand
```

然後在瀏覽器打開 `chrome://inspect`

## 性能優化

### 並行運行測試（默認）

```bash
npm test  # 自動並行運行
```

### 串行運行（調試時）

```bash
npm test -- --runInBand
```

## 文件監測

### 監測特定文件

```bash
npm test -- services/ai/
```

### 監測特定測試文件

```bash
npm test -- analyze.test.js
```

## 資源清理

### 清除 Jest 緩存

```bash
npm test -- --clearCache
```

### 完整重置

```bash
rm -rf node_modules .jest coverage
npm install
npm test
```

## 下一步

1. ✅ 運行 `npm install`
2. ✅ 運行 `npm test` 驗證配置
3. ✅ 查看 `npm run test:coverage` 的覆蓋率
4. ✅ 在開發時使用 `npm run test:watch`
5. ✅ 在提交前確保所有測試通過

祝你測試愉快！🎉
