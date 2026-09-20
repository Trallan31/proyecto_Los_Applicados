# Applicate

Applicate es una plataforma web orientada a estudiantes (especialmente de computación y carreras exigentes) diseñada para ayudarles a gestionar proyectos en equipo mediante metodologías ágiles (Scrum) y organizar eficientemente su horario académico personal.

## Estructura del Repositorio

- `/frontend`: aplicación web en **React**, **TypeScript** y **Vite**, con **Tailwind CSS** para los estilos.
- `/backend`: la API REST. Hoy la sirve **json-server** a partir de `db.json`; ver *Cómo migrar a Mongoose* más abajo.

## Funcionalidades Principales

### 1. Organizador Personal
- **Horario Semanal y Mensual**: visualización de clases y sesiones de estudio (bloques de 08:00 a 22:00, de lunes a domingo).
- **Gestión de Tareas**: listado con control de progreso, prioridad, estado (Pendiente, En curso, Completada) y fecha de entrega.
- **Categorización por Ramos**: color y código únicos por ramo para identificarlos de un vistazo.

### 2. Proyectos de Equipo (Scrum Board)
- **Tablero Interactivo**: varios proyectos en simultáneo, editable celda por celda.
- **Sprints**: agrupan las tareas de un proyecto. Cada sprint tiene nombre; todavía no tiene duración ni objetivos.
- **Estadísticas**: métricas y gráficos que reparten las horas de cada tarea grupal proporcionalmente entre sus responsables.

## Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- `npm` (incluido con Node.js)

## Instalación y Uso (Entorno de Desarrollo)

La aplicación son **dos procesos**: la API y el frontend. Hay que levantar los dos.

1. Instala las dependencias de ambos:
   ```bash
   npm install --prefix backend && npm install --prefix frontend
   ```
2. En una terminal, levanta la API (queda en `http://localhost:3001`):
   ```bash
   npm run dev --prefix backend
   ```
3. En otra terminal, levanta el frontend (queda en `http://localhost:5173`):
   ```bash
   npm run dev --prefix frontend
   ```
4. Abre `http://localhost:5173`.

Si el frontend muestra *"No se pudieron cargar los datos"*, es que la API no está corriendo: revisa el paso 2.

## La API

`backend/db.json` es la base de datos: un archivo JSON con siete colecciones planas. json-server lo expone como una API REST completa y **escribe los cambios de vuelta al archivo**, así que los datos sobreviven a un reinicio.

| Recurso | Contenido |
|---|---|
| `/users` | Usuarios del sistema |
| `/courses` | Ramos del organizador personal |
| `/sessions` | Bloques de horario de cada ramo |
| `/tasks` | Tareas del organizador personal |
| `/projects` | Proyectos de equipo (incluyen sus categorías y miembros) |
| `/sprints` | Sprints, cada uno con su `projectId` |
| `/activities` | Tareas de los proyectos de equipo |

El frontend siempre llama a `/api/<recurso>`. En desarrollo Vite redirige `/api` al puerto 3001 y le quita el prefijo, porque json-server sirve en la raíz (ver `frontend/vite.config.ts`).

Para volver a los datos originales basta con restaurar el archivo:
```bash
git checkout backend/db.json
```

## Cómo migrar a Mongoose

La estructura ya está preparada para el cambio:

1. Las siete colecciones de `db.json` son las siete colecciones de Mongo. Los `projectId`, `courseId`, `sprintId` y `userId` son las futuras referencias.
2. Escribe el servidor Express en `backend/`, monta el router en `/api` y expón las mismas rutas y verbos (`GET`, `POST`, `PATCH`, `DELETE`).
3. Borra el `rewrite` del proxy en `frontend/vite.config.ts`.

El frontend no cambia: todas las llamadas pasan por `frontend/src/api/client.ts`.

## Comandos Disponibles

En `/backend`:
- `npm run dev`: levanta json-server en el puerto 3001.

En `/frontend`:
- `npm run dev`: levanta el entorno local con Hot Module Replacement (HMR).
- `npm run build`: compila con TypeScript y genera los estáticos de producción en `dist`.
- `npm run lint`: ejecuta ESLint.
