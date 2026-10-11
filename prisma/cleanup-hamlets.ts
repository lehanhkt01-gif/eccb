import { cleanupHamlets } from "../src/lib/cleanupHamlets";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("🚀 Bắt đầu dọn dẹp và chuẩn hóa 20 thôn buôn trong CSDL...");
  try {
    await cleanupHamlets();
    console.log("🎉 Hoàn tất dọn dẹp!");
  } catch (err) {
    console.error("❌ Lỗi:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
