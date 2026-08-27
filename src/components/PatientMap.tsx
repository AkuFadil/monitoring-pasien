"use client";

import { useEffect, useState, useMemo } from "react";
import { Layers } from "lucide-react";
import type { DetailAntrian } from "@/types";

export interface PoliSummary {
  poli_id: number;
  nama_poli: string;
  total_pasien: number;
  belum_diperiksa: number;
  selesai: number;
  e_resep: number;
  penyerahan_obat: number;
  waiting_0_30: number;
  waiting_30_60: number;
  waiting_60_120: number;
  waiting_120_plus: number;
  avg_waiting_minutes: number;
}

interface PatientMapProps {
  units?: DetailAntrian[];
  mapImage?: string;
  onSelectPoli?: (poliId: number) => void;
  onSummariesChange?: (summaries: PoliSummary[]) => void;
  selectedPoliId?: number | null;
}

const FLOORS = [
  { id: "1", label: "Lantai 1" },
  { id: "2", label: "Lantai 2" },
  { id: "3", label: "Lantai 3" },
];

/** Mapping unit ke lantai */
const UNIT_FLOORS: Record<string, string> = {
  // Lantai 1
  paru: "1",
  "poli paru": "1",
  interna: "1",
  "poli interna": "1",
  "penyakit dalam": "1",
  jantung: "1",
  "jantung dan pembuluh darah": "1",
  "poli jantung": "1",
  "depo farmasi 1": "1",
  depo1: "1",
  saraf: "1",
  syaraf: "1",
  "poli saraf": "1",
  "poli syaraf": "1",
  kandungan: "1",
  kehamilan: "1",
  "poli kandungan": "1",
  hemodalisa: "1",
  "bedah ortopedi": "1",
  "bedah orthopedi": "1",
  "hip knee": "1",
  "hip dan knee": "1",
  spine: "1",
  anastesi: "1",
  "poli anastesi": "1",
  "bedah umum": "1",
  "poli bedah umum": "1",
  "bedah digestif": "1",
  "poli bedah digestif": "1",
  "bedah saraf": "1",
  "bedah syaraf": "1",
  gizi: "1",
  "poli gizi": "1",
  mri: "1",
  "poli mri": "1",
  onkologi: "1",
  "bedah onkologi": "1",
  "hema onko": "1",
  "hemato onkologi": "1",
  platinum: "1",
  "poli platinum": "1",
  vaksin: "1",
  "klinik vaksin": "1",
  mcu: "1",
  eksekutif: "1",

  // Lantai 2
  "bedah thorax": "2",
  tht: "2",
  "poli tht": "2",
  anak: "2",
  "poli anak": "2",
  "hema onko anak": "2",
  mata: "2",
  "poli mata": "2",
  "bedah anak": "2",
  "bedah urologi": "2",
  "bedah urolgi": "2",
  "kulit kelamin": "2",
  "kulit dan kelamin": "2",
  "bedah plastik": "2",
  "bedah plastic": "2",
  kemotrapi: "2",
  kemoterapi: "2",
  psikiatri: "2",
  vct: "2",
  gigi: "2",
  "poli gigi": "2",
};

