export interface DetailAntrian {
  unit_id: number;
  nama: string;
  unit_tampil: string;
  belum_dilayani: number;
  sudah_dilayani: number;
  total_antrian: number;
  kapasitas: number;
  proses_eresep?: number;
  selesai_eresep?: number;
}

export interface PasienAntri {
  no_rm: string;
  pasien_id: number;
  nama: string;
  nama_peserta: string;
}

export interface BPelayanan {
  id: number;
  no_antrian: number | string | null;
  jenis_kunjungan: number | string | null;
  pasien_id: number;
  kunjungan_id: number;
  jenis_layanan: number | string | null;
  unit_id: number;
  unit_id_asal: number | null;
  kso_id: number | null;
  kelas_id: number | null;
  tgl: string;
  tgl_krs: string | null;
  dilayani: number;
  ket: string | null;
  dokter_id: number | null;
  dokter_pj_id: number | null;
  type_dokter: number | string | null;
  tgl_act: string | null;
  user_act: number | string | null;
  no_lab: string | null;
  verifikasi: number | string | null;
  verifikator: number | string | null;
  hapus: number;
  dari_loket: number | string | null;
  tgl_act1: string | null;
  tgl_act2: string | null;
  tgl_act3: string | null;
  diagnosa_klinik: string | null;
  lokalisasi: string | null;
  keterangan_klinik: string | null;
  tanggal_sampel_pengambilan: string | null;
  tanggal_sampel_diterima: string | null;
  status_sampel: number | string | null;
  bahan_yang_diperiksa: string | null;
  is_dok_rm: number | string | null;
  status_dari: number | string | null;
  tgl_inap: string | null;
  pel_st_sampel: number | string | null;
  pel_bl: number | string | null;
  pel_ver_klab: number | string | null;
  satu_sehat_id: string | null;
  tgl_ssid: string | null;
}

export interface PasienDetail extends BPelayanan {
  unit_alias: string;
  nama_unit?: string;
  status_dilayani: "SUDAH" | "BELUM";
}

export interface HistoryPasien {
  no_rm: string;
  nama: string;
  nama_unit: string;
  nama_unit_asal: string;
  "Jam Daftar Awal": string | null;
  "Selesai Periksa Terakhir": string | null;
  "Proses Resep": string | null;
  "Penyerahan Obat": string | null;
}

/** History perjalanan pasien lengkap — versi dari api.js (fetchHistoryPasien). */
export interface HistoryPerjalanan {
  "Nama Pasien": string;
  "No. RM": string;
  Tanggal: string;
  "Rincian Pergerakan Poli": string;
  "Jam Daftar Awal": string | null;
  "Selesai Periksa Terakhir": string | null;
  "Proses Resep": string | null;
  "Penyerahan Obat": string | null;
  "Total Waktu Tunggu": string;
}

export interface WatchlistPasien {
  pasien_id: number;
  no_rm: string;
  nama: string;
  nama_unit: string;
  unit_alias: string;
  tgl_act: string;
  jam_daftar: string;
  menit_tunggu: number;
  waktu_tunggu_formatted: string;
}

export interface ApiResponse<T> { data: T; success: boolean; message?: string; }

