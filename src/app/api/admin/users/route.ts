import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Role, MemberStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Mặc định 02 Super Admin hệ thống
const DEFAULT_SUPER_ADMINS = [
  {
    username: "lehanhkt01",
    email: "lehanhkt01@gmail.com",
    fullName: "Lê Hạnh",
    phone: "0912345678",
    unit: "Thường trực Hội CCB Xã",
  },
  {
    username: "trunghieuktkt",
    email: "trunghieuktkt@gmail.com",
    fullName: "Đặng Trung Hiếu",
    phone: "0988776655",
    unit: "Chủ tịch Hội CCB Xã",
  },
];

/**
 * Đảm bảo 02 Super Admin mặc định luôn tồn tại trong PostgreSQL
 */
async function ensureDefaultSuperAdmins() {
  const adminDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "12345678@";
  const passwordHash = await bcrypt.hash(adminDefaultPassword, 10);

  for (const admin of DEFAULT_SUPER_ADMINS) {
    try {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { username: admin.username },
            { email: admin.email },
          ],
        },
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            username: admin.username,
            email: admin.email,
            fullName: admin.fullName,
            phone: admin.phone,
            passwordHash,
            role: Role.SUPER_ADMIN,
            isActive: true,
          },
        });
      }
    } catch (e) {
      console.warn("Lưu ý khởi tạo SuperAdmin mặc định:", e);
    }
  }
}

