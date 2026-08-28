"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import Pagination from "@/components/Pagination";
import {
  ShieldAlert,
  ClockAlert,
  Search,
  Building2,
  Clock,
  ExternalLink,
  CheckCircle2,
  UserRound,
  RefreshCw,
} from "lucide-react";
import type { WatchlistPasien } from "@/types";

const PAGE_SIZE = 10;

export default function PriorityWatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistPasien[]>([]);
  const [count120, setCount120] = useState(0);
  const [count180, setCount180] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "kritis">("all");
  const [page, setPage] = useState(1);

  const fetchWatchlistData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/antrian/watchlist", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal terhubung ke server");
      const json = await res.json();
      if (json.success) {
        setWatchlist(json.data ?? []);
        setCount120(json.count120 ?? 0);
        setCount180(json.count180 ?? 0);
      } else {
        setError(json.message || "Gagal memuat data Priority Watchlist");
      }
    } catch (err: any) {
      console.error("Watchlist fetch error:", err);
      setError("Tidak dapat memuat data Priority Watchlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWatchlistData();
    const interval = setInterval(fetchWatchlistData, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Compute unique units affected
  const uniqueUnitsCount = useMemo(() => {
    const units = new Set(watchlist.map((p) => p.unit_alias));
    return units.size;
  }, [watchlist]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return watchlist.filter((p) => {
      if (filterMode === "kritis" && p.menit_tunggu < 120) return false;
      if (!searchTerm) return true;
      const query = searchTerm.toLowerCase();
      return (
        p.nama.toLowerCase().includes(query) ||
        p.no_rm.toLowerCase().includes(query) ||
        p.unit_alias.toLowerCase().includes(query) ||
        p.nama_unit.toLowerCase().includes(query)
      );
    });
  }, [watchlist, filterMode, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [filterMode, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Topbar />

      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-950/50">
              <ShieldAlert size={32} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                  PRIORITY WATCHLIST ENDPOINT
                </span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                  Tunggu {">"} 120 Menit
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-100 sm:text-3xl">
                Monitoring Priority Watchlist Pasien
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Menampilkan daftar semua pasien dari seluruh poli yang mengalami waktu tunggu melebihi 2 jam hari ini.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchWatchlistData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors shrink-0"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-cyan-400" : "text-slate-400"} />
            {loading ? "Memuat..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-amber-500/30 bg-slate-800 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldAlert size={14} /> Total Priority Watchlist
              </p>
              <p className="mt-2 text-3xl font-extrabold text-amber-300">
                {count120} <span className="text-xs font-normal text-slate-400">Pasien</span>
              </p>
            </div>
            <span className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
              {">"} 120 Menit
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-slate-800 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <ClockAlert size={14} /> Pasien Tunggu Kritis
              </p>
              <p className="mt-2 text-3xl font-extrabold text-rose-300">
                {count180} <span className="text-xs font-normal text-slate-400">Pasien</span>
              </p>
            </div>
            <span className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400">
              {">"} 120 Menit (2 Jam)
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-800 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Building2 size={14} /> Total Poli Terpengaruh
              </p>
              <p className="mt-2 text-3xl font-extrabold text-cyan-300">
                {uniqueUnitsCount} <span className="text-xs font-normal text-slate-400">Unit / Poli</span>
              </p>
            </div>
            <span className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
              Real-time
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="rounded-2xl border border-slate-700/40 bg-slate-800 p-6 shadow-md space-y-5">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-700 pb-5">
          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pasien, No RM, atau nama poli..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Filter Mode Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterMode === "all"
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-md"
                  : "border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              Semua Watchlist ({count120})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("kritis")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterMode === "kritis"
                  ? "border border-rose-500/40 bg-rose-500/20 text-rose-300 shadow-md"
                  : "border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              Kritis {">"} 2 Jam ({count180})
            </button>
          </div>
        </div>

        {/* Table Container */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-amber-400 border-t-transparent" />
            Memuat data Priority Watchlist...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-8 text-center text-xs text-rose-300">
            {error}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
            <CheckCircle2 size={44} className="mx-auto mb-3 text-emerald-400/70" />
            <p className="font-bold text-slate-200 text-sm">Tidak ada pasien dalam Priority Watchlist</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm
                ? "Tidak ada pasien yang sesuai dengan pencarian Anda."
                : "Semua pasien saat ini terlayani dengan waktu tunggu di bawah 120 menit."}
            </p>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5 text-center">No</th>
                  <th className="px-4 py-3.5">No. RM</th>
                  <th className="px-4 py-3.5">Nama Pasien</th>
                  <th className="px-4 py-3.5">Poli / Unit</th>
                  <th className="px-4 py-3.5">Jam Daftar</th>
                  <th className="px-4 py-3.5">Lama Menunggu</th>
                  <th className="px-4 py-3.5 text-center">Aksi Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {paginatedPatients.map((p, idx) => {
                  const isKritis = p.menit_tunggu >= 120;
                  return (
                    <tr
                      key={`${p.pasien_id}-${idx}`}
                      className="hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-center text-slate-500 font-mono">
                        {(currentPage - 1) * PAGE_SIZE + idx + 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <Link
                          href={`/pasien/${p.pasien_id}`}
                          className="font-mono font-bold text-cyan-400 hover:underline"
                        >
                          {p.no_rm}
                        </Link>
                      </td>

                      <td className="px-4 py-3.5">
                        <Link
                          href={`/pasien/${p.pasien_id}`}
                          className="font-bold text-slate-100 hover:text-cyan-300 transition-colors"
                        >
                          {p.nama}
                        </Link>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-slate-200 font-semibold">
                          <Building2 size={13} className="text-slate-500" />
                          {p.unit_alias}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} className="text-slate-500" />
                          {p.jam_daftar} WIB
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-bold text-xs ${
                            isKritis
                              ? "bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse"
                              : "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                          }`}
                        >
                          <ClockAlert size={13} />
                          {p.waktu_tunggu_formatted}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <Link
                          href={`/pasien/${p.pasien_id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-cyan-500 hover:bg-slate-700 hover:text-cyan-300 transition-colors"
                        >
                          Detail <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filteredPatients.length} onPageChange={setPage} />
          </div>
          </>
        )}
      </div>
    </div>
  );
}
