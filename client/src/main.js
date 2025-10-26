import { eventListenersModule, init, h, classModule, attributesModule, propsModule } from "snabbdom";

const patch = init([
    classModule,
    attributesModule,
    propsModule,
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
 * @property {'list' | 'form' | 'edit'} route
 * @property {Event[]} events
 * @property {FormState} form
 * @property {string | null} editingEventId
 */

/**
 * @typedef {'NAVIGATE_TO_FORM' | 'CREATE_EVENT' | 'CANCEL_CREATION' | 'UPDATE_FORM_FIELD' | 'DELETE_EVENT' | 'OPEN_EDIT' | 'SAVE_EDIT' | 'CANCEL_EDIT'} Type
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
        },
        editingEventId: null,
    }
}

/**
 * @returns {Model}
 */
function loadModel() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            return { ...initModel(), ...parsed };
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
            };
        case 'OPEN_EDIT':
            const eventToEdit = model.events.find(e => e.id === msg.payload);
            if (!eventToEdit) return model;
            return {
                ...model,
                route: 'edit',
                editingEventId: msg.payload,
                form: { ...eventToEdit }
            };
        case 'SAVE_EDIT':
            if (!model.form.title || !model.editingEventId) {
                return model;
            }
            const updatedEvents = model.events.map(event => {
                if (event.id === model.editingEventId) {
                    return { ...event, ...model.form };
                }
                return event;
            });
            return {
                ...model,
                route: 'list',
                events: updatedEvents,
                form: initModel().form,
                editingEventId: null,
            };
        case 'CANCEL_EDIT':
            return {
                ...model,
                route: 'list',
                form: initModel().form,
                editingEventId: null,
            };
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
    const currentView = () => {
        switch (model.route) {
            case 'form':
                return viewForm(model, dispatch);
            case 'edit':
                return viewEdit(model, dispatch);
            case 'list':
            default:
                return viewList(model, dispatch);
        }
    };

    return h('div', [
        viewList(model, dispatch),
        currentView()
    ]);
}

/**
 * @param {Model} model
 * @param {(msg: {type: Type, payload?: any}) => void} dispatch
 * @returns {VNode}
 */
function viewList(model, dispatch) {
    return h('div#conteneur', [
        h('h1', 'Mes événements'),
        h('button#inscriptionBouton', {	on: { click: () => {
                    fetch('/logout', { method: 'GET', credentials: "include" })
                        .then(() => window.location.href = '/login') // redirection vers la page login
                        .catch((error) => console.error('La déconnexion a échoué:', error));
                }
            }
        }, 'Se déconnecter'),
        h('button#inscriptionBouton', { on: { click: () => dispatch({ type: 'NAVIGATE_TO_FORM' }) } }, 'Ajouter un événement'),
        model.events.length === 0
            ? h('p', 'Aucun événement pour le moment.')
            : h('ul', model.events.map(event =>
                h('li', [
                    `${event.title} ${event.description} (du ${event.startDate} au  ${event.endDate})`,
                    h('button', { props: { type: 'button' }, on: {click: () => dispatch({type: 'DELETE_EVENT', payload: event.id}) }}, "Delete"),
                    h('button', { props: { type: 'button' }, on: {click: () => dispatch({ type: 'OPEN_EDIT', payload: event.id }) } }, "Modifier"),
                ])
            ))
    ]);
}

/**
 * @param {string} label
 * @param {string} type
 * @param {keyof FormState} field
 * @param {boolean} required
 * @param {Model} model
 * @param {(msg: {type: Type, payload?: any}) => void} dispatch
 * @returns {VNode}
 */
function formInput(label, type, field, required, model, dispatch) {
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

/**
 * @param {Model} model
 * @param {(msg: {type: Type, payload?: any}) => void} dispatch
 * @returns {VNode}
 */
function viewForm(model, dispatch) {
    return h('section.parent.show', {
        on: { click: (e) => { if (e.target.classList.contains('parent')) dispatch({type: 'CANCEL_CREATION' }) } }
    }, [
        h('section.popup', [
            h('button.close', { on: { click: () => dispatch({type: 'CANCEL_CREATION' }) } }, 'X'),
            h('div.conteneur-modele', [
                h('h2', 'Crée un nouvel événement'),
                h('form', { on: { submit: (e) => { e.preventDefault(); dispatch({type: 'CREATE_EVENT' }); }}}, [
                    formInput("Titre de l'événement", "text", "title", true, model, dispatch),
                    formInput("Description (optionnel)", "text", "description", false, model, dispatch),
                    formInput("Date de debut", "datetime-local", "startDate", true, model, dispatch),
                    formInput("Date de fin", "datetime-local", "endDate", true, model, dispatch),
                    h('div.buttons', [
                        h('button#inscriptionBouton', { props: { type: 'submit' } }, "Sauvegarder"),
                        h('button#connexionBouton', { props: { type: 'button' }, on: { click: () => dispatch({type: 'CANCEL_CREATION' }) } }, "Annuler"),
                    ])
                ])
            ])
        ])
    ]);
}

/**
 * @param {Model} model
 * @param {(msg: {type: Type, payload?: any}) => void} dispatch
 * @returns {VNode}
 */
function viewEdit(model, dispatch) {
    return h('section#parent-conteneur.parent.show', {
        on: { click: (e) => { if (e.target.classList.contains('parent')) dispatch({type: 'CANCEL_EDIT' }) } }
    }, [
        h('section#popup.popup', [
            h('button#close.close', { on: { click: () => dispatch({type: 'CANCEL_EDIT' }) } }, 'X'),
            h('div.conteneur-modele#model', [
                h('h2', "Modifier l'événement"),
                h('form.form-group', { on: { submit: (e) => { e.preventDefault(); dispatch({type: 'SAVE_EDIT' }); }}}, [
                    formInput("Nom de l'événement :", "text", "title", true, model, dispatch),
                    formInput("Début :", "datetime-local", "startDate", true, model, dispatch),
                    formInput("Fin :", "datetime-local", "endDate", true, model, dispatch),
                    h('label', { props: { for: 'event-description' } }, "Description de l'événement :"),
                    h('textarea#event-description', {
                        props: { name: 'event-description', value: model.form.description },
                        on: { input: (e) => {
                                const target = /** @type {HTMLTextAreaElement} */ (e.target);
                                dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'description', value: target.value }});
                            }}
                    }, model.form.description),
                    h('button', { props: { type: 'submit' } }, 'Enregistrer les modifications')
                ])
            ])
        ])
    ]);
}


