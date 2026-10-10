"use client";

import React, { useState, useEffect, useRef } from "react";
import { AuthUser } from "@/lib/authSession";
import { Article } from "@/lib/newsService";

interface NewsCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  articleToEdit?: Article | null;
  onSuccess: () => void;
}

interface ImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  isExisting?: boolean;
}

const STANDARD_CATEGORIES = [
  "Hoạt động Hội",
  "Nghĩa tình đồng đội",
  "Kinh tế CCB",
  "Gương sáng Cựu chiến binh",
  "Chính sách & Pháp luật",
  "Sinh hoạt Chi hội cơ sở",
  "Chuyên mục khác...",
];

export default function NewsCreateModal({
  isOpen,
  onClose,
  currentUser,
  articleToEdit,
  onSuccess,
}: NewsCreateModalProps) {
  // State form
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Hoạt động Hội");
  const [customCategory, setCustomCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");

  // Quản lý ảnh (tối đa 5 ảnh)
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Trạng thái xử lý
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isCadre = currentUser?.role === "SUPER_ADMIN";
  const isBranchLeader = currentUser?.role === "BRANCH_LEADER";
  const isMember = currentUser?.role === "MEMBER";
  const isEditing = !!articleToEdit;

  // Khởi tạo dữ liệu khi mở Modal
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (articleToEdit) {
      setTitle(articleToEdit.title || "");
      if (STANDARD_CATEGORIES.slice(0, 6).includes(articleToEdit.category)) {
        setSelectedCategory(articleToEdit.category);
        setCustomCategory("");
      } else {
        setSelectedCategory("Chuyên mục khác...");
        setCustomCategory(articleToEdit.category || "");
      }

      setAuthor(articleToEdit.author || "");
      setSummary(articleToEdit.summary || "");
      setContent(articleToEdit.content || "");

      // Khởi tạo ảnh hiện có
      const existingImgs: string[] = [];
      if (Array.isArray(articleToEdit.imageGallery) && articleToEdit.imageGallery.length > 0) {
        existingImgs.push(...articleToEdit.imageGallery);
      } else if (articleToEdit.imageUrl || articleToEdit.thumbnail) {
        existingImgs.push(articleToEdit.imageUrl || articleToEdit.thumbnail || "");
      }

      setImages(
        existingImgs.filter(Boolean).slice(0, 5).map((url, idx) => ({
          id: `existing-${idx}-${Date.now()}`,
          previewUrl: url,
          isExisting: true,
        }))
      );
    } else {
      // Form tạo mới
      setTitle("");
      setSelectedCategory("Hoạt động Hội");
      setCustomCategory("");
      setSummary("");
      setContent("");
      setImages([]);

      // Tự động gán tác giả theo Session
      if (isCadre) {
        setAuthor("Thường trực Hội CCB xã Ea Súp");
      } else if (isBranchLeader) {
        const hamlet = currentUser?.hamletName || "Chi hội";
        setAuthor(`Đ/c ${currentUser?.fullName || "Chi hội trưởng"} - Chi hội trưởng ${hamlet}`);
      } else if (isMember) {
        const hamlet = currentUser?.hamletName || "Chi hội cơ sở";
        setAuthor(`Hội viên ${currentUser?.fullName || "CCB"} - Chi hội ${hamlet}`);
      } else {
        setAuthor("Hội viên Cựu Chiến Binh Ea Súp");
      }
    }
  }, [isOpen, articleToEdit, currentUser, isCadre, isBranchLeader, isMember]);

  if (!isOpen) return null;

  // Xác thực và thêm file ảnh
  const handleAddFiles = (fileList: FileList | File[]) => {
    setErrorMessage("");
    const newFiles = Array.from(fileList);

    if (images.length + newFiles.length > 5) {
      setErrorMessage(
        `Chỉ được tải tối đa 5 hình ảnh cho một bản tin! Hiện bạn đã chọn ${images.length} ảnh.`
      );
      return;
    }

    const validNewItems: ImageItem[] = [];

    for (const file of newFiles) {
      // 1. Kiểm tra dung lượng (<= 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(
          `Ảnh "${file.name}" vượt quá 5MB (${(file.size / (1024 * 1024)).toFixed(1)}MB), vui lòng nén hoặc chọn ảnh khác!`
        );
        return;
      }

      // 2. Kiểm tra định dạng hợp lệ
      const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExts.includes(ext) && !file.type.startsWith("image/")) {
        setErrorMessage(`Ảnh "${file.name}" không đúng định dạng hợp lệ (.jpg, .jpeg, .png, .webp)!`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      validNewItems.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        isExisting: false,
      });
    }

    setImages((prev) => [...prev, ...validNewItems].slice(0, 5));
  };

  // Xóa ảnh
  const handleRemoveImage = (idToRemove: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === idToRemove);
      if (target?.previewUrl && !target.isExisting && target.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== idToRemove);
    });
  };

  // Đặt làm ảnh đại diện (đưa lên vị trí đầu tiên)
  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(index, 1);
      next.unshift(chosen);
      return next;
    });
  };

  // Thao tác thanh công cụ văn bản
  const handleInsertFormatting = (type: "bold" | "italic" | "newline" | "indent" | "bullet") => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let replacement = "";

    switch (type) {
      case "bold":
        replacement = selectedText ? `**${selectedText}**` : `**Văn bản in đậm**`;
        break;
      case "italic":
        replacement = selectedText ? `*${selectedText}*` : `*Văn bản in nghiêng*`;
        break;
      case "newline":
        replacement = `\n\n`;
        break;
      case "indent":
        replacement = `    `;
        break;
      case "bullet":
        replacement = selectedText ? `\n• ${selectedText}` : `\n• Điểm thứ nhất...\n• Điểm thứ hai...`;
        break;
    }

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

  // Xử lý nộp form
  const handleSubmit = async (submitStatus: "APPROVED" | "PENDING_APPROVAL" | "DRAFT") => {
    setErrorMessage("");
    setSuccessMessage("");

    // Validate tiêu đề
    if (!title.trim()) {
      setErrorMessage("Vui lòng nhập tiêu đề bản tin!");
      return;
    }

    // Validate chuyên mục
    const finalCategory =
      selectedCategory === "Chuyên mục khác..."
        ? customCategory.trim()
        : selectedCategory.trim();

    if (!finalCategory) {
      setErrorMessage("Vui lòng chọn hoặc nhập tên chuyên mục bài viết!");
      return;
    }

    // Validate tác giả
    if (!author.trim()) {
      setErrorMessage("Vui lòng nhập tên tác giả / người gửi bản tin!");
      return;
    }

    // Validate tóm tắt & nội dung
    if (!summary.trim()) {
      setErrorMessage("Vui lòng nhập tóm tắt ngắn gọn (Sa-pô) của bản tin!");
      return;
    }

    if (!content.trim()) {
      setErrorMessage("Vui lòng nhập nội dung chi tiết bài viết!");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Tải lên các file ảnh mới (nếu có)
      setUploadingImages(true);
      const finalImageUrls: string[] = [];

      for (const imgItem of images) {
        if (imgItem.isExisting) {
          finalImageUrls.push(imgItem.previewUrl);
        } else if (imgItem.file) {
          const fd = new FormData();
          fd.append("files", imgItem.file);

          const uploadRes = await fetch("/api/news/upload", {
            method: "POST",
            body: fd,
          });

          const uploadJson = await uploadRes.json();
          if (!uploadRes.ok || !uploadJson.success) {
            throw new Error(uploadJson.message || `Lỗi tải ảnh ${imgItem.file.name}`);
          }

          if (Array.isArray(uploadJson.urls) && uploadJson.urls.length > 0) {
            finalImageUrls.push(...uploadJson.urls);
          }
        }
      }
      setUploadingImages(false);

      // 2. Gửi payload bài viết
      const primaryImage = finalImageUrls[0] || "/images/hero-military-bg.webp";

      const payload = {
        id: articleToEdit?.id,
        title: title.trim(),
        category: finalCategory,
        summary: summary.trim(),
        content: content.trim(),
        author: author.trim(),
        authorId: currentUser?.id || currentUser?.username || "hoi-vien",
        authorRole: currentUser?.role || "MEMBER",
        authorPhone: currentUser?.phone || "",
        imageUrl: primaryImage,
        thumbnail: primaryImage,
        imageGallery: finalImageUrls,
        status: isCadre ? submitStatus : "PENDING_APPROVAL",
        pin: "ccbeasup",
        userRole: currentUser?.role || "GUEST",
      };

      const url = "/api/news";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": isCadre ? "CADRE" : "MEMBER",
          "x-user-role": currentUser?.role || "GUEST",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể lưu bài viết!");
      }

      setSuccessMessage(
        isCadre
          ? submitStatus === "DRAFT"
            ? "Đã lưu bản nháp thành công!"
            : isEditing
            ? "Cập nhật bản tin thành công!"
            : "Đã phát hành bản tin tuyên truyền thành công!"
          : "✓ Đã gửi bài viết thành công! Đang chờ Ban Thường trực Hội CCB Xã Ea Súp thẩm tra & phê duyệt."
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Lỗi kết nối khi gửi bài viết!");
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FDFDF7] text-deep-text w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl border-2 border-stone-300 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* ========================================================================= */}
        {/* 1. HEADER MODAL CÁ NHÂN HÓA THEO VAI TRÒ (ROLE-AWARE HEADER)             */}
        {/* ========================================================================= */}
        <div
          className={`p-3.5 sm:p-4 text-white flex items-center justify-between border-b-2 border-[#B45309] shrink-0 ${
            isCadre
              ? "bg-[#244023]"
              : isBranchLeader
              ? "bg-gradient-to-r from-[#244023] via-[#2d522c] to-[#9E1A1A]"
              : "bg-gradient-to-r from-[#244023] to-[#2e4f2b]"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="text-xl sm:text-2xl shrink-0">
              {isCadre ? "🏛️" : isBranchLeader ? "⭐" : "🎖️"}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base uppercase tracking-tight text-amber-200 truncate leading-snug">
                {isEditing
                  ? "Chỉnh Sửa Bản Tin Tuyên Truyền"
                  : isCadre
                  ? "Đăng Tải Bản Tin Mới (Cán Bộ Xã)"
                  : isBranchLeader
                  ? "Gửi Tin Bài Chi Hội (Chi Hội Trưởng)"
                  : "Gửi Tin Bài Hội Viên CCB"}
              </h3>
              <p className="text-[11px] text-stone-200 truncate">
                {isCadre
                  ? "Ban Thường trực Hội CCB Xã Ea Súp • Toàn quyền xuất bản"
                  : isBranchLeader
                  ? "Chi hội trưởng cơ sở • Bài viết sẽ chuyển lên Thường trực Xã phê duyệt"
                  : "Hội viên cơ sở • Bài viết sẽ chuyển lên Thường trực Xã phê duyệt"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-lg flex items-center justify-center transition cursor-pointer shrink-0 ml-2"
            title="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        {/* ========================================================================= */}
        {/* NỘI DUNG FORM (SCROLLABLE, MOBILE FIRST, TỐI ƯU BÁO CHÍ)                 */}
        {/* ========================================================================= */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 text-deep-text">
          {/* Thông báo lỗi / thành công */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border-l-4 border-flag-red rounded text-xs text-flag-red font-bold flex items-start gap-2 animate-in fade-in">
              <span className="shrink-0 text-base">⚠️</span>
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded text-xs text-emerald-800 font-bold flex items-start gap-2 animate-in fade-in">
              <span className="shrink-0 text-base">✓</span>
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* Banner lưu ý Điều lệ Hội đối với Hội viên & Chi hội trưởng */}
          {!isCadre && (
            <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl text-xs text-amber-900 leading-relaxed shadow-2xs">
              <div className="font-bold flex items-center gap-1.5 text-bronze-gold mb-1">
                <span>📢</span>
                <span>QUY TRÌNH DUYỆT BÀI THEO ĐIỀU LỆ HỘI:</span>
              </div>
              <p>
                Bài viết của đồng chí sau khi gửi sẽ ở trạng thái{" "}
                <strong className="text-amber-800 font-bold">Chờ phê duyệt</strong>.
                Ban Thường trực Hội CCB Xã Ea Súp sẽ thẩm tra nội dung, hiệu đính và xuất bản
                chính thức lên Cổng thông tin điện tử.
              </p>
            </div>
          )}

          {/* 1. TIÊU ĐỀ BẢN TIN (*) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold uppercase tracking-wide text-deep-text">
                Tiêu đề bản tin <span className="text-flag-red">*</span>:
              </label>
              <span
                className={`text-[11px] font-medium ${
                  title.length > 130 ? "text-flag-red font-bold" : "text-stone-500"
                }`}
              >
                {title.length}/150 ký tự
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hội CCB xã tổ chức bàn giao nhà Nghĩa tình đồng đội tại Buôn A..."
              className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-sm sm:text-base font-bold text-deep-text focus:border-moss-green focus:outline-none focus:ring-1 focus:ring-moss-green transition shadow-2xs"
            />
          </div>

          {/* 2. HÀNG THÔNG TIN NGUỒN: CHUYÊN MỤC & TÁC GIẢ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Cột 1: Chuyên mục bài viết */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wide text-deep-text">
                Chuyên mục bài viết <span className="text-flag-red">*</span>:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs sm:text-sm font-semibold text-deep-text focus:border-moss-green focus:outline-none transition shadow-2xs cursor-pointer"
              >
                {STANDARD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Ô nhập Transition động khi chọn "Chuyên mục khác..." */}
              {selectedCategory === "Chuyên mục khác..." && (
                <div className="pt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Nhập tên chuyên mục mới của bạn... (VD: Chuyển đổi số thôn buôn, Khuyến học CCB...)"
                    className="w-full px-3.5 py-2 bg-amber-50/60 border-2 border-amber-400 rounded-lg text-xs sm:text-sm font-medium text-deep-text placeholder:text-stone-400 focus:outline-none focus:border-moss-green focus:bg-white transition"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Cột 2: Người gửi / Tác giả bài viết */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wide text-deep-text">
                Người gửi / Tác giả bài viết <span className="text-flag-red">*</span>:
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="VD: Thường trực Hội CCB Xã / Đ/c Nguyễn Văn A..."
                className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs sm:text-sm font-semibold text-deep-text focus:border-moss-green focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>

          {/* 3. TÓM TẮT NGẮN GỌN / SA-PÔ (*) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wide text-deep-text">
              Tóm tắt ngắn gọn / Sa-pô <span className="text-flag-red">*</span>:
            </label>
            <textarea
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Tóm tắt 1-2 câu ngắn gọn làm nổi bật nội dung cốt lõi của bài viết..."
              className="w-full px-3.5 py-2 bg-white border-2 border-stone-300 rounded-xl text-xs sm:text-sm font-medium text-deep-text focus:border-moss-green focus:outline-none transition shadow-2xs leading-relaxed"
            />
          </div>

          {/* 4. NỘI DUNG BÀI VIẾT CHI TIẾT (*) VỚI THANH CÔNG CỤ ĐỊNH DẠNG */}
          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-1 text-xs">
              <label className="font-bold uppercase tracking-wide text-deep-text">
                Nội dung bài viết chi tiết <span className="text-flag-red">*</span>:
              </label>
              <span className="text-[11px] text-stone-500">
                Hỗ trợ định dạng văn bản chuẩn
              </span>
            </div>

            {/* Thanh công cụ định dạng nhanh */}
            <div className="flex items-center gap-1.5 p-1.5 bg-stone-100 border-2 border-stone-300 border-b-0 rounded-t-xl flex-wrap text-xs">
              <button
                type="button"
                onClick={() => handleInsertFormatting("bold")}
                className="px-2.5 py-1 bg-white hover:bg-stone-200 border border-stone-300 rounded font-bold text-deep-text transition active:scale-95 cursor-pointer shadow-2xs"
                title="In đậm chữ (**nội dung**)"
              >
                <strong>B</strong> In đậm
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting("italic")}
                className="px-2.5 py-1 bg-white hover:bg-stone-200 border border-stone-300 rounded italic text-deep-text transition active:scale-95 cursor-pointer shadow-2xs"
                title="In nghiêng chữ (*nội dung*)"
              >
                <em>I</em> In nghiêng
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting("bullet")}
                className="px-2.5 py-1 bg-white hover:bg-stone-200 border border-stone-300 rounded text-deep-text transition active:scale-95 cursor-pointer shadow-2xs"
                title="Gạch đầu dòng danh sách (• )"
              >
                • Gạch đầu dòng
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting("newline")}
                className="px-2.5 py-1 bg-white hover:bg-stone-200 border border-stone-300 rounded text-deep-text transition active:scale-95 cursor-pointer shadow-2xs"
                title="Ngắt đoạn văn mới"
              >
                ↵ Xuống dòng
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting("indent")}
                className="px-2.5 py-1 bg-white hover:bg-stone-200 border border-stone-300 rounded text-deep-text transition active:scale-95 cursor-pointer shadow-2xs"
                title="Thụt lề đoạn văn"
              >
                ⇥ Thụt lề
              </button>
            </div>

            <textarea
              ref={contentTextareaRef}
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung đầy đủ của bài viết hoặc tin phản ánh phong trào..."
              className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-b-xl text-xs sm:text-sm font-normal text-deep-text focus:border-moss-green focus:outline-none transition leading-relaxed shadow-2xs"
            />
          </div>

          {/* ========================================================================= */}
          {/* 5. KHU VỰC TẢI ẢNH: TỐI ĐA 5 ẢNH, GIỚI HẠN 5MB/ẢNH                       */}
          {/* ========================================================================= */}
          <div className="space-y-2 pt-1 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wide text-deep-text flex items-center gap-1.5">
                <span>📷</span>
                <span>Hình ảnh bài viết (Tối đa 5 ảnh, mỗi ảnh ≤ 5MB):</span>
              </label>
              <span className="text-xs font-bold text-moss-green">
                Đã chọn: {images.length}/5 ảnh
              </span>
            </div>

            {/* Khung Dropzone kéo thả / chọn file */}
            {images.length < 5 && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) {
                    handleAddFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition ${
                  isDragging
                    ? "border-moss-green bg-emerald-50/60"
                    : "border-stone-300 hover:border-moss-green bg-stone-50 hover:bg-amber-50/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleAddFiles(e.target.files);
                    }
                  }}
                />
                <div className="space-y-1.5 pointer-events-none">
                  <div className="text-2xl sm:text-3xl">📸</div>
                  <p className="text-xs sm:text-sm font-bold text-moss-green">
                    Bấm để chọn ảnh từ máy hoặc kéo thả vào đây
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Định dạng: JPG, PNG, WEBP • Tối đa 5 ảnh, mỗi ảnh không vượt quá 5MB
                  </p>
                </div>
              </div>
            )}

            {/* Grid Thumbnail xem trước và sắp xếp thứ tự ảnh */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    className={`relative rounded-xl overflow-hidden border-2 transition shadow-xs group bg-stone-100 flex flex-col justify-between ${
                      index === 0
                        ? "border-[#B45309] ring-2 ring-[#B45309]/30"
                        : "border-stone-300 hover:border-moss-green"
                    }`}
                  >
                    <div className="h-24 w-full relative overflow-hidden bg-stone-200">
                      <img
                        src={img.previewUrl}
                        alt={`Ảnh ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Badge Ảnh bìa đại diện */}
                      {index === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-[#B45309] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                          <span>★</span>
                          <span>Ảnh bìa</span>
                        </div>
                      )}

                      {/* Nút xóa ảnh */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(img.id);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-flag-red/90 hover:bg-flag-red text-white font-black text-xs flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                        title="Xóa ảnh này"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Thanh tác vụ đặt làm ảnh bìa */}
                    <div className="p-1.5 bg-stone-50 border-t border-stone-200 text-center">
                      {index === 0 ? (
                        <span className="text-[10px] font-bold text-[#B45309]">
                          ✓ Ảnh đại diện
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(index)}
                          className="w-full text-[10px] font-bold text-moss-green hover:underline cursor-pointer transition"
                        >
                          Đặt làm ảnh bìa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER MODAL & CỤM NÚT THAO TÁC THEO VAI TRÒ (ROLE-AWARE ACTIONS)        */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 bg-stone-100 border-t border-stone-300 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-stone-500 italic max-w-sm">
            {!isCadre ? (
              <span>* Bài viết sẽ được Thường trực Hội CCB xã thẩm tra và phê duyệt.</span>
            ) : (
              <span>* Cán bộ xã có thể lưu bản nháp hoặc phát hành trực tiếp.</span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-wrap">
            {/* Nút Hủy bỏ */}
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-200 text-stone-700 font-semibold text-xs sm:text-sm rounded-lg transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Hủy bỏ
            </button>

            {/* Nút Lưu bản nháp (DÀNH RIÊNG CHO CÁN BỘ XÃ) */}
            {isCadre && (
              <button
                type="button"
                onClick={() => handleSubmit("DRAFT")}
                disabled={submitting}
                className="px-4 py-2 border border-[#B45309]/80 text-[#B45309] bg-amber-50 hover:bg-amber-100 font-bold text-xs sm:text-sm rounded-lg transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                title="Lưu tạm bản nháp, chưa xuất bản công khai"
              >
                <span>💾</span>
                <span>Lưu bản nháp</span>
              </button>
            )}

            {/* Nút Xuất bản ngay (Cán bộ xã) HOẶC Gửi bài chờ duyệt (Hội viên / Chi hội trưởng) */}
            <button
              type="button"
              onClick={() => handleSubmit(isCadre ? "APPROVED" : "PENDING_APPROVAL")}
              disabled={submitting}
              className="px-5 sm:px-6 py-2.5 bg-[#244023] hover:bg-[#1b311a] active:scale-98 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting || uploadingImages ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{uploadingImages ? "Đang tải ảnh..." : "Đang lưu bài..."}</span>
                </>
              ) : isEditing ? (
                <span>Lưu thay đổi bản tin</span>
              ) : isCadre ? (
                <span>Phát hành bản tin ngay</span>
              ) : (
                <span>Gửi bài chờ duyệt →</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
