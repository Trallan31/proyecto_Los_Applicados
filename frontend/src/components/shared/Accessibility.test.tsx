import "@testing-library/jest-dom/vitest";
import { StrictMode, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";
import { ManageCoursesModal } from "../organizer/modals/ManageCoursesModal";
import { OrganizerTaskRow } from "../organizer/OrganizerTaskRow";
import { MultiMemberSelect } from "../scrum/InlineEditors";
import { TaskRow } from "../scrum/TaskRow";
import {
  CATEGORY_COLORS,
  PALETTE,
  PRIORITIES,
  STATUSES,
  getAccessibleColor,
  getCategoryColor,
  getPriorityMeta,
  getStatusMeta,
} from "../../constants/ui";
import type { Activity, Course, Member, OrganizerTask, Project } from "../../types";

function srgbToLinear(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const value = parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe("Modal compartido — ARIA, teclado y gestión de foco", () => {
  it("mueve el foco al diálogo al abrir, cierra con Escape y restaura foco al elemento previo", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <StrictMode>
          <button type="button" onClick={() => setOpen(true)}>
            Abrir modal
          </button>
          <Modal isOpen={open} onClose={() => setOpen(false)} titleId="modal-demo-title">
            <h2 id="modal-demo-title">Título del diálogo</h2>
            <button type="button" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </Modal>
        </StrictMode>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Abrir modal" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Título del diálogo" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it("conserva foco en hijo con autoFocus dentro de StrictMode", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <StrictMode>
          <button type="button" onClick={() => setOpen(true)}>
            Abrir con input
          </button>
          <Modal isOpen={open} onClose={() => setOpen(false)} ariaLabel="Diálogo con campo">
            <input autoFocus aria-label="Campo principal" />
          </Modal>
        </StrictMode>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Abrir con input" }));

    expect(screen.getByRole("dialog", { name: "Diálogo con campo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Campo principal")).toHaveFocus();
  });

  it("respeta closeOnBackdropClick=false y closeOnEscape=false, y en modales anidados Escape cierra solo el superior", async () => {
    const user = userEvent.setup();
    const onCloseLocked = vi.fn();

    render(
      <Modal
        isOpen={true}
        onClose={onCloseLocked}
        ariaLabel="Bloqueado"
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        <p>Contenido</p>
      </Modal>
    );

    await user.keyboard("{Escape}");
    expect(onCloseLocked).not.toHaveBeenCalled();

    const backdrop = screen.getByRole("dialog", { name: "Bloqueado" }).parentElement!;
    await user.click(backdrop);
    expect(onCloseLocked).not.toHaveBeenCalled();

    const onCloseParent = vi.fn();
    render(
      <ManageCoursesModal
        courses={[
          { id: "c1", userId: "u1", name: "Cálculo", code: "MAT1610", shortName: "MAT1", color: "#4f7cff" },
        ]}
        sessions={[]}
        onAddCourse={vi.fn()}
        onDeleteCourse={vi.fn()}
        onAddSession={vi.fn()}
        onDeleteSession={vi.fn()}
        onClose={onCloseParent}
      />
    );

    await user.click(screen.getByRole("button", { name: "Eliminar ramo Cálculo" }));
    expect(screen.getByRole("dialog", { name: "Eliminar ramo" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Eliminar ramo" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Gestionar Ramos y Horarios de Clases" })).toBeInTheDocument();
    expect(onCloseParent).not.toHaveBeenCalled();
  });
});

describe("Sin botones anidados e interacción por teclado", () => {
  it("OrganizerTaskRow separa selección, toggle y acciones como botones hermanos sin anidamiento", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const task: OrganizerTask = {
      id: "t1",
      userId: "u1",
      title: "Preparar certamen",
      type: "Evaluación",
      status: "Pendiente",
      endDate: "2026-12-01",
      dueTime: null,
      courseId: "c1",
      notes: "Capítulos 1-3",
      priority: "Alta",
      scope: "Ramo",
    };
    const course: Course = {
      id: "c1",
      userId: "u1",
      name: "Ingeniería de Software",
      code: "IIC2143",
      shortName: "IIC2",
      color: "#4f7cff",
    };

    const { container } = render(
      <MemoryRouter>
        <OrganizerTaskRow
          task={task}
          course={course}
          isSelected={true}
          onSelect={onSelect}
          onToggleStatus={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </MemoryRouter>
    );

    const buttons = Array.from(container.querySelectorAll("button"));
    buttons.forEach((btn) => {
      expect(btn.querySelector("button")).toBeNull();
    });
    expect(container.querySelector('[role="button"]')).toBeNull();

    const selectButton = screen.getByRole("button", { name: /Preparar certamen/i });
    expect(selectButton).toHaveAttribute("aria-pressed", "true");
    await user.click(selectButton);
    expect(onSelect).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Marcar como completada" }));
    expect(onToggle).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Editar actividad" }));
    expect(onEdit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Eliminar actividad" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("OrganizerTaskRow de proyecto no agrega focus-visible:ring al span no interactivo de TrashOff", () => {
    const scrumTask: OrganizerTask = {
      id: "scrum:a1",
      userId: "u1",
      title: "Revisar PR",
      type: "Proyecto",
      status: "En curso",
      endDate: "2026-12-01",
      dueTime: null,
      courseId: null,
      projectId: "p1",
      notes: null,
      scrumActivityId: "a1",
      priority: "Media",
      scope: "Proyecto Universitario",
    };
    const project: Project = {
      id: "p1",
      name: "Applicate",
      description: "",
      color: "#9b6dff",
      course: "IIC2143",
      categories: [],
      members: [],
    };

    const { container } = render(
      <MemoryRouter>
        <OrganizerTaskRow
          task={scrumTask}
          project={project}
          onSelect={vi.fn()}
          onToggleStatus={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    );

    const lockedSpan = container.querySelector('span[title="Eliminable desde el proyecto"]');
    expect(lockedSpan).not.toBeNull();
    expect(lockedSpan?.className).not.toContain("focus-visible:ring");
  });

  it("ManageCoursesModal usa botones hermanos en ramos y aria-label en swatches y horarios", () => {
    const { container } = render(
      <ManageCoursesModal
        courses={[
          { id: "c1", userId: "u1", name: "Bases de Datos", code: "IIC2413", shortName: "BDD", color: "#2dd67b" },
        ]}
        sessions={[
          { id: "s1", courseId: "c1", dayOfWeek: 0, startHour: 10, duration: 2, type: "Cátedra" },
        ]}
        onAddCourse={vi.fn()}
        onDeleteCourse={vi.fn()}
        onAddSession={vi.fn()}
        onDeleteSession={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const buttons = Array.from(container.querySelectorAll("button"));
    buttons.forEach((btn) => {
      expect(btn.querySelector("button")).toBeNull();
    });

    expect(screen.getByRole("button", { name: /^Bases de Datos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar ramo Bases de Datos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Color ${PALETTE[0]}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar horario de Lunes 10:00" })).toBeInTheDocument();
  });

  it("MultiMemberSelect permite alternar selección con Enter y Space sin cerrar antes de confirmar", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const onBlur = vi.fn();
    const members: Member[] = [
      {
        id: "u1",
        username: "ana",
        name: "Ana",
        lastName: "Pérez",
        mail: "ana@uc.cl",
        initials: "AP",
        avatarColor: "#4f7cff",
        role: "Admin",
      },
      {
        id: "u2",
        username: "beto",
        name: "Beto",
        lastName: "Soto",
        mail: "beto@uc.cl",
        initials: "BS",
        avatarColor: "#2dd67b",
        role: "Miembro",
      },
    ];

    render(
      <MultiMemberSelect
        value={[]}
        members={members}
        onCommit={onCommit}
        onBlur={onBlur}
      />
    );

    const anaOption = screen.getByRole("button", { name: /Ana Pérez/i });
    anaOption.focus();

    await user.keyboard("{Enter}");
    expect(anaOption).toHaveAttribute("aria-pressed", "true");
    expect(onCommit).not.toHaveBeenCalled();

    const betoOption = screen.getByRole("button", { name: /Beto Soto/i });
    betoOption.focus();
    await user.keyboard(" ");
    expect(betoOption).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onCommit).toHaveBeenCalledWith(["u1", "u2"]);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("TaskRow hace visible el botón eliminar al enfocar y permite activarlo por teclado", async () => {
    const user = userEvent.setup();
    const onDeleteTask = vi.fn();
    const task: Activity = {
      id: "a1",
      projectId: "p1",
      sprintId: "s1",
      title: "Diseñar esquema",
      description: "Notas",
      category: "Backend",
      members: [],
      priority: "Alta",
      status: "En curso",
      hours: 2,
      dueDate: "2026-12-01",
    };

    render(
      <MemoryRouter>
        <table>
          <tbody>
            <TaskRow
              task={task}
              sprints={[{ id: "s1", projectId: "p1", name: "Sprint 1" }]}
              members={[]}
              categories={["Backend"]}
              onUpdate={vi.fn()}
              onDeleteTask={onDeleteTask}
            />
          </tbody>
        </table>
      </MemoryRouter>
    );

    const deleteButton = screen.getByRole("button", { name: "Eliminar tarea" });
    expect(deleteButton.className).toContain("group-focus-within:opacity-100");
    expect(deleteButton.className).toContain("focus-visible:opacity-100");

    deleteButton.focus();
    await user.keyboard("{Enter}");
    expect(onDeleteTask).toHaveBeenCalledWith("a1");
  });
});

describe("Contraste WCAG 2.1 AA en modo claro", () => {
  it("oscurece PALETTE, CATEGORY_COLORS, PRIORITY_META y STATUS_META para cumplir >= 4.5:1 sobre #ffffff y #f1f5f9", () => {
    for (const hex of PALETTE) {
      const light = getAccessibleColor(hex, false);
      expect(contrastRatio(light, "#ffffff")).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(light, "#f1f5f9")).toBeGreaterThanOrEqual(4.5);
      expect(getAccessibleColor(hex, true)).toBe(hex);
    }

    for (const taskType of Object.keys(CATEGORY_COLORS) as Array<keyof typeof CATEGORY_COLORS>) {
      const light = getCategoryColor(taskType, false);
      expect(contrastRatio(light, "#ffffff")).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(light, "#f1f5f9")).toBeGreaterThanOrEqual(4.5);
      expect(getCategoryColor(taskType, true)).toBe(CATEGORY_COLORS[taskType]);
    }

    for (const prio of PRIORITIES) {
      const lightMeta = getPriorityMeta(prio, false);
      expect(contrastRatio(lightMeta.color, "#ffffff")).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(lightMeta.color, "#f1f5f9")).toBeGreaterThanOrEqual(4.5);
    }

    for (const st of STATUSES) {
      const lightMeta = getStatusMeta(st, false);
      expect(contrastRatio(lightMeta.color, "#ffffff")).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(lightMeta.color, "#f1f5f9")).toBeGreaterThanOrEqual(4.5);
    }
  });
});
