"use client";

import React, { useState } from "react";

interface NewsShareBarProps {
  title?: string;
  url: string;
  summary?: string;
}

export default function NewsShareBar({ url }: NewsShareBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 not-print">
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
          CHIA SẺ BẢN TIN:
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer border active:scale-95 ${
            copied
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-white hover:bg-stone-100 text-deep-text border-stone-300"
          }`}
          title="Sao chép liên kết bản tin để chia sẻ"
        >
          <span>{copied ? "✓" : "🔗"}</span>
          <span>{copied ? "Đã chép link!" : "Sao chép link"}</span>
        </button>
      </div>

      <div className="text-[11px] text-stone-400 font-mono hidden sm:block truncate max-w-xs">
        {url}
      </div>
    </div>
  );
}
