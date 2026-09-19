import { useState, useRef, useEffect } from "react";
import type { Member } from "../../types/users";

export function InlineText({ value, onCommit, onBlur }: { value: string; onCommit: (v: string) => void; onBlur: () => void }) {
  const [val, setVal] = useState(value);
  const cancelledRef = useRef(false);
  return (
    <input
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { onCommit(val); }
        if (e.key === "Escape") { cancelledRef.current = true; onBlur(); }
      }}
      onBlur={() => { if (!cancelledRef.current) onCommit(val); }}
      className="w-full bg-[#0d0f14] border border-[#4f7cff] rounded px-2 py-0.5 text-[12px] text-[#e8eaf2] focus:outline-none"
      aria-label="Editar texto"
    />
  );
}

export function InlineSelect({
  value,
  options,
  labels,
  onCommit,
  onBlur,
}: {
  value: string | number;
  options: (string | number)[];
  labels?: Record<string | number, string>;
  onCommit: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <select
      autoFocus
      defaultValue={value}
      onChange={(e) => onCommit(e.target.value)}
      onBlur={onBlur}
      className="w-full bg-[#0d0f14] border border-[#4f7cff] rounded px-1 py-0.5 text-[11px] font-mono text-[#e8eaf2] focus:outline-none"
    >
      {options.map((o) => (
        <option key={o} value={o}>{labels ? labels[o] ?? o : o}</option>
      ))}
    </select>
  );
}

export function InlineSelectWithCreate({
  value,
  options,
  labels,
  onCreateNew,
  createLabel = "+ Crear nuevo...",
  onCommit,
  onBlur,
}: {
  value: string | number;
  options: (string | number)[];
  labels?: Record<string | number, string>;
  onCreateNew: (name: string) => void;
  createLabel?: string;
  onCommit: (v: string) => void;
  onBlur: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newItemName, setNewItemName] = useState("");


  useEffect(() => {
    // Replaced with React overlay
  }, [onBlur]);

  function handleCreateSubmit() {
    if (newItemName.trim()) {
      const trimmed = newItemName.trim();
      onCreateNew(trimmed);
      setIsCreating(false);
      setNewItemName("");
      onBlur();
    } else {
      setIsCreating(false);
      onBlur();
    }
  }

  if (isCreating || options.length === 0) {
    return (
      <>
        <div className="fixed inset-0 z-10" onClick={() => { setIsCreating(false); onBlur(); }} />
        <div
          className="relative z-20 flex items-center gap-1 w-full bg-[#0d0f14] border border-[#4f7cff] rounded p-1"
        >
        <input
          autoFocus
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateSubmit();
            if (e.key === "Escape") {
              setIsCreating(false);
              onBlur();
            }
          }}
          placeholder="Nombre..."
          className="w-full bg-transparent text-[11px] font-mono text-[#e8eaf2] focus:outline-none"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCreateSubmit}
          className="text-[10px] text-[#4f7cff] hover:text-[#2dd67b] font-bold px-1"
          title="Guardar"
        >
          ✓
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setIsCreating(false);
            onBlur();
          }}
          className="text-[10px] text-[#7c82a0] hover:text-[#ff5c6a] font-bold px-1"
          title="Cancelar"
        >
          ✕
        </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onBlur} />
      <div className="relative z-20 w-full">
      <select
        autoFocus
        value={options.includes(value) ? value : (options[0] ?? "__NEW__")}
        onChange={(e) => {
          if (e.target.value === "__NEW__") {
            setIsCreating(true);
          } else {
            onCommit(e.target.value);
          }
        }}
        className="w-full bg-[#0d0f14] border border-[#4f7cff] rounded px-1 py-0.5 text-[11px] font-mono text-[#e8eaf2] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {labels ? labels[o] ?? o : o}
          </option>
        ))}
        <option value="__NEW__" className="text-[#4f7cff] font-bold">
          {createLabel}
        </option>
        </select>
      </div>
    </>
  );
}

export function MultiMemberSelect({
  value,
  members,
  onCommit,
  onBlur,
}: {
  value: string[];
  members: Member[];
  onCommit: (v: string[]) => void;
  onBlur: () => void;
}) {
  const [sel, setSel] = useState<string[]>(value);


  useEffect(() => {
    // Replaced with React overlay
  }, [sel, onCommit, onBlur]);

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={() => { onCommit(sel); onBlur(); }} />
      <div className="absolute z-20 bg-[#1c2030] border border-[#4f7cff] rounded-md p-2 shadow-xl" style={{ minWidth: 160 }}>
      {members.map((m) => (
        <button
          key={m.id}
          onClick={() => setSel((prev) => prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id])}
          className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-[#2a2f45] transition-colors"
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: m.avatarColor }}
          >
            {m.initials}
          </div>
          <span className="text-[12px] text-[#e8eaf2] flex-1 text-left">{m.name} {m.lastName}</span>
          <div className={`w-3 h-3 rounded-sm border ${sel.includes(m.id) ? "bg-[#4f7cff] border-[#4f7cff]" : "border-[#4a5070]"}`}>
            {sel.includes(m.id) && <span className="text-[9px] text-white flex justify-center">✓</span>}
          </div>
        </button>
      ))}
      </div>
    </>
  );
}