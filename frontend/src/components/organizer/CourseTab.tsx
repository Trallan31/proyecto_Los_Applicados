


import type { ComponentType, CSSProperties } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface CourseTabProps {
  active: boolean;
  color: string;
  code?: string;
  label: string;
  count: number;
  onClick: () => void;
  collapsible?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  icon?: ComponentType<{ className?: string; style?: CSSProperties }>;
  indent?: boolean;
}

export function CourseTab({
  active,
  color,
  code,
  label,
  count,
  onClick,
  collapsible = false,
  isExpanded = true,
  onToggleExpand,
  icon: Icon,
  indent = false,
}: CourseTabProps) {
  return (
    <div
      className={`group w-full flex items-center justify-between rounded-lg transition-all ${
        indent ? "pl-5 pr-2 py-1.5" : "px-3 py-1.5"
      } ${
        active
          ? "bg-panel text-text shadow-sm"
          : "text-text-muted hover:text-text hover:bg-panel/50"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-none"
      >
        {Icon ? (
          <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
        ) : (
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <div className="truncate">
          <p className="text-[12px] font-semibold truncate leading-tight">{label}</p>
          {code && <p className="text-[10px] font-mono text-text-muted leading-tight">{code}</p>}
        </div>
      </button>

      <div className="flex items-center gap-1 flex-shrink-0 ml-1">
        {count > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-background text-text-muted border border-border">
            {count}
          </span>
        )}
        {collapsible && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            className="p-1 rounded hover:bg-background text-text-muted hover:text-text transition-colors cursor-pointer"
            title={isExpanded ? "Colapsar" : "Expandir"}
            aria-label={isExpanded ? "Colapsar" : "Expandir"}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

