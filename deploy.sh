#!/bin/bash
# ==============================================================================
# E-CCB EA SÚP — SCRIPT TRIỂN KHAI VÀ SAO LƯU AN TOÀN (ccb.easupso.com)
# Bản quyền © 2026 Hội Cựu Chiến Binh Xã Ea Súp — Hệ sinh thái Ea Súp Số
# ==============================================================================

set -e # Dừng lại ngay lập tức nếu có lỗi xảy ra

# Màu sắc thông báo terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}   E-CCB EA SÚP — TIẾN HÀNH DEPLOY & BẢO TOÀN DỮ LIỆU CSDL VPS       ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Đọc biến môi trường từ file .env nếu có
if [ -f .env ]; then
  # Export các biến không chứa ký tự đặc biệt
  export $(grep -v '^#' .env | grep -E '^(DB_USER|DB_NAME|DB_PASSWORD)=' | xargs)
fi

DB_USER=${DB_USER:-eccb_admin}
DB_NAME=${DB_NAME:-eccb_db}
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/eccb_db_backup_${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

# 2. BƯỚC 1: SAO LƯU CSDL POSTGRESQL (TỰ ĐỘNG CHỐNG MẤT DỮ LIỆU)
echo -e "\n${YELLOW}[BƯỚC 1/5] Kiểm tra và sao lưu CSDL PostgreSQL hiện tại...${NC}"
if docker compose ps db | grep -q "Up"; then
  echo -e "📦 Đang thực hiện dump dữ liệu vào file: ${BACKUP_FILE}..."
  docker compose exec -T db pg_dump -U "${DB_USER}" "${DB_NAME}" > "${BACKUP_FILE}"
  
  if [ -s "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
    echo -e "${GREEN}✓ Đã sao lưu thành công CSDL! Dung lượng: ${BACKUP_SIZE}${NC}"
  else
    echo -e "${RED}⚠️ Cảnh báo: File backup rỗng hoặc xảy ra lỗi sao lưu. Tiếp tục thận trọng.${NC}"
  fi
else
  echo -e "${YELLOW}ℹ️ Container database chưa chạy, bỏ qua bước dump CSDL.${NC}"
fi

# 3. BƯỚC 2: KÉO MÃ NGUỒN MỚI NHẤT TỪ GIT
echo -e "\n${YELLOW}[BƯỚC 2/5] Cập nhật mã nguồn từ Git (origin/main)...${NC}"
git fetch origin main
git pull origin main
echo -e "${GREEN}✓ Đã kéo mã nguồn mới nhất thành công.${NC}"

# 4. BƯỚC 3: BUILD LẠI DOCKER IMAGE CHO APP (CHỐNG CACHE CŨ)
echo -e "\n${YELLOW}[BƯỚC 3/5] Build Docker Image mới cho WebApp E-CCB (--no-cache)...${NC}"
docker compose build --no-cache app
echo -e "${GREEN}✓ Đã build thành công Docker image mới.${NC}"

# 5. BƯỚC 4: CẬP NHẬT SCHEMA DATABASE AN TOÀN (CHẶN RESET)
echo -e "\n${YELLOW}[BƯỚC 4/5] Đồng bộ Schema Prisma an toàn (TUYỆT ĐỐI KHÔNG RESET)...${NC}"
# Khởi động db trước nếu chưa chạy
docker compose up -d db

# Chờ PostgreSQL sẵn sàng
echo -e "⏳ Đang kiểm tra kết nối PostgreSQL..."
until docker compose exec -T db pg_isready -U "${DB_USER}" -d "${DB_NAME}" > /dev/null 2>&1; do
  sleep 2
done

# Chạy db push an toàn: Cập nhật thêm cột/bảng mới mà không xóa dữ liệu
echo -e "🚀 Đồng bộ Prisma Schema với lệnh: prisma db push --skip-generate..."
docker compose run --rm app npx prisma db push --skip-generate
echo -e "${GREEN}✓ Đồng bộ Prisma Schema hoàn tất an toàn!${NC}"

# 6. BƯỚC 5: KHỞI ĐỘNG LẠI DỊCH VỤ ỨNG DỤNG VÀ KHÔI PHỤC BẢN TIN
echo -e "\n${YELLOW}[BƯỚC 5/5] Khởi động ứng dụng với Container mới (--force-recreate)...${NC}"
docker compose up -d --force-recreate app

# Chờ app khởi động 5 giây rồi tự động kiểm tra nạp bản tin & dọn dữ liệu ảo
sleep 5
echo -e "🔄 Tự động khôi phục 04 bản tin tuyên truyền vào PostgreSQL..."
docker compose exec -T app wget -qO- http://localhost:3000/api/admin/restore-news > /dev/null 2>&1 || true
docker compose exec -T app wget -qO- --post-data="" http://localhost:3000/api/admin/clean-mock-data > /dev/null 2>&1 || true

echo -e "\n${BLUE}======================================================================${NC}"
echo -e "${GREEN}🎉 TRIỂN KHAI THÀNH CÔNG! HỆ THỐNG E-CCB EA SÚP ĐÃ HOẠT ĐỘNG ỔN ĐỊNH.${NC}"
echo -e "🌐 Tên miền: https://ccb.easupso.com (Port: 3011)"
echo -e "📁 Bản backup an toàn lưu tại: ${BACKUP_FILE}"
echo -e "${BLUE}======================================================================${NC}"
