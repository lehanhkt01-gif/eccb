#!/bin/bash
# ==============================================================================
# E-CCB EA SÚP — SCRIPT KHÔI PHỤC DỮ LIỆU CSDL POSTGRESQL (ccb.easupso.com)
# Bản quyền © 2026 Hội Cựu Chiến Binh Xã Ea Súp — Hệ sinh thái Ea Súp Số
# ==============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}   E-CCB EA SÚP — CÔNG CỤ KHÔI PHỤC CSDL POSTGRESQL AN TOÀN           ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Đọc biến môi trường
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -E '^(DB_USER|DB_NAME|DB_PASSWORD)=' | xargs)
fi

DB_USER=${DB_USER:-eccb_admin}
DB_NAME=${DB_NAME:-eccb_db}
BACKUP_DIR="./backups"

if [ ! -d "${BACKUP_DIR}" ] || [ -z "$(ls -A ${BACKUP_DIR}/*.sql 2>/dev/null)" ]; then
  echo -e "${RED}❌ Không tìm thấy bất kỳ file backup nào trong thư mục ${BACKUP_DIR}!${NC}"
  exit 1
fi

# Tìm file backup mới nhất
LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/*.sql | head -n 1)

echo -e "📁 Danh sách các bản sao lưu gần nhất:"
ls -lht ${BACKUP_DIR}/*.sql | head -n 5

echo -e "\n${YELLOW}Bản sao lưu mới nhất được chọn tự động:${NC} ${LATEST_BACKUP}"
read -p "Đồng chí có muốn khôi phục CSDL từ bản này không? (y/N): " CONFIRM

if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo -e "\n⏳ Đang kiểm tra container PostgreSQL (eccb_db)..."
  docker compose up -d db
  
  until docker compose exec -T db pg_isready -U "${DB_USER}" -d "${DB_NAME}" > /dev/null 2>&1; do
    sleep 2
  done

  echo -e "📦 Đang nạp dữ liệu từ ${LATEST_BACKUP} vào CSDL ${DB_NAME}..."
  docker compose exec -T db psql -U "${DB_USER}" -d "${DB_NAME}" < "${LATEST_BACKUP}"

  echo -e "\n${GREEN}🎉 KHÔI PHỤC DỮ LIỆU THÀNH CÔNG 100%!${NC}"
  echo -e "Khởi động lại ứng dụng..."
  docker compose restart app
  echo -e "${GREEN}✓ Ứng dụng đã sẵn sàng tại https://ccb.easupso.com${NC}"
else
  echo -e "${YELLOW}Đã hủy thao tác khôi phục.${NC}"
fi