/* WEBGL */
/**
 * @param {WebGL2RenderingContext} gl
 * @param {GLenum} type
 * @param {string} source
 * @returns {WebGLShader | null}
 */
function createShader(gl, type, source) {
    const shader = /** @type {WebGLShader} */ (gl.createShader(type));
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {string} vertexSource
 * @param {string} fragmentSource
 * @returns {WebGLProgram | null}
 */
function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
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

    /* WEBGL */
    const backgroundCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvasBackground"));
    if (backgroundCanvas === null) {
        return;
    }

    Object.assign(backgroundCanvas.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        "z-index": "-1",
        pointerEvents: "none",
    });

    const vertices = new Float32Array([
        -1, -1, 0,  // bas gauche
        1, -1, 0,  // bas droite
        -1,  1, 0,  // haut gauche
        -1,  1, 0,  // haut gauche
        1, -1, 0,  // bas droite
        1,  1, 0,  // haut droite
    ]);

    const gl = /** @type {WebGL2RenderingContext} */ (backgroundCanvas.getContext("webgl2"));
    if (gl === null) {
        console.error("WebGL2 pas supporté");
        return;
    }

    function resizeCanvas() {
        backgroundCanvas.width = window.innerWidth;
        backgroundCanvas.height = window.innerHeight;
        gl.viewport(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();

    const vertexSource = `#version 300 es
precision mediump float;
layout (location = 0) in vec3 vertexPosition;

out vec2 vUv;

void main() {
    vUv = vertexPosition.xy * 0.5 + 0.5;
    gl_Position = vec4(vertexPosition, 1.0);
}
`;

    const fragmentSource = `#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 finalColor;

uniform vec3 iResolution;
uniform float iTime;

#define PIXEL_SIZE_FAC 700.0
#define SPIN_EASE 0.5
#define colour_2 vec4(55./255., 48./255., 56./255., 1.0)
#define colour_1 vec4(54./255., 0./255., 113./255., 1.0)
#define colour_3 vec4(0.0,0.0,0.0,1.0)
#define spin_amount 0.7
#define contrast 1.5

void main() {

    vec2 fragCoord = vUv * iResolution.xy;

    //Convert to UV coords (0 - 1) and floor for pixel effect
    float pixel_size = length(iResolution.xy)/PIXEL_SIZE_FAC;
    vec2 uv = (floor(fragCoord.xy*(1.0/pixel_size))*pixel_size - 0.5*iResolution.xy)/length(iResolution.xy) - vec2(0.0, 0.0);
    float uv_len = length(uv);

    //Adding in a center swirl, changes with iTime. Only applies meaningfully if the 'spin amount' is a non-zero number
    float speed = (iTime*SPIN_EASE*0.1) + 302.2;
    float new_pixel_angle = (atan(uv.y, uv.x)) + speed - SPIN_EASE*20.*(1.*spin_amount*uv_len + (1. - 1.*spin_amount));
    vec2 mid = (iResolution.xy/length(iResolution.xy))/2.;
    uv = (vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid);

	//Now add the paint effect to the swirled UV
    uv *= 30.;
    speed = iTime*(1.);
	vec2 uv2 = vec2(uv.x+uv.y);

    for(int i=0; i < 5; i++) {
		uv2 += uv + cos(length(uv));
		uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121),sin(uv2.x - 0.113*speed));
		uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
	}

    //Make the paint amount range from 0 - 2
    float contrast_mod = (0.25*contrast + 0.5*spin_amount + 1.2);
	float paint_res =min(2., max(0.,length(uv)*(0.035)*contrast_mod));
    float c1p = max(0.,1. - contrast_mod*abs(1.-paint_res));
    float c2p = max(0.,1. - contrast_mod*abs(paint_res));
    float c3p = 1. - min(1., c1p + c2p);

    vec4 ret_col = (0.3/contrast)*colour_1 + (1. - 0.3/contrast)*(colour_1*c1p + colour_2*c2p + vec4(c3p*colour_3.rgb, c3p*colour_1.a)) + 0.3*max(c1p*5. - 4., 0.) + 0.4*max(c2p*5. - 4., 0.);

    finalColor = ret_col;
}
`;

    const program = createProgram(gl, vertexSource, fragmentSource);
    if (!program) {
        console.error("echec de compilation des shaders");
        return;
    }

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.useProgram(program);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    const uniform = {
        iResolution: gl.getUniformLocation(program, "iResolution"),
        iTime: gl.getUniformLocation(program, "iTime")
    };

    function render(time) {
        time *= 0.001;
        gl.clearColor(0.2, 0.3, 0.3, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.uniform3f(uniform.iResolution, backgroundCanvas.width, backgroundCanvas.height, 1.0);
        gl.uniform1f(uniform.iTime, time);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(render);
    }

    render();
})();