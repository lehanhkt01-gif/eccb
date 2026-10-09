import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import NewsShareBar from "@/components/NewsShareBar";
import { getAllNews, getNewsById, Article } from "@/lib/newsService";
import { getFirstImageUrl, getPreviewDescription } from "@/lib/news-utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const news = await getNewsById(id);

  if (!news) {
    return {
      title: "Bản tin không tồn tại | Hội Cựu Chiến Binh Xã Ea Súp",
      description: "Không tìm thấy nội dung bản tin tuyên truyền trên Cổng thông tin E-CCB Ea Súp",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ccb.easupso.com";
  // 1. Hình ảnh preview (Thumbnail): Bắt buộc lấy hình ảnh đầu tiên xuất hiện trong bài viết đó dạng Absolute URL
  const firstImageUrl = getFirstImageUrl(news, baseUrl);
  // 2. Mô tả preview: Lấy đoạn trích dẫn (Sapo) hoặc nội dung tóm tắt đầu tiên của bài
  const previewDescription = getPreviewDescription(news);
  const articleUrl = `${baseUrl}/tin-tuc/${news.id}`;

  return {
    // Tiêu đề trang trên trình duyệt
    title: `${news.title} | Hội Cựu Chiến Binh Xã Ea Súp`,
    description: previewDescription,
    openGraph: {
      // Tiêu đề preview: Phải trùng khớp 100% với tên sự kiện bài viết
      title: news.title,
      // Mô tả preview: Sapo hoặc tóm tắt đầu tiên
      description: previewDescription,
      url: articleUrl,
      siteName: "Cổng thông tin Hội Cựu Chiến Binh Xã Ea Súp",
      images: [
        {
          url: firstImageUrl,
          width: 1200,
          height: 630,
          alt: news.title,
        },
      ],
      locale: "vi_VN",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      // Tiêu đề preview Twitter: Trùng khớp 100% với tên sự kiện bài viết
      title: news.title,
      description: previewDescription,
      images: [firstImageUrl],
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params;
  const article = await getNewsById(id);

  if (!article) {
    notFound();
  }

  const allArticles = await getAllNews();
  const otherArticles = allArticles.filter((item) => item.id !== article.id).slice(0, 3);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ccb.easupso.com";
  const currentUrl = `${siteUrl}/tin-tuc/${article.id}`;
  const imageSrc = article.imageUrl || "/images/tin-01-nha-dong-doi.jpg";
  const previewDesc = getPreviewDescription(article);

  return (
    <div className="min-h-screen bg-cream-bg text-deep-text flex flex-col overflow-x-clip">
      {/* Header điều hướng chung của E-CCB */}
      <Header />

      {/* Dải cờ trang trí & Breadcrumb */}
      <div className="bg-stone-100 border-b border-stone-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs sm:text-sm text-stone-600 flex-wrap gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Link href="/" className="hover:text-moss-green font-semibold transition">
              🏠 Trang chủ
            </Link>
            <span>/</span>
            <Link href="/#tin-tuc" className="hover:text-moss-green font-semibold transition">
              Bản tin Hội CCB Xã
            </Link>
            <span>/</span>
            <span className="text-moss-green font-bold line-clamp-1 max-w-[220px] sm:max-w-xs">
              {article.category}
            </span>
          </nav>
          <Link
            href="/"
            className="text-xs font-bold text-moss-green hover:underline flex items-center gap-1"
          >
            ← Trở về Trang chủ
          </Link>
        </div>
      </div>

      {/* Thân bài viết */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <article className="bg-white rounded-2xl border-2 border-stone-200 shadow-sm overflow-hidden p-5 sm:p-8 md:p-10 space-y-6">
          {/* Badge phân loại & Ngày đăng */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase bg-moss-green text-white shadow-xs tracking-wider">
                {article.category}
              </span>
              <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
                📅 Ngày đăng: {article.date}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-stone-500">
              <span>✍️ Tác giả: <strong className="text-deep-text">{article.author}</strong></span>
              <span>•</span>
              <span>👁️ <strong>{article.views || 250}</strong> lượt xem</span>
            </div>
          </div>

          {/* Tiêu đề bài viết: Kiên quyết không in nghiêng theo chuẩn quân đội */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-deep-text leading-tight tracking-tight not-italic">
            {article.title}
          </h1>

          {/* Thanh tương tác chia sẻ mạng xã hội (Zalo, Facebook, Copy link, In ấn) */}
          <NewsShareBar
            title={article.title}
            url={currentUrl}
            summary={previewDesc}
          />

          {/* Khung Sapo tóm tắt nội dung */}
          <div className="p-4 sm:p-5 bg-stone-50 rounded-xl border-l-4 border-moss-green border-stone-200 text-stone-800 text-base sm:text-lg font-medium leading-relaxed shadow-xs">
            {article.summary}
          </div>

          {/* Ảnh minh họa bài viết */}
          <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-xs space-y-2">
            <div className="relative w-full aspect-16/9 overflow-hidden">
              <img
                src={imageSrc}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center text-xs text-stone-500 pb-3 px-4 italic">
              Ảnh minh họa: Hoạt động công tác Hội Cựu Chiến Binh Xã Ea Súp
            </p>
          </div>

          {/* Nội dung bài viết chi tiết chuẩn WCAG AAA - Cỡ chữ lớn dễ đọc cho CCB cao tuổi */}
          <div className="text-stone-900 text-lg sm:text-xl leading-relaxed space-y-5 font-normal tracking-wide whitespace-pre-line pt-2">
            {article.content}
          </div>

          {/* Hộp xác thực cơ quan biên tập */}
          <div className="mt-8 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start gap-3">
            <div className="text-2xl">🎖️</div>
            <div className="text-xs sm:text-sm text-stone-700 space-y-0.5">
              <p className="font-bold text-moss-green uppercase">
                Ban Thường Vụ Hội Cựu Chiến Binh Xã Ea Súp
              </p>
              <p>
                Phát huy bản chất, truyền thống &quot;Bộ đội Cụ Hồ&quot;: Trung thành - Đoàn kết - Gương mẫu - Đổi mới.
              </p>
              <p className="text-[11px] text-stone-500 pt-1">
                Bản tin chính thức được xuất bản trên Cổng thông tin điện tử E-CCB Ea Súp (ccb.easupso.com).
              </p>
            </div>
          </div>

          {/* Thanh chia sẻ chân bài viết */}
          <div className="pt-4 border-t border-stone-200">
            <NewsShareBar
              title={article.title}
              url={currentUrl}
              summary={previewDesc}
            />
          </div>
        </article>

        {/* Khối Bản tin liên quan */}
        {otherArticles.length > 0 && (
          <section className="mt-10 sm:mt-12 space-y-4 not-print">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-deep-text uppercase tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-5 bg-moss-green rounded-full inline-block"></span>
                Bản tin hoạt động khác
              </h2>
              <Link
                href="/#tin-tuc"
                className="text-xs font-bold text-moss-green hover:underline"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {otherArticles.map((item) => (
                <Link
                  key={item.id}
                  href={`/tin-tuc/${item.id}`}
                  className="bg-white border border-stone-200 hover:border-moss-green rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition duration-200 flex flex-col group"
                >
                  <div className="h-36 w-full overflow-hidden bg-stone-100 relative">
                    <img
                      src={item.imageUrl || "/images/hero-military-bg.webp"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-moss-green text-white">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <h3 className="text-sm font-bold text-deep-text group-hover:text-moss-green transition line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                      <span>📅 {item.date}</span>
                      <span className="text-moss-green font-bold group-hover:underline">Chi tiết →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer chuẩn quân đội */}
      <footer className="bg-moss-green text-stone-200 py-8 px-4 sm:px-6 mt-12 border-t-4 border-bronze-gold not-print">
        <div className="max-w-4xl mx-auto text-center space-y-2 text-xs sm:text-sm">
          <p className="font-bold uppercase tracking-wider text-white">
            CỔNG THÔNG TIN ĐIỆN TỬ HỘI CỰU CHIẾN BINH XÃ EA SÚP
          </p>
          <p className="text-stone-300 text-xs">
            Trực thuộc Hệ sinh thái Ea Súp Số • ccb.easupso.com
          </p>
          <p className="text-stone-400 text-[11px] pt-2">
            © 2026 Hội Cựu Chiến Binh Xã Ea Súp. Bản quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
}
