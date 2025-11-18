import { h } from 'snabbdom';
import { Msg } from '../messages';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

/**
 * La liste des vues disponibles avec leurs raccourcis clavier.
 * @private
 * @type {Array<{key: string, name: string, value: 'day'|'week'|'month'|'year'|'list'}>}
 */
const views = [
    { key: 'D', name: 'Jour', value: 'day' },
    { key: 'W', name: 'Semaine', value: 'week' },
    { key: 'M', name: 'Mois', value: 'month' },
    { key: 'Y', name: 'Année', value: 'year' },
    { key: 'L', name: 'Planning', value: 'list' },
];

/**
 * Rend le composant de sélection de la vue.
 * Le composant ne retourne un VNode que si l'état indique qu'il doit être ouvert.
 * Sinon, il retourne `null`.
 *
 * @param {Model} model - L'état actuel de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode | null} Le VNode représentant le sélecteur de vue, ou null.
 */
export default function viewSelectorView(model, dispatch) {
    // Si le sélecteur ne doit pas être ouvert, on ne rend rien.
    if (!model.ui.viewSelectorOpen) {
        return null;
    }

    const currentView = model.currentView;

    return h('div.change-view-container', [ // Un conteneur pour l'overlay et le menu
        // L'overlay qui ferme le menu lorsqu'on clique à côté
        h('aside.change-view--overlay', {
            on: { click: () => dispatch(Msg.ToggleViewSelector(false)) }
        }),

        // Le menu lui-même
        h('aside.change-view--wrapper.toggle-animate', [
            h('div.change-view--options', views.map(view =>
                h('div.view-option', {
                    // Applique une classe si cette option est la vue actuellement active
                    class: { 'change-view--option__active': currentView === view.value },
                    // Les attributs data-* sont utiles pour le CSS ou pour le débogage
                    attrs: {
                        'data-view-key': view.key,
                        'data-view-option': view.value
                    },
                    // Au clic, on dispatche un message pour changer de vue
                    on: {
                        click: () => dispatch(Msg.SetView(view.value))
                    }
                }, view.name) // Le texte affiché (ex: "Jour", "Semaine")
            ))
        ])
    ]);
}
