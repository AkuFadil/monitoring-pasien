import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export interface PoliSummary {
  poli_id: number;
  nama_poli: string;
  total_pasien: number;
  belum_diperiksa: number;
  selesai: number;
  e_resep: number;
  penyerahan_obat: number;
  waiting_0_30: number;
  waiting_30_60: number;
  waiting_60_120: number;
  waiting_120_plus: number;
  avg_waiting_minutes: number;
}

/** Aggregate ringan untuk mapping: satu record per poli, tanpa detail pasien. */
export async function GET() {
  try {
    const data = await cached<PoliSummary[]>("dashboard-poli-summary", 15_000, async () => {
      const [rows] = await pool.query(`
        SELECT
          u.id AS poli_id,
          COALESCE(NULLIF(TRIM(u.unit_alias), ''), u.nama) AS nama_poli,
          COALESCE(x.total_pasien, 0) AS total_pasien,
          COALESCE(x.belum_diperiksa, 0) AS belum_diperiksa,
          COALESCE(x.selesai, 0) AS selesai,
          COALESCE(x.e_resep, 0) AS e_resep,
          COALESCE(x.penyerahan_obat, 0) AS penyerahan_obat,
          COALESCE(x.waiting_0_30, 0) AS waiting_0_30,
          COALESCE(x.waiting_30_60, 0) AS waiting_30_60,
          COALESCE(x.waiting_60_120, 0) AS waiting_60_120,
          COALESCE(x.waiting_120_plus, 0) AS waiting_120_plus,
          COALESCE(x.avg_waiting_minutes, 0) AS avg_waiting_minutes
        FROM db_rsd_soebandi_billing.b_ms_unit u
        LEFT JOIN (
          SELECT
            x.unit_id,
            COUNT(*) AS total_pasien,
            SUM(x.status_pasien = 'belum') AS belum_diperiksa,
            SUM(x.status_pasien = 'selesai') AS selesai,
            SUM(x.status_pasien = 'resep') AS e_resep,
            SUM(x.status_pasien = 'obat') AS penyerahan_obat,
            SUM(x.waiting_minutes >= 0 AND x.waiting_minutes < 30) AS waiting_0_30,
            SUM(x.waiting_minutes >= 30 AND x.waiting_minutes < 60) AS waiting_30_60,
            SUM(x.waiting_minutes >= 60 AND x.waiting_minutes < 120) AS waiting_60_120,
            SUM(x.waiting_minutes >= 120) AS waiting_120_plus,
            AVG(x.waiting_minutes) AS avg_waiting_minutes
          FROM (
            SELECT bp.unit_id, bp.pasien_id,
              CASE WHEN MAX(ac.penyerahan) IS NOT NULL THEN 'obat'
                WHEN MIN(ac.validasi) IS NOT NULL THEN 'resep'
                WHEN MAX(bp.tgl_act2) IS NOT NULL OR MAX(bp.dilayani) = 1 THEN 'selesai'
                ELSE 'belum' END AS status_pasien,
              GREATEST(0, TIMESTAMPDIFF(MINUTE, MIN(bp.tgl_act), COALESCE(MAX(ac.penyerahan), MAX(bp.tgl_act2), NOW()))) AS waiting_minutes
            FROM db_rsd_soebandi_billing.b_pelayanan bp
            LEFT JOIN (
              SELECT pelayanan_id, MIN(tgl_proses) AS validasi, MIN(tgl_selesai) AS penyerahan
              FROM db_antrian.b_antrian_cekin WHERE tgl_proses >= CURRENT_DATE() GROUP BY pelayanan_id
            ) ac ON ac.pelayanan_id = bp.id
            WHERE bp.tgl >= CURRENT_DATE() AND bp.tgl < CURRENT_DATE() + INTERVAL 1 DAY
            GROUP BY bp.unit_id, bp.pasien_id
          ) x
          GROUP BY x.unit_id
        ) x ON x.unit_id = u.id
        WHERE u.parent_id = '1' AND u.aktif = 1
        ORDER BY nama_poli ASC
      `);

      return (rows as Array<Record<string, unknown>>).map((row) => ({
        poli_id: Number(row.poli_id),
        nama_poli: String(row.nama_poli),
        total_pasien: Number(row.total_pasien ?? 0),
        belum_diperiksa: Number(row.belum_diperiksa ?? 0),
        selesai: Number(row.selesai ?? 0),
        e_resep: Number(row.e_resep ?? 0),
        penyerahan_obat: Number(row.penyerahan_obat ?? 0),
        waiting_0_30: Number(row.waiting_0_30 ?? 0),
        waiting_30_60: Number(row.waiting_30_60 ?? 0),
        waiting_60_120: Number(row.waiting_60_120 ?? 0),
        waiting_120_plus: Number(row.waiting_120_plus ?? 0),        avg_waiting_minutes: Math.round(Number(row.avg_waiting_minutes ?? 0)),      }));
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("API /api/dashboard/poli-summary error:", error);
    return NextResponse.json({ data: [], success: false, message: "Gagal mengambil summary poli" }, { status: 500 });
  }
}
