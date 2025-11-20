import { h } from 'snabbdom';

// Import des composants structurels principaux
import headerView from '../components/header';
import sidebarView from '../components/sidebar';

// Import des différentes vues du calendrier
import dayView from './day';
import weekView from './week';
import monthView from './month';
import yearView from './year';
import listView from './list';

// Import de toutes les modales et superpositions globales
import entryOptionsView from '../components/entryOptions';
import datepickerView from '../components/datepicker';
import gotoView from '../components/goto';
import settingsView from '../components/settings';
import viewSelectorView from '../components/viewSelector';
import deleteConfirmationView from '../components/deleteConfirmationView';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

/**
 * Sélectionne et rend la vue principale du calendrier en fonction de `model.currentView`.
 * @private
 * @param {Model} model - L'état de l'application.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
function renderMainView(model, dispatch) {
    switch (model.currentView) {
        case 'day':
            return dayView(model, dispatch);
        case 'week':
            return weekView(model, dispatch);
        case 'year':
            return yearView(model, dispatch);
        case 'list':
            return listView(model, dispatch);
        case 'month':
        default:
            return monthView(model, dispatch);
    }
}

/**
 * Rend toutes les modales et superpositions globales de l'application.
 * Chaque composant de modale est responsable de sa propre logique de visibilité
 * (en retournant `null` s'il ne doit pas être affiché).
 * @private
 * @param {Model} model - L'état de l'application.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {Array<import('snabbdom').VNode | null>}
 */
function renderGlobalOverlays(model, dispatch) {
    return [
        // Modales principales
        entryOptionsView(model, dispatch),
        gotoView(model, dispatch),
        settingsView(model, dispatch),
        deleteConfirmationView(model, dispatch),

        // Superpositions contextuelles
        datepickerView(model, dispatch),
        viewSelectorView(model, dispatch),
    ];
}

/**
 * Rend le composant racine de l'application.
 * @param {Model} model - L'état actuel de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode} Le VNode représentant l'application entière.
 */
export default function appView(model, dispatch) {

    // Détermine les classes CSS à appliquer à l'élément racine
    // pour gérer les thèmes et les animations.
    const bodyClasses = {
        'body': true, // Classe de base
        'light-mode': model.settings.theme === 'light',
        'contrast-mode': model.settings.theme === 'contrast',
        'no-animations': !model.settings.animationsEnabled
    };

    return h('body#app', { class: bodyClasses }, [ // Utiliser body#app comme sélecteur pour le patch
        headerView(model, dispatch),
        
        h('main.main', [
            sidebarView(model, dispatch),
            
            h('div.container__calendars', {
                class: { 'container__calendars-sb-active': !model.settings.sidebarCollapsed }
            }, [
                renderMainView(model, dispatch)
            ])
        ]),
        
        // Les superpositions sont rendues en dernier pour être au-dessus de tout le reste
        ...renderGlobalOverlays(model, dispatch)
    ]);
}
