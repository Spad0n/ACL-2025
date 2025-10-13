import { createHash } from "crypto"; 

let currentId = 0;
const forum = createDefaultForum();

function createDefaultForum() {
  return {
    users: [],
    threads: [] 
  };
}

function getNewId() {
  return ++currentId;
}

export function getAccountCreationPage(req, res) {
    res.render("login"); 
}

export function index(req, res) {
  res.redirect("/login");
}

export function createAccount(req, res) {
  const {utilisateur, mdp, mdprepeat} = req.body;
  const user = forum.users.find((user) => user.utilisateur === utilisateur);

  if (user) {
    res.render("login", { message: "Nom déjà utilisé." });
  } 
  else if(mdp != mdprepeat){
    res.render("login", {message: "Mot de passe différent."});
  }
  else {
    const user = {
        id: getNewId(),
        utilisateur,
        mdp: createHash("sha256").update(mdp).digest("hex"),
    };
    forum.users.push(user);
    res.redirect("/login");
  }
}


