# 数据库增强规划 (Database Enhancement Roadmap)

## 已保存的 8 个规划

### 1. 全文搜索 (Full-text Search) ⭐⭐⭐⭐⭐
- **改动:** SQLite FTS5 / PostgreSQL tsvector
- **SQL:**
  ```sql
  -- SQLite
  CREATE VIRTUAL TABLE notes_fts USING fts5(title, content, content=notes, content_rowid=id);
  -- PostgreSQL  
  ALTER TABLE notes ADD COLUMN search_vector tsvector;
  CREATE INDEX idx_notes_search ON notes USING GIN(search_vector);
  ```
- **回报:** 瞬间搜索笔记内容

### 2. 笔记版本历史 (Version History) ⭐⭐⭐⭐⭐
- **改动:** 新增 `note_versions` 表
- **SQL:**
  ```sql
  CREATE TABLE note_versions (
      id TEXT PRIMARY KEY,
      note_id TEXT REFERENCES notes(id),
      title TEXT, content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- **回报:** 永不丢失内容，可回溯任意版本

### 3. 笔记链接图谱 (Bidirectional Links) ⭐⭐⭐⭐
- **改动:** 解析 `[[笔记标题]]`，建立 `note_links` 关系表
- **SQL:**
  ```sql
  CREATE TABLE note_links (
      source_id TEXT REFERENCES notes(id),
      target_id TEXT REFERENCES notes(id),
      PRIMARY KEY (source_id, target_id)
  );
  ```
- **回报:** Obsidian 式知识图谱

### 4. 智能标签建议 (Auto-tagging) ⭐⭐⭐
- **改动:** 基于关键词匹配或 AI 建议标签
- **回报:** 自动分类，发现隐藏关联

### 5. 数据库性能优化 ⭐⭐⭐⭐
- **改动:** 添加缺失的索引
- **SQL:**
  ```sql
  CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
  CREATE INDEX idx_notes_is_pinned ON notes(is_pinned) WHERE is_pinned = true;
  CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
  ```
- **回报:** 查询速度提升 10-100x

### 6. 批量操作 (Bulk Actions) ⭐⭐⭐⭐
- **改动:** 多选笔记，批量删除/导出/修改标签
- **回报:** 管理效率提升 10x

### 7. 笔记模板系统 (Templates) ⭐⭐⭐
- **改动:** 新增 `templates` 表
- **回报:** 快速创建常用格式

### 8. 自动归档 (Auto-archive) ⭐⭐⭐
- **改动:** 长期未修改笔记移到 `archived_notes`
- **回报:** 主列表保持清爽

---

## 10-20 个"小改动大回报"建议

### 数据库结构优化类

#### 9. 笔记字数统计列 ⭐⭐⭐⭐
- **改动:** 添加 `word_count` 列，更新时自动计算
- **SQL:** `ALTER TABLE notes ADD COLUMN word_count INTEGER DEFAULT 0;`
- **回报:** 无需实时计算，性能提升，支持按字数筛选

#### 10. 笔记阅读次数统计 ⭐⭐⭐
- **改动:** 添加 `view_count` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN view_count INTEGER DEFAULT 0;`
- **回报:** 发现热门笔记，优化内容

