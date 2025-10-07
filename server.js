const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Rutas a los ejecutables locales
const YT_DLP_PATH = path.join(__dirname, 'deps', 'yt-dlp.exe');
const FFMPEG_PATH = path.join(__dirname, 'deps', 'ffmpeg-master-latest-win64-gpl-shared', 'bin', 'ffmpeg.exe');

// Crear carpeta para descargas temporales
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR);
}

app.post('/download', async (req, res) => {
    const { videoId } = req.body;

    if (!videoId) {
        return res.status(400).json({ error: 'ID de video requerido' });
    }

    const outputFile = path.join(DOWNLOADS_DIR, `${videoId}.m4a`);
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    // Comando yt-dlp con las especificaciones exactas usando las rutas locales
    const command = `"${YT_DLP_PATH}" -f "bestaudio[ext=m4a]" --extract-audio --audio-format m4a --audio-quality 64K --ffmpeg-location "${FFMPEG_PATH}" --postprocessor-args "ffmpeg:-c:a aac -b:a 64k" -o "${outputFile}" "${url}"`;

    console.log(`Descargando: ${videoId}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            console.error(`stderr: ${stderr}`);
            
            // Limpiar archivo si existe
            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }
            
            return res.status(500).json({ 
                error: 'Error al descargar el audio. Verifica que yt-dlp y ffmpeg estén instalados correctamente.',
                details: error.message
            });
        }

        console.log(`Descarga completada: ${videoId}`);

        // Verificar que el archivo existe
        if (!fs.existsSync(outputFile)) {
            return res.status(500).json({ error: 'El archivo no se generó correctamente' });
        }

        // Enviar el archivo
        res.download(outputFile, `${videoId}.m4a`, (err) => {
            // Limpiar archivo después de enviar
            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }

            if (err) {
                console.error(`Error al enviar archivo: ${err.message}`);
            }
        });
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor de descarga de YouTube funcionando' });
});

app.listen(PORT, () => {
    console.log(`🎵 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📁 Archivos temporales en: ${DOWNLOADS_DIR}`);
    console.log(`\n✅ Usando ejecutables locales:`);
    console.log(`   - yt-dlp: ${YT_DLP_PATH}`);
    console.log(`   - ffmpeg: ${FFMPEG_PATH}`);
    console.log(`\n🌐 Abre index.html en tu navegador`);
});
