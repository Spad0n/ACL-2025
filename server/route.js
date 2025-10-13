import { createHash } from "crypto"; 

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

    res.redirect("/login");
  }
}


