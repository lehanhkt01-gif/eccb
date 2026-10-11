"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import {
  MemberRecord,
  getStoredMembers,
  getStoredMovements,
  MemberMovementRecord,
  approveMember,
  rejectMember,
  updateStoredMember,
  HAMLET_LIST,
} from "@/lib/memberStore";

export default function AdminMembersPage() {
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "rejected" | "movements">("active");
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [movements, setMovements] = useState<MemberMovementRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHamlet, setSelectedHamlet] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedPolicy, setSelectedPolicy] = useState("all");
  const [isPartyFilter, setIsPartyFilter] = useState("all");
  const [isHousingFilter, setIsHousingFilter] = useState("all");

  const [activeModalMember, setActiveModalMember] = useState<MemberRecord | null>(null);
  const [editingMember, setEditingMember] = useState<MemberRecord | null>(null);
  const [editTab, setEditTab] = useState<"personal" | "military" | "party" | "policy">("personal");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [memberToApprove, setMemberToApprove] = useState<MemberRecord | null>(null);
  const [memberToReject, setMemberToReject] = useState<MemberRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = () => {
    setMembers(getStoredMembers());
    setMovements(getStoredMovements());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("eccb-members-updated", handleUpdate);
    window.addEventListener("eccb-movements-updated", handleUpdate);
    return () => {
      window.removeEventListener("eccb-members-updated", handleUpdate);
      window.removeEventListener("eccb-movements-updated", handleUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Các danh sách phân loại
  const activeMembers = useMemo(() => members.filter((m) => m.status === "ACTIVE"), [members]);
  const pendingMembers = useMemo(() => members.filter((m) => m.status === "PENDING_APPROVAL"), [members]);
  const rejectedMembers = useMemo(() => members.filter((m) => m.status === "REJECTED"), [members]);

  // Xử lý phê duyệt chính thức
  const handleConfirmApprove = () => {
    if (!memberToApprove) return;
    const ok = approveMember(memberToApprove.id);
    if (ok) {
      showToast(`✅ Đã phê duyệt chính thức đ/c ${memberToApprove.fullName} (${memberToApprove.hamletName}) vào danh sách hội viên xã!`);
      setMemberToApprove(null);
    }
  };

  // Xử lý từ chối hồ sơ
  const handleConfirmReject = () => {
    if (!memberToReject) return;
    const reason = rejectReason.trim() || "Hồ sơ chưa đủ điều kiện theo quy định của Hội";
    const ok = rejectMember(memberToReject.id, reason);
    if (ok) {
      showToast(`⚠️ Đã từ chối hồ sơ đ/c ${memberToReject.fullName}. Lý do: ${reason}`);
      setMemberToReject(null);
      setRejectReason("");
    }
  };

  // Khôi phục xét duyệt lại hồ sơ đã từ chối
  const handleRestorePending = (id: string, fullName: string) => {
    approveMember(id); // hoặc chuyển lại thành pending
    const currentList = getStoredMembers();
    const updated = currentList.map((m) => m.id === id ? { ...m, status: "PENDING_APPROVAL" as const, rejectionReason: undefined } : m);
    setMembers(updated);
    showToast(`🔄 Đã chuyển hồ sơ đ/c ${fullName} về trạng thái Chờ duyệt!`);
  };

  // Xử lý lưu chỉnh sửa 35 trường thông tin
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSavingEdit(true);
    try {
      const res = updateStoredMember(editingMember.id, editingMember);
      if (res) {
        showToast(`✅ Đã cập nhật thành công hồ sơ đ/c ${editingMember.fullName}!`);
        setEditingMember(null);
      } else {
        alert("Không tìm thấy hồ sơ để cập nhật.");
      }
    } catch (err) {
      console.error("Lỗi cập nhật hồ sơ:", err);
      alert("Đã xảy ra lỗi khi lưu hồ sơ.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Bộ lọc thông minh 35 trường thông tin áp dụng cho danh sách hội viên chính thức
  const filteredActiveMembers = useMemo(() => {
    const list = activeMembers.filter((m) => {
      // Tìm kiếm từ khóa
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchName = m.fullName.toLowerCase().includes(query);
        const matchCccd = m.cccd.includes(query);
        const matchPhone = m.phone.includes(query);
        if (!matchName && !matchCccd && !matchPhone) return false;
      }

      // Thôn buôn
      if (selectedHamlet !== "all" && m.hamletName !== selectedHamlet) return false;

      // Thời kỳ
      if (selectedPeriod !== "all" && m.period !== selectedPeriod) return false;

      // Chính sách
      if (selectedPolicy !== "all") {
        if (selectedPolicy === "yes" && m.policyStatus === "Không") return false;
        if (selectedPolicy === "no" && m.policyStatus !== "Không") return false;
        if (selectedPolicy !== "yes" && selectedPolicy !== "no" && !m.policyStatus.includes(selectedPolicy)) return false;
      }

      // Đảng viên
      if (isPartyFilter === "party" && !m.partyJoinDate) return false;
      if (isPartyFilter === "non-party" && m.partyJoinDate) return false;

      // Nhà tạm / Hộ nghèo
      if (isHousingFilter === "dilapidated" && !m.hasDilapidatedHouse) return false;
      if (isHousingFilter === "poor" && !m.isPoorHousehold && !m.isNearPoorHousehold) return false;
      if (isHousingFilter === "model" && !m.hasEconomicModel) return false;

      return true;
    });

    // Ưu tiên Chi hội trưởng đứng đầu danh sách trong từng thôn buôn / toàn xã
    return [...list].sort((a, b) => {
      const isLeaderA = a.associationRole === "Chi hội trưởng" ? 1 : 0;
      const isLeaderB = b.associationRole === "Chi hội trưởng" ? 1 : 0;
      if (isLeaderA !== isLeaderB) {
        return isLeaderB - isLeaderA;
      }
      return a.fullName.localeCompare(b.fullName, "vi");
    });
  }, [activeMembers, searchQuery, selectedHamlet, selectedPeriod, selectedPolicy, isPartyFilter, isHousingFilter]);

  // Bộ lọc cho hồ sơ chờ duyệt
  const filteredPendingMembers = useMemo(() => {
    return pendingMembers.filter((m) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        m.fullName.toLowerCase().includes(query) ||
        m.cccd.includes(query) ||
        m.phone.includes(query) ||
        m.hamletName.toLowerCase().includes(query)
      );
    });
  }, [pendingMembers, searchQuery]);

  // HÀM XUẤT FILE WORD (.DOCX) PHIẾU THÔNG TIN MẪU 02 CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP
  const exportDocx = async (m: MemberRecord) => {
    try {
      setIsExporting(true);

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: "Times New Roman",
                size: 24, // 12pt (chuẩn 12-14pt Nghị định 30)
                color: "000000",
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440, // 25mm chuẩn
                  bottom: 1440,
                  left: 1700, // 30mm lề trái
                  right: 1134, // 20mm lề phải
                },
              },
            },
            children: [
              // 1. Quốc Hiệu & Cơ Quan Ban Hành (Chuẩn NĐ 30/2020/NĐ-CP)
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  insideHorizontal: { style: BorderStyle.NONE },
                  insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 45, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "HỘI CCB TỈNH ĐẮK LẮK", bold: true, size: 22 }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "HỘI CCB XÃ EA SÚP", bold: true, size: 22 }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "Số: ......./P-CCB", italics: true, size: 20 }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 55, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 22 }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 22 }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "-----------------------", size: 18 }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({ text: "", spacing: { after: 200 } }),

              // 2. Tiêu Đề Văn Bản
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "PHIẾU THÔNG TIN HỘI VIÊN CỰU CHIẾN BINH",
                    bold: true,
                    size: 28, // 14pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "(Ban hành theo Hướng dẫn thực hiện Phiếu Mẫu 02 — Hội Cựu Chiến Binh Việt Nam)",
                    italics: true,
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),

              // 3. Khối I: Thông Tin Nhân Thân
              new Paragraph({
                children: [
                  new TextRun({ text: "I. THÔNG TIN ĐỊNH DANH & CÁ NHÂN", bold: true, size: 24 }),
                ],
                spacing: { before: 150, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "1. Họ và tên: ", bold: true }),
                  new TextRun({ text: m.fullName.toUpperCase(), bold: true }),
                  new TextRun({ text: "          2. Năm sinh: " }),
                  new TextRun({ text: `${m.birthYear}` }),
                  new TextRun({ text: "          3. Giới tính: " }),
                  new TextRun({ text: m.gender }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "4. Số định danh cá nhân (CCCD): ", bold: true }),
                  new TextRun({ text: m.cccd, bold: true }),
                  new TextRun({ text: "          5. Dân tộc: " }),
                  new TextRun({ text: m.ethnicity }),
                  new TextRun({ text: "          6. Tôn giáo: " }),
                  new TextRun({ text: m.religion }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "7. Quê quán: " }),
                  new TextRun({ text: m.hometown }),
                  new TextRun({ text: "          8. Số điện thoại: " }),
                  new TextRun({ text: m.phone }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "9. Nơi ở hiện nay: " }),
                  new TextRun({ text: m.currentAddress }),
                  new TextRun({ text: ` (${m.hamletName})` }),
                ],
                spacing: { after: 200 },
              }),

              // 4. Khối II: Quá Trình Quân Ngũ
              new Paragraph({
                children: [
                  new TextRun({ text: "II. QUÁ TRÌNH QUÂN NGŨ & PHỤC VỤ TỔ QUỐC", bold: true, size: 24 }),
                ],
                spacing: { before: 150, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "1. Ngày nhập ngũ: " }),
                  new TextRun({ text: m.enlistmentDate }),
                  new TextRun({ text: "          2. Ngày xuất ngũ: " }),
                  new TextRun({ text: m.dischargeDate }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "3. Cấp bậc cao nhất: " }),
                  new TextRun({ text: m.militaryRank, bold: true }),
                  new TextRun({ text: "          4. Chức vụ trong quân đội: " }),
                  new TextRun({ text: m.militaryPosition }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "5. Đơn vị phục vụ: " }),
                  new TextRun({ text: m.militaryUnit }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "6. Thời kỳ tham gia: " }),
                  new TextRun({ text: m.period, bold: true }),
                  new TextRun({ text: m.isCQN ? " (Đối tượng Cựu quân nhân)" : " (Hội viên CCB)" }),
                ],
                spacing: { after: 200 },
              }),

              // 5. Khối III: Công Tác Hội & Đảng
              new Paragraph({
                children: [
                  new TextRun({ text: "III. CÔNG TÁC HỘI CCB & XÂY DỰNG ĐẢNG", bold: true, size: 24 }),
                ],
                spacing: { before: 150, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "1. Ngày vào Hội CCB: " }),
                  new TextRun({ text: m.associationJoinDate }),
                  new TextRun({ text: "          2. Chức vụ trong Hội: " }),
                  new TextRun({ text: m.associationRole, bold: true }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "3. Đảng viên Đảng CSVN: " }),
                  new TextRun({ text: m.partyJoinDate ? `Có (Kết nạp: ${m.partyJoinDate})` : "Không" }),
                  new TextRun({ text: m.partyBadge ? ` — Huy hiệu Đảng: ${m.partyBadge}` : "" }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "4. Trình độ văn hóa: " }),
                  new TextRun({ text: m.educationLevel }),
                  new TextRun({ text: "     5. Lý luận chính trị: " }),
                  new TextRun({ text: m.politicalTheory }),
                  new TextRun({ text: "     6. Chuyên môn: " }),
                  new TextRun({ text: m.professionalSkill }),
                ],
                spacing: { after: 200 },
              }),

              // 6. Khối IV: Chính Sách & Khen Thưởng
              new Paragraph({
                children: [
                  new TextRun({ text: "IV. ĐỐI TƯỢNG CHÍNH SÁCH & KHEN THƯỞNG", bold: true, size: 24 }),
                ],
                spacing: { before: 150, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "1. Diện chính sách: " }),
                  new TextRun({ text: m.policyStatus, bold: true }),
                  new TextRun({ text: m.policyWoundRate ? ` (Tỷ lệ thương tật: ${m.policyWoundRate})` : "" }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "2. Thẻ BHYT 100%: " }),
                  new TextRun({ text: m.hasHealthInsurance100 ? `Được hưởng (${m.healthInsuranceCode || "Đang cấp mã"})` : "Tự đóng / Hưởng theo diện khác" }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "3. Khen thưởng, Kỷ niệm chương CCB: " }),
                  new TextRun({ text: m.memorialBadgeYear ? `Nhận năm ${m.memorialBadgeYear}` : "Chưa nhận" }),
                  new TextRun({ text: m.titles ? ` — Danh hiệu: ${m.titles}` : "" }),
                ],
                spacing: { after: 200 },
              }),

              // 7. Khối V: Đời Sống Kinh Tế
              new Paragraph({
                children: [
                  new TextRun({ text: "V. HOÀN CẢNH GIA ĐÌNH & PHÁT TRIỂN KINH TẾ", bold: true, size: 24 }),
                ],
                spacing: { before: 150, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "1. Phân loại hộ: " }),
                  new TextRun({ text: m.isPoorHousehold ? "Hộ nghèo" : (m.isNearPoorHousehold ? "Hộ cận nghèo" : "Mức sống trung bình trở lên") }),
                  new TextRun({ text: "          2. Tình trạng nhà ở: " }),
                  new TextRun({ text: m.hasDilapidatedHouse ? "Nhà tạm dột nát (CẦN XÓA)" : "Nhà kiên cố/bán kiên cố", bold: m.hasDilapidatedHouse }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "3. Mô hình kinh tế CCB: " }),
                  new TextRun({ text: m.hasEconomicModel ? `${m.economicModelName} (Doanh thu: ${m.economicRevenue})` : "Sản xuất nhỏ lẻ gia đình" }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "4. Dư nợ vốn vay NHCSXH: " }),
                  new TextRun({ text: m.totalDebt > 0 ? `${m.totalDebt.toLocaleString("vi-VN")} đồng` : "Không có dư nợ" }),
                ],
                spacing: { after: 300 },
              }),

              // 8. Chữ Ký Xác Nhận (Theo quy định văn thư)
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  insideHorizontal: { style: BorderStyle.NONE },
                  insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "CHI HỘI TRƯỞNG CCB", bold: true }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "(Ký, ghi rõ họ tên)", italics: true, size: 20 }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "Ea Súp, ngày ..... tháng ..... năm 2026", italics: true }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "TM. THƯỜNG TRỰC HỘI CCB XÃ", bold: true }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "CHỦ TỊCH", bold: true }),
                            ],
                          }),
                          new Paragraph({ text: "", spacing: { after: 800 } }), // Khoảng trống ký tên
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: "ĐẶNG TRUNG HIẾU", bold: true }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      });

      // Tạo Blob và tải file
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Phieu_Mau_02_${m.fullName.replace(/\s+/g, "_")}_${m.cccd}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Lỗi khi xuất file docx:", err);
      alert("Đã xảy ra lỗi khi tạo file Word. Vui lòng thử lại!");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast thông báo nghiệp vụ */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-moss-green border-2 border-bronze-gold text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-xl">🎖️</span>
          <span className="text-sm font-bold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/70 hover:text-white font-bold ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tiêu đề trang & Thao tác nhanh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-300">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-deep-text">
            Quản Lý Hồ Sơ Hội Viên CCB
          </h2>
          <p className="text-sm text-deep-muted mt-0.5">
            Cơ sở dữ liệu 35 trường thông tin • Cơ chế xét duyệt hồ sơ chi hội nộp lên • Xuất văn bản Word (.docx) chuẩn Nghị định 30/2020/NĐ-CP
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "active" && (
            <button
              onClick={() => {
                if (filteredActiveMembers.length > 0) exportDocx(filteredActiveMembers[0]);
              }}
              disabled={isExporting}
              className="px-3.5 py-2 bg-moss-green hover:bg-moss-green-light text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <span>📄 Xuất Mẫu 02 Đầu Danh Sách</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* THANH 3 TAB CHÍNH: HỘI VIÊN CHÍNH THỨC vs CHỜ DUYỆT vs TỪ CHỐI      */}
      {/* ==================================================================== */}
      <div className="flex border-b-2 border-stone-300 gap-2">
        <button
          onClick={() => setActiveTab("active")}
          className={`py-3 px-4 sm:px-6 font-bold text-sm sm:text-base border-b-4 transition flex items-center gap-2 ${
            activeTab === "active"
              ? "border-moss-green text-moss-green bg-white rounded-t-xl shadow-xs"
              : "border-transparent text-stone-500 hover:text-deep-text"
          }`}
        >
          <span>👥</span>
          <span>Hội Viên Chính Thức</span>
          <span className="px-2 py-0.5 bg-emerald-100 text-moss-green text-xs rounded-full font-black">
            {activeMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("pending")}
          className={`py-3 px-4 sm:px-6 font-bold text-sm sm:text-base border-b-4 transition flex items-center gap-2 ${
            activeTab === "pending"
              ? "border-flag-red text-flag-red bg-white rounded-t-xl shadow-xs"
              : "border-transparent text-stone-500 hover:text-deep-text"
          }`}
        >
          <span>⏳</span>
          <span>Hồ Sơ Chờ Duyệt</span>
          {pendingMembers.length > 0 ? (
            <span className="px-2 py-0.5 bg-flag-red text-white text-xs rounded-full font-black animate-pulse shadow-xs">
              {pendingMembers.length}
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-stone-200 text-stone-600 text-xs rounded-full font-bold">
              0
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`py-3 px-4 sm:px-6 font-bold text-sm sm:text-base border-b-4 transition flex items-center gap-2 ${
            activeTab === "rejected"
              ? "border-stone-600 text-stone-800 bg-white rounded-t-xl shadow-xs"
              : "border-transparent text-stone-500 hover:text-deep-text"
          }`}
        >
          <span>❌</span>
          <span>Hồ Sơ Từ Chối</span>
          <span className="px-2 py-0.5 bg-stone-200 text-stone-700 text-xs rounded-full font-bold">
            {rejectedMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("movements")}
          className={`py-3 px-4 sm:px-6 font-bold text-sm sm:text-base border-b-4 transition flex items-center gap-2 ${
            activeTab === "movements"
              ? "border-amber-600 text-amber-900 bg-white rounded-t-xl shadow-xs"
              : "border-transparent text-stone-500 hover:text-deep-text"
          }`}
        >
          <span>📋</span>
          <span>Nhật Ký Biến Động</span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-xs rounded-full font-bold">
            {movements.length}
          </span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 2: HỒ SƠ CHỜ DUYỆT (APPROVAL QUEUE)                              */}
      {/* ==================================================================== */}
      {activeTab === "pending" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Banner hướng dẫn nghiệp vụ phê duyệt */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-xs">
            <span className="text-2xl mt-0.5">🔔</span>
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 text-sm uppercase">
                Quy Trình Phê Duyệt Hồ Sơ Hội Viên CCB Xã Ea Súp
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Các hồ sơ dưới đây do <strong>Chi hội trưởng 20 thôn buôn</strong> kê khai và gửi lên qua cổng di động PWA. Ban Thường trực Hội CCB xã thẩm định kỹ 35 trường thông tin theo đúng Phiếu Mẫu 02. Khi bấm <strong>[Phê duyệt]</strong>, hồ sơ mới chính thức được kết nạp vào Hội CCB Xã Ea Súp và cộng vào tổng số {activeMembers.length} hội viên chính thức của xã.
              </p>
            </div>
          </div>

          {/* Danh sách hồ sơ chờ duyệt */}
          {filteredPendingMembers.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-stone-300 p-12 text-center space-y-2">
              <span className="text-4xl block">🎉</span>
              <h3 className="text-base font-bold text-deep-text">
                Không có hồ sơ nào đang chờ duyệt!
              </h3>
              <p className="text-xs text-deep-muted max-w-md mx-auto">
                Tất cả hồ sơ do các chi hội nộp lên đã được Ban Thường trực thẩm định và xử lý đầy đủ. Khi Chi hội trưởng nộp thêm hội viên mới tại thôn, danh sách sẽ tự động xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPendingMembers.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border-2 border-amber-300 hover:border-bronze-gold p-4 shadow-sm transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-200">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-1 bg-moss-green text-white font-bold text-xs rounded-md">
                        {m.hamletName}
                      </span>
                      <span className="text-base sm:text-lg font-black text-deep-text">
                        {m.fullName}
                      </span>
                      <span className="text-xs text-deep-muted font-medium">
                        (Sinh năm: {m.birthYear})
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-md flex items-center gap-1">
                        <span>⏳</span>
                        <span>Chờ Thường Trực Xã Phê Duyệt</span>
                      </span>
                    </div>

                    <div className="text-xs text-stone-500 font-medium">
                      <span>Nộp lúc: </span>
                      <strong className="text-deep-text">{m.submissionDate || "Mới nộp"}</strong>
                      {m.submittedBy && <span className="block sm:inline sm:ml-1 text-[11px] text-moss-green">({m.submittedBy})</span>}
                    </div>
                  </div>

                  {/* Grid tóm tắt hồ sơ */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-stone-700 bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Số CCCD (12 số):</span>
                      <strong className="font-mono text-deep-text">{m.cccd}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">Số điện thoại:</span>
                      <strong className="text-deep-text">{m.phone}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">Thời kỳ quân ngũ:</span>
                      <strong className="text-moss-green">{m.period}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">Cấp bậc cao nhất:</span>
                      <strong className="text-deep-text">{m.militaryRank}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[11px]">Đơn vị khi tại ngũ:</span>
                      <span className="font-medium">{m.militaryUnit || "—"}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">Đảng viên CSVN:</span>
                      <span className="font-medium text-amber-700">{m.partyJoinDate ? `Có (${m.partyBadge || "ĐV"})` : "Chưa vào Đảng"}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">Chính sách người có công:</span>
                      <span className={`font-bold ${m.policyStatus !== "Không" ? "text-flag-red" : "text-stone-500"}`}>
                        {m.policyStatus} {m.policyWoundRate && `(${m.policyWoundRate})`}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">Kinh tế / Đời sống:</span>
                      <span className="font-medium">
                        {m.hasEconomicModel ? `🌾 ${m.economicModelName || m.economicModelType}` : (m.isPoorHousehold ? "Hộ nghèo" : "Bình thường")}
                      </span>
                    </div>
                  </div>

                  {/* Nút hành động thẩm định */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => setActiveModalMember(m)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-deep-text text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                    >
                      <span>👁️</span>
                      <span>Xem Toàn Bộ 35 Trường Thông Tin</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setMemberToReject(m);
                          setRejectReason("");
                        }}
                        className="px-3.5 py-1.5 bg-stone-100 hover:bg-red-50 text-flag-red border border-red-300 font-bold text-xs rounded-lg transition flex items-center gap-1 active:scale-95"
                      >
                        <span>❌</span>
                        <span>Từ Chối Hồ Sơ</span>
                      </button>

                      <button
                        onClick={() => setMemberToApprove(m)}
                        className="px-4 py-1.5 bg-moss-green hover:bg-moss-green-light text-white font-bold text-xs rounded-lg shadow-sm border border-bronze-gold transition flex items-center gap-1.5 active:scale-95"
                      >
                        <span>✅</span>
                        <span>Phê Duyệt Hội Viên</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: HỒ SƠ BỊ TỪ CHỐI (REJECTED QUEUE)                             */}
      {/* ==================================================================== */}
      {activeTab === "rejected" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-stone-100 border border-stone-300 rounded-xl p-3.5 text-xs text-stone-600 flex items-center justify-between">
            <span>Danh sách các hồ sơ chưa đủ điều kiện hoặc cần bổ sung giấy tờ đã được phản hồi về Chi hội thôn.</span>
            <span className="font-bold text-stone-800">Tổng số: {rejectedMembers.length} hồ sơ</span>
          </div>

          {rejectedMembers.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-300 p-8 text-center text-xs text-stone-500">
              Không có hồ sơ nào bị từ chối.
            </div>
          ) : (
            <div className="space-y-2.5">
              {rejectedMembers.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-red-200 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-deep-text">{m.fullName}</span>
                      <span className="text-xs text-stone-500 font-mono">({m.cccd})</span>
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-xs font-semibold rounded">
                        {m.hamletName}
                      </span>
                    </div>
                    <div className="text-xs text-flag-red font-medium">
                      <strong>Lý do từ chối:</strong> {m.rejectionReason || "Chưa đạt tiêu chuẩn kết nạp"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModalMember(m)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-deep-text text-xs font-bold rounded-lg border border-stone-300"
                    >
                      👁️ Xem lại
                    </button>
                    <button
                      onClick={() => handleRestorePending(m.id, m.fullName)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-300"
                    >
                      🔄 Chuyển về chờ duyệt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: NHẬT KÝ 4 NGHIỆP VỤ BIẾN ĐỘNG HỘI VIÊN                       */}
      {/* (Báo tử, Chuyển đi, Xóa tên, Chuyển đến)                              */}
      {/* ==================================================================== */}
      {activeTab === "movements" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-xs">
            <span className="text-2xl mt-0.5">📜</span>
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 text-sm uppercase">
                Nhật Ký Quản Lý 4 Nghiệp Vụ Biến Động Hội Viên CCB
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Theo dõi toàn bộ các nghiệp vụ: <strong>🕊️ Báo tử</strong> (đã từ trần, cập nhật ngày mất & nơi an táng), <strong>🚚 Chuyển đi</strong> (chuyển sinh hoạt ngoài xã), <strong>⛔ Xóa tên</strong> (vi phạm điều lệ hoặc không sinh hoạt), và <strong>📥 Chuyển đến</strong> (tiếp nhận hội viên mới về địa bàn). Có quản lý và tra cứu file văn bản / quyết định đính kèm.
              </p>
            </div>
          </div>

          {movements.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-300 p-8 text-center text-xs text-stone-500">
              Chưa có bản ghi biến động nào được ghi nhận. Các biến động do Chi hội trưởng kê khai sẽ tự động hiển thị tại đây.
            </div>
          ) : (
            <div className="bg-white border-2 border-stone-300 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-moss-green text-white uppercase text-[11px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Loại Biến Động</th>
                      <th className="p-3">Hội Viên</th>
                      <th className="p-3">Chi Hội</th>
                      <th className="p-3">Ngày Xảy Ra</th>
                      <th className="p-3">Chi Tiết Nghiệp Vụ</th>
                      <th className="p-3 text-right">Văn Bản Đính Kèm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {movements.map((mov) => {
                      const typeConfig = {
                        DECEASED: { label: "🕊️ Báo tử", badge: "bg-stone-700 text-white" },
                        TRANSFER_OUT: { label: "🚚 Chuyển đi", badge: "bg-blue-100 text-blue-900 border border-blue-400" },
                        EXPELLED: { label: "⛔ Xóa tên", badge: "bg-red-100 text-red-900 border border-red-400" },
                        TRANSFER_IN: { label: "📥 Chuyển đến", badge: "bg-emerald-100 text-emerald-900 border border-emerald-400" },
                      }[mov.type] || { label: mov.type, badge: "bg-stone-100 text-stone-800" };

                      return (
                        <tr key={mov.id} className="hover:bg-cream-bg transition">
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold inline-block ${typeConfig.badge}`}>
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-deep-text">
                            <div>{mov.memberName || "Hội viên"}</div>
                            {mov.memberCccd && <div className="text-[11px] text-deep-muted font-mono">{mov.memberCccd}</div>}
                          </td>
                          <td className="p-3 font-semibold text-moss-green whitespace-nowrap">
                            {mov.hamletName}
                          </td>
                          <td className="p-3 whitespace-nowrap text-deep-muted font-medium">
                            {mov.eventDate ? new Date(mov.eventDate).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="p-3 text-xs space-y-0.5">
                            {mov.destination && (
                              <div><span className="font-bold text-deep-text">Nơi đến/đi:</span> {mov.destination}</div>
                            )}
                            {mov.reason && (
                              <div><span className="font-bold text-deep-text">Lý do:</span> {mov.reason}</div>
                            )}
                            {mov.decisionNumber && (
                              <div><span className="font-bold text-deep-text">Số QĐ/GGT:</span> <span className="font-mono">{mov.decisionNumber}</span></div>
                            )}
                            {mov.burialPlace && (
                              <div><span className="font-bold text-deep-text">An táng:</span> {mov.burialPlace}</div>
                            )}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            {mov.documentPdfUrl ? (
                              <a
                                href={mov.documentPdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 bg-moss-green hover:bg-moss-green-light text-white text-xs font-bold rounded-lg shadow-2xs inline-flex items-center gap-1 active:scale-95 transition"
                              >
                                <span>📎</span>
                                <span>Tải Văn Bản</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-stone-400 italic">Không có file</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 1: DANH SÁCH HỘI VIÊN CHÍNH THỨC TOÀN XÃ (ACTIVE MEMBERS)        */}
      {/* ==================================================================== */}
      {activeTab === "active" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* BỘ LỌC THÔNG MINH TRA CỨU 35 TRƯỜNG THÔNG TIN */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-stone-300 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-moss-green flex items-center gap-1.5">
                <span>🔍</span>
                <span>Bộ Lọc Thông Minh Tra Cứu Toàn Xã</span>
              </span>
              <span className="text-xs text-deep-muted font-semibold">
                Tìm thấy: <strong className="text-moss-green text-sm">{filteredActiveMembers.length}</strong> / {activeMembers.length} đồng chí chính thức
              </span>
            </div>

            {/* Ô Tìm Kiếm Từ Khóa */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tra cứu theo Họ tên, số CCCD 12 số, hoặc số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2.5 pl-3 bg-cream-bg border-2 border-stone-300 rounded-lg text-sm font-medium focus:border-moss-green focus:outline-none"
              />
            </div>

            {/* Các Dropdown Lọc */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs font-semibold">
              {/* Lọc Thôn Buôn */}
              <div>
                <label className="text-[11px] text-deep-muted block mb-1">Địa bàn Thôn/Buôn:</label>
                <select
                  value={selectedHamlet}
                  onChange={(e) => setSelectedHamlet(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-md focus:border-moss-green"
                >
                  <option value="all">Tất cả 20 thôn buôn</option>
                  {HAMLET_LIST.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Lọc Thời Kỳ Quân Ngũ */}
              <div>
                <label className="text-[11px] text-deep-muted block mb-1">Thời kỳ chiến đấu:</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-md focus:border-moss-green"
                >
                  <option value="all">Tất cả các thời kỳ</option>
                  <option value="Kháng chiến chống Mỹ">Chống Mỹ</option>
                  <option value="Biên giới Tây Nam">Biên giới Tây Nam</option>
                  <option value="Biên giới phía Bắc">Biên giới phía Bắc</option>
                  <option value="Nhiệm vụ Quốc tế">Nhiệm vụ Quốc tế</option>
                  <option value="Cựu quân nhân">Cựu quân nhân</option>
                </select>
              </div>

              {/* Lọc Chính Sách */}
              <div>
                <label className="text-[11px] text-deep-muted block mb-1">Chính sách người có công:</label>
                <select
                  value={selectedPolicy}
                  onChange={(e) => setSelectedPolicy(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-md focus:border-moss-green"
                >
                  <option value="all">Tất cả đối tượng</option>
                  <option value="Thương binh">Thương binh</option>
                  <option value="Bệnh binh">Bệnh binh</option>
                  <option value="Da cam">Nhiễm Da cam</option>
                  <option value="no">Không thuộc chính sách</option>
                </select>
              </div>

              {/* Lọc Đảng Viên */}
              <div>
                <label className="text-[11px] text-deep-muted block mb-1">Đảng viên CSVN:</label>
                <select
                  value={isPartyFilter}
                  onChange={(e) => setIsPartyFilter(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-md focus:border-moss-green"
                >
                  <option value="all">Tất cả</option>
                  <option value="party">Là Đảng viên</option>
                  <option value="non-party">Chưa vào Đảng</option>
                </select>
              </div>

              {/* Lọc Nhà Tạm / Kinh Tế */}
              <div>
                <label className="text-[11px] text-deep-muted block mb-1">Hoàn cảnh & Kinh tế:</label>
                <select
                  value={isHousingFilter}
                  onChange={(e) => setIsHousingFilter(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-md focus:border-moss-green"
                >
                  <option value="all">Tất cả hoàn cảnh</option>
                  <option value="dilapidated">🏠 Nhà dột nát (cần xóa)</option>
                  <option value="poor">Hộ nghèo / Cận nghèo</option>
                  <option value="model">🌾 Có mô hình kinh tế giỏi</option>
                </select>
              </div>
            </div>
          </div>

          {/* BẢNG DỮ LIỆU HỘI VIÊN CHÍNH THỨC */}
          <div className="bg-white rounded-xl border-2 border-stone-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-moss-green text-white font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Họ Và Tên</th>
                    <th className="py-3 px-3">Số CCCD</th>
                    <th className="py-3 px-3">Thôn / Buôn</th>
                    <th className="py-3 px-3">Thời Kỳ Quân Ngũ</th>
                    <th className="py-3 px-3">Cấp Bậc</th>
                    <th className="py-3 px-3">Chính Sách</th>
                    <th className="py-3 px-3">Đảng Viên</th>
                    <th className="py-3 px-3 text-right">Dư Nợ NHCSXH</th>
                    <th className="py-3 px-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredActiveMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-amber-50/50 transition">
                      {/* Họ tên */}
                      <td className="py-3 px-3.5 font-bold text-deep-text">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{m.fullName}</span>
                          <span className="text-xs text-deep-muted font-normal">({m.birthYear})</span>
                          {m.associationRole === "Chi hội trưởng" && (
                            <span className="px-2 py-0.5 bg-[#9E1A1A] text-amber-200 text-[10px] font-bold rounded-full shadow-xs">
                              Chi hội trưởng
                            </span>
                          )}
                          {m.approvalDate && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                              Mới duyệt
                            </span>
                          )}
                        </div>
                        {m.hasDilapidatedHouse && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-red-100 text-flag-red text-[10px] font-bold rounded">
                            🏠 Nhà dột nát
                          </span>
                        )}
                      </td>

                      {/* CCCD */}
                      <td className="py-3 px-3 font-mono text-xs text-deep-text">
                        {m.cccd}
                      </td>

                      {/* Thôn */}
                      <td className="py-3 px-3 font-semibold text-deep-text">
                        {m.hamletName}
                      </td>

                      {/* Thời kỳ */}
                      <td className="py-3 px-3 text-xs text-deep-muted">
                        {m.period}
                      </td>

                      {/* Cấp bậc */}
                      <td className="py-3 px-3 font-semibold text-deep-text">
                        {m.militaryRank}
                      </td>

                      {/* Chính sách */}
                      <td className="py-3 px-3">
                        {m.policyStatus !== "Không" ? (
                          <span className="px-2 py-0.5 bg-red-100 text-flag-red font-bold text-xs rounded">
                            {m.policyStatus}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Đảng viên */}
                      <td className="py-3 px-3">
                        {m.partyJoinDate ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-bronze-gold font-bold text-xs rounded">
                            {m.partyBadge ? `ĐV (${m.partyBadge})` : "Đảng viên"}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Dư nợ */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-moss-green">
                        {m.totalDebt > 0 ? `${(m.totalDebt / 1000000).toFixed(0)} tr` : "—"}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActiveModalMember(m)}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-deep-text font-bold text-xs rounded border border-stone-300 transition"
                            title="Xem toàn bộ 35 trường thông tin"
                          >
                            👁️ Chi tiết
                          </button>
                          <button
                            onClick={() => {
                              setEditingMember({ ...m });
                              setEditTab("personal");
                            }}
                            className="border border-[#244023] text-[#244023] hover:bg-[#244023] hover:text-white px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 shadow-2xs"
                            title="Chỉnh sửa 35 trường thông tin hồ sơ"
                          >
                            <span>✏️</span>
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() => exportDocx(m)}
                            disabled={isExporting}
                            className="px-2.5 py-1 bg-moss-green hover:bg-moss-green-light text-white font-bold text-xs rounded transition flex items-center gap-1"
                            title="Xuất file Word Mẫu 02 chuẩn Nghị định 30"
                          >
                            <span>📄</span>
                            <span>Mẫu 02</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredActiveMembers.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-deep-muted text-xs">
                        Không tìm thấy hội viên chính thức nào theo điều kiện lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL XÁC NHẬN PHÊ DUYỆT HỘI VIÊN CHÍNH THỨC                         */}
      {/* ==================================================================== */}
      {memberToApprove && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border-4 border-bronze-gold shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <span className="text-4xl block">🎖️</span>
              <h3 className="text-lg font-black text-moss-green uppercase">
                Xác Nhận Phê Duyệt Hội Viên
              </h3>
              <p className="text-xs text-deep-muted">
                Kết nạp chính thức vào Hội Cựu Chiến Binh Xã Ea Súp
              </p>
            </div>

            <div className="bg-cream-bg p-3.5 rounded-xl border border-stone-300 space-y-1.5 text-xs text-stone-700">
              <div>👤 Đồng chí: <strong className="text-deep-text text-sm">{memberToApprove.fullName}</strong></div>
              <div>🆔 Số CCCD: <strong className="font-mono">{memberToApprove.cccd}</strong></div>
              <div>📍 Chi hội sinh hoạt: <strong className="text-moss-green">{memberToApprove.hamletName}</strong></div>
              <div>🎖️ Thời kỳ quân ngũ: <strong>{memberToApprove.period}</strong> ({memberToApprove.militaryRank})</div>
              <div>👤 Người gửi thẩm định: <span>{memberToApprove.submittedBy}</span></div>
            </div>

            <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Khi phê duyệt, hồ sơ của đồng chí sẽ chuyển sang trạng thái <strong>CHÍNH THỨC</strong>, cấp mã hội viên và cộng vào danh sách {activeMembers.length} hội viên của xã.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMemberToApprove(null)}
                className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 font-bold rounded-lg text-deep-text text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="flex-2 py-2.5 bg-moss-green hover:bg-moss-green-light text-white font-bold rounded-lg text-xs shadow-sm border border-bronze-gold flex items-center justify-center gap-1"
              >
                <span>✅ Đồng Ý Phê Duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL TỪ CHỐI HỒ SƠ & NHẬP LÝ DO                                     */}
      {/* ==================================================================== */}
      {memberToReject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border-4 border-red-300 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <span className="text-4xl block">❌</span>
              <h3 className="text-lg font-black text-flag-red uppercase">
                Từ Chối Phê Duyệt Hồ Sơ
              </h3>
              <p className="text-xs text-deep-muted">
                Hồ sơ đ/c: <strong>{memberToReject.fullName}</strong> ({memberToReject.hamletName})
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-deep-text block">
                Lý do từ chối (gửi phản hồi lại cho Chi hội trưởng):
              </label>
              <textarea
                rows={3}
                placeholder="Nhập lý do cụ thể để chi hội trưởng bổ sung, hoàn thiện..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:border-flag-red focus:outline-none"
              ></textarea>
            </div>

            {/* Các lý do gợi ý nhanh */}
            <div className="space-y-1">
              <span className="text-[11px] text-stone-500 font-semibold block">Gợi ý nhanh:</span>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {[
                  "Thiếu bản sao quyết định xuất ngũ/phục viên",
                  "Số định danh CCCD 12 số chưa trùng khớp",
                  "Chưa đủ niên hạn phục vụ quân ngũ",
                  "Địa chỉ cư trú không thuộc xã Ea Súp",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-stone-700 text-left"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setMemberToReject(null)}
                className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 font-bold rounded-lg text-deep-text text-xs"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-2 py-2.5 bg-flag-red hover:bg-flag-red-light text-white font-bold rounded-lg text-xs shadow-sm flex items-center justify-center gap-1"
              >
                <span>Xác Nhận Từ Chối</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL XEM CHI TIẾT 35 TRƯỜNG THÔNG TIN PHIẾU MẪU 02                  */}
      {/* ==================================================================== */}
      {activeModalMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-cream-bg rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 border-4 border-bronze-gold shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-300">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-bronze-gold">
                    HỒ SƠ HỘI VIÊN CHUẨN PHIẾU MẪU 02
                  </span>
                  {activeModalMember.status === "PENDING_APPROVAL" ? (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold rounded">
                      ⏳ Chờ duyệt
                    </span>
                  ) : activeModalMember.status === "ACTIVE" ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded">
                      ✅ Chính thức
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-flag-red border border-red-300 text-[10px] font-bold rounded">
                      ❌ Từ chối
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-moss-green mt-1">
                  {activeModalMember.fullName}
                </h3>
                <p className="text-xs text-deep-muted font-mono">
                  CCCD: {activeModalMember.cccd} • Địa bàn: {activeModalMember.hamletName}
                </p>
              </div>
              <button
                onClick={() => setActiveModalMember(null)}
                className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 font-bold text-stone-700 flex items-center justify-center shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - 5 Khối nghiệp vụ chi tiết */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Khối 1: Định danh */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5 shadow-2xs">
                <h4 className="font-bold text-moss-green uppercase text-xs border-b pb-1">
                  I. Thông Tin Cá Nhân & Nơi Cư Trú
                </h4>
                <div className="grid grid-cols-2 gap-2 text-stone-700 pt-1">
                  <div>Năm sinh: <strong>{activeModalMember.birthDate || activeModalMember.birthYear}</strong> ({activeModalMember.gender})</div>
                  <div>Dân tộc: <strong>{activeModalMember.ethnicity}</strong></div>
                  <div>Tôn giáo: <strong>{activeModalMember.religion}</strong></div>
                  <div>SĐT: <strong>{activeModalMember.phone}</strong></div>
                  <div className="col-span-2">Quê quán: <strong>{activeModalMember.hometown}</strong></div>
                  <div className="col-span-2">Địa chỉ hiện nay: <strong>{activeModalMember.currentAddress}</strong></div>
                </div>
              </div>

              {/* Khối 2: Quân ngũ */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5 shadow-2xs">
                <h4 className="font-bold text-moss-green uppercase text-xs border-b pb-1">
                  II. Quá Trình Quân Ngũ & Phục Vụ Tổ Quốc
                </h4>
                <div className="grid grid-cols-2 gap-2 text-stone-700 pt-1">
                  <div>Nhập ngũ: <strong>{activeModalMember.enlistmentDate || "—"}</strong></div>
                  <div>Xuất ngũ: <strong>{activeModalMember.dischargeDate || "—"}</strong></div>
                  <div>Cấp bậc: <strong>{activeModalMember.militaryRank}</strong></div>
                  <div>Chức vụ: <strong>{activeModalMember.militaryPosition || "Chiến sĩ"}</strong></div>
                  <div>Đơn vị: <strong>{activeModalMember.militaryUnit || "—"}</strong></div>
                  <div>Thời kỳ: <strong>{activeModalMember.period}</strong></div>
                  <div>Là Cựu quân nhân (CQN): <strong>{activeModalMember.isCQN ? "Có" : "Không"}</strong></div>
                  <div>Là chủ hộ gia đình: <strong>{activeModalMember.isHouseholdHead ? "Có" : "Không"}</strong></div>
                  {activeModalMember.militaryTraining && (
                    <div className="col-span-2">Đào tạo trường lớp: <strong>{activeModalMember.militaryTraining}</strong></div>
                  )}
                </div>
              </div>

              {/* Khối 3: Hội & Đảng */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5 shadow-2xs">
                <h4 className="font-bold text-moss-green uppercase text-xs border-b pb-1">
                  III. Công Tác Hội CCB & Xây Dựng Đảng CSVN
                </h4>
                <div className="grid grid-cols-2 gap-2 text-stone-700 pt-1">
                  <div>Ngày vào Hội: <strong>{activeModalMember.associationJoinDate || "—"}</strong></div>
                  <div>Chức vụ Hội: <strong>{activeModalMember.associationRole}</strong></div>
                  <div>Vào Đảng (dự bị): <strong>{activeModalMember.partyJoinDate || "Chưa vào Đảng"}</strong></div>
                  <div>Vào Đảng (chính thức): <strong>{activeModalMember.partyOfficialDate || "—"}</strong></div>
                  <div>Chi bộ sinh hoạt: <strong>{activeModalMember.partyCell || "—"}</strong></div>
                  <div>Huy hiệu Đảng: <strong>{activeModalMember.partyBadge || "Chưa có"}</strong></div>
                  <div>Học vấn / LLCT: <strong>{activeModalMember.educationLevel} • {activeModalMember.politicalTheory}</strong></div>
                  <div>Chuyên môn nghiệp vụ: <strong>{activeModalMember.professionalSkill || "—"}</strong></div>
                </div>
              </div>

              {/* Khối 4: Chính sách & Kinh tế */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5 shadow-2xs">
                <h4 className="font-bold text-moss-green uppercase text-xs border-b pb-1">
                  IV. Chính Sách Người Có Công & Phát Triển Kinh Tế
                </h4>
                <div className="grid grid-cols-2 gap-2 text-stone-700 pt-1">
                  <div>Diện chính sách: <strong className="text-flag-red">{activeModalMember.policyStatus}</strong></div>
                  <div>Tỷ lệ thương tật: <strong>{activeModalMember.policyWoundRate || "—"}</strong></div>
                  <div>Thẻ BHYT 100%: <strong>{activeModalMember.hasHealthInsurance100 ? "Được cấp" : "Không"}</strong></div>
                  <div>Tình trạng nhà ở: <strong className={activeModalMember.hasDilapidatedHouse ? "text-flag-red" : ""}>{activeModalMember.hasDilapidatedHouse ? "Nhà tạm dột nát (CẦN XÓA)" : "Kiên cố"}</strong></div>
                  <div>Mức sống: <strong>{activeModalMember.livingStandard === "HO_NGHEO" ? "Hộ nghèo" : activeModalMember.livingStandard === "CAN_NGHEO" ? "Cận nghèo" : "Không nghèo"}</strong></div>
                  <div>Dư nợ NHCSXH: <strong className="text-moss-green">{activeModalMember.totalDebt.toLocaleString("vi-VN")} đ</strong></div>
                  {activeModalMember.hasEconomicModel && (
                    <div className="col-span-2 text-bronze-gold font-semibold bg-amber-50 p-2 rounded border border-amber-200">
                      🌾 Mô hình KT: {activeModalMember.economicModelName || activeModalMember.economicModelType}
                      {activeModalMember.economicRevenue && <span> • Doanh thu: {activeModalMember.economicRevenue}</span>}
                    </div>
                  )}
                  {activeModalMember.awards && (
                    <div className="col-span-2 text-stone-600">
                      Khen thưởng: <strong>{activeModalMember.awards}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2.5">
              <button
                onClick={() => setActiveModalMember(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 font-bold rounded-lg text-xs"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                {activeModalMember.status === "PENDING_APPROVAL" && (
                  <button
                    onClick={() => {
                      const mem = activeModalMember;
                      setActiveModalMember(null);
                      setMemberToApprove(mem);
                    }}
                    className="px-4 py-2 bg-moss-green hover:bg-moss-green-light text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                  >
                    <span>✅ Phê Duyệt Hồ Sơ Này</span>
                  </button>
                )}

                <button
                  onClick={() => exportDocx(activeModalMember)}
                  disabled={isExporting}
                  className="px-4 py-2 bg-moss-green hover:bg-moss-green-light text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <span>📄 Xuất Phiếu Mẫu 02 (.docx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL CHỈNH SỬA HỒ SƠ HỘI VIÊN 35 TRƯỜNG THÔNG TIN (DÀNH CHO CÁN BỘ XÃ)*/}
      {/* ==================================================================== */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-cream-bg rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border-4 border-moss-green shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="bg-moss-green text-white p-4 sm:px-6 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-bronze-gold text-white text-[11px] font-bold rounded">
                    QUYỀN HẠN CÁN BỘ XÃ
                  </span>
                  <span className="text-xs text-amber-200 font-semibold">
                    Cập nhật 35 trường thông tin
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-white mt-1">
                  ✏️ Chỉnh Sửa Hồ Sơ: {editingMember.fullName}
                </h3>
                <p className="text-xs text-white/80 font-mono mt-0.5">
                  CCCD: {editingMember.cccd} • Sinh hoạt tại: {editingMember.hamletName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold flex items-center justify-center shrink-0 transition"
              >
                ✕
              </button>
            </div>

            {/* Thanh Tab Chuyển 4 Khối Nghiệp Vụ */}
            <div className="flex border-b border-stone-300 bg-stone-100 shrink-0 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setEditTab("personal")}
                className={`py-2.5 px-4 whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${
                  editTab === "personal"
                    ? "border-moss-green text-moss-green bg-white shadow-xs"
                    : "border-transparent text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>👤</span>
                <span>1. Cá Nhân & Cư Trú</span>
              </button>
              <button
                type="button"
                onClick={() => setEditTab("military")}
                className={`py-2.5 px-4 whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${
                  editTab === "military"
                    ? "border-moss-green text-moss-green bg-white shadow-xs"
                    : "border-transparent text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>🎖️</span>
                <span>2. Quá Trình Quân Ngũ</span>
              </button>
              <button
                type="button"
                onClick={() => setEditTab("party")}
                className={`py-2.5 px-4 whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${
                  editTab === "party"
                    ? "border-moss-green text-moss-green bg-white shadow-xs"
                    : "border-transparent text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>🚩</span>
                <span>3. Hội CCB & Đảng CSVN</span>
              </button>
              <button
                type="button"
                onClick={() => setEditTab("policy")}
                className={`py-2.5 px-4 whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${
                  editTab === "policy"
                    ? "border-moss-green text-moss-green bg-white shadow-xs"
                    : "border-transparent text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>🌾</span>
                <span>4. Chính Sách & Kinh Tế</span>
              </button>
            </div>

            {/* Form Nội Dung 35 Trường */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* TAB 1: CÁ NHÂN & CƯ TRÚ */}
              {editTab === "personal" && (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200">
                  <h4 className="font-bold text-moss-green uppercase text-xs border-b pb-1.5 flex items-center gap-1.5">
                    <span>👤</span>
                    <span>I. Thông Tin Cá Nhân & Nơi Cư Trú Hiện Nay</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Họ và tên hội viên: *</label>
                      <input
                        type="text"
                        required
                        value={editingMember.fullName}
                        onChange={(e) => setEditingMember({ ...editingMember, fullName: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-bold text-deep-text focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Số CCCD (12 chữ số): *</label>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        value={editingMember.cccd}
                        onChange={(e) => setEditingMember({ ...editingMember, cccd: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-mono font-bold text-deep-text focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Ngày cấp CCCD:</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={editingMember.cccdIssueDate || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, cccdIssueDate: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Số điện thoại liên hệ:</label>
                      <input
                        type="tel"
                        value={editingMember.phone}
                        onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-medium focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Ngày tháng năm sinh:</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={editingMember.birthDate || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, birthDate: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">Năm sinh: *</label>
                        <input
                          type="number"
                          required
                          value={editingMember.birthYear}
                          onChange={(e) => setEditingMember({ ...editingMember, birthYear: parseInt(e.target.value) || 1960 })}
                          className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-bold focus:border-moss-green"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">Giới tính:</label>
                        <select
                          value={editingMember.gender}
                          onChange={(e) => setEditingMember({ ...editingMember, gender: e.target.value })}
                          className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-medium focus:border-moss-green"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Dân tộc:</label>
                      <input
                        type="text"
                        value={editingMember.ethnicity}
                        onChange={(e) => setEditingMember({ ...editingMember, ethnicity: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Tôn giáo:</label>
                      <input
                        type="text"
                        value={editingMember.religion}
                        onChange={(e) => setEditingMember({ ...editingMember, religion: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-stone-600 font-semibold mb-1">Quê quán (xã/huyện/tỉnh):</label>
                      <input
                        type="text"
                        value={editingMember.hometown}
                        onChange={(e) => setEditingMember({ ...editingMember, hometown: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Chi hội Thôn / Buôn sinh hoạt: *</label>
                      <select
                        value={editingMember.hamletName}
                        onChange={(e) => setEditingMember({ ...editingMember, hamletName: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-bold text-moss-green focus:border-moss-green"
                      >
                        {HAMLET_LIST.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Địa chỉ thường trú hiện nay:</label>
                      <input
                        type="text"
                        value={editingMember.currentAddress}
                        onChange={(e) => setEditingMember({ ...editingMember, currentAddress: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: QUÁ TRÌNH QUÂN NGŨ */}
              {editTab === "military" && (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200">
                  <h4 className="font-bold text-moss-green uppercase text-xs border-b pb-1.5 flex items-center gap-1.5">
                    <span>🎖️</span>
                    <span>II. Quá Trình Quân Ngũ & Phục Vụ Tổ Quốc</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Ngày nhập ngũ:</label>
                      <input
                        type="text"
                        placeholder="MM/YYYY hoặc DD/MM/YYYY"
                        value={editingMember.enlistmentDate || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, enlistmentDate: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Ngày xuất ngũ / phục viên:</label>
                      <input
                        type="text"
                        placeholder="MM/YYYY hoặc DD/MM/YYYY"
                        value={editingMember.dischargeDate || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, dischargeDate: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Cấp bậc quân hàm cao nhất:</label>
                      <input
                        type="text"
                        value={editingMember.militaryRank}
                        onChange={(e) => setEditingMember({ ...editingMember, militaryRank: e.target.value })}
                        placeholder="Thượng sĩ, Trung úy, Thiếu tá..."
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-bold focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Chức vụ trong quân đội:</label>
                      <input
                        type="text"
                        value={editingMember.militaryPosition || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, militaryPosition: e.target.value })}
                        placeholder="Chiến sĩ, Tiểu đội trưởng, Đại đội trưởng..."
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Đơn vị khi tại ngũ:</label>
                      <input
                        type="text"
                        value={editingMember.militaryUnit || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, militaryUnit: e.target.value })}
                        placeholder="Trung đoàn 1, Sư đoàn 330, Quân khu 9..."
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Thời kỳ chiến đấu / phục vụ: *</label>
                      <select
                        value={editingMember.period}
                        onChange={(e) => setEditingMember({ ...editingMember, period: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-semibold focus:border-moss-green"
                      >
                        <option value="Kháng chiến chống Mỹ">Kháng chiến chống Mỹ</option>
                        <option value="Biên giới Tây Nam">Biên giới Tây Nam</option>
                        <option value="Biên giới phía Bắc">Biên giới phía Bắc</option>
                        <option value="Nhiệm vụ Quốc tế">Nhiệm vụ Quốc tế (Campuchia, Lào)</option>
                        <option value="Cựu quân nhân">Cựu quân nhân</option>
                        <option value="Thời bình">Thời bình</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-stone-600 font-semibold mb-1">Đào tạo trường lớp quân đội:</label>
                      <input
                        type="text"
                        value={editingMember.militaryTraining || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, militaryTraining: e.target.value })}
                        placeholder="Trường Sĩ quan Lục quân, Trường Quân chính..."
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div className="flex items-center gap-4 sm:col-span-2 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingMember.isCQN}
                          onChange={(e) => setEditingMember({ ...editingMember, isCQN: e.target.checked })}
                          className="w-4 h-4 text-moss-green rounded"
                        />
                        <span className="font-semibold text-stone-700">Là Cựu quân nhân (CQN)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingMember.isHouseholdHead}
                          onChange={(e) => setEditingMember({ ...editingMember, isHouseholdHead: e.target.checked })}
                          className="w-4 h-4 text-moss-green rounded"
                        />
                        <span className="font-semibold text-stone-700">Là chủ hộ gia đình</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: HỘI & ĐẢNG */}
              {editTab === "party" && (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200">
                  <h4 className="font-bold text-moss-green uppercase text-xs border-b pb-1.5 flex items-center gap-1.5">
                    <span>🚩</span>
                    <span>III. Công Tác Hội CCB & Xây Dựng Đảng CSVN</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Chức vụ trong Hội CCB: *</label>
                      <select
                        value={editingMember.associationRole}
                        onChange={(e) => setEditingMember({ ...editingMember, associationRole: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-bold text-moss-green focus:border-moss-green"
                      >
                        <option value="Hội viên">Hội viên</option>
                        <option value="Chi hội trưởng">Chi hội trưởng</option>
                        <option value="Chi hội phó">Chi hội phó</option>
                        <option value="Tổ trưởng">Tổ trưởng</option>
                        <option value="Ủy viên BCH">Ủy viên BCH</option>
                        <option value="Thường trực Hội">Thường trực Hội</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Ngày vào Hội CCB:</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={editingMember.associationJoinDate || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, associationJoinDate: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Ngày vào Đảng CSVN (dự bị):</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY hoặc để trống nếu chưa vào"
                        value={editingMember.partyJoinDate || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, partyJoinDate: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Ngày công nhận chính thức:</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={editingMember.partyOfficialDate || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, partyOfficialDate: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Chi bộ sinh hoạt Đảng:</label>
                      <input
                        type="text"
                        value={editingMember.partyCell || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, partyCell: e.target.value })}
                        placeholder="Chi bộ Thôn 1, Chi bộ Buôn A..."
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Huy hiệu Đảng đã nhận:</label>
                      <input
                        type="text"
                        value={editingMember.partyBadge || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, partyBadge: e.target.value })}
                        placeholder="30 năm, 40 năm, 45 năm..."
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Trình độ học vấn:</label>
                      <input
                        type="text"
                        value={editingMember.educationLevel || "12/12"}
                        onChange={(e) => setEditingMember({ ...editingMember, educationLevel: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Trình độ lý luận chính trị:</label>
                      <input
                        type="text"
                        value={editingMember.politicalTheory || "Chưa qua"}
                        onChange={(e) => setEditingMember({ ...editingMember, politicalTheory: e.target.value })}
                        placeholder="Sơ cấp, Trung cấp, Cao cấp, Cử nhân..."
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-stone-600 font-semibold mb-1">Chuyên môn nghiệp vụ:</label>
                      <input
                        type="text"
                        value={editingMember.professionalSkill || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, professionalSkill: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CHÍNH SÁCH & KINH TẾ */}
              {editTab === "policy" && (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200">
                  <h4 className="font-bold text-moss-green uppercase text-xs border-b pb-1.5 flex items-center gap-1.5">
                    <span>🌾</span>
                    <span>IV. Chính Sách Người Có Công & Đời Sống Kinh Tế</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Diện chính sách người có công:</label>
                      <select
                        value={editingMember.policyStatus}
                        onChange={(e) => setEditingMember({ ...editingMember, policyStatus: e.target.value })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-semibold focus:border-moss-green"
                      >
                        <option value="Không">Không thuộc diện chính sách</option>
                        <option value="Thương binh">Thương binh</option>
                        <option value="Bệnh binh">Bệnh binh</option>
                        <option value="Nhiễm Da cam">Nhiễm chất độc da cam / Dioxin</option>
                        <option value="Thân nhân Liệt sĩ">Thân nhân Liệt sĩ</option>
                        <option value="Người có công khác">Người có công khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Tỷ lệ thương tật / mất sức:</label>
                      <input
                        type="text"
                        value={editingMember.policyWoundRate || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, policyWoundRate: e.target.value })}
                        placeholder="21%, 41%, 61%, 81%..."
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Mức sống hộ gia đình:</label>
                      <select
                        value={editingMember.livingStandard}
                        onChange={(e) => {
                          const val = e.target.value as "KHONG_NGHEO" | "CAN_NGHEO" | "HO_NGHEO";
                          setEditingMember({
                            ...editingMember,
                            livingStandard: val,
                            isPoorHousehold: val === "HO_NGHEO",
                            isNearPoorHousehold: val === "CAN_NGHEO",
                          });
                        }}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-medium focus:border-moss-green"
                      >
                        <option value="KHONG_NGHEO">Bình thường / Khá giả</option>
                        <option value="CAN_NGHEO">Hộ cận nghèo</option>
                        <option value="HO_NGHEO">Hộ nghèo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Dư nợ vốn vay NHCSXH (VNĐ):</label>
                      <input
                        type="number"
                        step={1000000}
                        value={editingMember.totalDebt}
                        onChange={(e) => setEditingMember({ ...editingMember, totalDebt: parseInt(e.target.value) || 0 })}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-mono font-bold text-moss-green focus:border-moss-green"
                      />
                    </div>
                    <div className="flex items-center gap-4 sm:col-span-2 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingMember.hasHealthInsurance100}
                          onChange={(e) => setEditingMember({ ...editingMember, hasHealthInsurance100: e.target.checked })}
                          className="w-4 h-4 text-moss-green rounded"
                        />
                        <span className="font-semibold text-stone-700">Được cấp thẻ BHYT 100%</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingMember.hasDilapidatedHouse}
                          onChange={(e) => setEditingMember({ ...editingMember, hasDilapidatedHouse: e.target.checked })}
                          className="w-4 h-4 text-flag-red rounded"
                        />
                        <span className="font-bold text-flag-red">🏠 Nhà tạm, dột nát (cần hỗ trợ xóa nhà tạm)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingMember.hasEconomicModel}
                          onChange={(e) => setEditingMember({ ...editingMember, hasEconomicModel: e.target.checked })}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span className="font-bold text-bronze-gold">🌾 Có mô hình kinh tế giỏi</span>
                      </label>
                    </div>

                    {editingMember.hasEconomicModel && (
                      <>
                        <div>
                          <label className="block text-stone-600 font-semibold mb-1">Tên mô hình kinh tế:</label>
                          <input
                            type="text"
                            value={editingMember.economicModelName || ""}
                            onChange={(e) => setEditingMember({ ...editingMember, economicModelName: e.target.value })}
                            placeholder="Trang trại sầu riêng, Nuôi bò vỗ béo..."
                            className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-600 font-semibold mb-1">Doanh thu / Lợi nhuận hàng năm:</label>
                          <input
                            type="text"
                            value={editingMember.economicRevenue || ""}
                            onChange={(e) => setEditingMember({ ...editingMember, economicRevenue: e.target.value })}
                            placeholder="300 - 500 triệu đồng/năm..."
                            className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                          />
                        </div>
                      </>
                    )}

                    <div className="sm:col-span-2">
                      <label className="block text-stone-600 font-semibold mb-1">Khen thưởng, kỷ niệm chương:</label>
                      <input
                        type="text"
                        value={editingMember.awards || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, awards: e.target.value })}
                        placeholder="Huân chương Chiến sĩ vẻ vang, Kỷ niệm chương CCB..."
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded focus:border-moss-green"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Modal Actions */}
              <div className="pt-3 border-t border-stone-300 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 font-bold rounded-xl text-deep-text text-xs transition"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2.5 bg-moss-green hover:bg-moss-green-light text-white font-bold rounded-xl text-xs shadow-md border border-bronze-gold transition flex items-center gap-1.5 active:scale-95"
                >
                  <span>{isSavingEdit ? "⏳ Đang Lưu..." : "💾 Lưu Thay Đổi Hồ Sơ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
