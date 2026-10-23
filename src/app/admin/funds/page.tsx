"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getStoredMembers, MemberRecord, getActiveOfficialMembers } from "@/lib/memberStore";

interface FundTransaction {
  id: string;
  date: string;
  content: string;
  type: "THU" | "CHI";
  amount: number;
  performer: string;
  hamlet: string;
}

export default function AdminFundsPage() {
  const [filterType, setFilterType] = useState<"ALL" | "THU" | "CHI">("ALL");
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);

  useEffect(() => {
    const list = getStoredMembers();
    setMembers(list);

    fetch("/api/admin/members", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.members) && data.members.length > 0) {
          setMembers(data.members);
        }
      })
      .catch((err) => console.warn("Lỗi tải hội viên CSDL:", err));
  }, []);

  const officialMembers = useMemo(() => getActiveOfficialMembers(members), [members]);
  const totalLoanAmount = officialMembers.reduce((sum, m) => sum + (m.totalDebt || 0), 0);
  const borrowersCount = officialMembers.filter((m) => (m.totalDebt || 0) > 0).length;

  const filteredTx = transactions.filter(
    (tx) => filterType === "ALL" || tx.type === filterType
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Tiêu Đề */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-moss-green mb-1">
            <span>💰</span>
            <span>CÔNG KHAI MINH BẠCH TÀI CHÍNH QUÂN ĐỘI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-moss-green uppercase">
            Quản Lý Quỹ Nội Bộ &amp; Vốn Vay NHCSXH
          </h1>
          <p className="text-xs sm:text-sm text-deep-muted mt-1">
            Theo dõi thu nộp hội phí, Quỹ Nghĩa tình đồng đội và quản lý vốn vay tín dụng chính sách NHCSXH
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded transition border border-stone-300"
          >
            ← Bảng điều hành
          </Link>
          <Link
            href="/admin/members"
            className="px-3 py-2 bg-moss-green hover:bg-moss-green-dark text-white text-xs font-bold rounded transition"
          >
            👥 {officialMembers.length > 0 ? `${officialMembers.length} Hội Viên` : "Hội Viên"}
          </Link>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Tài Chính Thực Tế */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border-2 border-bronze-gold shadow-xs space-y-1.5">
          <p className="text-xs font-bold text-bronze-gold uppercase tracking-wider">
            Quỹ Nghĩa Tình Đồng Đội
          </p>
          <p className="text-2xl font-black text-moss-green">0 đ</p>
          <p className="text-[11px] text-deep-muted">Chưa có giao dịch phát sinh</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-stone-200 shadow-xs space-y-1.5">
          <p className="text-xs font-bold text-moss-green uppercase tracking-wider">
            Dư Nợ Ủy Thác NHCSXH
          </p>
          <p className="text-2xl font-black text-flag-red">
            {totalLoanAmount > 0 ? `${totalLoanAmount.toLocaleString("vi-VN")} đ` : "0 đ"}
          </p>
          <p className="text-[11px] text-deep-muted">
            {totalLoanAmount > 0 ? "Theo hồ sơ hội viên" : "Chưa có hộ hội viên vay vốn"}
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-stone-200 shadow-xs space-y-1.5">
          <p className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Tỷ Lệ Nợ Quá Hạn
          </p>
          <p className="text-2xl font-black text-emerald-700">0,00 %</p>
          <p className="text-[11px] text-emerald-700 font-semibold">Không có nợ quá hạn</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-stone-200 shadow-xs space-y-1.5">
          <p className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Hộ Hội Viên Vay Vốn
          </p>
          <p className="text-2xl font-black text-moss-green">
            {borrowersCount} / {officialMembers.length}
          </p>
          <p className="text-[11px] text-deep-muted">
            {borrowersCount > 0 ? "Hỗ trợ phát triển kinh tế" : "Chưa có dữ liệu vay vốn"}
          </p>
        </div>
      </div>

      {/* Bảng Nhật Ký Giao Dịch Thu / Chi Gần Nhất */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-cream-surface border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-moss-green uppercase flex items-center gap-2">
            <span>📜</span>
            <span>Nhật Ký Quản Lý Quỹ &amp; Giải Ngân Vốn Gần Nhất</span>
          </h2>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded font-bold transition ${
                filterType === "ALL"
                  ? "bg-moss-green text-white"
                  : "bg-white text-stone-700 border border-stone-300"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType("THU")}
              className={`px-3 py-1 rounded font-bold transition ${
                filterType === "THU"
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-stone-700 border border-stone-300"
              }`}
            >
              Khoản Thu
            </button>
            <button
              onClick={() => setFilterType("CHI")}
              className={`px-3 py-1 rounded font-bold transition ${
                filterType === "CHI"
                  ? "bg-flag-red text-white"
                  : "bg-white text-stone-700 border border-stone-300"
              }`}
            >
              Khoản Chi
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã Phiếu</th>
                <th className="py-3 px-4">Ngày</th>
                <th className="py-3 px-4">Nội Dung Nghiệp Vụ</th>
                <th className="py-3 px-4">Đơn Vị</th>
                <th className="py-3 px-4">Loại</th>
                <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
                <th className="py-3 px-4">Người Phụ Trách</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center text-stone-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📒</span>
                      <p className="font-semibold text-deep-text">
                        Chưa có giao dịch thu/chi phát sinh trong kỳ
                      </p>
                      <p className="text-xs text-stone-400">
                        Số liệu sổ quỹ và giải ngân vốn vay sẽ tự động hiển thị khi có nghiệp vụ thực tế.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-cream-surface/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-moss-green">{tx.id}</td>
                    <td className="py-3 px-4 text-stone-600">{tx.date}</td>
                    <td className="py-3 px-4 font-semibold text-deep-text">{tx.content}</td>
                    <td className="py-3 px-4 text-stone-600">{tx.hamlet}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          tx.type === "THU"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        }`}
                      >
                        {tx.type === "THU" ? "Thu Quỹ" : "Chi Hoạt Động"}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-black ${
                        tx.type === "THU" ? "text-emerald-700" : "text-flag-red"
                      }`}
                    >
                      {tx.type === "THU" ? "+" : "-"}
                      {tx.amount.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-3 px-4 text-deep-muted">{tx.performer}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
