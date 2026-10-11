-- ==============================================================================
-- E-CCB EA SÚP — KHỞI TẠO BẢNG ARTICLES VÀ 04 BẢN TIN TUYÊN TRUYỀN MẪU
-- Chạy trực tiếp qua psql không phụ thuộc npm hay prisma version
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

-- Nạp 04 bản tin mẫu chính thức (trạng thái APPROVED)
INSERT INTO "articles" ("id", "slug", "title", "category", "status", "author", "authorRole", "summary", "content", "thumbnail", "imageGallery", "views", "createdAt", "updatedAt")
VALUES
(
    'tin-01',
    'le-trao-tang-nha-nghia-tinh-dong-doi-buon-a',
    'Hội CCB xã Ea Súp tổ chức Lễ trao tặng Nhà "Nghĩa tình đồng đội" tại Buôn A',
    'Nghĩa tình đồng đội',
    'APPROVED',
    'Thường trực Hội CCB Xã Ea Súp',
    'SUPER_ADMIN',
    'Thường trực Hội CCB xã phối hợp cùng Ban Tự quản Buôn A tổ chức bàn giao căn nhà cấp 4 kiên cố cho hội viên khó khăn với kinh phí hỗ trợ 60 triệu đồng trích từ Quỹ đồng đội xã.',
    'Thực hiện chương trình xóa nhà tạm dột nát cho hội viên cựu chiến binh có hoàn cảnh khó khăn, Ban Thường vụ Hội CCB xã Ea Súp đã phối hợp cùng các ban ngành, đoàn thể và Chi hội CCB Buôn A tổ chức lễ khánh thành và bàn giao nhà ''Nghĩa tình đồng đội'' cho gia đình đồng chí Y Dăng Niê.\n\nCăn nhà có diện tích 55m², tường xây gạch, mái lợp tôn kiên cố với tổng kinh phí xây dựng hơn 110 triệu đồng. Trong đó, Quỹ ''Nghĩa tình đồng đội'' của Hội CCB xã hỗ trợ 60 triệu đồng, số tiền còn lại do gia đình và bà con họ hàng, đồng đội trong chi hội đóng góp ngày công lao động.\n\nPhát biểu tại buổi lễ, đồng chí Chủ tịch Hội CCB xã nhấn mạnh: Đây là hoạt động ý nghĩa thiết thực thể hiện đạo lý ''Uống nước nhớ nguồn'', tình đồng chí đồng đội gắn bó keo sơn, giúp gia đình hội viên an cư lạc nghiệp, tiếp tục phát huy truyền thống ''Bộ đội Cụ Hồ'' gương mẫu tại địa phương.',
    '/images/tin-01-nha-dong-doi.jpg',
    ARRAY['/images/tin-01-nha-dong-doi.jpg'],
    248,
    '2026-10-06 08:00:00',
    NOW()
),
(
    'tin-02',
    'mo-hinh-lua-st25-va-mit-thai-thon-2',
    'Phong trào CCB gương mẫu làm kinh tế: Mô hình lúa ST25 và mít Thái tại Thôn 2 cho hiệu quả cao',
    'Kinh tế CCB',
    'APPROVED',
    'Ban Tuyên giáo Hội CCB Xã',
    'SUPER_ADMIN',
    'Đồng chí Nguyễn Văn Thành, hội viên CCB Chi hội Thôn 2 đã mạnh dạn chuyển đổi 3 ha đất sang canh tác giống lúa ST25 kết hợp mít Thái ruột đỏ, thu lãi trên 350 triệu đồng/năm.',
    'Phát huy phẩm chất người lính không cam chịu đói nghèo, CCB Nguyễn Văn Thành (thương binh 4/4) tại Thôn 2 đã tiên phong ứng dụng tiến bộ khoa học kỹ thuật vào sản xuất nông nghiệp tại vùng đất Ea Súp.\n\nNhờ được tiếp cận nguồn vốn vay ưu đãi 100 triệu đồng từ Ngân hàng Chính sách Xã hội ủy thác qua Hội CCB xã, ông Thành đã đầu tư hệ thống tưới tiêu tự động tiết kiệm nước và cải tạo đất phèn. Đến nay, mô hình của ông cho năng suất lúa ST25 đạt 8 tấn/ha, tạo việc làm mùa vụ cho 6 con em cựu chiến binh trong thôn.\n\nChi hội CCB Thôn 2 đang nhân rộng mô hình này cho các hộ gia đình hội viên khác trong thôn học tập và áp dụng.',
    '/images/tin-02-lua-mit-thai.jpg',
    ARRAY['/images/tin-02-lua-mit-thai.jpg'],
    312,
    '2026-10-02 08:00:00',
    NOW()
),
(
    'tin-03',
    'kiem-tra-quan-ly-von-uy-thac-nhcsxh-20-chi-hoi',
    'Hội CCB xã Ea Súp hoàn thành kiểm tra công tác quản lý vốn ủy thác NHCSXH tại 20 Chi hội thôn, buôn',
    'Vay vốn chính sách',
    'APPROVED',
    'Tổ Giám sát Vốn vay Hội CCB Xã',
    'SUPER_ADMIN',
    'Đoàn kiểm tra do Thường trực Hội CCB xã chủ trì đã kiểm tra thực tế 20 Tổ TK&VV, ghi nhận tổng dư nợ đạt 52,18 tỷ đồng, tỷ lệ nợ quá hạn duy trì ở mức an toàn 0,06%.',
    'Trong tháng 9/2026, Ban Thường vụ Hội CCB xã Ea Súp đã tiến hành kiểm tra toàn diện hoạt động ủy thác vay vốn tín dụng chính sách tại 20 chi hội thôn, buôn trên toàn địa bàn xã.\n\nKết quả kiểm tra cho thấy 20/20 Tổ TK&VV hoạt động đúng quy chế, hồ sơ sổ sách lưu trữ khoa học, bình xét cho vay công khai, dân chủ. 100% hộ vay sử dụng vốn đúng mục đích (mua bò sinh sản, trồng cây ăn trái, đầu tư máy móc nông nghiệp). Tỷ lệ nợ quá hạn toàn xã chỉ chiếm 0,06% (31,3 triệu đồng) - thuộc nhóm đơn vị quản lý vốn vay an toàn nhất địa bàn.\n\nĐoàn công tác yêu cầu các Chi hội trưởng tiếp tục đôn đốc thu lãi đúng hạn và rà soát các hộ hội viên mới có nhu cầu vay vốn để giải ngân kịp thời trong quý IV.',
    '/images/tin-03-kiem-tra-von-vay.jpg',
    ARRAY['/images/tin-03-kiem-tra-von-vay.jpg'],
    185,
    '2026-09-28 08:00:00',
    NOW()
),
(
    'tin-04',
    'tuyen-truyen-luat-luc-luong-an-ninh-co-so-bien-cuong',
    'Tuyên truyền Luật Lực lượng tham gia bảo vệ ANTT ở cơ sở và phong trào CCB giữ gìn biên cương',
    'Tuyên truyền & Quốc phòng',
    'APPROVED',
    'Thường trực Hội CCB Xã Ea Súp',
    'SUPER_ADMIN',
    'Hơn 180 cán bộ, hội viên nòng cốt của 20 Chi hội thôn, buôn đã tham gia buổi tọa đàm quán triệt nhiệm vụ bảo vệ an ninh trật tự và phòng chống tội phạm vùng biên giới.',
    'Nhằm nâng cao nhận thức chính trị và tinh thần cảnh giác cách mạng, Hội CCB xã Ea Súp phối hợp với Công an xã và Đồn Biên phòng tổ chức hội nghị tuyên truyền pháp luật và triển khai kế hoạch phối hợp tuần tra giữ gìn an ninh trật tự địa bàn giáp ranh.\n\nTại buổi tuyên truyền, các cựu chiến binh đã được phổ biến các nội dung cơ bản của Luật Lực lượng tham gia bảo vệ ANTT ở cơ sở; phương thức, thủ đoạn của các thế lực thù địch và các loại tội phạm công nghệ cao.\n\nHội CCB xã tiếp tục duy trì 20 Tổ CCB tự quản về ANTT tại 20 thôn buôn, sẵn sàng phối hợp cùng lực lượng công an, quân sự xử lý kịp thời các vụ việc phát sinh ngay từ cơ sở.',
    '/images/tin-04-bien-gioi-ea-sup.jpg',
    ARRAY['/images/tin-04-bien-gioi-ea-sup.jpg'],
    290,
    '2026-09-20 08:00:00',
    NOW()
)
ON CONFLICT ("id") DO UPDATE SET
    "status" = EXCLUDED."status",
    "title" = EXCLUDED."title",
    "content" = EXCLUDED."content",
    "thumbnail" = EXCLUDED."thumbnail",
    "imageGallery" = EXCLUDED."imageGallery";
