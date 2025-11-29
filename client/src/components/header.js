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

const rechercheIcon = h('svg', { attrs: { focusable: "false", viewBox: "0 0 24 24", width: "24px", height: "24px", fill: "var(--white2)" } }, [
    h('path', { attrs: { d: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z" } })
]);

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
    const todayTooltip = `Today : ${format(model.today, 'eeee d MMMM')}`;

    return h('header.header', [
        h('div.h__container', [
            h('div.h-col-1', [
                // --- Bouton Menu Sidebar ---
                h('button.menu', {
                    on: { click: () => dispatch(Msg.ToggleSidebar()) },
                    attrs: { 'data-tooltip': 'Main Menu', 'aria-label': 'Main Menu' }
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
                }, 'Today')
            ]),

            h('div.group-right', [
                h('div.h-col-2', [
                    // --- Navigation Précédent/Suivant ---
                    h('div.prev-next', { class: { 'datetime-inactive': isListView } }, [
                        h('button.prev', {
                            on: { click: () => dispatch(Msg.Navigate('prev')) },
                            attrs: { 'aria-label': 'Previous period' }
                        }, [
                             h('svg', { attrs: { "height": "24px", "viewBox": "0 0 24 24", "width": "24px", "fill": "var(--white2)" } }, [
                                h('path', { attrs: { d: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" } })
                            ])
                        ]),
                        h('button.next', {
                            on: { click: () => dispatch(Msg.Navigate('next')) },
                            attrs: { 'aria-label': 'Next period' }
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
                        on: { click: () => dispatch(Msg.OpenModal('recherche')) },
                        attrs: { 'data-tooltip': 'Rechercher un événement', 'aria-label': 'Rechercher un événement' }
                    }, [rechercheIcon]),
                    // --- Bouton Paramètres ---
                    h('button.settings', {
                        on: { click: () => dispatch(Msg.OpenModal('settings')) },
                        attrs: { 'data-tooltip': 'Settings', 'aria-label': 'Settings' }
                    }, [
                        h('svg', { attrs: { width: "24", height: "24", viewBox: "0 0 24 24", focusable: "false", fill: "var(--white3)" } }, [
                            h('path', { attrs: { d: "M13.85 22.25h-3.7c-.74 0-1.36-.54-1.45-1.27l-.27-1.89c-.27-.14-.53-.29-.79-.46l-1.8.72c-.7.26-1.47-.03-1.81-.65L2.2 15.53c-.35-.66-.2-1.44.36-1.88l1.53-1.19c-.01-.15-.02-.3-.02-.46 0-.15.01-.31.02-.46l-1.52-1.19c-.59-.45-.74-1.26-.37-1.88l1.85-3.19c.34-.62 1.11-.9 1.79-.63l1.81.73c.26-.17.52-.32.78-.46l.27-1.91c.09-.7.71-1.25 1.44-1.25h3.7c.74 0 1.36.54 1.45 1.27l.27 1.89c.27.14.53.29.79.46l1.8-.72c.71-.26 1.48.03 1.82.65l1.84 3.18c.36.66.2 1.44-.36 1.88l-1.52 1.19c.01.15.02.3.02.46s-.01.31-.02.46l1.52 1.19c.56.45.72 1.23.37 1.86l-1.86 3.22c-.34.62-1.11.9-1.8.63l-1.8-.72c-.26.17-.52.32-.78.46l-.27 1.91c-.1.68-.72 1.22-1.46 1.22zm-3.23-2h2.76l.37-2.55.53-.22c.44-.18.88-.44 1.34-.78l.45-.34 2.38.96 1.38-2.4-2.03-1.58.07-.56c.03-.26.06-.51.06-.78s-.03-.53-.06-.78l-.07-.56 2.03-1.58-1.39-2.4-2.39.96-.45-.35c-.42-.32-.87-.58-1.33-.77l-.52-.22-.37-2.55h-2.76l-.37 2.55-.53.21c-.44.19-.88.44-1.34.79l-.45.33-2.38-.95-1.39 2.39 2.03 1.58-.07.56a7 7 0 0 0-.06.79c0 .26.02.53.06.78l.07.56-2.03 1.58 1.38 2.4 2.39-.96.45.35c.43.33.86.58 1.33.77l.53.22.38 2.55z" } }),
                            h('circle', { attrs: { cx: "12", cy: "12", r: "3.5" } })
                        ])
                    ]),

                    // --- Bouton pour partager un événements ---
                    h('button.partage', {
                        on: { click: () => dispatch(Msg.OpenModal('partage')) },
                        attrs: { 'data-tooltip': 'Share', 'aria-label': 'Share' }
                    }, [
                        h('img', {
                            attrs: {
                                src: '/public/assets/icons/partager.png',
                                alt: 'Partager'
                            }
                        })
                     ]),
                    
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
                        attrs: { 'data-tooltip': 'Logout', 'aria-label': 'Logout' }
                    }, [logoutIcon])
                ])
            ])
        ])
    ]);
}
