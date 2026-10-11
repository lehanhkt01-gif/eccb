"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getStoredMembers, saveStoredMembers, assignBranchLeader, MemberRecord } from "@/lib/memberStore";
import { EA_SUP_HAMLETS } from "@/lib/constants/hamlets";

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

const STORAGE_KEY_PERMISSIONS = "eccb_permissions_state_v6";

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
  const [newRole, setNewRole] = useState<RoleType>("BRANCH_LEADER");
  const [createError, setCreateError] = useState("");

  // Phân quyền Chi hội trưởng: Chọn Chi hội (Thôn Buôn) & Sổ danh sách hội viên chính thức
  const [selectedBranchHamlet, setSelectedBranchHamlet] = useState("Thôn Đoàn Kết");
  const [selectedMemberIdForLeader, setSelectedMemberIdForLeader] = useState("");
  const [leaderInputMode, setLeaderInputMode] = useState<"SELECT" | "MANUAL">("SELECT");
  const [manualFullName, setManualFullName] = useState("");
  const [manualCccd, setManualCccd] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualBirthYear, setManualBirthYear] = useState("1965");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thông báo hành động
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hiển thị thông báo tự tắt sau 3 giây
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const FAKE_CCCD_SET = new Set([
    "066068001234", "066055009876", "066067000113", "066058000102",
    "066052000101", "066060000111", "066072000109", "066050100001"
  ]);

  // Danh sách hội viên chính thức của chi hội được chọn để phân quyền Chi hội trưởng
  const hamletOfficialMembers = useMemo(() => {
    const all = getStoredMembers().filter(
      (m) =>
        (m.status === "CHINH_THUC" || (m.status as any) === "ACTIVE") &&
        !FAKE_CCCD_SET.has(m.cccd) &&
        !["Đặng Hữu Phúc", "Nguyễn Đình Quảng", "Nguyễn Văn Hùng", "Lê Bá Tùng", "Đặng Văn Hảo", "Lương Thế Vinh", "Ngô Quang Hưng"].includes(m.fullName)
    );
    const cleanHamlet = selectedBranchHamlet.replace(/^Chi hội\s+/i, "").trim().toLowerCase();
    return all.filter((m) => {
      const mHamlet = (m.hamletName || "").replace(/^Chi hội\s+/i, "").trim().toLowerCase();
      return mHamlet === cleanHamlet;
    });
  }, [selectedBranchHamlet, isCreateModalOpen, memberAccounts]);

  // Hội viên đang được chọn làm Chi hội trưởng
  const selectedMemberForLeader = useMemo(() => {
    return hamletOfficialMembers.find((m) => m.id === selectedMemberIdForLeader) || null;
  }, [hamletOfficialMembers, selectedMemberIdForLeader]);

  // Tự động pre-select CHT hiện tại hoặc hội viên đầu tiên khi đổi thôn buôn
  useEffect(() => {
    if (newRole === "BRANCH_LEADER" && hamletOfficialMembers.length > 0) {
      const currentLeader = hamletOfficialMembers.find((m) => m.associationRole === "Chi hội trưởng");
      if (currentLeader) {
        setSelectedMemberIdForLeader(currentLeader.id);
      } else {
        setSelectedMemberIdForLeader(hamletOfficialMembers[0].id);
      }
    } else {
      setSelectedMemberIdForLeader("");
    }
  }, [selectedBranchHamlet, newRole, hamletOfficialMembers]);

  // Nạp danh sách hội viên chính thức từ memberStore và localStorage
  const syncPermissionsData = (customMembers?: MemberRecord[]) => {
    // 1. Lấy danh sách hội viên chính thức (CHỈ HỘI VIÊN CHÍNH THỨC, KHÔNG LẤY HỒ SƠ ẢO)
    const rawList = customMembers && customMembers.length > 0 ? customMembers : getStoredMembers();
    const officialMembers = rawList.filter(
      (m) => (m.status === "CHINH_THUC" || (m.status as any) === "ACTIVE") &&
             !FAKE_CCCD_SET.has(m.cccd) &&
             !["Đặng Hữu Phúc", "Nguyễn Đình Quảng", "Nguyễn Văn Hùng", "Lê Bá Tùng", "Đặng Văn Hảo", "Lương Thế Vinh", "Ngô Quang Hưng"].includes(m.fullName)
    );

    let loadedAdmins = INITIAL_ADMINS;
    let loadedBranches = [...INITIAL_BRANCH_LEADERS];

    try {
      const stored = localStorage.getItem(STORAGE_KEY_PERMISSIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.admins && Array.isArray(parsed.admins)) loadedAdmins = parsed.admins;
        if (parsed.branches && Array.isArray(parsed.branches) && parsed.branches.length > 0) {
          loadedBranches = parsed.branches;
        }
      }
    } catch {
      // Bỏ qua lỗi parse
    }

    // Luôn đảm bảo số tài khoản hội viên trùng khớp chính xác 1:1 với danh sách hội viên chính thức
    const loadedMembers: AccountItem[] = officialMembers.map((m) => ({
      id: `mem_user_${m.id}`,
      fullName: m.fullName,
      unit: m.hamletName,
      username: m.cccd, // Tên đăng nhập là số CCCD 12 số
      phone: m.phone,
      role: "MEMBER",
      isActive: true,
      passwordStatus: "MẶC_ĐỊNH",
    }));

    // Cập nhật và bổ sung tất cả Chi hội trưởng từ danh sách hội viên (Hỗ trợ 1 thôn có nhiều CHT)
    const leadersInStore = officialMembers.filter((m) => m.associationRole === "Chi hội trưởng");
    for (const leader of leadersInStore) {
      const cleanHamlet = leader.hamletName.replace(/^Chi hội\s+/i, "").trim().toLowerCase();
      // Tìm xem CHT này đã có tài khoản trong danh sách chưa (so sánh chính xác theo CCCD hoặc SĐT hoặc Họ tên + Thôn)
      const existingIdx = loadedBranches.findIndex(
        (br) =>
          (leader.cccd && (br.username === leader.cccd || (br as any).cccd === leader.cccd)) ||
          (leader.phone && (br.phone === leader.phone || br.username === leader.phone)) ||
          (br.fullName.toLowerCase() === leader.fullName.toLowerCase() &&
            br.unit.replace(/^Chi hội\s+/i, "").trim().toLowerCase() === cleanHamlet)
      );

      if (existingIdx !== -1) {
        // Cập nhật thông tin mới nhất
        loadedBranches[existingIdx] = {
          ...loadedBranches[existingIdx],
          fullName: leader.fullName,
          phone: leader.phone || loadedBranches[existingIdx].phone,
          username: leader.phone || leader.cccd || loadedBranches[existingIdx].username,
          unit: `Chi hội ${leader.hamletName.replace(/^Chi hội\s+/i, "")}`,
          role: "BRANCH_LEADER",
          isActive: true,
        };
      } else {
        // Bổ sung thêm vào danh sách tài khoản Chi hội trưởng (không ghi đè CHT khác cùng thôn)
        loadedBranches.push({
          id: `bl_${leader.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          fullName: leader.fullName,
          unit: `Chi hội ${leader.hamletName.replace(/^Chi hội\s+/i, "")}`,
          username: leader.phone || leader.cccd,
          phone: leader.phone,
          role: "BRANCH_LEADER",
          isActive: true,
          passwordStatus: "MẶC_ĐỊNH",
        });
      }
    }

    setAdminAccounts(loadedAdmins);
    setBranchAccounts(loadedBranches);
    setMemberAccounts(loadedMembers);
    saveState(loadedAdmins, loadedBranches, loadedMembers);
  };

  // Nạp 100% dữ liệu hội viên từ CSDL PostgreSQL của máy chủ để đồng bộ toàn hệ thống
  const loadServerData = async () => {
    try {
      const res = await fetch("/api/admin/members");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          saveStoredMembers(data);
          syncPermissionsData(data);
        }
      }
    } catch (err) {
      console.error("Lỗi fetch /api/admin/members:", err);
    }
  };

  useEffect(() => {
    syncPermissionsData();
    loadServerData();

    const handleUpdated = () => {
      syncPermissionsData();
    };

    window.addEventListener("eccb-members-updated", handleUpdated);
    return () => window.removeEventListener("eccb-members-updated", handleUpdated);
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
      `Đồng chí có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${account.fullName}" (${account.username}) về mật khẩu mặc định theo quy chuẩn hệ thống?`
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

    showToast(`✓ Đã đặt lại mật khẩu thành công cho [${account.fullName}].`);
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

  // 3. Chức năng Cấp tài khoản mới / Cấp quyền Chi hội trưởng (Đồng bộ trực tiếp PostgreSQL và Toàn hệ thống)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setIsSubmitting(true);

    try {
      // TRƯỜNG HỢP 1: CẤP QUYỀN CHI HỘI TRƯỞNG
      if (newRole === "BRANCH_LEADER") {
        const cleanHamlet = selectedBranchHamlet.replace(/^Chi hội\s+/i, "").trim();
        const unitName = `Chi hội ${cleanHamlet}`;

        // CHẾ ĐỘ 1: CHỌN TỪ DANH SÁCH HỘI VIÊN CHÍNH THỨC CỦA THÔN
        if (leaderInputMode === "SELECT") {
          if (!selectedMemberForLeader) {
            setCreateError(`Chi hội [${selectedBranchHamlet}] chưa có hội viên được chọn. Vui lòng chọn 1 hội viên hoặc chuyển sang chế độ "Nhập trực tiếp".`);
            setIsSubmitting(false);
            return;
          }

          // 1. Gửi request đồng bộ CSDL PostgreSQL máy chủ
          try {
            const apiRes = await fetch("/api/admin/assign-branch-leader", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                memberId: selectedMemberForLeader.id,
                cccd: selectedMemberForLeader.cccd,
                hamletName: cleanHamlet,
                fullName: selectedMemberForLeader.fullName,
                phone: selectedMemberForLeader.phone,
              }),
            });
            const apiData = await apiRes.json();
            if (!apiData.success) {
              console.warn("Lưu ý từ server assign-branch-leader:", apiData.error || apiData.message);
            }
          } catch (err) {
            console.error("Lỗi gửi assign-branch-leader lên PostgreSQL:", err);
          }

          // 2. Cập nhật trong Local Store memberStore
          assignBranchLeader(selectedMemberForLeader.id);

          // 3. Cập nhật và bổ sung tài khoản vào branchAccounts (không ghi đè CHT khác cùng thôn)
          let updatedBranches = [...branchAccounts];
          const existingIdx = updatedBranches.findIndex(
            (b) =>
              (selectedMemberForLeader.cccd && (b.username === selectedMemberForLeader.cccd || (b as any).cccd === selectedMemberForLeader.cccd)) ||
              (selectedMemberForLeader.phone && (b.phone === selectedMemberForLeader.phone || b.username === selectedMemberForLeader.phone)) ||
              (b.fullName.toLowerCase() === selectedMemberForLeader.fullName.toLowerCase() &&
                b.unit.replace(/^Chi hội\s+/i, "").trim().toLowerCase() === cleanHamlet.toLowerCase())
          );

          const leaderAccount: AccountItem = {
            id: existingIdx !== -1 ? updatedBranches[existingIdx].id : `bl_${selectedMemberForLeader.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            fullName: selectedMemberForLeader.fullName,
            unit: unitName,
            username: selectedMemberForLeader.phone || selectedMemberForLeader.cccd,
            phone: selectedMemberForLeader.phone,
            role: "BRANCH_LEADER",
            isActive: true,
            passwordStatus: "MẶC_ĐỊNH",
          };

          if (existingIdx !== -1) {
            updatedBranches[existingIdx] = leaderAccount;
          } else {
            updatedBranches.push(leaderAccount);
          }

          setBranchAccounts(updatedBranches);
          saveState(adminAccounts, updatedBranches, memberAccounts);

          // Kích hoạt đồng bộ toàn bộ app
          window.dispatchEvent(new Event("eccb-members-updated"));
          syncPermissionsData();
          loadServerData();

          setIsCreateModalOpen(false);
          showToast(`✓ Đã cấp quyền Chi hội trưởng [${cleanHamlet}] cho đồng chí [${selectedMemberForLeader.fullName}] thành công!`);
          return;
        }

        // CHẾ ĐỘ 2: NHẬP TRỰC TIẾP CHI HỘI TRƯỞNG MỚI (Tự động tạo hồ sơ hội viên & Cấp quyền)
        if (!manualFullName.trim() || !manualCccd.trim()) {
          setCreateError("Vui lòng điền đầy đủ Họ tên và Số CCCD 12 số của Chi hội trưởng mới.");
          setIsSubmitting(false);
          return;
        }

        // 1. Tạo hồ sơ hội viên mới và tài khoản trong PostgreSQL
        try {
          const createRes = await fetch("/api/admin/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: manualFullName.trim(),
              cccd: manualCccd.trim(),
              phone: manualPhone.trim() || undefined,
              birthYear: parseInt(manualBirthYear) || 1965,
              hamletName: cleanHamlet,
              associationRole: "Chi hội trưởng",
              status: "CHINH_THUC",
              adminApproved: true,
              branchApproved: true,
            }),
          });
          const createData = await createRes.json();
          if (!createData.success) {
            console.warn("Lưu ý tạo hội viên mới:", createData.error);
          }
        } catch (memErr) {
          console.error("Lỗi tạo hội viên mới:", memErr);
        }

        // 2. Gán quyền Chi hội trưởng trong CSDL
        try {
          await fetch("/api/admin/assign-branch-leader", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cccd: manualCccd.trim(),
              hamletName: cleanHamlet,
              fullName: manualFullName.trim(),
              phone: manualPhone.trim(),
            }),
          });
        } catch (asErr) {
          console.error("Lỗi gán CHT:", asErr);
        }

        // 3. Thêm tài khoản mới vào branchAccounts
        const newLeaderAcc: AccountItem = {
          id: `bl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          fullName: manualFullName.trim(),
          unit: unitName,
          username: manualPhone.trim() || manualCccd.trim(),
          phone: manualPhone.trim() || undefined,
          role: "BRANCH_LEADER",
          isActive: true,
          passwordStatus: "MẶC_ĐỊNH",
        };

        const updatedBranches = [...branchAccounts, newLeaderAcc];
        setBranchAccounts(updatedBranches);
        saveState(adminAccounts, updatedBranches, memberAccounts);

        // Kích hoạt đồng bộ toàn bộ app
        window.dispatchEvent(new Event("eccb-members-updated"));
        syncPermissionsData();
        loadServerData();

        setIsCreateModalOpen(false);
        setManualFullName("");
        setManualCccd("");
        setManualPhone("");
        showToast(`✓ Đã thêm và cấp quyền Chi hội trưởng [${cleanHamlet}] cho đ/c [${manualFullName.trim()}] thành công!`);
        return;
      }

      // TRƯỜNG HỢP 2: CÁC VAI TRÒ KHÁC (SUPER_ADMIN HOẶC MEMBER)
      if (!newFullName.trim() || !newUsername.trim()) {
        setCreateError("Vui lòng điền đầy đủ Họ tên và Tên đăng nhập / CCCD.");
        setIsSubmitting(false);
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
      } else {
        const updated = [newItem, ...memberAccounts];
        setMemberAccounts(updated);
        saveState(adminAccounts, branchAccounts, updated);
      }

      setIsCreateModalOpen(false);
      setNewFullName("");
      setNewUsername("");
      setNewPhone("");
      showToast(`✓ Cấp tài khoản mới thành công cho đồng chí [${newItem.fullName}].`);
    } catch (err: any) {
      setCreateError(err.message || "Đã xảy ra lỗi khi cấp tài khoản.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Danh sách hiện tại theo Tab (Đảm bảo lọc sạch 100% tài khoản ảo)
  const currentList = useMemo(() => {
    if (activeTab === "cadre") return adminAccounts;
    if (activeTab === "branch") return branchAccounts;
    return memberAccounts.filter(
      (m) =>
        !FAKE_CCCD_SET.has(m.username) &&
        !["Đặng Hữu Phúc", "Nguyễn Đình Quảng", "Nguyễn Văn Hùng", "Lê Bá Tùng", "Đặng Văn Hảo", "Lương Thế Vinh", "Ngô Quang Hưng"].includes(m.fullName)
    );
  }, [activeTab, adminAccounts, branchAccounts, memberAccounts]);

  // Danh sách sau khi lọc và tìm kiếm
  const filteredList = useMemo(() => {
    return currentList.filter((item) => {
      const matchSearch =
        item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.phone && item.phone.includes(searchTerm));

      const cleanUnit = item.unit.replace(/^Chi hội\s+/i, "").trim();
      const matchHamlet =
        selectedHamletFilter === "all" ||
        cleanUnit === selectedHamletFilter ||
        item.unit === selectedHamletFilter ||
        item.unit === `Chi hội ${selectedHamletFilter}`;

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
              const r = activeTab === "cadre" ? "SUPER_ADMIN" : activeTab === "branch" ? "BRANCH_LEADER" : "MEMBER";
              setNewRole(r);
              if (selectedHamletFilter !== "all") {
                setSelectedBranchHamlet(selectedHamletFilter);
              }
              setCreateError("");
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
              className="w-full sm:w-52 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:outline-none font-medium"
            >
              <option value="all">Tất cả thôn buôn</option>
              {EA_SUP_HAMLETS.map((th) => (
                <option key={th} value={th}>{th}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs text-stone-600">
          <span>Tổng số: <strong className="text-moss-green">{filteredList.length}</strong> tài khoản</span>
        </div>
      </div>

      {/* Bảng Dữ Liệu Quản Trị Cấp Quyền */}
      <div className="bg-white rounded-xl border border-stone-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-stone-100 border-b-2 border-stone-300 text-stone-700 font-bold uppercase text-[11px]">
                <th className="p-3.5 text-center w-14">STT</th>
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
                  <td colSpan={7} className="p-8 text-center text-stone-500 italic">
                    Không tìm thấy tài khoản phù hợp với từ khóa tìm kiếm.
                  </td>
                </tr>
              ) : (
                paginatedList.map((acc, index) => (
                  <tr key={acc.id} className="hover:bg-stone-50/80 transition">
                    {/* Số thứ tự */}
                    <td className="p-3.5 text-center font-bold text-stone-500">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

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
                          title="Đặt lại mật khẩu về mặc định"
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
                  <option value="BRANCH_LEADER">Chi hội trưởng (20 thôn buôn)</option>
                  <option value="MEMBER">Hội viên CCB (Đăng nhập CCCD)</option>
                  <option value="SUPER_ADMIN">Cán bộ xã (SuperAdmin)</option>
                </select>
              </div>

              {/* NỘI DUNG FORM THEO VAI TRÒ */}
              {newRole === "BRANCH_LEADER" ? (
                /* PHÂN HỆ CẤP QUYỀN CHI HỘI TRƯỞNG: HỖ TRỢ 2 CHẾ ĐỘ (CHỌN TỪ THÔN HOẶC NHẬP TRỰC TIẾP) */
                <div className="space-y-4">
                  {/* 1. Chọn Chi hội (Thôn / Buôn) */}
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1 uppercase">
                      1. Chọn Chi hội trực thuộc (Thôn / Buôn):
                    </label>
                    <select
                      value={selectedBranchHamlet}
                      onChange={(e) => setSelectedBranchHamlet(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none font-bold"
                    >
                      {EA_SUP_HAMLETS.map((h) => (
                        <option key={h} value={h}>
                          Chi hội {h}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Chi hội thôn/buôn được phân quyền Chi hội trưởng (Một chi hội có thể có nhiều đồng chí Chi hội trưởng).
                    </p>
                  </div>

                  {/* Chuyển đổi phương thức cấp quyền */}
                  <div className="flex rounded-lg bg-stone-100 p-1 border border-stone-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setLeaderInputMode("SELECT")}
                      className={`flex-1 py-1.5 rounded-md transition text-center cursor-pointer ${
                        leaderInputMode === "SELECT"
                          ? "bg-white text-moss-green shadow-xs border border-stone-200"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      📋 Chọn hội viên có sẵn ({hamletOfficialMembers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaderInputMode("MANUAL")}
                      className={`flex-1 py-1.5 rounded-md transition text-center cursor-pointer ${
                        leaderInputMode === "MANUAL"
                          ? "bg-white text-moss-green shadow-xs border border-stone-200"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      ✏️ Nhập trực tiếp CHT mới
                    </button>
                  </div>

                  {/* PHƯƠNG THỨC 1: CHỌN TỪ DANH SÁCH HỘI VIÊN THÔN */}
                  {leaderInputMode === "SELECT" ? (
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1 uppercase flex items-center justify-between">
                        <span>2. Chọn Hội viên cấp quyền Chi hội trưởng:</span>
                        <span className="text-[11px] text-moss-green font-semibold">
                          {hamletOfficialMembers.length} hội viên
                        </span>
                      </label>

                      {hamletOfficialMembers.length > 0 ? (
                        <select
                          value={selectedMemberIdForLeader}
                          onChange={(e) => setSelectedMemberIdForLeader(e.target.value)}
                          className="w-full p-2.5 bg-stone-50 border-2 border-stone-300 focus:border-moss-green rounded-lg text-sm text-deep-text focus:bg-white focus:outline-none font-semibold"
                        >
                          <option value="">-- Bấm chọn 1 hội viên trong danh sách --</option>
                          {hamletOfficialMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.fullName} — Sinh năm {m.birthYear} (CCCD: {m.cccd}) {m.associationRole === "Chi hội trưởng" ? "⭐ [Đang là CHT]" : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs space-y-2">
                          <div>
                            ⚠️ <strong>Chi hội {selectedBranchHamlet}</strong> hiện chưa có danh sách hội viên trong bộ nhớ hiển thị.
                          </div>
                          <button
                            type="button"
                            onClick={() => setLeaderInputMode("MANUAL")}
                            className="px-3 py-1 bg-moss-green text-white rounded font-bold hover:bg-moss-green-dark cursor-pointer text-xs"
                          >
                            + Bấm vào đây để nhập thông tin CHT mới trực tiếp
                          </button>
                        </div>
                      )}

                      {/* Thẻ tóm tắt thông tin hội viên được chọn */}
                      {selectedMemberForLeader && (
                        <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-xl p-3.5 space-y-2 text-xs shadow-2xs mt-3">
                          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">⭐</span>
                              <span className="font-bold text-moss-green text-sm sm:text-base">
                                {selectedMemberForLeader.fullName}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                              {selectedMemberForLeader.associationRole === "Chi hội trưởng" ? "Đang là CHT" : "Hội viên chính thức"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-stone-700">
                            <div>
                              <span className="text-stone-500">Năm sinh:</span>{" "}
                              <strong>{selectedMemberForLeader.birthYear}</strong>
                            </div>
                            <div>
                              <span className="text-stone-500">Số CCCD:</span>{" "}
                              <strong className="font-mono">{selectedMemberForLeader.cccd}</strong>
                            </div>
                            <div>
                              <span className="text-stone-500">Số điện thoại:</span>{" "}
                              <strong className="font-mono">{selectedMemberForLeader.phone || "Chưa cập nhật"}</strong>
                            </div>
                            <div>
                              <span className="text-stone-500">Cấp bậc:</span>{" "}
                              <strong>{selectedMemberForLeader.militaryRank || "Chiến sĩ"}</strong>
                            </div>
                          </div>

                          <div className="text-[11px] text-emerald-800 pt-1.5 border-t border-emerald-200 flex items-center gap-1 font-medium">
                            <span>✓</span>
                            <span>
                              Hệ thống tự động cấp quyền Chi hội trưởng và tài khoản đăng nhập (SĐT/CCCD), lưu đồng bộ vào CSDL PostgreSQL.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* PHƯƠNG THỨC 2: NHẬP TRỰC TIẾP THÔNG TIN CHI HỘI TRƯỞNG MỚI */
                    <div className="space-y-3 bg-stone-50 p-3.5 rounded-xl border border-stone-300">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1 uppercase">
                          Họ và tên Chi hội trưởng: *
                        </label>
                        <input
                          type="text"
                          required={leaderInputMode === "MANUAL"}
                          placeholder="VD: Nguyễn Văn Nam"
                          value={manualFullName}
                          onChange={(e) => setManualFullName(e.target.value)}
                          className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-sm text-deep-text font-bold focus:border-moss-green focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1 uppercase">
                            Số CCCD (12 số): *
                          </label>
                          <input
                            type="text"
                            required={leaderInputMode === "MANUAL"}
                            maxLength={12}
                            placeholder="VD: 066065001234"
                            value={manualCccd}
                            onChange={(e) => setManualCccd(e.target.value.replace(/\D/g, ""))}
                            className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-sm text-deep-text font-mono font-bold focus:border-moss-green focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1 uppercase">
                            Số điện thoại liên hệ:
                          </label>
                          <input
                            type="tel"
                            placeholder="VD: 0987654321"
                            value={manualPhone}
                            onChange={(e) => setManualPhone(e.target.value)}
                            className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-sm text-deep-text font-mono focus:border-moss-green focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1 uppercase">
                          Năm sinh:
                        </label>
                        <input
                          type="number"
                          placeholder="1965"
                          value={manualBirthYear}
                          onChange={(e) => setManualBirthYear(e.target.value)}
                          className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:outline-none"
                        />
                      </div>

                      <p className="text-[11px] text-moss-green font-medium">
                        ✓ Khi bấm Lưu, hệ thống sẽ tự động tạo hồ sơ hội viên và cấp quyền Chi hội trưởng cho {selectedBranchHamlet}.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* PHÂN HỆ CẤP TÀI KHOẢN CÁN BỘ XÃ HOẶC HỘI VIÊN */
                <>
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
                        : "Số Căn cước công dân (CCCD 12 số):"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        newRole === "SUPER_ADMIN"
                          ? "VD: canboxa@easupso.com"
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
                      Đơn vị trực thuộc / Thôn Buôn:
                    </label>
                    {newRole === "SUPER_ADMIN" ? (
                      <input
                        type="text"
                        required
                        placeholder="VD: Thường trực Hội CCB Xã"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                      />
                    ) : (
                      <select
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none font-medium"
                      >
                        {EA_SUP_HAMLETS.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    )}
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
                </>
              )}

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
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-moss-green hover:bg-moss-green-dark text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Đang lưu & đồng bộ..."
                    : newRole === "BRANCH_LEADER"
                    ? "Cấp quyền CHT & Lưu"
                    : "Cấp tài khoản & Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
