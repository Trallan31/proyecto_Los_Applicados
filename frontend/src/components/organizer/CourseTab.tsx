


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
        active ? "bg-[#1c2030] text-white shadow-md" : "text-[#7c82a0] hover:text-[#e8eaf2] hover:bg-[#1c2030]/50"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="truncate">
          <p className="text-[12px] font-semibold truncate leading-tight">{label}</p>
          {code && <p className="text-[9px] font-mono text-[#4a5070]">{code}</p>}
        </div>
      </div>
      {count > 0 && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#0d0f14] text-[#7c82a0] border border-[#2a2f45] ml-1">
          {count}
        </span>
      )}
    </button>
  );
}
