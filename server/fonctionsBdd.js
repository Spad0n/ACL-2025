"use strict";

import sqlite3pkg from "sqlite3" ;
const sqlite3 = sqlite3pkg.verbose();

function creerTableUtilisateur(dataBase) {
    const sql = `CREATE TABLE utilisateurs(id INTEGER PRIMARY KEY, email, password)`;
    dataBase.run(sql, (err) => {
	setTimeout( () => console.log("La table : utilisateurs existe deja") );
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

function ajouterUtilisateur(dataBase, objetUtilisateur) {
    const sql = `INSERT INTO utilisateurs(email, password) VALUES (?,?)` ;
    
    dataBase.run(sql, [objetUtilisateur.username, objetUtilisateur.password], (err) => {
	if (err) {
	    setTimeout( () => console.log("not added to database") );
	    return console.error(err.message) ;
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

export { bdd , initBdd , ajouterUtilisateur, retournerContenuTableUtilisateur } ;
