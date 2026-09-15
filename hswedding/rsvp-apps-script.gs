/**
 * Harry & Sincer 婚禮 RSVP — Google Apps Script 收件程式
 * 把賓客填寫的表單資料，每一筆自動新增成 Google 試算表的一列。
 *
 * ────────────────────────────────────────────────────────────
 * 設定步驟（約 5 分鐘，一次做好）：
 *
 * 1. 到 Google 雲端硬碟 → 新建一個「Google 試算表」，命名例如：HS Wedding RSVP
 * 2. 在試算表上方選單：擴充功能 → Apps Script
 * 3. 把預設的程式碼全部刪掉，貼上「本檔案下方」的程式碼，按儲存（💾）
 * 4. 右上角「部署」→「新增部署作業」
 *      - 類型（齒輪圖示）：選「網頁應用程式 Web app」
 *      - 執行身分：我自己（你的 Google 帳號）
 *      - 誰可以存取：「所有人 Anyone」  ← 一定要選這個，賓客才送得進來
 *    按「部署」→ 第一次會要求授權，依指示允許
 * 5. 複製畫面上的「網頁應用程式 URL」（結尾是 /exec）
 * 6. 打開 index.html，找到這一行：
 *        const RSVP_ENDPOINT = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
 *    把中間換成你剛複製的網址，存檔
 * 7. 重新上傳 index.html 到 Cloudflare Pages → 完成！
 *
 * 之後每有賓客送出，試算表就會自動多一列。
 * 想統計：用試算表的篩選／樞紐分析，即可算出席人數、A/B 團人數、飲食需求。
 *
 * ★ 若日後有修改這支程式：需重新「部署 → 管理部署作業 → 編輯 → 新版本」才會生效。
 * ────────────────────────────────────────────────────────────
 */

// ★ 填入你的試算表 ID（試算表網址中 /d/ 與 /edit 之間那串字）。
//   填了之後不論此 Apps Script 專案建在哪裡，都能正確寫入這張表。
var SHEET_ID = '';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('找不到試算表：請在程式最上方填入 SHEET_ID，或改從試算表的「擴充功能 → Apps Script」建立本專案');
    var sheet = ss.getSheetByName('RSVP') || ss.insertSheet('RSVP');

    // 第一次執行：自動建立標題列
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '送出時間', '來源', '姓名', '電話/微信/LINE/WhatsApp', 'Email', '是否出席',
        '偕同人數', '行程選擇', '代訂廣州住宿晚數', '飲食禁忌', '其他飲食備註',
        '祝福留言', '填寫語言'
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#F5EDD6');
      sheet.setFrozenRows(1);
    }

    var d = JSON.parse(e.postData.contents);

    // 把代碼轉成看得懂的中文（方便直接統計）
    var attendMap = { yes: '出席', maybe: '未定', no: '不克出席' };
    var tourMap = {
      gz: '廣州深度遊(A)', zjj: '張家界(B)', both: '兩段都參加',
      'hotel-only': '只需代訂住宿', no: '不參加'
    };

    sheet.appendRow([
      d.submitted_at ? new Date(d.submitted_at) : new Date(),
      d.source || '',
      d.name || '', d.phone || '', d.email || '',
      attendMap[d.attend] || d.attend || '',
      d.companions || '0',
      tourMap[d.tour] || d.tour || '',
      d.nights || '0',
      d.diet || '', d.diet_other || '',
      d.message || '', d.lang || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// 選用：可在 Apps Script 編輯器裡按「執行」測試，會塞一筆假資料進試算表確認能寫入
function testInsert() {
  doPost({ postData: { contents: JSON.stringify({
    submitted_at: new Date().toISOString(),
    source: '測試', name: '測試賓客', phone: '+886900000000', email: 'test@example.com',
    attend: 'yes', companions: '2', tour: 'both', nights: '5',
    diet: '素食、海鮮過敏', diet_other: '無', message: '新婚快樂！', lang: 'tc'
  }) } });
}
