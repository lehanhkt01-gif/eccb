import { NextResponse } from "next/server";
import { cleanupHamlets } from "@/lib/cleanupHamlets";

export async function POST() {
  try {
    const hamlets = await cleanupHamlets();
    return NextResponse.json({
      success: true,
      message: `Đã dọn dẹp và đồng bộ thành công ${hamlets.length} thôn buôn chuẩn của xã Ea Súp.`,
      count: hamlets.length,
      hamlets: hamlets.map((h) => ({ code: h.code, name: h.name })),
    });
  } catch (error: any) {
    console.error("Lỗi dọn dẹp thôn buôn:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
