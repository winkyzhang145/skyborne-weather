# 🍬 SKYBORNE · 糖果仙境 3D 天气

> 一个糖果仙境风格的 3D 天气可视化网页，Three.js + 和风天气 QWeather。

## ✨ 特性

- 🎀 **糖果仙境视觉** — 桃粉 + 薄荷绿 + 柠檬黄 + 浅天蓝的童话配色
- 🍭 **3D 中央装置** — 8 根彩色螺旋糖果手杖 + 玻璃穹顶 + 黄铜齿轮 + 城市旗帜
- ☁️ **天气符号动态切换** — 太阳/云/雨/雪/雾/多云 6 种 3D 符号在穹顶内旋转
- 🎬 **昼夜循环** — 装置颜色随 obsTime 调整（夜/黄昏/晨/午）
- 🏙️ **35 城快捷** + 城市搜索（和风 Geo API）
- ⚡ **真实数据** — 实况 / 24h / 7d 三套接口（带 mock 回退）
- ♿ **无障碍** — 焦点陷阱、键盘导航、aria-live、`prefers-reduced-motion`

## 🚀 本地运行

```bash
# 1. 安装 Node.js（无 npm 依赖，原生 ESM）
# 2. 配置环境
cp .env.example .env
# 编辑 .env，填入和风天气的 QWEATHER_KEY / QWEATHER_HOST

# 3. 启动
node server.js
# → http://127.0.0.1:5173
```

## ⚙️ .env 配置

```ini
QWEATHER_KEY=你的 API Key
QWEATHER_HOST=ng5xxx.re.qweatherapi.com
PORT=5173
HOST=127.0.0.1
```

详细步骤见 `.trae/documents/Technical-Architecture.md`。

## 🧱 技术栈

- 原生 ESM + Three.js 0.160（CDN 加载）
- Node.js 原生 `http` 做静态服务器 + API 代理
- 和风天气 REST API
- 0 npm 依赖

## 📁 目录

```
src/
├── main.js              # 入口
├── api/                 # qweather.js, mockData.js
├── three/               # scene.js + 7 个 3D 模块
├── components/          # ui.js, icons.js
├── state/store.js
├── styles/main.css
└── utils/weatherState.js
```

## 📄 License

仅作学习展示，私有仓库，未经许可请勿分发。
