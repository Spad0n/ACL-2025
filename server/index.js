import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 6969;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.get('/hello', (_req, res) => {
    res.json("Hello from json");
})

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, (_err) => {
    console.log(`Serveur lancé sur https://localhost:${PORT}`);
});
