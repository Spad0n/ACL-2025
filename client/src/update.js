import {
    addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears,
    startOfDay, isBefore, setMinutes, setHours, addMinutes
} from 'date-fns';
import { generateId, placePopup } from './utils';
import { getInitialModel } from './model';
import { Msg } from './messages';
import { triggerHtmxDialog, triggerHtmxPost } from './main';
import deleteConfirmationView from './components/deleteConfirmationView';

/**
 * @typedef {import('./model').Model} Model
 * @typedef {import('./messages').Message} Message
 */

/**
 * Décrit un effet de bord à exécuter par le runtime (dans index.js).
 * @typedef {Object} Command
 * @property {'saveToStorage' | 'readFromFile' | 'exportToFile' | 'updateHash'} type - Le type de commande.
 * @property {{key: string, value: any} | any} [payload] - Les données nécessaires pour exécuter la commande.
 */

function saveUserSetting(key, value) {
    fetch('/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
    }).catch(err => console.error("Erreur sauvegarde setting:", err));
}

/**
 * La fonction Update. C'est une fonction pure qui calcule le nouvel état de l'application
 * en fonction de l'état actuel et du message reçu.
 *
 * @param {Message} msg - Le message décrivant le changement demandé.
 * @param {Model} model - L'état actuel de l'application.
 * @returns {Model} Un tableau contenant le nouveau modèle et une commande optionnelle.
 */
