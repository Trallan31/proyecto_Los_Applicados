import { useState, useRef, useEffect } from "react";
import type { Member } from "../../types";

export function InlineText({
  value,
  onCommit,
  onBlur,
}: {
  value: string;
  onCommit: (v: string) => void;
  onBlur: () => void;
}) {
  const [val, setVal] = useState(value);
  const cancelledRef = useRef(false);

  const handleCommit = () => {
    if (!cancelledRef.current) {
      onCommit(val);
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    onBlur();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={handleCommit}
      />
      <div className="relative z-20 flex items-center gap-1 w-full bg-background border border-accent-blue rounded px-1.5 py-0.5 shadow-xs">
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCommit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              handleCancel();
            }
          }}
          className="w-full bg-transparent text-[12px] text-text focus:outline-none min-w-0"
          aria-label="Editar texto"
        />
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCommit}
            className="text-[11px] text-accent-blue hover:text-accent-green font-bold px-1 py-0.5 transition-colors leading-none"
            title="Guardar (Enter)"
            aria-label="Guardar"
          >
            ✓
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCancel}
            className="text-[11px] text-text-muted hover:text-accent-red font-bold px-1 py-0.5 transition-colors leading-none"
            title="Cancelar (Esc)"
            aria-label="Cancelar"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}

export function InlineDate({
  value = "",
  onCommit,
  onBlur,
}: {
  value?: string;
  onCommit: (v: string) => void;
  onBlur: () => void;
}) {
  const [val, setVal] = useState(value || "");
  const cancelledRef = useRef(false);

  const handleCommit = () => {
    if (!cancelledRef.current) {
      onCommit(val);
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    onBlur();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={handleCommit}
      />
      <div className="relative z-20 flex items-center justify-end gap-1 w-full bg-background border border-accent-blue rounded px-1.5 py-0.5 shadow-xs">
        <input
          autoFocus
          type="date"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCommit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              handleCancel();
            }
          }}
          className="bg-transparent text-[11px] font-mono text-text focus:outline-none cursor-pointer flex-1 min-w-0"
          aria-label="Editar fecha"
        />
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCommit}
            className="text-[11px] text-accent-blue hover:text-accent-green font-bold px-1 py-0.5 transition-colors leading-none"
            title="Guardar fecha (Enter)"
            aria-label="Guardar fecha"
          >
            ✓
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCancel}
            className="text-[11px] text-text-muted hover:text-accent-red font-bold px-1 py-0.5 transition-colors leading-none"
            title="Cancelar (Esc)"
            aria-label="Cancelar edición de fecha"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}

export function InlineSelect({
  value,
  options,
  labels,
  onCommit,
  onBlur,
}: {
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onCommit: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <select
      autoFocus
      defaultValue={value}
      onChange={(e) => onCommit(e.target.value)}
      onBlur={onBlur}
      className="w-full bg-background border border-accent-blue rounded px-1 py-0.5 text-[11px] font-mono text-text focus:outline-none"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-surface text-text">{labels ? labels[o] ?? o : o}</option>
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
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onCreateNew: (name: string) => void;
  createLabel?: string;
  onCommit: (v: string) => void;
  onBlur: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newItemName, setNewItemName] = useState("");

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
          className="relative z-20 flex items-center gap-1 w-full bg-background border border-accent-blue rounded p-1"
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
          className="w-full bg-transparent text-[11px] font-mono text-text placeholder-text-muted focus:outline-none"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCreateSubmit}
          className="text-[10px] text-accent-blue hover:text-accent-green font-bold px-1"
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
          className="text-[10px] text-text-muted hover:text-accent-red font-bold px-1"
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
        className="w-full bg-background border border-accent-blue rounded px-1 py-0.5 text-[11px] font-mono text-text focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-surface text-text">
            {labels ? labels[o] ?? o : o}
          </option>
        ))}
        <option value="__NEW__" className="bg-surface text-accent-blue font-bold">
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
  const [sel, setSel] = useState<string[]>(value || []);

  const toggleMember = (id: string) => {
    setSel((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onBlur();
      } else if (e.key === "Enter") {
        const target = e.target as HTMLElement | null;
        if (target?.getAttribute("data-cancel") === "true") {
          e.preventDefault();
          onBlur();
          return;
        }
        e.preventDefault();
        onCommit(sel);
        onBlur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sel, onCommit, onBlur]);

  return (
    <>
      {/* Backdrop transparente para cerrar haciendo clic afuera */}
      <div className="fixed inset-0 z-40" onClick={onBlur} />

      {/* Popover estructurado y profesional */}
      <div
        className="absolute top-full left-0 mt-1 z-50 bg-surface border border-border-bright rounded-lg shadow-2xl overflow-hidden flex flex-col text-text"
        style={{ minWidth: 260, maxWidth: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-panel/60">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-text">Asignar responsables</span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-accent-blue/15 text-accent-blue">
              {sel.length}
            </span>
          </div>
          <button
            type="button"
            data-cancel="true"
            onClick={onBlur}
            className="text-text-muted hover:text-accent-red transition-colors p-1 rounded hover:bg-panel text-xs leading-none"
            title="Cerrar sin guardar (Esc)"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo: Lista de miembros */}
        <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
          {members.length === 0 ? (
            <div className="py-4 text-center text-xs text-text-dim">
              No hay miembros disponibles
            </div>
          ) : (
            members.map((m) => {
              const isSelected = sel.includes(m.id);
              return (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleMember(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Spacebar") {
                      e.preventDefault();
                      toggleMember(m.id);
                    }
                  }}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md cursor-pointer transition-colors select-none ${
                    isSelected
                      ? "bg-accent-blue/10 hover:bg-accent-blue/15"
                      : "hover:bg-panel-hover"
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[12px] font-medium text-text truncate">
                      {m.name} {m.lastName}
                    </div>
                    {m.role && (
                      <div className="text-[10px] text-text-dim truncate">
                        {m.role}
                      </div>
                    )}
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected
                        ? "bg-accent-blue border-accent-blue text-white"
                        : "border-border-bright bg-background"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 stroke-current stroke-[2.5] fill-none" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-border bg-panel/60">
          <button
            type="button"
            data-cancel="true"
            onClick={onBlur}
            className="px-2.5 py-1 text-[11px] font-medium text-text-muted hover:text-text rounded hover:bg-panel transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onCommit(sel);
              onBlur();
            }}
            className="px-3 py-1 text-[11px] font-medium bg-accent-blue hover:bg-accent-blue/90 text-white rounded shadow-xs transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </>
  );
}