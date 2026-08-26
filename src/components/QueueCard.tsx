"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Pagination from "@/components/Pagination";
import type { DetailAntrian, HistoryPerjalanan, PasienAntri } from "@/types";

interface QueueCardProps {
  antrian: DetailAntrian;
  eresepCount?: { proses: number; selesai: number };
}
type StatusTab = "belum" | "sudah";

const PAGE_SIZE = 10;

export default function QueueCard({ antrian, eresepCount }: QueueCardProps) {
  const [activeTab, setActiveTab] = useState<StatusTab | null>(null);
  const [patients, setPatients] = useState<PasienAntri[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sudahDilayani, setSudahDilayani] = useState(antrian.sudah_dilayani);
  const [belumDilayani, setBelumDilayani] = useState(antrian.belum_dilayani);
  const prosesResep = eresepCount?.proses ?? 0;
  const selesaiResep = eresepCount?.selesai ?? 0;

  useEffect(() => {
    setSudahDilayani(antrian.sudah_dilayani);
    setBelumDilayani(antrian.belum_dilayani);
  }, [antrian.sudah_dilayani, antrian.belum_dilayani]);

  async function showPatients(tab: StatusTab) {
    setActiveTab(tab);
    setPage(1);
    setLoadingPatients(true);
    setPatientError(null);
    try {
      const dilayani = tab === "belum" ? "0" : "1";
      const res = await fetch(`/api/antrian?unit_id=${antrian.unit_id}&dilayani=${dilayani}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Gagal memuat pasien");
      setPatients(json.data ?? []);
    } catch {
      setPatients([]);
      setPatientError("Daftar pasien tidak dapat dimuat");
    } finally {
      setLoadingPatients(false);
    }
  }

  const pageCount = Math.max(1, Math.ceil(patients.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedPatients = patients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/40 shadow-md flex flex-col transition-all duration-300 hover:shadow-xl hover:border-slate-600">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2.5">
        <h2 className="text-sm font-bold text-cyan-400">{antrian.unit_tampil}</h2>
        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-semibold">
          Total Antrian : {antrian.total_antrian}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center pt-2.5">
        <button onClick={() => showPatients("belum")} className={`p-2.5 rounded-xl border transition-colors ${activeTab === "belum" ? "bg-rose-900/50 border-rose-400" : "bg-slate-900/60 border-slate-700/30 hover:border-rose-400/70"}`}>
          <span className="block text-[10px] text-slate-400 font-semibold">Belum Dilayani</span>
          <span className="block text-xl font-bold text-rose-400 mt-0.5">{belumDilayani}</span>
        </button>
        <button onClick={() => showPatients("sudah")} className={`p-2.5 rounded-xl border transition-colors ${activeTab === "sudah" ? "bg-emerald-900/50 border-emerald-400" : "bg-slate-900/60 border-slate-700/30 hover:border-emerald-400/70"}`}>
          <span className="block text-[10px] text-slate-400 font-semibold">Sudah Dilayani</span>
          <span className="block text-xl font-bold text-emerald-400 mt-0.5">{sudahDilayani}</span>
        </button>
        <div className="p-2.5 rounded-xl border border-slate-700/30 bg-slate-900/60 text-center">
          <span className="block text-[10px] text-slate-400 font-semibold">Proses e-resep</span>
          <span className="block text-xl font-bold text-rose-400 mt-0.5">{prosesResep}</span>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-700/30 bg-slate-900/60 text-center">
          <span className="block text-[10px] text-slate-400 font-semibold">Selesai e-resep</span>
          <span className="block text-xl font-bold text-emerald-400 mt-0.5">{selesaiResep}</span>
        </div>
      </div>

      {activeTab && (
        <section className="mt-3 rounded-xl border border-slate-700 bg-slate-900/70 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
            <h3 className="font-semibold text-sm text-slate-200">Pasien {activeTab === "belum" ? "Belum" : "Sudah"} Dilayani</h3>
            <button onClick={() => setActiveTab(null)} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
          </div>
          {loadingPatients ? (
            <p className="p-3 text-center text-xs text-slate-400">Memuat data pasien...</p>
          ) : patientError ? (
            <p className="p-3 text-center text-xs text-rose-400">{patientError}</p>
          ) : patients.length === 0 ? (
            <p className="p-3 text-center text-xs text-slate-400">Tidak ada pasien.</p>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-800 text-slate-400">
                  <tr>
                    <th className="px-3 py-1.5 font-medium">No</th>
                    <th className="px-3 py-1.5 font-medium">No RM</th>
                    <th className="px-3 py-1.5 font-medium">Nama Pasien</th>
                    <th className="px-3 py-1.5 font-medium">Peserta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paginatedPatients.map((p, i) => (
                    <tr key={`${p.no_rm}-${i}`} className="hover:bg-slate-800/70">
                      <td className="px-3 py-1.5 text-slate-500">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-3 py-1.5 text-cyan-400 font-mono text-[11px]">
                        <Link href={`/pasien/${p.pasien_id}`} className="hover:underline">
                          {p.no_rm}
                        </Link>
                      </td>
                      <td className="px-3 py-1.5 text-slate-200 font-semibold">
                        <Link href={`/pasien/${p.pasien_id}`} className="hover:text-cyan-300 hover:underline">
                          {p.nama}
                        </Link>
                      </td>
                      <td className="px-3 py-1.5 text-slate-400">{p.nama_peserta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={currentPage} pageSize={PAGE_SIZE} total={patients.length} onPageChange={setPage} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
