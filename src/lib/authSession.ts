// ==============================================================================
// E-CCB EA SÚP — QUẢN LÝ PHIÊN ĐĂNG NHẬP & PHÂN QUYỀN (src/lib/authSession.ts)
// Bảo mật tuyệt đối: Tuân thủ quy định không hardcode mật khẩu trong mã nguồn.
// ==============================================================================

export type UserRole = "SUPER_ADMIN" | "BRANCH_LEADER" | "MEMBER";

export interface AuthUser {
  id?: string;
  username: string; // Email/Username hoặc số CCCD 12 số
  fullName: string;
  role: UserRole;
  email?: string;
  phone?: string;
  cccd?: string; // Bắt buộc đối với Hội viên
  hamletCode?: string;
  hamletName?: string;
  memberId?: string;
}

const STORAGE_KEY_USER = "eccb_auth_current_user";
const STORAGE_KEY_PASSWORDS = "eccb_member_custom_passwords";

export const AUTH_CHANGE_EVENT = "eccb-auth-change";

/**
 * Lấy thông tin người dùng đang đăng nhập trong phiên
 */
export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Lưu thông tin người dùng vào phiên đăng nhập và kích hoạt sự kiện đồng bộ
 */
export function setCurrentUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    // Lưu cookie hỗ trợ middleware hoặc SSR
    document.cookie = `eccb_auth_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: user }));
  } catch (err) {
    console.error("Lỗi khi lưu phiên đăng nhập:", err);
  }
}

/**
 * Đăng xuất khỏi hệ thống và kích hoạt sự kiện đồng bộ
 */
export function logout(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_USER);
    document.cookie = "eccb_auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: null }));
  } catch (err) {
    console.error("Lỗi khi đăng xuất:", err);
  }
}

/**
 * Lắng nghe thay đổi trạng thái đăng nhập (trong cùng tab hoặc giữa các tab)
 */
export function subscribeAuthChange(callback: (user: AuthUser | null) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustom = (e: Event) => {
    const customEvent = e as CustomEvent<AuthUser | null>;
    callback(customEvent.detail ?? getCurrentUser());
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_USER || e.key === null) {
      callback(getCurrentUser());
    }
  };

  window.addEventListener(AUTH_CHANGE_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * Lấy mật khẩu tùy chỉnh nếu hội viên đã tự đổi mật khẩu
 */
export function getMemberCustomPassword(cccd: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PASSWORDS);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[cccd] || null;
  } catch {
    return null;
  }
}

/**
 * Lưu mật khẩu mới khi hội viên tự đổi mật khẩu thành công
 */
export function setMemberCustomPassword(cccd: string, newPasswordHashOrPlain: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PASSWORDS);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[cccd] = newPasswordHashOrPlain;
    localStorage.setItem(STORAGE_KEY_PASSWORDS, JSON.stringify(map));
  } catch (err) {
    console.error("Lỗi khi lưu mật khẩu hội viên:", err);
  }
}
