"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser, setCurrentUser, subscribeAuthChange, AuthUser } from "@/lib/authSession";
import { getStoredMembers } from "@/lib/memberStore";
import Header from "@/components/Header";
import NewsCreateModal from "@/components/NewsCreateModal";
import { Article } from "@/lib/newsService";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

function NewsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");

  const [currentUser, setCurrentUserState] = useState<AuthUser | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // State modal quản trị bản tin (Đăng tải / Sửa bài)
  const [isCadreModalOpen, setIsCadreModalOpen] = useState(false);
  const [isEditingArticle, setIsEditingArticle] = useState<Article | null>(null);

  // Tab lọc trạng thái bài viết (ALL, APPROVED, PENDING_APPROVAL)
  const [articleTab, setArticleTab] = useState<"ALL" | "APPROVED" | "PENDING_APPROVAL">(
    initialTab === "pending" || initialTab === "PENDING_APPROVAL" ? "PENDING_APPROVAL" : "ALL"
  );

  // Modal Đăng nhập Hội viên
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberCccd, setMemberCccd] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [memberLoginError, setMemberLoginError] = useState("");
  const [isMemberLoggingIn, setIsMemberLoggingIn] = useState(false);

  useEffect(() => {
    if (initialTab === "pending" || initialTab === "PENDING_APPROVAL") {
      setArticleTab("PENDING_APPROVAL");
    }
  }, [initialTab]);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUserState(user);
    fetchNews(user);

    const unsubscribe = subscribeAuthChange((updatedUser) => {
      setCurrentUserState(updatedUser);
      fetchNews(updatedUser);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchNews = async (user?: AuthUser | null) => {
    try {
      setLoadingNews(true);
      const activeUser = user !== undefined ? user : currentUser;
      let url = "/api/news";
      if (activeUser?.role === "SUPER_ADMIN") {
        url += "?role=SUPER_ADMIN";
      }
      const res = await fetch(url);
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

  // Mở modal thêm mới bản tin
  const handleOpenCreateModal = () => {
    if (!currentUser) {
      setIsMemberModalOpen(true);
      return;
    }
    setIsEditingArticle(null);
    setIsCadreModalOpen(true);
  };

  // Mở modal sửa bản tin (Chỉ Cán bộ xã)
  const handleOpenEditModal = (article: Article) => {
    if (currentUser?.role !== "SUPER_ADMIN") {
      alert("Theo quy định Điều lệ Hội, chỉ Cán bộ Thường trực xã mới có quyền chỉnh sửa bài viết đã lưu hành!");
      return;
    }
    setIsEditingArticle(article);
    setIsCadreModalOpen(true);
  };

  // Phê duyệt bài viết (Cán bộ xã)
  const handleApproveArticle = async (articleId: string, articleTitle: string) => {
    if (!confirm(`Đồng chí có chắc chắn muốn PHÊ DUYỆT và XUẤT BẢN bài viết: "${articleTitle}"?`)) return;
    try {
      const res = await fetch("/api/news", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "CADRE",
          "x-user-role": "SUPER_ADMIN",
        },
        body: JSON.stringify({
          id: articleId,
          action: "approve",
          pin: "ccbeasup",
          userRole: "SUPER_ADMIN",
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert("✅ Đã phê duyệt và xuất bản bài viết thành công!");
        await fetchNews(currentUser);
      } else {
        alert("⚠️ Lỗi: " + (json.message || "Không thể phê duyệt!"));
      }
    } catch {
      alert("Lỗi kết nối máy chủ khi phê duyệt bài viết!");
    }
  };

  // Từ chối bài viết (Cán bộ xã)
  const handleRejectArticle = async (articleId: string, articleTitle: string) => {
    const reason = prompt(
      `Nhập lý do từ chối bài viết "${articleTitle}" (để phản hồi cho tác giả):`,
      "Nội dung chưa phù hợp tiêu chí tuyên truyền của Hội"
    );
    if (reason === null) return;
    try {
      const res = await fetch("/api/news", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "CADRE",
          "x-user-role": "SUPER_ADMIN",
        },
        body: JSON.stringify({
          id: articleId,
          action: "reject",
          rejectionReason: reason,
          pin: "ccbeasup",
          userRole: "SUPER_ADMIN",
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert("Đã từ chối bài viết!");
        await fetchNews(currentUser);
      } else {
        alert("⚠️ Lỗi: " + (json.message || "Không thể từ chối!"));
      }
    } catch {
      alert("Lỗi kết nối máy chủ khi từ chối bài viết!");
    }
  };

  // Xóa bản tin
  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Đồng chí có chắc chắn muốn xóa bản tin tuyên truyền này?")) return;
    try {
      const res = await fetch(`/api/news?id=${id}&pin=ccbeasup`, {
        method: "DELETE",
        headers: {
          "x-admin-role": "CADRE",
          "x-user-role": "SUPER_ADMIN",
        },
      });
      const json = await res.json();
      if (json.success) {
        await fetchNews(currentUser);
      } else {
        alert(json.message || "Không thể xóa bài viết!");
      }
    } catch {
      alert("Lỗi kết nối khi xóa bài viết!");
    }
  };

  // Đăng nhập Hội viên
  const handleMemberModalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberLoginError("");
    setIsMemberLoggingIn(true);

    const cleanCccd = memberCccd.trim();
    const cleanPass = memberPassword;

    if (!cleanCccd || !cleanPass) {
      setMemberLoginError("Vui lòng nhập đầy đủ số CCCD 12 số và mật khẩu.");
      setIsMemberLoggingIn(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanCccd, password: cleanPass }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setCurrentUserState(data.user);
          setIsMemberModalOpen(false);
          router.push("/member");
          return;
        } else {
          setMemberLoginError(data.message || "Xác thực không thành công.");
          setIsMemberLoggingIn(false);
          return;
        }
      }
    } catch {
      const members = getStoredMembers();
      const found = members.find((m) => m.cccd === cleanCccd);
      if (found || /^\d{12}$/.test(cleanCccd)) {
        const authUser: AuthUser = {
          username: cleanCccd,
          cccd: cleanCccd,
          fullName: found ? found.fullName : "Hội viên Cựu Chiến Binh",
          phone: found?.phone || "",
          hamletName: found?.hamletName || "Hội CCB Xã Ea Súp",
          role: "MEMBER",
        };
        setCurrentUser(authUser);
        setCurrentUserState(authUser);
        setIsMemberModalOpen(false);
        router.push("/member");
        return;
      }
    }

    setMemberLoginError("Số CCCD hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
    setIsMemberLoggingIn(false);
  };

  // Lọc bài viết
  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));

  const filteredArticles = articles.filter((a) => {
    // 1. Lọc theo Tab trạng thái
    if (currentUser?.role === "SUPER_ADMIN") {
      if (articleTab === "APPROVED" && a.status !== "APPROVED") return false;
      if (articleTab === "PENDING_APPROVAL" && a.status !== "PENDING_APPROVAL") return false;
    } else {
      if (a.status === "PENDING_APPROVAL" || a.status === "REJECTED") return false;
    }

    // 2. Lọc theo chuyên mục
    if (selectedCategory !== "all" && a.category !== selectedCategory) return false;

    // 3. Lọc theo từ khóa tìm kiếm
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(kw);
      const matchSummary = a.summary?.toLowerCase().includes(kw);
      const matchAuthor = a.author?.toLowerCase().includes(kw);
      if (!matchTitle && !matchSummary && !matchAuthor) return false;
    }

    return true;
  });

  const pendingCount = articles.filter((a) => a.status === "PENDING_APPROVAL").length;

  return (
    <main className="min-h-screen flex flex-col bg-cream-bg text-deep-text">
      {/* Header chuẩn quân đội */}
      <Header
        onOpenCreateArticle={handleOpenCreateModal}
        onOpenMemberModal={() => setIsMemberModalOpen(true)}
      />

      {/* Banner Chuyên Trang Tin Tức */}
      <section className="bg-moss-green text-white py-6 px-4 border-b-4 border-bronze-gold shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
              <span>★</span>
              <span>CỔNG THÔNG TIN ĐIỆN TỬ E-CCB EA SÚP</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white">
              Bản Tin Hoạt Động &amp; Tuyên Truyền CCB Xã
            </h1>
            <p className="text-xs sm:text-sm text-stone-200 mt-1 max-w-2xl">
              Nơi cập nhật tin tức phong trào thi đua Cựu chiến binh gương mẫu, công tác an sinh xã hội, nghĩa tình đồng đội và phát triển kinh tế 20 thôn buôn.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link
              href="/"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold rounded-lg border border-white/30 transition flex items-center gap-1.5"
            >
              <span>🏠</span>
              <span>Trang chủ</span>
            </Link>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-flag-red hover:bg-flag-red-light text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm border border-amber-300 transition flex items-center gap-1.5 active:scale-95"
            >
              <span>✍️</span>
              <span>
                {currentUser?.role === "SUPER_ADMIN"
                  ? "Đăng Bản Tin Mới"
                  : currentUser?.role === "BRANCH_LEADER"
                  ? "Gửi Tin Chi Hội"
                  : "Gửi Bài Viết CCB"}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Thân Trang Tin Tức */}
      <section className="py-6 px-4 max-w-6xl mx-auto w-full flex-1">
        {/* Thanh Điều Khiển: Bộ Lọc Cán Bộ Xã, Chuyên Mục & Tìm Kiếm */}
        <div className="bg-white p-4 rounded-xl border-2 border-stone-300 shadow-sm mb-6 space-y-3.5">
          {/* Hàng 1: Tabs Trạng Thái Duyệt Bài (Nếu là Cán bộ xã) */}
          {currentUser?.role === "SUPER_ADMIN" && (
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto text-xs sm:text-sm">
              <span className="font-bold text-moss-green uppercase text-xs shrink-0 flex items-center gap-1">
                <span>🏛️</span>
                <span>Quyền Cán Bộ Xã:</span>
              </span>

              <button
                type="button"
                onClick={() => setArticleTab("ALL")}
                className={`px-3 py-1 rounded-full font-bold transition cursor-pointer shrink-0 ${
                  articleTab === "ALL"
                    ? "bg-moss-green text-white shadow-xs"
                    : "bg-stone-100 hover:bg-stone-200 text-deep-text"
                }`}
              >
                Tất cả ({articles.length})
              </button>

              <button
                type="button"
                onClick={() => setArticleTab("APPROVED")}
                className={`px-3 py-1 rounded-full font-bold transition cursor-pointer shrink-0 ${
                  articleTab === "APPROVED"
                    ? "bg-moss-green text-white shadow-xs"
                    : "bg-stone-100 hover:bg-stone-200 text-deep-text"
                }`}
              >
                Đã xuất bản ({articles.filter((a) => a.status === "APPROVED").length})
              </button>

              <button
                type="button"
                onClick={() => setArticleTab("PENDING_APPROVAL")}
                className={`px-3.5 py-1 rounded-full font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  articleTab === "PENDING_APPROVAL"
                    ? "bg-flag-red text-white shadow-md ring-2 ring-amber-300"
                    : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                }`}
              >
                <span>⏳ Chờ phê duyệt</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-white text-flag-red text-[10px] font-black rounded-full shadow-xs animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Hàng 2: Tìm Kiếm & Chuyên Mục */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Tìm kiếm tiêu đề, tác giả, nội dung..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
              />
              <span className="absolute left-3 top-2.5 text-stone-400 text-sm">🔍</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-stone-500 font-semibold shrink-0">Chuyên mục:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-deep-text font-medium focus:border-moss-green focus:outline-none shrink-0"
              >
                <option value="all">Tất cả chuyên mục</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Thông Báo Nếu Đang Xem Tab Chờ Duyệt */}
        {articleTab === "PENDING_APPROVAL" && currentUser?.role === "SUPER_ADMIN" && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-xs">
            <span className="text-2xl mt-0.5">🔔</span>
            <div className="space-y-1">
              <h3 className="font-bold text-amber-900 text-sm uppercase">
                DANH SÁCH BẢN TIN CHỜ THƯỜNG TRỰC HỘI CCB XÃ PHÊ DUYỆT
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Các bản tin dưới đây do Chi hội trưởng 20 thôn buôn hoặc Hội viên gửi lên. Cán bộ Thường trực xã kiểm duyệt nội dung, hình ảnh trước khi bấm <strong>[✓ Duyệt bài]</strong> để phát hành công khai trên Cổng thông tin.
              </p>
            </div>
          </div>
        )}

        {/* Danh Sách Card Bản Tin */}
        {loadingNews ? (
          <div className="text-center py-16 text-deep-muted font-medium bg-white rounded-xl border border-stone-200">
            <span className="text-3xl block mb-2">⏳</span>
            Đang tải dữ liệu bản tin tuyên truyền...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-stone-300 space-y-3">
            <span className="text-4xl block">📰</span>
            <p className="text-sm font-bold text-deep-text">
              {articleTab === "PENDING_APPROVAL"
                ? "Hiện không có bản tin nào đang chờ phê duyệt!"
                : "Không tìm thấy bản tin nào phù hợp với điều kiện tìm kiếm."}
            </p>
            <p className="text-xs text-deep-muted max-w-md mx-auto">
              {articleTab === "PENDING_APPROVAL"
                ? "Tất cả các bài viết do Chi hội và Hội viên gửi lên đã được xử lý đầy đủ."
                : "Vui lòng thử chọn chuyên mục khác hoặc xóa từ khóa tìm kiếm."}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-moss-green text-white text-xs sm:text-sm rounded-lg font-bold hover:bg-moss-green-dark transition cursor-pointer"
            >
              ➕ Đăng / Gửi bài viết mới
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((item) => (
              <article
                key={item.id}
                className={`bg-white border-2 rounded-xl overflow-hidden hover:border-moss-green transition shadow-sm flex flex-col justify-between group ${
                  item.status === "PENDING_APPROVAL" ? "border-amber-400 bg-amber-50/20" : "border-stone-200"
                }`}
              >
                <div>
                  {/* Ảnh Đại Diện Thumbnail */}
                  <Link
                    href={`/tin-tuc/${item.id}`}
                    className="block h-48 w-full overflow-hidden relative bg-stone-100 cursor-pointer"
                    title={item.title}
                  >
                    <img
                      src={
                        item.imageUrl || item.thumbnail
                          ? (item.imageUrl || item.thumbnail)!.startsWith("/")
                            ? `${basePath}${item.imageUrl || item.thumbnail}`
                            : item.imageUrl || item.thumbnail
                          : `${basePath}/images/hero-military-bg.webp`
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `${basePath}/images/hero-military-bg.webp`;
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 pointer-events-none">
                      <span className="px-2.5 py-1 rounded text-[11px] font-bold uppercase bg-moss-green text-white shadow-xs">
                        {item.category}
                      </span>
                      {item.status === "PENDING_APPROVAL" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-flag-red text-white shadow-xs animate-pulse">
                          ⏳ Chờ xã duyệt
                        </span>
                      )}
                      {item.status === "REJECTED" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-700 text-white shadow-xs">
                          ❌ Từ chối
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Nội Dung Bản Tin */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-deep-muted">
                      <span>📅 {item.date}</span>
                      <span>✍️ {item.author || "Hội CCB Xã"}</span>
                    </div>

                    <Link href={`/tin-tuc/${item.id}`} className="block">
                      <h2 className="text-base font-bold text-deep-text leading-snug line-clamp-2 group-hover:text-moss-green group-hover:underline transition cursor-pointer">
                        {item.title}
                      </h2>
                    </Link>

                    <p className="text-xs text-deep-muted leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  </div>
                </div>

                {/* Chân Thẻ: Thao Tác Phê Duyệt / Quản Trị Cán Bộ Xã */}
                <div className="p-4 pt-0 border-t border-stone-100 mt-2">
                  <div className="pt-2.5 flex items-center justify-between gap-1.5 flex-wrap">
                    <Link
                      href={`/tin-tuc/${item.id}`}
                      className="text-xs text-moss-green hover:underline font-bold"
                    >
                      Xem chi tiết →
                    </Link>

                    {currentUser?.role === "SUPER_ADMIN" && (
                      <div className="flex items-center gap-1.5">
                        {item.status === "PENDING_APPROVAL" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveArticle(item.id, item.title)}
                              className="text-[11px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-2xs transition cursor-pointer active:scale-95"
                              title="Phê duyệt xuất bản bài viết công khai"
                            >
                              ✓ Duyệt bài
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectArticle(item.id, item.title)}
                              className="text-[11px] px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded border border-stone-300 transition cursor-pointer"
                              title="Từ chối xuất bản bài viết"
                            >
                              ✕ Từ chối
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="text-[11px] px-2 py-1 bg-stone-100 hover:bg-stone-200 text-deep-text font-bold rounded border border-stone-300 transition cursor-pointer"
                          title="Chỉnh sửa bài viết"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(item.id)}
                          className="text-[11px] px-2 py-1 bg-red-50 hover:bg-red-100 text-flag-red font-bold rounded border border-red-200 transition cursor-pointer"
                          title="Xóa bài viết"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal Quản trị Đăng / Sửa bài viết */}
      <NewsCreateModal
        isOpen={isCadreModalOpen}
        onClose={() => {
          setIsCadreModalOpen(false);
          setIsEditingArticle(null);
        }}
        onSuccess={() => {
          setIsCadreModalOpen(false);
          setIsEditingArticle(null);
          fetchNews(currentUser);
        }}
        currentUser={currentUser}
        articleToEdit={isEditingArticle}
      />

      {/* Modal Đăng nhập Hội viên */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border-4 border-bronze-gold shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <span className="text-4xl block">🎖️</span>
              <h3 className="text-lg font-black text-moss-green uppercase">
                Đăng Nhập Hội Viên CCB
              </h3>
              <p className="text-xs text-deep-muted">
                Dành cho Hội viên Cựu Chiến Binh Xã Ea Súp
              </p>
            </div>

            <form onSubmit={handleMemberModalLogin} className="space-y-3 text-xs">
              {memberLoginError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-flag-red font-bold rounded-lg text-xs">
                  ⚠️ {memberLoginError}
                </div>
              )}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Số CCCD (12 chữ số):</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập 12 số CCCD..."
                  value={memberCccd}
                  onChange={(e) => setMemberCccd(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold focus:border-moss-green"
                />
              </div>
              <div>
                <label className="block text-stone-700 font-bold mb-1">Mật khẩu:</label>
                <input
                  type="password"
                  required
                  placeholder="Mật khẩu tài khoản..."
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:border-moss-green"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 font-bold rounded-lg text-deep-text"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isMemberLoggingIn}
                  className="flex-2 py-2.5 bg-moss-green hover:bg-moss-green-light text-white font-bold rounded-lg"
                >
                  {isMemberLoggingIn ? "Đang xác thực..." : "Đăng Nhập"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-bg flex items-center justify-center text-sm font-bold text-moss-green">Đang tải bản tin...</div>}>
      <NewsContent />
    </Suspense>
  );
}
