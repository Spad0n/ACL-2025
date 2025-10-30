import { Application, Container, TextStyle } from "pixi.js";
import { initBackground } from "./background.js";
import { h, patch } from "./ui/elm.js";
import { uiButton, CalendarDay } from "./components.js";
import { format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import htmx from "htmx.org";

/**
 * @typedef {Object} CalendarEventData
 * @property {string} id
 * @property {string} start - Date de debut au format ISO 8601
 * @property {string} end - Date de fin au format ISO 8601
 * @property {string} title
 * @property {string} description
 * @property {number} color - Couleur uniquement au format numérique (ex: 0xff0000)
 * @property {number} [yOffset]
 */

/**
 * @typedef {Object} AppModel
 * @property {Date} currentWeekStart
 * @property {CalendarEventData[]} events
 * @property {Date | null} addingDate
 */

/**
 * @typedef {Object} Msg
 * @property {'PREV_WEEK' | 'NEXT_WEEK' | 'ADD_EVENT' | 'EDIT_EVENT' | 'DELETE_EVENT' | 'SAVE_EVENT' } type
 * @property {Date} [date]
 * @property {CalendarEventData} [event]
 */

const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]; // Pour l'affichage des jours de la semaine

const headerStyle = new TextStyle({
    fill: 0xffffff,
    fontSize: 36,
    fontWeight: 'bold',
});

/**
 * @param {Date} date 
 * @param {number} days
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * @param {Application} app 
 * @param {AppModel} model 
 * @param {(msg: Msg) => void} dispatch 
 */
function view(app, model, dispatch) {
    const weekDays = Array.from({length: 7}, (_, i) => addDays(model.currentWeekStart, i));

    const calendarDays = weekDays.map((date, index) => {
        const dayEvents = model.events.filter(event =>
            isSameDay(parseISO(event.start), date)
        );

        const dayWidth = 170;
        const startX = (app.screen.width - (7 * dayWidth)) / 2;
        const xPos = startX + index * dayWidth;
        const yPos = 130;

        return h("container", `day-container-${date.toISOString()}`, { x: xPos, y: yPos }, [
            h(CalendarDay, `calendar-day-${date.toISOString()}`, {
                dayNumber: date.getDate(),
                //dayName: DAY_NAMES[date.getDay()],
                dayName: format(date, 'eee', { locale: fr }),
                events: dayEvents,
                /** @param {CalendarEventData} event */
                onEditEvent: (event) => dispatch({ type: 'EDIT_EVENT', event }),
                /** @param {CalendarEventData} event */
                onDeleteEvent: (event) => dispatch({ type: 'DELETE_EVENT', event }),
                onAddEvent: () => dispatch({ type: 'ADD_EVENT', date: date }),
            })
        ]);
    });

    const weekDisplayStart = weekDays[0];
    const weekDisplayEnd = weekDays[6];

    const headerText = `${format(weekDisplayStart, 'd MMMM yyyy', { locale: fr })} - ${format(weekDisplayEnd, 'd MMMM yyyy', { locale: fr })}`;

    return h("container", "app-root", {}, [
        h("container", "calendar-header", { x: app.screen.width / 2, y: 30, pivot: 0.5 }, [
            uiButton({
                key: "prev-week",
                x: -200,
                y: 30,
                text: "<",
                onClick: () => dispatch({ type: 'PREV_WEEK' }),
                width: 50,
            }),
            h("text", "month-year", {
                text: headerText,
                style: headerStyle,
                x: 0,
                y: 0,
                anchor: 0.5,
            }),
            uiButton({
                key: "next-week",
                x: 150,
                y: 30,
                text: ">",
                onClick: () => dispatch({ type: 'NEXT_WEEK' }),
                width: 50,
            }),
        ]),

        h("container", "calendar-grid", {}, calendarDays),
    ]);
}

/**
 * @param {Msg} msg 
 * @param {AppModel} model 
 * @returns {AppModel}
 */
function update(msg, model) {
    let newModel = { ...model };

    switch (msg.type) {
    case 'PREV_WEEK':
        newModel.currentWeekStart = addDays(newModel.currentWeekStart, - 7);
        break;
    case 'NEXT_WEEK':
        newModel.currentWeekStart = addDays(newModel.currentWeekStart, 7);
        break;
    case 'ADD_EVENT':
        const addUrl = `/dialog/event-form?action=add&date=${msg.date?.toISOString()}`
        triggerHtmxDialog(addUrl);
        break;
    case 'EDIT_EVENT':
        const event = /** @type {CalendarEventData} */(msg.event);
        // NOTE: Faire que le serveur va chercher les autres données via l'ID, c'est plus propre
        const params = new URLSearchParams({
            action: "edit",
            id: event.id,
            title: event.title,
            description: event.description,
            start: event.start,
            end: event.end,
            color: event.color.toString(),
        });
        const editUrl = `/dialog/event-form?${params.toString()}`;
        triggerHtmxDialog(editUrl);
        break;
    case 'DELETE_EVENT':
        newModel.events = newModel.events.filter(e => e.id !== msg.event?.id);
        break;
    case 'SAVE_EVENT':
        const savedEvent = msg.event;

        const eventIndex = newModel.events.findIndex(e => e.id === savedEvent?.id);

        if (eventIndex > -1) {
            console.log("Mise à jour d'un evenement existant:", savedEvent);
            newModel.events = newModel.events.map((e) =>
                e.id === savedEvent.id ? savedEvent : e
            );
        } else {
            console.log("Ajout d'un nouvel événement:", savedEvent);
            newModel.events = [...newModel.events, savedEvent];
        }
        break;
    default:
        console.warn("Unknown message type:", msg.type);
    }
    return newModel;
}

/**
 * @param {string} url 
 */
function triggerHtmxDialog(url) {
    const triggerElement = document.createElement('div');
    triggerElement.setAttribute('hx-get', url);
    triggerElement.setAttribute('hx-target', "#dialog-container");
    triggerElement.setAttribute('hx-swap', "innerHTML");

    try {
        document.body.appendChild(triggerElement);
        htmx.process(triggerElement);
        htmx.trigger(triggerElement, "click");
    } finally {
        document.body.removeChild(triggerElement);
    }
}

(async () => {
    const canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById("canvasBackground"));
    if (canvas === null) {
        console.error("ERROR: could not find the canvas");
        return;
    }

    Object.assign(canvas.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        "z-index": "-1",
    });

    const app = new Application();
    await app.init({
        canvas: canvas,
        backgroundColor: 0x360071,
        resizeTo: window,
    });

    initBackground(app);

    const appContainer = new Container();
    app.stage.addChild(appContainer);

    const today = new Date();

    let model = /** @type {AppModel} */({
        currentWeekStart: startOfWeek(today, { weekStartsOn: 1 }),
        events: [],
        addingDate: null,
    });

    let scene = patch(appContainer, null, view(app, model, dispatch));

    function reRender() {
        const newScene = view(app, model, dispatch);
        scene = patch(appContainer, scene, newScene);
    }

    /**
     * @param {Msg} msg 
     */
    function dispatch(msg) {
        model = update(msg, model);
        const newScene = view(app, model, dispatch);
        scene = patch(appContainer, scene, newScene);
    }

    app.renderer.on("resize", () => {
        reRender();
    });

    document.body.addEventListener('eventSaved', (evt) => {
        const savedEvent = evt.detail;
        dispatch({ type: 'SAVE_EVENT', event: savedEvent });
    });
})();

