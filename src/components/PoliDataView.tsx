"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Building2, Search, Users, CheckCircle2, Clock3, Pill, Stethoscope, ChevronDown, ExternalLink } from "lucide-react";
import Pagination from "@/components/Pagination";
import type { DetailAntrian, PasienAntri } from "@/types";

interface PoliDataViewProps {
  data: DetailAntrian[];
  eresepCounts?: Record<number, { proses: number; selesai: number }>;
}

type TabStatus = "belum" | "sudah" | "semua";

const PAGE_SIZE = 10;

export default function PoliDataView({ data, eresepCounts = {} }: PoliDataViewProps) {
  // Otomatis pilih unit pertama yang ada antrian atau data[0]
  const [selectedUnitId, setSelectedUnitId] = useState<number>(() => {
    const activeUnit = data.find((u) => u.total_antrian > 0);
    return activeUnit ? activeUnit.unit_id : (data[0]?.unit_id ?? 0);
  });

  const [activeTab, setActiveTab] = useState<TabStatus>("belum");
  const [patientSearch, setPatientSearch] = useState("");
  const [page, setPage] = useState(1);

  const [waitingPatients, setWaitingPatients] = useState<PasienAntri[]>([]);
  const [servedPatients, setServedPatients] = useState<PasienAntri[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);

  // Ambil objek unit aktif
  const currentUnit = useMemo(() => {
    return data.find((u) => u.unit_id === selectedUnitId) ?? data[0];
  }, [data, selectedUnitId]);

  // Sinkronisasi pilihan unit jika data baru dimuat
  useEffect(() => {
    if (data.length > 0 && !data.some((u) => u.unit_id === selectedUnitId)) {
      const activeUnit = data.find((u) => u.total_antrian > 0) ?? data[0];
      setSelectedUnitId(activeUnit.unit_id);
    }
  }, [data, selectedUnitId]);

  // Ambil daftar pasien untuk unit yang dipilih
  const fetchPatients = useCallback(async (unitId: number) => {
    if (!unitId) return;
    setLoadingPatients(true);
    setPatientError(null);
    try {
      const [resBelum, resSudah] = await Promise.all([
        fetch(`/api/antrian?unit_id=${unitId}&dilayani=0`, { cache: "no-store" }),
        fetch(`/api/antrian?unit_id=${unitId}&dilayani=1`, { cache: "no-store" }),
      ]);

      if (!resBelum.ok || !resSudah.ok) throw new Error("Gagal mengambil data pasien");

      const [jsonBelum, jsonSudah] = await Promise.all([
        resBelum.json(),
        resSudah.json(),
      ]);

      setWaitingPatients(jsonBelum.data ?? []);
      setServedPatients(jsonSudah.data ?? []);
    } catch {
      setWaitingPatients([]);
      setServedPatients([]);
      setPatientError("Daftar pasien tidak dapat dimuat");
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  useEffect(() => {
    if (currentUnit) {
      void fetchPatients(currentUnit.unit_id);
    }
  }, [currentUnit, fetchPatients]);

  // Daftar pasien aktif sesuai tab & pencarian
  const displayedPatients = useMemo(() => {
    let list: (PasienAntri & { status: "BELUM" | "SUDAH" })[] = [];
    if (activeTab === "belum") {
      list = waitingPatients.map((p) => ({ ...p, status: "BELUM" }));
    } else if (activeTab === "sudah") {
      list = servedPatients.map((p) => ({ ...p, status: "SUDAH" }));
    } else {
      list = [
        ...waitingPatients.map((p) => ({ ...p, status: "BELUM" as const })),
        ...servedPatients.map((p) => ({ ...p, status: "SUDAH" as const })),
      ];
    }

    if (!patientSearch.trim()) return list;
    const needle = patientSearch.trim().toLowerCase();
    return list.filter(
      (p) =>
        p.nama.toLowerCase().includes(needle) ||
        p.no_rm.toLowerCase().includes(needle) ||
        (p.nama_peserta && p.nama_peserta.toLowerCase().includes(needle))
    );
  }, [activeTab, waitingPatients, servedPatients, patientSearch]);

  useEffect(() => {
    setPage(1);
  }, [selectedUnitId, activeTab, patientSearch]);

  const pageCount = Math.max(1, Math.ceil(displayedPatients.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedPatients = displayedPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (!currentUnit) return null;

  const eresep = eresepCounts[currentUnit.unit_id] ?? { proses: 0, selesai: 0 };

  return (
    <div className="space-y-6">
      {/* Header Selector Unit Poli */}
      <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/40 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                TAMPILAN MONITORING PER POLI
              </p>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">
                {currentUnit.unit_tampil}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Total Antrian Hari Ini: <strong className="text-slate-200">{currentUnit.total_antrian} Pasien</strong> | Kapasitas: {currentUnit.kapasitas} Kursi
              </p>
            </div>
          </div>

          {/* Selector Dropdown Unit Poli */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-80">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                PILIH UNIT POLI:
              </label>
              <div className="relative">
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                  className="w-full appearance-none bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 pr-10 text-sm font-bold text-cyan-300 outline-none focus:border-cyan-400 transition-colors cursor-pointer"
                >
                  {data.map((u) => (
                    <option key={u.unit_id} value={u.unit_id}>
                      {u.unit_tampil} ({u.total_antrian} Antrian)
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Cards Summary Per Poli */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("belum")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "belum"
              ? "bg-rose-900/40 border-rose-500 shadow-lg shadow-rose-950/40"
              : "bg-slate-800 border-slate-700/50 hover:border-rose-500/50"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Belum Dilayani</span>
            <Clock3 size={18} className="text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400 mt-2">
            {currentUnit.belum_dilayani}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Pasien menunggu pemeriksaan</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sudah")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "sudah"
              ? "bg-emerald-900/40 border-emerald-500 shadow-lg shadow-emerald-950/40"
              : "bg-slate-800 border-slate-700/50 hover:border-emerald-500/50"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Sudah Dilayani</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">
            {currentUnit.sudah_dilayani}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Pasien selesai diperiksa</p>
        </button>

        <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Proses e-Resep</span>
            <Stethoscope size={18} className="text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">
            {eresep.proses}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Resep sedang diproses</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Selesai e-Resep</span>
            <Pill size={18} className="text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-cyan-400 mt-2">
            {eresep.selesai}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Obat siap diserahkan</p>
        </div>
      </div>

      {/* Tabel Utama Pasien Poli */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700/40 shadow-md overflow-hidden">
        {/* Header Table & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="text-cyan-400" size={20} />
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Daftar Pasien — {currentUnit.unit_tampil}
              </h2>
              <p className="text-xs text-slate-400">
                Menampilkan {displayedPatients.length} pasien
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Filter Tabs Status */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab("belum")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "belum"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Belum ({waitingPatients.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sudah")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "sudah"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sudah ({servedPatients.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("semua")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "semua"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Semua ({waitingPatients.length + servedPatients.length})
              </button>
            </div>

            {/* Patient Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama pasien / RM..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full sm:w-48 bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Content Table Pasien */}
        <div className="p-4 sm:p-5">
          {loadingPatients ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent mr-3" />
              Memuat data pasien {currentUnit.unit_tampil}...
            </div>
          ) : patientError ? (
            <div className="bg-rose-900/20 border border-rose-700/50 rounded-xl p-6 text-center text-rose-300 text-xs">
              {patientError}
            </div>
          ) : displayedPatients.length === 0 ? (
            <div className="border border-dashed border-slate-700 rounded-xl p-12 text-center text-slate-500 text-xs">
              Tidak ada pasien dalam kategori ini.
            </div>
          ) : (
            <>
            <div className="overflow-x-auto rounded-xl border border-slate-700/70">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">No. RM</th>
                    <th className="px-4 py-3">Nama Pasien</th>
                    <th className="px-4 py-3">Jenis Peserta / Penjamin</th>
                    <th className="px-4 py-3 text-center">Status Pelayanan</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {paginatedPatients.map((p, index) => (
                    <tr
                      key={`${p.no_rm}-${index}`}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-center font-semibold text-slate-500">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                        <Link href={`/pasien/${p.pasien_id}`} className="hover:underline">
                          {p.no_rm}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-100">
                        <Link href={`/pasien/${p.pasien_id}`} className="hover:text-cyan-300 hover:underline">
                          {p.nama}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {p.nama_peserta || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === "BELUM"
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {p.status === "BELUM" ? "BELUM DILAYANI" : "SUDAH DILAYANI"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/pasien/${p.pasien_id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-[10px] font-bold transition-all"
                        >
                          Detail <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} pageSize={PAGE_SIZE} total={displayedPatients.length} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
