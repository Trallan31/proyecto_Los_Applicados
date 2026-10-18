# Applicate

Applicate es una plataforma web orientada a estudiantes (especialmente de computación y carreras exigentes) diseñada para ayudarles a gestionar proyectos en equipo mediante metodologías ágiles (Scrum) y organizar eficientemente su horario académico personal.

## Tecnologías

- **Frontend:** React, TypeScript, Vite, Tailwind CSS y React Router.
- **Backend:** Node.js, TypeScript y Express.
- **Base de datos:** MongoDB, utilizando Mongoose.
- **MongoDB puede ejecutarse localmente o en Docker.**

Mongoose es una biblioteca del backend instalada mediante npm; lo que se ejecuta en Docker es MongoDB.

## Estructura del repositorio

```text
frontend/
  src/                Componentes, vistas, rutas y cliente HTTP
  vite.config.ts      Configuración de Vite y proxy de la API

backend/
  src/
    controllers/      Lógica de las operaciones CRUD
    middleware/       Manejo centralizado de errores
    models/           Esquemas y modelos de Mongoose
    routes/           Rutas de la API
    app.ts            Configuración de Express
    index.ts          Conexión a MongoDB e inicio del servidor
  .env.example        Plantilla de variables de entorno
  db.json             Datos antiguos; ya no es la base de datos activa
```

## Funcionalidades

### Organizador personal

- Horario semanal y mensual.
- Gestión de tareas con estado, prioridad y fecha de entrega.
- Organización por ramos.
- Enlaces asociados a cada ramo.

### Proyectos de equipo

- Tablero de actividades.
- Organización por proyectos, categorías y sprints.
- Miembros y responsables.
- Estadísticas de horas.
- Enlaces asociados a cada proyecto.

## Requisitos previos

- **Node.js 22.12 o superior**
- **npm**, incluido con Node.js.
- Una de estas alternativas:
  - **Docker Desktop**, para ejecutar MongoDB en un contenedor.
  - **MongoDB Community Server**, instalado y ejecutándose en el PC.

Todos los comandos siguientes se ejecutan desde la raíz del repositorio y son compatibles con PowerShell.

## Instalación inicial

### 1. Instalar dependencias

```powershell
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configurar las variables de entorno

Si todavía no existe `backend/.env`, copia la plantilla:

```powershell
Copy-Item backend/.env.example backend/.env
```

No ejecutes ese comando sobre un `.env` que ya configuraste, para evitar sobrescribirlo.

### 3. Preparar MongoDB

Elige una de las siguientes alternativas.

#### Alternativa A: MongoDB en Docker

Abre Docker Desktop y espera a que esté funcionando.

**Solo la primera vez**, si no tienes un contenedor de MongoDB que quieras reutilizar:

```powershell
docker run -d --name applicate-mongo -p 127.0.0.1:27017:27017 -v applicate-mongo-data:/data/db mongo:8
```

Este comando:

- Crea e inicia el contenedor `applicate-mongo`.
- Publica MongoDB en `127.0.0.1:27017`.
- Guarda los datos en el volumen `applicate-mongo-data`.
- Permite conexiones desde el PC, sin publicar el puerto en todas sus interfaces.

Este contenedor no configura autenticación y está pensado únicamente para desarrollo local.

**En los siguientes usos**, inicia el contenedor existente:

```powershell
docker start applicate-mongo
```

Comprueba su estado:

```powershell
docker ps
```

Si no aparece, revisa también los contenedores detenidos:

```powershell
docker ps -a
```

Si ya tienes un contenedor con otro nombre, utiliza ese nombre en lugar de `applicate-mongo`. No es necesario crear otro.

La URI configurada funciona cuando MongoDB publica el puerto 27017 en el PC.

#### Alternativa B: MongoDB instalado en el PC

Inicia el servicio de MongoDB de tu sistema.

Si escucha en el puerto predeterminado y no requiere autenticación:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/mibase
```

No necesitas Docker en esta alternativa.

MongoDB creará la base de datos al guardar el primer documento.

### Importar los datos iniciales

Con MongoDB funcionando, ejecuta desde la raíz del repositorio:

```powershell
npm run seed --prefix backend
```

El script `backend/src/seed.ts` lee `backend/db.json` e importa usuarios, ramos, sesiones, tareas, proyectos, sprints y actividades a la base indicada por `MONGODB_URI` en `backend/.env`.

No necesita que Express ni el frontend estén ejecutándose.

El importador:

- Convierte los identificadores de las seis entidades a ObjectId y actualiza sus referencias.
- Conserva los identificadores antiguos de usuarios y enlaces.
- Valida los documentos antes de comenzar las escrituras.
- No elimina ni sobrescribe documentos existentes.
- Genera identificadores reproducibles para evitar duplicados al repetir la importación del mismo archivo.

Este paso se realiza inicialmente, no cada vez que se inicia la aplicación.

**Importante:** no sincroniza cambios posteriores de `db.json`. Si un documento ya fue importado, se omite aunque su contenido en el archivo haya cambiado.

La importación no utiliza una transacción. Si se interrumpe durante las escrituras, puedes ejecutarla nuevamente para importar los documentos restantes.

### Crear un usuario de prueba

