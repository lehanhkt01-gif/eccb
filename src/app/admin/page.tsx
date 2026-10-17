"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getStoredMembers, saveStoredMembers, MemberRecord } from "@/lib/memberStore";
import ExportReportModal from "@/components/ExportReportModal";
import { classifyCombatPeriod, classifyPolicyStatus, COMBAT_PERIODS } from "@/lib/memberClassifiers";

// 20 Thôn, Buôn xã Ea Súp với danh sách 20 Chi hội trưởng chuẩn xác thực tế
const BASE_HAMLETS = [
  { code: "BUON_A", name: "Buôn A", leader: "Y Nô Rcăm", phone: "0982257421" },
  { code: "BUON_B", name: "Buôn B", leader: "Đoàn Hữu Tiến", phone: "0935833737" },
  { code: "BUON_C", name: "Buôn C", leader: "Y Dyơng Êban", phone: "0839931193" },
  { code: "THON_HOABINH", name: "Thôn Hòa Bình", leader: "Lê Văn Hồng", phone: "0977979709" },
  { code: "THON_THANGLOI", name: "Thôn Thắng Lợi", leader: "Nguyễn Văn Đông", phone: "0828838929" },
  { code: "THON_DOANKET", name: "Thôn Đoàn Kết", leader: "Nguyễn Văn Sơn", phone: "0913779468" },
  { code: "THON_BINHLOI", name: "Thôn Bình Lợi", leader: "Lục Văn Cường", phone: "0338561794" },
  { code: "THON_01", name: "Thôn 1", leader: "Hồ Sỹ Tuấn", phone: "0986042302" },
  { code: "THON_02", name: "Thôn 2", leader: "Nguyễn Đức Lợi", phone: "0356912318" },
  { code: "THON_03", name: "Thôn 3", leader: "Nguyễn Văn Dũng", phone: "0342302292" },
  { code: "THON_04", name: "Thôn 4", leader: "Nguyễn Phú Bốn", phone: "0367875231" },
  { code: "THON_05", name: "Thôn 5", leader: "Vũ Văn Đạt", phone: "0327560358" },
  { code: "THON_06", name: "Thôn 6", leader: "Đỗ Thị Lan", phone: "0343800948" },
  { code: "THON_07", name: "Thôn 7", leader: "Nguyễn Văn Minh", phone: "0975384025" },
  { code: "THON_08", name: "Thôn 8", leader: "Trần Thanh Hùng", phone: "0397508052" },
  { code: "THON_09", name: "Thôn 9", leader: "Trần Văn Cảnh", phone: "0342869974" },
  { code: "THON_10", name: "Thôn 10", leader: "Nguyễn Lai", phone: "0986911610" },
  { code: "THON_11", name: "Thôn 11", leader: "Huỳnh Công Dũng", phone: "0359326437" },
  { code: "THON_12", name: "Thôn 12", leader: "Triệu Đức Quyên", phone: "0857603535" },
  { code: "THON_13", name: "Thôn 13", leader: "Hoàng Văn Tuyên", phone: "0984594812" },
];

