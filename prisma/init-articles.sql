-- ==============================================================================
-- E-CCB EA SÚP — KHỞI TẠO CẤU TRÚC BẢNG ARTICLES (CSDL THỰC TẾ, KHÔNG DỮ LIỆU ẢO)
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_key" ON "articles"("slug");
CREATE INDEX IF NOT EXISTS "articles_status_idx" ON "articles"("status");
CREATE INDEX IF NOT EXISTS "articles_authorId_idx" ON "articles"("authorId");
CREATE INDEX IF NOT EXISTS "articles_category_idx" ON "articles"("category");

-- Xóa bỏ bất kỳ bài viết ảo cũ nào còn sót lại
DELETE FROM "articles" WHERE "id" IN ('tin-01', 'tin-02', 'tin-03', 'tin-04');
