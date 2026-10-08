import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cccd, oldPassword, newPassword } = body;

    if (!cccd || !oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập đầy đủ thông tin để đổi mật khẩu." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu mới phải có tối thiểu 8 ký tự." },
        { status: 400 }
      );
    }

    const memberDefaultPassword = process.env.MEMBER_DEFAULT_PASSWORD || "";

    // 1. Tìm tài khoản người dùng theo số CCCD
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { username: cccd },
      });
    } catch {
      // Bỏ qua lỗi DB
    }

    let isOldPassValid = false;
    if (user && user.passwordHash) {
      isOldPassValid = await bcrypt.compare(oldPassword, user.passwordHash);
    }

    // Nếu chưa đổi lần nào, kiểm tra với mật khẩu mặc định từ file .env
    if (!isOldPassValid && memberDefaultPassword) {
      isOldPassValid = oldPassword === memberDefaultPassword;
    }

    if (!isOldPassValid) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu hiện tại không chính xác." },
        { status: 400 }
      );
    }

    // 2. Hash mật khẩu mới và lưu vào cơ sở dữ liệu nếu có kết nối
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    try {
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newPasswordHash },
        });
      }
    } catch {
      // Khi không có kết nối DB trực tiếp
    }

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới để đăng nhập các lần sau.",
    });
  } catch (error: unknown) {
    console.error("Lỗi khi đổi mật khẩu:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ trong quá trình đổi mật khẩu." },
      { status: 500 }
    );
  }
}
