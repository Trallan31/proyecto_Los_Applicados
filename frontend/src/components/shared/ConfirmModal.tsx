interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ 
  title, 
  message, 
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar", 
  variant = "danger", 
  onConfirm, 
  onCancel 
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-[#0d0f14]/80 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-[#151820] border border-[#2a2f45] rounded-xl p-6 w-[380px] shadow-2xl">
        <h3 className="text-base font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-[#7c82a0] mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-md text-sm text-[#7c82a0] hover:bg-[#2a2f45]">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-md text-sm font-bold text-white transition-colors ${
              variant === "danger" ? "bg-[#ff5c6a] hover:bg-[#e04b58]" : "bg-[#f5c842] hover:bg-[#d4ac38] text-black"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
