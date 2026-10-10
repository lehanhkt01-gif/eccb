"use client";

import React from "react";

interface FormattedContentProps {
  content: string;
  className?: string;
}

/**
 * Component parse và render văn bản theo chuẩn định dạng báo chí Hội CCB:
 * - Hỗ trợ in đậm: **nội dung**
 * - Hỗ trợ in nghiêng: *nội dung*
 * - Hỗ trợ gạch đầu dòng: • hoặc - ở đầu dòng
 * - Hỗ trợ thụt đầu dòng: 4 khoảng trắng hoặc tab
 * - Tự động ngắt đoạn văn mượt mà
 */
export default function FormattedContent({ content, className = "" }: FormattedContentProps) {
  if (!content) return null;

  // Tách nội dung thành các đoạn văn theo dấu ngắt dòng kép \n\n
  const paragraphs = content.split(/\n{2,}/);

  // Helper parse inline markdown (**bold**, *italic*)
  const parseInlineStyles = (text: string): React.ReactNode[] => {
    // Regex nhận diện **bold** và *italic*
    // Thứ tự ưu tiên: **bold** trước, sau đó *italic*
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        const inner = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold text-deep-text">
            {inner}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        const inner = part.slice(1, -1);
        return (
          <em key={index} className="italic text-stone-800">
            {inner}
          </em>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return (
    <div className={`space-y-4 text-deep-text leading-relaxed ${className}`}>
      {paragraphs.map((p, pIdx) => {
        const trimmedP = p.trim();
        if (!trimmedP) return null;

        // Tách các dòng bên trong đoạn
        const lines = p.split(/\n/);

        // Kiểm tra xem đoạn này có phải toàn bộ là danh sách gạch đầu dòng không
        const isBulletList = lines.every((line) => line.trim().startsWith("•") || line.trim().startsWith("-"));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-2 my-3 pl-2 sm:pl-4">
              {lines.map((line, lIdx) => {
                const bulletContent = line.trim().replace(/^[•\-]\s*/, "");
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="text-moss-green font-bold text-base leading-snug shrink-0">●</span>
                    <span className="flex-1">{parseInlineStyles(bulletContent)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Đoạn văn thông thường
        return (
          <p key={pIdx} className="text-justify leading-relaxed">
            {lines.map((line, lIdx) => {
              // Kiểm tra xem dòng có thụt lề đầu dòng không (bắt đầu bằng 4 khoảng trắng hoặc tab)
              const isIndented = /^(\s{4,}|\t)/.test(line);
              const cleanLine = line.replace(/^(\s{4,}|\t)/, "");

              // Dòng đơn lẻ là gạch đầu dòng bên trong đoạn văn
              if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
                const bulletContent = line.trim().replace(/^[•\-]\s*/, "");
                return (
                  <span key={lIdx} className="flex items-start gap-2.5 my-1.5 pl-3 sm:pl-5">
                    <span className="text-moss-green font-bold text-sm shrink-0">●</span>
                    <span className="flex-1">{parseInlineStyles(bulletContent)}</span>
                  </span>
                );
              }

              return (
                <span key={lIdx} className="block">
                  {isIndented && <span className="inline-block w-7 sm:w-9" aria-hidden="true" />}
                  {parseInlineStyles(cleanLine)}
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}
