/* تشغيل مستقل: نافذة واحدة تفتح ملفات التطبيق من القرص مباشرة، بلا خادم ولا متصفح خارجي */
const { app, BrowserWindow, session, Menu } = require("electron");
const path = require("path");

function createWindow() {
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 430,
    height: 920,
    minWidth: 320,
    minHeight: 560,
    title: "واحة اللسان العربي",
    backgroundColor: "#fdf6e3",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  // التسجيل الصوتي فقط مسموح، وكل طلب آخر (موقع، إشعارات...) مرفوض
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    callback(permission === "media");
  });
  win.loadFile(path.join(__dirname, "app", "index.html"));
}

// المواقع الخارجية لا تُفتح من تطبيق الأطفال (قرار وليّ الأمر): لا نوافذ جديدة لموقع، ولا تغادر النافذة ملفات التطبيق.
// تبقى نوافذ الطباعة الفارغة (about:blank) وروابط blob المحلية.
const LOCAL = (url) => /^(file:|blob:|about:blank)/.test(String(url || ""));
app.on("web-contents-created", (e, wc) => {
  wc.setWindowOpenHandler(({ url }) => (LOCAL(url) ? { action: "allow" } : { action: "deny" }));
  wc.on("will-navigate", (ev, url) => { if (!LOCAL(url)) ev.preventDefault(); });
  wc.on("will-redirect", (ev, url) => { if (!LOCAL(url)) ev.preventDefault(); });
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
