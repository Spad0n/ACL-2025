import { createHash } from "crypto"; 
import { createJWT } from "./outils/jwt.js";
import { bdd, ajouterUtilisateur, recupUtilisateurID, retournerContenuTableUtilisateur, fetchUtilisateur, creerAgendaDefautUtilisateur , recupAgendaUtilisateurConnecte } from "./fonctionsBdd.js";
import jwt from "jsonwebtoken";

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
function recupTokenClient(req) {
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
	console.error('SERVER log/error : ',err);
	return -2;
    }
}

// +-------------------------------------------
// | Recup. les events de l'agenda que l'utilisateur veut déporter
// | ENVOIE : au front end tous les événements de l'agenda qu'il veut déporter
// --------------------------------------------
export function callFrontEndDeporter(req, res) {
    setTimeout(() => console.log('SERVEUR log : callFrontEndDeporter'));

    const username = recupTokenClient(req);
    if (username !== -1 && username !== -2) {

	recupUtilisateurID(bdd, username)
            .then( tabUsrId => { 
                console.log(tabUsrId); 
                
                // On récupère l'id de l'utilisateur connecté
                // Par la suite on va récuperer ses agendas
                
                if(tabUsrId.length > 0) {
                    
                    const objTmp = tabUsrId[0].id;
                    
                    // récupération des agendas
                    // On les envoie au frontend
                    recupAgendaUtilisateurConnecte(bdd, objTmp)
                        .then( fullfiled => { 
    
			    // <<<!!!>>> CETTE PARTIE DU CODE EST EXPERIMENTALE
			    // Maintenant on récupère les événements des différents agendas
			    const tabDesEvents = [];
			    
			    for(const agd of fullfiled) {

				const agdId = agd.id ;
				console.log(agdId);

				recupEvenementAgenda(bdd, agdId)
				    .then( evnt => {
					console.log(evnt);
					
					// on ajoute les événemnts dans le tableau pour le frontend
					for(const evtobj of evnt) {
					    tabDesEvents.push(evtobj); 
					}

				    })
				    .catch(err => console.error(err));
			    }

			    // On envoie tous les événemnts
			    res.json(tabDesEvents);
			    
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

    const username = recupTokenClient(req);
    if (username !== -1 && username !== -2) {

	recupUtilisateurID(bdd, username)
            .then( tabUsrId => { 
                console.log(tabUsrId); 
                
                // On récupère l'id de l'utilisateur connecté
                // Par la suite on va récuperer ses agendas
                
                if(tabUsrId.length > 0) {
                    
                    const objTmp = tabUsrId[0].id;
                    
                    // récupération des agendas
                    // On les envoie au frontend
                    recupAgendaUtilisateurConnecte(bdd, objTmp)
                        .then( fullfiled => { 
                            // fullfield est un objet de type tableau qui contient les agendas
                            console.log(fullfiled);
                            
                            res.render("importerDeporterAgenda", { data :  fullfiled });
                        })
                        .catch(err => { 
                            console.error(err);
                        }); 
                }
            })
            .catch(err => console.error(err) );
    }
}
