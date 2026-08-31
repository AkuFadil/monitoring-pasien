"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import Topbar from "@/components/Topbar";
import SummaryCards from "@/components/SummaryCards";
import PatientMap, { type PoliSummary } from "@/components/PatientMap";
import PatientHistoryTable from "@/components/PatientHistoryTable";
import UnitCapacity from "@/components/UnitCapacity";
import Footer from "@/components/Footer";
import type { DetailAntrian } from "@/types";

interface UserProfile {
  id: number;
  username: string;
  nama: string;
  role: string;
  app_access: number;
}

import { findUnitByRole } from "@/lib/units";

export default function DashboardPage() {
  const [data, setData] = useState<DetailAntrian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poliSummaries, setPoliSummaries] = useState<PoliSummary[]>([]);
  const [selectedPoliId, setSelectedPoliId] = useState<number | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const requestInFlight = useState({ current: false })[0];

  // Fetch logged in user profile
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user) {
            setUser(json.user);
          }
        }
      } catch (err) {
        console.error("Fetch user error:", err);
      }
    }
    void fetchUser();
  }, []);

  const fetchData = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    try {
      const queueRes = await fetch("/api/antrian", { cache: "no-store" });
      if (!queueRes.ok) throw new Error(`HTTP ${queueRes.status}`);
      const json = await queueRes.json();
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

  // Deteremine active units & selected unit based on app_access (0 vs 4)
  const isPoliMode = user?.app_access === 4;
  const matchedUserUnit = useMemo(() => {
    if (!isPoliMode || !user?.role) return null;
    return findUnitByRole(data, user.role);
  }, [isPoliMode, user?.role, data]);

  // Set default selectedPoliId when data loads or user logs in
  useEffect(() => {
    if (data.length === 0) return;
    if (isPoliMode && matchedUserUnit) {
      setSelectedPoliId(matchedUserUnit.unit_id);
    } else {
      setSelectedPoliId((prev) => prev ?? data[0]?.unit_id ?? null);
    }
  }, [data, isPoliMode, matchedUserUnit]);

  // Units passed to components (filtered if app_access === 4)
  const activeUnits = useMemo(() => {
    if (isPoliMode && matchedUserUnit) {
      return [matchedUserUnit];
    }
    return data;
  }, [isPoliMode, matchedUserUnit, data]);

  const totalPasien = activeUnits.reduce((acc, item) => acc + item.total_antrian, 0);

  return (
    <div className="space-y-7">
      <Topbar />
      <Header totalPasien={totalPasien} />

      {/* Ringkasan statistik di bawah header dan clock */}
      {!loading && !error && <SummaryCards data={activeUnits} />}

      {/* Denah lokasi + kapasitas unit */}
      {!loading && !error && data.length > 0 && (
        <>
          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
            <PatientMap
              units={activeUnits}
              selectedPoliId={selectedPoliId}
              onSelectPoli={(poliId) => {
                // Admin can switch poli, poli user is locked to their poli
                if (!isPoliMode) setSelectedPoliId(poliId);
              }}
              onSummariesChange={(summaries) => setPoliSummaries(summaries)}
            />
            <UnitCapacity
              units={data}
              summaries={poliSummaries}
              selectedPoliId={selectedPoliId}
            />
          </div>
          <PatientHistoryTable units={activeUnits} />
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

      <Footer onRefresh={fetchData} />
    </div>
  );
}

