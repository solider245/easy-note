/**
 * 笔记统计与分析工具
 * 自动计算字数、阅读时间、内容哈希等
 */

export interface NoteStats {
  word_count: number;
  char_count: number;
  read_time_minutes: number;
  code_blocks: number;
  image_count: number;
  link_count: number;
  content_hash: string;
  cover_image: string | null;
  first_paragraph: string | null;
  language: string;
}

/**
 * 计算笔记统计数据
 */
export function calculateNoteStats(title: string, content: string): NoteStats {
  const fullText = `${title} ${content}`;
  
  // 字数统计（中文字符 + 英文单词）
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
  const word_count = chineseChars + englishWords;
  
  // 字符数
  const char_count = content.length;
  
  // 阅读时间（假设中文200字/分钟，英文300词/分钟）
  const read_time_minutes = Math.ceil(chineseChars / 200 + englishWords / 300) || 1;
  
  // 代码块数量（``` 标记）
  const code_blocks = (content.match(/```/g) || []).length / 2;
  
  // 图片数量（![...](...) 标记）
  const image_count = (content.match(/!\[/g) || []).length;
  
  // 链接数量（排除图片链接）
  const allLinks = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
  const link_count = allLinks - image_count;
  
  // 内容哈希（简化版 MD5）
  const content_hash = generateContentHash(title + content);
  
  // 提取第一张图片
  const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
  const cover_image = imageMatch ? imageMatch[1] : null;
  
  // 提取第一段（非空行）
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const first_paragraph = paragraphs.length > 0 ? paragraphs[0].slice(0, 200) : null;
  
  // 语言检测
  const language = detectLanguage(content);
  
  return {
    word_count,
    char_count,
    read_time_minutes,
    code_blocks,
    image_count,
    link_count,
    content_hash,
    cover_image,
    first_paragraph,
    language,
  };
}

/**
 * 生成内容哈希（简化版）
 */
function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * 检测文本语言
 */
function detectLanguage(content: string): string {
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const japaneseChars = (content.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  const koreanChars = (content.match(/[\uac00-\ud7af]/g) || []).length;
  
  if (chineseChars > japaneseChars && chineseChars > koreanChars) {
    return chineseChars > content.length * 0.1 ? 'zh' : 'en';
  }
  if (japaneseChars > koreanChars) return 'ja';
  if (koreanChars > 0) return 'ko';
  return 'en';
}

/**
 * 获取设备标识
 */
export function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'server';
  
  const userAgent = navigator.userAgent;
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'ios';
  if (userAgent.includes('Android')) return 'android';
  if (userAgent.includes('Mac')) return 'macos';
  if (userAgent.includes('Windows')) return 'windows';
  if (userAgent.includes('Linux')) return 'linux';
  return 'unknown';
}
