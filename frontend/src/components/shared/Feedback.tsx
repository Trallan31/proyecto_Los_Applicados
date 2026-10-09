/** Estados de carga y de error de la API, compartidos por las dos vistas. */

export function Loading({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <span className="text-[12px] font-mono text-text-muted">{label}</span>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-2">
        <p className="text-[13px] font-semibold text-[#ff5c6a]">No se pudieron cargar los datos</p>
        <p className="text-[12px] text-text-muted">{message}</p>
        <p className="text-[11px] font-mono text-text-dim">npm run dev --prefix backend</p>
      </div>
    </div>
  );
}
