"use client";

import React, { useState } from "react";

interface NewsShareBarProps {
  title?: string;
  url: string;
  summary?: string;
}

export default function NewsShareBar({ title, url, summary }: NewsShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lấy URL tuyệt đối an toàn
  const getFullUrl = () => {
    if (typeof window === "undefined") return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const shareTitle = title || "Bản tin Hội Cựu Chiến Binh Xã Ea Súp";
  const shareSummary = summary || "Cổng thông tin điện tử & Nghiệp vụ Hội Cựu Chiến Binh Xã Ea Súp — Hệ sinh thái Ea Súp Số";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Sao chép link vào bộ nhớ tạm
  const handleCopy = async () => {
    const fullUrl = getFullUrl();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = fullUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showToast("✓ Đã sao chép liên kết bản tin thành công!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      showToast("✓ Đã sao chép liên kết bản tin!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 2. Chia sẻ qua Web Share API (Đa nền tảng: Zalo, Messenger, SMS, Viber, Telegram, Gmail...)
  const handleNativeShare = async () => {
    const fullUrl = getFullUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareTitle}\n${shareSummary}`,
          url: fullUrl,
        });
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      // Fallback nếu trình duyệt không hỗ trợ Web Share API (ví dụ trình duyệt cũ)
      handleCopy();
    }
  };

  return (
    <div className="relative bg-stone-50 border border-stone-200 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 not-print shadow-2xs">
      {/* Toast thông báo nhanh */}
      {toastMessage && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-moss-green text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg border border-bronze-gold animate-in fade-in slide-in-from-bottom-2 duration-150 z-20 whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* Cụm Tiêu đề và 2 Nút Chia Sẻ Tinh Gọn */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1 shrink-0">
          <span>📢</span>
          <span>CHIA SẺ BẢN TIN:</span>
        </span>

        {/* Nút 1: Chia Sẻ (Đa nền tảng: mở Zalo, Messenger, SMS, Telegram, Viber, Gmail...) */}
        <button
          type="button"
          onClick={handleNativeShare}
          className="px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer bg-moss-green hover:bg-moss-green-dark active:scale-95 text-white border border-moss-green-light"
          title="Chia sẻ bản tin đến các ứng dụng trên thiết bị (Zalo, Messenger, Tin nhắn SMS, Gmail, Telegram...)"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Chia Sẻ</span>
        </button>

        {/* Nút 2: Sao chép link */}
        <button
          type="button"
          onClick={handleCopy}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer border active:scale-95 ${
            copied
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-white hover:bg-stone-100 text-deep-text border-stone-300"
          }`}
          title="Sao chép liên kết bản tin để gửi nhanh"
        >
          {copied ? (
            <span>✓</span>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          )}
          <span>{copied ? "Đã chép link!" : "Sao chép link"}</span>
        </button>
      </div>

      {/* Hiển thị URL rút gọn trên màn hình lớn */}
      <div className="text-[11px] text-stone-400 font-mono hidden md:block truncate max-w-xs select-all" title={getFullUrl()}>
        {getFullUrl()}
      </div>
    </div>
  );
}
