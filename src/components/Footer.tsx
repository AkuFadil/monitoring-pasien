import RefreshTimer from "./RefreshTimer";

export default function Footer({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <footer className="mt-4 space-y-2">
      {/* Marquee + Auto Refresh */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700/40 px-4 py-2 flex items-center justify-between overflow-hidden shadow-md">
        <div className="overflow-hidden flex-1 min-w-0">
          <p className="whitespace-nowrap animate-marquee text-sm font-semibold text-green-400 flex items-center gap-2">
            <img src="/img/soebandi.png" alt="Logo RS dr. Soebandi" className="h-5 w-auto object-contain inline-block" />
            Budayakan 5S &mdash; Salam, Senyum, Sapa, Sopan, Santun &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            RS dr. Soebandi Jember &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            <img src="/img/soebandi.png" alt="Logo RS dr. Soebandi" className="h-5 w-auto object-contain inline-block" />
            Akreditasi &mdash; Paripurna &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            RS dr. Soebandi Jember
          </p>
        </div>
        {onRefresh && <div className="shrink-0 ml-3"><RefreshTimer intervalMs={60_000} onRefresh={onRefresh} /></div>}
      </div>
      {/* Copyright */}
        <div className="flex items-center justify-center">
          <p className="text-[14px] text-slate-500 px-2">
            &copy; {new Date().getFullYear()} Copyright &mdash; PDE Dr. Soebandi Jember All Right Reserved
          </p>
        </div>
    </footer>
  );
}
