-- ==============================================================================
-- E-CCB EA SÚP — KHỞI TẠO TOÀN BỘ CẤU TRÚC BẢNG CSDL POSTGRESQL (ZERO DATA LOSS)
-- An toàn 100%: Dùng CREATE TABLE IF NOT EXISTS & CREATE INDEX IF NOT EXISTS
-- ==============================================================================

-- 1. TẠO CÁC ENUMS HỆ THỐNG
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'BRANCH_LEADER', 'MEMBER', 'GUEST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "Period" AS ENUM ('CHONG_PHAP', 'CHONG_MY', 'BIEN_GIOI_BAC', 'TAY_NAM', 'QUOC_TE', 'CUU_QUAN_NHAN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PolicyStatus" AS ENUM ('THUONG_BINH', 'BENH_BINH', 'DA_CAM', 'LAO_THANH_CM', 'TIEN_KHOI_NGHIA', 'KHONG');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "AttendanceMethod" AS ENUM ('QR_SCAN', 'MANUAL_CHECKIN', 'EXCUSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "FundLoanStatus" AS ENUM ('PENDING', 'ACTIVE', 'REPAID', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "MemberStatus" AS ENUM ('CHO_CHI_HOI_DUYET', 'CHO_XA_PHE_DUYET', 'CHINH_THUC', 'TU_CHOI', 'TRANSFERRED', 'DECEASED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "MovementType" AS ENUM ('TRANSFER_IN', 'TRANSFER_OUT', 'EXPELLED', 'DECEASED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING_APPROVAL', 'BRANCH_APPROVED', 'ADMIN_APPROVED', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TẠO CÁC BẢNG DỮ LIỆU
CREATE TABLE IF NOT EXISTS "hamlets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchLeaderName" TEXT,
    "branchLeaderPhone" TEXT,
    "branchLeaderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hamlets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "loan_groups" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hamletId" TEXT NOT NULL,
    "groupLeaderName" TEXT NOT NULL,
    "groupLeaderPhone" TEXT,
    "totalEntrustedDebt" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overdueDebt" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interestCollectionRate" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "totalBorrowers" INTEGER NOT NULL DEFAULT 0,
    "savingsBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "entrustedBankBranch" TEXT NOT NULL DEFAULT 'Phòng giao dịch NHCSXH Huyện Ea Súp',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loan_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "members" (
    "id" TEXT NOT NULL,
    "cccd" TEXT NOT NULL,
    "idCardNumber" TEXT,
    "fullName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT NOT NULL DEFAULT 'Nam',
    "hometown" TEXT,
    "ethnicity" TEXT NOT NULL DEFAULT 'Kinh',
    "religion" TEXT NOT NULL DEFAULT 'Không',
    "hamletId" TEXT NOT NULL,
    "currentAddress" TEXT,
    "phone" TEXT,
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "branchApproved" BOOLEAN NOT NULL DEFAULT false,
    "branchApprovedAt" TIMESTAMP(3),
    "branchApprovedBy" TEXT,
    "branchNotes" TEXT,
    "adminApproved" BOOLEAN NOT NULL DEFAULT false,
    "adminApprovedAt" TIMESTAMP(3),
    "adminApprovedBy" TEXT,
    "adminNotes" TEXT,
    "enlistmentDate" TIMESTAMP(3),
    "militaryUnit" TEXT,
    "dischargeDate" TIMESTAMP(3),
    "militaryRank" TEXT,
    "militaryPosition" TEXT,
    "militaryTraining" TEXT,
    "period" "Period" NOT NULL DEFAULT 'CUU_QUAN_NHAN',
    "isCQN" BOOLEAN NOT NULL DEFAULT false,
    "isHouseholdHead" BOOLEAN NOT NULL DEFAULT false,
    "status" "MemberStatus" NOT NULL DEFAULT 'CHO_CHI_HOI_DUYET',
    "rejectionReason" TEXT,
    "associationJoinDate" TIMESTAMP(3),
    "associationRole" TEXT DEFAULT 'Hội viên',
    "partyJoinDate" TIMESTAMP(3),
    "partyOfficialDate" TIMESTAMP(3),
    "partyCell" TEXT,
    "partyBadge" TEXT,
    "educationLevel" TEXT,
    "politicalTheory" TEXT,
    "professionalSkill" TEXT,
    "policyStatus" "PolicyStatus" NOT NULL DEFAULT 'KHONG',
    "policyWoundRate" INTEGER,
    "titles" TEXT,
    "memorialBadgeYear" INTEGER,
    "hasHealthInsurance100" BOOLEAN NOT NULL DEFAULT false,
    "healthInsuranceCode" TEXT,
    "isPoorHousehold" BOOLEAN NOT NULL DEFAULT false,
    "isNearPoorHousehold" BOOLEAN NOT NULL DEFAULT false,
    "hasDilapidatedHouse" BOOLEAN NOT NULL DEFAULT false,
    "hasEconomicModel" BOOLEAN NOT NULL DEFAULT false,
    "economicModelType" TEXT,
    "economicModelName" TEXT,
    "economicRevenue" DECIMAL(15,2),
    "economicLaborCount" INTEGER,
    "economicIncome" DECIMAL(15,2),
    "isDeceased" BOOLEAN NOT NULL DEFAULT false,
    "deceasedDate" TIMESTAMP(3),
    "hasMilitaryFuneral" BOOLEAN NOT NULL DEFAULT false,
    "funeralAllowanceStatus" TEXT,
    "isTransferred" BOOLEAN NOT NULL DEFAULT false,
    "transferDestination" TEXT,
    "transferDate" TIMESTAMP(3),
    "isExpelled" BOOLEAN NOT NULL DEFAULT false,
    "expelledDate" TIMESTAMP(3),
    "expelledReason" TEXT,
    "totalDebt" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "loanGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "memberId" TEXT,
    "hamletId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "thumbnail" TEXT,
    "imageGallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "author" TEXT,
    "authorRole" TEXT,
    "authorPhone" TEXT,
    "authorId" TEXT,
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "hamletId" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "qrExpiresAt" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "attendances" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "attendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "AttendanceMethod" NOT NULL DEFAULT 'QR_SCAN',
    "note" TEXT,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "internal_funds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hamletId" TEXT,
    "totalCapital" DECIMAL(15,2) NOT NULL DEFAULT 1300000000,
    "availableBalance" DECIMAL(15,2) NOT NULL DEFAULT 1300000000,
    "monthlyFeeAmount" DECIMAL(15,2) NOT NULL DEFAULT 50000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "internal_funds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fund_contributions" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "contributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptNumber" TEXT,
    "collectorName" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fund_contributions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fund_loans" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedDate" TIMESTAMP(3),
    "status" "FundLoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "purpose" TEXT,
    "approvedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fund_loans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "member_movements" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "hamletId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "destination" TEXT,
    "decisionNumber" TEXT,
    "documentPdfUrl" TEXT,
    "burialPlace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "member_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "member_registrations" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "idCardNumber" TEXT NOT NULL,
    "phone" TEXT,
    "hamletId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "branchApproved" BOOLEAN NOT NULL DEFAULT false,
    "branchApprovedAt" TIMESTAMP(3),
    "branchApprovedBy" TEXT,
    "branchNotes" TEXT,
    "adminApproved" BOOLEAN NOT NULL DEFAULT false,
    "adminApprovedAt" TIMESTAMP(3),
    "adminApprovedBy" TEXT,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "attachedFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "member_registrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "targetRole" TEXT,
    "hamletId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- 3. TẠO CÁC INDEXES (IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_memberId_key" ON "users"("memberId");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_hamletId_idx" ON "users"("hamletId");

