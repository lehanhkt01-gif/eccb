/**
 * Helper xử lý dữ liệu và trích xuất hình ảnh / metadata cho phân hệ Bản tin E-CCB Ea Súp
 */

export interface NewsEntity {
  id?: string;
  title?: string;
  summary?: string;
  content?: string;
  imageUrl?: string | null;
  coverImage?: string | null;
  thumbnail?: string | null;
  images?: Array<string | { url: string }> | null;
}

/**
 * Trích xuất URL hình ảnh đầu tiên trong bài viết (từ coverImage, mảng images hoặc thẻ <img> / markdown trong nội dung)
 * Bắt buộc chuyển đổi thành đường dẫn tuyệt đối (Absolute URL) để Zalo / Facebook crawler cào được ảnh 100%.
 */
export function getFirstImageUrl(news: NewsEntity | null | undefined, baseUrl: string): string {
  let rawUrl = '';

  if (!news) {
    rawUrl = '/images/hero-military-bg.webp';
  }
  // 1. Ưu tiên ảnh đại diện / cover nếu có
  else if (news.coverImage || news.imageUrl || news.thumbnail) {
    rawUrl = (news.coverImage || news.imageUrl || news.thumbnail) as string;
  } 
  // 2. Nếu có mảng danh sách ảnh
  else if (Array.isArray(news.images) && news.images.length > 0) {
    const firstImg = news.images[0];
    rawUrl = typeof firstImg === 'string' ? firstImg : firstImg.url;
  } 
  // 3. Nếu nội dung lưu dạng HTML / Markdown, trích xuất thẻ img hoặc cú pháp markdown ![](...) đầu tiên
  else if (news.content && typeof news.content === 'string') {
    // Tìm thẻ HTML <img src="...">
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
    const match = news.content.match(imgRegex);
    if (match && match[1]) {
      rawUrl = match[1];
    } else {
      // Tìm cú pháp Markdown ![alt](url)
      const mdRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\)/i;
      const mdMatch = news.content.match(mdRegex);
      if (mdMatch && mdMatch[1]) {
        rawUrl = mdMatch[1];
      }
    }
  }

  // Nếu không có ảnh nào, dùng ảnh phong cảnh Bộ đội Cụ Hồ mặc định của Hội CCB
  if (!rawUrl) {
    rawUrl = '/images/hero-military-bg.webp';
  }

  // BẮT BUỘC: Đổi thành đường dẫn tuyệt đối (Absolute URL) có https://ccb.easupso.com
  // Facebook/Zalo sẽ BỎ QUA nếu đường dẫn là tương đối (dạng /uploads/...)
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }

  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = rawUrl.replace(/^\//, '');
  return `${cleanBase}/${cleanPath}`;
}

/**
 * Trích xuất đoạn mô tả (Sapo hoặc đoạn văn bản đầu tiên) phục vụ xem trước (Preview)
 */
export function getPreviewDescription(news: NewsEntity | null | undefined, maxLength = 160): string {
  if (!news) return 'Cổng thông tin điện tử Hội Cựu Chiến Binh Xã Ea Súp';
  
  if (news.summary && typeof news.summary === 'string' && news.summary.trim()) {
    const clean = news.summary.replace(/<[^>]+>/g, '').trim();
    return clean.length > maxLength ? `${clean.substring(0, maxLength)}...` : clean;
  }

  if (news.content && typeof news.content === 'string') {
    // Loại bỏ thẻ HTML hoặc định dạng markdown
    const clean = news.content
      .replace(/<[^>]+>/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/[#*`_~]/g, '')
      .trim();
    return clean.length > maxLength ? `${clean.substring(0, maxLength)}...` : clean;
  }

  return 'Bản tin hoạt động và tuyên truyền Hội Cựu Chiến Binh Xã Ea Súp';
}
