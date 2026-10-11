import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

/**
 * GET /api/admin/members/template
 * Xuất file Excel mẫu chuẩn (.xlsx) 25 cột theo Phiếu Mẫu 02 (35 trường thông tin)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hamlet = searchParams.get("hamlet") || "Thôn Đoàn Kết";
    const selectedHamlet = hamlet !== "AUTO" ? hamlet : "Thôn Đoàn Kết";

    const templateData = [
      {
        "Họ và tên (*)": "Nguyễn Văn An",
        "Số CCCD (*)": "066060001234",
        "Năm sinh (*)": 1960,
        "Ngày sinh": "15/04/1960",
        "Giới tính": "Nam",
        "Số điện thoại": "0912345678",
        "Thôn/Buôn": selectedHamlet,
        "Địa chỉ hiện nay": `${selectedHamlet}, Xã Ea Súp, Tỉnh Đắk Lắk`,
        "Quê quán": "Xã Nam Đàn, Huyện Nam Đàn, Nghệ An",
        "Dân tộc": "Kinh",
        "Tôn giáo": "Không",
        "Thời kỳ quân ngũ": "Kháng chiến chống Mỹ",
        "Cấp bậc": "Trung úy",
        "Chức vụ quân đội": "Trung đội trưởng",
        "Ngày nhập ngũ": "02/1978",
        "Ngày xuất ngũ": "12/1983",
        "Chức vụ Hội CCB": "Hội viên",
        "Ngày vào Hội": "19/05/1995",
        "Đảng viên (Có/Không)": "Có",
        "Ngày vào Đảng": "03/02/1982",
        "Chính sách người có công": "Thương binh 4/4",
        "BHYT 100% (Có/Không)": "Có",
        "Hộ nghèo (Có/Không)": "Không",
        "Mô hình kinh tế (Có/Không)": "Có",
        "Dư nợ NHCSXH (VNĐ)": 50000000,
      },
      {
        "Họ và tên (*)": "Hoàng Văn Bình",
        "Số CCCD (*)": "066072005678",
        "Năm sinh (*)": 1972,
        "Ngày sinh": "20/08/1972",
        "Giới tính": "Nam",
        "Số điện thoại": "0987654321",
        "Thôn/Buôn": selectedHamlet,
        "Địa chỉ hiện nay": `${selectedHamlet}, Xã Ea Súp, Tỉnh Đắk Lắk`,
        "Quê quán": "Huyện Cẩm Xuyên, Hà Tĩnh",
        "Dân tộc": "Kinh",
        "Tôn giáo": "Không",
        "Thời kỳ quân ngũ": "Chiến tranh bảo vệ Tổ quốc",
        "Cấp bậc": "Thượng sĩ",
        "Chức vụ quân đội": "Tiểu đội trưởng",
        "Ngày nhập ngũ": "03/1990",
        "Ngày xuất ngũ": "03/1993",
        "Chức vụ Hội CCB": "Hội viên",
        "Ngày vào Hội": "22/12/2000",
        "Đảng viên (Có/Không)": "Không",
        "Ngày vào Đảng": "",
        "Chính sách người có công": "Không",
        "BHYT 100% (Có/Không)": "Không",
        "Hộ nghèo (Có/Không)": "Không",
        "Mô hình kinh tế (Có/Không)": "Không",
        "Dư nợ NHCSXH (VNĐ)": 0,
      },
      {
        "Họ và tên (*)": "Y Ksor H'Nhi",
        "Số CCCD (*)": "066085009876",
        "Năm sinh (*)": 1985,
        "Ngày sinh": "10/10/1985",
        "Giới tính": "Nam",
        "Số điện thoại": "0935123456",
        "Thôn/Buôn": selectedHamlet,
        "Địa chỉ hiện nay": `${selectedHamlet}, Xã Ea Súp, Tỉnh Đắk Lắk`,
        "Quê quán": "Xã Ea Súp, Tỉnh Đắk Lắk",
        "Dân tộc": "Ê Đê",
        "Tôn giáo": "Không",
        "Thời kỳ quân ngũ": "Cựu quân nhân",
        "Cấp bậc": "Trung sĩ",
        "Chức vụ quân đội": "Chiến sĩ",
        "Ngày nhập ngũ": "02/2004",
        "Ngày xuất ngũ": "02/2006",
        "Chức vụ Hội CCB": "Hội viên",
        "Ngày vào Hội": "15/08/2012",
        "Đảng viên (Có/Không)": "Có",
        "Ngày vào Đảng": "19/05/2015",
        "Chính sách người có công": "Không",
        "BHYT 100% (Có/Không)": "Có",
        "Hộ nghèo (Có/Không)": "Không",
        "Mô hình kinh tế (Có/Không)": "Có",
        "Dư nợ NHCSXH (VNĐ)": 30000000,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 22 }, // Họ và tên
      { wch: 18 }, // CCCD
      { wch: 12 }, // Năm sinh
      { wch: 14 }, // Ngày sinh
      { wch: 10 }, // Giới tính
      { wch: 15 }, // SĐT
      { wch: 20 }, // Thôn buôn
      { wch: 32 }, // Địa chỉ
      { wch: 28 }, // Quê quán
      { wch: 12 }, // Dân tộc
      { wch: 12 }, // Tôn giáo
      { wch: 25 }, // Thời kỳ
      { wch: 15 }, // Cấp bậc
      { wch: 20 }, // Chức vụ QĐ
      { wch: 14 }, // Nhập ngũ
      { wch: 14 }, // Xuất ngũ
      { wch: 16 }, // Chức vụ Hội
      { wch: 14 }, // Vào Hội
      { wch: 18 }, // Đảng viên
      { wch: 14 }, // Vào Đảng
      { wch: 20 }, // Chính sách
      { wch: 18 }, // BHYT
      { wch: 18 }, // Hộ nghèo
      { wch: 22 }, // Kinh tế
      { wch: 20 }, // Dư nợ
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachHoiVien");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    const filename = `Mau_Danh_Sach_CCB_${selectedHamlet.replace(/\s+/g, "_")}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo template Excel:", error);
    return NextResponse.json({ success: false, error: "Lỗi tạo file mẫu" }, { status: 500 });
  }
}
