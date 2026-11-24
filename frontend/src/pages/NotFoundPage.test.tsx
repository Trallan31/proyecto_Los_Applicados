import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import NotFoundPage from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("muestra 404, el título, la ruta actual en <code> y el enlace 'Ir al inicio'", () => {
    render(
      <MemoryRouter initialEntries={["/ruta-inexistente"]}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Página no encontrada" })
    ).toBeInTheDocument();

    const rutaCode = screen.getByText("/ruta-inexistente");
    expect(rutaCode.tagName).toBe("CODE");

    expect(
      screen.getByRole("link", { name: "Ir al inicio" })
    ).toHaveAttribute("href", "/");
  });

  it("ejecuta navigate(-1) al hacer clic en el botón 'Volver' con historial previo", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={["/organizador", "/no-existe"]}
        initialIndex={1}
      >
        <Routes>
          <Route path="/organizador" element={<h1>Organizador previo</h1>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Página no encontrada" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Volver" }));

    expect(
      screen.getByRole("heading", { name: "Organizador previo" })
    ).toBeInTheDocument();
  });
});
