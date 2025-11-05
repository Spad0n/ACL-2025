import { h } from "./ui/elm.js";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { Button, ScrollBox } from '@pixi/ui';
import { format, parseISO, isSameDay, startOfDay, endOfDay, addDays } from 'date-fns';

/**
 * @typedef {import("./ui/elm.js").VNode} VNode
 * @typedef {import("./ui/elm.js").BaseVNodeProps} BaseVNodeProps
 * @typedef {import("./main.js").CalendarEventData} CalendarEventData
 *
 * @typedef {object} ButtonProps
 * @property {string} key
 * @property {number} x
 * @property {number} y
 * @property {string} text
 * @property {() => void} onClick
 * @property {number} width=100
 * @property {number} height=40
 * @property {number} color=0x4a90e2
 * @property {number} textColor=0xffffff
 * @property {number} fontSize=18
 *
 * @typedef {object} ScrollProps
 * @property {string} key
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} background
 * @property {number} radius
 */

/**
 * @callback EventAction
 * @param {object} event
 */

const buttonTextStyle = new TextStyle({
    fill: 0xffffff,
    fontSize: 18,
    align: 'center',
});

/**
 * Utilise @pixi/ui/Button.
 * @param {object} props
 * @param {string} props.key
 * @param {number} props.x
 * @param {number} props.y
 * @param {string} props.text
 * @param {() => void} props.onClick
 * @param {number} [props.width=100]
 * @param {number} [props.height=40]
 * @param {number} [props.color=0x4a90e2]
 * @param {number} [props.textColor=0xffffff]
 * @param {number} [props.fontSize=18]
 * @returns {VNode}
 */
export function uiButton(props) {
    const { key, x, y, text, onClick, width = 100, height = 40, color = 0x4a90e2, textColor = 0xffffff, fontSize = 18 } = props;

    return h("container", key, {
	...props,
	hook: {
	    /** @param {Container & { _internalState: {buttonInstance: Button, buttonBackground: Graphics, buttonText: Text} }} elm */
	    mount: (elm) => {
		const buttonBackground = new Graphics();
		const buttonText = new Text({
		    text, // Utilise les props initiales
		    style: new TextStyle({ ...buttonTextStyle, fill: textColor, fontSize }),
		});
		buttonText.anchor.set(0.5);

		elm.addChild(buttonBackground, buttonText);

		buttonBackground.beginFill(color);
		buttonBackground.drawRect(0, 0, width, height);
		buttonBackground.endFill();

		buttonText.x = width / 2;
		buttonText.y = height / 2;
		
		const buttonInstance = new Button(elm);
		buttonInstance.onPress.connect(onClick);

		elm._internalState = { buttonInstance, buttonBackground, buttonText };
            },
	    /** @param {Container & { _internalState: {buttonInstance: Button, buttonBackground: Graphics, buttonText: Text} }} elm */
            destroy: (elm) => {
		if (elm._internalState && elm._internalState.buttonInstance) {
                    elm._internalState.buttonInstance.onPress.disconnectAll();
		}
            },
	    /**
	     * @param {VNode} oldVnode
	     * @param {VNode} newVnode
	     */
            update: (oldVnode, newVnode) => {
		const oldProps = /** @type {BaseVNodeProps & ButtonProps} */ (oldVnode.props);
		const newProps = /** @type {BaseVNodeProps & ButtonProps} */ (newVnode.props);
		const elm = /** @type {Container & { _internalState: {buttonInstance: Button, buttonBackground: Graphics, buttonText: Text} }} */(newVnode.elm);

		const { buttonInstance, buttonBackground, buttonText } = elm._internalState;

		if (!buttonInstance) return;

		if (oldProps.text !== newProps.text) {
                    buttonText.text = newProps.text;
		}

		if (oldProps.color !== newProps.color || oldProps.width !== newProps.width || oldProps.height !== newProps.height) {
                    buttonBackground.clear();
                    buttonBackground.beginFill(newProps.color);
                    buttonBackground.drawRect(0, 0, newProps.width, newProps.height);
                    buttonBackground.endFill();
                    
                    // On doit aussi recentrer le texte si la taille change
                    buttonText.x = newProps.width / 2;
                    buttonText.y = newProps.height / 2;
		}

		if (oldProps.textColor !== newProps.textColor || oldProps.fontSize !== newProps.fontSize) {
                    buttonText.style.fill = newProps.textColor;
                    buttonText.style.fontSize = newProps.fontSize;
		}

		if (oldProps.onClick !== newProps.onClick) {
                    buttonInstance.onPress.disconnect(oldProps.onClick);
                    buttonInstance.onPress.connect(newProps.onClick);
		}
            }
	}
    }, []);
}

