import { NextRequest, NextResponse } from "next/server";
import { getHistoryPasien } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const pasienId = new URL(request.url).searchParams.get("pasien_id");
    if (!pasienId) return NextResponse.json({ data: [], success: false, message: "Parameter pasien_id wajib diisi" }, { status: 400 });
    const data = await getHistoryPasien(pasienId);
    return NextResponse.json({ data, success: true, total: data.length });
  } catch (error) {
    console.error("API /api/gethistory error:", error);
    return NextResponse.json({ data: [], success: false, message: "Gagal mengambil history pasien" }, { status: 500 });
  }
}
