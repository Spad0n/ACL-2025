import { h } from 'snabbdom';
import { format, isSameDay, isToday, isSameMonth, getMonthViewDates } from '../dateUtils';
import { Msg } from '../messages';
import { getVisibleEvents } from '../eventUtils';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

/**
 * Rend un seul événement dans une cellule de jour.
 * @private
 * @param {import('../model').Entry} entry - L'événement à afficher.
 * @param {Model} model - L'état de l'application.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
function renderEntry(entry, model, dispatch) {
    const categoryColor = model.categories[entry.category]?.color || '#333';
    return h('div.monthview--box', {
        key: entry.id, // Important pour Snabbdom
        style: { backgroundColor: categoryColor },
        on: {
            click: (e) => {
                e.stopPropagation(); // Empêche le clic de se propager à la cellule du jour
                dispatch(Msg.OpenModal('entryOptions', {
                    entryId: entry.id,
                    position: e.target.getBoundingClientRect()
                }));
            }
        }
    }, [
        h('div.monthview--title', entry.title)
    ]);
}

/**
 * Rend une cellule de jour individuelle dans la grille du mois.
 * @private
 * @param {Date} date - La date de la cellule.
 * @param {Model} model - L'état de l'application.
 * @param {Map<string, import('../model').Entry[]>} entriesByDate - Map des événements groupés par date.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
function renderCell(date, model, entriesByDate, dispatch) {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayEntries = entriesByDate.get(dateString) || [];
    
    // Définition des classes CSS pour la cellule et le numéro du jour
    const cellClasses = {
        'monthview--day': true,
        'monthview--today': isToday(date) && isSameMonth(date, model.currentDate),
    };
    const dayNumberClasses = {
        'monthview--daynumber': true,
        'monthview--daynumber-prevnext': !isSameMonth(date, model.currentDate),
        'monthview--daynumber-today': isToday(date),
    };
    const dayOfMonthClasses = {
        'monthview--dayofmonth': true,
        'monthview--dayofmonth-selected': isSameDay(date, model.currentDate),
    };

    // Action à exécuter lors du clic sur le numéro du jour
    const handleDayClick = () => {
        dispatch(Msg.SetDate(date));
        dispatch(Msg.SetView('day'));
    };

    return h('div', { class: cellClasses, key: dateString }, [
        h('button', { class: dayOfMonthClasses, on: { click: handleDayClick } }, [
            h('span', { class: dayNumberClasses }, format(date, 'd'))
        ]),
        h('div.monthview--daycontent', {
            // Au clic sur une zone vide de la cellule, on ouvre le formulaire de création
            on: { click: () => dispatch(Msg.OpenModal('form', { startDate: date })) }
        }, [
            ...dayEntries.map(entry => renderEntry(entry, model, dispatch)),
        ])
    ]);
}

/**
 * Rend le composant de la vue mensuelle.
 * @param {Model} model - L'état actuel de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode}
 */
export default function monthView(model, dispatch) {
    const { currentDate } = model;
    
    const dates = getMonthViewDates(currentDate);
    
    const viewStart = startOfDay(dates[0]);
    const viewEnd = endOfDay(dates[dates.length - 1]);

    const visibleEntries = getVisibleEvents(model.entries, viewStart, viewEnd, model.categories);

    const entriesByDate = visibleEntries.reduce((acc, entry) => {
        const dateKey = format(new Date(entry.start), 'yyyy-MM-dd');
        if (!acc.has(dateKey)) {
            acc.set(dateKey, []);
        }
        acc.get(dateKey).push(entry);
        return acc;
    }, new Map());

    const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const isFiveWeeks = dates.length <= 35;

    return h('div.monthview', [
        h('div.monthview__top', weekdays.map(day => h('div.monthview__top-weekname', day))),
        h('div.monthview--calendar', { class: { 'five-weeks': isFiveWeeks } },
            dates.map(date => renderCell(date, model, entriesByDate, dispatch))
        )
    ]);
}
