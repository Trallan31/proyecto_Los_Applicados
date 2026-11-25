# Applicate

Applicate es una plataforma web orientada a estudiantes (especialmente de computación y carreras exigentes) diseñada para ayudarles a gestionar proyectos en equipo mediante metodologías ágiles (Scrum) y organizar eficientemente su horario académico personal.

## Tecnologías

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router y Zustand (estado global).
- **Backend:** Node.js, TypeScript y Express.
- **Base de datos:** MongoDB, utilizando Mongoose.
- **Pruebas:** Vitest y Testing Library (frontend), node:test y Supertest (backend), Playwright (E2E).
- **MongoDB puede ejecutarse localmente o en Docker.**

Mongoose es una biblioteca del backend instalada mediante npm; lo que se ejecuta en Docker es MongoDB.

## Estructura del repositorio

```text
frontend/
  src/
    api/              Cliente HTTP (axios)
    components/       Componentes del organizador, de scrum y compartidos
    constants/        Colores, prioridades y estados de la UI
    context/          Tema claro/oscuro
    hooks/            Lógica de los tableros sobre los stores
    pages/            Login, registro y 404
    store/            Stores Zustand (auth, organizador, scrum, toasts)
    utils/            Fechas, navegación, URLs y sincronización scrum
    App.tsx           Rutas y layout principal
  vite.config.ts      Configuración de Vite y proxy de la API

backend/
  src/
    controllers/      Lógica de las operaciones CRUD
    middleware/       Autenticación, rate limiting y manejo de errores
    models/           Esquemas y modelos de Mongoose
    routes/           Rutas de la API
    utils/            Configuración de entorno y logging
    app.ts            Configuración de Express
    index.ts          Conexión a MongoDB e inicio del servidor
    seed.ts           Importador de datos iniciales
    createUser.ts     Alta manual de usuarios
  tests/              Pruebas de API con node:test y Supertest
  .env.example        Plantilla de variables de entorno
  db.json             Datos iniciales que importa el seed

e2etests/
  tests/              Pruebas E2E con Playwright
  playwright.config.ts  Servidores, navegador y reporte de las pruebas
```

## Funcionalidades

### Organizador personal

- Horario semanal y mensual con bloques de clases (cátedra, auxiliar, laboratorio).
- Gestión de tareas con estado, prioridad, tipo y fecha de entrega.
- Organización por ramos, con filtros por tiempo, tipo y estado.
- Enlaces útiles por ramo (U-Cursos, Drive, Zoom, etc.).
- Marcar actividades como completadas con notificación y opción de deshacer.
- Las actividades de los proyectos de equipo aparecen integradas en el
  organizador; se editan y eliminan desde su tablero.

### Proyectos de equipo

- Tablero tipo planilla con edición en línea de cada celda.
- Organización por proyectos, categorías y sprints.
- Roles Admin y Miembro: invitar, quitar y cambiar roles (solo Admin).
- Reordenar actividades con drag & drop (ratón y táctil) o con el teclado.
- Miembros y responsables por actividad.
- Estadísticas de horas y progreso del proyecto.
- Enlaces asociados a cada proyecto.
- El proyecto activo se sincroniza con la URL (`/scrum?project=<id>`).

### Experiencia general

- Tema claro/oscuro persistente entre sesiones.
- Interfaz responsive para móvil, tablet y escritorio.
- Accesibilidad: foco visible, modales con Escape y restauración de foco,
  roles ARIA y contraste AA.
- Notificaciones (toasts) de errores y acciones, con deshacer cuando aplica.

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

El repositorio incluye `backend/.env.example` con los nombres de las variables,
sin secretos. Si todavía no existe `backend/.env`, copia la plantilla:

```powershell
Copy-Item backend/.env.example backend/.env
```

**No ejecutes la copia si ya tienes un `.env` configurado**, para evitar
sobrescribirlo. Abre `backend/.env` y completa sus valores:

| Variable | Configuración |
|---|---|
| `PORT` | Puerto de Express; por defecto, `3001`. |
| `HOST` | Interfaz donde escucha Express; por defecto, `0.0.0.0`. |
| `MONGODB_URI` | URI de tu MongoDB, incluyendo el nombre de la base: `mongodb://127.0.0.1:27017/mibase`. |
| `MONGODB_DBNAME` | Base de desarrollo que usa la aplicación: `mibase`. Debe coincidir con el nombre incluido en `MONGODB_URI`. |
| `TEST_MONGODB_URI` | URI de la base separada usada por las pruebas E2E: `mongodb://127.0.0.1:27017/applicate_test`. |
| `TEST_MONGODB_DBNAME` | Base de pruebas: `applicate_test`. Debe coincidir con el nombre incluido en `TEST_MONGODB_URI` y ser distinta de `MONGODB_DBNAME`. |
| `JWT_SECRET` | Secreto aleatorio privado para firmar los JWT. |
| `SEED_DEMO_USER_ID` | Conserva `user-1` para usar `mgonzalez` con los datos de presentación. |
| `SEED_DEMO_PASSWORD` | Contraseña local de la cuenta de presentación: al menos 8 caracteres y como máximo 72 bytes UTF-8. |
| `CLIENT_ORIGIN` | Origen del frontend permitido por CORS; en desarrollo, `http://localhost:5173`. |

