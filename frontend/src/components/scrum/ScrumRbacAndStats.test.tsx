import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectLinksBar } from "./ProjectLinksBar";
import { SettingsModal } from "./modals/SettingsModal";
import { InlineSelectWithCreate } from "./InlineEditors";
import { AddRowForm } from "./AddRowForm";
import { TaskRow } from "./TaskRow";
import { StatsModal } from "./StatsModal";
import { ScrumView } from "../../ScrumView";
import { useAuthStore } from "../../store/useAuthStore";
import { useScrumStore } from "../../store/useScrumStore";
import type { Activity, Member, Project, Sprint } from "../../types";

vi.mock("../../api/client", () => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  restoreSession: vi.fn().mockResolvedValue(null),
  onSessionExpired: vi.fn(),
  describeError: (e: unknown) => (e instanceof Error ? e.message : "Error"),
}));

const baseProject: Project = {
  id: "p1",
  name: "Proyecto Prueba",
  description: "Desc",
  color: "#4f7cff",
  course: "IIC2143",
  categories: ["Backend", "Frontend"],
  members: [
    { userId: "u1", role: "Admin" },
    { userId: "u2", role: "Miembro" },
  ],
  links: [
    {
      id: "l1",
      title: "Repositorio",
      url: "https://github.com/org/repo",
      category: "repositorio",
    },
  ],
};

const baseMembers: Member[] = [
  {
    id: "u1",
    username: "ana",
    name: "Ana",
    lastName: "Admin",
    mail: "ana@uc.cl",
    initials: "AA",
    avatarColor: "#4f7cff",
    role: "Admin",
  },
  {
    id: "u2",
    username: "beto",
    name: "Beto",
    lastName: "Miembro",
    mail: "beto@uc.cl",
    initials: "BM",
    avatarColor: "#2dd67b",
    role: "Miembro",
  },
];

const baseSprints: Sprint[] = [{ id: "s1", projectId: "p1", name: "Sprint 1" }];

