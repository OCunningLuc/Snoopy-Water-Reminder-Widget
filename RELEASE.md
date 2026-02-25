# ⭐️过程存档---可以忽视这个文档

---

# How 打包并发布到 GitHub

---

## 这个 App 是什么？

**Water Reminder Widget** 是一个桌面小挂件：屏幕上会浮着一个小动画（默认是史努比），到时间了提醒你喝水/站起来运动。你可以自定义提醒文案、间隔、GIF 动图和提示音。

打包后会生成一个 `.dmg` 安装包（Mac），别人下载后双击安装就能用。

---

## 第一步：打开「终端」

1. 在 Mac 上按 **Command + 空格**，输入 **终端**（或 **Terminal**），按回车。
2. 弹出一个黑/白色窗口，这就是你输入命令的地方。

---

## 第二步：进入项目目录并安装依赖

在终端里**复制粘贴**下面两行，每行粘贴完按一次 **回车**：

```
cd "/Users/ocunning_luc/Downloads/史努比喝水桌面提醒"
```

```
npm install
```

等几分钟，跑完后最后几行没有红色 `ERR!` 就说明成功了。

---

## 第三步：打包成安装包

还是在同一个终端里，输入：

```
npm run dist
```

按回车，等几分钟。看到 `building block map` 或 `done` 说明打包完成。

打包好的文件在这里（用 **访达** 打开）：

> 下载 → 史努比喝水桌面提醒 → **dist** 文件夹

里面有个 **`Water Reminder Widget-1.0.0-arm64.dmg`**，这就是安装包。

---

## 第四步：本机测试（必做！确认程序能用）

1. **双击** dist 里的 `.dmg` 文件。
2. 弹出一个窗口，里面有个应用图标。把它**拖进「Applications」文件夹**。
3. 打开 **启动台** 或 **访达 → 应用程序**，点击 **Water Reminder Widget** 打开。
4. 如果弹出「无法打开，因为无法验证开发者」：
   - 打开 **系统设置 → 隐私与安全性**
   - 往下滚，找到「已被阻止」的提示，点 **仍要打开**
   - 再回去点一次应用，选 **打开**
5. 打开后你应该看到：
   - **屏幕中央**：出现一个 GIF 动图小挂件
   - **屏幕最上方右侧**（菜单栏）：多出一个小图标，点它有菜单
   - 5 秒后会弹出第一次提醒（这是预览，之后按你设定的间隔提醒）

**如果以上都正常，说明程序没问题，可以继续发布到 GitHub。**

---

## 第五步：注册 / 登录 GitHub

1. 打开浏览器，访问 **https://github.com**
2. 没有账号就点 **Sign up** 注册；有账号就 **Sign in** 登录。

---

## 第六步：新建 GitHub 仓库

1. 登录后，点右上角 **「+」** → **New repository**。
2. **Repository name**：填 `water-reminder-widget`（英文，不要空格）。
3. **不要**勾选 "Add a README file"。
4. 点绿色 **Create repository**。
5. 记住你的 **用户名** 和 **仓库名**。

---

## 第七步：上传代码到 GitHub

回到**终端**（如果关掉了，重新打开后先执行第二步的 `cd` 命令）。

下面每一行输入后按回车。**第五行**里把 `你的用户名` 换成你真正的 GitHub 用户名：

```
git init
```

```
git add .
```

```
git commit -m "init: Water Reminder Widget"
```

```
git branch -M main
```

```
git remote add origin https://github.com/你的用户名/water-reminder-widget.git
```

```
git push -u origin main
```

如果弹出登录提示，在浏览器里完成 GitHub 授权即可。没有报错就说明代码上传成功了。

---

## 第八步：发布 Release（让别人下载安装包）

1. 在浏览器打开你的仓库页面：`https://github.com/你的用户名/water-reminder-widget`
2. 点右侧的 **Releases** → **Create a new release**。
3. **Choose a tag**：输入 `v1.0.0`，然后选 **Create new tag: v1.0.0**。
4. **Release title**：填 `v1.0.0 首个版本`。
5. **描述**：可以写 `Mac 用户可下载 .dmg 安装使用`。
6. **上传安装包**：把 dist 文件夹里的 `.dmg` 文件**拖到**网页上「Attach binaries」区域。
7. 点 **Publish release**。

完成！别人打开你的仓库 → Releases → 就能下载 `.dmg` 安装了。

---

## 用户安装指南（转发给下载的人看）

### Mac 用户

1. 从 GitHub Releases 下载 `.dmg` 文件。
2. 双击打开 `.dmg`，把里面的 **Water Reminder Widget** 拖进 **Applications** 文件夹。
3. 打开 **启动台** 或 **应用程序**，点击 **Water Reminder Widget**。
4. 如果弹出安全提示「无法打开」：
   - 打开 **系统设置 → 隐私与安全性** → 点「仍要打开」→ 再打开一次应用
5. 使用方法：
   - 屏幕上出现小挂件（GIF 动图），可以**拖动**到任意位置
   - 屏幕**右上角菜单栏**多出一个图标 → 点击可以 **打开设置** 或 **退出**
   - 在挂件上**右键**也可以打开设置菜单

### Windows 用户

`.dmg` 是 Mac 专用。如果要给 Windows 用户用，需要在一台 **Windows 电脑**上打开项目，执行 `npm install` 和 `npm run dist`，会生成 `.exe` 安装包。

---

## 以后想更新版本？

1. 改完代码后在终端执行：
   ```
   cd "/Users/ocunning_luc/Downloads/史努比喝水桌面提醒"
   npm run dist
   ```
2. 上传新代码：
   ```
   git add .
   git commit -m "v1.0.1: 说明你改了什么"
   git push
   ```
3. 到 GitHub 仓库 → **Releases** → **Create a new release** → tag 填 `v1.0.1` → 上传新的 `.dmg` → **Publish**。

---

## 常见问题

| 问题 | 解决方法 |
|------|----------|
| 双击 .dmg 没反应 | 在终端执行：`xattr -cr ~/Downloads/你的.dmg文件路径`，再双击 |
| 弹出「无法打开」「未验证开发者」 | 系统设置 → 隐私与安全性 → 找到阻止提示 → 点「仍要打开」 |
| 打开后看不到挂件 | 看屏幕中间是否有小窗口（可能被其他窗口挡住）；看菜单栏右上角有没有新图标 |
| `npm install` 报错 | 确认已安装 Node.js（去 https://nodejs.org 下载 LTS 版本安装） |
| `npm run dist` 报错 | 确认先执行了 `cd` 进入项目目录，且 `npm install` 已成功完成 |
| `git push` 要登录 | 按浏览器提示用 GitHub 账号授权即可 |
