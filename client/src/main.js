import { init, classModule, propsModule, styleModule, eventListenersModule, attributesModule } from 'snabbdom';
import { getInitialModel } from './model';
import { update } from './update';
import { Msg } from './messages';
import appView from './views/app';
import { format } from 'date-fns';
import htmx from 'htmx.org';

/**
 * Initialise le moteur de rendu Snabbdom avec les modules nécessaires.
 */
const patch = init([
    classModule,
    propsModule,
    styleModule,
    eventListenersModule,
    attributesModule
]);

/**
 * Récupère les agendas depuis la BDD et les formate pour le modèle.
 */
export async function fetchAgendasFromBDD(){
    try{
        const agandasRes = await fetch('/agendas');
        if(!agandasRes.ok) throw new Error('Erreur lors de la récupération des agendas');
        
        const rows = await agandasRes.json();
        const agendas = {};
        
        rows.forEach(row => {
            const key = row.shared ? `${row.name} (partagé)` : row.name;
            // Conversion Int -> Hex string pour le modèle
            const hexColor = '#' + (row.color || 0x4285F4).toString(16).padStart(6, '0');
            
            agendas[key] = {
                color: hexColor,
                active: true,
                id: row.id,
                shared: row.shared
            };
        });
        return agendas;
    } catch(err){
        console.log("Impossible de charger les agendas :", err);
        return {};
    }
}

/**
 * Ouvre une modale via HTMX (GET).
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
 * Envoie une requête POST via HTMX (sans retour HTML attendu).
 */
export function triggerHtmxPost(url, data) {
    const triggerElement = document.createElement('div');
    triggerElement.setAttribute('hx-post', url);
    triggerElement.setAttribute('hx-swap', 'none');
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

    // 1. Chargement initial des données
    try {
        console.log("Tentative de récupération des données...");
        
        // On charge d'abord les agendas (catégories) car on en a besoin pour mapper les événements
        model.categories = await fetchAgendasFromBDD();

        const response = await fetch('/events');
        const serverEvents = await response.json();

        const hydratedEntries = serverEvents.map(entry => {
            // On trouve le nom de la catégorie via l'ID agenda
            // Si non trouvé, on fallback sur "Personnel" ou la première dispo
            const categoryName = Object.keys(model.categories).find(name => model.categories[name].id === entry.id_agenda) || "Default";
            
            return {
                id: entry.id.toString(),
                title: entry.title,
                description: entry.description || '',
                start: new Date(entry.start),
                end: new Date(entry.end),
                category: categoryName
            }
        });

        model.entries = hydratedEntries;
        
    } catch (err) {
        console.error("Erreur lors de l'initialisation:", err);
    }

    /**
     * La fonction centrale qui propage les changements à travers l'application.
     */
    function dispatch(msg) {
        const newModel = update(msg, model);
        model = newModel; // Met à jour l'état
        render(); // Redessine l'interface
    }

    /**
     * Met à jour le DOM en utilisant Snabbdom.
     */
    function render() {
        const newVnode = appView(model, dispatch);
        vnode = patch(vnode, newVnode);

        // Gestion du thème sur le body pour les modales HTMX
        document.body.className = ''; 
        if (model.settings.theme !== 'dark') {
            document.body.classList.add(`${model.settings.theme}-mode`);
        }
    }

    // Gestion du routing par Hash
    window.addEventListener('hashchange', () => {
        dispatch(Msg.HashChange(window.location.hash));
    }, false);

    if (window.location.hash) {
        dispatch(Msg.HashChange(window.location.hash));
    } else {
        window.location.hash = model.currentView;
        render();
    }

    // =========================================================
    // ÉCOUTEURS D'ÉVÉNEMENTS HTMX (Mise à jour sans recharger)
    // =========================================================

    // 1. SAUVEGARDE D'UN ÉVÉNEMENT (Création ou Modification)
    document.body.addEventListener('eventSaved', (evt) => {
        // CORRECTION ICI : On vérifie .value OU .detail directement
        const savedEventRaw = evt.detail.value || evt.detail; 
        
        console.log("HTMX Signal Brut (Save):", savedEventRaw);

        // Sécurité : Si l'objet est mal formé, on ne fait rien pour éviter le crash
        if (!savedEventRaw || !savedEventRaw.start) {
            console.warn("Données d'événement incomplètes reçues, rechargement conseillé.");
            return;
        }

        const categoryEntry = Object.entries(model.categories).find(([key, val]) => val.id == savedEventRaw.id_agenda);
        if(!categoryEntry) return;

        const [categoryName, categoryObj] = categoryEntry;

        // On réhydrate les dates et on retrouve la catégorie
        const savedEvent = {
            ...savedEventRaw,
            id: savedEventRaw.id.toString(),
            start: new Date(savedEventRaw.start),
            end: new Date(savedEventRaw.end),
            description: savedEventRaw.description || '',
            category: categoryName,
            color: categoryObj.color
        };

        console.log("Mise à jour du modèle avec :", savedEvent);
        dispatch(Msg.SaveEntry(savedEvent)); // Met à jour le modèle Snabbdom
        dispatch(Msg.CloseAllModals());
    });

    document.body.addEventListener('eventDeleted', (evt) => {
        // Idem, on gère les deux cas de structure de l'événement
        const idToDelete = evt.detail.value || evt.detail;
        
        console.log("HTMX Signal (Delete):", idToDelete);
        
        if (idToDelete) {
            dispatch(Msg.EntryDeleted(idToDelete.toString()));
            dispatch(Msg.CloseAllModals());
        }
    });

    document.body.addEventListener('agendaSaved', async (evt) => {
        console.log("HTMX Signal: Nouvel agenda créé");
        
        // On recharge la liste complète des agendas depuis le serveur
        // pour être sûr d'avoir les bons IDs et couleurs
        const newAgendas = await fetchAgendasFromBDD();
        
        // On met à jour le modèle via le message AgendasLoaded
        // (Assurez-vous que ce Message existe bien dans messages.js et est traité dans update.js)
        dispatch(Msg.AgendasLoaded(newAgendas));
        
        dispatch(Msg.CloseAllModals());
    });

    document.body.addEventListener('categoryDeleted', (evt) => {
        const categoryName = evt.detail.value || evt.detail;
        
        console.log("HTMX Signal: Catégorie supprimée ->", categoryName);
        
        if (categoryName) {
            dispatch(Msg.CategoryDeleted(categoryName));
            dispatch(Msg.CloseAllModals());
        }
    });

    // Écouteur pour le dispatch manuel
    document.body.addEventListener('dispatchApp', (evt) => {
        console.log("Événement manuel reçu:", evt.detail);
        dispatch(evt.detail);
    });   
})();
