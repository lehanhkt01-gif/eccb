"use client";

import React from "react";

interface FormattedContentProps {
  content: string;
  className?: string;
}

/**
 * Component parse và render văn bản thông minh theo chuẩn báo chí Hội Cựu Chiến Binh:
 * - Hỗ trợ in đậm: **nội dung** hoặc dòng bắt đầu bằng **
 * - Hỗ trợ in nghiêng: *nội dung* hoặc dòng bắt đầu bằng *
 * - Hỗ trợ cả đậm & nghiêng: ***nội dung***
 * - Hỗ trợ gạch đầu dòng: • , - hoặc * [khoảng trắng]
 * - Hỗ trợ thụt đầu dòng: 4 khoảng trắng hoặc tab
 * - Hỗ trợ đề mục: ## hoặc ###
 * - Xử lý thông minh khi người dùng quên dấu đóng markdown ở cuối dòng
 */
export default function FormattedContent({ content, className = "" }: FormattedContentProps) {
  if (!content) return null;

  // Helper parse inline markdown (**bold**, *italic*, ***both***)
  const parseInlineStyles = (text: string): React.ReactNode[] => {
    if (!text) return [];

    // Regex nhận diện ***bold italic***, **bold**, *italic*
    const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // 1. In đậm + Nghiêng: ***text***
      if (part.startsWith("***") && part.endsWith("***") && part.length >= 6) {
        const inner = part.slice(3, -3);
        return (
          <strong key={index} className="font-bold italic text-deep-text">
            {inner}
          </strong>
        );
      }
      // 2. In đậm: **text**
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        const inner = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold text-deep-text">
            {inner}
          </strong>
        );
      }
      // 3. In nghiêng: *text*
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        const inner = part.slice(1, -1);
        return (
          <em key={index} className="italic text-stone-800">
            {inner}
          </em>
        );
      }
      // 4. Nếu còn sót dấu ** hoặc * lẻ loi ở giữa câu do gõ nhầm, dọn sạch cho thoáng mắt
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  // Tách nội dung thành các đoạn văn theo dấu ngắt dòng kép \n\n
  const paragraphs = content.split(/\n{2,}/);

  return (
    <div className={`space-y-4 text-deep-text leading-relaxed ${className}`}>
      {paragraphs.map((p, pIdx) => {
        const trimmedP = p.trim();
        if (!trimmedP) return null;

        // Tách các dòng bên trong đoạn
        const lines = p.split(/\n/);

        // Kiểm tra xem đoạn này có phải toàn bộ là danh sách gạch đầu dòng không
        const isBulletList = lines.every((line) => {
          const t = line.trim();
          return t.startsWith("•") || t.startsWith("- ") || t.startsWith("* ");
        });

        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-2 my-3 pl-2 sm:pl-4">
              {lines.map((line, lIdx) => {
                const bulletContent = line.trim().replace(/^([•\-]\s*|\*\s+)/, "");
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span aria-hidden="true" className="text-moss-green font-bold text-base leading-snug shrink-0 select-none">●</span>
                    <span className="flex-1">{parseInlineStyles(bulletContent)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Đoạn văn thông thường (hoặc hỗn hợp tiêu đề, gạch đầu dòng, văn xuôi)
        return (
          <p key={pIdx} className="text-justify leading-relaxed">
            {lines.map((line, lIdx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) {
                return <span key={lIdx} className="block h-2" />;
              }

              // 1. DÒNG BẮT ĐẦU BẰNG ** (In đậm toàn bộ dòng tiêu đề / đề mục)
              // Xử lý cả trường hợp có hoặc không có dấu đóng ** ở cuối dòng
              if (trimmedLine.startsWith("**")) {
                let boldText = trimmedLine.replace(/^\*\*\s*/, "");
                boldText = boldText.replace(/\s*\*\*$/, "");
                return (
                  <strong
                    key={lIdx}
                    className="block font-extrabold text-moss-green text-base sm:text-lg my-1.5 not-italic tracking-tight"
                  >
                    {boldText}
                  </strong>
                );
              }

              // 2. DÒNG BẮT ĐẦU BẰNG ĐỀ MỤC ### hoặc ##
              if (trimmedLine.startsWith("###") || trimmedLine.startsWith("##")) {
                const headingText = trimmedLine.replace(/^#{2,3}\s*/, "");
                return (
                  <strong
                    key={lIdx}
                    className="block font-bold text-deep-text text-base sm:text-lg my-2 uppercase border-l-3 border-moss-green pl-2"
                  >
                    {headingText}
                  </strong>
                );
              }

              // 3. DÒNG GẠCH ĐẦU DÒNG (Bắt đầu bằng • , - hoặc * có khoảng trắng)
              if (trimmedLine.startsWith("•") || trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
                const bulletContent = trimmedLine.replace(/^([•\-]\s*|\*\s+)/, "");
                return (
                  <span key={lIdx} className="flex items-start gap-2.5 my-1.5 pl-3 sm:pl-5">
                    <span aria-hidden="true" className="text-moss-green font-bold text-sm shrink-0 select-none">●</span>
                    <span className="flex-1">{parseInlineStyles(bulletContent)}</span>
                  </span>
                );
              }

              // 4. DÒNG BẮT ĐẦU BẰNG * (In nghiêng toàn bộ dòng nếu không có khoảng trắng sau *)
              if (trimmedLine.startsWith("*") && !trimmedLine.startsWith("**")) {
                let italicText = trimmedLine.replace(/^\*\s*/, "");
                italicText = italicText.replace(/\s*\*$/, "");
                return (
                  <em key={lIdx} className="block italic text-stone-800 my-1">
                    {italicText}
                  </em>
                );
              }

              // 5. DÒNG VĂN XUÔI THÔNG THƯỜNG
              const isIndented = /^(\s{4,}|\t)/.test(line);
              const cleanLine = line.replace(/^(\s{4,}|\t)/, "");

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
