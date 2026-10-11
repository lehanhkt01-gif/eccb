import { PrismaClient, ArticleStatus as PrismaArticleStatus } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type ArticleStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface Article {
  id: string;
  title: string;
  slug?: string;
  category: string;
  date: string;
  author: string;
  authorId?: string;
  authorRole?: string;
  authorPhone?: string;
  summary: string;
  content: string;
  imageUrl?: string;
  thumbnail?: string;
  imageGallery?: string[];
  status: ArticleStatus;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Danh sách 04 bản tin tuyên truyền mẫu chuẩn của Hội Cựu Chiến Binh Xã Ea Súp
 * Luôn được nạp vào PostgreSQL nếu CSDL chưa có dữ liệu bản tin
 */
export const DEFAULT_APPROVED_NEWS: Article[] = [
  {
    id: "tin-01",
    slug: "le-trao-tang-nha-nghia-tinh-dong-doi-buon-a",
    title: "Hội CCB xã Ea Súp tổ chức Lễ trao tặng Nhà \"Nghĩa tình đồng đội\" tại Buôn A",
    category: "Nghĩa tình đồng đội",
    status: "APPROVED",
    date: "06/10/2026",
    author: "Thường trực Hội CCB Xã Ea Súp",
    authorRole: "SUPER_ADMIN",
    authorId: "cadre-ea-sup",
    summary: "Thường trực Hội CCB xã phối hợp cùng Ban Tự quản Buôn A tổ chức bàn giao căn nhà cấp 4 kiên cố cho hội viên khó khăn với kinh phí hỗ trợ 60 triệu đồng trích từ Quỹ đồng đội xã.",
    content: "Thực hiện chương trình xóa nhà tạm dột nát cho hội viên cựu chiến binh có hoàn cảnh khó khăn, Ban Thường vụ Hội CCB xã Ea Súp đã phối hợp cùng các ban ngành, đoàn thể và Chi hội CCB Buôn A tổ chức lễ khánh thành và bàn giao nhà 'Nghĩa tình đồng đội' cho gia đình đồng chí Y Dăng Niê.\n\nCăn nhà có diện tích 55m², tường xây gạch, mái lợp tôn kiên cố với tổng kinh phí xây dựng hơn 110 triệu đồng. Trong đó, Quỹ 'Nghĩa tình đồng đội' của Hội CCB xã hỗ trợ 60 triệu đồng, số tiền còn lại do gia đình và bà con họ hàng, đồng đội trong chi hội đóng góp ngày công lao động.\n\nPhát biểu tại buổi lễ, đồng chí Chủ tịch Hội CCB xã nhấn mạnh: Đây là hoạt động ý nghĩa thiết thực thể hiện đạo lý 'Uống nước nhớ nguồn', tình đồng chí đồng đội gắn bó keo sơn, giúp gia đình hội viên an cư lạc nghiệp, tiếp tục phát huy truyền thống 'Bộ đội Cụ Hồ' gương mẫu tại địa phương.",
    imageUrl: "/images/tin-01-nha-dong-doi.jpg",
    thumbnail: "/images/tin-01-nha-dong-doi.jpg",
    imageGallery: ["/images/tin-01-nha-dong-doi.jpg"],
    views: 248,
    createdAt: "2026-10-06T08:00:00.000Z",
    updatedAt: "2026-10-06T08:00:00.000Z"
  },
  {
    id: "tin-02",
    slug: "mo-hinh-lua-st25-va-mit-thai-thon-2",
    title: "Phong trào CCB gương mẫu làm kinh tế: Mô hình lúa ST25 và mít Thái tại Thôn 2 cho hiệu quả cao",
    category: "Kinh tế CCB",
    status: "APPROVED",
    date: "02/10/2026",
    author: "Ban Tuyên giáo Hội CCB Xã",
    authorRole: "SUPER_ADMIN",
    authorId: "cadre-ea-sup",
    summary: "Đồng chí Nguyễn Văn Thành, hội viên CCB Chi hội Thôn 2 đã mạnh dạn chuyển đổi 3 ha đất sang canh tác giống lúa ST25 kết hợp mít Thái ruột đỏ, thu lãi trên 350 triệu đồng/năm.",
    content: "Phát huy phẩm chất người lính không cam chịu đói nghèo, CCB Nguyễn Văn Thành (thương binh 4/4) tại Thôn 2 đã tiên phong ứng dụng tiến bộ khoa học kỹ thuật vào sản xuất nông nghiệp tại vùng đất Ea Súp.\n\nNhờ được tiếp cận nguồn vốn vay ưu đãi 100 triệu đồng từ Ngân hàng Chính sách Xã hội ủy thác qua Hội CCB xã, ông Thành đã đầu tư hệ thống tưới tiêu tự động tiết kiệm nước và cải tạo đất phèn. Đến nay, mô hình của ông cho năng suất lúa ST25 đạt 8 tấn/ha, tạo việc làm mùa vụ cho 6 con em cựu chiến binh trong thôn.\n\nChi hội CCB Thôn 2 đang nhân rộng mô hình này cho các hộ gia đình hội viên khác trong thôn học tập và áp dụng.",
    imageUrl: "/images/tin-02-lua-mit-thai.jpg",
    thumbnail: "/images/tin-02-lua-mit-thai.jpg",
    imageGallery: ["/images/tin-02-lua-mit-thai.jpg"],
    views: 312,
    createdAt: "2026-10-02T08:00:00.000Z",
    updatedAt: "2026-10-02T08:00:00.000Z"
  },
  {
    id: "tin-03",
    slug: "kiem-tra-quan-ly-von-uy-thac-nhcsxh-20-chi-hoi",
    title: "Hội CCB xã Ea Súp hoàn thành kiểm tra công tác quản lý vốn ủy thác NHCSXH tại 20 Chi hội thôn, buôn",
    category: "Vay vốn chính sách",
    status: "APPROVED",
    date: "28/09/2026",
    author: "Tổ Giám sát Vốn vay Hội CCB Xã",
    authorRole: "SUPER_ADMIN",
    authorId: "cadre-ea-sup",
    summary: "Đoàn kiểm tra do Thường trực Hội CCB xã chủ trì đã kiểm tra thực tế 20 Tổ TK&VV, ghi nhận tổng dư nợ đạt 52,18 tỷ đồng, tỷ lệ nợ quá hạn duy trì ở mức an toàn 0,06%.",
    content: "Trong tháng 9/2026, Ban Thường vụ Hội CCB xã Ea Súp đã tiến hành kiểm tra toàn diện hoạt động ủy thác vay vốn tín dụng chính sách tại 20 chi hội thôn, buôn trên toàn địa bàn xã.\n\nKết quả kiểm tra cho thấy 20/20 Tổ TK&VV hoạt động đúng quy chế, hồ sơ sổ sách lưu trữ khoa học, bình xét cho vay công khai, dân chủ. 100% hộ vay sử dụng vốn đúng mục đích (mua bò sinh sản, trồng cây ăn trái, đầu tư máy móc nông nghiệp). Tỷ lệ nợ quá hạn toàn xã chỉ chiếm 0,06% (31,3 triệu đồng) - thuộc nhóm đơn vị quản lý vốn vay an toàn nhất địa bàn.\n\nĐoàn công tác yêu cầu các Chi hội trưởng tiếp tục đôn đốc thu lãi đúng hạn và rà soát các hộ hội viên mới có nhu cầu vay vốn để giải ngân kịp thời trong quý IV.",
    imageUrl: "/images/tin-03-kiem-tra-von-vay.jpg",
    thumbnail: "/images/tin-03-kiem-tra-von-vay.jpg",
    imageGallery: ["/images/tin-03-kiem-tra-von-vay.jpg"],
    views: 185,
    createdAt: "2026-09-28T08:00:00.000Z",
    updatedAt: "2026-09-28T08:00:00.000Z"
  },
  {
    id: "tin-04",
    slug: "tuyen-truyen-luat-luc-luong-an-ninh-co-so-bien-cuong",
    title: "Tuyên truyền Luật Lực lượng tham gia bảo vệ ANTT ở cơ sở và phong trào CCB giữ gìn biên cương",
    category: "Tuyên truyền & Quốc phòng",
    status: "APPROVED",
    date: "20/09/2026",
    author: "Thường trực Hội CCB Xã Ea Súp",
    authorRole: "SUPER_ADMIN",
    authorId: "cadre-ea-sup",
    summary: "Hơn 180 cán bộ, hội viên nòng cốt của 20 Chi hội thôn, buôn đã tham gia buổi tọa đàm quán triệt nhiệm vụ bảo vệ an ninh trật tự và phòng chống tội phạm vùng biên giới.",
    content: "Nhằm nâng cao nhận thức chính trị và tinh thần cảnh giác cách mạng, Hội CCB xã Ea Súp phối hợp với Công an xã và Đồn Biên phòng tổ chức hội nghị tuyên truyền pháp luật và triển khai kế hoạch phối hợp tuần tra giữ gìn an ninh trật tự địa bàn giáp ranh.\n\nTại buổi tuyên truyền, các cựu chiến binh đã được phổ biến các nội dung cơ bản của Luật Lực lượng tham gia bảo vệ ANTT ở cơ sở; phương thức, thủ đoạn của các thế lực thù địch và các loại tội phạm công nghệ cao.\n\nHội CCB xã tiếp tục duy trì 20 Tổ CCB tự quản về ANTT tại 20 thôn buôn, sẵn sàng phối hợp cùng lực lượng công an, quân sự xử lý kịp thời các vụ việc phát sinh ngay từ cơ sở.",
    imageUrl: "/images/tin-04-bien-gioi-ea-sup.jpg",
    thumbnail: "/images/tin-04-bien-gioi-ea-sup.jpg",
    imageGallery: ["/images/tin-04-bien-gioi-ea-sup.jpg"],
    views: 290,
    createdAt: "2026-09-20T08:00:00.000Z",
    updatedAt: "2026-09-20T08:00:00.000Z"
  }
];

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Map từ Prisma Model sang giao diện Article
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPrismaArticleToArticle(raw: any): Article {
  const createdAtDate = new Date(raw.createdAt);
  const dateStr = formatDate(createdAtDate);
  const primaryImg = raw.thumbnail || (raw.imageGallery && raw.imageGallery[0]) || "/images/hero-military-bg.webp";

  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    category: raw.category,
    date: dateStr,
    author: raw.author || "Thường trực Hội CCB Xã Ea Súp",
    authorId: raw.authorId || undefined,
    authorRole: raw.authorRole || undefined,
    authorPhone: raw.authorPhone || undefined,
    summary: raw.summary || "",
    content: raw.content || "",
    imageUrl: primaryImg,
    thumbnail: primaryImg,
    imageGallery: raw.imageGallery || [primaryImg],
    status: raw.status as ArticleStatus,
    reviewedById: raw.reviewedById || undefined,
    reviewedByName: raw.reviewedByName || undefined,
    views: raw.views || 0,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };
}

