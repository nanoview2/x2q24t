# YouTube Audio Downloader

Herramienta simple para descargar audio de YouTube en formato **M4A AAC 64kbps** - ideal para proyectos web.

## 🎯 Características

- Descarga audio de YouTube en formato M4A
- Codec AAC con bitrate de 64kbps (optimizado para web)
- Interfaz web simple y fácil de usar
- Acepta ID de video o URL completa de YouTube
- **✅ Incluye todas las dependencias necesarias (yt-dlp y ffmpeg)**

## 📋 Requisitos Previos

Solo necesitas tener Node.js instalado (versión 14 o superior).
Descarga desde: https://nodejs.org/

**✅ yt-dlp y ffmpeg ya están incluidos en la carpeta `deps/`**

## 🚀 Instalación y Uso

### 1. Instala las dependencias de Node.js
```cmd
npm install
```

### 2. Inicia el servidor
```cmd
npm start
```

El servidor se ejecutará en `http://localhost:3001`

### 3. Abre la interfaz web
Abre el archivo `index.html` en tu navegador favorito, o accede a:
```
file:///C:/Development/Web/youtube-audio-downloader/index.html
```

### 4. Descarga audio
1. Pega el ID del video o la URL completa de YouTube
2. Haz clic en "Descargar Audio"
3. El archivo se descargará automáticamente como `{videoId}.m4a`

## 📝 Ejemplos de Uso

### URLs aceptadas:
- `dQw4w9WgXcQ` (solo el ID)
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ`
- `https://www.youtube.com/embed/dQw4w9WgXcQ`

## 🎵 Especificaciones del Audio

- **Formato:** M4A (MPEG-4 Audio)
- **Codec:** AAC (Advanced Audio Coding)
- **Bitrate:** 64 kbps
- **Uso:** Optimizado para música de fondo en páginas web

## 📁 Estructura de Archivos

```
youtube-audio-downloader/
├── index.html          # Interfaz web
├── server.js           # Servidor Node.js
├── package.json        # Configuración del proyecto
├── .gitignore          # Archivos ignorados por Git
├── README.md           # Este archivo
├── deps/               # Dependencias incluidas
│   ├── yt-dlp.exe      # yt-dlp para Windows
│   └── ffmpeg-master-latest-win64-gpl-shared/
│       └── bin/
│           └── ffmpeg.exe
└── downloads/          # Carpeta temporal (se crea automáticamente)
```

## 🔧 Verificar Instalación

Para verificar que todo está instalado correctamente:

```cmd
# Verificar Node.js (requerido)
node --version

# yt-dlp y ffmpeg ya están incluidos en deps/
```

## ⚠️ Notas Importantes

1. Los archivos se descargan temporalmente en la carpeta `downloads/` y se eliminan después de la descarga
2. Asegúrate de tener conexión a internet
3. Respeta los derechos de autor al descargar contenido
4. La calidad del audio depende de la disponibilidad en YouTube
5. **yt-dlp y ffmpeg están incluidos en la carpeta `deps/` - no necesitas instalarlos**

## 🐛 Solución de Problemas

### El servidor no inicia
- Asegúrate de tener las dependencias instaladas: `npm install`
- Verifica que el puerto 3001 no esté en uso

### Error de CORS
- Asegúrate de abrir `index.html` directamente en el navegador
- El servidor ya tiene CORS habilitado

## 💡 Consejos

- El formato M4A con 64kbps es perfecto para música de fondo web (buen equilibrio entre calidad y tamaño)
- Puedes modificar el bitrate en `server.js` si necesitas mayor calidad (línea 31)
- Para descargar múltiples videos, simplemente repite el proceso

## 🛠️ Personalización

### Cambiar el puerto del servidor
Edita `server.js` línea 8:
```javascript
const PORT = 3001; // Cambia este número
```

### Cambiar la calidad del audio
Edita `server.js` línea 31:
```javascript
// Cambiar 64K a 128K para mayor calidad
--audio-quality 128K --postprocessor-args "ffmpeg:-c:a aac -b:a 128k"
```

## 📞 Soporte

Si tienes problemas, verifica:
1. Que yt-dlp y ffmpeg estén instalados y en el PATH
2. Que el servidor Node.js esté ejecutándose (`npm start`)
3. Que no haya errores en la consola del navegador (F12)
4. Que el ID/URL del video sea válido

---

**Proyecto independiente:** youtube-audio-downloader  
**Fecha:** Octubre 2025  
**Licencia:** MIT
