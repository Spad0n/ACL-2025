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
