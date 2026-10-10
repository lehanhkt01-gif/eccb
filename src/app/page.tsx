"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getCurrentUser, setCurrentUser, subscribeAuthChange, AuthUser } from "@/lib/authSession";
import { getStoredMembers } from "@/lib/memberStore";
import Header from "@/components/Header";
import NewsShareBar from "@/components/NewsShareBar";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

import { Article } from "@/lib/newsService";

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUserState] = useState<AuthUser | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  
  // State xem chi tiết bản tin
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // State Modal Đăng nhập / Đăng ký dành riêng cho Hội viên bằng CCCD
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberCccd, setMemberCccd] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [memberLoginError, setMemberLoginError] = useState("");
  const [isMemberLoggingIn, setIsMemberLoggingIn] = useState(false);

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

  // Tab lọc trạng thái bài viết (Dành cho Cán bộ xã hoặc tác giả)
  const [articleTab, setArticleTab] = useState<"ALL" | "APPROVED" | "PENDING_APPROVAL">("ALL");

  // Tải danh sách bản tin từ API và đồng bộ liên tục trạng thái đăng nhập
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUserState(user);
    if (user?.role === "SUPER_ADMIN") {
      setIsCadreVerified(true);
    } else {
      setIsCadreVerified(false);
    }
    fetchNews(user);

    // Đăng ký nhận sự kiện cập nhật auth tức thì trong và giữa các tab
    const unsubscribe = subscribeAuthChange((updatedUser) => {
      setCurrentUserState(updatedUser);
      if (updatedUser?.role === "SUPER_ADMIN") {
        setIsCadreVerified(true);
      } else {
        setIsCadreVerified(false);
      }
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
      } else if (activeUser) {
        url += `?authorId=${encodeURIComponent(activeUser.id || activeUser.username || "")}`;
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

  // Xử lý đăng nhập Hội viên bằng CCCD trong Modal
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

      if (res.status === 401 || res.status === 404 || res.status === 400) {
        const errData = await res.json().catch(() => null);
        setMemberLoginError(errData?.message || "Số CCCD hoặc mật khẩu không chính xác.");
        setIsMemberLoggingIn(false);
        return;
      }
    } catch {
      // Fallback khi chạy static export demo
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

  // Mở modal thêm mới bản tin (Hội viên / Chi hội trưởng / Cán bộ xã)
  const handleOpenCreateModal = () => {
    if (!currentUser) {
      // Nhắc nhở người dùng đăng nhập tài khoản trước
      setIsMemberModalOpen(true);
      return;
    }

    setIsEditingArticle(null);
    setFormTitle("");
    setFormCategory("Hoạt động Hội");
    setFormSummary("");
    setFormContent("");

    if (currentUser.role === "SUPER_ADMIN") {
      setFormAuthor("Thường trực Hội CCB Xã Ea Súp");
      setIsCadreVerified(true);
    } else if (currentUser.role === "BRANCH_LEADER") {
      setFormAuthor(`Đ/c ${currentUser.fullName} - CHT ${currentUser.hamletName || ""}`);
      setIsCadreVerified(true);
    } else {
      setFormAuthor(`Đ/c ${currentUser.fullName} - Hội viên ${currentUser.hamletName || ""}`);
      setIsCadreVerified(true);
    }

    setFormImageUrl("/images/hero-military-bg.webp");
    setSubmitError("");
    setSubmitSuccess("");
    setIsCadreModalOpen(true);
  };

  // Mở modal sửa bản tin (Chỉ Cán bộ xã được phép)
  const handleOpenEditModal = (article: Article) => {
    if (currentUser?.role !== "SUPER_ADMIN") {
      alert("Theo quy định Điều lệ Hội, chỉ Cán bộ Thường trực xã mới có quyền chỉnh sửa bài viết đã lưu hành!");
      return;
    }
    setIsEditingArticle(article);
    setFormTitle(article.title);
    setFormCategory(article.category);
    setFormSummary(article.summary);
    setFormContent(article.content);
    setFormAuthor(article.author);
    setFormImageUrl(article.imageUrl || article.thumbnail || "/images/hero-military-bg.webp");
    setSubmitError("");
    setSubmitSuccess("");
    setIsCadreModalOpen(true);
  };

  // Xác thực cán bộ xã bằng mã PIN (khi chưa đăng nhập bằng tài khoản)
  const handleVerifyCadre = (e: React.FormEvent) => {
    e.preventDefault();
    if (cadrePin === "ccbeasup" || cadrePin === "0943170770" || cadrePin === "123456") {
      setIsCadreVerified(true);
      setSubmitError("");
    } else {
      setSubmitError("Mã xác thực Cán bộ Xã không chính xác! Vui lòng kiểm tra lại.");
    }
  };

  // Gửi form lưu / cập nhật bản tin (Hybrid RBAC + ABAC)
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
        authorId: currentUser?.id || currentUser?.username || "hoi-vien",
        authorRole: currentUser?.role || "MEMBER",
        authorPhone: currentUser?.phone || "",
        imageUrl: formImageUrl,
        thumbnail: formImageUrl,
        pin: cadrePin || "ccbeasup",
        userRole: currentUser?.role || "GUEST",
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": currentUser?.role === "SUPER_ADMIN" ? "CADRE" : "MEMBER",
          "x-user-role": currentUser?.role || "GUEST",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        if (currentUser?.role === "SUPER_ADMIN") {
          setSubmitSuccess(isEdit ? "Cập nhật bản tin thành công!" : "Đã phát hành bản tin tuyên truyền thành công!");
        } else {
          setSubmitSuccess("✓ Đã gửi bài viết thành công! Bài viết đang chờ Ban Thường trực Hội CCB Xã Ea Súp phê duyệt.");
        }
        await fetchNews(currentUser);
        setTimeout(() => {
          setIsCadreModalOpen(false);
          setSubmitSuccess("");
        }, 1500);
      } else {
        setSubmitError(json.message || "Không thể lưu bài viết!");
      }
    } catch {
      setSubmitError("Lỗi kết nối máy chủ khi lưu bản tin!");
    }
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
          pin: cadrePin || "ccbeasup",
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
    const reason = prompt(`Nhập lý do từ chối bài viết "${articleTitle}" (để phản hồi cho tác giả):`, "Nội dung chưa phù hợp tiêu chí tuyên truyền của Hội");
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
          pin: cadrePin || "ccbeasup",
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

  // Xóa bản tin (Chỉ Cán bộ xã)
  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Đồng chí có chắc chắn muốn xóa bản tin tuyên truyền này?")) return;
    try {
      const res = await fetch(`/api/news?id=${id}&pin=${cadrePin || "ccbeasup"}`, {
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

  return (
    <main className="min-h-screen flex flex-col bg-cream-bg text-deep-text">
      {/* Header / Navbar chuẩn quân đội Hallmark với Badge danh dự & Menu tác vụ cán bộ */}
      <Header
        onOpenCreateArticle={handleOpenCreateModal}
        onOpenMemberModal={() => setIsMemberModalOpen(true)}
      />

      {/* Hero Section với hình nền Bộ đội Cụ Hồ & Non sông Ea Súp */}
      {/* Khoảng cách thu gọn sát lại (py-6 sm:py-8 md:py-10) */}
      <section className="relative overflow-hidden border-b border-stone-200 py-6 sm:py-8 md:py-10 px-4 bg-cream-surface">
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
          <div className="max-w-2xl lg:max-w-3xl space-y-3 sm:space-y-3.5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-moss-green/10 backdrop-blur-xs border border-moss-green/20 text-moss-green text-xs font-bold uppercase tracking-wider">
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

      {/* BẢN TIN CÁC HOẠT ĐỘNG CỦA HỘI CỰU CHIẾN BINH XÃ */}
      {/* Khoảng cách thu gọn sát lại với Hero (py-6 sm:py-8) */}
      <section id="ban-tin" className="py-6 sm:py-8 px-4 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5 border-b border-stone-200 pb-3">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-flag-red mb-0.5">
              <span>★</span>
              <span>TIẾNG NÓI CỰU CHIẾN BINH EA SÚP</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-moss-green uppercase">
              Bản Tin Hoạt Động &amp; Tuyên Truyền Hội CCB Xã
            </h2>
            <p className="text-xs sm:text-sm text-deep-muted mt-0.5">
              Thông tin phong trào thi đua &quot;Cựu chiến binh gương mẫu&quot;, hoạt động nghĩa tình đồng đội và phát triển kinh tế
            </p>
          </div>

          {/* Cụm Nút Tác vụ & Tạo tin bài (Phân quyền Hybrid RBAC + ABAC) */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Nút gửi tin bài dành cho Hội viên / Chi hội trưởng / Cán bộ xã */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-moss-green hover:bg-moss-green-dark text-white text-xs sm:text-sm font-bold rounded shadow-xs transition cursor-pointer active:scale-98"
              title="Đăng tin bài mới hoặc gửi phản ánh chi hội"
            >
              <span>{currentUser?.role === "SUPER_ADMIN" ? "➕" : "✍️"}</span>
              <span>
                {currentUser?.role === "SUPER_ADMIN"
                  ? "Đăng Bản Tin Mới"
                  : currentUser?.role === "BRANCH_LEADER"
                  ? "Gửi Tin Bài Chi Hội"
                  : currentUser?.role === "MEMBER"
                  ? "Gửi Bài Viết CCB"
                  : "Gửi Tin Bài Phản Ánh"}
              </span>
              <span className="text-[10px] bg-amber-400 text-stone-900 px-1.5 py-0.5 rounded font-extrabold uppercase">
                {currentUser?.role === "SUPER_ADMIN"
                  ? "Cán bộ xã"
                  : currentUser?.role === "BRANCH_LEADER"
                  ? "Chi hội"
                  : currentUser?.role === "MEMBER"
                  ? "Hội viên"
                  : "CCB"}
              </span>
            </button>
          </div>
        </div>

        {/* Thanh Tab Lọc Trạng Thái Tin Bài (Hiển thị khi là Cán bộ xã hoặc có bài viết) */}
        {currentUser?.role === "SUPER_ADMIN" && (
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 text-xs sm:text-sm">
            <span className="font-bold text-stone-600 text-xs shrink-0">Bộ lọc cán bộ:</span>
            <button
              type="button"
              onClick={() => setArticleTab("ALL")}
              className={`px-3 py-1 rounded-full font-bold transition cursor-pointer shrink-0 ${
                articleTab === "ALL"
                  ? "bg-moss-green text-white shadow-xs"
                  : "bg-stone-200/80 hover:bg-stone-300 text-deep-text"
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
                  : "bg-stone-200/80 hover:bg-stone-300 text-deep-text"
              }`}
            >
              Đã xuất bản ({articles.filter((a) => a.status === "APPROVED").length})
            </button>
            <button
              type="button"
              onClick={() => setArticleTab("PENDING_APPROVAL")}
              className={`px-3 py-1 rounded-full font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                articleTab === "PENDING_APPROVAL"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
              }`}
            >
              <span>Chờ phê duyệt</span>
              {articles.filter((a) => a.status === "PENDING_APPROVAL").length > 0 && (
                <span className="px-1.5 py-0.2 bg-flag-red text-white text-[10px] font-black rounded-full animate-pulse">
                  {articles.filter((a) => a.status === "PENDING_APPROVAL").length}
                </span>
              )}
            </button>
          </div>
        )}

        {loadingNews ? (
          <div className="text-center py-12 text-deep-muted font-medium">
            Đang tải dữ liệu bản tin tuyên truyền...
          </div>
        ) : (
          (() => {
            const filteredArticles = articles.filter((a) => {
              if (currentUser?.role === "SUPER_ADMIN") {
                if (articleTab === "APPROVED") return a.status === "APPROVED";
                if (articleTab === "PENDING_APPROVAL") return a.status === "PENDING_APPROVAL";
              }
              return true;
            });

            if (filteredArticles.length === 0) {
              return (
                <div className="text-center py-12 bg-white rounded-lg border border-stone-200">
                  <p className="text-deep-muted mb-3">
                    {articleTab === "PENDING_APPROVAL"
                      ? "Hiện không có bản tin nào đang chờ phê duyệt."
                      : "Hiện chưa có bản tin tuyên truyền nào phù hợp."}
                  </p>
                  <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2 bg-moss-green text-white text-sm rounded font-bold hover:bg-moss-green-dark transition cursor-pointer"
                  >
                    ➕ Đăng / Gửi bài viết mới
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredArticles.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white border-2 border-stone-200 rounded-lg overflow-hidden hover:border-moss-green transition shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      {/* Bọc Link vào Ảnh đại diện Thumbnail với hiệu ứng hover zoom */}
                      <Link
                        href={`/tin-tuc/${item.id}`}
                        className="block h-40 w-full overflow-hidden relative bg-stone-100 cursor-pointer"
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
                          {/* Badge trạng thái phê duyệt */}
                          {item.status === "PENDING_APPROVAL" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-stone-900 shadow-xs">
                              ⏳ Chờ xã duyệt
                            </span>
                          )}
                          {item.status === "REJECTED" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-600 text-white shadow-xs">
                              ❌ Từ chối
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Bọc Link vào Tiêu đề bài viết */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-deep-muted">
                          <span>📅 {item.date}</span>
                          <span>👁️ {item.views || 100} lượt xem</span>
                        </div>
                        <Link href={`/tin-tuc/${item.id}`} className="block">
                          <h3 className="text-base font-bold text-deep-text leading-snug line-clamp-2 group-hover:text-moss-green group-hover:underline transition cursor-pointer">
                            {item.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-deep-muted leading-relaxed line-clamp-3">
                          {item.summary}
                        </p>
                      </div>
                    </div>

                    {/* Chân thẻ bài viết: ĐÃ LOẠI BỎ 'Đọc tiếp →' & 'Zalo'. Chỉ hiển thị cụm Quản trị/Phê duyệt cho Cán bộ xã */}
                    {currentUser?.role === "SUPER_ADMIN" && (
                      <div className="p-4 pt-0">
                        <div className="pt-2.5 border-t border-stone-100 flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 flex-wrap">
                          {/* Phê duyệt & Từ chối nhanh cho bài PENDING_APPROVAL */}
                          {item.status === "PENDING_APPROVAL" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveArticle(item.id, item.title)}
                                className="text-[11px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-2xs transition cursor-pointer"
                                title="Phê duyệt và xuất bản bài viết công khai"
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
                            className="text-[11px] px-2 py-1 bg-amber-50 hover:bg-amber-100 text-bronze-gold font-bold rounded border border-amber-300 transition cursor-pointer"
                            title="Chỉnh sửa bản tin (Dành cho cán bộ xã)"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(item.id)}
                            className="text-[11px] px-2 py-1 bg-red-50 hover:bg-red-100 text-flag-red font-bold rounded border border-red-200 transition cursor-pointer"
                            title="Xóa bản tin (Dành cho cán bộ xã)"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            );
          })()
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

              {/* Thanh chia sẻ đa kênh chuẩn đường dẫn bài viết */}
              <NewsShareBar
                title={selectedArticle.title}
                url={`https://ccb.easupso.com/tin-tuc/${selectedArticle.id}`}
                summary={selectedArticle.summary}
              />

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
            <div className="bg-stone-100 p-3.5 border-t border-stone-200 flex items-center justify-between gap-3">
              <Link
                href={`/tin-tuc/${selectedArticle.id}`}
                target="_blank"
                className="text-xs font-bold text-moss-green hover:underline flex items-center gap-1.5"
              >
                <span>↗ Mở trang bài viết độc lập (Sao chép link)</span>
              </Link>
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

      {/* MODAL 2: TẠO MỚI / CHỈNH SỬA BẢN TIN (HYBRID RBAC + ABAC) */}
      {isCadreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white text-deep-text w-full max-w-2xl max-h-[92vh] rounded-lg shadow-2xl border-4 border-bronze-gold flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="bg-bronze-gold text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {currentUser?.role === "SUPER_ADMIN" ? "🏛️" : "✍️"}
                </span>
                <h3 className="font-bold text-base sm:text-lg uppercase">
                  {isEditingArticle
                    ? "Chỉnh Sửa Bản Tin Tuyên Truyền"
                    : currentUser?.role === "SUPER_ADMIN"
                    ? "Đăng Tải Bản Tin Mới (Cán Bộ Xã)"
                    : currentUser?.role === "BRANCH_LEADER"
                    ? "Gửi Tin Bài Chi Hội (Chờ Xã Duyệt)"
                    : "Gửi Bài Viết / Phản Ánh CCB (Chờ Xã Duyệt)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCadreModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/20 text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Nội dung form */}
            <div className="p-6 overflow-y-auto space-y-4">
              {!isCadreVerified && currentUser?.role === "SUPER_ADMIN" ? (
                /* Bước xác thực quyền Cán bộ Xã bằng PIN nếu chưa xác thực */
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
                      className="px-4 py-2 border border-stone-300 rounded text-sm font-semibold hover:bg-stone-100 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-moss-green hover:bg-moss-green-dark text-white text-sm font-bold rounded shadow-xs cursor-pointer"
                    >
                      Xác thực quyền cán bộ →
                    </button>
                  </div>
                </form>
              ) : (
                /* Form nhập liệu Bản tin */
                <form onSubmit={handleSaveArticle} className="space-y-4">
                  {currentUser?.role === "SUPER_ADMIN" ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-moss-green font-semibold flex items-center gap-2">
                      <span>✓</span>
                      <span>Đã xác thực tư cách Cán bộ Thường trực Hội CCB Xã Ea Súp</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 leading-relaxed">
                      <p className="font-bold flex items-center gap-1.5 mb-1 text-bronze-gold">
                        <span>📢</span>
                        <span>QUY TRÌNH DUYỆT BÀI THEO ĐIỀU LỆ HỘI:</span>
                      </p>
                      <p>
                        Bài viết của đồng chí sẽ được chuyển lên Ban Thường trực Hội CCB Xã Ea Súp thẩm tra và phê duyệt trước khi xuất bản. Sau khi đã gửi đi, bài viết sẽ ở trạng thái <strong className="text-amber-800">Chờ phê duyệt</strong> và không thể tự ý sửa đổi.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-deep-text uppercase mb-1">
                      Tiêu đề bài viết / bản tin <span className="text-flag-red">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="VD: Chi hội Thôn 2 tổ chức sinh hoạt chuyên đề về gương CCB làm kinh tế giỏi..."
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
                        Người gửi / Tác giả bài viết:
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
                      placeholder="Tóm tắt 1-2 câu ngắn gọn làm nổi bật nội dung cốt lõi của bài..."
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
                      placeholder="Nhập nội dung đầy đủ của bài viết hoặc phản ánh..."
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
                      className="px-4 py-2 border border-stone-300 rounded text-sm font-semibold hover:bg-stone-100 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-moss-green hover:bg-moss-green-dark text-white text-sm font-bold rounded shadow-xs cursor-pointer transition active:scale-98"
                    >
                      {isEditingArticle
                        ? "Lưu thay đổi bản tin"
                        : currentUser?.role === "SUPER_ADMIN"
                        ? "Phát hành bản tin ngay"
                        : "Gửi bài lên Thường trực Xã phê duyệt →"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ĐĂNG NHẬP / ĐĂNG KÝ DÀNH RIÊNG CHO HỘI VIÊN BẰNG CCCD */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white text-deep-text w-full max-w-md rounded-2xl shadow-2xl border-4 border-bronze-gold overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="bg-moss-green text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-bronze-gold">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full bg-white border-2 border-bronze-gold flex items-center justify-center shadow-inner overflow-hidden shrink-0">
                  <Image
                    src="/images/logo-ccb.png"
                    alt="Logo Hội CCB Việt Nam"
                    width={40}
                    height={40}
                    className="object-contain p-0.5"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base uppercase tracking-tight text-white leading-tight">
                    Đăng Nhập Hội Viên CCB
                  </h3>
                  <p className="text-[11px] text-amber-200">
                    Dành riêng cho Hội viên bằng số CCCD 12 số
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMemberModalOpen(false);
                  setMemberLoginError("");
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {memberLoginError && (
                <div className="p-3 bg-red-50 border-l-4 border-flag-red text-flag-red text-xs font-bold rounded-r">
                  ⚠️ {memberLoginError}
                </div>
              )}

              <form onSubmit={handleMemberModalLogin} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-deep-text block">
                    Số Căn cước công dân (CCCD 12 số):
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="VD: 066050100001"
                    value={memberCccd}
                    onChange={(e) => setMemberCccd(e.target.value.replace(/\D/g, ""))}
                    className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-lg text-base font-semibold text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                    autoFocus
                  />
                  <p className="text-[11px] text-stone-500">
                    * Nhập chính xác 12 chữ số ghi trên thẻ Căn cước của đồng chí.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-deep-text block">
                    Mật khẩu:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập mật khẩu an toàn..."
                    value={memberPassword}
                    onChange={(e) => setMemberPassword(e.target.value)}
                    className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-lg text-base font-semibold text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isMemberLoggingIn}
                  className="w-full py-3 bg-moss-green hover:bg-emerald-900 active:scale-98 text-white font-bold text-sm uppercase tracking-wider rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isMemberLoggingIn ? "Đang xác thực bảo mật..." : "🛡️ ĐĂNG NHẬP VÀO CỔNG HỘI VIÊN"}</span>
                </button>
              </form>

              {/* Khung Hướng dẫn Đăng ký hội viên mới */}
              <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2 text-xs text-stone-700">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <span>📝</span>
                  <span>Chưa có tài khoản hoặc Hội viên mới kết nạp?</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  Đồng chí vui lòng liên hệ trực tiếp <strong>Chi hội trưởng</strong> tại thôn, buôn của mình hoặc <strong>Ban Thường trực Hội CCB Xã Ea Súp</strong> (Hotline: <strong>0943.170.770</strong>) để được cấp mã CCCD và hướng dẫn kết nạp theo Điều lệ Hội Cựu Chiến Binh Việt Nam.
                </p>
                <div className="pt-1">
                  <Link
                    href="/register-member"
                    onClick={() => setIsMemberModalOpen(false)}
                    className="w-full py-2.5 px-3 bg-moss-green hover:bg-moss-green-dark text-white font-bold text-xs uppercase tracking-wider rounded-lg border-2 border-bronze-gold shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <span>📝 Đăng ký Hội viên mới trực tuyến</span>
                  </Link>
                </div>
              </div>

              <div className="text-center pt-1 border-t border-stone-200">
                <Link
                  href="/login"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="text-xs font-semibold text-moss-green hover:underline"
                >
                  Cán bộ xã hoặc Chi hội trưởng? Chuyển sang Cổng đăng nhập quản trị →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
