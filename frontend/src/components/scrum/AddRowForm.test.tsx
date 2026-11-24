import "@testing-library/jest-dom/vitest";
import { useState, type ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddRowForm } from "./AddRowForm";
import { formatLocalDate, getToday } from "../../utils/dateUtils";
import type { Activity, Member, Sprint } from "../../types";

const sprintsBase: Sprint[] = [
  { id: "s1", projectId: "p1", name: "Sprint 1" },
  { id: "s2", projectId: "p1", name: "Sprint 2" },
];

const miembrosBase: Member[] = [
  {
    id: "u1",
    username: "ana",
    name: "Ana",
    lastName: "Pérez",
    initials: "AP",
    avatarColor: "#4f7cff",
    role: "Admin",
  },
  {
    id: "u2",
    username: "beto",
    name: "Beto",
    lastName: "Soto",
    initials: "BS",
    avatarColor: "#2dd67b",
    role: "Miembro",
  },
];

const categoriasBase = ["Backend", "Frontend"];

function crearActividadMock(
  datos: Omit<Activity, "id" | "projectId">
): Activity {
  return {
    id: "act-nueva",
    projectId: "p1",
    ...datos,
  };
}

function renderAddRowForm(
  props: Partial<ComponentProps<typeof AddRowForm>> = {}
) {
  const defaultProps: ComponentProps<typeof AddRowForm> = {
    sprints: sprintsBase,
    members: miembrosBase,
    categories: categoriasBase,
    onAdd: vi.fn(async (datos) => crearActividadMock(datos)),
    onCreateCategory: vi.fn(async () => true),
    onCreateSprint: vi.fn(async (name) => ({
      id: "s-nuevo",
      projectId: "p1",
      name,
    })),
    onCancel: vi.fn(),
    ...props,
  };

  const resultado = render(
    <table>
      <tbody>
        <AddRowForm {...defaultProps} />
      </tbody>
    </table>
  );

  return { ...resultado, props: defaultProps };
}

