


export function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-mono text-[#4a5070] uppercase">{label}:</span>
      <span className="text-[11px] font-mono font-bold text-[#e8eaf2]">{value}</span>
    </div>
  );
}
