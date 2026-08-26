"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Clock3, Pill, Search, Stethoscope } from "lucide-react";
import type { DetailAntrian, HistoryPerjalanan, PasienAntri } from "@/types";

interface PatientHistoryTableProps {
  units: DetailAntrian[];
}

type HistoryStatus = "belum" | "selesai" | "resep" | "obat";

interface HistoryRow {
  patient: PasienAntri;
  history: HistoryPerjalanan;
  served: boolean;
}

type UnitHistoryRecord = HistoryPerjalanan & {
  pasien_id: number;
  dilayani: number;
};

const STATUS_CONFIG: Record<HistoryStatus, { label: string; color: string; icon: typeof Clock3 }> = {
  belum: { label: "Belum Diperiksa", color: "rose", icon: Clock3 },
  selesai: { label: "Selesai Periksa", color: "emerald", icon: CheckCircle2 },
  resep: { label: "Proses E-Resep", color: "amber", icon: Stethoscope },
  obat: { label: "Penyerahan Obat", color: "cyan", icon: Pill },
};

function getStatus(history: HistoryPerjalanan | null, served: boolean): HistoryStatus {
  if (served) {
    // pasien sudah dilayani — sudah pasti bukan "belum diperiksa"
    if (history?.["Penyerahan Obat"]) return "obat";
    if (history?.["Proses Resep"]) return "resep";
    if (history?.["Selesai Periksa Terakhir"]) return "selesai";
    // dilayani=1 tapi history belum lengkap — tetap anggap selesai
    return "selesai";
  }
  // belum dilayani
  if (history?.["Selesai Periksa Terakhir"]) return "selesai";
  return "belum";
}

function displayTime(value: string | null | undefined) {
  return value ? `${value.slice(0, 5)} WIB` : "—";
}

export default function PatientHistoryTable({ units }: PatientHistoryTableProps) {
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.unit_id ?? 0);
  const [activeStatus, setActiveStatus] = useState<HistoryStatus>("belum");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedUnit = units.find((unit) => unit.unit_id === selectedUnitId) ?? units[0];

  useEffect(() => {
    if (!units.some((unit) => unit.unit_id === selectedUnitId)) {
      setSelectedUnitId(units[0]?.unit_id ?? 0);
    }
  }, [units, selectedUnitId]);

  useEffect(() => {
    if (!selectedUnit) return;
    let cancelled = false;
    const unitId = selectedUnitId;

    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/history/unit?unit_id=${unitId}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("Gagal mengambil data histori poli");
        const json = await response.json();
        const records = (json.data ?? []) as UnitHistoryRecord[];

        if (!cancelled) {
          setRows(
            records.map((rec) => ({
              patient: {
                pasien_id: rec.pasien_id,
                nama: rec["Nama Pasien"],
                no_rm: rec["No. RM"],
                nama_peserta: "",
              } as PasienAntri,
              history: rec,
              served: rec.dilayani === 1,
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setError("Data histori pasien tidak dapat dimuat");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHistory();
    return () => { cancelled = true; };
  }, [selectedUnitId]);

  const filteredRows = useMemo<HistoryRow[]>(() => rows.filter(({ patient, history, served }) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || patient.nama.toLowerCase().includes(needle) || patient.no_rm.toLowerCase().includes(needle);
    return matchesSearch && getStatus(history, served) === activeStatus;
  }), [rows, search, activeStatus]);

  if (!selectedUnit) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800 shadow-md">
      <div className="border-b border-slate-700/70 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-400">Patient Journey Monitor</p>
            <h2 className="mt-1 text-lg font-bold text-slate-100 sm:text-xl">Histori Pasien on Poli</h2>
            <p className="mt-1 text-xs text-slate-400">Pantau waktu pasien berdasarkan unit pelayanan yang dipilih.</p>
          </div>
          <div className="relative w-full lg:w-64">
            <select value={selectedUnit.unit_id} onChange={(event) => setSelectedUnitId(Number(event.target.value))} className="w-full appearance-none rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 pr-9 text-sm font-semibold text-slate-300 outline-none transition focus:border-slate-400">
              {units.map((unit) => <option key={unit.unit_id} value={unit.unit_id}>{unit.unit_tampil}</option>)}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-slate-400" />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_CONFIG) as HistoryStatus[]).map((status) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const active = activeStatus === status;
              return <button key={status} type="button" onClick={() => setActiveStatus(status)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${active ? `border-${config.color}-400/60 bg-${config.color}-400/15 text-${config.color}-300` : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-slate-200"}`}><Icon size={14} />{config.label}</button>;
            })}
          </div>
          <label className="flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400 xl:max-w-xs"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau No. RM..." className="min-w-0 flex-1 bg-transparent text-slate-200 outline-none placeholder:text-slate-600" /></label>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-400"><span>Unit aktif: <strong className="text-slate-200">{selectedUnit.unit_tampil}</strong></span><span>{filteredRows.length} pasien</span></div>
        {loading ? <div className="flex items-center justify-center py-14 text-sm text-slate-400"><span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />Memuat histori...</div> : error ? <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center text-sm text-rose-300">{error}</p> : filteredRows.length === 0 ? <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">Belum ada pasien pada kategori ini.</p> : (
          <div className="overflow-x-auto rounded-xl border border-slate-700/80">
            <table className="min-w-[760px] w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-[10px] uppercase tracking-[0.14em] text-slate-400"><tr><th className="px-3 py-3 sm:px-4">No RM</th><th className="px-3 py-3 sm:px-4">Nama Pasien</th><th className="min-w-64 px-3 py-3 sm:px-4">Rincian Pergerakan di Poli</th><th className="px-3 py-3 sm:px-4">Waktu Status</th><th className="px-3 py-3 sm:px-4">Total Waktu Tunggu</th></tr></thead>
              <tbody className="divide-y divide-slate-700/70">{filteredRows.map(({ patient, history }) => <tr key={patient.pasien_id} className="transition hover:bg-slate-700/25"><td className="whitespace-nowrap px-3 py-3 font-mono text-blue-300 sm:px-4">{patient.no_rm}</td><td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-200 sm:px-4">{patient.nama}</td><td className="max-w-md px-3 py-3 leading-5 text-slate-400 sm:px-4">{history["Rincian Pergerakan Poli"] ?? `${selectedUnit.unit_tampil} — menunggu pemeriksaan`}</td><td className="whitespace-nowrap px-3 py-3 text-slate-300 sm:px-4">{activeStatus === "belum" ? displayTime(history["Jam Daftar Awal"]) : activeStatus === "selesai" ? displayTime(history["Selesai Periksa Terakhir"]) : activeStatus === "resep" ? displayTime(history["Proses Resep"]) : displayTime(history["Penyerahan Obat"])}</td><td className="whitespace-nowrap px-3 py-3 sm:px-4"><span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold ${activeStatus === "belum" || activeStatus === "resep" ? "bg-rose-400/15 text-rose-300" : "bg-emerald-400/15 text-emerald-300"}`}>{history["Total Waktu Tunggu"]}</span></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
