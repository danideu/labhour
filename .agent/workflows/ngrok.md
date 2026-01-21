---
description: Setup and run Ngrok to share localhost
---

# Configuración y Ejecución de Ngrok

Este flujo de trabajo te ayudará a instalar Ngrok y compartir tu servidor local (puerto 3000) con el mundo.

1.  **Instalar Ngrok** (si no lo tienes)
    Ejecuta el siguiente comando para instalarlo usando Homebrew (recomendado en Mac):
    ```bash
    brew install ngrok/ngrok/ngrok
    ```
    *Si no tienes Homebrew, puedes descargarlo de [ngrok.com/download](https://ngrok.com/download).*

2.  **Autenticación** (Necesaria una sola vez)
    Ngrok ahora requiere una cuenta gratuita.
    - Ve a [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
    - Copia tu "Authtoken".
    - Ejecuta el comando (sustituye `TU_TOKEN` por el que copiaste):
    ```bash
    ngrok config add-authtoken TU_TOKEN
    ```

3.  **Lanzar el Túnel**
    Una vez instalado y configurado, este comando expondrá tu puerto 3000 a internet.
    ```bash
    ngrok http 3000
    ```

4.  **Ver el Resultado**
    - Ngrok te mostrará una URL tipo `https://xxxx-xxxx.ngrok-free.app`
    - Copia esa URL y envíasela a tu cliente.
    - **IMPORTANTE**: Mantén la terminal abierta. Si la cierras, la web deja de funcionar.
