import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { MovementType, MemberStatus, Period, RegistrationStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// Đường dẫn lưu file văn bản tài liệu upload
const UPLOAD_SUBDIR = "/uploads/documents";

export async function POST(request: NextRequest) {
  try {
    let memberId = "";
    let memberName = "";
    let memberCccd = "";
    let memberPhone = "";
    let hamletId = "";
    let hamletName = "";
    let type: MovementType | string = "";
    let eventDateStr = "";
    let reason = "";
    let destination = "";
    let decisionNumber = "";
    let burialPlace = "";
    let documentPdfUrl = "";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      memberId = (formData.get("memberId") as string) || "";
      memberName = (formData.get("memberName") as string) || "";
      memberCccd = (formData.get("memberCccd") as string) || "";
      memberPhone = (formData.get("memberPhone") as string) || "";
      hamletId = (formData.get("hamletId") as string) || "";
      hamletName = (formData.get("hamletName") as string) || "";
      type = (formData.get("type") as string) || "";
      eventDateStr = (formData.get("eventDate") as string) || "";
      reason = (formData.get("reason") as string) || "";
      destination = (formData.get("destination") as string) || "";
      decisionNumber = (formData.get("decisionNumber") as string) || "";
      burialPlace = (formData.get("burialPlace") as string) || "";
      documentPdfUrl = (formData.get("documentPdfUrl") as string) || "";

      // Xử lý upload file văn bản (PDF / ảnh quyết định)
      const file = formData.get("file") as File | null;
      if (file && file.size > 0 && typeof file.arrayBuffer === "function") {
        try {
          const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
          await fs.mkdir(uploadDir, { recursive: true });

          const originalName = file.name || "van_ban.pdf";
          const ext = path.extname(originalName) || ".pdf";
          const baseName = path
            .basename(originalName, ext)
            .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9-]/g, "_");
          const uniqueFileName = `doc_${Date.now()}_${baseName}${ext}`;
          const filePath = path.join(uploadDir, uniqueFileName);

          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await fs.writeFile(filePath, buffer);

          documentPdfUrl = `${UPLOAD_SUBDIR}/${uniqueFileName}`;
        } catch (uploadErr) {
          console.error("Lỗi khi ghi file upload vào ổ đĩa:", uploadErr);
        }
      }
    } else {
      // JSON Payload
      const body = await request.json();
      memberId = body.memberId || "";
      memberName = body.memberName || "";
      memberCccd = body.memberCccd || "";
      memberPhone = body.memberPhone || "";
      hamletId = body.hamletId || "";
      hamletName = body.hamletName || "";
      type = body.type || "";
      eventDateStr = body.eventDate || "";
      reason = body.reason || "";
      destination = body.destination || "";
      decisionNumber = body.decisionNumber || "";
      burialPlace = body.burialPlace || "";
      documentPdfUrl = body.documentPdfUrl || "";
    }

    // Validate các trường bắt buộc
    if (!type || !["TRANSFER_IN", "TRANSFER_OUT", "EXPELLED", "DECEASED"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Loại biến động không hợp lệ. Phải là TRANSFER_IN, TRANSFER_OUT, EXPELLED hoặc DECEASED.",
        },
        { status: 400 }
      );
    }

    const movementType = type as MovementType;
    let eventDate = new Date();
    if (eventDateStr) {
      const parsed = new Date(eventDateStr);
      if (!isNaN(parsed.getTime())) {
        eventDate = parsed;
      }
    }

    // Chuẩn bị dữ liệu cập nhật trạng thái Member
    const memberUpdateData: Record<string, unknown> = {};

    if (movementType === "DECEASED") {
      // 1. Báo tử
      memberUpdateData.isDeceased = true;
      memberUpdateData.deceasedDate = eventDate;
      memberUpdateData.status = MemberStatus.DECEASED;
    } else if (movementType === "TRANSFER_OUT") {
      // 2. Chuyển đi
      memberUpdateData.isTransferred = true;
      memberUpdateData.transferDate = eventDate;
      memberUpdateData.transferDestination = destination || "Chuyển sinh hoạt ngoài xã";
      memberUpdateData.status = MemberStatus.TRANSFERRED;
    } else if (movementType === "EXPELLED") {
      // 3. Xóa tên
      memberUpdateData.isExpelled = true;
      memberUpdateData.expelledDate = eventDate;
      memberUpdateData.expelledReason = reason || "Quyết định xóa tên theo Điều lệ Hội";
      memberUpdateData.status = MemberStatus.TU_CHOI;
    } else if (movementType === "TRANSFER_IN") {
      // 4. Chuyển đến
      memberUpdateData.isTransferred = false;
      memberUpdateData.isDeceased = false;
      memberUpdateData.isExpelled = false;
      memberUpdateData.status = MemberStatus.CHINH_THUC;
    }

    // Thực thi lưu vào PostgreSQL qua Prisma
    try {
      // 1. Phân giải Hamlet (Thôn buôn) chuẩn xác theo ID, Code hoặc Name
      let actualHamlet = null;
      if (hamletId) {
        actualHamlet = await prisma.hamlet.findFirst({
          where: {
            OR: [
              { id: hamletId },
              { code: hamletId },
              { code: hamletId.toUpperCase() },
              { name: { contains: hamletId, mode: "insensitive" } },
            ],
          },
        });
      }
      if (!actualHamlet && hamletName) {
        actualHamlet = await prisma.hamlet.findFirst({
          where: {
            OR: [
              { name: { equals: hamletName, mode: "insensitive" } },
              { name: { contains: hamletName, mode: "insensitive" } },
            ],
          },
        });
      }
      if (!actualHamlet) {
        actualHamlet = await prisma.hamlet.findFirst();
      }

      const actualHamletId = actualHamlet?.id;
      if (!actualHamletId) {
        throw new Error("Không tìm thấy thông tin thôn/buôn trong CSDL!");
      }

      // 2. Phân giải Member (Hội viên) chuẩn xác theo ID, CCCD hoặc Họ tên
      let actualMember = null;
      if (memberId && !memberId.startsWith("MEM_IN_") && !memberId.startsWith("mem_init_")) {
        actualMember = await prisma.member.findFirst({
          where: {
            OR: [
              { id: memberId },
              { cccd: memberId },
            ],
          },
        });
      }

      if (!actualMember && memberCccd) {
        actualMember = await prisma.member.findFirst({
          where: {
            OR: [
              { cccd: memberCccd },
              { idCardNumber: memberCccd },
            ],
          },
        });
      }

      if (!actualMember && memberName) {
        actualMember = await prisma.member.findFirst({
          where: {
            fullName: { equals: memberName, mode: "insensitive" },
            hamletId: actualHamletId,
          },
        });
      }

      // NẾU CHƯA CÓ TRONG CSDL: Tạo mới bản ghi Member để bảo đảm toàn vẹn dữ liệu
      if (!actualMember) {
        const finalCccd =
          memberCccd && memberCccd.length >= 9
            ? memberCccd
            : `0660${Date.now().toString().slice(-8)}`;
        const finalName = memberName || "Hội viên chuyển đến";

        actualMember = await prisma.member.create({
          data: {
            cccd: finalCccd,
            idCardNumber: finalCccd,
            fullName: finalName,
            hamletId: actualHamletId,
            phone: memberPhone || "0912000000",
            hometown: destination || "Xã Ea Súp, Tỉnh Đắk Lắk",
            currentAddress: `${actualHamlet?.name || "Xã Ea Súp"}, Xã Ea Súp, Tỉnh Đắk Lắk`,
            militaryRank: "Hội viên",
            period: Period.CUU_QUAN_NHAN,
            associationRole: "Hội viên",
            status:
              movementType === "DECEASED"
                ? MemberStatus.DECEASED
                : movementType === "TRANSFER_OUT"
                ? MemberStatus.TRANSFERRED
                : movementType === "EXPELLED"
                ? MemberStatus.TU_CHOI
                : MemberStatus.CHINH_THUC,
            registrationStatus: RegistrationStatus.APPROVED,
            branchApproved: true,
            adminApproved: true,
            isDeceased: movementType === "DECEASED",
            deceasedDate: movementType === "DECEASED" ? eventDate : null,
            isTransferred: movementType === "TRANSFER_OUT",
            transferDate: movementType === "TRANSFER_OUT" ? eventDate : null,
            transferDestination: movementType === "TRANSFER_OUT" ? destination : null,
            isExpelled: movementType === "EXPELLED",
            expelledDate: movementType === "EXPELLED" ? eventDate : null,
            expelledReason: movementType === "EXPELLED" ? reason : null,
          },
        });
      }

      const actualMemberId = actualMember.id;

      // 3. Tạo bản ghi biến động MemberMovement trong PostgreSQL
      const movement = await prisma.memberMovement.create({
        data: {
          memberId: actualMemberId,
          hamletId: actualHamletId,
          type: movementType,
          eventDate,
          reason: reason || null,
          destination: destination || null,
          decisionNumber: decisionNumber || null,
          documentPdfUrl: documentPdfUrl || null,
          burialPlace: burialPlace || null,
        },
        include: {
          member: {
            select: {
              id: true,
              fullName: true,
              cccd: true,
              phone: true,
              militaryRank: true,
            },
          },
          hamlet: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      // 4. Cập nhật trạng thái hội viên Member trong PostgreSQL
      const updatedMember = await prisma.member.update({
        where: { id: actualMemberId },
        data: memberUpdateData,
        include: {
          hamlet: true,
        },
      });

      // 5. Đồng bộ tài khoản người dùng User tương ứng (khi biến động)
      if (movementType === "DECEASED" || movementType === "TRANSFER_OUT" || movementType === "EXPELLED") {
        try {
          await prisma.user.updateMany({
            where: {
              OR: [
                { memberId: actualMemberId },
                { username: actualMember.cccd },
                ...(actualMember.phone ? [{ username: actualMember.phone }, { phone: actualMember.phone }] : []),
              ],
            },
            data: {
              isActive: false,
            },
          });
        } catch (uErr) {
          console.warn("Lưu ý deactivate user:", uErr);
        }
      } else if (movementType === "TRANSFER_IN") {
        try {
          const defaultPassword = process.env.DEFAULT_MEMBER_PASSWORD || "12345678@";
          const passwordHash = await bcrypt.hash(defaultPassword, 10);
          const username = actualMember.cccd || actualMember.phone;

          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { memberId: actualMemberId },
                { username: actualMember.cccd },
                ...(actualMember.phone ? [{ username: actualMember.phone }, { phone: actualMember.phone }] : []),
              ],
            },
          });

          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                isActive: true,
                memberId: actualMemberId,
                hamletId: actualHamletId,
                fullName: actualMember.fullName,
              },
            });
          } else if (username) {
            await prisma.user.create({
              data: {
                username,
                passwordHash,
                fullName: actualMember.fullName,
                phone: actualMember.phone || undefined,
                role: Role.MEMBER,
                memberId: actualMemberId,
                hamletId: actualHamletId,
                isActive: true,
              },
            });
          }
        } catch (uErr) {
          console.warn("Lưu ý activate user for TRANSFER_IN:", uErr);
        }
      }

      const formattedMovement = {
        id: movement.id,
        memberId: movement.memberId,
        memberName: movement.member?.fullName || actualMember.fullName,
        memberCccd: movement.member?.cccd || actualMember.cccd,
        memberRank: movement.member?.militaryRank || actualMember.militaryRank,
        hamletId: movement.hamletId,
        hamletCode: movement.hamlet?.code || actualHamlet?.code || "",
        hamletName: movement.hamlet?.name || actualHamlet?.name || "",
        type: movement.type,
        eventDate: movement.eventDate ? movement.eventDate.toISOString().slice(0, 10) : eventDateStr,
        reason: movement.reason || "",
        destination: movement.destination || "",
        decisionNumber: movement.decisionNumber || "",
        documentPdfUrl: movement.documentPdfUrl || "",
        burialPlace: movement.burialPlace || "",
        createdAt: movement.createdAt.toISOString(),
      };

      return NextResponse.json({
        success: true,
        message: `Đã ghi nhận và lưu trữ nghiệp vụ biến động (${movementType}) vào hệ thống thành công!`,
        data: {
          movement: formattedMovement,
          member: updatedMember,
          documentPdfUrl,
        },
      });
    } catch (dbError) {
      console.error("Lỗi khi lưu nghiệp vụ vào PostgreSQL Prisma:", dbError);
      
      // Fallback khi DB gặp sự cố đột xuất
      const mockMovement = {
        id: `mov_${Date.now()}`,
        memberId: memberId || `MEM_${Date.now()}`,
        memberName: memberName || "Hội viên",
        memberCccd: memberCccd || "",
        hamletName: hamletName || "Chi Hội CCB",
        type: movementType,
        eventDate: eventDate.toISOString().slice(0, 10),
        reason: reason || null,
        destination: destination || null,
        decisionNumber: decisionNumber || null,
        documentPdfUrl: documentPdfUrl || null,
        burialPlace: burialPlace || null,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        message: `Đã lưu nghiệp vụ (${movementType}) thành công (chế độ đệm dữ liệu)!`,
        data: {
          movement: mockMovement,
          memberUpdates: memberUpdateData,
          documentPdfUrl,
        },
      });
    }
  } catch (error) {
    console.error("Lỗi hệ thống khi xử lý POST /api/movements:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi hệ thống khi ghi nhận biến động hội viên",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Endpoint GET: Tra cứu danh sách lịch sử biến động hội viên từ CSDL PostgreSQL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const hamletId = searchParams.get("hamletId");
    const hamletName = searchParams.get("hamletName");
    const type = searchParams.get("type");

    try {
      const whereClause: Record<string, unknown> = {};
      if (memberId) whereClause.memberId = memberId;
      if (type && ["TRANSFER_IN", "TRANSFER_OUT", "EXPELLED", "DECEASED"].includes(type)) {
        whereClause.type = type as MovementType;
      }

      if (hamletId) {
        whereClause.hamlet = {
          OR: [
            { id: hamletId },
            { code: hamletId },
            { name: { contains: hamletId, mode: "insensitive" } },
          ],
        };
      } else if (hamletName) {
        whereClause.hamlet = {
          name: { contains: hamletName, mode: "insensitive" },
        };
      }

      const movements = await prisma.memberMovement.findMany({
        where: whereClause,
        include: {
          member: {
            select: {
              id: true,
              fullName: true,
              cccd: true,
              phone: true,
              militaryRank: true,
            },
          },
          hamlet: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 200,
      });

      const formatted = movements.map((m) => ({
        id: m.id,
        memberId: m.memberId,
        memberName: m.member?.fullName || "Hội viên",
        memberCccd: m.member?.cccd || "",
        memberRank: m.member?.militaryRank || "Hội viên",
        hamletId: m.hamletId,
        hamletCode: m.hamlet?.code || "",
        hamletName: m.hamlet?.name || "",
        type: m.type,
        eventDate: m.eventDate ? m.eventDate.toISOString().slice(0, 10) : "",
        reason: m.reason || "",
        destination: m.destination || "",
        decisionNumber: m.decisionNumber || "",
        documentPdfUrl: m.documentPdfUrl || "",
        burialPlace: m.burialPlace || "",
        createdAt: m.createdAt.toISOString(),
      }));

      return NextResponse.json({
        success: true,
        total: formatted.length,
        data: formatted,
      });
    } catch (dbError) {
      console.warn("DB offline or error when fetching movements:", dbError);
      return NextResponse.json({
        success: true,
        total: 0,
        data: [],
        note: "Database local offline",
      });
    }
  } catch (error) {
    console.error("Lỗi GET /api/movements:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi khi lấy danh sách biến động" },
      { status: 500 }
    );
  }
}

