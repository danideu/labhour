# Guía para Enseñar el Proyecto al Cliente

Si tu objetivo es que el cliente lo pruebe **YA** sin complicaciones, tienes dos opciones:

## OPCIÓN A: Túnel Local (Ngrok) - ✅ La más rápida y fácil
Esta opción expone tu ordenador local a internet temporalmente. No tienes que subir nada a ningún servidor. La web corre en tu Mac, pero el cliente accede desde una URL pública (ej. `https://labhour-demo.ngrok.app`).

1.  **Instalar Ngrok** (si no lo tienes):
    - Ve a [ngrok.com](https://ngrok.com) y crea una cuenta gratuita.
    - Sigue las instrucciones para instalarlo en tu Mac.
2.  **Arrancar tu web**:
    - En tu terminal del proyecto: `npm run dev` (asegúrate que está en puerto 3000).
3.  **Crear el túnel**:
    - Abre otra terminal y escribe:
      ```bash
      ngrok http 3000
      ```
4.  **Enviar link**:
    - Ngrok te dará una URL (ej. `https://random-name.ngrok-free.app`).
    - Pásasela al cliente. Él verá lo que tú tienes en pantalla.
    - **Nota**: Si apagas tu ordenador o la terminal, la web se cae.

---

## OPCIÓN B: Hosting Compartido (cPanel) - ⚠️ Difícil
La mayoría de hostings compartidos (como el 90% del mercado) están optimizados para **PHP** (WordPress). Tu web usa **Node.js**.

**Requisitos OBLIGATORIOS del hosting:**
1.  Debe tener la opción **"Setup Node.js App"** (o "Node.js Selector") en el cPanel.
2.  Debe permitir compilar binarios (necesario para la base de datos `better-sqlite3`).

**Pasos (Si tu hosting cumple los requisitos):**
1.  **Subir archivos**: Sube todo el proyecto EXCEPTO `node_modules` y `.next` al administrador de archivos (carpeta `public_html/labhour` o similar).
2.  **Crear App Node.js**:
    - Ve al cPanel -> "Setup Node.js App".
    - Crea una nueva aplicación.
    - Elige Node.js 18 o 20.
    - "Application Root": La carpeta donde subiste los archivos.
    - "Application Startup File": `server.js` (Tendrás que crear uno pequeño para arrancar Next, ver abajo).
3.  **Instalar dependencias**:
    - Entra por SSH al hosting (o usa el botón "Run NPM Install" del cPanel si existe).
    - Ejecuta `npm install`. **AQUÍ ES DONDE SUELE FALLAR** en hostings baratos porque no dejan compilar SQLite.
4.  **Si funciona**: Tu web estará online.

**Archivo `server.js` necesario para cPanel (Custom Server):**
Next.js en cPanel a menudo requiere un servidor personalizado. Tendrías que crear este archivo en la raíz:
```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
```

### Resumen
- Si quieres enseñar avances hoy: **Usa Ngrok**.
- Si quieres dejarlo online días: **Usa un VPS barato (4€)** siguiendo la guía anterior (`GUIA_DESPLIEGUE.md`), o prueba suerte con el cPanel si tiene soporte Node.js.
