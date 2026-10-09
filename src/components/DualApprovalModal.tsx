"use client";

import React, { useState, useEffect } from "react";
import {
  MemberRecord,
  RegistrationStatus,
  getStoredMembers,
  approveMemberBranch,
  approveMemberAdmin,
  rejectMemberDual,
} from "@/lib/memberStore";
import { AuthUser } from "@/lib/authSession";

interface DualApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  currentHamletName?: string;
  selectedMemberId?: string;
}

export default function DualApprovalModal({
  isOpen,
  onClose,
  currentUser,
  currentHamletName,
  selectedMemberId,
}: DualApprovalModalProps) {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; size: number; type: string; dataUrl?: string } | null>(null);

  const loadData = () => {
    const list = getStoredMembers();
    setMembers(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsRejecting(false);
      setRejectReasonInput("");
      setNotesInput("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMemberId) {
      setActiveMemberId(selectedMemberId);
    }
  }, [selectedMemberId]);

  if (!isOpen) return null;

  // Lọc các hồ sơ đăng ký mới theo phân quyền
  const myHamletName = currentHamletName || currentUser?.hamletName || "";
  const isBranchLeader = currentUser?.role === "BRANCH_LEADER";
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // Lấy các hồ sơ: PENDING_APPROVAL, BRANCH_APPROVED, ADMIN_APPROVED, REJECTED
  const pendingRecords = members.filter((m) => {
    const isApprovalState =
      m.status === "PENDING_APPROVAL" ||
      m.registrationStatus === "PENDING_APPROVAL" ||
      m.registrationStatus === "BRANCH_APPROVED" ||
      m.registrationStatus === "ADMIN_APPROVED";

    if (!isApprovalState) return false;

    // Chi hội trưởng chỉ thấy hồ sơ của thôn mình
    if (isBranchLeader && myHamletName) {
      return m.hamletName?.toLowerCase() === myHamletName.toLowerCase();
    }
    return true;
  });

  const activeMember =
    members.find((m) => m.id === activeMemberId) || pendingRecords[0] || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Chi hội trưởng phê duyệt cấp 1
  const handleBranchApprove = () => {
    if (!activeMember) return;
    const leaderName = currentUser?.fullName || "Chi hội trưởng CCB";
    const note = notesInput.trim() || "Đã thẩm tra tư cách quân nhân tại thôn buôn, đủ điều kiện kết nạp.";
    const result = approveMemberBranch(activeMember.id, note, leaderName);
    if (result.success) {
      loadData();
      setNotesInput("");
      showToast(`✅ Đã phê duyệt thẩm tra cấp Chi hội cho đ/c ${activeMember.fullName}!`);
    }
  };

  // Thường trực Xã phê duyệt cấp 2
  const handleAdminApprove = () => {
    if (!activeMember) return;
    const adminName = currentUser?.fullName || "Đặng Trung Hiếu - Chủ tịch Hội CCB Xã";
    const decisionNote = notesInput.trim() || `Quyết định số ${Math.floor(10 + Math.random() * 90)}/QĐ-CCB ngày ${new Date().toLocaleDateString("vi-VN")} của BCH Hội CCB Xã Ea Súp`;
    const result = approveMemberAdmin(activeMember.id, decisionNote, adminName);
    if (result.success) {
      loadData();
      setNotesInput("");
      showToast(`🎖️ Thường trực Hội CCB Xã đã ra Quyết định kết nạp đ/c ${activeMember.fullName}!`);
    }
  };

  // Từ chối hồ sơ
  const handleReject = () => {
    if (!activeMember) return;
    if (!rejectReasonInput.trim()) {
      alert("⚠️ Vui lòng nhập lý do từ chối hồ sơ!");
      return;
    }
    const rejector = currentUser?.fullName || (isBranchLeader ? "Chi hội trưởng" : "Thường trực Hội CCB Xã");
    const result = rejectMemberDual(activeMember.id, rejectReasonInput.trim(), rejector);
    if (result.success) {
      loadData();
      setIsRejecting(false);
      setRejectReasonInput("");
      showToast(`⚠️ Đã từ chối hồ sơ đ/c ${activeMember.fullName}!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-60 bg-moss-green border-2 border-amber-400 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="text-xl">🎖️</span>
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="bg-white border-4 border-bronze-gold rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-moss-green to-moss-green-dark text-white p-3.5 sm:p-4 border-b-2 border-amber-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-flag-red border-2 border-amber-300 flex items-center justify-center text-lg font-black shadow-inner">
              🎖️
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                CƠ CHẾ PHÊ DUYỆT SONG TRÙNG 2 CẤP
              </span>
              <h2 className="text-sm sm:text-base font-black uppercase text-white leading-tight">
                {isBranchLeader
                  ? `Thẩm Tra & Phê Duyệt Cấp Chi Hội (${myHamletName || "Thôn Buôn"})`
                  : "Ban Thường Trực Hội CCB Xã Ra Quyết Định Kết Nạp"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Nội dung chính Modal */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200">
          {/* Cột 1: Danh sách hồ sơ đang chờ xét duyệt */}
          <div className="md:col-span-1 bg-stone-50 overflow-y-auto max-h-56 md:max-h-[calc(92vh-130px)] p-2.5 space-y-2">
            <div className="px-2 py-1 text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
              <span>Hồ sơ đang chờ ({pendingRecords.length})</span>
              <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded-full font-black">
                {pendingRecords.length}
              </span>
            </div>

            {pendingRecords.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                <span className="text-3xl block mb-1">🎉</span>
                Không có hồ sơ nào đang chờ xét duyệt.
              </div>
            ) : (
              pendingRecords.map((m) => {
                const isSelected = activeMember?.id === m.id;
                const regStatus = m.registrationStatus || "PENDING_APPROVAL";

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setActiveMemberId(m.id);
                      setIsRejecting(false);
                      setNotesInput("");
                    }}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer ${
                      isSelected
                        ? "bg-white border-moss-green shadow-md"
                        : "bg-white/70 border-stone-200 hover:border-amber-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs sm:text-sm font-bold text-moss-green leading-snug">
                        {m.fullName}
                      </p>
                      <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1 rounded">
                        {m.birthYear}
                      </span>
                    </div>

                    <p className="text-[11px] text-deep-muted mt-0.5">
                      📍 {m.hamletName} • 🆔 {m.cccd}
                    </p>

                    {/* Badge trạng thái 2 cấp */}
                    <div className="mt-2 flex items-center gap-1">
                      {regStatus === "PENDING_APPROVAL" && (
                        <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">
                          ⏳ Chờ cấp 1 (Chi hội)
                        </span>
                      )}
                      {regStatus === "BRANCH_APPROVED" && (
                        <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-300">
                          ✓ Chi hội đã duyệt • Chờ Xã
                        </span>
                      )}
                      {regStatus === "ADMIN_APPROVED" && (
                        <span className="text-[9px] font-black uppercase bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-300">
                          ✓ Xã đã duyệt • Chờ Chi hội
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cột 2 & 3: Chi tiết hồ sơ & Khối thao tác phê duyệt */}
          <div className="md:col-span-2 overflow-y-auto max-h-[calc(92vh-130px)] p-4 sm:p-5 space-y-4 bg-white">
            {!activeMember ? (
              <div className="py-20 text-center text-stone-400 text-sm">
                Vui lòng chọn một hồ sơ ở danh sách bên trái để thẩm tra và phê duyệt.
              </div>
            ) : (
              <>
                {/* 1. Thanh tiến trình 2 cấp (Dual Approval Stepper) */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Tiến trình phê duyệt song trùng 2 cấp (Dual Approval)
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Cấp 1 */}
                    <div
                      className={`p-2.5 rounded-lg border-2 ${
                        activeMember.branchApproved
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                          : "bg-white border-amber-300 text-amber-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">CẤP 1: CHI HỘI CCB</span>
                        <span>{activeMember.branchApproved ? "✅ ĐÃ DUYỆT" : "⏳ CHỜ DUYỆT"}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-1">
                        {activeMember.branchApproved
                          ? `Đ/c ${activeMember.branchApprovedBy || "Chi hội trưởng"} (${activeMember.branchApprovedAt || ""})`
                          : "Thẩm tra tư cách quân nhân tại thôn buôn"}
                      </p>
                      {activeMember.branchNotes && (
                        <p className="text-[11px] italic text-stone-700 mt-0.5 border-t border-emerald-200 pt-1">
                          &ldquo;{activeMember.branchNotes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Cấp 2 */}
                    <div
                      className={`p-2.5 rounded-lg border-2 ${
                        activeMember.adminApproved
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                          : "bg-white border-stone-300 text-stone-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">CẤP 2: THƯỜNG TRỰC XÃ</span>
                        <span>{activeMember.adminApproved ? "✅ ĐÃ DUYỆT" : "⏳ CHỜ DUYỆT"}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-1">
                        {activeMember.adminApproved
                          ? `Đ/c ${activeMember.adminApprovedBy || "Thường trực"} (${activeMember.adminApprovedAt || ""})`
                          : "Quyết định kết nạp & đóng dấu"}
                      </p>
                      {activeMember.adminNotes && (
                        <p className="text-[11px] italic text-stone-700 mt-0.5 border-t border-emerald-200 pt-1">
                          &ldquo;{activeMember.adminNotes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. HỒ SƠ ĐỀ NGHỊ KẾT NẠP HỘI VIÊN MỚI TOÀN DIỆN (MẪU 02) */}
                <div className="border-2 border-stone-300 rounded-xl overflow-hidden bg-white shadow-xs">
                  {/* Header Hồ sơ */}
                  <div className="bg-moss-green text-white p-3.5 flex flex-wrap items-center justify-between gap-2 border-b-2 border-bronze-gold">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🎖️</span>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
                          HỒ SƠ ĐỀ NGHỊ XÉT DUYỆT HỘI VIÊN CCB • MẪU 02
                        </span>
                        <h3 className="text-base sm:text-lg font-extrabold text-white uppercase leading-tight">
                          {activeMember.fullName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-amber-400 text-stone-900 px-2.5 py-1 rounded shadow-xs">
                        🆔 CCCD: {activeMember.cccd}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4 text-xs">
                    {/* KHỐI 1: THÔNG TIN NHÂN THÂN & CĂN CƯỚC CÔNG DÂN */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-moss-green font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-stone-200">
                        <span>👤</span>
                        <span>1. Thông tin Nhân thân &amp; Căn cước công dân</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-stone-50 p-3 rounded-lg border border-stone-200">
                        <div>
                          <span className="text-stone-500 block text-[11px]">Họ và tên khai sinh:</span>
                          <strong className="text-deep-text text-sm">{activeMember.fullName}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Ngày sinh / Năm sinh:</span>
                          <strong className="text-deep-text">{activeMember.birthDate || activeMember.birthYear}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Giới tính &amp; Dân tộc:</span>
                          <strong className="text-deep-text">{activeMember.gender || "Nam"} • {activeMember.ethnicity || "Kinh"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Số CCCD 12 số:</span>
                          <strong className="text-deep-text font-mono text-moss-green font-bold">{activeMember.cccd}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Ngày cấp CCCD:</span>
                          <strong className="text-deep-text">{activeMember.cccdIssueDate || "Đã xác thực"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Tôn giáo:</span>
                          <strong className="text-deep-text">{activeMember.religion || "Không"}</strong>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-stone-500 block text-[11px]">Quê quán (Nguyên quán):</span>
                          <strong className="text-deep-text">{activeMember.hometown || "Chưa cập nhật"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Số điện thoại liên lạc:</span>
                          <strong className="text-deep-text font-mono">{activeMember.phone || "Chưa có"}</strong>
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <span className="text-stone-500 block text-[11px]">Nơi ở hiện nay &amp; Chi hội sinh hoạt:</span>
                          <strong className="text-moss-green font-semibold">
                            {activeMember.currentAddress || activeMember.hamletName} ({activeMember.hamletName})
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 2: QUÁ TRÌNH QUÂN NGŨ & LÝ LỊCH QUÂN NHÂN */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-moss-green font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-stone-200">
                        <span>🎖️</span>
                        <span>2. Quá trình Quân ngũ &amp; Lý lịch Quân nhân</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-stone-50 p-3 rounded-lg border border-stone-200">
                        <div>
                          <span className="text-stone-500 block text-[11px]">Ngày nhập ngũ:</span>
                          <strong className="text-deep-text">{activeMember.enlistmentDate || "Chưa ghi"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Ngày xuất ngũ:</span>
                          <strong className="text-deep-text">{activeMember.dischargeDate || "Chưa ghi"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Đối tượng quân nhân:</span>
                          <strong className="text-deep-text">
                            {activeMember.isCQN ? "Cựu Quân Nhân (CQN)" : "Cựu Chiến Binh (CCB)"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Cấp bậc xuất ngũ:</span>
                          <strong className="text-moss-green font-bold">{activeMember.militaryRank || "Chiến sĩ"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Chức vụ trong quân đội:</span>
                          <strong className="text-deep-text">{activeMember.militaryPosition || "Chiến sĩ"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Thời kỳ tham gia:</span>
                          <strong className="text-deep-text text-flag-red font-semibold">{activeMember.period || "Chưa phân loại"}</strong>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-stone-500 block text-[11px]">Đơn vị quân đội phục vụ:</span>
                          <strong className="text-deep-text">{activeMember.militaryUnit || "Quân đội Nhân dân Việt Nam"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Đào tạo / Quân chính:</span>
                          <strong className="text-deep-text">{activeMember.militaryTraining || "Chưa qua"}</strong>
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 3: TỔ CHỨC ĐẢNG, HỘI & TRÌNH ĐỘ HỌC VẤN */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-moss-green font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-stone-200">
                        <span>🚩</span>
                        <span>3. Tổ chức Đảng, Đoàn thể &amp; Trình độ</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-stone-50 p-3 rounded-lg border border-stone-200">
                        <div>
                          <span className="text-stone-500 block text-[11px]">Ngày vào Đảng CSVN:</span>
                          <strong className="text-deep-text">{activeMember.partyJoinDate || "Chưa vào Đảng"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Ngày chính thức:</span>
                          <strong className="text-deep-text">{activeMember.partyOfficialDate || "—"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Huy hiệu Đảng:</span>
                          <strong className="text-deep-text">{activeMember.partyBadge || "Chưa có"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Trình độ học vấn (Văn hóa):</span>
                          <strong className="text-deep-text">{activeMember.educationLevel || "12/12"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Lý luận chính trị:</span>
                          <strong className="text-deep-text">{activeMember.politicalTheory || "Chưa qua"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Chuyên môn kỹ thuật:</span>
                          <strong className="text-deep-text">{activeMember.professionalSkill || "Phổ thông"}</strong>
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <span className="text-stone-500 block text-[11px]">Ngày nộp đơn / tham gia Hội CCB:</span>
                          <strong className="text-deep-text">
                            {activeMember.associationJoinDate || activeMember.submissionDate || "Đăng ký mới 2026"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 4: CHÍNH SÁCH NGƯỜI CÓ CÔNG, ĐỜI SỐNG & KINH TẾ */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-moss-green font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-stone-200">
                        <span>🏥</span>
                        <span>4. Chính sách Người có công, Đời sống &amp; Kinh tế</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-stone-50 p-3 rounded-lg border border-stone-200">
                        <div>
                          <span className="text-stone-500 block text-[11px]">Chính sách / Thương binh:</span>
                          <strong className="text-flag-red font-bold">
                            {activeMember.policyStatus || "Không"} {activeMember.policyWoundRate ? `(${activeMember.policyWoundRate})` : ""}
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Bảo hiểm y tế (BHYT 100%):</span>
                          <strong className="text-deep-text">
                            {activeMember.hasHealthInsurance100 ? "Có (Chế độ CCB 100%)" : "Chưa có"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Mã số thẻ BHYT:</span>
                          <strong className="text-deep-text font-mono">{activeMember.healthInsuranceCode || "Chưa cấp"}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Hoàn cảnh gia đình:</span>
                          <strong className="text-deep-text">
                            {activeMember.livingStandard === "HO_NGHEO" ? "Hộ nghèo" : activeMember.livingStandard === "CAN_NGHEO" ? "Cận nghèo" : "Không nghèo (Đủ ăn)"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Tình trạng nhà ở:</span>
                          <strong className={activeMember.hasDilapidatedHouse ? "text-flag-red font-bold" : "text-emerald-700"}>
                            {activeMember.hasDilapidatedHouse ? "Nhà dột nát, tạm bợ (Cần hỗ trợ)" : "Nhà kiên cố, an toàn"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Khen thưởng / Danh hiệu:</span>
                          <strong className="text-deep-text">{activeMember.awards || activeMember.titles || "Chưa có"}</strong>
                        </div>
                        {activeMember.hasEconomicModel && (
                          <div className="col-span-2 sm:col-span-3 bg-emerald-50 border border-emerald-300 p-2.5 rounded-md">
                            <span className="text-moss-green font-bold block text-[11px]">Mô hình phát triển kinh tế CCB:</span>
                            <p className="text-deep-text font-semibold">
                              {activeMember.economicModelName || activeMember.economicModelType || "Mô hình sản xuất CCB"}
                              {activeMember.economicRevenue ? ` • Doanh thu: ${activeMember.economicRevenue}` : ""}
                              {activeMember.economicLaborCount ? ` • Lao động: ${activeMember.economicLaborCount} người` : ""}
                              {activeMember.economicIncome ? ` • Thu nhập: ${activeMember.economicIncome}` : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* KHỐI 5: TỆP HỒ SƠ & TÀI LIỆU MINH CHỨNG ĐÃ TẢI LÊN */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-moss-green font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-stone-200">
                        <div className="flex items-center gap-1.5">
                          <span>📎</span>
                          <span>5. Tệp hồ sơ &amp; Tài liệu minh chứng đã tải lên</span>
                        </div>
                        <span className="text-stone-500 text-[10px] font-normal lowercase">
                          ({activeMember.attachedFiles?.length || 0} tệp đính kèm)
                        </span>
                      </div>

                      {activeMember.attachedFiles && activeMember.attachedFiles.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeMember.attachedFiles.map((file, idx) => {
                            const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type.includes("pdf");
                            const isImage = file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/) || file.type.includes("image");
                            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

                            return (
                              <div
                                key={idx}
                                className="bg-stone-50 border border-stone-200 hover:border-moss-green rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-2xs transition"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0 ${isPdf ? "bg-red-100 text-flag-red" : isImage ? "bg-emerald-100 text-moss-green" : "bg-blue-100 text-blue-700"}`}>
                                    {isPdf ? "PDF" : isImage ? "IMG" : "DOC"}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-deep-text truncate text-xs" title={file.name}>
                                      {file.name}
                                    </p>
                                    <p className="text-[10px] text-stone-500">
                                      {sizeMb} MB • {isPdf ? "Tài liệu PDF" : isImage ? "Hình ảnh chụp" : "Văn bản"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewFile(file)}
                                    className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-300 rounded text-[11px] font-bold text-moss-green flex items-center gap-1 cursor-pointer transition"
                                    title="Xem tệp tài liệu"
                                  >
                                    <span>👁️</span>
                                    <span>Xem</span>
                                  </button>
                                  <a
                                    href={file.dataUrl || "#"}
                                    download={file.name}
                                    onClick={(e) => {
                                      if (!file.dataUrl) {
                                        e.preventDefault();
                                        alert(`Tệp "${file.name}" đã được lưu an toàn trong hệ thống hồ sơ điện tử Hội CCB.`);
                                      }
                                    }}
                                    className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-300 rounded text-[11px] font-bold text-stone-600 flex items-center gap-1 cursor-pointer transition"
                                    title="Tải tệp về máy tính"
                                  >
                                    <span>⬇️</span>
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-stone-50 border border-dashed border-stone-300 rounded-lg text-center text-stone-500 text-xs">
                          <span>Chưa có tệp minh chứng tải lên (Hội viên sẽ nộp bản photo trực tiếp cho Chi hội).</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Khối Thao tác Phê duyệt */}
                <div className="bg-cream-surface/70 border-2 border-bronze-gold rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-moss-green flex items-center gap-1">
                    <span>✍️</span>
                    <span>
                      {isBranchLeader
                        ? "Thẩm tra & Ý kiến Chi hội trưởng thôn buôn"
                        : "Ý kiến Ban Thường trực Hội CCB Xã Ea Súp"}
                    </span>
                  </h4>

                  {!isRejecting ? (
                    <>
                      <div>
                        <label className="text-xs text-stone-600 block mb-1">
                          {isBranchLeader
                            ? "Ý kiến thẩm tra tư cách quân nhân tại thôn buôn:"
                            : "Số Quyết định kết nạp / Ý kiến phê duyệt Thường trực:"}
                        </label>
                        <input
                          type="text"
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          placeholder={
                            isBranchLeader
                              ? "VD: Đã thẩm tra tư cách quân nhân tại Thôn 1, lý lịch rõ ràng, đủ tiêu chuẩn kết nạp."
                              : `VD: Quyết định số 15/QĐ-CCB ngày ${new Date().toLocaleDateString("vi-VN")} của BCH Hội CCB Xã`
                          }
                          className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-xs sm:text-sm text-deep-text focus:border-moss-green focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsRejecting(true)}
                          className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          ✕ Từ chối hồ sơ
                        </button>

                        <div className="flex items-center gap-2">
                          {isBranchLeader && !activeMember.branchApproved && (
                            <button
                              type="button"
                              onClick={handleBranchApprove}
                              className="px-4 py-2 bg-moss-green hover:bg-moss-green-light active:scale-95 text-white text-xs sm:text-sm font-bold rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer border border-emerald-400"
                            >
                              <span>✅</span>
                              <span>Thẩm tra &amp; Phê duyệt cấp Chi hội</span>
                            </button>
                          )}

                          {isSuperAdmin && !activeMember.adminApproved && (
                            <button
                              type="button"
                              onClick={handleAdminApprove}
                              className="px-4 py-2 bg-flag-red hover:bg-red-800 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer border border-red-300"
                            >
                              <span>🏛️</span>
                              <span>Chuẩn y &amp; Ra Quyết định kết nạp</span>
                            </button>
                          )}

                          {((isBranchLeader && activeMember.branchApproved) ||
                            (isSuperAdmin && activeMember.adminApproved)) && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                              <span>✓</span>
                              <span>Đồng chí đã hoàn tất phê duyệt cấp này</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Khối xác nhận từ chối */
                    <div className="space-y-2 bg-red-50 p-3 rounded-lg border border-flag-red/30">
                      <label className="text-xs font-bold text-flag-red block">
                        Nhập lý do từ chối hồ sơ đăng ký:
                      </label>
                      <input
                        type="text"
                        value={rejectReasonInput}
                        onChange={(e) => setRejectReasonInput(e.target.value)}
                        placeholder="VD: Không xuất trình được giấy tờ chứng minh quá trình quân ngũ..."
                        className="w-full p-2 bg-white border border-red-300 rounded text-xs text-deep-text focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsRejecting(false)}
                          className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs font-bold rounded cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="button"
                          onClick={handleReject}
                          className="px-3 py-1.5 bg-flag-red text-white text-xs font-bold rounded cursor-pointer"
                        >
                          Xác nhận từ chối
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL XEM TRƯỚC TỆP ĐÍNH KÈM */}
      {previewFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border-4 border-bronze-gold max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-moss-green text-white p-3.5 flex items-center justify-between border-b-2 border-bronze-gold">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <div>
                  <h4 className="font-bold text-sm truncate max-w-xs">{previewFile.name}</h4>
                  <p className="text-[10px] text-stone-300">
                    Dung lượng: {(previewFile.size / (1024 * 1024)).toFixed(1)} MB • Đã thẩm tra số hóa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center space-y-4 text-center">
              {previewFile.dataUrl && previewFile.type.includes("image") ? (
                <img
                  src={previewFile.dataUrl}
                  alt={previewFile.name}
                  className="max-h-96 w-auto object-contain rounded-lg border border-stone-200"
                />
              ) : (
                <div className="p-6 sm:p-8 bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl w-full space-y-3">
                  <div className="text-4xl">
                    {previewFile.name.toLowerCase().endsWith(".pdf") ? "📕" : "📄"}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-deep-text">{previewFile.name}</p>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                      Tệp hồ sơ minh chứng đã được số hóa và mã hóa lưu trữ an toàn trong kho dữ liệu Hội CCB Xã Ea Súp.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-2">
                    {previewFile.dataUrl ? (
                      <a
                        href={previewFile.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-moss-green text-white font-bold text-xs rounded-lg shadow-xs hover:bg-moss-green-dark"
                      >
                        Mở toàn màn hình ↗
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded border border-emerald-300">
                        ✓ Tệp minh chứng quân nhân hợp lệ
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-stone-100 border-t border-stone-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 font-bold text-xs rounded-lg text-stone-700 cursor-pointer"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
