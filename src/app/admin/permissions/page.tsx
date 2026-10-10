"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getStoredMembers, MemberRecord } from "@/lib/memberStore";

export type RoleType = "SUPER_ADMIN" | "BRANCH_LEADER" | "MEMBER";

export interface AccountItem {
  id: string;
  fullName: string;
  unit: string;
  username: string; // Email, username hoặc CCCD
  phone?: string;
  role: RoleType;
  isActive: boolean;
  lastLogin?: string;
  passwordStatus: "MẶC_ĐỊNH" | "ĐÃ_ĐỔI" | "ĐÃ_RESET";
}

// Danh sách ban đầu 02 Cán bộ xã SuperAdmin
const INITIAL_ADMINS: AccountItem[] = [
  {
    id: "admin_1",
    fullName: "Lê Hạnh",
    unit: "Thường trực Hội CCB Xã",
    username: "lehanhkt01@gmail.com",
    phone: "0912345678",
    role: "SUPER_ADMIN",
    isActive: true,
    lastLogin: "Vừa xong",
    passwordStatus: "MẶC_ĐỊNH",
  },
  {
    id: "admin_2",
    fullName: "Đặng Trung Hiếu",
    unit: "Chủ tịch Hội CCB Xã",
    username: "trunghieuktkt@gmail.com",
    phone: "0988776655",
    role: "SUPER_ADMIN",
    isActive: true,
    lastLogin: "10 phút trước",
    passwordStatus: "MẶC_ĐỊNH",
  },
];

