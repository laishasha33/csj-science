# 1A 科學實驗室六關 —— 上線步驟

學生用 iPad 打開一條網址玩，玩完自動把成績寫進老師的 Google Sheet，
排行榜即時反映全班成績。

```
iPad 瀏覽器  →  Vercel（放網頁 + /api/scores）  →  Google Apps Script  →  Google Sheet
```

這個資料夾就是要上傳到 GitHub 的全部內容：

| 檔案 | 用途 |
|---|---|
| `index.html` | 遊戲本身，圖片已經嵌在裏面，不需要其他檔案 |
| `board.html` | **老師用的排行榜**，投影出來，每 10 秒自動更新 |
| `api/scores.js` | Vercel 的中轉站，把成績轉交給 Google |
| `sheet/Code.gs` | 貼進 Google Sheet 的程式（不會上線，只是放在這裏備份） |

上線之後會有兩條網址：

| 誰用 | 網址 |
|---|---|
| 學生 iPad | `https://s1-lab-game.vercel.app` |
| 老師電腦／投影 | `https://s1-lab-game.vercel.app/board.html` ← 加個書籤 |

---

## 第一步　建立 Google Sheet

1. 開 <https://sheets.new>，改個名，例如 **1A 科學遊戲成績**。
2. 上方選單 **擴充功能 → Apps Script**。
3. 把編輯器內原有的 `function myFunction() {}` 全部刪走，
   改為貼上 `sheet/Code.gs` 的全部內容，按 💾 儲存。
4. 右上角 **部署 → 新增部署作業**。
   - 左邊齒輪 ⚙️ 選 **網頁應用程式**
   - **執行身分**：我（你自己的 Google 帳戶）
   - **誰可以存取**：**所有人** ← 這項一定要選對，否則 iPad 連不上
   - 按 **部署**
5. 第一次會要求授權：**檢閱權限 → 選你的帳戶 → 進階 → 前往「未命名的專案」→ 允許**。
6. 完成後會給你一條網址，形如
   `https://script.google.com/macros/s/AKfy....../exec`
   **把它抄起來**，下面第三步要用。

> 之後如果改過 `Code.gs`，要再做一次「部署 → 管理部署作業 → ✏️ → 版本選『新版本』→ 部署」，
> 網址不會變。

---

## 第二步　上傳到 GitHub

在終端機逐行輸入（`cd` 那行的路徑照抄即可）：

```bash
cd ~/Projects/S1_Science/遊戲/vercel
git init
git add .
git commit -m "1A 科學實驗室六關"
git branch -M main
```

然後去 <https://github.com/new> 開一個新 repo：

- **Repository name**：`s1-lab-game`
- 揀 **Private**（私人就夠，Vercel 一樣讀得到）
- **不要**勾 Add a README / .gitignore / licence

開好之後 GitHub 會顯示幾行指令，照抄最尾兩行，或者直接用：

```bash
git remote add origin https://github.com/你的帳戶名/s1-lab-game.git
git push -u origin main
```

第一次 push 會要求登入。GitHub 已經不收密碼，要用 **Personal Access Token**：
<https://github.com/settings/tokens> → Generate new token (classic) →
勾 `repo` → 產生之後複製那串字，當密碼貼上去。

---

## 第三步　放上 Vercel

1. 去 <https://vercel.com>，用 **Continue with GitHub** 登入。
2. **Add New… → Project**，在清單揀 `s1-lab-game`，按 **Import**。
   （如果見不到，按 **Adjust GitHub App Permissions** 給它權限）
3. Framework Preset 保持 **Other**，Root Directory 保持 `./`，其餘不用改。
4. 展開 **Environment Variables**，加一個：

   | Name | Value |
   |---|---|
   | `SHEET_API` | 第一步抄下來那條 `.../exec` 網址 |

5. 按 **Deploy**，等一分鐘左右。
6. 完成後會給你一條網址，形如 `https://s1-lab-game.vercel.app`。
   - **這條派給學生。**
   - 後面加 `/board.html` 就是**老師用的排行榜**，上課前在自己部電腦開住、投影出來即可。

> 忘記加環境變數也不要緊：去 **Settings → Environment Variables** 補加，
> 然後 **Deployments → 最新那筆 → ⋯ → Redeploy**。

---

## 第四步　試一次

1. 用自己的手機或電腦開那條 Vercel 網址。
2. 揀 1A、揀一個學號、打完六關。
3. 最後那一頁應該顯示 **「✓ 成績已上載」**。
4. 回去 Google Sheet，應該見到「成績」工作表多了一行。

如果顯示「未能連上排行榜」，按這個次序檢查：

| 檢查 | 怎樣做 |
|---|---|
| Apps Script 的存取權限 | 要係 **所有人**，不是「只限我自己」 |
| `SHEET_API` 有沒有打錯 | 要以 `/exec` 結尾，不是 `/dev` |
| 改完環境變數有沒有 Redeploy | Vercel 要重新部署先會生效 |

---

## Google Sheet 會長成點

「成績」工作表每玩完一次加一行：

| 時間 | 班別 | 學號 | 第幾次 | 總分 | 滿分 | 用時 | 實驗儀器 得分 | 實驗儀器 做錯 | … |
|---|---|---|---|---|---|---|---|---|---|
| 2026-11-04 10:12 | 1A | 12 | 1 | 45 | 46 | 6:50 | 15/15 | 1 | … |

六關各佔三欄（得分、做錯次數、用時），第三關那欄是**按了幾次提示**，不是做錯次數。

還有一張「原始資料」工作表，是給遊戲讀排行榜用的，**不要刪、不要排序**。
要整理成績的話，複製「成績」那張去新工作表再改。

---

## 老師用的排行榜（`board.html`）

開住就得，**每 10 秒自己更新一次**，頂部的金色線行到盡就是更新了。

- 左邊：該班**總榜**（先比總分，同分比用時），顯示頭 12 名
- 右上：**班際比併** —— 按「全對人數佔全班的比例」排名，不是比分數，所以人數不同的班都公平
- 右下：**各關全對率** —— 哪一關最多人卡住，一條綠色橫條就看得出，講解時好用

頂部可以揀班別（1A／1B／1C）和「第一次／重玩」。想即刻更新不用等，按鍵盤 **R**。

連不上伺服器時不會變空白，會留住上一次的畫面並在右上角標示。

## 日常使用

- **換班玩**：同一條網址，學生自己揀 1A／1B／1C。
- **第幾次玩**由伺服器計，學生換 iPad 或者清了瀏覽器資料都計得準。
- **排行榜分「第一次」和「重玩」兩個榜**，所以重玩的人不會霸住頭幾名。
- **改完遊戲內容**之後，在電腦執行 `python3 _tools/build_lab4_html.py`，
  再 `git add . && git commit -m "更新" && git push`，Vercel 會自動重新部署。

---

## 不上網也玩得到

`遊戲/1A_科學實驗室六關.html` 這個檔案可以直接用 AirDrop 傳去 iPad 打開，
整個遊戲（包括圖片）都在檔案裏面。不過這樣成績只會留在那部 iPad，
排行榜只見到自己那部機的紀錄 —— 適合你自己試玩，不適合全班比賽。
