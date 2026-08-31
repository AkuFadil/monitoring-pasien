import { NextRequest, NextResponse } from "next/server";
import { getPriorityWatchlist, getDetailAntrian } from "@/lib/queries";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { findUnitByRole } from "@/lib/units";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? await verifySessionToken(token) : null;

    const searchUnitId = request.nextUrl.searchParams.get("unit_id");

    let targetUnitId: number | string | undefined = searchUnitId || undefined;
    let unitInfo: { unit_id: number; nama: string; unit_tampil: string } | null = null;

    // Filter per poli jika user adalah akun poli (app_access === 4)
    if (user && user.app_access === 4 && user.role) {
      const units = await getDetailAntrian();
      const matchedUnit = findUnitByRole(units, user.role);
      if (matchedUnit) {
        targetUnitId = matchedUnit.unit_id;
        unitInfo = {
          unit_id: matchedUnit.unit_id,
          nama: matchedUnit.nama,
          unit_tampil: matchedUnit.unit_tampil,
        };
      }
    }

    const data = await getPriorityWatchlist(targetUnitId);
    const count120 = data.length;
    // Pasien kritis diubah thresholdnya menjadi lebih dari 2 jam (>= 120 menit)
    const count180 = data.filter((p) => p.menit_tunggu >= 120).length;

    return NextResponse.json({
      success: true,
      data,
      count120,
      count180,
      countKritis: count180,
      unitInfo,
      userRole: user?.role || null,
      appAccess: user?.app_access ?? null,
    });
  } catch (error) {
    console.error("API /api/antrian/watchlist error:", error);
    return NextResponse.json(
      { success: false, data: [], count120: 0, count180: 0, message: "Gagal mengambil data priority watchlist" },
      { status: 500 }
    );
  }
}

