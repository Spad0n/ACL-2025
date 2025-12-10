"use strict";

import sqlite3pkg from "sqlite3" ;
import { createHash } from "crypto";
import { parseISO, setHours, setMinutes } from 'date-fns';
import { error } from "console";
import { th } from "date-fns/locale/th";
import { resolve } from "path";
import levenshtein from "fast-levenshtein";


const sqlite3 = sqlite3pkg.verbose();

function getSettings(dataBase, userId) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT settings FROM utilisateurs WHERE id = ?";
        dataBase.get(sql, [userId], (err, row) => {
            if (err) return reject(err);
            try {
                const settings = row && row.settings ? JSON.parse(row.settings) : {};
                resolve(settings);
            } catch (e) {
                resolve({});
            }
        });
    });
}

function saveSettings(dataBase, userId, newSettingsPart) {
    return new Promise(async (resolve, reject) => {
        try {
            const currentSettings = await getSettings(dataBase, userId);
            
            const updatedSettings = { ...currentSettings, ...newSettingsPart };
            
            const sql = "UPDATE utilisateurs SET settings = ? WHERE id = ?";
            dataBase.run(sql, [JSON.stringify(updatedSettings), userId], function(err) {
                if (err) return reject(err);
                resolve(updatedSettings);
            });
        } catch (e) {
            reject(e);
        }
    });
}

// Permet de créer la table UTILISATEURS dans le fichier bdd.db
function creerTableUtilisateur(dataBase) {
    return new Promise( (res,rej) => {
        const sql = `CREATE TABLE IF NOT EXISTS utilisateurs(id INTEGER PRIMARY KEY, username TEXT, password TEXT, language TEXT, settings TEXT DEFAULT '{}')`;
        dataBase.run(sql, (err) => {
            if (err) rej(new Error("Erreur table utilisateurs: " + err.message));
            else res("Table utilisateurs OK");
        });
    });
}

function creerTableEvenement(dataBase) {
    return new Promise( (res,rej) => {
        const sql = 'CREATE TABLE IF NOT EXISTS evenements(id INTEGER PRIMARY KEY, id_agenda INTEGER, title TEXT NOT NULL, start DATETIME NOT NULL, end DATETIME NOT NULL, description TEXT, rrule TEXT, FOREIGN KEY (id_agenda) REFERENCES agendas(id))';
        dataBase.run(sql, (err) => {
            if(err) rej(new Error("Erreur table evenements: " + err.message));
            else res("Table evenements OK");
        });
    });
}

function creerTableAgenda(dataBase) {
    return new Promise( (res,rej) => {
        // Ajout de la colonne couleur (INTEGER)
        const sql = `CREATE TABLE IF NOT EXISTS agendas(
            id INTEGER PRIMARY KEY, 
            nom TEXT NOT NULL, 
            couleur INTEGER DEFAULT 4286964, 
            id_utilisateur INTEGER, 
            FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id)
            ON DELETE CASCADE
        )`;
        dataBase.run(sql, (err) => {
            if(err) rej(new Error("Erreur table agendas: " + err.message));
            else res("Table agendas OK");
        });
    }) ;
}

function creerTableAgendasPartages(dataBase){
    return new Promise( (res, rej) => {
        const sql = ' CREATE TABLE IF NOT EXISTS agendaspartage(id INTEGER PRIMARY KEY, id_agenda INTEGER NOT NULL, id_user1 INTEGER, id_user2 INTEGER, FOREIGN KEY (id_agenda) REFERENCES agendas(id) ON DELETE CASCADE, FOREIGN KEY (id_user1) REFERENCES utilisateurs(id) ON DELETE CASCADE, FOREIGN KEY (id_user2) REFERENCES utilisateurs(id) ON DELETE CASCADE, UNIQUE(id_agenda, id_user2))';
        dataBase.run(sql, (err) => {
            if(err){
                rej(new Error("Erreur lors de la création de la table agendaspartages"));
            }
            else{
                res("Table agendaspartages OK");
            }
        });
    }) ;
}

