import { createHash } from "crypto"; 
import { createJWT } from "./outils/jwt.js";
import { bdd,
	 ajouterUtilisateur,
	 ajouterEvenementsAgendaImporte,
	 recupUtilisateurID,
	 retournerContenuTableUtilisateur,
	 fetchUtilisateur,
	 creerAgendaDefautUtilisateur,
	 creerAgendaImporter,
	 recupAgendaUtilisateurConnecte,
	 recupEvenementAgenda,
	 recupIdUtilisateur,
	 recupAgendaIdByName,
	 
	 
       } from "./fonctionsBdd.js";
import jwt from "jsonwebtoken";
import {readFile, writeFile} from 'fs';

export function getAccountCreationPage(req, res) {

    const message = req.query.message;
    
    res.render('register', { message });

}

export function createAccount(req, res) {
    const { username, password } = req.body;
    // Tout d'abord, on vérifie que le compte n'est pas déjà présent dans la BDD
    fetchUtilisateur(bdd, username, password)
	.then( (result) => {
	    // Si on trouve l'utilisateur on indique que le compte existe déjà
	    if (result.length == 1) {
			res.redirect("/register?message=ce+nom+existe+deja") ;
	    }
	    // Sinon on crée le compte
	    else {
		const user = {
		    username,
		    password: createHash("sha256").update(password).digest("hex"),
		};
		return ajouterUtilisateur(bdd,user)
		    .then(id_utilisateur => creerAgendaDefautUtilisateur(bdd, id_utilisateur))
		    .then(() => {
			const token = createJWT(user);
			res.cookie("accessToken", token, { httpOnly: true });
			res.redirect("/login");
		    });
		}
	})
	.catch(err => console.error(err));
}

export function authenticate(req, res, next) {
  try {
    const token = req.cookies.accessToken;
    const user = jwt.verify(token, process.env.SECRET);
    res.locals.user = user;
  } catch {}
  next();
}

export function login(req, res) {
    const { username, password } = req.body;
    // On va chercher dans la base de donnée l'utilisateur
    fetchUtilisateur(bdd, username, password)
	.then( (result) => {
	    // Si on trouve l'utilisateur on crée un token et on redirige
	    if (result.length == 1) {
		const user  = result[0] ;
		const token = createJWT(user);
		
		res.cookie("accessToken", token, { httpOnly: true });
		res.redirect("/");
	    }
	    else {
		res.redirect("/login?message=Nom+d'utilisateur/mot+de+passe+invalide.") ;
	    }
	})
	.catch( (err) => { console.error(err); } );
}


// +----------------------------
// | Recup. le token du client
// | RETURN : username du client
// -----------------------------
function recupTokenClient(req,res) {
    try {
        const tokkensSigne    = req.cookies.accessToken;
        const tokkenSansSigne = jwt.verify(tokkensSigne, process.env.SECRET);
        const username        = tokkenSansSigne.username;
        
        if(!username){
            return -1;
        }
	else {
	    return username;
	}
    }
    catch(err) {
	console.error('SERVER log/error : ',err.message);
	// Si il y a une erreur, c'est surment que le token a expiré
	res.redirect('/login');
    }
}

// +-------------------------------------------
// | -> permet de créer le snapshot que le client demande
// --------------------------------------------
export function callFrontEndDeporter(req, res) {
    setTimeout(() => console.log('SERVEUR log : callFrontEndDeporter'));

    // On récupère le nom de l'agenda que l'utilisateur veut déporter
    const { agenda } = req.body ;
    console.log('SERVEUR log : agendaName :', agenda);

    // On récupère le username de l'utilisateur qui a fait la requête
    const username = recupTokenClient(req,res);

    if (username !== -1 && username !== -2) {

	recupUtilisateurID(bdd, username)
            .then( tabUsrId => { 
                
                // On récupère l'id de l'utilisateur connecté
                // Par la suite on va récuperer ses agendas
                
                if(tabUsrId.length > 0) {
                    
                    const objTmp = tabUsrId[0].id;
                    
                    // récupération des agendas
                    recupAgendaUtilisateurConnecte(bdd, objTmp)
                        .then( lesAgendas => { 
			    
			    for(const agd of lesAgendas) {
				
				// On cherche les événements de l'agenda demandé
				if(agd.nom == agenda) {
				    recupEvenementAgenda(bdd, agd.id)
					.then( evnt =>
					    {
						console.log('SERVEUR log : demande client : ', username);
						// console.log('SERVEUR log : événements : ', evnt);

						// On crée le fichier
						snapShotCreation(evnt, agenda, agd.id)
						    .then(success => {
							res.json(success);
						    })
						    .catch(error => console.error(error));
					    })
					.catch(err => console.error(err));
				}
			    }
			})
			.catch(err => console.error(err));
		}
	    })
	    .catch(err => console.error(err));
    }	   
}

