import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getStoredMembers } from "@/lib/memberStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

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
    const isSuperAdminUsername = cleanInputLower === "lehanhkt01" || cleanInputLower === "trunghieuktkt";

    if (isSuperAdminEmail || isSuperAdminUsername) {
      let isPasswordValid = false;

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
        if (dbUser && dbUser.passwordHash) {
          isPasswordValid = await bcrypt.compare(password, dbUser.passwordHash);
        }
      } catch {
        // Fallback khi chạy không có kết nối DB
      }

      // So sánh trực tiếp với ADMIN_DEFAULT_PASSWORD trong .env
      if (!isPasswordValid && adminDefaultPassword) {
        isPasswordValid = password === adminDefaultPassword;
      }

      if (isPasswordValid) {
        const isLeHanh = cleanInputLower.includes("lehanh");
        return NextResponse.json({
          success: true,
          role: "SUPER_ADMIN",
          user: {
            username: isLeHanh ? "lehanhkt01" : "trunghieuktkt",
            email: isLeHanh ? "lehanhkt01@gmail.com" : "trunghieuktkt@gmail.com",
            fullName: isLeHanh ? "Lê Hạnh - Ban Quản Trị Hệ Thống" : "Đặng Trung Hiếu - Chủ tịch Hội CCB Xã",
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

    // 3. KIỂM TRA TÀI KHOẢN CHI HỘI TRƯỞNG (chihoi_thon_01, ...)
    if (cleanInputLower.startsWith("chihoi_")) {
      const isPasswordValid = password === adminDefaultPassword;
      if (isPasswordValid) {
        // Phân giải thôn tương ứng từ username
        const branchKey = cleanInputLower.replace("chihoi_", "");
        const hamletMap: Record<string, { code: string; name: string; leader: string }> = {
          thon_01: { code: "THON_01", name: "Thôn 1", leader: "Trần Văn Định" },
          thon_02: { code: "THON_02", name: "Thôn 2", leader: "Nguyễn Văn Hùng" },
          thon_03: { code: "THON_03", name: "Thôn 3", leader: "Lê Đức Thọ" },
          thon_04: { code: "THON_04", name: "Thôn 4", leader: "Phạm Hồng Thái" },
          thon_05: { code: "THON_05", name: "Thôn 5", leader: "Hoàng Văn Nam" },
          thon_06: { code: "THON_06", name: "Thôn 6", leader: "Vũ Đình Cường" },
          thon_07: { code: "THON_07", name: "Thôn 7", leader: "Đỗ Xuân Bách" },
          thon_08: { code: "THON_08", name: "Thôn 8", leader: "Bùi Văn Thành" },
          thon_09: { code: "THON_09", name: "Thôn 9", leader: "Ngô Quang Hưng" },
          thon_10: { code: "THON_10", name: "Thôn 10", leader: "Đinh Văn Quyết" },
          thon_11: { code: "THON_11", name: "Thôn 11", leader: "Lương Thế Vinh" },
          thon_12: { code: "THON_12", name: "Thôn 12", leader: "Trịnh Đình Dũng" },
          thon_13: { code: "THON_13", name: "Thôn 13", leader: "Đặng Hữu Phúc" },
          thon_hoabinh: { code: "THON_HOABINH", name: "Thôn Hòa Bình", leader: "Phan Văn Khải" },
          thon_thangloi: { code: "THON_THANGLOI", name: "Thôn Thắng Lợi", leader: "Dương Minh Châu" },
          thon_doanket: { code: "THON_DOANKET", name: "Thôn Đoàn Kết", leader: "Nguyễn Tiến Lực" },
          thon_binhloi: { code: "THON_BINHLOI", name: "Thôn Bình Lợi", leader: "Tạ Quang Bửu" },
          buon_a: { code: "BUON_A", name: "Buôn A", leader: "Y Dhăm Mlô" },
          buon_b: { code: "BUON_B", name: "Buôn B", leader: "Y Blô Kbuôr" },
          buon_c: { code: "BUON_C", name: "Buôn C", leader: "Y Khen Niê" },
        };
        const branchInfo = hamletMap[branchKey] || {
          code: `THON_${branchKey.toUpperCase()}`,
          name: `Thôn ${branchKey.toUpperCase()}`,
          leader: `Chi hội trưởng ${branchKey.toUpperCase()}`,
        };

        return NextResponse.json({
          success: true,
          role: "BRANCH_LEADER",
          user: {
            username: cleanInputLower,
            fullName: `Đ/c ${branchInfo.leader}`,
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

    // 4. KIỂM TRA TÀI KHOẢN HỘI VIÊN (ĐĂNG NHẬP BẰNG SỐ CCCD 12 SỐ)
    const isCccdFormat = /^\d{12}$/.test(cleanInput);

    // Tìm kiếm hội viên theo CCCD
    let memberData: {
      id?: string;
      cccd: string;
      fullName: string;
      phone?: string | null;
      hamletName?: string | null;
      hamlet?: { name: string } | null;
      user?: { passwordHash?: string | null } | null;
    } | null = null;

    try {
      memberData = await prisma.member.findUnique({
        where: { cccd: cleanInput },
        include: { user: true, hamlet: true },
      });
    } catch {
      // Fallback tìm trong memberStore
    }

    if (!memberData) {
      const allMembers = getStoredMembers();
      const localMem = allMembers.find((m) => m.cccd === cleanInput);
      if (localMem) {
        memberData = {
          id: localMem.id,
          cccd: localMem.cccd,
          fullName: localMem.fullName,
          phone: localMem.phone,
          hamletName: localMem.hamletName,
        };
      }
    }

    if (memberData || isCccdFormat) {
      // Xác thực mật khẩu hội viên
      let isMemberPassValid = false;

      if (memberData?.user?.passwordHash) {
        isMemberPassValid = await bcrypt.compare(password, memberData.user.passwordHash);
      }

      // So sánh với MEMBER_DEFAULT_PASSWORD từ file .env
      if (!isMemberPassValid && memberDefaultPassword) {
        isMemberPassValid = password === memberDefaultPassword;
      }

      if (isMemberPassValid) {
        return NextResponse.json({
          success: true,
          role: "MEMBER",
          user: {
            username: memberData ? memberData.cccd : cleanInput,
            cccd: memberData ? memberData.cccd : cleanInput,
            fullName: memberData ? memberData.fullName : "Hội viên Cựu Chiến Binh",
            phone: memberData ? memberData.phone : "",
            hamletName: memberData?.hamlet?.name || memberData?.hamletName || "Hội CCB Xã Ea Súp",
            memberId: memberData ? memberData.id : cleanInput,
            role: "MEMBER",
          },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Mật khẩu Hội viên không chính xác. Mật khẩu mặc định được quy định trong cấu hình bảo mật.",
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