#### 11. 笔记创建/更新设备记录 ⭐⭐⭐
- **改动:** 添加 `created_device` / `updated_device` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN updated_device TEXT;`
- **回报:** 追踪多端同步问题

#### 12. 笔记加密标记 ⭐⭐⭐⭐
- **改动:** 添加 `is_encrypted` 布尔列
- **SQL:** `ALTER TABLE notes ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;`
- **回报:** 支持端到端加密笔记

### 查询优化类

#### 13. 最近访问笔记缓存表 ⭐⭐⭐⭐
- **改动:** 创建 `recent_notes` 视图或缓存表
- **SQL:** 
  ```sql
  CREATE VIEW recent_notes AS 
  SELECT * FROM notes WHERE updated_at > datetime('now', '-7 days')
  ORDER BY updated_at DESC LIMIT 50;
  ```
- **回报:** 首页加载速度提升

#### 14. 标签统计表 ⭐⭐⭐
- **改动:** 创建 `tag_stats` 物化视图
- **SQL:** 
  ```sql
  CREATE TABLE tag_stats AS
  SELECT tag, COUNT(*) as note_count 
  FROM notes, json_each(tags) 
  GROUP BY tag;
  ```
- **回报:** 标签云即时显示，无需实时计算

#### 15. 笔记摘要列 ⭐⭐⭐
- **改动:** 添加 `summary` 列，保存前200字符
- **SQL:** `ALTER TABLE notes ADD COLUMN summary TEXT;`
- **回报:** 列表页无需加载完整内容

### 数据管理类

#### 16. 软删除替代硬删除 ⭐⭐⭐⭐⭐
- **改动:** Trash 页面已做，但可添加 `deleted_at` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN deleted_at TIMESTAMP;`
- **回报:** 数据可恢复，合规审计

#### 17. 笔记导入来源标记 ⭐⭐⭐
- **改动:** 添加 `source` 列（import/markdown/api）
- **SQL:** `ALTER TABLE notes ADD COLUMN source TEXT DEFAULT 'manual';`
- **回报:** 追踪数据来源

#### 18. 笔记重要性评分 ⭐⭐⭐⭐
- **改动:** 添加 `priority` 列（1-5星）
- **SQL:** `ALTER TABLE notes ADD COLUMN priority INTEGER DEFAULT 0 CHECK(priority BETWEEN 0 AND 5);`
- **回报:** 按重要性排序筛选

### 统计与分析类

#### 19. 每日写作统计表 ⭐⭐⭐⭐
- **改动:** 创建 `writing_stats` 表
- **SQL:**
  ```sql
  CREATE TABLE writing_stats (
      date TEXT PRIMARY KEY,
      note_count INTEGER DEFAULT 0,
      word_count INTEGER DEFAULT 0,
      edit_count INTEGER DEFAULT 0
  );
  ```
- **回报:** 生成写作热力图，激励持续写作

#### 20. 笔记关联度评分 ⭐⭐⭐⭐
- **改动:** 基于共享标签计算相似度
- **SQL:** 
  ```sql
  -- 查询相似笔记
  SELECT n2.id, COUNT(*) as common_tags
  FROM notes n1
  JOIN notes n2 ON n1.id != n2.id
  JOIN json_each(n1.tags) t1
  JOIN json_each(n2.tags) t2 ON t1.value = t2.value
  WHERE n1.id = ?
  GROUP BY n2.id ORDER BY common_tags DESC LIMIT 5;
  ```
- **回报:** "相关笔记"推荐

### 用户体验类

#### 21. 笔记收藏/星标列 ⭐⭐⭐
- **改动:** 添加 `is_starred` 布尔列（区别于 isPinned）
- **SQL:** `ALTER TABLE notes ADD COLUMN is_starred BOOLEAN DEFAULT FALSE;`
- **回报:** 快速访问重要但不置顶的内容

#### 22. 笔记颜色标记 ⭐⭐⭐
- **改动:** 添加 `color` 列（red/blue/green/yellow）
- **SQL:** `ALTER TABLE notes ADD COLUMN color TEXT;`
- **回报:** 视觉分类，一目了然

#### 23. 笔记完成状态 ⭐⭐⭐
- **改动:** 添加 `status` 列（draft/review/done/archived）
- **SQL:** `ALTER TABLE notes ADD COLUMN status TEXT DEFAULT 'draft';`
- **回报:** 工作流管理（待办/审核/完成）

### 高级功能类

