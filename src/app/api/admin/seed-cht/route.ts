import { NextResponse } from "next/server";
import { PrismaClient, Role, MemberStatus, RegistrationStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CHT_LIST = [
  {
    hamletName: "Buôn A",
    fullName: "Y Nô Rcăm",
    dob: "1986-03-17",
    hometown: "Xã Ea Súp, tỉnh Đắk Lắk",
    cccd: "0982257421",
    phone: "0982257421",
  },
  {
    hamletName: "Buôn B",
    fullName: "Đoàn Hữu Tiến",
    dob: "1950-03-20",
    hometown: "Xã Tây Thái Ninh, tỉnh Hưng Yên",
    cccd: "034050005833",
    phone: "0935833737",
  },
  {
    hamletName: "Buôn C",
    fullName: "Y Dyơng Êban",
    dob: "1993-06-15",
    hometown: "Xã Ea Súp, tỉnh Đắk Lắk",
    cccd: "0839931193",
    phone: "0839931193",
  },
  {
    hamletName: "Thôn Hòa Bình",
    fullName: "Lê Văn Hồng",
    dob: "1967-01-01",
    hometown: "Huyện Cẩm Xuyên, tỉnh Hà Tĩnh",
    cccd: "0420670022",
    phone: "0977979709",
  },
  {
    hamletName: "Thôn Thắng Lợi",
    fullName: "Nguyễn Văn Đông",
    dob: "1965-05-19",
    hometown: "Huyện Cẩm Khê, tỉnh Phú Thọ",
    cccd: "025065000445",
    phone: "0828838929",
  },
  {
    hamletName: "Thôn Đoàn Kết",
    fullName: "Nguyễn Văn Sơn",
    dob: "1959-06-20",
    hometown: "Xã Kim Liên, huyện Nam Đàn, tỉnh Nghệ An",
    cccd: "040059000718",
    phone: "0913779468",
  },
  {
    hamletName: "Thôn Bình Lợi",
    fullName: "Lục Văn Cường",
    dob: "1982-06-04",
    hometown: "Huyện Thông Nông, tỉnh Cao Bằng",
    cccd: "004082002052",
    phone: "0338561794",
  },
  {
    hamletName: "Thôn 1",
    fullName: "Hồ Sỹ Tuấn",
    dob: "1964-10-15",
    hometown: "Xã Quỳnh Hậu, huyện Quỳnh Lưu, tỉnh Nghệ An",
    cccd: "0986042302",
    phone: "0986042302",
  },
  {
    hamletName: "Thôn 2",
    fullName: "Nguyễn Đức Lợi",
    dob: "1968-05-21",
    hometown: "Huyện Thăng Bình, tỉnh Quảng Nam",
    cccd: "049068000884",
    phone: "0356912318",
  },
  {
    hamletName: "Thôn 3",
    fullName: "Nguyễn Văn Dũng",
    dob: "1979-02-20",
    hometown: "Vũ Thư, tỉnh Thái Bình",
    cccd: "034079011156",
    phone: "0342302292",
  },
  {
    hamletName: "Thôn 4",
    fullName: "Nguyễn Phú Bốn",
    dob: "1965-05-18",
    hometown: "Thọ Xuân, tỉnh Thanh Hóa",
    cccd: "038065009462",
    phone: "0367875231",
  },
  {
    hamletName: "Thôn 5",
    fullName: "Vũ Văn Đạt",
    dob: "1965-07-14",
    hometown: "Xã Vũ Phúc, TP. Thái Bình, tỉnh Thái Bình",
    cccd: "034065009537",
    phone: "0327560358",
  },
  {
    hamletName: "Thôn 6",
    fullName: "Đỗ Thị Lan",
    dob: "1955-10-20",
    hometown: "Kim Động, tỉnh Hưng Yên",
    cccd: "033155002814",
    phone: "0343800948",
  },
  {
    hamletName: "Thôn 7",
    fullName: "Nguyễn Văn Minh",
    dob: "1955-10-14",
    hometown: "Hiệp Hòa, tỉnh Bắc Giang",
    cccd: "024055000072",
    phone: "0975384025",
  },
  {
    hamletName: "Thôn 8",
    fullName: "Trần Thanh Hùng",
    dob: "1969-10-10",
    hometown: "Quận Ngũ Hành Sơn, TP. Đà Nẵng",
    cccd: "048069000332",
    phone: "0397508052",
  },
  {
    hamletName: "Thôn 9",
    fullName: "Trần Văn Cảnh",
    dob: "1989-06-14",
    hometown: "Xã Ea Súp, tỉnh Đắk Lắk (Chi hội 5 cũ)",
    cccd: "066089001142",
    phone: "0342869974",
  },
  {
    hamletName: "Thôn 10",
    fullName: "Nguyễn Lai",
    dob: "1968-06-10",
    hometown: "Tây Hồ, TP. Đà Nẵng",
    cccd: "048068000489",
    phone: "0986911610",
  },
  {
    hamletName: "Thôn 11",
    fullName: "Huỳnh Công Dũng",
    dob: "1960-01-01",
    hometown: "Huyện Thăng Bình, tỉnh Quảng Nam",
    cccd: "049060000688",
    phone: "0359326437",
  },
  {
    hamletName: "Thôn 12",
    fullName: "Triệu Đức Quyên",
    dob: "1989-06-05",
    hometown: "Tỉnh Cao Bằng (Chi hội 15 cũ)",
    cccd: "006089000161",
    phone: "0857603535",
  },
  {
    hamletName: "Thôn 13",
    fullName: "Hoàng Văn Tuyên",
    dob: "1977-04-24",
    hometown: "Xã Trường Hà, huyện Hà Quảng, tỉnh Cao Bằng",
    cccd: "004077000098",
    phone: "0984594812",
  },
];

async function executeSeed() {
  const logs: string[] = [];

  // 1. Xóa các tài khoản CHT cũ
  const deleted = await prisma.user.deleteMany({
    where: { role: Role.BRANCH_LEADER },
  });
  logs.push(`Đã dọn dẹp ${deleted.count} tài khoản Chi hội trưởng cũ.`);

  // 2. Nạp 20 CHT thực tế
  for (const item of CHT_LIST) {
    const hamlet = await prisma.hamlet.findFirst({
      where: {
        name: { contains: item.hamletName, mode: "insensitive" },
      },
    });

    if (!hamlet) {
      logs.push(`⚠️ Không tìm thấy thôn/buôn: ${item.hamletName}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(item.phone, 10);

    // Upsert hồ sơ Member
    const member = await prisma.member.upsert({
      where: { cccd: item.cccd },
      update: {
        fullName: item.fullName,
        birthDate: new Date(item.dob),
        hometown: item.hometown,
        phone: item.phone,
        hamletId: hamlet.id,
        associationRole: "Chi hội trưởng",
        status: MemberStatus.ACTIVE,
        registrationStatus: RegistrationStatus.APPROVED,
        branchApproved: true,
        adminApproved: true,
      },
      create: {
        cccd: item.cccd,
        idCardNumber: item.cccd,
        fullName: item.fullName,
        birthDate: new Date(item.dob),
        hometown: item.hometown,
        phone: item.phone,
        hamletId: hamlet.id,
        associationRole: "Chi hội trưởng",
        status: MemberStatus.ACTIVE,
        registrationStatus: RegistrationStatus.APPROVED,
        branchApproved: true,
        adminApproved: true,
      },
    });

    // Upsert User theo số CCCD
    await prisma.user.upsert({
      where: { username: item.cccd },
      update: {
        fullName: item.fullName,
        role: Role.BRANCH_LEADER,
        hamletId: hamlet.id,
        memberId: member.id,
        phone: item.phone,
        passwordHash,
        isActive: true,
      },
      create: {
        username: item.cccd,
        passwordHash,
        fullName: item.fullName,
        phone: item.phone,
        role: Role.BRANCH_LEADER,
        hamletId: hamlet.id,
        memberId: member.id,
        isActive: true,
      },
    });

    // Upsert alias username chihoi_...
    const aliasUsername = `chihoi_${hamlet.code.toLowerCase()}`;
    await prisma.user.upsert({
      where: { username: aliasUsername },
      update: {
        fullName: item.fullName,
        role: Role.BRANCH_LEADER,
        hamletId: hamlet.id,
        memberId: member.id,
        phone: item.phone,
        passwordHash,
        isActive: true,
      },
      create: {
        username: aliasUsername,
        passwordHash,
        fullName: item.fullName,
        email: `${aliasUsername}@easupso.com`,
        phone: item.phone,
        role: Role.BRANCH_LEADER,
        hamletId: hamlet.id,
        memberId: member.id,
        isActive: true,
      },
    });

    // Cập nhật thông tin vào Hamlet
    await prisma.hamlet.update({
      where: { id: hamlet.id },
      data: {
        branchLeaderName: item.fullName,
        branchLeaderPhone: item.phone,
        branchLeaderId: member.id,
      },
    });

    logs.push(`✓ Nạp thành công: ${item.fullName} - ${item.hamletName} (CCCD/User: ${item.cccd}, Mật khẩu: ${item.phone})`);
  }

  return logs;
}

export async function POST() {
  try {
    const logs = await executeSeed();
    return NextResponse.json({
      success: true,
      message: "Đã nạp thành công 20 Chi hội trưởng vào CSDL!",
      logs,
    });
  } catch (error: unknown) {
    console.error("Lỗi khi nạp Chi hội trưởng:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi thực thi seed", error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  // Cho phép gọi GET trực tiếp qua trình duyệt để kích hoạt thuận tiện
  return POST();
}