El registro público todavía no está implementado. Para crear un usuario
local con la contraseña almacenada como hash, ejecuta:

```powershell
Set-Location .\backend
npm run create-user -- demo-user DemoPass123 "Demo User" demo-user@example.local
```
usuario seria: demo-user
pw: DemoPass123
Nombre en la app: "Demo User"
Correo: demo-user@example.local
El comando crea el usuario directamente en MongoDB y no expone una ruta
pública de registro.

## Ejecutar la aplicación

La aplicación necesita tres componentes activos:

| Componente | Dirección predeterminada |
|---|---|
| MongoDB | `127.0.0.1:27017` |
| Backend Express | `http://localhost:3001` |
| Frontend Vite | `http://localhost:5173` |

Si MongoDB está instalado directamente en el PC, inicia su servicio.

### Iniciar el backend

En una terminal:

```powershell
npm run dev --prefix backend
```

Deberías ver:

```text
Conexión con MongoDB establecida.
API disponible en http://localhost:3001/api
```

El servidor espera a conectarse a MongoDB antes de empezar a escuchar solicitudes.

### Iniciar el frontend

En otra terminal:

```powershell
npm run dev --prefix frontend
```

Abre la dirección indicada por Vite, normalmente:

```text
http://localhost:5173
```

### Acceder a las vistas

Las rutas principales son:

| Ruta | Vista |
|---|---|
| `/login` | Acceso |
| `/organizador` | Organizador personal |
| `/scrum` | Proyectos de equipo |

Sin sesión, el frontend redirige a `/login`. El backend también rechaza con
`401` las rutas de datos si no existe una sesión válida.

El login guarda el JWT en una cookie `httpOnly`; el frontend no puede leerlo.
El token CSRF se entrega en el header `X-CSRF-Token` y se conserva en
`localStorage` para reenviarlo en las peticiones autenticadas. El frontend
guarda allí únicamente información pública del usuario y el token CSRF, nunca
el JWT.

Las rutas disponibles para la sesión son:

| Método | Ruta | Operación |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Restaurar y validar la sesión |
| POST | `/api/auth/logout` | Cerrar sesión |

El registro público se implementará posteriormente.

## Comunicación entre frontend y backend

El cliente HTTP del frontend utiliza `/api` como URL base.

En desarrollo, Vite reenvía estas solicitudes a Express:

```text
Frontend: /api/courses
Backend:  http://localhost:3001/api/courses
```

## API REST

URL base:

```text
http://localhost:3001/api
```

### Recursos implementados

| Recurso | Contenido |
|---|---|
| `/api/courses` | Ramos del organizador |
| `/api/sessions` | Bloques de horario |
| `/api/tasks` | Tareas del organizador |
| `/api/projects` | Proyectos de equipo |
| `/api/sprints` | Sprints de cada proyecto |
| `/api/activities` | Actividades de los proyectos |

Cada recurso dispone de estas operaciones:

| Método | Ruta | Operación |
|---|---|---|
| GET | `/api/<recurso>` | Listar |
| GET | `/api/<recurso>/:id` | Obtener por ID |
| POST | `/api/<recurso>` | Crear |
| PATCH | `/api/<recurso>/:id` | Actualizar parcialmente |
| DELETE | `/api/<recurso>/:id` | Eliminar |

MongoDB genera los identificadores. Las respuestas los exponen mediante la propiedad `id`.

### Respuestas y errores

- **200:** consulta o actualización exitosa.
- **201:** recurso creado.
- **204:** eliminación exitosa, sin contenido.
- **400:** datos o identificador inválidos.
- **404:** recurso o ruta inexistentes.
- **413:** cuerpo de la solicitud demasiado grande.
- **500:** error interno.

Los errores se devuelven como JSON:

```json
{
  "error": "Descripción del problema."
}
```

## Persistencia de datos

La fuente de datos activa es MongoDB.

- `backend/db.json` contiene los datos iniciales que puede importar `backend/src/seed.ts`.
- MongoDB es la fuente de datos activa; la aplicación no consulta `db.json`.
- Modificar `db.json` no actualiza automáticamente MongoDB. El seed solo agrega documentos cuyos identificadores de importación todavía no existen.
- Reiniciar Express no elimina los datos.
- El contenedor de ejemplo utiliza un volumen para conservarlos.
- Los IDs antiguos, como `course-1`, no equivalen a los ObjectId generados por MongoDB.

## Comandos disponibles

### Backend

```powershell
npm run dev --prefix backend
```

Inicia Express en desarrollo con reinicio automático.

```powershell
npm run build --prefix backend
```

Compila TypeScript y genera `backend/dist`.

```powershell
npm start --prefix backend
```

Ejecuta el backend compilado. Requiere haber ejecutado el build y tener MongoDB disponible.

```powershell
npm run seed --prefix backend
```

Importa los datos iniciales de `backend/db.json` a MongoDB. Requiere MongoDB disponible y `backend/.env` configurado. No elimina ni sobrescribe documentos existentes.

### Frontend

```powershell
npm run dev --prefix frontend
```

Inicia Vite en desarrollo.

```powershell
npm run build --prefix frontend
```

Comprueba TypeScript y genera los archivos de producción en `frontend/dist`.

```powershell
npm run lint --prefix frontend
```
