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
        { value: 'dark', label: 'Dark', className: 'theme-option-dark' },
        { value: 'light', label: 'Light', className: 'theme-option-light' },
        { value: 'contrast', label: 'High Contrast', className: 'theme-option-contrast' }
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
                h('div.sub-menu--title', 'Settings & Data'),
                h('div.close-sub-menu', { on: { click: () => dispatch(Msg.CloseAllModals()) } }, '×')
            ]),
            // --- Corps de la modale ---
            h('div.sub-menu__body', [
                h('div.sub-menu-content', [

                    // --- Section Données (Import/Export) ---
                    h('div.sub-menu--item', [
                        h('div.sub-menu--item__title', 'Calendar Data (JSON)'),
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
                ])
            ])
        ])
    ]);
}
