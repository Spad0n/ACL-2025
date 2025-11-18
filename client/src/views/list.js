import { h } from 'snabbdom';
import {
    format,
    isSameDay,
    startOfDay,
    localeFR
} from '../dateUtils';
import { Msg } from '../messages';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

/**
 * Rend une seule ligne d'événement dans la liste.
 * @private
 */
function renderRowGroupCell(entry, model, dispatch) {
    const categoryColor = model.categories[entry.category]?.color || '#333';
    
    // Détermine le texte à afficher pour l'heure/la durée
    const timeText = isSameDay(entry.start, entry.end)
        ? `${format(entry.start, 'p', { locale: localeFR })} - ${format(entry.end, 'p', { locale: localeFR })}`
        : format(entry.start, 'd MMM', { locale: localeFR }); // Pour les événements sur plusieurs jours

    return h('div.rowgroup--cell', {
        key: entry.id,
        on: {
            click: (e) => dispatch(Msg.OpenModal('entryOptions', { entryId: entry.id, position: e.target.getBoundingClientRect() }))
        }
    }, [
        h('div.rowgroup--cell__color', { style: { backgroundColor: categoryColor } }),
        h('div.rowgroup--cell__time', timeText),
        h('div.rowgroup--cell__title', entry.title)
    ]);
}

/**
 * Rend un groupe de lignes pour une journée spécifique.
 * @private
 */
function renderRowGroup(dateString, entries, model, dispatch, isFirst) {
    const date = new Date(dateString);
    
    // Cliquer sur l'en-tête du jour navigue vers la vue journalière de cette date
    const handleHeaderClick = () => {
        dispatch(Msg.SetDate(date));
        dispatch(Msg.SetView('day'));
    };
    
    return h('div.listview__rowgroup', { key: dateString }, [
        h('div.rowgroup-header', [
            h('div.rowgroup--header__datenumber', {
                class: { 'top-datenumber': isFirst },
                on: { click: handleHeaderClick }
            }, format(date, 'd')),
            h('div.rowgroup--header__monthdow', {
                class: { 'top-monthdow': isFirst }
            }, format(date, 'MMM, EEE', { locale: localeFR }).toUpperCase())
        ]),
        h('div.rowgroup-content', entries.map(entry => renderRowGroupCell(entry, model, dispatch)))
    ]);
}

/**
 * Rend le composant de la vue Liste/Planning.
 * @param {Model} model - L'état de l'application.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
export default function listView(model, dispatch) {
    const today = startOfDay(new Date());
    
    // 1. Filtrer les catégories actives
    const activeCategories = new Set(
        Object.keys(model.categories).filter(key => model.categories[key].active)
    );
    
    // 2. Filtrer les événements à venir des catégories actives et les trier
    const upcomingEntries = model.entries
        .filter(entry => 
            activeCategories.has(entry.category) && 
            new Date(entry.end) >= today // Affiche les événements qui ne sont pas encore terminés
        )
        .sort((a, b) => new Date(a.start) - new Date(b.start));

    // Si pas d'événements, afficher un message
    if (upcomingEntries.length === 0) {
        return h('div.listview.empty-list', [
            h('h2.empty-list-title', 'Aucun événement à venir.')
        ]);
    }
    
    // 3. Grouper les événements par jour
    const groupedEntries = upcomingEntries.reduce((acc, entry) => {
        // Grouper par la date de début de l'événement
        const dateKey = format(startOfDay(new Date(entry.start)), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(entry);
        return acc;
    }, {});
    
    // 4. Trier les clés (jours) pour s'assurer de l'ordre chronologique
    const sortedDays = Object.keys(groupedEntries).sort();

    return h('div.listview', [
        h('div.listview__body', sortedDays.map((dateString, index) =>
            renderRowGroup(dateString, groupedEntries[dateString], model, dispatch, index === 0)
        ))
    ]);
}
