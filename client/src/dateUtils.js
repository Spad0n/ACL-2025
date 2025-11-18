/**
 * @file Utilitaires pour la manipulation des dates, basés sur date-fns.
 * Centralise les fonctions de date-fns utilisées dans l'application pour
 * assurer la cohérence et faciliter les mises à jour.
 */

import {
    // Fonctions de formatage et de parsing
    format,
    parse,
    isValid,
    formatDistanceToNowStrict,

    // Fonctions de comparaison
    isSameDay,
    isBefore,
    isToday,
    isSameMonth,
    isWithinInterval,

    // Fonctions de calcul d'intervalles et de durées
    eachDayOfInterval,
    differenceInCalendarDays,
    differenceInMinutes,

    // Fonctions de manipulation de début/fin de période
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    startOfDay,
    endOfDay,

    // Fonctions d'extraction de composantes
    getYear,
    getMonth,
    getHours,
    getMinutes,

    // Fonctions de modification
    setYear,
    setMonth,
    setHours,
    setMinutes,
    addDays,
    subDays,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    addYears,
    subYears,
    addMinutes,
    getDay,
    getDaysInMonth,
} from 'date-fns';
import { fr } from 'date-fns/locale'; // Importer la locale française

/**
 * Renvoie un tableau de toutes les dates à afficher dans la vue mensuelle
 * pour une date donnée (incluant les jours des mois précédent/suivant).
 * @param {Date} date - La date du mois à afficher.
 * @returns {Date[]}
 */
export const getMonthViewDates = (date) => {
    // Assure que le premier jour de la semaine est Dimanche (ou Lundi si vous préférez, en ajustant la locale)
    const start = startOfWeek(startOfMonth(date), { locale: fr });
    const end = endOfWeek(endOfMonth(date), { locale: fr });
    return eachDayOfInterval({ start, end });
};

/**
 * Renvoie un tableau des dates pour la vue hebdomadaire.
 * @param {Date} date - N'importe quelle date de la semaine à afficher.
 * @returns {Date[]}
 */
export const getWeekViewDates = (date) => {
    const start = startOfWeek(date, { locale: fr });
    const end = endOfWeek(date, { locale: fr });
    return eachDayOfInterval({ start, end });
};

// Ré-exporte toutes les fonctions nécessaires pour qu'elles soient
// importables depuis un seul et même endroit.
export {
    format,
    parse,
    isValid,
    isSameDay,
    isBefore,
    isToday,
    isSameMonth,
    isWithinInterval,
    eachDayOfInterval,
    differenceInCalendarDays,
    differenceInMinutes,
    formatDistanceToNowStrict,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    startOfDay,
    endOfDay,
    getYear,
    getMonth,
    getHours,
    getMinutes,
    setYear,
    setMonth,
    setHours,
    setMinutes,
    addDays,
    subDays,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    addYears,
    subYears,
    getDay,
    getDaysInMonth,
    addMinutes,
    fr as localeFR // Exporter la locale pour pouvoir l'utiliser si besoin
};