// Danh sách chuẩn 20 Chi hội trưởng các thôn, buôn (20 Chi hội trưởng chuẩn xác)
const INITIAL_BRANCH_LEADERS: AccountItem[] = [
  { id: "bl_1", fullName: "Y Nô Rcăm", unit: "Chi hội Buôn A", username: "0982257421", phone: "0982257421", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_2", fullName: "Đoàn Hữu Tiến", unit: "Chi hội Buôn B", username: "034050005833", phone: "0935833737", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_3", fullName: "Y Dyơng Êban", unit: "Chi hội Buôn C", username: "0839931193", phone: "0839931193", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_4", fullName: "Lê Văn Hồng", unit: "Chi hội Thôn Hòa Bình", username: "0420670022", phone: "0977979709", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_5", fullName: "Nguyễn Văn Đông", unit: "Chi hội Thôn Thắng Lợi", username: "025065000445", phone: "0828838929", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_6", fullName: "Nguyễn Văn Sơn", unit: "Chi hội Thôn Đoàn Kết", username: "040059000718", phone: "0913779468", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_7", fullName: "Lục Văn Cường", unit: "Chi hội Thôn Bình Lợi", username: "004082002052", phone: "0338561794", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_8", fullName: "Hồ Sỹ Tuấn", unit: "Chi hội Thôn 1", username: "0986042302", phone: "0986042302", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_9", fullName: "Nguyễn Đức Lợi", unit: "Chi hội Thôn 2", username: "049068000884", phone: "0356912318", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_10", fullName: "Nguyễn Văn Dũng", unit: "Chi hội Thôn 3", username: "034079011156", phone: "0342302292", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_11", fullName: "Nguyễn Phú Bốn", unit: "Chi hội Thôn 4", username: "038065009462", phone: "0367875231", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_12", fullName: "Vũ Văn Đạt", unit: "Chi hội Thôn 5", username: "034065009537", phone: "0327560358", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_13", fullName: "Đỗ Thị Lan", unit: "Chi hội Thôn 6", username: "033155002814", phone: "0343800948", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_14", fullName: "Nguyễn Văn Minh", unit: "Chi hội Thôn 7", username: "024055000072", phone: "0975384025", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_15", fullName: "Trần Thanh Hùng", unit: "Chi hội Thôn 8", username: "048069000332", phone: "0397508052", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_16", fullName: "Trần Văn Cảnh", unit: "Chi hội Thôn 9", username: "066089001142", phone: "0342869974", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_17", fullName: "Nguyễn Lai", unit: "Chi hội Thôn 10", username: "048068000489", phone: "0986911610", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_18", fullName: "Huỳnh Công Dũng", unit: "Chi hội Thôn 11", username: "049060000688", phone: "0359326437", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_19", fullName: "Triệu Đức Quyên", unit: "Chi hội Thôn 12", username: "006089000161", phone: "0857603535", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
  { id: "bl_20", fullName: "Hoàng Văn Tuyên", unit: "Chi hội Thôn 13", username: "004077000098", phone: "0984594812", role: "BRANCH_LEADER", isActive: true, passwordStatus: "MẶC_ĐỊNH" },
];

const STORAGE_KEY_PERMISSIONS = "eccb_permissions_state_v1";

export default function PermissionsManagementPage() {
  const [activeTab, setActiveTab] = useState<"cadre" | "branch" | "member">("cadre");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHamletFilter, setSelectedHamletFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Danh sách tài khoản lưu trữ
  const [adminAccounts, setAdminAccounts] = useState<AccountItem[]>(INITIAL_ADMINS);
  const [branchAccounts, setBranchAccounts] = useState<AccountItem[]>(INITIAL_BRANCH_LEADERS);
  const [memberAccounts, setMemberAccounts] = useState<AccountItem[]>([]);

  // Modal Cấp tài khoản mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newUnit, setNewUnit] = useState("Chi hội Thôn 1");
  const [newUsername, setNewUsername] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<RoleType>("MEMBER");
  const [createError, setCreateError] = useState("");

  // Thông báo hành động
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hiển thị thông báo tự tắt sau 3 giây
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Nạp danh sách 612 hội viên từ memberStore và localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PERMISSIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.admins) setAdminAccounts(parsed.admins);
        if (parsed.branches) setBranchAccounts(parsed.branches);
        if (parsed.members) {
          setMemberAccounts(parsed.members);
          return;
        }
      }
    } catch {
      // Bỏ qua lỗi parse
    }

    // Khởi tạo từ danh sách 612 hội viên
    const allMembers: MemberRecord[] = getStoredMembers();
    const membersAsAccounts: AccountItem[] = allMembers.map((m) => ({
      id: `mem_user_${m.id}`,
      fullName: m.fullName,
      unit: m.hamletName,
      username: m.cccd, // Tên đăng nhập là số CCCD 12 số
      phone: m.phone,
      role: "MEMBER",
      isActive: true,
      passwordStatus: "MẶC_ĐỊNH",
    }));

    setMemberAccounts(membersAsAccounts);
  }, []);

  // Lưu trạng thái vào localStorage khi có thay đổi
  const saveState = (admins: AccountItem[], branches: AccountItem[], members: AccountItem[]) => {
    try {
      localStorage.setItem(
        STORAGE_KEY_PERMISSIONS,
        JSON.stringify({ admins, branches, members })
      );
    } catch {
      // localstorage quota
    }
  };

  // 1. Chức năng Đặt lại mật khẩu (Reset về 12345678@ từ file .env)
  const handleResetPassword = (account: AccountItem) => {
    const confirmReset = window.confirm(
      `Đồng chí có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${account.fullName}" (${account.username}) về mật khẩu mặc định (12345678@) theo quy chuẩn .env?`
    );
    if (!confirmReset) return;

    const updater = (list: AccountItem[]) =>
      list.map((item) =>
        item.id === account.id ? { ...item, passwordStatus: "ĐÃ_RESET" as const } : item
      );

    if (account.role === "SUPER_ADMIN") {
      const updated = updater(adminAccounts);
      setAdminAccounts(updated);
      saveState(updated, branchAccounts, memberAccounts);
    } else if (account.role === "BRANCH_LEADER") {
      const updated = updater(branchAccounts);
      setBranchAccounts(updated);
      saveState(adminAccounts, updated, memberAccounts);
    } else {
      const updated = updater(memberAccounts);
      setMemberAccounts(updated);
      saveState(adminAccounts, branchAccounts, updated);
    }

    showToast(`✓ Đã đặt lại mật khẩu thành công cho [${account.fullName}]. Mật khẩu hiện tại: 12345678@`);
  };

  // 2. Chức năng Khóa / Mở khóa tài khoản
  const handleToggleStatus = (account: AccountItem) => {
    const actionName = account.isActive ? "KHÓA" : "MỞ KHÓA";
    const confirmToggle = window.confirm(
      `Đồng chí có chắc chắn muốn ${actionName} quyền đăng nhập của tài khoản "${account.fullName}"?`
    );
    if (!confirmToggle) return;

    const updater = (list: AccountItem[]) =>
      list.map((item) =>
        item.id === account.id ? { ...item, isActive: !item.isActive } : item
      );

    if (account.role === "SUPER_ADMIN") {
      const updated = updater(adminAccounts);
      setAdminAccounts(updated);
      saveState(updated, branchAccounts, memberAccounts);
    } else if (account.role === "BRANCH_LEADER") {
      const updated = updater(branchAccounts);
      setBranchAccounts(updated);
      saveState(adminAccounts, updated, memberAccounts);
    } else {
      const updated = updater(memberAccounts);
      setMemberAccounts(updated);
      saveState(adminAccounts, branchAccounts, updated);
    }

    showToast(`✓ Đã ${account.isActive ? "khóa quyền truy cập" : "mở khóa hoạt động"} cho [${account.fullName}].`);
  };

  // 3. Chức năng Cấp tài khoản mới
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!newFullName.trim() || !newUsername.trim()) {
      setCreateError("Vui lòng điền đầy đủ Họ tên và Tên đăng nhập / CCCD.");
      return;
    }

    const newItem: AccountItem = {
      id: `acc_${Date.now()}`,
      fullName: newFullName.trim(),
      unit: newUnit,
      username: newUsername.trim(),
      phone: newPhone.trim(),
      role: newRole,
      isActive: true,
      passwordStatus: "MẶC_ĐỊNH",
    };

    if (newRole === "SUPER_ADMIN") {
      const updated = [newItem, ...adminAccounts];
      setAdminAccounts(updated);
      saveState(updated, branchAccounts, memberAccounts);
    } else if (newRole === "BRANCH_LEADER") {
      const updated = [newItem, ...branchAccounts];
      setBranchAccounts(updated);
      saveState(adminAccounts, updated, memberAccounts);
    } else {
      const updated = [newItem, ...memberAccounts];
      setMemberAccounts(updated);
      saveState(adminAccounts, branchAccounts, updated);
    }

    setIsCreateModalOpen(false);
    setNewFullName("");
    setNewUsername("");
    setNewPhone("");
    showToast(`✓ Cấp tài khoản mới thành công cho đồng chí [${newItem.fullName}]. Mật khẩu ban đầu: 12345678@`);
  };

  // Danh sách hiện tại theo Tab
  const currentList = useMemo(() => {
    if (activeTab === "cadre") return adminAccounts;
    if (activeTab === "branch") return branchAccounts;
    return memberAccounts;
  }, [activeTab, adminAccounts, branchAccounts, memberAccounts]);

  // Danh sách sau khi lọc và tìm kiếm
  const filteredList = useMemo(() => {
    return currentList.filter((item) => {
      const matchSearch =
        item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.phone && item.phone.includes(searchTerm));

      const matchHamlet =
        selectedHamletFilter === "all" || item.unit.includes(selectedHamletFilter);

      return matchSearch && matchHamlet;
    });
  }, [currentList, searchTerm, selectedHamletFilter]);

  // Phân trang
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage]);

  return (
    <div className="space-y-6">
      {/* Toast thông báo nổi */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-moss-green text-white px-5 py-3 rounded-xl shadow-2xl border-2 border-bronze-gold flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-200">
          <span>🛡️</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tiêu đề & Nút cấp tài khoản */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-300">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-deep-text flex items-center gap-2">
            <span>🔐</span>
            <span>QUẢN LÝ TÀI KHOẢN VÀ CẤP QUYỀN ĐĂNG NHẬP</span>
          </h2>
          <p className="text-xs sm:text-sm text-deep-muted mt-0.5">
            Quản trị phân quyền 3 cấp độ: Cán bộ Thường trực Xã • 20 Chi hội trưởng • 612 Hội viên Cựu Chiến Binh
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => {
              setNewRole(activeTab === "cadre" ? "SUPER_ADMIN" : activeTab === "branch" ? "BRANCH_LEADER" : "MEMBER");
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-moss-green hover:bg-moss-green-dark active:scale-98 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span>
            <span>Cấp tài khoản mới</span>
          </button>
        </div>
      </div>

      {/* 3 Tabs Quản Lý Nhóm Đối Tượng */}
      <div className="flex flex-wrap gap-2 border-b-2 border-stone-300 pb-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab("cadre");
            setCurrentPage(1);
          }}
          className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-xl transition flex items-center gap-2 cursor-pointer border-t-2 border-x-2 ${
            activeTab === "cadre"
              ? "bg-white text-moss-green border-moss-green border-b-white -mb-[2px] shadow-sm font-black"
              : "bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200"
          }`}
        >
          <span>🏛️</span>
          <span>1. Cán bộ xã (SuperAdmin)</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-moss-green font-bold">
            {adminAccounts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("branch");
            setCurrentPage(1);
          }}
          className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-xl transition flex items-center gap-2 cursor-pointer border-t-2 border-x-2 ${
            activeTab === "branch"
              ? "bg-white text-bronze-gold border-bronze-gold border-b-white -mb-[2px] shadow-sm font-black"
              : "bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200"
          }`}
        >
          <span>📱</span>
          <span>2. Chi hội trưởng (20 Thôn Buôn)</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-bronze-gold font-bold">
            {branchAccounts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("member");
            setCurrentPage(1);
          }}
          className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-xl transition flex items-center gap-2 cursor-pointer border-t-2 border-x-2 ${
            activeTab === "member"
              ? "bg-white text-flag-red border-flag-red border-b-white -mb-[2px] shadow-sm font-black"
              : "bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200"
          }`}
        >
          <span>🎖️</span>
          <span>3. Hội viên CCB (Đăng nhập CCCD)</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-flag-red font-bold">
            {memberAccounts.length}
          </span>
        </button>
      </div>

      {/* Thanh Tìm Kiếm & Bộ Lọc Nhanh */}
      <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder={
                activeTab === "cadre"
                  ? "Tìm theo tên hoặc email cán bộ..."
                  : activeTab === "branch"
                  ? "Tìm theo tên hoặc thôn buôn..."
                  : "Tìm theo Họ tên hoặc Số CCCD 12 số..."
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-stone-400 text-sm">🔍</span>
          </div>

          {activeTab !== "cadre" && (
            <select
              value={selectedHamletFilter}
              onChange={(e) => {
                setSelectedHamletFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-48 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:outline-none"
            >
              <option value="all">Tất cả thôn buôn</option>
              {Array.from({ length: 17 }, (_, i) => `Thôn ${i + 1}`).map((th) => (
                <option key={th} value={th}>{th}</option>
              ))}
              <option value="Buôn A">Buôn A</option>
              <option value="Buôn B">Buôn B</option>
              <option value="Buôn C">Buôn C</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs text-stone-600">
          <span>Tổng số: <strong className="text-moss-green">{filteredList.length}</strong> tài khoản</span>
          <span className="p-1.5 bg-emerald-50 text-emerald-800 rounded font-semibold border border-emerald-200">
            Mật khẩu mặc định: <strong>12345678@</strong>
          </span>
        </div>
      </div>

      {/* Bảng Dữ Liệu Quản Trị Cấp Quyền */}
      <div className="bg-white rounded-xl border border-stone-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-stone-100 border-b-2 border-stone-300 text-stone-700 font-bold uppercase text-[11px]">
                <th className="p-3.5">Họ và Tên</th>
                <th className="p-3.5">Đơn Vị Trực Thuộc</th>
                <th className="p-3.5">Tên Đăng Nhập (Email / CCCD)</th>
                <th className="p-3.5">Vai Trò Hệ Thống</th>
                <th className="p-3.5 text-center">Trạng Thái</th>
                <th className="p-3.5 text-right">Thao Tác Bảo Mật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500 italic">
                    Không tìm thấy tài khoản phù hợp với từ khóa tìm kiếm.
                  </td>
                </tr>
              ) : (
                paginatedList.map((acc) => (
                  <tr key={acc.id} className="hover:bg-stone-50/80 transition">
                    {/* Họ và Tên */}
                    <td className="p-3.5 font-bold text-deep-text">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-cream-surface border border-stone-300 flex items-center justify-center text-xs shrink-0">
                          {acc.role === "SUPER_ADMIN" ? "👑" : acc.role === "BRANCH_LEADER" ? "🏘️" : "🎖️"}
                        </span>
                        <div>
                          <div>{acc.fullName}</div>
                          {acc.phone && <div className="text-[11px] text-stone-400 font-normal">SĐT: {acc.phone}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Đơn vị */}
                    <td className="p-3.5 text-stone-600 font-medium">
                      {acc.unit}
                    </td>

                    {/* Tên đăng nhập */}
                    <td className="p-3.5 font-mono font-semibold text-deep-text">
                      <span className="px-2 py-0.5 bg-stone-100 rounded border border-stone-200">
                        {acc.username}
                      </span>
                    </td>

                    {/* Vai trò */}
                    <td className="p-3.5">
                      {acc.role === "SUPER_ADMIN" ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px] border border-emerald-300">
                          Cán Bộ Xã (SuperAdmin)
                        </span>
                      ) : acc.role === "BRANCH_LEADER" ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-[11px] border border-amber-300">
                          Chi Hội Trưởng
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-full font-semibold text-[11px] border border-stone-300">
                          Hội Viên CCB
                        </span>
                      )}
                    </td>

                    {/* Trạng thái hoạt động */}
                    <td className="p-3.5 text-center">
                      {acc.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>Đang hoạt động</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                          <span>Đã khóa</span>
                        </span>
                      )}
                    </td>

                    {/* Nút thao tác nhanh */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Nút Reset mật khẩu */}
                        <button
                          type="button"
                          onClick={() => handleResetPassword(acc)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-deep-text font-bold text-xs rounded border border-stone-300 transition flex items-center gap-1 cursor-pointer"
                          title="Đặt lại mật khẩu về mặc định (12345678@)"
                        >
                          <span>🔄</span>
                          <span className="hidden sm:inline">Đặt lại MK</span>
                        </button>

                        {/* Nút Khóa / Mở khóa */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(acc)}
                          className={`px-2.5 py-1 font-bold text-xs rounded border transition flex items-center gap-1 cursor-pointer ${
                            acc.isActive
                              ? "bg-red-50 hover:bg-red-100 text-flag-red border-red-300"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}
                          title={acc.isActive ? "Khóa quyền đăng nhập" : "Mở khóa cho phép đăng nhập"}
                        >
                          <span>{acc.isActive ? "🔒" : "🔓"}</span>
                          <span className="hidden sm:inline">{acc.isActive ? "Khóa" : "Mở"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-stone-50 border-t border-stone-300 flex items-center justify-between text-xs">
            <span className="text-stone-500">
              Trang <strong>{currentPage}</strong> / {totalPages} (Hiển thị {paginatedList.length}/{filteredList.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-stone-300 rounded font-semibold disabled:opacity-50 hover:bg-stone-100 cursor-pointer"
              >
                ← Trước
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-stone-300 rounded font-semibold disabled:opacity-50 hover:bg-stone-100 cursor-pointer"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL CẤP TÀI KHOẢN MỚI */}
      {/* ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white text-deep-text w-full max-w-lg rounded-2xl shadow-2xl border-4 border-bronze-gold overflow-hidden">
            {/* Header Modal */}
            <div className="bg-moss-green text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-bronze-gold">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">➕</span>
                <div>
                  <h3 className="font-bold text-base sm:text-lg uppercase text-white">
                    Cấp Quyền &amp; Tạo Tài Khoản Mới
                  </h3>
                  <p className="text-[11px] text-amber-200">
                    Phân hệ phân quyền E-CCB Ea Súp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border-l-4 border-flag-red text-flag-red text-xs font-bold rounded-r">
                  ⚠️ {createError}
                </div>
              )}

              {/* Vai trò */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 uppercase">
                  Vai trò phân quyền:
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as RoleType)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none font-semibold"
                >
                  <option value="MEMBER">Hội viên CCB (Đăng nhập CCCD)</option>
                  <option value="BRANCH_LEADER">Chi hội trưởng (20 thôn buôn)</option>
                  <option value="SUPER_ADMIN">Cán bộ xã (SuperAdmin)</option>
                </select>
              </div>

              {/* Họ và tên */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 uppercase">
                  Họ và tên cán bộ / hội viên:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                />
              </div>

              {/* Tên đăng nhập (Email / CCCD) */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 uppercase">
                  {newRole === "SUPER_ADMIN"
                    ? "Email đăng nhập:"
                    : newRole === "BRANCH_LEADER"
                    ? "Tên đăng nhập (chihoi_...):"
                    : "Số Căn cước công dân (CCCD 12 số):"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    newRole === "SUPER_ADMIN"
                      ? "VD: canboxa@easupso.com"
                      : newRole === "BRANCH_LEADER"
                      ? "VD: chihoi_thon_01"
                      : "VD: 066050123456 (12 số CCCD)"
                  }
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none font-mono"
                />
              </div>

              {/* Đơn vị trực thuộc */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 uppercase">
                  Đơn vị trực thuộc:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chi hội Thôn 1 hoặc Thường trực Hội CCB Xã"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 uppercase">
                  Số điện thoại liên hệ:
                </label>
                <input
                  type="tel"
                  placeholder="VD: 0912345678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none font-mono"
                />
              </div>

              {/* Mật khẩu khởi tạo */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-stone-600">
                <span>🔐 Mật khẩu ban đầu mặc định được cấp: </span>
                <strong className="text-moss-green font-mono">12345678@</strong>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  (Người dùng có thể tự đổi mật khẩu sau lần đăng nhập đầu tiên).
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-moss-green hover:bg-moss-green-dark text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer transition"
                >
                  Cấp tài khoản &amp; Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
