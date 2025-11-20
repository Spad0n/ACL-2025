/**
 * @file Affiche la modale d'options pour un événement sélectionné.
 * Ce composant affiche les détails d'un événement et propose des actions
 * comme l'édition ou la suppression.
 * @author Votre Nom
 */

import { h } from 'snabbdom';
import { format, differenceInDays, formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale'; // Importer la locale française
import { Msg } from '../messages';
import { placePopup } from '../utils'; // Assurez-vous que cette fonction existe et est importée

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

// --- Fonctions d'aide (Helpers) ---

/**
 * Génère le texte d'en-tête dynamique basé sur le temps restant/écoulé.
 * @private
 * @param {Date} start - Date de début de l'événement.
 * @param {Date} end - Date de fin de l'événement.
 * @returns {string} Le texte formaté.
 */
function getTimeHeaderText(start, end) {
    const now = new Date();
    const options = { locale: fr }; // Utiliser la locale française pour la sortie

    if (end < now) {
        if (differenceInDays(now, end) < 1) {
            return `Ended ${formatDistanceToNowStrict(end, options)}`;
        }
        return `Ended on ${format(end, 'd MMM', options)}`;
    }
    if (start > now) {
        return `Starts in ${formatDistanceToNowStrict(start, options)}`;
    }
    return `Ends in ${formatDistanceToNowStrict(end, options)}`;
}

/**
 * Crée le VNode pour une icône SVG.
 * @private
 * @param {string} pathData - Le 'd' de l'élément path.
 * @returns {import('snabbdom').VNode}
 */
const createIcon = (pathData) =>
    h('svg', { attrs: { focusable: 'false', width: '20', height: '20', viewBox: '0 0 24 24', fill: 'var(--white2)' } }, [
        h('path', { attrs: { d: pathData } })
    ]);

const editIcon = createIcon('M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z');
const deleteIcon = createIcon('M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13z M9 8h2v9H9zm4 0h2v9h-2z');
const closeIcon = createIcon('M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z');
const descriptionIcon = createIcon('M6 12v-1.5h8V12Zm0 3v-1.5h6V15Zm-1.5 3q-.625 0-1.062-.448Q3 17.104 3 16.5v-11q0-.604.438-1.052Q3.875 4 4.5 4H6V2h1.5v2h5V2H14v2h1.5q.625 0 1.062.448Q17 4.896 17 5.5v11q0 .604-.438 1.052Q16.125 18 15.5 18Zm0-1.5h11V9h-11v7.5Z');

/**
 * Rend le composant d'options d'événement.
 * @param {Model} model - L'état actuel de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode | null}
 */
export default function entryOptionsView(model, dispatch) {
    const { entryId, position } = model.ui.entryOptions;

    // Si aucun entryId n'est défini, la modale n'est pas affichée
    if (!entryId || !position) {
        return null;
    }

    const entry = model.entries.find(e => e.id === entryId);

    // Si l'événement n'est pas trouvé (par exemple après une suppression), ne rien afficher
    if (!entry) {
        // Optionnel : dispatcher un message pour nettoyer l'état si l'ID est invalide
        // dispatch(Msg.CloseAllModals()); 
        return null;
    }

    const start = new Date(entry.start);
    const end = new Date(entry.end);
    const categoryColor = model.categories[entry.category]?.color || '#333';

    // Calcule dynamiquement la position de la popup
    const popupStyle = placePopup(400, 165, position);

    return h('div', [
        h('aside.entry__options--overlay', { on: { click: () => dispatch(Msg.CloseAllModals()) } }),
        h('aside.entry__options', { style: popupStyle }, [
            h('div.entry__options--content', [
                // --- En-tête ---
                h('div.entry__options--header', [
                    h('div.entry__options-datetime', [
                        h('div.entry__options-date', format(start, 'eeee d MMMM', { locale: fr })),
                        h('div.entry__options-time', getTimeHeaderText(start, end))
                    ]),
                    h('div.entry__options--header-icons', [
                        h('button.entry__options-icon.eoi__edit', {
                            on: { click: () => dispatch(Msg.OpenModal('form', { id: entry.id })) },
                            attrs: { 'data-tooltip': 'Edit' }
                        }, editIcon),
                        //h('button.entry__options-icon.eoi__delete', {
                        //    on: { click: () => dispatch(Msg.OpenModal('deleteConfirmation', { type: 'entry', id: entry.id })) },
                        //    attrs: { 'data-tooltip': 'Supprimer' }
                        //}, deleteIcon),
                        h('button.entry__options-icon.eoi__close', {
                            on: { click: () => dispatch(Msg.CloseAllModals()) },
                            attrs: { 'data-tooltip': 'Close' }
                        }, closeIcon)
                    ])
                ]),
                // --- Corps ---
                h('div.entry__options--body', [
                    // Titre
                    h('div.entry-option-desc', [
                        h('div.eob-icon'), // Icone vide pour l'alignement
                        h('div.eob-title', entry.title)
                    ]),
                    // Description (conditionnelle)
                    entry.description ? h('div.entry-option-desc', [
                        h('div.eob-icon', descriptionIcon),
                        h('div.eob-description', entry.description)
                    ]) : null,
                    // Catégorie
                    h('div.entry-option-desc', [
                        h('div.eob-icon', [
                            h('div.eob-category--icon', {
                                style: { 
                                    width: '12px', 
                                    height: '12px', 
                                    borderRadius: '50%',
                                    backgroundColor: categoryColor 
                                }
                            })
                        ]),
                        h('div.eob-category', entry.category)
                    ])
                ])
            ])
        ])
    ]);
}
