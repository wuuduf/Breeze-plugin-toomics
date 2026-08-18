# Breeze Toomics 插件

Toomics 全球漫画站（global.toomics.com）的 [Breeze](https://github.com/deretame/Breeze) 漫画阅读器插件。

## 功能

- 📊 **排行榜** — 榜单漫画
- 🆕 **最新更新** — recent 列表
- 🔥 **连载中** — ongoing 列表
- 🔍 **搜索** — 关键词搜索
- 🎨 **分类筛选** — 校园/恋爱/奇幻/动作/剧情/搞笑/惊悚/恐怖/科幻/体育/悬疑/成人
- 📖 **阅读** — 免费章节直接阅读；VIP 章节需登录 Cookie（登录后每 24 小时可免费解锁一话）

## 安装

1. Breeze 应用 → 插件管理 → 添加插件源
2. 填入 bundle 地址：
   ```
   https://cdn.jsdelivr.net/npm/breeze-plugin-toomics/dist/breeze-plugin-toomics.bundle.cjs
   ```
   或从 [Releases](https://github.com/jelly717/Breeze-plugin-toomics/releases) 下载 `.bundle.cjs` 本地导入

## 使用

- **免费章节**：直接打开阅读
- **VIP 章节**：
  1. 浏览器登录 toomics.com
  2. 复制登录 Cookie（`PHPSESSID` 等）
  3. 插件设置 → 账号 → 粘贴 Cookie
  4. 即可阅读 VIP 章节（含每日免费解锁的章节）

## 开发

```bash
pnpm install
pnpm run dev        # 开发模式（bundle 热更新）
pnpm build          # 构建产物 → dist/
```

## 技术说明

- 数据源：SSR 页面解析（无官方公开 API）
- 图片 CDN：`toon-g*.toomics.com`（需 Referer）
- 章节标记：`FFREE`=免费 / `VIP ONLY`=付费
- 插件契约：[Breeze 插件开发文档](https://deretame.github.io/plugin-dev-docs/)

## License

MIT