describe("RBAC UI en componentes Scrum", () => {
  it("ProjectLinksBar oculta CTA y botones de edición para Miembro", () => {
    const { container, rerender } = render(
      <ProjectLinksBar
        links={[]}
        canEdit={false}
        onAddLink={vi.fn()}
        onEditLink={vi.fn()}
        onDeleteLink={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <ProjectLinksBar
        links={baseProject.links!}
        canEdit={false}
        onAddLink={vi.fn()}
        onEditLink={vi.fn()}
        onDeleteLink={vi.fn()}
      />
    );
    expect(screen.getByText("Repositorio")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar Repositorio/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Eliminar Repositorio/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enlace/i })).not.toBeInTheDocument();
  });

  it("SettingsModal en modo solo lectura oculta Zona de Peligro, select de roles y botones Eliminar", async () => {
    const user = userEvent.setup();
    render(
      <SettingsModal
        project={baseProject}
        members={baseMembers}
        sprints={baseSprints}
        isAdmin={false}
        onRemove={vi.fn()}
        onUpdateRole={vi.fn()}
        onDeleteCategory={vi.fn()}
        onDeleteSprint={vi.fn()}
        onDeleteProject={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Zona de Peligro" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Miembro")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Categorías/i }));
    expect(screen.queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Sprints/i }));
    expect(screen.queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
  });

  it("InlineSelectWithCreate no ofrece creación ni entra en input si falta onCreateNew", () => {
    render(
      <InlineSelectWithCreate
        value=""
        options={[]}
        onCommit={vi.fn()}
        onBlur={vi.fn()}
      />
    );

    expect(screen.queryByPlaceholderText("Nombre...")).not.toBeInTheDocument();
    const select = screen.getByRole("combobox");
    expect(within(select).queryByText("+ Crear nuevo...")).not.toBeInTheDocument();
  });

  it("AddRowForm y TaskRow omiten opciones de crear sprint/categoría si no hay callbacks de Admin", async () => {
    const user = userEvent.setup();
    const task: Activity = {
      id: "a1",
      projectId: "p1",
      sprintId: "",
      title: "Definir API",
      description: "",
      category: "",
      members: [],
      priority: "Media",
      status: "Pendiente",
      hours: 2,
      dueDate: "2026-12-01",
    };

    render(
      <MemoryRouter>
        <table>
          <tbody>
            <TaskRow
              task={task}
              sprints={[]}
              members={baseMembers}
              categories={[]}
              onUpdate={vi.fn()}
            />
            <AddRowForm
              sprints={[]}
              members={baseMembers}
              categories={[]}
              onAdd={vi.fn()}
              onCancel={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>
    );

    expect(screen.queryByPlaceholderText("Nombre Sprint...")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Categoría...")).not.toBeInTheDocument();

    const sprintSelect = screen.getByLabelText("Sprint");
    expect(within(sprintSelect).queryByText("+ Nuevo Sprint...")).not.toBeInTheDocument();

    const categorySelect = screen.getByLabelText("Categoría");
    expect(within(categorySelect).queryByText("+ Nueva categoría...")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Editar sprint de la tarea Definir API"));
    expect(screen.queryByPlaceholderText("Nombre...")).not.toBeInTheDocument();
  });
});

describe("StatsModal — horas sin asignar y redondeo Hamilton", () => {
  it("muestra la fila Sin asignar / Otros cuando hay tareas sin responsables o de ex-miembros", () => {
    const tasks: Activity[] = [
      {
        id: "t1",
        projectId: "p1",
        sprintId: "s1",
        title: "Sin dueño",
        description: "",
        category: "Backend",
        members: [],
        priority: "Media",
        status: "Pendiente",
        hours: 4,
        dueDate: "2026-12-01",
      },
      {
        id: "t2",
        projectId: "p1",
        sprintId: "s1",
        title: "Compartida con ex-miembro",
        description: "",
        category: "Backend",
        members: ["u1", "ex-member"],
        priority: "Alta",
        status: "En curso",
        hours: 6,
        dueDate: "2026-12-01",
      },
      {
        id: "t3",
        projectId: "p1",
        sprintId: "s1",
        title: "Solo de Beto",
        description: "",
        category: "Frontend",
        members: ["u2"],
        priority: "Baja",
        status: "Completada",
        hours: 5,
        dueDate: "2026-12-01",
      },
    ];

    render(
      <StatsModal
        project={baseProject}
        tasks={tasks}
        members={baseMembers}
        onClose={vi.fn()}
      />
    );

    const unassignedCell = screen.getByText("Sin asignar / Otros");
    const unassignedRow = unassignedCell.closest("tr");
    expect(unassignedRow).not.toBeNull();
    expect(within(unassignedRow!).getByText("7h")).toBeInTheDocument();

    const totalRow = screen.getByText("Total del Proyecto").closest("tr");
    expect(within(totalRow!).getByText("15h")).toBeInTheDocument();

    // 3 tareas en 3 estados iguales: 34% + 33% + 33% = 100%
    const statusSection = screen.getByText("Estado de las Tareas").closest("div")!;
    expect(within(statusSection).getByText("1 (34%)")).toBeInTheDocument();
    expect(within(statusSection).getAllByText("1 (33%)")).toHaveLength(2);
  });

  it("oculta la fila Sin asignar / Otros si todas las horas pertenecen a miembros actuales", () => {
    const tasks: Activity[] = [
      {
        id: "t1",
        projectId: "p1",
        sprintId: "s1",
        title: "Asignada",
        description: "",
        category: "Backend",
        members: ["u1"],
        priority: "Media",
        status: "Pendiente",
        hours: 3,
        dueDate: "2026-12-01",
      },
    ];

    render(
      <StatsModal
        project={baseProject}
        tasks={tasks}
        members={baseMembers}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText("Sin asignar / Otros")).not.toBeInTheDocument();
  });
});

describe("ScrumView — RBAC integrado (Admin vs Miembro)", () => {
  const projectWithoutLinks: Project = {
    ...baseProject,
    links: [],
  };

  function setupStoreForUser(user: Member) {
    useAuthStore.setState({ user, loading: false });
    useScrumStore.setState({
      projects: [projectWithoutLinks],
      sprints: baseSprints,
      activities: [],
      users: baseMembers,
      loaded: true,
      loading: false,
      loadError: null,
      mutationError: null,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("oculta controles exclusivos de Admin cuando el usuario es Miembro", async () => {
    const user = userEvent.setup();
    setupStoreForUser(baseMembers[1]);

    render(
      <MemoryRouter initialEntries={["/scrum?project=p1"]}>
        <ScrumView />
      </MemoryRouter>
    );

    expect(screen.queryByTitle("Invitar al equipo")).not.toBeInTheDocument();
    expect(screen.queryByText(/Agregar enlaces importantes/i)).not.toBeInTheDocument();

    await user.click(screen.getByTitle("Ajustes del proyecto"));
    expect(screen.getByText("Ajustes del Proyecto")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Zona de Peligro" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("muestra controles de Admin cuando el usuario es Admin", async () => {
    const user = userEvent.setup();
    setupStoreForUser(baseMembers[0]);

    render(
      <MemoryRouter initialEntries={["/scrum?project=p1"]}>
        <ScrumView />
      </MemoryRouter>
    );

    expect(screen.getByTitle("Invitar al equipo")).toBeInTheDocument();
    expect(screen.getByText(/Agregar enlaces importantes/i)).toBeInTheDocument();

    await user.click(screen.getByTitle("Invitar al equipo"));
    expect(screen.getByRole("heading", { name: "Invitar al equipo" })).toBeInTheDocument();
  });
});

