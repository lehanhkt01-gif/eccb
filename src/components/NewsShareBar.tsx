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

  // 2. Chia sẻ qua Web Share API (Đa nền tảng di động: Zalo, Messenger, SMS, Viber, Telegram, Gmail...)
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
      // Fallback nếu trình duyệt không hỗ trợ Web Share API
      handleCopy();
    }
  };

  // 3. Chia sẻ trực tiếp qua Zalo
  const handleZaloShare = () => {
    const fullUrl = getFullUrl();
    const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(shareTitle)}`;
    window.open(zaloUrl, "_blank", "width=600,height=520,noopener,noreferrer");
  };

  // 4. Chia sẻ trực tiếp qua Facebook
  const handleFacebookShare = () => {
    const fullUrl = getFullUrl();
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
    window.open(fbUrl, "_blank", "width=600,height=520,noopener,noreferrer");
  };

  return (
    <div className="relative bg-stone-50 border border-stone-200 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 not-print shadow-2xs">
      {/* Toast thông báo nhanh */}
      {toastMessage && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-moss-green text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg border border-bronze-gold animate-in fade-in slide-in-from-bottom-2 duration-150 z-20 whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* Cụm Tiêu đề và Các Nút Chia Sẻ Đa Kênh */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1 shrink-0">
          <span>📢</span>
          <span>CHIA SẺ BẢN TIN:</span>
        </span>

        {/* Nút 1: Zalo */}
        <button
          type="button"
          onClick={handleZaloShare}
          className="px-2.5 py-1.5 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer bg-[#0068FF] hover:bg-[#0052cc] active:scale-95 text-white border border-[#0052cc]"
          title="Chia sẻ bản tin qua Zalo (Bạn bè, Nhóm Chi hội)"
        >
          <span className="font-black text-[11px] bg-white text-[#0068FF] px-1 py-0.2 rounded font-sans leading-none">
            Zalo
          </span>
          <span className="hidden sm:inline">Zalo</span>
        </button>

        {/* Nút 2: Facebook */}
        <button
          type="button"
          onClick={handleFacebookShare}
          className="px-2.5 py-1.5 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer bg-[#1877F2] hover:bg-[#1464cc] active:scale-95 text-white border border-[#1464cc]"
          title="Chia sẻ bản tin lên Facebook"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="hidden sm:inline">Facebook</span>
        </button>

        {/* Nút 3: Ứng dụng khác (Native Share API: Mở Zalo, Messenger, SMS, Viber, Telegram, Gmail...) */}
        <button
          type="button"
          onClick={handleNativeShare}
          className="px-2.5 py-1.5 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer bg-moss-green hover:bg-moss-green-dark active:scale-95 text-white border border-moss-green-light"
          title="Chia sẻ đến các ứng dụng khác trên thiết bị (Zalo, Messenger, Tin nhắn SMS, Gmail, Telegram...)"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Ứng dụng khác...</span>
        </button>

        {/* Nút 4: Sao chép link */}
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
