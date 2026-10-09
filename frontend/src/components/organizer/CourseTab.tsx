


export function CourseTab({
  active,
  color,
  code,
  label,
  count,
  onClick,
}: {
  active: boolean;
  color: string;
  code?: string;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
        active ? "bg-panel text-text shadow-md" : "text-text-muted hover:text-text hover:bg-panel/50"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="truncate">
          <p className="text-[12px] font-semibold truncate leading-tight">{label}</p>
          {code && <p className="text-[9px] font-mono text-text-dim">{code}</p>}
        </div>
      </div>
      {count > 0 && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-background text-text-muted border border-border ml-1">
          {count}
        </span>
      )}
    </button>
  );
}
