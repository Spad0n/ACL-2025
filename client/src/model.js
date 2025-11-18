import { startOfDay, format, addMinutes, addHours, setHours, subDays, addDays } from 'date-fns';

//==================================================================================
// TYPE DEFINITIONS (JSDoc @typedef)
// Définition des types de base vers les plus complexes
//==================================================================================

/**
 * Définit les coordonnées de la souris.
 * @typedef {Object} MousePosition
 * @property {number} x - La coordonnée X.
 * @property {number} y - La coordonnée Y.
 */

/**
 * Définit la structure d'un événement (entrée) dans le calendrier.
 * @typedef {Object} Entry
 * @property {string} id - Un identifiant unique pour l'événement.
 * @property {string} title - Le titre de l'événement.
 * @property {string} description - La description de l'événement.
 * @property {Date} start - La date et l'heure de début.
 * @property {Date} end - La date et l'heure de fin.
 * @property {string} category - Le nom de la catégorie associée.
 */

/**
 * Définit la structure d'une catégorie.
 * @typedef {Object} Category
 * @property {string} color - Le code couleur hexadécimal de la catégorie.
 * @property {boolean} active - Indique si la catégorie est visible.
 */

/**
 * Représente l'objet contenant toutes les catégories, où la clé est le nom de la catégorie.
 * @typedef {Object.<string, Category>} Categories
 */

/**
 * Définit l'état des préférences utilisateur, persistées entre les sessions.
 * @typedef {Object} Settings
 * @property {'dark' | 'light' | 'contrast'} theme - Le thème visuel de l'application.
 * @property {boolean} shortcutsEnabled - Si les raccourcis clavier sont activés.
 * @property {boolean} animationsEnabled - Si les animations CSS sont activées.
 * @property {boolean} sidebarCollapsed - Si la barre latérale est repliée.
 */

/**
 * L'état des erreurs possibles dans le formulaire.
 * La clé correspond au champ du formulaire.
 * @typedef {Object.<string, string>} FormErrors
 */

/**
 * L'état de la modale d'options d'un événement.
 * @typedef {Object} EntryOptionsState
 * @property {string|null} entryId - L'ID de l'événement affiché.
 * @property {DOMRect|null} position - La position pour afficher la modale.
 */
 
/**
 * L'état de la modale "Aller à la date".
 * @typedef {Object} GotoState
 * @property {string} inputValue - La valeur textuelle de l'input.
 * @property {string|null} error - Le message d'erreur en cas de date invalide.
 */

/**
 * L'état du datepicker flottant.
 * @typedef {Object} DatepickerState
 * @property {boolean} isOpen
 * @property {Object} position - Les coordonnées CSS (`top`, `left`).
 * @property {'form-start'|'form-end'|'header'|'sidebar'|null} target - Qui a déclenché l'ouverture du datepicker.
 * @property {Date} displayDate - Le mois/année actuellement affiché dans le datepicker.
 * @property {boolean} isChangingDate - Si la sous-modale de sélection mois/année est ouverte.
 */

/**
 * L'état de la logique de glisser-déposer.
 * @typedef {Object} DragState
 * @property {string|null} id - L'ID de l'événement en cours de déplacement.
 * @property {DOMRect|null} initialRect - La position et taille de l'élément au début du drag.
 * @property {MousePosition|null} initialMousePos - Position de la souris au mousedown.
 * @property {MousePosition|null} currentMousePos - Position actuelle de la souris.
 */
 
/**
 * L'état de la modale de confirmation de suppression.
 * @typedef {Object} DeleteConfirmationState
 * @property {'entry'|'category'|null} type
 * @property {string|null} id
 */

/**
 * L'état transitoire de l'interface utilisateur (UI). Non persisté.
 * @typedef {Object} UIState
 * @property {'form'|'goto'|'settings'|'entryOptions'|'deleteConfirmation'|'datepicker'|'timepicker'|'categoryForm'|null} activeModal - La modale actuellement active.
 * @property {boolean} viewSelectorOpen - Si le menu de sélection de vue est ouvert.
 * @property {boolean} isDragging - Si une opération de glisser-déposer est en cours.
 * @property {DragState} draggedEntry - Les informations sur l'élément déplacé.
 * @property {EntryOptionsState} entryOptions - L'état de la modale d'options d'événement.
 * @property {GotoState} goto - L'état de la modale "Aller à".
 * @property {DatepickerState} datepicker - L'état du datepicker flottant.
 * @property {DeleteConfirmationState} deleteConfirmation - L'état de la modale de confirmation.
 */

/**
 * L'état global et complet de l'application (le Modèle).
 * C'est la seule source de vérité pour le rendu de l'interface.
 * @typedef {Object} Model
 * @property {Date} currentDate - La date principale sur laquelle le calendrier est centré.
 * @property {Date} today - La date du jour (ne change pas pendant la session).
 * @property {'day'|'week'|'month'|'year'|'list'} currentView - La vue actuellement affichée.
 * @property {Entry[]} entries - La liste de tous les événements du calendrier.
 * @property {Categories} categories - L'objet contenant toutes les catégories.
 * @property {Settings} settings - Les préférences de l'utilisateur.
 * @property {UIState} ui - L'état transitoire de l'interface.
 */


//==================================================================================
// FONCTIONS D'INITIALISATION
//==================================================================================

///**
// * Charge une valeur depuis le localStorage. Gère la désérialisation
// * et retourne une valeur par défaut en cas d'échec.
// * @private
// * @param {string} key - La clé dans le localStorage.
// * @param {*} defaultValue - La valeur à retourner si la clé est absente ou invalide.
// * @returns {*} La valeur parsée ou la valeur par défaut.
// */
//function loadFromStorage(key, defaultValue) {
//    try {
//        const item = localStorage.getItem(key);
//        if (item === null) return defaultValue;
//
//        const parsed = JSON.parse(item);
//
//        // Réhydratation des dates
//        if (key === 'currentDate' && parsed) return new Date(parsed);
//        if (key === 'entries' && Array.isArray(parsed)) {
//            return parsed.map(entry => ({
//                ...entry,
//                start: new Date(entry.start),
//                end: new Date(entry.end)
//            }));
//        }
//        return parsed;
//    } catch (error) {
//        console.error(`Erreur lors du chargement de "${key}" depuis localStorage. Utilisation de la valeur par défaut.`, error);
//        return defaultValue;
//    }
//}

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
        categories: {
            'Personnel': { color: '#4285F4', active: true },
        },

        // --- Préférences utilisateur ---
        settings: {
            theme: 'dark',
            shortcutsEnabled: true,
            animationsEnabled: true,
            sidebarCollapsed: false
        },

        // --- État de l'UI (transitoire, non persisté) ---
        ui: {
            activeModal: null,
            viewSelectorOpen: false,
            isDragging: false,
            draggedEntry: { id: null, initialRect: null, initialMousePos: null, currentMousePos: null },
            entryOptions: { entryId: null, position: null },
            goto: { inputValue: format(today, 'MMM d yyyy'), error: null },
            datepicker: { isOpen: false, position: {}, target: null, displayDate: today, isChangingDate: false },
            deleteConfirmation: { type: null, id: null },
        }
    };
}
