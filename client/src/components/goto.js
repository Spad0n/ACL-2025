import { h } from 'snabbdom';
import { parse, isValid, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Msg } from '../messages';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

/**
 * Tente de parser une chaîne de caractères en une date valide.
 * Essaie plusieurs formats courants.
 * @private
 * @param {string} dateString - La chaîne de caractères entrée par l'utilisateur.
 * @returns {Date | null} La date parsée ou null si invalide.
 */
function tryParseDate(dateString) {
    // Liste des formats à essayer, du plus spécifique au plus général.
    // 'P' est un format localisé comme "10/25/2023"
    const formats = ['P', 'PP', 'd MMMM yyyy', 'd MMM yyyy', 'MM/dd/yyyy', 'M/d/yyyy'];
    const now = new Date();

    for (const fmt of formats) {
        const date = parse(dateString, fmt, now, { locale: fr });
        if (isValid(date)) {
            return date;
        }
    }
    return null; // Retourne null si aucun format ne correspond
}

/**
 * Rend le composant de la modale "Aller à la date".
 * @param {Model} model - L'état actuel de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode | null} Le VNode représentant la modale, ou null.
 */
export default function gotoView(model, dispatch) {
    if (model.ui.activeModal !== 'goto') {
        return null;
    }

    const { goto } = model.ui;

    /**
     * Gère la soumission du formulaire (via clic ou touche Entrée).
     */
    const handleSubmit = () => {
        const newDate = tryParseDate(goto.inputValue);
        if (newDate) {
            // Si la date est valide, on dispatche le changement de date et on ferme la modale.
            dispatch(Msg.SetDate(newDate));
            dispatch(Msg.CloseAllModals());
        } else {
            // Sinon, on dispatche une mise à jour de l'erreur.
            dispatch(Msg.GotoSetError('Format de date invalide.'));
        }
    };

    return h('div', [
        // Overlay pour fermer en cliquant à l'extérieur
        h('aside.go-to-date-overlay', { on: { click: () => dispatch(Msg.CloseAllModals()) } }),

        // Conteneur de la modale
        h('aside.go-to-date', [
            h('div.go-to__header', [
                h('span.go-to-title', 'Aller à la date'),
                h('div.go-to-subtitle', [
                    h('span.gts-format', 'jour mois année'),
                    h('span.gts-mid', 'ou'),
                    h('span.gts-format', 'JJ/MM/AAAA'),
                ])
            ]),
            h('div.go-to__body', [
                h('input.go-to-input', {
                    props: {
                        type: 'text',
                        value: goto.inputValue,
                        placeholder: `ex: ${format(new Date(), 'd MMM yyyy')}`
                    },
                    on: {
                        // Met à jour la valeur dans le modèle à chaque frappe
                        input: (e) => dispatch(Msg.GotoUpdateInput(e.target.value)),
                        keydown: (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSubmit();
                            }
                            // La fermeture via 'Escape' est gérée globalement dans index.js
                        }
                    },
                    // Hook Snabbdom pour donner le focus à l'élément lors de son insertion dans le DOM
                    hook: {
                        insert: (vnode) => vnode.elm.focus()
                    }
                }),
                // Affiche le message d'erreur s'il y en a un
                goto.error ? h('div.go-to-err', goto.error) : null
            ]),
            h('div.go-to__footer', [
                h('button.cancel-go-to', {
                    on: { click: () => dispatch(Msg.CloseAllModals()) }
                }, 'Annuler'),
                h('button.submit-go-to', {
                    on: { click: handleSubmit }
                }, 'Aller')
            ])
        ])
    ]);
}