#### 24. 笔记共享过期时间 ⭐⭐⭐⭐
- **改动:** 添加 `share_expires_at` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN share_expires_at TIMESTAMP;`
- **回报:** 临时分享自动失效，提升安全性

#### 25. 笔记协作锁定 ⭐⭐⭐⭐
- **改动:** 添加 `locked_by` 和 `locked_at` 列
- **SQL:**
  ```sql
  ALTER TABLE notes ADD COLUMN locked_by TEXT;
  ALTER TABLE notes ADD COLUMN locked_at TIMESTAMP;
  ```
- **回报:** 防止多端同时编辑冲突

#### 26. 笔记评论数统计 ⭐⭐⭐
- **改动:** 添加 `comment_count` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN comment_count INTEGER DEFAULT 0;`
- **回报:** 为将来评论功能做准备

#### 27. AI 生成摘要缓存 ⭐⭐⭐
- **改动:** 添加 `ai_summary` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN ai_summary TEXT;`
- **回报:** AI 摘要只需生成一次

#### 28. 笔记地理位置 ⭐⭐⭐
- **改动:** 添加 `location` 列（创建时的 IP/城市）
- **SQL:** `ALTER TABLE notes ADD COLUMN location TEXT;`
- **回报:** "我在哪里写的"回忆功能

---

## 进阶: 20个"一句话 ALTER TABLE"超能力

### 数据约束类 (数据质量保障)

#### 29. 标题唯一约束 ⭐⭐⭐⭐
- **改动:** 添加唯一约束防止重复标题
- **SQL:** `ALTER TABLE notes ADD CONSTRAINT unique_title UNIQUE(title);`
- **回报:** 自动防止重复笔记创建

#### 30. 内容非空约束 ⭐⭐⭐
- **改动:** 确保笔记必须有内容
- **SQL:** `ALTER TABLE notes ADD CONSTRAINT content_not_empty CHECK(length(trim(content)) > 0);`
- **回报:** 数据完整性，无空白笔记

#### 31. 字数上限约束 ⭐⭐⭐
- **改动:** 限制单篇笔记最大字数
- **SQL:** `ALTER TABLE notes ADD CONSTRAINT max_length CHECK(length(content) <= 100000);`
- **回报:** 防止数据库爆炸，性能保护

#### 32. 标签数量限制 ⭐⭐⭐
- **改动:** 最多10个标签
- **SQL:** `ALTER TABLE notes ADD CONSTRAINT max_tags CHECK(json_array_length(tags) <= 10);`
- **回报:** 防止标签滥用

### 自动计算类 (虚拟列/生成列)

#### 33. 自动生成 URL Slug ⭐⭐⭐⭐⭐
- **改动:** 从标题自动生成 URL 友好的 slug
- **SQL (PostgreSQL):** 
  ```sql
  ALTER TABLE notes ADD COLUMN slug TEXT GENERATED ALWAYS AS (
    lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))
  ) STORED;
  ```
- **回报:** SEO 友好链接，无需手动维护

#### 34. 自动提取首图 URL ⭐⭐⭐⭐
- **改动:** 自动从内容提取第一张图片
- **SQL:** 
  ```sql
  ALTER TABLE notes ADD COLUMN cover_image TEXT GENERATED ALWAYS AS (
    (regexp_match(content, '!\[.*?\]\((.*?)\)'))[1]
  ) STORED;
  ```
- **回报:** 笔记卡片自动显示封面图

#### 35. 自动计算阅读时长 ⭐⭐⭐⭐
- **改动:** 基于字数计算阅读时间
- **SQL:** 
  ```sql
  ALTER TABLE notes ADD COLUMN read_time_minutes INTEGER GENERATED ALWAYS AS (
    CEIL(word_count / 200.0)
  ) STORED;
  ```
- **回报:** 用户知道需要读多久

#### 36. 自动字符计数 ⭐⭐⭐
- **改动:** 区别于字数，统计字符数
- **SQL:** `ALTER TABLE notes ADD COLUMN char_count INTEGER GENERATED ALWAYS AS (length(content)) STORED;`
- **回报:** 精确统计，含标点符号

#### 37. 自动首段提取 ⭐⭐⭐⭐
- **改动:** 提取第一段作为摘要
- **SQL:** 
  ```sql
  ALTER TABLE notes ADD COLUMN first_paragraph TEXT GENERATED ALWAYS AS (
    trim(split_part(content, '\n\n', 1))
  ) STORED;
  ```
- **回报:** 列表页显示简介，无需额外字段

### 审计追踪类

#### 38. 编辑次数计数器 ⭐⭐⭐⭐
- **改动:** 追踪修改次数
- **SQL:** `ALTER TABLE notes ADD COLUMN edit_count INTEGER DEFAULT 0;`
- **+ 触发器:**
  ```sql
  CREATE TRIGGER increment_edit_count 
  AFTER UPDATE ON notes
  BEGIN
    UPDATE notes SET edit_count = edit_count + 1 WHERE id = NEW.id;
  END;
  ```
- **回报:** 发现活跃笔记，写作习惯分析

#### 39. 最后查看时间 ⭐⭐⭐⭐
- **改动:** 区别于 updated_at
- **SQL:** `ALTER TABLE notes ADD COLUMN last_viewed_at TIMESTAMP;`
- **回报:** "我上次读这篇是什么时候"

#### 40. 创建 IP 地址 ⭐⭐⭐
- **改动:** 记录创建者 IP
- **SQL:** `ALTER TABLE notes ADD COLUMN created_from_ip TEXT;`
- **回报:** 安全审计，异常登录检测

### 内容分析类

#### 41. 语言检测列 ⭐⭐⭐⭐
- **改动:** 自动识别内容语言
- **SQL:** `ALTER TABLE notes ADD COLUMN language TEXT DEFAULT 'zh';`
- **+ 应用层检测:** 基于字符范围自动判断
- **回报:** 多语言笔记管理，按语言筛选

#### 42. 内容哈希值 ⭐⭐⭐⭐⭐
- **改动:** 存储内容 MD5 哈希
- **SQL:** `ALTER TABLE notes ADD COLUMN content_hash TEXT;`
- **回报:** 快速检测内容是否变化，去重检查

#### 43. 代码块数量 ⭐⭐⭐
- **改动:** 统计 markdown 代码块数量
- **SQL:** 
  ```sql
  ALTER TABLE notes ADD COLUMN code_blocks INTEGER GENERATED ALWAYS AS (
    (length(content) - length(replace(content, '```', ''))) / 6
  ) STORED;
  ```
- **回报:** 识别技术笔记，编程文档分类

#### 44. 图片数量统计 ⭐⭐⭐
- **改动:** 统计图片数量
- **SQL:** 
  ```sql
  ALTER TABLE notes ADD COLUMN image_count INTEGER GENERATED ALWAYS AS (
    (length(content) - length(replace(content, '![', ''))) / 2
  ) STORED;
  ```
- **回报:** 富媒体笔记识别

#### 45. 链接数量统计 ⭐⭐⭐
- **改动:** 统计外链数量
- **SQL:** 
  ```sql
  ALTER TABLE notes ADD COLUMN link_count INTEGER GENERATED ALWAYS AS (
    (length(content) - length(replace(content, 'http', ''))) / 4
  ) STORED;
  ```
- **回报:** 引用密集型笔记识别

### 组织管理类

#### 46. 文件夹/目录路径 ⭐⭐⭐⭐
- **改动:** 支持笔记层级组织
- **SQL:** `ALTER TABLE notes ADD COLUMN folder_path TEXT DEFAULT '/';`
- **回报:** 类似文件系统的层级管理

#### 47. 排序权重 ⭐⭐⭐
- **改动:** 自定义排序优先级
- **SQL:** `ALTER TABLE notes ADD COLUMN sort_order INTEGER DEFAULT 0;`
- **回报:** 拖拽排序，精确控制展示顺序

#### 48. 笔记类型标记 ⭐⭐⭐⭐
- **改动:** 区分日记/文章/代码片段等
- **SQL:** `ALTER TABLE notes ADD COLUMN note_type TEXT DEFAULT 'article';`
- **回报:** 不同类型不同渲染，日记自动按日期分组

### 高级元数据类

#### 49. JSON 元数据列 ⭐⭐⭐⭐⭐
- **改动:** 存储任意额外数据
- **SQL:** `ALTER TABLE notes ADD COLUMN metadata JSON DEFAULT '{}';`
- **回报:** 无需改表结构即可扩展功能
- **示例:** `{"weather": "晴天", "mood": "开心", "location": "上海"}`

#### 50. 版本号乐观锁 ⭐⭐⭐⭐⭐
- **改动:** 防止并发编辑覆盖
- **SQL:** `ALTER TABLE notes ADD COLUMN version INTEGER DEFAULT 1;`
- **+ 触发器:**
  ```sql
  CREATE TRIGGER increment_version 
  BEFORE UPDATE ON notes
  BEGIN
    SELECT CASE WHEN OLD.version != NEW.version 
    THEN RAISE(ABORT, 'Concurrent modification detected') END;
    UPDATE notes SET version = OLD.version + 1 WHERE id = NEW.id;
  END;
  ```
- **回报:** 多设备编辑永不丢数据

---

## 优先级建议

**立即收益 (1-2小时实现):**
- 9, 11, 15, 17, 21, 22, 23, 24, 30, 31, 36, 39, 47, 48

**短期收益 (1-2天实现):**
- 5, 10, 12, 13, 14, 18, 19, 25, 29, 32, 35, 38, 40, 42, 49

**长期价值 (需更多开发):**
- 1, 2, 3, 4, 6, 7, 8, 20, 26, 27, 28, 33, 34, 37, 41, 43, 44, 45, 46, 50

---

## 时间归档与总结系统 (Time Archive System)

### 51. 每日总结表 (Daily Summaries) ⭐⭐⭐⭐⭐
- **改动:** 创建 `daily_summaries` 表
- **SQL:**
  ```sql
  CREATE TABLE daily_summaries (
      date TEXT PRIMARY KEY,
      note_count INTEGER DEFAULT 0,
      total_words INTEGER DEFAULT 0,
      total_read_time INTEGER DEFAULT 0,
      tags JSON DEFAULT '[]',
      hot_topics TEXT,
      summary TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
  );
  ```
- **回报:** 每日写作数据可视化，生成"今日写作主题"

### 52. 月度归档表 (Monthly Archives) ⭐⭐⭐⭐
- **改动:** 创建 `monthly_archives` 表
- **SQL:**
  ```sql
  CREATE TABLE monthly_archives (
      year_month TEXT PRIMARY KEY,
      note_count INTEGER DEFAULT 0,
      total_words INTEGER DEFAULT 0,
      top_tags JSON DEFAULT '[]',
      note_ids JSON DEFAULT '[]',
      cover_note_id TEXT,
      summary TEXT,
      created_at INTEGER NOT NULL
  );
  ```
- **回报:** 月度回顾，热门标签云，导出月度PDF

### 53. 年度总结表 (Yearly Summaries) ⭐⭐⭐⭐
- **改动:** 创建 `yearly_summaries` 表
- **SQL:**
  ```sql
  CREATE TABLE yearly_summaries (
      year INTEGER PRIMARY KEY,
      note_count INTEGER DEFAULT 0,
      total_words INTEGER DEFAULT 0,
      writing_days INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      top_tags JSON DEFAULT '[]',
      monthly_breakdown JSON DEFAULT '{}',
      yearly_theme TEXT,
      summary TEXT,
      created_at INTEGER NOT NULL
  );
  ```
- **回报:** 年度回顾，连续写作streak，"今年写了X万字"

### 54. GitHub风格写作热力图 (Writing Heatmap) ⭐⭐⭐⭐⭐
- **改动:** 基于 daily_summaries 生成可视化热力图
- **API:** `GET /api/summaries/heatmap?year=2024`
- **回报:** 直观展示写作习惯，激励持续写作

### 55. 时间线视图 (Timeline View) ⭐⭐⭐⭐
- **改动:** 新增页面 `/timeline` 按日/月/年浏览
- **功能:** 日历式导航，快速跳转到任意日期
- **回报:** 类似博客归档的时间线体验

---

## 终极: 20个"一句话ALTER TABLE"神级功能

### 智能内容类

#### 56. 情绪分析标记 ⭐⭐⭐⭐
- **改动:** 添加 `sentiment` 列，基于关键词自动判断
- **SQL:** `ALTER TABLE notes ADD COLUMN sentiment TEXT DEFAULT 'neutral';`
- **触发器:** 检测关键词 "开心/难过/愤怒" 自动标记 positive/negative/neutral
- **回报:** 情绪日记可视化，心理健康追踪

#### 57. 自动提取TODO数量 ⭐⭐⭐⭐
- **改动:** 添加 `todo_count` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN todo_count INTEGER DEFAULT 0;`
- **自动计算:** 统计 `- [ ]` 和 `* [ ]` 标记的数量
- **回报:** 任务管理仪表板，待办统计

