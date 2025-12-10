import { rrulestr } from 'rrule';
import { isWithinInterval } from 'date-fns';

/**
 * Récupère les événements visibles pour une plage donnée (fenêtre de vue).
 * Mélange les événements simples et les occurrences de récurrences.
 * 
 * @param {Array} allEntries - Tous les événements bruts du modèle
 * @param {Date} rangeStart - Début de la vue (ex: 1er du mois)
 * @param {Date} rangeEnd - Fin de la vue (ex: 31 du mois)
 * @param {Object} categories - Pour récupérer les couleurs
 */
export function getVisibleEvents(allEntries, rangeStart, rangeEnd, categories) {
    const visibleEvents = [];

    allEntries.forEach(entry => {
        // 1. Récupérer couleur et catégorie
        const categoryData = categories[entry.category];
        // Si catégorie inactive, on ignore
        if (categoryData && !categoryData.active) return;
        
        const color = categoryData ? categoryData.color : '#333';
        const baseProps = { ...entry, color };

        if (entry.rrule) {
            // --- C'EST ICI QU'ON CALCULE À LA VOLÉE ---
            try {
                const dtStart = new Date(entry.start);
                const duration = new Date(entry.end).getTime() - dtStart.getTime();

                // Création de la règle
                const rule = rrulestr(entry.rrule, { dtstart: dtStart });

                // On demande à rrule UNIQUEMENT les dates de la vue actuelle
                const dates = rule.between(rangeStart, rangeEnd, true);

                dates.forEach((date, index) => {
                    // On génère un ID unique basé sur la date pour éviter les conflits
                    // "IDOriginal_Timestamp"
                    const virtualId = `${entry.id}_recur_${date.getTime()}`;
                    
                    visibleEvents.push({
                        ...baseProps,
                        id: virtualId,
                        originalId: entry.id, // Important pour Edit/Delete
                        start: date,
                        end: new Date(date.getTime() + duration)
                    });
                });
            } catch (e) {
                console.error("Erreur RRule", entry.id, e);
            }
        } else {
            // --- Événement Standard ---
            // On vérifie s'il chevauche la plage affichée
            if (
                (entry.start >= rangeStart && entry.start <= rangeEnd) ||
                (entry.end >= rangeStart && entry.end <= rangeEnd) ||
                (entry.start <= rangeStart && entry.end >= rangeEnd)
            ) {
                visibleEvents.push(baseProps);
            }
        }
    });

    return visibleEvents;
}
