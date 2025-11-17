"use strict";

import sqlite3pkg from "sqlite3" ;
import { createHash } from "crypto";
import { parseISO, setHours, setMinutes } from 'date-fns';
import { error } from "console";
import { th } from "date-fns/locale/th";


const sqlite3 = sqlite3pkg.verbose();

// Permet de créer la table UTILISATEURS dans le fichier bdd.db
function creerTableUtilisateur(dataBase) {
    return new Promise( (res,rej) => {
        const sql = `CREATE TABLE IF NOT EXISTS utilisateurs(id INTEGER PRIMARY KEY, username, password)`;
        dataBase.run(sql, (err) => {
            rej(new Error("Erreur lors de la création de la table utilisateurs"));
        }) ;
        res("Table utilisateurs OK");
    });
}

function creerTableEvenement(dataBase){
    return new Promise( (res,rej) => {
        const sql = 'CREATE TABLE IF NOT EXISTS evenements(id INTEGER PRIMARY KEY, id_agenda INTEGER, title TEXT NOT NULL, start DATETIME NOT NULL, end DATETIME NOT NULL, description TEXT, couleur INTEGER, FOREIGN KEY (id_agenda) REFERENCES agendas(id))';
        dataBase.run(sql, (err) => {
            rej(new Error("Erreur lors de la création de la table evenements"));
        });
        res("Table evenements OK");
    });
}

function creerTableAgenda(dataBase) {
    return new Promise( (res,rej) => {
        const sql = `CREATE TABLE agendas(id INTEGER PRIMARY KEY, nom TEXT NOT NULL, id_utilisateur INTEGER, FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id))`;
        dataBase.run(sql, (err) => {
            rej(new Error("Erreur lors de la création de la table agendas"));
        });
        res("Table agendas OK");
    }) ;
}