#### 58. 代码语言检测 ⭐⭐⭐⭐
- **改动:** 添加 `primary_code_lang` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN primary_code_lang TEXT;`
- **自动检测:** 从代码块 ```python 提取语言类型
- **回报:** 按编程语言筛选笔记

#### 59. 自动提取外部链接 ⭐⭐⭐⭐
- **改动:** 添加 `external_links` JSON 列
- **SQL:** `ALTER TABLE notes ADD COLUMN external_links TEXT DEFAULT '[]';`
- **自动提取:** 解析 `[title](url)` 保存链接列表
- **回报:** 链接收藏夹，防止链接失效

#### 60. 笔记完成度评分 ⭐⭐⭐⭐⭐
- **改动:** 添加 `completion_score` 列 (0-100)
- **SQL:** `ALTER TABLE notes ADD COLUMN completion_score INTEGER DEFAULT 0;`
- **计算逻辑:** 字数/目标字数 + 必填字段完整性
- **回报:** 可视化进度条，激励完成笔记

### 时间管理类

#### 61. 预计写作时长 ⭐⭐⭐
- **改动:** 添加 `estimated_writing_time` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN estimated_writing_time INTEGER DEFAULT 0;`
- **计算:** 基于字数和编辑次数估算写作时长(分钟)
- **回报:** 了解时间投入，效率分析

#### 62. 最佳写作时段 ⭐⭐⭐⭐
- **改动:** 添加 `preferred_writing_hour` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN preferred_writing_hour INTEGER;`
- **统计:** 追踪用户何时最常编辑笔记
- **回报:** 推荐最佳创作时间

