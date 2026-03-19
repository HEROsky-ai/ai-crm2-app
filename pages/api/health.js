export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const checks = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // 1. 檢查環境變數
    checks.services.openrouter = {
      configured: !!process.env.OPENROUTER_API_KEY,
      formatValid: process.env.OPENROUTER_API_KEY?.startsWith('sk-or-v1-'),
      apiKeyPrefix: process.env.OPENROUTER_API_KEY?.substring(0, 10) || 'NOT SET'
    };

    checks.services.nocodb = {
      configured: !!process.env.NOCODB_URL && !!process.env.NOCODB_TOKEN,
      url: process.env.NOCODB_URL ? '✓' : '❌ MISSING'
    };

    // 2. 測試 OpenRouter 連接
    if (process.env.OPENROUTER_API_KEY?.startsWith('sk-or-v1-')) {
      try {
        const testRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [{
              role: "user",
              content: "Hi"
            }]
          })
        });

        const data = await testRes.json();
        
        checks.services.openrouter.connectionTest = testRes.ok ? '✓ 成功連接' : `✗ 連接失敗 (${testRes.status})`;
        checks.services.openrouter.apiResponse = testRes.ok ? '成功' : data.error?.message || '未知錯誤';
      } catch (error) {
        checks.services.openrouter.connectionTest = `✗ ${error.message}`;
      }
    }

    // 3. 檢查 NocoDB 連接
    if (process.env.NOCODB_URL && process.env.NOCODB_TOKEN) {
      try {
        const ncodbRes = await fetch(process.env.NOCODB_URL, {
          method: 'GET',
          headers: {
            'xc-auth': process.env.NOCODB_TOKEN
          }
        });

        checks.services.nocodb.connectionTest = ncodbRes.ok ? '✓ 成功連接' : `✗ 連接失敗 (${ncodbRes.status})`;
      } catch (error) {
        checks.services.nocodb.connectionTest = `✗ ${error.message}`;
      }
    }

    return res.status(200).json({
      success: true,
      diagnostics: checks,
      recommendations: [
        !checks.services.openrouter.configured && '⚠️ 缺少 OPENROUTER_API_KEY - 更新 .env.local',
        !checks.services.openrouter.formatValid && '⚠️ OPENROUTER_API_KEY 格式不正確 - 應以 sk-or-v1- 開頭',
        checks.services.openrouter.apiResponse?.includes('error') && '⚠️ OpenRouter API 報錯 - 檢查密鑰和餘額',
        !checks.services.nocodb.configured && '⚠️ NocoDB 未配置'
      ].filter(Boolean)
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
