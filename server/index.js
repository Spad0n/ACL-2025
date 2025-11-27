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
    ajouterAgendasPartages,
    recupEvenementAgenda, 
    recupUtilisateur,
    ajouterAgenda,
    supprimerAgenda,
    renommerAgenda,
    recupTousAgendas,
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
    if (req.cookies.accessToken !== undefined) {
        console.log('SERVEUR log : token de la session :', req.cookies.accessToken);
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


app.get('/events', async (req, res) => {
    const tokenSigne = req.cookies.accessToken;
    let token;
    try {
        token = jwt.verify(tokenSigne, process.env.SECRET);
    } catch(err) {
        return res.status(401).json({ error: "Token invalide" });
    }

    const username = token.username;
    const id_utilisateurRows = await recupUtilisateurID(bdd, username);
    const id_utilisateur = id_utilisateurRows[0].id;

    const sql = `SELECT e.* FROM evenements e
                JOIN agendas a ON e.id_agenda = a.id
                LEFT JOIN agendaspartage ap ON a.id = ap.id_agenda
                WHERE a.id_utilisateur = ? OR ap.id_user2 = ?`;
    const evenements = await new Promise((res, rej) => {
        bdd.all(sql, [id_utilisateur, id_utilisateur], (err, rows) => {
            if(err){ 
                rej(err)
            }
            else{
                res(rows);
            }
        });
    });  
    res.json(evenements);
});


// Affichage du dialogue de création/édition
app.get('/dialog/event-form', async (req, res) => {
    try {
        const { action, date, id, title, description, color, start, end } = req.query;

        const token = req.cookies.accessToken;
        if (!token) return res.status(401).send("Utilisateur non connecté");

        const decoded = jwt.verify(token, process.env.SECRET);
        const username = decoded.username;

        const id_utilisateurRows = await recupUtilisateurID(bdd, username);
        if (!id_utilisateurRows.length) return res.status(404).send("Utilisateur introuvable");

        const id_utilisateur = id_utilisateurRows[0].id;

        const agendas = await recupTousAgendas(bdd, id_utilisateur);

        const model = {
            action,
            event: {
                id: id || null,
                title: title || '',
                description: description || '',
                start: start || null,
                end: end || null,
                color: color ? parseInt(color, 10) : 0xff0000,
                id_agenda: null 
            },
            agendas
        };

        res.render('dialog', model);

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
});


app.post('/events', (req, res) => {
    const { id, title, description, color, start, end, id_agenda } = req.body;

    const startDate = new Date(start);
    const endDate = new Date(end);

    const savedEvent = {
        title: title,
        description: description,
        color: parseInt(color.substring(1), 16),
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        id_agenda: parseInt(id_agenda, 10)
    };

    // On ajoute dans la base
    if (!id) {
        const tokkensSigne = req.cookies.accessToken;
        try{    
            const tokkenSansSigne = jwt.verify(tokkensSigne, process.env.SECRET);
            ajouterEvenement(bdd, tokkenSansSigne.username, savedEvent, (err, lastID) => {
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

app.get('/dialog/category-form', (req, res) => {
    const { action, name, color } = req.query;

    // Valeurs par défaut
    const model = {
        action: action || 'add', // 'add' ou 'edit'
        category: {
            // Si on édite, on pré-remplit, sinon vide
            name: name || '',
            // Si on édite, on prend la couleur, sinon bleu par défaut
            // Note: Si 'color' arrive en int depuis le client, il faudra le gérer, 
            // mais ici pour un 'add', c'est le défaut qui compte.
            color: color || '#4285F4' 
        }
    };

    res.render('category_form', model);
});

app.post("/categories/delete", async (req, res) => {
    try {
        const { id, name } = req.body;
        
        // Vérification sécurité token
        const tokenSigne = req.cookies.accessToken;
        const tokkenSansSigne = jwt.verify(tokenSigne, process.env.SECRET);
        const username = tokkenSansSigne.username;

        const id_utilisateurRows = await recupUtilisateurID(bdd, username);
        const id_utilisateur = id_utilisateurRows[0].id;

        // Sécurité : Vérifier que l'agenda appartient bien à l'utilisateur
        // et que ce n'est pas "Default"
        const agendas = await recupAgendaUtilisateurConnecte(bdd, id_utilisateur);
        const targetAgenda = agendas.find(a => a.id.toString() === id.toString());

        if (!targetAgenda) {
            return res.status(404).json({ error: "Agenda introuvable" });
        }
        if (targetAgenda.nom === 'Default') {
            return res.status(403).json({ error: "Impossible de supprimer l'agenda Default" });
        }

        // Appel à la fonction BDD créée à l'étape 4
        // import { reassignerEvenementsEtSupprimerAgenda } from './fonctionsBdd.js'; (Assurez-vous de l'import en haut du fichier)
        const { reassignerEvenementsEtSupprimerAgenda } = await import('./fonctionsBdd.js'); // Ou ajoutez-le aux imports statiques en haut
        
        await reassignerEvenementsEtSupprimerAgenda(bdd, id, id_utilisateur);

        // On déclenche l'événement HTMX pour le frontend
        res.set('HX-Trigger', JSON.stringify({ categoryDeleted: name }));
        res.send(''); // Réponse vide (200 OK) car HTMX gère l'UI via le trigger

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/agendas", async(req, res) =>{
    try{
        const tokenSigne = req.cookies.accessToken;
        let token;
        try {
            token = jwt.verify(tokenSigne, process.env.SECRET);
        } catch (err) {
            return res.status(401).json({ error: "Token invalide" });
        }
        const username = token.username;
        const id = await recupUtilisateurID(bdd, username);
        if (id.length === 0) {
            return res.status(404).json({error: "Utilisateur introuvable"});
        }
        const id_utilisateur = id[0].id;

        const sql = `
            SELECT a.id, a.nom, a.couleur, a.id_utilisateur, 
            CASE WHEN ap.id_user2 IS NOT NULL THEN 1 ELSE 0 END AS shared 
            FROM agendas a 
            LEFT JOIN agendaspartage ap ON a.id = ap.id_agenda AND ap.id_user2 = ? 
            WHERE a.id_utilisateur = ? OR ap.id_user2 = ?
        `;
        const agendas = await new Promise((res, rej) => {
            bdd.all(sql, [id_utilisateur, id_utilisateur, id_utilisateur], (err, rows) => {
                if(err) return rej(err);
                res(rows.map(r => ({
                    id: r.id,
                    name: r.nom,
                    color: r.couleur, // Renvoie la couleur (Int)
                    shared: r.shared === 1
                })));
            });
        });
        res.json(agendas);
    }catch(err){
        console.error(err);
        res.status(500).json({error: err.message});
    }
})

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
        if(err.message === "Ce partage existe déjà"){
            return res.status(409).json({error: err.message});
        }
        
        console.error("Erreur serveur :", err);
        return res.status(500).json({ error: err.message });
    }
});

app.get('/recupUtilisateur', async (req, res) => {
    try{
        const tokenSigne = req.cookies.accessToken;
        let token;
        try {
            token = jwt.verify(tokenSigne, process.env.SECRET);
        } catch (err) {
            return res.status(401).json({ error: "Token invalide" });
        }
        const username = token.username;
        const utilisateur = await recupUtilisateur(bdd, username);
        res.json(utilisateur);
    } catch (err){
        res.status(500).json({ error: err.message});
    }
} )

app.get('/dialog/partage', (req, res) => {
    res.render("dialog_partage");
})


// +-------------------------------------------------------------------
// | GESTION de la fonctionalité exporter/importer un agenda
// --------------------------------------------------------------------
app.get('/importerExporter/agenda', routes.sendFrontEndAgendaUtilisateur);

app.get('/download/agenda/:agenda', (req, res) => {
    const agendaUtilisateur = req.params.agenda ;
    const chemin            = path.join(__dirname,'agendaJson',agendaUtilisateur);
    
    res.download(chemin, agendaUtilisateur, err => {
	if(err) {
	    console.error(err);
	}
    });
});

app.post('/importerExporter/agendaExporter', routes.callFrontEndExporter);

app.post('/importerExporter/agendaImporter', routes.importerAgendaUtilisateur);

// Fin exporter/importer un agenda

app.post("/agendas", async (req, res) => {
    try{
        const { nom, color } = req.body; // On récupère aussi la couleur
        if(!nom){
            return res.status(400).json({ error: "Nom de l'agenda requis" });
        }

        // Gestion de la couleur (Hex -> Int)
        let parsedColor = 0x4285F4; // Défaut
        if (color) {
            parsedColor = parseInt(color.replace('#', ''), 16);
        }

        const tokenSigne = req.cookies.accessToken;
        const tokkenSansSigne = jwt.verify(tokenSigne, process.env.SECRET);
        const username = tokkenSansSigne.username;

        const id_utilisateurRows = await recupUtilisateurID(bdd, username);
        const id_utilisateur = id_utilisateurRows[0].id;

        // On passe la couleur à la fonction BDD mise à jour
        const nouvelAgenda = await ajouterAgenda(bdd, nom, parsedColor, id_utilisateur);

        res.set('HX-Trigger', JSON.stringify({ agendaSaved: nouvelAgenda }));

        res.status(201).json(nouvelAgenda);
    } catch (err){
        console.error(err);
        res.status(500).json({ error: err.message});
    }
});

app.delete("/agendas/:id", async (req, res) => {
    try{
        const { id } = req.params;
        const tokenSigne = req.cookies.accessToken;
        const tokkenSansSigne = jwt.verify(tokenSigne, process.env.SECRET);
        const username = tokkenSansSigne.username;

        const id_utilisateurRows = await recupUtilisateurID(bdd, username);
        const id_utilisateur = id_utilisateurRows[0].id;

        const agendas = await recupAgendaUtilisateurConnecte(bdd, id_utilisateur);
        
        // On cherche l'agenda ciblé
        const targetAgenda = agendas.find(a => a.id.toString() === id);
        
        if(!targetAgenda){
            return res.status(404).json({ error: "Agenda introuvable ou non autorisé" });
        }

        if(targetAgenda.nom === 'Default') {
            return res.status(403).json({ error: "L'agenda Default ne peut pas être supprimé." });
        }

        await new Promise((resolve, reject) => {
            supprimerAgenda(bdd, id, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });

        res.status(200).json({ success: true, message: "Agenda supprimé" });
    } catch (err){
        console.error(err);
        res.status(500).json({ error: err.message});
    }
});

app.patch("/agendas/:id", async (req, res) => {
    try{
        const { id } = req.params;
        const { nom } = req.body;
        if(!nom){
            return res.status(400).json({ error: "Nouveau nom requis" });
        }

        const tokenSigne = req.cookies.accessToken;
        const tokkenSansSigne = jwt.verify(tokenSigne, process.env.SECRET);
        const username = tokkenSansSigne.username;

        const id_utilisateurRows = await recupUtilisateurID(bdd, username);
        const id_utilisateur = id_utilisateurRows[0].id;

        const agendas = await recupAgendaUtilisateurConnecte(bdd, id_utilisateur);
        const targetAgenda = agendas.find(a => a.id.toString() === id);

        if(!targetAgenda){
            return res.status(403).json({ error: "Modification non autorisée" });
        }

        // AJOUT ICI : Protection de l'agenda Default
        if(targetAgenda.nom === 'Default') {
            return res.status(403).json({ error: "L'agenda Default ne peut pas être renommé." });
        }

        await renommerAgenda(bdd, id, nom);
        res.status(200).json({ success: true, message: "Agenda renommé" });

    } catch (err){
        console.error(err);
        res.status(500).json({ error: err.message});
    }
});

//=====================================
//Modifier les informations utilisateur
//=====================================

// route pour accéder à la page de modification
app.get('/compte/modifier/utilisateur', (request, response) => {
    response.render('modifierUtilisateur');
});

// route pour l'envoie du formulaire avec les modifications
app.post('/modifier/informations/utilisateur', routes.modificationUtilisateur);

// route pour vérifier le mot de passe donné par l'utilisateur
app.post('/demande/motDePasse/utilisateur', routes.demandeMdp);

app.listen(PORT, "0.0.0.0", (_err) => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
