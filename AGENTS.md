# AGENTS.md — HƯỚNG DẪN KIẾN TRÚC & QUY TẮC PHÁT TRIỂN E-CCB EA SÚP

> **Dự án:** WebApp "E-CCB Ea Súp" (`ccb.easupso.com`)  
> **Tổ chức:** Hội Cựu Chiến Binh Xã Ea Súp — Trực thuộc Hệ sinh thái **Ea Súp Số**  
> **Phiên bản:** 1.0.0 (Giai đoạn Khởi tạo & Định hình Kiến trúc)  
> **Vai trò Agent:** Kỹ sư trưởng Fullstack (Lead Fullstack Architect & Engineer)

---

## 1. Tech Stack Cốt Lõi (Standard Architecture)

| Thành phần | Công nghệ / Phiên bản | Ghi chú & Vai trò |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15** (App Router, TypeScript) | Server Components, Server Actions, Dynamic Rendering |
| **Styling & Design System** | **Tailwind CSS v4** | Hệ thống utility classes, tuân thủ nghiêm ngặt bảng màu quy định |
| **ORM & Database Client** | **Prisma ORM** | Type-safe schema, migrations, data modeling |
| **Cơ sở dữ liệu** | **PostgreSQL 16 Alpine** | Chạy trong Docker container, tối ưu hiệu năng và tài nguyên |
| **Containerization** | **Docker Compose** | Đóng gói môi trường đồng nhất (App, DB, Nginx, Dozzle) |
| **Reverse Proxy / Web Server**| **Nginx (Alpine)** | Định tuyến domain `ccb.easupso.com`, SSL termination, gzip/brotli cache |
| **Giám sát & Quản trị Log** | **Dozzle** | Web UI theo dõi realtime container logs nhẹ và an toàn |

---

## 2. Bảng Màu Quân Đội Hallmark (Hallmark Military Color Palette)

Dự án phục vụ Hội Cựu Chiến Binh xã Ea Súp, mang tính trang trọng, mẫu mực, thể hiện bản lĩnh "Bộ đội Cụ Hồ", kiên định, kỷ cương và gần gũi.

```css
:root {
  /* Bảng màu chuẩn Hallmark Quân đội */
  --color-moss-green: #244023;   /* Xanh rêu: Màu chủ đạo (Primary Brand), quân phục, rừng núi Ea Súp */
  --color-flag-red:   #9E1A1A;   /* Đỏ cờ: Điểm nhấn trang trọng (Accent Red), huy hiệu, cờ Tổ quốc */
  --color-bronze-gold:#B45309;   /* Vàng đồng: Sao vàng, huy chương, viền danh dự, cấp bậc */
  --color-cream-bg:   #FBFBEE;   /* Nền kem: Nền giấy trang trọng, dịu mắt cho cựu chiến binh cao tuổi */
  --color-deep-text:  #1A202C;   /* Chữ đậm: Độ tương phản cao theo chuẩn WCAG AAA, dễ đọc */
}
```

### Bảng tra cứu mã màu nhanh:
* **Xanh rêu (Primary Army Green):** `#244023`
* **Đỏ cờ (National Flag Red):** `#9E1A1A`
* **Vàng đồng (Badge Bronze Gold):** `#B45309`
* **Nền kem (Warm Cream Background):** `#FBFBEE`
* **Chữ đậm (High-Contrast Charcoal Text):** `#1A202C`

---

## 3. Kỷ Luật Giao Diện & UI/UX (Strict UI Directives)

1. **Tuyệt đối cấm Gradient tím AI (No AI Purple Gradients):**
   - Không sử dụng các dải màu gradient tím/hồng kiểu SaaS AI đại trà (`from-purple-500 to-indigo-500`, neon glows).
   - Mọi mảng màu phải sử dụng đúng bảng màu Hallmark Quân đội ở trên.
