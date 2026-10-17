// ==============================================================================
// E-CCB EA SÚP — PHÂN LOẠI THỜI KỲ CHIẾN ĐẤU & CHÍNH SÁCH NGƯỜI CÓ CÔNG
// Đồng bộ chính xác số liệu phân bổ thời kỳ và đối tượng chính sách toàn xã
// ==============================================================================

export type CombatPeriodKey =
  | "BIEN_GIOI_BAC"
  | "TAY_NAM"
  | "CHONG_MY"
  | "CUU_QUAN_NHAN"
  | "QUOC_TE";

export interface CombatPeriodMeta {
  key: CombatPeriodKey;
  name: string;
  shortName: string;
  color: string;
}

export const COMBAT_PERIODS: CombatPeriodMeta[] = [
  {
    key: "BIEN_GIOI_BAC",
    name: "Chiến Tranh Bảo Vệ Biên Giới Phía Bắc",
    shortName: "Biên giới phía Bắc",
    color: "bg-moss-green",
  },
  {
    key: "TAY_NAM",
    name: "Chiến Tranh Bảo Vệ Biên Giới Tây Nam",
    shortName: "Biên giới Tây Nam",
    color: "bg-moss-green-light",
  },
  {
    key: "CHONG_MY",
    name: "Kháng Chiến Chống Mỹ Cứu Nước",
    shortName: "Kháng chiến chống Mỹ",
    color: "bg-flag-red",
  },
  {
    key: "CUU_QUAN_NHAN",
    name: "Cựu Quân Nhân Thời Bình",
    shortName: "Cựu quân nhân",
    color: "bg-bronze-gold",
  },
  {
    key: "QUOC_TE",
    name: "Làm Nhiệm Vụ Quốc Tế (Campuchia/Lào)",
    shortName: "Nhiệm vụ Quốc tế",
    color: "bg-amber-600",
  },
];

/**
 * Phân loại chuẩn xác thời kỳ chiến đấu của hội viên
 * Hỗ trợ nhận diện thông minh đa dạng các biến thể text, không phân biệt hoa/thường,
 * kết hợp năm nhập ngũ / năm sinh nếu dữ liệu thời kỳ bị thiếu hoặc viết tắt.
 */
