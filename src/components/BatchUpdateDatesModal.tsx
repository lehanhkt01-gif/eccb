"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { EA_SUP_HAMLETS } from "@/lib/constants/hamlets";
import { MemberRecord, getStoredMembers, updateStoredMember } from "@/lib/memberStore";

interface BatchUpdateDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCount: number, hamletName: string) => void;
  initialHamlet?: string;
}

interface MemberDateRow {
  id: string;
  cccd: string;
  fullName: string;
  hamletName: string;
  associationRole: string;
  birthDate: string;
  associationJoinDate: string;
  originalBirthDate: string;
  originalAssociationJoinDate: string;
  isModified: boolean;
}

export default function BatchUpdateDatesModal({
  isOpen,
  onClose,
  onSuccess,
  initialHamlet,
}: BatchUpdateDatesModalProps) {
  const [selectedHamlet, setSelectedHamlet] = useState<string>(initialHamlet || "all");
  const [memberRows, setMemberRows] = useState<MemberDateRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickJoinDate, setQuickJoinDate] = useState("19/05/2015");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nạp danh sách hội viên khi mở modal hoặc đổi thôn buôn
  useEffect(() => {
    if (!isOpen) return;

    const allMembers = getStoredMembers().filter((m) => !m.isDeleted);
    const rows: MemberDateRow[] = allMembers.map((m) => {
      const bDate = m.birthDate || (m.birthYear ? `01/01/${m.birthYear}` : "");
      const jDate = m.associationJoinDate || "";
      return {
        id: m.id,
        cccd: m.cccd,
        fullName: m.fullName,
        hamletName: m.hamletName,
        associationRole: m.associationRole || "Hội viên",
        birthDate: bDate,
        associationJoinDate: jDate,
        originalBirthDate: bDate,
        originalAssociationJoinDate: jDate,
        isModified: false,
      };
    });

    setMemberRows(rows);
    if (initialHamlet && initialHamlet !== "all") {
      setSelectedHamlet(initialHamlet);
    }
  }, [isOpen, initialHamlet]);

  // Lọc theo Thôn/Buôn và tìm kiếm
  const filteredRows = useMemo(() => {
    return memberRows.filter((r) => {
      if (selectedHamlet !== "all" && r.hamletName !== selectedHamlet) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.fullName.toLowerCase().includes(q);
        const matchCccd = r.cccd.includes(q);
        if (!matchName && !matchCccd) return false;
      }
      return true;
    });
  }, [memberRows, selectedHamlet, searchQuery]);

  // Đếm số dòng đã chỉnh sửa
  const modifiedCount = useMemo(() => {
    return memberRows.filter((r) => r.isModified).length;
  }, [memberRows]);

  if (!isOpen) return null;

  // Cập nhật ngày sinh cho 1 dòng
  const handleBirthDateChange = (id: string, val: string) => {
    setMemberRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isMod = val !== r.originalBirthDate || r.associationJoinDate !== r.originalAssociationJoinDate;
          return { ...r, birthDate: val, isModified: isMod };
        }
        return r;
      })
    );
  };

  // Cập nhật ngày vào hội cho 1 dòng
  const handleJoinDateChange = (id: string, val: string) => {
    setMemberRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isMod = r.birthDate !== r.originalBirthDate || val !== r.originalAssociationJoinDate;
          return { ...r, associationJoinDate: val, isModified: isMod };
        }
        return r;
      })
    );
  };

  // Áp dụng ngày vào hội nhanh cho tất cả ai đang trống trong danh sách đang xem
  const handleApplyQuickJoinDate = () => {
    if (!quickJoinDate.trim()) {
      alert("Vui lòng nhập Ngày vào hội để áp dụng nhanh (Ví dụ: 19/05/2015)");
      return;
    }

    const currentFilterIds = new Set(filteredRows.map((r) => r.id));
    let count = 0;

    setMemberRows((prev) =>
      prev.map((r) => {
        if (currentFilterIds.has(r.id) && !r.associationJoinDate.trim()) {
          count++;
          return {
            ...r,
            associationJoinDate: quickJoinDate.trim(),
            isModified: true,
          };
        }
        return r;
      })
    );

    setToastMsg(`✓ Đã điền nhanh ngày vào hội cho ${count} đồng chí đang trống!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Xuất file Excel danh sách thôn để điền offline
  const handleExportHamletTemplate = () => {
    try {
      const dataToExport = filteredRows.map((r, idx) => ({
        STT: idx + 1,
        "Họ và tên": r.fullName,
        "Số CCCD": r.cccd,
        "Chi hội Thôn/Buôn": r.hamletName,
        "Chức vụ": r.associationRole,
        "Ngày sinh (DD/MM/YYYY)": r.birthDate,
        "Ngày vào Hội CCB (DD/MM/YYYY)": r.associationJoinDate,
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      ws["!cols"] = [
        { wch: 6 },
        { wch: 22 },
        { wch: 18 },
        { wch: 20 },
        { wch: 16 },
        { wch: 24 },
        { wch: 26 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DanhSachCapNhat");
      const hamletLabel = selectedHamlet !== "all" ? selectedHamlet.replace(/\s+/g, "_") : "Toan_Xa";
      XLSX.writeFile(wb, `Cap_Nhat_Ngay_Sinh_Vao_Hoi_${hamletLabel}.xlsx`);
    } catch (e: any) {
      alert("Lỗi xuất file Excel: " + e.message);
    }
  };

  // Nhập file Excel để tự động điền vào bảng
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(firstSheet);

      if (rawRows.length === 0) {
        alert("File không chứa dòng dữ liệu nào.");
        return;
      }

      // Tạo map đối chiếu theo CCCD hoặc Họ tên + Thôn
      const excelMap = new Map<string, { birthDate?: string; joinDate?: string }>();

      for (const r of rawRows) {
        const cccd = String(r["Số CCCD"] || r["CCCD"] || "").replace(/[^0-9]/g, "").padStart(12, "0");
        const bDate = String(r["Ngày sinh (DD/MM/YYYY)"] || r["Ngày sinh"] || r["Ngay sinh"] || "").trim();
        const jDate = String(r["Ngày vào Hội CCB (DD/MM/YYYY)"] || r["Ngày vào Hội"] || r["Ngày vào hội"] || r["Vào Hội"] || "").trim();

        if (cccd && cccd !== "000000000000") {
          excelMap.set(cccd, { birthDate: bDate, joinDate: jDate });
        }
      }

      let matchCount = 0;
      setMemberRows((prev) =>
        prev.map((r) => {
          const match = excelMap.get(r.cccd);
          if (match) {
            matchCount++;
            const newB = match.birthDate || r.birthDate;
            const newJ = match.joinDate || r.associationJoinDate;
            const isMod = newB !== r.originalBirthDate || newJ !== r.originalAssociationJoinDate;
            return {
              ...r,
              birthDate: newB,
              associationJoinDate: newJ,
              isModified: isMod,
            };
          }
          return r;
        })
      );

      setToastMsg(`✓ Đã nạp thành công dữ liệu đối chiếu cho ${matchCount} đồng chí từ file Excel!`);
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: any) {
      alert("Lỗi đọc file: " + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Lưu toàn bộ các dòng đã chỉnh sửa vào CSDL PostgreSQL và LocalStore
  const handleSaveAll = async () => {
    const modifiedRows = memberRows.filter((r) => r.isModified);
    if (modifiedRows.length === 0) {
      alert("Chưa có thông tin nào được thay đổi để lưu.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Gửi request cập nhật đồng loạt sang backend API PostgreSQL
      const payload = modifiedRows.map((r) => ({
        id: r.id,
        cccd: r.cccd,
        birthDate: r.birthDate.trim(),
        associationJoinDate: r.associationJoinDate.trim(),
      }));

      const res = await fetch("/api/admin/members/batch-update-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: payload }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Lỗi lưu CSDL máy chủ");
      }

      // 2. Cập nhật vào Store
      for (const r of modifiedRows) {
        updateStoredMember(r.id, {
          birthDate: r.birthDate.trim(),
          associationJoinDate: r.associationJoinDate.trim(),
        }, r.cccd);
      }

      // 3. Kích hoạt sự kiện toàn cục
      window.dispatchEvent(new Event("eccb-members-updated"));

      const hamletLabel = selectedHamlet !== "all" ? selectedHamlet : "toàn xã";
      onSuccess(modifiedRows.length, hamletLabel);
      onClose();
    } catch (e: any) {
      console.error("Lỗi khi lưu đồng loạt ngày tháng:", e);
      alert(`⚠️ Không thể lưu: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-cream-bg rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-stone-300 overflow-hidden text-deep-text">
        {/* HEADER QUÂN ĐỘI */}
        <div className="bg-moss-green text-white px-5 py-3.5 flex items-center justify-between border-b-4 border-bronze-gold shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📅</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                Cập Nhật Đồng Loạt Ngày Sinh & Ngày Vào Hội Theo Thôn/Buôn
              </h2>
              <p className="text-xs text-amber-200">
                Nhập liệu trực tiếp, điền nhanh cả thôn hoặc đồng bộ đối chiếu từ file Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* THANH ĐIỀU HƯỚNG & CÔNG CỤ NHANH */}
        <div className="p-3 sm:p-4 bg-white border-b border-stone-300 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Bộ chọn Thôn/Buôn */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-moss-green uppercase shrink-0">
                🏘️ Chi Hội:
              </label>
              <select
                value={selectedHamlet}
                onChange={(e) => setSelectedHamlet(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-lg font-bold text-deep-text focus:outline-none focus:ring-2 focus:ring-moss-green cursor-pointer"
              >
                <option value="all">-- Toàn xã (Tất cả 20 Chi hội) --</option>
                {EA_SUP_HAMLETS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Ô tìm kiếm hội viên */}
            <div className="flex-1 min-w-[200px] max-w-xs">
              <input
                type="text"
                placeholder="🔍 Tìm tên hoặc số CCCD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-green"
              />
            </div>

            {/* Các nút tiện ích Excel */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportHamletTemplate}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Xuất file Excel danh sách chi hội này để nhập offline"
              >
                <span>📊</span>
                <span>Xuất File Thôn</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Tải file Excel vừa điền để tự động nạp vào bảng"
              >
                <span>📥</span>
                <span>Nạp Từ Excel</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleImportExcel}
                className="hidden"
              />
            </div>
          </div>

          {/* Dòng áp dụng nhanh ngày vào hội cho cả thôn */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-amber-50/80 rounded-lg border border-amber-300 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-950">⚡ Áp dụng nhanh Ngày vào Hội cho người chưa có:</span>
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={quickJoinDate}
                onChange={(e) => setQuickJoinDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-amber-400 rounded font-bold text-amber-900 w-28 text-center text-xs"
              />
              <button
                type="button"
                onClick={handleApplyQuickJoinDate}
                className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded transition cursor-pointer shadow-2xs"
              >
                Điền Nhanh
              </button>
            </div>

            <div className="text-[11px] font-semibold text-stone-600">
              Đang hiển thị: <span className="font-bold text-moss-green">{filteredRows.length}</span> hội viên | 
              Đã sửa: <span className="font-bold text-flag-red">{modifiedCount}</span> dòng
            </div>
          </div>

          {toastMsg && (
            <div className="p-2 bg-emerald-100 border border-emerald-400 text-emerald-900 rounded-lg text-xs font-bold text-center animate-in fade-in">
              {toastMsg}
            </div>
          )}
        </div>

        {/* BẢNG TÁC NGHIỆP TRỰC TIẾP */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="overflow-x-auto rounded-xl border border-stone-300 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-300 sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Họ và Tên</th>
                  <th className="py-2.5 px-3 w-36">Số CCCD</th>
                  <th className="py-2.5 px-3 w-32">Chi hội</th>
                  <th className="py-2.5 px-3 w-40 text-moss-green">Ngày sinh (DD/MM/YYYY) *</th>
                  <th className="py-2.5 px-3 w-40 text-amber-800">Ngày vào Hội CCB *</th>
                  <th className="py-2.5 px-3 w-28 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500 italic">
                      Không tìm thấy hội viên nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, idx) => {
                    const isComplete = Boolean(r.birthDate.trim() && r.associationJoinDate.trim());
                    return (
                      <tr
                        key={r.id}
                        className={`transition hover:bg-stone-50 ${
                          r.isModified ? "bg-amber-50/70" : ""
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-mono text-stone-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-bold text-deep-text">
                          <div className="flex items-center gap-1.5">
                            <span>{r.fullName}</span>
                            {r.associationRole === "Chi hội trưởng" && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded border border-amber-300 font-bold">
                                ⭐ CHT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono text-stone-600">{r.cccd}</td>
                        <td className="py-2 px-3 text-moss-green font-semibold">{r.hamletName}</td>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={r.birthDate}
                            onChange={(e) => handleBirthDateChange(r.id, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-stone-300 rounded font-semibold text-deep-text focus:outline-none focus:ring-1 focus:ring-moss-green bg-white"
                          />
                        </td>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={r.associationJoinDate}
                            onChange={(e) => handleJoinDateChange(r.id, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-stone-300 rounded font-semibold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-600 bg-white"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {r.isModified ? (
                            <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded animate-pulse">
                              ✏️ Đã sửa
                            </span>
                          ) : isComplete ? (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded">
                              ✓ Đầy đủ
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 font-bold text-[10px] rounded">
                              ⚠️ Còn thiếu
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER BẢO TRỢ & NÚT LƯU */}
        <div className="bg-stone-100 px-5 py-3 border-t border-stone-300 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-600 font-medium">
            * Dữ liệu được lưu vĩnh viễn trực tiếp vào CSDL PostgreSQL và đồng bộ toàn hệ thống.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-white hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-lg border border-stone-300 transition cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || modifiedCount === 0}
              className={`px-5 py-2 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                modifiedCount > 0 && !isSaving
                  ? "bg-moss-green hover:bg-moss-green-light active:scale-95"
                  : "bg-stone-400 cursor-not-allowed opacity-70"
              }`}
            >
              <span>{isSaving ? "⏳ Đang Lưu..." : "💾"}</span>
              <span>Lưu Cập Nhật ({modifiedCount} hồ sơ)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
