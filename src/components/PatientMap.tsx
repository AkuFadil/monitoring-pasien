"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { Layers, MapPin } from "lucide-react";
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

const FLOORS = [
  { id: "1", label: "Lantai 1", image: "/img/Lt 1.png" },
  { id: "2", label: "Lantai 2", image: "/img/Lt 2.png" },
  { id: "3", label: "Lantai 3", image: "/img/Lt 3.png" },
];

/** Palet warna per poli — konsisten dengan UnitCapacity */
const POLI_COLORS_HEX = [
  "#22d3ee", "#fbbf24", "#fb7185", "#34d399", "#a78bfa",
  "#fb923c", "#38bdf8", "#f472b6", "#2dd4bf", "#facc15",
  "#818cf8", "#f87171", "#a3e635", "#e879f9", "#60a5fa",
  "#4ade80", "#c084fc", "#94a3b8", "#67e8f9", "#fcd34d",
];

/**
 * Hanya poli yang sudah memiliki koordinat dari file unit-coordinates.json.
 * Poli lain sengaja tidak dimasukkan agar marker-nya tersembunyi.
 */
const UNIT_LOCATIONS: Record<string, { floor: string; lat: number; lng: number }> = {
  "paru": { floor: "1", lat: 883.78, lng: 633.24 },
  "poli paru": { floor: "1", lat: 883.78, lng: 633.24 },
  "interna": { floor: "1", lat: 861.08, lng: 742.59 },
  "poli interna": { floor: "1", lat: 861.08, lng: 742.59 },
  "penyakit dalam": { floor: "1", lat: 861.08, lng: 742.59 },
  "jantung": { floor: "1", lat: 835.01, lng: 832.60 },
  "jantung dan pembuluh darah": { floor: "1", lat: 835.01, lng: 832.60 },
  "poli jantung": { floor: "1", lat: 835.01, lng: 832.60 },
  "depo farmasi 1": { floor: "1", lat: 817.35, lng: 929.33 },
  "depofarmasi 1": { floor: "1", lat: 817.35, lng: 929.33 },
  "depo 1": { floor: "1", lat: 817.35, lng: 929.33 },
  "saraf": { floor: "1", lat: 792.61, lng: 1028.79 },
  "syaraf": { floor: "1", lat: 792.61, lng: 1028.79 },
  "poli saraf": { floor: "1", lat: 792.61, lng: 1028.79 },
  "poli syaraf": { floor: "1", lat: 792.61, lng: 1028.79 },
  "kandungan": { floor: "1", lat: 774.28, lng: 1120.96 },
  "kehamilan": { floor: "1", lat: 774.28, lng: 1120.96 },
  "poli kandungan": { floor: "1", lat: 774.28, lng: 1120.96 },
  "hemodalisa": { floor: "1", lat: 801.37, lng: 602.12 },
  "bedah ortopedi": { floor: "1", lat: 816, lng: 663.36 },
  "bedah orthopedi": { floor: "1", lat: 816, lng: 663.36 },
  "poli bedah ortopedi": { floor: "1", lat: 816, lng: 663.36 },
  "hip knee": { floor: "1", lat: 801.86, lng: 703.68 },
  "hip dan knee": { floor: "1", lat: 801.86, lng: 703.68 },
  "poli hip dan knee": { floor: "1", lat: 801.86, lng: 703.68 },
  "spine": { floor: "1", lat: 789.84, lng: 675.34 },
  "anastesi": { floor: "1", lat: 742.51, lng: 819.14 },
  "poli anastesi": { floor: "1", lat: 742.51, lng: 819.14 },
  "bedah umum": { floor: "1", lat: 733.26, lng: 890.63 },
  "poli bedah umum": { floor: "1", lat: 733.26, lng: 890.63 },
  "bedah digestif": { floor: "1", lat: 726.2, lng: 967.41 },
  "poli bedah digestif": { floor: "1", lat: 726.2, lng: 967.41 },
  "bedah saraf": { floor: "1", lat: 694.5, lng: 1032.36 },
  "bedah syaraf": { floor: "1", lat: 694.5, lng: 1032.36 },
  "poli bedah syaraf": { floor: "1", lat: 694.5, lng: 1032.36 },
  "poli bedah saraf": { floor: "1", lat: 694.5, lng: 1032.36 },
  "gizi": { floor: "1", lat: 679.53, lng: 1104.66 },
  "poli gizi": { floor: "1", lat: 679.53, lng: 1104.66 },
  "mri": { floor: "1", lat: 854.18, lng: 526.78 },
  "poli mri": { floor: "1", lat: 854.18, lng: 526.78 },
  "onkologi": { floor: "1", lat: 666.09, lng: 1277.98 },
  "bedah onkologi": { floor: "1", lat: 666.09, lng: 1277.98 },
  "poli bedah onkologi": { floor: "1", lat: 666.09, lng: 1277.98 },
  "hema onko": { floor: "1", lat: 695.79, lng: 1284.35 },
  "poli hema onko": { floor: "1", lat: 695.79, lng: 1284.35 },
  "hemato onkologi": { floor: "1", lat: 695.79, lng: 1284.35 },
  "poli onkologi": { floor: "1", lat: 666.09, lng: 1277.98 },
  "hema onko anak": { floor: "1", lat: 690, lng: 1249.33 },
  "poli hema onko anak": { floor: "1", lat: 690, lng: 1249.33 },
  "platinum": { floor: "1", lat: 663.97, lng: 1326.76 },
  "poli platinum": { floor: "1", lat: 663.97, lng: 1326.76 },
  "vaksin": { floor: "1", lat: 591.14, lng: 1276.54 },
  "klinik vaksin": { floor: "1", lat: 591.14, lng: 1276.54 },
  "mcu dan vaksin": { floor: "1", lat: 591.14, lng: 1276.54 },
  "vaksin, klinik": { floor: "1", lat: 591.14, lng: 1276.54 },
  "bedah thorax": { floor: "2", lat: 724, lng: 918.08 },
  "poli bedah thorax": { floor: "2", lat: 724, lng: 918.08 },

  // Lantai 2
  "tht": { floor: "2", lat: 879.32, lng: 646.25 },
  "poli tht": { floor: "2", lat: 879.32, lng: 646.25 },
  "POLI THT": { floor: "2", lat: 879.32, lng: 646.25 },
  "anak": { floor: "2", lat: 854.32, lng: 776.2 },
  "poli anak": { floor: "2", lat: 854.32, lng: 776.2 },
  "POLI ANAK": { floor: "2", lat: 854.32, lng: 776.2 },
  "mata": { floor: "2", lat: 827.82, lng: 877.67 },
  "poli mata": { floor: "2", lat: 827.82, lng: 877.67 },
  "POLI MATA": { floor: "2", lat: 827.82, lng: 877.67 },
  "bedah anak": { floor: "2", lat: 751.82, lng: 789.2 },
  "poli bedah anak": { floor: "2", lat: 751.82, lng: 789.2 },
  "POLI BEDAH ANAK": { floor: "2", lat: 751.82, lng: 789.2 },
  "bedah urologi": { floor: "2", lat: 740.04, lng: 862.17 },
  "bedah urolgi": { floor: "2", lat: 740.04, lng: 862.17 },
  "poli bedah urologi": { floor: "2", lat: 740.04, lng: 862.17 },
  "POLI BEDAH UROLGI": { floor: "2", lat: 740.04, lng: 862.17 },
  "kulit kelamin": { floor: "2", lat: 802.06, lng: 995.13 },
  "kulit dan kelamin": { floor: "2", lat: 802.06, lng: 995.13 },
  "poli kulit kelamin": { floor: "2", lat: 802.06, lng: 995.13 },
  "POLI KULIT KELAMIN": { floor: "2", lat: 802.06, lng: 995.13 },
  "bedah plastik": { floor: "2", lat: 707.56, lng: 980.13 },
  "bedah plastic": { floor: "2", lat: 707.56, lng: 980.13 },
  "poli bedah plastik": { floor: "2", lat: 707.56, lng: 980.13 },
  "POLI BEDAH PLASTIK": { floor: "2", lat: 707.56, lng: 980.13 },
  "kemotrapi": { floor: "2", lat: 702.06, lng: 1052.11 },
  "kemoterapi": { floor: "2", lat: 702.06, lng: 1052.11 },
  "poli kemotrapi": { floor: "2", lat: 702.06, lng: 1052.11 },
  "POLI KEMOTRAPI": { floor: "2", lat: 702.06, lng: 1052.11 },
  "psikiatri": { floor: "2", lat: 774.56, lng: 1118.59 },
  "poli psikiatri": { floor: "2", lat: 774.56, lng: 1118.59 },
  "POLI PSIKIATRI": { floor: "2", lat: 774.56, lng: 1118.59 },
  "vct": { floor: "2", lat: 689.82, lng: 1104.09 },
  "poli vct": { floor: "2", lat: 689.82, lng: 1104.09 },
  "POLI VCT": { floor: "2", lat: 689.82, lng: 1104.09 },
};

