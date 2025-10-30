import { createElm, h } from "./ui/elm.js";
import { Graphics, Text, TextStyle } from "pixi.js";
import { Button, ScrollBox } from '@pixi/ui';
import { format, parseISO } from 'date-fns';

/**
 * @typedef {import("pixi.js").Container} Container
 * @typedef {import("./ui/elm.js").VNode} VNode
 * @typedef {import("./ui/elm.js").BaseVNodeProps} BaseVNodeProps
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

//const formTextStyle = new TextStyle({
//    fill: 0x000000,
//    fontSize: 16,
//    wordWrap: true, // Peut être utile pour la description
//    wordWrapWidth: 270,
//});


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

		// On récupère les objets stockés
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
	}}, []);
}

const eventStyle = new TextStyle({
    fill: 0x000000,
    fontSize: 14,
    wordWrap: true,
    wordWrapWidth: 140,
});

const eventTimeStyle = new TextStyle({
    fill: 0x333333,
    fontSize: 12,
});

/**
 * Représente un événement de calendrier.
 * @param {object} props
 * @param {string} props.key
 * @param {import("./main.js").CalendarEventData} props.event
 * @param {EventAction} props.onEdit
 * @param {EventAction} props.onDelete
 * @returns {import("./ui/elm.js").VNode}
 */
export function CalendarEvent(props) {
    const { key, event, onEdit, onDelete } = props;

    const startTime = format(parseISO(event.start), "HH:mm");

    return h("container", key, { x: 5, y: event.yOffset }, [
        h("graphics", "event-bg", {
	    /** @param {Graphics} g */
	    draw: (g) => {
		g.clear();
		g.beginFill(event.color);
		g.drawRoundedRect(0, 0, 150, 40, 5);
		g.endFill();
            }
	}),
        h("text", "event-time", {
            text: startTime,
            style: eventTimeStyle,
            x: 5,
            y: 2,
        }),
        h("text", "event-title", {
            text: event.title,
            style: eventStyle,
            x: 5,
            y: 18,
        }),
        uiButton({
            key: `edit-${event.id}`,
            x: 100,
            y: 0,
            width: 25,
            height: 20,
            text: "E",
            color: 0x2e8b57,
            fontSize: 12,
            onClick: () => onEdit(event),
        }),
        uiButton({
            key: `delete-${event.id}`,
            x: 125,
            y: 0,
            width: 25,
            height: 20,
            text: "X",
            color: 0xcc3300,
            fontSize: 12,
            onClick: () => onDelete(event),
        }),
    ]);
}

const dayStyle = new TextStyle({
    fill: 0xffffff,
    fontSize: 20,
    fontWeight: 'bold',
});
const dayNameStyle = new TextStyle({
    fill: 0xcccccc,
    fontSize: 14,
});

/**
 * Représente un jour du calendrier.
 * @param {object} props
 * @param {string} props.key
 * @param {number} props.dayNumber
 * @param {string} props.dayName
 * @param {import("./main.js").CalendarEventData[]} props.events
 * @param {EventAction} props.onEditEvent
 * @param {EventAction} props.onDeleteEvent
 * @param {() => void} props.onAddEvent
 * @returns {VNode}
 */
export function CalendarDay(props) {
    const { key, dayNumber, dayName, events, onEditEvent, onDeleteEvent, onAddEvent } = props;

    let currentYOffset = 50;
    const eventsWithYOffset = events.map(event => {
        const eventWithOffset = { ...event, yOffset: currentYOffset };
        currentYOffset += 50;
        return eventWithOffset;
    });

    const dayHeight = Math.max(80, currentYOffset + 10);

    return h("container", key, {}, [
        h("graphics", "day-bg", {
	    /** @param {Graphics} g */
	    draw: (g) => {
		g.clear();
		g.beginFill(0x282c34);
		g.drawRect(0, 0, 160, dayHeight);
		g.endFill();
		g.lineStyle(1, 0x555555, 1);
		g.drawRect(0, 0, 160, dayHeight);
            }
	}),
        h("text", "day-name", {
            text: dayName,
            style: dayNameStyle,
            x: 10,
            y: 5,
        }),
        h("text", "day-number", {
            text: dayNumber.toString(),
            style: dayStyle,
            x: 10,
            y: 20,
        }),
        ...eventsWithYOffset.map(event =>
            h(CalendarEvent, `event-${event.id}`, { event, onEdit: onEditEvent, onDelete: onDeleteEvent })
        )
    ]);
}

/**
 * @param {object} props
 * @param {string} props.key
 * @param {number} props.x
 * @param {number} props.y
 * @param {number} props.width
 * @param {number} props.height
 * @param {number} props.background
 * @param {number} props.radius
 * @param {VNode[]} children
 * @returns {VNode}
 */
export function uiScrollBox(props, children) {
    const { key, x, y, width, height, background, radius } = props;

    return h("container", key, {
	...props,
	hook: {
	    /** @param {Container & { _internalState: { scrollBox: ScrollBox } }} elm */
	    mount: (elm) => {
		const scrollBox = new ScrollBox({
		    width,
		    height,
		    background,
		    radius,
		    elementsMargin: 0,
		    padding: 0,
		});
		elm.addChild(scrollBox);

		for (const childVnode of children) {
		    const childElm = createElm(childVnode);
		    scrollBox.addItem(childElm);
		}
		elm._internalState = { scrollBox };
	    },
	    /**
	     * @param {VNode} oldVnode
	     * @param {VNode} newVnode
	     */
	    update: (oldVnode, newVnode) => {
		const oldProps = /** @type {ScrollProps} */(oldVnode.props);
		const newProps = /** @type {ScrollProps} */(newVnode.props);
		const elm = /** @type {Container & { _internalState: { scrollBox: ScrollBox } }} */(newVnode.elm);
		const { scrollBox } = elm._internalState;

		if (oldProps.width !== newProps.width || oldProps.height !== newProps.height) {
		    scrollBox.width = newProps.width;
		    scrollBox.height = newProps.height;
		}

		scrollBox.removeChildren();
		for (const childVnode of newVnode.children) {
		    const childElm = createElm(childVnode);
		    scrollBox.addItem(childElm);
		}
	    },
	    /** @param {Container & { _internalState: { _internalState: { scrollBox: ScrollBox } } }} elm */
	    destroy: (elm) => {
		// TODO: à voir
	    }
	}
    }, children);
}
