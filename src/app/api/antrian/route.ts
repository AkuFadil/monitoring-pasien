import { NextRequest, NextResponse } from "next/server";
import { getDetailAntrian, getPasienAntri } from "@/lib/queries";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const unitId = params.get("unit_id");
    const dilayani = params.get("dilayani");
    if (!unitId && dilayani === null) {
      const data = await cached("detail-antrian", 5_000, getDetailAntrian);
      return NextResponse.json({ data, success: true });
    }
    if (unitId && dilayani !== null) {
      const data = await cached(`pasien-antri:${unitId}:${dilayani}`, 5_000, () => getPasienAntri(unitId, dilayani));
      return NextResponse.json({ data, success: true });
    }
    return NextResponse.json({ data: [], success: false, message: "Parameter tidak lengkap" }, { status: 400 });
  } catch (error) {
    console.error("API /api/antrian error:", error);
    return NextResponse.json({ data: [], success: false, message: "Gagal mengambil data antrian" }, { status: 500 });
  }
}