function findUnitLocation(unitName: string): { floor: string; lat: number; lng: number } | null {
  const lower = unitName.toLowerCase().trim().replace(/^poli\s+/i, "").replace(/[\s\-_]+/g, " ");
  if (UNIT_LOCATIONS[lower]) return UNIT_LOCATIONS[lower];
  if (UNIT_LOCATIONS[`poli ${lower}`]) return UNIT_LOCATIONS[`poli ${lower}`];

  for (const [key, val] of Object.entries(UNIT_LOCATIONS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return null;
}

const MAP_BOUNDS: import("leaflet").LatLngBoundsExpression = [[0, 0], [1000, 1600]];

interface PatientMapProps {
  units?: DetailAntrian[];
  mapImage?: string;
  onSelectPoli?: (poliId: number) => void;
  onSummariesChange?: (summaries: PoliSummary[]) => void;
  selectedPoliId?: number | null;
}

/** Denah Leaflet berbasis gambar untuk tiga lantai rumah sakit. */
export default function PatientMap({
  units = [],
  mapImage,
  onSelectPoli,
  onSummariesChange,
  selectedPoliId,
}: PatientMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const overlayRef = useRef<import("leaflet").ImageOverlay | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [floor, setFloor] = useState(FLOORS[0]);
  const [summaries, setSummaries] = useState<PoliSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Simpan refs supaya renderMap bisa akses data terbaru tanpa re-trigger effect
  const unitsRef = useRef(units);
  unitsRef.current = units;
  const floorRef = useRef(floor);
  floorRef.current = floor;
  const summariesRef = useRef(summaries);
  summariesRef.current = summaries;
  const selectedPoliRef = useRef(selectedPoliId);
  selectedPoliRef.current = selectedPoliId;
  const onSelectPoliRef = useRef(onSelectPoli);
  onSelectPoliRef.current = onSelectPoli;

  useEffect(() => {
    let cancelled = false;
    const loadSummary = async () => {
      try {
        const response = await fetch("/api/dashboard/poli-summary", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message ?? "Gagal memuat summary");
        if (!cancelled) {
          const nextSummaries = result.data ?? [];
          setSummaries(nextSummaries);
          onSummariesChange?.(nextSummaries);
          setSummaryError(null);
        }
      } catch (error) {
        console.error("Fetch poli summary error:", error);
        if (!cancelled) setSummaryError("Data pasien gagal diperbarui");
      } finally { if (!cancelled) setSummaryLoading(false); }
    };
    void loadSummary();
    const timer = window.setInterval(loadSummary, 20_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  // Render satu marker static per poli; refresh hanya mengganti data indikator.
  const renderPins = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!map || !L) return;
    markersRef.current.forEach((marker) => marker.remove());
    const newMarkers: Marker[] = [];
    unitsRef.current.forEach((unit) => {
      const location = findUnitLocation(unit.unit_tampil) ?? findUnitLocation(unit.nama);
      if (!location || location.floor !== floorRef.current.id) return;
      const summary = summariesRef.current.find((item) => item.poli_id === unit.unit_id);
      const values = [summary?.waiting_0_30 ?? 0, summary?.waiting_30_60 ?? 0, summary?.waiting_60_120 ?? 0, summary?.waiting_120_plus ?? 0];
      const sizes = values.map((value) => Math.min(22, 7 + Math.log2(value + 1) * 3));
      const colors = ["#22c55e", "#eab308", "#f97316", "#ef4444"];
      const html = `<div class=\"poli-marker ${selectedPoliRef.current === unit.unit_id ? "poli-marker-selected" : ""}\"><strong>${unit.unit_tampil}</strong><span class=\"poli-marker-total\">${summary?.belum_diperiksa ?? "…"}</span><div class=\"poli-marker-dots\">${colors.map((color, i) => `<i style=\"background:${color};width:${sizes[i]}px;height:${sizes[i]}px\"></i>`).join("")}</div></div>`;
      const marker = L.marker([location.lat, location.lng], { icon: L.divIcon({ className: "", html, iconSize: [130, 58], iconAnchor: [65, 29] }) }).addTo(map);
      marker.on("click", () => {
        onSelectPoliRef.current?.(unit.unit_id);
      });
      marker.bindTooltip(unit.unit_tampil, { direction: "top" });
      newMarkers.push(marker);
    });
    markersRef.current = newMarkers;
    map.invalidateSize();
  }, []);

  useEffect(() => { renderPins(); }, [summaries, floor, selectedPoliId, renderPins]);

  // Init Leaflet map — sekali saja saat mount
  useEffect(() => {
    let disposed = false;

    const initMap = async () => {
      if (!mapElement.current || mapRef.current) return;
      const leaflet = await import("leaflet");
      if (disposed || mapRef.current) return;

      const map = leaflet.default.map(mapElement.current, {
        crs: leaflet.default.CRS.Simple,
        minZoom: -2,
        maxZoom: 3,
        zoomControl: true,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 60,
        inertia: true,
        inertiaDeceleration: 2000,
        maxBoundsViscosity: 0.8,
        bounceAtZoomLimits: false,
        zoomAnimation: false,
      });

      map.fitBounds(MAP_BOUNDS);
      map.setMaxBounds([[-200, -200], [1200, 1800]]);
      leafletRef.current = leaflet.default;
      mapRef.current = map;
      map.dragging.enable();
      map.touchZoom.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();

      // Denah sebagai layer Leaflet agar ikut pan, zoom, dan resize map
      overlayRef.current = leaflet.default.imageOverlay(floorRef.current.image, MAP_BOUNDS, {
        opacity: 0.9,
        interactive: false,
      }).addTo(map);

      // Render pertama kali
      renderPins();
      requestAnimationFrame(() => map.invalidateSize());
    };

    void initMap();
    return () => {
      disposed = true;
      overlayRef.current = null;
      leafletRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // Ganti denah secara sinkron setelah lantai dipilih; tidak ada import async di sini.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    overlayRef.current?.remove();
    overlayRef.current = L.imageOverlay(floor.image, MAP_BOUNDS, {
      opacity: 0.9,
      interactive: false,
    }).addTo(map);
    map.invalidateSize();
  }, [floor]);

  return (
    <section className="rounded-2xl border border-slate-700/40 bg-slate-800 p-5 shadow-md">
      <style>{`
        .leaflet-container { background: transparent !important; }
        .poli-marker { min-width: 118px; border-radius: 10px; border: 2px solid rgba(15, 23, 42, .85); background: rgba(15, 23, 42, .92); color: #e2e8f0; padding: 4px 7px; text-align: center; box-shadow: 0 2px 8px rgba(15, 23, 42, .45); }
        .poli-marker-selected { border-color: #67e8f9; box-shadow: 0 0 0 3px rgba(34, 211, 238, .35); }
        .poli-marker strong { display: block; max-width: 104px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9px; }
        .poli-marker-total { display: block; font-size: 13px; font-weight: 800; color: #f8fafc; }
        .poli-marker-dots { display: flex; align-items: center; justify-content: center; gap: 3px; height: 23px; }
        .poli-marker-dots i { display: block; border-radius: 9999px; box-shadow: 0 0 4px currentColor; }
      `}</style>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-200">Denah Lokasi Pasien</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex overflow-hidden rounded border border-slate-600 bg-slate-900">
            {FLOORS.map((item) => <button key={item.id} type="button" onClick={() => setFloor(item)} className={`px-3 py-1.5 ${floor.id === item.id ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>{item.label}</button>)}
          </div>
          <span className="inline-flex items-center gap-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-slate-300"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Lokasi Pasien</span>
          <span className="inline-flex items-center gap-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-slate-300"><span className="h-2 w-2 rounded-full bg-rose-300" /> Priority Watchlist</span>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-white">
        <div
          ref={mapElement}
          className="h-[360px] w-full sm:h-[420px] lg:h-[480px]"
          aria-label={`Peta interaktif ${floor.label}`}
        />
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-2 rounded bg-slate-900/90 px-3 py-2 text-xs text-slate-300"><Layers size={14} className="text-cyan-400" /> {floor.label}</div>
        {summaryError && <div className="absolute left-3 top-3 z-[500] rounded bg-rose-950/90 px-3 py-2 text-xs text-rose-200">{summaryError}</div>}
      </div>
    </section>
  );
}

