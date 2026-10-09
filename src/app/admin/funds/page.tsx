"use client";

import React, { useState } from "react";
import Link from "next/link";

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

  const transactions: FundTransaction[] = [
    {
      id: "TX-2026-001",
      date: "05/10/2026",
      content: "Thu hội phí & Quỹ Nghĩa tình đồng đội Quý IV/2026",
      type: "THU",
      amount: 45000000,
      performer: "Đ/c Trần Văn Nam (Thủ quỹ)",
      hamlet: "20 Thôn, Buôn",
    },
    {
      id: "TX-2026-002",
      date: "02/10/2026",
      content: "Thăm hỏi tặng quà đồng chí cựu chiến binh ốm đau nặng",
      type: "CHI",
      amount: 3500000,
      performer: "Thường trực Hội CCB Xã",
      hamlet: "Thôn 2",
    },
    {
      id: "TX-2026-003",
      date: "28/09/2026",
      content: "Hỗ trợ xây dựng nhà Nghĩa tình đồng đội (Đợt 2)",
      type: "CHI",
      amount: 40000000,
      performer: "Ban Quản lý Quỹ Xã",
      hamlet: "Buôn A",
    },
    {
      id: "TX-2026-004",
      date: "25/09/2026",
      content: "Giải ngân nguồn vốn vay NHCSXH ưu đãi giải quyết việc làm",
      type: "THU",
      amount: 250000000,
      performer: "Tổ TK&VV Hội CCB",
      hamlet: "Thôn 5",
    },
    {
      id: "TX-2026-005",
      date: "15/09/2026",
      content: "Thu hồi vốn vay quay vòng sản xuất kinh doanh tiêu thụ nông sản",
      type: "THU",
      amount: 60000000,
      performer: "Tổ TK&VV Hội CCB",
      hamlet: "Thôn 7",
    },
  ];

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
            Tổng hợp dữ liệu Quỹ Nghĩa tình đồng đội (1,3 tỷ đồng) và 20 Tổ Tiết kiệm &amp; Vay vốn (52,18 tỷ đồng)
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
            👥 612 Hội Viên
          </Link>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Tài Chính Hallmark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border-2 border-bronze-gold shadow-xs space-y-1.5">
          <p className="text-xs font-bold text-bronze-gold uppercase tracking-wider">
            Quỹ Nghĩa Tình Đồng Đội
          </p>
          <p className="text-2xl font-black text-moss-green">1.300.000.000 đ</p>
          <p className="text-[11px] text-deep-muted">Đạt 100% chỉ tiêu 20 thôn, buôn</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-stone-200 shadow-xs space-y-1.5">
          <p className="text-xs font-bold text-moss-green uppercase tracking-wider">
            Dư Nợ Ủy Thác NHCSXH
          </p>
          <p className="text-2xl font-black text-flag-red">52.180.000.000 đ</p>
          <p className="text-[11px] text-deep-muted">20 Tổ TK&amp;VV Hội CCB quản lý</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-stone-200 shadow-xs space-y-1.5">
          <p className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Tỷ Lệ Nợ Quá Hạn
          </p>
          <p className="text-2xl font-black text-emerald-700">0,08 %</p>
          <p className="text-[11px] text-emerald-700 font-semibold">Thuộc nhóm an toàn xuất sắc</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-stone-200 shadow-xs space-y-1.5">
          <p className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Hộ Hội Viên Vay Vốn
          </p>
          <p className="text-2xl font-black text-moss-green">418 / 612</p>
          <p className="text-[11px] text-deep-muted">Hỗ trợ phát triển kinh tế, lúa ST25</p>
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
              {filteredTx.map((tx) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
