"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, UserRound, TriangleAlert } from "lucide-react";
import type { DetailAntrian } from "@/types";
import WaitTimeChart from "./WaitTimeChart";

interface UnitCapacityProps {
  units: DetailAntrian[];
  summaries?: import("./PatientMap").PoliSummary[];
  selectedPoliId?: number | null;
  onSelectedUnitChange?: (unitId: number) => void;
}

/** Palet warna unik untuk setiap poli — pakai inline style agar pasti jalan. */
const POLI_COLORS_HEX = [
  "#22d3ee", // cyan
  "#fbbf24", // amber
  "#fb7185", // rose
  "#34d399", // emerald
  "#a78bfa", // violet
  "#fb923c", // orange
  "#38bdf8", // sky
  "#f472b6", // pink
  "#2dd4bf", // teal
  "#facc15", // yellow
  "#818cf8", // indigo
  "#f87171", // red
  "#a3e635", // lime
  "#e879f9", // fuchsia
  "#60a5fa", // blue
  "#4ade80", // green
  "#c084fc", // purple
  "#94a3b8", // slate
  "#67e8f9", // cyan-300
  "#fcd34d", // amber-300
];

/** Panel kanan: nama unit, jumlah antrean, dan status kapasitas. */
export default function UnitCapacity({ units, summaries = [], selectedPoliId, onSelectedUnitChange }: UnitCapacityProps) {
  const [selectedId, setSelectedId] = useState<number | null>(units[0]?.unit_id ?? null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Sinkronisasi selectedId dari marker denah / parent
  useEffect(() => {
    if (selectedPoliId != null) {
      setSelectedId(selectedPoliId);
    }
  }, [selectedPoliId]);

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
    <section className="relative rounded-2xl border border-slate-700/40 bg-slate-800 p-5 shadow-md">
      {/* Header: nama unit + filter */}
      <div className="flex items-center justify-between gap-3">
        {(() => {
          const colorIdx = units.findIndex((u) => u.unit_id === selected.unit_id);
          const hex = POLI_COLORS_HEX[colorIdx >= 0 ? colorIdx % POLI_COLORS_HEX.length : 0];
          return <h2 className="text-lg font-bold" style={{ color: hex }}>{selected.unit_tampil}</h2>;
        })()}
        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-semibold ${averageMinutes > 120 ? "text-rose-400" : "text-emerald-400"}`}
          >
            RATA-RATA WAKTU TUNGGU {averageLabel}
          </span>
          <button
            type="button"
            onClick={() => setFilterOpen((prev) => !prev)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
            aria-label="Filter unit"
          >
            <SlidersHorizontal size={22} />
          </button>
        </div>
      </div>

      {/* Dropdown filter unit */}
      {filterOpen && (
        <div className="absolute right-6 top-20 z-10 max-h-64 w-64 overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 p-2 shadow-xl">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pilih unit
          </p>
          {units.map((unit, uIdx) => {
            const hex = POLI_COLORS_HEX[uIdx % POLI_COLORS_HEX.length];
            return (
              <button
                key={unit.unit_id}
                type="button"
                onClick={() => {
                  setSelectedId(unit.unit_id);
                  onSelectedUnitChange?.(unit.unit_id);
                  setFilterOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                  unit.unit_id === selected.unit_id
                    ? "bg-slate-700/50"
                    : "hover:bg-slate-800"
                }`}
                style={{ color: hex }}
              >
              {unit.unit_tampil}
            </button>
          );
          })}
        </div>
      )}

      {/* Statistik utama */}
      <div className="mt-8 flex items-center gap-4">
        <UserRound
          size={72}
          strokeWidth={1.3}
          className={`shrink-0 ${overloaded ? "text-rose-300" : "text-emerald-300"}`}
        />
        <div>
          <p className={`text-5xl font-bold leading-none ${overloaded ? "text-rose-300" : "text-emerald-300"}`}>
            {selected.belum_dilayani}
          </p>
          <p className="mt-1 text-xl text-slate-300">/ {selected.kapasitas} kursi</p>
        </div>
      </div>

      <WaitTimeChart summary={selectedSummary ?? null} />

      {/* Status kapasitas */}
      <div className={`mt-8 flex items-start gap-2 ${capacityFull ? "text-rose-300" : "text-emerald-300"}`}>
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
