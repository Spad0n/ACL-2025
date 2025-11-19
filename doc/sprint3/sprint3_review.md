# Sprint 3 Review

## Fonctionnalités

### Création + Consultation de plusieurs agendas

**Responsable :** Cornette Rohan
**État :** Validé

**Commentaire :**
Il est possible de visualiser plusieurs agendas dans une liste contenant tous les agendas de l’utilisateur, mais on ne peut pas en créer de nouveaux.

---

### Exportation et importation d’un agenda

**Responsable :** André Léo
**État :** Validé

**Commentaire :**

* On peut importer un agenda au format `.json`.
* On ne peut pas importer un agenda qu’on possède déjà (pour éviter de supprimer/écraser par erreur).
* Il manque des notifications pour le retour des actions réalisées par l’utilisateur.
* Le fichier `.json` à importer doit avoir été créé par la page d’exportation.
* Pour exporter, il suffit de choisir parmi les agendas possédés, et un fichier `.json` représentant l’agenda se télécharge.

---

### Permettre la répétition d’événements

**Responsable :** Abarca Elliot
**État :** Non réalisé

**Commentaire :**
La refonte de l’interface a été plus longue que prévue, cette fonctionnalité n’a donc pas été implémentée pendant ce sprint.

---

### Partager un calendrier entre utilisateurs amis

**Responsable :** Evrard Baptiste
**État :** Validé

**Commentaire :**

* Le partage d’agenda a été implémenté sans la fonctionnalité “être amis”, jugée non nécessaire dans cette application.
* Pour partager un agenda, l’utilisateur clique sur un bouton qui ouvre un dialog, choisit l’agenda et l’utilisateur avec qui le partager.
* Dans la BDD, une table liste les agendas partagés entre utilisateurs.
* Il manque des notifications pour informer la personne qu’elle a reçu un nouvel agenda.

---

### Rechercher des événements avec des mots-clés

**Responsable :** Letts Tristan
**État :** Validé

**Commentaire :**

* La recherche est implémentée via un dialog et des fonctions associées.
* Correction des deux bugs concernant les timezones et la récupération de la couleur d’un événement.
