import { PrismaClient, Role, MemberStatus, RegistrationStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const VALID_20_CHT = [
  { hamletName: "Buôn A", fullName: "Y Nô Rcăm", cccd: "0982257421", phone: "0982257421", dob: "1986-03-17" },
  { hamletName: "Buôn B", fullName: "Đoàn Hữu Tiến", cccd: "034050005833", phone: "0935833737", dob: "1950-03-20" },
  { hamletName: "Buôn C", fullName: "Y Dyơng Êban", cccd: "0839931193", phone: "0839931193", dob: "1993-06-15" },
  { hamletName: "Thôn Hòa Bình", fullName: "Lê Văn Hồng", cccd: "0420670022", phone: "0977979709", dob: "1967-01-01" },
  { hamletName: "Thôn Thắng Lợi", fullName: "Nguyễn Văn Đông", cccd: "025065000445", phone: "0828838929", dob: "1965-05-19" },
  { hamletName: "Thôn Đoàn Kết", fullName: "Nguyễn Văn Sơn", cccd: "040059000718", phone: "0913779468", dob: "1959-06-20" },
  { hamletName: "Thôn Bình Lợi", fullName: "Lục Văn Cường", cccd: "004082002052", phone: "0338561794", dob: "1982-06-04" },
  { hamletName: "Thôn 1", fullName: "Hồ Sỹ Tuấn", cccd: "0986042302", phone: "0986042302", dob: "1964-10-15" },
  { hamletName: "Thôn 2", fullName: "Nguyễn Đức Lợi", cccd: "049068000884", phone: "0356912318", dob: "1968-05-21" },
  { hamletName: "Thôn 3", fullName: "Nguyễn Văn Dũng", cccd: "034079011156", phone: "0342302292", dob: "1979-02-20" },
  { hamletName: "Thôn 4", fullName: "Nguyễn Phú Bốn", cccd: "038065009462", phone: "0367875231", dob: "1965-05-18" },
  { hamletName: "Thôn 5", fullName: "Vũ Văn Đạt", cccd: "034065009537", phone: "0327560358", dob: "1965-07-14" },
  { hamletName: "Thôn 6", fullName: "Đỗ Thị Lan", cccd: "033155002814", phone: "0343800948", dob: "1955-10-20" },
  { hamletName: "Thôn 7", fullName: "Nguyễn Văn Minh", cccd: "024055000072", phone: "0975384025", dob: "1955-10-14" },
  { hamletName: "Thôn 8", fullName: "Trần Thanh Hùng", cccd: "048069000332", phone: "0397508052", dob: "1969-10-10" },
  { hamletName: "Thôn 9", fullName: "Trần Văn Cảnh", cccd: "066089001142", phone: "0342869974", dob: "1989-06-14" },
  { hamletName: "Thôn 10", fullName: "Nguyễn Lai", cccd: "048068000489", phone: "0986911610", dob: "1968-06-10" },
  { hamletName: "Thôn 11", fullName: "Huỳnh Công Dũng", cccd: "049060000688", phone: "0359326437", dob: "1960-01-01" },
  { hamletName: "Thôn 12", fullName: "Triệu Đức Quyên", cccd: "006089000161", phone: "0857603535", dob: "1989-06-05" },
  { hamletName: "Thôn 13", fullName: "Hoàng Văn Tuyên", cccd: "004077000098", phone: "0984594812", dob: "1977-04-24" },
];

export async function cleanupAndSyncDB() {
  console.log("=== BẮT ĐẦU DỌN DẸP HỘI VIÊN ẢO & ĐỒNG BỘ 20 CHT CHUẨN XÁC ===");

  const validCccds = VALID_20_CHT.map((c) => c.cccd);
  const validPhones = VALID_20_CHT.map((c) => c.phone);

  // 1. XÓA BẢN GHI HỘI VIÊN ẢO ĐẶNG HỮU PHÚC VÀ CÁC CHT ẢO CŨ
  console.log("1. Xóa các tài khoản Chi hội trưởng ảo không thuộc 20 CHT thực tế...");
  await prisma.user.deleteMany({
    where: {
      role: Role.BRANCH_LEADER,
      NOT: {
        username: { in: [...validCccds, ...validPhones] },
      },
    },
  });

  await prisma.member.deleteMany({
    where: {
      OR: [
        { fullName: "Đặng Hữu Phúc" },
        { cccd: "066067000113" },
        {
          associationRole: "Chi hội trưởng",
          NOT: {
            cccd: { in: validCccds },
          },
        },
      ],
    },
  });

  // 2. KHỬ TRÙNG LẶP (DEDUPLICATE) TRONG BẢNG MEMBER
  console.log("2. Quét và loại bỏ các bản ghi trùng lặp CCCD trong bảng Member...");
  const allMembers = await prisma.member.findMany({
    orderBy: { createdAt: "asc" },
  });

  const seenCccd = new Set<string>();
  const duplicatesToDelete: string[] = [];

  for (const m of allMembers) {
    if (seenCccd.has(m.cccd)) {
      duplicatesToDelete.push(m.id);
    } else {
      seenCccd.add(m.cccd);
    }
  }

  if (duplicatesToDelete.length > 0) {
    console.log(`- Đang xóa ${duplicatesToDelete.length} bản ghi bị trùng lặp CCCD...`);
    await prisma.member.deleteMany({
      where: {
        id: { in: duplicatesToDelete },
      },
    });
  }

  // 3. GÁN CỨNG VÀ ĐỒNG BỘ CHUẨN XÁC 20 CHI HỘI TRƯỞNG VÀO THÔN CỦA MÌNH
  console.log("3. Gán cứng 20 Chi hội trưởng vào đúng duy nhất thôn buôn của mình...");
  const salt = await bcrypt.genSalt(10);

  for (const item of VALID_20_CHT) {
    // Tìm hoặc tạo Thôn buôn chuẩn
    let hamlet = await prisma.hamlet.findFirst({
      where: { name: item.hamletName },
    });

    if (!hamlet) {
      hamlet = await prisma.hamlet.create({
        data: {
          code: item.hamletName.toUpperCase().replace(/\s+/g, "_"),
          name: item.hamletName,
          branchLeaderName: item.fullName,
          branchLeaderPhone: item.phone,
        },
      });
    } else {
      // Cập nhật thông tin leader của thôn
      await prisma.hamlet.update({
        where: { id: hamlet.id },
        data: {
          branchLeaderName: item.fullName,
          branchLeaderPhone: item.phone,
        },
      });
    }

    const birthDateObj = new Date(item.dob);

    // Upsert hồ sơ Member
    const member = await prisma.member.upsert({
      where: { cccd: item.cccd },
      update: {
        fullName: item.fullName,
        phone: item.phone,
        hometown: `${item.hamletName}, Xã Ea Súp, Tỉnh Đắk Lắk`,
        birthDate: birthDateObj,
        hamletId: hamlet.id,
        associationRole: "Chi hội trưởng",
        status: MemberStatus.ACTIVE,
        registrationStatus: RegistrationStatus.APPROVED,
      },
      create: {
        cccd: item.cccd,
        idCardNumber: item.cccd,
        fullName: item.fullName,
        birthDate: birthDateObj,
        gender: "Nam",
        hometown: `${item.hamletName}, Xã Ea Súp, Tỉnh Đắk Lắk`,
        ethnicity: item.hamletName.startsWith("Buôn") ? "Ê Đê" : "Kinh",
        religion: "Không",
        hamletId: hamlet.id,
        currentAddress: `${item.hamletName}, Xã Ea Súp, Tỉnh Đắk Lắk`,
        phone: item.phone,
        associationRole: "Chi hội trưởng",
        status: MemberStatus.ACTIVE,
        registrationStatus: RegistrationStatus.APPROVED,
        isHouseholdHead: true,
      },
    });

    // Hash mật khẩu mặc định theo SĐT
    const passwordHash = await bcrypt.hash(item.phone, salt);

    // Upsert tài khoản User cho Chi hội trưởng
    await prisma.user.upsert({
      where: { username: item.cccd },
      update: {
        fullName: item.fullName,
        phone: item.phone,
        role: Role.BRANCH_LEADER,
        memberId: member.id,
        hamletId: hamlet.id,
        isActive: true,
      },
      create: {
        username: item.cccd,
        passwordHash: passwordHash,
        fullName: item.fullName,
        phone: item.phone,
        role: Role.BRANCH_LEADER,
        memberId: member.id,
        hamletId: hamlet.id,
        isActive: true,
      },
    });

    console.log(`✓ Đã đồng bộ Chi hội trưởng: ${item.fullName} -> ${item.hamletName} (CCCD: ${item.cccd})`);
  }

  console.log("=== HOÀN TẤT DỌN DẸP & ĐỒNG BỘ CSDL THÀNH CÔNG ===");
}

if (require.main === module) {
  cleanupAndSyncDB()
    .catch((err) => {
      console.error("Lỗi khi chạy cleanup:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
