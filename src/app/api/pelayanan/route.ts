import { NextRequest, NextResponse } from "next/server";
import { getPelayanan } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const pasienId = params.get("pasien_id") || undefined;
    const unitId = params.get("unit_id") || undefined;

    const data = await getPelayanan(pasienId, unitId);
    return NextResponse.json({ data, success: true, total: data.length });
  } catch (error) {
    console.error("API /api/pelayanan error:", error);
    return NextResponse.json(
      { data: [], success: false, message: "Gagal mengambil data b_pelayanan" },
      { status: 500 }
    );
  }
}
