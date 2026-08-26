import { NextRequest, NextResponse } from "next/server";
import { getHistoryPerjalananByUnit } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/history/unit?unit_id=X
 * Mengambil history perjalanan semua pasien pada satu unit berdasarkan b_pelayanan.
 * Menggantikan kombinasi /api/antrian + /api/history/batch pada PatientHistoryTable.
 */
export async function GET(request: NextRequest) {
  try {
    const unitId = new URL(request.url).searchParams.get("unit_id");
    if (!unitId) {
      return NextResponse.json(
        { data: [], success: false, message: "Parameter unit_id wajib diisi" },
        { status: 400 },
      );
    }

    const data = await getHistoryPerjalananByUnit(unitId);
    return NextResponse.json({ data, success: true, total: data.length });
  } catch (error) {
    console.error("API /api/history/unit error:", error);
    return NextResponse.json(
      { data: [], success: false, message: "Gagal mengambil history unit" },
      { status: 500 },
    );
  }
}
