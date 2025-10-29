/*
 * Script : création BDD & initialisation
 */
"use strict";

import { writeFile, existsSync } from 'fs';

function creationFichierBDD() {

    const fileName = `bdd.db`;
    if (existsSync(fileName)) { 
	console.log(`Le fichier : ${fileName} existe déjà !`);
    }
    else {
	writeFile(fileName, "", (err) => {
	    if (err) {
		console.error('ERREUR : creationFichierBDD()', err);
	    }
	    console.log(`Le fichier : ${fileName} a été crée !`);
	});
    }
}

function init() {
    creationFichierBDD();
}

init();