// +----------------------------------------------------
// | Envoie au client sa liste d'agenda
// -----------------------------------------------------
export function sendFrontEndAgendaUtilisateur(req, res) {
    setTimeout(() => console.log('SERVEUR log : sendFrontEndAgendaUtilisateur'));

    const username = recupTokenClient(req,res);
    if (username !== -1 && username !== -2) {

	recupUtilisateurID(bdd, username)
            .then( tabUsrId => { 
                                
                // On récupère l'id de l'utilisateur connecté
                // Par la suite on va récuperer ses agendas
                
                if(tabUsrId.length > 0) {
                    
                    const objTmp = tabUsrId[0].id;
                    
                    // récupération des agendas
                    // On les envoie au frontend
                    recupAgendaUtilisateurConnecte(bdd, objTmp)
                        .then( lesAgendas => { 
                            
                            res.render("importerDeporterAgenda", { data :  lesAgendas });
                        })
                        .catch(err => { 
                            console.error(err);
                        }); 
                }
            })
            .catch(err => console.error(err) );
    }
}

// +-----------------------------------
// | Permet de créer le fichier snapshot
// ------------------------------------
function snapShotCreation(evenements, nomAgenda, idAgenda) {
    setTimeout(() => console.log('SERVEUR log : snapShotCreation'));

    return new Promise( (resolve, reject) => {

	// Propriété de l'objet : nom, id et des entiers (chaque entier correspond à l'id d'un événements)
	const AGENDA = {};

	AGENDA.nom = nomAgenda;
	AGENDA.id  = idAgenda;
	
	for(const e of evenements) {
	    AGENDA[e.id] = e ;
	}

	// On le met au format JSON
	const AGENDAJSON = JSON.stringify(AGENDA);
	const newName    = "server/agendaJson/"+nomAgenda + "-JSON" + ".json" ;
	
	writeFile(newName,AGENDAJSON,err => {
	    if(err) {
		reject(err) ;
	    }
	});
	
	resolve({ success: true, message: "Snapshot créé !" });
    });
}

// +----------------------------------
// | Permet à l'utilisateur d'importer un agenda
// -----------------------------------
export function importerAgendaUtilisateur(req,res) {
    console.log('SERVEUR log : importerAgendaUtilisateur');

    // On récupère le nom de l'agenda que l'utilisateur veut déporter
    const agenda = req.body ;
    console.log('SERVEUR log : agenda importé :', agenda);

    // On récupère le username de l'utilisateur qui a fait la requête
    const username = recupTokenClient(req,res);

    if (username !== -1 && username !== -2) {
	console.log('SERVEUR log : le client : ', username, ' importe un agenda');

	// On va créer un nouvel agenda
	const newAgendaNom = agenda['nom'] + "-Import" ;

	// On va récupérer l'id de l'utilisateur courant
	recupIdUtilisateur(bdd, username)
	    .then( idUtilisateur => {

		// ici idUtilisateur est un tableau
		if(idUtilisateur.length == 1) {

		    // récupération de l'id
		    const realId = idUtilisateur[0].id ;

		    console.log('SERVEUR log : ID du client : ', realId);
		    // création de l'agenda
		    creerAgendaImporter(bdd, realId,newAgendaNom)
			.then(value => console.log(value))
			.catch(error => console.error(error));
		    // On va itérer sur les propiétés de l'objet agenda
		    // Avant il faut récupéré l'id de l'agenda créé
		    recupAgendaIdByName(bdd, newAgendaNom)
			.then( idAgenda => {
			    if(idAgenda.length == 1) {
				const realIdAgenda = idAgenda[0].id;
				for (const [key, value] of Object.entries(agenda)) {
				    // les clefs pour les evenements est un entier
				    // on va regarder si on peut la convertir en entier
				    if(Number.isInteger(Number(key))) {
					// Alors on est sur un événements
					// On va attacher les événements à l'agenda
					console.log('SERVEUR log : ajout des événements en cours !');
					ajouterEvenementsAgendaImporte(bdd, realIdAgenda, value)
					    .then( retour => console.log(retour))
					    .catch(error => console.error(erreur));
				    }
				}
			    }
			})
			.catch(error => console.error(error));
		}
	    })
	    .catch(error => console.error(error));
    }
}
