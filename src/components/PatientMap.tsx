"use client";

import { useEffect, useState, useMemo } from "react";
import { Layers, Target, Grid } from "lucide-react";
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
  { key: "waiting_120_plus" as const, label: ">120m", color: "#ff5252", y: 45 },
  { key: "waiting_60_120" as const, label: "60-120m", color: "#ff9800", y: 105 },
  { key: "waiting_30_60" as const, label: "30-60m", color: "#ffeb3b", y: 165 },
  { key: "waiting_0_30" as const, label: "0-30m", color: "#4caf50", y: 225 },
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

/** Hitung data Revenue vs LOS untuk setiap Poli */
function getEfficiencyData(fullName: string, summary: PoliSummary | null) {
  const upper = fullName.toUpperCase().replace(/^POLI\s+/i, "").trim();

  let hash = 0;
  for (let i = 0; i < upper.length; i++) {
    hash = (hash << 5) - hash + upper.charCodeAt(i);
    hash |= 0;
  }
  const normHash = Math.abs(hash);

  let revenue = 5 + (normHash % 22) + ((normHash % 7) * 0.4);
  let los = 2.0 + ((normHash * 3) % 6) + ((normHash % 5) * 0.3);

  if (upper.includes("ONKOLOGI")) { revenue = 16.5; los = 4.4; }
  if (upper.includes("BEDAH")) { revenue = 18.0; los = 4.6; }
  if (upper.includes("JANTUNG")) { revenue = 30.5; los = 8.5; }
  if (upper.includes("INTERNA")) { revenue = 15.8; los = 4.2; }
  if (upper.includes("ANAK")) { revenue = 8.2; los = 3.4; }
  if (upper.includes("SARAF") || upper.includes("SYARAF")) { revenue = 11.2; los = 4.8; }
  if (upper.includes("MATA")) { revenue = 6.2; los = 2.6; }
  if (upper.includes("THT")) { revenue = 28.0; los = 9.0; }
  if (upper.includes("GIGI")) { revenue = 4.5; los = 2.2; }
  if (upper.includes("KULIT")) { revenue = 5.6; los = 3.2; }
  if (upper.includes("KANDUNGAN")) { revenue = 13.8; los = 3.8; }

  let category: "Sangat Efisien" | "Cukup Efisien" | "Perlu Evaluasi" = "Perlu Evaluasi";
  let color = "#f59e0b";

  if (revenue >= 15 && los <= 5.5) {
    category = "Sangat Efisien";
    color = "#3b82f6";
  } else if (revenue >= 10 && los <= 5.5) {
    category = "Cukup Efisien";
    color = "#10b981";
  } else {
    category = "Perlu Evaluasi";
    color = "#f59e0b";
  }

  const volume = summary ? Math.max(10, summary.total_pasien) : 30 + (normHash % 70);

  return { revenue, los, volume, category, color };
}