#### 63. 最后阅读进度 ⭐⭐⭐⭐
- **改动:** 添加 `last_read_position` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN last_read_position INTEGER DEFAULT 0;`
- **功能:** 记录上次阅读到第几行
- **回报:** 长文阅读断点续读

#### 64. 提醒/截止日期 ⭐⭐⭐⭐⭐
- **改动:** 添加 `due_date` 和 `reminder_at` 列
- **SQL:** 
  ```sql
  ALTER TABLE notes ADD COLUMN due_date INTEGER;
  ALTER TABLE notes ADD COLUMN reminder_at INTEGER;
  ```
- **回报:** 笔记变任务，到期提醒

#### 65. 写作目标达成 ⭐⭐⭐⭐
- **改动:** 添加 `daily_goal_achieved` 布尔列
- **SQL:** `ALTER TABLE notes ADD COLUMN daily_goal_achieved INTEGER DEFAULT 0;`
- **触发器:** 当日字数 >= 目标时自动标记
- **回报:** 目标追踪，成就感可视化

### 内容增强类

#### 66. 自动标签提取 ⭐⭐⭐⭐⭐
- **改动:** 添加 `auto_extracted_tags` JSON 列
- **SQL:** `ALTER TABLE notes ADD COLUMN auto_extracted_tags TEXT DEFAULT '[]';`
- **提取逻辑:** 提取 #标签 和 @提及
- **回报:** 自动分类，发现隐含关联

#### 67. 关键词密度 ⭐⭐⭐
- **改动:** 添加 `keyword_density` JSON 列
- **SQL:** `ALTER TABLE notes ADD COLUMN keyword_density TEXT DEFAULT '{}';`
- **统计:** {"AI": 5, "编程": 3} 高频词统计
- **回报:** SEO优化，内容主题分析

#### 68. 引用笔记计数 ⭐⭐⭐⭐
- **改动:** 添加 `referenced_by_count` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN referenced_by_count INTEGER DEFAULT 0;`
- **统计:** 被其他笔记 [[标题]] 引用的次数
- **回报:** 发现核心笔记，知识枢纽识别