CREATE UNIQUE INDEX IF NOT EXISTS "hamlets_code_key" ON "hamlets"("code");
CREATE INDEX IF NOT EXISTS "hamlets_code_idx" ON "hamlets"("code");

CREATE UNIQUE INDEX IF NOT EXISTS "members_cccd_key" ON "members"("cccd");
CREATE INDEX IF NOT EXISTS "members_cccd_idx" ON "members"("cccd");
CREATE INDEX IF NOT EXISTS "members_fullName_idx" ON "members"("fullName");
CREATE INDEX IF NOT EXISTS "members_hamletId_idx" ON "members"("hamletId");
CREATE INDEX IF NOT EXISTS "members_policyStatus_idx" ON "members"("policyStatus");
CREATE INDEX IF NOT EXISTS "members_period_idx" ON "members"("period");
CREATE INDEX IF NOT EXISTS "members_isDeceased_idx" ON "members"("isDeceased");
CREATE INDEX IF NOT EXISTS "members_isPoorHousehold_idx" ON "members"("isPoorHousehold");

CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_key" ON "articles"("slug");
CREATE INDEX IF NOT EXISTS "articles_status_idx" ON "articles"("status");
CREATE INDEX IF NOT EXISTS "articles_authorId_idx" ON "articles"("authorId");
CREATE INDEX IF NOT EXISTS "articles_category_idx" ON "articles"("category");

