"use client";

import { useState, useEffect } from "react";

/**
 * Jam real-time WIB 
 */
export default function Clock() {
  const [time, setTime] = useState<string>("00:00:00 WIB");
  const [date, setDate] = useState<string>("--");

  useEffect(() => {
    function updateClock() {
      const now = new Date();

      const utcHours = now.getUTCHours();
      const utcMinutes = now.getUTCMinutes();
      const utcSeconds = now.getUTCSeconds();
      const wibHours = (utcHours + 7) % 24;

      const h = String(wibHours).padStart(2, "0");
      const m = String(utcMinutes).padStart(2, "0");
      const s = String(utcSeconds).padStart(2, "0");
      setTime(`${h}:${m}:${s} WIB`);

      // Format tanggal Indonesia
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setDate(now.toLocaleDateString("id-ID", options));
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center md:text-right">
      <div className="text-lg md:text-xl font-mono font-bold text-amber-400 tracking-wider">
        {time}
      </div>
      <div className="text-slate-300 text-xs mt-1">{date}</div>
    </div>
  );
}
