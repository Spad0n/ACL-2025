import { h } from 'snabbdom';
import { Msg } from '../messages';
import { translate } from '../../../server/langue/langue.js';

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
        { value: 'dark', label: translate(model.settings.language, 'settings.theme.dark'), className: 'theme-option-dark' },
        { value: 'light', label: translate(model.settings.language, 'settings.theme.light'), className: 'theme-option-light' },
        { value: 'contrast', label: translate(model.settings.language, 'settings.theme.contrast'), className: 'theme-option-contrast' }
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
 * Rend les options de sélection de la langue.
 * @private
 * @param {Model} model - L'état de l'application.
 * @param {function(Message): void} dispatch - La fonction de dispatch.
 * @returns {import('snabbdom').VNode}
 */
function renderLanguageOptions(model, dispatch) {
    const languages = [
        { value: 'en', label: translate(model.settings.language, 'settings.languageOptions.english') },
        { value: 'fr', label: translate(model.settings.language, 'settings.languageOptions.french') }
    ];

    return h('div.sub-menu--item__actions.language-actions', languages.map(language =>
        h('label.language-option', {
            class: { selected: model.settings.language === language.value },
            on: { click: () => {
                console.log(`Language changed to: ${language.value}`);
                dispatch(Msg.SetLanguage(language.value));
                fetch(`/setLanguage/${language.value}`, { method: 'POST' });
            }}
        }, [
            h('input.language-radio__input', {
                props: {
                    type: 'radio',
                    name: 'languageoption',
                    value: language.value,
                    checked: model.settings.language === language.value
                },
                on: { click: (e) => e.stopPropagation() }
            }),
            h('span', language.label)
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
                h('div.sub-menu--title', translate(model.settings.language, 'settings.title')),
                h('div.close-sub-menu', { on: { click: () => dispatch(Msg.CloseAllModals()) } }, '×')
            ]),
            // --- Corps de la modale ---
            h('div.sub-menu__body', [
                h('div.sub-menu-content', [

                    // --- Section Données (Import/Export) ---
                    h('div.sub-menu--item', [
                        h('div.sub-menu--item__title', translate(model.settings.language, 'settings.calendarData')),
                        h('div.sub-menu--item__description', translate(model.settings.language, 'settings.calendarDescription')),
                        h('div.sub-menu--item__actions', [
                            h('div.sm-download-json', [
                                h('button.sm-json-btn.down-json', { on: { click: () => {
                                    window.location.href = '/importerExporter/agenda';
                                } } }, translate(model.settings.language, 'settings.importExport'))
                            ])
                        ]),
                        h('div.sub-menu--item__title', translate(model.settings.language, 'settings.userData')),
                        h('div.sub-menu--item__description', translate(model.settings.language, 'settings.userDescription')),
                        h('div.sub-menu--item__actions', [
                            h('div.sm-download-json', [
                                h('button.sm-json-btn.down-json', { on: { click: () => {
                                    window.location.href = '/compte/modifier/utilisateur';
                                } } }, translate(model.settings.language, 'settings.espaceUser') )
                            ])
                        ])
                    ]),
                    
                    // --- Section Thème ---
                    h('div.sub-menu--item.smi-theme-actions', [
                        h('div.sub-menu--item__title', translate(model.settings.language, 'settings.appTheme')),
                        renderThemeOptions(model, dispatch)
                    ]),

                    // --- Section Langue ---
                    h('div.sub-menu--item.smi-language-actions', [
                        h('div.sub-menu--item__title', translate(model.settings.language, 'settings.language')),
                        renderLanguageOptions(model, dispatch)
                    ]),
                ])
            ])
        ])
    ]);
}