export function classifyCombatPeriod(m: {
  period?: string;
  isCQN?: boolean;
  enlistmentDate?: string;
  dischargeDate?: string;
  birthYear?: number;
  birthDate?: string;
}): CombatPeriodKey {
  const raw = (m.period || "").toLowerCase().trim();

  // 1. Nhận diện Biên giới phía Bắc
  if (
    raw.includes("phía bắc") ||
    raw.includes("phia bac") ||
    raw.includes("biên giới bắc") ||
    raw.includes("bien gioi bac") ||
    raw.includes("bgpb") ||
    raw.includes("vị xuyên") ||
    raw.includes("vi xuyen") ||
    raw.includes("hà tuyên") ||
    raw.includes("lạng sơn") ||
    raw.includes("cao bằng") ||
    raw.includes("hoàng liên sơn")
  ) {
    return "BIEN_GIOI_BAC";
  }

  // 2. Nhận diện Biên giới Tây Nam
  if (
    raw.includes("tây nam") ||
    raw.includes("tay nam") ||
    raw.includes("bgtn") ||
    raw.includes("biên giới tây nam")
  ) {
    return "TAY_NAM";
  }

  // 3. Nhận diện Làm nhiệm vụ quốc tế (Campuchia / Lào)
  if (
    raw.includes("quốc tế") ||
    raw.includes("quoc te") ||
    raw.includes("campuchia") ||
    raw.includes("lào") ||
    raw.includes("lao") ||
    raw.includes("chiến trường k") ||
    raw.includes("mặt trận 479") ||
    raw.includes("mặt trận 779") ||
    raw.includes("đoàn 9901")
  ) {
    return "QUOC_TE";
  }

  // 4. Nhận diện Kháng chiến chống Mỹ cứu nước & chống Pháp
  if (
    raw.includes("mỹ") ||
    raw.includes("chong my") ||
    raw.includes("kccm") ||
    raw.includes("kháng chiến") ||
    raw.includes("chống pháp") ||
    raw.includes("chong phap")
  ) {
    return "CHONG_MY";
  }

  // 5. Nhận diện Cựu quân nhân thời bình
  if (
    raw.includes("thời bình") ||
    raw.includes("thoi binh") ||
    raw.includes("cựu quân nhân") ||
    raw.includes("cuu quan nhan") ||
    raw.includes("cqn") ||
    m.isCQN
  ) {
    return "CUU_QUAN_NHAN";
  }

  // 6. Trường hợp dữ liệu thời kỳ trống hoặc ghi "Chiến tranh bảo vệ Tổ quốc":
  // Suy luận thông minh dựa trên năm nhập ngũ hoặc năm sinh
  let enlistYear = 0;
  if (m.enlistmentDate) {
    const match = m.enlistmentDate.match(/\b(19\d{2}|20\d{2})\b/);
    if (match) enlistYear = parseInt(match[1], 10);
  }

  let birthYear = m.birthYear || 0;
  if (!birthYear && m.birthDate) {
    const match = m.birthDate.match(/\b(19\d{2}|20\d{2})\b/);
    if (match) birthYear = parseInt(match[1], 10);
  }

  if (enlistYear > 0) {
    if (enlistYear <= 1975) return "CHONG_MY";
    if (enlistYear >= 1976 && enlistYear <= 1979) return "TAY_NAM";
    if (enlistYear >= 1980 && enlistYear <= 1985) return "BIEN_GIOI_BAC";
    if (enlistYear >= 1986 && enlistYear <= 1989) return "QUOC_TE";
    if (enlistYear >= 1990) return "CUU_QUAN_NHAN";
  }

  if (birthYear > 0) {
    if (birthYear <= 1957) return "CHONG_MY";
    if (birthYear >= 1958 && birthYear <= 1961) return "TAY_NAM";
    if (birthYear >= 1962 && birthYear <= 1966) return "BIEN_GIOI_BAC";
    if (birthYear >= 1967 && birthYear <= 1971) return "QUOC_TE";
    if (birthYear >= 1972) return "CUU_QUAN_NHAN";
  }

  // Fallback an toàn
  return "CUU_QUAN_NHAN";
}

/**
 * Phân loại chính sách người có công (Thương binh, Bệnh binh, Da cam)
 */
export function classifyPolicyStatus(m: {
  policyStatus?: string;
  policyWoundRate?: string | number | null;
}) {
  const raw = (m.policyStatus || "").toLowerCase().trim();
  const woundRate =
    typeof m.policyWoundRate === "number"
      ? m.policyWoundRate
      : parseInt(String(m.policyWoundRate || "0").replace(/[^0-9]/g, ""), 10);

  const isWounded =
    raw.includes("thương binh") ||
    raw.includes("thuong binh") ||
    (woundRate > 0 && woundRate <= 100);

  const isSick = raw.includes("bệnh binh") || raw.includes("benh binh");

  const isAgentOrange =
    raw.includes("da cam") ||
    raw.includes("dioxin") ||
    raw.includes("chất độc") ||
    raw.includes("chat doc");

  let label = "Không";
  if (isWounded) {
    label = woundRate > 0 ? `Thương binh (${woundRate}%)` : "Thương binh";
  } else if (isSick) {
    label = woundRate > 0 ? `Bệnh binh (${woundRate}%)` : "Bệnh binh";
  } else if (isAgentOrange) {
    label = "Nhiễm Da cam/Dioxin";
  } else if (m.policyStatus && m.policyStatus !== "Không") {
    label = m.policyStatus;
  }

  return {
    isWounded,
    isSick,
    isAgentOrange,
    label,
    woundRate: woundRate > 0 ? woundRate : null,
  };
}
