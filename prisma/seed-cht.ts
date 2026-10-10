import { PrismaClient } from "@prisma/client";
import { seedBranchLeaders } from "./seed";

const prisma = new PrismaClient();

async function run() {
  console.log("🚀 Bắt đầu cập nhật 20 Chi hội trưởng chuẩn xác cho E-CCB Ea Súp...");
  try {
    await seedBranchLeaders();
    console.log("🎉 Hoàn tất nạp 20 Chi hội trưởng vào CSDL thành công!");
  } catch (error) {
    console.error("❌ Lỗi khi nạp Chi hội trưởng:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