const hourStyle = new TextStyle({
    fontSize: 14,
    fill: 0x333333
});

const dayLabelStyle = new TextStyle({
    fontSize: 16,
    fill: 0x222222,
    fontWeight: 'bold',
});

const evStyle = new TextStyle({
    fontSize: 14,
    fill: 0xffffff,
});

///**
// * @param {number} screenWidth
// * @param {CalendarEventData[]} events
// * @param {Date[]} weekDays
// * @returns {VNode}
// */
//export function OldCalendarWeek(screenWidth, events, weekDays) {
//
//    const Posx = screenWidth / 2 - 500;
//    const Posy = 120;
//    const headerHeight = 60;
//    const hourHeight = 80;
//    const dayWidth = 130;
//    const startX = 60;
//
//    /**
//     * @param {Date} date
//     * @returns {number}
//     */
//    const getEventDayOffset = (date) => (date.getDay() - 1 + 7) % 7;
//
//    /**
//     * @param {CalendarEventData} event 
//     * @returns {Container}
//     */
//    function createCalendarEvent(event) {
//        const startDate = parseISO(event.start);
//        const endDate = parseISO(event.end);
//        const eventDayOffset = getEventDayOffset(startDate);
//
//        const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
//        const startY = (startMinutes / 60) * hourHeight;
//
//        const durationMs = endDate.getTime() - startDate.getTime();
//        const durationMinutes = durationMs / (1000 * 60);
//
//        const eventHeight = (durationMinutes / 60) * hourHeight;
//
//        const eventX = startX + eventDayOffset * dayWidth + 5;
//
//        const ev = new Container();
//
//        const eventGraphics = new Graphics()
//              .roundRect(0, 0, dayWidth - 10, eventHeight, 8)
//              .fill(0x4a90e2);
//        eventGraphics.x = eventX;
//        eventGraphics.y = startY;
//
//        const eventTitle = new Text({
//            text: event.title,
//            style: evStyle,
//        });
//        eventTitle.x = eventGraphics.x + 8;
//        eventTitle.y = eventGraphics.y + 10;
//
//        ev.addChild(eventGraphics, eventTitle);
//        return ev;
//    }
//
//    return h("container", `scroll-event`, {
//        x: Posx,
//        y: Posy,
//        events: events,
//        weekDays: weekDays,
//        hook: {
//            /** @param {Container & { _eventContainer: Container, _dayLabels: Text[] }} elm */
//            mount: (elm) => {
//                const headerContainer = new Container();
//                const headerBackground = new Graphics()
//                      .rect(0, 0, 1000, headerHeight)
//                      .fill(0xe0e0e0);
//                headerContainer.addChild(headerBackground);
//
//                elm._dayLabels = [];
//                const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
//                for (let d = 0; d < 7; d++) {
//                    const x = startX + d * dayWidth;
//
//                    const currentDate = weekDays[d];
//                    const labelText = `${dayNames[d]} ${format(currentDate, 'd')}`;
//
//                    const dayLabel = new Text({
//                        text: labelText,
//                        style: dayLabelStyle,
//                    });
//                    dayLabel.x = x + dayWidth / 2 - dayLabel.width / 2;
//                    dayLabel.y = headerHeight / 2 - dayLabel.height / 2;
//                    headerContainer.addChild(dayLabel);
//                    elm._dayLabels.push(dayLabel);
//                }
//
//                const scrollBox = new ScrollBox({
//                    background: 0xffffff,
//                    width: 1000,
//                    height: 600,
//                    vertPadding: 5,
//                    horPadding: 0,
//                    elementsMargin: 0,
//                    disableDynamicRendering: true,
//                    globalScroll: true,
//                });
//                scrollBox.y = headerHeight;
//
//                const container = new Container();
//                const hours = 24;
//                for (let h = 0; h <= hours; h++) {
//                    const y = h * hourHeight;
//
//                    const hourLabel = new Text({
//                        text: `${h}:00`,
//                        style: hourStyle,
//                    });
//                    hourLabel.x = 10;
//                    hourLabel.y = y;
//                    container.addChild(hourLabel);
//                }
//
//                const eventContainer = new Container();
//                for (const event of events) {
//                    console.log(event);
//                    eventContainer.addChild(createCalendarEvent(event));
//                }
//                container.addChild(eventContainer);
//
//                scrollBox.addItem(container);
//                elm.addChild(headerContainer);
//                elm.addChild(scrollBox);
//
//                elm._eventContainer = eventContainer;
//            },
//	    /**
//	     * @param {VNode} oldVnode
//	     * @param {VNode} newVnode
//	     */
//            update: (oldVnode, newVnode) => {
//                const elm = /** @type {Container & { _eventContainer: Container, _dayLabels: Text[]}} */ (oldVnode.elm);
//                const oldProps = /** @type {BaseVNodeProps & {events: CalendarEventData[], weekDays: Date[]}} */ (oldVnode.props);
//                const newProps = /** @type {BaseVNodeProps & {events: CalendarEventData[], weekDays: Date[]}} */ (newVnode.props);
//
//                const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
//                if (oldProps.weekDays[0].getTime() !== newProps.weekDays[0].getTime()) {
//                    for (let d = 0; d < 7; d++) {
//                        const dayLabel = elm._dayLabels[d];
//                        const currentDate = newProps.weekDays[d];
//                        dayLabel.text = `${dayNames[d]} ${format(currentDate, 'd')}`;
//                        const x = startX + d * dayWidth;
//                        dayLabel.x = x + dayWidth / 2 - dayLabel.width / 2;
//                    }
//                }
//
//                const eventContainer = elm._eventContainer;
//                eventContainer.removeChildren();
//                for (const event of newProps.events) {
//                    eventContainer.addChild(createCalendarEvent(event));
//                }
//            }
//        }
//    })
//}