2. **Tiêu đề không in nghiêng (No Italic Headings):**
   - Tất cả thẻ tiêu đề (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`) và tiêu đề văn bản/thông báo phải đứng thẳng (`font-normal`, `font-semibold`, `font-bold`), thể hiện sự trang nghiêm, dứt khoát, vững chãi của quân đội. Cấm dùng `italic` trong tiêu đề.
3. **Mobile-First & Overflow Control:**
   - 100% giao diện phải thiết kế tối ưu trên di động trước (Mobile-First). Hội viên cựu chiến binh chủ yếu sử dụng điện thoại thông minh màn hình từ vừa đến lớn.
   - Luôn đặt `overflow-x: clip` (hoặc `overflow-x: hidden`) trên container gốc/layout để triệt tiêu hoàn toàn lỗi scroll ngang (horizontal scrolling bug).
4. **Cỡ chữ & Khả năng tiếp cận (Accessibility for Veterans):**
   - Cỡ chữ tối thiểu cho nội dung đọc là `16px` (`text-base`).
   - Khoảng cách phím bấm (tap target) tối thiểu 44x44px, độ tương phản chữ và nền luôn đạt tối thiểu WCAG AA (ưu tiên AAA).

---

## 4. Cấu Trúc Dự Án (Project Structure)

```text
11.E-CCB/
├── .env.example              # Mẫu biến môi trường chuẩn bảo mật Bitwarden
├── .gitignore                # Chặn rò rỉ credential, node_modules, sql dump
├── .dockerignore             # Tối ưu build context Docker
├── docker-compose.yml        # Định nghĩa 4 service (app, db, nginx, dozzle)
├── Dockerfile                # Multi-stage Docker build cho Next.js standalone
├── AGENTS.md                 # Mỏ neo ngữ cảnh & quy tắc phát triển
├── nginx/
│   └── default.conf          # Cấu hình reverse proxy domain ccb.easupso.com -> app:3000
├── prisma/
│   └── schema.prisma         # Định nghĩa PostgreSQL schema (Prisma ORM)
├── public/                   # Static assets, logo Cựu Chiến Binh Ea Súp
└── src/
    └── app/
        ├── favicon.ico
        ├── globals.css       # Biến màu Hallmark, overflow-x clip, font tokens
        ├── layout.tsx        # Root layout chuẩn hóa viewport & metadata
        └── page.tsx          # Trang chủ E-CCB Ea Súp
```

---

## 5. Bảng Task Tracker Tiến Độ Dự Án (Project Progress Tracker)

| STT | Hạng mục công việc | Mô tả kỹ thuật | Trạng thái |
| :---: | :--- | :--- | :---: |
| **01** | **Khởi tạo mỏ neo ngữ cảnh** | Tạo `AGENTS.md`, quy định tech stack, bảng màu Hallmark, kỷ luật UI | ✅ **Đã hoàn thành** |
| **02** | **Cấu hình bảo mật môi trường** | Tạo `.env.example` chuẩn Bitwarden, `.gitignore`, `.dockerignore` | ✅ **Đã hoàn thành** |
| **03** | **Kiến trúc hạ tầng Docker** | Viết `docker-compose.yml` (app, db cô lập nội bộ, nginx, dozzle) | ✅ **Đã hoàn thành** |
| **04** | **Cấu hình Reverse Proxy Nginx** | Cấu hình `nginx/default.conf` forward về `app:3000`, tối ưu cache & header | ✅ **Đã hoàn thành** |
| **05** | **Khởi tạo Next.js 15 & Tailwind** | Thiết lập App Router, TypeScript, cấu hình Tailwind CSS chuẩn quân đội | ✅ **Đã hoàn thành** |
| **06** | **Thiết lập Prisma ORM & Schema** | Cài đặt Prisma 6, hoàn thiện schema 3NF & Seed Data: 20 thôn buôn, 612 hội viên (Phiếu Mẫu 02), Quỹ 1,3 tỷ, 20 Tổ TK&VV 52,18 tỷ | ✅ **Đã hoàn thành** |
| **07** | **Xây dựng Giao diện Trang chủ** | Áp dụng bảng màu Hallmark, thiết kế cổng thông tin E-CCB Ea Súp | ✅ **Đã hoàn thành** |
| **08** | **Xác thực, Phân quyền & Desktop Admin** | Bento Grid Dashboard, Quản lý 612 hội viên (35 trường), Xuất Word (.docx) Mẫu 02 chuẩn NĐ 30, Form login Bitwarden | ✅ **Đã hoàn thành** |
| **09** | **Quản lý 4 Nghiệp vụ Biến động** | Schema MemberMovement, API upload file PDF `/api/branch/movements`, Trang Quản lý nghiệp vụ `/branch/operations`, Thẻ card thứ 5 tại PWA | ✅ **Đã hoàn thành** |
| **10** | **Hệ thống Tài khoản & Bảo mật Tuyệt đối** | Đọc mật khẩu từ `.env` (02 Super Admin `lehanhkt01@gmail.com`, `trunghieuktkt@gmail.com`, 612 Hội viên CCCD 12 số), Cổng hội viên `/member` (Tự đổi mật khẩu, xem hồ sơ CCCD cá nhân, Thu quỹ hội & hội phí, Bài giảng & tư liệu, Điểm danh) | ✅ **Đã hoàn thành** |
| **11** | **Tối ưu Giao diện Tin Bài & Phân quyền RBAC+ABAC** | Tinh giản card tin tức (bỏ 'Đọc tiếp' & nút Zalo, bọc Link vào ảnh & tiêu đề), sửa lỗi tràn Dropdown Thông báo trên di động (Backdrop, fixed inset-x-4, max-h), Prisma Schema Model Article & Enum ArticleStatus, Phân quyền tạo bài viết (Hội viên/CHT gửi chờ duyệt `PENDING_APPROVAL`, Cán bộ xã toàn quyền Duyệt/Sửa/Xuất bản `APPROVED`) | ✅ **Đã hoàn thành** |
| **12** | **Nâng cấp Toàn diện Modal Bản tin & Gallery** | Role-aware header & actions (Cán bộ xã / Chi hội trưởng / Hội viên), Danh mục động "Chuyên mục khác...", Tải tối đa 5 ảnh (<= 5MB/ảnh) dạng Dropzone, Thumbnail gallery & nút Chọn ảnh đại diện, Toolbar định dạng văn bản báo chí, Hiển thị Album ảnh tư liệu trong trang chi tiết `/tin-tuc/[id]` | ✅ **Đã hoàn thành** |
| **13** | **Chuẩn hóa Dữ liệu 20 Chi hội trưởng Thực tế** | Xóa toàn bộ tài khoản CHT tự sinh cũ; Cấu hình đăng nhập bằng CCCD/SĐT; Hash mật khẩu mặc định theo SĐT; Đồng bộ chính xác 20 CHT thực tế xã Ea Súp vào DB (`prisma/seed-cht.ts`) và toàn bộ giao diện | ✅ **Đã hoàn thành** |
| **14** | **Triển khai VPS & SSL HTTPS** | Docker compose up trên VPS Maydell, cấp chứng chỉ SSL Let's Encrypt | ⏳ *Giai đoạn kế tiếp* |
