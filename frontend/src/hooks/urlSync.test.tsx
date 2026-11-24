import "@testing-library/jest-dom/vitest";
import { StrictMode, type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useScrumBoard } from "./useScrumBoard";
import { useOrganizerBoard } from "./useOrganizerBoard";
import { useAuthStore } from "../store/useAuthStore";
import { useScrumStore } from "../store/useScrumStore";
import { useOrganizerStore } from "../store/useOrganizerStore";
import * as api from "../api/client";
import type { Course, Project, User } from "../types";

vi.mock("../api/client", () => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  restoreSession: vi.fn().mockResolvedValue(null),
  onSessionExpired: vi.fn(),
  describeError: (e: unknown) => (e instanceof Error ? e.message : "Error"),
}));

const adminUser: User = {
  id: "u1",
  username: "ana",
  name: "Ana",
  lastName: "Pérez",
  mail: "ana@uc.cl",
  initials: "AP",
  avatarColor: "#4f7cff",
};

const sampleProjects: Project[] = [
  {
    id: "p1",
    name: "Proyecto Alpha",
    description: "",
    color: "#4f7cff",
    course: "IIC2143",
    categories: ["General"],
    members: [{ userId: "u1", role: "Admin" }],
  },
  {
    id: "p2",
    name: "Proyecto Beta",
    description: "",
    color: "#2dd67b",
    course: "IIC2513",
    categories: ["General"],
    members: [
      { userId: "u2", role: "Admin" },
      { userId: "u1", role: "Miembro" },
    ],
  },
];

const sampleCourses: Course[] = [
  { id: "c1", userId: "u1", code: "IIC2143", shortName: "ISW", name: "Ing. Software", color: "#4f7cff" },
  { id: "c2", userId: "u1", code: "IIC2513", shortName: "WEB", name: "Web", color: "#2dd67b" },
];

function createWrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <StrictMode>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </StrictMode>
    );
  };
}

describe("Sincronización de URL en useScrumBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: adminUser, loading: false });
    useScrumStore.setState({
      projects: sampleProjects,
      sprints: [],
      activities: [],
      users: [adminUser],
      loaded: true,
      loading: false,
      loadError: null,
      mutationError: null,
    });
  });

  it("sincroniza ?project al primer proyecto cuando la URL no trae query param", async () => {
    const { result } = renderHook(
      () => ({
        board: useScrumBoard(),
        location: useLocation(),
      }),
      { wrapper: createWrapper(["/scrum"]) }
    );

    await waitFor(() => {
      expect(result.current.location.search).toBe("?project=p1");
    });
    expect(result.current.board.activeProjectId).toBe("p1");
    expect(result.current.board.isAdmin).toBe(true);
  });

  it("resuelve ?project=p2 desde la URL y calcula isAdmin según el rol del usuario", async () => {
    const { result } = renderHook(
      () => useScrumBoard(),
      { wrapper: createWrapper(["/scrum?project=p2"]) }
    );

    expect(result.current.activeProjectId).toBe("p2");
    expect(result.current.isAdmin).toBe(false);
  });

  it("conserva historial Atrás/Adelante al cambiar de proyecto", async () => {
    const { result } = renderHook(
      () => ({
        board: useScrumBoard(),
        location: useLocation(),
        navigate: useNavigate(),
      }),
      { wrapper: createWrapper(["/scrum?project=p1"]) }
    );

    act(() => {
      result.current.board.setActiveProjectId("p2");
    });

    await waitFor(() => {
      expect(result.current.location.search).toBe("?project=p2");
    });
    expect(result.current.board.isAdmin).toBe(false);

    act(() => {
      result.current.navigate(-1);
    });

    await waitFor(() => {
      expect(result.current.location.search).toBe("?project=p1");
    });
    expect(result.current.board.activeProjectId).toBe("p1");
    expect(result.current.board.isAdmin).toBe(true);
  });

  it("actualiza ?project al crear y al eliminar el proyecto activo", async () => {
    const createdProject: Project = {
      id: "p3",
      name: "Nuevo",
      description: "",
      color: "#9b6dff",
      course: "",
      categories: ["General"],
      members: [{ userId: "u1", role: "Admin" }],
    };
    vi.mocked(api.create)
      .mockResolvedValueOnce(createdProject)
      .mockResolvedValueOnce({ id: "s-new", projectId: "p3", name: "Sprint 1" });
    vi.mocked(api.remove).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => ({
        board: useScrumBoard(),
        location: useLocation(),
      }),
      { wrapper: createWrapper(["/scrum?project=p1"]) }
    );

    await act(async () => {
      const ok = await result.current.board.createProject({
        name: "Nuevo",
        description: "",
        color: "#9b6dff",
        course: "",
      });
      expect(ok).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.location.search).toBe("?project=p3");
    });

    await act(async () => {
      const ok = await result.current.board.deleteProject("p3");
      expect(ok).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.location.search).toBe("?project=p1");
    });
  });

  it("elimina ?project de la URL si no hay proyectos", async () => {
    useScrumStore.setState({ projects: [], loaded: true, loading: false });

    const { result } = renderHook(
      () => ({
        board: useScrumBoard(),
        location: useLocation(),
      }),
      { wrapper: createWrapper(["/scrum?project=inexistente"]) }
    );

    await waitFor(() => {
      expect(result.current.location.search).toBe("");
    });
    expect(result.current.board.activeProjectId).toBe("");
  });
});