//const monthHeaderStyle = new TextStyle({
//    fill: 0xffffff,
//    fontSize: 18,
//    fontWeight: 'bold',
//    align: 'center',
//});
//
//const dayLabelStyleMonth = new TextStyle({
//    fill: 0xcccccc,
//    fontSize: 12,
//    align: 'center',
//});
//
//const dayNumberStyle = new TextStyle({
//    fill: 0xffffff,
//    fontSize: 14,
//    align: 'center',
//});

//const todayHighlightColor = 0x4a90e2; // Une couleur pour mettre en évidence le jour actuel
// Ajout de couleurs pour les différents états
//const todayHighlightColor = 0x4a90e2;      // Bleu pour "aujourd'hui"
//const selectedHighlightColor = 0x6a0dad;   // Violet pour "sélectionné"

///**
// * Affiche une vue compacte du calendrier pour un mois donné, avec navigation et sélection de date.
// * @param {object} props
// * @param {string} props.key
// * @param {number} [props.x=0]
// * @param {number} [props.y=0]
// * @param {Date} props.displayDate      - Une date dans le mois à afficher (le "repère").
// * @param {Date} props.selectedDate     - La date actuellement sélectionnée par l'utilisateur.
// * @param {(date: Date) => void} props.onDateSelect - Callback appelé quand un jour est cliqué.
// * @param {() => void} props.prevMonth  - Callback pour afficher le mois précédent.
// * @param {() => void} props.nextMonth  - Callback pour afficher le mois suivant.
// * @returns {VNode}
// */
//export function CalendarMonth(props) {
//    const { key, x = 0, y = 0, displayDate, selectedDate, onDateSelect, prevMonth, nextMonth } = props;
//
//    const year = displayDate.getFullYear();
//    const month = displayDate.getMonth();
//    const firstDayOfMonth = new Date(year, month, 1);
//    const daysInMonth = new Date(year, month + 1, 0).getDate();
//    const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7;
//
//    const today = new Date();
//
//    const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
//    const cellWidth = 35;
//    const cellHeight = 30;
//    const headerHeight = 40;
//    const dayLabelsY = headerHeight + 10;
//    const gridY = dayLabelsY + 25;
//    const componentWidth = dayLabels.length * cellWidth;
//
//    const dayLabelNodes = dayLabels.map((label, index) =>
//        h("text", `day-label-${label}`, {
//            text: label,
//            style: dayLabelStyleMonth,
//            x: index * cellWidth + cellWidth / 2,
//            y: -10, // Position relative dans le conteneur de la grille
//            anchor: 0.5,
//        })
//    );
//
//    const dayNumberNodes = [];
//    for (let day = 1; day <= daysInMonth; day++) {
//        const currentDate = new Date(year, month, day);
//        const col = (startDayOffset + day - 1) % 7;
//        const row = Math.floor((startDayOffset + day - 1) / 7);
//
//        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
//        const isSelected = selectedDate &&
//                           selectedDate.getFullYear() === year &&
//                           selectedDate.getMonth() === month &&
//                           selectedDate.getDate() === day;
//
//        // On utilise un tableau pour construire les enfants de manière conditionnelle
//        const children = [];
//
//        // La sélection prime sur le highlight "aujourd'hui"
//        if (isSelected) {
//            children.push(h("graphics", "selected-highlight", {
//                draw: (g) => g.clear().rect(2, 2, cellWidth - 4, cellHeight - 4).stroke({ width: 2, color: selectedHighlightColor })
//            }));
//        } else if (isToday) {
//            children.push(h("graphics", "today-highlight", {
//                draw: (g) => g.clear().circle(cellWidth / 2, cellHeight / 2, 12).fill(todayHighlightColor)
//            }));
//        }
//        
//        // On ajoute toujours le numéro du jour
//        children.push(h("text", `day-text-${day}`, {
//            text: day.toString(),
//            style: dayNumberStyle,
//            x: cellWidth / 2,
//            y: cellHeight / 2,
//            anchor: 0.5
//        }));
//
//        dayNumberNodes.push(
//            h("container", `day-${day}`, {
//                x: col * cellWidth,
//                y: row * cellHeight,
//                // On rend le conteneur du jour interactif via les hooks
//                hook: {
//                    /** @param {Container} elm */
//                    mount: (elm) => {
//                        elm.interactive = true;
//                        elm.cursor = 'pointer';
//                        elm.on('pointertap', () => onDateSelect(currentDate));
//                    },
//                    /** @param {VNode} oldVnode @param {VNode} newVnode */
//                    update: (oldVnode, newVnode) => {
//                        // On met à jour le listener si la fonction change
//                        const oldCallback = oldVnode.props.onDateSelect;
//                        const newCallback = newVnode.props.onDateSelect;
//                        if (oldCallback !== newCallback) {
//                            const elm = /** @type {Container} */ (newVnode.elm);
//                            elm.off('pointertap'); // On retire l'ancien
//                            elm.on('pointertap', () => newCallback(currentDate)); // On ajoute le nouveau
//                        }
//                    },
//                    /** @param {Container} elm */
//                    destroy: (elm) => {
//                        elm.off('pointertap'); // Nettoyage pour éviter les fuites mémoire
//                    }
//                }
//            }, children)
//        );
//    }
//
//    return h("container", key, { x, y }, [
//        h("graphics", "month-bg", {
//            draw: (g) => {
//                const totalHeight = gridY + Math.ceil((daysInMonth + startDayOffset) / 7) * cellHeight + 10;
//                g.clear().roundRect(0, 0, componentWidth, totalHeight, 8).fill(0x282c34);
//            }
//        }),
//        uiButton({
//            key: 'prev-month', x: 10, y: 5, width: 30, height: 30, text: "<", fontSize: 16, onClick: prevMonth,
//        }),
//        h("text", "month-label", {
//            text: format(displayDate, 'MMMM yyyy', { locale: fr }),
//            style: monthHeaderStyle,
//            x: componentWidth / 2,
//            y: headerHeight / 2,
//            anchor: 0.5,
//        }),
//        uiButton({
//            key: 'next-month', x: componentWidth - 40, y: 5, width: 30, height: 30, text: ">", fontSize: 16, onClick: nextMonth,
//        }),
//        h("container", "days-grid", { x: 0, y: gridY }, [
//            ...dayLabelNodes,
//            ...dayNumberNodes,
//        ]),
//    ]);
//}

