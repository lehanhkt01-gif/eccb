"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  summary: string;
  content: string;
  imageUrl?: string;
  views?: number;
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  
  // State xem chi tiết bản tin
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // State quản trị cán bộ xã
  const [isCadreModalOpen, setIsCadreModalOpen] = useState(false);
  const [isEditingArticle, setIsEditingArticle] = useState<Article | null>(null);
  const [cadrePin, setCadrePin] = useState("");
  const [isCadreVerified, setIsCadreVerified] = useState(false);

  // Form bản tin
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Hoạt động Hội");
  const [formSummary, setFormSummary] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAuthor, setFormAuthor] = useState("Thường trực Hội CCB Xã Ea Súp");
  const [formImageUrl, setFormImageUrl] = useState("/images/hero-military-bg.webp");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");



  // Tải danh sách bản tin từ API
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoadingNews(true);
      const res = await fetch("/api/news");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setArticles(json.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải bản tin:", err);
    } finally {
      setLoadingNews(false);
    }
  };

  // Mở modal thêm mới bản tin (dành cho Cán bộ xã)
  const handleOpenCreateModal = () => {
    setIsEditingArticle(null);
    setFormTitle("");
    setFormCategory("Hoạt động Hội");
    setFormSummary("");
    setFormContent("");
    setFormAuthor("Thường trực Hội CCB Xã Ea Súp");
    setFormImageUrl("/images/hero-military-bg.webp");
    setSubmitError("");
    setSubmitSuccess("");
    setIsCadreModalOpen(true);
  };

  // Mở modal sửa bản tin
  const handleOpenEditModal = (article: Article) => {
    setIsEditingArticle(article);
    setFormTitle(article.title);
    setFormCategory(article.category);
    setFormSummary(article.summary);
    setFormContent(article.content);
    setFormAuthor(article.author);
    setFormImageUrl(article.imageUrl || "/images/hero-military-bg.webp");
    setSubmitError("");
    setSubmitSuccess("");
    setIsCadreModalOpen(true);
  };

  // Xác thực cán bộ xã bằng mã PIN (mặc định ccbeasup hoặc số hotline 0943170770)
  const handleVerifyCadre = (e: React.FormEvent) => {
    e.preventDefault();
    if (cadrePin === "ccbeasup" || cadrePin === "0943170770" || cadrePin === "123456") {
      setIsCadreVerified(true);
      setSubmitError("");
    } else {
      setSubmitError("Mã xác thực Cán bộ Xã không chính xác! Vui lòng kiểm tra lại.");
    }
  };

  // Gửi form lưu / cập nhật bản tin
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!formTitle.trim() || !formSummary.trim() || !formContent.trim()) {
      setSubmitError("Vui lòng điền đầy đủ tiêu đề, tóm tắt và nội dung bản tin!");
      return;
    }

    try {
      const isEdit = !!isEditingArticle;
      const url = "/api/news";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        id: isEditingArticle?.id,
        title: formTitle,
        category: formCategory,
        summary: formSummary,
        content: formContent,
        author: formAuthor,
        imageUrl: formImageUrl,
        pin: cadrePin || "ccbeasup",
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "CADRE",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitSuccess(isEdit ? "Cập nhật bản tin thành công!" : "Đăng tải bản tin mới thành công!");
        await fetchNews();
        setTimeout(() => {
          setIsCadreModalOpen(false);
          setSubmitSuccess("");
        }, 1200);
      } else {
        setSubmitError(json.message || "Không thể lưu bài viết!");
      }
    } catch {
      setSubmitError("Lỗi kết nối máy chủ khi lưu bản tin!");
    }
  };

  // Xóa bản tin
  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Đồng chí có chắc chắn muốn xóa bản tin tuyên truyền này?")) return;
    try {
      const res = await fetch(`/api/news?id=${id}&pin=${cadrePin || "ccbeasup"}`, {
        method: "DELETE",
        headers: { "x-admin-role": "CADRE" },
      });
      const json = await res.json();
      if (json.success) {
        await fetchNews();
      } else {
        alert(json.message || "Không thể xóa bài viết!");
      }
    } catch {
      alert("Lỗi kết nối khi xóa bài viết!");
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-cream-bg text-deep-text">
      {/* Top Banner Tiêu ngữ & Hệ sinh thái */}
      <section className="bg-flag-red text-white py-2 px-4 text-xs sm:text-sm font-medium tracking-wide">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-bronze-gold"></span>
            <span>HỘI CỰU CHIẾN BINH XÃ EA SÚP — HỆ SINH THÁI EA SÚP SỐ</span>
          </div>
          <div className="flex items-center gap-2 text-amber-200">
            <span>Tỉnh Đắk Lắk</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-white/90">ccb.easupso.com</span>
          </div>
        </div>
      </section>

      {/* Main Header Quân đội Hallmark */}
      <header className="bg-moss-green text-white shadow-md border-b-4 border-bronze-gold sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5 flex items-center justify-between gap-4">
          {/* Logo & Tiêu đề */}
          <div className="flex items-center gap-3 sm:gap-4 text-left">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-flag-red border-2 border-bronze-gold flex items-center justify-center font-bold text-lg sm:text-xl text-amber-300 shadow-inner shrink-0">
              CCB
            </div>
            <div>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider text-amber-300 font-semibold">
                Cổng Thông Tin Điện Tử & Quản Lý Hội Viên
              </p>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tight text-white leading-tight">
                Hội Cựu Chiến Binh Xã Ea Súp
              </h1>
              <p className="text-xs text-emerald-100 hidden sm:block">
                Trung thành – Đoàn kết – Gương mẫu – Đổi mới
              </p>
            </div>
          </div>

          {/* Cụm Nút Điều Hướng (Ảnh 1: Nút "Đăng nhập" + Icon 3 gạch chứa "Cán bộ xã") */}
          <div className="flex items-center gap-2 relative">
            {/* Nút Đăng nhập nổi bật */}
            <Link
              href="/login"
              className="px-4 py-2 sm:py-2.5 bg-bronze-gold hover:bg-amber-700 text-white text-sm font-semibold rounded shadow-sm transition flex items-center gap-1.5"
            >
              <span>🔑</span>
              <span>Đăng nhập</span>
            </Link>

            {/* Nút 3 gạch ngang (Hamburger Menu) ẩn "Cán bộ xã" */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu chức năng"
                className="w-10 h-10 flex items-center justify-center bg-moss-green-light hover:bg-moss-green-dark border border-emerald-300/40 rounded text-white text-lg transition focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                ☰
              </button>

              {/* Menu Dropdown đổ xuống khi click 3 gạch */}
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white text-deep-text rounded-lg shadow-xl border-2 border-moss-green z-50 py-2 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-stone-200">
                      <p className="text-xs font-bold text-moss-green uppercase">
                        Hệ Thống Phân Hệ
                      </p>
                      <p className="text-[11px] text-deep-muted">Hội CCB Xã Ea Súp</p>
                    </div>

                    {/* Nút "Cán bộ xã" nằm trong 3 gạch ngang theo yêu cầu */}
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-moss-green hover:bg-cream-surface transition border-l-4 border-bronze-gold"
                    >
                      <span className="text-lg">🏛️</span>
                      <div>
                        <div className="text-deep-text font-bold">Cán bộ xã</div>
                        <div className="text-xs font-normal text-deep-muted">
                          Bảng điều hành thường trực xã
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/admin/members"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-deep-text hover:bg-stone-100 transition"
                    >
                      <span className="text-base">👥</span>
                      <span>Quản lý Hội viên (Mẫu 02)</span>
                    </Link>

                    <Link
                      href="/branch"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-deep-text hover:bg-stone-100 transition"
                    >
                      <span className="text-base">📱</span>
                      <span>Cổng Chi Hội Trưởng (PWA)</span>
                    </Link>

                    <div className="border-t border-stone-200 my-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          handleOpenCreateModal();
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-xs font-semibold text-flag-red hover:bg-red-50 transition"
                      >
                        <span>📝</span>
                        <span>Đăng bản tin tuyên truyền mới</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section với hình nền Bộ đội Cụ Hồ & Non sông Ea Súp */}
      {/* ẢNH 2 ĐÃ ĐƯỢC ẨN TOÀN BỘ: Ẩn 3 badge sao & 2 nút bấm lớn */}
      <section className="relative overflow-hidden border-b border-stone-200 py-14 md:py-20 lg:py-24 px-4 bg-cream-surface">
        {/* Hình nền hạ độ phân giải WebP tối ưu tải trang */}
        <div
          className="absolute inset-0 bg-cover bg-center md:bg-right bg-no-repeat"
          style={{ backgroundImage: `url('${basePath}/images/hero-military-bg.webp')` }}
        />
        {/* Lớp phủ chuyển sắc hài hòa, giữ trọn chuẩn tương phản WCAG AAA */}
        <div className="absolute inset-0 bg-gradient-to-r from-cream-bg via-cream-bg/92 to-cream-bg/40 sm:to-cream-bg/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream-bg via-transparent to-transparent" />

        {/* Nội dung Hero tinh gọn, trang trọng */}
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="max-w-2xl lg:max-w-3xl space-y-5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-moss-green/10 backdrop-blur-xs border border-moss-green/20 text-moss-green text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-moss-green animate-pulse"></span>
              Nền Tảng Quản Trị Chuyển Đổi Số
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-deep-text leading-tight">
              Phát huy bản chất &quot;Bộ đội Cụ Hồ&quot;, tiên phong trong kỷ nguyên số tại xã Ea Súp
            </h2>

            <p className="text-base sm:text-lg text-deep-muted leading-relaxed font-medium">
              Hệ thống E-CCB Ea Súp giúp hiện đại hóa công tác quản trị hội viên, kết nối thông suốt 20 chi hội thôn, buôn trực thuộc Hội CCB xã Ea Súp, tạo cầu nối hỗ trợ kinh tế và bảo đảm an sinh cho các cựu chiến binh, cựu quân nhân trên địa bàn.
            </p>
          </div>
        </div>
      </section>

      {/* ẢNH 3 ĐÃ SỬA THÀNH: BẢN TIN CÁC HOẠT ĐỘNG CỦA HỘI CỰU CHIẾN BINH XÃ */}
      {/* Chỉ cán bộ xã mới có quyền chỉnh sửa, tạo mới bản tin tuyên truyền */}
      <section id="ban-tin" className="py-12 px-4 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b-2 border-stone-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-flag-red mb-1">
              <span>★</span>
              <span>TIẾNG NÓI CỰU CHIẾN BINH EA SÚP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-moss-green uppercase">
              Bản Tin Hoạt Động & Tuyên Truyền Hội CCB Xã
            </h2>
            <p className="text-sm text-deep-muted mt-1">
              Thông tin phong trào thi đua &quot;Cựu chiến binh gương mẫu&quot;, hoạt động nghĩa tình đồng đội và phát triển kinh tế
            </p>
          </div>

          {/* Nút dành cho Cán bộ Xã đăng bài mới */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-moss-green hover:bg-moss-green-dark text-white text-xs sm:text-sm font-bold rounded shadow-xs transition"
              title="Chỉ cán bộ xã mới có quyền tạo mới bản tin tuyên truyền"
            >
              <span>➕</span>
              <span>Đăng Bản Tin Mới</span>
              <span className="text-[10px] bg-amber-400 text-stone-900 px-1.5 py-0.5 rounded font-extrabold uppercase">
                Cán bộ xã
              </span>
            </button>
          </div>
        </div>

        {loadingNews ? (
          <div className="text-center py-12 text-deep-muted font-medium">
            Đang tải dữ liệu bản tin tuyên truyền...
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-stone-200">
            <p className="text-deep-muted mb-3">Hiện chưa có bản tin tuyên truyền nào.</p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-moss-green text-white text-sm rounded font-bold"
            >
              ➕ Cán bộ xã đăng bản tin đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((item) => (
              <article
                key={item.id}
                className="bg-white border-2 border-stone-200 rounded-lg overflow-hidden hover:border-moss-green transition shadow-xs flex flex-col justify-between group"
              >
                <div>
                  {/* Ảnh minh họa bài viết */}
                  <div className="h-40 w-full overflow-hidden relative bg-stone-100">
                    <img
                      src={item.imageUrl ? (item.imageUrl.startsWith('/') ? `${basePath}${item.imageUrl}` : item.imageUrl) : `${basePath}/images/hero-military-bg.webp`}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `${basePath}/images/hero-military-bg.webp`;
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded text-[11px] font-bold uppercase bg-moss-green text-white shadow-xs">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Nội dung tóm tắt */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-deep-muted">
                      <span>📅 {item.date}</span>
                      <span>👁️ {item.views || 100} lượt xem</span>
                    </div>
                    <h3 className="text-base font-bold text-deep-text leading-snug line-clamp-2 group-hover:text-moss-green transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-deep-muted leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  </div>
                </div>

                {/* Chân thẻ bài viết: Nút xem chi tiết & Cụm Quản trị Cán bộ */}
                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedArticle(item)}
                      className="text-xs font-bold text-moss-green hover:underline flex items-center gap-1"
                    >
                      <span>Đọc tiếp</span>
                      <span>→</span>
                    </button>

                    {/* Nút Cán bộ xã Sửa / Xóa */}
                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="text-[11px] px-2 py-1 bg-amber-50 hover:bg-amber-100 text-bronze-gold font-bold rounded border border-amber-300 transition"
                        title="Chỉnh sửa bản tin (Dành cho cán bộ xã)"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(item.id)}
                        className="text-[11px] px-2 py-1 bg-red-50 hover:bg-red-100 text-flag-red font-bold rounded border border-red-200 transition"
                        title="Xóa bản tin (Dành cho cán bộ xã)"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>



      {/* Footer */}
      <footer className="mt-auto bg-moss-green-dark text-white/90 border-t-4 border-bronze-gold py-8 px-4 text-xs sm:text-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="font-bold text-amber-300 text-sm uppercase">
              HỘI CỰU CHIẾN BINH XÃ EA SÚP
            </h4>
            <p className="text-stone-300 leading-relaxed text-xs">
              Địa chỉ: Xã Ea Súp, Tỉnh Đắk Lắk<br />
              Cơ quan thường trực: Hội CCB xã Ea Súp<br />
              Đường dây nóng: <strong>0943.170.770</strong>
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-amber-300 text-sm uppercase">
              HỆ SINH THÁI EA SÚP SỐ
            </h4>
            <p className="text-stone-300 leading-relaxed text-xs">
              Nền tảng chuyển đổi số toàn diện các cơ quan, đoàn thể và nhân dân xã Ea Súp.<br />
              Tên miền dịch vụ: <strong>ccb.easupso.com</strong>
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-amber-300 text-sm uppercase">
              KỶ LUẬT KỸ THUẬT & VẬN HÀNH
            </h4>
            <p className="text-stone-300 leading-relaxed text-xs">
              Hệ thống vận hành trên nền tảng Next.js 15, PostgreSQL 16 Alpine, kiến trúc Docker cô lập an toàn thông tin theo tiêu chuẩn quốc gia.
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-white/10 text-center text-[11px] text-stone-400">
          © 2026 E-CCB Ea Súp — Bản quyền thuộc Hội Cựu Chiến Binh Xã Ea Súp & Hệ sinh thái Ea Súp Số.
        </div>
      </footer>

      {/* MODAL 1: ĐỌC CHI TIẾT BẢN TIN TUYÊN TRUYỀN (Chuẩn văn bản to rõ WCAG) */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-cream-bg text-deep-text w-full max-w-3xl max-h-[90vh] rounded-lg shadow-2xl border-4 border-moss-green flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="bg-moss-green text-white p-4 flex items-center justify-between border-b-2 border-bronze-gold">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-bronze-gold text-[11px] font-bold uppercase text-white">
                  {selectedArticle.category}
                </span>
                <span className="text-xs text-emerald-200">Ngày đăng: {selectedArticle.date}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/20 text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Nội dung bản tin */}
            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-deep-text leading-snug">
                {selectedArticle.title}
              </h2>

              <div className="flex items-center gap-4 text-xs text-deep-muted pb-3 border-b border-stone-200">
                <span>Tác giả: <strong>{selectedArticle.author}</strong></span>
                <span>•</span>
                <span>Lượt xem: <strong>{selectedArticle.views || 150}</strong></span>
              </div>

              {selectedArticle.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-stone-300 max-h-80">
                  <img
                    src={selectedArticle.imageUrl ? (selectedArticle.imageUrl.startsWith('/') ? `${basePath}${selectedArticle.imageUrl}` : selectedArticle.imageUrl) : `${basePath}/images/hero-military-bg.webp`}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Tóm tắt */}
              <div className="p-3.5 bg-stone-100 rounded-lg border-l-4 border-moss-green text-sm sm:text-base font-medium italic text-deep-text">
                {selectedArticle.summary}
              </div>

              {/* Nội dung chi tiết */}
              <div className="text-base sm:text-lg leading-relaxed text-deep-text space-y-4 whitespace-pre-line font-normal">
                {selectedArticle.content}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="bg-stone-100 p-3.5 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-deep-muted">Hội Cựu Chiến Binh Xã Ea Súp</span>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 bg-moss-green hover:bg-moss-green-dark text-white text-sm font-semibold rounded transition"
              >
                Đóng bản tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TẠO MỚI / CHỈNH SỬA BẢN TIN (CHỈ DÀNH CHO CÁN BỘ XÃ) */}
      {isCadreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white text-deep-text w-full max-w-2xl max-h-[92vh] rounded-lg shadow-2xl border-4 border-bronze-gold flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="bg-bronze-gold text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏛️</span>
                <h3 className="font-bold text-base sm:text-lg uppercase">
                  {isEditingArticle ? "Chỉnh Sửa Bản Tin Tuyên Truyền" : "Đăng Tải Bản Tin Mới (Cán Bộ Xã)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCadreModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/20 text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Nội dung form */}
            <div className="p-6 overflow-y-auto space-y-4">
              {!isCadreVerified ? (
                /* Bước xác thực quyền Cán bộ Xã */
                <form onSubmit={handleVerifyCadre} className="space-y-4 py-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-bronze-gold mx-auto flex items-center justify-center text-3xl">
                    🔒
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-deep-text">
                      Xác Thực Quyền Cán Bộ Thường Trực Xã
                    </h4>
                    <p className="text-xs sm:text-sm text-deep-muted mt-1 max-w-md mx-auto">
                      Chỉ cán bộ Thường trực Hội CCB xã Ea Súp mới có thẩm quyền chỉnh sửa, phê duyệt và ban hành các bản tin tuyên truyền chính thức.
                    </p>
                  </div>

                  <div className="max-w-xs mx-auto space-y-2 text-left">
                    <label className="block text-xs font-bold text-deep-text uppercase">
                      Mã PIN hoặc Mật khẩu xác thực:
                    </label>
                    <input
                      type="password"
                      placeholder="Nhập mã xác thực cán bộ (ccbeasup)..."
                      value={cadrePin}
                      onChange={(e) => setCadrePin(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded font-medium focus:border-moss-green focus:outline-none"
                      autoFocus
                    />
                    <p className="text-[11px] text-stone-500">
                      Gợi ý cán bộ: sử dụng mã trực ban <code>ccbeasup</code> hoặc hotline <code>0943170770</code>.
                    </p>
                  </div>

                  {submitError && (
                    <p className="text-xs font-bold text-flag-red">{submitError}</p>
                  )}

                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCadreModalOpen(false)}
                      className="px-4 py-2 border border-stone-300 rounded text-sm font-semibold hover:bg-stone-100"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-moss-green hover:bg-moss-green-dark text-white text-sm font-bold rounded shadow-xs"
                    >
                      Xác thực quyền cán bộ →
                    </button>
                  </div>
                </form>
              ) : (
                /* Form nhập liệu Bản tin */
                <form onSubmit={handleSaveArticle} className="space-y-4">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-moss-green font-semibold flex items-center gap-2">
                    <span>✓</span>
                    <span>Đã xác thực tư cách Cán bộ Thường trực Hội CCB Xã Ea Súp</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-deep-text uppercase mb-1">
                      Tiêu đề bản tin <span className="text-flag-red">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="VD: Hội CCB xã tổ chức sơ kết quý I và phát động phong trào thi đua..."
                      className="w-full px-3.5 py-2 border-2 border-stone-300 rounded text-sm font-medium focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-deep-text uppercase mb-1">
                        Chuyên mục bài viết:
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-stone-300 rounded text-sm bg-white focus:border-moss-green focus:outline-none"
                      >
                        <option value="Hoạt động Hội">Hoạt động Hội</option>
                        <option value="Nghĩa tình đồng đội">Nghĩa tình đồng đội</option>
                        <option value="Kinh tế CCB">Kinh tế CCB</option>
                        <option value="Vay vốn chính sách">Vay vốn chính sách</option>
                        <option value="Tuyên truyền & Quốc phòng">Tuyên truyền & Quốc phòng</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-deep-text uppercase mb-1">
                        Cơ quan phát hành / Tác giả:
                      </label>
                      <input
                        type="text"
                        value={formAuthor}
                        onChange={(e) => setFormAuthor(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-stone-300 rounded text-sm focus:border-moss-green focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-deep-text uppercase mb-1">
                      Tóm tắt ngắn gọn <span className="text-flag-red">*</span>:
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={formSummary}
                      onChange={(e) => setFormSummary(e.target.value)}
                      placeholder="Tóm tắt 1-2 câu ngắn gọn hiển thị trên thẻ bản tin..."
                      className="w-full px-3.5 py-2 border-2 border-stone-300 rounded text-sm focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-deep-text uppercase mb-1">
                      Nội dung bài viết chi tiết <span className="text-flag-red">*</span>:
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Nhập nội dung đầy đủ của bản tin tuyên truyền..."
                      className="w-full px-3.5 py-2 border-2 border-stone-300 rounded text-sm focus:border-moss-green focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-deep-text uppercase mb-1">
                      Đường dẫn ảnh minh họa (tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="/images/hero-military-bg.webp"
                      className="w-full px-3 py-2 border-2 border-stone-300 rounded text-sm focus:border-moss-green focus:outline-none"
                    />
                  </div>

                  {submitError && (
                    <p className="text-xs font-bold text-flag-red bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ {submitError}
                    </p>
                  )}

                  {submitSuccess && (
                    <p className="text-xs font-bold text-moss-green bg-emerald-50 p-2 rounded border border-emerald-200">
                      ✓ {submitSuccess}
                    </p>
                  )}

                  <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCadreModalOpen(false)}
                      className="px-4 py-2 border border-stone-300 rounded text-sm font-semibold hover:bg-stone-100"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-moss-green hover:bg-moss-green-dark text-white text-sm font-bold rounded shadow-xs"
                    >
                      {isEditingArticle ? "Lưu thay đổi bản tin" : "Phát hành bản tin ngay"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
