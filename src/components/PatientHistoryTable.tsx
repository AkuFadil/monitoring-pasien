"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Pill,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import Pagination from "@/components/Pagination";
import type { DetailAntrian, HistoryPerjalanan, PasienAntri } from "@/types";

interface PatientHistoryTableProps {
  units: DetailAntrian[];
}

type HistoryStatus = "belum" | "selesai" | "resep" | "obat";

const PAGE_SIZE = 10;

interface HistoryRow {
  patient: PasienAntri;
  history: HistoryPerjalanan;
  served: boolean;
}

type UnitHistoryRecord = HistoryPerjalanan & {
  pasien_id: number;
  dilayani: number;
};

interface StatusConfigItem {
  label: string;
  activeClass: string;
  inactiveClass: string;
  icon: typeof Clock3;
}

const STATUS_CONFIG: Record<HistoryStatus, StatusConfigItem> = {
  belum: {
    label: "Belum Diperiksa",
    activeClass:
      "border-rose-500/60 bg-rose-500/20 text-rose-300 shadow-sm shadow-rose-950/40 font-bold",
    inactiveClass:
      "border-slate-700/80 bg-slate-900/60 text-slate-400 hover:border-rose-500/40 hover:text-rose-300",
    icon: Clock3,
  },
  selesai: {
    label: "Selesai Periksa",
    activeClass:
      "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-950/40 font-bold",
    inactiveClass:
      "border-slate-700/80 bg-slate-900/60 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300",
    icon: CheckCircle2,
  },
  resep: {
    label: "Proses E-Resep",
    activeClass:
      "border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-950/40 font-bold",
    inactiveClass:
      "border-slate-700/80 bg-slate-900/60 text-slate-400 hover:border-amber-500/40 hover:text-amber-300",
    icon: Stethoscope,
  },
  obat: {
    label: "Penyerahan Obat",
    activeClass:
      "border-cyan-500/60 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-950/40 font-bold",
    inactiveClass:
      "border-slate-700/80 bg-slate-900/60 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300",
    icon: Pill,
  },
};

function getStatus(
  history: HistoryPerjalanan | null,
  served: boolean,
): HistoryStatus {
  if (history?.["Penyerahan Obat"]) return "obat";
  if (history?.["Proses Resep"]) return "resep";
  if (history?.["Selesai Periksa Terakhir"] || served) return "selesai";
  return "belum";
}

function displayTime(value: string | null | undefined) {
  return value ? `${value.slice(0, 5)} WIB` : "—";
}

