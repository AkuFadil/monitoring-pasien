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
  "poli paru": { floor: "1", lat: 883.78, lng: 633.24 },
  "poli interna": { floor: "1", lat: 861.08, lng: 742.59 },
  "poli jantung": { floor: "1", lat: 835.01, lng: 832.60 },
  "depo farmasi 1": { floor: "1", lat: 817.35, lng: 929.33 },
  "depofarmasi 1": { floor: "1", lat: 817.35, lng: 929.33 },
  "depo 1": { floor: "1", lat: 817.35, lng: 929.33 },
  "poli saraf": { floor: "1", lat: 787.92, lng: 1026.90 },
  "poli kandungan": { floor: "1", lat: 771.10, lng: 1123.63 },
  "hemodalisa": { floor: "1", lat: 801.37, lng: 602.12 },
  "poli bedah ortopedi": { floor: "1", lat: 784.56, lng: 673.62 },
  "poli anastesi": { floor: "1", lat: 742.51, lng: 819.14 },
  "poli bedah umum": { floor: "1", lat: 733.26, lng: 890.63 },
  "poli bedah digestif": { floor: "1", lat: 709.72, lng: 963.82 },
  "poli bedah syaraf": { floor: "1", lat: 698.78, lng: 1030.27 },
  "poli bedah saraf": { floor: "1", lat: 698.78, lng: 1030.27 },
  "poli gizi": { floor: "1", lat: 679.53, lng: 1104.66 },
  "poli mri": { floor: "1", lat: 854.18, lng: 526.78 },
  "poli onkologi": { floor: "1", lat: 685.89, lng: 1263.10 },
  "poli platinum": { floor: "1", lat: 663.97, lng: 1326.76 },
  "vaksin, klinik": { floor: "1", lat: 591.14, lng: 1276.54 },
};

function findUnitLocation(unitName: string): { floor: string; lat: number; lng: number } | null {
  const lower = unitName.toLowerCase().trim().replace(/\s+/g, " ");
  return UNIT_LOCATIONS[lower] ?? null;
}

const MAP_BOUNDS: import("leaflet").LatLngBoundsExpression = [[0, 0], [1000, 1600]];

interface PatientMapProps {
  units?: DetailAntrian[];
  mapImage?: string;
  onSelectedPoliChange?: (summary: PoliSummary | null) => void;
  onSummariesChange?: (summaries: PoliSummary[]) => void;
  selectedPoliId?: number | null;
}

/** Denah Leaflet berbasis gambar untuk tiga lantai rumah sakit. */
export default function PatientMap({
  units = [],
  mapImage,
  onSelectedPoliChange,
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
  const [selectedPoli, setSelectedPoli] = useState<number | null>(null);

  // Simpan refs supaya renderMap bisa akses data terbaru tanpa re-trigger effect
  const unitsRef = useRef(units);
  unitsRef.current = units;
  const floorRef = useRef(floor);
  floorRef.current = floor;
  const summariesRef = useRef(summaries);
  summariesRef.current = summaries;
  const selectedPoliRef = useRef(selectedPoli);
  selectedPoliRef.current = selectedPoli;

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

  useEffect(() => {
    if (selectedPoliId !== undefined) {
      setSelectedPoli(selectedPoliId);
    }
  }, [selectedPoliId]);

  // Render satu marker static per poli; refresh hanya mengganti data indikator.
  const renderPins = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!map || !L) return;
    markersRef.current.forEach((marker) => marker.remove());
    const newMarkers: Marker[] = [];
    unitsRef.current.forEach((unit, index) => {
      const location = findUnitLocation(unit.unit_tampil) ?? findUnitLocation(unit.nama);
      if (!location || location.floor !== floorRef.current.id) return;
      const summary = summariesRef.current.find((item) => item.poli_id === unit.unit_id);
      const values = [summary?.waiting_0_30 ?? 0, summary?.waiting_30_60 ?? 0, summary?.waiting_60_120 ?? 0, summary?.waiting_120_plus ?? 0];
      const sizes = values.map((value) => Math.min(22, 7 + Math.log2(value + 1) * 3));
      const colors = ["#22c55e", "#eab308", "#f97316", "#ef4444"];
      const html = `<div class=\"poli-marker ${selectedPoliRef.current === unit.unit_id ? "poli-marker-selected" : ""}\"><strong>${unit.unit_tampil}</strong><span class=\"poli-marker-total\">${summary?.belum_diperiksa ?? "…"}</span><div class=\"poli-marker-dots\">${colors.map((color, i) => `<i style=\"background:${color};width:${sizes[i]}px;height:${sizes[i]}px\"></i>`).join("")}</div></div>`;
      const marker = L.marker([location.lat, location.lng], { icon: L.divIcon({ className: "", html, iconSize: [130, 58], iconAnchor: [65, 29] }) }).addTo(map);
      marker.on("click", () => setSelectedPoli(unit.unit_id));
      marker.bindTooltip(unit.unit_tampil, { direction: "top" });
      newMarkers.push(marker);
    });
    markersRef.current = newMarkers;
    map.invalidateSize();
  }, []);

  useEffect(() => { renderPins(); }, [summaries, floor, selectedPoli, renderPins]);

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

  const selectedSummary = summaries.find((summary) => summary.poli_id === selectedPoli) ?? null;

  useEffect(() => {
    onSelectedPoliChange?.(selectedSummary);
  }, [onSelectedPoliChange, selectedSummary]);

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

