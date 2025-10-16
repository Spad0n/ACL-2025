# Sprint 1 Review

## Fonctionnalités

---

### Accéder à la page d’accueil *(Frontpage Connexion / Inscription)*  
**État :** Validée  
**Commentaire :**  
Le serveur est en place, avec un début d’organisation pour l’arborescence des fichiers et des routes.  
La partie affichage des pages **Connexion / Inscription** (gérée avec des vues `.ejs`) n’a pas posé de réels problèmes.  
Cependant, la **prise en main et la mise en place de Node.js et Express** ont été un peu compliquées au début.

---

### Connexion  
**État :** Validée  
**Commentaire :**  
La connexion se fait via des **tokens JWT**.  
La **clé secrète** est stockée dans un fichier `.env` à la racine du projet et devra être ajoutée au dépôt GitHub.  
On récupère les variables d’environnement avec **dotenv** et on les parse avec **cookie-parser**.  
Une fois l’utilisateur vérifié, il peut accéder à la **page principale**.

---

### Déconnexion  
**État :** Validée  
**Commentaire :**  
La déconnexion redirige l’utilisateur vers la **page de login**, tout en **supprimant le token** généré lors de la connexion.

---

### Création de compte  
**État :** Validée  
**Commentaire :**  
Un fichier `.ejs` représente la **vue du formulaire d’inscription**.  
Côté serveur, une route dédiée a été ajoutée pour mener vers la page de création de compte lorsqu’on clique sur *S’inscrire*.  
L’algorithme de création de compte utilise une **fonction de hachage cryptographique SHA-256**, afin de **ne pas stocker le mot de passe en clair**.

---

### Création d’événements  
**État :** Partiellement validée  
**Commentaire :**  
La **création et la suppression d’événements** fonctionnent,  
mais **l’ordre des événements** n’est pas encore appliqué,  
et **l’heure de l’événement** manque encore dans la structure.
