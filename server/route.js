import { createHash } from "crypto"; 
import { createJWT } from "./outils/jwt.js";

const forum = createDefaultForum();

let currentId = 0;

function getNewId() { return ++currentId; }

function createDefaultForum() {
  return {
    users: [],
    threads: [] 
  };
}


export function getAccountCreationPage(req, res) {

    const message = req.query.message;
    
    res.render('register', { message });

}


export function createAccount(req, res) {
  console.log("createAccount");
  const { username, password } = req.body;

  const user = forum.users.find((user) => user.username === username);

  if (user) {

    res.redirect("/register?message=ce+nom+existe+deja") ;

  }

  else {

    const user = {
        id: getNewId(),
        username,
        password: createHash("sha256").update(password).digest("hex"),
    };
    
    forum.users.push(user);
    console.log(forum.users);
    const token = createJWT(user);
    res.cookie("accessToken", token, { httpOnly: true });
    res.redirect("/login");
  }
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
  const user = forum.users.find((user) => user.username === username);
  if (user && user.password == createHash("sha256").update(password).digest("hex")) {
    const token = createJWT(user);
    res.cookie("accessToken", token, { httpOnly: true });
    res.redirect("/");
  } else {
    res.redirect("/login?message=Nom+d'utilisateur/mot+de+passe+invalide.") ;
  }
}


