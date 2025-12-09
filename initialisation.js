/*
 * Script : création BDD & initialisation
 */
"use strict";

import { writeFile, existsSync, mkdirSync, unlink } from 'fs';

const VERSION = "4";

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

function updateDB() {
    return new Promise ( (res, rej) => {
            const fileNAME = `${VERSION}` ; 

            // On le cree & delete bdd
            if(!existsSync(fileNAME)) {

            writeFile(fileNAME,"version4", (err) => {
                    if(err) {
                        console.error('ERREUR : writeFile update bdd');
                        rej('KO');
                    }
                    else {
                        unlink('bdd.db', erreur => {
                            if(erreur) {
                                console.error('ERREUR : DELETING DB FILE !');
                                rej('KO');
                            }
                            else {
                                console.log('DATABASE WILL BE UPDATED !');
                                res('OK');
                            }
                        });
                    }
            });
            }
            else {
                console.log('DATA BASE UP TO DATE !');
                res('OK');
            }
    });
}


function init() {
    updateDB()
    .then( val => { 
        creationFichierBDD();
        creationFichierDotENV();
        creationDossierAgendasJson();
    })
    .catch( err => console.error('ERREUR'));
}

init();