function creerTableNotificationPartage(dataBase){
    return new Promise( (res, rej) => {
        const sql = `CREATE TABLE IF NOT EXISTS notificationpartage(
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    id_envoi INTEGER NOT NULL, 
                    id_recoit INTEGER NOT NULL,
                    id_agenda INTEGER NOT NULL,
                    etat TEXT NOT NULL DEFAULT 'attente' CHECK(etat IN ('attente', 'accepte', 'refuse')),
                    type TEXT NOT NULL CHECK(type IN ('demande', 'acceptation', 'refus')),
                    creation DATETIME DEFAULT CURRENT_TIMESTAMP, 
                    FOREIGN KEY (id_envoi) REFERENCES utilisateurs(id) ON DELETE CASCADE, 
                    FOREIGN KEY (id_recoit) REFERENCES utilisateurs(id) ON DELETE CASCADE,
                    FOREIGN KEY (id_agenda) REFERENCES agendas(id) ON DELETE CASCADE)`;
        dataBase.run(sql, (err) => {
            if(err){
                rej(new Error("Erreur lors de la création de la table notificationpartage"));
            }
            else{
                res("Table notificationpartage OK")
            }
        });
    });
}

function reassignerEvenementsEtSupprimerAgenda(dataBase, idAgendaASupprimer, idUtilisateur) {
    return new Promise((resolve, reject) => {
        // 1. Trouver l'ID de l'agenda "Default" de cet utilisateur
        const sqlFindDefault = "SELECT id FROM agendas WHERE nom = 'Default' AND id_utilisateur = ?";
        
        dataBase.get(sqlFindDefault, [idUtilisateur], (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error("Agenda Default introuvable pour cet utilisateur"));

            const idDefault = row.id;

            // 2. Déplacer les événements vers l'agenda Default
            const sqlUpdateEvents = "UPDATE evenements SET id_agenda = ? WHERE id_agenda = ?";
            
            dataBase.run(sqlUpdateEvents, [idDefault, idAgendaASupprimer], function(err) {
                if (err) return reject(err);
                
                // 3. Maintenant que les événements sont saufs, on supprime l'agenda
                const sqlDeleteAgenda = "DELETE FROM agendas WHERE id = ?";
                dataBase.run(sqlDeleteAgenda, [idAgendaASupprimer], function(err) {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    });
}

function agendaPartagePour(dataBase, id_agenda, id_utilisateurRecoit){
    return new Promise((res, rej) => {
    const sql = `SELECT * FROM agendaspartage WHERE id_agenda = ? AND id_user2 = ? `;
    dataBase.get(sql, [id_agenda, id_utilisateurRecoit], (err, rows) =>{
        if(err){
            return rej(err);
        }
        res(rows);
    });
});
}

function supprimerAgendaPartage(dataBase, id_agenda, id_utilisateurRecoit){
    return new Promise((res, rej) => {
        const sql = `DELETE FROM agendaspartage WHERE id_agenda = ? AND id_user2 = ?`;
        dataBase.run(sql, [id_agenda, id_utilisateurRecoit], function(err){
            if(err){
                return rej(err);
            }
            res();
        });
    });
}

function supprimerNotificationPartage(dataBase, id_agenda, id_utilisateurRecoit){
    return new Promise((res, rej) => {
        const sql = `DELETE FROM notificationpartage WHERE id_agenda = ? AND id_recoit = ?`;
        dataBase.run(sql, [id_agenda, id_utilisateurRecoit], function(err){
            if(err){
                return rej(err);
            }
            res();
        });
    });
}


// Ouvre une connexion avec la BDD
async function creerBdd(chemin) {
    return new Promise ( (res, rej) => {
        const db = new sqlite3.Database(chemin, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                rej(err.message) ;
            }
        });
        res(db);
    });
}

function dropTableEvenement(dataBase){
    dataBase.run("DROP TABLE IF EXISTS evenements");
}


// Permet de supprimer une table
function dropTable(dataBase, tableName) {
    dataBase.run(`DROP TABLE ${tableName}`);
}

// Permet d'aller chercher un utilisateur dans la BDD
function fetchUtilisateur(dataBase, username, password) {

    return new Promise( (res, rej) => {
        const sql       = `SELECT id, username, password FROM utilisateurs WHERE utilisateurs.username=? AND utilisateurs.password=?` ;

        const mdpHashed = createHash("sha256").update(password).digest("hex");

        dataBase.all(sql,[username,mdpHashed] ,(err, rows) => {
            if(err) {
                rej(err);
            }
            res(rows); 
        }) ;
    }) ;
}

// Permet de mettre à jour le nom d'utilisateur
function updateUsername(dataBase, oldUsername, newUsername) {
    return new Promise( (resolve, reject) => {
        const sql = `UPDATE utilisateurs SET username = ? WHERE username = ?`;
        dataBase.run(sql, [newUsername, oldUsername], (err) => {
            if(err) {
                reject(err);
            }
            resolve('SERVEUR log : username mis à jour !');
        });
    });
}

// Permet de mettre à jour le mot de passe d'un 
function updatePassword(dataBase, oldPassword, newPassword, id) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE utilisateurs SET password = ? WHERE password=? AND id=?`;

        const oldPasswordHashed = createHash("sha256").update(oldPassword).digest("hex");
        const newPasswordHashed = createHash("sha256").update(newPassword).digest("hex");
        
        dataBase.run(sql, [newPasswordHashed, oldPasswordHashed, id], (err) => {
            if(err) {
                reject(err);
            }
            resolve('SERVEUR log : password mis à jour !');
        });
    });
}
// +--------------------------------------------
// | username : String
// | Renvoie le haché du mot de passe de l'utilisateur
// ---------------------------------------------
function recupHacheUtilisateur(dataBase, username) {
    return new Promise ( (res, rej) => {
        const sql = `SELECT password FROM utilisateurs WHERE utilisateurs.username=?`;
        dataBase.all(sql, [username], (err,rows) => {
            if(err) {
                rej(err);
            }
            res(rows);
        });
    });
}

// +--------------------------------------------
// | username : String
// | Renvoie l'id de l'utilisateur
// ---------------------------------------------
function recupIdUtilisateur(dataBase, username) {
    return new Promise((resolve, reject) => {
	const sql = `SELECT id FROM utilisateurs WHERE utilisateurs.username = ?`;
	dataBase.all(sql, [username], (err,rows) => {
	    if(err) {
		reject(err);
	    }
	    resolve(rows);
	});
    });
}

function recupNotification(dataBase, username) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                n.id,
                n.id_envoi,
                n.id_recoit,
                n.id_agenda,
                n.etat,
                n.creation,
                u2.username AS envoyeur,
                u.username AS receveur,
                a.nom AS agenda_nom
            FROM notificationpartage n
            JOIN utilisateurs u ON n.id_recoit = u.id
            JOIN utilisateurs u2 ON n.id_envoi = u2.id
            JOIN agendas a ON n.id_agenda = a.id
            WHERE n.etat = "attente"AND n.type = "demande" AND u.username = ?
        `;

        dataBase.all(sql, [username], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function recupNotificationTypeRefusAcceptation(dataBase, id){
    return new Promise((res, rej) => {
        const sql = `SELECT n.*,
                    u.username AS nom_utilisateur,
                    a.nom AS agenda_nom
                    FROM notificationpartage n
                    JOIN utilisateurs u ON n.id_recoit = u.id
                    JOIN agendas a ON n.id_agenda = a.id
                    WHERE n.etat = "attente"
                    AND (n.type = "refus" OR n.type = "acceptation")
                    AND n.id_envoi = ?`;
        dataBase.all(sql, [id], (err, rows) => {
            if(err){
                rej(err);
            }
            else{
                res(rows);
            }
        });          
    });
}





// +-----------------------------------------------------
// | idUtilisateur : Entier
// | nomAgenda     : String
// | Permet de créer l'agenda que l'utilisateur a importé
// ------------------------------------------------------
function creerAgendaImporter(dataBase, idUtilisateur, nomAgenda) {
    return new Promise( (resolve, reject) => {

	// avant de le créer on va vérifier qu'il n'existe pas déjá
	const sqlVerif = 'SELECT 1 FROM agendas WHERE agendas.nom=? AND agendas.id_utilisateur=?';
	dataBase.get(sqlVerif, [nomAgenda,idUtilisateur], (err,row) =>{
	    // si il existe déjà alors on insère PAS !
	    if(row) {
		reject(`SERVEUR log : Agenda : ${nomAgenda} existe déjà pour ID utilisateur : ${idUtilisateur} -> agenda non ajouté à la BDD`);
	    }
	    else {
		// il existe pas on le crée dans la BDD
		const sql      = 'INSERT INTO agendas(nom,id_utilisateur) VALUES (?,?)';

		dataBase.run(sql, [nomAgenda, idUtilisateur], (err) => {
		    if(err) {
			reject(err);
		    }
		    resolve(`SERVEUR log : BDD agenda importé : ${nomAgenda}`);
		});
	    }
	});
    });
}

function creerAgendaDefautUtilisateur(dataBase, id) {
    return new Promise( (res,rej) => {
        const sql = `INSERT INTO agendas(nom, couleur, id_utilisateur) VALUES (?,?,?)`;
        // CHANGEMENT ICI : "Personnel" devient "Default"
        const nameDef = "Default"; 
        const couleurDef = 0x4285F4; // Bleu Google Calendar par défaut
        dataBase.run(sql, [nameDef, couleurDef, id], (err) => {
            if (err) rej(err.message);
        });
        res("Création agenda par défaut OK");
    });
}

function recupEvenement(dataBase){
    return new Promise((res, rej) => {
        // Jointure pour récupérer la couleur de l'agenda au lieu de la couleur de l'event
        const sql = `
            SELECT e.*, a.couleur as agenda_couleur 
            FROM evenements e 
            LEFT JOIN agendas a ON e.id_agenda = a.id 
            ORDER BY e.start
        `;
        dataBase.all(sql, [], (err, rows) => {
            if(err) return rej(err);

            const events = rows.map(r => ({
                id: r.id.toString(),
                title: r.title,
                description: r.description || '',
                // On utilise la couleur de l'agenda si dispo, sinon rouge par défaut
                color: r.agenda_couleur ? r.agenda_couleur : 0xff0000, 
                start: new Date(r.start).toISOString(),
                end: new Date(r.end).toISOString(),
                id_agenda: r.id_agenda
            }));
            res(events);
        });
    });
}

// +------------------------------------
// | idAgenda : Entier
// | Récupère les événements d'un agenda
// +------------------------------------
function recupEvenementAgenda(dataBase, idAgenda) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM evenements WHERE evenements.id_agenda = ?`;
        dataBase.all(sql,[idAgenda], 
            (err, rows) => {
                if(err) {
                    reject(err);
                }
                resolve(rows);
            }
        );
    });
}


async function recupTousAgendas(bdd, id_utilisateur){
    const agendasUtilisateurConnecte = await recupAgendaUtilisateurConnecte(bdd, id_utilisateur);

    const sqlagendaPartage = 'SELECT a.id, a.nom, a.couleur, u.username AS proprietaire FROM agendaspartage ap JOIN agendas a ON ap.id_agenda = a.id JOIN utilisateurs u ON a.id_utilisateur = u.id WHERE ap.id_user2 = ?';
    
    const agendasPartages = await new Promise((res, rej) => {
        bdd.all(sqlagendaPartage, [id_utilisateur], (err, rows) => {
            if(err) rej(err);
            else res(rows);
        });
    });
    const agendaspartageFormated = agendasPartages.map(a => ({
        id: a.id,
        nom: `${a.nom} (partagé par ${a.proprietaire})`,
        couleur: a.couleur, // On garde la couleur originale
        id_utilisateur: a.id_utilisateur
    }));
    return [...agendasUtilisateurConnecte, ...agendaspartageFormated];
}

function recupNomUtilisateur(dataBase, id){
    return new Promise ((res, rej) => {
         const sql = `SELECT username FROM utilisateurs WHERE id = ?`;

         dataBase.get(sql, [id], (err, row) => {
            if(err){
                rej(err.message);
            }
            res(row.username);
         });
    });
}


// Permet d'ajouter un utilisateur dans la BDD
function ajouterUtilisateur(dataBase, objetUtilisateur) {
    return new Promise( (res,rej) => {
        const sql = `INSERT INTO utilisateurs(username, password, language) VALUES (?,?,?)` ;
        
        dataBase.run(sql, [objetUtilisateur.username, objetUtilisateur.password, objetUtilisateur.language], function(err) {
            if (err) {
		        rej(err.message);
            }
            res(this.lastID);
        });
    });
}

function ajouterAgenda(dataBase, nom, couleur, id_utilisateur) {
    return new Promise( (res,rej) => {
        const sql = `INSERT INTO agendas(nom, couleur, id_utilisateur) VALUES (?,?,?)`;
        dataBase.run(sql, [nom, couleur, id_utilisateur], function(err) {
            if (err) {
                rej(err.message);
            } else {
                res({ id: this.lastID, nom: nom, couleur: couleur, id_utilisateur: id_utilisateur });
            }
        });
    });
}

function ajouterAgendasPartages(dataBase, id_agenda, id_user1, id_user2){
    return new Promise(async (res, rej) => {
        try{
            const sqlCheckPartageExisteDeja = 'SELECT * FROM agendaspartage WHERE id_agenda = ? AND id_user2 = ?'

            const partageExiste = await new Promise( (res, rej) =>{
            dataBase.all(sqlCheckPartageExisteDeja, [id_agenda, id_user2], (err, rows)=>{
                if(err){
                    rej(err)
                }
                res(rows);
            });
        });
        
        if(partageExiste.length != 0){
            rej(new Error("Ce partage existe déjà"));
        }

                const sql = 'INSERT INTO agendaspartage(id_agenda , id_user1, id_user2) VALUES (?,?,?)'
                dataBase.run(sql, [
                    id_agenda,
                    id_user1,
                    id_user2
                ], function(err) {
                    if(err) {
                        rej(err.message);
                    }
                });
                res("L'agenda a bien été partagé !");

        }catch (err) {
            rej(err);
        }
    });
}



function ajouterNotification(dataBase, id_envoi, id_recoit, id_agenda, type) {
    return new Promise((res, rej) => {
        const sql = `
            INSERT INTO notificationpartage(id_envoi, id_recoit, id_agenda, type)
            VALUES (?, ?, ?, ?)
        `;
        dataBase.run(sql, [id_envoi, id_recoit, id_agenda, type], function(err) {
            if (err) return rej(err);
            res("Notification ajoutée");
        });
    });
}

function ajouterNotificationPartage(dataBase, id_envoi, id_recoit, id_agenda, type) {
    return new Promise(async (res, rej) => {
        try{
            const sqlCheckNotificationExisteDeja = 'SELECT * FROM notificationpartage WHERE id_agenda = ? AND id_recoit = ?'

            const partageExiste = await new Promise( (res, rej) =>{
            dataBase.all(sqlCheckNotificationExisteDeja, [id_agenda, id_recoit], (err, rows)=>{
                if(err){
                    rej(err)
                }
                res(rows);
            });
        });
        if (partageExiste.length !== 0) {
            const slqPartageEtat = `SELECT etat FROM notificationpartage WHERE id_agenda = ? AND id_recoit = ?`
            try{
                const etatPartage = await new Promise( (res, rej) => {
                    dataBase.all(slqPartageEtat, [id_agenda, id_recoit],(err, rows) => {
                        if(err){
                            rej(err);
                        }
                        res(rows);
                    });
                });
                if(etatPartage.length > 0){
                    const etat = etatPartage[0].etat;
                    if(etat === "accepte"){
                        const erreur = new Error("Ce partage à été accepté");
                        erreur.code = "PARTAGE_ACCEPTE";
                        return rej(erreur);
                    }
                    else if(etat === "refuse"){
                        const erreur = new Error("Ce partage à été refusé");
                        erreur.code = "PARTAGE_REFUSE";
                        return rej(erreur);
                    }
                    else{
                        const username = await recupNomUtilisateur(dataBase, id_recoit);
                        const erreur = new Error(`Ce partage est en attente d'une réponse de ${username}`);
                        erreur.code = "PARTAGE_EXISTANT"; 
                        return rej(erreur); 
                    }
                }
                return;
            }
            catch(err){
                rej(err);
            }

        }
        const sql = `
            INSERT INTO notificationpartage(id_envoi, id_recoit, id_agenda, type)
            VALUES (?, ?, ?, ?)
        `;

        dataBase.run(sql, [id_envoi, id_recoit, id_agenda, type], function(err) {
            if (err) {
                return rej(err);
            }

            return res("Notification ajoutée");
        });
        }catch (err) {
            rej(err);
        }
    });
    
}