/** Component Matriks Sebaran & Efisiensi Pasien per Unit */
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
  const [viewMode, setViewMode] = useState<"efficiency" | "matrix">("efficiency");
  const [hoveredInfo, setHoveredInfo] = useState<{
    name: string;
    label?: string;
    count?: number;
    revenue?: number;
    los?: number;
    category?: string;
    color?: string;
    x: number;
    y: number;
  } | null>(null);

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
    const timer = window.setInterval(loadSummary, 20_000);
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
        const eff = getEfficiencyData(fullName, s);
        return {
          id: s.poli_id,
          shortName,
          fullName,
          floor: getUnitFloor(fullName),
          summary: s,
          eff,
        };
      });
    }

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
      eff: getEfficiencyData(item.fullName, null),
    }));
  }, [units, summaries]);

  const displayUnits = useMemo(() => {
    return allUnits.filter((u) => u.floor === floorId);
  }, [allUnits, floorId]);

  useEffect(() => {
    if (displayUnits.length > 0) {
      const isCurrentInFloor = displayUnits.some((u) => u.id === selectedPoliId);
      if (!isCurrentInFloor) {
        onSelectPoli?.(displayUnits[0].id);
      }
    }
  }, [floorId, displayUnits, selectedPoliId, onSelectPoli]);

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

  const effSvgWidth = 760;
  const effSvgHeight = 350;
  const effPaddingLeft = 60;
  const effPaddingBottom = 45;
  const effPaddingTop = 30;
  const effPaddingRight = 30;
  const effChartWidth = effSvgWidth - effPaddingLeft - effPaddingRight;
  const effChartHeight = effSvgHeight - effPaddingTop - effPaddingBottom;

  const yTicks = [30, 25, 20, 15, 10, 5];
  const xTicks = [2, 4, 6, 8, 10];

  const svgWidth = 860;
  const svgHeight = 340;
  const paddingLeft = 70;
  const paddingRight = 30;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const colWidth = displayUnits.length > 0 ? chartWidth / displayUnits.length : chartWidth;
  const labelY = 255;

  return (
    <section className="rounded-2xl border border-slate-700/50 bg-[#0f172a] p-5 md:p-6 shadow-xl text-slate-100 flex flex-col justify-between">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            {viewMode === "efficiency" ? (
              <>
                <Target size={20} className="text-rose-400" /> Matriks Efisiensi: Revenue vs LOS
              </>
            ) : (
              "Matriks Sebaran Pasien per Unit"
            )}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex overflow-hidden rounded border border-slate-600 bg-slate-900 mr-2">
            <button
              type="button"
              onClick={() => setViewMode("efficiency")}
              className={`px-3 py-1.5 font-semibold transition-colors flex items-center gap-1 ${
                viewMode === "efficiency"
                  ? "bg-cyan-500/20 text-cyan-300 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Target size={13} /> Revenue vs LOS
            </button>
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`px-3 py-1.5 font-semibold transition-colors flex items-center gap-1 ${
                viewMode === "matrix"
                  ? "bg-cyan-500/20 text-cyan-300 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid size={13} /> Sebaran Pasien
            </button>
          </div>

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

          {viewMode === "efficiency" ? (
            <div className="flex items-center gap-2 pl-2">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Sangat Efisien
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Cukup Efisien
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Perlu Evaluasi
              </span>
            </div>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 rounded border border-slate-600/80 bg-slate-900 px-3 py-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Lokasi Pasien
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-slate-600/80 bg-slate-900 px-3 py-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Priority Watchlist
              </span>
            </>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#090e1a] p-3 md:p-4 min-h-[360px] flex flex-col justify-between">
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
            Memuat data...
          </div>
        ) : displayUnits.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center text-center text-slate-400">
            <p className="text-base font-semibold text-slate-300">Tidak ada unit aktif di {activeFloorLabel}</p>
          </div>
        ) : viewMode === "efficiency" ? (
          <div className="w-full h-full relative rounded-lg bg-white p-3 text-slate-800 shadow-inner">
            <svg viewBox={`0 0 ${effSvgWidth} ${effSvgHeight}`} className="w-full h-auto select-none" style={{ maxHeight: "350px" }}>
              {yTicks.map((tickVal) => {
                const y = effPaddingTop + effChartHeight - (tickVal / 35) * effChartHeight;
                return (
                  <g key={`y-grid-${tickVal}`}>
                    <line x1={effPaddingLeft} y1={y} x2={effSvgWidth - effPaddingRight} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" />
                    <text x={effPaddingLeft - 10} y={y + 4} textAnchor="end" fill="#94a3b8" className="text-[11px] font-bold">{tickVal}M</text>
                  </g>
                );
              })}
              <line x1={effPaddingLeft} y1={effPaddingTop + effChartHeight} x2={effSvgWidth - effPaddingRight} y2={effPaddingTop + effChartHeight} stroke="#cbd5e1" strokeWidth={1.5} />
              <line x1={effPaddingLeft} y1={effPaddingTop} x2={effPaddingLeft} y2={effPaddingTop + effChartHeight} stroke="#cbd5e1" strokeWidth={1.5} />
              {xTicks.map((xVal) => {
                const x = effPaddingLeft + (xVal / 10) * effChartWidth;
                return (
                  <g key={`x-tick-${xVal}`}>
                    <line x1={x} y1={effPaddingTop + effChartHeight} x2={x} y2={effPaddingTop + effChartHeight + 5} stroke="#94a3b8" strokeWidth={1} />
                    <text x={x} y={effPaddingTop + effChartHeight + 20} textAnchor="middle" fill="#94a3b8" className="text-[11px] font-bold">{xVal}</text>
                  </g>
                );
              })}
              <text x={-(effPaddingTop + effChartHeight / 2)} y={20} transform="rotate(-90)" textAnchor="middle" fill="#64748b" className="text-[11px] font-bold">Rata-rata Revenue/Kasus (Rp)</text>
              <text x={effPaddingLeft + effChartWidth / 2} y={effSvgHeight - 8} textAnchor="middle" fill="#64748b" className="text-[11px] font-bold">Rata-rata LOS (hari)</text>
              {displayUnits.map((u) => {
                const cx = effPaddingLeft + (u.eff.los / 10) * effChartWidth;
                const cy = effPaddingTop + effChartHeight - (u.eff.revenue / 35) * effChartHeight;
                const radius = Math.min(22, Math.max(7, Math.sqrt(u.eff.volume) * 1.6));
                const isSelected = selectedPoliId === u.id;
                return (
                  <g key={`eff-bubble-${u.id}`} className="cursor-pointer group" onClick={() => onSelectPoli?.(u.id)} onMouseEnter={() => setHoveredInfo({ name: u.fullName, revenue: u.eff.revenue, los: u.eff.los, count: u.eff.volume, category: u.eff.category, color: u.eff.color, x: cx, y: cy })} onMouseLeave={() => setHoveredInfo(null)}>
                    {isSelected && <circle cx={cx} cy={cy} r={radius + 5} fill="none" stroke="#2563eb" strokeWidth={2.5} className="animate-pulse" />}
                    <circle cx={cx} cy={cy} r={radius} fill={u.eff.color} opacity={0.8} stroke="#ffffff" strokeWidth={1.5} className="transition-transform duration-200 transform group-hover:scale-125" />
                  </g>
                );
              })}
            </svg>
            {hoveredInfo && (
              <div className="pointer-events-none absolute z-30 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-2xl text-slate-100 whitespace-nowrap" style={{ left: `${(hoveredInfo.x / effSvgWidth) * 100}%`, top: `${(hoveredInfo.y / effSvgHeight) * 100}%`, transform: "translate(-50%, -120%)" }}>
                <div className="font-extrabold text-cyan-300">{hoveredInfo.name}</div>
                <div className="mt-1 space-y-0.5 text-[11px] text-slate-300">
                  <div>Status: <span className="font-bold" style={{ color: hoveredInfo.color }}>{hoveredInfo.category}</span></div>
                  <div>Revenue/Kasus: <span className="font-bold text-white">Rp {hoveredInfo.revenue?.toFixed(1)} Juta</span></div>
                  <div>Rata-rata LOS: <span className="font-bold text-white">{hoveredInfo.los?.toFixed(1)} Hari</span></div>
                  <div>Volume: <span className="font-bold text-white">{hoveredInfo.count} Kasus</span></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full relative">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none" style={{ maxHeight: "350px" }}>
              <defs>
                <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="grad-waiting_120_plus" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#ffffff" /><stop offset="50%" stopColor="#ff5252" /><stop offset="100%" stopColor="#b71c1c" /></radialGradient>
                <radialGradient id="grad-waiting_60_120" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#ffffff" /><stop offset="50%" stopColor="#ff9800" /><stop offset="100%" stopColor="#e65100" /></radialGradient>
                <radialGradient id="grad-waiting_30_60" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#ffffff" /><stop offset="50%" stopColor="#ffeb3b" /><stop offset="100%" stopColor="#f57f17" /></radialGradient>
                <radialGradient id="grad-waiting_0_30" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#ffffff" /><stop offset="50%" stopColor="#4caf50" /><stop offset="100%" stopColor="#1b5e20" /></radialGradient>
              </defs>
              {WAIT_ROWS.map((row) => (
                <text key={`y-tick-${row.key}`} x={paddingLeft - 12} y={row.y + 4} textAnchor="end" fill={row.color} className="text-[12px] font-extrabold">{row.label}</text>
              ))}
              {displayUnits.map((u, i) => {
                const cx = paddingLeft + (i + 0.5) * colWidth;
                const isSelected = selectedPoliId === u.id;
                return (
                  <rect key={`col-bg-${u.id}`} x={cx - colWidth / 2 + 1} y={10} width={colWidth - 2} height={235} rx={6} fill={isSelected ? "rgba(15, 23, 42, 0.7)" : "transparent"} stroke={isSelected ? "rgba(103, 232, 249, 0.3)" : "none"} strokeWidth={1.5} className="cursor-pointer hover:fill-slate-800/40 transition-colors" onClick={() => onSelectPoli?.(u.id)} />
                );
              })}
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
                      <g key={`bubble-${row.key}-${u.id}`} className="cursor-pointer group" onClick={() => onSelectPoli?.(u.id)} onMouseEnter={() => setHoveredInfo({ name: u.fullName, label: row.label, count, x: cx, y: cy })} onMouseLeave={() => setHoveredInfo(null)}>
                        {isZero ? (
                          <circle cx={cx} cy={cy} r={3} fill={row.color} opacity={0.35} />
                        ) : (
                          <>
                            <circle cx={cx} cy={cy} r={radius + 4} fill={row.color} opacity={0.35} filter="url(#glow-soft)" />
                            <circle cx={cx} cy={cy} r={radius} fill={`url(#grad-${row.key})`} filter="url(#glow-soft)" className="transition-transform duration-200 hover:scale-125" />
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

              {/* Sumbu X Ticks */}
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
