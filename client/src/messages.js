/**
 * Le type de base pour tous les messages de l'application.
 * @typedef {Object} Message
 * @property {string} type - Un identifiant unique en majuscules pour le message.
 * @property {*} [payload] - Les données optionnelles associées à l'action.
 */

/**
 * Contient des fonctions créatrices pour tous les messages possibles.
 * L'utilisation de ces fonctions assure la cohérence des messages à travers l'application.
 * @namespace Msg
 */
export const Msg = {
    /**
     * Change la vue principale du calendrier.
     * @param {'day'|'week'|'month'|'year'|'list'} view - La nouvelle vue à afficher.
     * @returns {Message}
     */
    SetView: (view) => ({
        type: 'SET_VIEW',
        payload: view
    }),

    /**
     * Change la date centrale du calendrier.
     * @param {Date} date - La nouvelle date.
     * @returns {Message}
     */
    SetDate: (date) => ({
        type: 'SET_DATE',
        payload: date
    }),

    /**
     * Navigue vers la période précédente ou suivante (jour, semaine, mois, année).
     * @param {'prev'|'next'} direction - La direction de la navigation.
     * @returns {Message}
     */
    Navigate: (direction) => ({
        type: 'NAVIGATE',
        payload: direction
    }),

    /**
     * Centre le calendrier sur la date d'aujourd'hui.
     * @returns {Message}
     */
    GoToToday: () => ({
        type: 'GO_TO_TODAY'
    }),
    
    /**
     * Gère le changement de hash dans l'URL.
     * @param {string} hash - Le nouveau hash de l'URL.
     * @returns {Message}
     */
    HashChange: (hash) => ({
        type: 'HASH_CHANGE',
        payload: hash
    }),

    /**
     * Ouvre une modale spécifique.
     * @param {'form'|'goto'|'settings'|'entryOptions'|'deleteConfirmation'} name - Le nom de la modale à ouvrir.
     * @param {Object} [payload] - Données initiales pour la modale (ex: { entryId: '...' }).
     * @returns {Message}
     */
    OpenModal: (name, payload = {}) => ({
        type: 'OPEN_MODAL',
        payload: { name, ...payload }
    }),

    /**
     * Ferme toutes les modales et superpositions actives.
     * @returns {Message}
     */
    CloseAllModals: () => ({
        type: 'CLOSE_ALL_MODALS'
    }),
    
    /**
     * Affiche ou masque la barre latérale.
     * @returns {Message}
     */
    ToggleSidebar: () => ({
        type: 'TOGGLE_SIDEBAR'
    }),

    /**
     * Affiche ou masque le sélecteur de vue (Day, Week, etc.).
     * @param {boolean} isOpen - Indique si le sélecteur doit être ouvert.
     * @returns {Message}
     */
    ToggleViewSelector: (isOpen) => ({
        type: 'TOGGLE_VIEW_SELECTOR',
        payload: isOpen
    }),
    
    /**
     * Supprime un événement.
     * @param {string} entryId - L'ID de l'événement à supprimer.
     * @returns {Message}
     */
    DeleteEntry: (entryId) => ({
        type: 'DELETE_ENTRY',
        payload: entryId
    }),

    /**
     * Change le thème de l'application.
     * @param {'dark'|'light'|'contrast'} theme - Le nouveau thème.
     * @returns {Message}
     */
    SetTheme: (theme) => ({
        type: 'SET_THEME',
        payload: theme
    }),
    
    /**
     * Déclenche l'exportation des données du calendrier au format JSON.
     * @returns {Message}
     */
    ExportData: () => ({
        type: 'EXPORT_DATA'
    }),

    /**
     * Déclenche l'importation de données depuis un fichier JSON.
     * Ce message initie généralement un effet de bord (ouvrir le sélecteur de fichier).
     * @returns {Message}
     */
    ImportData: () => ({
        type: 'IMPORT_DATA'
    }),

    /**
     * Message interne pour gérer les données chargées depuis un fichier.
     * @param {{entries: Array, categories: Object}} data - Les données importées.
     * @returns {Message}
     */
    DataImported: (data) => ({
        type: 'DATA_IMPORTED',
        payload: data
    }),

    /**
     * Change la date affichée dans le datepicker (navigation mois/année), sans sélectionner la date.
     * @param {Date} date 
     */
    DatepickerSetDisplayDate: (date) => ({
        type: 'DATEPICKER_SET_DISPLAY_DATE',
        payload: date
    }),

    /**
     * Ouvre ou ferme la vue de sélection rapide Mois/Année dans le datepicker.
     * @param {boolean} isOpen 
     */
    DatepickerToggleChangeDate: (isOpen) => ({
        type: 'DATEPICKER_TOGGLE_CHANGE_DATE',
        payload: isOpen
    }),

    /**
     * Sélectionne une date concrète. 
     * L'effet dépendra de `model.ui.datepicker.target` (header vs form).
     * @param {Date} date 
     */
    DatepickerSelectDate: (date) => ({
        type: 'DATEPICKER_SELECT_DATE',
        payload: date
    }),

    /**
     * @returns {Message}
     */
    ResetForm: () => ({ type: 'RESET_FORM' }),

    /**
     * @param {boolean} isOpen
     * @returns {Message}
     */
    ToggleFormCategoryModal: (isOpen) => ({ type: 'TOGGLE_FORM_CATEGORY_MODAL', payload: isOpen }),

    /**
     * Met à jour le contenu du champ de saisie de la modale "Aller à".
     * @param {string} value - La nouvelle valeur du champ.
     * @returns {Message}
     */
    GotoUpdateInput: (value) => ({
        type: 'GOTO_UPDATE_INPUT',
        payload: value
    }),

    /**
     * Définit un message d'erreur pour la modale "Aller à".
     * @param {string} error - Le message d'erreur à afficher.
     * @returns {Message}
     */
    GotoSetError: (error) => ({
        type: 'GOTO_SET_ERROR',
        payload: error
    }),

    /**
     * Ouvre le formulaire pour créer un nouvel événement à une date et heure spécifiques.
     * @param {Date} date - Le jour de début.
     * @param {number} minuteOfDay - Le nombre de minutes depuis le début de la journée (0-1439).
     * @returns {Message}
     */
    FormOpenCreate: (date, minuteOfDay) => ({
        type: 'FORM_OPEN_CREATE',
        payload: { date, minuteOfDay }
    }),

    ConfirmDeletion: () => ({
        type: 'CONFIRM_DELETION'
    }),

    /**
     * @param {import('../model').Entry} entry - L'événement sauvegardé.
     * @returns {Message}
     */
    SaveEntry: (entry) => ({
        type: 'SAVE_ENTRY',
        payload: entry
    }),

    /**
     * @param {string} entryId - L'ID de l'événement à supprimer.
     * @returns {Message}
     */
    EntryDeleted: (entryId) => ({
        type: 'ENTRY_DELETED',
        payload: entryId
    }),

    /**
     * Déclenche l'affichage du formulaire de création de catégorie.
     * @returns {Message}
     */
    AddCategory: () => ({ type: 'ADD_CATEGORY' }),
    
    /**
     * Déclenche l'affichage du formulaire d'édition de catégorie.
     * @param {string} categoryName - Le nom de la catégorie à éditer.
     * @returns {Message}
     */
    EditCategory: (categoryName) => ({ type: 'EDIT_CATEGORY', payload: categoryName }),

    /**
     * Met à jour ou ajoute une catégorie après une sauvegarde réussie.
     * @param {{name: string, color: string, oldName?: string}} categoryData 
     * @returns {Message}
     */
    SaveCategory: (categoryData) => ({ type: 'SAVE_CATEGORY', payload: categoryData }),

    /**
     * Gère la suppression d'une catégorie confirmée par le serveur.
     * @param {string} categoryName - Le nom de la catégorie à supprimer.
     * @returns {Message}
     */
    CategoryDeleted: (categoryName) => ({ type: 'CATEGORY_DELETED', payload: categoryName }),

    /**
     * Met à jour la liste des catégories (Agendas) dans le modèle.
     * @param {Object} categories - Le nouvel objet de catégories.
     * @returns {Message}
     */
    AgendasLoaded: (categories) => ({
        type: 'AGENDAS_LOADED',
        payload: categories
    }),
};