function changerEtatNotificationAccepte(dataBase, id){
    return new Promise((res, rej) => {
        const sql = ` UPDATE notificationpartage SET etat = "accepte" WHERE id = ?`;

        dataBase.run(sql, [id], function(err) {
            if(err){
                return rej(err);
            }
            return res("Changement de l'état de la notififcation en accepte");
        });
    });
}

function changerEtatNotificationRefuse(dataBase, id){
    return new Promise((res, rej) => {
        const sql = ` UPDATE notificationpartage SET etat = "refuse" WHERE id = ?`;

        dataBase.run(sql, [id], function(err) {
            if(err){
                return rej(err);
            }
            return res("Changement de l'état de la notififcation en refuse");
        });
    });
}

    

async function ajouterEvenement(dataBase, token, objectEvenement, callback) {
    try {
        const id_utilisateurRows = await recupUtilisateurID(dataBase, token);
        if(id_utilisateurRows.length === 0) throw new Error("Utilisateur introuvable");

        // On ajoute rrule dans l'INSERT
        const sql = 'INSERT INTO evenements(title, start, end, description, id_agenda, rrule) VALUES (?,?,?,?,?,?)';
        dataBase.run(sql, [
            objectEvenement.title,
            objectEvenement.start,
            objectEvenement.end,
            objectEvenement.description,
            objectEvenement.id_agenda,
            objectEvenement.rrule || null // Gestion du null si pas de récurrence
        ], function(err) {
            if (err) {
                console.error("Erreur ajout:", err.message);
                if (callback) callback(err);
            } else {
                objectEvenement.id = this.lastID.toString();
                if (callback) callback(null, this.lastID);
            }
        });
    } catch(err) { console.error(err); }
}

