export interface NoteMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  deletedAt: number | null;
  preview?: string;      // First ~120 chars of content (plain text)
  wordCount?: number;    // Approximate word count
  tags?: string[];       // Tag list
  shareToken?: string | null; // Public share token (null = not shared)
  
  // v1.1.0: 22 one-line database enhancements
  // Statistics
  word_count?: number;
  char_count?: number;
  read_time_minutes?: number;
  view_count?: number;
  edit_count?: number;
  
  // Content analysis
  code_blocks?: number;
  image_count?: number;
  link_count?: number;
  content_hash?: string;
  cover_image?: string | null;
  first_paragraph?: string | null;
  
  // Metadata
  language?: string;
  note_type?: string;
  folder_path?: string;
  metadata?: string; // JSON string
  
  // Organization
  sort_order?: number;
  is_starred?: boolean;
  status?: string;
  priority?: number;
  
  // Audit
  last_viewed_at?: number | null;
  updated_device?: string;
  version?: number;
}

export interface Note extends NoteMeta {
  content: string; // Markdown 原文
}

// 笔记文本存储抽象
export interface StorageAdapter {
  list(): Promise<NoteMeta[]>;          // 仅元数据，不含 content
  get(id: string): Promise<Note | null>;
  save(note: Note): Promise<void>;
  del(id: string, purge?: boolean): Promise<void>;
  search(query: string): Promise<NoteMeta[]>;
  getUsage?(): Promise<{ used: number; total: number }>;
  exportAll(): Promise<Note[]>;
}

// 媒体文件存储抽象（独立于笔记存储，可单独升级）
export interface MediaAdapter {
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>; // 返回公开访问 URL
  del(url: string): Promise<void>;
  getUsage?(): Promise<{ used: number; total: number }>;
}
