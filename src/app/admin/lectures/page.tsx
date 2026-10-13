"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LectureItem, getStoredLectures, saveStoredLectures, INITIAL_LECTURES } from "@/lib/lectureStore";

const COMMON_BADGES = [
  "Bài giảng Bác Hồ",
  "Lịch sử truyền thống",
  "Kinh tế CCB",
  "Văn bản tuyên truyền",
  "Nghị quyết của Hội",
  "Âm nhạc cách mạng",
  "Chuyển đổi số",
  "Pháp luật & Đời sống",
];

export default function AdminLecturesPage() {
  const [lectures, setLectures] = useState<LectureItem[]>(INITIAL_LECTURES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Thêm / Chỉnh sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LectureItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formBadge, setFormBadge] = useState("Bài giảng Bác Hồ");
  const [formCustomBadge, setFormCustomBadge] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formFileUrl, setFormFileUrl] = useState("");
  const [formFileName, setFormFileName] = useState("");
  const [formFileSize, setFormFileSize] = useState("");
  const [formSpeaker, setFormSpeaker] = useState("Thường trực Hội CCB Xã");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Nạp dữ liệu từ máy chủ (có fallback localStorage)
  const loadData = async () => {
    setIsLoading(true);
    // 1. Nạp nhanh từ bộ nhớ đệm
    const cached = getStoredLectures();
    if (cached.length > 0) {
      setLectures(cached);
    }

    // 2. Tải từ API máy chủ
    try {
      const res = await fetch("/api/admin/lectures");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setLectures(data.data);
          saveStoredLectures(data.data);
        }
      }
    } catch (err) {
      console.warn("Lỗi fetch /api/admin/lectures, dùng dữ liệu đệm:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormBadge("Bài giảng Bác Hồ");
    setFormCustomBadge("");
    setFormDuration("15 phút");
    setFormDesc("");
    setFormUrl("");
    setFormFileUrl("");
    setFormFileName("");
    setFormFileSize("");
    setFormSpeaker("Thường trực Hội CCB Xã");
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (item: LectureItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    if (COMMON_BADGES.includes(item.badge)) {
      setFormBadge(item.badge);
      setFormCustomBadge("");
    } else {
      setFormBadge("OTHER");
      setFormCustomBadge(item.badge);
    }
    setFormDuration(item.duration || "");
    setFormDesc(item.desc || "");
    setFormUrl(item.url || "");
    setFormFileUrl(item.fileUrl || "");
    setFormFileName(item.fileName || "");
    setFormFileSize(item.fileSize || "");
    setFormSpeaker(item.speaker || "Thường trực Hội CCB Xã");
    setIsModalOpen(true);
  };

  // Xử lý upload file văn bản đính kèm
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/lectures/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        alert(`⚠️ ${data.message || "Lỗi tải file lên!"}`);
        return;
      }

      setFormFileUrl(data.data.fileUrl);
      setFormFileName(data.data.fileName);
      setFormFileSize(data.data.fileSize);
      showToast(`✓ Đã tải lên file: ${data.data.fileName}`);
    } catch (err: any) {
      console.error("Lỗi upload:", err);
      alert("⚠️ Không thể tải file lên máy chủ!");
    } finally {
      setIsUploading(false);
    }
  };

  // Gỡ file văn bản đã chọn
  const handleRemoveFile = () => {
    setFormFileUrl("");
    setFormFileName("");
    setFormFileSize("");
  };

  // Lưu thông tin (Thêm mới hoặc Cập nhật)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Vui lòng nhập tiêu đề bài giảng / văn bản!");
      return;
    }

    const finalBadge = formBadge === "OTHER" ? (formCustomBadge.trim() || "Chuyên đề khác") : formBadge;
    setIsSaving(true);

    const payload = {
      title: formTitle.trim(),
      badge: finalBadge,
      duration: formDuration.trim() || undefined,
      desc: formDesc.trim() || undefined,
      url: formUrl.trim() || undefined,
      fileUrl: formFileUrl.trim() || undefined,
      fileName: formFileName.trim() || undefined,
      fileSize: formFileSize.trim() || undefined,
      speaker: formSpeaker.trim() || undefined,
    };

    try {
      if (editingItem) {
        // Cập nhật
        const res = await fetch("/api/admin/lectures", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const updated = lectures.map((item) =>
          item.id === editingItem.id ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item
        );
        setLectures(updated);
        saveStoredLectures(updated);
        showToast(`✓ Đã cập nhật tư liệu: [${payload.title}]`);
      } else {
        // Thêm mới
        const res = await fetch("/api/admin/lectures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const newItem: LectureItem = data.data || {
          id: `lec_${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
        };
        const updated = [newItem, ...lectures];
        setLectures(updated);
        saveStoredLectures(updated);
        showToast(`✓ Đã thêm bài giảng/văn bản mới: [${payload.title}]`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Lỗi lưu bài giảng:", err);
      alert(`⚠️ ${err.message || "Lỗi lưu dữ liệu!"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Xóa bài giảng / văn bản
  const handleDelete = async (item: LectureItem) => {
    const confirmDelete = window.confirm(
      `Đồng chí có chắc chắn muốn XÓA VĨNH VIỄN bài giảng / tư liệu "${item.title}" khỏi hệ thống?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/lectures?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
    } catch (err) {
      console.warn("Lỗi xóa từ server:", err);
    }

    const updated = lectures.filter((l) => l.id !== item.id);
    setLectures(updated);
    saveStoredLectures(updated);
    showToast(`✓ Đã xóa tư liệu: [${item.title}]`);
  };

  // Danh sách sau khi lọc và tìm kiếm
  const filteredLectures = useMemo(() => {
    return lectures.filter((item) => {
      const matchBadge = selectedBadge === "ALL" || item.badge === selectedBadge;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.desc && item.desc.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q)) ||
        (item.speaker && item.speaker.toLowerCase().includes(q));

      return matchBadge && matchSearch;
    });
  }, [lectures, selectedBadge, searchQuery]);

  // Thống kê số lượng theo chuyên mục
  const badgeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: lectures.length };
    lectures.forEach((item) => {
      counts[item.badge] = (counts[item.badge] || 0) + 1;
    });
    return counts;
  }, [lectures]);

  return (
    <div className="space-y-6">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-moss-green text-white px-5 py-3 rounded-xl shadow-2xl border-2 border-bronze-gold flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-200">
          <span>🛡️</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tiêu đề & Nút thêm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-300">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-deep-text flex items-center gap-2">
            <span>📚</span>
            <span>QUẢN LÝ BÀI GIẢNG, TƯ LIỆU & VĂN BẢN TUYÊN TRUYỀN</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Đăng tải và quản lý link liên kết video bài giảng, phim tư liệu và file văn bản tuyên truyền cho 20 Chi hội &amp; Hội viên
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-moss-green hover:bg-moss-green-light active:bg-moss-green-dark text-white font-bold text-xs sm:text-sm rounded-xl shadow-md border-2 border-bronze-gold flex items-center justify-center gap-2 shrink-0 active:scale-95 transition cursor-pointer"
        >
          <span>➕</span>
          <span>Thêm Bài Giảng / Văn Bản Mới</span>
        </button>
      </div>

      {/* Thanh lọc & Tìm kiếm */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          {/* Ô Tìm kiếm */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="🔍 Tìm tiêu đề, nội dung, báo cáo viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-deep-text focus:border-moss-green focus:bg-white focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-stone-400 text-sm">🔍</span>
          </div>

          {/* Chọn chuyên mục */}
          <select
            value={selectedBadge}
            onChange={(e) => setSelectedBadge(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-deep-text focus:border-moss-green focus:outline-none font-medium cursor-pointer"
          >
            <option value="ALL">Tất cả chuyên đề ({badgeCounts.ALL || 0})</option>
            {COMMON_BADGES.map((b) => (
              <option key={b} value={b}>
                {b} ({badgeCounts[b] || 0})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-stone-600 font-medium shrink-0">
          Tổng số: <strong className="text-moss-green font-bold text-sm">{filteredLectures.length}</strong> tư liệu
        </div>
      </div>

      {/* Danh sách thẻ bài giảng & văn bản tuyên truyền */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLectures.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border-2 border-stone-300 text-stone-500 space-y-3">
            <span className="text-4xl block">📭</span>
            <p className="font-bold text-base text-deep-text">Chưa có bài giảng hoặc văn bản tuyên truyền nào</p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Đồng chí bấm nút <strong>[➕ Thêm Bài Giảng / Văn Bản Mới]</strong> phía trên để đưa link video bài giảng hoặc tải file tài liệu tuyên truyền lên hệ thống.
            </p>
          </div>
        ) : (
          filteredLectures.map((item) => (
            <div
              key={item.id}
              className="bg-white border-2 border-stone-300 hover:border-moss-green rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 transition flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Dòng 1: Badge chuyên mục & Thời lượng */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-moss-green/10 text-moss-green border border-moss-green/20">
                    {item.badge}
                  </span>
                  {item.duration && (
                    <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                      <span>⏱️</span>
                      <span>{item.duration}</span>
                    </span>
                  )}
                </div>

                {/* Dòng 2: Tiêu đề */}
                <h3 className="text-base sm:text-lg font-bold text-deep-text leading-snug">
                  {item.title}
                </h3>

                {/* Dòng 3: Mô tả */}
                {item.desc && (
                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                    {item.desc}
                  </p>
                )}

                {/* Dòng 4: Thông tin đính kèm (File văn bản & Link video) */}
                <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs">
                  {item.url && (
                    <div className="flex items-center gap-2 text-stone-600 truncate">
                      <span className="text-flag-red">🔗</span>
                      <strong className="text-stone-700">Link Video / Bài giảng:</strong>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-flag-red hover:underline font-mono truncate"
                      >
                        {item.url}
                      </a>
                    </div>
                  )}

                  {item.fileUrl && (
                    <div className="flex items-center justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2 truncate">
                        <span>📄</span>
                        <span className="font-semibold text-moss-green truncate">
                          {item.fileName || "Văn bản tuyên truyền đính kèm"}
                        </span>
                        {item.fileSize && (
                          <span className="text-[10px] text-stone-500 bg-white px-1.5 py-0.5 rounded border border-emerald-100">
                            {item.fileSize}
                          </span>
                        )}
                      </div>
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-moss-green text-white text-[11px] font-bold rounded hover:bg-moss-green-light shrink-0"
                      >
                        Xem / Tải file
                      </a>
                    </div>
                  )}

                  {item.speaker && (
                    <div className="text-[11px] text-stone-400">
                      Cơ quan / Báo cáo viên: <strong className="text-stone-600">{item.speaker}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Dòng 5: Cụm nút thao tác (Xem thử, Sửa, Xóa) */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-flag-red hover:bg-flag-red/90 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 active:scale-95 transition"
                    >
                      <span>▶️</span>
                      <span>Mở Video</span>
                    </a>
                  )}
                  {item.fileUrl && !item.url && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-moss-green hover:bg-moss-green-light text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 active:scale-95 transition"
                    >
                      <span>📄</span>
                      <span>Đọc Văn Bản</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-deep-text font-bold text-xs rounded-lg border border-stone-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>✏️</span>
                    <span>Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-flag-red font-bold text-xs rounded-lg border border-stone-300 hover:border-red-300 transition flex items-center gap-1 cursor-pointer"
                    title="Xóa tư liệu này"
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL THÊM MỚI / CHỈNH SỬA TƯ LIỆU                                  */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-cream-bg rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col border-3 border-bronze-gold shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="bg-moss-green text-white p-4 border-b-2 border-bronze-gold flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  {editingItem ? "CHỈNH SỬA BÀI GIẢNG / VĂN BẢN" : "THÊM BÀI GIẢNG / VĂN BẢN MỚI"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center active:scale-95 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form nội dung */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
              {/* Tiêu đề */}
              <div className="space-y-1">
                <label className="font-bold text-deep-text block">
                  Tiêu đề bài giảng / văn bản tuyên truyền <span className="text-flag-red">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lời Bác Dạy Cựu Chiến Binh & Quân Đội Nhân Dân..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-medium focus:border-moss-green focus:outline-none"
                />
              </div>

              {/* Chuyên mục & Thời lượng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-deep-text block">Chuyên đề / Chuyên mục:</label>
                  <select
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-medium focus:border-moss-green focus:outline-none cursor-pointer"
                  >
                    {COMMON_BADGES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="OTHER">Chuyên đề khác (nhập tay)...</option>
                  </select>
                  {formBadge === "OTHER" && (
                    <input
                      type="text"
                      placeholder="Nhập tên chuyên đề riêng..."
                      value={formCustomBadge}
                      onChange={(e) => setFormCustomBadge(e.target.value)}
                      className="w-full mt-1.5 p-2 bg-white border border-stone-300 rounded-lg text-xs"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-deep-text block">Thời lượng / Số trang:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 18 phút, 45 phút, 12 trang..."
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-medium focus:border-moss-green focus:outline-none"
                  />
                </div>
              </div>

              {/* Mô tả tóm tắt */}
              <div className="space-y-1">
                <label className="font-bold text-deep-text block">Mô tả tóm tắt nội dung:</label>
                <textarea
                  rows={3}
                  placeholder="Tóm tắt ngắn gọn nội dung bài giảng, tài liệu hoặc chỉ đạo để hội viên dễ theo dõi..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-medium focus:border-moss-green focus:outline-none"
                />
              </div>

              {/* Link liên kết Video / YouTube / Website */}
              <div className="space-y-1">
                <label className="font-bold text-deep-text block flex items-center justify-between">
                  <span>Link liên kết Video / Bài giảng (YouTube / Web):</span>
                  <span className="text-[11px] text-stone-500 font-normal">Hỗ trợ link YouTube, SmartTV</span>
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... hoặc link bài giảng ngoài"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-mono text-xs focus:border-moss-green focus:outline-none"
                />
              </div>

              {/* Upload file văn bản tuyên truyền */}
              <div className="space-y-2 p-3 bg-stone-100 rounded-xl border border-stone-300">
                <label className="font-bold text-deep-text block flex items-center justify-between">
                  <span>File văn bản tuyên truyền đính kèm (PDF / Word / Excel):</span>
                  <span className="text-[11px] text-moss-green font-semibold">Tối đa 25MB</span>
                </label>

                {formFileUrl ? (
                  <div className="bg-white p-3 rounded-lg border border-emerald-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xl">📄</span>
                      <div className="truncate">
                        <div className="font-bold text-deep-text truncate">{formFileName || "Văn bản đính kèm"}</div>
                        <div className="text-[11px] text-stone-500">{formFileSize || "File đã lưu"}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={formFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-stone-100 text-deep-text hover:bg-stone-200 font-bold text-xs rounded border border-stone-300"
                      >
                        Xem
                      </a>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="px-2.5 py-1 bg-red-50 text-flag-red hover:bg-red-100 font-bold text-xs rounded border border-red-200 cursor-pointer"
                      >
                        Gỡ file
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-400 hover:border-moss-green bg-white rounded-xl cursor-pointer transition">
                      <span className="text-2xl mb-1">📤</span>
                      <span className="font-bold text-xs text-moss-green">
                        {isUploading ? "Đang tải file lên máy chủ..." : "Bấm để chọn file văn bản (.PDF, .DOC, .DOCX, .XLSX)"}
                      </span>
                      <span className="text-[10px] text-stone-500 mt-0.5">Dung lượng tối đa 25MB</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Báo cáo viên / Cơ quan ban hành */}
              <div className="space-y-1">
                <label className="font-bold text-deep-text block">Báo cáo viên / Cơ quan ban hành:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thường trực Hội CCB Xã Ea Súp, Đài PT-TH Đắk Lắk..."
                  value={formSpeaker}
                  onChange={(e) => setFormSpeaker(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-lg font-medium focus:border-moss-green focus:outline-none"
                />
              </div>

              {/* Nút hành động */}
              <div className="pt-3 border-t border-stone-300 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-deep-text font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-5 py-2.5 bg-moss-green hover:bg-moss-green-light active:bg-moss-green-dark text-white font-bold rounded-xl border border-bronze-gold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>💾</span>
                  <span>{isSaving ? "Đang lưu..." : editingItem ? "Lưu Thay Đổi" : "Thêm Mới Ngay"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
