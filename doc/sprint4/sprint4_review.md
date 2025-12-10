# SPRINT 4 REVIEW

## Fonctionnalités

### L'utilisateur a la possibilité de changer la langue du site --- *Cornette Rohan*

**État :** Validé

**Commentaire :**\
L'utilisateur peut choisir la langue du site dans les paramètres,
section "Langue".\
Les langues sont gérées via des fichiers `.json` dédiés.\
Le français et l'anglais sont disponibles par défaut, et il est possible
d'en ajouter simplement en créant un nouveau fichier `.json` contenant
les traductions, puis en l'ajoutant à la liste des langues.

------------------------------------------------------------------------

### Modifier les informations utilisateurs --- *André Léo*

**État :** Validé

**Commentaire :**\
L'utilisateur peut modifier son mot de passe et son nom d'utilisateur.\
Pour valider les modifications, il doit impérativement entrer son mot de
passe actuel.

------------------------------------------------------------------------

### Permettre la répétition d'événements --- *Abarca Elliot*

**État :** Validé

**Commentaire :**
L'utilisateur a la possibilité de mettre des evenements recurrent (tout les jours/semaine/etc)

------------------------------------------------------------------------

### Partager un calendrier entre utilisateurs amis --- *Evrard Baptiste*

**État :** Validé

**Commentaire :**\
Lors d'un partage, l'utilisateur ciblé reçoit une notification lui
permettant d'accepter ou de refuser.\
Une notification est également envoyée à l'expéditeur pour l'informer de
l'acceptation ou du refus.\
En cas d'acceptation, l'utilisateur obtient l'accès au calendrier
partagé.\
En cas de refus, il n'y a pas d'accès tant qu'un nouveau partage n'est
pas initié.\
Des messages d'erreur apparaissent si un partage existe déjà ou si
l'utilisateur a déjà accepté un partage préalable.

------------------------------------------------------------------------

### Rechercher des événements avec des mots-clés --- *Letts Tristan*

**État :** Validé

**Commentaire :**\
La recherche est implémentée avec un dialog dédié et ses fonctions
associées.\
Utilisation de la distance de Levenshtein pour rendre la recherche plus
permissive.\
Améliorations visuelles pour rendre le dialog plus agréable.
