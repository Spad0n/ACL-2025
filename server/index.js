import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as routes from './route.js';
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";


dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 6969;

app.use(cookieParser());
app.use(routes.authenticate);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/favicon.ico', express.static('../public/favicon.ico'));

app.set("views", fileURLToPath(new URL("../views", import.meta.url)));
app.set("view engine", "ejs");

app.get('/hello', (_req, res) => {
    res.json("Hello from json");
});

app.get('/', (req, res) => {
    console.log(req.cookies.accessToken);
    if (req.cookies.accessToken !== undefined) {
	app.use(express.static(path.join(__dirname, '../dist')));
	res.sendFile(path.join(__dirname, "../dist/index.html"));
    } else {
	res.redirect("/login");
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('accessToken', {
	httpOnly: true,
	secure: true,
    });
    res.redirect("/login");
});

app.get('/login', (req, res) => {
    const message = req.query.message;
    res.render('login', { message });
});

app.get("/register", routes.getAccountCreationPage);

//route debug pour test
app.get("/debugSlot", (req, res) => {
    res.render('modifPopup');
})

app.post("/account/new", routes.createAccount);



app.post("/logUser", routes.login);

app.listen(PORT, (_err) => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
