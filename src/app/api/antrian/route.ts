import { NextRequest, NextResponse } from "next/server";
import { getDetailAntrian, getPasienAntri } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const unitId = params.get("unit_id");
    const dilayani = params.get("dilayani");
    if (!unitId && dilayani === null) return NextResponse.json({ data: await getDetailAntrian(), success: true });
    if (unitId && dilayani !== null) return NextResponse.json({ data: await getPasienAntri(unitId, dilayani), success: true });
    return NextResponse.json({ data: [], success: false, message: "Parameter tidak lengkap" }, { status: 400 });
  } catch (error) {
    console.error("API /api/antrian error:", error);
    return NextResponse.json({ data: [], success: false, message: "Gagal mengambil data antrian" }, { status: 500 });
  }
}
