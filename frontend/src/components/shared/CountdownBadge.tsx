import React from "react";
import { Clock, AlertTriangle, Flame, CheckCircle2 } from "lucide-react";
import { getCountdown, type CountdownData } from "../../utils/dateUtils";

interface CountdownBadgeProps {
  dateStr?: string;
  isDone?: boolean;
  compact?: boolean;
  className?: string;
}

export function CountdownBadge({
  dateStr,
  isDone = false,
  compact = false,
  className = "",
}: CountdownBadgeProps) {
  const countdown = getCountdown(dateStr, isDone);
  if (!countdown) return null;

  const { label, shortLabel, urgency } = countdown;
  const text = compact ? shortLabel : label;

  const styleMap: Record<
    CountdownData["urgency"],
    {
      bg: string;
      text: string;
      border: string;
      icon: React.ReactNode;
    }
  > = {
    done: {
      bg: "bg-[#2dd67b]/10",
      text: "text-[#2dd67b]",
      border: "border-[#2dd67b]/30",
      icon: <CheckCircle2 className="w-3 h-3 flex-shrink-0" />,
    },
    overdue: {
      bg: "bg-[#ff5c6a]/15",
      text: "text-[#ff5c6a]",
      border: "border-[#ff5c6a]/30",
      icon: <AlertTriangle className="w-3 h-3 flex-shrink-0" />,
    },
    today: {
      bg: "bg-[#ff8c42]/15",
      text: "text-[#ff8c42]",
      border: "border-[#ff8c42]/35",
      icon: <Flame className="w-3 h-3 flex-shrink-0 animate-pulse" />,
    },
    near: {
      bg: "bg-[#f5c842]/15",
      text: "text-[#f5c842]",
      border: "border-[#f5c842]/30",
      icon: <Clock className="w-3 h-3 flex-shrink-0" />,
    },
    normal: {
      bg: "bg-[#4f7cff]/10",
      text: "text-[#4f7cff]",
      border: "border-[#4f7cff]/25",
      icon: <Clock className="w-3 h-3 flex-shrink-0" />,
    },
  };

  const currentStyle = styleMap[urgency];

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border transition-colors ${currentStyle.bg} ${currentStyle.text} ${currentStyle.border} ${className}`}
      title={label}
    >
      {currentStyle.icon}
      <span>{text}</span>
    </span>
  );
}