/**
// ajouter un nouveau tag
async function ajouterNouveauTag(dataBase, nomTag, id_utilisateur){
    return new Promise( (resolve, reject) => {
        const sql = 'INSERT INTO tags(tag_name, user_id) VALUES (?,?)';
        dataBase.run(sql, [nomTag, id_utilisateur], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve({ id: this.lastID, tag_id: nomTag, user_id: id_utilisateur });
            }
        });
    });
}

// récupérer tous les tags d'un utilisateur
async function recupTousTags(dataBase, id_utilisateur){
    return new Promise( (resolve, reject) => {
        const sql = 'SELECT tag_name FROM tags WHERE tags.user_id = ?';
        dataBase.all(sql, [id_utilisateur], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}


async function ajouterNouveauTagEvenement(dataBase, id_evenement, id_tag){
    return new Promise( (resolve, reject) => {
        const sql = 'INSERT INTO eventTags(tag_id, id_event) VALUES (?,?)';
        dataBase.run(sql, [id_evenement, id_tag], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve({ id: this.lastID, id_evet: id_evenement, tag_id: id_tag });
            }
        });
    });
}

// récupérer tous les tags d'un événement
async function recupTagsEvenement(dataBase, id_evenement){
    return new Promise( (resolve, reject) => {
        const sql = `SELECT t.tag_name
                     FROM tags t 
                     JOIN eventTags et ON t.tag_name = et.tag_id 
                     WHERE et.id_event = ?`;
        dataBase.all(sql, [id_evenement], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// supprimer un tag d'un événement
async function supprimerTagEvenement(dataBase, id_evenement, id_tag){
    return new Promise( (resolve, reject) => {
        const sql = 'DELETE FROM eventTags WHERE id_event = ? AND tag_id = ?';
        dataBase.run(sql, [id_evenement, id_tag], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve();
            }
        });
    });
}

// récupérer tous les événements d'un tag
async function recupEvenementsTag(dataBase, id_tag){
    return new Promise( (resolve, reject) => {
        const sql = `SELECT e.*
                     FROM evenements e
                     JOIN eventTags et ON e.id = et.id_event
                     WHERE et.tag_id = ?`;
        dataBase.all(sql, [id_tag], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

*/
// +-------------------------------------------------------------------------
// | idAgenda       : Entier
// | objetEvenement : Objet qui contient les infos d'un événement
// | Permet d'ajouter les événements à un agenda importé
// --------------------------------------------------------------------------
function ajouterEvenementsAgendaImporte(dataBase, idAgenda, objetEvenement) {
    return new Promise( (resolve,reject) => {
	const sql = 'INSERT INTO evenements(title, start, end, description, id_agenda) VALUES (?,?,?,?,?)';
	dataBase.run(sql, [
            objetEvenement.title,
            objetEvenement.start,
            objetEvenement.end,
            objetEvenement.description,
            idAgenda
	], (err) => {
	    if(err) {
		reject(err);
	    }
	});
	resolve('SERVEUR log : événements ajouté dans la BDD');
    });
}