El nombre de la base se configura en dos lugares: la URI y la variable
`*_DBNAME`. Mongoose se conecta usando `*_DBNAME`; el nombre se mantiene
también en la URI porque el backend verifica que las URIs de desarrollo y de
pruebas apunten a bases distintas. Mantén ambos valores coincidentes.

Si tu `.env` viene de una versión anterior al despliegue, no lo sobrescribas:
agrega `HOST`, `MONGODB_DBNAME`, `TEST_MONGODB_DBNAME` y `CLIENT_ORIGIN`,
conserva tus secretos y revisa la sección
[Actualizar una base de datos existente](#actualizar-una-base-de-datos-existente).

Para generar un secreto JWT, ejecuta este comando y copia el resultado en
`JWT_SECRET` dentro de `backend/.env`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

`backend/.env` está ignorado por Git. No publiques sus valores en el README,
en `.env.example` ni en `db.json`. La plantilla mantiene vacíos los valores
sensibles; cada instalación configura los suyos.

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
MONGODB_DBNAME=mibase
```

No necesitas Docker en esta alternativa.

MongoDB creará la base de datos al guardar el primer documento.

### Importar los datos iniciales

Con MongoDB funcionando y `backend/.env` creado con el paso de configuración inicial, importa los datos desde la raíz del repositorio:

```powershell
npm run seed --prefix backend
```

El script `backend/src/seed.ts` lee `backend/db.json` e importa usuarios, ramos, sesiones, tareas, proyectos, sprints y actividades a la base indicada por `MONGODB_URI` y `MONGODB_DBNAME` en `backend/.env`. Las colecciones se crean con los nombres `applicados_*` que usan los modelos; una instalación nueva no requiere ningún paso adicional.

No necesita que Express ni el frontend estén ejecutándose.

El importador:

- Convierte los identificadores de las seis entidades a ObjectId y actualiza sus referencias.
- Conserva los identificadores antiguos de usuarios y enlaces.
- Valida los documentos antes de comenzar las escrituras.
- No elimina datos ni sobrescribe documentos existentes, excepto el hash de la cuenta de presentación explicado a continuación.
- Genera identificadores reproducibles para evitar duplicados al repetir la importación del mismo archivo.
- Prepara el usuario seleccionado por `SEED_DEMO_USER_ID` con la contraseña de prueba hasheada; al repetir el seed actualiza el hash de esa cuenta con el valor actual de `SEED_DEMO_PASSWORD`.

Este paso se realiza inicialmente, no cada vez que se inicia la aplicación.

**Importante:** no sincroniza cambios posteriores de `db.json`. Si un documento ya fue importado, se omite aunque su contenido en el archivo haya cambiado. La única excepción es el hash del usuario de presentación.

La importación no utiliza una transacción. Si se interrumpe durante las escrituras, puedes ejecutarla nuevamente para importar los documentos restantes.

### Usuario para la presentación

Después de configurar manualmente `backend/.env` y ejecutar
`npm run seed --prefix backend`, puedes entrar con esta cuenta:

| Usuario | Contraseña |
|---|---|
| `mgonzalez` | El valor que configuraste en `SEED_DEMO_PASSWORD` en tu `.env` local. |

`SEED_DEMO_PASSWORD` es la contraseña de inicio de sesión de la cuenta semilla,
no una contraseña adicional. El seed guarda su hash en MongoDB, no el texto
plano. Esta cuenta sirve únicamente para desarrollo y presentaciones locales.
El seed de presentación se bloquea cuando `NODE_ENV=production`.

Si tu `.env` ya estaba configurado, puedes conservarlo: no es necesario cambiar
el secreto JWT ni la contraseña para retirar la configuración automática.

## Actualizar una base de datos existente

Desde el despliegue en el servidor del curso, los modelos de Mongoose usan
nombres de colección explícitos con el prefijo `applicados_`, y el formato de
`backend/.env` cambió (paso 2 de la instalación). Una instalación nueva no
necesita hacer nada especial: el seed y la aplicación crean y usan las
colecciones nuevas directamente.

Si ya tenías una base de datos creada con una versión anterior —ya sea en
Docker o con MongoDB instalado en el PC—, tus datos siguen en las colecciones
antiguas (`users`, `projects`, ...). La aplicación ahora lee las colecciones
`applicados_*`, que estarán vacías. El síntoma típico es que el login responde
"Usuario o contraseña incorrectos" con cuentas que antes funcionaban, y los
tableros aparecen vacíos.

| Colección antigua | Colección actual |
|---|---|
| `users` | `applicados_user` |
| `projects` | `applicados_model` |
| `courses` | `applicados_course` |
| `tasks` | `applicados_task` |
| `sessions` | `applicados_session` |
| `sprints` | `applicados_sprint` |
| `activities` | `applicados_activity` |

`applicados_model` es el nombre definido en el código para los proyectos; no
lo cambies por `applicados_project`.

### Opción recomendada: renombrar las colecciones (conserva todos los datos)

Actualiza primero tu `backend/.env` al formato nuevo y detén el backend.
Luego revisa el estado de las colecciones (la base de desarrollo del ejemplo
es `mibase`):

```powershell
docker exec applicate-mongo mongosh mibase --eval "db.getCollectionNames().forEach(c=>print(c+': '+db.getCollection(c).countDocuments()+' docs'))"
```

Si usas MongoDB instalado en el PC, ejecuta lo mismo reemplazando
`docker exec applicate-mongo mongosh` por `mongosh`. Si tu contenedor tiene
otro nombre, usa ese nombre.

Si las colecciones `applicados_*` están vacías (0 docs), renombra las
antiguas. El comando conserva documentos e índices, omite las colecciones
antiguas que no existan y no toca las nuevas que ya tengan datos:

```powershell
docker exec applicate-mongo mongosh mibase --eval "const pares=[['users','applicados_user'],['projects','applicados_model'],['courses','applicados_course'],['tasks','applicados_task'],['sessions','applicados_session'],['sprints','applicados_sprint'],['activities','applicados_activity']]; pares.forEach(([v,n])=>{if(!db.getCollectionNames().includes(v)){print(v+': no existe, omitida');return;}const nueva=db.getCollection(n);if(nueva.countDocuments()>0){print(n+': ya tiene datos, omitida');return;}nueva.drop();db.getCollection(v).renameCollection(n);print(v+' -> '+n);})"
```

Para MongoDB instalado en el PC, usa el mismo `--eval` con
`mongosh mibase --eval "..."`. Si tu MongoDB requiere autenticación, agrega
`-u USUARIO -p CONTRASEÑA --authenticationDatabase admin`.

Esto solo afecta a la base de desarrollo (`mibase`). La base de pruebas
`applicate_test` no necesita migración: las pruebas E2E la reinician y crean
sus propios datos en las colecciones nuevas.

### Alternativa: volver a sembrar

Si no necesitas conservar los datos locales anteriores, ejecuta de nuevo
`npm run seed --prefix backend`: el seed pobla las colecciones `applicados_*`
con los datos de demostración. Las cuentas creadas manualmente (por ejemplo,
las registradas desde la interfaz) no se recrean; vuelve a registrarlas si
las necesitas.

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
Conexión con MongoDB establecida en mibase.
API disponible en http://0.0.0.0:3001/
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
| POST | `/api/auth/register` | Crear una cuenta |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Restaurar y validar la sesión |
| POST | `/api/auth/logout` | Cerrar sesión |

El registro público está disponible en `/registro`.

## Ejecutar en producción

El backend puede servir el frontend compilado en el mismo puerto, tal como
se despliega en el servidor del curso:

```powershell
npm run build --prefix frontend
npm run build --prefix backend
npm start --prefix backend
```

`npm start` ejecuta el backend compilado con `NODE_ENV=production`. En ese
modo:

- Sirve los estáticos de `frontend/dist` y responde con `index.html` a las
  rutas del frontend (fallback SPA), de modo que `/organizador` y `/scrum`
  siguen funcionando al recargar la página.
- Escucha en la interfaz indicada por `HOST` (por defecto `0.0.0.0`), para
  aceptar conexiones externas.
- Confía en el proxy frontal (`trust proxy`) y marca la cookie de sesión
  como `Secure` solo cuando la petición llega por HTTPS.
- El seed de presentación queda bloqueado.

La API y el frontend quedan disponibles en el mismo puerto (por defecto,
`3001`).

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
| `/api/users` | Usuarios registrados (para invitar al equipo) |

Cada recurso dispone de estas operaciones:

| Método | Ruta | Operación |
|---|---|---|
| GET | `/api/<recurso>` | Listar |
| GET | `/api/<recurso>/:id` | Obtener por ID |
| POST | `/api/<recurso>` | Crear |
| PATCH | `/api/<recurso>/:id` | Actualizar parcialmente |
| DELETE | `/api/<recurso>/:id` | Eliminar |

MongoDB genera los identificadores. Las respuestas los exponen mediante la propiedad `id`.

Además, `/api/health` expone el estado de la conexión a MongoDB. En entorno
de pruebas (`NODE_ENV=test`) existe `POST /api/testing/reset`, que vacía las
colecciones de la base de pruebas; en cualquier otro entorno responde 404.

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
- Los modelos usan colecciones con nombres explícitos `applicados_*`. Si vienes de una versión anterior, migra tus datos con la sección [Actualizar una base de datos existente](#actualizar-una-base-de-datos-existente).

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

```powershell
npm test --prefix backend
```

Ejecuta las pruebas de API con node:test y Supertest en entorno de pruebas. Requiere MongoDB disponible y la base de pruebas configurada en `backend/.env`.

```powershell
npm run start:test --prefix backend
```

Inicia el backend en entorno de pruebas (`NODE_ENV=test`). Es el comando que Playwright usa para levantar la API en las pruebas E2E.

```powershell
npm run create-user --prefix backend -- <usuario> <contraseña> [nombre] [correo]
```

Crea un usuario manualmente, sin pasar por el registro público.

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

Ejecuta ESLint sobre el frontend.

```powershell
npm test --prefix frontend
```

Ejecuta las pruebas de componentes, stores y utilidades con Vitest.

## Pruebas E2E

Las pruebas E2E están en la carpeta independiente [e2etests](e2etests/).
Usan Playwright y suman 25 casos que cubren:

- **Autenticación y registro:** acceso restringido, conservación del destino
  `next` tras el login, credenciales inválidas, cierre de sesión con
  revocación de acceso, alta de cuentas desde la interfaz y validaciones del
  formulario de registro.
- **Organizador:** ramos, horarios de clase, enlaces útiles, creación,
  edición y borrado de actividades, completar con deshacer desde la
  notificación y filtros por estado.
- **Tablero scrum:** proyectos, tareas con sprint y categoría, edición en
  línea de título y estado, reordenamiento con teclado y persistencia del
  orden, estadísticas, confirmación de borrado y eliminación del proyecto.
- **Permisos (RBAC):** invitación de miembros, restricciones de la vista
  Miembro y cambio de roles por el Admin.
- **Navegación y preferencias:** sincronización del proyecto activo con la
  URL, página 404, redirección de la raíz y tema claro/oscuro persistente.

Antes de ejecutarlas, ten MongoDB activo y configura `TEST_MONGODB_URI` y
`TEST_MONGODB_DBNAME` en `backend/.env`. La base de pruebas debe ser distinta
de la de desarrollo (tanto en la URI como entre `TEST_MONGODB_DBNAME` y
`MONGODB_DBNAME`), porque la suite elimina sus colecciones antes de cada caso.

Instala Playwright y sus navegadores desde la raíz del repositorio:

```powershell
npm install --prefix e2etests
npx --prefix e2etests playwright install chromium
```

Ejecuta las pruebas:

```powershell
npm test --prefix e2etests
```

Playwright iniciará automáticamente el backend y el frontend si no detecta
servidores existentes en los puertos 3001 y 5173.

Para ejecutar las pruebas con interfaz visual (modo UI de Playwright):

```powershell
npm run test:ui --prefix e2etests
```

Para abrir el reporte HTML de la última ejecución:

```powershell
npm run test:report --prefix e2etests
```

## Pruebas del backend

Las pruebas de API viven en `backend/tests/` y usan el runner nativo
`node:test` con Supertest. Cubren autenticación, usuarios, organizador,
permisos (RBAC) de scrum, seguridad y el reset de la base de pruebas.

Requieren MongoDB activo y `TEST_MONGODB_URI` + `TEST_MONGODB_DBNAME`
configurados en `backend/.env`. Se ejecutan con `NODE_ENV=test` y se conectan
a la base indicada en la URI de pruebas, por lo que nunca tocan la base de
desarrollo:

```powershell
npm test --prefix backend
```

## Pruebas de componentes del frontend

Las pruebas de componentes usan Vitest, jsdom y Testing Library. Simulan el
DOM de React y permiten buscar elementos renderizados con `screen`, sin abrir
un navegador real. Las interacciones escriben y hacen clic mediante
`@testing-library/user-event`.

La suite cubre las páginas (login, registro y 404), los stores Zustand
(auth, organizador, scrum y toasts), utilidades (fechas, navegación, URLs y
sincronización con scrum), la sincronización de la URL con el tablero, y
componentes como AddRowForm, los permisos y estadísticas de scrum, y
accesibilidad.

Ejecuta las pruebas desde la raiz del repositorio:

```powershell
npm test --prefix frontend
```
