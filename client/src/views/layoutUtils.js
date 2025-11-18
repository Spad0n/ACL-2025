/**
 * Calcule la disposition en colonnes pour un ensemble d'événements d'une journée.
 * Identifie les groupes d'événements qui se chevauchent et détermine la position
 * et la largeur de chaque événement au sein de son groupe.
 *
 * @param {import('../model').Entry[]} dayEntries - La liste des événements pour une journée.
 * @returns {Map<string, { colIndex: number, totalCols: number }>}
 * Une Map associant l'ID de chaque événement à sa position en colonnes.
 */
export function calculateLayout(dayEntries) {
    if (!dayEntries || dayEntries.length === 0) {
        return new Map();
    }

    // 1. Trier tous les événements par heure de début.
    const sortedEntries = [...dayEntries].sort((a, b) => a.start - b.start);
    const layoutMap = new Map();

    // 2. Traiter les événements par "groupes de collision".
    const processedEntryIds = new Set();

    for (const entry of sortedEntries) {
        if (processedEntryIds.has(entry.id)) {
            continue; // Déjà traité dans un groupe précédent
        }

        // 3. Construire le groupe de collision pour l'événement courant.
        const collisionGroup = [];
        let groupEndTime = new Date(0);

        // On trouve tous les événements qui se chevauchent de manière transitive.
        sortedEntries.forEach(potentialCollision => {
            if (
                !processedEntryIds.has(potentialCollision.id) &&
                (
                    (collisionGroup.length === 0 && potentialCollision.id === entry.id) || // Démarrer le groupe
                    (potentialCollision.start < groupEndTime) // S'il chevauche l'étendue du groupe
                )
            ) {
                collisionGroup.push(potentialCollision);
                // Étendre la fin du groupe si nécessaire
                if (potentialCollision.end > groupEndTime) {
                    groupEndTime = potentialCollision.end;
                }
            }
        });

        // 4. Calculer les colonnes pour ce groupe de collision.
        const columns = []; // Chaque sous-tableau est une colonne
        collisionGroup.sort((a, b) => a.start - b.start);

        for (const item of collisionGroup) {
            let placed = false;
            // Essayer de placer l'événement dans une colonne existante
            for (let i = 0; i < columns.length; i++) {
                const lastInColumn = columns[i][columns[i].length - 1];
                if (item.start >= lastInColumn.end) {
                    columns[i].push(item);
                    placed = true;
                    break;
                }
            }
            // Si aucune place n'a été trouvée, créer une nouvelle colonne
            if (!placed) {
                columns.push([item]);
            }
        }
        
        // 5. Assigner les informations de layout (colIndex, totalCols) à chaque événement du groupe.
        const totalCols = columns.length;
        columns.forEach((column, colIndex) => {
            column.forEach(eventInColumn => {
                layoutMap.set(eventInColumn.id, { colIndex, totalCols });
                processedEntryIds.add(eventInColumn.id); // Marquer comme traité
            });
        });
    }

    return layoutMap;
}
