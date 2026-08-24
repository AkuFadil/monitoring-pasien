import { Settings } from "lucide-react";

/**
 * Topbar — bar paling atas: sapaan pengguna, pesan selamat datang, settings & avatar
 */
export default function Topbar() {
  return (
    <nav className="flex items-center justify-between bg-slate-800 px-4 py-2.5 sm:px-5 rounded-2xl shadow-md border border-slate-700/40 mb-3">
      {/* Kiri: sapaan pengguna */}
      <p className="text-xs sm:text-sm font-medium text-blue-400">
        Halo, Dr. Bambang
      </p>

      {/* Tengah: pesan selamat datang */}
      <p className="hidden md:block text-[11px] sm:text-xs text-slate-400">
        Selamat datang di website monitoring pasien
      </p>

      {/* Kanan: settings & avatar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Pengaturan"
        >
          <Settings size={16} />
        </button>
        <img
          src="/img/avatar.png"
          alt="Avatar pengguna"
          className="h-8 w-8 rounded-full border-2 border-slate-600 object-cover"
          onError={(e) => {
            // Fallback jika avatar belum ada
            e.currentTarget.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
          }}
        />
      </div>
    </nav>
  );
}
