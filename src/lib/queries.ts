import pool from "./db";
import type { DetailAntrian, PasienAntri, PasienDetail, HistoryPasien } from "@/types";

/**
 * Mapping kapasitas kursi per poli — hardcoded dari data RS dr. Soebandi.
 * Key berupa nama poli (lowercase) untuk pencocokan fleksibel.
 */
const KAPASITAS_POLI: Record<string, number> = {
  "anastesi": 32,
  "bedah digestif": 14,
  "bedah orthopedi": 25,
  "bedah saraf": 14,
  "bedah umum": 14,
  "bedah thorax": 21,
  "bedah thorak": 21,
  "gizi": 2,
  "hip knee": 25,
  "kehamilan": 54,
  "kandungan": 54,
  "saraf": 20,
  "spine": 25,
  "mcu dan vaksin": 15,
  "vaksin": 15,
  "klinik vaksin": 15,
  "platinum": 5,
  "soebandi scint center": 5,
  "bedah onkologi": 25,
  "onko anak": 25,
  "hemato onkologi": 25,
  "hema onko": 25,
  "bedah anak": 21,
  "bedah plastic": 21,
  "bedah plastik": 21,
  "bedah tkv": 21,
  "bedah urologi": 21,
  "kemotrapi": 8,
  "kulit kelamin": 56,
  "mata": 75,
  "psikiatri": 32,
  "vct": 10,
  "rehabilitasi medik": 40,
  "gastroenterologi hepatologi": 38,
  "gastroenterologi-hepatologi": 38,
  "hemodalisa": 20,
  "jantung dan pemubuluh darah": 108,
  "jantung dan pembuluh darah": 108,
  "jantung": 108,
  "paru": 16,
  "penyakit dalam": 38,
  "interna": 38,
  "poli anak": 40,
  "gigi dan mulut": 24,
  "gigi": 24,
  "kardiologi anak": 10,
  "tht": 40,
};

