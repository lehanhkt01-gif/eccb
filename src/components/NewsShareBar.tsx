"use client";

import React, { useState } from "react";

interface NewsShareBarProps {
  title: string;
  url: string;
  summary: string;
}

export default function NewsShareBar({ title, url, summary }: NewsShareBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleShareFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "width=600,height=500,noopener,noreferrer");
  };

  const handleShareZalo = () => {
    // URL chia sẻ chính thức của Zalo
    const zaloUrl = `https://sp.zalo.me/share_inline?link=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(summary)}`;
    window.open(zaloUrl, "_blank", "width=600,height=600,noopener,noreferrer");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 not-print">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Chia sẻ bản tin:
        </span>
        <div className="flex items-center gap-2">
          {/* Nút Chia sẻ Zalo */}
          <button
            type="button"
            onClick={handleShareZalo}
            className="px-3 py-1.5 bg-[#0068FF] hover:bg-[#0055d4] active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Chia sẻ lên Zalo hoặc nhóm Chi hội CCB"
          >
            <span className="text-sm font-black bg-white text-[#0068FF] px-1 rounded text-[10px]">Z</span>
            <span>Chia sẻ Zalo</span>
          </button>

          {/* Nút Chia sẻ Facebook */}
          <button
            type="button"
            onClick={handleShareFacebook}
            className="px-3 py-1.5 bg-[#1877F2] hover:bg-[#0d65d9] active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Chia sẻ lên Facebook"
          >
            <span className="text-sm font-black">f</span>
            <span className="hidden sm:inline">Facebook</span>
          </button>

          {/* Nút Sao chép liên kết */}
          <button
            type="button"
            onClick={handleCopy}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer border ${
              copied
                ? "bg-emerald-600 text-white border-emerald-700"
                : "bg-white hover:bg-stone-100 text-deep-text border-stone-300"
            }`}
            title="Sao chép liên kết bài viết gửi tin nhắn SMS / Nhóm"
          >
            <span>{copied ? "✓" : "🔗"}</span>
            <span>{copied ? "Đã chép link!" : "Sao chép link"}</span>
          </button>
        </div>
      </div>

      {/* Nút In ấn bản tin */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-xs font-semibold text-stone-600 flex items-center gap-1 cursor-pointer transition"
          title="In bản tin văn bản phục vụ sinh hoạt chi bộ / chi hội"
        >
          <span>🖨️</span>
          <span className="hidden sm:inline">In bản tin</span>
        </button>
      </div>
    </div>
  );
}
