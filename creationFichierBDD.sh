#!/bin/sh

FILE=bdd.db

if [ -f "$FILE" ]; then
    echo "Le fichier $FILE existe";
else
    echo "Creation du fichier pour la BDD : $FILE";
    touch $FILE;
fi