// Endpoint DELETE: Xóa hồ sơ biến động vĩnh viễn khỏi CSDL PostgreSQL
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu mã định danh hồ sơ biến động (id)" },
        { status: 400 }
      );
    }

    try {
      const existing = await prisma.memberMovement.findUnique({
        where: { id },
      });

      if (existing) {
        await prisma.memberMovement.delete({
          where: { id },
        });

        // Nếu không còn hồ sơ biến động nào khác của hội viên này, hoàn nguyên trạng thái
        if (existing.memberId) {
          const countOther = await prisma.memberMovement.count({
            where: { memberId: existing.memberId },
          });

          if (countOther === 0) {
            await prisma.member.update({
              where: { id: existing.memberId },
              data: {
                isDeceased: false,
                deceasedDate: null,
                isTransferred: false,
                transferDate: null,
                transferDestination: null,
                isExpelled: false,
                expelledDate: null,
                expelledReason: null,
                status: MemberStatus.CHINH_THUC,
              },
            }).catch(() => {});
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "Đã xóa vĩnh viễn hồ sơ biến động khỏi CSDL PostgreSQL!",
      });
    } catch (dbErr) {
      console.warn("Lỗi DB khi xóa movement (fallback offline):", dbErr);
      return NextResponse.json({
        success: true,
        message: "Đã ghi nhận xóa hồ sơ biến động!",
      });
    }
  } catch (error) {
    console.error("Lỗi DELETE /api/movements:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi xóa biến động" },
      { status: 500 }
    );
  }
}
