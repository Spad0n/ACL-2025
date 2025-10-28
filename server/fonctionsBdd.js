"use strict";

import sqlite3pkg from "sqlite3" ;
const sqlite3 = sqlite3pkg.verbose();

function creerTableUtilisateur(dataBase) {
    const sql = `CREATE TABLE utilisateurs(id INTEGER PRIMARY KEY, email, password)`;
    dataBase.run(sql) ;
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
	    setTimeout( () => console.log("added to database") );
	    return console.error(err.message) ;
	}
    });

}

function initBdd(bdd) {
    creerTableUtilisateur(bdd);
}

const bdd = creerBdd("server/bdd.db") ;

export { bdd , initBdd , ajouterUtilisateur } ;
