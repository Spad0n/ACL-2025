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

app.get('/dialog/event-form', (req, res) => {
    const {action, date, id, title, description, color} = req.query;
    const model = {
	action: action, // add ou edit
	date: date,
	event: {
	    id: id || null,
	    title: title || '',
	    description: description || '',
	    color: color ? "#" + ('000000' + parseInt(color).toString(16)).slice(-6) : "#ff0000",
	}
    };
    res.render('dialog', model)
});

app.post('/events', (req, res) => {
    const { id, date, title, description, color } = req.body;

    const parsedDate = new Date(date);

    const savedEvent = {
        // Si l'ID existe, on le garde (édition), sinon on en génère un nouveau (ajout)
        id: id || `evt_${Date.now()}`, 
        title: title,
        description: description,
        // On convertit la couleur hex (#RRGGBB) en nombre (0xRRGGBB) pour PixiJS
        color: parseInt(color.substring(1), 16),
        day: parsedDate.getDate(),
        month: parsedDate.getMonth(),
        year: parsedDate.getFullYear()
    };

    console.log('Événement sauvegardé côté serveur:', savedEvent);

    // 3. On envoie l'événement au client via l'en-tête HX-Trigger
    // La clé est le nom de l'événement ('eventSaved'), la valeur est la donnée.
    res.set('HX-Trigger', JSON.stringify({ 'eventSaved': savedEvent }));

    // 4. On renvoie une réponse vide pour que htmx vide le #dialog-container (grâce à innerHTML)
    res.send('');
});

app.listen(PORT, (_err) => {
    console.log(`Serveur lancé sur https://localhost:${PORT}`);
});
