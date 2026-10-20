"use client";

import { useEffect, useState, useRef } from "react";

interface ArticleViewCounterProps {
  articleId: string;
  initialViews: number;
}

/**
 * Component hiển thị và tự động cập nhật số lượt xem thực tế của bản tin
 * - Render số lượt xem ban đầu ngay từ SSR để SEO và tải trang nhanh
 * - Tự động gọi API tăng lượt xem 1 lần duy nhất khi người đọc mở trang
 * - Cập nhật trực tiếp số lượt xem mới nhất lên giao diện
 */
export default function ArticleViewCounter({
  articleId,
  initialViews,
}: ArticleViewCounterProps) {
  const [views, setViews] = useState<number>(initialViews);
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (!articleId || hasIncremented.current) return;
    hasIncremented.current = true;

    // Gửi yêu cầu ghi nhận lượt xem tới máy chủ PostgreSQL
    fetch(`/api/news/view?id=${encodeURIComponent(articleId)}`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.views === "number") {
          setViews(data.views);
        }
      })
      .catch((err) => {
        console.error("Lỗi cập nhật lượt xem:", err);
      });
  }, [articleId]);

  return (
    <span>
      👁️ <strong className="font-bold text-deep-text">{views}</strong> lượt xem
    </span>
  );
}
