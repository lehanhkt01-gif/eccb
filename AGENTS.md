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



