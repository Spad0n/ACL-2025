import { h } from 'snabbdom';
import { Msg } from '../messages';

/**
 * @typedef {import('../model').Model} Model
 * @typedef {import('../messages').Message} Message
 */

//==================================================================================
// SOUS-COMPOSANTS (HELPERS DE VUE)
//==================================================================================

/**
 * Rend les options de sélection du thème.
 * @private
 * @param {Model} model - L'état de l'application.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
function renderThemeOptions(model, dispatch) {
    const themes = [
        { value: 'dark', label: 'Sombre', className: 'theme-option-dark' },
        { value: 'light', label: 'Clair', className: 'theme-option-light' },
        { value: 'contrast', label: 'Contraste Élevé', className: 'theme-option-contrast' }
    ];

    return h('div.sub-menu--item__actions.theme-actions', themes.map(theme =>
        h('div.theme-option', {
            class: { [theme.className]: true },
            on: { click: () => dispatch(Msg.SetTheme(theme.value)) }
        }, [
            h('input.theme-radio__input', {
                props: {
                    type: 'radio',
                    name: 'themeoption',
                    value: theme.value,
                    // L'input est "checked" si son 'value' correspond au thème dans le modèle
                    checked: model.settings.theme === theme.value
                }
            }),
            h('span', theme.label)
        ])
    ));
}

/**
 * Rend un interrupteur (toggle switch) pour une préférence.
 * @private
 * @param {string} label - Le texte à afficher.
 * @param {boolean} isChecked - Si l'interrupteur est activé.
 * @param {Message} message - Le message à dispatcher au changement.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
function renderToggle(label, isChecked, message, dispatch) {
    // Unique ID for the input and label association
    const inputId = `toggle-${label.replace(/\s+/g, '-')}`;

    return h('div.smia-set-shortcut-status', [
        h('span.smia-set-status-title', label),
        h('div.smia-disable-shortcuts__btn', [
            h('label', { attrs: { for: inputId } }, [
                h('input', {
                    props: { type: 'checkbox', id: inputId, checked: isChecked },
                    on: { change: () => dispatch(message) }
                }),
                h('span.smia-slider')
            ])
        ])
    ]);
}

//==================================================================================
// COMPOSANT PRINCIPAL
//==================================================================================

/**
 * Rend le composant de la modale des Paramètres.
 * @param {Model} model - L'état actuel de l'application.
 * @param {function(Message): void} dispatch - La fonction pour dispatcher les messages.
 * @returns {import('snabbdom').VNode | null}
 */
export default function settingsView(model, dispatch) {
    if (model.ui.activeModal !== 'settings') {
        return null;
    }

    return h('div.settings-container', [
        h('aside.sidebar-sub-menu__overlay', { on: { click: () => dispatch(Msg.CloseAllModals()) } }),
        h('aside.sidebar-sub-menu', [
            // --- En-tête de la modale ---
            h('div.sub-menu__header', [
                h('div.sub-menu--title', 'Paramètres & Données'),
                h('div.close-sub-menu', { on: { click: () => dispatch(Msg.CloseAllModals()) } }, '×')
            ]),
            // --- Corps de la modale ---
            h('div.sub-menu__body', [
                h('div.sub-menu-content', [

                    // --- Section Données (Import/Export) ---
                    h('div.sub-menu--item', [
                        h('div.sub-menu--item__title', 'Données du Calendrier (JSON)'),
                        h('div.sub-menu--item__description', 'Download a backup or import from a file. Importing will overwrite existing data.'),
                        h('div.sub-menu--item__actions', [
                            h('div.sm-download-json', [
                                h('button.sm-json-btn.down-json', { on: { click: () => {
                                    window.location.href = '/importerExporter/agenda';
                                } } }, 'Import or Export Agenda')
                            ])
                        ])
                    ]),
                    
                    // --- Section Thème ---
                    h('div.sub-menu--item.smi-theme-actions', [
                        h('div.sub-menu--item__title', 'App Theme'),
                        renderThemeOptions(model, dispatch)
                    ]),
                    
                    // --- Section Préférences ---
                    //h('div.sub-menu--item.smias', [
                    //    h('div.sub-menu--item__title', 'Préférences'),
                    //    h('div.sub-menu--item__actions.preferences-actions', { style: { flexDirection: 'column', alignItems: 'flex-start' } }, [
                    //        renderToggle('Activer les raccourcis clavier', model.settings.shortcutsEnabled, Msg.ToggleShortcuts(), dispatch),
                    //        renderToggle('Activer les animations', model.settings.animationsEnabled, Msg.ToggleAnimations(), dispatch),
                    //        h('button.toggle-kb-shortcuts-btn__smia', {
                    //            style: { marginTop: '16px' },
                    //            on: { click: () => dispatch(Msg.OpenModal('shortcuts')) }
                    //        }, 'Voir tous les raccourcis')
                    //    ])
                    //])
                ])
            ])
        ])
    ]);
}
