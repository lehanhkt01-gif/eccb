# 🎖️ E-CCB EA SÚP — CỔNG THÔNG TIN & QUẢN TRỊ NGHIỆP VỤ HỘI CỰU CHIẾN BINH

> **Hệ sinh thái:** Ea Súp Số (`easupso.com`)  
> **Tên miền chính thức:** [https://ccb.easupso.com](https://ccb.easupso.com)  
> **Cơ quan chủ quản:** Hội Cựu Chiến Binh Xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk  
> **Tài liệu Hướng dẫn sử dụng:** 📖 [Xem chi tiết tại HELP.md](./HELP.md)

---

## 📌 GIỚI THIỆU DỰ ÁN
**E-CCB Ea Súp** là nền tảng chuyển đổi số toàn diện công tác quản trị và tác nghiệp của Hội Cựu Chiến Binh Xã Ea Súp, bao gồm:
- **612 Hội viên** Cựu Chiến Binh sinh hoạt tại 20 thôn buôn.
- **20 Chi hội thôn, buôn:** Buôn A, Buôn B, Buôn C, Thôn Hòa Bình, Thôn Thắng Lợi, Thôn Đoàn Kết, Thôn Bình Lợi, Thôn 1 đến Thôn 13.
- **Quản lý vốn vay NHCSXH:** 20 Tổ Tiết kiệm & Vay vốn (TK&VV) với tổng dư nợ trên 50 tỷ đồng.
- **Quản lý Quỹ hội:** Quỹ nội bộ tương trợ đồng đội, thăm hỏi phúng viếng.

---

## 🚀 CÁC TÍNH NĂNG CHÍNH
1. **Quản lý Hồ sơ Hội viên 35 trường (Phiếu Mẫu 02):**
   - Danh sách tinh gọn, bộ lọc thôn buôn và tìm kiếm trực quan.
   - Xuất file Word (`.docx`) chuẩn thể thức văn bản hành chính theo **Nghị định 30/2020/NĐ-CP**.
   - Nhập file Excel/CSV đồng loạt (hỗ trợ file thực tế có dòng tiêu đề hành chính mở đầu, tự động quét header, kiểm tra trùng lặp).
   - Cơ chế **Thùng rác (Soft Delete)** bảo toàn dữ liệu vĩnh viễn: cho phép Khôi phục từng người, Khôi phục tất cả hoặc Xóa hẳn.
2. **Quản lý Tài khoản & Phân quyền 3 cấp (`/admin/permissions`):**
   - Cán bộ xã (SuperAdmin) bảo vệ vĩnh viễn.
   - 20 Chi hội trưởng (hỗ trợ nhiều CHT cho 1 chi hội, bổ nhiệm từ danh sách thôn hoặc tạo mới).
   - Toàn thể hội viên đăng nhập bằng số CCCD 12 số.
   - Khóa/Mở tài khoản tức thì, đặt lại mật khẩu về mặc định, xóa tài khoản vĩnh viễn có blacklist.
3. **PWA Tác nghiệp Chi hội (`/branch` & `/branch/operations`):**
   - Không gian điều hành cho 20 Chi hội trưởng trên điện thoại di động.
   - Điểm danh sinh hoạt chi hội định kỳ.
   - Quản lý thu quỹ hội, hội phí.
   - Quản lý 4 nghiệp vụ biến động: *Chuyển đến*, *Chuyển đi*, *Xóa tên*, *Báo tử* kèm đính kèm văn bản PDF / ảnh xác nhận.
4. **Cổng Thông tin & Không gian Hội viên (`/member`):**
   - Tra cứu lý lịch điện tử 35 trường Mẫu 02.
   - Đổi mật khẩu cá nhân, xem sổ quỹ hội viên.
   - Tra cứu tài liệu học tập chính trị, tư liệu lịch sử.
   - Đăng ký kết nạp hội viên mới trực tuyến (`/register-member`).
5. **Bản tin Tuyên truyền & Truyền thông (`/tin-tuc`):**
   - Đăng bài viết kèm album tối đa 5 ảnh tư liệu chất lượng cao.
   - Quy trình duyệt bài viết 2 cấp (Chờ duyệt -> Phê duyệt xuất bản).

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG
- **Frontend & Server:** Next.js 15 (App Router, React 19, TypeScript)
- **Styling & Design System:** Tailwind CSS v4 (Bảng màu Quân đội Hallmark: Xanh rêu `#244023`, Đỏ cờ `#9E1A1A`, Vàng đồng `#B45309`, Nền kem `#FBFBEE`)
- **Cơ sở dữ liệu:** PostgreSQL 16 Alpine
- **ORM Client:** Prisma ORM v6
- **Containerization & Hạ tầng:** Docker Compose, Multi-stage build
- **Reverse Proxy & SSL:** Nginx Alpine forward port `3011:3000` qua Nginx Proxy Manager

---

## 📖 HƯỚNG DẪN SỬ DỤNG CHI TIẾT
Chi tiết cách sử dụng các chức năng theo từng vai trò (Cán bộ xã, Chi hội trưởng, Hội viên) vui lòng đọc tài liệu:
👉 **[TÀI LIỆU HƯỚNG DẪN SỬ DỤNG (HELP.md)](./HELP.md)**

---

## 💻 TRIỂN KHAI MÁY CHỦ (DEPLOYMENT)

### Môi trường Local:
```bash
npm install
npm run dev
# Mở http://localhost:3000
```

### Triển khai máy chủ VPS Maydell:
```bash
cd /var/www/ECCB
git pull origin main
bash deploy.sh
```

---
*© 2026 Hội Cựu Chiến Binh Xã Ea Súp — Phát triển trong Hệ sinh thái Ea Súp Số.*
