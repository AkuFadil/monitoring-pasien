"use client";

interface PaginationProps {
  page: number;
  pageSize?: number;
  total: number;
  onPageChange: (page: number) => void;
}

const MAX_PAGE_BUTTONS = 4;

export default function Pagination({
  page,
  pageSize = 10,
  total,
  onPageChange,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  const firstPage = Math.min(
    Math.max(1, currentPage - Math.floor(MAX_PAGE_BUTTONS / 2)),
    Math.max(1, pageCount - MAX_PAGE_BUTTONS + 1),
  );
  const visiblePages = Array.from(
    { length: Math.min(MAX_PAGE_BUTTONS, pageCount) },
    (_, index) => firstPage + index,
  );

  if (total <= pageSize) return null;

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Menampilkan{" "}
        <strong className="text-slate-200">
          {start}-{end}
        </strong>{" "}
        dari <strong className="text-slate-200">{total}</strong> data
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-slate-700 px-3 py-1.5 font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-700 disabled:hover:text-slate-300"
        >
          Prev
        </button>
        {visiblePages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="min-w-8 rounded-lg border border-slate-700 px-2.5 py-1.5 font-bold text-slate-400 transition hover:border-cyan-500 hover:text-cyan-300"
            >
              1
            </button>
            <span className="px-1 text-slate-500">...</span>
          </>
        )}
        {visiblePages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={`min-w-8 rounded-lg border px-2.5 py-1.5 font-bold transition ${
              item === currentPage
                ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300"
                : "border-slate-700 text-slate-400 hover:border-cyan-500 hover:text-cyan-300"
            }`}
          >
            {item}
          </button>
        ))}
        {visiblePages[visiblePages.length - 1] < pageCount && (
          <>
            <span className="px-1 text-slate-500">...</span>
            <button
              type="button"
              onClick={() => onPageChange(pageCount)}
              className="min-w-8 rounded-lg border border-slate-700 px-2.5 py-1.5 font-bold text-slate-400 transition hover:border-cyan-500 hover:text-cyan-300"
            >
              {pageCount}
            </button>
          </>
        )}
        {/* <input
          type="number"
          min={1}
          max={pageCount}
          value={currentPage}
          onChange={(event) => {
            const targetPage = Number(event.target.value);
            if (
              Number.isInteger(targetPage) &&
              targetPage >= 1 &&
              targetPage <= pageCount
            ) {
              onPageChange(targetPage);
            }
          }}
          className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-center font-bold text-slate-200 outline-none transition focus:border-cyan-500"
          aria-label="Loncat ke halaman"
        /> */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pageCount}
          className="rounded-lg border border-slate-700 px-3 py-1.5 font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-700 disabled:hover:text-slate-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
