import { eventListenersModule, init, h, classModule } from "snabbdom";

const patch = init([
    classModule,
    eventListenersModule
])

const STORAGE_KEY = "app";

/**
 * @typedef {import("snabbdom").VNode} VNode
 */

/**
 * @typedef {object} Event
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} startDate
 * @property {string} endDate
 */

/**
 * @typedef {object} FormState
 * @property {string} title
 * @property {string} description
 * @property {string} startDate
 * @property {string} endDate
 */

/**
 * @typedef {object} Model
 * @property {'list' | 'form'} route
 * @property {Event[]} events
 * @property {FormState} form
 */

/**
 * @typedef {'NAVIGATE_TO_FORM' | 'CREATE_EVENT' | 'CANCEL_CREATION' | 'UPDATE_FORM_FIELD' | 'DELETE_EVENT'} Type
 */

/**
 * @returns {Model}
 */
function initModel() {
    return {
	route: 'list',
	events: [],
	form: {
	    title: "",
	    description: "",
	    startDate: "",
	    endDate: "",
	}
    }
}

/**
 * @returns {Model}
 */
function loadModel() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
	try {
	    return JSON.parse(savedState)
	} catch (e) {
	    console.error("Impossible de lire l'état sauvegardé, on repart de zéro.", e);
	    return initModel();
	}
    }
    return initModel();
}

/**
 * @param {{type: Type, payload?: any}} msg 
 * @param {Model} model 
 * @returns {Model}
 */
function update(msg, model) {
    switch (msg.type) {
    case 'NAVIGATE_TO_FORM':
	return { ...model, route: 'form' };
    case 'UPDATE_FORM_FIELD':
	return {
	    ...model,
	    form: {
		...model.form,
		[msg.payload.field]: msg.payload.value
	    }
	};
    case 'CREATE_EVENT':
	if (!model.form.title) {
	    return model;
	}
	const newEvent = {
	    id: Date.now().toString(),
	    ...model.form
	};

	return {
	    ...model,
	    route: 'list',
	    events: [...model.events, newEvent],
	    form: initModel().form
	};
    case 'CANCEL_CREATION':
	return {
	    ...model,
	    route: 'list',
	    form: initModel().form
	};
    case 'DELETE_EVENT':
	return {
	    ...model,
	    route: 'list',
	    events: [...model.events.filter((value, _index, _arr) => value.id !== msg.payload)]
	}
    default:
	return model;
    }
}

/**
 * @param {Model} model
 * @param {(msg: {type: Type, payload?: any}) => void} dispatch
 * @returns {VNode}
 */
function view(model, dispatch) {
    switch (model.route) {
    case 'form':
	return viewForm(model, dispatch);
    case 'list':
    default:
	return viewList(model, dispatch);
    }
}

/**
 * @param {Model} model
 * @param {(msg: {type: Type, payload?: any}) => void} dispatch
 * @returns {VNode}
 */
function viewList(model, dispatch) {
    return h('div#conteneur', [
	h('h1', 'Mes evenements'),
	h('button#inscriptionBouton', { on: { click: () => dispatch({ type: 'NAVIGATE_TO_FORM' }) } }, 'Créer un evenements'),
	model.events.length === 0
	    ? h('p', 'Aucun événement pour le moment.')
	    : h('ul', model.events.map(event =>
		    //h('li', `${event.title} ${event.description} (du ${event.startDate} au  ${event.endDate})`)
		h('li', [
		    `${event.title} ${event.description} (du ${event.startDate} au  ${event.endDate})`,
		    h('button', { props: { type: 'button' }, on: {click: () => dispatch({type: 'DELETE_EVENT', payload: event.id}) }}, "Delete")
		])
	    ))
    ]);
}

/**
 * @param {Model} model
 * @param {(msg: {type: Type, payload?: any}) => void} dispatch
 * @returns {VNode}
 */
function viewForm(model, dispatch) {
    /**
     * @param {string} label 
     * @param {string} type 
     * @param {keyof FormState} field 
     * @param {boolean} required 
     * @returns {VNode}
     */
    function formInput(label, type, field, required) {
    	return h('div.form-group', [
    	    h('label', { props: { for: field } }, label),
    	    h('input', {
    		props: { id: field, type, required, value: model.form[field] },
    		on: { input: (e) => {
		    const target = /** @type {HTMLInputElement} */ (e.target);
		    dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field, value: target.value}})
		}}
    	    }),
    	]);
    }
    //const formInput = (label, type, field, required) => 

    return h('div#conteneur', [
	h('h1', 'Crée un nouvel événement'),
	h('form', { on: { submit: (e) => { e.preventDefault(); dispatch({type: 'CREATE_EVENT' }); }}}, [
	    formInput("Titre de l'evenement", "text", "title", true),
	    formInput("Description (optionnel)", "text", "description", false),
	    formInput("Date de debut", "date", "startDate", true),
	    formInput("Date de fin", "date", "endDate", true),
	    h('div.buttons', [
		h('button#inscriptionBouton', { props: { type: 'submit' } }, "Sauvegarder"),
		h('button#connexionBouton', { props: { type: 'button' }, on: { click: () => dispatch({type: 'CANCEL_CREATION' }) } }, "Annuler"),
	    ])
	])
    ]);
}


(async () => {
    const container = /** @type {HTMLElement} */ (document.getElementById("app"));

    let model = loadModel();
    let vnode = view(model, dispatch);

    patch(container, vnode);

    /**
     * @param {{type: Type, payload?: any}} msg 
     */
    function dispatch(msg) {
	console.log('Action: ', msg);

	model = update(msg, model);

	localStorage.setItem(STORAGE_KEY, JSON.stringify(model));

	const newVNode = view(model, dispatch);

	patch(vnode, newVNode);

	vnode = newVNode;
    }
})();
