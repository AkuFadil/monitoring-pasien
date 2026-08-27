"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserRound,
  AlertTriangle,
  ClockAlert,
  ShieldAlert,
} from "lucide-react";
import type { DetailAntrian } from "@/types";

export default function SummaryCards({ data }: { data: DetailAntrian[] }) {
  const totalPasien = data.reduce((acc, item) => acc + item.total_antrian, 0);
  const unitKritis = data.filter((item) => item.belum_dilayani >= 5).length;

  const [count120, setCount120] = useState(0);
  const [count180, setCount180] = useState(0);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);

  useEffect(() => {
    async function fetchWatchlist() {
      try {
        const res = await fetch("/api/antrian/watchlist", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setCount120(json.count120 ?? 0);
            setCount180(json.count180 ?? 0);
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data priority watchlist:", err);
      } finally {
        setLoadingWatchlist(false);
      }
    }

    void fetchWatchlist();
    const interval = setInterval(fetchWatchlist, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Pasien */}
      <div className="bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-700/50 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <UserRound size={16} className="text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 truncate">
              TOTAL SEMUA PASIEN
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-full px-2.5 py-0.5 shrink-0">
            +12 hari ini
          </span>
        </div>
        <p className="text-3xl font-extrabold text-white tracking-tight mt-3">
          {totalPasien}
        </p>
      </div>

      {/* 2. Pasien Tunggu >3 Jam */}
      <Link
        href="/watchlist"
        className="group bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-700/50 shadow-md hover:border-rose-500/40 transition-all flex flex-col justify-between block cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ClockAlert size={16} className="text-rose-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 truncate">
              PASIEN TUNGGU &gt;3 JAM
            </span>
          </div>
          <span className="text-xs font-semibold text-rose-400 group-hover:translate-x-0.5 transition-transform shrink-0">
            Perlu Perhatian &rarr;
          </span>
        </div>
        <p className="text-3xl font-extrabold text-white tracking-tight mt-3">
          {loadingWatchlist ? "..." : count180}
        </p>
      </Link>

      {/* 3. Total Unit Kritis */}
      <div className="bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-700/50 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 truncate">
              TOTAL UNIT KRITIS
            </span>
          </div>
          <span className="text-xs font-normal text-slate-400 shrink-0">
            Kapasitas Kursi Penuh
          </span>
        </div>
        <p className="text-3xl font-extrabold text-white tracking-tight mt-3">
          {unitKritis}
        </p>
      </div>

      {/* 4. Priority Watchlist */}
      <Link
        href="/watchlist"
        className="group bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-sky-500/50 shadow-md shadow-sky-950/20 hover:border-sky-400 transition-all flex flex-col justify-between block cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert size={16} className="text-sky-400 shrink-0" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400 truncate">
              PRIORITY WATCHLIST
            </span>
          </div>
          <span className="text-xs font-semibold text-sky-300 group-hover:underline shrink-0">
            Lihat Detail &rarr;
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-3">
          <p className="text-3xl font-extrabold text-sky-400 tracking-tight">
            {loadingWatchlist ? "..." : count120}
          </p>
          <span className="text-xs text-slate-400 font-normal">Pasien (&gt;120 m)</span>
        </div>
      </Link>
    </div>
  );
}