/** Cari kapasitas berdasarkan nama unit (fuzzy lowercase match). */
function getKapasitas(namaUnit: string): number {
  const lower = namaUnit.toLowerCase().trim();
  if (KAPASITAS_POLI[lower] !== undefined) return KAPASITAS_POLI[lower];
  for (const [key, val] of Object.entries(KAPASITAS_POLI)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return 0;
}

export async function getDetailAntrian(): Promise<DetailAntrian[]> {
  const [rows] = await pool.query(`
    SELECT 
      unit.id AS unit_id, 
      unit.nama, 
      COALESCE(NULLIF(TRIM(unit.unit_alias), ''), unit.nama) AS unit_tampil, 
      COALESCE(pelayanan.belum_dilayani, 0) AS belum_dilayani, 
      COALESCE(pelayanan.sudah_dilayani, 0) AS sudah_dilayani, 
      COALESCE(pelayanan.total_antrian, 0) AS total_antrian 
    FROM db_rsd_soebandi_billing.b_ms_unit unit 
    LEFT JOIN (
      SELECT 
        x.unit_id, 
        SUM(x.status_pasien = 'belum') AS belum_dilayani, 
        SUM(x.status_pasien != 'belum') AS sudah_dilayani, 
        COUNT(*) AS total_antrian 
      FROM (
        SELECT 
          bp.unit_id, 
          bp.pasien_id,
          CASE 
            WHEN MAX(ac.penyerahan) IS NOT NULL THEN 'obat'
            WHEN MIN(ac.validasi) IS NOT NULL THEN 'resep'
            WHEN MAX(bp.tgl_act2) IS NOT NULL OR MAX(bp.dilayani) = 1 THEN 'selesai'
            ELSE 'belum'
          END AS status_pasien
        FROM db_rsd_soebandi_billing.b_pelayanan bp
        LEFT JOIN (
          SELECT pelayanan_id, MIN(tgl_proses) AS validasi, MIN(tgl_selesai) AS penyerahan
          FROM db_antrian.b_antrian_cekin 
          WHERE tgl_proses >= CURRENT_DATE() 
          GROUP BY pelayanan_id
        ) ac ON bp.id = ac.pelayanan_id
        WHERE bp.tgl >= CURRENT_DATE() AND bp.tgl < CURRENT_DATE() + INTERVAL 1 DAY
        GROUP BY bp.unit_id, bp.pasien_id
      ) x 
      GROUP BY x.unit_id
    ) pelayanan ON unit.id = pelayanan.unit_id 
    WHERE unit.parent_id = '1' AND unit.aktif = 1 
    ORDER BY total_antrian DESC
  `);
  const data = rows as Omit<DetailAntrian, "kapasitas">[];
  return data.map((row) => ({
    ...row,
    kapasitas: getKapasitas(row.unit_tampil) || getKapasitas(row.nama),
  }));
}

export async function getPasienAntri(unitId: number | string, dilayani: number | string): Promise<PasienAntri[]> {
  const [rows] = await pool.query(`SELECT bp.pasien_id, b.no_rm, b.nama, c.nama_peserta FROM db_rsd_soebandi_billing.b_pelayanan bp JOIN db_rsd_soebandi_billing.b_ms_pasien b ON bp.pasien_id = b.id JOIN db_rsd_soebandi_billing.b_kunjungan c ON bp.pasien_id = c.pasien_id AND DATE(c.tgl) = CURDATE() WHERE DATE(bp.tgl) = CURDATE() AND bp.dilayani = ? AND bp.unit_id = ? ORDER BY b.nama ASC`, [dilayani, unitId]);
  return rows as PasienAntri[];
}

export async function getPasienDetail(pasienId: number | string): Promise<PasienDetail[]> {
  const [rows] = await pool.query(`SELECT a.pasien_id, b.unit_alias, CASE WHEN a.dilayani = 0 THEN 'BELUM' ELSE 'SUDAH' END AS status_dilayani FROM db_rsd_soebandi_billing.b_pelayanan a JOIN db_rsd_soebandi_billing.b_ms_unit b ON a.unit_id = b.id WHERE DATE(a.tgl) = CURDATE() AND a.pasien_id = ? ORDER BY a.tgl_act`, [pasienId]);
  return rows as PasienDetail[];
}

export async function getHistoryPasien(pasienId: number | string): Promise<HistoryPasien[]> {
  const [rows] = await pool.query(`SELECT c.no_rm, c.nama, u_tujuan.nama AS nama_unit, u_asal.nama AS nama_unit_asal, DATE_FORMAT(bp.tgl_act, '%H:%i:%s') AS \`Jam Daftar Awal\`, DATE_FORMAT(bp.tgl_act2, '%H:%i:%s') AS \`Selesai Periksa Terakhir\`, DATE_FORMAT(ac.validasi, '%H:%i:%s') AS \`Proses Resep\`, DATE_FORMAT(ac.penyerahan, '%H:%i:%s') AS \`Penyerahan Obat\` FROM db_rsd_soebandi_billing.b_pelayanan bp JOIN db_rsd_soebandi_billing.b_ms_pasien c ON bp.pasien_id = c.id LEFT JOIN db_rsd_soebandi_billing.b_ms_unit u_tujuan ON bp.unit_id = u_tujuan.id LEFT JOIN db_rsd_soebandi_billing.b_ms_unit u_asal ON bp.unit_id_asal = u_asal.id LEFT JOIN (SELECT pelayanan_id, MIN(tgl_proses) AS validasi, MIN(tgl_selesai) AS penyerahan FROM db_antrian.b_antrian_cekin WHERE tgl_proses >= CURRENT_DATE() GROUP BY pelayanan_id) ac ON bp.id = ac.pelayanan_id WHERE DATE(bp.tgl) >= CURRENT_DATE() AND bp.pasien_id = ?`, [pasienId]);
  return rows as HistoryPasien[];
}

/** Query history lengkap dari api.js, dipisahkan agar query history lama tetap utuh. */
export async function getHistoryPerjalananByUnit(unitId: number | string): Promise<(import("@/types").HistoryPerjalanan & { pasien_id: number; dilayani: number })[]> {
  const [rows] = await pool.query(`
    SELECT
      mp.id AS pasien_id,
      MAX(bp.dilayani) AS dilayani,
      mp.nama AS \`Nama Pasien\`,
      mp.no_rm AS \`No. RM\`,
      DATE_FORMAT(MIN(bp.tgl), '%d-%m-%Y') AS Tanggal,
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
    FROM db_rsd_soebandi_billing.b_pelayanan bp
    JOIN db_rsd_soebandi_billing.b_ms_pasien mp ON mp.id = bp.pasien_id
    JOIN db_rsd_soebandi_billing.b_ms_unit mu ON mu.id = bp.unit_id
    LEFT JOIN (
      SELECT pelayanan_id, MIN(tgl_proses) AS validasi, MIN(tgl_selesai) AS penyerahan
      FROM db_antrian.b_antrian_cekin
      WHERE tgl_proses >= CURRENT_DATE()
      GROUP BY pelayanan_id
    ) ac ON ac.pelayanan_id = bp.id
    WHERE bp.tgl >= CURRENT_DATE() AND bp.tgl < CURRENT_DATE() + INTERVAL 1 DAY
      AND bp.unit_id = ?
    GROUP BY mp.id, mp.nama, mp.no_rm
    ORDER BY MIN(bp.tgl_act) ASC
  `, [unitId]);
  return rows as (import("@/types").HistoryPerjalanan & { pasien_id: number; dilayani: number })[];
}

export async function getHistoryPerjalanan(pasienId: number | string): Promise<import("@/types").HistoryPerjalanan[]> {
  const [rows] = await pool.query(`
    SELECT
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
      AND mp.id = ?
    GROUP BY mp.id, mp.nama, mp.no_rm, DATE_FORMAT(bk.tgl, '%d-%m-%Y')
    ORDER BY MIN(bp.tgl_act) ASC
  `, [pasienId]);
  return rows as import("@/types").HistoryPerjalanan[];
}

export async function getPriorityWatchlist(): Promise<import("@/types").WatchlistPasien[]> {
  const [rows] = await pool.query(`
    SELECT
      bp.pasien_id,
      mp.no_rm,
      mp.nama,
      mu.nama AS nama_unit,
      COALESCE(NULLIF(TRIM(mu.unit_alias), ''), mu.nama) AS unit_alias,
      bp.tgl_act,
      DATE_FORMAT(bp.tgl_act, '%H:%i:%s') AS jam_daftar,
      TIMESTAMPDIFF(MINUTE, bp.tgl_act, NOW()) AS menit_tunggu,
      CASE
        WHEN TIMESTAMPDIFF(MINUTE, bp.tgl_act, NOW()) >= 60
        THEN CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, bp.tgl_act, NOW()) / 60), ' Jam ', MOD(TIMESTAMPDIFF(MINUTE, bp.tgl_act, NOW()), 60), ' Menit')
        ELSE CONCAT(TIMESTAMPDIFF(MINUTE, bp.tgl_act, NOW()), ' Menit')
      END AS waktu_tunggu_formatted
    FROM db_rsd_soebandi_billing.b_pelayanan bp
    JOIN db_rsd_soebandi_billing.b_ms_pasien mp ON bp.pasien_id = mp.id
    JOIN db_rsd_soebandi_billing.b_ms_unit mu ON bp.unit_id = mu.id
    WHERE DATE(bp.tgl) = CURDATE()
      AND bp.dilayani = 0
      AND TIMESTAMPDIFF(MINUTE, bp.tgl_act, NOW()) >= 120
    ORDER BY menit_tunggu DESC
  `);
  return rows as import("@/types").WatchlistPasien[];
}

