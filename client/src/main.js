import { Application, Container, TextStyle } from "pixi.js";
import { initBackground } from "./background.js";
import { h, patch } from "./ui/elm.js";
import { uiButton, CalendarWeek } from "./components.js";
import { endOfDay, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
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
 */

/**
 * @typedef {Object} Msg
 * @property { 'PREV_WEEK' | 'NEXT_WEEK' | 'ADD_EVENT' | 'EDIT_EVENT' | 'DELETE_EVENT' | 'SAVE_EVENT' | 'EVENT_DELETED' } type
 * @property {Date} [date]
 * @property {CalendarEventData} [event]
 * @property {number} [id]
 */

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

    //const eventsForWeek = weekDays.flatMap(date => {
    //    return model.events.filter(event => {
    //        const eventStartDate = parseISO(event.start);
    //        const eventEndDate = parseISO(event.end);
    //        return isSameDay(eventStartDate, date) || isSameDay(eventEndDate, date) || (eventStartDate < date && eventEndDate > date);
    //    });
    //})
    const weekStart = model.currentWeekStart;
    const weekEnd = endOfDay(addDays(weekStart, 6));

    const eventsForWeek = model.events.filter(event => {
        const eventStart = parseISO(event.start);
        const eventEnd = parseISO(event.end);
        return eventStart < weekEnd && eventEnd > weekStart;
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
            uiButton({
                key: "share-agenda",
                x: 10 + 550,
                y: 150,
                text: "Partager agenda",
                onClick: () => fenetrePartage(),
                width: 150,
            })

        ]),
        CalendarWeek(app.screen.width, eventsForWeek, weekDays, dispatch),

        uiButton({
            key: "new_event",
            x: 10 + 250,
            y: 150,
            text: "new event",
            onClick: () => dispatch({ type: "ADD_EVENT" }),
            width: 100,
        }),
        uiButton({
            key: "deconnexion",
            x: app.screen.width - 140,
            y: 10,
            text: "deconnexion",
            onClick: () => {
                fetch('/logout', { method: 'GET', credentials: "include"})
                    .then(() => window.location.href = '/login')
                    .catch((error) => console.error('La déconnexion a échoué:', error));
            },
            width: 130
        })
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
        const addUrl = `/dialog/event-form?action=add`
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
        const eventSupp = /** @type {CalendarEventData} */(msg.event);
        const paramsSupp = new URLSearchParams({
            action: "delete",
            id: eventSupp.id,
            title: eventSupp.title,
        });
        const suppUrl = `/dialog/event-form?${paramsSupp.toString()}`;
        triggerHtmxDialog(suppUrl);
        break;
    case 'EVENT_DELETED':
        console.log("Suppression avec l'evenement avec l'ID:", msg.id);
        newModel.events = newModel.events.filter(e => e.id !== msg.id);
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
    //case 'PREV_MONTH':
    //    const d = newModel.dateSelected;
    //    newModel.dateSelected = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    //    break;
    //case 'NEXT_MONTH':
    //    const ds = newModel.dateSelected;
    //    newModel.dateSelected = new Date(ds.getFullYear(), ds.getMonth() + 1, 1);
    //    break;
    //case 'SELECT_DATE':
    //    if (msg.date) {
    //        newModel.dateSelected = msg.date;
    //        newModel.currentWeekStart = startOfWeek(msg.date, { weekStartsOn: 1 });
    //    }
    //    break;
    default:
        console.warn("Unknown message type:", msg.type);
    }
    return newModel;
}

async function chargerAgendasUtilisateur() {
    const list = document.getElementById("agenda-list");

    const agendas = await fetch("/agendas").then(r => r.json());

    agendas.forEach(a => {
        const li = document.createElement("li");
        li.textContent = a.nom;

        li.onclick = () => {
            console.log("Agenda sélectionné :", a.id);
        };

        list.appendChild(li);
    });
}

chargerAgendasUtilisateur();

// Ovrir une fenetre pour pouvoir partager avec les listes des agendas de 
// l'utilisateurs connectés et des utilisateurs de la bdd
async function fenetrePartage(params) {
    const dialog = document.getElementById("share-dialog");
    const agendaSelect = document.getElementById("share-agenda-select");
    const utilisateurSelect = document.getElementById("share-user-select");

    const agendasUtilisateurConnecte = await fetch("/agendas").then(r => r.json());
    agendaSelect.innerHTML = agendasUtilisateurConnecte.map(a => `<option value="${a.id}">${a.nom}</option>`).join("");
    
    const utilisateurQuiRecoitPartage = await fetch("/recupUtilisateur").then(r => r.json());
    utilisateurSelect.innerHTML = utilisateurQuiRecoitPartage.map(a => `<option value="${a.username}">${a.username}</option>`).join("");

    dialog.style.display = "block";
}

document.getElementById("share-confirm").onclick = () => {
    const id_agenda = document.getElementById("share-agenda-select").value;
    const username = document.getElementById("share-user-select").value;

    fetch('/agendas/partage', {
        method: 'POST', 
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id_agenda, username})
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) alert("L'agenda a bien été partagé");
        else alert("Erreur : " + data.error);
    });

    document.getElementById("share-dialog").style.display = "none";
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
    });

    try {
        const serverEvents = await fetch('/events').then(res => res.json());
        model.events = serverEvents;
    } catch (err) {
        console.error("Erreur lors de la récupération des événements :", err);
    }

    let scene = patch(appContainer, null, view(app, model, dispatch));

    /**
     * @param {Msg} msg 
     */
    function dispatch(msg) {
        model = update(msg, model);
        const newScene = view(app, model, dispatch);
        scene = patch(appContainer, scene, newScene);
    }

    app.renderer.on("resize", () => {
        const newScene = view(app, model, dispatch);
        scene = patch(appContainer, scene, newScene);
    });

    document.body.addEventListener('eventSaved', (evt) => {
        const savedEvent = evt.detail;
        dispatch({ type: 'SAVE_EVENT', event: savedEvent });
    });

    document.body.addEventListener('eventDeleted', (evt) => {
        const deletedEvent = evt.detail;
        console.log("deletedEvent:", deletedEvent);
        if (deletedEvent) {
            dispatch({ type: 'EVENT_DELETED', id: deletedEvent.value });
        }
    });
})();