describe("Sincronización de URL en useOrganizerBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: adminUser, loading: false });
    useOrganizerStore.setState({
      courses: sampleCourses,
      sessions: [],
      tasks: [],
      activities: [],
      projects: sampleProjects,
      loaded: true,
      loading: false,
      loadError: null,
      mutationError: null,
      activeCourse: "all",
      timeFilter: "todas",
      typeFilter: "all",
      statusFilter: "all",
      tab: "lista",
    });
  });

  it("hidrata el store desde la URL inicial", async () => {
    const { result } = renderHook(
      () => useOrganizerBoard(),
      {
        wrapper: createWrapper([
          "/organizador?tab=semana&course=c1&time=mes&type=Tarea&status=Pendiente",
        ]),
      }
    );

    await waitFor(() => {
      expect(result.current.tab).toBe("semana");
      expect(result.current.activeCourse).toBe("c1");
      expect(result.current.timeFilter).toBe("mes");
      expect(result.current.typeFilter).toBe("Tarea");
      expect(result.current.statusFilter).toBe("Pendiente");
    });
  });

  it("refleja filtros activos del store en la URL al volver desde /scrum sin query params", async () => {
    useOrganizerStore.setState({
      activeCourse: "c2",
      tab: "mes",
      timeFilter: "semana",
    });

    const { result } = renderHook(
      () => ({
        board: useOrganizerBoard(),
        location: useLocation(),
      }),
      { wrapper: createWrapper(["/organizador"]) }
    );

    await waitFor(() => {
      const params = new URLSearchParams(result.current.location.search);
      expect(params.get("tab")).toBe("mes");
      expect(params.get("course")).toBe("c2");
      expect(params.get("time")).toBe("semana");
      expect(params.has("type")).toBe(false);
      expect(params.has("status")).toBe(false);
    });
  });

  it("actualiza store y URL al cambiar filtros, omite defaults y limpia course al borrar ramo", async () => {
    vi.mocked(api.remove).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => ({
        board: useOrganizerBoard(),
        location: useLocation(),
        navigate: useNavigate(),
      }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StrictMode>
            <MemoryRouter initialEntries={["/organizador"]}>
              <Routes>
                <Route path="/organizador" element={children} />
              </Routes>
            </MemoryRouter>
          </StrictMode>
        ),
      }
    );

    act(() => {
      result.current.board.setTab("semana");
      result.current.board.setActiveCourse("c1");
      result.current.board.setTimeFilter("mes");
    });

    await waitFor(() => {
      const params = new URLSearchParams(result.current.location.search);
      expect(params.get("tab")).toBe("semana");
      expect(params.get("course")).toBe("c1");
      expect(params.get("time")).toBe("mes");
    });

    await act(async () => {
      const ok = await result.current.board.deleteCourse("c1");
      expect(ok).toBe(true);
    });

    await waitFor(() => {
      const params = new URLSearchParams(result.current.location.search);
      expect(params.has("course")).toBe(false);
      expect(params.get("tab")).toBe("semana");
      expect(result.current.board.activeCourse).toBe("all");
    });

    act(() => {
      result.current.board.setTab("lista");
      result.current.board.setTimeFilter("todas");
    });

    await waitFor(() => {
      expect(result.current.location.search).toBe("");
    });
  });

  it("restaura los valores por defecto al retroceder con el navegador hacia /organizador limpio", async () => {
    const { result } = renderHook(
      () => ({
        board: useOrganizerBoard(),
        location: useLocation(),
        navigate: useNavigate(),
      }),
      { wrapper: createWrapper(["/organizador"]) }
    );

    act(() => {
      result.current.board.setActiveCourse("c1");
    });

    await waitFor(() => {
      expect(result.current.location.search).toBe("?course=c1");
    });

    act(() => {
      result.current.navigate(-1);
    });

    await waitFor(() => {
      expect(result.current.location.search).toBe("");
      expect(result.current.board.activeCourse).toBe("all");
    });
  });
});
