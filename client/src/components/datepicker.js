import { h } from 'snabbdom';
import {
    format,
    addMonths,
    subMonths,
    getYear,
    setYear,
    getMonth,
    setMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isSameDay,
    isSameMonth,
    isToday
} from 'date-fns';
import { Msg } from '../messages';
import { fr, enUS } from 'date-fns/locale';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

function getLocale(language) {
    switch (language) {
        case 'fr':
            return fr;
        case 'en':
            return enUS;
        default:
            return enUS;
    }
}

// Constantes pour les jours et mois
const monthsIndices = Array.from({ length: 12 }, (_, i) => i);

//==================================================================================
// SOUS-COMPOSANT : SÉLECTEUR D'ANNÉE/MOIS RAPIDE
//==================================================================================

/**
 * Rend la sous-modale permettant de changer rapidement d'année ou de mois.
 * @param {Date} displayDate - La date actuellement affichée par le datepicker.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
function renderChangeDateModal(displayDate, dispatch, locale) {
    return h('aside.datepicker-change-date', [
        // Bouton fermer
        h('aside.close-change-date', {
            on: { click: (e) => { e.stopPropagation(); dispatch(Msg.DatepickerToggleChangeDate(false)); } }
        }, [
            h('svg', { attrs: { height: "18px", viewBox: "0 0 24 24", width: "18px", fill: "var(--white3)" } }, [
                h('path', { attrs: { d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" } })
            ])
        ]),
        
        // Sélecteur d'année
        h('div.yearpicker', [
            h('button.yearpicker-prev', {
                on: { click: (e) => { e.stopPropagation(); dispatch(Msg.DatepickerSetDisplayDate(setYear(displayDate, getYear(displayDate) - 1))); } }
            }, [
                h('svg', { attrs: { height: "18px", viewBox: "0 0 24 24", width: "18px", fill: "var(--white4)" } }, [
                    h('path', { attrs: { d: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" } })
                ])
            ]),
            h('div.yearpicker-title', getYear(displayDate)),
            h('button.yearpicker-next', {
                on: { click: (e) => { e.stopPropagation(); dispatch(Msg.DatepickerSetDisplayDate(setYear(displayDate, getYear(displayDate) + 1))); } }
            }, [
                h('svg', { attrs: { height: "18px", viewBox: "0 0 24 24", width: "18px", fill: "var(--white4)" } }, [
                    h('path', { attrs: { d: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" } })
                ])
            ])
        ]),

        // Grille des mois
        h('div.monthpicker', monthsIndices.map(monthIndex =>
            h('div.monthpicker__month', {
                class: { 'monthpicker__active-month': getMonth(displayDate) === monthIndex },
                on: { 
                    click: (e) => { 
                        e.stopPropagation(); 
                        // Change le mois et ferme le sélecteur rapide
                        dispatch(Msg.DatepickerSetDisplayDate(setMonth(displayDate, monthIndex)));
                        dispatch(Msg.DatepickerToggleChangeDate(false));
                    } 
                }
            }, format(new Date(0, monthIndex), 'MMMM', { locale }))
        ))
    ]);
}

//==================================================================================
// SOUS-COMPOSANT : CELLULE DE DATE
//==================================================================================

/**
 * Rend une cellule individuelle représentant un jour.
 * @param {Date} date - La date de la cellule.
 * @param {Date} displayDate - Le mois actuellement affiché (pour griser les jours hors mois).
 * @param {Date} selectedDate - La date actuellement sélectionnée (pour la surbrillance).
 * @param {Set<string>} entriesByDay - Set contenant les dates ayant des événements.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
function renderDateCell(date, displayDate, selectedDate, entriesByDay, dispatch) {
    const dateString = format(date, 'yyyy-MM-dd');
    const hasEntries = entriesByDay.has(dateString);
    
    const dateClasses = {
        'datepicker__body--datename': true,
        'datepicker__body--datename-disabled': !isSameMonth(date, displayDate),
        'datepicker__body--datename-today': isToday(date),
        'datepicker__body--datename-selected': isSameDay(date, selectedDate),
        // On affiche le point "entries" seulement si ce n'est pas aujourd'hui ni la date sélectionnée (pour la lisibilité)
        'datepicker__body--datename-entries': hasEntries && !isToday(date) && !isSameDay(date, selectedDate),
    };

    return h('div.datepicker__body--dates-cell', [
        h('div', {
            class: dateClasses,
            on: { click: (e) => { e.stopPropagation(); dispatch(Msg.DatepickerSelectDate(date)); } }
        }, format(date, 'd'))
    ]);
}

//==================================================================================
// COMPOSANT PRINCIPAL
//==================================================================================

/**
 * Rend le composant Datepicker complet.
 * @param {Model} model - L'état actuel de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode | null}
 */
