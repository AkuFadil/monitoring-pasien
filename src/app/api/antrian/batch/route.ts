import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cached } from "@/lib/cache";
import type { PasienAntri } from "@/types";

export const dynamic = "force-dynamic";

/** GET /api/antrian/batch?units=19,248,18&dilayani=0 */
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const unitsParam = params.get("units");
    const dilayani = params.get("dilayani");
    if (!unitsParam || (dilayani !== "0" && dilayani !== "1")) {
      return NextResponse.json({ data: {}, success: false, message: "Parameter units dan dilayani wajib diisi" }, { status: 400 });
    }

    const unitIds = unitsParam.split(",").map(Number).filter((id) => Number.isInteger(id));
    if (unitIds.length === 0) return NextResponse.json({ data: {}, success: true });

    const cacheKey = `antrian-batch:${unitIds.sort((a, b) => a - b).join(",")}:${dilayani}`;
    const data = await cached(cacheKey, 5_000, async () => {
      const placeholders = unitIds.map(() => "?").join(",");
      const [rows] = await pool.query(
        `SELECT bp.unit_id, bp.pasien_id, b.no_rm, b.nama, c.nama_peserta
         FROM db_rsd_soebandi_billing.b_pelayanan bp
         JOIN db_rsd_soebandi_billing.b_ms_pasien b ON bp.pasien_id = b.id
         JOIN db_rsd_soebandi_billing.b_kunjungan c ON bp.pasien_id = c.pasien_id AND DATE(c.tgl) = CURDATE()
         WHERE DATE(bp.tgl) = CURDATE() AND bp.dilayani = ? AND bp.unit_id IN (${placeholders})
         ORDER BY b.nama ASC`,
        [dilayani, ...unitIds],
      );

      const grouped: Record<number, PasienAntri[]> = {};
      for (const row of rows as (PasienAntri & { unit_id: number })[]) {
        (grouped[row.unit_id] ??= []).push(row);
      }
      return grouped;
    });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("API /api/antrian/batch error:", error);
    return NextResponse.json({ data: {}, success: false, message: "Gagal mengambil data antrian" }, { status: 500 });
  }
}