export default function AdminDashboardPage() {
  const [filterStatus, setFilterStatus] = useState<"all" | "overdue" | "housing">("all");
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // 1. Nạp nhanh từ bộ nhớ đệm
    const list = getStoredMembers();
    setMembers(list);

    // 2. Tải trực tiếp 100% từ CSDL PostgreSQL của máy chủ VPS
    const loadFromDb = async () => {
      try {
        const res = await fetch("/api/admin/members", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.members) && data.members.length > 0) {
            setMembers(data.members);
            saveStoredMembers(data.members);
          }
        }
      } catch (err) {
        console.warn("Không kết nối được API CSDL, dùng dữ liệu đệm:", err);
      }
    };

    loadFromDb();

    const handleUpdate = () => {
      const updated = getStoredMembers();
      setMembers(updated);
      loadFromDb();
    };

    window.addEventListener("eccb-members-updated", handleUpdate);
    return () => {
      window.removeEventListener("eccb-members-updated", handleUpdate);
    };
  }, []);

  const totalMembers = members.length;
  const partyMembersCount = members.filter((m) => Boolean(m.partyJoinDate)).length;
  const partyPercent = totalMembers > 0 ? ((partyMembersCount / totalMembers) * 100).toFixed(1) : "0.0";

  const totalLoanAmount = members.reduce((sum, m) => sum + (m.totalDebt || 0), 0);
  const totalLoanStr = totalLoanAmount > 0
    ? `${(totalLoanAmount / 1_000_000_000).toFixed(2)} tỷ`
    : "0 đ";

  // Thống kê từng thôn từ danh sách hội viên thực tế
  const hamletStats = BASE_HAMLETS.map((h) => {
    const hamletMembers = members.filter((m) => {
      const hName = (m.hamletName || "").toLowerCase();
      const targetName = h.name.toLowerCase();
      return hName.includes(targetName) || targetName.includes(hName);
    });

    const debt = hamletMembers.reduce((sum, m) => sum + (m.totalDebt || 0), 0);
    const dilapidated = hamletMembers.filter((m) => m.hasDilapidatedHouse).length;

    return {
      ...h,
      members: hamletMembers.length,
      debt: debt > 0 ? `${(debt / 1_000_000).toFixed(1)} triệu` : "0 đ",
      overdue: "0 đ",
      hasOverdue: false,
      dilapidatedHouse: dilapidated,
      status: "good" as const,
    };
  });

  const filteredHamlets = hamletStats.filter((h) => {
    if (filterStatus === "overdue") return h.hasOverdue;
    if (filterStatus === "housing") return h.dilapidatedHouse > 0;
    return true;
  });

  // Phân bổ thời kỳ chiến đấu từ hồ sơ hội viên (chuẩn hóa đồng bộ 100% từ hồ sơ Mẫu 02)
  const periodDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      BIEN_GIOI_BAC: 0,
      TAY_NAM: 0,
      CHONG_MY: 0,
      CUU_QUAN_NHAN: 0,
      QUOC_TE: 0,
    };

    members.forEach((m) => {
      const key = classifyCombatPeriod(m);
      counts[key] = (counts[key] || 0) + 1;
    });

    return COMBAT_PERIODS.map((item) => ({
      key: item.key,
      name: item.name,
      count: counts[item.key] || 0,
      color: item.color,
    }));
  }, [members]);

  // Thống kê chính sách người có công (Thương binh, Bệnh binh, Da cam)
  const { woundedCount, sickCount, agentOrangeCount } = useMemo(() => {
    let wounded = 0;
    let sick = 0;
    let orange = 0;

    members.forEach((m) => {
      const p = classifyPolicyStatus(m);
      if (p.isWounded) wounded++;
      if (p.isSick) sick++;
      if (p.isAgentOrange) orange++;
    });

    return {
      woundedCount: wounded,
      sickCount: sick,
      agentOrangeCount: orange,
    };
  }, [members]);

  return (
    <div className="space-y-6">
      {/* Tiêu đề điều hành */}
      <div className="pb-3 border-b border-stone-300">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-deep-text">
          ĐIỀU HÀNH, QUẢN LÝ NGHIỆP VỤ HỘI
        </h2>
        <p className="text-sm text-deep-muted mt-0.5">
          Dữ liệu giám sát 20 thôn buôn • Tình hình hoạt động: <strong className="text-moss-green">An Toàn &amp; Ổn Định</strong>
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 1. BENTO GRID: 4 CARD SỐ LIỆU THỰC TẾ                                */}
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
              {totalMembers}
            </span>
            <span className="text-xs font-semibold text-deep-muted">đồng chí</span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            {partyMembersCount > 0 ? `${partyMembersCount} Đảng viên (${partyPercent}%)` : "Hồ sơ số hóa quản trị Mẫu 02"}
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
              0 đ
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Chưa phát sinh dư nợ trong kỳ
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
              0 đ
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Chưa phát sinh thu nộp trong kỳ
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. BIỂU ĐỒ TREMOR & BẢNG ĐIỀU HÀNH THỰC TẾ                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Biểu đồ phân bổ 5 thời kỳ */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border-2 border-stone-300 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
            <div>
              <h3 className="text-base font-bold text-deep-text uppercase">
                Phân Bổ Hội Viên Theo Thời Kỳ Chiến Đấu
              </h3>
              <p className="text-xs text-deep-muted">
                Thống kê chuẩn hóa theo hồ sơ quản trị Mẫu 02
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded bg-stone-100 font-bold text-moss-green">
                Tổng: {totalMembers} đ/c
              </span>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-moss-green hover:bg-moss-green-light text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Xuất file Excel báo cáo thống kê theo các trường thông tin có dấu tích"
              >
                <span>📊</span>
                <span>Xuất Báo Cáo Excel</span>
              </button>
            </div>
          </div>

          {/* Thanh biểu đồ Tremor Bar Chart */}
          <div className="space-y-3.5 pt-1">
            {periodDistribution.map((item, idx) => {
              const pct = totalMembers > 0 ? ((item.count / totalMembers) * 100).toFixed(1) : "0.0";
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-deep-text">{item.name}</span>
                    <span className="text-deep-muted">
                      <strong className="text-deep-text">{item.count}</strong> đ/c ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-3.5 rounded-md overflow-hidden flex">
                    <div
                      className={`${item.color} h-full transition-all duration-500 rounded-md`}
                      style={{ width: `${Math.max(Number(pct), 2)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-stone-50 rounded border border-stone-200">
              <span className="text-deep-muted block text-[11px]">Thương binh</span>
              <strong className="text-flag-red text-sm">{woundedCount} đ/c</strong>
            </div>
            <div className="p-2 bg-stone-50 rounded border border-stone-200">
              <span className="text-deep-muted block text-[11px]">Bệnh binh</span>
              <strong className="text-bronze-gold text-sm">{sickCount} đ/c</strong>
            </div>
            <div className="p-2 bg-stone-50 rounded border border-stone-200">
              <span className="text-deep-muted block text-[11px]">Nhiễm Da cam</span>
              <strong className="text-amber-700 text-sm">{agentOrangeCount} đ/c</strong>
            </div>
          </div>
        </div>

        {/* Khối Cảnh Báo Trọng Tâm Xã Ea Súp */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border-2 border-stone-300 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-2 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-moss-green uppercase flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Tình Hình Hoạt Động Điều Hành</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Bình Thường
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {/* Mục 1: Tài chính & vốn vay */}
              <div className="p-3 bg-emerald-50 border-l-4 border-moss-green rounded-r space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-moss-green">
                  <span>💰 TÀI CHÍNH &amp; VỐN VAY NHCSXH</span>
                  <span>An toàn 100%</span>
                </div>
                <p className="text-xs text-stone-700">
                  Không ghi nhận nợ quá hạn. Sổ quỹ nội bộ và vốn vay được quản lý theo đúng quy định.
                </p>
              </div>

              {/* Mục 2: Tổ chức chi hội */}
              <div className="p-3 bg-amber-50 border-l-4 border-bronze-gold rounded-r space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-bronze-gold">
                  <span>🏘️ 20 CHI HỘI TRƯỞNG CƠ SỞ</span>
                  <span>Đã kiện toàn</span>
                </div>
                <p className="text-xs text-stone-700">
                  20/20 thôn, buôn đã có Chi hội trưởng chuẩn hóa thực tế, sẵn sàng quản trị và điểm danh sinh hoạt chi hội.
                </p>
              </div>

              {/* Mục 3: Hồ sơ hội viên */}
              <div className="p-3 bg-blue-50 border-l-4 border-blue-600 rounded-r space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                  <span>📥 NHẬP HỒ SƠ ĐỒNG LOẠT (MẪU 02)</span>
                  <span>Sẵn sàng</span>
                </div>
                <p className="text-xs text-stone-700">
                  Hệ thống hỗ trợ nhập đồng loạt file Excel/CSV 27 cột theo mẫu chuẩn của Hội CCB tỉnh Đắk Lắk.
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
            <Link
              href="/admin/funds"
              className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-deep-text text-xs font-bold rounded border border-stone-300 transition text-center"
            >
              Sổ Quỹ
            </Link>
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
              Có nợ quá hạn (0)
            </button>
            <button
              onClick={() => setFilterStatus("housing")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === "housing"
                  ? "bg-flag-red text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 border border-stone-300"
              }`}
            >
              Có nhà dột nát (0)
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
      {/* Modal Xuất Báo Cáo Thống Kê Chi Tiết Tùy Chọn Trường Thông Tin */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        members={members}
      />
    </div>
  );
}
