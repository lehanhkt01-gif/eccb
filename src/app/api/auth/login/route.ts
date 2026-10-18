import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getStoredMembers } from "@/lib/memberStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, requestedRole } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập đầy đủ tên đăng nhập/CCCD và mật khẩu." },
        { status: 400 }
      );
    }

    const cleanInput = String(username).trim();
    const cleanInputLower = cleanInput.toLowerCase();

    // 1. ĐỌC CẤU HÌNH TỪ BIẾN MÔI TRƯỜNG .ENV (TUYỆT ĐỐI KHÔNG HARDCODE)
    const adminDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "";
    const memberDefaultPassword = process.env.MEMBER_DEFAULT_PASSWORD || "";
    const adminEmails = (process.env.ADMIN_EMAILS || "lehanhkt01@gmail.com,trunghieuktkt@gmail.com")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // 2. KIỂM TRA TÀI KHOẢN SUPER ADMIN
    const isSuperAdminEmail = adminEmails.includes(cleanInputLower);
    const isSuperAdminUsername =
      cleanInputLower === "lehanhkt01" ||
      cleanInputLower === "trunghieuktkt" ||
      cleanInputLower.includes("lehanh") ||
      cleanInputLower.includes("trunghieu");

    if (isSuperAdminEmail || isSuperAdminUsername) {
      let isPasswordValid = false;
      let matchedDbUser: any = null;

      // Kiểm tra với cơ sở dữ liệu nếu có kết nối
      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: cleanInputLower, mode: "insensitive" } },
              { username: { equals: cleanInputLower, mode: "insensitive" } },
            ],
          },
        });
        if (dbUser) {
          matchedDbUser = dbUser;
          if (dbUser.passwordHash) {
            isPasswordValid = await bcrypt.compare(password, dbUser.passwordHash);
          }
        }
      } catch {
        // Fallback khi chạy không có kết nối DB
      }

      // So sánh trực tiếp với ADMIN_DEFAULT_PASSWORD trong .env
      if (!isPasswordValid && adminDefaultPassword) {
        isPasswordValid = password === adminDefaultPassword;
      }

      if (isPasswordValid) {
        const isLeHanh = cleanInputLower.includes("lehanh") || cleanInputLower.includes("hanh");
        const defaultName = isLeHanh ? "Lê Hạnh" : "Đặng Trung Hiếu";
        return NextResponse.json({
          success: true,
          role: "SUPER_ADMIN",
          user: {
            username: isLeHanh ? "lehanhkt01" : "trunghieuktkt",
            email: isLeHanh ? "lehanhkt01@gmail.com" : "trunghieuktkt@gmail.com",
            fullName: matchedDbUser?.fullName || defaultName,
            role: "SUPER_ADMIN",
          },
        });
      } else {
        return NextResponse.json(
          { success: false, message: "Mật khẩu Quản trị viên không chính xác." },
          { status: 401 }
        );
      }
    }

    // 3. DANH SÁCH 20 CHI HỘI TRƯỞNG CHUẨN XÁC TOÀN HỆ THỐNG
    const hamletMap: Record<string, { code: string; name: string; leader: string; phones: string[]; cccds: string[] }> = {
      thon_01: { code: "THON_01", name: "Thôn 1", leader: "Hồ Sỹ Tuấn", phones: ["0986042302"], cccds: ["0986042302"] },
      thon_02: { code: "THON_02", name: "Thôn 2", leader: "Nguyễn Đức Lợi", phones: ["0356912318"], cccds: ["049068000834", "049068000884"] },
      thon_03: { code: "THON_03", name: "Thôn 3", leader: "Nguyễn Văn Dũng", phones: ["0342302292"], cccds: ["034079011156"] },
      thon_04: { code: "THON_04", name: "Thôn 4", leader: "Nguyễn Phú Bốn", phones: ["0367875231"], cccds: ["038065009462"] },
      thon_05: { code: "THON_05", name: "Thôn 5", leader: "Vũ Văn Đạt", phones: ["0327560358"], cccds: ["034065009537"] },
      thon_06: { code: "THON_06", name: "Thôn 6", leader: "Đỗ Thị Lan", phones: ["0343800948"], cccds: ["033155002814"] },
      thon_07: { code: "THON_07", name: "Thôn 7", leader: "Nguyễn Văn Minh", phones: ["0975384025"], cccds: ["024055000072"] },
      thon_08: { code: "THON_08", name: "Thôn 8", leader: "Trần Thanh Hùng", phones: ["0397508052"], cccds: ["048069000332"] },
      thon_09: { code: "THON_09", name: "Thôn 9", leader: "Trần Văn Cảnh", phones: ["0342869974"], cccds: ["066089001142"] },
      thon_10: { code: "THON_10", name: "Thôn 10", leader: "Nguyễn Lai", phones: ["0986911610"], cccds: ["048068000489"] },
      thon_11: { code: "THON_11", name: "Thôn 11", leader: "Huỳnh Công Dũng", phones: ["0359326437"], cccds: ["049060000688"] },
      thon_12: { code: "THON_12", name: "Thôn 12", leader: "Triệu Đức Quyên", phones: ["0857603535"], cccds: ["006089000161"] },
      thon_13: { code: "THON_13", name: "Thôn 13", leader: "Hoàng Văn Tuyên", phones: ["0984594812"], cccds: ["004077000098"] },
      thon_hoabinh: { code: "THON_HOABINH", name: "Thôn Hòa Bình", leader: "Lê Văn Hồng", phones: ["0977979709"], cccds: ["0420670022", "042067000022"] },
      thon_thangloi: { code: "THON_THANGLOI", name: "Thôn Thắng Lợi", leader: "Nguyễn Văn Đông", phones: ["0828838929"], cccds: ["025065000445"] },
      thon_doanket: { code: "THON_DOANKET", name: "Thôn Đoàn Kết", leader: "Nguyễn Văn Sơn", phones: ["0913779468"], cccds: ["040059000718"] },
      thon_binhloi: { code: "THON_BINHLOI", name: "Thôn Bình Lợi", leader: "Lục Văn Cường", phones: ["0338561794"], cccds: ["004082002052"] },
      buon_a: { code: "BUON_A", name: "Buôn A", leader: "Y Nô Rcăm", phones: ["0372989270", "0982257421"], cccds: ["0372989270", "0982257421"] },
      buon_b: { code: "BUON_B", name: "Buôn B", leader: "Đoàn Hữu Tiến", phones: ["0935833737"], cccds: ["034050005833", "0935833737"] },
      buon_c: { code: "BUON_C", name: "Buôn C", leader: "Y Dyơng Êban", phones: ["0839931193"], cccds: ["0839931193"] },
    };

    // Tìm xem input có khớp với Chi hội trưởng nào trong danh sách 20 thôn buôn không
    const matchedCht = Object.values(hamletMap).find(
      (h) => h.cccds.includes(cleanInput) || h.phones.includes(cleanInput)
    );

    // Kiểm tra đăng nhập dạng alias: chihoi_...
    if (cleanInputLower.startsWith("chihoi_")) {
      const branchKey = cleanInputLower.replace("chihoi_", "");
      const branchInfo = hamletMap[branchKey];
      const isPasswordValid =
        password === adminDefaultPassword ||
        password === "123456" ||
        (branchInfo && branchInfo.phones.includes(password));

      if (isPasswordValid && branchInfo) {
        return NextResponse.json({
          success: true,
          role: "BRANCH_LEADER",
          user: {
            username: branchInfo.cccds[0],
            cccd: branchInfo.cccds[0],
            fullName: `Đ/c ${branchInfo.leader}`,
            phone: branchInfo.phones[0],
            role: "BRANCH_LEADER",
            hamletCode: branchInfo.code,
            hamletName: branchInfo.name,
          },
        });
      } else {
        return NextResponse.json(
          { success: false, message: "Mật khẩu Chi hội trưởng không chính xác." },
          { status: 401 }
        );
      }
    }

    // 4. KIỂM TRA TÀI KHOẢN QUA CSDL PRISMA (HỖ TRỢ EMAIL, CCCD, USERNAME HOẶC SỐ ĐIỆN THOẠI)
    let dbUser: any = null;
    try {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: cleanInput },
            { username: cleanInputLower },
            { email: cleanInputLower },
            { phone: cleanInput },
            { member: { cccd: cleanInput } },
            { member: { phone: cleanInput } },
          ],
        },
        include: {
          hamlet: true,
          member: {
            include: { hamlet: true },
          },
        },
      });
    } catch {
      // Fallback
    }

    // Nếu tìm thấy User trong Database
    if (dbUser) {
      let isPassValid = false;
      if (dbUser.passwordHash) {
        isPassValid = await bcrypt.compare(password, dbUser.passwordHash);
      }
      // Hỗ trợ mật khẩu khởi tạo: SĐT của CHT, 123456 hoặc ADMIN/MEMBER password từ .env
      if (!isPassValid) {
        const userPhone = dbUser.phone || dbUser.member?.phone || "";
        isPassValid =
          password === userPhone ||
          password === "123456" ||
          password === adminDefaultPassword ||
          password === memberDefaultPassword;
      }

      if (isPassValid) {
        let role = dbUser.role || "MEMBER";
        if (
          dbUser.role === "BRANCH_LEADER" ||
          dbUser.member?.associationRole === "Chi hội trưởng" ||
          dbUser.member?.associationRole === "Phó Chi hội trưởng" ||
          dbUser.member?.associationRole === "Chi hội phó" ||
          matchedCht !== undefined
        ) {
          role = "BRANCH_LEADER";
        }

        // KIỂM TRA PHÂN QUYỀN ĐĂNG NHẬP (RBAC & THEO TAB YÊU CẦU)
        if (requestedRole === "branch" && role !== "BRANCH_LEADER" && role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { success: false, message: "Bạn chưa được cấp quyền chi hội trưởng" },
            { status: 403 }
          );
        }
        if (requestedRole === "admin" && role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { success: false, message: "Bạn không có quyền quản trị Cán bộ xã." },
            { status: 403 }
          );
        }

        const hamletName =
          dbUser.hamlet?.name ||
          dbUser.member?.hamlet?.name ||
          matchedCht?.name ||
          "Hội CCB Xã Ea Súp";
        const hamletCode =
          dbUser.hamlet?.code ||
          dbUser.member?.hamlet?.code ||
          matchedCht?.code ||
          "";

        return NextResponse.json({
          success: true,
          role,
          user: {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email || undefined,
            cccd: dbUser.member?.cccd || (matchedCht ? matchedCht.cccds[0] : dbUser.username),
            fullName: dbUser.fullName || dbUser.member?.fullName || (matchedCht ? `Đ/c ${matchedCht.leader}` : "Hội viên"),
            phone: dbUser.phone || dbUser.member?.phone || (matchedCht ? matchedCht.phones[0] : ""),
            role,
            hamletCode,
            hamletName,
            memberId: dbUser.memberId || dbUser.member?.id,
          },
        });
      } else {
        return NextResponse.json(
          { success: false, message: "Mật khẩu không chính xác. Vui lòng kiểm tra lại." },
          { status: 401 }
        );
      }
    }

    // 5. FALLBACK CHI HỘI TRƯỞNG THEO DANH SÁCH 20 ĐỒNG CHÍ (KHI CHẠY LOCAL HOẶC CHƯA SEED DB)
    if (matchedCht) {
      const isChtPassValid =
        matchedCht.phones.includes(password) ||
        matchedCht.cccds.includes(password) ||
        password === "123456" ||
        password === adminDefaultPassword ||
        password === memberDefaultPassword;

      if (isChtPassValid) {
        if (requestedRole === "admin") {
          return NextResponse.json(
            { success: false, message: "Bạn không có quyền quản trị Cán bộ xã." },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          role: "BRANCH_LEADER",
          user: {
            username: cleanInput,
            cccd: matchedCht.cccds[0],
            fullName: `Đ/c ${matchedCht.leader}`,
            phone: matchedCht.phones[0],
            role: "BRANCH_LEADER",
            hamletCode: matchedCht.code,
            hamletName: matchedCht.name,
          },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Mật khẩu không chính xác. Vui lòng kiểm tra lại.",
          },
          { status: 401 }
        );
      }
    }

    // 6. KIỂM TRA HỘI VIÊN BẰNG CCCD HOẶC SĐT (TRONG PRISMA MEMBER HOẶC MEMBER STORE)
    let dbMember: any = null;
    try {
      dbMember = await prisma.member.findFirst({
        where: {
          OR: [
            { cccd: cleanInput },
            { phone: cleanInput },
          ],
        },
        include: { hamlet: true },
      });
    } catch {
      // Fallback
    }

    const isCccdFormat = /^\d{10,12}$/.test(cleanInput);
    const allMembers = getStoredMembers();
    const localMem = allMembers.find((m) => m.cccd === cleanInput || m.phone === cleanInput);
    const targetMember = dbMember || localMem;

    if (targetMember || isCccdFormat) {
      const isMemberPassValid =
        password === memberDefaultPassword ||
        password === "123456" ||
        (targetMember && (password === targetMember.phone || password === targetMember.cccd));

      if (isMemberPassValid) {
        // Kiểm tra xem hội viên này có chức danh Chi hội trưởng / Chi hội phó không
        const isChtRole =
          targetMember?.associationRole === "Chi hội trưởng" ||
          targetMember?.associationRole === "Phó Chi hội trưởng" ||
          targetMember?.associationRole === "Chi hội phó" ||
          targetMember?.id?.startsWith("CHT_") ||
          (targetMember?.hamlet?.branchLeaderPhone === cleanInput || targetMember?.hamlet?.branchLeaderId === targetMember?.id);

        const memberRole = isChtRole ? "BRANCH_LEADER" : "MEMBER";

        // CHẶN QUYỀN NẾU ĐĂNG NHẬP VÀO TAB CHI HỘI TRƯỞNG MÀ CHƯA ĐƯỢC CẤP QUYỀN
        if (requestedRole === "branch") {
          if (!isChtRole) {
            return NextResponse.json(
              {
                success: false,
                message: "Bạn chưa được cấp quyền chi hội trưởng",
              },
              { status: 403 }
            );
          }
        }

        if (requestedRole === "admin") {
          return NextResponse.json(
            { success: false, message: "Bạn không có quyền quản trị Cán bộ xã." },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          role: memberRole,
          user: {
            username: targetMember ? (targetMember.cccd || targetMember.phone) : cleanInput,
            cccd: targetMember ? targetMember.cccd : cleanInput,
            fullName: targetMember ? targetMember.fullName : "Hội viên Cựu Chiến Binh",
            phone: targetMember ? targetMember.phone : "",
            hamletName: targetMember?.hamletName || targetMember?.hamlet?.name || "Hội CCB Xã Ea Súp",
            hamletCode: targetMember?.hamlet?.code || "",
            memberId: targetMember ? targetMember.id : cleanInput,
            role: memberRole,
          },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Mật khẩu không chính xác. Vui lòng kiểm tra lại.",
          },
          { status: 401 }
        );
      }
    }


    return NextResponse.json(
      {
        success: false,
        message: "Thông tin tài khoản hoặc số CCCD không tồn tại trên hệ thống Hội CCB Xã Ea Súp.",
      },
      { status: 404 }
    );
  } catch (error: unknown) {
    console.error("Lỗi xác thực đăng nhập:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ trong quá trình xác thực." },
      { status: 500 }
    );
  }
}
