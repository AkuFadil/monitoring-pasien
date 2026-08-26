"use client";

import { useState } from "react";
import type { PoliSummary } from "./PatientMap";

interface WaitTimeChartProps {
  summary: PoliSummary | null;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: "belum_diperiksa" as const, label: "Belum Diperiksa", color: "#fda4af" },
  { value: "selesai" as const, label: "Selesai", color: "#6ee7b7" },
  { value: "e_resep" as const, label: "E-Resep", color: "#fcd34d" },
  { value: "penyerahan_obat" as const, label: "Penyerahan Obat", color: "#67e8f9" },
];

const RANGES = [
  { label: "0 - 30 menit", key: "waiting_0_30" as const, color: "#22c55e" },
  { label: ">30 - <= 60 menit", key: "waiting_30_60" as const, color: "#eab308" },
  { label: ">60 - <= 120 menit", key: "waiting_60_120" as const, color: "#f97316" },
  { label: ">120 menit", key: "waiting_120_plus" as const, color: "#ef4444" },
];

/** Chart waktu tunggu dari data aggregate poli + dropdown status + total status terpilih. */
export default function WaitTimeChart({ summary, loading = false }: WaitTimeChartProps) {
  const [statusFilter, setStatusFilter] = useState<"belum_diperiksa" | "selesai" | "e_resep" | "penyerahan_obat">("belum_diperiksa");

  const counts = RANGES.map((range) => summary?.[range.key] ?? 0);
  const maxValue = Math.max(...counts, 1);
  const selectedStatus = STATUS_OPTIONS.find((option) => option.value === statusFilter) ?? STATUS_OPTIONS[0];
  const totalStatus = summary?.[statusFilter] ?? 0;

  return (
    <div className="mt-6 border-t border-slate-700 pt-4">
      {/* Judul + dropdown sejajar */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-200">
          Summary Poli (Total Waktu Tunggu Pasien)
        </h3>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="shrink-0 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs font-bold outline-none focus:border-cyan-400"
          style={{ color: selectedStatus.color }}
          aria-label="Pilih status pasien"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Total status terpilih */}
      <div className="mt-3 rounded-xl bg-slate-900/70 p-3">
        <p className="text-xs text-slate-400">Total status terpilih</p>
        <p className="mt-1 text-3xl font-bold" style={{ color: selectedStatus.color }}>{loading ? "..." : totalStatus.toLocaleString("id-ID")}</p>
      </div>

      {/* Bar chart waktu tunggu */}
      <div className="mt-4 space-y-2.5">
        {RANGES.map((range, index) => (
          <div key={range.key}>
            <div className="mb-1 flex items-center justify-between gap-3 text-[10px] text-slate-300">
              <span>{range.label}</span>
              <span className="shrink-0 text-slate-200">{loading ? "Memuat..." : `${counts[index].toLocaleString("id-ID")} Pasien`}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-700">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(counts[index] / maxValue) * 100}%`, backgroundColor: range.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
