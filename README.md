# LabHour - Sistema de Control Horario

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)

Sistema de control horario y gestión de jornadas laborales diseñado para cumplir con la normativa laboral española. Especialmente orientado al sector de la construcción con soporte para múltiples obras/proyectos.

## 🚀 Características

### Para Empleados
- **Fichaje en tiempo real** - Clock in/out con selector de proyecto/obra
- **Historial de jornadas** - Consulta de todos los fichajes con filtros
- **Imputación manual** - Registro de jornadas retroactivas con justificación obligatoria
- **Gestión de ausencias** - Solicitudes de vacaciones, bajas, permisos

### Para Administradores
- **Dashboard en tiempo real** - Métricas, gráficas y actividad en vivo
- **Validación de horas manuales** - Aprobar/rechazar imputaciones con comentarios
- **Gestión de empleados y proyectos** - CRUD completo
- **Sistema de recordatorios** - Avisos a empleados que no han fichado
- **Logs de auditoría** - Registro inmutable para Inspección de Trabajo
- **Informes y exportación CSV**

### Cumplimiento Normativo
- ✅ Etiquetado permanente de fichajes manuales vs automáticos
- ✅ Timestamp del servidor (inmutable)
- ✅ Auditoría completa con IP, dispositivo y justificación
- ✅ Conservación mínima 4 años
- ✅ Consulta telemática instantánea

## 📦 Tecnologías

- **Frontend**: Next.js 15, React 19, Tailwind CSS 3
- **Backend**: Next.js API Routes
- **Base de datos**: SQLite (better-sqlite3)
- **Autenticación**: JWT con jose

## 🛠️ Instalación

```bash
# Clonar repositorio
git clone <url-del-repo>
cd WEB

# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### Usuario Admin por defecto
- **Email**: admin@empresa.com
- **Contraseña**: admin123

## 📁 Estructura del Proyecto

```
├── app/
│   ├── admin/          # Páginas del panel administrador
│   ├── dashboard/      # Páginas del panel empleado
│   ├── api/            # API Routes
│   └── globals.css     # Estilos globales con variables CSS
├── components/         # Componentes reutilizables
├── lib/                # Utilidades (auth, db, audit, notifications)
├── database.sqlite     # Base de datos SQLite
└── middleware.js       # Protección de rutas
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

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración configurable
- Middleware de protección por rol
- Logs de auditoría inmutables

## 📄 Licencia

Uso privado / Proyecto interno

---

Desarrollado con ❤️ para gestionar el control horario de forma sencilla y legal.
