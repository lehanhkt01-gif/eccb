import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

/**
 * GET /api/admin/members/template
 * Xuất file Excel mẫu chuẩn (.xlsx) 27 cột theo Bảng Tổng hợp Mẫu 02 của Hội CCB xã Ea Súp
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hamlet = searchParams.get("hamlet") || "Thôn Đoàn Kết";
    const selectedHamlet = hamlet !== "AUTO" ? hamlet : "Thôn Đoàn Kết";

    const hamletAscii = selectedHamlet
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_");

    const sheetRows: any[][] = [
      [`HỘI CỰU CHIẾN BINH XÃ EA SÚP - CHI HỘI ${selectedHamlet.toUpperCase()}`],
      ["BẢNG TỔNG HỢP DỮ LIỆU THU THẬP THÔNG TIN HỘI VIÊN CỰU CHIẾN BINH (MẪU 02)"],
      [`Địa bàn: ${selectedHamlet}, xã Ea Súp, tỉnh Đắk Lắk | Hệ thống E-CCB Ea Súp`],
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
      [
        1,
        "Huỳnh Xuân Lê",
        "14/07/1992",
        "Nam",
        "066092000778",
        "0389120222",
        "Xã Hoài Nhơn Tây, tỉnh Gia Lai",
        "Kinh",
        "Không",
        "13/06/2019",
        `05 Trần Phú, ${selectedHamlet}, xã Ea Súp, tỉnh Đắk Lắk`,
        "27/02/2013",
        "d19, Tiểu đoàn HL BĐBP tỉnh Đắk Lắk",
        "01/08/2014",
        "",
        "BĐ (Thiếu úy)",
        "Binh nhất",
        "04/02/2015",
        "Không",
        "Hội viên",
        "SQLQ2 (ĐH Nguyễn Huệ)",
        "12/12",
        "Trung cấp",
        "ĐH ngành QLCS",
        "Không",
        "Không",
        "11/09/2026",
      ],
      [
        2,
        "Đỗ Thanh Hải",
        "20/10/1952",
        "Nam",
        "034052005398",
        "0326864882",
        "Thôn Thượng Trà, xã Diễn Thọ, huyện Diễn Châu, Nghệ An",
        "Kinh",
        "Không",
        "Không",
        `Số 55 ${selectedHamlet}, xã Ea Súp, Đắk Lắk`,
        "08/1973",
        "D.668 - E... QK4",
        "08/1982",
        "Phục viên",
        "Trung đội trưởng",
        "Thiếu úy",
        "1997",
        "Chi hội phó",
        "Hội viên",
        "Sơ cấp cơ khí",
        "7/10",
        "",
        "",
        "Thương binh 4/4",
        "Huân chương Chiến sĩ vẻ vang",
        "24/08/2026",
      ],
      [
        3,
        "Nguyễn Đình Chiến",
        "06/03/1965",
        "Nam",
        "042065000508",
        "0357561647",
        "Cẩm Xuyên, Hà Tĩnh",
        "Kinh",
        "Không",
        "",
        `21A ${selectedHamlet}, xã Ea Súp`,
        "02/1986",
        "Không Quân",
        "1987",
        "",
        "Binh nhất",
        "Binh nhất",
        "1996",
        "Thư ký chi hội",
        "Thư ký chi hội",
        "11 tháng HL Không quân",
        "9/10",
        "",
        "Không quân",
        "Không",
        "Chiến sĩ thi đua",
        "26/08/2026",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);

    // Độ rộng các cột chuẩn Mẫu 02
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
    XLSX.utils.book_append_sheet(wb, ws, "Mau02_HoiVienCCB");

    // Tạo binary buffer chuẩn OpenXML (.xlsx)
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    const filename = `Mau_02_Danh_Sach_CCB_${hamletAscii}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo template Excel:", error);
    return NextResponse.json({ success: false, error: "Lỗi tạo file mẫu" }, { status: 500 });
  }
}
