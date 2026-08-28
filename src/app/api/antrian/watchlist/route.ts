import { NextRequest, NextResponse } from "next/server";
import { getPriorityWatchlist } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const data = await getPriorityWatchlist();
    const count120 = data.length;
    // Pasien kritis diubah thresholdnya menjadi lebih dari 2 jam (>= 120 menit)
    const count180 = data.filter((p) => p.menit_tunggu >= 120).length;

    return NextResponse.json({
      success: true,
      data,
      count120,
      count180,
      countKritis: count180,
    });
  } catch (error) {
    console.error("API /api/antrian/watchlist error:", error);
    return NextResponse.json(
      { success: false, data: [], count120: 0, count180: 0, message: "Gagal mengambil data priority watchlist" },
      { status: 500 }
    );
  }
}
