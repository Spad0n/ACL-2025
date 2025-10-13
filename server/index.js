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
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, '../public')));
app.set("views", fileURLToPath(new URL("../views", import.meta.url)));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

app.get('/hello', (_req, res) => {
    res.json("Hello from json");
});

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get("/register", routes.getAccountCreationPage);

app.post("/account/new", routes.createAccount);

app.get("/logUser", routes.login);


app.post('/login', (req, res) => {
    const { utilisateur, mdp } = req.body;
    console.log(mdp);
    console.log(utilisateur);
    res.redirect('/');
})

app.listen(PORT, (_err) => {
    console.log(`Serveur lancé sur https://localhost:${PORT}`);
});
