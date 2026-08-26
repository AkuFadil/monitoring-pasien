"use client";

import { useCallback, useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import PatientMap from "@/components/PatientMap";
import UnitCapacity from "@/components/UnitCapacity";
import type { DetailAntrian } from "@/types";

/** Halaman monitor denah pasien dan kapasitas unit. */
export default function MapPage() {
  const [units, setUnits] = useState<DetailAntrian[]>([]);
  const [selectedPoliId, setSelectedPoliId] = useState<number | null>(null);
  const [summaries, setSummaries] = useState<import("@/components/PatientMap").PoliSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(async () => {
    try {
      const response = await fetch("/api/antrian", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Gagal memuat unit");
      const nextUnits = result.data ?? [];
      setUnits(nextUnits);
      setSelectedPoliId((prev) => prev ?? (nextUnits[0]?.unit_id ?? null));
      setError(null);
    } catch (reason) {
      console.error("Fetch unit map error:", reason);
      setError("Data unit tidak dapat dimuat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return (
    <main className="min-h-screen space-y-5">
      <Topbar />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-cyan-400">MONITORING PASIEN</p>
          <h1 className="text-2xl font-bold text-slate-100">Denah Lokasi Rawat Jalan</h1>
        </div>
        <a href="/dashboard" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">Dashboard Antrian</a>
      </div>

      {loading && <div className="rounded-xl bg-slate-800 p-10 text-center text-slate-400">Memuat data unit...</div>}
      {error && <div className="rounded-xl border border-rose-700 bg-rose-950/30 p-6 text-center text-rose-300">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
          <PatientMap
            units={units}
            selectedPoliId={selectedPoliId}
            onSelectPoli={(id) => setSelectedPoliId(id)}
            onSummariesChange={(s) => setSummaries(s)}
          />
          <UnitCapacity units={units} summaries={summaries} selectedPoliId={selectedPoliId} />
        </div>
      )}
    </main>
  );
}