export function update(msg, model) {
    console.log(msg.type);
    switch (msg.type) {
    case 'SET_VIEW': {
        return { ...model, currentView: msg.payload, ui: { ...model.ui, viewSelectorOpen: false } };
    }
    case 'SET_DATE': {
        return { ...model, currentDate: startOfDay(msg.payload) };
    }
    case 'NAVIGATE': {
        const navMap = {
            next: { day: addDays, week: addWeeks, month: addMonths, year: addYears },
            prev: { day: subDays, week: subWeeks, month: subMonths, year: subYears }
        };
        const navFunc = navMap[msg.payload][model.currentView];
        return navFunc ? { ...model, currentDate: navFunc(model.currentDate, 1) } : model;
    }
    case 'GO_TO_TODAY': {
        return { ...model, currentDate: model.today };
    }
    case 'HASH_CHANGE': {
        const view = msg.payload.slice(1) || 'month';
        const validViews = ['day', 'week', 'month', 'year', 'list'];
        return (validViews.includes(view) && model.currentView !== view)
            ? { ...model, currentView: view }
        : model;
    }
    case 'ADD_EVENT':
        triggerHtmxDialog('/dialog/event-form?action=add');
        return model;
    case 'EDIT_EVENT':
        const event = msg.payload;
        const params = new URLSearchParams({
            action: "edit",
            id: event.id,
            title: event.title,
            description: event.description,
            start: event.start, // Les dates sont déjà au format ISO string dans le modèle
            end: event.end,
        });
        const editUrl = `/dialog/event-form?${params.toString()}`;
        triggerHtmxDialog(editUrl);
        return model;
    case 'DELETE_EVENT':
        const eventSupp = msg.payload;
        const paramsSupp = new URLSearchParams({
            action: "delete",
            id: eventSupp.id,
            title: eventSupp.title,
        });
        const suppUrl = `/dialog/event-form?${paramsSupp.toString()}`;
        triggerHtmxDialog(suppUrl);
        return model;
    case 'OPEN_MODAL': {
        const { name, ...payload } = msg.payload;
        console.log(name);
        let newUiState = { ...model.ui, activeModal: name };

        if (name === 'form') {
            if (payload.id) {
                const entry = model.entries.find(e => e.id === payload.id);
                if (entry) {
                    const params = new URLSearchParams({
                        action: 'edit',
                        id: entry.id,
                        title: entry.title,
                        description: entry.description,
                        start: entry.start.toISOString(),
                        end: entry.end.toISOString(),
                        color: model.categories[entry.category]?.color.replace('#', '') || '4a90e2',
                        category: entry.category,
                    });
                    triggerHtmxDialog(`/dialog/event-form?${params.toString()}`);
                }
            } else {
                // Sinon, c'est une création.
                const params = new URLSearchParams({ action: 'add' });
                // Si une date de début est fournie (ex: clic sur une cellule)
                if (payload.startDate) {
                    params.set('start', payload.startDate.toISOString());
                }
                triggerHtmxDialog(`/dialog/event-form?${params.toString()}`);
            }
            // IMPORTANT : Comme c'est un effet de bord externe, on ne change pas le modèle.
            return model;
        }
        if (name === 'entryOptions') {
            newUiState.entryOptions = { entryId: payload.entryId, position: payload.position };
        } else if (name === 'deleteConfirmation') {
            newUiState.deleteConfirmation = { type: payload.type, id: payload.id };
        } else if (name === 'goto') {
            newUiState.goto = getInitialModel().ui.goto;
        }else if (name === 'partage'){
            triggerHtmxDialog('/dialog/partage');
            return model;
        }
        else if (name === 'recherche') {
            triggerHtmxDialog('/dialog/recherche');
            return model;
        }
        else if (name === 'datepicker') {
        }else if(name === 'notification'){
            triggerHtmxDialog('/dialog/notification');
            return model; 
        }else if (name === 'datepicker') {
            const { date, position, target } = payload;
            const popupStyle = placePopup(256, 216, position); 
            
            const newDatepickerState = {
                ...model.ui.datepicker,
                isOpen: true,
                position: popupStyle,
                target: target,
                displayDate: date,
                isChangingDate: false
            };
            return { ...model, ui: { ...model.ui, datepicker: newDatepickerState } };
        } else if (name === 'deleteConfirmation') {
            newUiState.deleteConfirmation = { type: payload.type, id: payload.id };
        }
        
        return { ...model, ui: newUiState };
    }
    case 'ADD_CATEGORY': {
        triggerHtmxDialog('/dialog/category-form?action=add');
        return model;
    }

    case 'EDIT_CATEGORY': {
        const categoryName = msg.payload;
        const color = model.categories[categoryName]?.color || '#4285F4';
        const params = new URLSearchParams({
            action: 'edit',
            name: categoryName,
            color: color,
        });
        triggerHtmxDialog(`/dialog/category-form?${params.toString()}`);
        return model;
    }
    case 'CONFIRM_DELETION': {
        const { type, id } = model.ui.deleteConfirmation;
        if (type === 'entry' && id) {
            const newEntries = model.entries.filter(e => e.id !== id);
            const newUiState = {
                ...model.ui,
                activeModal: null,
                deleteConfirmation: getInitialModel().ui.deleteConfirmation
            };
            const newModel = {
                ...model,
                entries: newEntries,
                ui: newUiState,
            };

            return newModel;
        }
        if (type === 'category' && id) {
            const categoryName = id;
            const categoryObj = model.categories[categoryName];

            if (categoryObj) {
                // On envoie l'ID BDD et le Nom au serveur
                triggerHtmxPost('/categories/delete', { 
                    id: categoryObj.id, 
                    name: categoryName 
                });
            }
            
            const newUiState = {
                ...model.ui,
                activeModal: null,
                deleteConfirmation: getInitialModel().ui.deleteConfirmation
            };
            return { ...model, ui: newUiState };
        }
        return {...model, ui: { ...model.ui, activeModal: null } };
    }
    case 'CLOSE_ALL_MODALS': {
        const newUiState = {
            ...model.ui,
            activeModal: null,
            datepicker: { ...model.ui.datepicker, isOpen: false, isChangingDate: false },
            timepicker: { ...getInitialModel().ui.timepicker },
            viewSelectorOpen: false,
            entryOptions: getInitialModel().ui.entryOptions
        };
        return { ...model, ui: newUiState };
    }
    case 'TOGGLE_SIDEBAR': {
        const newSettings = { ...model.settings, sidebarCollapsed: !model.settings.sidebarCollapsed };
        return { ...model, settings: newSettings };
    }
    case 'TOGGLE_VIEW_SELECTOR': {
        return { ...model, ui: { ...model.ui, viewSelectorOpen: msg.payload } };
    }
    case 'FORM_OPEN_CREATE': {
        const { date, minuteOfDay } = msg.payload;
        const startDate = setMinutes(setHours(startOfDay(date), 0), minuteOfDay);
        const endDate = addMinutes(startDate, 60);

        const params = new URLSearchParams({
            action: 'add',
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        });
        const url = `/dialog/event-form?${params.toString()}`;
        triggerHtmxDialog(url);
        return model; // Ne modifie plus l'état local
    }
    case 'CATEGORY_DELETED': {
        const categoryName = msg.payload;
        
        const newCategories = { ...model.categories };
        delete newCategories[categoryName];

        const newEntries = model.entries.map(entry => 
            entry.category === categoryName 
                ? { ...entry, category: 'Default' } 
            : entry
        );

        return {
            ...model,
            categories: newCategories,
            entries: newEntries,
            ui: { ...model.ui, activeModal: null }
        };
    }
    case 'DELETE_CATEGORY': {
        const categoryNameToDelete = msg.payload;
        
        if (categoryNameToDelete === 'Default' || !model.categories[categoryNameToDelete]) {
            console.warn("Tentative de suppression de la catégorie par défaut ou d'une catégorie inexistante.");
            return model; // Toujours retourner un tableau de commandes
        }
        
        const newEntries = model.entries.map(entry => {
            if (entry.category === categoryNameToDelete) {
                return { ...entry, category: 'Default' };
            }
            return entry;
        });

        const newCategories = { ...model.categories };
        delete newCategories[categoryNameToDelete];
        
        const newModel = {
            ...model,
            entries: newEntries,
            categories: newCategories,
        };
        
        // **LA BONNE FAÇON DE FAIRE : RETOURNER UN TABLEAU DE COMMANDES**
        const commands = [
            saveCmd('entries', newEntries),
            saveCmd('categories', newCategories)
        ];
        
        return newModel;
    }
    case 'TOGGLE_CATEGORY': {
        const categoryName = msg.payload;
        const oldCategory = model.categories[categoryName];
        if (!oldCategory) return model;
        const newCategories = { ...model.categories, [categoryName]: { ...oldCategory, active: !oldCategory.active } };
        return { ...model, categories: newCategories };
    }
    case 'COMFIRMER_PARTAGE':{
        const { id_agenda, username } = msg.payload;
        triggerHtmxPost('/agenda/partage', {
            id_agenda, 
            username
        });

        const newUiState = {
            ...model.ui,
            activeModal: null
        };

        return { ...model, ui: newUiState};
    }
    case 'PARTAGE_OK':{
        return{
            ...model,
            ui: {
                ...model.ui,
                toast: "Agenda partagé"
            }
        };
    }
    case 'HIDE_TOAST': {
        return { ...model, ui: { ...model.ui, toast: null}};
    }
    case 'DATEPICKER_SET_DISPLAY_DATE': {
        const newDatepicker = { ...model.ui.datepicker, displayDate: msg.payload };
        return { ...model, ui: { ...model.ui, datepicker: newDatepicker } };
    }
    case 'DATEPICKER_TOGGLE_CHANGE_DATE': {
        const newDatepicker = { ...model.ui.datepicker, isChangingDate: msg.payload };
        return { ...model, ui: { ...model.ui, datepicker: newDatepicker } };
    }
    case 'DATEPICKER_SELECT_DATE': {
        const selectedDate = startOfDay(msg.payload);
        const target = model.ui.datepicker.target;
        const closedState = { ...model.ui, activeModal: null, datepicker: { ...model.ui.datepicker, isOpen: false } };
        
        if (target === 'header') {
            return { ...model, currentDate: selectedDate, ui: closedState };
        }
        return {...model, ui: closedState};
    }
    case 'GOTO_UPDATE_INPUT': {
        return { ...model, ui: { ...model.ui, goto: { inputValue: msg.payload, error: null }}};
    }
    case 'GOTO_SET_ERROR': {
        const newGotoState = { ...model.ui.goto, error: msg.payload };
        return { ...model, ui: { ...model.ui, goto: newGotoState } }; // Retourner un tableau vide
    }
    case 'SET_THEME': {
        //const newSettings = { ...model.settings, theme: msg.payload };
        //return { ...model, settings: newSettings };
        const newTheme = msg.payload;
        
        // Sauvegarde asynchrone (Side Effect)
        saveUserSetting('theme', newTheme);
        localStorage.setItem('theme', newTheme);

        const newSettings = { ...model.settings, theme: newTheme };
        return { ...model, settings: newSettings };
    }
    case 'EXPORT_DATA': {
        return model;
    }
    case 'IMPORT_DATA': {
        return model;
    }
    case 'DATA_IMPORTED': {
        const { entries, categories, settings } = msg.payload;
        const hydratedEntries = entries.map(e => ({...e, start: new Date(e.start), end: new Date(e.end)}));
        const newModel = {
            ...model,
            entries: hydratedEntries,
            categories: categories || model.categories,
            settings: { ...model.settings, ...settings }
        };
        // Pour l'instant, on ne gère qu'une commande à la fois pour la simplicité
        return newModel;
    }
    case 'SAVE_ENTRY': {
        const savedEntry = {
            ...msg.payload,
            // Important : réhydrater les dates qui arrivent en string JSON
            start: new Date(msg.payload.start),
            end: new Date(msg.payload.end),
        };
        const index = model.entries.findIndex(e => e.id === savedEntry.id);
        let newEntries;

        if (index > -1) { // Mise à jour
            newEntries = model.entries.map(e => e.id === savedEntry.id ? savedEntry : e);
        } else { // Création
            newEntries = [...model.entries, savedEntry];
        }
        const newModel = { ...model, entries: newEntries };
        return newModel; // Sauvegarde dans le localStorage
    }

    case 'ENTRY_DELETED': {
        const entryId = msg.payload;
        const newEntries = model.entries.filter(e => e.id !== entryId);
        const newModel = { ...model, entries: newEntries };
        return newModel;
    }
    case 'AGENDAS_LOADED': {
        // Mise à jour pure du modèle avec les nouvelles catégories
        return { ...model, categories: msg.payload };
    }
    default:
        console.warn('Message non traité:', msg.type);
        return model;
    }
}
