"use client";

import { useMemo } from "react";
import { UserRound, TriangleAlert } from "lucide-react";
import type { DetailAntrian } from "@/types";
import WaitTimeChart from "./WaitTimeChart";

interface UnitCapacityProps {
  units: DetailAntrian[];
  summaries?: import("./PatientMap").PoliSummary[];
  selectedPoliId?: number | null;
}

/** Panel kanan: nama unit, jumlah antrean, dan status kapasitas. */
export default function UnitCapacity({ units, summaries = [], selectedPoliId }: UnitCapacityProps) {
  // Poli hanya berubah ketika marker pada denah diklik.
  const selectedId = selectedPoliId ?? units[0]?.unit_id ?? null;

  const selected = useMemo(
    () => units.find((unit) => unit.unit_id === selectedId) ?? units[0],
    [selectedId, units],
  );

  const selectedSummary = useMemo(
    () => summaries.find((s) => s.poli_id === selectedId) ?? null,
    [summaries, selectedId],
  );

  if (!selected) {
    return (
      <section className="rounded-2xl border border-slate-700/40 bg-slate-800 p-6 text-slate-400 shadow-md">
        Belum ada data unit.
      </section>
    );
  }

  const capacityFull = selected.belum_dilayani >= selected.kapasitas * 0.5;
  const overloaded = selected.belum_dilayani > selected.kapasitas;
  const averageMinutes = selectedSummary?.avg_waiting_minutes ?? 0;
  const averageLabel = averageMinutes >= 60
    ? `${Math.floor(averageMinutes / 60)} JAM ${averageMinutes % 60} MENIT`
    : `${averageMinutes} MENIT`;

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-slate-700/40 bg-slate-800 p-5 shadow-md">
      {/* Header: nama unit + rata-rata waktu */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-emerald-300 sm:text-lg leading-tight break-words">{selected.unit_tampil}</h2>
        <span
          className={`text-[10px] font-semibold shrink-0 ${averageMinutes > 120 ? "text-rose-400" : "text-emerald-400"}`}
        >
          RATA-RATA WAKTU TUNGGU {averageLabel}
        </span>
      </div>

      {/* Statistik utama */}
      <div className="mt-6 flex items-center gap-4">
        <UserRound
          size={64}
          strokeWidth={1.3}
          className={`shrink-0 ${overloaded ? "text-rose-300" : "text-emerald-300"}`}
        />
        <div>
          <p className={`text-4xl font-bold leading-none sm:text-5xl ${overloaded ? "text-rose-300" : "text-emerald-300"}`}>
            {selected.belum_dilayani}
          </p>
          <p className="mt-1 text-lg text-slate-300">/ {selected.kapasitas} kursi</p>
        </div>
      </div>

      <WaitTimeChart summary={selectedSummary ?? null} />

      {/* Status kapasitas */}
      <div className={`mt-6 flex items-start gap-2 ${capacityFull ? "text-rose-300" : "text-emerald-300"}`}>
        <TriangleAlert size={18} className="mt-0.5 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Kapasitas</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em]">
            {capacityFull ? "Berlebih" : "Aman"}
          </p>
        </div>
      </div>
    </section>
  );
}