function modifierEvenement(dataBase, objectEvenement, callback) {
    const sql = 'UPDATE evenements SET title = ?, start = ?, end = ?, description = ?, id_agenda = ?, rrule = ? WHERE id = ?';
    dataBase.run(sql, [
        objectEvenement.title,
        objectEvenement.start,
        objectEvenement.end,
        objectEvenement.description,
        objectEvenement.id_agenda,
        objectEvenement.rrule || null,
        objectEvenement.id
    ], function(err) {
        if (err) {
            console.error("Erreur modif:", err.message);
            if (callback) callback(err);
        } else {
            if (callback) callback(null);
        }
    });
}

function supprimerEvenement(dataBase, eventId, callback) {
    const sql = 'DELETE FROM evenements WHERE id = ?';
    dataBase.run(sql, [eventId], function(err) {
        if (err) {
            console.error("Erreur suppression événement:", err.message);
            if (callback) callback(err);
        } else {
            console.log(`Event supprimé avec l'id ${eventId}`);
            if (callback) callback(null);
        }
    });
}

function supprimerAgenda(dataBase, agendaId, callback) {
    const sql = 'DELETE ON  FROM agendas WHERE id = ?';
    dataBase.run(sql, [agendaId], function(err) {
        if (err) {
            console.error("Erreur suppression agenda:", err.message);
            if (callback) callback(err);
        } else {
            console.log(`Agenda supprimé avec l'id ${agendaId}`);
            if (callback) callback(null);
        }
    });
}