/**
 * Tự động đồng bộ 04 bản tin mẫu vào CSDL PostgreSQL (Upsert bảo đảm luôn tồn tại)
 */
export async function seedDefaultNewsIfEmpty(): Promise<void> {
  try {
    for (const item of DEFAULT_APPROVED_NEWS) {
      await prisma.article.upsert({
        where: { id: item.id },
        update: {
          status: PrismaArticleStatus.APPROVED,
          title: item.title,
          category: item.category,
          summary: item.summary,
          content: item.content,
          thumbnail: item.thumbnail,
          imageGallery: item.imageGallery || [item.thumbnail || ""],
          views: item.views || 100,
        },
        create: {
          id: item.id,
          title: item.title,
          slug: item.slug || item.id,
          category: item.category,
          summary: item.summary,
          content: item.content,
          thumbnail: item.thumbnail,
          imageGallery: item.imageGallery || [item.thumbnail || ""],
          status: PrismaArticleStatus.APPROVED,
          author: item.author,
          authorRole: item.authorRole,
          views: item.views || 100,
          createdAt: new Date(item.createdAt || Date.now()),
          updatedAt: new Date(item.updatedAt || Date.now()),
        },
      });
    }
    console.log("✓ Đã đồng bộ an toàn 4 bản tin tuyên truyền mẫu vào CSDL PostgreSQL!");
  } catch (err) {
    console.error("Lỗi khi seed/upsert bản tin mặc định vào PostgreSQL:", err);
  }
}

