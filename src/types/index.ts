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

export interface PasienDetail {
  pasien_id: number;
  unit_alias: string;
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

export interface ApiResponse<T> { data: T; success: boolean; message?: string; }