function getUnitFloor(unitName: string): string {
  const lower = unitName.toLowerCase().trim().replace(/^poli\s+/i, "").replace(/[\s\-_]+/g, " ");
  if (UNIT_FLOORS[lower]) return UNIT_FLOORS[lower];
  for (const [key, val] of Object.entries(UNIT_FLOORS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return "1";
}

const WAIT_ROWS = [
  {
    key: "waiting_120_plus" as const,
    label: ">120m",
    color: "#ff5252",
    y: 45,
  },
  {
    key: "waiting_60_120" as const,
    label: "60-120m",
    color: "#ff9800",
    y: 105,
  },
  {
    key: "waiting_30_60" as const,
    label: "30-60m",
    color: "#ffeb3b",
    y: 165,
  },
  {
    key: "waiting_0_30" as const,
    label: "0-30m",
    color: "#4caf50",
    y: 225,
  },
];

/** Singkat nama poli agar tidak panjang & tidak diulang kata "POLI" */
function getShortPoliName(fullName: string): string {
  if (!fullName) return "";
  const upper = fullName.toUpperCase().replace(/^POLI\s+/i, "").trim();

  const SHORT_MAP: Record<string, string> = {
    "BEDAH ONKOLOGI": "B. ONKO",
    "BEDAH DIGESTIF": "B. DIGESTIF",
    "BEDAH ORTOPEDI": "B. ORTOPEDI",
    "BEDAH ORTHOPEDI": "B. ORTOPEDI",
    "BEDAH SARAF": "B. SARAF",
    "BEDAH SYARAF": "B. SARAF",
    "BEDAH UMUM": "B. UMUM",
    "BEDAH THORAX": "B. THORAX",
    "BEDAH ANAK": "B. ANAK",
    "BEDAH UROLOGI": "B. UROLOGI",
    "BEDAH UROLGI": "B. UROLOGI",
    "BEDAH PLASTIK": "B. PLASTIK",
    "BEDAH PLASTIC": "B. PLASTIK",
    "HIP KNEE": "HIP KNEE",
    "HIP DAN KNEE": "HIP KNEE",
    "KULIT KELAMIN": "KULIT",
    "KULIT DAN KELAMIN": "KULIT",
    "HEMA ONKO": "H. ONKO",
    "HEMA ONKO ANAK": "H. ONKO ANAK",
    "HEMATO ONKOLOGI": "H. ONKO",
    "PENYAKIT DALAM": "INTERNA",
    "JANTUNG DAN PEMBULUH DARAH": "JANTUNG",
    "DEPO FARMASI 1": "DEPO 1",
    "MCU DAN VAKSIN": "MCU",
    "KLINIK VAKSIN": "VAKSIN",
    "GASTROENTEROLOGI": "GASTRO",
    "KEMOTERAPI": "KEMO",
    "KEMOTRAPI": "KEMO",
  };

  if (SHORT_MAP[upper]) return SHORT_MAP[upper];

  let cleaned = upper;
  if (cleaned.startsWith("BEDAH ") && cleaned.length > 10) {
    cleaned = cleaned.replace(/^BEDAH\s+/i, "B. ");
  }
  return cleaned;
}

/** Component Matriks Sebaran Pasien per Unit */
export default function PatientMap({
  units = [],
  onSelectPoli,
  onSummariesChange,
  selectedPoliId,
}: PatientMapProps) {
  const [summaries, setSummaries] = useState<PoliSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string>("1");
  const [hoveredInfo, setHoveredInfo] = useState<{ name: string; label: string; count: number; x: number; y: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadSummary = async () => {
      try {
        const response = await fetch("/api/dashboard/poli-summary", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message ?? "Gagal memuat summary");
        if (!cancelled) {
          const nextSummaries: PoliSummary[] = result.data ?? [];
          setSummaries(nextSummaries);
          onSummariesChange?.(nextSummaries);
          setError(null);
        }
      } catch (err) {
        console.error("Fetch poli summary error:", err);
        if (!cancelled) setError("Data pasien gagal diperbarui");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSummary();
    const timer = window.setInterval(loadSummary, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [onSummariesChange]);

  const allUnits = useMemo(() => {
    if (summaries.length > 0) {
      return summaries.map((s) => {
        const fullName = s.nama_poli;
        const shortName = getShortPoliName(fullName);
        return {
          id: s.poli_id,
          shortName,
          fullName,
          floor: getUnitFloor(fullName),
          summary: s,
        };
      });
    }

    // Default fallback units jika data server belum tersedia
    const defaults = [
      { fullName: "Poli Jantung", shortName: "JANTUNG", floor: "1" },
      { fullName: "Poli Interna", shortName: "INTERNA", floor: "1" },
      { fullName: "Poli Bedah", shortName: "BEDAH", floor: "1" },
      { fullName: "Poli Anak", shortName: "ANAK", floor: "2" },
      { fullName: "Poli Saraf", shortName: "SARAF", floor: "1" },
      { fullName: "Poli Mata", shortName: "MATA", floor: "2" },
      { fullName: "Poli THT", shortName: "THT", floor: "2" },
      { fullName: "Poli Gigi", shortName: "GIGI", floor: "2" },
    ];
    return defaults.map((item, idx) => ({
      id: idx + 1,
      shortName: item.shortName,
      fullName: item.fullName,
      floor: item.floor,
      summary: null,
    }));
  }, [units, summaries]);

  // Filter unit secara ketat berdasarkan lantai terpilih
  const displayUnits = useMemo(() => {
    return allUnits.filter((u) => u.floor === floorId);
  }, [allUnits, floorId]);

  // Otomatis sesuaikan poli terpilih saat berpindah lantai jika poli sebelumnya tidak ada di lantai baru
  useEffect(() => {
    if (displayUnits.length > 0) {
      const isCurrentInFloor = displayUnits.some((u) => u.id === selectedPoliId);
      if (!isCurrentInFloor) {
        onSelectPoli?.(displayUnits[0].id);
      }
    }
  }, [floorId, displayUnits, selectedPoliId, onSelectPoli]);

  // Cari max count untuk menskalakan ukuran bubble secara proporsional
  const maxCount = useMemo(() => {
    let max = 1;
    displayUnits.forEach((u) => {
      if (u.summary) {
        WAIT_ROWS.forEach((row) => {
          const val = u.summary?.[row.key] ?? 0;
          if (val > max) max = val;
        });
      }
    });
    return max;
  }, [displayUnits]);

  const activeFloorLabel = FLOORS.find((f) => f.id === floorId)?.label ?? `Lantai ${floorId}`;

  // Dimensi SVG
  const svgWidth = 860;
  const svgHeight = 340;
  const paddingLeft = 70;
  const paddingRight = 30;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const colWidth = displayUnits.length > 0 ? chartWidth / displayUnits.length : chartWidth;
  const labelY = 255;

  return (
    <section className="rounded-2xl border border-slate-700/50 bg-[#0f172a] p-5 md:p-6 shadow-xl text-slate-100 flex flex-col justify-between">
      {/* Container header dengan Pilihan Lantai & Badge Informasi */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">
          Matriks Sebaran Pasien per Unit
        </h2>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex overflow-hidden rounded border border-slate-600 bg-slate-900">
            {FLOORS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFloorId(item.id)}
                className={`px-3 py-1.5 font-semibold transition-colors ${
                  floorId === item.id
                    ? "bg-cyan-500/20 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded border border-slate-600/80 bg-slate-900 px-3 py-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Lokasi Pasien
          </span>
          <span className="inline-flex items-center gap-1.5 rounded border border-slate-600/80 bg-slate-900 px-3 py-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-rose-400" /> Priority Watchlist
          </span>
        </div>
      </div>

      {/* Frame grafik matriks berbasis SVG (100% Fit & Sangat Jelas) */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#090e1a] p-3 md:p-4 min-h-[360px] flex flex-col justify-between">
        {/* Floor indicator badge di pojok kiri bawah */}
        <div className="pointer-events-none absolute bottom-2 left-3 z-10 flex items-center gap-1.5 rounded bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-slate-300 border border-slate-700/80 shadow-md">
          <Layers size={13} className="text-cyan-400" /> {activeFloorLabel}
        </div>

        {error && (
          <div className="absolute right-3 top-3 z-10 rounded bg-rose-950/90 px-3 py-1.5 text-xs text-rose-200 border border-rose-800">
            {error}
          </div>
        )}

        {loading && summaries.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent mr-3" />
            Memuat matriks sebaran pasien...
          </div>
        ) : displayUnits.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center text-center text-slate-400">
            <p className="text-base font-semibold text-slate-300">Tidak ada unit aktif di {activeFloorLabel}</p>
            <p className="mt-1 text-xs text-slate-500">Pilih lantai lain untuk melihat matriks sebaran unit.</p>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none"
              style={{ maxHeight: "350px" }}
            >
              <defs>
                <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <radialGradient id="grad-waiting_120_plus" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#ff5252" />
                  <stop offset="100%" stopColor="#b71c1c" />
                </radialGradient>
                <radialGradient id="grad-waiting_60_120" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#ff9800" />
                  <stop offset="100%" stopColor="#e65100" />
                </radialGradient>
                <radialGradient id="grad-waiting_30_60" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#ffeb3b" />
                  <stop offset="100%" stopColor="#f57f17" />
                </radialGradient>
                <radialGradient id="grad-waiting_0_30" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#4caf50" />
                  <stop offset="100%" stopColor="#1b5e20" />
                </radialGradient>
              </defs>

              {/* Ticks Sumbu Y */}
              {WAIT_ROWS.map((row) => (
                <text
                  key={`y-tick-${row.key}`}
                  x={paddingLeft - 12}
                  y={row.y + 4}
                  textAnchor="end"
                  fill={row.color}
                  className="text-[12px] font-extrabold"
                >
                  {row.label}
                </text>
              ))}

              {/* Grid Column Backgrounds & Highlight */}
              {displayUnits.map((u, i) => {
                const cx = paddingLeft + (i + 0.5) * colWidth;
                const isSelected = selectedPoliId === u.id;
                return (
                  <g key={`col-bg-${u.id}`}>
                    <rect
                      x={cx - colWidth / 2 + 1}
                      y={10}
                      width={colWidth - 2}
                      height={235}
                      rx={6}
                      fill={isSelected ? "rgba(15, 23, 42, 0.7)" : "transparent"}
                      stroke={isSelected ? "rgba(103, 232, 249, 0.3)" : "none"}
                      strokeWidth={1.5}
                      className="cursor-pointer hover:fill-slate-800/40 transition-colors"
                      onClick={() => onSelectPoli?.(u.id)}
                    />
                  </g>
                );
              })}

              {/* Bubbles Grid */}
              {WAIT_ROWS.map((row) => (
                <g key={`bubbles-${row.key}`}>
                  {displayUnits.map((u, i) => {
                    const cx = paddingLeft + (i + 0.5) * colWidth;
                    const cy = row.y;
                    const count = u.summary ? (u.summary[row.key] ?? 0) : 0;

                    let radius = 3;
                    let isZero = count === 0;

                    if (!isZero) {
                      const ratio = Math.min(1, count / maxCount);
                      radius = 7 + ratio * 14;
                    }

                    return (
                      <g
                        key={`bubble-${row.key}-${u.id}`}
                        className="cursor-pointer group"
                        onClick={() => onSelectPoli?.(u.id)}
                        onMouseEnter={() =>
                          setHoveredInfo({
                            name: u.fullName,
                            label: row.label,
                            count,
                            x: cx,
                            y: cy,
                          })
                        }
                        onMouseLeave={() => setHoveredInfo(null)}
                      >
                        {isZero ? (
                          <circle cx={cx} cy={cy} r={3} fill={row.color} opacity={0.35} />
                        ) : (
                          <>
                            {/* Outer Glow */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={radius + 4}
                              fill={row.color}
                              opacity={0.35}
                              filter="url(#glow-soft)"
                            />
                            {/* Glowing Sphere Core */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={radius}
                              fill={`url(#grad-${row.key})`}
                              filter="url(#glow-soft)"
                              className="transition-transform duration-200 hover:scale-125"
                            />
                          </>
                        )}
                      </g>
                    );
                  })}
                </g>
              ))}

              {/* Garis Separator Sumbu X */}
              <line
                x1={paddingLeft - 10}
                y1={245}
                x2={svgWidth - paddingRight + 10}
                y2={245}
                stroke="#1e293b"
                strokeWidth={1.5}
              />

              {/* Sumbu X Ticks (Singkatan Nama Poli Rotasi -50 Derajat Sangat Jelas) */}
              {displayUnits.map((u, i) => {
                const cx = paddingLeft + (i + 0.5) * colWidth;
                const isSelected = selectedPoliId === u.id;
                return (
                  <text
                    key={`label-${u.id}`}
                    x={cx}
                    y={labelY}
                    transform={`rotate(-50, ${cx}, ${labelY})`}
                    textAnchor="end"
                    fill={isSelected ? "#67e8f9" : "#cbd5e1"}
                    className={`cursor-pointer transition-all ${
                      isSelected ? "font-black text-[12px]" : "font-bold text-[11px] hover:fill-cyan-300"
                    }`}
                    onClick={() => onSelectPoli?.(u.id)}
                  >
                    {u.shortName}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip Popup */}
            {hoveredInfo && (
              <div
                className="pointer-events-none absolute z-30 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-1.5 text-xs shadow-2xl text-slate-100 whitespace-nowrap"
                style={{
                  left: `${(hoveredInfo.x / svgWidth) * 100}%`,
                  top: `${(hoveredInfo.y / svgHeight) * 100}%`,
                  transform: "translate(-50%, -125%)",
                }}
              >
                <div className="font-bold text-cyan-300">{hoveredInfo.name}</div>
                <div className="text-[11px] text-slate-300">
                  {hoveredInfo.label}: <span className="font-extrabold text-white">{hoveredInfo.count} Pasien</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
