import { GraduationCap, Folder, Video, Globe, ExternalLink, Pencil, Trash2, Plus } from "lucide-react";
import type { CourseLink, CourseLinkCategory } from "../../types";

interface CourseLinksBarProps {
  links: CourseLink[];
  courseColor: string;
  onAddLink: () => void;
  onEditLink: (link: CourseLink) => void;
  onDeleteLink: (linkId: string) => void;
}

function getCategoryIcon(category?: CourseLinkCategory) {
  switch (category) {
    case "lms":
      return <GraduationCap className="w-3.5 h-3.5 text-accent-blue shrink-0" />;
    case "drive":
      return <Folder className="w-3.5 h-3.5 text-accent-yellow shrink-0" />;
    case "video":
      return <Video className="w-3.5 h-3.5 text-accent-red shrink-0" />;
    case "web":
      return <Globe className="w-3.5 h-3.5 text-accent-green shrink-0" />;
    case "otro":
    default:
      return <ExternalLink className="w-3.5 h-3.5 text-text-muted shrink-0" />;
  }
}

export function CourseLinksBar({
  links,
  courseColor,
  onAddLink,
  onEditLink,
  onDeleteLink,
}: CourseLinksBarProps) {
  if (!links || links.length === 0) {
    return (
      <div className="flex items-center">
        <button
          type="button"
          onClick={onAddLink}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-blue hover:bg-accent-blue/5 border border-dashed border-border hover:border-accent-blue/50 rounded-md px-3 py-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-accent-blue" />
          <span>Agregar enlaces útiles del ramo (U-Cursos, Drive, Zoom...)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted mr-1 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: courseColor }} />
        Enlaces:
      </span>
      {links.map((link) => (
        <div
          key={link.id}
          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border border-border bg-panel hover:bg-panel-hover hover:border-border-bright transition-all group max-w-xs"
        >
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-text hover:text-accent-blue transition-colors truncate"
            title={`${link.title} — ${link.url}`}
          >
            {getCategoryIcon(link.category)}
            <span className="truncate max-w-[150px] font-medium">{link.title}</span>
          </a>
          <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity ml-1 pl-1 border-l border-border">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditLink(link);
              }}
              className="p-0.5 text-text-muted hover:text-accent-blue transition-colors rounded cursor-pointer"
              title="Editar enlace"
              aria-label={`Editar ${link.title}`}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLink(link.id);
              }}
              className="p-0.5 text-text-muted hover:text-accent-red transition-colors rounded cursor-pointer"
              title="Eliminar enlace"
              aria-label={`Eliminar ${link.title}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={onAddLink}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-accent-blue hover:bg-accent-blue/10 border border-dashed border-accent-blue/40 hover:border-accent-blue transition-colors cursor-pointer"
        title="Añadir nuevo enlace"
      >
        <Plus className="w-3 h-3" />
        <span>Enlace</span>
      </button>
    </div>
  );
}