/**
 * @param {number} screenWidth
 * @param {CalendarEventData[]} events
 * @param {Date[]} weekDays
 * @returns {VNode}
 */
export function OldCalendarWeek(screenWidth, events, weekDays) {

    const Posx = screenWidth / 2 - 500;
    const Posy = 120;
    const headerHeight = 60;
    const hourHeight = 80;
    const dayWidth = 130;
    const startX = 60;

    /**
     * @param {Date} date
     * @returns {number}
     */
    const getEventDayOffset = (date) => (date.getDay() - 1 + 7) % 7;

    /**
     * NOUVEAU: Crée les segments visuels pour un événement.
     * Un événement sur plusieurs jours sera découpé en plusieurs segments.
     * @param {CalendarEventData} event
     * @returns {Container[]}
     */
    function createEventSegments(event) {
        const segments = [];
        const eventStart = parseISO(event.start);
        const eventEnd = parseISO(event.end);
        
        let loopDate = startOfDay(eventStart);

        while (loopDate < eventEnd) {
            const dayOffset = getEventDayOffset(loopDate);
            if (dayOffset < 0 || dayOffset >= 7) {
                loopDate = addDays(loopDate, 1);
                continue;
            }
            
            const segmentStart = isSameDay(loopDate, eventStart) ? eventStart : startOfDay(loopDate);
            
            const segmentEnd = isSameDay(loopDate, eventEnd) ? eventEnd : endOfDay(loopDate);

            const startMinutes = segmentStart.getHours() * 60 + segmentStart.getMinutes();
            const startY = (startMinutes / 60) * hourHeight;
            
            const durationMs = Math.max(0, segmentEnd.getTime() - segmentStart.getTime());
            const durationMinutes = durationMs / (1000 * 60);
            const eventHeight = (durationMinutes / 60) * hourHeight;
            
            if (eventHeight <= 0) {
                 loopDate = addDays(loopDate, 1);
                 continue;
            }

            const eventX = startX + dayOffset * dayWidth + 5;
            
            const segmentContainer = new Container();
            
            const eventGraphics = new Graphics()
                .roundRect(0, 0, dayWidth - 10, eventHeight, 8)
                .fill(event.color || 0x4a90e2);
            eventGraphics.x = eventX;
            eventGraphics.y = startY;
            
            const eventTitleText = isSameDay(loopDate, eventStart) ? event.title : "";
            const eventTitle = new Text({
                text: eventTitleText,
                style: evStyle,
            });
            eventTitle.x = eventGraphics.x + 8;
            eventTitle.y = eventGraphics.y + 10;
            
            segmentContainer.addChild(eventGraphics, eventTitle);
            segments.push(segmentContainer);
            
            loopDate = addDays(loopDate, 1);
        }
        
        return segments;
    }

    return h("container", `scroll-event`, {
        x: Posx,
        y: Posy,
        events: events,
        weekDays: weekDays,
        hook: {
            /** @param {Container & { _eventContainer: Container, _dayLabels: Text[] }} elm */
            mount: (elm) => {
                const headerContainer = new Container();
                const headerBackground = new Graphics().rect(0, 0, 1000, headerHeight).fill(0xe0e0e0);
                headerContainer.addChild(headerBackground);
                
                elm._dayLabels = [];
                const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
                for (let d = 0; d < 7; d++) {
                    const x = startX + d * dayWidth;
                    const currentDate = weekDays[d];
                    const labelText = `${dayNames[d]} ${format(currentDate, 'd')}`;
                    const dayLabel = new Text({ text: labelText, style: dayLabelStyle });
                    dayLabel.x = x + dayWidth / 2 - dayLabel.width / 2;
                    dayLabel.y = headerHeight / 2 - dayLabel.height / 2;
                    headerContainer.addChild(dayLabel);
                    elm._dayLabels.push(dayLabel);
                }
                
                const scrollBox = new ScrollBox({
                    background: 0xffffff,
                    width: 1000,
                    height: 600,
                    vertPadding: 5,
                    horPadding: 0,
                    elementsMargin: 0,
                    disableDynamicRendering: true,
                    globalScroll: true,
                });
                scrollBox.y = headerHeight;
                
                const container = new Container();
                const hours = 24;
                for (let h = 0; h <= hours; h++) {
                    const y = h * hourHeight;
                    const hourLabel = new Text({ text: `${h}:00`, style: hourStyle });
                    hourLabel.x = 10;
                    hourLabel.y = y;
                    container.addChild(hourLabel);
                }

                const eventContainer = new Container();
                for (const event of events) {
                    const segments = createEventSegments(event);
                    for (const segment of segments) {
                        eventContainer.addChild(segment);
                    }
                }
                container.addChild(eventContainer);

                scrollBox.addItem(container);
                elm.addChild(headerContainer);
                elm.addChild(scrollBox);

                elm._eventContainer = eventContainer;
            },
	        /**
	         * @param {VNode} oldVnode
	         * @param {VNode} newVnode
	         */
            update: (oldVnode, newVnode) => {
                const elm = /** @type {Container & { _eventContainer: Container, _dayLabels: Text[] }} */ (oldVnode.elm);
                const oldProps = /** @type {BaseVNodeProps & {events: CalendarEventData[], weekDays: Date[]}} */ (oldVnode.props);
                const newProps = /** @type {BaseVNodeProps & {events: CalendarEventData[], weekDays: Date[]}} */ (newVnode.props);

                const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
                if (oldProps.weekDays[0].getTime() !== newProps.weekDays[0].getTime()) {
                    for (let d = 0; d < 7; d++) {
                        const dayLabel = elm._dayLabels[d];
                        const currentDate = newProps.weekDays[d];
                        dayLabel.text = `${dayNames[d]} ${format(currentDate, 'd')}`;
                        const x = startX + d * dayWidth;
                        dayLabel.x = x + dayWidth / 2 - dayLabel.width / 2;
                    }
                }

                const eventContainer = elm._eventContainer;
                eventContainer.removeChildren();
                for (const event of newProps.events) {
                    const segments = createEventSegments(event);
                    for (const segment of segments) {
                        eventContainer.addChild(segment);
                    }
                }
            }
        }
    })
}

