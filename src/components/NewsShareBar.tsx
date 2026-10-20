"use client";

import React, { useState } from "react";
import { NewsAudioPlayer, ArticleMeta } from "./NewsAudioPlayer";

interface NewsShareBarProps {
  title?: string;
  url: string;
  summary?: string;
  newsId?: string;
  content?: string;
  contentHtml?: string;
  nextArticle?: ArticleMeta | null;
}

export default function NewsShareBar({
  title,
  url,
  summary,
  newsId,
  content,
  contentHtml,
  nextArticle,
}: NewsShareBarProps) {
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

  // 1. Sao chép link vào bộ nhớ tạm (dùng làm fallback khi trình duyệt không hỗ trợ Web Share API)
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
      showToast("✓ Đã sao chép liên kết bản tin thành công!");
    } catch {
      showToast("✓ Đã sao chép liên kết bản tin!");
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
    <div className="relative bg-stone-50 border border-stone-200 rounded-xl p-2.5 sm:p-3 flex items-center gap-2 flex-wrap not-print shadow-2xs">
      {/* Toast thông báo nhanh */}
      {toastMessage && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-moss-green text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg border border-bronze-gold animate-in fade-in slide-in-from-bottom-2 duration-150 z-20 whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 1. Nút Nghe đọc bản tin tự động (Đưa lên vị trí đầu tiên) */}
      {newsId && (
        <NewsAudioPlayer
          newsId={newsId}
          title={shareTitle}
          summary={shareSummary}
          content={content}
          contentHtml={contentHtml}
          nextArticle={nextArticle}
        />
      )}

      {/* Vạch phân cách nhẹ giữa Nghe đọc và Chia sẻ */}
      {newsId && <span className="w-px h-5 bg-stone-300 mx-0.5 inline-block shrink-0" />}

      {/* 2. Nút Chia Sẻ (Đa nền tảng: Zalo, Messenger, SMS, Telegram, Viber, Gmail...) */}
      <button
        type="button"
        onClick={handleNativeShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer bg-white hover:bg-stone-100 text-deep-text border border-stone-300 active:scale-95 shrink-0"
        title="Chia sẻ bản tin đến các ứng dụng trên thiết bị (Zalo, Messenger, Tin nhắn SMS, Gmail, Telegram...)"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>Chia Sẻ</span>
      </button>
    </div>
  );
}
