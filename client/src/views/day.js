import { h } from 'snabbdom';
import {
    format,
    isSameDay,
    isToday,
    differenceInMinutes,
    startOfDay,
    endOfDay,
    differenceInCalendarDays,
    localeFR
} from '../dateUtils';
import { Msg } from '../messages';
import { hextorgba } from '../utils';
import { calculateLayout } from './layoutUtils';
import { getVisibleEvents } from '../eventUtils';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

// Constante pour le calcul des positions (partagée avec week.js)
const TOTAL_MINUTES_IN_DAY = 24 * 60;

//==================================================================================
// SOUS-COMPOSANTS DE LA VUE
//==================================================================================

/**
 * Rend un événement programmé dans la grille horaire.
 * @private
 */
function renderTimedEntry(entry, model, dispatch, position) {
    const startOfDayDate = startOfDay(entry.start);
    const startMinutes = differenceInMinutes(entry.start, startOfDayDate);
    const durationMinutes = Math.max(differenceInMinutes(entry.end, entry.start), 15);

    const top = (startMinutes / TOTAL_MINUTES_IN_DAY) * 100;
    const height = (durationMinutes / TOTAL_MINUTES_IN_DAY) * 100;

    const { colIndex, totalCols } = position;
    const width = 100 / totalCols;
    const left = colIndex * width;

    const categoryColor = model.categories[entry.category]?.color || '#333';

    return h('div.dv-box', { // Note: dv-box au lieu de box pour le style spécifique
        key: entry.id,
        attrs: { 'data-entry-id': entry.id },
        style: {
            top: `${top}%`,
            height: `${height}%`,
            left: `${left}%`,
            width: `calc(${width}% - 4px)`,
            backgroundColor: hextorgba(categoryColor, 0.8),
            borderLeft: `3px solid ${categoryColor}`,
        },
        on: {
            click: (e) => { e.stopPropagation(); dispatch(Msg.OpenModal('entryOptions', { entryId: entry.id, position: e.target.getBoundingClientRect() })); }
        }
    }, [
        h('div.dv-box__header', [h('div.dv-box-title', entry.title)]),
        h('div.dv-box__content', [h('span.dv-box-time', `${format(entry.start, 'p')} - ${format(entry.end, 'p')}`)])
    ]);
}

/**
 * Vérifie si un événement dure toute la journée ou s'étend sur plusieurs jours.
 * @private
 */
function isMultiDayOrAllDay(entry) {
    return differenceInCalendarDays(entry.end, entry.start) > 0 || !isSameDay(entry.start, entry.end);
}

//==================================================================================
// COMPOSANT PRINCIPAL
//==================================================================================

/**
 * Rend le composant de la vue journalière.
 * @param {Model} model - L'état de l'application.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
export default function dayView(model, dispatch) {
    const { currentDate } = model;
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // 1. Définir la fenêtre de vue (Le jour courant uniquement)
    const viewStart = startOfDay(currentDate);
    const viewEnd = endOfDay(currentDate);

    // 2. Calcul dynamique des événements visibles
    const dayEntries = getVisibleEvents(model.entries, viewStart, viewEnd, model.categories);

    // 3. Séparation
    const allDayEntries = dayEntries.filter(isMultiDayOrAllDay);
    const timedEntries = dayEntries.filter(e => !allDayEntries.includes(e));
    
    const entryPositions = calculateLayout(timedEntries);

    const handleGridClick = (e) => {
        const gridRect = e.currentTarget.getBoundingClientRect();
        const clickY = e.clientY - gridRect.top;
        const minuteOfDay = Math.floor((clickY / gridRect.height) * TOTAL_MINUTES_IN_DAY / 15) * 15;
        dispatch(Msg.FormOpenCreate(currentDate, minuteOfDay));
    };

    return h('div.calendar__dayview', [
        h('div.dayview--header', [
            h('div.dayview--header-day', [
                h('div.dayview--header-day__title', format(currentDate, 'EEE', { locale: localeFR }).toUpperCase()),
                h('div.dayview--header-day__number', { 
                    class: { 'dayview--header-day__number--today': isToday(currentDate) } 
                }, format(currentDate, 'd'))
            ]),
            h('div.dv-info-day-wrapper', [
                h('div.dayview--header-day__info', `${dayEntries.length} event(s)`)
            ])
        ]),
        
        h('div.dv-ontop-row2', [
            h('div.dv-gmt', `UTC${format(new Date(), 'xxx')}`),
            h('div.dayview--ontop-container', allDayEntries.map(entry =>
                h('div.dayview--ontop__grid-item', {
                    key: entry.id,
                    style: { backgroundColor: entry.color || '#333' },
                    on: { click: (e) => { e.stopPropagation(); dispatch(Msg.OpenModal('entryOptions', { entryId: entry.id, position: e.target.getBoundingClientRect() })); } }
                }, entry.title)
            ))
        ]),
        
        h('div.dayview__grid', [
            h('div.dayview__grid--wrapper', [
                h('div.dayview--side-grid', hours.map(hour => 
                    h('span.dv-sidegrid--cell', hour > 0 ? format(new Date(0, 0, 0, hour), 'h a') : '')
                )),
                h('div.dayview--main-grid', { on: { click: handleGridClick } },
                    timedEntries.map(entry => renderTimedEntry(entry, model, dispatch, entryPositions.get(entry.id)))
                )
            ])
        ])
    ]);
}
