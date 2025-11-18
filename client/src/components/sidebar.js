import { h } from 'snabbdom';
import {
    format,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isSameDay,
    isSameMonth,
    isToday,
    addMonths,
    subMonths
} from 'date-fns';
import { Msg } from '../messages';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

//==================================================================================
// SOUS-COMPOSANT : DATEPICKER
//==================================================================================

/**
 * Rend le mini-calendrier (datepicker) dans la barre latérale.
 * @private
 * @param {Model} model - L'état de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode}
 */
function renderDatepicker(model, dispatch) {
    const { currentDate } = model;
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Obtient les jours à afficher pour le mois en cours
    const calendarStart = startOfWeek(startOfMonth(currentDate));
    const calendarEnd = endOfWeek(endOfMonth(currentDate));
    const calendarDates = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    // Crée un Set des jours ayant des événements pour une recherche rapide
    const entriesByDay = new Set(model.entries.map(e => format(new Date(e.start), 'yyyy-MM-dd')));

    return h('div.datepicker-sidebar', [
        h('div.sb-datepicker__content', [
            h('div.sbdatepicker__header', [
                h('button.sbdatepicker-title', format(currentDate, 'MMMM yyyy')), // Le clic pourrait ouvrir un sélecteur de mois/année plus tard
                h('div.sbdatepicker-nav', [
                    h('button.sbdatepicker-nav--prev', { on: { click: () => dispatch(Msg.SetDate(subMonths(currentDate, 1))) } }, '‹'),
                    h('button.sbdatepicker-nav--next', { on: { click: () => dispatch(Msg.SetDate(addMonths(currentDate, 1))) } }, '›')
                ])
            ]),
            h('div.sbdatepicker__body', [
                h('div.sbdatepicker__body--header', weekdays.map(day =>
                    h('div.sbdatepicker__body--header-cell', day)
                )),
                h('div.sbdatepicker__body--dates', calendarDates.map(date => {
                    const dateString = format(date, 'yyyy-MM-dd');
                    const cellClasses = {
                        'sbdatepicker__body--datename': true,
                        'sbdatepicker__body--datename-disabled': !isSameMonth(date, currentDate),
                        'sbdatepicker__body--datename-today': isToday(date),
                        'sbdatepicker__body--datename-selected': isSameDay(date, currentDate),
                        'sbdatepicker__body--datename-entries': entriesByDay.has(dateString) && !isToday(date) && !isSameDay(date, currentDate)
                    };
                    return h('div.sbdatepicker__body--dates-cell', [
                        h('div', {
                            class: cellClasses,
                            on: { click: () => dispatch(Msg.SetDate(date)) }
                        }, format(date, 'd'))
                    ]);
                }))
            ])
        ])
    ]);
}

//==================================================================================
// SOUS-COMPOSANT : CATÉGORIES
//==================================================================================

/**
 * Rend la section de gestion des catégories.
 * @private
 * @param {Model} model - L'état de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode}
 */
function renderCategories(model, dispatch) {
    // TODO: Gérer l'état d'ouverture/fermeture de la section dans le modèle UI si nécessaire
    const isCategorySectionOpen = true; 

    return h('div.sb__categories', [
        h('div.sb__categories--header', [
            h('div.sbch-col__one', /* ... */ [
                h('div.sbch-title', 'Mes calendriers'),
            ]),
            h('div.sbch-plus', { on: { click: () => dispatch(Msg.AddCategory()) } }, '+')
        ]),
        isCategorySectionOpen ? h('div.sb__categories--body', [
            h('div.sb__categories--body-form', Object.entries(model.categories).map(([name, data]) =>
                h('div.sbch-form--item', { key: name }, [
                    h('div.sbch-form--item__col', {
                        on: { click: () => dispatch({ type: 'TOGGLE_CATEGORY', payload: name }) }
                    }, [
                        h('div.sbch-form--item__checkbox--wrapper', [
                            h('button.sbch-form--item__checkbox', {
                                style: {
                                    backgroundColor: data.active ? data.color : 'transparent',
                                    borderColor: data.color
                                }
                            }, data.active ? '✓' : '')
                        ]),
                        h('span.sbch-form--item__label', name)
                    ]),
                    // Les icônes d'édition/suppression apparaissent au survol (géré par CSS)
                    h('div.sbch-form--item__col--actions', [
                        name !== 'default' ? h('button.sbch-col--actions__delete-icon', {
                            on: { click: (e) => { e.stopPropagation(); dispatch(Msg.OpenModal('deleteConfirmation', { type: 'category', id: name })) } }
                        }, '×') : null,
                        h('button.sbch-col--actions__edit-icon', {
                            on: { click: (e) => { e.stopPropagation(); dispatch(Msg.EditCategory(name)) } }
                        }, '✎')
                    ])
                ])
            ))
        ]) : null
    ]);
}

//==================================================================================
// COMPOSANT PRINCIPAL DE LA SIDEBAR
//==================================================================================

/**
 * Rend le composant complet de la barre latérale.
 * @param {Model} model - L'état actuel de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode} Le VNode représentant la barre latérale.
 */
export default function sidebarView(model, dispatch) {
    return h('aside.sidebar.sidebar-transition', {
        class: { 'hide-sidebar': model.settings.sidebarCollapsed }
    }, [
        // --- En-tête de la Sidebar ---
        h('div.sidebar-content--header', [
            h('button.sb-toggle-form-btn', { on: { click: () => dispatch(Msg.OpenModal('form')) } }, [
                h('span.stfb', [
                    // Votre SVG pour le bouton "Create"
                    h('svg', { attrs: { width: "36", height: "36", viewBox: "0 0 36 36" } }, [
                         h('path', { attrs: { fill: "#34A853", d: "M16 16v14h4V20z" } }),
                         h('path', { attrs: { fill: "#4285F4", d: "M30 16H20l-4 4h14z" } }),
                         h('path', { attrs: { fill: "#FBBC05", d: "M6 16v4h10l4-4z" } }),
                         h('path', { attrs: { fill: "#EA4335", d: "M20 16V6h-4v14z" } }),
                    ])
                ]),
                h('span.sb-toggle-form-btn__content', 'Créer')
            ]),
            h('button.sb-data-btn', {
                on: { click: () => dispatch(Msg.OpenModal('settings')) },
                attrs: { 'aria-label': 'Paramètres & Données' }
            }, '...') // Simplifié, pourrait être un SVG
        ]),
        
        // --- Contenu principal de la Sidebar ---
        h('div.sidebar-content__wrapper', [
            renderDatepicker(model, dispatch),
            renderCategories(model, dispatch),
            //renderFooter(model, dispatch)
        ])
    ]);
}
