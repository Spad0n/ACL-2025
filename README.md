# Vision globale du projet

Ce projet vise à planifier et ordonnancer ses activités professionnelles et personnelles de manière optimale.

Il vise à offrir une alternative intéréssante vis a vis de Google Agenda.

# Lancement du projet

```sh
npm install && npm start
```

# Lancement du projet
Si vous aviez déjà une ancienne base de données (bdd.db), supprimez-la avant de relancer le serveur :
```sh
rm bdd.db
npm start
```
Cela permettra au projet de recréer une base de données propre automatiquement.

# Fonctionnalités principales

- **Insctiption et connexion** : Permet aux utilisateurs de créer un compte et de se connecter en toute sécurité.
- **Un espace utilisateur** : Chaque utilisateur dispose d'un espace personnel pour gérer ses données personnelles.
- **Gestion des agendas** : Permet aux utilisateurs de créer et gérer plusieurs agendas.
- **Création d'événements** : Permet aux utilisateurs de créer, modifier et supprimer des événements dans leur agenda avec une gestion de conflits.
- **Page principale** : Un calendrier qui contient les informations des agendas présents de l’utilisateur (on affiche sur ce calendrier les informations selon certains filtres).
- **Interface** : les fonctionnalitées sont rapides d'accès ainsi que ergonomiques
- **Partage** : Permet de partager des agendas entre utilisateur
- **Export/Import** : Permet d'importer/exporter les agendas en format json

