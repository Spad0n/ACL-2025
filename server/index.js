import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as routes from './route.js';
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import {
    bdd,
    recupEvenement,
    ajouterEvenement,
    retournerContenuTableEvenement,
    modifierEvenement, supprimerEvenement
} from './fonctionsBdd.js';


dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Récupération de tous les événements depuis la BDD
app.get('/events', async (_req, res) => {
    try {
        const events = await recupEvenement(bdd); 
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Affichage du dialogue de création/édition
app.get('/dialog/event-form', (req, res) => {
    const { action, date, id, title, description, color, start, end } = req.query;

    console.log(req.query);

    const model = {
        action: action, // 'add' ou 'edit'
        event: {
            id: id || null,
            title: title || '',
            description: description || '',
            start: start || null,
            end: end || null,
            couleur: color ? parseInt(color, 10) : 0xff0000
        }
    };
    res.render('dialog', model);
});

app.post('/events', (req, res) => {
    const { id, title, description, color, start, end } = req.body;

    console.log(id)

    const startDate = new Date(start);
    const endDate = new Date(end);

    const savedEvent = {
        title: title,
        description: description,
        color: parseInt(color.substring(1), 16),
        start: startDate.toISOString(),
        end: endDate.toISOString()
    };



    // On ajoute dans la base
    if (!id) {
        ajouterEvenement(bdd, savedEvent, (err, lastID) => {
            if (err) {
                res.status(500).send('Erreur côté serveur');
                return;
            }

            savedEvent.id = lastID.toString();
            res.set('HX-Trigger', JSON.stringify({eventSaved: savedEvent}));
            res.send('');
        });
    }
    else {
        modifierEvenement(bdd, { id, ...savedEvent }, (err) => {
            if (err) {
                res.status(500).send('Erreur côté serveur');
                return;
            }

            savedEvent.id = id;
            res.set('HX-Trigger', JSON.stringify({eventSaved: savedEvent}));
            res.send('');
        });
    }
});

app.post('/events/delete', (req, res) => {
    const { id } = req.body;
    supprimerEvenement(bdd, id, (err) => {
        if (err) {
            res.status(500).send('Erreur côté serveur');
            return;
        }

        res.set('HX-Trigger', JSON.stringify({eventDeleted: id}));
        res.send('');
    }
    );
});


app.listen(PORT, (_err) => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
