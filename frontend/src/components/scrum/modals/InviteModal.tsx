import { useState } from "react";
import type { Member, User } from "../../../types";
import { getAccessibleColor } from "../../../constants/ui";
import { useIsDark } from "../../../context/ThemeContext";
import { Modal } from "../../shared/Modal";

export function InviteModal({
  users,
  members,
  onInvite,
  onClose,
}: {
  users: User[];
  members: Member[];
  onInvite: (u: User) => Promise<boolean> | boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const isDark = useIsDark();

  // Bloquea nuevas invitaciones mientras una petición está en vuelo.
  async function handleInvite(u: User) {
    if (invitingId !== null) return;
    setInvitingId(u.id);
    try {
      await onInvite(u);
    } finally {
      setInvitingId(null);
    }
  }

  const availableUsers = users.filter(u =>
    !members.some(m => m.id === u.id) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Modal
      isOpen={true}
      onClose={() => {
        if (invitingId === null) onClose();
      }}
      titleId="invite-modal-title"
      maxWidthClass="max-w-[400px]"
      closeOnBackdropClick={invitingId === null}
      closeOnEscape={invitingId === null}
      className="p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 id="invite-modal-title" className="text-lg font-bold text-text">Invitar al equipo</h2>
        <button
          type="button"
          disabled={invitingId !== null}
          onClick={() => {
            if (invitingId === null) onClose();
          }}
          aria-label="Cerrar modal"
          title="Cerrar modal"
          className="text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          ✕
        </button>
      </div>

      <input
        autoFocus
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Buscar por nombre o usuario"
        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent-blue transition-colors mb-4"
        placeholder="Buscar por nombre o usuario..."
      />

      <div className="space-y-2 max-h-[300px] overflow-auto">
        {availableUsers.map(u => (
          <div key={u.id} className="flex items-center justify-between p-2 rounded-md hover:bg-panel-hover transition-colors group">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: getAccessibleColor(u.avatarColor, isDark) }}
              >
                {u.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-text">{u.name} {u.lastName}</p>
                <p className="text-xs font-mono text-text-muted">@{u.username}</p>
              </div>
            </div>
            <button
              type="button"
              disabled={invitingId !== null}
              onClick={() => void handleInvite(u)}
              className={`px-3 py-1 bg-accent-blue/10 text-accent-blue rounded text-xs font-medium transition-opacity hover:bg-accent-blue/20 disabled:cursor-not-allowed cursor-pointer ${
                invitingId === u.id
                  ? "opacity-100"
                  : invitingId !== null
                    ? "opacity-40"
                    : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
              }`}
            >
              {invitingId === u.id ? "Invitando..." : "Añadir"}
            </button>
          </div>
        ))}
        {availableUsers.length === 0 && <p className="text-center text-text-muted text-sm py-4">No se encontraron usuarios</p>}
      </div>
    </Modal>
  );
}
