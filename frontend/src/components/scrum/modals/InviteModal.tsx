import { useState } from "react";
import type { Member, User } from "../../../types";

export function InviteModal({
  users,
  members,
  onInvite,
  onClose,
}: {
  users: User[];
  members: Member[];
  onInvite: (u: User) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  
  const availableUsers = users.filter(u =>
    !members.some(m => m.id === u.id) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-[#0d0f14]/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#151820] border border-[#2a2f45] rounded-xl p-6 w-[400px] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Invitar al equipo</h2>
          <button onClick={onClose} className="text-[#4a5070] hover:text-[#e8eaf2]">✕</button>
        </div>
        
        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#0d0f14] border border-[#2a2f45] rounded-md px-3 py-2 text-sm text-[#e8eaf2] focus:outline-none focus:border-[#4f7cff] transition-colors mb-4" placeholder="Buscar por nombre o usuario..." />

        <div className="space-y-2 max-h-[300px] overflow-auto">
          {availableUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between p-2 rounded-md hover:bg-[#2a2f45] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: u.avatarColor }}>
                  {u.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e8eaf2]">{u.name} {u.lastName}</p>
                  <p className="text-xs font-mono text-[#7c82a0]">@{u.username}</p>
                </div>
              </div>
              <button onClick={() => onInvite(u)} className="px-3 py-1 bg-[#4f7cff]/10 text-[#4f7cff] rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#4f7cff]/20">
                Añadir
              </button>
            </div>
          ))}
          {availableUsers.length === 0 && <p className="text-center text-[#7c82a0] text-sm py-4">No se encontraron usuarios</p>}
        </div>
      </div>
    </div>
  );
}
