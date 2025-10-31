"use strict";

import sqlite3pkg from "sqlite3" ;
import { createHash } from "crypto";

const sqlite3 = sqlite3pkg.verbose();

// Permet de créer la table UTILISATEURS dans le fichier bdd.db
function creerTableUtilisateur(dataBase) {
    const sql = `CREATE TABLE utilisateurs(id INTEGER PRIMARY KEY, username, password)`;
    dataBase.run(sql, (err) => {
	setTimeout( () => console.log("La table : utilisateurs existe deja") );
    }) ;
}

// Ouvre une connexion avec la BDD
function creerBdd(chemin) {
    return new sqlite3.Database(chemin, sqlite3.OPEN_READWRITE, (err) => {
	if (err) {
	    return console.error(err.message) ;
	}
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
    const sql = `INSERT INTO utilisateurs(username, password) VALUES (?,?)` ;
    
    dataBase.run(sql, [objetUtilisateur.username, objetUtilisateur.password], (err) => {
	if (err) {
	    setTimeout( () => console.log("not added to database") );
	    return console.error(err.message) ;
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

// Permet d'initialiser la BDD en créant la table utilisateur
function initBdd(dataBase) {
    try {
	creerTableUtilisateur(dataBase);
    }
    catch (err) {
	setTimeout( () => console.log(err) );
    }
}

// ici bdd.db le chemin depend de l'endroit ou la commande node a ete excute.
const bdd = creerBdd("bdd.db") ;
initBdd(bdd);

export { bdd , initBdd , ajouterUtilisateur, retournerContenuTableUtilisateur, fetchUtilisateur } ;
