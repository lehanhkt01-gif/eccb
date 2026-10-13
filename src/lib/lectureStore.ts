/**
 * Quản lý Bài giảng, Phim tư liệu & Văn bản tuyên truyền Hội CCB Xã Ea Súp
 * Single Source of Truth cho Cán bộ xã (Admin), Chi hội trưởng (/branch) và Hội viên (/member)
 */

export interface LectureItem {
  id: string;
  title: string;
  badge: string; // Chuyên mục / Thể loại: "Bài giảng Bác Hồ", "Lịch sử truyền thống", "Kinh tế CCB", "Văn bản tuyên truyền", v.v.
  duration?: string; // Thời lượng hoặc số trang (VD: "18 phút", "25 phút", "15 trang")
  desc?: string; // Mô tả tóm tắt nội dung
  url?: string; // Link liên kết video / YouTube / bài giảng online
  fileUrl?: string; // Đường dẫn file văn bản tuyên truyền tải lên (.pdf, .doc, .docx, etc.)
  fileName?: string; // Tên file hiển thị
  fileSize?: string; // Kích thước file
  speaker?: string; // Báo cáo viên / Người trình bày / Cơ quan ban hành
  order?: number; // Thứ tự ưu tiên
  createdAt?: string;
  updatedAt?: string;
}

// 4 Tư liệu chuẩn ban đầu của Hội CCB Xã Ea Súp
export const INITIAL_LECTURES: LectureItem[] = [
  {
    id: "vid-1",
    title: "Lời Bác Dạy Cựu Chiến Binh & Quân Đội Nhân Dân",
    duration: "18 phút",
    badge: "Bài giảng Bác Hồ",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    desc: "Tư liệu quý về những lời căn dặn thiêng liêng của Chủ tịch Hồ Chí Minh đối với phẩm chất Bộ đội Cụ Hồ.",
    speaker: "Chủ tịch Hồ Chí Minh",
    createdAt: "2026-01-01T08:00:00.000Z",
  },
  {
    id: "vid-2",
    title: "Bản Hùng Ca Tây Nguyên & Chiến Thắng Biên Giới Ea Súp",
    duration: "25 phút",
    badge: "Lịch sử truyền thống",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    desc: "Phim tài liệu tái hiện những năm tháng kiên cường giữ đất, giữ làng của quân dân xã Ea Súp anh hùng.",
    speaker: "Đài PT-TH Đắk Lắk",
    createdAt: "2026-01-02T09:30:00.000Z",
  },
  {
    id: "vid-3",
    title: "Cựu Chiến Binh Ea Súp Làm Giàu Vùng Đất Khó",
    duration: "14 phút",
    badge: "Kinh tế CCB",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    desc: "Gương CCB vượt khó, làm chủ mô hình trồng mít Thái, lúa ST25 và chăn nuôi bò lai mang lại hiệu quả cao.",
    speaker: "Hội CCB Xã Ea Súp",
    createdAt: "2026-01-03T10:15:00.000Z",
  },
  {
    id: "vid-4",
    title: "Hát Mãi Khúc Quân Hành — Tuyển Tập Ca Khúc Bất Hủ",
    duration: "45 phút",
    badge: "Âm nhạc cách mạng",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    desc: "Giai điệu hào hùng đồng hành cùng các buổi sinh hoạt chi hội, phục vụ phát loa kéo nhà văn hóa thôn.",
    speaker: "Đoàn Văn công Quân đội",
    createdAt: "2026-01-04T14:00:00.000Z",
  },
];

const STORAGE_KEY = "eccb_lectures_data_v1";
export const LECTURES_UPDATED_EVENT = "eccb-lectures-updated";

/**
 * Lấy danh sách bài giảng & tư liệu từ bộ nhớ đệm
 */
export function getStoredLectures(): LectureItem[] {
  if (typeof window === "undefined") return INITIAL_LECTURES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LECTURES));
      return INITIAL_LECTURES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_LECTURES;
  } catch {
    return INITIAL_LECTURES;
  }
}

/**
 * Lưu danh sách bài giảng & tư liệu vào bộ nhớ đệm và kích hoạt sự kiện đồng bộ
 */
export function saveStoredLectures(items: LectureItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(LECTURES_UPDATED_EVENT, { detail: items }));
  } catch (e) {
    console.error("Lỗi lưu lectures vào localStorage:", e);
  }
}

/**
 * Thêm một bài giảng / tư liệu mới
 */
export function addStoredLecture(data: Omit<LectureItem, "id" | "createdAt">): LectureItem {
  const current = getStoredLectures();
  const newItem: LectureItem = {
    ...data,
    id: `lec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [newItem, ...current];
  saveStoredLectures(updated);
  return newItem;
}

/**
 * Cập nhật một bài giảng / tư liệu đã có
 */
export function updateStoredLecture(id: string, updates: Partial<LectureItem>): LectureItem | null {
  const current = getStoredLectures();
  const idx = current.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  const updatedItem: LectureItem = {
    ...current[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  current[idx] = updatedItem;
  saveStoredLectures(current);
  return updatedItem;
}

/**
 * Xóa một bài giảng / tư liệu khỏi hệ thống
 */
export function deleteStoredLecture(id: string): boolean {
  const current = getStoredLectures();
  const updated = current.filter((item) => item.id !== id);
  if (updated.length !== current.length) {
    saveStoredLectures(updated);
    return true;
  }
  return false;
}
