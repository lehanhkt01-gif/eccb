"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { setCurrentUser, getMemberCustomPassword } from "@/lib/authSession";
import { getStoredMembers } from "@/lib/memberStore";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"admin" | "branch" | "member">("member");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role");
      if (roleParam === "branch") {
        setActiveTab("branch");
      } else if (roleParam === "admin") {
        setActiveTab("admin");
      } else {
        setActiveTab("member");
      }
      setUsername("");
      setPassword("");
    }
  }, []);

  const handleTabChange = (tab: "admin" | "branch" | "member") => {
    setActiveTab(tab);
    setErrorMessage("");
    setPassword("");
    setUsername("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const cleanUser = username.trim();
    const cleanPass = password;

    if (!cleanUser || !cleanPass) {
      setErrorMessage("Vui lòng nhập đầy đủ tên đăng nhập/CCCD và mật khẩu.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Gửi yêu cầu xác thực tới API server (API đọc mật khẩu từ .env hoặc Database)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUser,
          password: cleanPass,
          requestedRole: activeTab,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          // Kiểm tra khớp quyền theo tab yêu cầu trước khi chuyển trang
          if (activeTab === "branch" && data.role !== "BRANCH_LEADER" && data.role !== "SUPER_ADMIN") {
            setErrorMessage("Bạn chưa được cấp quyền chi hội trưởng");
            setIsLoading(false);
            return;
          }
          if (activeTab === "admin" && data.role !== "SUPER_ADMIN") {
            setErrorMessage("Bạn không có quyền quản trị Cán bộ xã.");
            setIsLoading(false);
            return;
          }

          setCurrentUser(data.user);
          if (data.role === "SUPER_ADMIN") {
            router.push(activeTab === "branch" ? "/branch" : "/admin");
          } else if (data.role === "BRANCH_LEADER") {
            router.push("/branch");
          } else {
            router.push("/member");
          }
          return;
        } else {
          setErrorMessage(data.message || "Xác thực không thành công.");
          setIsLoading(false);
          return;
        }
      }

      if (res.status === 403) {
        const errorData = await res.json().catch(() => null);
        setErrorMessage(
          errorData?.message ||
            (activeTab === "branch"
              ? "Bạn chưa được cấp quyền chi hội trưởng"
              : "Tài khoản không đủ quyền truy cập.")
        );
        setIsLoading(false);
        return;
      }

      if (res.status === 401 || res.status === 404 || res.status === 400) {
        const errorData = await res.json().catch(() => null);
        setErrorMessage(errorData?.message || "Tên đăng nhập hoặc mật khẩu không chính xác.");
        setIsLoading(false);
        return;
      }
    } catch {
      // 2. Fallback xử lý khi chạy trong môi trường tĩnh (Static Export / GitHub Pages)
      const isNumericId = /^\d{10,12}$/.test(cleanUser);
      const cleanLower = cleanUser.toLowerCase();

      // Kiểm tra mật khẩu đã tự đổi của hội viên trong bộ nhớ trình duyệt
      const customPass = isNumericId ? getMemberCustomPassword(cleanUser) : null;
      if (customPass && cleanPass === customPass) {
        const members = getStoredMembers();
        const mem = members.find((m) => m.cccd === cleanUser || m.phone === cleanUser);
        const isMemCht = mem?.associationRole === "Chi hội trưởng" || mem?.id?.startsWith("CHT_");

        if (activeTab === "branch") {
          if (!isMemCht) {
            setErrorMessage("Bạn chưa được cấp quyền chi hội trưởng");
            setIsLoading(false);
            return;
          }
          setCurrentUser({
            username: cleanUser,
            cccd: mem ? mem.cccd : cleanUser,
            fullName: mem ? mem.fullName : "Chi hội trưởng",
            phone: mem?.phone || "",
            hamletName: mem?.hamletName || "Hội CCB Xã Ea Súp",
            role: "BRANCH_LEADER",
          });
          router.push("/branch");
          return;
        }

        if (activeTab === "admin") {
          setErrorMessage("Bạn không có quyền quản trị Cán bộ xã.");
          setIsLoading(false);
          return;
        }

        setCurrentUser({
          username: cleanUser,
          cccd: cleanUser,
          fullName: mem ? mem.fullName : "Hội viên Cựu Chiến Binh",
          phone: mem?.phone || "",
          hamletName: mem?.hamletName || "Hội CCB Xã Ea Súp",
          role: "MEMBER",
        });
        router.push("/member");
        return;
      }

      // Xử lý chuyển hướng theo định dạng tài khoản trên bản demo tĩnh
      if (cleanLower.includes("lehanh") || cleanLower.includes("trunghieu") || cleanLower.includes("hanh")) {
        const isLeHanh = cleanLower.includes("lehanh") || cleanLower.includes("hanh");
        setCurrentUser({
          username: isLeHanh ? "lehanhkt01" : "trunghieuktkt",
          email: isLeHanh ? "lehanhkt01@gmail.com" : "trunghieuktkt@gmail.com",
          fullName: isLeHanh ? "Lê Hạnh" : "Đặng Trung Hiếu",
          role: "SUPER_ADMIN",
        });
        router.push(activeTab === "branch" ? "/branch" : "/admin");
        return;
      } else if (cleanLower.startsWith("chihoi_")) {
        const branchKey = cleanLower.replace("chihoi_", "");
        const hamletMap: Record<string, { code: string; name: string; leader: string; phone: string; cccd: string }> = {
          buon_a: { code: "BUON_A", name: "Buôn A", leader: "Y Nô Rcăm", phone: "0372989270", cccd: "0372989270" },
          buon_b: { code: "BUON_B", name: "Buôn B", leader: "Đoàn Hữu Tiến", phone: "0935833737", cccd: "034050005833" },
          buon_c: { code: "BUON_C", name: "Buôn C", leader: "Y Dyơng Êban", phone: "0839931193", cccd: "0839931193" },
          thon_hoabinh: { code: "THON_HOABINH", name: "Thôn Hòa Bình", leader: "Lê Văn Hồng", phone: "0977979709", cccd: "0420670022" },
          thon_thangloi: { code: "THON_THANGLOI", name: "Thôn Thắng Lợi", leader: "Nguyễn Văn Đông", phone: "0828838929", cccd: "025065000445" },
          thon_doanket: { code: "THON_DOANKET", name: "Thôn Đoàn Kết", leader: "Nguyễn Văn Sơn", phone: "0913779468", cccd: "040059000718" },
          thon_binhloi: { code: "THON_BINHLOI", name: "Thôn Bình Lợi", leader: "Lục Văn Cường", phone: "0338561794", cccd: "004082002052" },
          thon_01: { code: "THON_01", name: "Thôn 1", leader: "Hồ Sỹ Tuấn", phone: "0986042302", cccd: "0986042302" },
          thon_02: { code: "THON_02", name: "Thôn 2", leader: "Nguyễn Đức Lợi", phone: "0356912318", cccd: "049068000834" },
          thon_03: { code: "THON_03", name: "Thôn 3", leader: "Nguyễn Văn Dũng", phone: "0342302292", cccd: "034079011156" },
          thon_04: { code: "THON_04", name: "Thôn 4", leader: "Nguyễn Phú Bốn", phone: "0367875231", cccd: "038065009462" },
          thon_05: { code: "THON_05", name: "Thôn 5", leader: "Vũ Văn Đạt", phone: "0327560358", cccd: "034065009537" },
          thon_06: { code: "THON_06", name: "Thôn 6", leader: "Đỗ Thị Lan", phone: "0343800948", cccd: "033155002814" },
          thon_07: { code: "THON_07", name: "Thôn 7", leader: "Nguyễn Văn Minh", phone: "0975384025", cccd: "024055000072" },
          thon_08: { code: "THON_08", name: "Thôn 8", leader: "Trần Thanh Hùng", phone: "0397508052", cccd: "048069000332" },
          thon_09: { code: "THON_09", name: "Thôn 9", leader: "Trần Văn Cảnh", phone: "0342869974", cccd: "066089001142" },
          thon_10: { code: "THON_10", name: "Thôn 10", leader: "Nguyễn Lai", phone: "0986911610", cccd: "048068000489" },
          thon_11: { code: "THON_11", name: "Thôn 11", leader: "Huỳnh Công Dũng", phone: "0359326437", cccd: "049060000688" },
          thon_12: { code: "THON_12", name: "Thôn 12", leader: "Triệu Đức Quyên", phone: "0857603535", cccd: "006089000161" },
          thon_13: { code: "THON_13", name: "Thôn 13", leader: "Hoàng Văn Tuyên", phone: "0984594812", cccd: "004077000098" },
        };
        const branchInfo = hamletMap[branchKey] || {
          code: `THON_${branchKey.toUpperCase()}`,
          name: `Thôn ${branchKey.toUpperCase()}`,
          leader: `Chi hội trưởng ${branchKey.toUpperCase()}`,
          phone: "",
          cccd: "",
        };

        setCurrentUser({
          username: cleanLower,
          fullName: `Đ/c ${branchInfo.leader}`,
          role: "BRANCH_LEADER",
          hamletCode: branchInfo.code,
          hamletName: branchInfo.name,
        });
        router.push("/branch");
        return;
      } else if (isNumericId) {
        // Danh sách ánh xạ 20 Chi hội trưởng (hỗ trợ cả CCCD và SĐT)
        const CHT_MAP: Record<string, { code: string; name: string; leader: string; phone: string; cccd: string }> = {
          "0372989270": { code: "BUON_A", name: "Buôn A", leader: "Y Nô Rcăm", phone: "0372989270", cccd: "0372989270" },
          "0982257421": { code: "BUON_A", name: "Buôn A", leader: "Y Nô Rcăm", phone: "0372989270", cccd: "0372989270" },
          "034050005833": { code: "BUON_B", name: "Buôn B", leader: "Đoàn Hữu Tiến", phone: "0935833737", cccd: "034050005833" },
          "0935833737": { code: "BUON_B", name: "Buôn B", leader: "Đoàn Hữu Tiến", phone: "0935833737", cccd: "034050005833" },
          "0839931193": { code: "BUON_C", name: "Buôn C", leader: "Y Dyơng Êban", phone: "0839931193", cccd: "0839931193" },
          "0420670022": { code: "THON_HOABINH", name: "Thôn Hòa Bình", leader: "Lê Văn Hồng", phone: "0977979709", cccd: "0420670022" },
          "0977979709": { code: "THON_HOABINH", name: "Thôn Hòa Bình", leader: "Lê Văn Hồng", phone: "0977979709", cccd: "0420670022" },
          "025065000445": { code: "THON_THANGLOI", name: "Thôn Thắng Lợi", leader: "Nguyễn Văn Đông", phone: "0828838929", cccd: "025065000445" },
          "0828838929": { code: "THON_THANGLOI", name: "Thôn Thắng Lợi", leader: "Nguyễn Văn Đông", phone: "0828838929", cccd: "025065000445" },
          "040059000718": { code: "THON_DOANKET", name: "Thôn Đoàn Kết", leader: "Nguyễn Văn Sơn", phone: "0913779468", cccd: "040059000718" },
          "0913779468": { code: "THON_DOANKET", name: "Thôn Đoàn Kết", leader: "Nguyễn Văn Sơn", phone: "0913779468", cccd: "040059000718" },
          "004082002052": { code: "THON_BINHLOI", name: "Thôn Bình Lợi", leader: "Lục Văn Cường", phone: "0338561794", cccd: "004082002052" },
          "0338561794": { code: "THON_BINHLOI", name: "Thôn Bình Lợi", leader: "Lục Văn Cường", phone: "0338561794", cccd: "004082002052" },
          "0986042302": { code: "THON_01", name: "Thôn 1", leader: "Hồ Sỹ Tuấn", phone: "0986042302", cccd: "0986042302" },
          "049068000834": { code: "THON_02", name: "Thôn 2", leader: "Nguyễn Đức Lợi", phone: "0356912318", cccd: "049068000834" },
          "049068000884": { code: "THON_02", name: "Thôn 2", leader: "Nguyễn Đức Lợi", phone: "0356912318", cccd: "049068000834" },
          "0356912318": { code: "THON_02", name: "Thôn 2", leader: "Nguyễn Đức Lợi", phone: "0356912318", cccd: "049068000834" },
          "034079011156": { code: "THON_03", name: "Thôn 3", leader: "Nguyễn Văn Dũng", phone: "0342302292", cccd: "034079011156" },
          "0342302292": { code: "THON_03", name: "Thôn 3", leader: "Nguyễn Văn Dũng", phone: "0342302292", cccd: "034079011156" },
          "038065009462": { code: "THON_04", name: "Thôn 4", leader: "Nguyễn Phú Bốn", phone: "0367875231", cccd: "038065009462" },
          "0367875231": { code: "THON_04", name: "Thôn 4", leader: "Nguyễn Phú Bốn", phone: "0367875231", cccd: "038065009462" },
          "034065009537": { code: "THON_05", name: "Thôn 5", leader: "Vũ Văn Đạt", phone: "0327560358", cccd: "034065009537" },
          "0327560358": { code: "THON_05", name: "Thôn 5", leader: "Vũ Văn Đạt", phone: "0327560358", cccd: "034065009537" },
          "033155002814": { code: "THON_06", name: "Thôn 6", leader: "Đỗ Thị Lan", phone: "0343800948", cccd: "033155002814" },
          "0343800948": { code: "THON_06", name: "Thôn 6", leader: "Đỗ Thị Lan", phone: "0343800948", cccd: "033155002814" },
          "024055000072": { code: "THON_07", name: "Thôn 7", leader: "Nguyễn Văn Minh", phone: "0975384025", cccd: "024055000072" },
          "0975384025": { code: "THON_07", name: "Thôn 7", leader: "Nguyễn Văn Minh", phone: "0975384025", cccd: "024055000072" },
          "048069000332": { code: "THON_08", name: "Thôn 8", leader: "Trần Thanh Hùng", phone: "0397508052", cccd: "048069000332" },
          "0397508052": { code: "THON_08", name: "Thôn 8", leader: "Trần Thanh Hùng", phone: "0397508052", cccd: "048069000332" },
          "066089001142": { code: "THON_09", name: "Thôn 9", leader: "Trần Văn Cảnh", phone: "0342869974", cccd: "066089001142" },
          "0342869974": { code: "THON_09", name: "Thôn 9", leader: "Trần Văn Cảnh", phone: "0342869974", cccd: "066089001142" },
          "048068000489": { code: "THON_10", name: "Thôn 10", leader: "Nguyễn Lai", phone: "0986911610", cccd: "048068000489" },
          "0986911610": { code: "THON_10", name: "Thôn 10", leader: "Nguyễn Lai", phone: "0986911610", cccd: "048068000489" },
          "049060000688": { code: "THON_11", name: "Thôn 11", leader: "Huỳnh Công Dũng", phone: "0359326437", cccd: "049060000688" },
          "0359326437": { code: "THON_11", name: "Thôn 11", leader: "Huỳnh Công Dũng", phone: "0359326437", cccd: "049060000688" },
          "006089000161": { code: "THON_12", name: "Thôn 12", leader: "Triệu Đức Quyên", phone: "0857603535", cccd: "006089000161" },
          "0857603535": { code: "THON_12", name: "Thôn 12", leader: "Triệu Đức Quyên", phone: "0857603535", cccd: "006089000161" },
          "004077000098": { code: "THON_13", name: "Thôn 13", leader: "Hoàng Văn Tuyên", phone: "0984594812", cccd: "004077000098" },
          "0984594812": { code: "THON_13", name: "Thôn 13", leader: "Hoàng Văn Tuyên", phone: "0984594812", cccd: "004077000098" },
        };

        const chtInfo = CHT_MAP[cleanUser];
        const members = getStoredMembers();
        const mem = members.find((m) => m.cccd === cleanUser || m.phone === cleanUser);
        const isChtUser = !!chtInfo || mem?.associationRole === "Chi hội trưởng" || mem?.id?.startsWith("CHT_");

        if (activeTab === "branch") {
          if (!isChtUser) {
            setErrorMessage("Bạn chưa được cấp quyền chi hội trưởng");
            setIsLoading(false);
            return;
          }

          setCurrentUser({
            username: cleanUser,
            cccd: chtInfo?.cccd || mem?.cccd || cleanUser,
            fullName: chtInfo ? `Đ/c ${chtInfo.leader}` : (mem ? mem.fullName : "Chi hội trưởng"),
            phone: chtInfo?.phone || mem?.phone || "",
            role: "BRANCH_LEADER",
            hamletCode: chtInfo?.code || "",
            hamletName: chtInfo?.name || mem?.hamletName || "Chi hội",
          });
          router.push("/branch");
          return;
        }

        if (activeTab === "admin") {
          setErrorMessage("Bạn không có quyền quản trị Cán bộ xã.");
          setIsLoading(false);
          return;
        }

        if (mem) {
          setCurrentUser({
            username: mem.cccd,
            cccd: mem.cccd,
            fullName: mem.fullName,
            phone: mem.phone || "",
            hamletName: mem.hamletName,
            role: "MEMBER",
          });
          router.push("/member");
          return;
        }
      }
    }

    setErrorMessage("Không thể hoàn tất đăng nhập. Vui lòng kiểm tra lại thông tin và mật khẩu.");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream-bg text-deep-text flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header Nhỏ */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between text-xs text-deep-muted">
        <Link href="/" className="font-bold text-moss-green hover:underline flex items-center gap-1">
          ← Về Cổng Thông Tin
        </Link>
        <span className="font-semibold text-amber-700">Hệ sinh thái Ea Súp Số</span>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl border-4 border-bronze-gold shadow-2xl p-6 sm:p-8 space-y-5 my-4">
        {/* Biểu trưng Huy hiệu CCB */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-4 border-bronze-gold flex items-center justify-center shadow-lg mx-auto overflow-hidden">
            <Image
              src="/images/logovip.png"
              alt="Logo Hội CCB Việt Nam"
              width={70}
              height={70}
              className="object-contain p-1"
              priority
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-bronze-gold">
              HỆ THỐNG XÁC THỰC BẢO MẬT
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase text-moss-green tracking-tight">
              E-CCB Ea Súp
            </h1>
            <p className="text-xs text-deep-muted">
              Đăng nhập Cán bộ Xã, Chi hội trưởng &amp; Hội viên
            </p>
          </div>
        </div>

        {/* 3 Tabs Phân Hệ Đăng Nhập: Hội viên -> Chi Hội -> Cán bộ xã */}
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabChange("member")}
            className={`py-2 px-1 rounded-lg transition text-center cursor-pointer ${
              activeTab === "member"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-stone-600 hover:text-moss-green"
            }`}
          >
            🎖️ Hội Viên
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("branch")}
            className={`py-2 px-1 rounded-lg transition text-center cursor-pointer ${
              activeTab === "branch"
                ? "bg-bronze-gold text-white shadow-xs"
                : "text-stone-600 hover:text-moss-green"
            }`}
          >
            📱 Chi Hội
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("admin")}
            className={`py-2 px-1 rounded-lg transition text-center cursor-pointer ${
              activeTab === "admin"
                ? "bg-moss-green text-white shadow-xs"
                : "text-stone-600 hover:text-moss-green"
            }`}
          >
            🏛️ Cán bộ xã
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border-l-4 border-flag-red text-flag-red text-xs font-bold rounded-r">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Form đăng nhập */}
        <form onSubmit={handleSubmit} method="POST" className="space-y-4">
          {/* Trường Tên đăng nhập */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-xs font-bold uppercase tracking-wider text-deep-text block"
            >
              {activeTab === "admin"
                ? "Email Cán bộ Thường trực:"
                : activeTab === "branch"
                ? "Tài khoản Chi Hội:"
                : "Số Căn cước công dân (CCCD 12 số):"}
            </label>
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder={
                  activeTab === "admin"
                    ? "Nhập email cán bộ quản trị..."
                    : activeTab === "branch"
                    ? "Nhập tên tài khoản chi hội..."
                    : "Nhập số CCCD (12 chữ số)..."
                }
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-lg text-base font-semibold text-deep-text placeholder-stone-400 focus:border-moss-green focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Trường Mật khẩu */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-deep-text block"
            >
              Mật khẩu:
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-11 bg-stone-50 border-2 border-stone-300 rounded-lg text-base font-semibold text-deep-text placeholder-stone-400 focus:border-moss-green focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-moss-green transition-colors p-1 cursor-pointer"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.772M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Tùy chọn Ghi nhớ */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-deep-muted font-medium">
              <input
                type="checkbox"
                name="remember"
                id="remember"
                defaultChecked
                className="rounded border-stone-300 text-moss-green focus:ring-moss-green"
              />
              <span>Ghi nhớ phiên đăng nhập</span>
            </label>
          </div>

          {/* Nút Đăng Nhập */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-moss-green hover:bg-emerald-900 active:scale-98 text-white font-bold text-base uppercase tracking-wider rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isLoading ? "Đang xác thực..." : "🛡️ ĐĂNG NHẬP HỆ THỐNG"}</span>
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-stone-500 py-2">
        © 2026 Hội Cựu Chiến Binh Xã Ea Súp • Hệ sinh thái Ea Súp Số (ccb.easupso.com)
      </footer>
    </div>
  );
}