export default function PatientHistoryTable({
  units,
}: PatientHistoryTableProps) {
  const router = useRouter();
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.unit_id ?? 0);
  const [activeStatus, setActiveStatus] = useState<HistoryStatus>("belum");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State Dropdown Unit Search
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedUnit =
    units.find((unit) => unit.unit_id === selectedUnitId) ?? units[0];

  // Filter list unit berdasarkan pencarian
  const filteredUnits = useMemo(
    () =>
      units.filter((unit) =>
        unit.unit_tampil
          .toLowerCase()
          .includes(unitSearch.trim().toLowerCase()),
      ),
    [units, unitSearch],
  );

  // Handle klik di luar area dropdown untuk menutup menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUnitOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!units.some((unit) => unit.unit_id === selectedUnitId)) {
      setSelectedUnitId(units[0]?.unit_id ?? 0);
    }
  }, [units, selectedUnitId]);

  useEffect(() => {
    if (!selectedUnit) return;
    let cancelled = false;
    const unitId = selectedUnitId;

    async function loadHistory() {
      setLoading((prev) => (rows.length === 0 ? true : prev));
      setError(null);
      try {
        const response = await fetch(`/api/history/unit?unit_id=${unitId}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Gagal mengambil data histori poli");
        const json = await response.json();
        const records = (json.data ?? []) as UnitHistoryRecord[];

        if (!cancelled) {
          setRows(
            records.map((rec) => ({
              patient: {
                pasien_id: rec.pasien_id,
                nama: rec["Nama Pasien"],
                no_rm: rec["No. RM"],
                nama_peserta: "",
              } as PasienAntri,
              history: rec,
              served: rec.dilayani === 1,
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setError("Data histori pasien tidak dapat dimuat");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHistory();
    const interval = setInterval(loadHistory, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedUnitId]);

  const filteredRows = useMemo<HistoryRow[]>(
    () =>
      rows.filter(({ patient, history, served }) => {
        const needle = search.trim().toLowerCase();
        const matchesSearch =
          !needle ||
          patient.nama.toLowerCase().includes(needle) ||
          patient.no_rm.toLowerCase().includes(needle);
        return matchesSearch && getStatus(history, served) === activeStatus;
      }),
    [rows, search, activeStatus],
  );

  useEffect(() => {
    setPage(1);
  }, [selectedUnitId, activeStatus, search]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (!selectedUnit) return null;

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-800/90 backdrop-blur-md shadow-xl">
      <div className="relative z-20 border-b border-slate-700/70 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-blue-400">
              Patient Journey Monitor
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-white sm:text-xl tracking-tight">
              Histori Pasien on Poli
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Pantau pergerakan waktu pasien berdasarkan unit pelayanan. Klik
              baris/item pasien untuk melihat detail profil.
            </p>
          </div>

          {/* Custom Searchable Dropdown Unit Poli */}
          <div className="relative w-full lg:w-72" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsUnitOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-left text-sm font-semibold text-slate-200 outline-none transition hover:border-slate-600 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40"
            >
              <span className="truncate">{selectedUnit.unit_tampil}</span>
              <ChevronDown
                size={16}
                className={`ml-2 shrink-0 text-slate-400 transition-transform duration-200 ${
                  isUnitOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isUnitOpen && (
              <div className="absolute right-0 z-50 mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-2xl backdrop-blur-md">
                <div className="p-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus-within:border-cyan-500/60">
                    <Search size={14} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={unitSearch}
                      onChange={(e) => setUnitSearch(e.target.value)}
                      placeholder="Cari unit poli..."
                      className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
                      autoFocus
                    />
                    {unitSearch && (
                      <button
                        type="button"
                        onClick={() => setUnitSearch("")}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <ul className="max-h-60 overflow-y-auto py-1 text-xs text-slate-200 scrollbar-thin scrollbar-thumb-slate-700">
                  {filteredUnits.length === 0 ? (
                    <li className="px-3 py-2.5 text-center text-slate-500">
                      Unit poli tidak ditemukan
                    </li>
                  ) : (
                    filteredUnits.map((unit) => {
                      const isSelected = unit.unit_id === selectedUnitId;
                      return (
                        <li key={unit.unit_id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUnitId(unit.unit_id);
                              setIsUnitOpen(false);
                              setUnitSearch("");
                            }}
                            className={`w-full px-3.5 py-2 text-left transition-colors flex items-center justify-between ${
                              isSelected
                                ? "bg-cyan-500/20 font-bold text-cyan-300"
                                : "hover:bg-slate-800/80 text-slate-300"
                            }`}
                          >
                            <span className="truncate">{unit.unit_tampil}</span>
                            {isSelected && (
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0 ml-2" />
                            )}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_CONFIG) as HistoryStatus[]).map((status) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const active = activeStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveStatus(status)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs transition-all duration-150 ${active ? config.activeClass : config.inactiveClass}`}
                >
                  <Icon size={14} />
                  {config.label}
                </button>
              );
            })}
          </div>
          <label className="flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-slate-300 transition focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/40 xl:max-w-xs">
            <Search size={15} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau No. RM..."
              className="min-w-0 flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
            />
          </label>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
          <span>
            Unit aktif:{" "}
            <strong className="text-rose-300 font-bold">
              {selectedUnit.unit_tampil}
            </strong>
          </span>
          <span>{filteredRows.length} pasien</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-14 text-sm text-slate-400">
            <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            Memuat histori pasien...
          </div>
        ) : error ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center text-sm text-rose-300">
            {error}
          </p>
        ) : filteredRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700/80 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
            Belum ada pasien pada kategori status ini.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/50 shadow-inner">
            <table className="min-w-[760px] w-full text-left text-xs">
              <thead className="bg-slate-900/95 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 border-b border-slate-700/80">
                <tr>
                  <th className="px-4 py-3.5">No. RM</th>
                  <th className="px-4 py-3.5">Nama Pasien</th>
                  <th className="min-w-64 px-4 py-3.5">
                    Rincian Pergerakan di Poli
                  </th>
                  <th className="px-4 py-3.5">Waktu Status</th>
                  <th className="px-4 py-3.5">Total Waktu Tunggu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {paginatedRows.map(({ patient, history }) => (
                  <tr
                    key={patient.pasien_id}
                    onClick={() => router.push(`/pasien/${patient.pasien_id}`)}
                    className="cursor-pointer transition-all duration-150 hover:bg-cyan-950/30 hover:border-l-4 hover:border-cyan-400 group"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-blue-400 font-bold group-hover:text-slate-300 group-hover:underline">
                      {patient.no_rm}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-100 group-hover:text-blue-300">
                      {patient.nama}
                    </td>
                    <td className="max-w-md px-4 py-3.5 leading-relaxed text-slate-300">
                      {history?.["Rincian Pergerakan Poli"] ??
                        `${selectedUnit.unit_tampil} — menunggu pemeriksaan`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium text-slate-300">
                      {activeStatus === "belum"
                        ? displayTime(history?.["Jam Daftar Awal"])
                        : activeStatus === "selesai"
                          ? displayTime(history?.["Selesai Periksa Terakhir"])
                          : activeStatus === "resep"
                            ? displayTime(history?.["Proses Resep"])
                            : displayTime(history?.["Penyerahan Obat"])}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold border shadow-inner ${
                          activeStatus === "belum" || activeStatus === "resep"
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                            : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        }`}
                      >
                        {history?.["Total Waktu Tunggu"] ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              total={filteredRows.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </section>
  );
}
