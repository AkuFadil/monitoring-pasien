import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

/**
 * GET /api/antrian/eresep-counts
 *
 * Returns proses & selesai e-resep counts for every unit in a single query.
 * { data: Record<number, { proses: number; selesai: number }> }
 */
export async function GET() {
  try {
    const data = await cached("eresep-counts-all", 5_000, async () => {
      // Get served patients (dilayani=1) with their unit_id and pelayanan_id
      const [servedRows] = await pool.query(
        `SELECT bp.unit_id, bp.id AS pelayanan_id
         FROM db_rsd_soebandi_billing.b_pelayanan bp
         WHERE DATE(bp.tgl) = CURDATE() AND bp.dilayani = 1`
      );

      if ((servedRows as any[]).length === 0) return {};

      // Collect all pelayanan_ids
      const pelayananIds = (servedRows as any[]).map((r) => r.pelayanan_id);

      // Batch fetch all e-resep statuses in one query
      const placeholders = pelayananIds.map(() => "?").join(",");
      const [cekinRows] = await pool.query(
        `SELECT pelayanan_id,
                MIN(tgl_proses)  AS validasi,
                MIN(tgl_selesai) AS penyerahan
         FROM db_antrian.b_antrian_cekin
         WHERE pelayanan_id IN (${placeholders})
           AND tgl_proses >= CURRENT_DATE()
         GROUP BY pelayanan_id`,
        pelayananIds,
      );

      // Build lookup: pelayanan_id → { hasValidasi, hasPenyerahan }
      const cekinMap = new Map<number, { validasi: boolean; penyerahan: boolean }>();
      for (const row of cekinRows as any[]) {
        cekinMap.set(row.pelayanan_id, {
          validasi: !!row.validasi,
          penyerahan: !!row.penyerahan,
        });
      }

      // Aggregate per unit
      const result: Record<number, { proses: number; selesai: number }> = {};
      for (const row of servedRows as any[]) {
        const unitId = row.unit_id as number;
        if (!result[unitId]) result[unitId] = { proses: 0, selesai: 0 };

        const status = cekinMap.get(row.pelayanan_id);
        if (status?.penyerahan) result[unitId].selesai++;
        else if (status?.validasi) result[unitId].proses++;
      }
      return result;
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("API /api/antrian/eresep-counts error:", error);
    return NextResponse.json(
      { data: {}, success: false, message: "Gagal mengambil data e-resep" },
      { status: 500 }
    );
  }
}
