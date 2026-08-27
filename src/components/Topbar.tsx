"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, ShieldCheck, Stethoscope } from "lucide-react";

interface UserProfile {
  id: number;
  username: string;
  nama: string;
  role: string;
  app_access: number;
}

export default function Topbar() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user) {
            setUser(json.user);
          }
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    }
    void loadUser();
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
    }
  }

  const roleTitle = user?.role ? user.role.toUpperCase() : "POLI";
  const isAdmin = user?.app_access === 0;

  return (
    <nav className="flex items-center justify-between bg-slate-800 px-4 py-2.5 sm:px-5 rounded-2xl shadow-md border border-slate-700/40 mb-3">
      {/* Kiri: sapaan pengguna + badge role */}
      <div className="flex items-center gap-2 sm:gap-3">
        <p className="text-xs sm:text-sm font-medium text-slate-100">
          Halo, <span className="font-bold text-cyan-300">{user?.nama || "Pengguna"}</span>
        </p>

        {user && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isAdmin
                ? "bg-purple-950/60 border-purple-500/40 text-purple-300"
                : "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
            }`}
          >
            {isAdmin ? (
              <>
                <ShieldCheck size={12} /> Admin (Semua Poli)
              </>
            ) : (
              <>
                <Stethoscope size={12} /> Poli: {roleTitle}
              </>
            )}
          </span>
        )}
      </div>

      {/* Tengah: pesan selamat datang */}
      <p className="hidden md:block text-[11px] sm:text-xs text-slate-400">
        Monitoring Antrean Pasien RS dr. Soebandi
      </p>

      {/* Kanan: settings, logout & avatar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Pengaturan"
        >
          <Settings size={16} />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
          aria-label="Logout"
          title="Keluar"
        >
          <LogOut size={16} />
        </button>
        <img
          src="/img/avatar.png"
          alt="Avatar pengguna"
          className="h-8 w-8 rounded-full border-2 border-slate-600 object-cover"
          onError={(e) => {
            e.currentTarget.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
          }}
        />
      </div>
    </nav>
  );
}

