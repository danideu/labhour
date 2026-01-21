# Guía de Despliegue (Deployment) - LabHour

Dado que tu aplicación utiliza **SQLite** (`better-sqlite3`), necesitas un alojamiento que tenga un **sistema de archivos persistente**.
**❌ NO RECOMENDADO**: Vercel, Netlify o Cloudflare Pages (sin configuración extra), ya que borrarán tu base de datos con cada despliegue.
**✅ RECOMENDADO**: Un servidor VPS (DigitalOcean, Hetzner, AWS EC2, OVH) o un servicio con discos persistentes (Railway con Volume, Render con Disk).

Aquí tienes los pasos para un **VPS (servidor Linux ubuntu/debian)**, que es la opción más común y económica.

## 1. Preparar el Servidor
Accede a tu servidor por SSH e instala Node.js (versión 18 o superior).
```bash
# Instalar Node.js (si no lo tienes)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 (Gestor de procesos para mantener la app viva)
sudo npm install -g pm2
```

## 2. Clonar el Proyecto
```bash
# Ve a tu carpeta web (ejemplo)
cd /var/www

# Clona tu repositorio (te pedirá usuario/token si es privado)
git clone https://github.com/danideu/labhour.git
cd labhour
```

## 3. Instalar y Construir
```bash
# Instalar dependencias
npm install

# Construir la aplicación para producción
npm run build
```

## 4. Iniciar la Aplicación
Usaremos PM2 para que la app se reinicie si se cae o si el servidor se reinicia.
```bash
# Iniciar app en el puerto 3000
pm2 start npm --name "labhour" -- start

# Guardar la lista de procesos para que arranquen al inicio
pm2 save
pm2 startup
```

## 5. Configurar Cron (Notificaciones Automáticas)
Para que las notificaciones funcionen, necesitas configurar el cron del sistema para llamar a tu endpoint cada día laborable a las 08:05.

```bash
# Editar crontab
crontab -e
```
Añade esta línea al final del archivo:
```cron
# Ejecutar de Lunes a Viernes (1-5) a las 08:05 AM
05 08 * * 1-5 curl http://localhost:3000/api/cron/check-missing-clock-ins >> /var/log/labhour-cron.log 2>&1
```

## 6. (Opcional pero recomendado) Nginx como Proxy Inverso
Para acceder usando tu dominio (ej. `midominio.com`) en lugar de `ip:3000`.

1. Instalar Nginx: `sudo apt install nginx`
2. Crear config: `sudo nano /etc/nginx/sites-available/labhour`
```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
3. Activar y reiniciar:
```bash
sudo ln -s /etc/nginx/sites-available/labhour /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
