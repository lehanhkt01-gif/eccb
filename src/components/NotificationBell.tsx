"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  NotificationRecord,
  getStoredNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/memberStore";
import { AuthUser } from "@/lib/authSession";

interface NotificationBellProps {
  currentUser: AuthUser | null;
  currentHamletName?: string;
  onOpenApproval?: (memberId?: string) => void;
}

export default function NotificationBell({
  currentUser,
  currentHamletName,
  onOpenApproval,
}: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifs = () => {
    const list = getStoredNotifications();
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifs();
    const handleUpdate = () => loadNotifs();
    window.addEventListener("eccb-notifications-updated", handleUpdate);
    return () => window.removeEventListener("eccb-notifications-updated", handleUpdate);
  }, []);

  // Đóng khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Lọc thông báo phù hợp với vai trò người dùng
  const relevantNotifs = notifications.filter((n) => {
    if (!currentUser) return n.targetRole === "ALL";
    if (currentUser.role === "SUPER_ADMIN") {
      return n.targetRole === "SUPER_ADMIN" || n.targetRole === "ALL";
    }
    if (currentUser.role === "BRANCH_LEADER") {
      if (n.targetRole === "ALL") return true;
      if (n.targetRole === "BRANCH_LEADER") {
        if (!n.hamletName) return true;
        const myHamlet = currentHamletName || currentUser.hamletName || "";
        return n.hamletName.toLowerCase() === myHamlet.toLowerCase();
      }
      return false;
    }
    if (currentUser.role === "MEMBER") {
      if (n.targetRole === "ALL" || n.targetRole === "MEMBER") return true;
      if (n.userId && n.userId === currentUser.id) return true;
      return false;
    }
    return true;
  });

  const unreadCount = relevantNotifs.filter((n) => !n.isRead).length;

  const handleItemClick = (notif: NotificationRecord) => {
    markNotificationRead(notif.id);
    setIsOpen(false);
    if (notif.type === "NEW_REGISTRATION" || notif.type === "DUAL_APPROVAL_STEP") {
      if (onOpenApproval) {
        onOpenApproval();
      } else if (notif.linkUrl) {
        router.push(notif.linkUrl);
      } else {
        router.push("/admin/members");
      }
    } else if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(currentUser?.role, currentHamletName || currentUser?.hamletName);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông Thông Báo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-moss-green-light/80 hover:bg-moss-green-dark border border-amber-300/40 text-amber-200 hover:text-white transition active:scale-95 cursor-pointer shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-400"
        title="Thông báo xét duyệt & nghiệp vụ"
        aria-label="Chuông thông báo"
      >
        <span className="text-base sm:text-lg">🔔</span>

        {/* Huy hiệu số lượng thông báo chưa đọc */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-flag-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown danh sách thông báo */}
      {isOpen && (
        <>
          {/* Backdrop mờ mỏng trên Mobile - click ra ngoài để đóng */}
          <div
            className="fixed inset-0 bg-black/30 z-40 sm:hidden backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Container Popover: Mobile căn giữa màn hình (fixed inset-x-4 top-16 mx-auto), Desktop neo mép phải nút chuông */}
          <div className="fixed inset-x-4 top-16 mx-auto sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 sm:max-w-sm z-50 rounded-xl shadow-2xl border border-stone-200 bg-[#FBFBEE] overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[460px] animate-in fade-in duration-150">
            {/* Header Thông báo chuẩn Hallmark Quân đội */}
            <div className="p-3 bg-gradient-to-r from-moss-green to-moss-green-dark text-white flex items-center justify-between border-b-2 border-amber-400 gap-2 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base shrink-0">🔔</span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-amber-300 truncate">
                  Thông Báo &amp; Xét Duyệt
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-flag-red text-white text-[10px] font-black rounded-full shrink-0">
                    {unreadCount} mới
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-amber-200 hover:text-white underline cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Đã đọc tất cả
                </button>
              )}
            </div>

            {/* Danh sách thông báo - Cuộn mượt với max-height */}
            <div className="overflow-y-auto divide-y divide-stone-200/80 flex-1 max-h-[60vh] sm:max-h-[340px]">
              {relevantNotifs.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  <span className="text-2xl block mb-1">📭</span>
                  Hiện chưa có thông báo xét duyệt nào mới.
                </div>
              ) : (
                relevantNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3 transition cursor-pointer flex items-start gap-2.5 hover:bg-amber-100/40 ${
                      !n.isRead ? "bg-amber-50/80 font-medium" : "opacity-85"
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">
                      {n.type === "NEW_REGISTRATION"
                        ? "📝"
                        : n.type === "DUAL_APPROVAL_STEP"
                        ? "⏳"
                        : n.type === "ADMISSION_SUCCESS"
                        ? "🎖️"
                        : n.type === "NEW_ARTICLE_PENDING"
                        ? "📰"
                        : n.type === "ARTICLE_APPROVED"
                        ? "📢"
                        : "🔔"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-moss-green truncate">
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-flag-red shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-deep-text line-clamp-2 mt-0.5 leading-snug">
                        {n.content}
                      </p>
                      <span className="text-[10px] text-stone-500 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Dropdown */}
            {onOpenApproval && (
              <div className="p-2.5 bg-stone-100/90 border-t border-stone-200 text-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenApproval();
                  }}
                  className="w-full py-1.5 bg-moss-green hover:bg-moss-green-light active:scale-98 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>📋</span>
                  <span>Mở Bảng Xét Duyệt Song Trùng 2 Cấp</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
