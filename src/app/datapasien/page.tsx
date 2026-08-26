"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Topbar from "@/components/Topbar";
import PoliDataView from "@/components/PoliDataView";
import QueueGrid from "@/components/QueueGrid";
import Footer from "@/components/Footer";
import { LayoutGrid, Table2 } from "lucide-react";
import type { DetailAntrian } from "@/types";

export default function DataPasienPage() {
  const [data, setData] = useState<DetailAntrian[]>([]);
  const [eresepCounts, setEresepCounts] = useState<Record<number, { proses: number; selesai: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");
  const requestInFlight = useState({ current: false })[0];

  const fetchData = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    try {
      const [queueRes, resepRes] = await Promise.all([
        fetch("/api/antrian", { cache: "no-store" }),
        fetch("/api/antrian/eresep-counts", { cache: "no-store" }),
      ]);
      if (!queueRes.ok) throw new Error(`HTTP ${queueRes.status}`);
      const json = await queueRes.json();
      if (resepRes.ok) {
        const resepJson = await resepRes.json();
        if (resepJson.success) setEresepCounts(resepJson.data ?? {});
      }
      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.message || "Gagal memuat data");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Tidak dapat terhubung ke server");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, [requestInFlight]);

  useEffect(() => {
    fetchData();
    const pollInterval = setInterval(fetchData, 60_000);
    const handleRefresh = () => fetchData();
    window.addEventListener("dashboard-refresh", handleRefresh);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("dashboard-refresh", handleRefresh);
    };
  }, [fetchData]);

  const totalPasien = data.reduce((acc, item) => acc + item.total_antrian, 0);

  return (
    <div className="space-y-7">
      <Topbar />
      <Header totalPasien={totalPasien} />

      {!loading && !error && (
        <div className="flex justify-end">
          <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700/60 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid size={15} /> Tampilan Grid Poli
            </button>
            <button
              type="button"
              onClick={() => setViewMode("detail")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "detail"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Table2 size={15} /> Detail Per Poli & Tabel
            </button>
          </div>
        </div>
      )}

      {loading && <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent" /></div>}
      {error && !loading && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center my-6">
          <p className="text-red-400 font-semibold">{error}</p>
          <button onClick={fetchData} className="mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">Coba Lagi</button>
        </div>
      )}

      {!loading && !error && (
        viewMode === "grid" ? (
          <QueueGrid data={data} eresepCounts={eresepCounts} />
        ) : (
          <PoliDataView data={data} eresepCounts={eresepCounts} />
        )
      )}
      <Footer onRefresh={fetchData} />
    </div>
  );
}
