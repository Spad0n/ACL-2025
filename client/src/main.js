import { init, classModule, propsModule, styleModule, eventListenersModule, attributesModule } from 'snabbdom';
import { getInitialModel } from './model';
import { update } from './update';
import { Msg } from './messages';
import appView from './views/app';
import { format } from 'date-fns';
import htmx from 'htmx.org';

/**
 * Initialise le moteur de rendu Snabbdom avec les modules nécessaires.
 * @type {import('snabbdom').VNode | function(import('snabbdom').VNode | Element, import('snabbdom').VNode): import('snabbdom').VNode}
 */
const patch = init([
    classModule,
    propsModule,
    styleModule,
    eventListenersModule,
    attributesModule
]);

/**
 * @param {string} url
 */

/*
// Ovrir une fenetre pour pouvoir partager avec les listes des agendas de 
// l'utilisateurs connectés et des utilisateurs de la bdd
async function fenetrePartage(params) {
    const dialog = document.getElementById("share-dialog");
    const agendaSelect = document.getElementById("share-agenda-select");
    const utilisateurSelect = document.getElementById("share-user-select");

    const agendasUtilisateurConnecte = await fetch("/agendas").then(r => r.json());
    agendaSelect.innerHTML = agendasUtilisateurConnecte.map(a => `<option value="${a.id}">${a.nom}</option>`).join("");
    
    const utilisateurQuiRecoitPartage = await fetch("/recupUtilisateur").then(r => r.json());
    utilisateurSelect.innerHTML = utilisateurQuiRecoitPartage.map(a => `<option value="${a.username}">${a.username}</option>`).join("");

    dialog.style.display = "block";
}

document.getElementById("share-confirm").onclick = () => {
    const id_agenda = document.getElementById("share-agenda-select").value;
    const username = document.getElementById("share-user-select").value;

    fetch('/agendas/partage', {
        method: 'POST', 
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id_agenda, username})
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) alert("L'agenda a bien été partagé");
        else alert("Erreur : " + data.error);
    });

    document.getElementById("share-dialog").style.display = "none";
}
*/

/**
 * @param {string} url 
 */
export function triggerHtmxDialog(url) {
    const triggerElement = document.createElement('div');
    triggerElement.setAttribute('hx-get', url);
    triggerElement.setAttribute('hx-target', "#dialog-container");
    triggerElement.setAttribute('hx-swap', "innerHTML");

    try {
        document.body.appendChild(triggerElement);
        htmx.process(triggerElement);
        htmx.trigger(triggerElement, "click");
    } finally {
        document.body.removeChild(triggerElement);
    }
}

/**
 * @param {string} url
 * @param {object} data
 */
export function triggerHtmxPost(url, data) {
    const triggerElement = document.createElement('div');
    triggerElement.setAttribute('hx-post', url);
    triggerElement.setAttribute('hx-swap', 'none'); // On ne s'attend pas à du HTML en retour
    triggerElement.setAttribute('hx-vals', JSON.stringify(data));

    try {
        document.body.appendChild(triggerElement);
        htmx.process(triggerElement);
        htmx.trigger(triggerElement, "click");
    } finally {
        document.body.removeChild(triggerElement);
    }
}

/**
 * La fonction principale qui démarre l'application.
 */
(async () => {
    let model = getInitialModel();
    let vnode = document.getElementById('app');

    try {
        console.log("Tentative de récupération des événements...");
        const response = await fetch('/events');
        const serverEvents = await response.json();

        const hydratedEntries = serverEvents.map(entry => ({
            ...entry,
            start: new Date(entry.start),
            end: new Date(entry.end),
            category: 'Personnel'
        }));
        
        console.log("Événements chargés et hydratés:", hydratedEntries);
        model.entries = hydratedEntries;
    } catch (err) {
        console.error("Erreur lors de la recuperation des evenements:", err);
    }

    /**
     * La fonction centrale qui propage les changements à travers l'application.
     * @param {import('./messages').Message} msg - Le message décrivant l'action à effectuer.
     */
    function dispatch(msg) {
        const newModel = update(msg, model);
        model = newModel; // Met à jour l'état
        render(); // Redessine l'interface
    }

    /**
     * Met à jour le DOM en utilisant Snabbdom pour refléter l'état actuel du modèle.
     */
    function render() {
        const newVnode = appView(model, dispatch);
        vnode = patch(vnode, newVnode);
    }

    window.addEventListener('hashchange', () => {
        dispatch(Msg.HashChange(window.location.hash));
    }, false);

    if (window.location.hash) {
        dispatch(Msg.HashChange(window.location.hash));
    } else {
        window.location.hash = model.currentView;
        render(); // Appeler render() si dispatch n'a pas été appelé
    }

    document.body.addEventListener('dispatchApp', (evt) => {
        console.log("Événement reçu pour dispatch:", evt.detail);
        dispatch(evt.detail);
    });   
})();

/*
// Coucou rohan <3, on a garder si jamais tu en as besoin on t'aime tres fort
async function chagerAgendas(){
    try{
        const rep = await fetch('/agendas');
        if(!rep.ok){
            throw new Error("Erreur lors de la recuperation des agendas");
        }
        const agendas = await rep.json();
        const listeAgendas = document.getElementById('agenda-list');
        listeAgendas.innerHTML = '';

        agendas.forEach(agenda => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = agenda.nom;
            span.className = 'agenda-nom';
            span.dataset.id = agenda.id;

            const boutonSup = document.createElement('button');
            boutonSup.textContent = "X";
            boutonSup.className = 'agenda-supprimer';
            boutonSup.dataset.id = agenda.id;

            li.appendChild(span);
            li.appendChild(boutonSup);
            listeAgendas.appendChild(li);
        });
    } catch (error) {
        console.error("Erreur :", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    chagerAgendas();

    // ajouter un nouvel agenda
    document.getElementById('new-agenda').addEventListener('click', async () => {
        const nom = prompt("Entrez le nom du nouvel agenda :");
        if(nom){
            try{
                const rep = await fetch('/agendas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ nom: nom }),
                });

                if(rep.ok){
                    chagerAgendas();
                }
            } catch (error) {
                console.error("Erreur lors de la création de l'agenda :", error);
            }
        }
    });

    document.getElementById('agenda-list').addEventListener('click', async (event) => {
        // supprimer un agenda
        if(event.target.classList.contains('agenda-supprimer')){
            const id = event.target.dataset.id;
            if(confirm("Voulez-vous vraiment supprimer cet agenda ?")){
                try{
                    const rep = await fetch(`/agendas/${id}`, {
                        method: 'DELETE',
                    });

                    if(rep.ok){
                        chagerAgendas();
                    }
                } catch (error) {
                    console.error("Erreur lors de la suppression de l'agenda :", error);
                }
            }
        }

        // modifier le nom d'un agenda
        if(event.target.classList.contains('agenda-nom')){
            const span = event.target;
            const id = span.dataset.id;
            const nomActuel = span.textContent;

            const nouveauNom = prompt("Entrez le nouveau nom de l'agenda :", nomActuel);

            if(nouveauNom && nouveauNom !== nomActuel){
                try{
                    const rep = await fetch(`/agendas/${id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ nom: nouveauNom }),
                    });

                    if(rep.ok){
                        chagerAgendas();
                    }
                } catch (error) {
                    console.error("Erreur lors de la modification de l'agenda :", error);
                }
            }
        }
    }); 
});
*/