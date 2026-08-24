import { NextRequest, NextResponse } from "next/server";
import { getPasienDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const pasienId = new URL(request.url).searchParams.get("pasien_id");
    if (!pasienId) return NextResponse.json({ data: [], success: false, message: "Parameter pasien_id wajib diisi" }, { status: 400 });
    return NextResponse.json({ data: await getPasienDetail(pasienId), success: true });
  } catch (error) {
    console.error("API /api/pasien error:", error);
    return NextResponse.json({ data: [], success: false, message: "Gagal mengambil detail pasien" }, { status: 500 });
  }
}
