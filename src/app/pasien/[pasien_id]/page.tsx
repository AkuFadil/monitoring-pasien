"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Clock,
  CheckCircle2,
  Stethoscope,
  Pill,
  FileText,
  Copy,
  Check,
  Building2,
  Calendar,
  Activity,
  AlertCircle,
} from "lucide-react";
import Topbar from "@/components/Topbar";
import type { PasienDetail, HistoryPasien, HistoryPerjalanan } from "@/types";

interface PageProps {
  params: { pasien_id: string };
}

export default function PasienDetailPage({ params }: PageProps) {
  const routeParams = useParams();
  const pasienId = (routeParams?.pasien_id as string) || params?.pasien_id;

  const [pasienDetails, setPasienDetails] = useState<PasienDetail[]>([]);
  const [historyPasien, setHistoryPasien] = useState<HistoryPasien[]>([]);
  const [historyPerjalanan, setHistoryPerjalanan] = useState<HistoryPerjalanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!pasienId) return;
      setLoading(true);
      setError(null);
      try {
        const [resDetail, resHistory, resPerjalanan] = await Promise.all([
          fetch(`/api/pasien?pasien_id=${pasienId}`, { cache: "no-store" }),
          fetch(`/api/pasien/history?pasien_id=${pasienId}`, { cache: "no-store" }),
          fetch(`/api/history?pasien_id=${pasienId}`, { cache: "no-store" }),
        ]);

        if (!resDetail.ok || !resHistory.ok) {
          throw new Error("Gagal mengambil data pasien");
        }

        const [jsonDetail, jsonHistory, jsonPerjalanan] = await Promise.all([
          resDetail.json(),
          resHistory.json(),
          resPerjalanan.ok ? resPerjalanan.json() : Promise.resolve({ data: [] }),
        ]);

        setPasienDetails(jsonDetail.data ?? []);
        setHistoryPasien(jsonHistory.data ?? []);
        setHistoryPerjalanan(jsonPerjalanan.data ?? []);
      } catch (err: unknown) {
        console.error("Error loading patient detail:", err);
        setError("Data pasien tidak dapat dimuat atau tidak ditemukan");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [pasienId]);

  // Extract patient info from historyPasien or historyPerjalanan
  const primaryHistory = historyPasien[0] ?? null;
  const primaryPerjalanan = historyPerjalanan[0] ?? null;

  const namaPasien = primaryHistory?.nama ?? primaryPerjalanan?.["Nama Pasien"] ?? "Pasien Rawat Jalan";
  const noRm = primaryHistory?.no_rm ?? primaryPerjalanan?.["No. RM"] ?? "—";
  const namaUnitTujuan = primaryHistory?.nama_unit ?? "Poli Tujuan";
  const namaUnitAsal = primaryHistory?.nama_unit_asal ?? "Loket Pendaftaran";
  const totalWaktuTunggu = primaryPerjalanan?.["Total Waktu Tunggu"] ?? "Masih Dalam Process";

  // Milestones
  const jamDaftar = primaryHistory?.["Jam Daftar Awal"] ?? primaryPerjalanan?.["Jam Daftar Awal"] ?? null;
  const jamPeriksa = primaryHistory?.["Selesai Periksa Terakhir"] ?? primaryPerjalanan?.["Selesai Periksa Terakhir"] ?? null;
  const jamResep = primaryHistory?.["Proses Resep"] ?? primaryPerjalanan?.["Proses Resep"] ?? null;
  const jamObat = primaryHistory?.["Penyerahan Obat"] ?? primaryPerjalanan?.["Penyerahan Obat"] ?? null;

  function copyRmToClipboard() {
    if (noRm !== "—") {
      void navigator.clipboard.writeText(noRm);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Helper formatting jam
  function formatJam(timeStr: string | null) {
    if (!timeStr) return null;
    return `${timeStr.slice(0, 5)} WIB`;
  }

  return (
    <div className="space-y-6">
      <Topbar />

      {/* Header Bar dengan Tombol Kembali */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <ArrowLeft size={16} />
          Kembali ke Dashboard
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Pasien ID:</span>
          <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono font-bold text-cyan-400">
            {pasienId}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-slate-400">
          <div className="mr-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          Memuat profil & history pasien...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-800 bg-rose-950/30 p-8 text-center">
          <AlertCircle size={36} className="mx-auto mb-3 text-rose-400" />
          <p className="font-semibold text-rose-300">{error}</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-xl bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-600"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Profil Pasien & Rincian Unit Pelayanan (Poli) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card Profil Pasien */}
            <section className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 p-6 shadow-xl">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/20 to-blue-600/30 text-cyan-300 shadow-lg shadow-cyan-950/50">
                    <User size={32} />
                  </div>

                  <div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-[10px] font-bold text-emerald-300">
                      Rawat Jalan Aktif
                    </span>
                    <h1 className="mt-1 text-xl font-extrabold text-slate-100">
                      {namaPasien}
                    </h1>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-700/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">No. Rekam Medis:</span>
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-cyan-300">
                      <strong className="font-bold">{noRm}</strong>
                      <button
                        type="button"
                        onClick={copyRmToClipboard}
                        className="ml-1 text-slate-400 hover:text-cyan-300 transition-colors"
                        title="Salin No RM"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Unit Asal:</span>
                    <strong className="text-slate-200">{namaUnitAsal}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Unit Tujuan / Poli:</span>
                    <strong className="text-cyan-300">{namaUnitTujuan}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tanggal Kunjungan:</span>
                    <span className="text-slate-300">Hari ini (Real-time)</span>
                  </div>
                </div>

                {/* Total Waktu Tunggu Badge */}
                <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Waktu Tunggu
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-cyan-300">
                    {totalWaktuTunggu}
                  </p>
                </div>
              </div>
            </section>

            {/* Detail Pelayanan Unit Pasien (Poli) */}
            <section className="rounded-2xl border border-slate-700/40 bg-slate-800 p-5 shadow-md">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-100">
                  Rincian Unit Pelayanan Pasien
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Daftar unit yang dikunjungi hari ini (`b_pelayanan`)
                </p>
              </div>

              {pasienDetails.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-xs text-slate-500">
                  Belum ada rincian unit pelayanan terdaftar untuk pasien ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pasienDetails.map((detail, index) => (
                    <div
                      key={`${detail.id || detail.unit_alias}-${index}`}
                      className="p-3.5 rounded-xl border border-slate-700/70 bg-slate-900/60 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            {detail.unit_alias || detail.nama_unit}
                            {detail.no_antrian && (
                              <span className="ml-2 font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                                No. Antrian: #{detail.no_antrian}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Pelayanan #{index + 1} {detail.id ? `(ID: ${detail.id})` : ""}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            detail.status_dilayani === "SUDAH"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {detail.status_dilayani === "SUDAH" ? "SUDAH DILAYANI" : "BELUM DILAYANI"}
                        </span>
                      </div>

                      {(detail.diagnosa_klinik || detail.keterangan_klinik) && (
                        <div className="text-[11px] bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 text-slate-300">
                          {detail.diagnosa_klinik && <p><span className="font-semibold text-slate-400">Diagnosa:</span> {detail.diagnosa_klinik}</p>}
                          {detail.keterangan_klinik && <p><span className="font-semibold text-slate-400">Ket:</span> {detail.keterangan_klinik}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Kolom Kanan: Timeline Perjalanan Pasien (Vertical Steps Tetap) */}
          <div className="lg:col-span-7">
            <section className="rounded-2xl border border-slate-700/40 bg-slate-800 p-6 shadow-md h-full">
              <div className="mb-6 flex items-center justify-between border-b border-slate-700 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                    PATIENT TIMELINE & MILESTONES
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold text-slate-100">
                    Timeline Perjalanan Pasien
                  </h2>
                </div>
                <Activity className="text-cyan-400 animate-pulse" size={22} />
              </div>

              {/* Vertical Steps (TETAP VERTIKAL) */}
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-700">
                {/* Step 1: Pendaftaran Awal */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border ${
                      jamDaftar
                        ? "border-emerald-500 bg-emerald-950 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        : "border-slate-600 bg-slate-900 text-slate-500"
                    }`}
                  >
                    <Clock size={14} />
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">
                          1. Pendaftaran Antrian Awal
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Pasien mendaftar di unit: <strong className="text-slate-300">{namaUnitAsal}</strong>
                        </p>
                      </div>
                      <div className="shrink-0">
                        {jamDaftar ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
                            <CheckCircle2 size={13} />
                            {formatJam(jamDaftar)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-500">
                            Belum Terdaftar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Pemeriksaan Poli */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border ${
                      jamPeriksa
                        ? "border-emerald-500 bg-emerald-950 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        : jamDaftar
                        ? "border-rose-500 bg-rose-950 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-bounce"
                        : "border-slate-600 bg-slate-900 text-slate-500"
                    }`}
                  >
                    <Stethoscope size={14} />
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">
                          2. Pemeriksaan Medis Poli
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Pemeriksaan di <strong className="text-slate-300">{namaUnitTujuan}</strong>
                        </p>
                      </div>
                      <div className="shrink-0">
                        {jamPeriksa ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
                            <CheckCircle2 size={13} />
                            Selesai: {formatJam(jamPeriksa)}
                          </span>
                        ) : jamDaftar ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-300">
                            Menunggu Pemeriksaan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-500">
                            Belum Diproses
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Proses Resep */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border ${
                      jamResep
                        ? "border-emerald-500 bg-emerald-950 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        : "border-slate-600 bg-slate-900 text-slate-500"
                    }`}
                  >
                    <FileText size={14} />
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">
                          3. Validasi & Proses E-Resep
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Resep obat diproses oleh Instalasi Farmasi
                        </p>
                      </div>
                      <div className="shrink-0">
                        {jamResep ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1 font-mono text-xs font-bold text-amber-300">
                            <CheckCircle2 size={13} />
                            Validasi: {formatJam(jamResep)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-500">
                            {jamPeriksa ? "Proses E-Resep" : "— Non-Resep / Belum"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Penyerahan Obat */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border ${
                      jamObat
                        ? "border-emerald-500 bg-emerald-950 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        : "border-slate-600 bg-slate-900 text-slate-500"
                  }`}
                  >
                    <Pill size={14} />
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">
                          4. Penyerahan Obat Pasien
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Pengambilan obat di loket penyerahan farmasi
                        </p>
                      </div>
                      <div className="shrink-0">
                        {jamObat ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 font-mono text-xs font-bold text-cyan-300">
                            <CheckCircle2 size={13} />
                            Selesai: {formatJam(jamObat)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-500">
                            Belum Diserahkan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
