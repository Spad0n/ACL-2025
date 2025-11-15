"use strict";

// +-------------------------
// | Classe qui s'occupe de la logique pour déporter en snapshot un agenda
// +-------------------------
class DeporterAgenda {

    #objetAgenda;
    
    constructor() {
    
    }

    // Cette fonction permet de créer le fichier snapshot qui va contenir l'agenda
    creerFichierSnapshot(snapShotName) {
	    setTimeout(() => console.log(snapShotName));
    }
    
    creerObjetAgenda() {
    
    }

    get objetAgenda() {
	    return this.#objetAgenda ; 
    }
}

// +-------------------------
// | Classe qui permet de relier un agenda importé à la base de donnée
// +-------------------------
class ImporterAgenda {
    
    #fichierAgenda
    
    #connexionBdd

    constructor(fichier) {
        this.#fichierAgenda = fichier ;
    }
    
    set connexionBdd(bdd) {
        this.#connexionBdd = bdd ;
    }
}
