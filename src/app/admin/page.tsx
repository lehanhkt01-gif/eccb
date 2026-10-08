"use client";

import React, { useState } from "react";
import Link from "next/link";

// 20 Thôn, Buôn xã Ea Súp với trạng thái cảnh báo chi tiết
const HAMLET_STATUS_DATA = [
  { code: "THON_01", name: "Thôn 1", leader: "Trần Văn Định", phone: "0912111001", members: 30, debt: "2.61 tỷ", overdue: "5.2 triệu", hasOverdue: true, dilapidatedHouse: 0, status: "warning" },
  { code: "THON_02", name: "Thôn 2", leader: "Nguyễn Văn Hùng", phone: "0912111002", members: 32, debt: "2.75 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 0, status: "good" },
  { code: "THON_03", name: "Thôn 3", leader: "Lê Đức Thọ", phone: "0912111003", members: 28, debt: "2.40 tỷ", overdue: "6.1 triệu", hasOverdue: true, dilapidatedHouse: 1, status: "alert" },
  { code: "THON_04", name: "Thôn 4", leader: "Phạm Hồng Thái", phone: "0912111004", members: 31, debt: "2.68 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 0, status: "good" },
  { code: "THON_05", name: "Thôn 5", leader: "Hoàng Văn Nam", phone: "0912111005", members: 29, debt: "2.55 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 0, status: "good" },
  { code: "THON_06", name: "Thôn 6", leader: "Vũ Đình Cường", phone: "0912111006", members: 33, debt: "2.82 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 0, status: "good" },
  { code: "THON_07", name: "Thôn 7", leader: "Đỗ Xuân Bách", phone: "0912111007", members: 30, debt: "2.60 tỷ", overdue: "4.8 triệu", hasOverdue: true, dilapidatedHouse: 0, status: "warning" },
  { code: "THON_08", name: "Thôn 8", leader: "Bùi Văn Thành", phone: "0912111008", members: 34, debt: "2.90 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 0, status: "good" },
  { code: "THON_09", name: "Thôn 9", leader: "Ngô Quang Hưng", phone: "0912111009", members: 27, debt: "2.35 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 0, status: "good" },
  { code: "THON_10", name: "Thôn 10", leader: "Đinh Văn Quyết", phone: "0912111010", members: 31, debt: "2.65 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 0, status: "good" },
  { code: "THON_11", name: "Thôn 11", leader: "Lương Thế Vinh", phone: "0912111011", members: 30, debt: "2.58 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 1, status: "alert" },
  { code: "THON_12", name: "Thôn 12", leader: "Trịnh Đình Dũng", phone: "0912111012", members: 29, debt: "2.50 tỷ", overdue: "5.5 triệu", hasOverdue: true, dilapidatedHouse: 0, status: "warning" },
  { code: "THON_13", name: "Thôn 13", leader: "Đặng Hữu Phúc", phone: "0912111013", members: 32, debt: "2.72 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 0, status: "good" },
  { code: "THON_HOABINH", name: "Thôn Hòa Bình", leader: "Phan Văn Khải", phone: "0912111014", members: 35, debt: "3.05 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 0, status: "good" },
  { code: "THON_THANGLOI", name: "Thôn Thắng Lợi", leader: "Dương Minh Châu", phone: "0912111015", members: 33, debt: "2.85 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 0, status: "good" },
  { code: "THON_DOANKET", name: "Thôn Đoàn Kết", leader: "Nguyễn Tiến Lực", phone: "0912111016", members: 30, debt: "2.60 tỷ", overdue: "4.9 triệu", hasOverdue: true, dilapidatedHouse: 0, status: "warning" },
  { code: "THON_BINHLOI", name: "Thôn Bình Lợi", leader: "Tạ Quang Bửu", phone: "0912111017", members: 28, debt: "2.42 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 0, status: "good" },
  { code: "BUON_A", name: "Buôn A", leader: "Y Dhăm Mlô", phone: "0912111018", members: 26, debt: "2.25 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 1, status: "alert" },
  { code: "BUON_B", name: "Buôn B", leader: "Y Blô Kbuôr", phone: "0912111019", members: 25, debt: "2.18 tỷ", overdue: "4.3 triệu", hasOverdue: true, dilapidatedHouse: 1, status: "alert" },
  { code: "BUON_C", name: "Buôn C", leader: "Y Khen Niê", phone: "0912111020", members: 27, debt: "2.36 tỷ", overdue: "0 đ", hasOverdue: false, dilapidatedHouse: 1, status: "alert" },
];

// Phân bổ thời kỳ chiến đấu (Tremor Style)
const PERIOD_DATA = [
  { name: "Chiến Tranh Bảo Vệ Biên Giới Phía Bắc", count: 152, percent: 24.8, color: "bg-moss-green" },
  { name: "Chiến Tranh Bảo Vệ Biên Giới Tây Nam", count: 146, percent: 23.9, color: "bg-moss-green-light" },
  { name: "Kháng Chiến Chống Mỹ Cứu Nước", count: 138, percent: 22.5, color: "bg-flag-red" },
  { name: "Cựu Quân Nhân Thời Bình", count: 92, percent: 15.0, color: "bg-bronze-gold" },
  { name: "Làm Nhiệm Vụ Quốc Tế (Campuchia/Lào)", count: 84, percent: 13.7, color: "bg-amber-600" },
];

export default function AdminDashboardPage() {
  const [filterStatus, setFilterStatus] = useState<"all" | "overdue" | "housing">("all");

  const filteredHamlets = HAMLET_STATUS_DATA.filter((h) => {
    if (filterStatus === "overdue") return h.hasOverdue;
    if (filterStatus === "housing") return h.dilapidatedHouse > 0;
    return true;
  });

  const totalOverdueAmount = "31.3 triệu";
  const totalDilapidatedCount = HAMLET_STATUS_DATA.reduce((acc, h) => acc + h.dilapidatedHouse, 0);

  return (
    <div className="space-y-6">
      {/* Tiêu đề điều hành */}
      <div className="pb-3 border-b border-stone-300">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-deep-text">
          ĐIỀU HÀNH, QUẢN LÝ NGHIỆP VỤ HỘI
        </h2>
        <p className="text-sm text-deep-muted mt-0.5">
          Dữ liệu giám sát 20 thôn buôn • Tỷ lệ nợ quá hạn kiểm soát an toàn: <strong className="text-moss-green">0,06%</strong>
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 1. BENTO GRID: 4 CARD SỐ LIỆU CỐT LÕI                                */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hội Viên */}
        <div className="bg-white p-5 rounded-xl border-2 border-stone-300 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-moss-green">
              Hội Viên Toàn Xã
            </span>
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-moss-green flex items-center justify-center text-sm font-bold">
              👥
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-deep-text">
              612
            </span>
            <span className="text-xs font-semibold text-deep-muted">đồng chí</span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Đạt 100% chỉ tiêu kết nạp • 186 Đảng viên (30.4%)
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-moss-green"></div>
        </div>

        {/* Card 2: 20 Chi Hội */}
        <div className="bg-white p-5 rounded-xl border-2 border-stone-300 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-moss-green">
              Chi Hội Cơ Sở
            </span>
            <span className="w-8 h-8 rounded-full bg-amber-100 text-bronze-gold flex items-center justify-center text-sm font-bold">
              🏘️
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-deep-text">
              20
            </span>
            <span className="text-xs font-semibold text-deep-muted">thôn, buôn</span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            13 Thôn số • 4 Thôn truyền thống • 3 Buôn đồng bào
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-bronze-gold"></div>
        </div>

        {/* Card 3: Vốn Vay NHCSXH */}
        <div className="bg-white p-5 rounded-xl border-2 border-stone-300 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-flag-red">
              Dư Nợ Vốn Vay NHCSXH
            </span>
            <span className="w-8 h-8 rounded-full bg-red-100 text-flag-red flex items-center justify-center text-sm font-bold">
              🏦
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-flag-red">
              52,18
            </span>
            <span className="text-xs font-semibold text-deep-muted">tỷ đồng</span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            20 Tổ TK&VV • Nợ quá hạn an toàn: <strong>0,06%</strong> ({totalOverdueAmount})
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-flag-red"></div>
        </div>

        {/* Card 4: Quỹ Nội Bộ */}
        <div className="bg-white p-5 rounded-xl border-2 border-stone-300 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-bronze-gold">
              Quỹ Nghĩa Tình Đồng Đội
            </span>
            <span className="w-8 h-8 rounded-full bg-amber-100 text-bronze-gold flex items-center justify-center text-sm font-bold">
              💰
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-bronze-gold">
              1,30
            </span>
            <span className="text-xs font-semibold text-deep-muted">tỷ đồng</span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Cho vay quay vòng <strong>0%</strong> • Đã giải ngân: 180 triệu
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. BIỂU ĐỒ TREMOR: PHÂN BỔ THỜI KỲ CHIẾN ĐẤU & CHÍNH SÁCH            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Biểu đồ phân bổ 5 thời kỳ */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border-2 border-stone-300 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <div>
              <h3 className="text-base font-bold text-deep-text uppercase">
                Phân Bổ 612 Hội Viên Theo Thời Kỳ Chiến Đấu
              </h3>
              <p className="text-xs text-deep-muted">
                Thống kê chuẩn hóa theo hồ sơ quản trị Mẫu 02
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-stone-100 font-bold text-moss-green">
              Tổng: 612 đ/c
            </span>
          </div>

          {/* Thanh biểu đồ Tremor Bar Chart */}
          <div className="space-y-3.5 pt-1">
            {PERIOD_DATA.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-deep-text">{item.name}</span>
                  <span className="text-deep-muted">
                    <strong className="text-deep-text">{item.count}</strong> đ/c ({item.percent}%)
                  </span>
                </div>
                <div className="w-full bg-stone-100 h-3.5 rounded-md overflow-hidden flex">
                  <div
                    className={`${item.color} h-full transition-all duration-500 rounded-md`}
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-stone-50 rounded border border-stone-200">
              <span className="text-deep-muted block text-[11px]">Thương binh</span>
              <strong className="text-flag-red text-sm">88 đ/c</strong>
            </div>
            <div className="p-2 bg-stone-50 rounded border border-stone-200">
              <span className="text-deep-muted block text-[11px]">Bệnh binh</span>
              <strong className="text-bronze-gold text-sm">47 đ/c</strong>
            </div>
            <div className="p-2 bg-stone-50 rounded border border-stone-200">
              <span className="text-deep-muted block text-[11px]">Nhiễm Da cam</span>
              <strong className="text-amber-700 text-sm">36 đ/c</strong>
            </div>
          </div>
        </div>

        {/* Khối Cảnh Báo Trọng Tâm Xã Ea Súp */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border-2 border-stone-300 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-2 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-flag-red uppercase flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Cảnh Báo Điều Hành Nóng</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 text-flag-red font-bold">
                Thường Trực Xử Lý
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {/* Cảnh báo 1: Nhà dột nát */}
              <div className="p-3 bg-red-50 border-l-4 border-flag-red rounded-r space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-flag-red">
                  <span>🏠 XÓA NHÀ TẠM DỘT NÁT (5 HỘ)</span>
                  <span>Cần hỗ trợ</span>
                </div>
                <p className="text-xs text-stone-700">
                  Địa bàn: <strong>Buôn A, Buôn B, Buôn C, Thôn 3, Thôn 11</strong> có 5 hộ CCB khó khăn về nhà ở cần phối hợp xóa nhà tạm trong năm 2026.
                </p>
              </div>

              {/* Cảnh báo 2: Nợ quá hạn NHCSXH */}
              <div className="p-3 bg-amber-50 border-l-4 border-bronze-gold rounded-r space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-bronze-gold">
                  <span>📉 NỢ QUÁ HẠN 6 TỔ TK&VV</span>
                  <span>31,3 triệu</span>
                </div>
                <p className="text-xs text-stone-700">
                  Tổng nợ quá hạn: <strong>31.308.000 đ</strong> (chiếm 0,06% tổng dư nợ 52,18 tỷ). Đề nghị Chi hội trưởng Thôn 1, 3, 7, 12, Đoàn Kết, Buôn B tích cực đôn đốc.
                </p>
              </div>

              {/* Cảnh báo 3: Thu quỹ tháng 3/2026 */}
              <div className="p-3 bg-emerald-50 border-l-4 border-moss-green rounded-r space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-moss-green">
                  <span>💰 TIẾN ĐỘ THU HỘI PHÍ THÁNG 3</span>
                  <span>Đạt 88.5%</span>
                </div>
                <p className="text-xs text-stone-700">
                  Đã thu: <strong>542/612</strong> hội viên. Còn 70 đồng chí cần Chi hội trưởng nhắc nhở hoàn thành trong kỳ sinh hoạt chi hội quý I.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex gap-2">
            <Link
              href="/admin/members"
              className="flex-1 py-2.5 bg-moss-green hover:bg-moss-green-light text-white text-xs font-bold rounded text-center transition"
            >
              Tra Cứu Chi Tiết Hội Viên
            </Link>
            <button
              onClick={() => alert("Đã xuất báo cáo gửi Đảng ủy & UBND Xã Ea Súp!")}
              className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-deep-text text-xs font-bold rounded border border-stone-300 transition"
            >
              Xuất Báo Cáo
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. BẢN ĐỒ TRẠNG THÁI 20 THÔN BUÔN                                   */}
      {/* ==================================================================== */}
      <div className="bg-white p-5 rounded-xl border-2 border-stone-300 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-deep-text uppercase">
              Bản Đồ Trạng Thái 20 Thôn, Buôn Xã Ea Súp
            </h3>
            <p className="text-xs text-deep-muted">
              Theo dõi trực tiếp quân số, dư nợ NHCSXH, nợ quá hạn và hoàn cảnh nhà ở từng địa bàn
            </p>
          </div>

          {/* Nút lọc nhanh trạng thái */}
          <div className="flex gap-1.5 self-start sm:self-auto text-xs font-bold">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === "all"
                  ? "bg-moss-green text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 border border-stone-300"
              }`}
            >
              Tất cả (20)
            </button>
            <button
              onClick={() => setFilterStatus("overdue")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === "overdue"
                  ? "bg-bronze-gold text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 border border-stone-300"
              }`}
            >
              Có nợ quá hạn (6)
            </button>
            <button
              onClick={() => setFilterStatus("housing")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === "housing"
                  ? "bg-flag-red text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 border border-stone-300"
              }`}
            >
              Có nhà dột nát ({totalDilapidatedCount})
            </button>
          </div>
        </div>

        {/* Lưới 20 thôn buôn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredHamlets.map((h) => (
            <div
              key={h.code}
              className={`p-3.5 rounded-xl border-2 transition hover:shadow-md space-y-2 ${
                h.dilapidatedHouse > 0
                  ? "bg-red-50/60 border-flag-red/80"
                  : h.hasOverdue
                  ? "bg-amber-50/60 border-bronze-gold/80"
                  : "bg-white border-stone-300 hover:border-moss-green"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-deep-text">
                  {h.name}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    h.dilapidatedHouse > 0
                      ? "bg-flag-red text-white"
                      : h.hasOverdue
                      ? "bg-bronze-gold text-white"
                      : "bg-emerald-100 text-moss-green"
                  }`}
                >
                  {h.dilapidatedHouse > 0
                    ? `Nhà dột nát (${h.dilapidatedHouse})`
                    : h.hasOverdue
                    ? "Có nợ quá hạn"
                    : "An toàn"}
                </span>
              </div>

              <div className="text-xs text-deep-muted space-y-1">
                <div className="flex justify-between">
                  <span>Chi hội trưởng:</span>
                  <strong className="text-deep-text">{h.leader}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Quân số:</span>
                  <span>{h.members} đ/c</span>
                </div>
                <div className="flex justify-between">
                  <span>Dư nợ NHCSXH:</span>
                  <span className="font-semibold text-moss-green">{h.debt}</span>
                </div>
                {h.hasOverdue && (
                  <div className="flex justify-between text-flag-red font-bold">
                    <span>Nợ quá hạn:</span>
                    <span>{h.overdue}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px]">
                <a
                  href={`tel:${h.phone}`}
                  className="font-bold text-moss-green hover:underline flex items-center gap-1"
                >
                  📞 {h.phone}
                </a>
                <Link
                  href="/admin/members"
                  className="text-stone-500 hover:text-moss-green"
                >
                  Xem hội viên →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
