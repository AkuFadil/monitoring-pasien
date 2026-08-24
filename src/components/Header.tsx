import Clock from "./Clock";

interface HeaderProps {
  totalPasien?: number;
}

/**
 * Header — logo, judul dashboard, jam real-time
 * Mirrors header di Dashboard_view.php
 */
export default function Header({ totalPasien = 0 }: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-center bg-slate-800 px-4 py-3 sm:px-5 md:px-6 rounded-2xl shadow-md border border-slate-700/40 gap-3 sm:gap-4">
      {/* Logo & Judul Dashboard */}
      <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left min-w-0">
        <img
          src="/img/soebandi.png"
          alt="Logo RSD dr. Soebandi"
          className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-[0.8rem] sm:text-sm md:text-base font-extrabold tracking-wide text-blue-400 leading-snug">
            DASHBOARD MONITORING KUNJUNGAN PASIEN RAWAT JALAN
          </h1>
          <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5">RSD dr. Soebandi Jember</p>
          <p className="text-slate-500 text-[9px] sm:text-[10px] mt-0.5 leading-relaxed">
            Total Pasien merupakan data real time &ldquo;jumlah total pasien per hari ini = {totalPasien}&rdquo;
          </p>
        </div>
      </div>

      {/* Jam & Tanggal Realtime */}
      <div className="shrink-0 text-center sm:text-right">
        <Clock />
      </div>
    </header>
  );
}
