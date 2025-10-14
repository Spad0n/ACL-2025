import jwt from "jsonwebtoken";

export function createJWT(user) {
    return jwt.sign(
        { id: user.id, username: user.username }, // données à crypter
        process.env.SECRET, // clé de chiffrement
        { expiresIn: "1h" }, // durée de validité du jeton, ici une heure
    );
}