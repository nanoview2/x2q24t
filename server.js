const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Configuración de GitHub
const GITHUB_TOKEN = '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';
const GITHUB_OWNER = 'nanoview2';
const GITHUB_REPO = 'x2q24t';
const GITHUB_BRANCH = 'main';

// Rutas a los ejecutables locales
const YT_DLP_PATH = path.join(__dirname, 'deps', 'yt-dlp.exe');
const FFMPEG_PATH = path.join(__dirname, 'deps', 'ffmpeg-master-latest-win64-gpl-shared', 'bin', 'ffmpeg.exe');

// Crear carpeta para descargas temporales
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR);
}

// Función para subir archivo a GitHub
function uploadToGitHub(filePath, fileName) {
    return new Promise((resolve, reject) => {
        const content = fs.readFileSync(filePath);
        const base64Content = content.toString('base64');

        const data = JSON.stringify({
            message: `Upload audio: ${fileName}`,
            content: base64Content,
            branch: GITHUB_BRANCH
        });

        const options = {
            hostname: 'api.github.com',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fileName}`,
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'User-Agent': 'YouTube-Audio-Downloader',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 201) {
                    const response = JSON.parse(body);
                    resolve(response.content.html_url);
                } else if (res.statusCode === 422) {
                    // El archivo ya existe, intentar actualizar
                    updateFileOnGitHub(filePath, fileName).then(resolve).catch(reject);
                } else {
                    reject(new Error(`GitHub API error: ${res.statusCode} - ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Función para actualizar archivo existente en GitHub
function updateFileOnGitHub(filePath, fileName) {
    return new Promise((resolve, reject) => {
        // Primero obtener el SHA del archivo existente
        const getOptions = {
            hostname: 'api.github.com',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fileName}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'User-Agent': 'YouTube-Audio-Downloader',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        https.request(getOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                const existing = JSON.parse(body);
                const content = fs.readFileSync(filePath);
                const base64Content = content.toString('base64');

                const data = JSON.stringify({
                    message: `Update audio: ${fileName}`,
                    content: base64Content,
                    sha: existing.sha,
                    branch: GITHUB_BRANCH
                });

                const putOptions = {
                    hostname: 'api.github.com',
                    path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fileName}`,
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'User-Agent': 'YouTube-Audio-Downloader',
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                        'Content-Length': data.length
                    }
                };

                const req = https.request(putOptions, (res) => {
                    let body = '';
                    res.on('data', (chunk) => body += chunk);
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            const response = JSON.parse(body);
                            resolve(response.content.html_url);
                        } else {
                            reject(new Error(`GitHub API error: ${res.statusCode} - ${body}`));
                        }
                    });
                });

                req.on('error', reject);
                req.write(data);
                req.end();
            });
        }).end();
    });
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

        // Subir archivo a GitHub
        console.log(`📤 Subiendo a GitHub: ${videoId}.m4a`);
        uploadToGitHub(outputFile, `${videoId}.m4a`)
            .then((githubUrl) => {
                console.log(`✅ Archivo subido a GitHub: ${githubUrl}`);

                // Agregar el link de CDN como header
                const cdnLink = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}/${videoId}.m4a`;
                res.setHeader('X-CDN-Link', cdnLink);

                // Enviar el archivo al usuario
                res.download(outputFile, `${videoId}.m4a`, (err) => {
                    // Limpiar archivo después de enviar
                    if (fs.existsSync(outputFile)) {
                        fs.unlinkSync(outputFile);
                    }

                    if (err) {
                        console.error(`Error al enviar archivo: ${err.message}`);
                    }
                });
            })
            .catch((githubError) => {
                console.error(`⚠️  Error al subir a GitHub: ${githubError.message}`);
                // Aún así enviar el archivo al usuario
                res.download(outputFile, `${videoId}.m4a`, (err) => {
                    if (fs.existsSync(outputFile)) {
                        fs.unlinkSync(outputFile);
                    }

                    if (err) {
                        console.error(`Error al enviar archivo: ${err.message}`);
                    }
                });
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
