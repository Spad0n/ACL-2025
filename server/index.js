import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as routes from './route.js';
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";


dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 6969;

app.use(cookieParser());
app.use(routes.authenticate);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/favicon.ico', express.static('../public/favicon.ico'));

app.set("views", fileURLToPath(new URL("../views", import.meta.url)));
app.set("view engine", "ejs");

app.get('/hello', (_req, res) => {
    res.json("Hello from json");
});

app.get('/', (req, res) => {
    console.log(req.cookies.accessToken);
    if (req.cookies.accessToken !== undefined) {
	app.use(express.static(path.join(__dirname, '../dist')));
	res.sendFile(path.join(__dirname, "../dist/index.html"));
    } else {
	res.redirect("/login");
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('accessToken', {
	httpOnly: true,
	secure: true,
    });
    res.redirect("/login");
});

app.get('/login', (req, res) => {
    const message = req.query.message;
    res.render('login', { message });
});

app.get("/register", routes.getAccountCreationPage);

app.post("/account/new", routes.createAccount);

app.post("/logUser", routes.login);

// TODO: à modifier pour la base de donnée
// NOTE: peut etre recevoir uniquement l'id et recuperer le reste depuis la base de donnée
app.get('/dialog/event-form', (req, res) => {
    const { action, date, id, title, description, color, start, end } = req.query;

    const model = {
        action: action, // 'add' ou 'edit'
        date: date, 
        event: {
            id: id || null,
            title: title || '',
            description: description || '',
            start: start || null,
            end: end || null,
	    color: color ? parseInt(color, 10) : 0xff0000
        }
    };
    res.render('dialog', model);
});

// TODO: à modifier pour la base de donnée
app.post('/events', (req, res) => {
    const { id, title, description, color, start, end } = req.body;

    const startDate = new Date(start);
    const endDate = new Date(end);

    const savedEvent = {
        // Si l'ID existe, on le garde (édition), sinon on en génère un nouveau (ajout)
        id: id || `evt_${Date.now()}`, 
        title: title,
        description: description,
        color: parseInt(color.substring(1), 16),
        start: startDate.toISOString(),
        end: endDate.toISOString()
    };

    console.log('Événement sauvegardé côté serveur:', savedEvent);

    // On envoie l'événement complet (avec start/end) au client via l'en-tête HX-Trigger
    res.set('HX-Trigger', JSON.stringify({ 'eventSaved': savedEvent }));

    // On renvoie une réponse vide pour que htmx vide le #dialog-container
    res.send('');
});

app.listen(PORT, (_err) => {
    console.log(`Serveur lancé sur https://localhost:${PORT}`);
});
