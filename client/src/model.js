import { startOfDay, format, addMinutes, addHours, setHours, subDays, addDays } from 'date-fns';

/**
 * @typedef {Object} Entry
 * @property {string} id - Un identifiant unique pour l'événement.
 * @property {string} title - Le titre de l'événement.
 * @property {string} description - La description de l'événement.
 * @property {Date} start - La date et l'heure de début.
 * @property {Date} end - La date et l'heure de fin.
 * @property {string} category - Le nom de la catégorie associée.
 */

/**
 * @typedef {Object} Category
 * @property {string} color - Le code couleur hexadécimal.
 * @property {boolean} active - Indique si la catégorie est visible.
 */

/**
 * @typedef {Object.<string, Category>} Categories
 */

/**
 * @typedef {Object} Settings
 * @property {'dark' | 'light' | 'contrast'} theme - Le thème visuel.
 * @property {boolean} sidebarCollapsed - Si la barre latérale est repliée.
 */

/**
 * @typedef {Object} EntryOptionsState
 * @property {string|null} entryId - L'ID de l'événement affiché.
 * @property {DOMRect|null} position - La position pour afficher la modale.
 */
 
/**
 * @typedef {Object} GotoState
 * @property {string} inputValue - La valeur textuelle de l'input.
 * @property {string|null} error - Le message d'erreur en cas de date invalide.
 */

/**
 * @typedef {Object} DatepickerState
 * @property {boolean} isOpen
 * @property {Object} position - Les coordonnées CSS (`top`, `left`).
 * @property {'form-start'|'form-end'|'header'|'sidebar'|null} target
 * @property {Date} displayDate
 * @property {boolean} isChangingDate
 */

/**
 * @typedef {Object} DeleteConfirmationState
 * @property {'entry'|'category'|null} type
 * @property {string|null} id
 */

/**
 * L'état transitoire de l'interface utilisateur (UI). Non persisté.
 * @typedef {Object} UIState
 * @property {'form'|'goto'|'settings'|'entryOptions'|'deleteConfirmation'|'datepicker'|'partage'|null} activeModal
 * @property {boolean} viewSelectorOpen
 * @property {EntryOptionsState} entryOptions
 * @property {GotoState} goto
 * @property {DatepickerState} datepicker
 * @property {DeleteConfirmationState} deleteConfirmation
 * @property {string|null} toast
 */

/**
 * L'état global et complet de l'application (le Modèle).
 * @typedef {Object} Model
 * @property {Date} currentDate
 * @property {Date} today
 * @property {'day'|'week'|'month'|'year'|'list'} currentView
 * @property {Entry[]} entries
 * @property {Categories} categories
 * @property {Settings} settings
 * @property {UIState} ui
 */


//==================================================================================
// FONCTIONS D'INITIALISATION
//==================================================================================

/**
 * Renvoie le modèle (état) initial de l'application.
 * @returns {Model} Le modèle initial complet.
 */
export function getInitialModel() {
const today = startOfDay(new Date());

    return {
        // --- État principal de l'application ---
        currentDate: today,
        today: today,
        currentView: 'month',

        // --- Données ---
        entries: [],
        categories: {},

        // --- Préférences utilisateur ---
        settings: {
            theme: 'dark',
            sidebarCollapsed: false
        },

        // --- État de l'UI (transitoire, non persisté) ---
        ui: {
            activeModal: null,
            viewSelectorOpen: false,
            entryOptions: { entryId: null, position: null },
            goto: { inputValue: format(today, 'MMM d yyyy'), error: null },
            datepicker: { isOpen: false, position: {}, target: null, displayDate: today, isChangingDate: false },
            deleteConfirmation: { type: null, id: null },
            toast: null
        }
    };
}
