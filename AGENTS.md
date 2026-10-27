# AGENTS.md — HƯỚNG DẪN KIẾN TRÚC & QUY TẮC PHÁT TRIỂN E-CCB EA SÚP

> **Dự án:** WebApp "E-CCB Ea Súp" (`ccb.easupso.com`)  
> **Tổ chức:** Hội Cựu Chiến Binh Xã Ea Súp — Trực thuộc Hệ sinh thái **Ea Súp Số**  
> **Phiên bản:** 1.0.0 (Giai đoạn Khởi tạo & Định hình Kiến trúc)  
> **Vai trò Agent:** Kỹ sư trưởng Fullstack (Lead Fullstack Architect & Engineer)

---

## 0. Môi Trường Triển Khai & Vị Trí Lưu Trữ Cố Định (Fixed Environments)

* **Máy tính phát triển (Local Path):** `D:\1. VPS Maydell\4. Antigravity\11.E-CCB`
* **Kho lưu trữ GitHub (Repository):** [https://github.com/lehanhkt01-gif/eccb.git](https://github.com/lehanhkt01-gif/eccb.git) (Nhánh chính: `main`)
* **Thư mục trên máy chủ VPS Maydell:** `/var/www/ECCB`
* **Tên miền chính thức (Production Domain):** `https://ccb.easupso.com`
* **Cổng dịch vụ Host (Docker Port):** `3011:3000` (Forward qua Nginx Proxy Manager)

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
| **14** | **Đồng bộ Header, Chuông Thông Báo & Sửa 35 Trường** | Chuẩn hóa Header (bỏ 'Đ/c', badge pill role CB/CHT/HV), Chuông thông báo đồng bộ Desktop & Mobile bao quát tin bài chờ duyệt, Quản lý hội viên (tiêu đề gọn, nút Sửa 35 trường cho CB, liên kết 20 CHT vào DS hội viên theo thôn) | ✅ **Đã hoàn thành** |
| **15** | **Đồng bộ 20 Thôn Buôn Toàn Hệ Thống & Dọn CSDL** | Tạo Single Source of Truth `EA_SUP_HAMLETS`, xóa bỏ vòng lặp Thôn 14-17 ảo tại `/admin/permissions`, chuẩn hóa logic lọc chính xác, bổ sung script dọn dẹp bảng Hamlet Prisma (`prisma/cleanup-hamlets.ts` & API `/api/admin/cleanup-hamlets`) | ✅ **Đã hoàn thành** |
| **17** | **Sắp xếp Nút Đăng nhập & Dọn dẹp Hội viên Ảo** | Sắp xếp nút Đăng nhập theo thứ tự Hội viên (mặc định) -> Chi hội -> Cán bộ xã (cả Form Login & Dropdown Header); Xóa vĩnh viễn hội viên ảo (Đặng Hữu Phúc), deduplicate chống trùng lặp (Hồ Sỹ Tuấn); Sửa logic bộ lọc thôn buôn AND chặt chẽ; Bổ sung script `prisma/cleanup-and-sync.ts` & API `/api/admin/cleanup-and-sync` | ✅ **Đã hoàn thành** |
| **18** | **Khóa Chặt CSDL & Chống Mất Dữ Liệu VPS** | Vô hiệu hóa reset CSDL và seed tự động; Thêm Idempotent guard vào `prisma/seed.ts`; Gắn Named Volumes cố định `eccb_postgres_data` và `eccb_uploads_data`; Chuyển 100% lưu trữ bản tin sang PostgreSQL Prisma ORM; Tạo script `deploy.sh` tự động dump backup trước khi update | ✅ **Đã hoàn thành** |
| **19** | **Dọn Dẹp Chọn Lọc Dữ Liệu Test Ảo** | Tạo `scripts/clean-mock-data.ts` và API `/api/admin/clean-mock-data`; Bảo tồn 100% bản tin Article và 20 Chi hội trưởng thật; Xóa sạch hội viên/User ảo và thông báo test cũ (chuông thông báo sạch) | ✅ **Đã hoàn thành** |
| **20** | **Gỡ Gợi Ý Mật Khẩu & Quy Trình Duyệt 2 Cấp** | Gỡ bỏ 100% badge/text mật khẩu mặc định trên Login, Permissions, Modal; Cập nhật Enum MemberStatus (`CHO_CHI_HOI_DUYET`, `CHO_XA_PHE_DUYET`, `CHINH_THUC`, `TU_CHOI`); Phân tách 2 cấp duyệt rõ ràng; Xóa sạch hồ sơ ảo | ✅ **Đã hoàn thành** |
| **21** | **Bảo vệ Bản tin, Triệt tiêu 2 Hội viên Ảo & Nút Chỉ định CHT** | Khóa chặt 4 bản tin tuyên truyền mẫu trong PostgreSQL bằng Upsert & Fallback; Triệt tiêu 100% 2 tài khoản hội viên ảo (tổng số tài khoản hội viên chuẩn xác 20:20); Gỡ bỏ nhãn 'Mới duyệt' trên 20 chi hội trưởng; Nút '⭐ Chỉ định CHT' phân quyền theo thôn buôn; Nâng cấp `deploy.sh` build `--no-cache` và `--force-recreate` | ✅ **Đã hoàn thành** |
| **22** | **Nhập Hội Viên Đồng Loạt Từ File Excel/CSV & Chuẩn Hóa Mẫu 02** | Nút `📥 Nhập File Hội Viên` tại header `/admin/members`; Xuất file Excel mẫu chuẩn (.xlsx) 27 cột theo Mẫu 02 thực tế (kèm 4 dòng tiêu đề hành chính); Sửa triệt để lỗi revoke Blob gây hỏng định dạng file tải về bằng `XLSX.writeFile`; Cơ chế quét tự động tìm dòng tiêu đề thực tế (Dynamic Header Scanner 0-20 dòng); Phân tích chuẩn xác 100% hồ sơ từ các file thực tế (như file 38 hội viên Thôn Đoàn Kết); Bảng xem trước dữ liệu (Preview), xử lý trùng lặp (Bỏ qua / Ghi đè); API backend `/api/admin/members/import` đồng bộ tức thì vào PostgreSQL và MemberStore | ✅ **Đã hoàn thành** |
| **23** | **Xóa Sạch 100% Dữ Liệu Ảo Tự Sinh** | Xóa sạch 4 bản tin ảo (`tin-01` đến `tin-04`), bỏ cơ chế fallback tự inject tin mẫu; Xóa sạch số liệu ngân hàng chính sách ảo (52,18 tỷ, nợ quá hạn 31,3 tr) và quỹ nội bộ ảo (1,3 tỷ, 5 giao dịch mock TX-2026); Đưa toàn bộ thống kê Bento Grid và Sổ quỹ sang tính toán động từ hồ sơ thực tế; Tạo `prisma/clean-all-mocks.sql` và API `/api/admin/clean-mock-data` | ✅ **Đã hoàn thành** |
| **25** | **Khóa Chặt Bảo Toàn Dữ Liệu Vĩnh Viễn (Zero Data Loss)** | Chuyển đổi 100% sang CSDL PostgreSQL làm Single Source of Truth; Tạo API CRUD `/api/admin/members` kết nối trực tiếp database; Nâng cấp `admin/members/page.tsx` đồng bộ trực tiếp database máy chủ; Xóa bỏ bộ lọc lọc mất hội viên trong `memberStore.ts`; Loại bỏ vĩnh viễn các lệnh xóa CSDL tự động trong `deploy.sh`; Tạo script sao lưu khôi phục nhanh `restore.sh` | ✅ **Đã hoàn thành** |
| **27** | **Chuẩn Hóa Header 2 Tầng & Thanh Công Cụ Tác Nghiệp Trải Dài** | Áp dụng kiến trúc Header 2 tầng (Tầng 1 tiêu đề dàn trải không ngắt dòng, Tầng 2 thanh công vụ mỏng) trên toàn bộ Admin Layout, Chi Hội `/branch`, Nghiệp vụ `/branch/operations`; Tái cấu trúc thanh công cụ quản lý hội viên `/admin/members` dàn trải 1 hàng ngang (cuộn ngang mượt mà, không bẻ vụn nhiều tầng nút) | ✅ **Đã hoàn thành** |
| **28** | **Đồng Bộ Phiên Lê Hạnh, Xóa Dư Nợ Ảo & Badge Vàng, Thêm Cột STT** | Khắc phục lỗi hiển thị tên Đặng Trung Hiếu khi đăng nhập Lê Hạnh (đồng bộ user mount); Xóa 3 badge vàng ảo ('53,48 Tỷ', 'Phân Quyền', 'Mobile') trên Sidebar Admin; Xóa sạch dư nợ ảo về '0 đ' trên Bento Grid, memberStore và CSDL; Bổ sung cột STT (1..N) vào bảng Cấp quyền `/admin/permissions` | ✅ **Đã hoàn thành** |
| **29** | **Chuẩn Hóa Bảng Danh Sách Hội Viên (Tinh Gọn 1 Dòng)** | Thêm cột Thứ tự (STT); Tinh gọn chỉ giữ 6 cột: Thứ tự, Họ tên (sao vàng ⭐ CHT), Năm sinh, Chức vụ, Thôn/buôn, Thao tác; Giữ 3 nút tác nghiệp gọn gàng: Chi tiết, Sửa, Word dàn trải 1 dòng không bẻ gãy | ✅ **Đã hoàn thành** |
| **30** | **Khóa Giữ Sticky Sidebar 'Chức Năng Điều Hành'** | Nâng cấp Header lên z-index 50 (luôn trên cùng); Cấu hình Sidebar cố định `lg:sticky top-[96px]` khi lăn chuột cuộn danh sách hội viên; Định vị mép dưới header, triệt tiêu 100% lỗi che lấp logo và tiêu đề phía trên | ✅ **Đã hoàn thành** |
| **32** | **Sắp Xếp Hội Viên Chi Hội & Cấp Quyền CHT Trực Quan (Ảnh 1 & Ảnh 2)** | Thêm số thứ tự (STT: ⭐ cho CHT, 1..N cho hội viên); Chi hội trưởng luôn xếp lên đầu danh sách; Họ tên và năm sinh nằm trên 1 hàng không bị ngắt chữ; Cụm nút tác nghiệp bên phải tinh gọn không bóp méo nội dung; Cấp quyền 'Chi hội trưởng' sổ list lựa chọn theo từng chi hội, chỉ chọn hội viên chính thức để phân quyền, hiển thị thẻ thông tin tự động, không cần nhập thủ công phức tạp | ✅ **Đã hoàn thành** |
| **33** | **Cấp Quyền Nhiều CHT Cho 1 Chi Hội & Đồng Bộ Hai Chiều Toàn Hệ Thống** | Sửa triệt để lỗi không cập nhật thêm CHT: Trang `/admin/permissions` tự động nạp 100% hội viên từ CSDL PostgreSQL (`/api/admin/members`); Cho phép 1 chi hội có nhiều CHT (không hạ bệ CHT cũ); Hỗ trợ cả 2 chế độ (Chọn từ danh sách thôn & Nhập trực tiếp CHT mới); Nâng cấp API `/api/admin/assign-branch-leader` tạo/cập nhật User `BRANCH_LEADER` và bảng Hamlet; Thêm nút `⭐ CHT` trên bảng hội viên và Modal Chi tiết `/admin/members`; Đồng bộ tức thì toàn diện hai chiều DB và PWA Chi hội | ✅ **Đã hoàn thành** |
| **34** | **Triển khai VPS & SSL HTTPS** | Docker compose up trên VPS Maydell tại thư mục `/var/www/ECCB`, cấu hình Nginx Proxy Manager domain `ccb.easupso.com` (Port 3011) | ⏳ *Giai đoạn kế tiếp* |
| **35** | **Khắc Phục Lỗi Cấp Tài Khoản Mới & Bảo Toàn CSDL Vĩnh Viễn** | Tạo API CRUD `/api/admin/users` kết nối trực tiếp PostgreSQL Prisma; Cập nhật logic tạo tài khoản (Cán bộ xã, Chi hội trưởng, Hội viên) lưu vĩnh viễn vào DB; Nâng cấp `/api/auth/login` đăng nhập tức thì cho tài khoản mới qua Email/CCCD; Tự động đồng bộ và bảo tồn tài khoản khi người dùng xóa cache hoặc đổi trình duyệt | ✅ **Đã hoàn thành** |
| **36** | **Nút Xóa Hồ Sơ Hội Viên Cho Cán Bộ Xã Trong Modal 35 Trường** | Thêm nút '🗑️ Xóa Hồ Sơ' (màu đỏ cờ Hallmark) cạnh nút 'Lưu Thay Đổi Hồ Sơ'; Cơ chế xác nhận bảo mật nghiêm ngặt (`confirm`); Kết nối trực tiếp API máy chủ `DELETE /api/admin/members` gỡ bỏ sạch hồ sơ (cascade User, Attendance, Funds, Movements, CHT Hamlet) và đồng bộ tức thì toàn hệ thống | ✅ **Đã hoàn thành** |
| **37** | **Thùng Rác Hồ Sơ Hội Viên (Soft Delete, Xem & Khôi Phục Dành Cho Cán Bộ Xã)** | Thêm cờ `isDeleted`, `deletedAt`, `deletedReason` vào Prisma & PostgreSQL; Bấm xóa sẽ chuyển an toàn vào Thùng rác; Tab '🗑️ Thùng Rác' trên `/admin/members` hiển thị danh sách hồ sơ đã xóa, bộ lọc thôn buôn/tìm kiếm; Nút '♻️ Khôi Phục' từng người và 'Khôi Phục Tất Cả' đưa về danh sách chính thức; Nút 'Xóa Hẳn' và 'Dọn Sạch Thùng Rác'; API `/api/admin/members/trash` đồng bộ 2 chiều | ✅ **Đã hoàn thành** |
| **38** | **Khắc Phục Toàn Diện Lỗi Xóa, Khóa & Chỉ Định CHT Tại Quản Lý Cấp Quyền** | Nút 'Xóa': Unassign chức danh CHT trong `memberStore`, đưa vào blacklist `deletedLeaders`, cascade xóa User và gỡ đại diện thôn trong PostgreSQL (triệt tiêu triệt để việc CHT tự động hồi sinh); Nút 'Khóa/Mở': Lưu `statusMap` và cập nhật API máy chủ, không còn bị reset về Active; 'Chỉ định CHT': Gỡ khỏi blacklist, đồng bộ 2 chiều tức thì, nạp `serverBranches` vào danh sách CHT | ✅ **Đã hoàn thành** |
| **39** | **Gỡ Bỏ Triệt Để Dữ Liệu Ảo Hồ Sơ Biến Động Hội Viên** | Xóa sạch mảng mock `INITIAL_OPERATIONS_DATA` (Đặng Văn Hảo, Nguyễn Văn Hùng, Lương Thế Vinh, Ngô Quang Hưng) tại `/branch/operations`; Tự động dọn dẹp và lưu lại danh sách movements trong `memberStore`; Thêm hàm `deleteStoredMovement` và nút 🗑️ xóa hồ sơ biến động trên từng card; Đồng bộ script `scripts/clean-mock-data.ts` và API `/api/admin/clean-mock-data` xóa sạch các biến động ảo trong PostgreSQL | ✅ **Đã hoàn thành** |
| **40** | **Quản Lý Bài Giảng, Phim Tư Liệu & Tải File Văn Bản Tuyên Truyền** | Cán bộ xã toàn quyền Thêm, Sửa, Xóa bài giảng, link video YouTube và tải file văn bản tuyên truyền (.pdf, .doc, .docx, .xls, .pptx <= 25MB); Trang quản trị chuyên biệt `/admin/lectures`; API CRUD `/api/admin/lectures` và API upload `/api/admin/lectures/upload`; Đồng bộ 2 chiều tức thì với PWA Chi hội trưởng (`/branch` tab media) và Cổng hội viên (`/member` tab lectures) | ✅ **Đã hoàn thành** |
| **41** | **Đồng Bộ Toàn Diện Logo Mới (logovip.png)** | Chuyển đổi 100% các vị trí hiển thị logo sang `/images/logovip.png` (Header chính, Admin Layout, PWA Chi hội `/branch`, Cổng hội viên `/member`, Trang Đăng nhập `/login`, Modal Đăng nhập Hội viên CCCD, Đăng ký Hội viên mới `/register-member`, Root Layout Metadata Icons, PWA Manifest `manifest.ts` & `site.webmanifest`); Cấu hình script `deploy.sh` tự động bảo vệ nguyên vẹn file `logovip.png` do người dùng tải lên VPS tránh xung đột git merge | ✅ **Đã hoàn thành** |
| **42** | **Ảnh Nền Hero Banner Đại Hội CCB Xã Ea Súp** | Cắt cúp & xử lý đồ họa ảnh thực tế Đại hội Đại biểu Hội CCB Xã Ea Súp làm nền Hero Banner trang chủ; Áp dụng dải chuyển mềm (Soft-blend) vào nền kem `#FBFBEE` bên trái giúp chữ tiêu đề than đậm đạt chuẩn WCAG AAA; Căn bố cục ảnh bên phải trang trọng, ấm áp, kiên trung; Bổ sung chú thích ảnh chính thức | ✅ **Đã hoàn thành** |
| **43** | **Chuẩn Hóa Font Chữ Nghiêng Cho Khẩu Hiệu Truyền Thống** | Khắc phục triệt để lỗi tách dấu tiếng Việt (`kế ' t`) do font Georgia mặc định; Chuyển sang phông chữ chuẩn Times New Roman / Noto Serif chuẩn Nghị định 30/2020/NĐ-CP; Giữ trọn định dạng nghiêng (`italic`), nét chữ liền mạch, sắc sảo, trang nghiêm trên toàn bộ Header Cổng thông tin và Admin Layout | ✅ **Đã hoàn thành** |
| **44** | **Nâng Cấp Nút Chia Sẻ Bản Tin Đa Nền Tảng (NewsShareBar)** | Thiết lập cụm nút chia sẻ đa kênh: Zalo trực tiếp, Facebook, Web Share API (kết nối trực tiếp khay chia sẻ hệ điều hành điện thoại để gửi Zalo nhóm chi hội, Messenger, SMS, Gmail, Telegram, Viber...), Nút Sao chép liên kết có toast thông báo; Đồng bộ trên Modal Trang chủ và Trang chi tiết bài viết | ✅ **Đã hoàn thành** |
| **45** | **Đồng Bộ Số Liệu Thời Kỳ Chiến Đấu & Xuất Báo Cáo Excel Tùy Chọn Trường Dấu Tích** | Chuẩn hóa phân loại 100% thời kỳ chiến đấu (Chống Mỹ, Biên giới phía Bắc, Biên giới Tây Nam, Quốc tế Campuchia/Lào, Cựu quân nhân) và Người có công (Thương binh, Bệnh binh, Da cam); Khắc phục triệt để lỗi so khớp chữ hoa/thường gây lệch số liệu 0 đ/c; Tạo `ExportReportModal` cho phép người dùng tùy chọn kết xuất báo cáo Excel (.xlsx) với các trường thông tin có dấu tích, hỗ trợ bộ lọc Chi hội, Thời kỳ, Chính sách, Đảng viên; Xuất file Excel chuẩn Nghị định 30 có tiêu đề và chữ ký | ✅ **Đã hoàn thành** |
| **46** | **Gỡ Bỏ Toàn Bộ Ghi Chú, Gợi Ý Tài Khoản & Nhãn Bảo Mật Trên Các Giao Diện Đăng Nhập** | Gỡ bỏ 100% gợi ý email admin (`* Dành cho Ban Thường trực: lehanhkt01@gmail.com...`), chi hội và CCCD; Gỡ bỏ các nhãn `Bitwarden Autofill`, `Quy chuẩn .env`, `Bảo mật Bitwarden`; Gỡ bỏ khối chú thích màu vàng `🔐 Hệ thống tuân thủ quy chuẩn bảo mật tuyệt đối...`; Chuẩn hóa placeholder trung tính chuyên nghiệp; Tinh gọn phụ đề dropdown đăng nhập trên Header | ✅ **Đã hoàn thành** |
| **47** | **Nút Mắt Nhìn (Hiện/Ẩn Mật Khẩu) Trong Ô Đăng Nhập Hội Viên & Chi Hội Trưởng** | Tích hợp nút icon con mắt (Toggle Show/Hide password) trực tiếp trong ô nhập Mật khẩu trên toàn bộ các giao diện: Trang đăng nhập chính `/login` (Hội viên, Chi hội, Cán bộ), Modal đăng nhập Hội viên CCCD tại Trang chủ `/`, và Modal đăng nhập tại Trang tin tức `/tin-tuc`; Sử dụng SVG con mắt sắc nét, hỗ trợ cựu chiến binh lớn tuổi dễ dàng kiểm tra chính xác mật khẩu khi gõ phím | ✅ **Đã hoàn thành** |
| **48** | **Khắc Phục Lỗi Đăng Nhập Chi Hội Trưởng & Kiểm Soát Phân Quyền Đăng Nhập Trang Chi Hội** | Sửa triệt để lỗi đăng nhập CHT bị chuyển sang trang Hội viên: Cập nhật chính xác CCCD của đ/c Nguyễn Đức Lợi (`049068000834`), Y Nô Rcăm (`0372989270`), Đoàn Hữu Tiến (`0935833737`); Truyền `requestedRole` vào API `/api/auth/login`; Kiểm tra quyền hạn chặt chẽ (RBAC) trên cả Backend và Frontend: Chỉ tài khoản trong danh sách Chi hội trưởng hoặc có chức danh CHT/SuperAdmin mới được phép đăng nhập vào tab Chi Hội và vào trang `/branch`; Người chưa được cấp quyền Chi hội trưởng đăng nhập vào tab Chi Hội sẽ bị chặn và nhận thông báo chính xác: *"Bạn chưa được cấp quyền chi hội trưởng"*; Bổ sung Auth Guard bảo vệ `/branch` và `/branch/operations` | ✅ **Đã hoàn thành** |
| **49** | **Khắc Phục Lỗi Mặc Định CHT & Cho Phép Cấp Quyền Nhiều CHT / Chi Hội Phó (>20)** | Triệt tiêu hoàn toàn lỗi chọn hội viên bị trả về CHT cũ (gỡ bỏ rogue useEffect); Phân loại hội viên trong modal thành 2 nhóm optgroup rõ ràng (Chưa giữ chức vụ VS Đang giữ chức vụ); Bổ sung bộ chọn chức danh cấp quyền linh hoạt: '⭐ Chi hội trưởng' hoặc '🎖️ Phó Chi hội trưởng (Chi hội phó)'; Cho phép 1 chi hội có nhiều người được cấp quyền điều hành (tổng số tài khoản CHT & Phó CHT có thể vượt mốc 20); Cập nhật đồng bộ API backend, PostgreSQL, Store và kiểm tra quyền đăng nhập cho cả Phó CHT | ✅ **Đã hoàn thành** |
| **50** | **Tích Hợp Trình Phát Audio Đọc Bản Tin Chuẩn Easupso.com** | Tạo component `NewsAudioPlayer` và API `/api/news/tts`; Tích hợp Microsoft Edge Neural TTS giọng Nữ Hoài My truyền cảm & Nam Minh; Duy trì đọc khi tắt màn hình; Tự động đọc lần lượt | ✅ **Đã hoàn thành** |
| **51** | **Khắc Phục Triệt Để Lỗi Đếm Lượt Xem Bị Kẹt Ở Số 1** | Nâng cấp `incrementArticleViews` hỗ trợ cả ID & Slug; Tạo API POST `/api/news/view`; Xây dựng component `ArticleViewCounter.tsx` cập nhật thời gian thực; Xóa bỏ toàn bộ số liệu fallback ảo | ✅ **Đã hoàn thành** |
| **52** | **Tinh Gọn Thông Tin Đầu Bài Viết (Ngày Đăng, Tác Giả & Lượt Xem)** | Rút gọn dòng ngày đăng chỉ còn ngày `📅 18/10/2026` (bỏ chữ "Ngày đăng"); Rút gọn tên tác giả mặc định thành "Thường trực Hội" (thay cho "Thường trực Hội CCB xã Ea Súp"); Rút gọn số lượt xem chỉ gồm biểu tượng ánh mắt và con số `👁️ 1` (bỏ chữ "lượt xem") trên toàn bộ hệ thống | ✅ **Đã hoàn thành** |
| **53** | **Loại Bỏ Triệt Để Lỗi Đọc Từ "Chấm" & Ký Tự Đầu Mỗi Bản Tin** | Xóa sạch 100% Emoji, bullet points (`•`, `·`, `▪`, `●`), dấu gạch ngang, dấu chấm câu ở đầu kịch bản giọng đọc TTS; Khóa chặt quy tắc kịch bản luôn bắt đầu bằng chữ cái/số tiếng Việt; Nâng cache key âm thanh lên `-v2` để tự động tái sinh toàn bộ file MP3 mới không còn tiếng "chấm"; Gắn `aria-hidden="true"` vào tất cả thẻ `<span>•</span>` phân cách trên giao diện ngăn trình đọc màn hình điện thoại đọc từ "chấm" | ✅ **Đã hoàn thành** |
| **54** | **Loại Bỏ Âm Thanh "Chấm, Chấm, Chấm...." Trong Lúc Load Đọc Bản Tin** | Gỡ bỏ hoàn toàn `role="status"` và `aria-live="polite"` tại trạng thái Loading của `NewsAudioPlayer`; Gắn `aria-hidden="true"` và đổi chữ hiển thị thành "Đang tải bản tin" (triệt tiêu dấu ba chấm `...` khiến trình đọc màn hình/hệ điều hành tự động đọc to "chấm, chấm, chấm...."); Tối ưu hóa luồng mở khóa âm thanh bằng Data URI WAV im lặng hoàn toàn, không loop; Khử 100% ký tự ellipsis `…` và chuỗi dấu chấm lặp lại trong kịch bản phát thanh | ✅ **Đã hoàn thành** |
| **55** | **Khắc Phục Toàn Diện Hệ Thống Chỉnh Sửa 35 Trường & Nút 'Lưu Thay Đổi Hồ Sơ'** | Sửa triệt để lỗi không lưu hồ sơ vào hệ thống: Nâng cấp API `PUT /api/admin/members` cập nhật trọn vẹn 35 trường thông tin vào CSDL PostgreSQL; Cơ chế `parseFlexibleDate` an toàn xử lý định dạng ngày tháng tiếng Việt (`DD/MM/YYYY`, `MM/YYYY`, `YYYY`) triệt tiêu lỗi `Invalid Date`; Tìm kiếm đa tiêu chí (ID, CCCD gốc `originalCccd`, CCCD mới, Họ tên + Thôn buôn); Tự động đồng bộ tài khoản `User` (đổi username khi đổi CCCD), đồng bộ `Hamlet` (chức danh Chi hội trưởng); Nâng cấp `updateStoredMember` tìm kiếm thông minh và upsert an toàn; Đồng bộ hai chiều tức thì giữa PostgreSQL, React State và LocalStorage | ✅ **Đã hoàn thành** |
| **56** | **Khắc Phục Triệt Để Lỗi Nút Xóa, Sửa, Lưu Hồ Sơ Báo Thành Công Nhưng Không Đổi** | Sửa tận gốc 4 nguyên nhân gây lỗi: (1) Nâng cấp API `DELETE /api/admin/members` tìm kiếm qua Smart Fallback (ID -> CCCD -> Họ tên + Thôn buôn), xóa bỏ hoàn toàn false positive; (2) Nâng cấp API `/api/admin/members/trash` (`restore` và `permanent_delete`) tìm theo cả ID và CCCD; (3) Khóa triệt để cơ chế tự hồi sinh CHT trong `getStoredMembers()` và `memberStore.ts`: thêm blacklist CCCD đã xóa `eccb_deleted_leader_cccds`, chặn re-inject leader cũ khi người dùng đã sửa CCCD hoặc đã xóa; (4) Triệt tiêu vòng lặp vô tận (infinite re-fetch loop) bằng cách gỡ `window.dispatchEvent` khỏi `saveStoredMembers()`; (5) Nâng cấp `handleDeleteMember`, `handleSaveEdit`, `handleRestoreMember`, `handlePermanentDelete` trên `admin/members/page.tsx` truyền đầy đủ ID và CCCD, cập nhật tức thì vào React State | ✅ **Đã hoàn thành** |
| **57** | **Chuẩn Hóa Header 2 Tầng, Sửa Lỗi Thiếu Ngày Sinh & Ngày Vào Hội Khi Nhập Excel & Modal Cập Nhật Đồng Loạt Theo Thôn** | Sắp xếp lại Header 2 tầng (Tầng 1 Tiêu đề rộng rãi không bị bóp nghẽn dọc, Tầng 2 Dàn nút tác nghiệp trải dài 1 hàng ngang); Nâng cấp `formatExcelDateVal` và `findDateVal` trích xuất chuẩn xác `birthDate` và `associationJoinDate` từ file Excel (hỗ trợ Serial Date, Date Object, đa dạng tên cột tiếng Việt); Hiển thị 2 cột này trên bảng xem trước Modal Nhập File; Nâng cấp API backend `/api/admin/members/import` lưu đầy đủ ngày tháng vào PostgreSQL; Xây dựng Modal chuyên dụng `BatchUpdateDatesModal` và API `/api/admin/members/batch-update-dates` cập nhật đồng loạt ngày sinh và ngày vào hội theo từng thôn buôn kèm tiện ích điền nhanh | ✅ **Đã hoàn thành** |
| **58** | **Trích Xuất Chuẩn Xác Ngày Sinh (Cột C) & Ngày Vào Hội (Cột R) Từ File Excel Theo CCCD, Họ Tên, Chi Hội** | Nâng cấp toàn diện cơ chế đọc file Excel tại `BatchUpdateDatesModal.tsx` và `MemberImportModal.tsx`: Đọc dạng mảng ma trận 2D; Trích xuất trực tiếp Ngày sinh từ **Cột C (index 2)** và Ngày vào Hội CCB từ **Cột R (index 17)**; Quét linh hoạt theo dòng tiêu đề thực tế; Chuẩn hóa hiển thị định dạng `DD/MM/YYYY` (sửa lỗi hiển thị ISO `1951-01-01`); Đối chiếu 4 cấp độ thông minh (CCCD 12 số -> Họ tên + Chi hội -> Họ tên trong Chi hội đang chọn -> Họ tên duy nhất toàn xã); Đồng bộ chuẩn 27 cột Mẫu 02 cho nút 'Xuất File Thôn'; Cơ chế `Date.UTC` 12:00:00 chống lệch múi giờ trên API `/api/admin/members/batch-update-dates`; Lưu vĩnh viễn vào CSDL PostgreSQL và LocalStore | ✅ **Đã hoàn thành** |
| **59** | **Bổ Sung Nút Sửa Lỗi Cập Nhật 5 Trường Ngày Tháng Chuẩn Mẫu 02 Theo Đúng Quy Ước** | Bổ sung nút `🛠️ 📅 Sửa Lỗi Cập Nhật Ngày Tháng` trên thanh công cụ Quản lý hội viên; Mở rộng Modal và API `/api/admin/members/batch-update-dates` cập nhật đồng thời 5 trường ngày tháng: **Ngày sinh (Cột C)**, **Ngày vào Đảng (Cột J)**, **Ngày nhập ngũ (Cột L)**, **Ngày xuất ngũ (Cột N)**, **Ngày vào Hội CCB (Cột R)**; Áp dụng triệt để 4 quy ước của người dùng: Có thông tin gì điền thông tin đó, không có để trống; Đủ ngày/tháng/năm ghi `dd/mm/yyyy`; Chỉ có tháng/năm ghi `01/mm/yyyy`; Chỉ có năm ghi `01/01/yyyy`; Tiện ích 1 chạm `🧹 Xóa 01/01/1970 Ảo` đặt về trống; Đồng bộ hai chiều tức thì PostgreSQL và MemberStore | ✅ **Đã hoàn thành** |
| **60** | **Gỡ Bỏ Nút 'Tải Lại CSDL' & Huy Hiệu 'CSDL Trực Tuyến' Trên Thanh Công Cụ** | Gỡ bỏ hoàn toàn 2 phần tử `🔄 Tải Lại CSDL` và badge `🟢 CSDL Trực Tuyến` trên thanh công cụ tác nghiệp tầng 2 tại `/admin/members`; Giúp giao diện thông thoáng, tinh gọn, các nút tác nghiệp nghiệp vụ chính (`Nhập File Hội Viên`, `Sửa Lỗi Cập Nhật Ngày Tháng`...) hiển thị trực quan và rộng rãi hơn | ✅ **Đã hoàn thành** |
| **61** | **Khắc Phục Triệt Để Lỗi Không Lưu Dữ Liệu Nghiệp Vụ Hội Khi Bấm 'Xác Nhận Lập Hồ Sơ'** | Sửa tận gốc nguyên nhân không lưu CSDL: Tạo đồng bộ cả 2 Endpoint API `/api/branch/movements` và `/api/movements`; Xử lý lỗi Khóa ngoại Hamlet và Member (tìm kiếm thông minh theo ID, CCCD, Họ tên; tự động tạo Member mới khi Chuyển đến để bảo toàn dữ liệu); Lưu trữ file PDF/Ảnh vào đĩa `/uploads/documents`; Nâng cấp `loadData` và `handleDeleteMovement` tại `/branch/operations` kết nối trực tiếp PostgreSQL máy chủ; Cập nhật trạng thái hội viên hai chiều (`DECEASED`, `TRANSFERRED`, `EXPELLED`, `CHINH_THUC`); Nâng cấp nút 'Xác nhận lập hồ sơ' có trạng thái trực quan và huy hiệu CSDL lâu dài | ✅ **Đã hoàn thành** |
| **62** | **Đồng Bộ Liên Thông Quản Lý Hội Viên & Cấp Quyền, Sắp Xếp CHT/CHP Lên Đầu & Đồng Bộ Chuẩn Xác Số Lượng** | (1) Liên thông bắt buộc: 100% Chi hội trưởng & Chi hội phó được cấp quyền tự động hiện diện trong danh sách hội viên chính thức với chức danh tương ứng; (2) Sắp xếp CHT (Rank 2) và Chi hội phó (Rank 1) lên đầu bảng hội viên `/admin/members`, hiển thị sao vàng ⭐, badge vai trò CHT/CHP và phân biệt màu sắc; (3) Khắc phục triệt để sai lệch số lượng (591 vs 590): Chuẩn hóa dùng chung `getActiveOfficialMembers` loại bỏ hồ sơ trùng lặp/thùng rác/biến động, đảm bảo số tài khoản đăng nhập CCCD khớp chính xác 100% với số hội viên thực tế quản lý; (4) Nghiệp vụ hội (Chuyển đi, Xóa tên, Báo tử) tự động giảm trừ hội viên và khóa tài khoản đăng nhập; Chuyển đến tự động cộng thêm và tạo tài khoản | ✅ **Đã hoàn thành** |
| **63** | **Khắc Phục Triệt Để Lỗi Báo Tử Nhảy Sang Phê Duyệt Kết Nạp Mới & Triệt Tiêu Lỗi Màn Hình Nhấp Nháy** | Sửa tận gốc 2 nguyên nhân cốt lõi: (1) Sửa lỗi gán ép trạng thái trong `getStoredMembers()` (`memberStore.ts`): trước đây hồ sơ `DECEASED`, `TRANSFERRED`, `EXPELLED` không khớp `CHINH_THUC` hay `TU_CHOI` nên bị rơi vào nhánh `m.branchApproved` dẫn đến bị ghi đè thành `CHO_XA_PHE_DUYET`; Đã nâng cấp ưu tiên kiểm tra cờ biến động và danh sách nghiệp vụ lên hàng đầu, bảo toàn tuyệt đối cờ `isDeceased/isTransferred/isExpelled`, loại trừ 100% khỏi các hàng chờ duyệt kết nạp `pendingAdminMembers`, `pendingBranchMembers`, `rejectedMembers` trên `/admin/members` và `/branch`; (2) Triệt tiêu 100% lỗi màn hình nhấp nháy: gỡ bỏ `animate-pulse` trên các huy hiệu tab duyệt và chuông thông báo `NotificationBell`, thêm tiện ích `.no-scrollbar` xóa bỏ thanh cuộn ngang xám giật khung hình trên Windows, bảo đảm giao diện tĩnh lặng, vững chãi, trang nghiêm | ✅ **Đã hoàn thành** |
| **64** | **Thiết Lập Lại Quy Trình Xét Duyệt: Cán Bộ Xã Nhập Nạp Thẳng Hội Viên Chính Thức, Chỉ CHT/CHP Chuyển Lên Mới Chờ Duyệt** | Thiết lập chuẩn mực quy trình kết nạp theo đúng chỉ đạo: (1) Khi cán bộ xã nhập danh sách (qua file Excel, thêm mới, sửa đổi) thì đương nhiên là hội viên chính thức (`status = CHINH_THUC`, `registrationStatus = APPROVED`, `adminApproved = true`), nạp thẳng vào danh sách hội viên chính thức, tuyệt đối loại trừ 100% khỏi danh sách 'Chờ Thường trực Xã phê duyệt'; (2) Chỉ khi nào 'Chi hội trưởng' hoặc 'Chi hội phó' tại thôn buôn nhập hồ sơ mới và bấm thẩm tra chuyển danh sách lên cấp xã (`status = CHO_XA_PHE_DUYET`, `registrationStatus = BRANCH_APPROVED`) thì hồ sơ đó mới nằm trong danh sách 'Chờ Thường trực Xã phê duyệt'; (3) Cập nhật đồng bộ API backend `/api/admin/members`, `/api/admin/members/import`, `MemberImportModal`, `DualApprovalModal`, PWA Chi hội `/branch` và cơ chế tự động chuẩn hóa CSDL PostgreSQL | ✅ **Đã hoàn thành** |
| **65** | **Đồng Bộ 100% Số Liệu Giao Diện Tổng Quan Với CSDL Hệ Thống** | Chuẩn hóa `src/app/admin/page.tsx` và `src/app/admin/funds/page.tsx` sử dụng Single Source of Truth `getActiveOfficialMembers(members)`: Số tổng hội viên toàn xã hiển thị chuẩn xác (589 đ/c, 102 Đảng viên) khớp 100% với Quản lý hội viên, Cấp quyền và Quản lý quỹ; Loại trừ hoàn toàn hội viên đã báo tử, chuyển đi, xóa tên khỏi các biểu đồ phân bố thời kỳ chiến đấu, thương bệnh binh, da cam; Đồng bộ động số dư nợ vốn vay NHCSXH và số hộ vay; Cập nhật động danh sách Chi hội trưởng cơ sở trên bản đồ 20 thôn buôn; Lắng nghe sự kiện `eccb-movements-updated` để tự động làm mới tức thì khi có biến động nghiệp vụ | ✅ **Đã hoàn thành** |
| **66** | **Khắc Phục Toàn Diện Lỗi Lệch Số Liệu Bản Đồ 20 Thôn Buôn & Chuẩn Hóa normalizeHamlet** | Sửa triệt để lỗi so khớp chuỗi lỏng lẻo (`includes`) khiến Thôn 1 bị gộp cả Thôn 10, 11, 12, 13 (lên 149 đ/c, tổng 20 thôn vọt lên 823 đ/c): Xây dựng hàm chuẩn mực `normalizeHamlet` ưu tiên tiền tố dài hơn; Khớp chính xác 1:1 từng hội viên vào đúng 1 thôn duy nhất (tổng 20 thôn khớp chuẩn 100% bằng 589 đ/c); Hiển thị chuẩn xác 20 Chi hội trưởng (Thôn 1 là Hồ Sỹ Tuấn, Thôn 10 là Nguyễn Lai, Thôn 12 là Triệu Đức Quyên, Thôn 13 là Hoàng Văn Tuyên) cùng SĐT thực tế; Tự động chọn thôn buôn khi bấm 'Xem hội viên →' sang Quản lý hội viên | ✅ **Đã hoàn thành** |
| **67** | **Tích Hợp Cụm Thống Kê 4 Chỉ Số Cốt Lõi Tại Hero Banner Trang Chủ** | Bố trí 4 thẻ card thống kê chuẩn Hallmark Quân đội ngay dưới chú thích ảnh Đại hội Hội CCB Xã Ea Súp trên Trang chủ: (1) Tổng số chi hội (20 Chi hội, chi tiết 13 thôn số, 4 thôn đặt tên, 3 buôn); (2) Tổng số hội viên chính thức; (3) Tổng số chi hội trưởng (20 CHT phủ kín 100% địa bàn); (4) Tổng số biến động (tổng hồ sơ và 4 nghiệp vụ: Chuyển đi, Chuyển đến, Xóa tên, Báo tử); Xây dựng API `/api/stats` đồng bộ thời gian thực với PostgreSQL và bộ nhớ đệm `localStorage`, tự động cập nhật khi có biến động hội viên | ✅ **Đã hoàn thành** |










