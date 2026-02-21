# Easy Note v1.0.0 🚀

> 一个极简、安全、智能的 Markdown 笔记应用，3 分钟完成部署。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/solider245/easy-note)

## ✨ 核心功能

### 📝 编辑体验
- **所见即所得** - Markdown 实时预览，支持代码高亮
- **自动保存** - 本地优先 + 云端同步，永不丢失内容
- **AI 助手** - 智能续写、摘要生成、文本优化
- **快捷键** - ⌘N 新建、⌘K 搜索、⌘S 保存、⌘⌫ 归档

### 🔍 搜索与组织
- **全文搜索** - 支持标题和内容搜索，毫秒级响应
- **归档系统** - 笔记归档后永久保留，搜索时可区分查看
- **标签管理** - 灵活的标签分类，支持标签筛选
- **置顶功能** - 重要笔记置顶显示

### 📊 数据洞察
- **写作统计** - 字数、阅读时间、代码块、图片数量自动统计
- **热力图** - GitHub 风格的写作活跃度可视化
- **数据导出** - JSON 备份，随时导出全部笔记

### 🎨 界面设计
- **深色模式** - 护眼模式，自动跟随系统
- **响应式布局** - 完美适配手机、平板、电脑
- **即时加载** - 服务端渲染骨架屏，首屏 <100ms

### 🔐 安全特性
- **密码保护** - 自动生成的强密码，支持自定义修改
- **数据加密** - 敏感配置 AES-256-GCM 加密存储
- **登录保护** - 15 分钟 5 次尝试限制，防暴力破解
- **无追踪** - 无第三方分析，你的数据只属于你

---

## 🚀 快速部署

### 方式一：Vercel 一键部署（推荐，3 分钟）

**适用场景**：个人使用，零维护成本

1. 点击上方 **Deploy with Vercel** 按钮
2. 连接 GitHub 并选择项目名称
3. 配置环境变量（见下方）
4. 点击 Deploy 完成部署

**环境变量配置**：

```bash
# 数据库二选一

# 选项 A：Turso SQLite（推荐，免费额度充足）
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=eyJhbGci...

# 选项 B：PostgreSQL（Supabase、AWS RDS 等）
DATABASE_URL=postgresql://user:pass@host:5432/database

# 可选：安全配置
ADMIN_PASSWORD=your-secure-password      # 登录密码，不设置则自动生成
CONFIG_ENCRYPTION_KEY=32-char-secret-key # 数据加密密钥，建议设置
OPENAI_API_KEY=sk-...                    # AI 功能，不设置则禁用
```

> 💡 **提示**：首次部署后，查看 Vercel 日志获取自动生成的密码

---

### 方式二：VPS / Docker 部署

**适用场景**：需要自定义配置、完整数据控制

查看 [docs/VPS.md](./docs/VPS.md) 获取详细指南。

---

## 📚 使用指南

### 首次使用

1. **登录**
   - 访问部署后的网址
   - 输入密码（查看 Vercel 日志获取自动生成的密码）
   - 建议立即在设置中修改密码

2. **创建笔记**
   - 点击侧边栏「+ New Note」按钮
   - 或使用快捷键 ⌘N
   - 开始写作，自动保存

3. **搜索笔记**
   - 点击搜索框或按 ⌘K
   - 输入关键词，实时搜索标题和内容
   - 归档笔记也会出现在搜索结果中（带归档标识）

4. **归档笔记**
   - 点击编辑器工具栏的「归档」按钮
   - 或使用快捷键 ⌘⌫
   - 归档笔记会从主列表移除，可在 Archive 页面查看

### 快捷键大全

| 快捷键 | 功能 |
|--------|------|
| ⌘N | 新建笔记 |
| ⌘K | 搜索笔记 |
| ⌘S | 手动保存 |
| ⌘⌫ | 归档笔记 |
| ⌘⇧A | AI 续写（需配置 OpenAI） |

### AI 写作助手（可选）

配置 `OPENAI_API_KEY` 后可用：
- **智能续写** - 根据上下文继续写作
- **生成摘要** - 一键总结笔记内容
- **优化文本** - 改进表达和语法

---

## 🛠️ 技术架构

- **前端**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **编辑器**: Markdown 实时预览
- **数据库**: SQLite (Turso) / PostgreSQL 双支持
- **部署**: Vercel Serverless / VPS / Docker
- **安全**: AES-256-GCM 加密、Rate Limiting、HttpOnly Cookie

---

## 📦 版本历史

- **v1.0.0** (2024-02) - 正式版发布，安全加固，生产就绪
- **v1.0.0-rc1** - 候选版，功能完备
- **v1.2.0** - 写作统计、热力图、全文搜索
- **v1.1.0** - 22 项数据库增强字段
- **v1.0.0-offline** - 离线优先编辑系统

---

## 💾 数据备份

你的数据存储在自己的数据库中，建议定期备份：

1. 进入 Settings → Data Management
2. 点击「Export Backup」下载 JSON 备份
3. 安全保存备份文件

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 可自由用于个人或商业项目。

---

**Made with ❤️ for people who love writing.**