#### 69. 内容质量评分 ⭐⭐⭐⭐
- **改动:** 添加 `quality_score` 列 (0-100)
- **SQL:** `ALTER TABLE notes ADD COLUMN quality_score INTEGER DEFAULT 0;`
- **算法:** 字数+图片+链接+代码块+结构完整性综合评分
- **回报:** 低质量笔记提示，内容优化建议

#### 70. 最后导出时间 ⭐⭐⭐
- **改动:** 添加 `last_exported_at` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN last_exported_at INTEGER;`
- **追踪:** 记录笔记何时被导出过
- **回报:** 避免重复导出，版本管理

### 数据安全类

#### 71. 笔记备份状态 ⭐⭐⭐⭐
- **改动:** 添加 `backup_status` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN backup_status TEXT DEFAULT 'pending';`
- **状态:** pending/backed_up/failed
- **回报:** 云端备份追踪，数据安全保障

#### 72. 修改冲突标记 ⭐⭐⭐⭐⭐
- **改动:** 添加 `has_conflict` 布尔列
- **SQL:** `ALTER TABLE notes ADD COLUMN has_conflict INTEGER DEFAULT 0;`
- **触发器:** 多设备同时编辑时自动检测
- **回报:** 防止数据丢失，冲突预警

#### 73. 敏感内容标记 ⭐⭐⭐⭐
- **改动:** 添加 `is_sensitive` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN is_sensitive INTEGER DEFAULT 0;`
- **检测:** 密码、API密钥、身份证号等正则匹配
- **回报:** 安全提醒，防止意外分享

#### 74. 加密盐值 ⭐⭐⭐⭐
- **改动:** 添加 `encryption_salt` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN encryption_salt TEXT;`
- **用途:** 端到端加密笔记的随机盐值
- **回报:** 支持加密笔记功能

