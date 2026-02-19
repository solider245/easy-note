# Easy Note 简化重构计划

## 重构背景

当前项目为了支持多种部署方式，引入了过度复杂的架构：
- 4层配置来源（Env > File > Blob > DB）
- 运行时数据库切换功能
- Vercel Blob 配置存储
- 复杂的多源配置服务

**目标**：回归初心，打造"Fork → 填数据库连接 → 3分钟上线"的极简体验

---

## 重构目标

### 核心原则
```
"一个能在 Vercel 部署的极简 Markdown 笔记应用"
```

### 具体目标
1. **简化配置**：仅支持环境变量配置数据库
2. **功能分级**：核心功能始终显示，高级功能默认隐藏
3. **删除过度设计**：移除运行时切换、Blob配置存储等
4. **优化部署流程**：3步完成部署

---

## 功能分级架构

### Level 0: 核心功能（始终显示）
- ✅ Markdown WYSIWYG 编辑器
- ✅ 笔记 CRUD（创建、读取、更新、删除）
- ✅ 自动保存（防抖1秒）
- ✅ 全文搜索（⌘K）
- ✅ 回收站（软删除）
- ✅ 标签系统
- ✅ 深色模式
- ✅ 数据导入/导出（JSON）

### Level 1: 基础增强（默认显示，可关闭）
- ✅ 笔记模板（6种）
- ✅ 快捷键提示
- ✅ 字数统计
- ✅ Markdown 导入/导出

### Level 2: 高级功能（默认折叠，环境变量控制）
- 🤖 AI 助手（续写、总结、标题建议）
- ☁️ S3 存储（R2/S3/MinIO）
- 🔗 笔记分享（公开链接）
- 🔐 密码修改

### Level 3: 实验性功能（开发者模式）
- 🧪 多语言支持
- 🧪 协作编辑
- 🧪 版本历史

---

## 技术架构变更

### 删除/简化内容

| 组件 | 变更 | 原因 |
|------|------|------|
| `lib/config/config-service.ts` | 简化 | 仅保留 Env + File，删除 Blob 存储 |
| `lib/utils/blob-safe.ts` | 删除 | 不再需要 Blob 配置存储 |
| `app/api/database/connect/` | 简化 | 移除运行时切换，改为只读状态 |
| `app/api/database/disconnect/` | 删除 | 不再需要运行时断开 |
| `components/DatabaseConfigForm.tsx` | 改造 | 改为"查看状态 + 配置说明" |
| 运行时存储切换 | 删除 | 启动时确定，不再支持热切换 |
| Memory 模式（生产） | 限制 | 仅开发环境可用，生产强制数据库 |

### 保留核心架构

| 组件 | 保留原因 |
|------|----------|
| 三层存储抽象 | 支持不同部署场景（测试/Blob/数据库） |
| Drizzle ORM | 已验证稳定，支持 SQLite/PostgreSQL |
| 存储适配器模式 | 设计良好，便于维护 |
| 文件配置（VPS） | Docker/VPS 部署必需 |

---

## 部署流程（简化后）

```bash
# 1. Fork 项目（GitHub 网页操作）

# 2. 创建数据库（Turso 推荐）
# 访问 turso.io，创建数据库，获取连接信息

# 3. 部署到 Vercel
# - 导入 GitHub 项目
# - 添加环境变量：
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# 4. 完成！访问你的域名
```

---

## 环境变量设计（简化后）

### 必需（核心功能）
```bash
# 二选一
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# 或
DATABASE_URL=postgresql://...
```

### 可选（基础增强）
```bash
# 默认启用，可禁用
ENABLE_TEMPLATES=true
ENABLE_SHORTCUTS=true
```

### 可选（高级功能）
```bash
# 默认禁用，启用后显示在设置页面
OPENAI_API_KEY=sk-...          # 启用 AI 助手
S3_ENDPOINT=...                # 启用 S3 存储
ENABLE_SHARING=true            # 启用分享功能
```

---

## 实施计划

### Phase 1: 标记与准备 ✅ 已完成
- [x] 创建 Git tag `v2.0-before-refactor`
- [x] 创建规划文档 `docs/REFACTOR-PLAN.md`

### Phase 2: 删除过度设计（第 1-2 天）
- [ ] 删除 `lib/utils/blob-safe.ts`
- [ ] 简化 `lib/config/config-service.ts`
- [ ] 删除 `app/api/database/disconnect/`
- [ ] 简化 `app/api/database/connect/`
- [ ] 改造 `components/DatabaseConfigForm.tsx`

### Phase 3: 核心功能固化（第 2-3 天）
- [ ] 修改 `lib/storage/index.ts`（启动时确定存储）
- [ ] 限制 Memory 模式仅开发环境
- [ ] 验证数据库连接流程

### Phase 4: UI 改造（第 3-4 天）
- [ ] 改造 `app/settings/page.tsx`
- [ ] 添加折叠区域组件
- [ ] 实现功能开关逻辑
- [ ] 添加配置向导链接

### Phase 5: 文档重写（第 4-5 天）
- [ ] 重写 `README.md`（3分钟部署指南）
- [ ] 创建 `docs/DEPLOYMENT.md`
- [ ] 创建 `docs/ADVANCED.md`
- [ ] 更新环境变量说明

### Phase 6: 安全加固（最后一步）
- [ ] 添加强制密码检查
- [ ] 首次访问密码设置向导
- [ ] 安全警告和文档

### Phase 7: 测试与发布（最后）
- [ ] 完整部署测试
- [ ] 验证高级功能开关
- [ ] 创建 Git tag `v2.0-simplified`
- [ ] 发布 Release Notes

---

## Git 标记

### 已创建
```bash
git tag -a v2.0-before-refactor -m "重构前最后一个版本"
```

### 完成后创建
```bash
git tag -a v2.0-simplified -m "简化重构完成 - 回归初心"
```

---

## 风险与回滚

### 回滚方案
```bash
# 如果重构出现问题
git checkout v2.0-before-refactor
# 或创建修复分支
git checkout -b hotfix/restore-features v2.0-before-refactor
```

### 数据保护
- 所有数据存储在数据库，重构不影响数据
- 配置文件（local-config.json）会保留但不再使用
- 建议用户在重构前导出数据备份

---

## 相关 Tag

- `v2.0-before-refactor` - 重构前完整版本（当前）
- `v2.0-simplified` - 重构后简化版本（待创建）
