-- ==============================================================================
-- CLEAN ALL MOCK DATA SCRIPT - E-CCB EA SÚP
-- Mục đích: Dọn dẹp sạch sẽ 100% dữ liệu ảo tự sinh từ trước đây:
--   1. Xóa 4 bản tin ảo mẫu (tin-01 đến tin-04)
--   2. Xóa toàn bộ dữ liệu quỹ nội bộ ảo (internal_funds, fund_contributions, fund_loans)
--   3. Xóa toàn bộ dữ liệu tổ vay vốn ảo và dư nợ ảo (loan_groups, members.totalDebt)
--   4. Bảo toàn tuyệt đối 20 Chi hội trưởng thật, 20 thôn buôn và 2 Super Admin
-- ==============================================================================

-- 1. Xóa các bản tin ảo tự sinh
DELETE FROM "articles" WHERE "id" IN ('tin-01', 'tin-02', 'tin-03', 'tin-04');

-- 2. Xóa các giao dịch và dữ liệu quỹ nội bộ ảo
DELETE FROM "fund_loans";
DELETE FROM "fund_contributions";
DELETE FROM "internal_funds";

-- 3. Xóa các tổ vay vốn NHCSXH ảo và reset dư nợ ảo về 0
UPDATE "members" SET "totalDebt" = 0, "loanGroupId" = NULL;
DELETE FROM "loan_groups";

-- 4. Xác nhận số lượng bản ghi còn lại
SELECT 'Articles' as table_name, COUNT(*) as count FROM "articles"
UNION ALL
SELECT 'Members' as table_name, COUNT(*) as count FROM "members"
UNION ALL
SELECT 'Users' as table_name, COUNT(*) as count FROM "users"
UNION ALL
SELECT 'Hamlets' as table_name, COUNT(*) as count FROM "hamlets";
