# Water Reminder Widget 💧---Snoopy

桌面动态陪伴与喝水提醒挂件 — 用可爱的 GIF 动图提醒你按时喝水、站起来活动。

A cross-platform desktop widget that reminds you to drink water with cute animated GIFs.

---

## 小红书🍠 / Red
喜欢史努比的你还没有关注OCunning_Lúc吗！
快来看看我的主页>> https://xhslink.com/m/3sBQ1lzFHzM

---

## 功能 / Features

- 🖥️ 透明无边框桌面挂件，始终置顶，可自由拖拽
- 🎭 3 个状态：待机 / 提醒 / 奖励，各自配有独立 GIF 动图
- ✏️ 提醒与奖励文案分别自定义，支持自选文字颜色
- ⏰ 提醒间隔：30 / 45 / 60 / 自定义分钟
- 🔊 支持上传自定义提示音（mp3（最佳） / wav / m4a）
- ⚙️ 常驻系统托盘，右键挂件或点击托盘图标即可进入设置
- 🎨 可上传自定义透明背景 GIF 替换默认形象（180×180最佳）

---

## 下载安装 / Download

前往 [Releases](../../releases) 页面，下载最新版本的 `.dmg`（Mac）或 `.exe`（Windows）安装包。

### Mac 安装步骤

1. 双击下载的 `.dmg` 文件
2. 将应用图标**拖入** Applications 文件夹
3. 在启动台或应用程序中打开 **Water Reminder Widget**
4. 首次打开可能提示「无法验证开发者」→ 前往 **系统设置 → 隐私与安全性** → 点「仍要打开」

---

## 使用方法 / Usage

1. 启动后，屏幕中央出现 GIF 挂件，菜单栏右上角出现托盘图标
2. **拖动**挂件到你喜欢的位置
3. **右键挂件** 或 **点击托盘图标** → 可打开设置、切换间隔、退出
4. 在设置中可修改：
   - 三个状态的 GIF 动图
   - 提醒间隔
   - 提醒/奖励状态文字及颜色
   - 提示音文件
   - 音效开关

---

## 开发者 / Development

### 环境要求

- Node.js 18+（推荐 LTS）
- macOS 或 Windows

### 本地运行

```bash
git clone https://github.com/<your-name>/water-reminder-widget.git
cd water-reminder-widget
npm install
npm run dev
```

### 打包

```bash
npm run dist
```

打包产物在 `dist/` 目录：

| 平台 | 格式 |
|------|------|
| macOS | `.dmg` |
| Windows | `.exe`（NSIS）|

---

## 发布到 GitHub

详细的打包与发布步骤请参考 [RELEASE.md](./RELEASE.md)。

---

## 项目结构 / Structure

```
├── main.js                  # Electron 主进程
├── src/renderer/
│   ├── widget.html/css/js   # 桌面挂件窗口
│   └── settings.html/css/js # 设置面板
├── assets/
│   ├── avatars/             # 默认 GIF 动图
│   ├── sounds/              # 默认提示音
│   └── trayTemplate.png     # 托盘图标
├── build/icon.png           # 应用图标
└── package.json             # 项目配置 & 打包配置
```

---

## License

MIT
