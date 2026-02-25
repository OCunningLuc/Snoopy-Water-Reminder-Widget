const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  dialog,
  nativeImage,
  screen,
} = require('electron');
const path = require('path');
const fs = require('fs');

let widgetWindow = null;
let settingsWindow = null;
let tray = null;

const isMac = process.platform === 'darwin';

// ── 路径工具 ───────────────────────────────────────────────
// extraResources 把 assets/ 放到 Resources/assets/
function getAssetsPath(...segments) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets', ...segments);
  }
  return path.join(__dirname, 'assets', ...segments);
}

// asar: false → 打包后 __dirname = Resources/app/，和开发时行为一致
function getRendererPath(filename) {
  return path.join(__dirname, 'src', 'renderer', filename);
}

// ── 设置相关 ───────────────────────────────────────────────
let userDataPath;
let settingsFilePath;
let avatarsDir;
let soundsDir;

function getDefaultSettings() {
  return {
    intervalMinutes: 60,
    soundEnabled: true,
    alertReminderText: '该喝水啦！',
    rewardReminderText: '蒸蚌！',
    reminderColor: '#ffffff',
    avatars: {
      idle: getAssetsPath('avatars', 'idle_default.gif'),
      alert: getAssetsPath('avatars', 'alert_default.gif'),
      reward: getAssetsPath('avatars', 'reward_default.gif'),
    },
    soundPath: getAssetsPath('sounds', 'alert.mp3'),
  };
}

let currentSettings = null;

function ensureUserDataPaths() {
  if (userDataPath) return;
  userDataPath = app.getPath('userData');
  settingsFilePath = path.join(userDataPath, 'settings.json');
  avatarsDir = path.join(userDataPath, 'avatars');
  soundsDir = path.join(userDataPath, 'sounds');
}

