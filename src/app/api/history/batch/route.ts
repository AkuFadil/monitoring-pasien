import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { HistoryPerjalanan } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/history/batch?ids=1,2,3
 * Mengambil history perjalanan untuk banyak pasien sekaligus dalam 1 query.
 * Menggantikan banyak fetch serial /api/history?pasien_id=X
 */
export async function GET(request: NextRequest) {
  try {
    const idsParam = new URL(request.url).searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json(
        { data: {}, success: false, message: "Parameter ids wajib diisi (comma-separated)" },
        { status: 400 },
      );
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n));

    if (ids.length === 0) {
      return NextResponse.json({ data: {}, success: true });
    }

    // Bangun placeholder: ?, ?, ? ...
    const placeholders = ids.map(() => "?").join(", ");

    const [rows] = await pool.query(
      `
      SELECT
        mp.id AS pasien_id,
        mp.nama AS \`Nama Pasien\`,
        mp.no_rm AS \`No. RM\`,
        DATE_FORMAT(bk.tgl, '%d-%m-%Y') AS Tanggal,
        GROUP_CONCAT(
          CAST(CONCAT(
            COALESCE(mu.unit_alias, mu.nama), ' (Daftar: ',
            COALESCE(DATE_FORMAT(bp.tgl_act, '%H:%i'), '-'),
            ' | Periksa: ', COALESCE(DATE_FORMAT(bp.tgl_act1, '%H:%i'), '-'),
            '-', COALESCE(DATE_FORMAT(bp.tgl_act2, '%H:%i'), '-'), ')'
          ) AS CHAR)
          ORDER BY bp.tgl_act ASC SEPARATOR ' - '
        ) AS \`Rincian Pergerakan Poli\`,
        DATE_FORMAT(MIN(bp.tgl_act), '%H:%i:%s') AS \`Jam Daftar Awal\`,
        DATE_FORMAT(MAX(bp.tgl_act2), '%H:%i:%s') AS \`Selesai Periksa Terakhir\`,
        DATE_FORMAT(MIN(ac.validasi), '%H:%i:%s') AS \`Proses Resep\`,
        DATE_FORMAT(MAX(ac.penyerahan), '%H:%i:%s') AS \`Penyerahan Obat\`,
        CASE
          WHEN SUM(CASE WHEN bp.tgl_act2 IS NULL THEN 1 ELSE 0 END) > 0 AND MAX(ac.penyerahan) IS NULL THEN 'Masih Dalam Process (Poli)'
          WHEN SUM(CASE WHEN bp.tgl_act2 IS NULL THEN 1 ELSE 0 END) > 0 AND (MIN(ac.validasi) IS NOT NULL OR MAX(ac.penyerahan) IS NOT NULL) THEN 'Anomali (Poli Belum Selesai)'
          WHEN MIN(ac.validasi) IS NOT NULL AND MAX(ac.penyerahan) IS NULL THEN 'Masih Dalam Process (Farmasi)'
          WHEN MAX(ac.penyerahan) IS NOT NULL THEN
            CASE WHEN TIMESTAMPDIFF(MINUTE, MIN(bp.tgl_act), MAX(ac.penyerahan)) >= 60
              THEN CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, MIN(bp.tgl_act), MAX(ac.penyerahan)) / 60), ' Jam ', MOD(TIMESTAMPDIFF(MINUTE, MIN(bp.tgl_act), MAX(ac.penyerahan)), 60), ' Menit')
              ELSE CONCAT(TIMESTAMPDIFF(MINUTE, MIN(bp.tgl_act), MAX(ac.penyerahan)), ' Menit') END
          WHEN SUM(CASE WHEN bp.tgl_act2 IS NULL THEN 1 ELSE 0 END) = 0 AND MIN(ac.validasi) IS NULL THEN
            CASE WHEN TIMESTAMPDIFF(MINUTE, MIN(bp.tgl_act), MAX(bp.tgl_act2)) >= 60
              THEN CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, MIN(bp.tgl_act), MAX(bp.tgl_act2)) / 60), ' Jam ', MOD(TIMESTAMPDIFF(MINUTE, MIN(bp.tgl_act), MAX(bp.tgl_act2)), 60), ' Menit (Non-Resep)')
              ELSE CONCAT(TIMESTAMPDIFF(MINUTE, MIN(bp.tgl_act), MAX(bp.tgl_act2)), ' Menit (Non-Resep)') END
          ELSE 'Anomali Data'
        END AS \`Total Waktu Tunggu\`
      FROM db_rsd_soebandi_billing.b_kunjungan bk
      JOIN db_rsd_soebandi_billing.b_pelayanan bp ON bk.id = bp.kunjungan_id AND bk.unit_id = bp.unit_id
      JOIN db_rsd_soebandi_billing.b_ms_pasien mp ON mp.id = bp.pasien_id
      JOIN db_rsd_soebandi_billing.b_ms_unit mu ON mu.id = bk.unit_id
      LEFT JOIN (
        SELECT pelayanan_id, MIN(tgl_proses) AS validasi, MIN(tgl_selesai) AS penyerahan
        FROM db_antrian.b_antrian_cekin WHERE tgl_proses >= CURRENT_DATE() GROUP BY pelayanan_id
      ) ac ON ac.pelayanan_id = bp.id
      WHERE bk.tgl >= CURRENT_DATE() AND bk.tgl < CURRENT_DATE() + INTERVAL 1 DAY
        AND mp.id IN (${placeholders})
      GROUP BY mp.id, mp.nama, mp.no_rm, DATE_FORMAT(bk.tgl, '%d-%m-%Y')
      ORDER BY MIN(bp.tgl_act) ASC
      `,
      ids,
    );

    // Ubah array → object keyed by pasien_id supaya mudah di-lookup
    const data: Record<number, HistoryPerjalanan> = {};
    for (const row of rows as (HistoryPerjalanan & { pasien_id: number })[]) {
      data[row.pasien_id] = row;
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("API /api/history/batch error:", error);
    return NextResponse.json(
      { data: {}, success: false, message: "Gagal mengambil batch history" },
      { status: 500 },
    );
  }
}