CREATE UNIQUE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_targetRole_idx" ON "notifications"("targetRole");
CREATE INDEX IF NOT EXISTS "notifications_hamletId_idx" ON "notifications"("hamletId");
CREATE INDEX IF NOT EXISTS "notifications_isRead_idx" ON "notifications"("isRead");

-- 4. KHỞI TẠO 20 THÔN BUÔN XÃ EA SÚP NẾU CHƯA CÓ
INSERT INTO "hamlets" ("id", "code", "name", "branchLeaderName", "branchLeaderPhone", "updatedAt")
VALUES
  ('h-01', 'THON_01', 'Thôn 1', 'Hồ Sỹ Tuấn', '0986042302', NOW()),
  ('h-02', 'THON_02', 'Thôn 2', 'Nguyễn Đức Lợi', '0945892301', NOW()),
  ('h-03', 'THON_03', 'Thôn 3', 'Nguyễn Văn Dũng', '0913456789', NOW()),
  ('h-04', 'THON_04', 'Thôn 4', 'Nguyễn Phú Bốn', '0978123456', NOW()),
  ('h-05', 'THON_05', 'Thôn 5', 'Vũ Văn Đạt', '0987654321', NOW()),
  ('h-06', 'THON_06', 'Thôn 6', 'Đỗ Thị Lan', '0935123987', NOW()),
  ('h-07', 'THON_07', 'Thôn 7', 'Nguyễn Văn Minh', '0905112233', NOW()),
  ('h-08', 'THON_08', 'Thôn 8', 'Trần Thanh Hùng', '0918776655', NOW()),
  ('h-09', 'THON_09', 'Thôn 9', 'Trần Văn Cảnh', '0944332211', NOW()),
  ('h-10', 'THON_10', 'Thôn 10', 'Nguyễn Lai', '0988776655', NOW()),
  ('h-11', 'THON_11', 'Thôn 11', 'Huỳnh Công Dũng', '0912345678', NOW()),
  ('h-12', 'THON_12', 'Thôn 12', 'Triệu Đức Quyên', '0976543210', NOW()),
  ('h-13', 'THON_13', 'Thôn 13', 'Hoàng Văn Tuyên', '0965432109', NOW()),
  ('h-14', 'THON_HOA_BINH', 'Thôn Hòa Bình', 'Lê Văn Hồng', '0942067002', NOW()),
  ('h-15', 'THON_THANG_LOI', 'Thôn Thắng Lợi', 'Nguyễn Văn Đông', '0925065000', NOW()),
  ('h-16', 'THON_DOAN_KET', 'Thôn Đoàn Kết', 'Nguyễn Văn Sơn', '0940059000', NOW()),
  ('h-17', 'THON_BINH_LOI', 'Thôn Bình Lợi', 'Lục Văn Cường', '0904082002', NOW()),
  ('h-18', 'BUON_A', 'Buôn A', 'Y Nô Rcăm', '0982257421', NOW()),
  ('h-19', 'BUON_B', 'Buôn B', 'Đoàn Hữu Tiến', '0934050005', NOW()),
  ('h-20', 'BUON_C', 'Buôn C', 'Y Dyơng Êban', '0983993119', NOW())
ON CONFLICT ("code") DO NOTHING;

-- 5. KHỞI TẠO TÀI KHOẢN CÁN BỘ XÃ QUẢN TRỊ NẾU CHƯA CÓ
INSERT INTO "users" ("id", "username", "passwordHash", "fullName", "email", "role", "isActive", "updatedAt")
VALUES
  ('usr-super-admin-01', 'lehanhkt01@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lê Hạnh', 'lehanhkt01@gmail.com', 'SUPER_ADMIN', true, NOW()),
  ('usr-super-admin-02', 'trunghieuktkt@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Đặng Trung Hiếu', 'trunghieuktkt@gmail.com', 'SUPER_ADMIN', true, NOW())
ON CONFLICT ("username") DO NOTHING;

-- 6. XÓA SỐ DƯ NỢ ẢO ĐỂ TRẢ VỀ 0 THEO YÊU CẦU NGHIỆP VỤ
UPDATE "members" SET "totalDebt" = 0 WHERE "totalDebt" > 0;
