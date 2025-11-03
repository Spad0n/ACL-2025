import { createHash } from "crypto"; 
import { createJWT } from "./outils/jwt.js";
import { bdd, ajouterUtilisateur, retournerContenuTableUtilisateur, fetchUtilisateur } from "./fonctionsBdd.js";

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

		ajouterUtilisateur(bdd,user)
		    .then( val => console.log(val))
		    .catch( err => console.error(err));
		
		const token = createJWT(user);
		
		res.cookie("accessToken", token, { httpOnly: true });
		res.redirect("/login");
	    }
	})
	.catch( (err) => { console.error(err); } );
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