#### 75. 数据来源URL ⭐⭐⭐⭐
- **改动:** 添加 `source_url` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN source_url TEXT;`
- **用途:** 网页剪藏、导入笔记的原始链接
- **回报:** 溯源能力，引用来源

### 用户体验类

#### 76. 笔记快捷方式 ⭐⭐⭐⭐
- **改动:** 添加 `shortcut_key` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN shortcut_key TEXT;`
- **功能:** 设置键盘快捷键如 "Ctrl+1" 快速跳转
- **回报:** 常用笔记秒开

#### 77. 笔记图标/Emoji ⭐⭐⭐
- **改动:** 添加 `icon_emoji` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN icon_emoji TEXT DEFAULT '📝';`
- **回报:** 视觉识别，个性化展示

#### 78. 打印优化标记 ⭐⭐⭐
- **改动:** 添加 `print_optimized` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN print_optimized INTEGER DEFAULT 0;`
- **功能:** 标记已优化打印格式的笔记
- **回报:** 导出PDF时自动应用优化样式

#### 79. 笔记模板变量 ⭐⭐⭐⭐
- **改动:** 添加 `template_variables` JSON 列
- **SQL:** `ALTER TABLE notes ADD COLUMN template_variables TEXT DEFAULT '{}';`
- **示例:** {"{{name}}": "张三", "{{date}}": "2024-02-21"}
- **回报:** 模板系统支持变量替换

#### 80. 阅读难度等级 ⭐⭐⭐⭐
- **改动:** 添加 `reading_level` 列
- **SQL:** `ALTER TABLE notes ADD COLUMN reading_level INTEGER DEFAULT 3;`
- **计算:** 基于句长、词汇复杂度 (1-5级)
- **回报:** 内容难度评估，读者适配建议

