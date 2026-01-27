# Guía de Despliegue en Vercel

Esta guía te explica paso a paso cómo desplegar la aplicación de fichaje en Vercel.

## Requisitos Previos

- Cuenta de GitHub (gratis)
- Cuenta de Vercel (gratis, puedes registrarte con GitHub)
- Tu código subido a GitHub

---

## Paso 1: Subir código a GitHub

Si aún no tienes el código en GitHub:

1. Crea un repositorio en [github.com/new](https://github.com/new)
2. Ejecuta estos comandos en la terminal:

```bash
cd "/Users/danideu/Documents/PROYECTOS MAC/TOMAS FICHAJE/WEB"
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

---

## Paso 2: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Click en **"Add New..."** → **"Project"**
3. Selecciona tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Next.js

---

## Paso 3: Configurar Variables de Entorno

**IMPORTANTE**: Este paso es crítico. Sin las variables, la aplicación no funcionará.

En la pantalla de configuración de Vercel, añade estas variables:

| Variable | Valor |
|----------|-------|
| `TURSO_DATABASE_URL` | `libsql://labhour-danideu.aws-eu-west-1.turso.io` |
| `TURSO_AUTH_TOKEN` | Tu token de Turso (el largo que empieza por `eyJ...`) |

Para añadirlas:
1. Expande la sección **"Environment Variables"**
2. Escribe el nombre de la variable
3. Pega el valor
4. Click en **"Add"**
5. Repite para cada variable

---

## Paso 4: Desplegar

1. Click en **"Deploy"**
2. Espera 1-2 minutos mientras Vercel compila
3. ¡Listo! Tendrás una URL como `tu-proyecto.vercel.app`

---

## Verificación

Después del despliegue:

1. Abre la URL que te da Vercel
2. Inicia sesión con:
   - **Email**: `admin@empresa.com`
   - **Password**: `admin123`
3. Verifica que puedes ver el dashboard

---

## Dominio Personalizado (Opcional)

Si quieres usar un dominio propio (ej: `fichaje.tuempresa.com`):

1. Ve a la configuración del proyecto en Vercel
2. Click en **"Domains"**
3. Añade tu dominio
4. Sigue las instrucciones para configurar DNS

---

## Solución de Problemas

### "Error 500" al cargar la página
- Verifica que las variables de entorno estén configuradas correctamente
- Revisa los logs en Vercel: Proyecto → **Deployments** → Click en el más reciente → **Logs**

### "Internal Server Error" al hacer login
- El token de Turso puede haber expirado
- Genera uno nuevo en [turso.tech](https://turso.tech) y actualiza la variable en Vercel

### Actualizar la aplicación
- Simplemente haz `git push` a tu repositorio
- Vercel detectará los cambios y desplegará automáticamente

---

## Resumen de URLs Importantes

- **Panel de Vercel**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Panel de Turso**: [turso.tech/app](https://turso.tech/app)
- **Tu aplicación**: `[nombre-proyecto].vercel.app`
