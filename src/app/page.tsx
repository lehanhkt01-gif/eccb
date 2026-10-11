"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getCurrentUser, setCurrentUser, subscribeAuthChange, AuthUser } from "@/lib/authSession";
import { getStoredMembers } from "@/lib/memberStore";
import Header from "@/components/Header";
import NewsShareBar from "@/components/NewsShareBar";
import NewsCreateModal from "@/components/NewsCreateModal";
import FormattedContent from "@/components/FormattedContent";

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

  // State modal quản trị bản tin (Đăng tải / Sửa bài)
  const [isCadreModalOpen, setIsCadreModalOpen] = useState(false);
  const [isEditingArticle, setIsEditingArticle] = useState<Article | null>(null);

  // Tab lọc trạng thái bài viết (Dành cho Cán bộ xã hoặc tác giả)
  const [articleTab, setArticleTab] = useState<"ALL" | "APPROVED" | "PENDING_APPROVAL">("ALL");

  // Tải danh sách bản tin từ API và đồng bộ liên tục trạng thái đăng nhập
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUserState(user);
    fetchNews(user);

    // Đăng ký nhận sự kiện cập nhật auth tức thì trong và giữa các tab
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
    setIsCadreModalOpen(true);
  };

  // Mở modal sửa bản tin (Chỉ Cán bộ xã được phép)
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

  // Xóa bản tin (Chỉ Cán bộ xã)
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

          {/* Cụm Nút Tác vụ & Tạo tin bài: Chỉ hiển thị khi ĐÃ ĐĂNG NHẬP (Cán bộ xã, Chi hội trưởng hoặc Hội viên) */}
          {currentUser && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-moss-green hover:bg-moss-green-dark text-white text-xs sm:text-sm font-bold rounded shadow-xs transition cursor-pointer active:scale-98"
                title={
                  currentUser.role === "SUPER_ADMIN"
                    ? "Đăng bản tin mới của Hội CCB Xã"
                    : "Viết bản tin tuyên truyền để gửi Cán bộ xã phê duyệt"
                }
              >
                <span>{currentUser.role === "SUPER_ADMIN" ? "➕" : "✍️"}</span>
                <span>
                  {currentUser.role === "SUPER_ADMIN"
                    ? "Đăng Bản Tin Mới"
                    : "Viết bản tin tuyên truyền"}
                </span>
                <span className="text-[10px] bg-amber-400 text-stone-900 px-1.5 py-0.5 rounded font-extrabold uppercase">
                  {currentUser.role === "SUPER_ADMIN"
                    ? "Cán bộ xã"
                    : currentUser.role === "BRANCH_LEADER"
                    ? "Chi hội"
                    : "Hội viên"}
                </span>
              </button>
            </div>
          )}
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
                  {currentUser && (
                    <button
                      onClick={handleOpenCreateModal}
                      className="px-4 py-2 bg-moss-green text-white text-sm rounded font-bold hover:bg-moss-green-dark transition cursor-pointer"
                    >
                      {currentUser.role === "SUPER_ADMIN" ? "➕ Đăng bản tin mới" : "✍️ Viết bản tin tuyên truyền"}
                    </button>
                  )}
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
              <div className="text-base sm:text-lg leading-relaxed text-deep-text font-normal">
                <FormattedContent content={selectedArticle.content} />
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

      {/* MODAL 2: TẠO MỚI / CHỈNH SỬA BẢN TIN (NÂNG CẤP TOÀN DIỆN VỚI ROLE-AWARE & GALLERY) */}
      <NewsCreateModal
        isOpen={isCadreModalOpen}
        onClose={() => setIsCadreModalOpen(false)}
        currentUser={currentUser}
        articleToEdit={isEditingArticle}
        onSuccess={() => fetchNews(currentUser)}
      />

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
