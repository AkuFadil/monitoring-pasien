import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cached } from "@/lib/cache";
import type { PasienAntri } from "@/types";

export const dynamic = "force-dynamic";

interface MapPatient extends PasienAntri {
  unit_id: number;
  total_waktu_tunggu: string | null;
}

/** GET /api/antrian/map?units=19,248,18 */
export async function GET(request: NextRequest) {
  try {
    const unitsParam = new URL(request.url).searchParams.get("units");
    const unitIds = (unitsParam ?? "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id, index, ids) => Number.isInteger(id) && id > 0 && ids.indexOf(id) === index);

    if (unitIds.length === 0) return NextResponse.json({ data: {}, success: true });

    const cacheKey = `antrian-map:${unitIds.slice().sort((a, b) => a - b).join(",")}`;
    const data = await cached(cacheKey, 10_000, async () => {
      const placeholders = unitIds.map(() => "?").join(",");
      const [rows] = await pool.query(
        `SELECT bp.unit_id, bp.pasien_id, b.no_rm, b.nama, c.nama_peserta,
                CASE
                  WHEN bp.tgl_act2 IS NOT NULL THEN
                    CASE WHEN TIMESTAMPDIFF(MINUTE, bp.tgl_act, bp.tgl_act2) >= 60
                      THEN CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, bp.tgl_act, bp.tgl_act2) / 60), ' Jam ', MOD(TIMESTAMPDIFF(MINUTE, bp.tgl_act, bp.tgl_act2), 60), ' Menit')
                      ELSE CONCAT(TIMESTAMPDIFF(MINUTE, bp.tgl_act, bp.tgl_act2), ' Menit') END
                  ELSE NULL
                END AS total_waktu_tunggu
         FROM db_rsd_soebandi_billing.b_pelayanan bp
         JOIN db_rsd_soebandi_billing.b_ms_pasien b ON bp.pasien_id = b.id
         JOIN db_rsd_soebandi_billing.b_kunjungan c ON bp.pasien_id = c.pasien_id AND DATE(c.tgl) = CURDATE()
         WHERE DATE(bp.tgl) = CURDATE() AND bp.unit_id IN (${placeholders})
         ORDER BY bp.unit_id, b.nama ASC`,
        unitIds,
      );

      const grouped: Record<number, MapPatient[]> = {};
      for (const row of rows as MapPatient[]) (grouped[row.unit_id] ??= []).push(row);
      return grouped;
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("API /api/antrian/map error:", error);
    return NextResponse.json({ data: {}, success: false, message: "Gagal mengambil data pasien map" }, { status: 500 });
  }
}
