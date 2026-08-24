"use client";

import { useEffect, useState } from "react";

interface WaitTimeChartProps {
  unitId: number;
}

interface HistoryRow {
  "Total Waktu Tunggu"?: string | null;
}

interface PatientRow {
  pasien_id: number;
}

const RANGES = [
  { label: "0 - 30 menit", min: 0, max: 30, color: "#22c55e" },
  { label: ">30 - <= 60 menit", min: 31, max: 60, color: "#3b82f6" },
  { label: ">60 - <= 120 menit", min: 61, max: 120, color: "#f59e0b" },
  { label: ">120 menit", min: 121, max: Infinity, color: "#ef4444" },
];

function parseWaitMinutes(value: string | null | undefined) {
  if (!value || /masih|anomali/i.test(value)) return null;
  const hours = Number(value.match(/(\d+)\s*Jam/i)?.[1] ?? 0);
  const minutes = Number(value.match(/(\d+)\s*Menit/i)?.[1] ?? 0);
  return hours * 60 + minutes;
}

/** Chart waktu tunggu real dari history pasien yang sudah tersedia. */
export default function WaitTimeChart({ unitId }: WaitTimeChartProps) {
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadWaitTimes() {
      setLoading(true);
      try {
        const patients = new Map<number, PatientRow>();
        for (const dilayani of ["0", "1"]) {
          const response = await fetch(`/api/antrian?unit_id=${unitId}&dilayani=${dilayani}`, { cache: "no-store" });
          if (!response.ok) continue;
          const result = await response.json();
          for (const patient of (result.data ?? []) as PatientRow[]) {
            patients.set(patient.pasien_id, patient);
          }
        }

        const histories = await Promise.all(
          Array.from(patients.values()).map(async (patient) => {
            const response = await fetch(`/api/history?pasien_id=${patient.pasien_id}`, { cache: "no-store" });
            if (!response.ok) return null;
            const result = await response.json();
            return (result.data?.[0] ?? null) as HistoryRow | null;
          }),
        );

        const nextCounts = [0, 0, 0, 0];
        histories.forEach((history) => {
          const minutes = parseWaitMinutes(history?.["Total Waktu Tunggu"]);
          if (minutes === null) return;
          const index = RANGES.findIndex((range) => minutes >= range.min && minutes <= range.max);
          if (index >= 0) nextCounts[index] += 1;
        });
        if (!cancelled) setCounts(nextCounts);
      } catch (error) {
        console.error("Fetch waktu tunggu error:", error);
        if (!cancelled) setCounts([0, 0, 0, 0]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadWaitTimes();
    return () => { cancelled = true; };
  }, [unitId]);

  const maxValue = Math.max(...counts, 1);

  return (
    <div className="mt-6 border-t border-slate-700 pt-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-200">
        Total Waktu Tunggu Pasien
      </h3>
      <div className="space-y-2.5">
        {RANGES.map((range, index) => (
          <div key={range.label}>
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
