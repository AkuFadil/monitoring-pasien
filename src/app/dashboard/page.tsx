"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Topbar from "@/components/Topbar";
import SummaryCards from "@/components/SummaryCards";
import QueueGrid from "@/components/QueueGrid";
import PatientMap from "@/components/PatientMap";
import PatientHistoryTable from "@/components/PatientHistoryTable";
import UnitCapacity from "@/components/UnitCapacity";
import Footer from "@/components/Footer";
import type { DetailAntrian } from "@/types";

/**
 * Dashboard Page — halaman utama monitoring antrian
 * Menggantikan Dashboard_view.php + Dashboard.php controller
 * Data di-fetch dari API /api/antrian dengan auto-refresh tiap 60 detik
 */
export default function DashboardPage() {
  const [data, setData] = useState<DetailAntrian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/antrian");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.message || "Gagal memuat data");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch awal + polling tiap 3 detik (seperti api-pasien-tracker.js)
  useEffect(() => {
    fetchData();

    // Polling cepat 3 detik seperti Socket.IO interval di api-pasien-tracker.js
    const pollInterval = setInterval(fetchData, 3_000);

    // Listen juga untuk event refresh manual dari Footer
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

      {/* Ringkasan statistik di bawah header dan clock */}
      {!loading && !error && <SummaryCards data={data} />}

      {/* Denah lokasi + kapasitas unit */}
      {!loading && !error && data.length > 0 && (
        <>
          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
            <PatientMap units={data} />
            <UnitCapacity units={data} />
          </div>
          <PatientHistoryTable units={data} />
        </>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center my-6">
          <p className="text-red-400 font-semibold">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Queue grid */}
      {!loading && !error && <QueueGrid data={data} />}

      <Footer onRefresh={fetchData} />
    </div>
  );
}
