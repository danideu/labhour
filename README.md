# LabHour - Sistema de Control Horario

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Turso](https://img.shields.io/badge/Turso-SQLite-4FF8D2?logo=turso)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel)

Sistema de control horario y gestión de jornadas laborales diseñado para cumplir con la normativa laboral española. Especialmente orientado al sector de la construcción con soporte para múltiples obras/proyectos.

🌐 **URL de Producción**: [fichajes.ddrproyectos.com](https://fichajes.ddrproyectos.com)

## 🚀 Características

### Para Empleados
- **Fichaje en tiempo real** - Clock in/out con selector de proyecto/obra
- **Historial de jornadas** - Consulta de todos los fichajes con filtros
- **Imputación manual** - Registro de jornadas retroactivas con justificación obligatoria
- **Gestión de ausencias** - Solicitudes de vacaciones, bajas, permisos
- **Notificaciones** - Alertas sobre aprobaciones, rechazos y recordatorios

### Para Administradores
- **Dashboard en tiempo real** - Métricas, gráficas y actividad en vivo
- **Validación de horas manuales** - Aprobar/rechazar imputaciones con comentarios
- **Gestión de empleados y proyectos** - CRUD completo
- **Sistema de recordatorios** - Avisos a empleados que no han fichado
- **Logs de auditoría** - Registro inmutable para Inspección de Trabajo
- **Panel de seguridad** - Gestión de IPs bloqueadas
- **Informes y exportación CSV**

### Cumplimiento Normativo
- ✅ Etiquetado permanente de fichajes manuales vs automáticos
- ✅ Timestamp del servidor (inmutable)
- ✅ Auditoría completa con IP, dispositivo y justificación
- ✅ Conservación mínima 4 años
- ✅ Consulta telemática instantánea

## 📦 Tecnologías

| Componente | Tecnología |
|------------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS |
| **Backend** | Next.js API Routes |
| **Base de datos** | Turso (SQLite cloud) |
| **Autenticación** | JWT con jose + bcrypt |
| **Hosting** | Vercel |
| **Dominio** | Namecheap |

## 🔒 Seguridad Implementada

- ✅ Contraseñas hasheadas con bcrypt (salt factor 10)
- ✅ Tokens JWT con clave secreta segura
- ✅ Cookies httpOnly, secure, sameSite
- ✅ Headers de seguridad HTTP (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Rate limiting en login (5 intentos → bloqueo 15 min)
- ✅ Aviso preventivo en 4º intento fallido
- ✅ Panel admin para desbloquear IPs
- ✅ Validación de contraseñas (8+ chars, mayúscula, minúscula, número)
- ✅ Middleware de protección por rol
- ✅ Logs de auditoría inmutables

## 🛠️ Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/danideu/labhour.git
cd labhour

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Turso

# Iniciar en desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## ⚙️ Variables de Entorno

```env
# Turso Database
TURSO_DATABASE_URL=libsql://tu-base-de-datos.turso.io
TURSO_AUTH_TOKEN=tu-token-de-turso

# JWT Secret (generar con: openssl rand -base64 32)
JWT_SECRET=tu-clave-secreta-segura
```

## 📁 Estructura del Proyecto

```
├── app/
│   ├── admin/           # Panel administrador
│   │   ├── users/       # Gestión de empleados
│   │   ├── projects/    # Gestión de proyectos/obras
│   │   ├── absences/    # Gestión de ausencias
│   │   ├── reports/     # Informes y exportación
│   │   ├── audit-logs/  # Logs de auditoría
│   │   └── security/    # IPs bloqueadas
│   ├── dashboard/       # Panel empleado
│   ├── api/             # API Routes
│   └── globals.css      # Estilos globales
├── components/          # Componentes reutilizables
├── lib/
│   ├── db.js           # Conexión Turso + inicialización
│   ├── auth.js         # Gestión de sesiones JWT
│   ├── audit.js        # Logs de auditoría
│   ├── notifications.js # Sistema de notificaciones
│   └── rateLimit.js    # Rate limiting de login
└── middleware.js        # Protección de rutas
```

## 🎨 Modo Claro/Oscuro

La aplicación incluye un toggle de tema (icono sol/luna) que permite alternar entre modo claro y oscuro. La preferencia se guarda en localStorage.

## 📋 Flujo de Imputación Manual

1. El empleado accede a "Imputar Jornada"
2. Rellena fecha, horas, proyecto y **justificación obligatoria**
3. Se crea un registro en `audit_logs` con timestamp del servidor
4. El fichaje queda en estado "Pendiente de Validación"
5. El admin recibe notificación y puede aprobar/rechazar
6. El empleado recibe notificación del resultado
7. Todo queda registrado para la Inspección de Trabajo

## � Despliegue

El proyecto está configurado para despliegue automático:

1. **Push a GitHub** → Vercel detecta cambios automáticamente
2. **Build** → Vercel compila el proyecto
3. **Deploy** → Cambios disponibles en ~30-60 segundos

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

## 📄 Licencia

Uso privado / Proyecto interno

---

Desarrollado con ❤️ para gestionar el control horario de forma sencilla y legal.
