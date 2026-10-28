/**
 * 1A 科學實驗室六關 —— 成績記錄（Google Apps Script）
 *
 * 把這個檔案的內容貼進 Google Sheet 的「擴充功能 → Apps Script」，
 * 再部署成「網頁應用程式」，就會自動把學生成績一行一行寫進這個試算表。
 *
 * 部署設定：
 *   執行身分：我（你自己的 Google 帳戶）
 *   誰可以存取：所有人
 * 部署後會給你一條 .../exec 網址，把它填進 Vercel 的環境變數 SHEET_API。
 *
 * 試算表會自動開兩張工作表：
 *   成績    每玩完一次就加一行（這張是給老師看的）
 *   原始資料 每筆成績的 JSON 原文（給遊戲的排行榜讀取，不用理會）
 */

var SHEET_RUNS = '成績';
var SHEET_RAW = '原始資料';
var STAGES = ['實驗儀器', '危險標籤', '單位轉換', '本生燈', '縱切面圖', '火三角'];
var CAP = 5000;               // 最多保留多少筆，超過就刪最舊的

/* ───────────── 讀取（排行榜） ───────────── */
function doGet() {
  var out = { ok: true, runs: [] };
  try {
    var sh = ss().getSheetByName(SHEET_RAW);
    if (sh && sh.getLastRow() > 1) {
      var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < vals.length; i++) {
        try { out.runs.push(JSON.parse(vals[i][0])); } catch (e) { /* 壞資料就跳過 */ }
      }
    }
  } catch (e) {
    out = { ok: false, reason: String(e) };
  }
  return json(out);
}

/* ───────────── 寫入（上載成績） ───────────── */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);          // 幾部 iPad 同時交卷時排隊，免得行數撞車
  } catch (err) {
    return json({ ok: false, reason: 'busy' });
  }
  try {
    var b = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    var cls = ['1A', '1B', '1C'].indexOf(b.cls) >= 0 ? b.cls : null;
    var no = clamp(b.no, 1, 40);
    if (!cls || !no) return json({ ok: false, reason: 'bad-input' });

    var stages = [];
    for (var i = 0; i < 6; i++) {
      var s = (b.stages && b.stages[i]) || {};
      stages.push({ ok: clamp(s.ok, 0, 99), n: clamp(s.n, 0, 99),
                    hint: clamp(s.hint, 0, 999), sec: clamp(s.sec, 0, 36000) });
    }

    var run = {
      cls: cls,
      no: no,
      attempt: countAttempts(cls, no) + 1,       // 第幾次玩由伺服器計，換 iPad 都準確
      total: clamp(b.total, 0, 999),
      max: clamp(b.max, 1, 999),
      sec: clamp(b.sec, 0, 36000),
      stages: stages,
      ts: Date.now(),
    };

    appendRun(run);
    return json({ ok: true, attempt: run.attempt });
  } catch (err) {
    return json({ ok: false, reason: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ───────────── 試算表 ───────────── */
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet(name, header) {
  var s = ss().getSheetByName(name);
  if (!s) {
    s = ss().insertSheet(name);
    s.appendRow(header);
    s.getRange(1, 1, 1, header.length).setFontWeight('bold');
    s.setFrozenRows(1);
  }
  return s;
}

function runsSheet() {
  var head = ['時間', '班別', '學號', '第幾次', '總分', '滿分', '用時'];
  for (var i = 0; i < 6; i++) {
    head.push(STAGES[i] + ' 得分', STAGES[i] + (i === 2 ? ' 提示' : ' 做錯'), STAGES[i] + ' 用時');
  }
  return sheet(SHEET_RUNS, head);
}

function rawSheet() { return sheet(SHEET_RAW, ['json']); }

function countAttempts(cls, no) {
  var s = runsSheet();
  if (s.getLastRow() < 2) return 0;
  var v = s.getRange(2, 2, s.getLastRow() - 1, 2).getValues();   // 班別、學號兩欄
  var n = 0;
  for (var i = 0; i < v.length; i++) if (v[i][0] === cls && Number(v[i][1]) === no) n++;
  return n;
}

function appendRun(run) {
  var row = [new Date(), run.cls, run.no, run.attempt, run.total, run.max, mmss(run.sec)];
  for (var i = 0; i < 6; i++) {
    var st = run.stages[i];
    row.push(st.n ? st.ok + '/' + st.n : '', st.hint, mmss(st.sec));
  }
  var s = runsSheet();
  s.appendRow(row);

  var raw = rawSheet();
  raw.appendRow([JSON.stringify(run)]);

  // 超出上限就由最舊的開始刪，兩張表一起刪，保持行數對齊
  if (raw.getLastRow() - 1 > CAP) {
    var extra = raw.getLastRow() - 1 - CAP;
    raw.deleteRows(2, extra);
    s.deleteRows(2, extra);
  }
}

/* ───────────── 小工具 ───────────── */
function clamp(v, lo, hi) {
  var n = Math.round(Number(v));
  return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : 0;
}

function mmss(sec) {
  return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2);
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
