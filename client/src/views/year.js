import { h } from 'snabbdom';
import {
    format,
    getYear,
    getDaysInMonth,
    startOfMonth,
    getDay,
    isToday,
    isSameDay,
    isSameMonth,
    localeFR
} from '../dateUtils';
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

/**
 * Rend la grille d'un seul mois pour la vue annuelle.
 * @private
 * @param {Date} monthDate - Le premier jour du mois à rendre.
 * @param {Model} model - L'état de l'application.
 * @param {Set<string>} yearEntriesSet - Un Set des jours de l'année qui ont des événements.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
function renderMonthGrid(monthDate, model, yearEntriesSet, dispatch) {
    const locale = getLocale(model.settings.language);
    const weekdays = Array.from({ length: 7 }, (_, i) =>
        format(new Date(1970, 0, i + 4), 'EEEEEE', { locale })
        .charAt(0).toUpperCase() + format(new Date(1970, 0, i + 4), 'EEEEEE', { locale }).slice(1).toLowerCase()
    );
    const monthStart = startOfMonth(monthDate);
    const daysInMonth = getDaysInMonth(monthDate);
    // getDay() est 0 pour Dimanche, 1 pour Lundi, etc.
    const startDayOfWeek = getDay(monthStart);

    // Créer un tableau de cellules vides pour les jours avant le début du mois
    const emptyCells = Array.from({ length: startDayOfWeek });

    // Créer les cellules pour chaque jour du mois
    const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const fullDate = new Date(getYear(monthDate), monthDate.getMonth(), day);
        const dateString = format(fullDate, 'yyyy-MM-dd');

        const dayClasses = {
            'yv-monthcell__body--day-wrapper': true,
            'yvmb-has-entry': yearEntriesSet.has(dateString),
            'yvmb-today': isToday(fullDate),
            'yvmb-selected': isSameDay(fullDate, model.currentDate)
        };

        return h('div', {
            key: dateString,
            class: dayClasses,
            on: {
                click: () => {
                    dispatch(Msg.SetDate(fullDate));
                    dispatch(Msg.SetView('day'));
                }
            }
        }, String(day));
    });

    const allCells = [...emptyCells, ...dayCells].map(cell => 
        cell ? cell : h('div.yv-monthcell__body--day-wrapper.yvmb-prevnext')
    );

    const handleMonthClick = () => {
        dispatch(Msg.SetDate(monthDate));
        dispatch(Msg.SetView('month'));
    };

    return h('div.yv-monthcell', { 
        class: { 'cell-current': isSameMonth(monthDate, model.currentDate) }
    }, [
        h('div.yv-monthcell__header', [
            h('div.yv-monthcell__header--rowone', {
                class: { 'yvmht-current': isSameMonth(monthDate, new Date()) },
                on: { click: handleMonthClick }
            }, format(monthDate, 'MMMM', { locale })
                .charAt(0).toUpperCase() + format(monthDate, 'MMMM', { locale }).slice(1).toLowerCase()),
            h('div.yv-monthcell__header--weekdays', weekdays.map(day => h('div', day)))
        ]),
        h('div.yv-monthcell__body', allCells)
    ]);
}

/**
 * Rend le composant de la vue annuelle.
 * @param {Model} model - L'état de l'application.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
export default function yearView(model, dispatch) {
    const { currentDate } = model;
    const year = getYear(currentDate);

    // Crée un tableau contenant le premier jour de chaque mois de l'année
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

    const activeCategories = new Set(
        Object.keys(model.categories).filter(key => model.categories[key].active)
    );
    const visibleEntries = model.entries.filter(entry => activeCategories.has(entry.category));

    // Optimisation : Pré-calculer un Set de toutes les dates de l'année ayant des événements.
    const yearEntriesSet = new Set(
        visibleEntries
        .filter(entry => getYear(new Date(entry.start)) === year)
        .map(entry => format(new Date(entry.start), 'yyyy-MM-dd'))
    );

    return h('div.calendar__yearview', months.map(monthDate =>
        renderMonthGrid(monthDate, model, yearEntriesSet, dispatch)
    ));
}
