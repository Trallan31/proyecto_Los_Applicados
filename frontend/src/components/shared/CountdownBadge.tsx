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
      bg: "bg-accent-green/10",
      text: "text-accent-green",
      border: "border-accent-green/30",
      icon: <CheckCircle2 className="w-3 h-3 flex-shrink-0" />,
    },
    overdue: {
      bg: "bg-accent-red/15",
      text: "text-accent-red",
      border: "border-accent-red/30",
      icon: <AlertTriangle className="w-3 h-3 flex-shrink-0" />,
    },
    today: {
      bg: "bg-accent-orange/15",
      text: "text-accent-orange",
      border: "border-accent-orange/35",
      icon: <Flame className="w-3 h-3 flex-shrink-0 animate-pulse" />,
    },
    near: {
      bg: "bg-accent-yellow/15",
      text: "text-accent-yellow",
      border: "border-accent-yellow/30",
      icon: <Clock className="w-3 h-3 flex-shrink-0" />,
    },
    normal: {
      bg: "bg-accent-blue/10",
      text: "text-accent-blue",
      border: "border-accent-blue/25",
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