function renommerAgenda(dataBase, id, nom) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE agendas SET nom = ? WHERE id = ?';
        dataBase.run(sql, [nom, id], function(err) {
            if (err) {
                reject(err.message);
            } else if (this.changes === 0) {
                reject(new Error("Aucun agenda trouvé avec cet ID"));
            } else {
                resolve({ success : true});
            }
        });
    });
}


function recupAgendaID(dataBase, id) {

    return new Promise( (res, rej) => {
        const sql       = `SELECT id FROM agendas WHERE agendas.id_utilisateur=?` ;

        dataBase.all(sql,[id] ,(err, rows) => {
            if(err) {
                rej(err);
            }
            res(rows); 
        }) ;
    }) ;
}

// +-------------------------------------------------
// | agendaNom     : String
// | idUtilisateur : Entier 
// | Permet de récupérer l'id d'un agenda par son nom
// --------------------------------------------------
function recupAgendaIdByName(dataBase, agendaNom, idUtilisateur) {
    return new Promise( (resolve, reject) => {
	const sql = 'SELECT id FROM agendas WHERE agendas.nom = ? AND agendas.id_utilisateur=?';
	dataBase.all(sql, [agendaNom, idUtilisateur], (err,rows) => {
	    if(err) {
		reject(err);
	    }
	    resolve(rows);
	});
    });
}