/**
 * Structure de données interne pour représenter un segment d'événement sur une seule journée.
 * @typedef {object} EventSegment
 * @property {CalendarEventData} event - La donnée originale de l'événement
 * @property {Date} start - L'heure de début de ce segment
 * @property {Date} end - L'heure de fin de ce segment
 * @property {object} [layout] - Informations de disposition calculées
 * @property {number} [layout.columns] - Nombre total de colonnes dans son groupe de collision
 * @property {number} [layout.col] - Index de la colonne (à partir de 0) où placer ce segment
 */

/**
 * Affiche une vue hebdomadaire d'un calendrier.
 * @param {number} screenWidth
 * @param {CalendarEventData[]} events
 * @param {Date[]} weekDays
 * @param {(msg: import("./main.js").Msg) => void} dispatch
 * @returns {VNode}
 */
export function CalendarWeek(screenWidth, events, weekDays, dispatch) {

    const Posx = screenWidth / 2 - 500;
    const Posy = 120;
    const headerHeight = 60;
    const hourHeight = 80;
    const dayWidth = 130;
    const startX = 60;

    /**
     * @param {Date} date
     * @returns {number}
     */
    const getEventDayOffset = (date) => (date.getDay() - 1 + 7) % 7;

    /**
     * Crée les objets "segments" pour tous les événements, avec leurs informations de disposition calculées.
     * C'est ici que toute la logique de détection des collisions se produit.
     * @returns {EventSegment[]}
     */
    function calculateLayouts() {
        /** @type {EventSegment[][]} */
        const segmentsByDay = Array.from({ length: 7 }, () => []);

        // 1. Découper les événements en segments et les regrouper par jour
        for (const event of events) {
            const eventStart = parseISO(event.start);
            const eventEnd = parseISO(event.end);
            let loopDate = startOfDay(eventStart);

            while (loopDate < eventEnd) {
                const dayIndex = getEventDayOffset(loopDate);
                if (dayIndex >= 0 && dayIndex < 7) {
                    const segmentStart = isSameDay(loopDate, eventStart) ? eventStart : startOfDay(loopDate);
                    const segmentEnd = isSameDay(loopDate, eventEnd) ? eventEnd : endOfDay(loopDate);
                    
                    if (segmentEnd > segmentStart) {
                        segmentsByDay[dayIndex].push({
                            event,
                            start: segmentStart,
                            end: segmentEnd,
                        });
                    }
                }
                loopDate = addDays(loopDate, 1);
            }
        }
        
        const allProcessedSegments = [];
        const eventColumnMap = new Map();

        // 2. Pour chaque jour, calculer les collisions et la disposition
        for (const daySegments of segmentsByDay) {
            if (daySegments.length === 0) continue;

            // Trier les segments par heure de début
            daySegments.sort((a, b) => a.start.getTime() - b.start.getTime());
            
            // 3. Identifier les groupes de collision
            const collisionGroups = [];
            if (daySegments.length > 0) {
                let currentGroup = [daySegments[0]];
                collisionGroups.push(currentGroup);
                for (let i = 1; i < daySegments.length; i++) {
                    const segment = daySegments[i];
                    const maxEndInGroup = currentGroup.reduce((max, seg) => Math.max(max, seg.end.getTime()), 0);
                    if (segment.start.getTime() >= maxEndInGroup) {
                        currentGroup = [segment];
                        collisionGroups.push(currentGroup);
                    } else {
                        currentGroup.push(segment);
                    }
                }
            }

            // 4. Pour chaque groupe, attribuer les colonnes
            for (const group of collisionGroups) {
                const columns = []; // Chaque élément est une liste de segments non superposés dans le temps
                group.sort((a,b) => a.start.getTime() - b.start.getTime());

                for (const segment of group) {
                    let placed = false;
                    if (eventColumnMap.has(segment.event.id)) {
                        const targetCol = eventColumnMap.get(segment.event.id);
                        if (!columns[targetCol]) columns[targetCol] = []; // S'assurer que le tableau de la colonne existe
                        const lastInCol = columns[targetCol][columns[targetCol].length - 1];
                        if (!lastInCol || segment.start.getTime() >= lastInCol.end.getTime()) {
                            columns[targetCol].push(segment);
                            segment.layout = { col: targetCol, columns: 0 };
                            placed = true;
                        }
                    }

                    // Logique existante si l'événement n'a pas pu être placé dans sa colonne préférée
                    if (!placed) {
                        for (let i = 0; i < columns.length; i++) {
                             if (!columns[i]) columns[i] = [];
                            const lastInCol = columns[i][columns[i].length - 1];
                            if (!lastInCol || segment.start.getTime() >= lastInCol.end.getTime()) {
                                columns[i].push(segment);
                                segment.layout = { col: i, columns: 0 };
                                eventColumnMap.set(segment.event.id, i); // Mémoriser la colonne
                                placed = true;
                                break;
                            }
                        }
                    }

                    // Si toujours pas placé, créer une nouvelle colonne
                    if (!placed) {
                        const newColIdx = columns.length;
                        columns.push([segment]);
                        segment.layout = { col: newColIdx, columns: 0 };
                        eventColumnMap.set(segment.event.id, newColIdx); // Mémoriser la colonne
                    }
                }
                
                // Mettre à jour tous les segments du groupe avec le nombre total de colonnes
                const totalColumns = columns.length;
                for (const segment of group) {
                    if (segment.layout) {
                        segment.layout.columns = totalColumns;
                    }
                }
            }
            allProcessedSegments.push(...daySegments);
        }
        return allProcessedSegments;
    }

    /**
     * Dessine un seul segment d'événement à partir de ses données et de sa disposition calculée.
     * @param {EventSegment} segment
     * @returns {Container}
     */
    function createEventSegmentGraphic(segment) {
        const dayOffset = getEventDayOffset(segment.start);
        
        const layout = segment.layout || { col: 0, columns: 1 };
        const segmentWidth = (dayWidth - 10) / layout.columns;
        const segmentXOffset = layout.col * segmentWidth;
        const eventX = startX + dayOffset * dayWidth + 5 + segmentXOffset;

        const startMinutes = segment.start.getHours() * 60 + segment.start.getMinutes();
        const startY = (startMinutes / 60) * hourHeight;

        const durationMs = segment.end.getTime() - segment.start.getTime();
        const durationMinutes = durationMs / (1000 * 60);
        const eventHeight = (durationMinutes / 60) * hourHeight;
        
        const segmentContainer = new Container();
        const eventGraphics = new Graphics()
            .roundRect(0, 0, segmentWidth, eventHeight, 8)
            .fill(segment.event.color || 0x4a90e2);
        eventGraphics.x = eventX;
        eventGraphics.y = startY;

        // Afficher le titre uniquement sur le premier segment de l'événement
        const isFirstSegment = isSameDay(segment.start, parseISO(segment.event.start));
        const eventTitleText = isFirstSegment ? segment.event.title : "";

        const eventTitle = new Text({
            text: eventTitleText,
            style: new TextStyle({
                ...evStyle,
                wordWrap: true,
                wordWrapWidth: segmentWidth - 10,
                breakWords: true
            })
        });
        eventTitle.x = eventGraphics.x + 5;
        eventTitle.y = eventGraphics.y + 5;
        
        segmentContainer.addChild(eventGraphics, eventTitle);

        const buttonInstance = new Button(segmentContainer);
        buttonInstance.onPress.connect(() => {
            dispatch({ type: 'EDIT_EVENT', event: segment.event })
        });

        return segmentContainer;
    }

    return h("container", `scroll-event`, {
        x: Posx,
        y: Posy,
        events: events,
        weekDays: weekDays,
        hook: {
            /** @param {Container & { _eventContainer: Container, _dayLabels: Text[] }} elm */
            mount: (elm) => {
                const headerContainer = new Container();
                const headerBackground = new Graphics().rect(0, 0, 1000, headerHeight).fill(0xe0e0e0);
                headerContainer.addChild(headerBackground);
                
                elm._dayLabels = [];
                const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
                for (let d = 0; d < 7; d++) {
                    const x = startX + d * dayWidth;
                    const currentDate = weekDays[d];
                    const labelText = `${dayNames[d]} ${format(currentDate, 'd')}`;
                    const dayLabel = new Text({ text: labelText, style: dayLabelStyle });
                    dayLabel.x = x + dayWidth / 2 - dayLabel.width / 2;
                    dayLabel.y = headerHeight / 2 - dayLabel.height / 2;
                    headerContainer.addChild(dayLabel);
                    elm._dayLabels.push(dayLabel);
                }
                
                const scrollBox = new ScrollBox({
                    background: 0xffffff,
                    width: 1000,
                    height: 600,
                    vertPadding: 5,
                    horPadding: 0,
                    elementsMargin: 0,
                    disableDynamicRendering: true,
                    globalScroll: true,
                });
                scrollBox.y = headerHeight;
                
                const container = new Container();

                const gridLines = new Graphics();
                gridLines.y += 8;

                const gridWidth = 7 * dayWidth;
                const gridHeight = 24 * hourHeight;

                for (let h = 0; h <= 24; h++) {
                    const y = h * hourHeight;
                    gridLines.moveTo(startX, y).lineTo(startX + gridWidth, y);
                }

                for (let d = 0; d <= 7; d++) {
                    const x = startX + d * dayWidth;
                    gridLines.moveTo(x, 0).lineTo(x, gridHeight);
                }

                gridLines.stroke({width: 1, color: 0xcccccc}); // Ligne fine, grise et légèrement transparente
                container.addChild(gridLines);
                // grid line

                for (let h = 0; h <= 24; h++) {
                    container.addChild(new Text({ text: `${h}:00`, style: hourStyle, x: 10, y: h * hourHeight }));
                }

                const eventContainer = new Container();
                const segmentsToRender = calculateLayouts();
                for (const segment of segmentsToRender) {
                    eventContainer.addChild(createEventSegmentGraphic(segment));
                }
                container.addChild(eventContainer);

                scrollBox.addItem(container);
                elm.addChild(headerContainer, scrollBox);
                elm._eventContainer = eventContainer;
            },
	        /**
	         * @param {VNode} oldVnode
	         * @param {VNode} newVnode
	         */
            update: (oldVnode, newVnode) => {
                const elm = /** @type {Container & { _eventContainer: Container, _dayLabels: Text[] }} */ (oldVnode.elm);
                const oldProps = /** @type {BaseVNodeProps & {events: CalendarEventData[], weekDays: Date[]}} */ (oldVnode.props);
                const newProps = /** @type {BaseVNodeProps & {events: CalendarEventData[], weekDays: Date[]}} */ (newVnode.props);

                const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
                if (oldProps.weekDays[0].getTime() !== newProps.weekDays[0].getTime()) {
                    for (let d = 0; d < 7; d++) {
                        const dayLabel = elm._dayLabels[d];
                        const currentDate = newProps.weekDays[d];
                        dayLabel.text = `${dayNames[d]} ${format(currentDate, 'd')}`;
                        const x = startX + d * dayWidth;
                        dayLabel.x = x + dayWidth / 2 - dayLabel.width / 2;
                    }
                }

                const eventContainer = elm._eventContainer;
                eventContainer.removeChildren();
                
                const segmentsToRender = calculateLayouts();
                for (const segment of segmentsToRender) {
                    eventContainer.addChild(createEventSegmentGraphic(segment));
                }
            }
        }
    });
}
