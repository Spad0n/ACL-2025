import { h } from 'snabbdom';
import { Msg } from '../messages';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

/**
 * Rend le composant de la modale de confirmation de suppression.
 * @param {Model} model - L'état actuel de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode | null} Le VNode représentant la modale, ou null.
 */
export default function deleteConfirmationView(model, dispatch) {
    // La modale ne s'affiche que si c'est la modale active
    if (model.ui.activeModal !== 'deleteConfirmation') {
        return null;
    }

    const { type, id } = model.ui.deleteConfirmation;

    // Prépare le message à afficher en fonction du type d'élément à supprimer
    let confirmationText = 'Êtes-vous sûr(e) de vouloir supprimer cet élément ?';
    if (type === 'entry') {
        const entry = model.entries.find(e => e.id === id);
        if (entry) {
            confirmationText = `Êtes-vous sûr(e) de vouloir supprimer l'événement "${entry.title}" ?`;
        }
    } else if (type === 'category') {
        // La logique pour la suppression de catégorie peut être plus complexe
        confirmationText = `Êtes-vous sûr(e) de vouloir supprimer la catégorie "${id}" ? Tous les événements associés seront [action à définir].`;
    }

    return h('div.delete-confirmation-container', [
        // L'overlay semi-transparent derrière la modale
        h('aside.entry__options--overlay', { 
            style: { backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: '9998' },
            on: { click: () => dispatch(Msg.CloseAllModals()) } 
        }),

        // La modale elle-même
        h('aside.entry__options.delete-popup', { 
            style: { 
                position: 'fixed', 
                inset: '0', 
                margin: 'auto', 
                width: 'clamp(300px, 40vw, 450px)', 
                height: '180px', 
                zIndex: '9999' 
            } 
        }, [
            h('div.delete-popup__text', confirmationText),
            h('div.delete-popup__btns', [
                // Bouton "Annuler"
                h('button.delete-popup__cancel', {
                    on: { click: () => dispatch(Msg.CloseAllModals()) }
                }, 'Annuler'),
                // Bouton "Supprimer"
                h('button.delete-popup__confirm', {
                    on: { click: () => dispatch(Msg.ConfirmDeletion()) }
                }, 'Supprimer')
            ])
        ])
    ]);
}
