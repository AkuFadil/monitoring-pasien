"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Copy, Layers, MapPin, Plus, Trash2, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

const FLOORS = [
  { id: "1", label: "Lantai 1", image: "/img/Lt 1.png" },
  { id: "2", label: "Lantai 2", image: "/img/Lt 2.png" },
  { id: "3", label: "Lantai 3", image: "/img/Lt 3.png" },
];

interface CoordinatePoint {
  id: string;
  lat: number;
  lng: number;
  floorId: string;
  floorLabel: string;
  unitName: string;
  timestamp: string;
}

const STORAGE_KEY = "mapping-coordinates";

function loadPoints(): CoordinatePoint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export default function MappingPage() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [floor, setFloor] = useState(FLOORS[0]);
  const [points, setPoints] = useState<CoordinatePoint[]>(loadPoints);
  const [lastClick, setLastClick] = useState<{ lat: number; lng: number } | null>(null);
  const [unitName, setUnitName] = useState("");
  const [copied, setCopied] = useState(false);

  // Auto-save ke localStorage setiap points berubah
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  }, [points]);

  // Init map sekali saja
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
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 60,
        inertia: true,
        inertiaDeceleration: 2000,
        maxBoundsViscosity: 0.8,
        bounceAtZoomLimits: false,
      });

      const mapBounds: import("leaflet").LatLngBoundsExpression = [[0, 0], [1000, 1600]];
      map.fitBounds(mapBounds);
      map.setMaxBounds([[-200, -200], [1200, 1800]]);
      mapRef.current = map;

      requestAnimationFrame(() => map.invalidateSize());
    };

    void initMap();
    return () => { disposed = true; };
  }, []);

  // Cleanup
  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; }, []);

  // Update overlay + pick mode setiap floor berubah
  useEffect(() => {
    let disposed = false;
    let overlay: import("leaflet").ImageOverlay | null = null;

    const updateOverlay = async () => {
      const map = mapRef.current;
      if (!map) return;
      const leaflet = await import("leaflet");
      if (disposed) return;

      // Clear overlay lama
      map.eachLayer((layer) => {
        if (layer instanceof leaflet.default.ImageOverlay) {
          map.removeLayer(layer);
        }
      });

      // Tambah overlay baru
      const bounds: import("leaflet").LatLngBoundsExpression = [[0, 0], [1000, 1600]];
      overlay = leaflet.default.imageOverlay(floor.image, bounds, { opacity: 0.9 }).addTo(map);

      // Enable click mode untuk ambil koordinat
      map.off("click");
      map.on("click", (e: any) => {
        const lat = Math.round(e.latlng.lat * 100) / 100;
        const lng = Math.round(e.latlng.lng * 100) / 100;
        setLastClick({ lat, lng });
      });

      map.invalidateSize();
    };

    void updateOverlay();
    return () => {
      disposed = true;
      overlay?.remove();
    };
  }, [floor]);

  // Tambah titik ke tabel
  const addPoint = useCallback(() => {
    if (!lastClick) return;
    const newPoint: CoordinatePoint = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      lat: lastClick.lat,
      lng: lastClick.lng,
      floorId: floor.id,
      floorLabel: floor.label,
      unitName: unitName.trim() || `Unit ${points.length + 1}`,
      timestamp: new Date().toLocaleTimeString("id-ID"),
    };
    setPoints((prev) => [...prev, newPoint]);
    setUnitName("");
    setLastClick(null);
  }, [lastClick, floor, unitName, points.length]);

  // Hapus titik
  const removePoint = useCallback((id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Hapus semua titik
  const clearAllPoints = useCallback(() => {
    if (window.confirm("Hapus semua koordinat yang sudah disimpan?")) {
      setPoints([]);
    }
  }, []);

  // Copy koordinat ke clipboard sebagai TypeScript object
  const copyAllPoints = useCallback(async () => {
    const formatted = points.map((p) => ({
      unit: p.unitName,
      floor: p.floorId,
      lat: p.lat,
      lng: p.lng,
    }));
    const text = `const UNIT_LOCATIONS: Record<string, { floor: string; lat: number; lng: number }> = ${JSON.stringify(formatted.reduce((acc, p) => {
      acc[p.unit] = { floor: p.floor, lat: p.lat, lng: p.lng };
      return acc;
    }, {} as Record<string, { floor: string; lat: number; lng: number }>), null, 2)};`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [points]);

  // Export as JSON
  const exportJSON = useCallback(() => {
    const formatted = points.map((p) => ({
      unit: p.unitName,
      floor: p.floorId,
      lat: p.lat,
      lng: p.lng,
    }));
    const blob = new Blob([JSON.stringify(formatted, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unit-coordinates.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [points]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-slate-700 hover:text-white">
              <ArrowLeft size={14} /> Kembali
            </Link>
            <div>
              <h1 className="text-sm font-bold text-cyan-400">Coordinate Mapper</h1>
              <p className="text-[10px] text-slate-500">Klik di peta untuk ambil koordinat titik unit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">{points.length} titik</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1920px] px-4 py-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
          {/* Panel Peta */}
          <section className="rounded-2xl border border-slate-700/40 bg-slate-800 p-5 shadow-md">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-200">Denah Lokasi</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex overflow-hidden rounded border border-slate-600 bg-slate-900">
                  {FLOORS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFloor(item)}
                      className={`px-3 py-1.5 transition ${floor.id === item.id ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-[10px] text-slate-300">
                  <MapPin size={12} className="text-cyan-400" /> Klik peta untuk ambil koordinat
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              <div
                ref={mapElement}
                className="h-[400px] sm:h-[500px] lg:h-[600px] w-full cursor-crosshair"
                aria-label="Peta koordinat picker"
              />
              <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-2 rounded bg-slate-900/90 px-3 py-2 text-xs text-slate-300">
                <Layers size={14} className="text-cyan-400" /> {floor.label}
              </div>

              {/* Floating coordinate box */}
              {lastClick && (
                <div className="absolute left-3 top-3 z-[500] rounded-lg border border-cyan-500/50 bg-slate-900/95 p-3 shadow-xl">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Titik Terakhir</p>
                  <p className="font-mono text-sm text-white">[{lastClick.lat}, {lastClick.lng}]</p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={unitName}
                      onChange={(e) => setUnitName(e.target.value)}
                      placeholder="Nama unit (opsional)"
                      className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white outline-none focus:border-cyan-400"
                      onKeyDown={(e) => { if (e.key === "Enter") addPoint(); }}
                    />
                    <button
                      type="button"
                      onClick={addPoint}
                      className="flex shrink-0 items-center gap-1 rounded bg-cyan-500 px-2.5 py-1 text-xs font-semibold text-slate-900 transition hover:bg-cyan-400"
                    >
                      <Plus size={12} /> Simpan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Panel Tabel */}
          <section className="rounded-2xl border border-slate-700/40 bg-slate-800 p-5 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Daftar Koordinat</h2>
              <div className="flex gap-2">
                {points.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllPoints}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/30"
                  >
                    <Trash2 size={12} /> Hapus Semua
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyAllPoints}
                  disabled={points.length === 0}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-40"
                >
                  {copied ? <><Check size={12} /> Tersalin</> : <><Copy size={12} /> Copy TS</>}
                </button>
                <button
                  type="button"
                  onClick={exportJSON}
                  disabled={points.length === 0}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-500/30 disabled:opacity-40"
                >
                  Export JSON
                </button>
              </div>
            </div>

            {points.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MapPin size={40} className="mb-3 text-slate-700" />
                <p className="text-sm text-slate-500">Belum ada titik koordinat</p>
                <p className="mt-1 text-[10px] text-slate-600">Klik di peta untuk mulai menambahkan titik</p>
              </div>
            ) : (
              <div className="max-h-[600px] space-y-2 overflow-y-auto">
                {points.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 transition hover:border-slate-600"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-[10px] font-bold text-cyan-400">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{p.unitName}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                          [{p.lat}, {p.lng}] · {p.floorLabel}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePoint(p.id)}
                      className="rounded p-1 text-slate-600 transition hover:bg-red-500/20 hover:text-red-400"
                      title="Hapus titik"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Preview export */}
            {points.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Preview TypeScript</p>
                <pre className="max-h-48 overflow-auto font-mono text-[10px] leading-relaxed text-slate-400">
{`const UNIT_LOCATIONS = ${JSON.stringify(points.reduce((acc, p) => {
  acc[p.unitName] = { floor: p.floorId, lat: p.lat, lng: p.lng };
  return acc;
}, {} as Record<string, { floor: string; lat: number; lng: number }>), null, 2)};`}
                </pre>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