export default function datepickerView(model, dispatch) {
    const { isOpen, displayDate, position, isChangingDate, target } = model.ui.datepicker;

    // Si le datepicker est fermé, ne rien rendre
    if (!isOpen) {
        return null;
    }

    // Déterminer quelle date est considérée comme "sélectionnée" en fonction de la cible
    const locale = getLocale(model.settings.language);
    
    const weekdays = Array.from({ length: 7 }, (_, i) =>
        format(new Date(1970, 0, i + 4), 'EEEEEE', { locale: getLocale(model.settings.language) })
    );

    let selectedDate = model.currentDate;

    // Calcul de la grille du calendrier
    const calendarStart = startOfWeek(startOfMonth(displayDate), { locale });
    const calendarEnd = endOfWeek(endOfMonth(displayDate), { locale });
    const calendarDates = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Optimisation : Créer un Set des événements pour un accès O(1)
    // Note : Pour de très gros volumes, cela pourrait être fait dans le modèle ou via un sélecteur mémorisé
    const entriesByDay = new Set(
        model.entries.map(entry => format(new Date(entry.start), 'yyyy-MM-dd'))
    );

    return h('div', [
        // Overlay transparent pour fermer en cliquant à l'extérieur
        h('aside.datepicker-overlay', { on: { click: () => dispatch(Msg.CloseAllModals()) } }),
        
        // Le conteneur du Datepicker
        h('aside.datepicker', { style: position }, [
            // En-tête (Mois Année + Navigation)
            h('div.datepicker__header', [
                h('button.datepicker-title', {
                    on: { click: (e) => { e.stopPropagation(); dispatch(Msg.DatepickerToggleChangeDate(true)); } }
                }, format(displayDate, 'MMMM yyyy', { locale })),
                h('div.datepicker-nav', [
                    h('button.datepicker-nav--prev', {
                        on: { click: (e) => { e.stopPropagation(); dispatch(Msg.DatepickerSetDisplayDate(subMonths(displayDate, 1))); } }
                    }, [
                        h('svg', { attrs: { height: "24px", viewBox: "0 0 24 24", width: "24px", fill: "var(--white3)" } }, [
                            h('path', { attrs: { d: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" } })
                        ])
                    ]),
                    h('button.datepicker-nav--next', {
                        on: { click: (e) => { e.stopPropagation(); dispatch(Msg.DatepickerSetDisplayDate(addMonths(displayDate, 1))); } }
                    }, [
                        h('svg', { attrs: { height: "24px", viewBox: "0 0 24 24", width: "24px", fill: "var(--white3)" } }, [
                            h('path', { attrs: { d: "M8.59 16.59L10 18l6-6-6-6L8.59 7.41 13.17 12z" } })
                        ])
                    ])
                ])
            ]),
            
            // Corps du calendrier
            h('div.datepicker__body', [
                // Jours de la semaine
                h('div.datepicker__body--header', weekdays.map(day =>
                    h('div.datepicker__body--header-cell', day)
                )),
                // Grille des dates
                h('div.datepicker__body--dates', calendarDates.map(date =>
                    renderDateCell(date, displayDate, selectedDate, entriesByDay, dispatch)
                ))
            ]),
            
            // Modale de changement rapide (s'affiche par-dessus le corps si active)
            isChangingDate ? renderChangeDateModal(displayDate, dispatch, locale) : null
        ])
    ]);
}