describe("AddRowForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valida título vacío y fecha inválida mostrando role='alert' sin llamar a onAdd", async () => {
    const user = userEvent.setup();
    const { props } = renderAddRowForm();

    await user.click(screen.getByRole("button", { name: "Guardar tarea" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ingresa un nombre para la tarea."
    );
    expect(props.onAdd).not.toHaveBeenCalled();

    const titleInput = screen.getByLabelText("Nombre de la tarea");
    await user.type(titleInput, "   ");
    await user.click(screen.getByRole("button", { name: "Guardar tarea" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ingresa un nombre para la tarea."
    );

    await user.clear(titleInput);
    await user.type(titleInput, "Configurar CI");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    const dateInput = screen.getByLabelText("Fecha límite");
    fireEvent.change(dateInput, { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: "Guardar tarea" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Selecciona una fecha límite válida."
    );
    expect(props.onAdd).not.toHaveBeenCalled();
  });

  it("crea una tarea con sprint, categoría, prioridad, estado, miembros, horas acotadas y notas", async () => {
    const user = userEvent.setup();
    const { props } = renderAddRowForm();

    await user.type(
      screen.getByLabelText("Nombre de la tarea"),
      "  Diseñar API REST  "
    );
    await user.selectOptions(screen.getByLabelText("Sprint"), "s2");
    await user.selectOptions(screen.getByLabelText("Categoría"), "Frontend");
    await user.selectOptions(screen.getByLabelText("Prioridad"), "Critica");
    await user.selectOptions(screen.getByLabelText("Estado"), "En curso");

    const btnAna = screen.getByRole("button", { name: "Asignar a Ana" });
    const btnBeto = screen.getByRole("button", { name: "Asignar a Beto" });
    expect(btnAna).toHaveAttribute("aria-pressed", "false");
    expect(btnBeto).toHaveAttribute("aria-pressed", "false");

    await user.click(btnAna);
    await user.click(btnBeto);
    await user.click(btnAna);
    expect(btnAna).toHaveAttribute("aria-pressed", "false");
    expect(btnBeto).toHaveAttribute("aria-pressed", "true");

    const hoursInput = screen.getByLabelText("Horas estimadas");
    fireEvent.change(hoursInput, { target: { value: "-10" } });
    expect(hoursInput).toHaveValue(null);

    fireEvent.change(hoursInput, { target: { value: "15000" } });
    expect(hoursInput).toHaveValue(10000);

    fireEvent.change(screen.getByLabelText("Fecha límite"), {
      target: { value: "2026-12-10" },
    });
    await user.type(
      screen.getByLabelText("Notas de la tarea"),
      "  Incluir contratos OpenAPI  "
    );

    await user.click(screen.getByRole("button", { name: "Guardar tarea" }));

    await waitFor(() => {
      expect(props.onAdd).toHaveBeenCalledWith({
        title: "Diseñar API REST",
        description: "Incluir contratos OpenAPI",
        sprintId: "s2",
        category: "Frontend",
        members: ["u2"],
        priority: "Critica",
        status: "En curso",
        hours: 10000,
        dueDate: "2026-12-10",
      });
    });
  });

  it("acota horas negativas a 0 al enviar", async () => {
    const user = userEvent.setup();
    const { props } = renderAddRowForm();

    await user.type(screen.getByLabelText("Nombre de la tarea"), "Tarea rápida");
    fireEvent.change(screen.getByLabelText("Horas estimadas"), {
      target: { value: "-5" },
    });
    await user.click(screen.getByRole("button", { name: "Guardar tarea" }));

    await waitFor(() => {
      expect(props.onAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Tarea rápida",
          hours: 0,
          dueDate: formatLocalDate(getToday()),
        })
      );
    });
  });

  it("envía con Enter y cancela mediante botón 'Cancelar' o tecla Escape", async () => {
    const user = userEvent.setup();
    const { props, unmount } = renderAddRowForm();

    const titleInput = screen.getByLabelText("Nombre de la tarea");
    await user.type(titleInput, "Guardar con Enter{Enter}");

    await waitFor(() => {
      expect(props.onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Guardar con Enter" })
      );
    });

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    unmount();

    const segundaRender = renderAddRowForm();
    await user.type(
      screen.getByLabelText("Notas de la tarea"),
      "Borrador{Escape}"
    );
    expect(segundaRender.props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("permite creación inline de categoría y sprint", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn(async (datos) => crearActividadMock(datos));
    const onCreateCategory = vi.fn(async () => true);
    const onCreateSprint = vi.fn(async (name: string) => ({
      id: "s-3",
      projectId: "p1",
      name,
    }));

    function ContenedorConEstado() {
      const [sprints, setSprints] = useState<Sprint[]>(sprintsBase);
      const [categories, setCategories] = useState<string[]>(categoriasBase);

      return (
        <table>
          <tbody>
            <AddRowForm
              sprints={sprints}
              members={miembrosBase}
              categories={categories}
              onAdd={onAdd}
              onCreateCategory={async (name) => {
                const ok = await onCreateCategory();
                if (ok) setCategories((prev) => [...prev, name]);
                return ok;
              }}
              onCreateSprint={async (name) => {
                const created = await onCreateSprint(name);
                if (created) setSprints((prev) => [...prev, created]);
                return created;
              }}
              onCancel={vi.fn()}
            />
          </tbody>
        </table>
      );
    }

    render(<ContenedorConEstado />);

    await user.selectOptions(screen.getByLabelText("Sprint"), "__NEW__");
    await user.type(
      screen.getByLabelText("Nombre del nuevo sprint"),
      "Sprint 3{Enter}"
    );

    await waitFor(() => {
      expect(onCreateSprint).toHaveBeenCalledWith("Sprint 3");
      expect(screen.getByLabelText("Sprint")).toHaveValue("s-3");
    });

    await user.selectOptions(screen.getByLabelText("Categoría"), "__NEW__");
    await user.type(
      screen.getByLabelText("Nombre de la nueva categoría"),
      "QA{Enter}"
    );

    await waitFor(() => {
      expect(onCreateCategory).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText("Categoría")).toHaveValue("QA");
    });

    await user.type(screen.getByLabelText("Nombre de la tarea"), "Plan de pruebas");
    await user.click(screen.getByRole("button", { name: "Guardar tarea" }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Plan de pruebas",
          sprintId: "s-3",
          category: "QA",
        })
      );
    });
  });

  it("muestra errores si fallan onCreateCategory, onCreateSprint o onAdd", async () => {
    const user = userEvent.setup();
    const onCreateCategory = vi.fn(async () => false);
    const onCreateSprint = vi.fn(async () => null);
    const onAdd = vi.fn(async () => null);

    renderAddRowForm({
      onCreateCategory,
      onCreateSprint,
      onAdd,
    });

    await user.selectOptions(screen.getByLabelText("Categoría"), "__NEW__");
    await user.type(
      screen.getByLabelText("Nombre de la nueva categoría"),
      "DevOps{Enter}"
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo crear la categoría. Intenta nuevamente."
    );
    await user.click(
      screen.getByRole("button", { name: "Cancelar nueva categoría" })
    );

    await user.selectOptions(screen.getByLabelText("Sprint"), "__NEW__");
    await user.type(
      screen.getByLabelText("Nombre del nuevo sprint"),
      "Sprint Fallido{Enter}"
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo crear el sprint. Intenta nuevamente."
    );
    await user.click(
      screen.getByRole("button", { name: "Cancelar nuevo sprint" })
    );

    await user.type(screen.getByLabelText("Nombre de la tarea"), "Tarea con error");
    await user.click(screen.getByRole("button", { name: "Guardar tarea" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo guardar la tarea. Intenta nuevamente."
    );
  });

  it("oculta las opciones de creación cuando no se pasan onCreateCategory ni onCreateSprint", () => {
    const { unmount } = renderAddRowForm({
      onCreateCategory: undefined,
      onCreateSprint: undefined,
    });

    expect(
      screen.queryByRole("option", { name: "+ Nuevo Sprint..." })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "+ Nueva categoría..." })
    ).not.toBeInTheDocument();
    unmount();

    renderAddRowForm({
      sprints: [],
      categories: [],
      onCreateCategory: undefined,
      onCreateSprint: undefined,
    });

    expect(
      screen.queryByLabelText("Nombre del nuevo sprint")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Nombre de la nueva categoría")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Sin sprint" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Sin categoría" })
    ).toBeInTheDocument();
  });
});
