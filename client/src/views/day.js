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

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

// Constante pour le calcul des positions (partagée avec week.js)
const TOTAL_MINUTES_IN_DAY = 24 * 60;

//==================================================================================
// LOGIQUE DE CALCUL DE LA DISPOSITION (OVERLAP)
//==================================================================================

///**
// * Calcule la position et le regroupement des événements qui se chevauchent.
// * C'est la même logique que pour la vue hebdomadaire, mais appliquée à un seul jour.
// * @private
// * @param {import('../model').Entry[]} dayEntries - Les événements programmés pour le jour.
// * @returns {Map<string, { colIndex: number, totalCols: number }>} Une Map associant l'ID de l'événement à sa position en colonnes.
// */
//function calculateOverlap(dayEntries) {
//    const sortedEntries = [...dayEntries].sort((a, b) => a.start - b.start);
//    const entryPositions = new Map();
//
//    for (const entry of sortedEntries) {
//        const overlappingGroup = [entry];
//        for (const otherEntry of sortedEntries) {
//            if (entry.id === otherEntry.id) continue;
//            if (entry.start < otherEntry.end && entry.end > otherEntry.start) {
//                overlappingGroup.push(otherEntry);
//            }
//        }
//        
//        overlappingGroup.sort((a, b) => a.start - b.start);
//        
//        const columns = [];
//        let colIndex = 0;
//        for (const item of overlappingGroup) {
//            let placed = false;
//            for (let i = 0; i < columns.length; i++) {
//                if (item.start >= columns[i][columns[i].length - 1].end) {
//                    columns[i].push(item);
//                    if (item.id === entry.id) colIndex = i;
//                    placed = true;
//                    break;
//                }
//            }
//            if (!placed) {
//                columns.push([item]);
//                if (item.id === entry.id) colIndex = columns.length - 1;
//            }
//        }
//        entryPositions.set(entry.id, { colIndex, totalCols: columns.length });
//    }
//    
//    return entryPositions;
//}

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
            // TODO: Logique de Drag-and-drop
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

    const activeCategories = new Set(
        Object.keys(model.categories).filter(key => model.categories[key].active)
    );
    const visibleEntries = model.entries.filter(entry => activeCategories.has(entry.category));
    
    // Filtrer les événements pour le jour courant
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);
    const dayEntries = visibleEntries.filter(entry => entry.start < dayEnd && entry.end > dayStart);

    // Séparer les événements "toute la journée" des événements programmés
    const allDayEntries = dayEntries.filter(isMultiDayOrAllDay);
    const timedEntries = dayEntries.filter(e => !allDayEntries.includes(e));
    
    // Calculer les superpositions pour les événements programmés
    const entryPositions = calculateLayout(timedEntries);

    const handleGridClick = (e) => {
        const gridRect = e.currentTarget.getBoundingClientRect();
        const clickY = e.clientY - gridRect.top;
        const minuteOfDay = Math.floor((clickY / gridRect.height) * TOTAL_MINUTES_IN_DAY / 15) * 15;
        dispatch(Msg.FormOpenCreate(currentDate, minuteOfDay));
    };

    return h('div.calendar__dayview', [
        // --- En-tête du jour ---
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
        
        // --- Zone des événements "toute la journée" ---
        h('div.dv-ontop-row2', [
            h('div.dv-gmt', `UTC${format(new Date(), 'xxx')}`),
            h('div.dayview--ontop-container', allDayEntries.map(entry =>
                h('div.dayview--ontop__grid-item', {
                    key: entry.id,
                    style: { backgroundColor: model.categories[entry.category]?.color || '#333' },
                    on: { click: (e) => { e.stopPropagation(); dispatch(Msg.OpenModal('entryOptions', { entryId: entry.id, position: e.target.getBoundingClientRect() })); } }
                }, entry.title)
            ))
        ]),
        
        // --- Grille horaire principale ---
        h('div.dayview__grid', [
            h('div.dayview__grid--wrapper', [
                // Colonne des heures
                h('div.dayview--side-grid', hours.map(hour => 
                    h('span.dv-sidegrid--cell', hour > 0 ? format(new Date(0, 0, 0, hour), 'h a') : '')
                )),
                // Grille principale où sont positionnés les événements
                h('div.dayview--main-grid', { on: { click: handleGridClick } },
                    timedEntries.map(entry => renderTimedEntry(entry, model, dispatch, entryPositions.get(entry.id)))
                )
            ])
        ])
    ]);
}