// 5. Modifier recupAgendaUtilisateurConnecte pour renvoyer la couleur
function recupAgendaUtilisateurConnecte(dataBase, id){
    return new Promise( (res, rej) => {
        const sql = 'SELECT * from agendas WHERE agendas.id_utilisateur=?';
        dataBase.all(sql, [id], (err, rows) =>{
            if(err) rej(err);
            else res(rows);
        });
    });
}

function recupUtilisateurID(dataBase, username){
    return new Promise( (res, rej) => {
        const sql = 'SELECT id from utilisateurs WHERE utilisateurs.username=?';
        dataBase.all(sql, [username] ,(err, rows) => {
            if(err){
                rej(err);
            }
            res(rows);
        });
    });
}

function recupUtilisateur(dataBase, username){
    return new Promise( (res, rej) => {
        const sql = 'SELECT id, username FROM utilisateurs WHERE username != ?';
        dataBase.all(sql, [username], (err, rows) => {
            if(err){
                rej(err);
            }
            res(rows);
        })
    })
}

// Permet de récupérer le contenu d'une table
function retournerContenuTableUtilisateur(dataBase) {

    return new Promise( (res, rej) => {
	const sql = `SELECT * FROM utilisateurs` ;
	dataBase.all(sql,[] ,(err, rows) => {
	    if(err) {
		rej(err);
	    }
	    res(rows); 
	}) ;
    }) ;
}

function retournerContenuTableEvenement(dataBase) {

    return new Promise( (res, rej) => {
	const sql = `SELECT * FROM evenements` ;
	dataBase.all(sql,[] ,(err, rows) => {
	    if(err) {
		rej(err);
	    }
	    res(rows); 
	}) ;
    }) ;
}

function modifLanguage(dataBase, username, language) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE utilisateurs SET language = ? WHERE username = ?';
        dataBase.run(sql, [language, username], function(err) {
            if (err) {
                reject(err.message);
            } else if (this.changes === 0) {
                reject(new Error("Aucun utilisateur trouvé avec ce username"));
            } else {
                resolve({ success : true});
            }
        });
    });
}

