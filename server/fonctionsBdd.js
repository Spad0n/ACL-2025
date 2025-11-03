"use strict";

import sqlite3pkg from "sqlite3" ;
import { createHash } from "crypto";

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

// Permet d'initialiser la BDD en créant la table utilisateur
async function initBdd(dataBase) {
    await creerTableUtilisateur(dataBase)
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

export { bdd , initBdd , ajouterUtilisateur, retournerContenuTableUtilisateur, fetchUtilisateur } ;
