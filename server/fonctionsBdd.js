"use strict";

import sqlite3pkg from "sqlite3" ;
import { createHash } from "crypto";
import { parseISO, setHours, setMinutes } from 'date-fns';


const sqlite3 = sqlite3pkg.verbose();

function creerTableUtilisateur(dataBase) {
    const sql = `CREATE TABLE utilisateurs(id INTEGER PRIMARY KEY, username, password)`;
    dataBase.run(sql, (err) => {
	setTimeout( () => console.log("La table : utilisateurs existe deja") );
    }) ;
}

function creerTableEvenement(dataBase){
	const sql = 'CREATE TABLE IF NOT EXISTS evenements(id INTEGER PRIMARY KEY, title TEXT NOT NULL, start DATETIME NOT NULL, end DATETIME NOT NULL, description TEXT, couleur TEXT)';
	dataBase.run(sql, (err) => {
		setTimeout( () => console.log("La table : evenement existe déjà"));
	})
}

function creerTableAgenda(dataBase) {
    const sql = `CREATE TABLE agendas(id INTEGER PRIMARY KEY, nom TEXT NOT NULL, id_utilisateur INTEGER, id_evenement INTERGER, FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id), FOREIGN KEY (id_evenement) REFERENCES evenements(id))`;
    dataBase.run(sql, (err) => {
	setTimeout( () => console.log("La table : agendas existe deja") );
    }) ;
}

function creerBdd(chemin) {
    return new sqlite3.Database(chemin, sqlite3.OPEN_READWRITE, (err) => {
	if (err) {
	    return console.error(err.message) ;
	}
    });
}

function dropTable(dataBase, tableName) {
    dataBase.run("DROP TABLE utilisateurs");
}
function dropTableEvenement(dataBase){
    dataBase.run("DROP TABLE IF EXISTS evenements");
}


function fetchUtilisateur(dataBase, username, password) {

    return new Promise( (res, rej) => {
	const sql       = `SELECT username, password FROM utilisateurs WHERE utilisateurs.username=? AND utilisateurs.password=?` ;

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
                color: r.couleur ? parseInt(r.couleur.replace('#',''), 16) : 0xff0000,
                start: new Date(r.start).toISOString(),
                end: new Date(r.end).toISOString()
            }));

            res(events);
        });
    });
}


function ajouterUtilisateur(dataBase, objetUtilisateur) {
    const sql = `INSERT INTO utilisateurs(username, password) VALUES (?,?)` ;
    
    dataBase.run(sql, [objetUtilisateur.username, objetUtilisateur.password], (err) => {
	if (err) {
	    setTimeout( () => console.log("not added to database") );
	    return console.error(err.message) ;
	}
    });

}

function ajouterEvenement(dataBase, objectEvenement, callback) {
    const sql = 'INSERT INTO evenements(title, start, end, description, couleur) VALUES (?,?,?,?,?)';
    dataBase.run(sql, [
        objectEvenement.title,
        objectEvenement.start,
        objectEvenement.end,
        objectEvenement.description,
        objectEvenement.couleur
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
        objectEvenement.couleur,
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

function initBdd(dataBase) {
    try {
	creerTableUtilisateur(dataBase);
	creerTableEvenement(dataBase);
    creerTableAgenda(dataBase);
    }
    catch (err) {
	setTimeout( () => console.log(err) );
    }
}

// ici bdd.db le chemin depend de l'endroit ou la commande node a ete excute.
const bdd = creerBdd("bdd.db") ;
initBdd(bdd);

export { bdd , initBdd , ajouterUtilisateur, retournerContenuTableUtilisateur, fetchUtilisateur, recupEvenement, ajouterEvenement, supprimerEvenement, modifierEvenement, retournerContenuTableEvenement} ;