function recupLangue(dataBase, username) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT language FROM utilisateurs WHERE username = ?';
        dataBase.get(sql, [username], (err, row) => {
            if (err) {
                reject(err.message);
            } else if (!row) {
                reject(new Error("Aucun utilisateur trouvé avec ce username"));
            } else {
                resolve(row.language);
            }
        });
    });
}

// Rechercher un événement par nom
function filtrerEvenementNom(dataBase, user, nomEvenement, maxDistance = 2) {
    return new Promise((res, rej) => {
        const sql = `SELECT id, title, start, id_agenda FROM evenements where id_agenda IN (SELECT id FROM agendas WHERE id_utilisateur = (SELECT id FROM utilisateurs WHERE username = ?))`;

        dataBase.all(sql, [user], (err, rows) => {
            if(err) return rej(err);

            const recherche = (nomEvenement || '').toLowerCase();

            const filtre = rows
                .map(r => {
                    const nomEvent = (r.title || '').toLowerCase();

                    if (nomEvent.includes(recherche)) {
                        return {
                            id: r.id.toString(),
                            title: r.title,
                            start: new Date(r.start).toISOString(),
                            distance: 0
                        };
                    }
                    const distance = levenshtein.get(nomEvent, recherche);
                    return {
                        id: r.id.toString(),
                        title: r.title,
                        start: new Date(r.start).toISOString(),
                        distance: distance
                    };
                })
                .filter(r => r.distance <= maxDistance)
                .sort((a, b) => {
                    if (a.distance !== b.distance) {
                        return a.distance - b.distance;
                    }
                    return new Date(a.start) - new Date(b.start);
                });
            res(filtre);
        });
    });
}

function updateCouleurAgenda(dataBase, newCouleur, idAgenda) {
    return new Promise( (res, rej) => {
        const sql = `UPDATE agendas SET couleur=? WHERE id=?`;
        dataBase.run(sql, [newCouleur, idAgenda], (err) => {
            
            if(err) {
                rej('SERVEUR log : erreur MAJ couleur agenda');
            }
            res('SERVEUR log : couleur MAJ');
        });
    });
}
 
// Permet d'initialiser la BDD en créant la table utilisateur
async function initBdd(dataBase) {
    await creerTableUtilisateur(dataBase)
	    .then( res => console.log(res) )
	    .catch( err => console.error(err) );

    await creerTableEvenement(dataBase)
        .then( res => console.log(res) )
	    .catch( err => console.error(err) );

    await creerTableAgenda(dataBase)
        .then( res => console.log(res) )
        .catch( err => console.error(err) );
    
    await creerTableAgendasPartages(dataBase)
        .then( res => console.log(res) )
        .catch( err => console.error(err) );

    await creerTableNotificationPartage(dataBase)
        .then( res => console.log(res) )
        .catch( err => console.error(err) );
}

// ici bdd.db le chemin depend de l'endroit où la commande node a été excuté
let bdd;
await creerBdd("bdd.db")
    .then( (res) => {
        console.log("Connexion avec la BDD : OK");
        bdd = res ;
        bdd.run('PRAGMA foreign_keys = ON;')
    })
    .catch( (err) => console.error(err));

initBdd(bdd);

export { bdd ,
         initBdd ,
         ajouterAgenda,
         ajouterAgendasPartages,
         recupUtilisateur,
         supprimerAgenda,
         renommerAgenda,
         ajouterUtilisateur,
         retournerContenuTableUtilisateur,
         fetchUtilisateur,
         recupEvenement,
         ajouterEvenement,
         supprimerEvenement,
         modifierEvenement,
         retournerContenuTableEvenement,
         creerAgendaDefautUtilisateur,
         recupUtilisateurID,
         recupAgendaUtilisateurConnecte,
         recupEvenementAgenda,
         recupIdUtilisateur,
         recupAgendaIdByName,
         recupHacheUtilisateur,
         creerAgendaImporter,
         ajouterEvenementsAgendaImporte,
         recupTousAgendas,
         reassignerEvenementsEtSupprimerAgenda,
         modifLanguage,
         recupLangue,
         updateUsername,
         updatePassword,
         filtrerEvenementNom,
         ajouterNotificationPartage, 
         recupNotification, 
         changerEtatNotificationAccepte, 
         changerEtatNotificationRefuse,
         recupNomUtilisateur,
         supprimerAgendaPartage,
         agendaPartagePour,
         supprimerNotificationPartage,
         ajouterNotification,
         recupNotificationTypeRefusAcceptation,
         updateCouleurAgenda,
         getSettings,
         saveSettings,
       };
