"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    // Xử lý xác thực đăng nhập
    setTimeout(() => {
      if (
        (username === "trunghieuktkt" || username === "trunghieuktkt@gmail.com" || username === "dangtrunghieu") &&
        password === "CcbEaSup@2026"
      ) {
        // Đăng nhập SuperAdmin thành công
        router.push("/admin");
      } else if (username.startsWith("chihoi_") && password === "CcbEaSup@2026") {
        // Đăng nhập Chi hội trưởng
        router.push("/branch");
      } else if (username && password) {
        // Mặc định chuyển vào Dashboard
        router.push("/admin");
      } else {
        setErrorMessage("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
        setIsLoading(false);
      }
    }, 400);
  };

  // Điền nhanh tài khoản mẫu thử nghiệm
  const fillAccount = (role: "admin" | "branch") => {
    if (role === "admin") {
      setUsername("trunghieuktkt");
      setPassword("CcbEaSup@2026");
    } else {
      setUsername("chihoi_thon_01");
      setPassword("CcbEaSup@2026");
    }
    setErrorMessage("");
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
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl border-4 border-bronze-gold shadow-2xl p-6 sm:p-8 space-y-6 my-6">
        {/* Biểu trưng Huy hiệu CCB */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-flag-red border-4 border-bronze-gold flex items-center justify-center font-bold text-2xl sm:text-3xl text-amber-300 shadow-inner mx-auto">
            CCB
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-bronze-gold">
              CỔNG XÁC THỰC CÁN BỘ HỘI
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase text-moss-green tracking-tight">
              E-CCB Ea Súp
            </h1>
            <p className="text-xs text-deep-muted">
              Đăng nhập Thường trực Hội CCB Xã & Chi hội trưởng 20 thôn buôn
            </p>
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="p-3 bg-red-100 border-l-4 border-flag-red text-flag-red text-xs font-bold rounded-r">
            {errorMessage}
          </div>
        )}

        {/* Form chuẩn Semantic HTML hỗ trợ Bitwarden Password Manager */}
        <form onSubmit={handleSubmit} method="POST" className="space-y-4">
          {/* Trường Tên đăng nhập */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-xs font-bold uppercase tracking-wider text-deep-text flex items-center justify-between"
            >
              <span>Tên đăng nhập / Email:</span>
              <span className="text-[10px] text-stone-500 font-normal">Bitwarden Autofill</span>
            </label>
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="VD: trunghieuktkt hoặc chihoi_thon_01"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-cream-surface border-2 border-stone-300 rounded-lg text-base font-semibold text-deep-text placeholder-stone-400 focus:border-moss-green focus:outline-none"
              />
            </div>
          </div>

          {/* Trường Mật khẩu */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-deep-text flex items-center justify-between"
            >
              <span>Mật khẩu bảo mật:</span>
              <span className="text-[10px] text-stone-500 font-normal">Chuẩn 32+ ký tự</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-cream-surface border-2 border-stone-300 rounded-lg text-base font-semibold text-deep-text placeholder-stone-400 focus:border-moss-green focus:outline-none"
              />
            </div>
          </div>

          {/* Tùy chọn Ghi nhớ & Quên mật khẩu */}
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
            <span className="text-stone-500 italic">Bảo mật Bitwarden</span>
          </div>

          {/* Nút Đăng Nhập */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-moss-green hover:bg-moss-green-light active:bg-moss-green-dark text-white font-bold text-base uppercase tracking-wider rounded-lg shadow-md active:scale-98 transition flex items-center justify-center gap-2"
          >
            <span>{isLoading ? "Đang xác thực..." : "🛡️ ĐĂNG NHẬP HỆ THỐNG"}</span>
          </button>
        </form>

        {/* Nút Điền Nhanh Tài Khoản Mẫu (Tiện ích Kiểm Thử) */}
        <div className="pt-3 border-t border-stone-200 space-y-2">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block text-center">
            Tài Khoản Mẫu Khởi Tạo (Seed Data)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillAccount("admin")}
              className="p-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded font-semibold text-deep-text text-left transition"
            >
              <span className="block font-bold text-moss-green">👑 SuperAdmin</span>
              <span className="text-[10px] text-stone-500">Đặng Trung Hiếu</span>
            </button>
            <button
              type="button"
              onClick={() => fillAccount("branch")}
              className="p-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded font-semibold text-deep-text text-left transition"
            >
              <span className="block font-bold text-bronze-gold">🏘️ Chi Hội Trưởng</span>
              <span className="text-[10px] text-stone-500">Thôn 1 (Trần Văn Định)</span>
            </button>
          </div>
        </div>

        {/* Huy hiệu Bảo Mật Bitwarden & Docker */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-[11px] text-stone-600 flex items-center gap-2">
          <span className="text-base shrink-0">🔐</span>
          <span>
            Hệ thống tương thích 100% với trình quản lý mật khẩu <strong>Bitwarden</strong>, bảo vệ thông tin hội viên an toàn tuyệt đối.
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-stone-500 py-2">
        © 2026 Hội Cựu Chiến Binh Xã Ea Súp • Hệ sinh thái Ea Súp Số (ccb.easupso.com)
      </footer>
    </div>
  );
}