function loadSettings() {
  ensureUserDataPaths();
  const defaults = getDefaultSettings();
  let settings = { ...defaults, avatars: { ...defaults.avatars } };

  try {
    if (fs.existsSync(settingsFilePath)) {
      const raw = fs.readFileSync(settingsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      settings = {
        ...settings,
        ...parsed,
        avatars: { ...settings.avatars, ...(parsed.avatars || {}) },
      };
      if (typeof parsed.intervalMinutes !== 'number' || parsed.intervalMinutes <= 0) {
        settings.intervalMinutes = defaults.intervalMinutes;
      }
      if (typeof parsed.soundEnabled !== 'boolean') {
        settings.soundEnabled = defaults.soundEnabled;
      }
      if (typeof parsed.reminderText === 'string' && parsed.reminderText.trim()) {
        settings.alertReminderText = parsed.reminderText.trim();
      }
      if (typeof parsed.alertReminderText === 'string' && parsed.alertReminderText.trim()) {
        settings.alertReminderText = parsed.alertReminderText.trim();
      }
      if (typeof parsed.rewardReminderText === 'string' && parsed.rewardReminderText.trim()) {
        settings.rewardReminderText = parsed.rewardReminderText.trim();
      }
      if (typeof parsed.reminderColor === 'string' && parsed.reminderColor.trim()) {
        settings.reminderColor = parsed.reminderColor.trim();
      }
      if (typeof parsed.soundPath === 'string' && parsed.soundPath.trim()) {
        settings.soundPath = parsed.soundPath.trim();
      }
    }
  } catch (error) {
    console.error('Failed to load settings, using defaults:', error);
  }

  return settings;
}

function saveSettings() {
  ensureUserDataPaths();
  try {
    const data = {
      intervalMinutes: currentSettings.intervalMinutes,
      soundEnabled: currentSettings.soundEnabled,
      alertReminderText: currentSettings.alertReminderText,
      rewardReminderText: currentSettings.rewardReminderText,
      reminderColor: currentSettings.reminderColor,
      soundPath: currentSettings.soundPath,
      avatars: currentSettings.avatars,
    };
    fs.writeFileSync(settingsFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

function resetSettings() {
  const defaults = getDefaultSettings();
  currentSettings = { ...defaults, avatars: { ...defaults.avatars } };
  saveSettings();
}

// ── file:// URL 工具 ──────────────────────────────────────
function toFileUrl(fsPath) {
  if (!fsPath) return '';
  let resolved = path.isAbsolute(fsPath) ? fsPath : path.resolve(fsPath);
  let pathName = resolved.replace(/\\/g, '/');
  if (!pathName.startsWith('/')) pathName = '/' + pathName;
  return encodeURI('file://' + pathName);
}

function toFileUrlWithVersion(fsPath) {
  const baseUrl = toFileUrl(fsPath);
  if (!baseUrl) return '';
  try {
    const stat = fs.statSync(fsPath);
    return baseUrl + '?v=' + Math.floor(stat.mtimeMs);
  } catch (_) {
    return baseUrl;
  }
}

function ensureFileExists(fsPath, fallback) {
  try {
    if (fsPath && fs.existsSync(fsPath)) return fsPath;
  } catch (_) {}
  return fallback;
}

function serializeSettingsForRenderer() {
  const def = getDefaultSettings();
  const idlePath = ensureFileExists(currentSettings.avatars.idle, def.avatars.idle);
  const alertPath = ensureFileExists(currentSettings.avatars.alert, def.avatars.alert);
  const rewardPath = ensureFileExists(currentSettings.avatars.reward, def.avatars.reward);
  const soundPath = ensureFileExists(currentSettings.soundPath, def.soundPath);
  return {
    intervalMinutes: currentSettings.intervalMinutes,
    soundEnabled: currentSettings.soundEnabled,
    alertReminderText: currentSettings.alertReminderText,
    rewardReminderText: currentSettings.rewardReminderText,
    reminderColor: currentSettings.reminderColor,
    avatars: {
      idleUrl: toFileUrlWithVersion(idlePath),
      alertUrl: toFileUrlWithVersion(alertPath),
      rewardUrl: toFileUrlWithVersion(rewardPath),
    },
    soundUrl: toFileUrlWithVersion(soundPath),
  };
}

function broadcastSettings(payload) {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('settings-updated', payload);
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('settings-updated', payload);
  }
}

// ── 窗口 ──────────────────────────────────────────────────
function createWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) return;

  const widgetPath = getRendererPath('widget.html');
  console.log('[startup] widget path:', widgetPath, '| exists:', fs.existsSync(widgetPath));

  widgetWindow = new BrowserWindow({
    width: 260,
    height: 320,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    roundedCorners: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  widgetWindow.loadFile(widgetPath);

  widgetWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('[widget] did-fail-load', code, desc);
  });

  widgetWindow.once('ready-to-show', () => {
    widgetWindow.show();
  });

  const primary = screen.getPrimaryDisplay();
  const { width, height } = primary.workAreaSize;
  const x = Math.max(0, Math.floor((width - 260) / 2));
  const y = Math.max(0, Math.floor((height - 320) / 2));
  widgetWindow.setPosition(x, y);

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  const settingsPath = getRendererPath('settings.html');
  console.log('[startup] settings path:', settingsPath, '| exists:', fs.existsSync(settingsPath));

  settingsWindow = new BrowserWindow({
    width: 520,
    height: 660,
    resizable: false,
    title: 'Water Reminder Settings',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  settingsWindow.loadFile(settingsPath);

  settingsWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('[settings] did-fail-load', code, desc);
  });

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// ── 托盘 ──────────────────────────────────────────────────
function createTray() {
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }

  const iconPath = getAssetsPath('trayTemplate.png');
  let trayIcon = nativeImage.createFromPath(iconPath);
  if (trayIcon.isEmpty()) {
    trayIcon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGwwAGBgYGAE0QAB0wEq0AAAAASUVORK5CYII='
    );
  }
  tray = new Tray(trayIcon);
  tray.setToolTip('Water Reminder Widget');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开设置',
      click: () => createSettingsWindow(),
    },
    { type: 'separator' },
    {
      label: currentSettings.soundEnabled ? '关闭提示音' : '开启提示音',
      click: () => {
        currentSettings.soundEnabled = !currentSettings.soundEnabled;
        saveSettings();
        broadcastSettings(serializeSettingsForRenderer());
        createTray();
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
}

// ── IPC ───────────────────────────────────────────────────
function setupIpc() {
  ipcMain.handle('get-settings', () => serializeSettingsForRenderer());

  ipcMain.handle('update-settings', (_event, patch) => {
    if (!patch) return serializeSettingsForRenderer();

    if (typeof patch.intervalMinutes === 'number' && patch.intervalMinutes > 0) {
      currentSettings.intervalMinutes = patch.intervalMinutes;
    }
    if (typeof patch.soundEnabled === 'boolean') {
      currentSettings.soundEnabled = patch.soundEnabled;
    }
    const def = getDefaultSettings();
    if (typeof patch.alertReminderText === 'string') {
      currentSettings.alertReminderText = patch.alertReminderText.trim() || def.alertReminderText;
    }
    if (typeof patch.rewardReminderText === 'string') {
      currentSettings.rewardReminderText = patch.rewardReminderText.trim() || def.rewardReminderText;
    }
    if (typeof patch.reminderColor === 'string') {
      currentSettings.reminderColor = patch.reminderColor.trim() || def.reminderColor;
    }
    if (patch.avatars) {
      currentSettings.avatars = { ...currentSettings.avatars, ...patch.avatars };
    }
    saveSettings();
    const payload = serializeSettingsForRenderer();
    broadcastSettings(payload);
    createTray();
    return payload;
  });

  ipcMain.handle('reset-settings', () => {
    resetSettings();
    const payload = serializeSettingsForRenderer();
    broadcastSettings(payload);
    createTray();
    return payload;
  });

  ipcMain.handle('select-avatar', async (_event, state) => {
    if (!['idle', 'alert', 'reward'].includes(state)) {
      return serializeSettingsForRenderer();
    }
    const result = await dialog.showOpenDialog({
      title: '选择透明背景 GIF',
      properties: ['openFile'],
      filters: [{ name: 'GIF Images', extensions: ['gif'] }],
    });
    if (result.canceled || !result.filePaths.length) {
      return serializeSettingsForRenderer();
    }
    ensureUserDataPaths();
    try {
      await fs.promises.mkdir(avatarsDir, { recursive: true });
      const dest = path.join(avatarsDir, state + '.gif');
      await fs.promises.copyFile(result.filePaths[0], dest);
      currentSettings.avatars[state] = dest;
      saveSettings();
    } catch (err) {
      console.error('Failed to copy avatar file:', err);
    }
    const payload = serializeSettingsForRenderer();
    broadcastSettings(payload);
    return payload;
  });

  ipcMain.handle('select-sound', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择提示音（推荐 MP3）',
      properties: ['openFile'],
      filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'm4a'] }],
    });
    if (result.canceled || !result.filePaths.length) {
      return serializeSettingsForRenderer();
    }
    const ext = path.extname(result.filePaths[0]) || '.mp3';
    ensureUserDataPaths();
    try {
      await fs.promises.mkdir(soundsDir, { recursive: true });
      const dest = path.join(soundsDir, 'alert' + ext);
      await fs.promises.copyFile(result.filePaths[0], dest);
      currentSettings.soundPath = dest;
      saveSettings();
    } catch (err) {
      console.error('Failed to copy sound file:', err);
    }
    const payload = serializeSettingsForRenderer();
    broadcastSettings(payload);
    return payload;
  });

  ipcMain.handle('show-widget-menu', () => {
    if (!widgetWindow) return;
    const menu = Menu.buildFromTemplate([
      { label: '更换形象 / 打开设置', click: () => createSettingsWindow() },
      { type: 'separator' },
      {
        label: '提醒间隔 30 分钟',
        type: 'radio',
        checked: currentSettings.intervalMinutes === 30,
        click: () => { currentSettings.intervalMinutes = 30; saveSettings(); broadcastSettings(serializeSettingsForRenderer()); },
      },
      {
        label: '提醒间隔 45 分钟',
        type: 'radio',
        checked: currentSettings.intervalMinutes === 45,
        click: () => { currentSettings.intervalMinutes = 45; saveSettings(); broadcastSettings(serializeSettingsForRenderer()); },
      },
      {
        label: '提醒间隔 60 分钟',
        type: 'radio',
        checked: currentSettings.intervalMinutes === 60,
        click: () => { currentSettings.intervalMinutes = 60; saveSettings(); broadcastSettings(serializeSettingsForRenderer()); },
      },
      { type: 'separator' },
      {
        label: currentSettings.soundEnabled ? '关闭提示音' : '开启提示音',
        click: () => { currentSettings.soundEnabled = !currentSettings.soundEnabled; saveSettings(); broadcastSettings(serializeSettingsForRenderer()); createTray(); },
      },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() },
    ]);
    menu.popup({ window: widgetWindow });
  });

  ipcMain.handle('quit-app', () => app.quit());

  ipcMain.on('move-widget', (_event, position) => {
    if (!widgetWindow || widgetWindow.isDestroyed()) return;
    const { x, y } = position || {};
    if (typeof x === 'number' && typeof y === 'number') {
      widgetWindow.setPosition(Math.round(x), Math.round(y), false);
    }
  });
}

// ── 启动 ──────────────────────────────────────────────────
app.whenReady().then(() => {
  console.log('[startup] isPackaged:', app.isPackaged);
  console.log('[startup] __dirname:', __dirname);
  console.log('[startup] resourcesPath:', process.resourcesPath);
  console.log('[startup] assets path:', getAssetsPath());
  console.log('[startup] renderer path:', getRendererPath('widget.html'));

  if (isMac && app.dock) app.dock.hide();

  Menu.setApplicationMenu(null);

  ensureUserDataPaths();
  currentSettings = loadSettings();

  setupIpc();
  createWidgetWindow();
  createTray();

  app.on('activate', () => {
    if (!widgetWindow) createWidgetWindow();
  });
}).catch((err) => {
  dialog.showErrorBox('Water Reminder 启动失败', String(err && err.message ? err.message : err));
  app.quit();
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

process.on('uncaughtException', (err) => {
  console.error(err);
  dialog.showErrorBox('Water Reminder 出错', String(err && err.message ? err.message : err));
});
