// ==============================================================================
// E-CCB EA SÚP — DANH MỤC 20 THÔN, BUÔN CHUẨN XÁC XÃ EA SÚP
// Nguồn dữ liệu duy nhất (Single Source of Truth) toàn hệ thống
// Gồm: 13 thôn số + 04 thôn đặt tên + 03 buôn
// ==============================================================================

export const EA_SUP_HAMLETS = [
  "Thôn 1",
  "Thôn 2",
  "Thôn 3",
  "Thôn 4",
  "Thôn 5",
  "Thôn 6",
  "Thôn 7",
  "Thôn 8",
  "Thôn 9",
  "Thôn 10",
  "Thôn 11",
  "Thôn 12",
  "Thôn 13",
  "Thôn Thắng Lợi",
  "Thôn Đoàn Kết",
  "Thôn Hòa Bình",
  "Thôn Bình Lợi",
  "Buôn A",
  "Buôn B",
  "Buôn C",
] as const;

export type HamletName = typeof EA_SUP_HAMLETS[number];

// Danh sách mã định danh tương ứng cho Database & API
export const EA_SUP_HAMLET_CODES: Record<HamletName, string> = {
  "Thôn 1": "THON_01",
  "Thôn 2": "THON_02",
  "Thôn 3": "THON_03",
  "Thôn 4": "THON_04",
  "Thôn 5": "THON_05",
  "Thôn 6": "THON_06",
  "Thôn 7": "THON_07",
  "Thôn 8": "THON_08",
  "Thôn 9": "THON_09",
  "Thôn 10": "THON_10",
  "Thôn 11": "THON_11",
  "Thôn 12": "THON_12",
  "Thôn 13": "THON_13",
  "Thôn Thắng Lợi": "THON_THANGLOI",
  "Thôn Đoàn Kết": "THON_DOANKET",
  "Thôn Hòa Bình": "THON_HOABINH",
  "Thôn Bình Lợi": "THON_BINHLOI",
  "Buôn A": "BUON_A",
  "Buôn B": "BUON_B",
  "Buôn C": "BUON_C",
};

/**
 * Chuẩn hóa tên thôn, buôn về 1 trong 20 thôn buôn chuẩn của xã Ea Súp
 * Khắc phục triệt để lỗi so khớp chuỗi lỏng lẻo gây trùng lặp / lệch số liệu
 */
export function normalizeHamlet(raw?: string): string {
  if (!raw) return "";
  let clean = raw.trim();
  clean = clean.replace(/^Chi\s+hội\s+/i, "").trim();

  // "1", "01", "10", "13" -> "Thôn 1", "Thôn 10"
  const numOnlyMatch = clean.match(/^0*([1-9]|1[0-3])$/);
  if (numOnlyMatch) {
    return `Thôn ${numOnlyMatch[1]}`;
  }

  // "Thôn 01" -> "Thôn 1"
  const numMatch = clean.match(/^Thôn\s*0*([1-9]|1[0-3])$/i);
  if (numMatch) {
    return `Thôn ${numMatch[1]}`;
  }

  // Khớp chính xác không phân biệt hoa thường
  for (const h of EA_SUP_HAMLETS) {
    if (clean.toLowerCase() === h.toLowerCase()) {
      return h;
    }
  }

  // Tên rút gọn (không có chữ Thôn / Buôn): "Đoàn Kết" -> "Thôn Đoàn Kết"
  for (const h of EA_SUP_HAMLETS) {
    const shortName = h.replace(/^(Thôn|Buôn)\s+/i, "");
    if (clean.toLowerCase() === shortName.toLowerCase()) {
      return h;
    }
  }

  // Khớp tiền tố theo thứ tự dài -> ngắn để Thôn 10, 11, 12, 13 được xét trước Thôn 1
  const sortedHamlets = [...EA_SUP_HAMLETS].sort((a, b) => b.length - a.length);
  for (const h of sortedHamlets) {
    const pattern = new RegExp(`^${h}\\b`, "i");
    if (pattern.test(clean)) {
      return h;
    }
  }

  return clean;
}

