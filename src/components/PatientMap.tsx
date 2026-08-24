"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Layers, MapPin } from "lucide-react";
import type { DetailAntrian } from "@/types";

interface MapPatient {
  pasien_id: number;
}

function getWaitMinutes(value: string | null | undefined) {
  if (!value || /masih|anomali/i.test(value)) return null;
  const hours = Number(value.match(/(\d+)\s*Jam/i)?.[1] ?? 0);
  const minutes = Number(value.match(/(\d+)\s*Menit/i)?.[1] ?? 0);
  return hours * 60 + minutes;
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
 * Koordinat akurat setiap poli dari hasil mapping.
 * Key: nama unit (lowercase) untuk fuzzy match dengan unit_tampil dari database.
 */
const UNIT_LOCATIONS: Record<string, { floor: string; lat: number; lng: number }> = {
  "poli paru":               { floor: "1", lat: 883.78, lng: 633.24 },
  "poli interna":             { floor: "1", lat: 861.08, lng: 742.59 },
  "penyakit dalam":           { floor: "1", lat: 861.08, lng: 742.59 },
  "poli jantung":             { floor: "1", lat: 835.01, lng: 832.60 },
  "jantung dan pembuluh darah":{ floor: "1", lat: 835.01, lng: 832.60 },
  "depo farmasi 1":           { floor: "1", lat: 817.35, lng: 929.33 },
  "depofarmasi1":             { floor: "1", lat: 817.35, lng: 929.33 },
  "poli saraf":               { floor: "1", lat: 787.92, lng: 1026.90 },
  "poli syaraf":              { floor: "1", lat: 787.92, lng: 1026.90 },
  "poli anak":                { floor: "1", lat: 640.00, lng: 1160.00 },
  "poli psikiatri":           { floor: "1", lat: 620.00, lng: 1080.00 },
  "poli mata":                { floor: "1", lat: 610.00, lng: 1000.00 },
  "poli hema onko":           { floor: "1", lat: 685.89, lng: 1263.10 },
  "poli hema onko anak":      { floor: "1", lat: 685.89, lng: 1263.10 },
  "poli kulit kelamin":       { floor: "1", lat: 570.00, lng: 900.00 },
  "poli kemoterapi":          { floor: "1", lat: 663.97, lng: 1326.76 },
  "poli bedah urologi":       { floor: "1", lat: 720.00, lng: 850.00 },
  "poli gigi":                { floor: "1", lat: 550.00, lng: 800.00 },
  "poli tht":                 { floor: "1", lat: 580.00, lng: 850.00 },
  "poli vct":                 { floor: "1", lat: 540.00, lng: 900.00 },
  "poli bedah anak":          { floor: "1", lat: 720.00, lng: 780.00 },
  "poli bedah anastesi":      { floor: "1", lat: 742.51, lng: 819.14 },
  "poli eksekutif":           { floor: "1", lat: 500.00, lng: 700.00 },
  "poli bedah plastik":       { floor: "1", lat: 700.00, lng: 750.00 },
  "soeskin":                  { floor: "1", lat: 570.00, lng: 900.00 },
  "gastroenterologi-hepatologi": { floor: "1", lat: 861.08, lng: 742.59 },
  "premyum":                  { floor: "1", lat: 500.00, lng: 700.00 },
  "poli bedah thorax":        { floor: "1", lat: 700.00, lng: 820.00 },
  "spine/klinik sp.":         { floor: "1", lat: 784.56, lng: 673.62 },
  "poli hip and knee":        { floor: "1", lat: 784.56, lng: 673.62 },
  "poli kardiologi anak":     { floor: "1", lat: 835.01, lng: 832.60 },
  "kehamilan":                { floor: "1", lat: 771.10, lng: 1123.63 },
  "hemodalisa":               { floor: "1", lat: 801.37, lng: 602.12 },
  "poli bedah ortopedi":      { floor: "1", lat: 784.56, lng: 673.62 },
  "bedah orthopedi":          { floor: "1", lat: 784.56, lng: 673.62 },
  "poli anastesi":            { floor: "1", lat: 742.51, lng: 819.14 },
  "poli bedah umum":          { floor: "1", lat: 733.26, lng: 890.63 },
  "poli bedah digestif":      { floor: "1", lat: 709.72, lng: 963.82 },
  "poli bedah syaraf":        { floor: "1", lat: 698.78, lng: 1030.27 },
  "bedah saraf":              { floor: "1", lat: 698.78, lng: 1030.27 },
  "poli gizi":                { floor: "1", lat: 679.53, lng: 1104.66 },
  "poli mri":                 { floor: "1", lat: 854.18, lng: 526.78 },
  "poli onkologi":            { floor: "1", lat: 685.89, lng: 1263.10 },
  "bedah onkologi":           { floor: "1", lat: 685.89, lng: 1263.10 },
  "hemato onkologi":          { floor: "1", lat: 685.89, lng: 1263.10 },
  "poli platinum":            { floor: "1", lat: 663.97, lng: 1326.76 },
  "vaksin, klinik":           { floor: "1", lat: 591.14, lng: 1276.54 },
  "mcu dan vaksin":           { floor: "1", lat: 591.14, lng: 1276.54 },
};

function findUnitLocation(unitName: string): { floor: string; lat: number; lng: number } | null {
  const lower = unitName.toLowerCase().trim();
  if (UNIT_LOCATIONS[lower]) return UNIT_LOCATIONS[lower];
  for (const [key, val] of Object.entries(UNIT_LOCATIONS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return null;
}

/** Sebarkan pin pasien secara deterministik di sekitar koordinat poli agar tidak bertumpuk. */
function getPatientPinPosition(location: { lat: number; lng: number }, index: number, total: number) {
  if (total <= 1) return location;
  const ring = Math.floor((Math.sqrt(index + 1) - 1) / 2) + 1;
  const ringStart = (2 * ring - 1) ** 2;
  const ringSize = 8 * ring;
  const ringIndex = (index - ringStart + 1 + ringSize) % ringSize;
  const angle = (ringIndex / ringSize) * Math.PI * 2;
  const radius = 13 * ring;
  return {
    lat: location.lat + Math.sin(angle) * radius,
    lng: location.lng + Math.cos(angle) * radius,
  };
}

const MAP_BOUNDS: import("leaflet").LatLngBoundsExpression = [[0, 0], [1000, 1600]];

interface PatientMapProps {
  units?: DetailAntrian[];
  mapImage?: string;
}

/** Denah Leaflet berbasis gambar untuk tiga lantai rumah sakit. */
export default function PatientMap({ units = [], mapImage }: PatientMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const overlayRef = useRef<import("leaflet").ImageOverlay | null>(null);
  const markersRef = useRef<import("leaflet").CircleMarker[]>([]);
  const [floor, setFloor] = useState(FLOORS[0]);
  const [patientsByUnit, setPatientsByUnit] = useState<Record<number, MapPatient[]>>({});
  const [overduePatients, setOverduePatients] = useState<Set<number>>(new Set());

  // Fetch history pasien untuk deteksi overdue — menggunakan batch endpoint
  useEffect(() => {
    let cancelled = false;

    async function loadPatientHistory() {
      const unitIds = units.map((u) => u.unit_id).join(",");
      if (!unitIds) return;

      try {
        // Satu request mengambil semua pasien dari seluruh unit.
        const response = await fetch(`/api/antrian/map?units=${unitIds}`, { cache: "no-store" });
        if (!response.ok) return;

        const result = await response.json();
        const merged = (result.data ?? {}) as Record<number, MapPatient[]>;
        for (const unit of units) merged[unit.unit_id] ??= [];

        const allPatients = Object.values(merged).flat();
        const overdue = new Set<number>();
        if (allPatients.length > 0) {
          const response = await fetch(
            `/api/history/batch?ids=${allPatients.map((patient) => patient.pasien_id).join(",")}`,
            { cache: "no-store" },
          );
          if (response.ok) {
            const result = await response.json();
            const histories = (result.data ?? {}) as Record<number, { [key: string]: unknown }>;
            for (const patient of allPatients) {
              const minutes = getWaitMinutes(histories[patient.pasien_id]?.["Total Waktu Tunggu"] as string | null | undefined);
              if (minutes !== null && minutes > 120) overdue.add(patient.pasien_id);
            }
          }
        }

        if (!cancelled) {
          setPatientsByUnit(merged);
          setOverduePatients(overdue);
        }
      } catch (error) {
        console.error("Fetch pasien map error:", error);
      }
    }

    void loadPatientHistory();
    return () => { cancelled = true; };
  }, [units]);

  // Simpan refs supaya renderMap bisa akses data terbaru tanpa re-trigger effect
  const unitsRef = useRef(units);
  unitsRef.current = units;
  const floorRef = useRef(floor);
  floorRef.current = floor;
  const patientsByUnitRef = useRef(patientsByUnit);
  patientsByUnitRef.current = patientsByUnit;
  const overduePatientsRef = useRef(overduePatients);
  overduePatientsRef.current = overduePatients;

  // Render pins — dipanggil langsung, tidak async
  const renderPins = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!map || !L) return;

    // Hapus pin lama
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const currentFloor = floorRef.current;
    const currentUnits = unitsRef.current;
    const currentPatientsByUnit = patientsByUnitRef.current;
    const currentOverdue = overduePatientsRef.current;

    const newMarkers: import("leaflet").CircleMarker[] = [];
    currentUnits.forEach((unit, unitIndex) => {
      const location = findUnitLocation(unit.unit_tampil) ?? findUnitLocation(unit.nama);
      if (!location || location.floor !== currentFloor.id) return;
      const color = POLI_COLORS_HEX[unitIndex % POLI_COLORS_HEX.length];
      const patients = currentPatientsByUnit[unit.unit_id] ?? [];

      patients.forEach((patient, patientIndex) => {
        const isOverdue = currentOverdue.has(patient.pasien_id);
        const position = getPatientPinPosition(location, patientIndex, patients.length);
        const m = L.circleMarker([position.lat, position.lng], {
          radius: isOverdue ? 8 : 7,
          color: isOverdue ? "#b91c1c" : color,
          fillColor: isOverdue ? "#ef4444" : color,
          fillOpacity: 0.9,
          weight: 2,
          className: isOverdue ? "patient-pin-overdue" : undefined,
        }).addTo(map);
        m.bindTooltip(`${unit.unit_tampil} — Pasien ${patientIndex + 1}`, { direction: "top", offset: [0, -8] });
        newMarkers.push(m);
      });
    });
    markersRef.current = newMarkers;
    map.invalidateSize();
  }, []);

  // Re-render pins saat data berubah
  useEffect(() => {
    renderPins();
  }, [patientsByUnit, overduePatients, floor, renderPins]);

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
  }, [renderPins]);

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
      <style>{`\n        @keyframes patient-pin-pulse {\n          0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px #ef4444); }\n          50% { opacity: 0.35; filter: drop-shadow(0 0 9px #ef4444); }\n        }\n        .patient-pin-overdue { animation: patient-pin-pulse 1s ease-in-out infinite; }\n        .leaflet-container { background: transparent !important; }\n      `}</style>
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
        <div className="pointer-events-none absolute bottom-3 right-3 z-[500] flex items-center gap-2 rounded bg-slate-900/90 px-3 py-2 text-xs text-slate-300"><MapPin size={14} className="text-emerald-400" /> Marker aktif</div>

        {/* Kotak pin pasien yang sudah selesai dilayani */}
        {units.some((u) => u.sudah_dilayani > 0) && (
          <div className="absolute right-3 top-1/2 z-[500] flex h-24 w-28 -translate-y-1/2 flex-col rounded-lg border-2 border-rose-300/70 bg-slate-900/80 p-2 shadow-lg sm:h-28 sm:w-36">
            <span className="mb-2 text-center text-[9px] font-semibold uppercase tracking-wide text-rose-200">Selesai</span>
            <div className="flex flex-wrap content-start gap-1.5 overflow-y-auto">
              {units.flatMap((unit) =>
                Array.from({ length: unit.sudah_dilayani }, (_, index) => (
                  <span
                    key={`selesai-${unit.unit_id}-${index}`}
                    title={`${unit.unit_tampil} — pasien selesai`}
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-rose-200 bg-rose-400 shadow-[0_0_5px_rgba(251,113,133,0.7)]"
                  />
                )),
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
