/*
 * Script : création BDD & initialisation
 */
"use strict";

import { writeFile, existsSync, mkdirSync } from 'fs';

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
                console.log(`Le fichier : ${fileName} a été créé !`);
                });
    }
}

function creationFichierDotENV() {
    const fileName = `.env`;

    if(existsSync(fileName)) {
        console.log(`Le fichier : ${fileName} existe déjà !`);
    }
    else {
        writeFile(fileName, "SECRET=fe3f488af30d66d7fee0e2d13f43c25a036b87541987b099bb9d036b3a12d4366866af43dd0497895ad776810097f655bd73c52b8e926e3d8a2b455e88b9d79a", (err) => {
                if(err) {
                console.error(`ERREUR : creationFichierDotENV()`, err);
                }
                console.log(`Le fichier ${fileName} a été créé !`);
                });
    }
}

function creationDossierAgendasJson() {
    const directoryPath = './server/agendaJson';
    if (!existsSync(directoryPath)) {
        mkdirSync(directoryPath);
        console.log(`Le dossier ${directoryPath} a été créé !`);
    } else {
        console.log(`Le dossier ${directoryPath} existe déjà !`);
    }
}

function init() {
    creationFichierBDD();
    creationFichierDotENV();
    creationDossierAgendasJson();
}

init();



