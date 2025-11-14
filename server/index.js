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
    modifierEvenement, supprimerEvenement,
    recupAgendaUtilisateurConnecte, 
    recupUtilisateurID, 
    ajouterAgendasPartages
} from './fonctionsBdd.js';
import { tr } from 'date-fns/locale';


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
        const tokkensSigne = req.cookies.accessToken;
        try{    
            const tokkenSansSigne = jwt.verify(tokkensSigne, process.env.SECRET);
            ajouterEvenement(bdd,tokkenSansSigne.username, savedEvent, (err, lastID) => {
                if (err) {
                    res.status(500).send('Erreur côté serveur');
                    return;
                }
            savedEvent.id = lastID.toString();
            res.set('HX-Trigger', JSON.stringify({eventSaved: savedEvent}));
            res.send('');
            });
        }
        catch(err){
            console.error(err);
        }
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

app.get("/agendas", async(req, res) => {
    try{
        const tokkensSigne = req.cookies.accessToken;
        const tokkenSansSigne = jwt.verify(tokkensSigne, process.env.SECRET);
        const username = tokkenSansSigne.username;
        
        if(!username){
            return res.status(401).json({error: "Aucin Utilisateur n'est connecté "});
        }

        const id_utilisateurRows = await recupUtilisateurID(bdd, username);
        if(id_utilisateurRows.length === 0){
            return res.status(404).json({error: "Utilisateur introuvable"});
        }

        const id_utilisateur = id_utilisateurRows[0].id;
        const agendas = await recupAgendaUtilisateurConnecte(bdd, id_utilisateur);
        res.json(agendas);
    }
    catch(err){
        console.log(err);
        res.status(500).json({ error: err.message});
    }
});

app.post("/agendas/partage", async (req, res) => {
    const tokenSigne = req.cookies.accessToken;

    let token;
    try {
        token = jwt.verify(tokenSigne, process.env.SECRET);
    } catch (err) {
        return res.status(401).json({ error: "Token invalide" });
    }

    const username = token.username;
    const { id_agenda, username: usernameAquiPartage } = req.body;

    try {
        const id_utilisateurRows = await recupUtilisateurID(bdd, username);

        if (id_utilisateurRows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        const id_utilisateur = id_utilisateurRows[0].id;

        const agendas = await recupAgendaUtilisateurConnecte(bdd, id_utilisateur);

        if (!agendas.find(a => a.id.toString() === id_agenda)) {
            return res.status(403).json({ error: "Agenda pas accessible" });
        }

        const idUsuarioPartage = await recupUtilisateurID(bdd, usernameAquiPartage);

        if (idUsuarioPartage.length === 0) {
            return res.status(404).json({ error: "Utilisateur à partager introuvable" });
        }

        const id_utilisateurAquiPartage = idUsuarioPartage[0].id;

        await ajouterAgendasPartages(
            bdd,
            id_agenda,
            id_utilisateur,
            id_utilisateurAquiPartage
        );

        return res.json({ success: true });

    } catch (err) {
        console.error("Erreur serveur :", err);
        return res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, (_err) => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