/**
 * GET /api/admin/users
 * Lấy 100% danh sách tài khoản thực tế từ CSDL PostgreSQL
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Đảm bảo 2 admin gốc luôn có sẵn
    await ensureDefaultSuperAdmins();

    // 2. Truy vấn toàn bộ Users kèm Hamlet và Member
    const dbUsers = await prisma.user.findMany({
      include: {
        hamlet: true,
        member: {
          include: { hamlet: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const admins: any[] = [];
    const branches: any[] = [];
    const members: any[] = [];

    for (const u of dbUsers) {
      const unitName =
        u.hamlet?.name ? `Chi hội ${u.hamlet.name.replace(/^Chi hội\s+/i, "")}`
        : u.member?.hamlet?.name ? `Chi hội ${u.member.hamlet.name.replace(/^Chi hội\s+/i, "")}`
        : u.role === Role.SUPER_ADMIN ? "Thường trực Hội CCB Xã"
        : "Hội CCB Xã Ea Súp";

      const accountItem = {
        id: u.id,
        fullName: u.fullName,
        unit: unitName,
        username: u.username,
        email: u.email || undefined,
        phone: u.phone || u.member?.phone || undefined,
        role: u.role,
        isActive: u.isActive,
        title: u.member?.associationRole || (u.role === Role.BRANCH_LEADER ? "Chi hội trưởng" : undefined),
        lastLogin: "Vừa xong",
        passwordStatus: "MẶC_ĐỊNH" as const,
      };

      if (u.role === Role.SUPER_ADMIN) {
        admins.push(accountItem);
      } else if (u.role === Role.BRANCH_LEADER) {
        branches.push(accountItem);
      } else {
        members.push(accountItem);
      }
    }

    return NextResponse.json({
      success: true,
      count: dbUsers.length,
      admins,
      branches,
      members,
    });
  } catch (error: any) {
    console.error("Lỗi khi tải danh sách người dùng từ PostgreSQL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Lỗi truy vấn cơ sở dữ liệu",
        admins: [],
        branches: [],
        members: [],
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Cấp quyền & Tạo tài khoản mới lưu trực tiếp vĩnh viễn vào CSDL PostgreSQL
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      username,
      email,
      phone,
      role = "SUPER_ADMIN",
      unit,
      birthYear,
      password,
      roleTitle = "Chi hội trưởng",
    } = body;

    if (!fullName || !username) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ Họ tên và Tên đăng nhập / CCCD / Email." },
        { status: 400 }
      );
    }

    const cleanFullName = String(fullName).trim();
    const cleanUsername = String(username).trim();
    const cleanPhone = phone ? String(phone).trim() : undefined;
    let cleanEmail = email ? String(email).trim().toLowerCase() : undefined;

    // Nếu username chứa ký tự @ thì coi đó là email
    if (!cleanEmail && cleanUsername.includes("@")) {
      cleanEmail = cleanUsername.toLowerCase();
    }

    // 1. Xác định mật khẩu mặc định và băm bcrypt
    const adminDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "12345678@";
    const memberDefaultPassword = process.env.MEMBER_DEFAULT_PASSWORD || "12345678@";

    const targetPassword =
      password ||
      (role === "SUPER_ADMIN"
        ? adminDefaultPassword
        : role === "BRANCH_LEADER"
        ? cleanPhone || memberDefaultPassword
        : memberDefaultPassword);

    const passwordHash = await bcrypt.hash(targetPassword, 10);

    // 2. Tìm thôn/buôn liên kết nếu có
    let hamletId: string | null = null;
    let cleanHamletName = unit ? String(unit).replace(/^Chi hội\s+/i, "").trim() : "";
    if (cleanHamletName) {
      const hamlet = await prisma.hamlet.findFirst({
        where: {
          name: { contains: cleanHamletName, mode: "insensitive" },
        },
      });
      if (hamlet) {
        hamletId = hamlet.id;
      }
    }

    // 3. Xử lý tạo theo từng loại Role
    if (role === "SUPER_ADMIN") {
      // Kiểm tra xem User đã tồn tại theo username hoặc email chưa
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: cleanUsername },
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ],
        },
      });

      if (existingUser) {
        // Cập nhật lại quyền SUPER_ADMIN
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            fullName: cleanFullName,
            phone: cleanPhone || existingUser.phone,
            email: cleanEmail || existingUser.email,
            role: Role.SUPER_ADMIN,
            isActive: true,
          },
        });
        return NextResponse.json({
          success: true,
          message: `Đã cập nhật quyền Cán bộ xã (SuperAdmin) cho [${cleanFullName}] thành công!`,
          user: updated,
        });
      }

      // Tạo User mới
      const newUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          passwordHash,
          fullName: cleanFullName,
          email: cleanEmail,
          phone: cleanPhone,
          role: Role.SUPER_ADMIN,
          isActive: true,
          hamletId,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Đã tạo tài khoản Cán bộ xã (SuperAdmin) cho [${cleanFullName}] thành công trong CSDL PostgreSQL!`,
        user: newUser,
      });
    }

    if (role === "MEMBER") {
      // 1. Kiểm tra hoặc tạo hồ sơ Member trong bảng members (Mẫu 02)
      let member = await prisma.member.findUnique({
        where: { cccd: cleanUsername },
      });

      if (!member) {
        const bYear = parseInt(birthYear) || 1970;
        member = await prisma.member.create({
          data: {
            cccd: cleanUsername,
            fullName: cleanFullName,
            phone: cleanPhone,
            birthDate: new Date(`${bYear}-01-01`),
            hamletId: hamletId || null,
            status: MemberStatus.CHINH_THUC,
            adminApproved: true,
            branchApproved: true,
            associationRole: "Hội viên",
          } as any,
        });
      }

      // 2. Kiểm tra hoặc tạo User trong bảng users
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: cleanUsername },
            { memberId: member.id },
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ],
        },
      });

      if (existingUser) {
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            fullName: cleanFullName,
            phone: cleanPhone || existingUser.phone,
            role: Role.MEMBER,
            memberId: member.id,
            hamletId: hamletId || existingUser.hamletId,
            isActive: true,
          },
        });
        return NextResponse.json({
          success: true,
          message: `Đã cập nhật tài khoản Hội viên cho [${cleanFullName}]!`,
          user: updated,
        });
      }

      const newUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          passwordHash,
          fullName: cleanFullName,
          phone: cleanPhone,
          role: Role.MEMBER,
          memberId: member.id,
          hamletId,
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Đã tạo tài khoản Hội viên CCB cho [${cleanFullName}] thành công trong CSDL PostgreSQL!`,
        user: newUser,
      });
    }

    if (role === "BRANCH_LEADER") {
      // Tạo hồ sơ Member Chi hội trưởng nếu chưa có
      let member = await prisma.member.findFirst({
        where: {
          OR: [
            { cccd: cleanUsername },
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ],
        },
      });

      if (member) {
        member = await prisma.member.update({
          where: { id: member.id },
          data: {
            associationRole: roleTitle || "Chi hội trưởng",
            fullName: cleanFullName,
            phone: cleanPhone || member.phone,
            ...(hamletId ? { hamletId } : {}),
          },
        });
      } else {
        const bYear = parseInt(birthYear) || 1965;
        member = await prisma.member.create({
          data: {
            cccd: cleanUsername,
            fullName: cleanFullName,
            phone: cleanPhone,
            birthDate: new Date(`${bYear}-01-01`),
            hamletId: hamletId || null,
            status: MemberStatus.CHINH_THUC,
            adminApproved: true,
            branchApproved: true,
            associationRole: roleTitle || "Chi hội trưởng",
          } as any,
        });
      }

      // Cập nhật Hamlet nếu là Chi hội trưởng chính hoặc chưa có đại diện
      if (hamletId && (roleTitle === "Chi hội trưởng" || roleTitle === "Phó Chi hội trưởng")) {
        try {
          const curHamlet = await prisma.hamlet.findUnique({ where: { id: hamletId } });
          if (!curHamlet?.branchLeaderName || roleTitle === "Chi hội trưởng") {
            await prisma.hamlet.update({
              where: { id: hamletId },
              data: {
                branchLeaderId: member.id,
                branchLeaderName: cleanFullName,
                branchLeaderPhone: cleanPhone,
              },
            });
          }
        } catch (hErr) {
          console.warn("Lưu ý cập nhật hamlet:", hErr);
        }
      }

      // Tạo hoặc cập nhật User BRANCH_LEADER
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: cleanUsername },
            { memberId: member.id },
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ],
        },
      });

      if (existingUser) {
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            fullName: cleanFullName,
            phone: cleanPhone || existingUser.phone,
            role: Role.BRANCH_LEADER,
            memberId: member.id,
            hamletId: hamletId || existingUser.hamletId,
            isActive: true,
          },
        });
        return NextResponse.json({
          success: true,
          message: `Đã cập nhật quyền Chi hội trưởng cho [${cleanFullName}]!`,
          user: updated,
        });
      }

      const newUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          passwordHash,
          fullName: cleanFullName,
          phone: cleanPhone,
          role: Role.BRANCH_LEADER,
          memberId: member.id,
          hamletId,
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Đã cấp quyền Chi hội trưởng cho [${cleanFullName}] thành công trong CSDL PostgreSQL!`,
        user: newUser,
      });
    }

    return NextResponse.json(
      { success: false, error: "Vai trò không hợp lệ." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Lỗi khi tạo tài khoản trong PostgreSQL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tạo tài khoản trên máy chủ" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Cập nhật trạng thái người dùng (Khóa/Mở khóa hoặc Đặt lại mật khẩu)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, username, phone, fullName, isActive, resetPassword } = body;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId && !userId.startsWith("bl_") && !userId.startsWith("acc_") && !userId.startsWith("mem_") ? [{ id: userId }] : []),
          ...(username ? [{ username }, { phone: username }] : []),
          ...(phone ? [{ phone }, { username: phone }] : []),
        ],
      },
    });

    // Nếu chưa có tài khoản trong User table nhưng có trong Member table, tạo user để lưu trạng thái
    if (!user && (username || phone || fullName)) {
      const member = await prisma.member.findFirst({
        where: {
          OR: [
            ...(username ? [{ cccd: username }, { phone: username }] : []),
            ...(phone ? [{ phone }] : []),
            ...(fullName ? [{ fullName }] : []),
          ],
        },
      });

      if (member) {
        const defaultPass = process.env.MEMBER_DEFAULT_PASSWORD || "12345678@";
        const passwordHash = await bcrypt.hash(defaultPass, 10);
        user = await prisma.user.create({
          data: {
            username: member.phone || member.cccd,
            passwordHash,
            fullName: member.fullName,
            phone: member.phone || undefined,
            role: member.associationRole === "Chi hội trưởng" ? Role.BRANCH_LEADER : Role.MEMBER,
            memberId: member.id,
            hamletId: member.hamletId,
            isActive: typeof isActive === "boolean" ? isActive : true,
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy người dùng trong cơ sở dữ liệu." },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (resetPassword) {
      const defaultPass =
        user.role === Role.SUPER_ADMIN
          ? process.env.ADMIN_DEFAULT_PASSWORD || "12345678@"
          : process.env.MEMBER_DEFAULT_PASSWORD || "12345678@";
      updateData.passwordHash = await bcrypt.hash(defaultPass, 10);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái tài khoản [${user.fullName}] thành công!`,
      user: updated,
    });
  } catch (error: any) {
    console.error("Lỗi cập nhật người dùng:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi cập nhật người dùng" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Xóa tài khoản & Gỡ bỏ vai trò Chi hội trưởng nếu có
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    const username = searchParams.get("username");
    const phone = searchParams.get("phone");
    const fullName = searchParams.get("fullName");

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId && !userId.startsWith("bl_") && !userId.startsWith("acc_") && !userId.startsWith("mem_") ? [{ id: userId }] : []),
          ...(username ? [{ username }, { phone: username }] : []),
          ...(phone ? [{ phone }, { username: phone }] : []),
        ],
      },
    });

    // Bảo vệ không cho xóa 2 super admin mặc định
    if (
      user &&
      (user.username === "lehanhkt01" ||
        user.username === "trunghieuktkt" ||
        user.email === "lehanhkt01@gmail.com" ||
        user.email === "trunghieuktkt@gmail.com")
    ) {
      return NextResponse.json(
        { success: false, error: "Không thể xóa tài khoản Quản trị viên mặc định của hệ thống!" },
        { status: 403 }
      );
    }

    // 1. Nếu user có liên kết memberId hoặc tìm thấy member tương ứng, gỡ chức danh Chi hội trưởng
    const targetMember = await prisma.member.findFirst({
      where: {
        OR: [
          ...(user?.memberId ? [{ id: user.memberId }] : []),
          ...(username ? [{ cccd: username }, { phone: username }] : []),
          ...(phone ? [{ phone }] : []),
          ...(fullName ? [{ fullName }] : []),
        ],
      },
    });

    if (targetMember) {
      await prisma.member.update({
        where: { id: targetMember.id },
        data: { associationRole: "Hội viên" },
      });

      await prisma.hamlet.updateMany({
        where: { branchLeaderId: targetMember.id },
        data: { branchLeaderId: null, branchLeaderName: null, branchLeaderPhone: null },
      });
    }

    // 2. Gỡ bỏ đại diện CHT khỏi bảng hamlet nếu có thông tin phone hoặc tên
    if (phone || username) {
      const searchPhone = phone || username;
      await prisma.hamlet.updateMany({
        where: { branchLeaderPhone: searchPhone },
        data: { branchLeaderId: null, branchLeaderName: null, branchLeaderPhone: null },
      });
    }

    // 3. Xóa bản ghi trong bảng User nếu có
    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa tài khoản và gỡ bỏ quyền Chi hội trưởng thành công!`,
    });
  } catch (error: any) {
    console.error("Lỗi xóa tài khoản:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xóa người dùng" },
      { status: 500 }
    );
  }
}
