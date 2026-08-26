"use client";

import { useState, useMemo } from "react";
import { Search, Building2 } from "lucide-react";
import type { DetailAntrian } from "@/types";
import QueueCard from "./QueueCard";

type EResepCounts = Record<number, { proses: number; selesai: number }>;

interface QueueGridProps {
  data: DetailAntrian[];
  eresepCounts?: EResepCounts;
}

export default function QueueGrid({ data, eresepCounts = {} }: QueueGridProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesUnit =
        selectedUnitId === "all" || item.unit_id === selectedUnitId;
      const matchesSearch =
        !searchQuery ||
        item.unit_tampil.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nama.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesUnit && matchesSearch;
    });
  }, [data, selectedUnitId, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Control Bar: Pilih Poli & Cari */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-800 p-4 rounded-2xl border border-slate-700/40 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Filter Data Per Poli</h2>
            <p className="text-[11px] text-slate-400">
              {selectedUnitId === "all"
                ? `Menampilkan ${filteredData.length} dari ${data.length} Poli / Unit`
                : `Fokus Poli: ${filteredData[0]?.unit_tampil ?? "-"}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Dropdown Select Poli */}
          <div className="relative">
            <select
              value={selectedUnitId}
              onChange={(e) =>
                setSelectedUnitId(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
              className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-cyan-300 outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              <option value="all">-- Semua Poli ({data.length} Unit) --</option>
              {data.map((item) => (
                <option key={item.unit_id} value={item.unit_id}>
                  {item.unit_tampil} ({item.total_antrian} Pasien)
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama poli..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Grid Kartu Poli */}
      {filteredData.length === 0 ? (
        <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-2xl p-10 text-center">
          <p className="text-slate-400 text-sm font-medium">
            Tidak ada data poli yang cocok dengan pencarian / filter.
          </p>
          <button
            onClick={() => {
              setSelectedUnitId("all");
              setSearchQuery("");
            }}
            className="mt-3 text-xs text-cyan-400 hover:underline"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div
          className={
            selectedUnitId !== "all"
              ? "grid grid-cols-1 gap-4 max-w-2xl mx-auto"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          }
        >
          {filteredData.map((item) => (
            <QueueCard
              key={item.unit_id}
              antrian={item}
              eresepCount={eresepCounts[item.unit_id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}