---

## 一句话SQL汇总

```sql
-- 情绪与内容分析
ALTER TABLE notes ADD COLUMN sentiment TEXT DEFAULT 'neutral';
ALTER TABLE notes ADD COLUMN todo_count INTEGER DEFAULT 0;
ALTER TABLE notes ADD COLUMN primary_code_lang TEXT;
ALTER TABLE notes ADD COLUMN external_links TEXT DEFAULT '[]';
ALTER TABLE notes ADD COLUMN completion_score INTEGER DEFAULT 0;

-- 时间管理
ALTER TABLE notes ADD COLUMN estimated_writing_time INTEGER DEFAULT 0;
ALTER TABLE notes ADD COLUMN preferred_writing_hour INTEGER;
ALTER TABLE notes ADD COLUMN last_read_position INTEGER DEFAULT 0;
ALTER TABLE notes ADD COLUMN due_date INTEGER;
ALTER TABLE notes ADD COLUMN reminder_at INTEGER;
ALTER TABLE notes ADD COLUMN daily_goal_achieved INTEGER DEFAULT 0;

-- 内容增强
ALTER TABLE notes ADD COLUMN auto_extracted_tags TEXT DEFAULT '[]';
ALTER TABLE notes ADD COLUMN keyword_density TEXT DEFAULT '{}';
ALTER TABLE notes ADD COLUMN referenced_by_count INTEGER DEFAULT 0;
ALTER TABLE notes ADD COLUMN quality_score INTEGER DEFAULT 0;
ALTER TABLE notes ADD COLUMN last_exported_at INTEGER;

-- 数据安全
ALTER TABLE notes ADD COLUMN backup_status TEXT DEFAULT 'pending';
ALTER TABLE notes ADD COLUMN has_conflict INTEGER DEFAULT 0;
ALTER TABLE notes ADD COLUMN is_sensitive INTEGER DEFAULT 0;
ALTER TABLE notes ADD COLUMN encryption_salt TEXT;
ALTER TABLE notes ADD COLUMN source_url TEXT;

-- 用户体验
ALTER TABLE notes ADD COLUMN shortcut_key TEXT;
ALTER TABLE notes ADD COLUMN icon_emoji TEXT DEFAULT '📝';
ALTER TABLE notes ADD COLUMN print_optimized INTEGER DEFAULT 0;
ALTER TABLE notes ADD COLUMN template_variables TEXT DEFAULT '{}';
ALTER TABLE notes ADD COLUMN reading_level INTEGER DEFAULT 3;
```

---

## 实施路线图

### ✅ 已完成
- **v1.0.0-offline** - 离线优先编辑系统
- **v1.1.0-enhanced** - 22个数据库增强字段

### 🔥 短期计划 (本周)
1. **全文搜索 (#1)** - SQLite FTS5 / PostgreSQL tsvector
2. **数据库索引 (#5)** - 查询性能优化
3. **写作统计表 (#19)** - 每日写作数据记录

### 📅 中期计划 (下周)
4. **笔记版本历史 (#2)** - 数据安全保障
5. **批量操作 (#6)** - 多选批量管理
6. **数据约束 (#29-32)** - 数据质量保障

### 🎯 长期计划 (后续)
7. **时间归档系统 (#51-55)** - 年月日总结与热力图
8. **双向链接图谱 (#3)** - Obsidian式知识网络
9. **模板系统 (#7)** - 快速创建常用格式
10. **AI智能功能 (#4, #27)** - 标签建议与摘要生成

---

**终极推荐 TOP 5 (立即实施):**
1. **全文搜索 (#1)** - 用户最需要的功能
2. **数据库索引 (#5)** - 性能立竿见影
3. **写作统计表 (#19)** - 数据可视化吸引人
4. **笔记版本历史 (#2)** - 数据安全底线
5. **批量操作 (#6)** - 管理效率提升

---

*标签: v1.0.0-offline 之后的数据库优化方向*
