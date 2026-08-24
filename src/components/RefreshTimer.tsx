"use client";

import { useState, useEffect } from "react";

/**
 * Auto-refresh countdown timer
 * Menggantikan meta http-equiv="refresh" + JavaScript countdown di原版
 */
interface RefreshTimerProps {
  intervalMs?: number;
  onRefresh: () => void;
}

export default function RefreshTimer({
  intervalMs = 60_000,
  onRefresh,
}: RefreshTimerProps) {
  const [timeLeft, setTimeLeft] = useState(intervalMs / 1000);

  useEffect(() => {
    // Reset countdown when onRefresh changes
    setTimeLeft(intervalMs / 1000);

    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Trigger refresh
          onRefresh();
          return intervalMs / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [intervalMs, onRefresh]);

  return (
    <div className="text-right whitespace-nowrap text-slate-500 font-semibold">
      Auto Refresh:{" "}
      <span className="text-amber-400 font-mono text-sm">{timeLeft}s</span>
    </div>
  );
}