function creerTableAgendasPartages(dataBase){
    return new Promise( (res, rej) => {
        const sql = ' CREATE TABLE IF NOT EXISTS agendaspartage(id INTEGER PRIMARY KEY, id_agenda INTEGER NOT NULL, id_user1 INTEGER, id_user2 INTEGER, FOREIGN KEY (id_agenda) REFERENCES agendas(id), FOREIGN KEY (id_user1) REFERENCES utilisateurs(id), FOREIGN KEY (id_user2) REFERENCES utilisateurs(id), UNIQUE(id_agenda, id_user2))';
        dataBase.run(sql, (err) => {
            rej(new Error("Erreur lors de la création de la table agendaspartages"));
        });
        res("Table agendaspartages OK");
    })
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

// +-----------------------------------------------------
// | idUtilisateur : Entier
// | nomAgenda     : String
// | Permet de créer l'agenda que l'utilisateur a importé
// ------------------------------------------------------
function creerAgendaImporter(dataBase, idUtilisateur, nomAgenda) {
    return new Promise( (resolve, reject) => {
	const sql = 'INSERT INTO agendas(nom,id_utilisateur) VALUES (?,?)';

	dataBase.run(sql, [nomAgenda, idUtilisateur], err => {
	    if(err) {
		reject(err);
	    }
	});
	resolve(`SERVEUR log : BDD agenda importé : ${nomAgenda}`);
    });
}

function creerAgendaDefautUtilisateur(dataBase, id) {
    return new Promise( (res,rej) => {
	const sql = `INSERT INTO agendas(nom,id_utilisateur) VALUES (?,?)`;

	const nameDef = id+"Defaut";

	dataBase.run(sql, [nameDef, id], (err) => {
            if (err) {
		rej(err.message);
            }
        });
        res("Création agenda par défaut OK");
    });
}

function recupEvenement(dataBase){
    return new Promise((res, rej) => {
        const sql = 'SELECT * FROM evenements ORDER BY start';
        dataBase.all(sql, [], (err, rows) => {
            if(err) return rej(err);

            const events = rows.map(r => ({
                id: r.id.toString(),
                title: r.title,
                description: r.description || '', // Pas obligatoire
                color: r.couleur ? r.couleur : 0xff0000,
                start: new Date(r.start).toISOString(),
                end: new Date(r.end).toISOString()
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

// Permet d'ajouter un utilisateur dans la BDD
function ajouterUtilisateur(dataBase, objetUtilisateur) {
    return new Promise( (res,rej) => {
        const sql = `INSERT INTO utilisateurs(username, password) VALUES (?,?)` ;
        
        dataBase.run(sql, [objetUtilisateur.username, objetUtilisateur.password], function(err) {
            if (err) {
		        rej(err.message);
            }
            res(this.lastID);
        });
    });
}

function ajouterAgenda(dataBase, objetAgenda) {
    return new Promise( (res,rej) => {
        const sql = `INSERT INTO agendas(nom, id_utilisateur, id_evenement) VALUES (?,?,?)`;
        dataBase.run(sql, [
            objetAgenda.nom,
            objetAgenda.id_utilisateur,
            objetAgenda.id_evenement
        ], (err) => {
            if (err) {
                rej(err.message);
            }
        });
        res("Création agenda OK");
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

async function ajouterEvenement(dataBase, token,objectEvenement, callback) {
   try{
    const id_utilisateurRows = await recupUtilisateurID(dataBase, token);
    if(id_utilisateurRows.length === 0){
        throw new Error("   utilisateur introuvable");
    }
    const id_utilisateur = id_utilisateurRows[0].id

    const agendas = await recupAgendaID(dataBase, id_utilisateur);
    if( agendas.length === 0){
        throw new Error(" Agendas introuvable");
    }
    const id_agendas = agendas[0].id;
   
    const sql = 'INSERT INTO evenements(title, start, end, description, couleur, id_agenda) VALUES (?,?,?,?,?,?)';
    dataBase.run(sql, [
        objectEvenement.title,
        objectEvenement.start,
        objectEvenement.end,
        objectEvenement.description,
        objectEvenement.color,
        id_agendas
    ], function(err) {
        if (err) {
            console.error("Erreur ajout événement:", err.message);
            if (callback) callback(err);
        } else {
            console.log(`Event ajouté avec l'id ${this.lastID}`);
            objectEvenement.id = this.lastID.toString(); 
            if (callback) callback(null, this.lastID);
        }
    });
    }catch(err) {
        console.error(err);
    };
}

// +-------------------------------------------------------------------------
// | idAgenda       : Entier
// | objetEvenement : Objet qui contient les infos d'un événement
// | Permet d'ajouter les événements à un agenda importé
// --------------------------------------------------------------------------
function ajouterEvenementsAgendaImporte(dataBase, idAgenda, objetEvenement) {

}

function modifierEvenement(dataBase, objectEvenement, callback) {
    const sql = 'UPDATE evenements SET title = ?, start = ?, end = ?, description = ?, couleur = ? WHERE id = ?';
    dataBase.run(sql, [
        objectEvenement.title,
        objectEvenement.start,
        objectEvenement.end,
        objectEvenement.description,
        objectEvenement.color,
        objectEvenement.id
    ], function(err) {
        if (err) {
            console.error("Erreur modification événement:", err.message);
            if (callback) callback(err);
        } else {
            console.log(`Event modifié avec l'id ${objectEvenement.id}`);
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
    const sql = 'DELETE FROM agendas WHERE id = ?';
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

function recupAgendaUtilisateurConnecte(dataBase, id){
    return new Promise( (res, rej) => {
        const sql = 'SELECT * from agendas WHERE agendas.id_utilisateur=?';

        dataBase.all(sql, [id], (err, rows) =>{
            if(err){
                rej(err);
            }
            res(rows);
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
}

// ici bdd.db le chemin depend de l'endroit où la commande node a été excuté
let bdd;
await creerBdd("bdd.db")
    .then( (res) => {
        console.log("Connexion avec la BDD : OK");
        bdd = res ;
    })
    .catch( (err) => console.error(err));

initBdd(bdd);

export { bdd , initBdd ,ajouterAgenda,ajouterAgendasPartages, recupUtilisateur,   supprimerAgenda, ajouterUtilisateur, retournerContenuTableUtilisateur, fetchUtilisateur, recupEvenement, ajouterEvenement, supprimerEvenement, modifierEvenement, retournerContenuTableEvenement, creerAgendaDefautUtilisateur, recupUtilisateurID, recupAgendaUtilisateurConnecte, recupEvenementAgenda, recupIdUtilisateur, creerAgendaImporter } ;
