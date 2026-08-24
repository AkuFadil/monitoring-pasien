import { UserRound, CheckCircle2, AlertTriangle, ClockAlert } from "lucide-react";
import type { DetailAntrian } from "@/types";

export default function SummaryCards({ data }: { data: DetailAntrian[] }) {
  const totalPasien = data.reduce((acc, item) => acc + item.total_antrian, 0);
  const unitKritis = data.filter((item) => item.belum_dilayani >= 5).length;
  const priorityWatchlist = 0;
  const tungguLebih3Jam = 0; // TODO: fetch dari API /api/tunggu nanti

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
      {/* Total Pasien */}
      <div className="bg-slate-800 px-5 py-3.5 rounded-2xl shadow-md border border-slate-700/40">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5"><UserRound size={14} className="text-emerald-400" /> Total Semua Pasien</p>
            <p className="text-2xl font-bold text-white mt-1">{totalPasien}</p>
          </div>
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-0.5 mt-0.5">+12 hari ini</span>
        </div>
      </div>

      {/* Pasien Tunggu Lebih 3 Jam */}
      <div className="bg-slate-800 px-5 py-3.5 rounded-2xl shadow-md border border-slate-700/40">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5"><ClockAlert size={14} className="text-rose-400" /> Pasien Tunggu {'>'}3 Jam</p>
            <p className="text-2xl font-bold text-white mt-1">{tungguLebih3Jam}</p>
          </div>
          <span className="text-[11px] text-rose-400/70 mt-0.5">Perlu Perhatian</span>
        </div>
      </div>

      {/* Total Unit Kritis */}
      <div className="bg-slate-800 px-5 py-3.5 rounded-2xl shadow-md border border-slate-700/40">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5"><AlertTriangle size={14} className="text-amber-400" /> Total Unit Kritis</p>
            <p className="text-2xl font-bold text-white mt-1">{unitKritis}</p>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">Kapasitas Kursi Penuh</span>
        </div>
      </div>

      {/* Priority Watchlist */}
      <div className="bg-slate-800 px-5 py-3.5 rounded-2xl shadow-md border border-slate-700/40">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-amber-500" /> Priority Watchlist</p>
            <p className="text-2xl font-bold text-white mt-1">{priorityWatchlist}</p>
          </div>
          <button className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 mt-0.5">Lihat Detail →</button>
        </div>
      </div>
    </div>
  );
}
