import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getStoredMembers } from "@/lib/memberStore";

/**
 * GET /api/admin/members/export-excel
 * Xuất Bảng tổng hợp dữ liệu thu thập thông tin hội viên CCB (Mẫu 02) 27 cột ra file Excel (.xlsx)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hamlet = searchParams.get("hamlet") || "ALL";

    // Lấy dữ liệu hội viên từ Database hoặc MemberStore
    let memberList: any[] = [];
    try {
      const dbMembers = await prisma.member.findMany({
        where: {
          status: "CHINH_THUC",
          ...(hamlet !== "ALL" ? { hamlet: { name: hamlet } } : {}),
        },
        include: {
          hamlet: true,
        },
        orderBy: [
          { fullName: "asc" },
        ],
      });

      if (dbMembers.length > 0) {
        memberList = dbMembers.map((m: any) => ({
          fullName: m.fullName,
          birthDate: m.birthDate ? m.birthDate.toISOString().slice(0, 10) : "",
          birthYear: m.birthYear,
          gender: m.gender || "Nam",
          cccd: m.cccd,
          phone: m.phone || "",
          hometown: m.hometown || "",
          ethnicity: m.ethnicity || "Kinh",
          religion: m.religion || "Không",
          partyJoinDate: m.partyJoinDate ? m.partyJoinDate.toISOString().slice(0, 10) : "",
          isPartyMember: m.isPartyMember,
          currentAddress: m.currentAddress || (m.hamlet ? `${m.hamlet.name}, Xã Ea Súp, Đắk Lắk` : ""),
          enlistmentDate: m.enlistmentDate ? m.enlistmentDate.toISOString().slice(0, 10) : "",
          militaryUnit: m.militaryUnit || "",
          dischargeDate: m.dischargeDate ? m.dischargeDate.toISOString().slice(0, 10) : "",
          period: m.period || "Chiến tranh bảo vệ Tổ quốc",
          militaryPosition: m.militaryPosition || "",
          militaryRank: m.militaryRank || "",
          associationJoinDate: m.associationJoinDate ? m.associationJoinDate.toISOString().slice(0, 10) : "",
          associationRole: m.isBranchLeader ? "Chi hội trưởng" : (m.associationRole || "Hội viên"),
          academicLevel: m.academicLevel || "",
          politicalTheory: m.politicalTheory || "",
          policyStatus: m.policyStatus || "Không",
        }));
      }
    } catch (dbErr) {
      console.warn("DB fetch failed, using stored members:", dbErr);
    }

    if (memberList.length === 0) {
      const stored = getStoredMembers().filter((m) => m.status === "CHINH_THUC");
      const filtered = hamlet !== "ALL" ? stored.filter((m) => m.hamletName === hamlet) : stored;
      memberList = filtered.map((m) => ({
        fullName: m.fullName,
        birthDate: m.birthDate || "",
        birthYear: m.birthYear,
        gender: m.gender || "Nam",
        cccd: m.cccd,
        phone: m.phone || "",
        hometown: m.hometown || "",
        ethnicity: m.ethnicity || "Kinh",
        religion: m.religion || "Không",
        partyJoinDate: m.partyJoinDate ? "Đảng viên" : "Không",
        isPartyMember: !!m.partyJoinDate,
        currentAddress: m.currentAddress || `${m.hamletName}, Xã Ea Súp, Đắk Lắk`,
        enlistmentDate: m.enlistmentDate || "",
        militaryUnit: m.militaryUnit || "",
        dischargeDate: m.dischargeDate || "",
        period: m.period || "Chiến tranh bảo vệ Tổ quốc",
        militaryPosition: m.militaryPosition || "",
        militaryRank: m.militaryRank || "",
        associationJoinDate: m.associationJoinDate || "",
        associationRole: m.associationRole || "Hội viên",
        academicLevel: m.educationLevel || "",
        politicalTheory: m.politicalTheory || "",
        policyStatus: m.policyStatus || "Không",
      }));
    }

    const hamletTitle = hamlet !== "ALL" ? hamlet : "Toàn xã Ea Súp";
    const hamletAscii = hamletTitle
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_");

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
    const dateFileStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

    const sheetRows: any[][] = [
      [`HỘI CỰU CHIẾN BINH XÃ EA SÚP - CHI HỘI ${hamletTitle.toUpperCase()}`],
      ["BẢNG TỔNG HỢP DỮ LIỆU THU THẬP THÔNG TIN HỘI VIÊN CỰU CHIẾN BINH (MẪU 02)"],
      [`Địa bàn: ${hamletTitle}, xã Ea Súp, tỉnh Đắk Lắk | Tổng số: ${memberList.length} đồng chí | Ngày xuất: ${dateStr}`],
      [],
      [
        "STT",
        "Họ và tên",
        "Ngày sinh",
        "Giới tính",
        "Số CCCD",
        "Số điện thoại",
        "Quê quán (mới)",
        "Dân tộc",
        "Tôn giáo",
        "Ngày vào Đảng",
        "Nơi ở hiện nay",
        "Nhập ngũ",
        "Đơn vị quân đội",
        "Ngày xuất ngũ / Nghỉ hưu",
        "Cựu quân nhân (CQN)",
        "Chức vụ cao nhất QĐ",
        "Cấp bậc xuất ngũ",
        "Ngày vào Hội CCB",
        "Chức vụ Hội đã qua",
        "Chức vụ Hội hiện tại",
        "Qua trường đào tạo",
        "Trình độ văn hóa",
        "Trình độ LLCT",
        "Chuyên môn nghiệp vụ",
        "Người có công / Chính sách",
        "Danh hiệu / Khen thưởng",
        "Ngày lập phiếu",
      ],
    ];

    memberList.forEach((m, idx) => {
      sheetRows.push([
        idx + 1,
        m.fullName,
        m.birthDate || (m.birthYear ? String(m.birthYear) : ""),
        m.gender || "Nam",
        m.cccd,
        m.phone || "",
        m.hometown || "",
        m.ethnicity || "Kinh",
        m.religion || "Không",
        m.partyJoinDate || (m.isPartyMember ? "Đảng viên" : "Không"),
        m.currentAddress || "",
        m.enlistmentDate || "",
        m.militaryUnit || "",
        m.dischargeDate || "",
        m.period === "Cựu quân nhân" ? "Cựu quân nhân" : "",
        m.militaryPosition || "",
        m.militaryRank || "",
        m.associationJoinDate || "",
        "",
        m.associationRole || "Hội viên",
        "",
        m.academicLevel || "",
        m.politicalTheory || "",
        "",
        m.policyStatus || "Không",
        "",
        dateStr,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    ws["!cols"] = [
      { wch: 6 },  // STT
      { wch: 22 }, // Họ và tên
      { wch: 14 }, // Ngày sinh
      { wch: 10 }, // Giới tính
      { wch: 18 }, // Số CCCD
      { wch: 15 }, // SĐT
      { wch: 32 }, // Quê quán
      { wch: 12 }, // Dân tộc
      { wch: 12 }, // Tôn giáo
      { wch: 14 }, // Ngày vào Đảng
      { wch: 35 }, // Nơi ở hiện nay
      { wch: 14 }, // Nhập ngũ
      { wch: 25 }, // Đơn vị quân đội
      { wch: 22 }, // Ngày xuất ngũ
      { wch: 18 }, // CQN
      { wch: 20 }, // Chức vụ cao nhất QĐ
      { wch: 16 }, // Cấp bậc xuất ngũ
      { wch: 16 }, // Ngày vào Hội CCB
      { wch: 18 }, // Chức vụ Hội đã qua
      { wch: 18 }, // Chức vụ Hội hiện tại
      { wch: 22 }, // Qua trường đào tạo
      { wch: 16 }, // Trình độ văn hóa
      { wch: 16 }, // Trình độ LLCT
      { wch: 20 }, // Chuyên môn nghiệp vụ
      { wch: 22 }, // Người có công
      { wch: 22 }, // Khen thưởng
      { wch: 14 }, // Ngày lập phiếu
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau02_TongHop");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    const filename = `Bang_Tong_Hop_Mau_02_${hamletAscii}_${dateFileStr}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Lỗi khi xuất file Excel tổng hợp:", error);
    return NextResponse.json({ success: false, error: "Lỗi xuất file Excel" }, { status: 500 });
  }
}
