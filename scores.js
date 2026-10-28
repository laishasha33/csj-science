// 排行榜 API（Vercel Serverless Function）
//
//   GET  /api/scores   → { ok:true, runs:[...] }        取回全部成績
//   POST /api/scores   → { ok:true, attempt:3 }         上載一筆成績
//
// 這個檔案本身不存資料，只是把請求轉交給 Google Apps Script，
// 由 Apps Script 寫入／讀取老師的 Google Sheet。
//
// 這樣做的好處：
//   1. iPad 上的瀏覽器只和自己的網域對話，不會有 CORS 問題；
//   2. Google Sheet 的網址收在伺服器，學生看不到，改不到成績；
//   3. 不需要安裝任何套件，也不需要 Upstash／KV。
//
// 在 Vercel 設定一個環境變數：
//   SHEET_API = Apps Script 部署後給你的 .../exec 網址
//
// 未設定時不會當掉，只會回 ok:false，遊戲會顯示「未能連上排行榜」。

const SHEET_API = process.env.SHEET_API || '';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (!SHEET_API) {
    return res.status(200).json({ ok: false, reason: 'no-sheet-configured' });
  }

  try {
    if (req.method === 'GET') {
      const r = await fetch(SHEET_API, { redirect: 'follow' });
      const j = await r.json();
      return res.status(200).json(j && j.ok ? j : { ok: false, reason: 'sheet-error' });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      const r = await fetch(SHEET_API, {
        method: 'POST',
        redirect: 'follow',
        // text/plain 讓 Apps Script 直接收到原文，不會被當成表單
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
      });
      const j = await r.json();
      return res.status(200).json(j && j.ok ? j : { ok: false, reason: 'sheet-error' });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false });
  } catch (e) {
    // 連不上 Google 時也不要讓遊戲當掉，讓它顯示「未能連上排行榜」就算
    return res.status(200).json({ ok: false, reason: 'sheet-unreachable' });
  }
};
