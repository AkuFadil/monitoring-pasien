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

// ─── Threshold Configuration ─────────────────────────────────────────
const THRESHOLD = {
  /** Batas waktu tunggu rata-rata (menit) */
  waitMinutes: 60,
} as const;

// ─── Category Colors & Labels ────────────────────────────────────────
const CATEGORIES = {
  lancar: { color: "#22c55e", label: "Lancar" },
  ramai: { color: "#eab308", label: "Ramai" },
  lambat: { color: "#f97316", label: "Lambat" },
  padat: { color: "#ef4444", label: "Padat" },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

function classify(belumDiperiksa: number, avgWait: number, queueThreshold: number): CategoryKey {
  if (belumDiperiksa <= queueThreshold && avgWait <= THRESHOLD.waitMinutes) return "lancar";
  if (belumDiperiksa > queueThreshold && avgWait <= THRESHOLD.waitMinutes) return "ramai";
  if (belumDiperiksa <= queueThreshold && avgWait > THRESHOLD.waitMinutes) return "lambat";
  return "padat";
}

// ─── Floor assignments ───────────────────────────────────────────────
const FLOORS = [
  { id: "1", label: "Lantai 1" },
  { id: "2", label: "Lantai 2" },
];

const UNIT_FLOORS: Record<string, string> = {
  // Lantai 1
  paru: "1", "poli paru": "1",
  interna: "1", "poli interna": "1", "penyakit dalam": "1",
  jantung: "1", "jantung dan pembuluh darah": "1", "poli jantung": "1",
  "depo farmasi 1": "1", depo1: "1",
  saraf: "1", syaraf: "1", "poli saraf": "1", "poli syaraf": "1",
  kandungan: "1", kehamilan: "1", "poli kandungan": "1",
  hemodalisa: "1",
  "bedah ortopedi": "1", "bedah orthopedi": "1", "poli bedah ortopedi": "1",
  "hip knee": "1", "hip dan knee": "1", "poli hip dan knee": "1",
  spine: "1",
  anastesi: "1", "poli anastesi": "1",
  "bedah umum": "1", "poli bedah umum": "1",
  "bedah digestif": "1", "poli bedah digestif": "1",
  "bedah saraf": "1", "bedah syaraf": "1", "poli bedah saraf": "1", "poli bedah syaraf": "1",
  gizi: "1", "poli gizi": "1",
  mri: "1", "poli mri": "1",
  onkologi: "1", "bedah onkologi": "1", "poli bedah onkologi": "1",
  "hema onko": "1", "poli hema onko": "1", "hemato onkologi": "1", "poli onkologi": "1",
  "hema onko anak": "1", "gastroenterologi hepatologi": "1", gastro: "1",

  platinum: "1", "poli platinum": "1", premiyum: "1", premium: "1",
  vaksin: "1", "klinik vaksin": "1", "mcu dan vaksin": "1", "vaksin, klinik": "1",
  mcu: "1", eksekutif: "1", "poli eksekutif": "1",

  // Lantai 2
  "bedah thorax": "2", "poli bedah thorax": "2",
  tht: "2", "poli tht": "2",
  anak: "2", "poli anak": "2",
  kardiologi: "2", "kardiologi anak": "2", "karduologi anak": "2",
  soeskin: "2", "skin": "2",
  mata: "2", "poli mata": "2",
  "bedah anak": "2", "poli bedah anak": "2",
  "bedah urologi": "2", "bedah urolgi": "2", "poli bedah urologi": "2",
  "kulit kelamin": "2", "kulit dan kelamin": "2", "poli kulit kelamin": "2",
  "bedah plastik": "2", "bedah plastic": "2", "poli bedah plastik": "2",
  kemotrapi: "2", kemoterapi: "2", "poli kemotrapi": "2",
  psikiatri: "2", "poli psikiatri": "2",
  vct: "2", "poli vct": "2",
  gigi: "2", "poli gigi": "2",
};

function getUnitFloor(unitName: string): string {
  const lower = unitName.toLowerCase().trim().replace(/^poli\s+/i, "").replace(/[\s\-_]+/g, " ");
  if (UNIT_FLOORS[lower]) return UNIT_FLOORS[lower];
  for (const [key, val] of Object.entries(UNIT_FLOORS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return "1";
}

/** Singkat nama poli */
function getShortName(fullName: string): string {
  const upper = fullName.toUpperCase().replace(/^POLI\s+/i, "").trim();
  const MAP: Record<string, string> = {
    "BEDAH ONKOLOGI": "B. ONKO", "BEDAH DIGESTIF": "B. DIGESTIF",
    "BEDAH ORTOPEDI": "B. ORTOPEDI", "BEDAH ORTHOPEDI": "B. ORTOPEDI",
    "BEDAH SARAF": "B. SARAF", "BEDAH SYARAF": "B. SARAF",
    "BEDAH UMUM": "B. UMUM", "BEDAH THORAX": "B. THORAX",
    "BEDAH ANAK": "B. ANAK", "BEDAH UROLOGI": "B. UROLOGI", "BEDAH UROLGI": "B. UROLOGI",
    "BEDAH PLASTIK": "B. PLASTIK", "BEDAH PLASTIC": "B. PLASTIK",
    "HIP KNEE": "HIP KNEE", "HIP DAN KNEE": "HIP KNEE",
    "KULIT KELAMIN": "KULIT", "KULIT DAN KELAMIN": "KULIT",
    "HEMA ONKO": "H. ONKO", "HEMA ONKO ANAK": "H. ONKO ANAK",
    "HEMATO ONKOLOGI": "H. ONKO", "PENYAKIT DALAM": "DALAM",
    "JANTUNG DAN PEMBULUH DARAH": "JANTUNG",
    "DEPO FARMASI 1": "DEPO 1",
    "GASTROENTEROLOGI": "GASTRO",
    "KEMOTERAPI": "KEMO", "KEMOTRAPI": "KEMO",
  };
  if (MAP[upper]) return MAP[upper];
  let cleaned = upper;
  if (cleaned.startsWith("BEDAH ") && cleaned.length > 10) cleaned = "B. " + cleaned.slice(6);
  return cleaned.length > 14 ? cleaned.slice(0, 12) + "…" : cleaned;
}

// ─── Scatter Plot Config ─────────────────────────────────────────────
const CHART = {
  svgW: 820,
  svgH: 520,
  // Sumbu Y tetap di kiri angka, dengan ruang untuk label dan titik X = 0.
  pad: { top: 40, right: 15, bottom: 65, left: 55 },
  pointInset: 32,
  dotR: 8,
} as const;

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
  const [hovered, setHovered] = useState<{
    id: number; name: string; total: number; belum: number;
    avg: number; over120: number; cat: CategoryKey;
    sx: number; sy: number;
  } | null>(null);

  // ── Data fetching (same as before) ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/dashboard/poli-summary", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message ?? "Gagal memuat summary");
        if (!cancelled) { setSummaries(json.data ?? []); onSummariesChange?.(json.data ?? []); setError(null); }
      } catch (e) {
        console.error("Fetch poli summary error:", e);
        if (!cancelled) setError("Data pasien gagal diperbarui");
      } finally { if (!cancelled) setLoading(false); }
    };
    void load();
    const t = window.setInterval(load, 20_000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, [onSummariesChange]);

  // ── Derive scatter points from summary ───────────────────────────
  const points = useMemo(() =>
    summaries.map((s) => ({
      id: s.poli_id,
      name: s.nama_poli,
      short: getShortName(s.nama_poli),
      floor: getUnitFloor(s.nama_poli),
      belum: s.belum_diperiksa ?? 0,
      avg: s.avg_waiting_minutes ?? 0,
      total: s.total_pasien ?? 0,
      over120: s.waiting_120_plus ?? 0,
    })),
  [summaries]);

  const filtered = useMemo(() => points.filter((p) => p.floor === floorId), [points, floorId]);

  // Threshold antrean mengikuti data poli pada lantai aktif, bukan angka tetap.
  const queueThreshold = useMemo(() => {
    const highestQueue = Math.max(...filtered.map((p) => p.belum), 0);
    return highestQueue > 0 ? highestQueue / 2 : 0;
  }, [filtered]);

  const plottedPoints = useMemo(() => filtered.map((p) => ({
    ...p,
    cat: classify(p.belum, p.avg, queueThreshold),
  })), [filtered, queueThreshold]);

  // ── Axes ranges ─────────────────────────────────────────────────
  const maxX = useMemo(() => {
    const m = Math.max(...filtered.map((p) => p.belum), 10);
    return Math.ceil(m / 10) * 10;
  }, [filtered]);

  const maxY = useMemo(() => {
    const m = Math.max(...filtered.map((p) => p.avg), 30);
    return Math.ceil(m / 30) * 30; // round up to nearest 30
  }, [filtered]);

  const chartW = CHART.svgW - CHART.pad.left - CHART.pad.right - CHART.pointInset;
  const chartH = CHART.svgH - CHART.pad.top - CHART.pad.bottom;

  // Beri jarak dari sumbu Y supaya pin pada nilai 0 tetap terlihat jelas.
  function toX(val: number) { return CHART.pad.left + CHART.pointInset + (val / maxX) * chartW; }
  function toY(val: number) { return CHART.pad.top + chartH - (val / maxY) * chartH; }

  const xTicks = useMemo(() => {
    const step = maxX <= 20 ? 5 : maxX <= 50 ? 10 : 20;
    const ticks: number[] = [];
    for (let v = 0; v <= maxX; v += step) ticks.push(v);
    return ticks;
  }, [maxX]);

  const yTicks = useMemo(() => {
    const step = maxY <= 60 ? 15 : maxY <= 120 ? 30 : 60;
    const ticks: number[] = [];
    for (let v = 0; v <= maxY; v += step) ticks.push(v);
    return ticks;
  }, [maxY]);

  const activeFloorLabel = FLOORS.find((f) => f.id === floorId)?.label ?? `Lantai ${floorId}`;

  return (
    <section className="relative z-0 isolate flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-xl text-slate-100">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="min-w-0 flex-1 text-lg text-blue-300 tracking-tight">
          Matrix Kepadatan Poli: Antrean vs Waktu Tunggu
        </h2>
        <div className="flex shrink-0 items-center justify-end gap-2 text-[11px]">
          <div className="flex overflow-hidden rounded border border-slate-600 bg-slate-900">
            {FLOORS.map((f) => (
              <button key={f.id} type="button" onClick={() => setFloorId(f.id)}
                className={`px-2 py-1 font-semibold transition-colors ${floorId === f.id ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ background: CATEGORIES.lancar.color }} /> Lancar
          </span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ background: CATEGORIES.ramai.color }} /> Ramai
          </span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ background: CATEGORIES.lambat.color }} /> Lambat
          </span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ background: CATEGORIES.padat.color }} /> Padat
          </span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative flex min-h-[500px] flex-1 items-center overflow-hidden rounded-xl border border-slate-300 bg-[#ecf0f3e3] p-3 pt-7 md:p-4 md:pt-8">
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-slate-300 border border-slate-700/80 shadow-md">
          <Layers size={13} className="text-cyan-400" /> {activeFloorLabel}
        </div>

        {error && (
          <div className="absolute right-3 top-3 z-10 rounded bg-rose-950/90 px-3 py-1.5 text-xs text-rose-200 border border-rose-800">{error}</div>
        )}

        {loading && summaries.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-600">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent mr-3" />
            Memuat data...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center text-center text-slate-600">
            <p className="text-base font-semibold text-slate-700">Tidak ada unit aktif di {activeFloorLabel}</p>
          </div>
        ) : (
          <svg viewBox={`0 0 ${CHART.svgW} ${CHART.svgH}`} className="h-full w-full select-none" style={{ maxHeight: "520px" }}>
            {/* Grid lines */}
            {xTicks.map((v) => (
              <line key={`xg-${v}`} x1={toX(v)} y1={CHART.pad.top} x2={toX(v)} y2={CHART.pad.top + chartH}
                stroke="#cbd5e1" strokeWidth={1} />
            ))}
            {yTicks.map((v) => (
              <line key={`yg-${v}`} x1={CHART.pad.left} y1={toY(v)} x2={CHART.pad.left + chartW + CHART.pointInset} y2={toY(v)}
                stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4 4" />
            ))}

            {/* Threshold waktu tunggu; batas jumlah antrean mengikuti data aktual poli */}
            <line x1={CHART.pad.left} y1={toY(THRESHOLD.waitMinutes)} x2={CHART.pad.left + chartW + CHART.pointInset} y2={toY(THRESHOLD.waitMinutes)}
              stroke="#64748b" strokeWidth={1.5} strokeDasharray="8 4" />

            {/* Threshold label */}
            <text x={CHART.pad.left + chartW + CHART.pointInset + 4} y={toY(THRESHOLD.waitMinutes) + 3} textAnchor="start" fill="#475569" className="text-[10px] font-semibold">
              Batas Tunggu ({THRESHOLD.waitMinutes}m)
            </text>

            {/* Quadrant labels */}
            {filtered.length > 0 && (
              <>
                <text x={toX(maxX * 0.25)} y={toY(maxY * 0.15)} textAnchor="middle" fill="#22c55e" opacity={0.55} className="text-[14px] font-black">LANCAR</text>
                <text x={toX(maxX * 0.75)} y={toY(maxY * 0.15)} textAnchor="middle" fill="#eab308" opacity={0.65} className="text-[14px] font-black">RAMAI</text>
                <text x={toX(maxX * 0.25)} y={toY(maxY * 0.85)} textAnchor="middle" fill="#f97316" opacity={0.65} className="text-[14px] font-black">LAMBAT</text>
                <text x={toX(maxX * 0.75)} y={toY(maxY * 0.85)} textAnchor="middle" fill="#ef4444" opacity={0.65} className="text-[14px] font-black">PADAT</text>
              </>
            )}

            {/* Axes */}
            <line x1={CHART.pad.left} y1={CHART.pad.top + chartH} x2={CHART.pad.left + chartW + CHART.pointInset} y2={CHART.pad.top + chartH}
              stroke="#64748b" strokeWidth={1.5} />
            <line x1={CHART.pad.left} y1={CHART.pad.top} x2={CHART.pad.left} y2={CHART.pad.top + chartH}
              stroke="#64748b" strokeWidth={1.5} />

            {/* X ticks */}
            {xTicks.map((v) => (
              <g key={`xt-${v}`}>
                <line x1={toX(v)} y1={CHART.pad.top + chartH} x2={toX(v)} y2={CHART.pad.top + chartH + 5} stroke="#64748b" strokeWidth={1} />
                <text x={toX(v)} y={CHART.pad.top + chartH + 20} textAnchor="middle" fill="#475569" className="text-[11px] font-bold">{v}</text>
              </g>
            ))}

            {/* Y ticks */}
            {yTicks.map((v) => (
              <g key={`yt-${v}`}>
                <line x1={CHART.pad.left - 5} y1={toY(v)} x2={CHART.pad.left} y2={toY(v)} stroke="#64748b" strokeWidth={1} />
                <text x={CHART.pad.left - 12} y={toY(v) + 4} textAnchor="end" fill="#475569" className="text-[11px] font-bold">{v}</text>
              </g>
            ))}

            {/* Axis labels */}
            <text transform={`translate(12, ${CHART.pad.top + chartH / 2}) rotate(-90)`} textAnchor="middle" fill="#475569" className="text-[11px] font-bold">
              Rata-rata Waktu Tunggu (menit)
            </text>
            <text x={CHART.pad.left + CHART.pointInset + chartW / 2} y={CHART.svgH - 10} textAnchor="middle" fill="#475569" className="text-[11px] font-bold">
              Pasien Belum Diperiksa
            </text>

            {/* Data dots */}
            {plottedPoints.map((p) => {
              const cx = toX(p.belum);
              const cy = toY(p.avg);
              const sel = selectedPoliId === p.id;
              const fillColor = CATEGORIES[p.cat].color;
              const radius = Math.max(4, Math.min(18, CHART.dotR + (p.belum / Math.max(maxX, 1)) * 10));
              return (
                <g key={p.id} className="cursor-pointer"
                  onMouseEnter={() => setHovered({ id: p.id, name: p.name, total: p.total, belum: p.belum, avg: p.avg, over120: p.over120, cat: p.cat, sx: cx, sy: cy })}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelectPoli?.(p.id)}>
                  {sel && <circle cx={cx} cy={cy} r={radius + 6} fill="none" stroke="#67e8f9" strokeWidth={2.5} className="animate-pulse" />}
                  <circle cx={cx} cy={cy} r={radius + 3} fill={fillColor} opacity={0.2} />
                  <circle cx={cx} cy={cy} r={radius} fill={fillColor} opacity={0.85} stroke="#ffffff" strokeWidth={1.5} />
                  {/* Name label — only for selected poli */}
                  {sel && (
                    <text x={cx} y={cy - radius - 8} textAnchor="middle" fill="#334155"
                      className="text-[10px] font-bold pointer-events-none">
                      {p.short}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Tooltip — di luar overflow-hidden agar tidak terpotong */}
      {hovered && (
        <div className="pointer-events-none absolute z-40 max-w-[260px] rounded-lg border border-slate-700 bg-slate-900/95 px-4 py-3 text-xs shadow-2xl text-slate-100 whitespace-normal"
          style={{
            left: `${Math.min(82, Math.max(18, (hovered.sx / CHART.svgW) * 100))}%`,
            top: `${Math.min(82, Math.max(12, (hovered.sy / CHART.svgH) * 100))}%`,
            transform: hovered.sy > CHART.svgH * 0.5 ? "translate(-50%, -130%)" : "translate(-50%, 10%)",
          }}>
          <div className="font-extrabold text-blue-300 text-sm mb-1.5">{hovered.name.toUpperCase()}</div>
          <div className="space-y-1 text-[11px] text-slate-300">
            <div>Total Pasien <span className="float-right font-bold text-white ml-4">{hovered.total}</span></div>
            <div>Belum Diperiksa <span className="float-right font-bold text-white ml-4">{hovered.belum}</span></div>
            <div>Rata-rata Tunggu <span className="float-right font-bold text-white ml-4">{hovered.avg.toFixed(0)} menit</span></div>
            <div>Menunggu &gt;120 Menit <span className="float-right font-bold text-white ml-4">{hovered.over120}</span></div>
            <div className="pt-1 border-t border-slate-700">
              Status <span className="float-right font-bold ml-4" style={{ color: CATEGORIES[hovered.cat].color }}>
                {CATEGORIES[hovered.cat].label}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
