import { NextRequest, NextResponse } from "next/server";
import { getHistoryPerjalanan } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/history?pasien_id=X
 * History perjalanan pasien lengkap dengan rincian pergerakan poli dan total waktu tunggu.
 * Berasal dari fungsi fetchHistoryPasien() di api.js.
 */
export async function GET(request: NextRequest) {
  try {
    const pasienId = new URL(request.url).searchParams.get("pasien_id");
    if (!pasienId) {
      return NextResponse.json(
        { data: [], success: false, message: "Parameter pasien_id wajib diisi" },
        { status: 400 },
      );
    }
    const data = await getHistoryPerjalanan(pasienId);
    return NextResponse.json({ data, success: true, total: data.length });
  } catch (error) {
    console.error("API /api/history error:", error);
    return NextResponse.json(
      { data: [], success: false, message: "Gagal mengambil history perjalanan pasien" },
      { status: 500 },
    );
  }
}
