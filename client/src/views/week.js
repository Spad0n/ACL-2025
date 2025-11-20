import { h } from 'snabbdom';
import {
    format, isSameDay, isToday, differenceInMinutes, startOfDay, endOfDay,
    isWithinInterval, differenceInCalendarDays
} from '../dateUtils';
import { getWeekViewDates, localeFR } from '../dateUtils';
import { Msg } from '../messages';
import { hextorgba } from '../utils';
import { calculateLayout } from './layoutUtils';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

// Constante pour le calcul des positions
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

    return h('div.box', {
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
        h('div.box__header', [h('div.box-title', entry.title)]),
        h('div.box__content', [h('span.box-time', format(entry.start, 'p'))])
    ]);
}

/**
 * Rend une colonne de jour complète avec ses événements programmés.
 * @private
 */
function renderDayColumn(day, weekEntries, model, dispatch) {
    // On filtre à partir de `weekEntries` (déjà filtré par catégorie), et non de `model.entries`
    const timedEntries = weekEntries.filter(e => 
        isSameDay(e.start, day) && 
        !isMultiDayOrAllDay(e)
    );
    
    const entryPositions = calculateLayout(timedEntries);

    const handleGridClick = (e) => {
        const gridRect = e.currentTarget.getBoundingClientRect();
        const clickY = e.clientY - gridRect.top;
        const minuteOfDay = Math.floor((clickY / gridRect.height) * TOTAL_MINUTES_IN_DAY / 15) * 15;
        dispatch(Msg.FormOpenCreate(day, minuteOfDay));
    };

    return h('div.week--col', { on: { click: handleGridClick } },
        timedEntries.map(entry => renderTimedEntry(entry, model, dispatch, entryPositions.get(entry.id)))
    );
}

/**
 * Vérifie si un événement est "toute la journée" ou s'étend sur plusieurs jours.
 * @private
 */
function isMultiDayOrAllDay(entry) {
    const durationInDays = differenceInCalendarDays(entry.end, entry.start);
    const isEffectivelyAllDay = differenceInMinutes(entry.end, entry.start) >= 1439;
    return durationInDays > 0 || isEffectivelyAllDay || !isSameDay(entry.start, entry.end);
}

//==================================================================================
// COMPOSANT PRINCIPAL
//==================================================================================

/**
 * Rend le composant de la vue hebdomadaire.
 * @param {Model} model - L'état de l'application.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
export default function weekView(model, dispatch) {
    const { currentDate } = model;
    const weekDates = getWeekViewDates(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const activeCategories = new Set(
        Object.keys(model.categories).filter(key => model.categories[key].active)
    );
    const visibleEntries = model.entries.filter(entry => activeCategories.has(entry.category));

    const weekInterval = { start: weekDates[0], end: endOfDay(weekDates[6]) };
    const weekEntries = visibleEntries.filter(e => isWithinInterval(e.start, weekInterval) || isWithinInterval(e.end, weekInterval) || (e.start < weekInterval.start && e.end > weekInterval.end));
    
    const allDayEntries = weekEntries.filter(isMultiDayOrAllDay)
        .sort((a, b) => a.start - b.start);

    // --- Logique de calcul de la disposition pour les événements "toute la journée" ---
    const lanes = [];
    const layoutInfo = new Map();

    allDayEntries.forEach(entry => {
        let placed = false;
        for (let i = 0; i < lanes.length; i++) {
            const lane = lanes[i];
            const collides = lane.some(placedEntry => entry.start < placedEntry.end && entry.end > placedEntry.start);
            if (!collides) {
                lane.push(entry);
                layoutInfo.set(entry.id, { lane: i + 1 });
                placed = true;
                break;
            }
        }
        if (!placed) {
            layoutInfo.set(entry.id, { lane: lanes.length + 1 });
            lanes.push([entry]);
        }
    });

    return h('div.weekview', [
        h('div.weekview__top', [
            h('div'),
            h('div.weekview--header', weekDates.map(day =>
                h('div.weekview--header-day', { key: format(day, 'yyyy-MM-dd') }, [
                    h('span.weekview--header-day__title', format(day, 'EEE', { locale: localeFR }).toUpperCase()),
                    h('button.weekview--header-day__number', {
                        class: { 'wvh--today': isToday(day), 'wvh--selected': isSameDay(day, currentDate) },
                        on: { click: () => { dispatch(Msg.SetDate(day)); dispatch(Msg.SetView('day')); } }
                    }, format(day, 'd'))
                ])
            )),
            h('div.wv-gmt'),
            
            h('div.weekview--allday-module', {
                style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gridTemplateRows: `repeat(${lanes.length || 1}, 22px)`,
                    alignItems: 'center'
                }
            }, allDayEntries.map(entry => {
                const startDayIndex = Math.max(0, differenceInCalendarDays(entry.start, weekDates[0]));
                const endDayIndex = Math.min(6, differenceInCalendarDays(entry.end, weekDates[0]));

                const gridColumnStart = startDayIndex + 1;
                const gridColumnEnd = endDayIndex + 2;

                const info = layoutInfo.get(entry.id);

                return h('div.wv-allday-entry', {
                    key: entry.id,
                    style: {
                        gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
                        gridRow: `${info.lane} / ${info.lane + 1}`,
                        backgroundColor: model.categories[entry.category]?.color || '#333',
                    },
                    on: {
                        click: (e) => {
                            e.stopPropagation();
                            dispatch(Msg.OpenModal('entryOptions', { entryId: entry.id, position: e.target.getBoundingClientRect() }));
                        }
                    }
                }, entry.title);
            }))
        ]),

        h('div.weekview__grid', [
            h('div.weekview--sidebar', hours.map(hour => 
                h('span.sidegrid-cell', hour > 0 ? format(new Date(0, 0, 0, hour), 'h a') : '')
            )),
            h('div.weekview--calendar', weekDates.map(day => 
                renderDayColumn(day, weekEntries, model, dispatch)
            ))
        ])
    ]);
}
