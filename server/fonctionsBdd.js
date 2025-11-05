"use strict";

import sqlite3pkg from "sqlite3" ;
import { createHash } from "crypto";
import { parseISO, setHours, setMinutes } from 'date-fns';


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
        const sql = 'CREATE TABLE IF NOT EXISTS evenements(id INTEGER PRIMARY KEY, title TEXT NOT NULL, start DATETIME NOT NULL, end DATETIME NOT NULL, description TEXT, couleur INTEGER)';
        dataBase.run(sql, (err) => {
            rej(new Error("Erreur lors de la création de la table evenements"));
        });
        res("Table evenements OK");
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

// Permet d'ajouter un utilisateur dans la BDD
function ajouterUtilisateur(dataBase, objetUtilisateur) {
    return new Promise( (res,rej) => {
        const sql = `INSERT INTO utilisateurs(username, password) VALUES (?,?)` ;
        
        dataBase.run(sql, [objetUtilisateur.username, objetUtilisateur.password], (err) => {
            if (err) {
            rej(err.message);
            }
        });
        res("Création utilisateur OK");
    });
}

function ajouterEvenement(dataBase, objectEvenement, callback) {
    const sql = 'INSERT INTO evenements(title, start, end, description, couleur) VALUES (?,?,?,?,?)';
    dataBase.run(sql, [
        objectEvenement.title,
        objectEvenement.start,
        objectEvenement.end,
        objectEvenement.description,
        objectEvenement.color
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

export { bdd , initBdd , ajouterUtilisateur, retournerContenuTableUtilisateur, fetchUtilisateur, recupEvenement, ajouterEvenement, supprimerEvenement, modifierEvenement, retournerContenuTableEvenement} ;
