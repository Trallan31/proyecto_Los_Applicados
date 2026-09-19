# Applicate

Applicate es una plataforma web orientada a estudiantes (especialmente de computación y carreras exigentes) diseñada para ayudarles a gestionar proyectos en equipo mediante metodologías ágiles (Scrum) y organizar eficientemente su horario académico personal.

## Estructura del Repositorio

- `/frontend`: Contiene la aplicación web desarrollada con **React**, **TypeScript** y **Vite**. Utiliza **Tailwind CSS** para los estilos.
- `/backend`: Contiene la lógica del servidor y la API (si aplica).

## Funcionalidades Principales

### 1. Organizador Personal
- **Horario Semanal y Mensual**: Visualización clara de clases y sesiones de estudio (soporta bloques desde las 08:00 hasta las 22:00, de lunes a domingo).
- **Gestión de Tareas**: Listado de tareas con control de progreso, niveles de prioridad, estados (Pendiente, En Progreso, Completado) y fechas de entrega precisas.
- **Categorización por Ramos**: Asignación de colores y códigos únicos a cada ramo para rápida identificación visual.

### 2. Proyectos de Equipo (Scrum Board)
- **Tablero Interactivo**: Gestión de múltiples proyectos en simultáneo.
- **Sprints**: Planificación ágil con definición de duración, estados y objetivos claros para cada iteración.
- **Estadísticas y Análisis**: Panel de métricas y gráficos que calcula la contribución en horas de cada integrante, dividiendo automáticamente el esfuerzo en tareas grupales de manera proporcional.

## Requisitos Previos

- [Node.js](https://nodejs.org/) (Versión 18 o superior)
- `npm` (incluido con Node.js)

## Instalación y Uso (Entorno de Desarrollo)

Para levantar el proyecto en tu máquina local, sigue estos pasos:

1. Clona el repositorio y entra a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre la URL local que aparecerá en tu terminal (generalmente `http://localhost:5173/`).

## Comandos Disponibles en `/frontend`

- `npm run dev`: Levanta el entorno local con Hot Module Replacement (HMR).
- `npm run build`: Compila el proyecto con TypeScript y genera los estáticos de producción en la carpeta `dist`.
- `npm run lint`: Ejecuta las reglas de linter (ESLint) para asegurar la calidad del código.