/**
 * Lấy danh sách toàn bộ bản tin đã duyệt từ CSDL PostgreSQL
 */
export async function getAllNews(): Promise<Article[]> {
  try {
    await seedDefaultNewsIfEmpty();

    const articles = await prisma.article.findMany({
      where: {
        status: PrismaArticleStatus.APPROVED,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (articles.length === 0) {
      return DEFAULT_APPROVED_NEWS;
    }

    return articles.map(mapPrismaArticleToArticle);
  } catch (error) {
    console.error("Lỗi khi đọc bản tin từ PostgreSQL, kích hoạt fallback:", error);
    return DEFAULT_APPROVED_NEWS;
  }
}

/**
 * Lấy chi tiết bản tin theo ID hoặc Slug từ PostgreSQL
 */
export async function getNewsById(idOrSlug: string): Promise<Article | null> {
  try {
    const found = await prisma.article.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
    });

    if (found) {
      return mapPrismaArticleToArticle(found);
    }

    // Fallback trong trường hợp DB chưa kịp nạp
    const fallback = DEFAULT_APPROVED_NEWS.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
    return fallback || null;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết bản tin từ PostgreSQL:", error);
    const fallback = DEFAULT_APPROVED_NEWS.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
    return fallback || null;
  }
}

/**
 * Tăng lượt xem cho bản tin trong PostgreSQL
 */
export async function incrementArticleViews(id: string): Promise<number | null> {
  try {
    const updated = await prisma.article.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        views: true,
      },
    });
    return updated.views;
  } catch {
    return null;
  }
}
