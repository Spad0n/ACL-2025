import { h } from 'snabbdom';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Msg } from '../messages';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

/**
 * Détermine le titre à afficher dans l'en-tête en fonction de la vue et de la date actuelles.
 * @private
 * @param {Model} model - L'état actuel de l'application.
 * @returns {string} Le titre formaté.
 */
function getHeaderTitle(model) {
    const { currentView, currentDate } = model;
    switch (currentView) {
        case 'day':
            return format(currentDate, 'MMMM d, yyyy');
        case 'week': {
            const start = startOfWeek(currentDate);
            const end = endOfWeek(currentDate);
            // Gère le cas où la semaine est à cheval sur deux mois/années
            if (start.getMonth() !== end.getMonth()) {
                return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
            }
            return `${format(start, 'MMMM d')} - ${end.getDate()}, ${end.getFullYear()}`;
        }
        case 'year':
            return format(currentDate, 'yyyy');
        case 'list':
            return 'Planning'; // Ou "Schedule"
        case 'month':
        default:
            return format(currentDate, 'MMMM yyyy');
    }
}

const logoutIcon = h('svg', { attrs: { focusable: "false", viewBox: "0 0 24 24", width: "24px", height: "24px", fill: "var(--white2)" } }, [
    h('path', { attrs: { d: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" } })
]);

/**
 * Rend le composant de l'en-tête.
 * @param {Model} model - L'état actuel de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode} Le VNode représentant l'en-tête.
 */
export default function headerView(model, dispatch) {
    const isListView = model.currentView === 'list';
    const currentViewCapitalized = model.currentView.charAt(0).toUpperCase() + model.currentView.slice(1);
    
    // La logique pour le tooltip du bouton "Aujourd'hui"
    const todayTooltip = `Aujourd'hui : ${format(model.today, 'eeee d MMMM')}`;

    return h('header.header', [
        h('div.h__container', [
            h('div.h-col-1', [
                // --- Bouton Menu Sidebar ---
                h('button.menu', {
                    on: { click: () => dispatch(Msg.ToggleSidebar()) },
                    attrs: { 'data-tooltip': 'Menu principal', 'aria-label': 'Menu principal' }
                }, [
                    h('svg', { attrs: { focusable: "false", viewBox: "0 0 24 24", width: "24px", height: "24px", fill: "var(--white2)" } }, [
                        h('path', { attrs: { d: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" } })
                    ])
                ]),
                // --- Logo & Titre ---
                h('div.logo', /* ... Votre SVG de logo ici ... */),
                h('h3.header-title', 'Calendar'),
                // --- Bouton Aujourd'hui ---
                h('button.btn-root.btn-today', {
                    on: { click: () => dispatch(Msg.GoToToday()) },
                    attrs: { 'data-tooltip': todayTooltip }
                }, 'Aujourd\'hui')
            ]),

            h('div.group-right', [
                h('div.h-col-2', [
                    // --- Navigation Précédent/Suivant ---
                    h('div.prev-next', { class: { 'datetime-inactive': isListView } }, [
                        h('button.prev', {
                            on: { click: () => dispatch(Msg.Navigate('prev')) },
                            attrs: { 'aria-label': 'Période précédente' }
                        }, [
                             h('svg', { attrs: { "height": "24px", "viewBox": "0 0 24 24", "width": "24px", "fill": "var(--white2)" } }, [
                                h('path', { attrs: { d: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" } })
                            ])
                        ]),
                        h('button.next', {
                            on: { click: () => dispatch(Msg.Navigate('next')) },
                            attrs: { 'aria-label': 'Période suivante' }
                        }, [
                            h('svg', { attrs: { "height": "24px", "viewBox": "0 0 24 24", "width": "24px", "fill": "var(--white2)" } }, [
                                h('path', { attrs: { d: "M8.59 16.59L10 18l6-6-6-6L8.59 7.41 13.17 12z" } })
                            ])
                        ])
                    ]),
                    // --- Titre de la date & Déclencheur du Datepicker ---
                    h('div.datetime-wrapper', [
                        h('button.datetime-content', {
                            on: { click: (e) => dispatch(Msg.OpenModal('datepicker', { target: 'header', date: model.currentDate, position: e.target.getBoundingClientRect() })) },
                            class: { 'datetime-list': isListView }
                        }, [
                            h('div.datetime-content--title', getHeaderTitle(model))
                        ])
                    ])
                ]),
                h('div.h-col-3', [
                    // --- Bouton Recherche ---
                    h('button.h-search', {
                        on: { click: () => document.getElementById('search-dialog').showModal() },
                        attrs: { 'data-tooltip': 'Rechercher un événement', 'aria-label': 'Rechercher un événement' }
                    }, [ /* ... SVG de recherche ... */ ]),
                    // --- Bouton "Aller à" (Go To) ---
                    h('button.h-search', {
                        on: { click: () => dispatch(Msg.OpenModal('goto')) },
                        attrs: { 'data-tooltip': 'Aller à la date', 'aria-label': 'Aller à la date' }
                    }, [ /* ... SVG de recherche ... */ ]),
                    
                    // --- Bouton Paramètres ---
                    h('button.settings', {
                        on: { click: () => dispatch(Msg.OpenModal('settings')) },
                        attrs: { 'data-tooltip': 'Paramètres', 'aria-label': 'Paramètres' }
                    }, [ /* ... SVG de paramètres ... */ ]),
                    
                    // --- Sélecteur de Vue ---
                    h('div.select-wrapper', [
                        h('button.select__modal', {
                            on: { click: () => dispatch(Msg.ToggleViewSelector(true)) }
                        }, currentViewCapitalized)
                    ]),
                    h('button.settings.logout-btn', {
                        on: { click: () => {
                            fetch('/logout', { method: 'GET', credentials: "include"})
                                .then(() => window.location.href = '/login')
                                .catch((error) => console.error('La déconnexion a échoué:', error));
                        }},
                        attrs: { 'data-tooltip': 'Déconnexion', 'aria-label': 'Déconnexion' }
                    }, [logoutIcon])
                ])
            ])
        ])
    ]);
}
